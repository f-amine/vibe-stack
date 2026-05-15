import "server-only";
import { env } from "@starter-saas/env/server";
import { PostHog } from "posthog-node";

let cached: PostHog | null = null;

function getClient(): PostHog | null {
	if (!env.POSTHOG_KEY) {
		return null;
	}
	if (cached) {
		return cached;
	}
	cached = new PostHog(env.POSTHOG_KEY, {
		host: env.POSTHOG_HOST,
		flushAt: 1,
		flushInterval: 0,
	});
	return cached;
}

type Identity = {
	id?: string | null;
	email?: string | null;
};

type FlagOpts = {
	groups?: Record<string, string>;
	properties?: Record<string, unknown>;
};

function distinctIdOf(user: Identity | string): string {
	if (typeof user === "string") {
		return user;
	}
	return user.id ?? user.email ?? "anonymous";
}

/**
 * Server-side feature flag check.
 *
 *   const enabled = await isEnabled(user, "new-onboarding");
 *
 * Returns the configured fallback (default `false`) when PostHog isn't
 * configured — never throws, never blocks request paths.
 */
export async function isEnabled(
	user: Identity | string,
	flag: string,
	opts: FlagOpts & { fallback?: boolean } = {},
): Promise<boolean> {
	const client = getClient();
	if (!client) {
		return opts.fallback ?? false;
	}
	try {
		const result = await client.isFeatureEnabled(flag, distinctIdOf(user), {
			groups: opts.groups,
			personProperties: opts.properties as Record<string, string>,
		});
		return Boolean(result);
	} catch {
		return opts.fallback ?? false;
	}
}

/**
 * Multi-variant feature flag check (used for A/B tests).
 *
 *   const variant = await getVariant(user, "homepage-hero");  // "control" | "treatment" | null
 */
export async function getVariant(
	user: Identity | string,
	flag: string,
	opts: FlagOpts = {},
): Promise<string | null> {
	const client = getClient();
	if (!client) {
		return null;
	}
	try {
		const result = await client.getFeatureFlag(flag, distinctIdOf(user), {
			groups: opts.groups,
			personProperties: opts.properties as Record<string, string>,
		});
		if (typeof result === "string") {
			return result;
		}
		if (typeof result === "boolean") {
			return result ? "treatment" : "control";
		}
		return null;
	} catch {
		return null;
	}
}

export async function getAllFlags(
	user: Identity | string,
	opts: FlagOpts = {},
): Promise<Record<string, boolean | string>> {
	const client = getClient();
	if (!client) {
		return {};
	}
	try {
		const result = await client.getAllFlags(distinctIdOf(user), {
			groups: opts.groups,
			personProperties: opts.properties as Record<string, string>,
		});
		return result ?? {};
	} catch {
		return {};
	}
}

/** Cleanly flush + close the PostHog client (call during graceful shutdown). */
export async function shutdownFeatureFlags() {
	if (cached) {
		await cached.shutdown();
		cached = null;
	}
}
