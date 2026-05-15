# Product

## Register

product

## Users

Two audiences sign in to the vibestack web app:

- **Developers** — engineers cloning vibestack as a SaaS foundation. They live in their editor, hit the app maybe twice a day to verify auth, billing, and org flows. They want speed, dense information, and keyboard-first interactions. They notice generic shadcn dashboards and dismiss them.
- **Vibe-coders** — product folks, designers, indie founders working through Claude Code rather than writing every line. They are not new to software but are intentionally non-technical at the keyboard. They want the app to feel intentional and finished so that whatever they ship on top of it feels intentional and finished. The default shadcn look reads to them as "your dev didn't try."

Both users are signed-in, repeat visitors. There is no acquisition surface here — that's the marketing app's job. The web app's job is to make signed-in time feel quietly excellent.

## Product Purpose

The authed product surface for vibestack. Houses Better Auth flows after sign-in, dashboard overview, organisation switching + member management, billing (Polar.sh), account settings, and the onboarding wizard for first-time users. Success: a fresh cloner spins up vibestack and immediately wants to *keep* the visual treatment instead of ripping it out.

## Brand Personality

Confident. Modern. Quietly editorial.

The marketing app uses Fraunces (serif display) + Geist (sans) + a warm gold-yellow accent on near-black blue. The web app keeps the same DNA but turns the volume down — serifs are reserved for moments of emphasis (page titles, key numbers, empty-state hero copy), sans carries the workflow. The accent is rationed: never on full surfaces, only on the one thing in view that matters most.

Three words: **assured, editorial, focused.**

## Anti-references

- The default shadcn dashboard layout — sidebar + cards + same-sized stat tiles. Avoid the hero-metric grid. If we ship stats, they ship inline or as a typographic ledger, not in four identical rounded rectangles.
- Linear's monochrome neutrality. Linear is excellent, but vibestack is not Linear; copying it costs us the editorial brand voice from the marketing site.
- Glassmorphism, gradient text on key copy, neon-on-black "AI product" tropes. The marketing site already disqualifies these — the product must follow.
- Settings pages that read like a long form. Account / org / billing / security need to feel like reading a thoughtfully designed magazine spread, not filling out a tax return.

## Design Principles

1. **Workflow first, decoration second.** Every screen has one job. Whatever supports that job gets the strongest visual weight; everything else recedes.
2. **Editorial seams, product surfaces.** Borrow the marketing site's serifs, accent, and rhythm at moments of *transition* (page entries, empty states, the first sign-in, the first paid event). Inside dense product surfaces (tables, member lists, settings panels), revert to product calm.
3. **Density with breathing room.** Information-dense, but never crowded. Vary spacing instead of cramming everything to the same gap.
4. **Dark by default, light by choice.** Match the marketing site's color scheme: deep blue-black, warm off-white, gold accent. Light theme exists but is the deliberate alternative, not the safe default.
5. **No fake data, no demo UI.** When a real user lands on a screen with nothing to show, design the empty state as if it were the most important screen in the app, because for that user, it is.

## Accessibility & Inclusion

- WCAG 2.2 AA target across all authed surfaces. Contrast verified against the dark theme (the default) and re-verified against the light theme.
- Honour `prefers-reduced-motion` — entry animations on auth and onboarding must collapse to opacity-only.
- Full keyboard navigation. Every modal, sidebar item, dropdown, and form is operable without a mouse. Visible, high-contrast focus rings on every focusable element.
- All interactive copy passes the "screen-reader sentence" test: read the label aloud — does it make sense in isolation?
- French + English supported via `next-intl`. No copy hard-coded outside the locale files.
