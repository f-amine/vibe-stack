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
		// Optional: when set (e.g. ".example.com") the session cookie is
		// shared across all subdomains so the product (app.) and admin
		// (admin.) apps share one login. Leave unset for single-host / dev.
		AUTH_COOKIE_DOMAIN: z.string().optional(),

		// Google OAuth (Better Auth)
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

		// Polar (billing) — optional: without a token the app boots with
		// billing disabled (see @vibestack/billing/client).
		POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
		POLAR_SUCCESS_URL: z.url().optional(),
		POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
		POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),
		POLAR_PRODUCT_ID_PRO: z.string().min(1).optional(),
		POLAR_PRODUCT_ID_TEAM: z.string().min(1).optional(),

		// Resend (email) — optional: without a key, dev logs emails to the
		// console (magic links still work); production refuses to send.
		RESEND_API_KEY: z.string().min(1).optional(),
		RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
		EMAIL_FROM: z.string().min(3).optional(),
		EMAIL_REPLY_TO: z.string().optional(),

		// Cloudflare R2 (storage + backups) — optional: without credentials
		// the app boots with file storage disabled (see @vibestack/storage).
		R2_ACCOUNT_ID: z.string().min(1).optional(),
		R2_ACCESS_KEY_ID: z.string().min(1).optional(),
		R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		R2_BUCKET: z.string().min(1).optional(),
		R2_ENDPOINT: z.url().optional(),
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
		GEMINI_API_KEY: z.string().min(1).optional(),
		GEMINI_TEXT_MODEL: z.string().default("gemini-flash-latest"),
		GEMINI_IMAGE_MODEL: z.string().default("gemini-3.1-flash-image-preview"),

		// ElevenLabs (reel voiceover + sound effects)
		ELEVENLABS_API_KEY: z.string().min(1).optional(),
		ELEVEN_API_KEY: z.string().min(1).optional(),
		ELEVENLABS_DEFAULT_VOICE_ID: z.string().default("21m00Tcm4TlvDq8ikWAM"),
		ELEVENLABS_TEXT_MODEL: z.string().default("eleven_multilingual_v2"),

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
