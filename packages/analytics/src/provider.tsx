"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { type ReactNode, useEffect } from "react";

type Props = {
	apiKey: string | undefined;
	proxyHost?: string;
	children: ReactNode;
};

export function AnalyticsProvider({ apiKey, proxyHost, children }: Props) {
	useEffect(() => {
		if (!apiKey) return;
		posthog.init(apiKey, {
			api_host: proxyHost ?? "/ingest",
			ui_host: "https://us.posthog.com",
			capture_pageview: "history_change",
			capture_pageleave: true,
			person_profiles: "identified_only",
			defaults: "2025-05-24",
		});
	}, [apiKey, proxyHost]);

	return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
