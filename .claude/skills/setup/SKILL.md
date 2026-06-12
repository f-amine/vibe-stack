---
name: setup
description: Conversational first-time setup for a freshly cloned vibestack repo. Progressive model — Phase 1 gets a running app in ~2 minutes (Postgres + a generated BETTER_AUTH_SECRET, no third-party keys needed), Phase 2 enables optional features (Resend, Polar, R2, Google OAuth, analytics, Sentry) one at a time when the user wants them. Use when the user has just cloned vibestack and wants help getting it running, or asks to "set up the project / set up env / get this running / enable billing / add email".
---

<what-to-do>

You are walking a user through setting up a vibestack repo. The user may be a developer or a non-developer (vibe-coder). Assume nothing — confirm each step worked before moving to the next.

**The model is progressive.** vibestack has zero-key boot: the app runs with only a database and an auth secret. Everything third-party is optional and degrades gracefully:

- No Resend key → auth emails (magic links, verification, password reset) **print to the dev console** in development. Sign-up and magic-link sign-in still work — the user copies the link out of their terminal.
- No Polar token → the billing plugin doesn't mount and billing UI hides.
- No R2 vars → file storage throws a clear "not configured" error only when actually used.
- `/api/health` reports unconfigured optional services as `disabled` (not errors).

So: **never block the user on collecting API keys.** Get the app running first, enable features after.

**Check first:** if the user ran `npx create-vibestack` or `pnpm init:app`, the wizard already did most of Phase 1 (and possibly some of Phase 2) — `.env` exists with a generated secret and any keys they pasted. Ask which features they skipped and jump straight to enabling those. If they cloned by hand, run both phases.

## Phase 1 — Running app (~2 minutes, zero third-party keys)

1. Confirm the toolchain: Node 22+, pnpm 10+, Docker running.
2. `pnpm install`.
3. Create `.env`: either offer `pnpm init:app` (interactive wizard — handles name, features, keys, secret generation in one pass) or manually `cp .env.example .env`.
4. If manual: generate the secret with `openssl rand -base64 32`, have the user paste it into `BETTER_AUTH_SECRET=` themselves (not into chat).
5. Confirm the core vars — local defaults all work out of the box:
   - `DATABASE_URL` — matches the docker postgres from `pnpm db:start`.
   - `BETTER_AUTH_SECRET` — the generated string (≥ 32 chars).
   - `APP_URL` / `CORS_ORIGIN` / `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` — `http://localhost:3001`.
6. `pnpm db:start`, verify Postgres is healthy (`docker ps`).
7. `pnpm db:push`.
8. `pnpm dev` (or `pnpm dev:web` for just the product app). Confirm `:3001` (web) and `:3000` (marketing) load.
9. Have the user sign up at `http://localhost:3001` — the verification/magic-link email prints in the terminal running dev. That's expected, not a bug. Tell them so before they ask.

Phase 1 done = working auth, orgs, dashboard, no external accounts created.

## Phase 2 — Enable features when needed

Each item is independent and optional. Ask which ones the user wants now; skip the rest — they can re-run `/setup` anytime. For each: "Do you already have a `<service>` account?" — if no, give the signup URL and the exact free-tier pick. Then they paste the key into `.env` themselves (never into chat) and restart `pnpm dev`.

In rough order of how soon people want them:

