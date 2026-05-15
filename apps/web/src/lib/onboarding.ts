import "server-only";
import { db } from "@vibestack/db";
import { auditLog } from "@vibestack/db/schema/audit";
import { and, eq } from "drizzle-orm";
import { cache } from "react";

export const ONBOARDING_DONE_ACTION = "onboarding.completed";

// Wrapped in React.cache so the dashboard layout + onboarding page (or
// any other RSC that asks per-request) share a single DB round-trip.
export const hasCompletedOnboarding = cache(
	async (userId: string): Promise<boolean> => {
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
	},
);
