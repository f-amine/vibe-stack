import { auth } from "@vibestack/auth";
import {
	deleteUserObject,
	presignUserDownload,
	UploadValidationError,
	userObjectExists,
} from "@vibestack/storage/upload";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function requireUser() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return null;
	}
	return session.user;
}

function keyFromParams(parts: string[]): string {
	return parts.map((p) => decodeURIComponent(p)).join("/");
}

type Params = { params: Promise<{ key: string[] }> };

export async function GET(request: Request, { params }: Params) {
	const user = await requireUser();
	if (!user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const { key: parts } = await params;
	const key = keyFromParams(parts);

	if (!(await userObjectExists(user.id, key))) {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}

	const url = new URL(request.url);
	const action = url.searchParams.get("action") ?? "download";
	if (action !== "download") {
		return NextResponse.json({ error: "bad_action" }, { status: 400 });
	}

	try {
		const signed = await presignUserDownload(user.id, key);
		return NextResponse.json({ url: signed });
	} catch (err) {
		if (err instanceof UploadValidationError) {
			return NextResponse.json(
				{ error: err.code, message: err.message },
				{ status: 403 },
			);
		}
		console.error("[/api/files/download] failed:", err);
		return NextResponse.json({ error: "download_failed" }, { status: 500 });
	}
}

export async function DELETE(_request: Request, { params }: Params) {
	const user = await requireUser();
	if (!user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const { key: parts } = await params;
	const key = keyFromParams(parts);

	try {
		await deleteUserObject(user.id, key);
		return NextResponse.json({ ok: true });
	} catch (err) {
		if (err instanceof UploadValidationError) {
			return NextResponse.json(
				{ error: err.code, message: err.message },
				{ status: 403 },
			);
		}
		console.error("[/api/files/delete] failed:", err);
		return NextResponse.json({ error: "delete_failed" }, { status: 500 });
	}
}
