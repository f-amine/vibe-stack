#!/usr/bin/env tsx
/**
 * Idempotent dev seeder — 1 admin, 5 users, 2 orgs (with memberships),
 * 50 audit rows, 1 active subscription.
 *
 *   pnpm db:seed
 *
 * Re-running is safe: every insert is wrapped in `onConflictDoNothing()`,
 * deterministic seed ids are reused, and the audit-rows are only filled
 * up to 50 (never duplicated).
 *
 * NOTE: passwords are NOT seeded here — the `account` table is normally
 * written by Better Auth at sign-up time, and reproducing its hashing
 * pipeline here would couple the seeder to that package. Sign in as the
 * admin via the existing auth UI; the user/org rows are what light up
 * the dashboards.
 */

import { auditLog } from "@vibestack/db/schema/audit";
import { member, organization, user } from "@vibestack/db/schema/auth";
import { polarCustomer, subscription } from "@vibestack/db/schema/billing";
import { count, eq, sql } from "drizzle-orm";

import { db } from "../src/index";

type SeedUser = {
	id: string;
	name: string;
	email: string;
	role: "admin" | "user";
};

const SEED_USERS: SeedUser[] = [
	{
		id: "seed-admin-01",
		name: "Ada Lovelace",
		email: "admin@example.com",
		role: "admin",
	},
	{
		id: "seed-user-01",
		name: "Grace Hopper",
		email: "grace@example.com",
		role: "user",
	},
	{
		id: "seed-user-02",
		name: "Margaret Hamilton",
		email: "margaret@example.com",
		role: "user",
	},
	{
		id: "seed-user-03",
		name: "Donald Knuth",
		email: "knuth@example.com",
		role: "user",
	},
	{
		id: "seed-user-04",
		name: "Barbara Liskov",
		email: "liskov@example.com",
		role: "user",
	},
	{
		id: "seed-user-05",
		name: "Edsger Dijkstra",
		email: "dijkstra@example.com",
		role: "user",
	},
];

const SEED_ORGS = [
	{ id: "seed-org-acme", name: "Acme Robotics", slug: "acme" },
	{ id: "seed-org-northcape", name: "Northcape Labs", slug: "northcape" },
] as const;

const AUDIT_ACTIONS = [
	"user.signin",
	"user.signout",
	"user.role.changed",
	"user.banned",
	"user.unbanned",
	"org.created",
	"org.member.invited",
	"org.member.removed",
	"billing.checkout.completed",
	"billing.subscription.canceled",
];

const SUB_USER = SEED_USERS[1];
if (!SUB_USER) {
	throw new Error("seed expects at least one regular user");
}
const SEED_SUBSCRIPTION = {
	id: "seed-sub-01",
	polarSubscriptionId: "polar_seed_sub_01",
	polarCustomerId: "polar_seed_customer_01",
	productId: "polar_product_pro",
	productName: "Pro",
	priceCents: 2900,
	currency: "USD",
	interval: "month",
	status: "active",
};
const SEED_POLAR_CUSTOMER = {
	id: "seed-pc-01",
	polarCustomerId: SEED_SUBSCRIPTION.polarCustomerId,
	userId: SUB_USER.id,
	email: SUB_USER.email,
};

const DESIRED_AUDIT_ROWS = 50;

async function seedUsers() {
	for (const u of SEED_USERS) {
		await db
			.insert(user)
			.values({
				id: u.id,
				name: u.name,
				email: u.email,
				emailVerified: true,
				role: u.role,
			})
			.onConflictDoNothing();
	}
}

async function seedOrgs() {
	for (const o of SEED_ORGS) {
		await db
			.insert(organization)
			.values({ id: o.id, name: o.name, slug: o.slug })
			.onConflictDoNothing();
	}

	// Memberships: admin owns Acme; first 3 users are members of Acme,
	// next 2 users are members of Northcape with the admin as a co-owner.
	const acme = SEED_ORGS[0];
	const northcape = SEED_ORGS[1];
	if (!acme || !northcape) {
		return;
	}
	const memberships: Array<{
		id: string;
		orgId: string;
		userId: string;
		role: string;
	}> = [
		{
			id: "seed-mem-01",
			orgId: acme.id,
			userId: "seed-admin-01",
			role: "owner",
		},
		{
			id: "seed-mem-02",
			orgId: acme.id,
			userId: "seed-user-01",
			role: "admin",
		},
		{
			id: "seed-mem-03",
			orgId: acme.id,
			userId: "seed-user-02",
			role: "member",
		},
		{
			id: "seed-mem-04",
			orgId: acme.id,
			userId: "seed-user-03",
			role: "member",
		},
		{
			id: "seed-mem-05",
			orgId: northcape.id,
			userId: "seed-admin-01",
			role: "owner",
		},
		{
			id: "seed-mem-06",
			orgId: northcape.id,
			userId: "seed-user-04",
			role: "admin",
		},
		{
			id: "seed-mem-07",
			orgId: northcape.id,
			userId: "seed-user-05",
			role: "member",
		},
	];
	for (const m of memberships) {
		await db
			.insert(member)
			.values({
				id: m.id,
				organizationId: m.orgId,
				userId: m.userId,
				role: m.role,
			})
			.onConflictDoNothing();
	}
}

