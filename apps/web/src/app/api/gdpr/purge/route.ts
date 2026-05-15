// Cron-friendly endpoint to purge users past their grace window.

import { purgeExpiredDeletions } from "@starter-saas/api/gdpr";
import { env } from "@starter-saas/env/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	if (!env.CRON_SECRET) {
		return NextResponse.json({ error: "cron_secret_unset" }, { status: 503 });
	}
	const header = request.headers.get("authorization") ?? "";
	const provided = header.toLowerCase().startsWith("bearer ")
		? header.slice(7).trim()
		: header.trim();
	if (provided !== env.CRON_SECRET) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const result = await purgeExpiredDeletions();
	return NextResponse.json(result);
}
