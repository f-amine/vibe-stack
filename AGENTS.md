# Agents guide

vibestack is designed to be operated by AI agents in addition to humans. The skill workflow under `.claude/skills/` is the canonical way to do non-trivial work.

## First-time setup

If `.env` does not exist, run `/setup` in Claude Code. The skill walks through Postgres, BETTER_AUTH_SECRET, and collecting Resend / R2 / Polar keys conversationally — never reads or prints existing `.env` values.

Already running? Skip to the workflow.

## Workflow

Before doing anything non-trivial:

1. Read `CLAUDE.md`, `CONTEXT.md`, and the relevant `docs/adr/*.md`.
2. Pick the entry skill based on the kind of work:
   - **New feature or capability** — `/grill-with-docs` → `/to-prd` → `/to-issues` → `/tdd` → `/review`
   - **Any frontend / UI change** — `/impeccable` is mandatory **before** writing or editing component / page / styling code. Covers redesigns, new screens, "make this look better", spacing, colour, motion, copy, empty states. Holds even when the user did not name the skill. See [ADR-0005](docs/adr/0005-impeccable-for-frontend-design.md).
   - **Instagram Reels / short-form video / TikTok / YouTube Shorts** — `/video-writer`. Seven-role swarm (researcher → script writer → visual director → [voice + images + SFX + music] parallel → motion designer → renderer). Output: 30-90s 9:16 MP4 + all assets under `apps/marketing/public/reels/<slug>/`. Remotion composition lives at `packages/video/src/compositions/Reel.tsx`. See [ADR-0008](docs/adr/0008-video-writer-swarm.md).
   - **Long-form blog posts / journal / content marketing** — `/blog-writer`. Swarm: researcher → writer → (SEO editor + image producer in parallel) → publisher. 15-20 min read, multiple Gemini inline images, draft MDX in `apps/marketing/content/blog/`. See [ADR-0007](docs/adr/0007-blog-writer-swarm.md).
   - **SEO / GEO / Search Console / organic traffic / keyword research / meta tags / schema / broken links / Core Web Vitals** — route to `toprank`. Skills: `/toprank:seo-analysis`, `/toprank:keyword-research`, `/toprank:content-writer`, `/toprank:geo-optimizer`, `/toprank:meta-tags-optimizer`, `/toprank:schema-markup-generator`, `/toprank:broken-link-checker`, `/toprank:seo-page`. Uses live Google Search Console + PageSpeed Insights via OAuth. See [ADR-0006](docs/adr/0006-toprank-for-seo-geo-ads.md).
   - **Google Ads / Meta Ads / paid acquisition** — also `toprank`. Skills: `/toprank:google-ads-audit`, `/toprank:google-ads-manage`, `/toprank:google-ads-copy`, `/toprank:google-ads-landing`, `/toprank:meta-ads-audit`, `/toprank:meta-ads-manage`. Connects via the NotFair-GoogleAds and NotFair-MetaAds HTTP MCPs in `.mcp.json`.
   - **Bug report** — `/diagnose` → `/tdd`
   - **Refactor itch** — `/improve-codebase-architecture` (requires maintainer approval; propose an ADR before changing structure)
   - **Spike / design exploration** — `/prototype` (throwaway, then formalise)
   - **Triage** — `/triage` for incoming issues
3. Do not push code without an issue.

The skills share a state contract: each one expects `CONTEXT.md` to reflect current domain truth and references ADRs by id. Keep them current as you work.

## Hard limits

- No edits to `.env`, `.env.*`, `*.key`, `*.pem`, `secrets/*`, `credentials*`.
- No major dependency version bumps without an ADR.
- No `--no-verify` / `--no-gpg-sign`.
- No force-push, no push to `main`.
- No `rm -rf` outside scratch directories.

## Available skills

Vendored in `.claude/skills/`. Catalogue + descriptions in `.claude/skills/README.md`. Update from upstream with `pnpm skills:update`.

## Autonomous mode

Power-user only. `.ruflo/` configures a long-running Claude swarm that picks up triaged issues and opens PRs unattended. See `.ruflo/README.md` for the runbook and risk profile. Not part of the default workflow.
