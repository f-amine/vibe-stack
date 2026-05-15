import { initSentry } from "@vibestack/analytics/sentry";

export async function register() {
	await initSentry({ app: "marketing" });
}
