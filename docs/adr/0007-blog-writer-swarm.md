# ADR-0007 — `/blog-writer` is the default skill for long-form content

**Status**: Accepted
**Date**: 2026-05-15

## Context

vibestack's marketing surface ships a `/blog` route, a Fumadocs-mdx content pipeline, and (post-ADR-0006) the `toprank` plugin for SEO data. The remaining gap is *the actual content*. Search Console only ranks pages that exist, and AI-search engines (ChatGPT, Perplexity, Gemini, Claude) only cite domains that publish substance.

Two failure modes to avoid:

1. **Thin posts.** A 600-word "What is X?" article ranks for nothing, helps nobody, and signals to Google that the domain is low-quality. The whole point of writing on a developer-tools blog is to earn topical authority, which means depth.
2. **Hand-crafted bottleneck.** Asking the user to draft long posts themselves means the journal stays empty. vibestack's audience (devs + vibe-coders) signed up specifically because they don't want to babysit the plumbing — content production should feel like plumbing they don't have to do.

We already had `scripts/agents/write-blog-post.ts` (single-shot Gemini, 1500-2500 words, generic structure, one optional cover via `gen-blog-covers.ts`). That's not enough — short, no inline imagery, no SEO discipline, no research step.

## Decision

`/blog-writer` is the default skill for any long-form content intent in vibestack ("write a blog about X", "generate an article", "fill the journal"). It coordinates a swarm of four worker agents and ships **3500-5000 word draft MDX files with 4-8 inline Gemini-generated images at natural reading breakpoints**.

Five load-bearing pieces:

1. **Skill orchestrator** at `.claude/skills/blog-writer/SKILL.md`. Owns the brief, gates on user confirmation when ambiguous, sequences the swarm.
2. **Swarm topology** — partially parallel:
   - **Researcher** (sequential, alone): keyword research via `toprank` if available else WebSearch fallback, competitor outline scan, internal link inventory, citation set, outline with image breakpoints. Outputs a structured JSON brief.
   - **Writer** (sequential, after researcher): drafts the body MDX with image placeholders (`<!-- image: { "prompt": "...", "alt": "..." } -->`). Can use the `write-long-blog-post.ts` worker script directly or draft via Claude in-context.
   - **SEO editor + Image producer** (parallel, after writer): operate on different concerns. Editor uses `Edit` for text/metadata/alt fixes. Producer calls `gen-blog-inline-images.ts` which spawns `gen-image.ts` (Gemini 3.1 Flash Image Preview) per placeholder. Both `Edit` rather than `Write` so they don't clobber each other.
   - **Publisher** (sequential, after both): the orchestrator reads the final MDX, summarises to the user, leaves it as `draft: true` for human review.
3. **Worker scripts** at `scripts/agents/`:
   - `write-long-blog-post.ts` — long-form Gemini text generator with structured prompt + embedded image placeholders.
   - `gen-blog-inline-images.ts` — walks an MDX file, generates each placeholder image via Gemini, stamps `cover` back into frontmatter, idempotent on re-run.
4. **Output layout** under `apps/marketing/content/blog/`:
   ```
   YYYY-MM-DD-<slug>.mdx
   <slug>/images/01-cover.png
   <slug>/images/02-<alt-slug>.png
   ...
   ```
   The MDX references images via relative paths so fumadocs serves them out of the same content tree.
5. **Human-in-the-loop gate.** Drafts ship as `draft: true` + `aiReviewedBy: pending`. Nothing publishes without a human flipping the flag. The marketing blog index (Lit Reading Room redesign, ADR-0005) is the surface that consumes these.

## Consequences

- The journal can be populated by Claude Code without the user writing prose. A vibe-coder typing "write a blog about Postgres connection pooling" gets a 4000-word draft with researched citations and 5 inline images in one swarm run.
- Gemini cost per post: ~5 text calls (researcher + writer + SEO editor edits) + 4-8 image calls. At Gemini 3.1 Flash pricing as of mid-2026: roughly $0.05-$0.15. Order-of-magnitude cheaper than a freelancer's hour.
- Post quality depends heavily on the researcher's brief. If the user types "write something" with no topic, the swarm refuses (asks one clarifying question). If the user gives a sharp angle, the output is sharp.
- The "no em dashes / no AI-slop vocabulary" rule is enforced in the writer's system prompt. SEO editor can still slip — accept that some manual polish per post is the reality of this kind of automation.
- Drafts always require human review before publish. The skill never flips `draft: false` and never commits. This is intentional — the SEO and brand cost of publishing a hallucinated citation is much higher than the cost of one human read-through.
- Reusing existing assets (`gen-image.ts`) keeps the surface small. If we later switch from Gemini to another image model, only `gen-image.ts` changes.
- AI-search engines (ChatGPT, Perplexity, Claude) reward depth + freshness + cited sources. This swarm hits all three.

## Considered alternatives

- **Single-shot drafting.** Rejected. One Gemini call cannot do research + draft + SEO + images. The output is short and shallow.
- **Fully autonomous (auto-publish).** Rejected. Even with the no-slop guardrails and required citations, hallucinated facts are a brand killer for a developer-tools site. Human gate is non-negotiable.
- **Use OpenAI / Claude for text, Gemini only for images.** Considered. Gemini 3.1 Flash is currently strong on long-form structured output and is already wired in (`GOOGLE_AI_API_KEY`, `@google/genai`). Adding a second text-model dependency adds env vars and SDK weight for marginal quality gain. Revisit if blog quality stalls.
- **Ship the swarm as a `ruflo` hive-mind workflow.** Considered. Ruflo's coordination model is more powerful but heavier. Claude Code's `Task` tool with concurrent calls is sufficient for a 4-agent pipeline and keeps the swarm operable in a regular session without `ruflo` running.
- **Stuff images via stock photo APIs (Unsplash, Pexels).** Rejected. Stock photos undercut the editorial register the marketing site cultivates. Gemini illustrations match the brand (dark blue-black + gold) when prompted with the DESIGN.md art direction.
- **Generate only one cover image, like the old script.** Rejected — defeats the user's stated goal ("must include multiple images throughout the read to look natural"). Single-cover posts read as wire-service filler.
