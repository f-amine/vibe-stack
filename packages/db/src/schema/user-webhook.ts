import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const userWebhook = pgTable(
	"user_webhook",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		url: text("url").notNull(),
		secret: text("secret").notNull(),
		events: text("events").array().notNull().default([]),
		status: text("status").notNull().default("active"),
		lastDeliveryAt: timestamp("last_delivery_at"),
		failureCount: integer("failure_count").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("user_webhook_user_id_idx").on(table.userId)],
);

export const webhookDelivery = pgTable(
	"webhook_delivery",
	{
		id: text("id").primaryKey(),
		webhookId: text("webhook_id")
			.notNull()
			.references(() => userWebhook.id, { onDelete: "cascade" }),
		event: text("event").notNull(),
		payload: jsonb("payload").notNull(),
		status: text("status").notNull().default("pending"),
		attempts: integer("attempts").notNull().default(0),
		responseCode: integer("response_code"),
		responseBody: text("response_body"),
		nextRetryAt: timestamp("next_retry_at"),
		deliveredAt: timestamp("delivered_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("webhook_delivery_webhook_id_idx").on(table.webhookId),
		index("webhook_delivery_status_idx").on(table.status),
		index("webhook_delivery_retry_idx").on(table.nextRetryAt),
	],
);

export type UserWebhook = typeof userWebhook.$inferSelect;
export type WebhookDelivery = typeof webhookDelivery.$inferSelect;
