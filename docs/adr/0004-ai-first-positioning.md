# ADR-0004 — vibestack as an AI-first SaaS starter

**Status**: Accepted
**Date**: 2026-05-15

## Context

The repo started life as a generic Better-T-Stack scaffold extended with marketing/admin/auth/billing pre-wiring. The hypothesis was "save time on plumbing." But by mid-2026 plumbing alone is not a strong wedge — Clerk + Stripe templates, Better-T-Stack itself, and a dozen other starters cover the same surface. What is rare, and what the maintainer team uses daily, is an opinionated *AI workflow* layered on top of the stack: vendored skills, ADR + CONTEXT discipline, a setup conversation that walks non-developers through env-var collection, and an optional autonomous loop.

We need to decide whether the project markets that workflow as the headline, and how aggressively to bind it into the repo.

## Decision

Reposition and rename to **vibestack** with the headline "The SaaS starter where Claude writes the rest." Three load-bearing choices follow:

1. **Vendor the canonical skill set** ([mattpocock/skills](https://github.com/mattpocock/skills) plus a project-local `/setup` skill) into `.claude/skills/`. No "install the marketplace plugin first" step. `pnpm skills:update` refreshes upstream skills while preserving project-local ones.
2. **First-run UX is `/setup` in Claude Code**, with a CLI-style README quickstart as the dev-track fallback. The skill collects API keys conversationally — Resend, R2, Polar — with signup URLs and free-tier hints, and never reads or echoes existing `.env` values.
3. **No app-level AI SDK in the box.** vibestack is "AI-native dev experience for SaaS" not "AI SaaS template." The user adds `ai`, OpenAI/Anthropic SDKs, RAG plumbing, etc. when they build their own features. Keeps the repo neutral on model/provider lock-in and consistent with "only business logic needed."

Audience is explicitly dual: developers and vibe-coders (product-focused non-coders working through Claude). Docs, skills, and marketing copy must serve both.

`.ruflo/` (long-running autonomous loop) is kept but demoted to a "power-user" section — not part of the default onboarding.

## Consequences

- The canonical workflow is documented in three places (`CLAUDE.md`, `CONTEXT.md`, `AGENTS.md`) and must stay synchronised when skills change.
- Vendoring skills means we need an update mechanism (`pnpm skills:update`) and a clear convention for distinguishing upstream-managed from project-local skills.
- Shipping `/setup` as the headline path raises a real risk: if Claude Code is unavailable or the user's model is degraded, the only fallback is the README dev track. That is acceptable for now — there's no other way to make vibe-coder onboarding actually work.
- Marketing copy now names a specific vendor (Claude / Anthropic) in the hero. We accept the lock-in trade — the value of a concrete promise outweighs the cost of vendor-agnostic positioning that nobody parses.
- Project-renaming is friction for cloners. The README ships a sed-based rename recipe; the workspace scope changed from `@starter-saas/*` to `@vibestack/*`.

## Considered alternatives

- **Generic OSS starter, AI workflow as a `docs/ai-workflow.md` appendix.** Rejected — the workflow is the wedge; burying it is the same as not having it.
- **AI SaaS template (ship Vercel AI SDK + example chat route).** Rejected — opinions on AI features belong to the SaaS being built, not the starter. Keeps repo lean and provider-neutral.
- **Provider-agnostic AI shim in `packages/ai`.** Rejected for the same reason plus carrying-cost: a wrapper we don't dogfood will rot.
- **Skills as a git submodule.** Rejected — submodules confuse non-developers, which is half our audience.
- **"OpenAI-first" branding.** Rejected — vibestack uses Claude Code as the IDE; the dev workflow is Claude-shaped. Pretending otherwise is a lie that breaks the first time someone runs `/setup`.
