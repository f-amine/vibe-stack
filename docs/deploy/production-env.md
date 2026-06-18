# Production environment variables

Authoritative reference for the single env file consumed by every service in
`docker-compose.prod.yml` (`web`, `admin`, `marketing`, `migrate`, `backup`).
The compose `env_file` is `.env`, which is what Dokploy writes from its
Environment tab — so on Dokploy you just paste these into that tab. Deploying
the compose by hand instead? Create a `.env` next to it (or
`docker compose --env-file <file>`).

Source of truth for validation: `packages/env/src/server.ts` (server vars) and
`packages/env/src/web.ts` (client `NEXT_PUBLIC_*` vars). Empty strings are
treated as unset (`emptyStringAsUndefined`), so leave a line out rather than
setting it to `""`.

**Zero-key boot:** the apps boot with only the core vars below. Every
third-party integration is optional and degrades gracefully — `/api/health`
reports unconfigured features as `"disabled"` and still returns HTTP 200.

> Repo policy: never commit real `.env` files. This document is the template;
> paste the skeleton at the bottom into Dokploy's Environment tab (or onto the
> server as `.env`).

**Subdomain deploys (app.* + admin.* on one parent domain):** set
`AUTH_COOKIE_DOMAIN` to the shared parent with a leading dot (e.g.
`.example.com`) so the product and admin apps share one login. Without it the
session cookie is host-only and admin redirect-loops. Leave it unset for
single-host or local dev.

## Required — app refuses to boot without these

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | web, admin, migrate, backup | Inside the compose network the host is `postgres`, e.g. `postgresql://postgres:<password>@postgres:5432/vibestack`. Must match the `POSTGRES_*` values below. |
| `BETTER_AUTH_SECRET` | web, admin | Min 32 chars. Generate with `openssl rand -base64 32`. Rotating it invalidates all sessions. |
| `BETTER_AUTH_URL` | web, admin | Public URL of the web app, e.g. `https://app.example.com`. |
| `APP_URL` | web, admin | Public URL of the web app (same value as `BETTER_AUTH_URL` in most setups). |
| `CORS_ORIGIN` | web, admin | Allowed browser origin, e.g. `https://app.example.com`. |
| `NEXT_PUBLIC_APP_URL` | all apps | Public URL of the web app. Baked in at build time — rebuild images after changing it. |

## Compose infrastructure — required by docker-compose.prod.yml itself

These are read by compose variable interpolation (from the shell or a `.env`
file next to the compose file) **and** by the containers via `.env.production`.
Simplest setup: put them in `.env.production` and run
`docker compose --env-file .env.production -f docker-compose.prod.yml up -d`.

| Variable | Used by | Notes |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | postgres | No default — compose fails to start postgres without it. |
| `POSTGRES_USER` | postgres | Defaults to `postgres`. |
| `POSTGRES_DB` | postgres | Defaults to `vibestack`. |
| `REDIS_PASSWORD` | redis, web, admin | No default — redis refuses to start without it. |
| `REDIS_URL` | web, admin | Optional but pointless to omit when redis is running: `redis://default:<REDIS_PASSWORD>@redis:6379`. Without it, rate-limiting / secondary storage / outbox queue fall back to in-memory. |

## Optional — feature degrades or is disabled when unset

### Billing (Polar) — without a token the app boots with billing disabled

| Variable | Notes |
| --- | --- |
| `POLAR_ACCESS_TOKEN` | Checkout, subscriptions, and the billing portal are off without it. |
| `POLAR_SUCCESS_URL` | Post-checkout redirect, e.g. `https://app.example.com/dashboard?checkout=success`. |
| `POLAR_WEBHOOK_SECRET` | Required for webhooks to be verified once billing is on. |
| `POLAR_SERVER` | `sandbox` (default) or `production`. Set `production` for real money. |
| `POLAR_PRODUCT_ID_PRO` | Product id for the Pro plan. |
| `POLAR_PRODUCT_ID_TEAM` | Product id for the Team plan. |

### Email (Resend) — without a key, production refuses to send

| Variable | Notes |
| --- | --- |
| `RESEND_API_KEY` | Magic links, verification, and transactional email do not send in production without it (dev logs them to the console instead). |
| `EMAIL_FROM` | Sender, e.g. `vibestack <no-reply@mail.example.com>`. Health check reports email `degraded` if only one of key/from is set. |
| `EMAIL_REPLY_TO` | Optional reply-to address. |
| `RESEND_WEBHOOK_SECRET` | Needed to verify Resend delivery webhooks. |

### File storage + DB backups (Cloudflare R2) — without credentials, storage is disabled

| Variable | Notes |
| --- | --- |
| `R2_ACCOUNT_ID` | File uploads/downloads are disabled without the full credential set. |
| `R2_ACCESS_KEY_ID` | |
| `R2_SECRET_ACCESS_KEY` | |
| `R2_BUCKET` | |
| `R2_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com`. |
| `R2_PUBLIC_URL` | Public bucket URL for serving files directly. |
| `R2_BACKUP_PREFIX` | Defaults to `backups`. **The nightly `backup` service silently can't upload dumps without the R2 credential set** — if you skip R2, you have no offsite DB backups. |

### Auth extras

| Variable | Notes |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | "Sign in with Google" is hidden without them. |

