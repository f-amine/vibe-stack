<div align="center">

<img src="apps/marketing/public/hero.png" alt="vibestack" width="100%" />

# vibestack

### The SaaS starter where Claude writes the rest.

An opinionated, AI-first SaaS starter. Full stack pre-wired, every infra decision pre-made, every Claude Code skill vendored in the repo. You bring the business logic; Claude does the plumbing.

[![Repo](https://img.shields.io/badge/GitHub-f--amine%2Fvibe--stack-181717?logo=github)](https://github.com/f-amine/vibe-stack)
[![Stars](https://img.shields.io/github/stars/f-amine/vibe-stack?color=e8c06a)](https://github.com/f-amine/vibe-stack/stargazers)
[![CI](https://github.com/f-amine/vibe-stack/actions/workflows/ci.yml/badge.svg)](https://github.com/f-amine/vibe-stack/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-e8c06a.svg)](LICENSE)

[**Repository**](https://github.com/f-amine/vibe-stack) · [Quickstart](#quickstart) · [Workflow](#the-vibestack-workflow) · [Deploy](#deploying-with-dokploy)

</div>

---

```bash
npx create-vibestack my-saas
```

One command, both crowds:

- **Devs** — clone, `pnpm dev`, ship.
- **Vibe-coders** — open Claude Code, run `/setup`, describe your idea, let the workflow drive.

Same repo. Same skills. Same outcome.

## What's in the box

- **Next.js 16** + React 19 + App Router — three apps: web, marketing, admin
- **Better Auth** — email/password, magic-link, Google, passkeys, 2FA, orgs, admin role, rate-limit
- **Postgres + Drizzle**, tRPC v11 + TanStack Query, Zod v4
- **Tailwind v4** + shadcn + dark mode
- **Polar.sh** billing wired end-to-end (sandbox + prod)
- **Resend** + React Email, **Cloudflare R2** storage + nightly `pg_dump` → R2
- **PostHog + GA4** analytics, **Sentry** errors, **next-intl** (EN + FR)
- **Dokploy** + docker-compose deploy, GitHub Actions CI
- **Biome v2**, Vitest + Playwright + a11y suite

Full ADR set under [`docs/adr/`](docs/adr/) — decisions you don't have to re-make.

## What's *not* in the box

- **App-level AI features.** The stack is AI-native *dev*, not an AI SaaS template. Add the `ai` SDK or any model wrapper when you build your features.
- **A name.** `npx create-vibestack` asks for one, or run `pnpm rename` after cloning.
- **A wall of required keys.** *Zero-key boot*: the app runs with just a database and an auth secret. Every third-party integration is optional and degrades gracefully until you add its key.

## Quickstart

```bash
npx create-vibestack my-saas
```

The wizard clones the template and walks you through:

1. **Product name** — renames the `@vibestack/*` scope and every brand string (lockfile-safe).
2. **Feature toggles** — email, billing, storage, Google sign-in, analytics, Sentry, French locale, video swarm. Pick what you want; skip the rest.
3. **API keys** for what you enabled — every one skippable, signup URL printed next to it.
4. Writes `.env` with a generated `BETTER_AUTH_SECRET`.
5. Offers to run `pnpm install`, start Postgres (Docker), and push the schema.

Then `pnpm dev` gives you three apps:

| URL | App |
|---|---|
| `http://localhost:3001` | your authed product |
| `http://localhost:3000` | marketing site + docs + blog |
| `http://localhost:3002` | admin dashboard |

> **No keys? No problem.** Auth emails (magic links, verification, password reset) print to your terminal until you add a Resend key. Billing UI stays hidden until you add Polar. File storage only complains if you actually use it. `/api/health` reports unconfigured optional services as `disabled`.

### Manual path (dev track)

```bash
git clone https://github.com/f-amine/vibe-stack.git my-saas
cd my-saas
pnpm install
pnpm db:start
cp .env.example .env          # only core vars needed to boot
pnpm db:push
pnpm dev
```

Core vars: `DATABASE_URL` (matches `pnpm db:start`), `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), and the localhost URL vars. That's a fully working app — sign-up, sessions, orgs, the lot. Add other keys whenever the feature matters.

Prefer the wizard inside an existing clone? `pnpm init:app` runs the same flow. Full env reference: [`.claude/skills/setup/env-reference.md`](.claude/skills/setup/env-reference.md).

## The vibestack workflow

Open Claude Code in the repo. Skills come vendored, no install step:

```
new feature   /grill-with-docs  →  /to-prd  →  /to-issues  →  /tdd  →  /review
bug           /diagnose  →  /tdd
refactor      /improve-codebase-architecture  →  ADR draft  →  /to-issues
new idea      /prototype  (throwaway, to flush out the design)
UI / design   /impeccable  (mandatory for anything visual)
content       /blog-writer  ·  /video-writer
```

Each skill is a short, opinionated playbook. They share a domain model ([`CONTEXT.md`](CONTEXT.md)) and a decision log ([`docs/adr/`](docs/adr/)) so multiple Claude sessions stay coherent. Full catalogue: [`.claude/skills/README.md`](.claude/skills/README.md).

## Common commands

```bash
pnpm dev            # turbo dev across all apps  (dev:web / dev:marketing / dev:admin for one)
pnpm build          # turbo build
pnpm check          # biome format + lint
pnpm typecheck      # tsc across packages
pnpm test           # vitest
pnpm test:e2e       # playwright

pnpm db:start       # docker postgres
pnpm db:push        # apply schema directly (dev)
pnpm db:generate    # generate SQL migration
pnpm db:migrate     # apply migrations (prod)
pnpm db:studio      # drizzle studio
pnpm db:seed        # seed demo data
pnpm auth:generate  # regen auth schema after editing packages/auth plugins
pnpm email:dev      # react-email preview at :3010

pnpm init:app       # interactive first-run wizard (name, features, keys, .env)
pnpm rename <name>  # rename the @vibestack scope + brand strings only
pnpm skills:update  # pull latest upstream skills
```

## Renaming

`npx create-vibestack` and `pnpm init:app` do this first. To rename only:

```bash
pnpm rename my-product
pnpm install   # regenerates the lockfile for the new scope
```

Unlike a raw `sed`, `pnpm rename` never touches `pnpm-lock.yaml`, skips `node_modules` / build output / binaries, and handles case variants. Review the diff before committing.

## Deploying with Dokploy

1. Provision a small VPS (Hetzner / DigitalOcean / Vultr) and install Dokploy.
2. Point a Compose service at [`docker-compose.prod.yml`](docker-compose.prod.yml).
3. Set env in the Dokploy Environment tab — see [`docs/deploy/production-env.md`](docs/deploy/production-env.md) for required vs optional.
4. Map a domain to each app (container ports: marketing `3000`, web `3001`, admin `3002`) and enable Let's Encrypt.

The stack runs migrations on deploy (a healthcheck-gated `migrate` service) and ships a nightly `pg_dump` → R2 backup (`backup` container, 30-day retention; restore with `./scripts/restore-r2.sh`).

> **Behind Cloudflare?** Its free SSL covers one subdomain level (`*.example.com`). Keep app hosts one level deep (e.g. `app.example.com`, not `app.x.example.com`) or grey-cloud the deep ones. Details in [`docs/deploy/production-env.md`](docs/deploy/production-env.md).

## Power-user: 24/7 autonomous loop

Optional. A long-running Claude swarm that picks up `triaged` issues, implements them, and opens PRs. Runbook and risks: [`.ruflo/README.md`](.ruflo/README.md).

## Hard rules

- Don't touch `.env`, `.env.*`, `*.key`, `*.pem`, `secrets/*`.
- Don't bump major dep versions without an ADR.
- Branch → PR → CI → squash merge. Never push to `master`, never `--no-verify`.

## Credits

Initial scaffold via [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack). Workflow skills vendored from [mattpocock/skills](https://github.com/mattpocock/skills). Logos via [svgl.app](https://svgl.app). Extended into vibestack with marketing/admin apps, Fumadocs, Resend, R2, PostHog/GA, Sentry, next-intl, Dokploy compose + R2 backup, and the full Claude Code skill set.

<div align="center">

**[github.com/f-amine/vibe-stack](https://github.com/f-amine/vibe-stack)** · MIT

</div>
