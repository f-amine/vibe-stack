import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@vibestack/env/server";
import { nanoid } from "nanoid";

/** Whether R2 credentials are configured for this deployment. */
export function storageConfigured(): boolean {
	return Boolean(
		env.R2_ENDPOINT &&
			env.R2_ACCESS_KEY_ID &&
			env.R2_SECRET_ACCESS_KEY &&
			env.R2_BUCKET,
	);
}

// Lazy singleton — instantiating S3Client at module load crashes the app
// at boot when R2 vars are absent (gdpr.ts imports this transitively).
// Defer to first actual use so the app boots key-free.
let _r2: S3Client | null = null;
function getR2(): S3Client {
	if (!_r2) {
		if (!storageConfigured()) {
			throw new Error(
				"File storage is not configured. Set the R2_* vars in .env to enable Cloudflare R2 (https://developers.cloudflare.com/r2/).",
			);
		}
		_r2 = new S3Client({
			region: "auto",
			endpoint: env.R2_ENDPOINT,
			credentials: {
				accessKeyId: env.R2_ACCESS_KEY_ID as string,
				secretAccessKey: env.R2_SECRET_ACCESS_KEY as string,
			},
		});
	}
	return _r2;
}

export const r2 = new Proxy({} as S3Client, {
	get(_target, prop) {
		const client = getR2();
		const value = (client as unknown as Record<string | symbol, unknown>)[prop];
		return typeof value === "function"
			? (value as (...args: unknown[]) => unknown).bind(client)
			: value;
	},
});

// Empty-string fallback keeps the type `string` for the many call sites
// that pass it as `Bucket:`; the r2 proxy throws a clear error before any
// request with an empty bucket can go out.
export const R2_BUCKET = env.R2_BUCKET ?? "";
export const R2_PUBLIC_URL = env.R2_PUBLIC_URL;

export type PresignUploadInput = {
	key?: string;
	contentType: string;
	maxBytes?: number;
	expiresInSeconds?: number;
	prefix?: string;
};

export async function presignUpload({
	key,
	contentType,
	expiresInSeconds = 60 * 10,
	prefix = "uploads",
}: PresignUploadInput) {
	const objectKey =
		key ?? `${prefix}/${new Date().toISOString().slice(0, 10)}/${nanoid(21)}`;
	const url = await getSignedUrl(
		r2,
		new PutObjectCommand({
			Bucket: R2_BUCKET,
			Key: objectKey,
			ContentType: contentType,
		}),
		{ expiresIn: expiresInSeconds },
	);
	return {
		key: objectKey,
		uploadUrl: url,
		publicUrl: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${objectKey}` : null,
	};
}

export async function presignDownload(key: string, expiresInSeconds = 60 * 60) {
	return getSignedUrl(
		r2,
		new GetObjectCommand({
			Bucket: R2_BUCKET,
			Key: key,
		}),
		{ expiresIn: expiresInSeconds },
	);
}

export async function deleteObject(key: string) {
	await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

export async function headObject(key: string) {
	try {
		return await r2.send(
			new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
		);
	} catch {
		return null;
	}
}