async function seedBilling() {
	await db
		.insert(polarCustomer)
		.values({
			id: SEED_POLAR_CUSTOMER.id,
			polarCustomerId: SEED_POLAR_CUSTOMER.polarCustomerId,
			userId: SEED_POLAR_CUSTOMER.userId,
			email: SEED_POLAR_CUSTOMER.email,
		})
		.onConflictDoNothing();

	const now = new Date();
	const periodStart = new Date(now);
	periodStart.setDate(now.getDate() - 5);
	const periodEnd = new Date(now);
	periodEnd.setDate(now.getDate() + 25);

	await db
		.insert(subscription)
		.values({
			id: SEED_SUBSCRIPTION.id,
			polarSubscriptionId: SEED_SUBSCRIPTION.polarSubscriptionId,
			polarCustomerId: SEED_SUBSCRIPTION.polarCustomerId,
			productId: SEED_SUBSCRIPTION.productId,
			productName: SEED_SUBSCRIPTION.productName,
			priceCents: SEED_SUBSCRIPTION.priceCents,
			currency: SEED_SUBSCRIPTION.currency,
			interval: SEED_SUBSCRIPTION.interval,
			status: SEED_SUBSCRIPTION.status,
			cancelAtPeriodEnd: false,
			currentPeriodStart: periodStart,
			currentPeriodEnd: periodEnd,
		})
		.onConflictDoNothing();
}

async function seedAudit() {
	const [row] = await db.select({ c: count() }).from(auditLog);
	const existing = Number(row?.c ?? 0);
	if (existing >= DESIRED_AUDIT_ROWS) {
		return;
	}
	const remaining = DESIRED_AUDIT_ROWS - existing;
	const now = Date.now();
	const rows: Array<{
		id: string;
		actorUserId: string | null;
		action: string;
		targetType: string;
		targetId: string;
		metadata: Record<string, unknown>;
		createdAt: Date;
	}> = [];
	for (let i = 0; i < remaining; i++) {
		const actor = SEED_USERS[i % SEED_USERS.length];
		const action = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length] ?? "user.signin";
		const minutesAgo = i * 47; // ~2 days spread
		rows.push({
			id: `seed-audit-${String(i).padStart(3, "0")}`,
			actorUserId: actor?.id ?? null,
			action,
			targetType: "user",
			targetId: actor?.id ?? "seed-admin-01",
			metadata: { source: "seed", index: i },
			createdAt: new Date(now - minutesAgo * 60_000),
		});
	}
	if (rows.length === 0) {
		return;
	}
	await db.insert(auditLog).values(rows).onConflictDoNothing();
}

async function main() {
	const startedAt = Date.now();
	process.stdout.write("seeding database…\n");

	await seedUsers();
	await seedOrgs();
	await seedBilling();
	await seedAudit();

	const [userCount] = await db.select({ c: count() }).from(user);
	const [orgCount] = await db.select({ c: count() }).from(organization);
	const [auditCount] = await db.select({ c: count() }).from(auditLog);
	const [subCount] = await db
		.select({ c: count() })
		.from(subscription)
		.where(eq(subscription.status, "active"));

	process.stdout.write(
		`done in ${Date.now() - startedAt}ms · users=${userCount?.c} orgs=${orgCount?.c} audit=${auditCount?.c} active_subs=${subCount?.c}\n`,
	);
	process.stdout.write(
		`admin login: ${SEED_USERS[0]?.email} (sign up through the UI to create credentials; the user row is already in place).\n`,
	);
	// drizzle-orm node-postgres doesn't expose a clean .end on the proxy, but
	// we don't need to — process exits after main resolves.
	void sql;
}

main().then(
	() => process.exit(0),
	(err) => {
		process.stderr.write(`seed failed: ${err}\n`);
		process.exit(1);
	},
);
