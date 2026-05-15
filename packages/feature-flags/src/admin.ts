import "server-only";
import { env } from "@starter-saas/env/server";

// PostHog REST admin API — read + update flag definitions. Only used by the
// admin app; never exposed to clients. Returns null when configuration is
// missing so the admin page can render a friendly setup banner.

export type FlagDefinition = {
	id: number;
	key: string;
	name: string;
	active: boolean;
	createdAt: string | null;
	rolloutPercentage: number | null;
	variants: { key: string; rolloutPercentage: number | null }[];
};

type RawFlag = {
	id: number;
	key: string;
	name?: string;
	active: boolean;
	created_at?: string | null;
	rollout_percentage?: number | null;
	filters?: {
		multivariate?: {
			variants?: { key: string; rollout_percentage?: number | null }[];
		};
	};
};

function apiConfig(): {
	base: string;
	token: string;
	projectId: string;
} | null {
	if (!env.POSTHOG_PERSONAL_API_KEY || !env.POSTHOG_PROJECT_ID) {
		return null;
	}
	const base = env.POSTHOG_HOST.replace(/\/$/, "");
	return {
		base,
		token: env.POSTHOG_PERSONAL_API_KEY,
		projectId: env.POSTHOG_PROJECT_ID,
	};
}

function authHeaders(token: string): HeadersInit {
	return {
		authorization: `Bearer ${token}`,
		"content-type": "application/json",
	};
}

function adapt(raw: RawFlag): FlagDefinition {
	return {
		id: raw.id,
		key: raw.key,
		name: raw.name ?? raw.key,
		active: raw.active,
		createdAt: raw.created_at ?? null,
		rolloutPercentage: raw.rollout_percentage ?? null,
		variants:
			raw.filters?.multivariate?.variants?.map((v) => ({
				key: v.key,
				rolloutPercentage: v.rollout_percentage ?? null,
			})) ?? [],
	};
}

export async function listFlags(): Promise<
	| { status: "ok"; flags: FlagDefinition[] }
	| { status: "unconfigured" }
	| { status: "error"; message: string }
> {
	const cfg = apiConfig();
	if (!cfg) {
		return { status: "unconfigured" };
	}
	try {
		const url = `${cfg.base}/api/projects/${cfg.projectId}/feature_flags/?limit=100`;
		const res = await fetch(url, {
			headers: authHeaders(cfg.token),
			cache: "no-store",
		});
		if (!res.ok) {
			return {
				status: "error",
				message: `posthog returned ${res.status}`,
			};
		}
		const body = (await res.json()) as { results?: RawFlag[] };
		return {
			status: "ok",
			flags: (body.results ?? []).map(adapt),
		};
	} catch (err) {
		return {
			status: "error",
			message: err instanceof Error ? err.message : "unknown",
		};
	}
}

export async function toggleFlag(
	id: number,
	active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const cfg = apiConfig();
	if (!cfg) {
		return { ok: false, error: "PostHog admin not configured" };
	}
	try {
		const url = `${cfg.base}/api/projects/${cfg.projectId}/feature_flags/${id}/`;
		const res = await fetch(url, {
			method: "PATCH",
			headers: authHeaders(cfg.token),
			body: JSON.stringify({ active }),
		});
		if (!res.ok) {
			const text = await res.text().catch(() => "");
			return {
				ok: false,
				error: `posthog returned ${res.status}: ${text.slice(0, 200)}`,
			};
		}
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "unknown",
		};
	}
}
