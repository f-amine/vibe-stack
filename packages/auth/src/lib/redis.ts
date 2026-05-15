// Lazy ioredis singleton + Better Auth `secondaryStorage` adapter.
//
// REDIS_URL unset → returns `undefined`. Better Auth falls back to its
// in-memory store (fine for dev / single-instance). In production, set
// REDIS_URL to enable the shared rate-limit window across replicas and
// survive container restarts.
//
// Fail-fast policy: when Redis is unreachable we trip a process-local
// circuit breaker so subsequent get/set/delete calls return immediately
// (null / no-op) instead of blocking the request thread on retries.
// The breaker resets on `ready` so a recovered Redis is picked up
// without a server restart.

import "server-only";
import { env } from "@starter-saas/env/server";
import Redis from "ioredis";

let client: Redis | null = null;
let breakerOpen = false;
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
		// Aggressive fail-fast settings — auth requests must never block on a
		// downed Redis. Better Auth's secondaryStorage is best-effort; when
		// it errors we fall back to the in-memory layer.
		maxRetriesPerRequest: 1,
		enableReadyCheck: true,
		lazyConnect: false,
		connectTimeout: 500,
		// Reject queued commands immediately instead of waiting for a
		// connection that may never come up. Without this ioredis buffers
		// commands and resolves them after `maxRetriesPerRequest` * backoff.
		enableOfflineQueue: false,
		retryStrategy(times) {
			// Back off exponentially up to 30s. Don't return `null` (would
			// kill the client) — we want the breaker to flip closed if Redis
			// recovers.
			return Math.min(times * 1000, 30_000);
		},
	});
	client.on("error", (err) => {
		breakerOpen = true;
		if (!warned) {
			warned = true;
			console.error(
				"[auth/redis] connection error:",
				err.message,
				"— falling back to in-memory (no further errors will be logged until reconnect)",
			);
		}
	});
	client.on("ready", () => {
		if (breakerOpen) {
			console.log("[auth/redis] reconnected");
		}
		breakerOpen = false;
		warned = false;
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
			if (breakerOpen) {
				return null;
			}
			try {
				return await redis.get(key);
			} catch {
				return null;
			}
		},
		async set(key, value, ttl) {
			if (breakerOpen) {
				return;
			}
			try {
				if (ttl && ttl > 0) {
					await redis.set(key, value, "EX", ttl);
				} else {
					await redis.set(key, value);
				}
			} catch {
				// Swallow — adapter is best-effort.
			}
		},
		async delete(key) {
			if (breakerOpen) {
				return;
			}
			try {
				await redis.del(key);
			} catch {
				// Swallow.
			}
		},
	};
}
