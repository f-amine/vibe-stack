# Environment variable reference

Every variable validated by `packages/env/src/server.ts`, grouped by whether you need it to boot vibestack locally.

## Required for boot

| Variable | What it is | Where to get it |
|----------|------------|-----------------|
| `DATABASE_URL` | Postgres connection string. | Default in `.env.example` works with `pnpm db:start`. |
| `BETTER_AUTH_SECRET` | Session signing secret (≥ 32 chars). | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Where Better Auth runs. | `http://localhost:3001` (default) |
| `APP_URL` | Authed product URL. | `http://localhost:3001` |
| `CORS_ORIGIN` | Allowed origin for tRPC. | `http://localhost:3001` |
| `RESEND_API_KEY` | Transactional email. | [resend.com](https://resend.com) → API Keys. Free tier: 3k emails/mo. |
| `EMAIL_FROM` | Sender address. | `onboarding@resend.dev` works on the trial; switch to your own verified domain later. |
| `POLAR_ACCESS_TOKEN` | Billing. | [polar.sh](https://polar.sh) → Sandbox → Settings → Developer → Create Token. |
| `POLAR_SUCCESS_URL` | Post-checkout redirect. | `http://localhost:3001/dashboard/billing/success` |
| `R2_ACCOUNT_ID` | Cloudflare account. | [Cloudflare dashboard](https://dash.cloudflare.com) → R2 → right sidebar. |
| `R2_ACCESS_KEY_ID` | R2 token (write). | R2 → Manage R2 API Tokens → Create. |
| `R2_SECRET_ACCESS_KEY` | R2 token (write). | Shown once at token creation. Save it. |
| `R2_BUCKET` | R2 bucket name. | Create a bucket in the R2 dashboard. |
| `R2_ENDPOINT` | R2 S3 endpoint. | `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` |

## Optional — flip on when you want the feature

| Variable | Feature |
|----------|---------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | "Sign in with Google" button. [console.cloud.google.com](https://console.cloud.google.com) → OAuth 2.0 Client. |
| `POLAR_WEBHOOK_SECRET` | Receive billing webhooks. Polar → Webhooks. |
| `POLAR_SERVER=production` | Switch from sandbox to live billing. |
| `POLAR_PRODUCT_ID_PRO` / `POLAR_PRODUCT_ID_TEAM` | Pre-wire your pricing tiers to Polar product IDs. |
| `RESEND_WEBHOOK_SECRET` | Track email delivery / opens. |
| `EMAIL_REPLY_TO` | Reply-to header on transactional mail. |
| `R2_PUBLIC_URL` | If you've enabled public access on the bucket, the public CDN URL. |
| `POSTHOG_KEY` / `POSTHOG_HOST` | Product analytics. [posthog.com](https://posthog.com). |
| `POSTHOG_PERSONAL_API_KEY` / `POSTHOG_PROJECT_ID` | Admin operations (feature flags via API). |
| `SENTRY_DSN` | Error tracking. [sentry.io](https://sentry.io) project settings. |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Source-map upload during build. |
| `REDIS_URL` / `REDIS_PASSWORD` | Production rate-limit + outbox queue. |
| `GOOGLE_AI_API_KEY` | Gemini-powered content / image generation scripts. [aistudio.google.com](https://aistudio.google.com). |
| `OPENAI_API_KEY` | Optional OpenAI fallback for the blog-writing agent. |
| `GITHUB_TOKEN` | Autonomous-loop agents that file issues / open PRs. |
| `CRON_SECRET` | Shared secret for protected cron endpoints. |
| `AFFILIATE_*` | Affiliate cookie / payout tuning. Defaults are sane. |
| `REFERRAL_*` | Referral credit + cap tuning. Defaults are sane. |

## What does each service do?

- **Resend** — sends all transactional email (welcome, magic-link, password-reset, invite, billing receipts). Without it, sign-in by magic-link doesn't work.
- **Cloudflare R2** — file uploads (user avatars, attachments) + nightly Postgres backups. S3-compatible, generous free tier, no egress fees.
- **Polar.sh** — handles checkout, subscriptions, invoices, dunning, and tax. Sandbox mode is free and unlimited.
- **PostHog** *(optional)* — product analytics, session replay, feature flags. Self-hostable later if you want.
- **Sentry** *(optional)* — captures unhandled errors with source maps. Hooks into Next.js + tRPC out of the box.
- **Better Auth** — runs in-process, no external service.
- **Polar webhooks** — needed if you want subscription cancellations and renewals to reflect locally. Skip for local dev; set up once on the deployed instance.
