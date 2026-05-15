# ADR-0005 — `/impeccable` is the default skill for all frontend work

**Status**: Accepted
**Date**: 2026-05-15

## Context

vibestack's two audiences — devs and vibe-coders — produce wildly different UI output by default. Devs reach for shadcn primitives and ship something functional but generic. Vibe-coders describe an intent ("make the dashboard nicer") and a model fills in plausible-but-shallow code. Neither path produces the polished, opinionated craft that the marketing page promises.

The `/impeccable` skill exists to bridge that gap: it loads project-level `PRODUCT.md` and `DESIGN.md` context, follows a brand/product register protocol, and applies sub-commands (`craft`, `shape`, `audit`, `polish`, `animate`, etc.) that lift output above generic. But skills are pull-based by default — they only fire when a user names them or when the description happens to match the trigger phrasing. Vibe-coders won't know to type `/impeccable`.

## Decision

`/impeccable` becomes a **mandatory, auto-routed entry point for any frontend / UI work** in vibestack. The rule is documented in three load-bearing places:

1. **`CLAUDE.md`** — pre-loaded into every Claude session in this repo. States that UI/design tasks must invoke `/impeccable` before any component, page, styling, theming, copy, or motion edit, even when the user did not name it.
2. **`AGENTS.md`** — same rule, framed for autonomous agents and sub-agent dispatch.
3. **`.claude/skills/README.md`** — workflow diagram lists `/impeccable` as the default UI lane, separate from `/grill-with-docs` (which handles product specification, not visual design).

`PRODUCT.md` and `DESIGN.md` live at the repo root and are project-level inputs for the skill. They are bootstrapped on first run via `/impeccable teach` and `/impeccable document`, then maintained as the design language evolves.

## Consequences

- Vibe-coders don't have to learn a skill name. "Make the dashboard nicer" routes through the skill via the CLAUDE.md directive.
- Every UI change now passes through the brand/product register and the documented design tokens — fewer drive-by Tailwind class additions, fewer one-off `#hex` colours, fewer inconsistent radii.
- `PRODUCT.md` and `DESIGN.md` become canonical. If they go stale, output regresses. Maintainers must update them when the brand shifts.
- The rule is enforced at session-prompt level, not by tooling. A user can still ignore the directive — but the surface area where that can happen is the same surface area where they could already bypass `/tdd` or `/grill-with-docs`.
- TDD and design now overlap: a UI feature touches both `/impeccable` (for visual craft) and `/tdd` (for behaviour). Sequence is `/impeccable` → shape the design → `/tdd` → implement against the design.

## Considered alternatives

- **Leave `/impeccable` as opt-in.** Rejected — defeats the "vibe-coders don't have to know" goal.
- **Build a hook that auto-invokes `/impeccable` on file globs (`apps/**/components/**`).** Tempting but heavy: hooks misfire on internal refactors, force unnecessary context loads, and add a moving part to the harness.
- **Inline the skill's content into CLAUDE.md.** Rejected — the skill is large, version-managed externally, and benefits from progressive disclosure. CLAUDE.md only needs to route.