1. **Resend (real email)** — `RESEND_API_KEY` + `EMAIL_FROM`. [resend.com](https://resend.com) → API Keys. Free tier: 3k emails/mo, 1 domain. `EMAIL_FROM` can be `onboarding@resend.dev` on the trial. Until this is set, emails print to the console (dev) — production refuses to send.
2. **Polar (billing)** — `POLAR_ACCESS_TOKEN` (+ `POLAR_SUCCESS_URL`, product IDs later). [polar.sh](https://polar.sh) → switch to **sandbox** → Settings → Developer → create token. Sandbox is free and unlimited. Also flip `billing: { enabled: true }` in `apps/web/src/config/features.ts` if the wizard turned it off.
3. **Cloudflare R2 (file uploads + db backups)** — `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`. [Cloudflare R2](https://dash.cloudflare.com/?to=/:account/r2). 10 GB free, no egress fees. Create a bucket + API token (Object Read & Write). Endpoint is `https://<account-id>.r2.cloudflarestorage.com`. Also check `files` in `features.ts`.
4. **Google OAuth (sign-in-with-Google)** — `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client. Free.
5. **PostHog + GA4 (analytics)** — `NEXT_PUBLIC_POSTHOG_KEY` (+ host), `NEXT_PUBLIC_GA_ID`. [posthog.com](https://posthog.com) free tier: 1M events/mo.
6. **Sentry (errors)** — `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`. [sentry.io](https://sentry.io) free developer plan.
7. **Gemini + ElevenLabs (content swarms)** — `GOOGLE_AI_API_KEY` ([aistudio.google.com](https://aistudio.google.com), free tier) for `/blog-writer` + `/video-writer` scripts; `ELEVENLABS_API_KEY` ([elevenlabs.io](https://elevenlabs.io), free tier) for reel voice + SFX.

After each key: restart `pnpm dev`, verify the feature (send a real email, open `/dashboard/billing`, upload a file), then move on.

## Install toprank

vibestack routes all SEO, GEO (AI-search visibility), Google Ads, and Meta Ads work through the [toprank](https://github.com/nowork-studio/toprank) Claude Code plugin. Install it as part of first-run setup so the user can ask "audit my SEO" or "why is my traffic down" later and the right skill fires automatically.

Tell the user, in chat, to run these two commands inside Claude Code (not in their terminal):

```
/plugin marketplace add nowork-studio/toprank
/plugin install toprank@nowork-studio
```

After they confirm both succeeded:

- Mention the plugin handles OAuth lazily. The first time they invoke a skill that needs Google Search Console (e.g. `/toprank:seo-analysis`), Claude Code will walk them through Google OAuth and store the token under `~/.toprank/`. They do **not** need to fill `.env` for this — it lives outside the project.
- The Google Ads + Meta Ads MCPs (`NotFair-GoogleAds`, `NotFair-MetaAds`) are already wired in `.mcp.json` and auto-connect when they open the repo. First Ads command will prompt the user to sign in once at `notfair.co`.
- Post-deployment, point Google Search Console at their production domain (`marketing.example.com`). Once verified, every `/toprank:seo-analysis` call pulls real ranking data. The optional `scripts/seo-nightly.example.sh` shows how to wire a nightly headless audit in CI.

If the user skips this step, note it for later — `/setup` can be re-run, and `/toprank:*` skills will just be unavailable until they install the plugin.

## Hard rules

- **Never read `.env` files.** Hard-blocked by repo permissions and a footgun anyway. If you need to know whether a key is set, ask the user (or check `/api/health`, which names services without leaking values).
- **Never print key values back to the user.** Echo the variable *name* only.
- **Never commit `.env`.** Verify `.gitignore` covers it before you finish.
- If `BETTER_AUTH_SECRET` is generated, run `openssl rand -base64 32` and tell the user to paste it themselves — do not log it to chat scrollback.
- Stop the moment a step fails. Don't paper over Postgres connection errors by skipping ahead — debug them.
- Never block Phase 1 on a third-party signup. Keys are Phase 2.

## Recommended dialogue style

Use short, single-question turns. After each user response, restate what you understood, run the next command, and confirm output.

```
You: Run `pnpm install` — should take ~60s. Tell me when it finishes or paste any error you see.
User: done
You: Good. Want the wizard (`pnpm init:app` — asks your product name + features, writes .env for you) or manual (`cp .env.example .env`)?
```

Skip ahead when the user clearly knows what they're doing. Slow down when they ask "what does that do?"

## Done definition

**Phase 1 is done when:**

- [ ] `pnpm dev` is running with no errors.
- [ ] `http://localhost:3001` shows the sign-in page.
- [ ] Signup works — the verification/magic-link email appears in the dev terminal (or, if Resend is configured, in the Resend dashboard / inbox).

**Phase 2 has no "done"** — it's a menu. End by telling the user what's still disabled (per `/api/health`) and that they can re-run `/setup` to enable anything later.

When done, suggest the next step:

> "You're set up. Next: describe the SaaS you want to build. I'll walk you through it with `/grill-with-docs` → `/to-prd` → `/to-issues` → `/tdd`. Or read the 'Build your first feature' tutorial in the docs app."

</what-to-do>

<supporting-info>

## Environment variable reference

See [env-reference.md](./env-reference.md) for the complete annotated list with signup links and what-it-does descriptions. Production deployment reference: `docs/deploy/production-env.md`.

## Troubleshooting

- **Postgres won't start** — check Docker daemon is running. `docker ps` should show no port-5432 collision. If it does, `pnpm db:down` and retry.
- **`pnpm db:push` fails with auth error** — `.env` `DATABASE_URL` must match `docker-compose.yml` postgres creds. Default works out of box.
- **Better Auth: invalid secret** — `BETTER_AUTH_SECRET` must be ≥32 chars. Regenerate with `openssl rand -base64 32`.
- **"Where did my magic link go?"** — no `RESEND_API_KEY` set, so the email printed in the terminal running `pnpm dev`. Scroll up or search for "magic".
- **Emails not sending with a Resend key** — Resend test mode only delivers to verified addresses. For trial keys, verify your own email at resend.com first.
- **Billing page is missing** — either `POLAR_ACCESS_TOKEN` is unset or `billing` is `enabled: false` in `apps/web/src/config/features.ts`. Both must be on.

</supporting-info>
