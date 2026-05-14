import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),

		// Core
		APP_URL: z.url(),
		CORS_ORIGIN: z.url(),
		DATABASE_URL: z.string().min(1),

		// Better Auth
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),

		// Google OAuth (Better Auth)
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

		// Polar (billing)
		POLAR_ACCESS_TOKEN: z.string().min(1),
		POLAR_SUCCESS_URL: z.url(),
		POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
		POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),
		POLAR_PRODUCT_ID_PRO: z.string().min(1).optional(),
		POLAR_PRODUCT_ID_TEAM: z.string().min(1).optional(),

		// Resend (email)
		RESEND_API_KEY: z.string().min(1),
		EMAIL_FROM: z.string().min(3),

		// Cloudflare R2 (storage)
		R2_ACCOUNT_ID: z.string().min(1),
		R2_ACCESS_KEY_ID: z.string().min(1),
		R2_SECRET_ACCESS_KEY: z.string().min(1),
		R2_BUCKET: z.string().min(1),
		R2_ENDPOINT: z.url(),
		R2_PUBLIC_URL: z.url().optional(),

		// PostHog (server)
		POSTHOG_KEY: z.string().min(1).optional(),
		POSTHOG_HOST: z.url().default("https://us.i.posthog.com"),

		// Sentry (server)
		SENTRY_DSN: z.string().optional(),
		SENTRY_AUTH_TOKEN: z.string().optional(),

		// Optional Redis for rate-limit
		REDIS_URL: z.string().optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
