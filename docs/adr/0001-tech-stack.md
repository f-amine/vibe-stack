# ADR-0001 — Tech stack

**Status**: Accepted
**Date**: 2026-05-14

## Context

Starter for a multi-tenant SaaS that needs auth, billing, email, file storage, multi-locale UI, blog, docs, admin dashboard, observability, and deployable via a self-hosted PaaS.

## Decision

Adopt the following stack, in a Turborepo + pnpm monorepo:

| Layer | Choice |
|-------|--------|
| Runtime | Node.js ≥ 22 |
| Package manager | pnpm 10 |
| Build orchestrator | Turborepo |
| Framework | Next.js 16 + React 19 (App Router, RSC default, React Compiler enabled) |
| Styling | Tailwind v4 + shadcn + `next-themes` + Lucide + Sonner |
| Type system | TypeScript |
| API layer | tRPC v11 (in `packages/api`) consumed via `@trpc/tanstack-react-query` |
| Validation | Zod v4 |
| ORM + DB | Drizzle ORM 0.45 + Postgres (self-hosted via Dokploy) |
| Auth | Better Auth 1.6 (email/pw, magic-link, Google, passkeys, 2FA, org plugin, admin plugin, rate-limit) |
| Billing | Polar.sh via `@polar-sh/better-auth` plugin |
| Email | Resend + React Email |
| File storage | Cloudflare R2 (S3-compatible) |
| i18n | next-intl (EN + FR) |
| Analytics | PostHog (cloud, reverse-proxied) + Google Analytics 4 |
| Error tracking | Sentry |
| Logging | Pino |
| Lint + format | Biome v2 |
| Tests | Vitest (unit), Testing Library, Playwright (e2e) |
| Deploy | Dokploy (docker-compose) |
| Backup | Nightly `pg_dump` → Cloudflare R2 (30d retention) |
| CI/CD | GitHub Actions |
| AI workflow | Mattpocock skills + ruflo autonomous-loop |

## Apps

- `apps/web` — main product (port 3001)
- `apps/marketing` — landing + blog (MDX) + docs (Fumadocs) (port 3000)
- `apps/admin` — admin dashboard, gated by Better Auth `admin` role (port 3002)

## Shared packages

`db`, `auth`, `api`, `ui`, `email`, `storage`, `billing`, `analytics`, `i18n`, `config`, `env`.

## Consequences

- Single language (TS), single package manager, single CI matrix.
- Server actions are NOT used as primary API; tRPC is preferred so `apps/admin` and future mobile clients call the same procedures.
- Better Auth owns identity end-to-end — no NextAuth/Clerk dependency.
- Dokploy self-host = costs predictable, but operator owns Postgres backups + uptime (mitigated by nightly R2 backups + healthcheck containers).
- Polar via Better Auth plugin couples billing identity to Better Auth user lifecycle.

## Alternatives considered

- **Prisma** vs Drizzle → chose Drizzle for SQL transparency + type derivation.
- **NextAuth/Clerk** vs Better Auth → Better Auth = self-host friendly, more plugin breadth, no vendor lock-in.
- **Stripe** vs Polar → Polar = developer-first, better DX for indie, native Better Auth integration.
- **Vercel + Neon** vs Dokploy + self-host Postgres → Dokploy chosen for cost ceiling on growing apps; can switch to Neon by changing `DATABASE_URL`.
- **ESLint + Prettier** vs Biome → Biome v2 = single tool, Rust-fast.
