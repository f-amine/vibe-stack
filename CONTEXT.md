# Context

Living document of the domain language, invariants, and decisions of this project. Maintained by humans and the `/grill-with-docs` workflow. Keep current.

> If you are an AI agent: read this BEFORE making non-trivial changes. Update it as part of any decision that affects terminology or invariants. Reference ADRs by id (e.g. `[ADR-0001]`).

## What this project is

**vibestack** is an opinionated, AI-first SaaS starter. The infrastructure is pre-wired and the Claude Code skills needed to build on it are vendored in `.claude/skills/`. A consumer of this repo runs `npx create-vibestack my-saas` (or clones it and runs `pnpm init:app` / `/setup`), and then builds business logic with the skill workflow. The starter itself ships no app-level AI features — see [ADR-0004](docs/adr/0004-ai-first-positioning.md).

Audience: **developers** and **vibe-coders** (product-focused non-coders working through Claude). Documentation and skills must serve both.

---

## Domain glossary

| Term | Meaning |
|------|---------|
| **User** | A person with credentials. Owns sessions, accounts (oauth), passkeys, and an optional 2FA factor. May be `admin` (role) or `banned`. |
| **Organization** | A multi-tenant container. Users join via `Member` rows. Roles: `owner`, `admin`, `member`. |
| **Member** | Pivot row linking `User` and `Organization` with a role string. |
| **Invitation** | Pending org join, addressed to an email + role, with an inviter and expiry. |
| **PolarCustomer** | Local mirror of a Polar.sh customer row; linked to a user or an org. |
| **Subscription** | Local mirror of a Polar.sh subscription with status, period, cancellation flag. |
| **AuditLog** | Append-only record of consequential actions for compliance and admin review. |

## Onboarding & initialization

Domain language for how a fresh copy of vibestack becomes someone's product — see [ADR-0009](docs/adr/0009-create-cli-and-zero-key-boot.md).

| Term | Meaning |
|------|---------|
| **create-vibestack** | The npm CLI (`npx create-vibestack my-saas`, source in `packages/create-vibestack`). Clones the template, strips git history, removes itself from the copy, hands off to the **init wizard**, then re-inits a fresh git history. |
| **Init wizard** | `scripts/init.mjs` — the zero-dependency interactive engine behind both `create-vibestack` and `pnpm init:app`. Asks product name (runs the rename), feature toggles, optional API keys (all skippable), writes `.env` with a generated `BETTER_AUTH_SECRET`, syncs the **feature toggles registry**, trims locales / the video swarm if declined, offers install + db bootstrap. |
| **Rename** | `scripts/rename.mjs` (`pnpm rename <name>`) — replaces the `@vibestack/*` scope and brand strings across the repo. Lockfile-safe: never touches `pnpm-lock.yaml`; run `pnpm install` after. |
| **Zero-key boot** | The invariant that the app boots with only `DATABASE_URL` + `BETTER_AUTH_SECRET` (+ URL vars). Every third-party integration is optional in `packages/env/src/server.ts` and degrades gracefully: no Resend → auth emails print to the dev console (dev only; production refuses to send); no Polar → billing plugin doesn't mount and billing UI hides; no R2 → file storage throws a clear "not configured" error only when used. `/api/health` reports unconfigured optional services as `disabled`. |
| **Feature toggles registry** | `apps/web/src/config/features.ts` — single source of truth for which product features are exposed (settings tabs, sidebar links, API reachability). The init wizard flips `billing` and `files` to match the chosen integrations; humans edit it directly afterwards. |

## Bounded contexts

- **Auth** (`packages/auth`) — sign-in/up, sessions, OAuth, magic links, passkeys, 2FA, password reset, email verification. Owns the `user`, `session`, `account`, `verification`, `passkey`, `two_factor` tables.
- **Org** (`packages/auth/plugin organization`) — orgs, members, invitations. Owns the `organization`, `member`, `invitation` tables.
- **Billing** (`packages/billing` + `packages/db/schema/billing.ts`) — Polar customer + subscription mirror. Listens for Polar webhooks.
- **Audit** (`packages/db/schema/audit.ts`) — append-only log. Written from server-side action handlers via the `recordAuditLog()` seam (`packages/db/src/audit.ts`); never directly by clients.
- **Identity surface** (apps) — `web`, `marketing`, `admin` share auth via Better Auth cookies on the same root domain.

## Invariants

- A `Member` always belongs to exactly one `Organization` and exactly one `User`.
- A `Session` is invalidated on user ban, password change, or explicit revoke.
- `AuditLog` rows are immutable once written. No `UPDATE`/`DELETE` allowed. All writes go through `recordAuditLog()` (`@vibestack/db`) — the only sanctioned write path; never `db.insert(auditLog)` directly outside that seam (the seed script excepted).
- All emails are sent via `@vibestack/email` (Resend). Never call the email provider directly from app code.
- All R2 access goes through `@vibestack/storage`. Never instantiate an S3 client elsewhere.
- All cross-app API calls go through tRPC procedures in `packages/api`. No direct DB queries from `apps/marketing`.
- Server-only modules import from `@vibestack/env/server`. Client-only modules import from `@vibestack/env/web`.

## Naming conventions

- Package names: `@vibestack/<kebab>`.
- Routes use `kebab-case` URLs and `camelCase` route params.
- Database tables: `snake_case` singular (`user`, `organization`, `audit_log`).
- TS identifiers: `camelCase` for variables/functions, `PascalCase` for types/components.
- tRPC procedures: `<resource>.<verb>` (e.g. `org.create`, `user.updateProfile`).

## Decisions

See `docs/adr/` for architecture decision records.

## Workflow

```
new app      → npx create-vibestack (or pnpm init:app) → /setup to finish keys → describe what you're building
new feature  → /grill-with-docs → /to-prd → /to-issues → /tdd → /review → merge
UI / frontend→ /impeccable first — mandatory for ANY task touching components, pages,
               theming, typography, motion, layout, or visual polish [ADR-0005]
blog post    → /blog-writer  (researcher → writer → SEO editor + image producer → publisher;
               3500-5000-word draft MDX with Gemini inline images into
               apps/marketing/content/blog/, stays draft until a human flips draft: false) [ADR-0007]
reel / video → /video-writer (researcher → script writer → voice+SFX+music → motion designer →
               renderer; typographic 9:16 MP4, no AI stills, lands at
               apps/marketing/public/reels/<slug>.mp4) [ADR-0008]
SEO / GEO    → toprank plugin (/toprank:seo-analysis, /toprank:keyword-research, …) for anything
               about rankings, Search Console, indexing, meta tags, schema, AI-search visibility;
               also Google/Meta Ads via /toprank:*-ads-* [ADR-0006]
bug          → /diagnose → /tdd → /review → merge
refactor     → /improve-codebase-architecture → ADR draft → /to-issues
new idea     → /prototype  (throwaway to flush out the design)
inbox        → /triage  (sort incoming issues)
```

Skills live in `.claude/skills/`. Update them with `pnpm skills:update` (refreshes upstream from [mattpocock/skills](https://github.com/mattpocock/skills); preserves project-local skills like `/setup`).
