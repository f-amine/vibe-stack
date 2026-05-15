// Issuance + validation for user-facing API keys.
//
// Tokens have the form `sk_<env>_<24 base64 chars>`. The `prefix` stored
// in DB is `sk_<env>_<first 8 chars>` (safe to display), and the full
// token is hashed with SHA-256 for storage.

import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "@vibestack/db";
import { apiKey } from "@vibestack/db/schema/api-key";
import { and, eq, isNull } from "drizzle-orm";

const PROD_PREFIX = "sk_live_";
const DEV_PREFIX = "sk_test_";

function envPrefix(): string {
	return process.env.NODE_ENV === "production" ? PROD_PREFIX : DEV_PREFIX;
}

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export type IssueInput = {
	userId: string;
	name: string;
	scopes?: string[];
	expiresAt?: Date | null;
};

export type IssueResult = {
	id: string;
	prefix: string;
	plaintext: string; // SHOW ONCE
	expiresAt: Date | null;
};

export async function issueApiKey(input: IssueInput): Promise<IssueResult> {
	const prefix = envPrefix();
	const random = randomBytes(18).toString("base64url"); // 24 chars
	const plaintext = `${prefix}${random}`;
	const visiblePrefix = `${prefix}${random.slice(0, 8)}`;
	const hash = hashToken(plaintext);
	const id = randomUUID();

	await db.insert(apiKey).values({
		id,
		userId: input.userId,
		name: input.name,
		prefix: visiblePrefix,
		hash,
		scopes: input.scopes ?? [],
		expiresAt: input.expiresAt ?? null,
	});

	return {
		id,
		prefix: visiblePrefix,
		plaintext,
		expiresAt: input.expiresAt ?? null,
	};
}

export async function revokeApiKey(opts: {
	userId: string;
	id: string;
}): Promise<boolean> {
	const result = await db
		.update(apiKey)
		.set({ revokedAt: new Date() })
		.where(and(eq(apiKey.id, opts.id), eq(apiKey.userId, opts.userId)));
	const affected = (result as unknown as { rowCount?: number }).rowCount ?? 0;
	return affected > 0;
}

export async function listApiKeys(userId: string) {
	return db
		.select({
			id: apiKey.id,
			name: apiKey.name,
			prefix: apiKey.prefix,
			scopes: apiKey.scopes,
			lastUsedAt: apiKey.lastUsedAt,
			expiresAt: apiKey.expiresAt,
			revokedAt: apiKey.revokedAt,
			createdAt: apiKey.createdAt,
		})
		.from(apiKey)
		.where(eq(apiKey.userId, userId));
}

export type VerifyResult = {
	id: string;
	userId: string;
	scopes: string[];
};

export async function verifyApiKey(
	token: string | null | undefined,
): Promise<VerifyResult | null> {
	if (!token) {
		return null;
	}
	const hash = hashToken(token);
	const rows = await db
		.select({
			id: apiKey.id,
			userId: apiKey.userId,
			scopes: apiKey.scopes,
			expiresAt: apiKey.expiresAt,
		})
		.from(apiKey)
		.where(and(eq(apiKey.hash, hash), isNull(apiKey.revokedAt)))
		.limit(1);
	const row = rows[0];
	if (!row) {
		return null;
	}
	if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
		return null;
	}
	// Best-effort last-used timestamp; ignore errors so auth path stays fast.
	void db
		.update(apiKey)
		.set({ lastUsedAt: new Date() })
		.where(eq(apiKey.id, row.id))
		.catch(() => {
			/* noop */
		});
	return { id: row.id, userId: row.userId, scopes: row.scopes ?? [] };
}

export function bearerToken(header: string | null | undefined): string | null {
	if (!header) {
		return null;
	}
	const trimmed = header.trim();
	if (trimmed.toLowerCase().startsWith("bearer ")) {
		return trimmed.slice(7).trim() || null;
	}
	return trimmed || null;
}
