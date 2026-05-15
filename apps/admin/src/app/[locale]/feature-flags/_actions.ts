"use server";

import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@vibestack/db";
import { auditLog } from "@vibestack/db/schema/audit";
import { toggleFlag } from "@vibestack/feature-flags/admin";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/require-admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function toggleFlagAction(input: {
	id: number;
	active: boolean;
	key: string;
}): Promise<ActionResult> {
	const session = await requireAdmin();
	const result = await toggleFlag(input.id, input.active);
	if (!result.ok) {
		return { ok: false, error: result.error };
	}
	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: session.user.id,
			action: "feature_flag.toggled",
			targetType: "feature_flag",
			targetId: String(input.id),
			metadata: { key: input.key, active: input.active },
		})
		.onConflictDoNothing();
	revalidatePath("/[locale]/feature-flags", "page");
	return { ok: true };
}
