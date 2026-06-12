# ADR-0009 — `create-vibestack` CLI and zero-key boot

**Status**: Accepted
**Date**: 2026-06-12

## Context

vibestack's first-run story was "clone, copy `.env.example`, fill in Resend + R2 + Polar keys, then it boots." That front-loaded three third-party signups before a user saw a single page — the exact wall every SaaS starter erects and the one most hostile to vibe-coders. It also meant renaming the starter required a hand-rolled `sed` over the tree that corrupted `pnpm-lock.yaml` and binary assets if run carelessly.

Meanwhile the npm ecosystem's expected entry point for a starter is `npx create-<thing>`, not "clone our repo and read the README."

## Decision

Two coupled changes:

1. **Zero-key boot.** Only `DATABASE_URL` + `BETTER_AUTH_SECRET` (+ local URL vars) are required; every third-party integration in `packages/env/src/server.ts` is optional and degrades gracefully:
   - No `RESEND_API_KEY` → auth emails (magic link, verification, password reset) print to the dev console in development; production refuses to send. Email sends are fault-tolerant — a failed send is logged and never 500s the auth flow.
   - No `POLAR_ACCESS_TOKEN` → the billing plugin doesn't mount and billing UI hides.
   - No `R2_*` → file storage throws a clear "not configured" error only when actually used.
   - `/api/health` reports unconfigured optional services as `disabled`, not as failures.

2. **An interactive CLI**: `npx create-vibestack my-saas` (`packages/create-vibestack`) clones the template, strips git history, and hands off to the in-repo wizard `scripts/init.mjs` — product name (rename via `scripts/rename.mjs`, lockfile-safe), feature toggles (email / billing / storage / Google OAuth / analytics / Sentry / French locale / video swarm), optional key collection (all skippable), `.env` with a generated `BETTER_AUTH_SECRET`, sync of the feature toggles registry (`apps/web/src/config/features.ts`), locale/video trimming, and an offer to install + start Postgres + push the schema. In-repo equivalents: `pnpm init:app` (same wizard) and `pnpm rename <name>` (rename only).

The wizard is zero-dependency on purpose: it must run right after `git clone`, before `pnpm install`.

## Consequences

- Clone-to-running-app drops to ~2 minutes and zero external accounts. Features are enabled progressively when the user wants them (`/setup` Phase 2, or fill `.env` + flip `features.ts`).
- "Optional by default" is now an invariant: any new integration added to `packages/env/src/server.ts` must be `.optional()` with a documented degradation path, or it breaks zero-key boot.
- Dev-console email delivery means a magic link can land in scrollback; the setup skill and docs must tell users to look there before they file a bug.
- `packages/create-vibestack` ships in the template but removes itself from generated apps; `pnpm rename` deliberately skips `pnpm-lock.yaml` (regenerate with `pnpm install`).
- Production gains a real required/optional reference: `docs/deploy/production-env.md`.

## Considered alternatives

- **Keep Resend/R2/Polar required, document better.** Rejected: docs don't fix a wall, they decorate it.
- **Mock services locally (mailpit, minio, fake billing).** Rejected: more moving Docker parts to babysit; printing emails to the console is simpler and teaches where the real integration lives.
- **Non-interactive scaffolding flags only.** Kept as a fallback (`--name`, `--features`, `--yes`) but the interactive wizard is the default — the audience includes people who won't read a flags table.
- **Template-repo generation (degit + token replacement).** Rejected: a plain shallow clone + in-repo rename script keeps one rename implementation shared by the CLI and `pnpm rename`.
