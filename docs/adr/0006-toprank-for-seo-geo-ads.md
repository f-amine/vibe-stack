# ADR-0006 — `toprank` is the default plugin for SEO, GEO, and paid acquisition

**Status**: Accepted
**Date**: 2026-05-15

## Context

vibestack ships a marketing app, a docs surface, and a changelog. The whole point of "the SaaS starter where Claude writes the rest" is that a vibe-coder describes the product, ships, and the marketing surface eventually has to earn organic traffic. Without a default SEO/GEO workflow, the gap between "site is live" and "site shows up in Google or in ChatGPT answers" stays the user's problem — and vibe-coders are the audience least equipped to bridge it.

[toprank](https://github.com/nowork-studio/toprank) (`nowork-studio/toprank`, v0.19+, 2k+ stars, Apache 2.0) is a Claude Code plugin that bundles:

- 9 SEO skills (`seo-analysis`, `keyword-research`, `content-writer`, `geo-optimizer`, `meta-tags-optimizer`, `schema-markup-generator`, `broken-link-checker`, `seo-page`, `setup-cms`) backed by live Google Search Console + URL Inspection API + PageSpeed Insights API.
- A Generative Engine Optimization (GEO) skill targeting AI search engines (ChatGPT, Perplexity, Gemini, Claude).
- Google Ads + Meta Ads management skills backed by NotFair's hosted MCP servers (`https://notfair.co/api/mcp/google_ads`, `https://notfair.co/api/mcp/meta_ads`).
- A trigger description aggressive enough to fire on most natural-language SEO/Ads questions ("why is my traffic down", "audit my SEO", "improve my rankings", etc.) without the user knowing the skill name.

## Decision

`toprank` is the default plugin for SEO, GEO, Google Ads, and Meta Ads work in vibestack.

Four load-bearing pieces:

1. **Install via Claude Code marketplace, not vendored.** The plugin ships scripts/, evals/, and Python helpers under each skill, and ships a fresh version roughly weekly. Vendoring would freeze it. The `/setup` skill instructs the user to run `/plugin marketplace add nowork-studio/toprank` + `/plugin install toprank@nowork-studio` as one of its steps.
2. **NotFair MCPs are wired in `.mcp.json` at the repo root.** Both `NotFair-GoogleAds` and `NotFair-MetaAds` are HTTP-typed servers — no local install. Claude Code auto-connects when the user opens the repo. First call surfaces a NotFair OAuth flow.
3. **GSC and PageSpeed auth live in `~/.toprank/`, not in vibestack `.env`.** The plugin handles OAuth lazily on first use. We intentionally keep these credentials out of the project `.env` because they are per-user, not per-project — different contributors will OAuth as themselves.
4. **CLAUDE.md and AGENTS.md route SEO/GEO/Ads intents to `toprank`.** Any phrase about Search Console, rankings, traffic drops, keywords, meta tags, schema, Core Web Vitals, AI-search visibility, or paid acquisition triggers a `/toprank:*` skill before any in-repo workaround.

Post-deployment automation (cron-driven nightly SEO audits) is **scoped out** of this ADR. A stubbed `scripts/seo-nightly.example.sh` exists as documentation for how to wire a headless `claude --print "/toprank:seo-analysis ..."` job, but the production pattern is left to the user — different deploys want different cadences and notification surfaces (Slack, GitHub Issues, email).

## Consequences

- vibe-coders get useful SEO output from "audit my SEO" without learning any skill name. Trigger surface area is broad enough that GEO/Ads questions fire too.
- The plugin updates outside vibestack's control. We accept upstream risk — toprank is open-source under Apache 2.0 and active. `pnpm seo:install` reminds users how to update (`/plugin update toprank@nowork-studio`).
- The user must complete a Google OAuth flow once per machine for GSC, and once per NotFair account for Ads. Both happen lazily; neither blocks the rest of vibestack from working.
- The `seo-analysis` skill caches business context per domain under `~/.toprank/business-context/<domain>.json`. Cross-project pollution is possible if a user works on multiple sites — toprank surfaces a "use cached site or enter different URL" prompt to mitigate.
- We do not commit NotFair credentials to the repo. The Google Ads / Meta Ads MCP URLs are public endpoints; auth happens via NotFair's OAuth at first use.
- Production GSC integration ("optimize and uses Google Search Console by itself after deployment") is **manual** for now — the user verifies the domain in Search Console post-deploy, and any subsequent `/toprank:seo-analysis` call uses the real data. The nightly automation example sits in `scripts/seo-nightly.example.sh` for users who want it.

## Considered alternatives

- **Vendor the toprank skills under `.claude/skills/toprank/`.** Rejected — toprank ships fast, Python-script-heavy, and breaks if frozen. Marketplace install carries the update path. We accept the one-time install step as part of `/setup`.
- **Roll our own GSC integration in `packages/seo`.** Rejected — toprank already does the integration well, has 2k+ stars and an active maintainer, and bundles related skills (GEO, Ads) we'd otherwise have to also build. Reinventing wastes weeks for a worse result.
- **Use only a sitemap + structured data audit, skip live GSC.** Rejected — without live ranking data, the audit is generic. The whole differentiator is "real data, specific recommendations."
- **Wire GSC OAuth into vibestack `.env`.** Rejected — credentials are per-user, not per-project. Storing them in repo-scoped env would force every contributor to swap them out. `~/.toprank/` is the right place.
