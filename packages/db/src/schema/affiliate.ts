import {
	doublePrecision,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const affiliate = pgTable(
	"affiliate",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),
		code: text("code").notNull().unique(),
		commissionRate: doublePrecision("commission_rate").notNull().default(0.2),
		status: text("status").notNull().default("active"),
		enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
	},
	(table) => [uniqueIndex("affiliate_code_idx").on(table.code)],
);

export const affiliateClick = pgTable(
	"affiliate_click",
	{
		id: text("id").primaryKey(),
		code: text("code").notNull(),
		ip: text("ip"),
		referer: text("referer"),
		utmSource: text("utm_source"),
		utmMedium: text("utm_medium"),
		utmCampaign: text("utm_campaign"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("affiliate_click_code_idx").on(table.code),
		index("affiliate_click_created_idx").on(table.createdAt),
	],
);

export const affiliateSignup = pgTable(
	"affiliate_signup",
	{
		id: text("id").primaryKey(),
		affiliateId: text("affiliate_id")
			.notNull()
			.references(() => affiliate.id, { onDelete: "cascade" }),
		referredUserId: text("referred_user_id")
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("affiliate_signup_affiliate_idx").on(table.affiliateId)],
);

export const affiliatePayout = pgTable(
	"affiliate_payout",
	{
		id: text("id").primaryKey(),
		affiliateId: text("affiliate_id")
			.notNull()
			.references(() => affiliate.id, { onDelete: "cascade" }),
		amountCents: integer("amount_cents").notNull(),
		currency: text("currency").notNull().default("USD"),
		status: text("status").notNull().default("pending"),
		polarPayoutId: text("polar_payout_id"),
		note: text("note"),
		requestedAt: timestamp("requested_at").defaultNow().notNull(),
		decidedAt: timestamp("decided_at"),
	},
	(table) => [index("affiliate_payout_affiliate_idx").on(table.affiliateId)],
);

export type Affiliate = typeof affiliate.$inferSelect;
export type AffiliateClick = typeof affiliateClick.$inferSelect;
export type AffiliateSignup = typeof affiliateSignup.$inferSelect;
export type AffiliatePayout = typeof affiliatePayout.$inferSelect;
