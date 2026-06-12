# vibestack

**The SaaS starter where Claude writes the rest.**

An opinionated, AI-first SaaS starter — full stack pre-wired, every infra decision pre-made, every Claude Code skill you need vendored in the repo. You bring the business logic. Claude does the plumbing.

Works for two crowds:

- **Devs** — clone, `pnpm dev`, ship.
- **Vibe-coders** — open Claude Code, run `/setup`, describe your idea, let the workflow drive.

Same repo. Same skills. Same outcome.

---

## What's in the box

- Next.js 16 + React 19 + App Router (web, marketing, admin)
- Better Auth (email/pw, magic-link, Google, passkeys, 2FA, orgs, admin role, rate-limit)
- Postgres + Drizzle, tRPC v11 + Tanstack Query, Zod v4 validation
- Tailwind v4 + shadcn + dark mode
- Polar.sh billing wired end-to-end (sandbox + prod)
- Resend + React Email, Cloudflare R2 storage + nightly `pg_dump` → R2
- PostHog + GA4 analytics, Sentry errors, next-intl (EN + FR)
- Dokploy + docker-compose deploy, GitHub Actions CI
- Biome v2, Vitest + Playwright + a11y suite

Full ADR set under `docs/adr/`. Decisions you don't have to re-make.

## What's NOT in the box

- App-level AI features. The stack is "AI-native dev" — not "AI SaaS template". Add `ai` SDK or whatever model wrapper you want when you build your features.
- A name. `npx create-vibestack` asks for one — or run `pnpm rename` after cloning.
- A wall of required API keys. **Zero-key boot**: the app runs with just a database and an auth secret. Every third-party integration (email, billing, storage, OAuth, analytics, errors) is optional and degrades gracefully until you add its key.

## The vibestack workflow

Open Claude Code in this repo. Skills come vendored — no install step:

```
new feature   /grill-with-docs  →  /to-prd  →  /to-issues  →  /tdd  →  /review
bug           /diagnose  →  /tdd
refactor      /improve-codebase-architecture  →  ADR draft  →  /to-issues
new idea      /prototype  (throwaway to flush out the design)
```

Each skill is a short, opinionated playbook. They share a domain model (`CONTEXT.md`) and a decision log (`docs/adr/`) so multiple Claude sessions stay coherent.

See `.claude/skills/README.md` for the full catalogue.

## Quickstart

One command, both crowds:

```bash
npx create-vibestack my-saas
```

The wizard clones the template and walks you through:

1. **Your product name** — renames the `@vibestack/*` scope and every brand string for you (lockfile-safe).
2. **Feature toggles** — email, billing, storage, Google sign-in, analytics, Sentry, French locale, the video swarm. Pick what you want; skip the rest.
3. **API keys** for the features you enabled — every single one skippable, with the signup URL printed next to it.
4. Writes `.env` with a generated `BETTER_AUTH_SECRET`.
5. Offers to run `pnpm install`, start Postgres (Docker), and push the schema.

When it finishes, `pnpm dev` gives you three apps:

- `http://localhost:3001` — your authed product
- `http://localhost:3000` — your marketing site + docs + blog
- `http://localhost:3002` — admin dashboard

**No keys? No problem.** Auth emails (magic links, verification, password reset) print to your terminal until you add a Resend key. Billing UI stays hidden until you add Polar. File storage tells you it's not configured only if you actually use it. `/api/health` reports unconfigured optional services as `disabled`.

### Vibe-coder track

After `npx create-vibestack`, open the folder in Claude Code. Run `/setup` if you want a conversational hand to finish configuring keys (it knows every signup URL and free tier), or just describe what you want to build — the workflow above takes it from there.

### Dev track — manual path

Already cloned the repo (or prefer doing it by hand)?

```bash
git clone https://github.com/<you>/vibestack.git my-saas
cd my-saas
pnpm install
pnpm db:start
cp .env.example .env
# only the core vars are needed to boot:
#   DATABASE_URL          — default matches pnpm db:start
#   BETTER_AUTH_SECRET    — openssl rand -base64 32
#   APP_URL / CORS_ORIGIN / BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL — localhost defaults
pnpm db:push
pnpm dev
```

