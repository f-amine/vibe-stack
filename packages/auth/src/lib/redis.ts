// Lazy ioredis singleton + Better Auth `secondaryStorage` adapter.
//
// REDIS_URL unset → returns `undefined`. Better Auth falls back to its
// in-memory store (fine for dev / single-instance). In production, set
// REDIS_URL to enable the shared rate-limit window across replicas and
// survive container restarts.

import "server-only";
import { env } from "@starter-saas/env/server";
import Redis from "ioredis";

let client: Redis | null = null;
let warned = false;

function getRedis(): Redis | null {
	if (!env.REDIS_URL) {
		return null;
	}
	if (client) {
		return client;
	}
	client = new Redis(env.REDIS_URL, {
		password: env.REDIS_PASSWORD,
		// Connection retries are handled by ioredis defaults. We don't want
		// auth requests to hang for minutes on a downed Redis — fail fast
		// and fall back to the next layer.
		maxRetriesPerRequest: 2,
		enableReadyCheck: true,
		lazyConnect: false,
	});
	client.on("error", (err) => {
		if (!warned) {
			warned = true;
			console.error("[auth/redis] connection error:", err.message);
		}
	});
	return client;
}

export type SecondaryStorage = {
	get: (key: string) => Promise<string | null>;
	set: (key: string, value: string, ttl?: number) => Promise<void>;
	delete: (key: string) => Promise<void>;
};

export function createRedisSecondaryStorage(): SecondaryStorage | undefined {
	const redis = getRedis();
	if (!redis) {
		return undefined;
	}
	return {
		async get(key) {
			try {
				return await redis.get(key);
			} catch (err) {
				console.error("[auth/redis] get failed:", (err as Error).message);
				return null;
			}
		},
		async set(key, value, ttl) {
			try {
				if (ttl && ttl > 0) {
					await redis.set(key, value, "EX", ttl);
				} else {
					await redis.set(key, value);
				}
			} catch (err) {
				console.error("[auth/redis] set failed:", (err as Error).message);
			}
		},
		async delete(key) {
			try {
				await redis.del(key);
			} catch (err) {
				console.error("[auth/redis] delete failed:", (err as Error).message);
			}
		},
	};
}
