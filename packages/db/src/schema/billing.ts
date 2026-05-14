import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

export const polarCustomer = pgTable(
	"polar_customer",
	{
		id: text("id").primaryKey(),
		polarCustomerId: text("polar_customer_id").notNull().unique(),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
		organizationId: text("organization_id").references(() => organization.id, {
			onDelete: "set null",
		}),
		email: text("email"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("polar_customer_user_id_idx").on(table.userId),
		index("polar_customer_organization_id_idx").on(table.organizationId),
	],
);

export const subscription = pgTable(
	"subscription",
	{
		id: text("id").primaryKey(),
		polarSubscriptionId: text("polar_subscription_id").notNull().unique(),
		polarCustomerId: text("polar_customer_id").notNull(),
		productId: text("product_id").notNull(),
		productName: text("product_name"),
		priceCents: integer("price_cents"),
		currency: text("currency"),
		interval: text("interval"),
		status: text("status").notNull(),
		cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
		currentPeriodStart: timestamp("current_period_start"),
		currentPeriodEnd: timestamp("current_period_end"),
		canceledAt: timestamp("canceled_at"),
		endedAt: timestamp("ended_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("subscription_polar_customer_id_idx").on(table.polarCustomerId),
		index("subscription_status_idx").on(table.status),
	],
);

export type Subscription = typeof subscription.$inferSelect;
export type SubscriptionInsert = typeof subscription.$inferInsert;
