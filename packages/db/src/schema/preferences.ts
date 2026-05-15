import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const userPreferences = pgTable("user_preferences", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	theme: text("theme").notNull().default("system"),
	density: text("density").notNull().default("comfortable"),
	locale: text("locale").notNull().default("en"),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
