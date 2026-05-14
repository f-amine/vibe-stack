"use client";
import posthog from "posthog-js";
import type { EventName, EventProps } from "./events";

export function track(event: EventName, properties?: EventProps) {
	posthog.capture(event, properties);
}

export function identify(distinctId: string, properties?: EventProps) {
	posthog.identify(distinctId, properties);
}

export function reset() {
	posthog.reset();
}

export function gaTrack(event: string, params?: Record<string, unknown>) {
	if (typeof window === "undefined") return;
	const w = window as unknown as { gtag?: (...args: unknown[]) => void };
	w.gtag?.("event", event, params);
}

export { posthog };
