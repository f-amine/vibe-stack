# create-vibestack

Scaffold a [vibestack](https://github.com/f-amine/starter-saas) SaaS in one command:

```bash
npx create-vibestack my-saas
```

The wizard walks you through:

1. **Product name** — renames the `@vibestack/*` workspace scope and brand strings to yours.
2. **Feature selection** — billing (Polar), email (Resend), file storage (R2), Google OAuth, analytics, Sentry, French locale, video swarm. Everything you skip stays optional: the app boots without it and the feature hides or degrades gracefully.
3. **API keys** — paste them now or leave blank and fill `.env` later.
4. **Bootstrap** — `pnpm install`, Postgres via Docker, schema push.

Zero keys required for a running app: with nothing configured, auth emails (magic links, verification) print to the dev console and billing/files tabs hide.

Flags for non-interactive use:

```bash
npx create-vibestack my-saas --yes --features email,billing
npx create-vibestack my-saas --repo you/your-fork
```

Already cloned the repo manually? Run the same wizard with `pnpm init:app`.
