// GDPR — data export + account deletion. Export writes a JSON blob to
// R2; the user gets a 24h presigned link via email. Deletion is a
// 7-day grace period: schedule now, purge later via cron.

import "server-only";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@starter-saas/db";
import { auditLog } from "@starter-saas/db/schema/audit";
import { member, user as userTable } from "@starter-saas/db/schema/auth";
import { polarCustomer, subscription } from "@starter-saas/db/schema/billing";
import { accountDeletion } from "@starter-saas/db/schema/gdpr";
import { presignDownload, R2_BUCKET, r2 } from "@starter-saas/storage";
import { eq, lt } from "drizzle-orm";

export const EXPORT_LINK_TTL_SECONDS = 60 * 60 * 24;
export const DELETION_GRACE_DAYS = 7;

export async function exportUserData(userId: string): Promise<{
	key: string;
	url: string;
	expiresInSeconds: number;
}> {
	const [u] = await db
		.select()
		.from(userTable)
		.where(eq(userTable.id, userId))
		.limit(1);
	if (!u) {
		throw new Error("User not found");
	}
	const memberships = await db
		.select()
		.from(member)
		.where(eq(member.userId, userId));
	const subs = await db
		.select()
		.from(subscription)
		.where(eq(subscription.polarCustomerId, userId));
	const customer = await db
		.select()
		.from(polarCustomer)
		.where(eq(polarCustomer.userId, userId));
	const audits = await db
		.select()
		.from(auditLog)
		.where(eq(auditLog.actorUserId, userId))
		.limit(2000);

	const payload = {
		generatedAt: new Date().toISOString(),
		schemaVersion: 1,
		user: u,
		memberships,
		polarCustomers: customer,
		subscriptions: subs,
		auditLog: audits,
	};

	const key = `gdpr/exports/${userId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.json`;
	const body = Buffer.from(JSON.stringify(payload, null, 2), "utf8");

	await r2.send(
		new PutObjectCommand({
			Bucket: R2_BUCKET,
			Key: key,
			Body: body,
			ContentType: "application/json",
		}),
	);

	const url = await presignDownload(key, EXPORT_LINK_TTL_SECONDS);

	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: userId,
			action: "gdpr.export.generated",
			targetType: "user",
			targetId: userId,
			metadata: { key, bytes: body.byteLength },
		})
		.onConflictDoNothing();

	return { key, url, expiresInSeconds: EXPORT_LINK_TTL_SECONDS };
}

export async function scheduleAccountDeletion(input: {
	userId: string;
	reason?: string;
}): Promise<{ scheduledAt: Date }> {
	const scheduledAt = new Date(
		Date.now() + DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000,
	);
	await db
		.insert(accountDeletion)
		.values({
			id: randomUUID(),
			userId: input.userId,
			scheduledAt,
			reason: input.reason ?? null,
		})
		.onConflictDoUpdate({
			target: accountDeletion.userId,
			set: { scheduledAt, canceledAt: null, reason: input.reason ?? null },
		});
	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: input.userId,
			action: "gdpr.deletion.scheduled",
			targetType: "user",
			targetId: input.userId,
			metadata: { scheduledAt: scheduledAt.toISOString() },
		})
		.onConflictDoNothing();
	return { scheduledAt };
}

export async function cancelAccountDeletion(userId: string): Promise<void> {
	await db
		.update(accountDeletion)
		.set({ canceledAt: new Date() })
		.where(eq(accountDeletion.userId, userId));
	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: userId,
			action: "gdpr.deletion.canceled",
			targetType: "user",
			targetId: userId,
		})
		.onConflictDoNothing();
}

export async function pendingDeletion(userId: string) {
	const [row] = await db
		.select()
		.from(accountDeletion)
		.where(eq(accountDeletion.userId, userId))
		.limit(1);
	if (!row || row.canceledAt || row.purgedAt) {
		return null;
	}
	return row;
}

export async function purgeExpiredDeletions(): Promise<{ purged: number }> {
	const now = new Date();
	const rows = await db
		.select()
		.from(accountDeletion)
		.where(lt(accountDeletion.scheduledAt, now));
	const due = rows.filter((row) => !row.canceledAt && !row.purgedAt);
	const purgedAt = new Date();
	const results = await Promise.allSettled(
		due.map(async (row) => {
			// Mark + audit before delete so the audit row references the user
			// id while the user still exists; the FK cascade on accountDeletion
			// also wipes our marked row after the user delete commits, which is
			// fine — pendingDeletion checks for the row's absence too.
			await Promise.all([
				db
					.update(accountDeletion)
					.set({ purgedAt })
					.where(eq(accountDeletion.id, row.id)),
				db
					.insert(auditLog)
					.values({
						id: randomUUID(),
						actorUserId: null,
						action: "gdpr.deletion.purged",
						targetType: "user",
						targetId: row.userId,
						metadata: { scheduledAt: row.scheduledAt.toISOString() },
					})
					.onConflictDoNothing(),
			]);
			await db.delete(userTable).where(eq(userTable.id, row.userId));
		}),
	);
	return { purged: results.filter((r) => r.status === "fulfilled").length };
}
