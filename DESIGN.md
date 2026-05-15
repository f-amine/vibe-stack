---
name: vibestack
description: Dark-first editorial product surface for the vibestack web app.
colors:
  ink:          "oklch(0.13 0.012 250)"
  ink-raised:   "oklch(0.165 0.012 250)"
  ink-line:     "oklch(0.22 0.012 250)"
  parchment:    "oklch(0.96 0.01 90)"
  parchment-mute: "oklch(0.74 0.012 90)"
  graphite:     "oklch(0.55 0.012 250)"
  gold:         "oklch(0.84 0.13 88)"
  gold-deep:    "oklch(0.72 0.14 80)"
  signal:       "oklch(0.74 0.18 22)"
  affirm:       "oklch(0.78 0.14 155)"
typography:
  display:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(2rem, 4.5vw, 3.25rem)"
    fontWeight: 350
    lineHeight: "1.04"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "1.625rem"
    fontWeight: 400
    lineHeight: "1.15"
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: "1.35"
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.55"
    letterSpacing: "0"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: "1"
    letterSpacing: "0.18em"
rounded:
  sharp: "0px"
  sm: "4px"
  md: "8px"
  lg: "14px"
  pill: "999px"
spacing:
  hairline: "1px"
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  xxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
  button-primary-hover:
    backgroundColor: "{colors.gold-deep}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.parchment}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
  surface:
    backgroundColor: "{colors.ink-raised}"
    textColor: "{colors.parchment}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.parchment}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
---

# Design System: vibestack

## 1. Overview

**Creative North Star: "The Lit Reading Room."**

vibestack is a SaaS starter that promises craft — devs and vibe-coders sign in expecting the app to *feel* like the marketing page they bought into. The product register has to keep that promise without becoming decorative. The metaphor is a low-lit reading room: a quiet, well-tailored interior where the page you're reading is brighter than everything around it, the typography is editorial, the surfaces are dark wood rather than chrome, and the one warm light source is the action you're meant to take.

The system rejects the SaaS-dashboard reflex: the same-sized stat cards, the icon-in-circle row, the gradient-on-black "AI product" pattern, the desaturated Linear clone. It also rejects glassmorphism and gradient text. Instead it commits to a single accent (warm gold) used like a spotlight, ink-deep surfaces with no blur, and a serif/sans pairing that nods at print without becoming costume.

**Key Characteristics:**

- Dark-first with deep blue-black ink, never pure black.
- One spotlight accent (warm gold), rationed to ≤10% of any rendered surface.
- Editorial serif (Fraunces) for moments of meaning, sans (Geist) for workflow, mono (JetBrains Mono) for the labels that are usually all-caps tracking.
- Flat surfaces with hairline rules. No floating cards.
- Motion is exponential ease-out, never bouncy. Reduced-motion respected without exception.

## 2. Colors

A near-monochrome interior with two warm lights: the parchment foreground and the gold accent. Everything else is a tinted neutral on the same blue hue (250°) so the surfaces feel like one material instead of a stack of greys.

### Primary

- **Editorial Gold** (`oklch(0.84 0.13 88)`): the one accent. Reserved for primary actions, the active sidebar item, key numerals on the dashboard, and the focus ring. Never used for full backgrounds, never on body text.
- **Deep Gold** (`oklch(0.72 0.14 80)`): hover and pressed state for the accent. Slight chroma lift, slight lightness drop.

### Neutral

- **Ink** (`oklch(0.13 0.012 250)`): canvas background. The room's wall.
- **Raised Ink** (`oklch(0.165 0.012 250)`): elevated surfaces — sidebar, popovers, the dashboard's primary panel. Stops short of the full card pattern.
- **Ink Line** (`oklch(0.22 0.012 250)`): hairline borders, table row rules, divider lines. The only border colour in the system.
- **Parchment** (`oklch(0.96 0.01 90)`): primary foreground. Warm off-white, never pure white.
- **Parchment Muted** (`oklch(0.74 0.012 90)`): secondary text, helper copy, table secondary cells.
- **Graphite** (`oklch(0.55 0.012 250)`): tertiary text, mono labels, inactive sidebar items.

