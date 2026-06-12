# Environment variable reference

Every variable validated by `packages/env/src/server.ts` (and the `NEXT_PUBLIC_*` set in `packages/env/src/web.ts`), grouped by whether you need it to boot vibestack locally.

`pnpm init:app` (or `npx create-vibestack`) writes a `.env` covering all of this — name, feature toggles, generated secret, and any keys you paste. This page is the manual reference.

## Required for boot

This is the complete list. No third-party account needed for any of it.

| Variable | What it is | Where to get it |
|----------|------------|-----------------|
| `DATABASE_URL` | Postgres connection string. | Default in `.env.example` works with `pnpm db:start`. |
| `BETTER_AUTH_SECRET` | Session signing secret (≥ 32 chars). | `openssl rand -base64 32` (the init wizard generates one for you). |
| `BETTER_AUTH_URL` | Where Better Auth runs. | `http://localhost:3001` (default) |
| `APP_URL` | Authed product URL. | `http://localhost:3001` |
| `CORS_ORIGIN` | Allowed origin for tRPC. | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_URL` | Same URL, exposed to the browser. | `http://localhost:3001` |

## Optional — flip on when you want the feature

Each block is independent. Without its keys the app still boots; the feature degrades or hides, and `/api/health` reports the service as `disabled`.

### Email — Resend

Without it: auth emails (magic link, verification, password reset) **print to the dev console** in development; production refuses to send. Sign-in still works in dev — copy the link from your terminal.

| Variable | Notes |
|----------|-------|
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys. Free tier: 3k emails/mo, 1 domain. |
| `EMAIL_FROM` | Sender address. `onboarding@resend.dev` works on the trial. |
| `EMAIL_REPLY_TO` | Reply-to header on transactional mail. |
| `RESEND_WEBHOOK_SECRET` | Track email delivery / opens. |

### Billing — Polar.sh

Without it: the billing plugin doesn't mount and billing UI hides. Also requires `billing: { enabled: true }` in `apps/web/src/config/features.ts`.

| Variable | Notes |
|----------|-------|
| `POLAR_ACCESS_TOKEN` | [polar.sh](https://polar.sh) → Sandbox → Settings → Developer → Create Token. Sandbox is free and unlimited. |
| `POLAR_SUCCESS_URL` | Post-checkout redirect, e.g. `http://localhost:3001/dashboard/billing/success`. |
| `POLAR_SERVER` | `sandbox` (default) or `production`. |
| `POLAR_WEBHOOK_SECRET` | Receive billing webhooks. Polar → Webhooks. |
| `POLAR_PRODUCT_ID_PRO` / `POLAR_PRODUCT_ID_TEAM` | Pre-wire your pricing tiers to Polar product IDs. |

### File storage — Cloudflare R2

Without it: file storage throws a clear "not configured" error only when actually used (uploads, backups). Also check `files` in `features.ts`.

| Variable | Notes |
|----------|-------|
| `R2_ACCOUNT_ID` | [Cloudflare dashboard](https://dash.cloudflare.com) → R2 → right sidebar. 10 GB free, no egress fees. |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 → Manage R2 API Tokens → Create (Object Read & Write). Secret shown once. |
| `R2_BUCKET` | Create a bucket in the R2 dashboard. |
| `R2_ENDPOINT` | `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | Only if you've enabled public access on the bucket. |
| `R2_BACKUP_PREFIX` | Key prefix for nightly `pg_dump` backups. Default `backups`. |

### Sign in with Google

Without it: the Google button doesn't appear; email/password, magic link, and passkeys all still work.

| Variable | Notes |
|----------|-------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client. |

### Analytics — PostHog + GA4

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Browser-side capture. [posthog.com](https://posthog.com), free tier 1M events/mo. |
| `POSTHOG_KEY` / `POSTHOG_HOST` | Server-side capture. |
| `POSTHOG_PERSONAL_API_KEY` / `POSTHOG_PROJECT_ID` | Admin operations (feature flags via API). |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement id. |

### Errors — Sentry

| Variable | Notes |
|----------|-------|
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | [sentry.io](https://sentry.io) project settings. |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Source-map upload during build. |

### Content swarms — Gemini + ElevenLabs

| Variable | Notes |
|----------|-------|
| `GOOGLE_AI_API_KEY` (or `GEMINI_API_KEY`) | `/blog-writer` + `/video-writer` script and image generation. [aistudio.google.com](https://aistudio.google.com). |
| `ELEVENLABS_API_KEY` (or `ELEVEN_API_KEY`) | Reel voiceover + SFX. [elevenlabs.io](https://elevenlabs.io). |
| `GEMINI_TEXT_MODEL` / `GEMINI_IMAGE_MODEL` / `ELEVENLABS_DEFAULT_VOICE_ID` / `ELEVENLABS_TEXT_MODEL` | Model/voice overrides. Sane defaults. |
| `OPENAI_API_KEY` | Optional OpenAI fallback for the blog-writing agent. |

### Everything else

| Variable | Feature |
|----------|---------|
| `REDIS_URL` / `REDIS_PASSWORD` | Production rate-limit + outbox queue. Not needed locally. |
| `GITHUB_TOKEN` | Autonomous-loop agents that file issues / open PRs. |
| `CRON_SECRET` | Shared secret for protected cron endpoints. |
| `AFFILIATE_*` | Affiliate cookie / payout tuning. Defaults are sane. |
| `REFERRAL_*` | Referral credit + cap tuning. Defaults are sane. |
| `NEXT_PUBLIC_BRAND_NAME` / `NEXT_PUBLIC_SUPPORT_EMAIL` | Branding strings. Default brand name comes from the rename. |
| `NEXT_PUBLIC_WEB_APP_URL` / `NEXT_PUBLIC_MARKETING_URL` / `NEXT_PUBLIC_ADMIN_URL` | Cross-app links when apps live on separate domains. |

## What does each service do?

- **Better Auth** — runs in-process, no external service, no key beyond `BETTER_AUTH_SECRET`.
- **Resend** *(optional)* — sends transactional email (welcome, magic-link, password-reset, invite). Without it, dev prints emails to the console; auth flows never 500 on a failed send.
- **Polar.sh** *(optional)* — checkout, subscriptions, invoices, dunning, tax. Sandbox mode is free and unlimited. Webhooks only matter on a deployed instance.
- **Cloudflare R2** *(optional)* — file uploads (avatars, attachments) + nightly Postgres backups. S3-compatible, generous free tier, no egress fees.
- **PostHog** *(optional)* — product analytics, session replay, feature flags.
- **Sentry** *(optional)* — captures unhandled errors with source maps. Hooks into Next.js + tRPC out of the box.

Production values for all of this: see `docs/deploy/production-env.md`.