### Analytics / errors

| Variable | Notes |
| --- | --- |
| `POSTHOG_KEY` | Server-side analytics + feature flags off without it. |
| `POSTHOG_HOST` | Defaults to `https://us.i.posthog.com`. |
| `POSTHOG_PERSONAL_API_KEY` / `POSTHOG_PROJECT_ID` | Only needed for the feature-flags admin API. |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Client-side analytics. Build-time. |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4. Build-time. |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error reporting off without them. |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Only needed to upload source maps at build time. |

### AI content agents (only needed if you run the blog/reel agents in prod)

| Variable | Notes |
| --- | --- |
| `GOOGLE_AI_API_KEY` (or `GEMINI_API_KEY`) | Blog/reel script + image generation. |
| `GEMINI_TEXT_MODEL` / `GEMINI_IMAGE_MODEL` | Defaults: `gemini-flash-latest` / `gemini-3.1-flash-image-preview`. |
| `ELEVENLABS_API_KEY` (or `ELEVEN_API_KEY`) | Reel voiceover + SFX. |
| `ELEVENLABS_DEFAULT_VOICE_ID` / `ELEVENLABS_TEXT_MODEL` | Have sensible defaults. |
| `OPENAI_API_KEY` | Optional fallback for the blog-writing agent. |
| `GITHUB_TOKEN` | Only for agent workflows that file issues / PRs. |

### Misc (all have defaults)

| Variable | Notes |
| --- | --- |
| `CRON_SECRET` | Shared secret protecting cron/job endpoints. Set it if you call them. |
| `AFFILIATE_COOKIE_NAME` | Default `aff_ref`. |
| `AFFILIATE_COOKIE_TTL_DAYS` | Default `30`. |
| `AFFILIATE_DEFAULT_RATE` | Default `0.2` (20%). |
| `REFERRAL_CREDIT_CENTS` | Default `2900`. |
| `REFERRAL_MAX_PENDING_PER_USER` | Default `5`. |

### Client URLs / branding (build-time, all optional)

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_WEB_APP_URL` | Web app URL as seen from marketing/admin. |
| `NEXT_PUBLIC_MARKETING_URL` | Marketing site URL. |
| `NEXT_PUBLIC_ADMIN_URL` | Admin app URL. |
| `NEXT_PUBLIC_BRAND_NAME` | Defaults to `vibestack`. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Shown in support links. |

`NODE_ENV` is forced to `production` inside the runtime images; you don't need
to set it.

## Migrations on deploy

`docker-compose.prod.yml` runs a one-shot `migrate` service before `web` and
`admin` start. It applies the SQL committed under `packages/db/src/migrations`
with `drizzle-kit migrate`. **It only applies what's committed**: generate
migrations locally with `pnpm db:generate`, commit them, then deploy. With an
empty migrations folder the service exits 0 and applies nothing — your schema
will be missing until you commit migrations.

## `.env.production` skeleton

Copy this onto the server (do **not** commit it):

```bash
# ── Core (required) ─────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:CHANGE_ME@postgres:5432/vibestack
BETTER_AUTH_SECRET=CHANGE_ME_32_CHARS_MIN_openssl_rand
BETTER_AUTH_URL=https://app.example.com
APP_URL=https://app.example.com
CORS_ORIGIN=https://app.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com

# ── Compose infrastructure (required) ───────────────────────────
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=vibestack
REDIS_PASSWORD=CHANGE_ME
REDIS_URL=redis://default:CHANGE_ME@redis:6379

# ── Billing: Polar (optional — billing disabled without it) ─────
# POLAR_ACCESS_TOKEN=
# POLAR_SUCCESS_URL=https://app.example.com/dashboard?checkout=success
# POLAR_WEBHOOK_SECRET=
# POLAR_SERVER=production
# POLAR_PRODUCT_ID_PRO=
# POLAR_PRODUCT_ID_TEAM=

# ── Email: Resend (optional — prod refuses to send without it) ──
# RESEND_API_KEY=
# EMAIL_FROM=vibestack <no-reply@mail.example.com>
# EMAIL_REPLY_TO=
# RESEND_WEBHOOK_SECRET=

# ── Storage + backups: Cloudflare R2 (optional — storage off,
#    nightly DB backups can't upload without it) ─────────────────
# R2_ACCOUNT_ID=
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
# R2_BUCKET=
# R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
# R2_PUBLIC_URL=
# R2_BACKUP_PREFIX=backups

# ── Google OAuth (optional — hides "Sign in with Google") ───────
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# ── Analytics / errors (optional) ───────────────────────────────
# POSTHOG_KEY=
# NEXT_PUBLIC_POSTHOG_KEY=
# NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
# NEXT_PUBLIC_GA_ID=
# SENTRY_DSN=
# NEXT_PUBLIC_SENTRY_DSN=

# ── Cron / jobs (optional) ──────────────────────────────────────
# CRON_SECRET=

# ── Branding / cross-app URLs (optional, build-time) ────────────
# NEXT_PUBLIC_MARKETING_URL=https://example.com
# NEXT_PUBLIC_ADMIN_URL=https://admin.example.com
# NEXT_PUBLIC_BRAND_NAME=vibestack
# NEXT_PUBLIC_SUPPORT_EMAIL=support@example.com
```
