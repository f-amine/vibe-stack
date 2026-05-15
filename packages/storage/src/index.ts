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

export const r2 = new S3Client({
	region: "auto",
	endpoint: env.R2_ENDPOINT,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});

export const R2_BUCKET = env.R2_BUCKET;
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
