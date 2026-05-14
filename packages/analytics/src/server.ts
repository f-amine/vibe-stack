import "server-only";
import { env } from "@starter-saas/env/server";
import { PostHog } from "posthog-node";
import type { EventName, EventProps } from "./events";

let _client: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
	if (!env.POSTHOG_KEY) return null;
	if (_client) return _client;
	_client = new PostHog(env.POSTHOG_KEY, {
		host: env.POSTHOG_HOST ?? "https://us.i.posthog.com",
		flushAt: 1,
		flushInterval: 0,
	});
	return _client;
}

type Capture = {
	event: EventName;
	distinctId: string;
	properties?: EventProps;
	groups?: Record<string, string>;
};

export async function captureServer({
	event,
	distinctId,
	properties,
	groups,
}: Capture) {
	const ph = getPostHogServer();
	if (!ph) return;
	ph.capture({ event, distinctId, properties, groups });
	await ph.shutdown();
}

export async function identifyServer(
	distinctId: string,
	properties: EventProps,
) {
	const ph = getPostHogServer();
	if (!ph) return;
	ph.identify({ distinctId, properties });
	await ph.shutdown();
}
