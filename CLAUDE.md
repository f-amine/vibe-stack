# Project memory for Claude Code

Pre-load this file when working in this repo. This is **vibestack** — an opinionated, AI-first SaaS starter. Stack pre-wired, every Claude Code skill vendored in `.claude/skills/`. See `CONTEXT.md` for positioning and [ADR-0004](docs/adr/0004-ai-first-positioning.md).

## Stack

Turborepo + pnpm; Next.js 16 + React 19; Tailwind v4 + shadcn; Better Auth 1.6 (email/pw, magic-link, Google, passkeys, 2FA, org plugin, admin plugin, rate-limit); Drizzle 0.45 + Postgres; tRPC v11; Zod v4; Polar.sh billing; Resend + React Email; Cloudflare R2; PostHog + GA4; Sentry; next-intl (EN + FR); Biome v2; Vitest + Playwright; Dokploy + docker-compose; nightly `pg_dump` → R2.

## Workflow

Skills are vendored in `.claude/skills/`. No install step.

- Clone-to-running-app: `/setup` (conversational env bootstrap, only on first clone)
- Product design: `/grill-with-docs` → `/to-prd` → `/to-issues`
- **Frontend / UI design: `/impeccable` is mandatory.** Any task touching UI, components, pages, theming, typography, motion, layout, or visual polish must invoke `/impeccable` first — even if the user did not name the skill. Includes new pages, redesigns, "make this look better", color/spacing tweaks, empty states, error states, copy.
- **Long-form blog posts / journal articles / content marketing: route to `/blog-writer`.** Any request to "write a blog post", "generate an article", "fill the journal", or content of a deep-dive shape spawns the swarm (researcher → writer → SEO editor + image producer in parallel → publisher). Output is a 15-20 minute read (3500-5000 words) with multiple Gemini-generated inline images, full frontmatter, JSON-LD ready, dropped as a draft into `apps/marketing/content/blog/`. Topics may be product-adjacent (domain deep-dives count); the post stays a draft until a human flips `draft: false`. See [ADR-0007](docs/adr/0007-blog-writer-swarm.md).
- **SEO / GEO / Search Console / organic traffic: route to `toprank`.** Any task about search rankings, organic traffic, Google Search Console, indexing, keyword research, content gaps, meta tags, schema markup, Core Web Vitals, sitemap, robots, AI-search visibility (ChatGPT, Perplexity, Gemini), or Generative Engine Optimization runs through the `toprank` plugin (`/toprank:seo-analysis`, `/toprank:keyword-research`, `/toprank:content-writer`, `/toprank:geo-optimizer`, `/toprank:meta-tags-optimizer`, `/toprank:schema-markup-generator`, `/toprank:broken-link-checker`, `/toprank:seo-page`). Toprank uses live GSC + PageSpeed Insights data, so install it during `/setup` and let it OAuth on first run. See [ADR-0006](docs/adr/0006-toprank-for-seo-geo-ads.md).
- **Google Ads / Meta Ads / paid acquisition:** also `toprank` (`/toprank:google-ads-audit`, `/toprank:google-ads-manage`, `/toprank:meta-ads-audit`, `/toprank:meta-ads-manage`). Connects via the NotFair-GoogleAds and NotFair-MetaAds HTTP MCPs configured in `.mcp.json`.
- Build: `/tdd` → `/review`
- Bug: `/diagnose` → `/tdd`
- Refactor: `/improve-codebase-architecture` → ADR draft → `/to-issues`
- Spike: `/prototype` (throwaway, then commit to real implementation)
- Inbox: `/triage` (sort incoming issues into a state machine)

ADRs live in `docs/adr/`. Living domain doc is `CONTEXT.md`. Update both when behaviour changes.

Audience: vibestack serves **devs** and **vibe-coders** (product folks, designers, indie founders working through Claude Code). When in doubt about how much hand-holding to include in a response, lean toward the vibe-coder — concrete commands, named URLs, no assumed jargon.

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
pnpm skills:update             # refresh vendored skills from mattpocock/skills
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
