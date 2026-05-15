import "server-only";
import { db } from "@starter-saas/db";
import { auditLog } from "@starter-saas/db/schema/audit";
import { and, eq } from "drizzle-orm";

export const ONBOARDING_DONE_ACTION = "onboarding.completed";

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
	if (!userId) {
		return true;
	}
	const rows = await db
		.select({ id: auditLog.id })
		.from(auditLog)
		.where(
			and(
				eq(auditLog.action, ONBOARDING_DONE_ACTION),
				eq(auditLog.actorUserId, userId),
			),
		)
		.limit(1);
	return rows.length > 0;
}
