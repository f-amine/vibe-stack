import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notification = pgTable(
	"notification",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		kind: text("kind").notNull(),
		title: text("title"),
		body: text("body"),
		href: text("href"),
		payload: jsonb("payload"),
		readAt: timestamp("read_at"),
		sentEmailAt: timestamp("sent_email_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("notification_user_id_idx").on(table.userId),
		index("notification_kind_idx").on(table.kind),
		index("notification_user_unread_idx").on(table.userId, table.readAt),
		index("notification_created_at_idx").on(table.createdAt),
	],
);

export type Notification = typeof notification.$inferSelect;
export type NotificationInsert = typeof notification.$inferInsert;
