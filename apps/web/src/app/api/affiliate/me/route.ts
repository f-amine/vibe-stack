import { byUser, enroll, stats } from "@starter-saas/api/affiliate";
import { auth } from "@starter-saas/auth";
import { env } from "@starter-saas/env/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shareUrlFor(code: string): string {
	const base =
		process.env.NEXT_PUBLIC_MARKETING_URL ??
		process.env.NEXT_PUBLIC_APP_URL ??
		env.APP_URL ??
		"http://localhost:3000";
	const url = new URL(base.replace(/\/$/, ""));
	url.searchParams.set("ref", code);
	return url.toString();
}

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const aff = await byUser(session.user.id);
	if (!aff) {
		return NextResponse.json({ enrolled: false });
	}
	const s = await stats(aff.id);
	return NextResponse.json({
		enrolled: true,
		code: aff.code,
		commissionRate: aff.commissionRate,
		stats: s,
		shareUrl: shareUrlFor(aff.code),
	});
}

export async function POST() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const result = await enroll({ userId: session.user.id });
	return NextResponse.json(result);
}
