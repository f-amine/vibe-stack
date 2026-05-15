import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
	return NextResponse.json(
		{
			app: "marketing",
			status: "up",
			checks: [{ name: "self", status: "up" }],
			at: new Date().toISOString(),
		},
		{ headers: { "cache-control": "no-store" } },
	);
}
