"use server";

import "server-only";
import { randomUUID } from "node:crypto";
import { auth } from "@vibestack/auth";
import { db } from "@vibestack/db";
import { auditLog } from "@vibestack/db/schema/audit";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { ONBOARDING_DONE_ACTION } from "@/lib/onboarding";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		throw new Error("Not authenticated");
	}
	return session.user;
}

export async function completeOnboardingAction(input: {
	skipped?: boolean;
}): Promise<ActionResult> {
	try {
		const user = await requireUser();
		const already = await db
			.select({ id: auditLog.id })
			.from(auditLog)
			.where(
				and(
					eq(auditLog.action, ONBOARDING_DONE_ACTION),
					eq(auditLog.actorUserId, user.id),
				),
			)
			.limit(1);
		if (already.length > 0) {
			return { ok: true };
		}
		await db
			.insert(auditLog)
			.values({
				id: randomUUID(),
				actorUserId: user.id,
				action: ONBOARDING_DONE_ACTION,
				targetType: "user",
				targetId: user.id,
				metadata: { skipped: input.skipped ?? false },
			})
			.onConflictDoNothing();
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "complete failed",
		};
	}
}
