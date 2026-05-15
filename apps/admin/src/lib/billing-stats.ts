// Billing-specific analytics — MRR, churn, top plans. Read straight off
// the `subscription` table, so the numbers track exactly what the app
// sees right now (rather than what Polar has). Both sources should
// agree once the webhook pipeline (#27) is fully wired.

import "server-only";
import { db } from "@starter-saas/db";
import { subscription } from "@starter-saas/db/schema/billing";
import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";

export type MrrPoint = {
	month: string; // YYYY-MM
	mrrCents: number;
};

export type ChurnPoint = {
	month: string; // YYYY-MM
	churned: number;
	active: number;
	churnRate: number;
};

export type PlanRow = {
	productId: string;
	productName: string;
	priceCents: number;
	currency: string;
	subscribers: number;
	mrrCents: number;
};

// `subscription.canceledAt` vs `createdAt` differ in `notNull` so a single
// generic helper would collide on column type. Inline `sql` with a column
// reference is cheap enough.

function monthKey(date: Date | null | undefined): string {
	if (!date) {
		return "";
	}
	return date.toISOString().slice(0, 7);
}

function normalizeToMonth(priceCents: number, interval: string | null): number {
	if (interval === "year" || interval === "annual") {
		return Math.round(priceCents / 12);
	}
	return priceCents;
}

export async function fetchMrr(months = 12): Promise<MrrPoint[]> {
	const since = new Date();
	since.setMonth(since.getMonth() - (months - 1));
	since.setDate(1);
	since.setHours(0, 0, 0, 0);

	// Active subscriptions in each month: those whose createdAt < end-of-month
	// AND (canceledAt IS NULL OR canceledAt >= start-of-month).
	const rows = await db
		.select({
			interval: subscription.interval,
			priceCents: subscription.priceCents,
			createdAt: subscription.createdAt,
			canceledAt: subscription.canceledAt,
			endedAt: subscription.endedAt,
		})
		.from(subscription);

	const buckets = new Map<string, number>();
	const startOfMonth = new Date(since);
	for (let i = 0; i < months; i++) {
		const month = new Date(startOfMonth);
		month.setMonth(startOfMonth.getMonth() + i);
		buckets.set(monthKey(month), 0);
	}

	for (const row of rows) {
		const price = Number(row.priceCents ?? 0);
		if (price <= 0) {
			continue;
		}
		const monthlyValue = normalizeToMonth(price, row.interval);
		const start = row.createdAt;
		const end = row.endedAt ?? row.canceledAt ?? null;
		for (const key of buckets.keys()) {
			const monthStart = new Date(`${key}-01T00:00:00Z`);
			const monthEnd = new Date(monthStart);
			monthEnd.setUTCMonth(monthStart.getUTCMonth() + 1);
			const startsBefore = start && start < monthEnd;
			const stillActive = !end || end >= monthStart;
			if (startsBefore && stillActive) {
				buckets.set(key, (buckets.get(key) ?? 0) + monthlyValue);
			}
		}
	}

	return Array.from(buckets.entries())
		.sort(([a], [b]) => (a < b ? -1 : 1))
		.map(([month, mrrCents]) => ({ month, mrrCents }));
}

export async function fetchChurn(months = 12): Promise<ChurnPoint[]> {
	const since = new Date();
	since.setMonth(since.getMonth() - (months - 1));
	since.setDate(1);
	since.setHours(0, 0, 0, 0);

	const churnedRows = await db
		.select({
			month: sql<Date>`date_trunc('month', ${subscription.canceledAt})`,
			c: sql<number>`count(*)::int`,
		})
		.from(subscription)
		.where(
			and(
				isNotNull(subscription.canceledAt),
				gte(subscription.canceledAt, since),
			),
		)
		.groupBy(sql`date_trunc('month', ${subscription.canceledAt})`)
		.orderBy(sql`date_trunc('month', ${subscription.canceledAt})`);

	const churnedByMonth = new Map<string, number>();
	for (const row of churnedRows) {
		const key = monthKey(row.month);
		if (key) {
			churnedByMonth.set(key, Number(row.c));
		}
	}

	// "Active at start of month" — subscriptions whose createdAt < start AND
	// (canceledAt IS NULL OR canceledAt >= start).
	const points: ChurnPoint[] = [];
	for (let i = 0; i < months; i++) {
		const start = new Date(since);
		start.setMonth(since.getMonth() + i);
		const [activeRow] = await db
			.select({ c: sql<number>`count(*)::int` })
			.from(subscription)
			.where(
				and(
					lte(subscription.createdAt, start),
					sql`(${subscription.canceledAt} IS NULL OR ${subscription.canceledAt} >= ${start})`,
				),
			);
		const key = start.toISOString().slice(0, 7);
		const active = Number(activeRow?.c ?? 0);
		const churned = churnedByMonth.get(key) ?? 0;
		const churnRate = active > 0 ? churned / active : 0;
		points.push({ month: key, active, churned, churnRate });
	}
	return points;
}

export async function fetchTopPlans(limit = 8): Promise<PlanRow[]> {
	const rows = await db
		.select({
			productId: subscription.productId,
			productName: subscription.productName,
			priceCents: subscription.priceCents,
			currency: subscription.currency,
			interval: subscription.interval,
			subs: sql<number>`count(*)::int`,
		})
		.from(subscription)
		.where(eq(subscription.status, "active"))
		.groupBy(
			subscription.productId,
			subscription.productName,
			subscription.priceCents,
			subscription.currency,
			subscription.interval,
		)
		.orderBy(sql`count(*) desc`)
		.limit(limit);

	return rows.map((r) => {
		const price = Number(r.priceCents ?? 0);
		const monthly = normalizeToMonth(price, r.interval);
		const subscribers = Number(r.subs);
		return {
			productId: r.productId,
			productName: r.productName ?? r.productId,
			priceCents: price,
			currency: r.currency ?? "USD",
			subscribers,
			mrrCents: monthly * subscribers,
		};
	});
}

export function formatMoney(cents: number, currency = "USD"): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(cents / 100);
}

export function formatPercent(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}
