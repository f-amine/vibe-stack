"use client";

import posthog from "posthog-js";
import * as React from "react";

type Status = "loading" | "ready";

type FlagsContextValue = {
	status: Status;
	getFlag: (key: string) => boolean | string | undefined;
	subscribe: (cb: () => void) => () => void;
};

const FlagsContext = React.createContext<FlagsContextValue | null>(null);

type ProviderProps = {
	children: React.ReactNode;
	/**
	 * Pre-fetched flag map from the server (e.g. via `getAllFlags()` in the
	 * root layout). Lets `useFlag` return the right answer on first paint
	 * without a flicker before PostHog hydrates.
	 */
	bootstrap?: Record<string, boolean | string>;
};

export function FeatureFlagsProvider({ children, bootstrap }: ProviderProps) {
	const [status, setStatus] = React.useState<Status>(() =>
		bootstrap && Object.keys(bootstrap).length > 0 ? "ready" : "loading",
	);
	const flagsRef = React.useRef<Record<string, boolean | string>>(
		bootstrap ?? {},
	);
	const listenersRef = React.useRef<Set<() => void>>(new Set());

	React.useEffect(() => {
		const notify = () => {
			for (const listener of listenersRef.current) {
				listener();
			}
		};

		const handler = () => {
			try {
				const next: Record<string, boolean | string> = { ...flagsRef.current };
				const map = (
					posthog as unknown as {
						featureFlags?: {
							getFlags?: () => string[];
							getFlagVariants?: () => Record<string, string | boolean>;
						};
					}
				).featureFlags;
				const flagsList = map?.getFlags?.() ?? [];
				for (const key of flagsList) {
					next[key] = true;
				}
				const variants = map?.getFlagVariants?.() ?? {};
				for (const [key, value] of Object.entries(variants)) {
					next[key] = value;
				}
				flagsRef.current = next;
				setStatus("ready");
				notify();
			} catch {
				/* ignore */
			}
		};

		try {
			posthog.onFeatureFlags?.(handler);
		} catch {
			/* ignore */
		}

		// In case PostHog has already loaded the flags before this effect runs.
		handler();
	}, []);

	const value = React.useMemo<FlagsContextValue>(
		() => ({
			status,
			getFlag: (key) => flagsRef.current[key],
			subscribe: (cb) => {
				listenersRef.current.add(cb);
				return () => {
					listenersRef.current.delete(cb);
				};
			},
		}),
		[status],
	);

	return (
		<FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>
	);
}

function useFlagsContext(): FlagsContextValue {
	const ctx = React.useContext(FlagsContext);
	if (ctx) {
		return ctx;
	}
	// Provider missing → degrade gracefully (everything off, no flicker).
	return {
		status: "ready",
		getFlag: () => undefined,
		subscribe: () => () => {
			/* noop */
		},
	};
}

/**
 * Returns true when the named feature flag is enabled for the current user.
 *
 *   const newOnboarding = useFlag("new-onboarding");
 */
export function useFlag(key: string, fallback = false): boolean {
	const ctx = useFlagsContext();
	const subscribe = React.useCallback(
		(cb: () => void) => ctx.subscribe(cb),
		[ctx],
	);
	const getSnapshot = React.useCallback(() => {
		const value = ctx.getFlag(key);
		if (typeof value === "boolean") {
			return value;
		}
		if (typeof value === "string") {
			return value !== "false" && value.length > 0;
		}
		return fallback;
	}, [ctx, key, fallback]);
	return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Returns the variant string for a multi-variant flag, or `null`.
 */
export function useFlagVariant(key: string): string | null {
	const ctx = useFlagsContext();
	const subscribe = React.useCallback(
		(cb: () => void) => ctx.subscribe(cb),
		[ctx],
	);
	const getSnapshot = React.useCallback(() => {
		const value = ctx.getFlag(key);
		if (typeof value === "string") {
			return value;
		}
		if (typeof value === "boolean") {
			return value ? "treatment" : "control";
		}
		return null;
	}, [ctx, key]);
	return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
