# Project memory for Claude Code

Pre-load this file when working in this repo.

## Stack

Turborepo + pnpm; Next.js 16 + React 19; Tailwind v4 + shadcn; Better Auth 1.6 (email/pw, magic-link, Google, passkeys, 2FA, org plugin, admin plugin, rate-limit); Drizzle 0.45 + Postgres; tRPC v11; Zod v4; Polar.sh billing; Resend + React Email; Cloudflare R2; PostHog + GA4; Sentry; next-intl (EN + FR); Biome v2; Vitest + Playwright; Dokploy + docker-compose; nightly `pg_dump` → R2.

## Workflow

Follow the Mattpocock skills workflow:

- Design: `/grill-with-docs` → `/to-prd` → `/to-issues`
- Build: `/tdd` → `/review`
- Bug: `/diagnose` → `/tdd`
- Refactor: `/improve-codebase-architecture` → ADR draft → `/to-issues`

ADRs live in `docs/adr/`. Living domain doc is `CONTEXT.md`. Update both when behaviour changes.

## Key commands

```
pnpm dev                       # turbo dev across all apps
pnpm --filter web dev          # single app
pnpm db:start                  # docker postgres
pnpm db:push                   # apply schema (dev)
pnpm db:generate               # generate migration
pnpm db:migrate                # apply migrations (prod)
pnpm db:studio                 # drizzle studio
pnpm auth:generate             # regen auth schema from better-auth config
pnpm email:dev                 # react-email preview at :3010
pnpm check                     # biome format + lint
pnpm typecheck                 # tsc across packages
pnpm test                      # vitest
pnpm test:e2e                  # playwright
```

## Don't

- Don't touch `.env`, `.env.*`, `*.key`, `*.pem`, `secrets/*`.
- Don't bump major dep versions.
- Don't push to `main`. Branch → PR → CI → squash merge.
- Don't `--no-verify`.

## See

- `AGENTS.md` — full agent ops guide
- `CONTEXT.md` — domain glossary + invariants
- `docs/adr/` — decision records
- `.claude/skills/README.md` — skill index
- `.ruflo/README.md` — autonomous loop
