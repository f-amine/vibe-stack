// Affiliate-program server helpers — enroll, attribute signups, log
// clicks, request payouts. Marketing middleware drops a cookie when
// `?ref=<code>` shows up; sign-up reads it and calls `attributeSignup`.

import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "@starter-saas/db";
import {
	affiliate,
	affiliateClick,
	affiliatePayout,
	affiliateSignup,
} from "@starter-saas/db/schema/affiliate";
import { auditLog } from "@starter-saas/db/schema/audit";
import { env } from "@starter-saas/env/server";
import { and, count, desc, eq } from "drizzle-orm";

export const AFFILIATE_COOKIE_NAME = "aff_ref";
export const DEFAULT_PAYOUT_MIN_CENTS = 2500;

function newCode(): string {
	return randomBytes(6)
		.toString("base64url")
		.replace(/[^a-zA-Z0-9]/g, "");
}

export async function enroll(opts: { userId: string }): Promise<{
	id: string;
	code: string;
}> {
	const existing = await byUser(opts.userId);
	if (existing) {
		return { id: existing.id, code: existing.code };
	}
	const id = randomUUID();
	const code = newCode();
	await db.insert(affiliate).values({
		id,
		userId: opts.userId,
		code,
		commissionRate: env.AFFILIATE_DEFAULT_RATE,
	});
	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: opts.userId,
			action: "affiliate.enrolled",
			targetType: "affiliate",
			targetId: id,
			metadata: { code },
		})
		.onConflictDoNothing();
	return { id, code };
}

export async function byUser(userId: string) {
	const [row] = await db
		.select()
		.from(affiliate)
		.where(eq(affiliate.userId, userId))
		.limit(1);
	return row ?? null;
}

export async function byCode(code: string) {
	const [row] = await db
		.select()
		.from(affiliate)
		.where(eq(affiliate.code, code))
		.limit(1);
	return row ?? null;
}

export async function logClick(input: {
	code: string;
	ip?: string | null;
	referer?: string | null;
	utm?: {
		source?: string | null;
		medium?: string | null;
		campaign?: string | null;
	};
}): Promise<void> {
	const aff = await byCode(input.code);
	if (!aff) {
		return;
	}
	await db.insert(affiliateClick).values({
		id: randomUUID(),
		code: input.code,
		ip: input.ip ?? null,
		referer: input.referer ?? null,
		utmSource: input.utm?.source ?? null,
		utmMedium: input.utm?.medium ?? null,
		utmCampaign: input.utm?.campaign ?? null,
	});
}

export async function attributeSignup(opts: {
	code: string;
	referredUserId: string;
}): Promise<void> {
	const aff = await byCode(opts.code);
	if (!aff) {
		return;
	}
	if (aff.userId === opts.referredUserId) {
		return;
	}
	await db
		.insert(affiliateSignup)
		.values({
			id: randomUUID(),
			affiliateId: aff.id,
			referredUserId: opts.referredUserId,
		})
		.onConflictDoNothing();
	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: opts.referredUserId,
			action: "affiliate.signup",
			targetType: "affiliate",
			targetId: aff.id,
		})
		.onConflictDoNothing();
}

export async function stats(affiliateId: string): Promise<{
	clicks: number;
	signups: number;
	pendingPayoutCents: number;
}> {
	const affRows = await db
		.select()
		.from(affiliate)
		.where(eq(affiliate.id, affiliateId))
		.limit(1);
	const aff = affRows[0];
	if (!aff) {
		return { clicks: 0, signups: 0, pendingPayoutCents: 0 };
	}
	const code = aff.code;
	const [clicksRow] = await db
		.select({ c: count() })
		.from(affiliateClick)
		.where(eq(affiliateClick.code, code));
	const [signupsRow] = await db
		.select({ c: count() })
		.from(affiliateSignup)
		.where(eq(affiliateSignup.affiliateId, affiliateId));
	const pendingPayouts = await db
		.select()
		.from(affiliatePayout)
		.where(
			and(
				eq(affiliatePayout.affiliateId, affiliateId),
				eq(affiliatePayout.status, "pending"),
			),
		);
	const pendingPayoutCents = pendingPayouts.reduce(
		(acc, p) => acc + Number(p.amountCents),
		0,
	);
	return {
		clicks: Number(clicksRow?.c ?? 0),
		signups: Number(signupsRow?.c ?? 0),
		pendingPayoutCents,
	};
}

export async function requestPayout(opts: {
	affiliateId: string;
	amountCents: number;
}): Promise<{ id: string }> {
	if (opts.amountCents < DEFAULT_PAYOUT_MIN_CENTS) {
		throw new Error(
			`Minimum payout is $${(DEFAULT_PAYOUT_MIN_CENTS / 100).toFixed(2)}`,
		);
	}
	const id = randomUUID();
	await db.insert(affiliatePayout).values({
		id,
		affiliateId: opts.affiliateId,
		amountCents: opts.amountCents,
	});
	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: null,
			action: "affiliate.payout.requested",
			targetType: "affiliate_payout",
			targetId: id,
			metadata: { amountCents: opts.amountCents },
		})
		.onConflictDoNothing();
	return { id };
}

export async function listPayouts(filter: { status?: string } = {}) {
	const base = db.select().from(affiliatePayout);
	if (filter.status) {
		return base
			.where(eq(affiliatePayout.status, filter.status))
			.orderBy(desc(affiliatePayout.requestedAt))
			.limit(200);
	}
	return base.orderBy(desc(affiliatePayout.requestedAt)).limit(200);
}

export async function decidePayout(opts: {
	id: string;
	status: "approved" | "denied" | "paid";
	polarPayoutId?: string;
	note?: string;
	actorId?: string | null;
}): Promise<void> {
	await db
		.update(affiliatePayout)
		.set({
			status: opts.status,
			polarPayoutId: opts.polarPayoutId ?? null,
			note: opts.note ?? null,
			decidedAt: new Date(),
		})
		.where(eq(affiliatePayout.id, opts.id));
	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: opts.actorId ?? null,
			action: `affiliate.payout.${opts.status}`,
			targetType: "affiliate_payout",
			targetId: opts.id,
			metadata: { polarPayoutId: opts.polarPayoutId },
		})
		.onConflictDoNothing();
}

export async function topReferrers(limit = 100) {
	const rows = await db
		.select({
			affiliateId: affiliateSignup.affiliateId,
			signups: count(affiliateSignup.id),
		})
		.from(affiliateSignup)
		.groupBy(affiliateSignup.affiliateId)
		.orderBy(desc(count(affiliateSignup.id)))
		.limit(limit);
	if (rows.length === 0) {
		return [];
	}
	const affRows = await db
		.select()
		.from(affiliate)
		.where(
			and(
				...rows
					.slice(0, 1) // satisfy and() arity
					.map((r) => eq(affiliate.id, r.affiliateId)),
			),
		);
	// One-by-one lookup avoids `inArray` collisions with `text` arrays.
	const enriched: Array<{
		affiliateId: string;
		userId: string;
		code: string;
		signups: number;
	}> = [];
	for (const row of rows) {
		const [aff] = await db
			.select()
			.from(affiliate)
			.where(eq(affiliate.id, row.affiliateId))
			.limit(1);
		if (aff) {
			enriched.push({
				affiliateId: aff.id,
				userId: aff.userId,
				code: aff.code,
				signups: Number(row.signups),
			});
		}
	}
	void affRows;
	return enriched;
}
