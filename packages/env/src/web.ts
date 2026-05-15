import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	client: {
		// URLs
		NEXT_PUBLIC_APP_URL: z.url(),
		NEXT_PUBLIC_WEB_APP_URL: z.url().optional(),
		NEXT_PUBLIC_MARKETING_URL: z.url().optional(),
		NEXT_PUBLIC_ADMIN_URL: z.url().optional(),

		// PostHog
		NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
		NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),

		// Google Analytics 4
		NEXT_PUBLIC_GA_ID: z.string().optional(),

		// Sentry
		NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),

		// Branding
		NEXT_PUBLIC_BRAND_NAME: z.string().default("stack/saas"),
		NEXT_PUBLIC_SUPPORT_EMAIL: z.string().optional(),
	},
	runtimeEnv: {
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NEXT_PUBLIC_WEB_APP_URL: process.env.NEXT_PUBLIC_WEB_APP_URL,
		NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL,
		NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
		NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
		NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
		NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
		NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
		NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
		NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
	},
	emptyStringAsUndefined: true,
});
