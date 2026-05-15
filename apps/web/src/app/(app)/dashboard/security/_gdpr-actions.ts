"use server";

import "server-only";
import {
	cancelAccountDeletion,
	exportUserData,
	pendingDeletion,
	scheduleAccountDeletion,
} from "@starter-saas/api/gdpr";
import { auth } from "@starter-saas/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export type ActionResult<T = undefined> =
	| { ok: true; data?: T }
	| { ok: false; error: string };

async function requireUser() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		throw new Error("Not authenticated");
	}
	return session.user;
}

export async function exportMyDataAction(): Promise<
	ActionResult<{ url: string; expiresInSeconds: number }>
> {
	try {
		const user = await requireUser();
		const result = await exportUserData(user.id);
		// Email delivery of the signed URL is deferred — the URL is returned
		// to the dashboard so the user can copy/open it immediately, and the
		// audit log carries the R2 key for support.
		return {
			ok: true,
			data: { url: result.url, expiresInSeconds: result.expiresInSeconds },
		};
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "export failed",
		};
	}
}

export async function scheduleDeletionAction(input: {
	confirmation: string;
	reason?: string;
}): Promise<ActionResult<{ scheduledAt: string }>> {
	try {
		if (input.confirmation !== "DELETE my account") {
			return {
				ok: false,
				error: "Confirmation must be exactly 'DELETE my account'.",
			};
		}
		const user = await requireUser();
		const result = await scheduleAccountDeletion({
			userId: user.id,
			reason: input.reason,
		});
		revalidatePath("/dashboard/security");
		return {
			ok: true,
			data: { scheduledAt: result.scheduledAt.toISOString() },
		};
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "delete failed",
		};
	}
}

export async function cancelDeletionAction(): Promise<ActionResult> {
	try {
		const user = await requireUser();
		await cancelAccountDeletion(user.id);
		revalidatePath("/dashboard/security");
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "cancel failed",
		};
	}
}

export async function pendingDeletionState(): Promise<{
	scheduledAt: string | null;
}> {
	const user = await requireUser();
	const row = await pendingDeletion(user.id);
	return {
		scheduledAt: row?.scheduledAt.toISOString() ?? null,
	};
}
