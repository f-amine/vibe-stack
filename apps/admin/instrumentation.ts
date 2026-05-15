import { initSentry } from "@starter-saas/analytics/sentry";

export async function register() {
	await initSentry({ app: "admin" });
}
