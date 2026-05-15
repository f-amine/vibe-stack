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
		RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
		EMAIL_FROM: z.string().min(3),
		EMAIL_REPLY_TO: z.string().optional(),

		// Cloudflare R2 (storage + backups)
		R2_ACCOUNT_ID: z.string().min(1),
		R2_ACCESS_KEY_ID: z.string().min(1),
		R2_SECRET_ACCESS_KEY: z.string().min(1),
		R2_BUCKET: z.string().min(1),
		R2_ENDPOINT: z.url(),
		R2_PUBLIC_URL: z.url().optional(),
		R2_BACKUP_PREFIX: z.string().default("backups"),

		// PostHog (server + feature flags admin API)
		POSTHOG_KEY: z.string().min(1).optional(),
		POSTHOG_HOST: z.url().default("https://us.i.posthog.com"),
		POSTHOG_PERSONAL_API_KEY: z.string().optional(),
		POSTHOG_PROJECT_ID: z.string().optional(),

		// Sentry (errors)
		SENTRY_DSN: z.string().optional(),
		SENTRY_AUTH_TOKEN: z.string().optional(),
		SENTRY_ORG: z.string().optional(),
		SENTRY_PROJECT: z.string().optional(),

		// Redis (rate-limit / Better Auth secondary storage / outbox queue)
		REDIS_URL: z.string().optional(),
		REDIS_PASSWORD: z.string().optional(),

		// Google Gemini (asset + content generation agents)
		GOOGLE_AI_API_KEY: z.string().min(1).optional(),
		GEMINI_TEXT_MODEL: z.string().default("gemini-3.1-flash"),
		GEMINI_IMAGE_MODEL: z.string().default("gemini-3.1-flash-image-preview"),

		// Optional OpenAI fallback (for blog writing agent)
		OPENAI_API_KEY: z.string().optional(),

		// GitHub (for AI agent workflows that file issues / PRs)
		GITHUB_TOKEN: z.string().optional(),

		// Cron / job runner shared secret
		CRON_SECRET: z.string().optional(),

		// Affiliate program
		AFFILIATE_COOKIE_NAME: z.string().default("aff_ref"),
		AFFILIATE_COOKIE_TTL_DAYS: z.coerce.number().int().positive().default(30),
		AFFILIATE_DEFAULT_RATE: z.coerce.number().min(0).max(1).default(0.2),

		// Referral program
		REFERRAL_CREDIT_CENTS: z.coerce.number().int().min(0).default(2900),
		REFERRAL_MAX_PENDING_PER_USER: z.coerce
			.number()
			.int()
			.positive()
			.default(5),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
