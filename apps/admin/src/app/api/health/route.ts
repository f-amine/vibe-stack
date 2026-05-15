import { db } from "@vibestack/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckStatus = "up" | "degraded" | "down";

type Check = {
	name: string;
	status: CheckStatus;
	latencyMs?: number;
	detail?: string;
};

async function checkDb(): Promise<Check> {
	const started = Date.now();
	try {
		await db.execute(sql`select 1`);
		return {
			name: "db",
			status: "up",
			latencyMs: Date.now() - started,
		};
	} catch (err) {
		return {
			name: "db",
			status: "down",
			latencyMs: Date.now() - started,
			detail: err instanceof Error ? err.message : "unknown",
		};
	}
}

export async function GET() {
	const checks: Check[] = await Promise.all([checkDb()]);
	const status: CheckStatus = checks.some((c) => c.status === "down")
		? "down"
		: checks.some((c) => c.status === "degraded")
			? "degraded"
			: "up";

	return NextResponse.json(
		{
			app: "admin",
			status,
			checks,
			at: new Date().toISOString(),
		},
		{
			status: status === "down" ? 503 : 200,
			headers: { "cache-control": "no-store" },
		},
	);
}
