// Polar webhook handler — mirrors customer + subscription state into the
// local DB and writes an audit_log row on every state change. The Polar
// dashboard delivers events via Svix; we re-implement Svix's signature
// algorithm inline so we don't pull a heavy dep.

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { db } from "@starter-saas/db";
import { auditLog } from "@starter-saas/db/schema/audit";
import { polarCustomer, subscription } from "@starter-saas/db/schema/billing";
import { env } from "@starter-saas/env/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySvix(args: {
	secret: string;
	id: string;
	timestamp: string;
	signatureHeader: string;
	body: string;
}): boolean {
	const raw = args.secret.startsWith("whsec_")
		? args.secret.slice(6)
		: args.secret;
	let keyBytes: Buffer;
	try {
		keyBytes = Buffer.from(raw, "base64");
		if (keyBytes.length === 0) {
			throw new Error("empty");
		}
	} catch {
		keyBytes = Buffer.from(raw, "utf8");
	}
	const expected = createHmac("sha256", keyBytes)
		.update(`${args.id}.${args.timestamp}.${args.body}`)
		.digest("base64");
	const expectedBuf = Buffer.from(expected, "base64");
	for (const segment of args.signatureHeader.split(" ")) {
		const [, sig] = segment.split(",");
		if (!sig) {
			continue;
		}
		try {
			const provided = Buffer.from(sig, "base64");
			if (
				provided.length === expectedBuf.length &&
				timingSafeEqual(provided, expectedBuf)
			) {
				return true;
			}
		} catch {
			/* try next segment */
		}
	}
	return false;
}

type PolarSubscription = {
	id: string;
	customer_id: string;
	product_id?: string | null;
	product?: { id?: string | null; name?: string | null } | null;
	price?: { price_amount?: number | null; currency?: string | null } | null;
	recurring_interval?: string | null;
	status: string;
	cancel_at_period_end?: boolean | null;
	current_period_start?: string | null;
	current_period_end?: string | null;
	canceled_at?: string | null;
	ended_at?: string | null;
};

type PolarCustomerData = {
	id: string;
	email?: string | null;
};

type PolarEvent = {
	type: string;
	data?: PolarSubscription | PolarCustomerData | Record<string, unknown>;
};

function asDate(input: string | null | undefined): Date | null {
	if (!input) {
		return null;
	}
	const d = new Date(input);
	return Number.isNaN(d.getTime()) ? null : d;
}

async function upsertCustomer(payload: PolarCustomerData): Promise<void> {
	await db
		.insert(polarCustomer)
		.values({
			id: payload.id,
			polarCustomerId: payload.id,
			email: payload.email ?? null,
		})
		.onConflictDoUpdate({
			target: polarCustomer.polarCustomerId,
			set: { email: payload.email ?? null },
		});
}

async function upsertSubscription(payload: PolarSubscription): Promise<void> {
	const priceCents = payload.price?.price_amount ?? null;
	const currency = payload.price?.currency ?? null;
	await db
		.insert(subscription)
		.values({
			id: payload.id,
			polarSubscriptionId: payload.id,
			polarCustomerId: payload.customer_id,
			productId: payload.product_id ?? payload.product?.id ?? "",
			productName: payload.product?.name ?? null,
			priceCents,
			currency,
			interval: payload.recurring_interval ?? null,
			status: payload.status,
			cancelAtPeriodEnd: Boolean(payload.cancel_at_period_end),
			currentPeriodStart: asDate(payload.current_period_start),
			currentPeriodEnd: asDate(payload.current_period_end),
			canceledAt: asDate(payload.canceled_at),
			endedAt: asDate(payload.ended_at),
		})
		.onConflictDoUpdate({
			target: subscription.polarSubscriptionId,
			set: {
				productId: payload.product_id ?? payload.product?.id ?? "",
				productName: payload.product?.name ?? null,
				priceCents,
				currency,
				interval: payload.recurring_interval ?? null,
				status: payload.status,
				cancelAtPeriodEnd: Boolean(payload.cancel_at_period_end),
				currentPeriodStart: asDate(payload.current_period_start),
				currentPeriodEnd: asDate(payload.current_period_end),
				canceledAt: asDate(payload.canceled_at),
				endedAt: asDate(payload.ended_at),
			},
		});
}

async function audit(action: string, targetId: string, metadata: unknown) {
	await db
		.insert(auditLog)
		.values({
			id: randomUUID(),
			actorUserId: null,
			action,
			targetType: "polar",
			targetId,
			metadata: metadata as Record<string, unknown>,
		})
		.onConflictDoNothing();
}

export async function POST(request: Request) {
	if (!env.POLAR_WEBHOOK_SECRET) {
		return NextResponse.json(
			{ error: "webhook_secret_unset" },
			{ status: 503 },
		);
	}
	const id =
		request.headers.get("webhook-id") ?? request.headers.get("svix-id");
	const timestamp =
		request.headers.get("webhook-timestamp") ??
		request.headers.get("svix-timestamp");
	const signatureHeader =
		request.headers.get("webhook-signature") ??
		request.headers.get("svix-signature");
	if (!id || !timestamp || !signatureHeader) {
		return NextResponse.json(
			{ error: "missing_signature_headers" },
			{ status: 400 },
		);
	}
	const body = await request.text();
	if (
		!verifySvix({
			secret: env.POLAR_WEBHOOK_SECRET,
			id,
			timestamp,
			signatureHeader,
			body,
		})
	) {
		return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
	}

	let event: PolarEvent;
	try {
		event = JSON.parse(body) as PolarEvent;
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}

	const type = event.type;
	const data = event.data ?? {};

	if (type.startsWith("customer.")) {
		const customer = data as PolarCustomerData;
		if (customer.id) {
			await upsertCustomer(customer);
		}
		await audit(`polar.${type}`, (data as { id?: string }).id ?? "", event);
	} else if (type.startsWith("subscription.") || type.startsWith("checkout.")) {
		const sub = data as PolarSubscription;
		if (sub.id && sub.customer_id) {
			// Make sure the customer row exists before the FK kicks in.
			await db
				.insert(polarCustomer)
				.values({
					id: sub.customer_id,
					polarCustomerId: sub.customer_id,
				})
				.onConflictDoNothing();
			await upsertSubscription(sub);
		}
		await audit(`polar.${type}`, sub.id ?? "", event);
	} else if (
		type === "subscription.canceled" ||
		type === "subscription.revoked"
	) {
		const sub = data as PolarSubscription;
		await db
			.update(subscription)
			.set({
				status: sub.status ?? "canceled",
				canceledAt: asDate(sub.canceled_at) ?? new Date(),
				endedAt: asDate(sub.ended_at),
			})
			.where(eq(subscription.polarSubscriptionId, sub.id));
		await audit(`polar.${type}`, sub.id, event);
	} else {
		await audit(`polar.${type}`, "", event);
	}

	return NextResponse.json({ ok: true });
}
