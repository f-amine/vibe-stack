"use server";

import "server-only";
import { recordAuditLog } from "@vibestack/db";
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
	await recordAuditLog({
		action: "feature_flag.toggled",
		actorUserId: session.user.id,
		targetType: "feature_flag",
		targetId: String(input.id),
		metadata: { key: input.key, active: input.active },
	});
	revalidatePath("/[locale]/feature-flags", "page");
	return { ok: true };
}
