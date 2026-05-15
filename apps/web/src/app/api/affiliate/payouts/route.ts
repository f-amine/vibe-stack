import { byUser, requestPayout } from "@starter-saas/api/affiliate";
import { auth } from "@starter-saas/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ amountCents: z.number().int().min(2500) });

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const aff = await byUser(session.user.id);
	if (!aff) {
		return NextResponse.json({ error: "not_enrolled" }, { status: 400 });
	}
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}
	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "invalid_input", details: parsed.error.format() },
			{ status: 400 },
		);
	}
	try {
		const result = await requestPayout({
			affiliateId: aff.id,
			amountCents: parsed.data.amountCents,
		});
		return NextResponse.json(result);
	} catch (err) {
		return NextResponse.json(
			{
				error: "payout_failed",
				message: err instanceof Error ? err.message : "?",
			},
			{ status: 400 },
		);
	}
}
