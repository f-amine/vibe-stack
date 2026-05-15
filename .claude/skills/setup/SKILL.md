---
name: setup
description: Conversational first-time setup for a freshly cloned vibestack repo. Walks the user through Postgres up, .env creation, BETTER_AUTH_SECRET generation, collecting third-party API keys (Resend, Cloudflare R2, Polar), running migrations, and starting the dev servers. Use when the user has just cloned vibestack and wants help getting it running, or asks to "set up the project / set up env / get this running".
---

<what-to-do>

You are walking a user through the first-time setup of a freshly cloned vibestack repo. The user may be a developer or a non-developer (vibe-coder). Assume nothing — confirm each step worked before moving to the next.

**Your goals, in order:**

1. Confirm the toolchain is in place (Node 22+, pnpm 10+, Docker).
2. Install dependencies (`pnpm install`).
3. Create `.env` from `.env.example` at repo root.
4. Generate `BETTER_AUTH_SECRET` and write it in.
5. Bring up Postgres (`pnpm db:start`) and verify it's healthy.
6. Walk the user through collecting **required** third-party keys. For each one, ask: "Do you already have a `<service>` account?" — if no, give them the signup URL and tell them exactly what plan/free-tier to pick. Then ask them to paste the key. **Never read or print the value of an existing `.env`.**
7. Apply schema with `pnpm db:push`.
8. Start dev with `pnpm dev`, confirm `:3001` (web) and `:3000` (marketing) load.
9. **Install the `toprank` plugin for SEO / GEO / Ads** — see "Install toprank" below.
10. Optionally walk through the **non-required** services (PostHog, Sentry, Google OAuth, Polar live mode).

**Required for boot** (the app crashes without these):
- `DATABASE_URL` — preset to docker default in `.env.example`. Confirm.
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`. Write inline.
- `BETTER_AUTH_URL`, `APP_URL`, `CORS_ORIGIN` — local defaults in `.env.example`. Confirm.
- `RESEND_API_KEY` + `EMAIL_FROM` — [resend.com signup](https://resend.com). Free tier: 3k emails/mo, 1 domain. EMAIL_FROM can be `onboarding@resend.dev` for the trial.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` — [Cloudflare R2](https://dash.cloudflare.com/?to=/:account/r2). 10 GB free. Create a bucket + API token (Object Read & Write).
- `POLAR_ACCESS_TOKEN` + `POLAR_SUCCESS_URL` — [polar.sh](https://polar.sh) → switch to sandbox → Settings → Developer → create token. SUCCESS_URL = `http://localhost:3001/dashboard/billing/success` for dev.

**Optional** (gate on a yes/no question — defaults are fine to skip):
- Google OAuth (`GOOGLE_CLIENT_ID`/`SECRET`) — only if the user wants Sign-in-with-Google.
- PostHog (`POSTHOG_KEY`/`HOST`) — analytics. Free tier 1M events/mo.
- Sentry (`SENTRY_DSN`/etc.) — error tracking.
- Polar product IDs (`POLAR_PRODUCT_ID_PRO`/`TEAM`) — only after they create products.
- Google Gemini / OpenAI keys — only for the content-gen agent scripts.
- Redis — only for production rate-limiting.
- GitHub token — only for autonomous-loop agents.

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

- **Never read `.env` files.** Hard-blocked by repo permissions and a footgun anyway. If you need to know whether a key is set, ask the user.
- **Never print key values back to the user.** Echo the variable *name* only.
- **Never commit `.env`.** Verify `.gitignore` covers it before you finish.
- If `BETTER_AUTH_SECRET` is generated, run `openssl rand -base64 32` and tell the user to paste it themselves — do not log it to chat scrollback.
- Stop the moment a step fails. Don't paper over Postgres connection errors by skipping ahead — debug them.

## Recommended dialogue style

Use short, single-question turns. After each user response, restate what you understood, run the next command, and confirm output.

```
You: Run `pnpm install` — should take ~60s. Tell me when it finishes or paste any error you see.
User: done
You: Good. Now `cp .env.example .env` and `openssl rand -base64 32`. Paste the random string into `BETTER_AUTH_SECRET=` in .env (don't paste it here). Done?
```

Skip ahead when the user clearly knows what they're doing. Slow down when they ask "what does that do?"

## Done definition

The setup is done when:

- [ ] `pnpm dev` is running with no errors.
- [ ] `http://localhost:3001` shows the sign-in page.
- [ ] Signup works (a magic-link arrives in the user's Resend dashboard *or* their inbox).
- [ ] The user can describe what each required service does and where to find its keys again.

When done, suggest the next step:

> "You're set up. Next: describe the SaaS you want to build. I'll walk you through it with `/grill-with-docs` → `/to-prd` → `/to-issues` → `/tdd`."

</what-to-do>

<supporting-info>

## Environment variable reference

See [env-reference.md](./env-reference.md) for the complete annotated list with signup links and what-it-does descriptions.

## Troubleshooting

- **Postgres won't start** — check Docker daemon is running. `docker ps` should show no port-5432 collision. If it does, `pnpm db:down` and retry.
- **`pnpm db:push` fails with auth error** — `.env` `DATABASE_URL` must match `docker-compose.yml` postgres creds. Default works out of box.
- **Better Auth: invalid secret** — `BETTER_AUTH_SECRET` must be ≥32 chars. Regenerate with `openssl rand -base64 32`.
- **Emails not sending** — Resend test mode only delivers to verified addresses. For trial keys, verify your own email at resend.com first.

</supporting-info>
