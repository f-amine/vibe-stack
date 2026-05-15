import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const apiKey = pgTable(
	"api_key",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		prefix: text("prefix").notNull(),
		hash: text("hash").notNull(),
		scopes: text("scopes").array().notNull().default([]),
		lastUsedAt: timestamp("last_used_at"),
		expiresAt: timestamp("expires_at"),
		revokedAt: timestamp("revoked_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("api_key_user_id_idx").on(table.userId),
		uniqueIndex("api_key_hash_idx").on(table.hash),
	],
);

export type ApiKey = typeof apiKey.$inferSelect;
export type ApiKeyInsert = typeof apiKey.$inferInsert;
