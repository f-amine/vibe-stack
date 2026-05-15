// Lazy Sentry init that no-ops when DSN is unset. Each app imports + calls
// from its `instrumentation.ts` so the same boot logic runs on Node + Edge.

let inited = false;

export type SentryInitOptions = {
	app: "web" | "marketing" | "admin";
};

export async function initSentry(opts: SentryInitOptions): Promise<void> {
	if (inited) {
		return;
	}
	const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
	if (!dsn) {
		return;
	}
	const Sentry = await import("@sentry/nextjs");
	Sentry.init({
		dsn,
		environment:
			process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
		release: process.env.SENTRY_RELEASE,
		tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
		// Sample replays sparingly — the user can crank these in env once they
		// know what they want.
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 1.0,
		initialScope: {
			tags: { app: opts.app },
		},
	});
	inited = true;
}
