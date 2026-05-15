# ADR-0002 — Monorepo shape

**Status**: Accepted
**Date**: 2026-05-14

## Context

We have three apps (`web`, `marketing`, `admin`) and many cross-cutting concerns (auth, db, billing, email, storage, analytics, i18n, ui).

## Decision

```
vibestack/
├── apps/
│   ├── web/          # authed product (3001)
│   ├── marketing/    # landing + blog (MDX) + docs (Fumadocs) (3000)
│   └── admin/        # admin dashboard, role-gated (3002)
├── packages/
│   ├── api/          # tRPC routers + context
│   ├── auth/         # Better Auth config (+ Polar plugin)
│   ├── analytics/    # PostHog + GA wrappers + events constants
│   ├── billing/      # Polar SDK + plan defs (uses better-auth plugin)
│   ├── config/       # shared tsconfig bases
│   ├── db/           # Drizzle schema + client + migrations
│   ├── email/        # React Email templates + Resend client
│   ├── env/          # env validation (server + web) via @t3-oss/env-*
│   ├── i18n/         # next-intl messages + helpers
│   ├── storage/      # Cloudflare R2 client + presigned URL helpers
│   └── ui/           # shadcn components + Tailwind globals + cn util
├── docker/
│   └── Dockerfile.next     # shared multi-stage build for apps/*
├── docker-compose.yml      # full prod stack incl. backup container
├── scripts/
│   ├── backup-r2.sh        # nightly pg_dump → R2 (30d retention)
│   └── restore-r2.sh       # restore latest (or specified) dump
├── .claude/                # Mattpocock skills wiring
├── .ruflo/                 # autonomous-loop prompt + agent role defs
├── docs/adr/               # decision records
├── CONTEXT.md              # living domain glossary + invariants
└── README.md
```

## Naming

- Workspace packages: `@vibestack/<kebab>` (renamed per cloned project).
- All packages export via `exports` map. No `main` field.

## Cross-package boundaries

- `apps/*` can import from any `@vibestack/*` package.
- `packages/auth` may import `packages/db`, `packages/email`, `packages/env`.
- `packages/api` may import `packages/auth`, `packages/db`, `packages/env`.
- `packages/ui` is framework-agnostic React; MAY NOT import from `apps/*` or from `auth`/`db`.
- `packages/db` is server-only; never imported from client components.
- `packages/env/server` is server-only; client components must use `packages/env/web`.

## Rationale

- Marketing app deploys independently — no DB/auth code in its bundle.
- Admin app shares schema + auth client with web — single source of truth.
- Future mobile/desktop clients can be added under `apps/` and call tRPC.

## Consequences

- Some duplication in app `next.config.ts` (transpilePackages) — accepted.
- Build cache via Turborepo amortises across apps.
- Renaming the project requires updating package names (`@vibestack/*` → `@<new>/*`) in 20+ places — provided rename script in `scripts/rename.sh` (TODO).
