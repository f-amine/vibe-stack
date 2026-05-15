"use server";

import "server-only";
import { randomUUID } from "node:crypto";
import { auth } from "@starter-saas/auth";
import { db } from "@starter-saas/db";
import { auditLog } from "@starter-saas/db/schema/audit";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireAdmin } from "@/lib/require-admin";

type Role = "admin" | "user";

async function audit(
	actorId: string,
	action: string,
	targetUserId: string,
	metadata: Record<string, unknown> = {},
): Promise<void> {
	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: actorId,
			action,
			targetType: "user",
			targetId: targetUserId,
			metadata,
		})
		.onConflictDoNothing();
}

function callerHeaders() {
	return headers();
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function banUserAction(input: {
	userId: string;
	reason: string;
	expiresInDays?: number;
}): Promise<ActionResult> {
	const session = await requireAdmin();
	if (session.user.id === input.userId) {
		return { ok: false, error: "You can't ban yourself." };
	}

	try {
		const banExpiresIn = input.expiresInDays
			? input.expiresInDays * 24 * 60 * 60
			: undefined;
		await auth.api.banUser({
			headers: await callerHeaders(),
			body: {
				userId: input.userId,
				banReason: input.reason || "Banned by admin",
				banExpiresIn,
			},
		});
		await audit(session.user.id, "user.banned", input.userId, {
			reason: input.reason,
			expiresInDays: input.expiresInDays ?? null,
		});
		revalidatePath("/[locale]/users", "page");
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "ban failed",
		};
	}
}

export async function unbanUserAction(input: {
	userId: string;
}): Promise<ActionResult> {
	const session = await requireAdmin();
	try {
		await auth.api.unbanUser({
			headers: await callerHeaders(),
			body: { userId: input.userId },
		});
		await audit(session.user.id, "user.unbanned", input.userId);
		revalidatePath("/[locale]/users", "page");
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "unban failed",
		};
	}
}

export async function setRoleAction(input: {
	userId: string;
	role: Role;
}): Promise<ActionResult> {
	const session = await requireAdmin();
	if (session.user.id === input.userId && input.role !== "admin") {
		return { ok: false, error: "You can't strip your own admin role." };
	}

	try {
		await auth.api.setRole({
			headers: await callerHeaders(),
			body: { userId: input.userId, role: input.role },
		});
		await audit(session.user.id, "user.role.changed", input.userId, {
			role: input.role,
		});
		revalidatePath("/[locale]/users", "page");
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "role change failed",
		};
	}
}

export async function impersonateUserAction(input: {
	userId: string;
}): Promise<ActionResult & { redirectTo?: string }> {
	const session = await requireAdmin();
	if (session.user.id === input.userId) {
		return { ok: false, error: "You're already that user." };
	}

	try {
		await auth.api.impersonateUser({
			headers: await callerHeaders(),
			body: { userId: input.userId },
		});
		await audit(session.user.id, "user.impersonated", input.userId);
		const webUrl =
			process.env.NEXT_PUBLIC_WEB_APP_URL ??
			process.env.NEXT_PUBLIC_APP_URL ??
			"http://localhost:3001";
		return { ok: true, redirectTo: `${webUrl}/dashboard` };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "impersonate failed",
		};
	}
}
