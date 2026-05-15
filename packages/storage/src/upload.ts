// File-upload helpers — MIME validation, filename sanitation, listing,
// and a single source of truth for size/expiry defaults.

import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";

import {
	deleteObject,
	headObject,
	presignDownload,
	presignUpload,
	R2_BUCKET,
	R2_PUBLIC_URL,
	r2,
} from "./index";

export const DEFAULT_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
export const DEFAULT_UPLOAD_EXPIRES_SECONDS = 60 * 10; // 10 min
export const DEFAULT_DOWNLOAD_EXPIRES_SECONDS = 60 * 60; // 1 hour

export const DEFAULT_ALLOWED_MIME = new Set<string>([
	// Images
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
	"image/svg+xml",
	"image/avif",
	// Docs
	"application/pdf",
	"text/plain",
	"text/csv",
	"text/markdown",
	"application/json",
	// Archives
	"application/zip",
	// Office (basic)
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const EXT_BY_MIME: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/svg+xml": "svg",
	"image/avif": "avif",
	"application/pdf": "pdf",
	"text/plain": "txt",
	"text/csv": "csv",
	"text/markdown": "md",
	"application/json": "json",
	"application/zip": "zip",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		"docx",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

export class UploadValidationError extends Error {
	constructor(
		message: string,
		public readonly code:
			| "mime_not_allowed"
			| "size_exceeded"
			| "missing_owner",
	) {
		super(message);
		this.name = "UploadValidationError";
	}
}

export function sanitizeFilename(filename: string): string {
	const cleaned = filename
		.normalize("NFKD")
		.replace(/[^\w.-]+/g, "-") // anything not word/dot/dash → dash
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
	return cleaned.length > 0 ? cleaned.slice(0, 80) : "file";
}

function extForMime(mime: string, fallback?: string): string {
	const known = EXT_BY_MIME[mime];
	if (known) {
		return known;
	}
	if (fallback) {
		const lower = fallback.toLowerCase();
		return lower.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
	}
	return "bin";
}

export function userPrefix(ownerId: string): string {
	return `user/${ownerId}`;
}

export function isInsideOwnerPrefix(key: string, ownerId: string): boolean {
	return key.startsWith(`${userPrefix(ownerId)}/`);
}

export type PresignUserUploadInput = {
	ownerId: string;
	contentType: string;
	size?: number;
	filename?: string;
	allowedMime?: ReadonlySet<string>;
	maxBytes?: number;
	expiresInSeconds?: number;
};

export type PresignUserUploadResult = {
	key: string;
	uploadUrl: string;
	publicUrl: string | null;
	expiresInSeconds: number;
	contentType: string;
	maxBytes: number;
};

export async function presignUserUpload(
	input: PresignUserUploadInput,
): Promise<PresignUserUploadResult> {
	if (!input.ownerId) {
		throw new UploadValidationError(
			"ownerId is required to scope uploads to a user",
			"missing_owner",
		);
	}

	const allowed = input.allowedMime ?? DEFAULT_ALLOWED_MIME;
	if (!allowed.has(input.contentType)) {
		throw new UploadValidationError(
			`MIME ${input.contentType} is not allowed`,
			"mime_not_allowed",
		);
	}

	const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES;
	if (typeof input.size === "number" && input.size > maxBytes) {
		throw new UploadValidationError(
			`File of ${input.size} bytes exceeds the ${maxBytes}-byte limit`,
			"size_exceeded",
		);
	}

	const today = new Date().toISOString().slice(0, 10);
	const baseName = input.filename
		? sanitizeFilename(input.filename.replace(/\.[^.]+$/, ""))
		: "file";
	const ext = extForMime(
		input.contentType,
		input.filename?.split(".").pop() ?? undefined,
	);
	const key = `${userPrefix(input.ownerId)}/${today}/${nanoid(12)}-${baseName}.${ext}`;
	const expiresInSeconds =
		input.expiresInSeconds ?? DEFAULT_UPLOAD_EXPIRES_SECONDS;

	const { uploadUrl, publicUrl } = await presignUpload({
		key,
		contentType: input.contentType,
		expiresInSeconds,
	});

	return {
		key,
		uploadUrl,
		publicUrl,
		expiresInSeconds,
		contentType: input.contentType,
		maxBytes,
	};
}

export type UserObject = {
	key: string;
	size: number;
	lastModified: Date | null;
	publicUrl: string | null;
};

export async function listUserObjects(
	ownerId: string,
	opts: { limit?: number } = {},
): Promise<UserObject[]> {
	const prefix = `${userPrefix(ownerId)}/`;
	const result = await r2.send(
		new ListObjectsV2Command({
			Bucket: R2_BUCKET,
			Prefix: prefix,
			MaxKeys: opts.limit ?? 200,
		}),
	);
	const contents = result.Contents ?? [];
	return contents
		.map((o) => ({
			key: o.Key ?? "",
			size: Number(o.Size ?? 0),
			lastModified: o.LastModified ?? null,
			publicUrl: R2_PUBLIC_URL && o.Key ? `${R2_PUBLIC_URL}/${o.Key}` : null,
		}))
		.filter((o) => o.key.length > 0)
		.sort((a, b) => {
			const at = a.lastModified?.getTime() ?? 0;
			const bt = b.lastModified?.getTime() ?? 0;
			return bt - at;
		});
}

export async function deleteUserObject(
	ownerId: string,
	key: string,
): Promise<void> {
	if (!isInsideOwnerPrefix(key, ownerId)) {
		throw new UploadValidationError(
			"Refusing to delete an object outside the owner's prefix",
			"missing_owner",
		);
	}
	await deleteObject(key);
}

export async function presignUserDownload(
	ownerId: string,
	key: string,
	expiresInSeconds: number = DEFAULT_DOWNLOAD_EXPIRES_SECONDS,
): Promise<string> {
	if (!isInsideOwnerPrefix(key, ownerId)) {
		throw new UploadValidationError(
			"Refusing to sign a download URL outside the owner's prefix",
			"missing_owner",
		);
	}
	return presignDownload(key, expiresInSeconds);
}

export async function userObjectExists(
	ownerId: string,
	key: string,
): Promise<boolean> {
	if (!isInsideOwnerPrefix(key, ownerId)) {
		return false;
	}
	const head = await headObject(key);
	return head !== null;
}

export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return "0 B";
	}
	const units = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.min(
		units.length - 1,
		Math.floor(Math.log(bytes) / Math.log(1024)),
	);
	const value = bytes / 1024 ** i;
	return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}
