# starter-saas

Opinionated, AI-agent-aware SaaS starter. Clone, rename, ship.

## Stack

- **Monorepo** — Turborepo + pnpm
- **Apps** — Next.js 16 + React 19 + App Router + React Compiler
  - `web` — authed product (`:3001`)
  - `marketing` — landing + MDX blog + Fumadocs docs (`:3000`)
  - `admin` — role-gated admin dashboard (`:3002`)
- **UI** — Tailwind v4 + shadcn + `next-themes` + Lucide + Sonner
- **Auth** — Better Auth 1.6 (email/pw, magic-link, Google OAuth, passkeys, 2FA, org plugin, admin plugin, rate-limit)
- **Billing** — Polar.sh via `@polar-sh/better-auth`
- **DB** — Drizzle 0.45 + Postgres (Dokploy self-host) + drizzle-zod
- **API** — tRPC v11 + Tanstack Query v5
- **Validation** — Zod v4
- **Forms** — React Hook Form + shadcn `<Form>`
- **i18n** — next-intl (EN + FR)
- **Email** — Resend + React Email
- **Storage** — Cloudflare R2 (S3-compatible)
- **Analytics** — PostHog (cloud, reverse-proxied) + Google Analytics 4
- **Errors** — Sentry
- **Tests** — Vitest + Testing Library + Playwright
- **Lint + format** — Biome v2
- **Env** — @t3-oss/env-nextjs
- **Deploy** — Dokploy + docker-compose, nightly `pg_dump` → R2 (30-day retention)
- **CI** — GitHub Actions
- **AI workflow** — Mattpocock skills + ruflo autonomous-loop

## Structure

```
apps/
  web/         marketing/      admin/
packages/
  api/   auth/  analytics/   billing/   config/  db/
  email/ env/   i18n/        storage/   ui/
docker/        scripts/       docs/adr/
.claude/skills/    .ruflo/        CONTEXT.md
```

See `docs/adr/0002-monorepo-shape.md` for full layout and import rules.

## Quick start

```bash
# 1. Clone + install
pnpm install

# 2. Start Postgres
pnpm db:start                              # docker compose up -d postgres
cp .env.example .env
# fill in BETTER_AUTH_SECRET (openssl rand -base64 32) + RESEND_API_KEY + R2 keys

# 3. Schema → DB
pnpm db:push

# 4. Run everything
pnpm dev
# web:        http://localhost:3001
# marketing:  http://localhost:3000
# admin:      http://localhost:3002
# email:      http://localhost:3010  (pnpm email:dev)
# drizzle UI: http://localhost:4983  (pnpm db:studio)
```

## Common commands

```bash
pnpm dev                              # turbo dev for all apps
pnpm --filter web dev                 # single app
pnpm build                            # turbo build
pnpm check                            # biome format + lint
pnpm typecheck                        # tsc across packages
pnpm test                             # vitest
pnpm test:e2e                         # playwright

# DB
pnpm db:start                         # docker compose up -d postgres
pnpm db:push                          # apply schema directly (dev)
pnpm db:generate                      # generate SQL migration
pnpm db:migrate                       # apply migrations (prod)
pnpm db:studio                        # drizzle studio UI

# Auth schema regen (after editing packages/auth/src/index.ts plugins)
pnpm auth:generate

# Email preview
pnpm email:dev
```

## Renaming the project

Replace `@starter-saas/` with `@<your-org>/` across the workspace:

```bash
# rough find/replace; review diff before committing
find . -type f \( -name "*.json" -o -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.md" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/.git/*" \
  -exec sed -i.bak 's|@starter-saas/|@your-org/|g; s|starter-saas|your-name|g' {} \;
find . -name "*.bak" -delete
pnpm install
```

## Deploying with Dokploy

1. Provision a VPS (Hetzner / DigitalOcean / Vultr).
2. Install Dokploy via its one-liner.
3. Create a Compose service pointing to this repo's `docker-compose.yml`.
4. Fill `.env.production` from `.env.example`.
5. Set domain → app port mappings:
   - `marketing.example.com` → `marketing:3000`
   - `app.example.com` → `web:3001`
   - `admin.example.com` → `admin:3002`
6. Let-me-encrypt SSL via Dokploy UI.
7. `backup` container runs nightly `pg_dump` → R2.

To restore: `./scripts/restore-r2.sh` (uses latest dump) or pass a specific key.

## AI workflow

See `AGENTS.md` and `CLAUDE.md`.

```
new feature  → /grill-with-docs → /to-prd → /to-issues → /tdd → /review
bug          → /diagnose → /tdd
refactor     → /improve-codebase-architecture → ADR → /to-issues
```

Run the 24/7 autonomous loop with ruflo:

```bash
tmux new -s ruflo-auto
ruflo hive-mind spawn "$(cat .ruflo/prompts/autonomous-loop.md)" --claude --max-agents 6
```

Full instructions in `.ruflo/README.md`.

## Decisions

- `docs/adr/0001-tech-stack.md`
- `docs/adr/0002-monorepo-shape.md`

Append new ADRs as numbered files. Reference them from `CONTEXT.md`.

## Credits

Initial scaffold via [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack). Extended with marketing/admin apps, Fumadocs, Resend, R2, PostHog/GA, Sentry, next-intl, Dokploy compose + R2 backup, Mattpocock skills + ruflo wiring.
