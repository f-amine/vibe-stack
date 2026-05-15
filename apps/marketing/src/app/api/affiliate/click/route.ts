import { logClick } from "@vibestack/api/affiliate";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
	code?: string;
	utm?: { source?: string; medium?: string; campaign?: string };
};

export async function POST(request: Request) {
	let body: Body = {};
	try {
		body = (await request.json()) as Body;
	} catch {
		// no body — still log if code came via query
	}
	const url = new URL(request.url);
	const code =
		(typeof body.code === "string" && body.code) ||
		url.searchParams.get("code") ||
		"";
	if (!code) {
		return NextResponse.json({ ok: false }, { status: 400 });
	}
	await logClick({
		code,
		ip: request.headers.get("x-forwarded-for"),
		referer: request.headers.get("referer"),
		utm: body.utm,
	});
	return NextResponse.json({ ok: true });
}