### Status

- **Signal** (`oklch(0.74 0.18 22)`): destructive actions, error states, danger badges. Warm red, not stop-sign red.
- **Affirm** (`oklch(0.78 0.14 155)`): success states, confirmed plan tier, healthy webhook badges. Cooled green, not neon.

### Named Rules

**The Spotlight Rule.** Gold appears once per visible surface, on the single thing the user is meant to do, look at, or notice. Two gold elements on one screen means one of them is wrong.

**The Tinted-Neutral Rule.** Every neutral carries a small chroma toward the brand hue (250° blue, very low chroma 0.01–0.012). Pure greys, pure white, pure black are forbidden. They drift the system toward generic.

## 3. Typography

**Display Font:** Fraunces (with `ui-serif, Georgia, serif` fallback).
**Body Font:** Geist (with `ui-sans-serif, system-ui, sans-serif`).
**Label / Mono Font:** JetBrains Mono (with `ui-monospace, monospace`).

**Character:** Fraunces is the marketing site's editorial voice; in the product it appears only at page titles, big numerals, and empty-state hero copy. Geist carries the workflow without drawing attention. JetBrains Mono is reserved for labels, codes, IDs, and the tracking-heavy meta caps the marketing site uses.

### Hierarchy

- **Display** (Fraunces 350, `clamp(2rem, 4.5vw, 3.25rem)`, line-height 1.04): empty states, the onboarding hero, "Welcome back, Salma." moments. Never for body.
- **Headline** (Fraunces 400, 1.625rem, line-height 1.15): page titles ("Members", "Billing", "Account").
- **Title** (Geist 600, 0.9375rem, line-height 1.35): section headings inside a page ("Active subscription", "API keys").
- **Body** (Geist 400, 0.9375rem, line-height 1.55, max 65–75ch): paragraph copy, descriptions, table cells.
- **Label** (JetBrains Mono 500, 0.6875rem, letter-spacing 0.18em, UPPERCASE): meta chips, table headers, helper labels under inputs, breadcrumb separators.

### Named Rules

**The Two-Voice Rule.** Every screen has at most one Display moment and one Headline. If you find yourself reaching for a second Display, the screen is doing two jobs and should be split.

**The Caps-Only-In-Mono Rule.** Uppercase letters are only used in JetBrains Mono labels. Never SET A BODY LINE IN ALL CAPS in Geist or Fraunces.

## 4. Elevation

The system is flat. There are no shadows on default surfaces. Depth is conveyed by tonal layering: Ink → Raised Ink → hairline rules on Ink Line. The only "lift" in the system is the focus ring (a 2px gold ring with a 1px ink offset) and the hover scale on the primary action (`transform: scale(1.01)` for 240ms ease-out-quart).

### Named Rules

**The Flat-by-Default Rule.** Surfaces are flat at rest. No box-shadow on cards, panels, sidebars, or modals. Shadows appear only when an element is actively being dragged or floats above the page (combobox popover) — and even then they are diffuse ambient (`0 24px 60px -20px oklch(0 0 0 / 0.55)`), never harsh.

**The Hairline Rule.** All borders are 1px in Ink Line. Never 2px, never coloured, never side-stripes. If a divider needs to feel stronger, double the surrounding spacing instead.

## 5. Components

### Buttons

- **Shape:** Pill (`rounded-full`, 999px). Buttons never have square or sm-radius corners; pills carry the editorial register from the marketing hero into the product.
- **Primary:** Editorial Gold background, Ink foreground, 10×22px padding, Geist 600. Hover → Deep Gold + 1.01 scale, transition 240ms ease-out-quart. Active → no scale, slightly darker.
- **Ghost / Secondary:** Transparent background, Parchment foreground, 1px Ink Line border. Hover lifts background to `oklch(0.22 0.012 250 / 0.5)`. No accent border treatment.
- **Destructive:** Signal background, Ink foreground. Only for irrecoverable actions (revoke key, delete org).
- **Icon-only:** No background at rest, Graphite glyph. Hover lifts to Parchment Muted glyph + faint Ink Line halo.

