// Outbox-pattern webhook delivery. Use `enqueueDelivery()` from any
// server action to publish; a worker (cron / queue / inline retry)
// drains pending deliveries via `processPendingDeliveries()`.

import "server-only";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { db } from "@starter-saas/db";
import {
	userWebhook,
	webhookDelivery,
} from "@starter-saas/db/schema/user-webhook";
import { and, eq, inArray, lt, or } from "drizzle-orm";

export const WEBHOOK_TIMEOUT_MS = 10_000;
export const MAX_ATTEMPTS = 5;

function backoffMs(attempts: number): number {
	// 30s, 2m, 8m, 32m, 2h.
	return Math.min(30 * 1000 * 4 ** attempts, 2 * 60 * 60 * 1000);
}

export function signPayload(secret: string, body: string): string {
	return createHmac("sha256", secret).update(body).digest("hex");
}

export function newWebhookSecret(): string {
	return `whsec_${randomBytes(24).toString("base64url")}`;
}

export async function listSubscriptions(userId: string) {
	return db.select().from(userWebhook).where(eq(userWebhook.userId, userId));
}

export async function createSubscription(input: {
	userId: string;
	url: string;
	events: string[];
}) {
	const id = randomUUID();
	await db.insert(userWebhook).values({
		id,
		userId: input.userId,
		url: input.url,
		secret: newWebhookSecret(),
		events: input.events,
	});
	return id;
}

export async function deleteSubscription(opts: { userId: string; id: string }) {
	return db
		.delete(userWebhook)
		.where(
			and(eq(userWebhook.id, opts.id), eq(userWebhook.userId, opts.userId)),
		);
}

export async function enqueueDelivery(input: {
	userId: string;
	event: string;
	payload: Record<string, unknown>;
}): Promise<number> {
	const subs = await db
		.select()
		.from(userWebhook)
		.where(
			and(
				eq(userWebhook.userId, input.userId),
				eq(userWebhook.status, "active"),
			),
		);
	const matching = subs.filter((s) =>
		s.events.length === 0 ? true : s.events.includes(input.event),
	);
	if (matching.length === 0) {
		return 0;
	}
	const now = new Date();
	const rows = matching.map((sub) => ({
		id: randomUUID(),
		webhookId: sub.id,
		event: input.event,
		payload: input.payload,
		status: "pending" as const,
		attempts: 0,
		nextRetryAt: now,
	}));
	await db.insert(webhookDelivery).values(rows);
	return rows.length;
}

async function send(
	url: string,
	secret: string,
	event: string,
	body: string,
): Promise<{ status: number; bodyText: string }> {
	const signature = signPayload(secret, body);
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-starter-saas-event": event,
				"x-starter-saas-signature": signature,
			},
			body,
			signal: controller.signal,
		});
		const text = await res.text().catch(() => "");
		return { status: res.status, bodyText: text.slice(0, 500) };
	} finally {
		clearTimeout(timer);
	}
}

export async function processPendingDeliveries(limit = 50): Promise<{
	processed: number;
	delivered: number;
	failed: number;
}> {
	const now = new Date();
	const pending = await db
		.select({
			id: webhookDelivery.id,
			webhookId: webhookDelivery.webhookId,
			event: webhookDelivery.event,
			payload: webhookDelivery.payload,
			attempts: webhookDelivery.attempts,
		})
		.from(webhookDelivery)
		.where(
			and(
				or(
					eq(webhookDelivery.status, "pending"),
					eq(webhookDelivery.status, "retry"),
				),
				lt(webhookDelivery.nextRetryAt, now),
			),
		)
		.limit(limit);

	if (pending.length === 0) {
		return { processed: 0, delivered: 0, failed: 0 };
	}

	const subs = await db
		.select()
		.from(userWebhook)
		.where(
			inArray(
				userWebhook.id,
				pending.map((p) => p.webhookId),
			),
		);
	const subById = new Map(subs.map((s) => [s.id, s]));

	let delivered = 0;
	let failed = 0;

	for (const row of pending) {
		const sub = subById.get(row.webhookId);
		if (!sub) {
			await db
				.update(webhookDelivery)
				.set({ status: "skipped" })
				.where(eq(webhookDelivery.id, row.id));
			continue;
		}
		const body = JSON.stringify({ event: row.event, data: row.payload });
		let status = 0;
		let bodyText: string | undefined;
		let succeeded = false;
		try {
			const result = await send(sub.url, sub.secret, row.event, body);
			status = result.status;
			bodyText = result.bodyText;
			succeeded = status >= 200 && status < 300;
		} catch (err) {
			bodyText = err instanceof Error ? err.message.slice(0, 500) : "error";
		}

		const attempts = row.attempts + 1;

		if (succeeded) {
			delivered++;
			const deliveredAt = new Date();
			// Both updates touch different rows; parallelize.
			await Promise.all([
				db
					.update(webhookDelivery)
					.set({
						status: "delivered",
						attempts,
						responseCode: status,
						responseBody: bodyText,
						deliveredAt,
					})
					.where(eq(webhookDelivery.id, row.id)),
				db
					.update(userWebhook)
					.set({ lastDeliveryAt: deliveredAt, failureCount: 0 })
					.where(eq(userWebhook.id, sub.id)),
			]);
			continue;
		}

		failed++;
		const giveUp = attempts >= MAX_ATTEMPTS;
		const next = giveUp ? null : new Date(Date.now() + backoffMs(attempts));
		await Promise.all([
			db
				.update(webhookDelivery)
				.set({
					status: giveUp ? "failed" : "retry",
					attempts,
					responseCode: status || null,
					responseBody: bodyText ?? null,
					nextRetryAt: next,
				})
				.where(eq(webhookDelivery.id, row.id)),
			db
				.update(userWebhook)
				.set({ failureCount: sub.failureCount + 1 })
				.where(eq(userWebhook.id, sub.id)),
		]);
	}

	return { processed: pending.length, delivered, failed };
}

export async function replayDelivery(opts: { userId: string; id: string }) {
	const rows = await db
		.select({
			deliveryId: webhookDelivery.id,
			webhookOwner: userWebhook.userId,
		})
		.from(webhookDelivery)
		.leftJoin(userWebhook, eq(userWebhook.id, webhookDelivery.webhookId))
		.where(eq(webhookDelivery.id, opts.id))
		.limit(1);
	const row = rows[0];
	if (!row || row.webhookOwner !== opts.userId) {
		return false;
	}
	await db
		.update(webhookDelivery)
		.set({ status: "pending", attempts: 0, nextRetryAt: new Date() })
		.where(eq(webhookDelivery.id, row.deliveryId));
	return true;
}

export async function listDeliveries(userId: string, limit = 50) {
	return db
		.select({
			id: webhookDelivery.id,
			webhookId: webhookDelivery.webhookId,
			event: webhookDelivery.event,
			status: webhookDelivery.status,
			attempts: webhookDelivery.attempts,
			responseCode: webhookDelivery.responseCode,
			deliveredAt: webhookDelivery.deliveredAt,
			createdAt: webhookDelivery.createdAt,
		})
		.from(webhookDelivery)
		.innerJoin(userWebhook, eq(userWebhook.id, webhookDelivery.webhookId))
		.where(eq(userWebhook.userId, userId))
		.orderBy(webhookDelivery.createdAt)
		.limit(limit);
}
