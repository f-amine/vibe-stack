# ADR-0003 — Passkey plugin via `@better-auth/passkey`

**Status**: Accepted
**Date**: 2026-05-15

## Context

Better Auth 1.6 split the passkey plugin out of the core package
(`better-auth/plugins/passkey`) into its own npm package
(`@better-auth/passkey`). Our scaffold previously imported passkey from
the core path and commented it out when the import path broke during a
bump:

```ts
// TODO: passkey plugin not exported from better-auth@1.6.9. Re-enable when upgrading.
// import { passkey } from "better-auth/plugins/passkey";
```

Backlog item #36 tracks re-enabling it cleanly.

## Decision

- Add `@better-auth/passkey` to the pnpm catalog (peer-dep matches
  `better-auth@^1.6.11`).
- Import the server plugin from `@better-auth/passkey` in
  `packages/auth/src/index.ts`.
- Import the client plugin from `@better-auth/passkey/client` in
  `apps/web/src/lib/auth-client.ts`.
- Run `pnpm auth:generate` to add the `passkey` table to
  `packages/db/src/schema/auth.ts`.
- Wire a "Sign in with passkey" button on `/sign-in` and a "Register a
  passkey" affordance on `/dashboard/security`.

## RP configuration

- `rpName`: `"vibestack"` (cloned projects can rename this in
  `packages/auth/src/index.ts`).
- `rpID`: derived from `env.APP_URL` host at runtime.
- `origin`: `env.APP_URL`.

Cloned projects MUST update `rpName` + ensure `APP_URL` points to the
real production origin before allowing passkey enrollment. Passkeys
created against `localhost` will NOT work against the deployed origin
and vice versa — there is no migration path.

## Backwards compatibility

- No existing user data is affected — the `passkey` table is purely
  additive.
- Email/password + magic-link + Google OAuth continue to work unchanged.
- Sessions issued before this change remain valid.

## Consequences

- One new top-level dep (`@better-auth/passkey`) — acceptable cost.
- `pnpm auth:generate` will mutate `schema/auth.ts`; the regenerated
  file is checked into the repo so the migration is reproducible.
- A new migration must be generated and applied (`pnpm db:generate &&
  pnpm db:migrate`) before deploying.

## Alternatives considered

- **Keep passkey disabled, ship without WebAuthn**: rejected — passkey
  is a tier-3 product surface that ships in the starter and is a
  meaningful security upgrade over passwords alone.
- **Fork `better-auth/plugins/passkey` inline**: rejected — vendored
  WebAuthn code is a maintenance trap given the SimpleWebAuthn dep
  cadence.
