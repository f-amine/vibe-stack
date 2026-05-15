import { auth } from "@starter-saas/auth";
import {
	DEFAULT_MAX_BYTES,
	listUserObjects,
	presignUserUpload,
	UploadValidationError,
} from "@starter-saas/storage/upload";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const presignSchema = z.object({
	filename: z.string().min(1).max(200).optional(),
	contentType: z.string().min(1).max(120),
	size: z.number().int().nonnegative().max(DEFAULT_MAX_BYTES).optional(),
});

async function requireUser() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return null;
	}
	return session.user;
}

export async function GET() {
	const user = await requireUser();
	if (!user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const objects = await listUserObjects(user.id);
	return NextResponse.json({
		objects: objects.map((o) => ({
			key: o.key,
			size: o.size,
			lastModified: o.lastModified?.toISOString() ?? null,
			publicUrl: o.publicUrl,
		})),
	});
}

export async function POST(request: Request) {
	const user = await requireUser();
	if (!user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}

	const parsed = presignSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "invalid_input", details: parsed.error.format() },
			{ status: 400 },
		);
	}

	try {
		const result = await presignUserUpload({
			ownerId: user.id,
			contentType: parsed.data.contentType,
			size: parsed.data.size,
			filename: parsed.data.filename,
		});
		return NextResponse.json(result);
	} catch (err) {
		if (err instanceof UploadValidationError) {
			return NextResponse.json(
				{ error: err.code, message: err.message },
				{ status: 400 },
			);
		}
		console.error("[/api/files] presign failed:", err);
		return NextResponse.json({ error: "presign_failed" }, { status: 500 });
	}
}
