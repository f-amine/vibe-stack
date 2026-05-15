# Vibestack skills

These skills ship vendored with vibestack. They are loaded automatically by Claude Code when you open this repo — no install step required.

Source: [mattpocock/skills](https://github.com/mattpocock/skills), pinned at vendor time. Update with `pnpm skills:update` (see below).

## Workflow

```
new feature   → /grill-with-docs → /to-prd → /to-issues → /tdd → /review
UI / design   → /impeccable  (mandatory entry for ANY frontend work)
SEO / GEO     → /toprank:seo-analysis  (auto-routes on any SEO / Search Console / ranking phrase)
Ads (Google,  → /toprank:google-ads-audit, /toprank:meta-ads-audit
 Meta)        (NotFair MCPs in .mcp.json carry the API calls)
bug           → /diagnose → /tdd
refactor itch → /improve-codebase-architecture → ADR → /to-issues
new idea      → /prototype  (throwaway to flush out the design)
```

`/impeccable` is the **default skill for any frontend / UI work** in this repo — redesigns, new pages, "make this look better", spacing, colour, motion, copy, empty states, error states. Vibe-coders do not need to invoke it by name; agents and Claude sessions must route there first. See [ADR-0005](../../docs/adr/0005-impeccable-for-frontend-design.md).

`toprank` is the **default plugin for SEO, GEO (Generative Engine Optimization), Google Ads, and Meta Ads**. Installed via Claude Code marketplace during `/setup` — not vendored — so it stays current. Skills read live Google Search Console + PageSpeed Insights data via OAuth. See [ADR-0006](../../docs/adr/0006-toprank-for-seo-geo-ads.md).

## Available skills

| Skill | When to use |
|-------|-------------|
| `setup` | First-time clone-to-running-app walkthrough. Generates `.env`, helps you collect API keys, installs `toprank` plugin. |
| `impeccable` | **Mandatory for any UI / design work.** Reads `PRODUCT.md` + `DESIGN.md` and applies them to redesigns, polish, motion, accessibility, theming. |
| `blog-writer` | **Mandatory for any blog / journal / long-form content.** Spawns a researcher → writer → SEO editor + image producer swarm. 15-20 min read with Gemini-generated inline images. Output: draft MDX in `apps/marketing/content/blog/`. |
| `toprank` *(plugin)* | **Mandatory for SEO / GEO / Google Ads / Meta Ads.** Installed via marketplace, not vendored. Skills: `seo-analysis`, `keyword-research`, `content-writer`, `geo-optimizer`, `meta-tags-optimizer`, `schema-markup-generator`, `broken-link-checker`, `seo-page`, `google-ads-*`, `meta-ads-*`. Uses live Search Console + PageSpeed APIs. |
| `grill-with-docs` | Stress-test plans against `CONTEXT.md` + ADRs. Updates docs inline as decisions crystallise. |
| `grill-me` | Stress-test a plan without doc updates. |
| `to-prd` | Turn current conversation context into a PRD issue. |
| `to-issues` | Break a PRD into independently-grabbable issues (tracer-bullet vertical slices). |
| `triage` | Triage incoming issues through a state machine. |
| `tdd` | Red-green-refactor implementation. |
| `diagnose` | Reproduce → minimise → hypothesise → fix loop for hard bugs. |
| `improve-codebase-architecture` | Find deepening / refactoring opportunities informed by CONTEXT.md + ADRs. |
| `prototype` | Throwaway prototype to flush out a design before committing. |
| `write-a-skill` | Author a new vibestack skill following the project conventions. |

## Updating vendored skills

```bash
pnpm skills:update     # pulls latest from mattpocock/skills and overlays into .claude/skills/
```

This script preserves any vibestack-only skills (`setup`, anything you add). It only refreshes the upstream-managed ones.

## Adding your own skills

Use `/write-a-skill` from inside Claude Code, or create the folder by hand:

```
.claude/skills/<your-skill>/
  SKILL.md         # frontmatter + instructions
  *.md             # supporting docs the skill loads on demand
```

Register the skill in the table above so other contributors discover it.
