import {
	inviteFriend,
	listInvites,
	pendingReward,
} from "@starter-saas/api/referral";
import { auth } from "@starter-saas/auth";
import { env } from "@starter-saas/env/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inviteSchema = z.object({
	email: z.email(),
});

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const [rows, reward] = await Promise.all([
		listInvites(session.user.id),
		pendingReward(session.user.id),
	]);
	return NextResponse.json({
		rows,
		pendingRewardCents: reward,
		maxPerMonth: env.REFERRAL_MAX_PENDING_PER_USER,
		rewardCents: env.REFERRAL_CREDIT_CENTS,
	});
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}
	const parsed = inviteSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "invalid_input", details: parsed.error.format() },
			{ status: 400 },
		);
	}
	try {
		const result = await inviteFriend({
			referrerUserId: session.user.id,
			email: parsed.data.email,
		});
		return NextResponse.json(result);
	} catch (err) {
		return NextResponse.json(
			{
				error: "invite_failed",
				message: err instanceof Error ? err.message : "?",
			},
			{ status: 400 },
		);
	}
}
