// Cron-friendly endpoint to drain the webhook outbox. Authentication
// via `Authorization: Bearer ${CRON_SECRET}` so a scheduler (Dokploy
// cron, GitHub Actions, or Vercel cron) can hit it on a schedule.

import { processPendingDeliveries } from "@vibestack/api/webhooks";
import { env } from "@vibestack/env/server";
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
	const result = await processPendingDeliveries(100);
	return NextResponse.json(result);
}
