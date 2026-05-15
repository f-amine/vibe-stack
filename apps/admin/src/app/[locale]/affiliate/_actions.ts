"use server";

import "server-only";
import { decidePayout } from "@vibestack/api/affiliate";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/require-admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function decidePayoutAction(input: {
	id: string;
	status: "approved" | "denied";
}): Promise<ActionResult> {
	try {
		const session = await requireAdmin();
		await decidePayout({
			id: input.id,
			status: input.status,
			actorId: session.user.id,
		});
		revalidatePath("/[locale]/affiliate", "page");
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "decide failed",
		};
	}
}
