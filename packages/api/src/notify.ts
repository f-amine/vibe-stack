// Server-side notification helper. Writes a row to `notification` and,
// optionally, queues an email via `@starter-saas/email`. Designed to be
// safe in `noStore()` server actions: never throws.

import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@starter-saas/db";
import { notification } from "@starter-saas/db/schema/notification";

export type NotificationKind =
	| "system"
	| "billing"
	| "org.invite"
	| "org.member.joined"
	| "security"
	| "release";

type NotifyInput = {
	userId: string;
	kind: NotificationKind | (string & {});
	title?: string;
	body?: string;
	href?: string;
	payload?: Record<string, unknown>;
};

export async function notify(input: NotifyInput): Promise<void> {
	if (!input.userId || !input.kind) {
		return;
	}
	try {
		await db.insert(notification).values({
			id: randomUUID(),
			userId: input.userId,
			kind: input.kind,
			title: input.title ?? null,
			body: input.body ?? null,
			href: input.href ?? null,
			payload: input.payload ?? null,
		});
	} catch (err) {
		// Notifications should never break the caller. Log + move on.
		console.error("[notify] insert failed:", err);
	}
}
