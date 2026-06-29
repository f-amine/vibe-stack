// Fires the welcome email once, the first time a user's account flips to
// `emailVerified = true`. Idempotency comes from an audit_log row — we never
// store a separate "welcome_email_sent_at" column, and never re-send.

import { createDb, recordAuditLog } from "@vibestack/db";
import { auditLog } from "@vibestack/db/schema/audit";
import { and, eq } from "drizzle-orm";

import { sendWelcome } from "./send";

export const WELCOME_AUDIT_ACTION = "welcome_email_sent";

type UserLike = {
	id: string;
	email: string;
	name?: string | null;
	emailVerified?: boolean | null;
};

let cachedDb: ReturnType<typeof createDb> | null = null;
function db() {
	if (!cachedDb) {
		cachedDb = createDb();
	}
	return cachedDb;
}

export async function maybeSendWelcomeOnVerify(user: UserLike): Promise<void> {
	if (!user.emailVerified) {
		return;
	}
	if (!user.email || !user.id) {
		return;
	}

	const existing = await db()
		.select({ id: auditLog.id })
		.from(auditLog)
		.where(
			and(
				eq(auditLog.action, WELCOME_AUDIT_ACTION),
				eq(auditLog.actorUserId, user.id),
			),
		)
		.limit(1);

	if (existing.length > 0) {
		return;
	}

	try {
		await sendWelcome({ to: user.email, name: user.name ?? undefined });
	} catch (err) {
		// Resend / template errors must not break the verification flow — log the
		// attempt as failed but don't insert the audit row so a retry path stays
		// open.
		console.error("[auth] welcome email send failed:", err);
		return;
	}

	await recordAuditLog({
		action: WELCOME_AUDIT_ACTION,
		actorUserId: user.id,
		targetType: "user",
		targetId: user.id,
		metadata: { email: user.email },
	});
}
