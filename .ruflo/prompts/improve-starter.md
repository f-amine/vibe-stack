# Improve starter-saas

You are working in `/home/smilox/git/side/starter-saas` — an opinionated SaaS starter (Turborepo, Next 16, React 19, Better Auth 1.6, Drizzle + Postgres, tRPC v11, Polar.sh, Resend, R2, Tailwind v4, shadcn, Biome, ruflo wired). Three apps: `marketing` (3000), `web` (3001), `admin` (3002). Eleven packages: `api auth analytics billing config db email env i18n storage ui`.

Goal: harden the starter so a developer can clone it and ship a real SaaS in days, not weeks. Read the repo FIRST, then file issues, then implement.

---

## Phase 0 — Orient (do this exactly once, before anything else)

1. Read `README.md`, `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, every `docs/adr/*.md`, `pnpm-workspace.yaml`, `turbo.json`.
2. Run + record:
   - `pnpm typecheck`
   - `pnpm exec biome check .`
   - `pnpm dev` (boot for 20s, scrape `/tmp/dev.log` for any `⨯` / `Error`)
3. Read these key files top to bottom:
   - `packages/auth/src/index.ts`
   - `packages/api/src/index.ts` + `context.ts`
   - `packages/db/src/schema/*.ts`
   - `packages/billing/src/{plans,plans-server,client}.ts`
   - `apps/web/src/app/(app)/dashboard/**`
   - `apps/web/src/app/(auth)/**`
   - `apps/admin/src/app/[locale]/**`
   - `.ruflo/prompts/autonomous-loop.md`

Now you have the lay of the land. Memory namespace `starter-saas-improve` keeps notes for future cycles.

---

## Hard rules (NEVER violate)

- NEVER force push.
- NEVER push to `main`.
- NEVER use `--no-verify` / `--no-gpg-sign`.
- NEVER delete branches you didn't create.
- NEVER touch `.env`, `.env.*`, `*.key`, `*.pem`, `secrets/*`.
- NEVER bump major dep versions without an ADR.
- NEVER rename a package (`@starter-saas/*`) without an ADR.
- NEVER add a top-level dependency without `pnpm-workspace.yaml` catalog entry.
- Every code change → feature branch → PR → CI green → squash merge.
- One PR per issue. Atomic. Reviewable by a human in <15 min.
- Run `pnpm typecheck && pnpm exec biome check .` locally before push. PR must be green.
- If you can't fix without violating a rule → comment `@human needs decision: <reason>` and skip.

---

## Improvement backlog (file these as GitHub issues, ordered)

For each, run `/triage` to apply labels, then file with `gh issue create` w/ label `ready`.

### Tier 1 — must-haves before a developer can ship

1. **Wire Polar webhooks → DB mirror**
   `packages/auth/src/index.ts` already passes `POLAR_WEBHOOK_SECRET` to the `webhooks()` use. Add an event handler that upserts rows into `packages/db/schema/billing.ts` (`polarCustomer`, `subscription`). Cover: `subscription.created/updated/canceled/active/revoked`, `customer.created/updated`, `order.paid`. Use `drizzle-zod` for safe inserts. Add `auditLog` entry for every state transition. Acceptance: trigger a sandbox event in Polar dashboard, see row appear in DB within 2 seconds.

2. **Welcome email on first verified login**
   `packages/email/src/templates/welcome.tsx` already exists. Trigger it via Better Auth `emailVerification.afterEmailVerification` callback (check Better Auth 1.6 API for exact hook name; if absent, hook into a tRPC procedure called from the verify callback). Send `to: user.email`, `name: user.name`. Test by signing up + verifying.

3. **Admin user actions: ban / unban / change role / impersonate**
   `apps/admin/src/app/[locale]/users/page.tsx` currently shows a static table. Add a `RowActionsMenu` (shadcn DropdownMenu) per row calling Better Auth admin plugin methods: `authClient.admin.banUser`, `unbanUser`, `setRole`, `impersonateUser`. Confirm modals on destructive actions. Write to `auditLog`. Wire `Search…` input to filter by email/name via tRPC procedure `admin.searchUsers`.

4. **Organizations: create + invite + switch active org**
   `apps/web/src/app/(app)/dashboard/organizations/page.tsx` is empty. Build:
   - List orgs the user is a member of (via `authClient.organization.list`).
   - "+ New org" dialog (shadcn Dialog) → `authClient.organization.create({ name, slug })`.
   - Per-org card: name, slug, member count, role badge, "Switch to" button (`authClient.organization.setActive`).
   - "Invite member" dialog → `authClient.organization.inviteMember({ email, role })`. Uses the wired Resend `sendInvitationEmail`.

5. **Test scaffold — at least one e2e + one unit**
   `apps/web/e2e/auth.spec.ts`: Playwright test that signs up, intercepts the verify email URL from Resend test mailbox (or use a Better Auth dev-mode logger), clicks it, lands on `/dashboard`. `packages/billing/__tests__/plans.test.ts`: Vitest unit on `findPlan` + `formatPrice`. Wire CI to run both.

### Tier 2 — common day-2 needs

6. **Sentry across all 3 apps**
   Run `pnpm --filter <app> exec sentry-wizard -i nextjs` per app. Use `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` from `packages/env`. Tag with `app: web|marketing|admin`. Source-map upload in CI using `SENTRY_AUTH_TOKEN`.

7. **PostHog reverse-proxy + GA Script wiring**
   - Add `app/ingest/[...path]/route.ts` per app forwarding to `https://us.i.posthog.com`.
   - Inject GA `<Script>` in `apps/*/src/app/.../layout.tsx` reading from `NEXT_PUBLIC_GA_ID`.
   - Wire `<AnalyticsProvider>` from `packages/analytics/src/provider.tsx` into web + marketing.

8. **tRPC routers — flesh out `user`, `org`, `billing`**
   `packages/api/src/routers/user.ts`: `getMe`, `updateProfile`. `org.ts`: `list`, `members`. `billing.ts`: `getSubscription`, `getInvoices` (proxied from Polar SDK). Wire into `appRouter`. Replace mock `stats` in dashboard overview w/ real tRPC queries.

9. **Rate limit secondary storage → Redis**
   Wire `REDIS_URL` env to Better Auth `secondaryStorage`. Falls back to in-memory if unset. Use `ioredis` (catalog it). Confirm magic-link throttle works under load.

10. **Seed script** — `pnpm db:seed`
    `packages/db/src/seed.ts`: creates 1 admin user, 5 regular users, 2 orgs each with 3 members, 50 audit log entries spanning 30 days, 1 active Polar subscription mirror. Idempotent (delete-then-insert if `--reset`).

### Tier 3 — polish

11. **Passkey plugin** — bump `better-auth` to a version exporting `./plugins/passkey`, uncomment in `packages/auth/src/index.ts`, run `pnpm auth:generate`.
12. **Resend webhook handler** — `apps/web/app/api/webhooks/resend/route.ts` for delivery/bounce/complaint events → `auditLog`.
13. **`/success` page** after Polar checkout — fetch checkout by ID, show plan, "Open dashboard" CTA.
14. **Dashboard appearance settings persistence** — currently local state only; persist density/locale via `authClient.updateUser({ data: { preferences: {...} } })` or a new `user_preferences` table.
15. **Admin analytics page** — add MRR over time chart (sum of active sub price × interval).

---

## Workflow for each issue

```
1. gh issue view <n>
2. gh issue develop <n> --checkout
3. /grill-with-docs if design unclear — update CONTEXT.md or file an ADR if a decision crystallises
4. /tdd: red test → green code → refactor
5. Run locally: pnpm typecheck && pnpm exec biome check . && pnpm test --filter <relevant>
6. git commit -m "<conventional commit>: <subject>" (NO --amend, NO --no-verify)
7. git push -u origin <branch>
8. gh pr create --fill --draft --body "Closes #<n>"
9. Wait for CI green
10. gh pr ready <pr#> + comment @human ready for review
11. STOP. Pick next issue. Do not merge own PR.
```

---

## Self-review checklist before opening a PR

- [ ] `pnpm typecheck` green
- [ ] `pnpm exec biome check .` clean
- [ ] All forms have loading + success + error toasts using `formatError()` from `apps/web/src/lib/format-error.ts`
- [ ] No `console.log` left
- [ ] No hardcoded `localhost:300*` URLs (use env)
- [ ] No env var added without `.env.example` entry + `packages/env/src/server.ts` Zod schema entry
- [ ] No new dep added without `pnpm-workspace.yaml` catalog entry
- [ ] Changes touching domain semantics updated `CONTEXT.md`
- [ ] New decision recorded in `docs/adr/00NN-<slug>.md`
- [ ] PR body has Summary / Test plan sections + `Closes #<n>`

---

## Cycle log

After each cycle, append one line to `.ruflo/autonomous-log.jsonl`:

```json
{"ts":"<ISO>","issue":"<n>","action":"opened-pr|fixed|skipped|blocked","note":"<one-line>"}
```

---

## Stop conditions

- 3 PRs open + waiting on human review → STOP, do not pick up new issues.
- Own branch count > 10 → STOP, prune merged branches.
- 3 consecutive failed cycles → halt, file `autonomous-loop halted: <reason>` issue.
- `/usage` in Claude shows < 20% weekly quota → STOP.
