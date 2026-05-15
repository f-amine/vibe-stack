# Context

Living document of the domain language, invariants, and decisions of this project. Maintained by humans and the `/grill-with-docs` workflow. Keep current.

> If you are an AI agent: read this BEFORE making non-trivial changes. Update it as part of any decision that affects terminology or invariants. Reference ADRs by id (e.g. `[ADR-0001]`).

## What this project is

**vibestack** is an opinionated, AI-first SaaS starter. The infrastructure is pre-wired and the Claude Code skills needed to build on it are vendored in `.claude/skills/`. A consumer of this repo clones it, renames it, runs `/setup` in Claude Code (or follows the dev README), and then builds business logic with the skill workflow. The starter itself ships no app-level AI features — see [ADR-0004](docs/adr/0004-ai-first-positioning.md).

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

## Bounded contexts

- **Auth** (`packages/auth`) — sign-in/up, sessions, OAuth, magic links, passkeys, 2FA, password reset, email verification. Owns the `user`, `session`, `account`, `verification`, `passkey`, `two_factor` tables.
- **Org** (`packages/auth/plugin organization`) — orgs, members, invitations. Owns the `organization`, `member`, `invitation` tables.
- **Billing** (`packages/billing` + `packages/db/schema/billing.ts`) — Polar customer + subscription mirror. Listens for Polar webhooks.
- **Audit** (`packages/db/schema/audit.ts`) — append-only log. Written from server-side action handlers; never directly by clients.
- **Identity surface** (apps) — `web`, `marketing`, `admin` share auth via Better Auth cookies on the same root domain.

## Invariants

- A `Member` always belongs to exactly one `Organization` and exactly one `User`.
- A `Session` is invalidated on user ban, password change, or explicit revoke.
- `AuditLog` rows are immutable once written. No `UPDATE`/`DELETE` allowed.
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
clone        → /setup → describe what you're building
new feature  → /grill-with-docs → /to-prd → /to-issues → /tdd → /review → merge
bug          → /diagnose → /tdd → /review → merge
refactor     → /improve-codebase-architecture → ADR draft → /to-issues
new idea     → /prototype  (throwaway to flush out the design)
inbox        → /triage  (sort incoming issues)
```

Skills live in `.claude/skills/`. Update them with `pnpm skills:update` (refreshes upstream from [mattpocock/skills](https://github.com/mattpocock/skills); preserves project-local skills like `/setup`).
