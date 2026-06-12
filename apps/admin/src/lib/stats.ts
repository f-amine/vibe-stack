// Server-side helpers that read live data from the DB.
import "server-only";
import { db } from "@vibestack/db";
import { auditLog } from "@vibestack/db/schema/audit";
import { organization, user } from "@vibestack/db/schema/auth";
import { subscription } from "@vibestack/db/schema/billing";
import { count, eq, gte, sql } from "drizzle-orm";

export async function fetchKpis() {
	const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

	const [totalUsersRow] = await db.select({ c: count() }).from(user);
	const [last30Row] = await db
		.select({ c: count() })
		.from(user)
		.where(gte(user.createdAt, since));
	const [orgsRow] = await db.select({ c: count() }).from(organization);
	const [activeSubsRow] = await db
		.select({ c: count() })
		.from(subscription)
		.where(eq(subscription.status, "active"));

	return {
		totalUsers: totalUsersRow?.c ?? 0,
		newUsers30d: last30Row?.c ?? 0,
		totalOrgs: orgsRow?.c ?? 0,
		activeSubs: activeSubsRow?.c ?? 0,
	};
}

export async function fetchSignupsByDay(days = 30) {
	const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
	const rows = await db
		.select({
			day: sql<string>`to_char(date_trunc('day', ${user.createdAt}), 'YYYY-MM-DD')`,
			c: count(),
		})
		.from(user)
		.where(gte(user.createdAt, since))
		.groupBy(sql`date_trunc('day', ${user.createdAt})`)
		.orderBy(sql`date_trunc('day', ${user.createdAt})`);

	return rows.map((r) => ({ date: r.day.slice(5), value: Number(r.c) }));
}

export async function fetchAuditByAction(limit = 6) {
	const rows = await db
		.select({ action: auditLog.action, c: count() })
		.from(auditLog)
		.groupBy(auditLog.action)
		.orderBy(sql`count(*) desc`)
		.limit(limit);
	return rows.map((r) => ({ label: r.action, value: Number(r.c) }));
}
