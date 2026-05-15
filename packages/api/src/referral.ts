// In-app referral program. Existing users invite friends by email;
// when the invite is accepted (new user signs up + verifies), both
// sides get a credit (default $29, configurable via env).

import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@starter-saas/db";
import { auditLog } from "@starter-saas/db/schema/audit";
import { user as userTable } from "@starter-saas/db/schema/auth";
import { referral } from "@starter-saas/db/schema/referral";
import { env } from "@starter-saas/env/server";
import { and, count, eq, gte } from "drizzle-orm";

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export async function pendingThisMonth(userId: string): Promise<number> {
	const since = new Date(Date.now() - ONE_MONTH_MS);
	const [row] = await db
		.select({ c: count() })
		.from(referral)
		.where(
			and(eq(referral.referrerUserId, userId), gte(referral.createdAt, since)),
		);
	return Number(row?.c ?? 0);
}

export async function inviteFriend(input: {
	referrerUserId: string;
	email: string;
}): Promise<{ id: string }> {
	const used = await pendingThisMonth(input.referrerUserId);
	if (used >= env.REFERRAL_MAX_PENDING_PER_USER) {
		throw new Error(
			`Out of invites — you can send ${env.REFERRAL_MAX_PENDING_PER_USER} per month`,
		);
	}
	const id = randomUUID();
	await db
		.insert(referral)
		.values({
			id,
			referrerUserId: input.referrerUserId,
			referredEmail: input.email.toLowerCase(),
			rewardCents: env.REFERRAL_CREDIT_CENTS,
		})
		.onConflictDoNothing();
	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: input.referrerUserId,
			action: "referral.invited",
			targetType: "referral",
			targetId: id,
			metadata: { email: input.email.toLowerCase() },
		})
		.onConflictDoNothing();
	return { id };
}

export async function listInvites(userId: string) {
	return db
		.select()
		.from(referral)
		.where(eq(referral.referrerUserId, userId))
		.orderBy(referral.createdAt);
}

export async function recordAcceptance(input: {
	email: string;
	newUserId: string;
}): Promise<{ matched: number }> {
	const rows = await db
		.select()
		.from(referral)
		.where(
			and(
				eq(referral.referredEmail, input.email.toLowerCase()),
				eq(referral.status, "pending"),
			),
		);
	const acceptedAt = new Date();
	const results = await Promise.allSettled(
		rows.map((row) =>
			Promise.all([
				db
					.update(referral)
					.set({
						status: "accepted",
						referredUserId: input.newUserId,
						acceptedAt,
					})
					.where(eq(referral.id, row.id)),
				db
					.insert(auditLog)
					.values({
						id: randomUUID(),
						actorUserId: input.newUserId,
						action: "referral.accepted",
						targetType: "referral",
						targetId: row.id,
						metadata: {
							referrerUserId: row.referrerUserId,
							rewardCents: row.rewardCents,
						},
					})
					.onConflictDoNothing(),
			]),
		),
	);
	return { matched: results.filter((r) => r.status === "fulfilled").length };
}

export async function pendingReward(userId: string): Promise<number> {
	const rows = await db
		.select()
		.from(referral)
		.where(
			and(eq(referral.referrerUserId, userId), eq(referral.status, "accepted")),
		);
	return rows.reduce(
		(acc, r) => (r.rewardGranted > 0 ? acc : acc + Number(r.rewardCents ?? 0)),
		0,
	);
}

export async function findReferrerByEmail(email: string) {
	const rows = await db
		.select({ userId: userTable.id, email: userTable.email })
		.from(userTable)
		.where(eq(userTable.email, email))
		.limit(1);
	return rows[0] ?? null;
}