### Inputs / Fields

- **Style:** Transparent background, 1px Ink Line border, 8px radius, 12×14px padding. Geist 400 0.9375rem.
- **Focus:** Border lifts to Gold (`oklch(0.84 0.13 88)`), 0 0 0 2px Gold-at-22% halo. No blue browser ring.
- **Error:** Border swaps to Signal, label flips to Signal Mono, message in Parchment Muted Body below.
- **Disabled:** Border drops to `Ink Line / 50%`, foreground drops to Graphite, no hover.

### Surfaces / Containers

- **Inline panels** (no card): Most content lives directly on Ink. Section breaks via hairline rules + generous vertical rhythm (40–64px), not via card backgrounds.
- **Raised panel** (one per screen max): Raised Ink background, 14px radius, 24px padding, no shadow. Reserved for the *one* thing on a screen that needs to read as a discrete unit (e.g. the active subscription block on billing).
- **Never nested.** A raised panel never contains another raised panel.

### Navigation (sidebar)

- **Background:** Raised Ink, 1px Ink Line right border.
- **Item style:** Geist 500 0.875rem, Parchment Muted at rest, Parchment on hover, Gold + 2px gold left strip with `rounded-r-sm` on active. (This is the *only* exception to the "no side stripes" rule, because here the stripe is the navigation indicator, not a decorative accent on a card.)
- **Section labels:** JetBrains Mono caps, Graphite, 0.18em tracking, 12px before the first item.
- **Footer:** User avatar + name + chevron, opens to account dropdown on Raised Ink with hairline rules.

### Page header

- **Layout:** Headline (Fraunces) on the left, optional Label-style breadcrumb above, primary action (button) right-aligned. 24px bottom margin to a hairline rule.

### Tables

- **No card wrapper.** Tables sit directly on Ink.
- **Header:** Label style (JetBrains Mono caps), Graphite, hairline rule below.
- **Rows:** 48px tall, hairline divider between rows in Ink Line, no zebra striping. Hover row → Raised Ink background, no border change.
- **Numeric cells:** right-aligned, JetBrains Mono 0.875rem.

### Empty states

- **Full-bleed.** Centred Display copy in Fraunces, one short Body line under it, one primary button. No illustrations of cartoon people. Sometimes a single ornamental rule above (1px Gold, 64px wide) is the only flourish.

## 6. Do's and Don'ts

### Do:

- **Do** use OKLCH for every colour. The frontmatter is normative; do not redefine the same token in a different colour space inside CSS.
- **Do** ration Gold. One spotlight per surface.
- **Do** use Fraunces only at page titles, big numerals, and empty-state hero copy. Geist carries everything else.
- **Do** mark all-caps labels with `font-mono` and ≥0.18em letter-spacing.
- **Do** vary spacing — 16/24/40/64 across the rhythm. Same padding everywhere reads as monotony.
- **Do** respect `prefers-reduced-motion` on every transition. Entry animations collapse to fade-only.

### Don't:

- **Don't** use pure `#000` or `#fff`. Every neutral carries chroma toward the brand hue.
- **Don't** use `background-clip: text` for gradient text on key copy. Already banned by the marketing site.
- **Don't** use glassmorphism, backdrop blurs, or neon-on-black "AI product" tropes. Already banned by the marketing site.
- **Don't** ship the same-sized stat-card grid (icon + label + big number, repeated four times). It is the cliché vibestack's anti-references call out by name.
- **Don't** use `border-left` greater than 1px as a coloured accent stripe on cards or callouts. (The sidebar's 2px active indicator is a navigation indicator, not a decoration.)
- **Don't** nest cards. A raised panel never contains another raised panel.
- **Don't** use em dashes in product copy. Use commas, colons, periods, or parentheses.
- **Don't** copy Linear's monochrome neutrality. vibestack has a voice; Linear's looks great because it is consistent with Linear, not because monochrome is universal.