That's a fully working app — sign-up, sessions, orgs, the lot. Emails print to your terminal until you add Resend; add the other keys whenever the feature matters to you.

Prefer the wizard inside an existing clone? `pnpm init:app` runs the same interactive flow (rename + feature toggles + `.env`).

Need the full env-var key-by-key list? See [`.claude/skills/setup/env-reference.md`](.claude/skills/setup/env-reference.md). Deploying? See [`docs/deploy/production-env.md`](docs/deploy/production-env.md).

## Common commands

```bash
pnpm dev                      # turbo dev across all apps
pnpm dev:web                  # just the product app (faster startup; also dev:marketing, dev:admin)
pnpm build                    # turbo build
pnpm check                    # biome format + lint
pnpm typecheck                # tsc across packages
pnpm test                     # vitest
pnpm test:e2e                 # playwright

# Database
pnpm db:start                 # docker postgres
pnpm db:push                  # apply schema directly (dev)
pnpm db:generate              # generate SQL migration
pnpm db:migrate               # apply migrations (prod)
pnpm db:studio                # drizzle studio UI
pnpm db:seed                  # seed demo data

# Auth schema regen after editing packages/auth plugins
pnpm auth:generate

# Email preview
pnpm email:dev                # react-email at :3010

# First-run / branding
pnpm init:app                 # interactive wizard: name, features, keys, .env
pnpm rename <name>            # rename @vibestack scope + brand strings only

# Skills maintenance
pnpm skills:update            # pull latest upstream skills into .claude/skills/
```

## Renaming for your product

`npx create-vibestack` and `pnpm init:app` already do this as their first step. If you only want the rename:

```bash
pnpm rename my-product
pnpm install   # regenerates pnpm-lock.yaml for the new scope
```

Unlike a raw `sed` over the tree, `pnpm rename` never touches `pnpm-lock.yaml`, skips `node_modules` / build output / binary assets, and handles case variants (`vibestack` / `Vibestack` / `VIBESTACK`). Review the diff before committing. Drop your own copy on the marketing landing hero.

## Deploying with Dokploy

1. Provision a small VPS (Hetzner / DigitalOcean / Vultr).
2. Install Dokploy via its one-liner.
3. Point a Compose service at `docker-compose.yml` in this repo.
4. Fill `.env.production` — see [`docs/deploy/production-env.md`](docs/deploy/production-env.md) for what's required vs optional in production.
5. Map domains to apps:
   - `marketing.example.com` → `marketing:3000`
   - `app.example.com` → `web:3001`
   - `admin.example.com` → `admin:3002`
6. Enable Let's Encrypt SSL via the Dokploy UI.
7. The `backup` container runs `pg_dump` nightly → R2 (30-day retention).

Restore: `./scripts/restore-r2.sh` (latest dump) or pass a specific key.

## Power-user: 24/7 autonomous loop

Optional. Ship while you sleep — a long-running Claude swarm that picks up open `triaged` issues, implements them, opens PRs.

Setup + the prompts live under `.ruflo/`. See [`.ruflo/README.md`](.ruflo/README.md) for the runbook and risks.

## Architecture decisions

- `docs/adr/0001-tech-stack.md` — why this stack
- `docs/adr/0002-monorepo-shape.md` — workspace layout + import rules
- `docs/adr/0003-passkey-plugin.md` — Better Auth passkey choice
- `docs/adr/0004-ai-first-positioning.md` — why vibestack is positioned the way it is

Append new ADRs as numbered files. Reference them from `CONTEXT.md`.

## Hard rules

- Don't touch `.env`, `.env.*`, `*.key`, `*.pem`, `secrets/*`.
- Don't bump major dep versions without an ADR.
- Don't push to `main` — branch → PR → CI → squash merge.
- Don't `--no-verify`.

## Credits

Initial scaffold via [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack). Workflow skills vendored from [mattpocock/skills](https://github.com/mattpocock/skills). Extended into vibestack with marketing/admin apps, Fumadocs, Resend, R2, PostHog/GA, Sentry, next-intl, Dokploy compose + R2 backup, and the full Claude Code skill set.
