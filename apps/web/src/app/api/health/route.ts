import { db } from "@starter-saas/db";
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

function envCheck(name: string, keys: string[]): Check {
	const missing = keys.filter((k) => {
		const v = process.env[k];
		return !v || v.length === 0;
	});
	if (missing.length === 0) {
		return { name, status: "up" };
	}
	if (missing.length < keys.length) {
		return {
			name,
			status: "degraded",
			detail: `missing: ${missing.join(", ")}`,
		};
	}
	return {
		name,
		status: "down",
		detail: `missing: ${missing.join(", ")}`,
	};
}

export async function GET() {
	const checks: Check[] = await Promise.all([
		Promise.resolve(
			envCheck("auth", ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]),
		),
		checkDb(),
		Promise.resolve(envCheck("email", ["RESEND_API_KEY", "EMAIL_FROM"])),
		Promise.resolve(
			envCheck("storage", [
				"R2_ACCOUNT_ID",
				"R2_ACCESS_KEY_ID",
				"R2_SECRET_ACCESS_KEY",
				"R2_BUCKET",
				"R2_ENDPOINT",
			]),
		),
		Promise.resolve(envCheck("billing", ["POLAR_ACCESS_TOKEN"])),
	]);

	const status: CheckStatus = checks.some((c) => c.status === "down")
		? "down"
		: checks.some((c) => c.status === "degraded")
			? "degraded"
			: "up";

	return NextResponse.json(
		{
			app: "web",
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
