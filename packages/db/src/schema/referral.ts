import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const referral = pgTable(
	"referral",
	{
		id: text("id").primaryKey(),
		referrerUserId: text("referrer_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		referredEmail: text("referred_email").notNull(),
		referredUserId: text("referred_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		status: text("status").notNull().default("pending"),
		rewardCents: integer("reward_cents").notNull().default(0),
		rewardGranted: integer("reward_granted").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		acceptedAt: timestamp("accepted_at"),
		expiredAt: timestamp("expired_at"),
	},
	(table) => [
		index("referral_referrer_idx").on(table.referrerUserId),
		uniqueIndex("referral_referrer_email_idx").on(
			table.referrerUserId,
			table.referredEmail,
		),
	],
);

export type Referral = typeof referral.$inferSelect;
