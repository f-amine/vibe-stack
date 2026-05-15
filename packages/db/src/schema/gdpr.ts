import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Records pending account deletions. Set when the user types the
// confirmation phrase; a cron job purges users whose `scheduledAt` is in
// the past + cancellation window (7 days).
export const accountDeletion = pgTable(
	"account_deletion",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),
		scheduledAt: timestamp("scheduled_at").notNull(),
		reason: text("reason"),
		canceledAt: timestamp("canceled_at"),
		purgedAt: timestamp("purged_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("account_deletion_scheduled_idx").on(table.scheduledAt)],
);

export type AccountDeletion = typeof accountDeletion.$inferSelect;
