---
name: blog-writer
description: Long-form SEO-optimized blog post generator for vibestack. Spawns a five-agent swarm (researcher, writer, parallel pair of SEO editor + image prompt architect, image producer) to ship a 15-20 minute read (3500-5000 words) with section-anchored Gemini-generated inline images, full frontmatter, JSON-LD ready metadata, and a draft MDX file dropped into apps/marketing/content/blog/. The image prompt architect reads each section's actual content and writes a concept-specific prompt before any image is generated, so images are visually meaningful, not generic abstract shapes. Topics can be product-adjacent (tips, deep-dives, domain expertise) and don't have to be about vibestack itself. Use when the user asks to write a blog post, generate a long-form article, ship an SEO post, build editorial content, fill the journal, or any "write me a blog about X" intent.
---

<what-to-do>

You are coordinating a small swarm to ship one production-quality long-form blog post for vibestack's marketing journal. The output lands as a draft MDX file in `apps/marketing/content/blog/`, ready for human review.

Each post: **15-20 minute read = 3500-5000 words**, with **4-8 inline images** placed at natural reading breakpoints (not just a cover), full SEO metadata, internal links to vibestack surfaces where natural, and copy that earns the reader's time without being a thinly-veiled product ad.

## Phase 0 — Brief

Ask the user **at most two clarifying questions** in one round, only if their request is ambiguous. Otherwise proceed silently from a sensible inference.

Required inputs you must resolve before launching the swarm:

- **Topic** — short title or theme. May be product-adjacent ("deploying with Dokploy", "Better Auth passkeys") or pure domain content ("Postgres connection pooling in 2026", "what AI-search engines reward in 2026"). The latter is *encouraged* — it builds topical authority without sounding like an ad.
- **Audience lane** — `developer` (eng on Hacker News / Reddit / Lobsters; technical depth, code snippets, opinionated takes) or `founder` (indie hackers / vibe-coders; concrete decisions, money implications, no jargon walls) or `mixed`.
- **Angle** *(optional)* — the take. If the user said "write about X", invent the angle and surface it in your one-question round: *"Going to angle this as 'X: the underrated reason it's faster than Y'. OK or counter?"*

If the user just types `/blog-writer` with no args, ask:

> "Topic, audience (developer / founder / mixed), and any specific angle you want? I'll pick a default angle if you skip it."

After one round, infer the rest and proceed.

## Phase 1 — Spawn the swarm

There are **five worker agents**, run in three stages (not all parallel). Each agent's prompt is self-contained; they cannot see this session.

```
Researcher  →  Writer  →  ( SEO Editor  +  Image Prompt Architect )  →  Image Producer  →  Publisher
   solo        solo              parallel pair                            solo            you
```

Stage 1 (solo): Researcher.
Stage 2 (solo): Writer.
Stage 3 (parallel pair, one Task message with two Agent calls): SEO Editor + Image Prompt Architect.
Stage 4 (solo): Image Producer.
Stage 5: Publisher (you, summarising to the user).

**Why the Image Prompt Architect runs as its own agent.** Gemini image output goes generic when the prompt is generic. The Researcher's image marks are placeholders to anchor *where* images go, not what they should look like. Real visual hooks emerge only after the Writer has drafted the surrounding paragraphs. The Prompt Architect reads the actual section text and writes a tight, concept-specific prompt before Image Producer ever calls Gemini. Skipping this step is the dominant cause of "abstract gold cubes / circles / triangles" output.

### Agent A — Researcher
Owns: keyword research, competitor outline scan, internal link inventory, citation set, structured brief.

**Prompt template:**

> Working dir: /home/smilox/git/side/starter-saas. Write a research brief for a long-form vibestack blog post. Topic: "{TOPIC}". Audience: {AUDIENCE}. Angle: {ANGLE}.
>
> Your job, in order:
> 1. **Keyword work.** If the `toprank` plugin is installed (test by checking whether `/toprank:keyword-research` is in the available skills list), invoke it for the topic and capture: primary keyword, 5-8 secondary keywords, search volume + difficulty if returned, and the questions People-Also-Ask surfaces. If toprank is not available, fall back to WebSearch — query the topic, scan 5 top-ranking results, extract the H2 structure of each, and infer keyword + secondaries from title overlap.
> 2. **Competitor outline scan.** WebSearch for "{TOPIC}" and read the top 3 results. Note: H2 structure, word count estimate, what they got right, what they missed. Identify a gap you can fill.
> 3. **Internal link inventory.** Scan `apps/marketing/content/docs/` and `apps/marketing/content/blog/` for posts/pages that this article could link to. Output exact `/docs/...` or `/blog/...` URLs from `.url` frontmatter where possible.
> 4. **Cite-worthy sources.** 5-8 external URLs the writer can cite. Real, working URLs. Skip anything older than 2024 unless it's canonical (Postgres docs, RFCs, etc.). No Wikipedia.
> 5. **Outline.** 6-9 H2 sections (each H2 ≈ 400-700 words in the final piece). For each: one-sentence intent + 2-3 H3 sub-bullets. The piece must total 3500-5000 words. Build the outline to that budget.
> 6. **Image-break points.** Mark which H2 boundaries call for an inline image, and what each image should depict (≥ 4, ≤ 8 marks total, including the cover). Each image mark gets a one-sentence prompt for Gemini (e.g. "Editorial illustration: minimal abstract diagram of three Postgres connections converging, gold accent, dark blue-black background, no text"). Style language must match the marketing brand — see DESIGN.md at the repo root.
>
> Output a single JSON object printed to stdout, schema:
> ```json
> {
>   "topic": "...", "angle": "...", "audience": "...",
>   "primaryKeyword": "...", "secondaryKeywords": ["..."],
>   "competitors": [{"url": "...", "gap": "..."}],
>   "internalLinks": [{"url": "/docs/...", "label": "..."}],
>   "citations": [{"url": "...", "label": "..."}],
>   "wordTarget": 4200,
>   "outline": [
>     {"heading": "Why X matters in 2026", "intent": "frame the problem", "subBullets": ["...", "..."]}
>   ],
>   "imageMarks": [
>     {"after": "Why X matters in 2026", "geminiPrompt": "Editorial...", "alt": "Abstract..."}
>   ]
> }
> ```
>
> Report back under 200 words plus the JSON.

### Agent B — Writer
Owns: drafting the 3500-5000 word MDX body from the researcher's brief. Image placeholders only — no real images yet.

**Prompt template:**

> Working dir: /home/smilox/git/side/starter-saas. Draft the long-form blog post body for vibestack.
>
> Inputs (from researcher):
> ```json
> {RESEARCH_JSON}
> ```
>
> Constraints:
> - **Length: 3500-5000 words**, distributed across the researcher's outline. Don't pad — if a section is genuinely 400 words, leave it.
> - **Voice**: confident, specific, technical-but-readable. Concrete examples beat platitudes. No filler ("In today's world", "It is important to note"). Conversational where it earns its place, formal where precision matters.
> - **Style rules**: no em dashes (use commas, colons, periods, parens). No gradient-text language. No "AI slop" phrases ("delve", "in the realm of", "leverage", "harness the power of", "unlock", "tapestry"). No empty intros — the first paragraph must do real work.
> - **Structure**:
>   - 2-3 sentence opening hook. State the angle.
>   - `## TL;DR` section: 3-5 bullets. Don't title it anything cute.
>   - All H2s from the researcher's outline, in order. Use `### H3` sub-sections inside an H2 only when there's real sub-structure.
>   - Internal links to the researcher's `internalLinks` array, woven naturally. At least 3. Markdown links: `[label](/docs/...)`.
>   - External citations from the researcher's `citations` array, attributed in prose ("per the Postgres docs", "Zuckerberg's [2025 letter](...)"). At least 4.
>   - A `## FAQ` section with exactly 5 question/answer pairs. Bold the Qs.
>   - A `## Closing` section: one paragraph, one call to action that's relevant (often `/sign-up` for vibestack, but feel free to link `/docs/<topic>` if the user is mid-task).
>   - Code fences for any snippet. Specify the language.
> - **Image placeholders.** At each `imageMark.after` boundary in the researcher's brief, drop a literal HTML comment in this exact shape: `<!-- image: { "prompt": "PLACEHOLDER", "alt": "PLACEHOLDER" } -->`. Use literal "PLACEHOLDER" for both fields, OR a one-line stub describing the section topic. The Image Prompt Architect (Agent C1) rewrites these later with section-anchored prompts; don't waste tokens crafting them now. The position matters, the content does not yet.
> - **Frontmatter.** Build the frontmatter at the top. Fields: `title` (one line, ≤ 60 chars, includes primary keyword naturally), `description` (≤ 155 chars meta-description-shaped, includes primary keyword), `date` (today, YYYY-MM-DD), `keywords` (array: primary + 3-5 secondaries), `author` ("vibestack"), `readingTime` (estimated minutes, integer), `draft: true`, `aiGenerated: true`, `aiReviewedBy: pending`, `tags` (2-4 short kebab-case strings).
>
> Use the `Write` tool to write the final MDX to `apps/marketing/content/blog/{YYYY-MM-DD}-{slug}.mdx`. Slug = kebab-case of the primary keyword (max 64 chars).
>
> Report the file path, word count (run `wc -w` on the body, not frontmatter), and how many image placeholders you embedded. Under 150 words.

### Agent C1 — Image Prompt Architect *(NEW; runs in parallel with C2)*
Owns: rewriting every `<!-- image: ... -->` placeholder's `prompt` and `alt` so each image is anchored to the actual section content it sits inside. The Writer's placeholders are intentionally generic; this agent makes them specific.

**Prompt template:**

> Working dir: /home/smilox/git/side/starter-saas. Rewrite the inline image prompts in `{DRAFT_FILE_PATH}`. Read the file, find every `<!-- image: { "prompt": "...", "alt": "..." } -->` block, then for each one:
>
> 1. **Locate the surrounding section.** Look at the nearest `## H2` heading above the placeholder (or the nearest `### H3` if no H2 is closer) and the 1-3 paragraphs immediately surrounding the placeholder.
> 2. **Identify the section's load-bearing idea.** What specific concept, tension, or claim does this section make? "AI coding agents replace boilerplate" is a load-bearing claim; "tools are evolving" is not. If the section is a list of items, pick the one item that most needs visualising.
> 3. **Pick a visual concept** for that idea. Concrete > abstract. **Avoid the default reflex of "abstract gold shape on dark background".** Push for:
>    - A concrete metaphor: e.g. for a section on race conditions, "two hands reaching for the same chess piece, frozen at the instant of contact"; for connection pooling, "a single drinking-fountain tap with five identical paper cups stacked beneath it"; for type narrowing, "a wide funnel narrowing to a single drop".
>    - A stylised object or still life: a battered Moleskine open to a diagram page, a pile of unopened mail with one envelope on top, an oscilloscope screen frozen on a single waveform.
>    - A scene with one human-scale element: a single chair in a server room, an empty whiteboard with three magnets, a porthole window onto a starlit ocean.
> 4. **Pick a visual style per image** — vary across the post so the body doesn't read as one repeated illustration. Rotate between (pick one per image, do not repeat the same style twice in a row):
>    - "Editorial photograph, single-light still life, shallow depth of field"
>    - "Isometric vector illustration, 3D-perspective, thin line work"
>    - "Minimalist flat illustration, mid-century editorial poster style"
>    - "Cinematic frame still, wide-angle, soft directional rim-light"
>    - "Architectural diagram in the style of a hand-drawn 1970s technical manual"
>    - "Macro photograph of a single object on a textured surface"
> 5. **Brand constraints** (apply to every prompt verbatim, at the end):
>    - Background: deep blue-black, never pure black. Reference colour: `oklch(0.13 0.012 250)`.
>    - One warm-gold accent appears somewhere in the frame. Reference colour: `oklch(0.84 0.13 88)`.
>    - No text, no logos, no UI mockups, no charts, no graphs with axes, no Lorem Ipsum.
>    - No human faces in close-up. Hands, silhouettes, partial figures are fine.
>    - Aspect ratio: roughly 2:1 horizontal.
> 6. **Alt text**: write a literal, screen-reader-quality description of the rewritten visual. Not a paraphrase of the section. 8-16 words.
>
> Each rewritten prompt should be **3-5 sentences**, not a single noun phrase. Lead with the concept, then the style, then the brand constraints. Example shape:
> ```
> Two open hands stretched toward each other, palms up, the last grain of sand falling between them onto a stone floor. Editorial photograph, single-light still life with deep shadow, shallow depth of field. The grain catches a warm-gold highlight, the only saturated colour in the frame. Deep blue-black ambient background, no text, no logos. 2:1 horizontal frame.
> ```
>
> Use the `Edit` tool to replace each placeholder block in place. Preserve the `<!-- image: { ... } -->` delimiters and the JSON structure (just change the `prompt` and `alt` values). Do **NOT** rewrite or move any other content. Do **NOT** generate images here — only rewrite text.
>
> Important coordination: Agent C2 (SEO Editor) is editing the same file in parallel on different concerns (meta, headings, internal links, keyword density). It edits text outside the image placeholder blocks. Limit your edits to the JSON inside `<!-- image: ... -->` blocks. If you collide on the file, retry the affected Edit; the placeholder structure makes the diff trivially mergeable.
>
> Report under 200 words: how many placeholders you rewrote, one example before/after, and the section heading each rewrite anchored to.

### Agent C2 — SEO Editor
Owns: pass over the writer's draft. Tighten meta, fix H1/H2 hierarchy, add alt text to image placeholders, verify internal links resolve, check schema readiness.

**Prompt template:**

> Working dir: /home/smilox/git/side/starter-saas. SEO editing pass on the draft at `{DRAFT_FILE_PATH}`. Read it, then:
>
> 1. **Meta sanity**: title 50-60 chars, description 140-160 chars. Both include the primary keyword. If the writer overshot, trim. Don't change the angle.
> 2. **Heading hierarchy**: exactly one H1 (the title) — but MDX uses frontmatter for that, so the body should NOT contain an `# H1`. All body headings are H2 minimum. Verify and fix.
> 3. **Keyword density**: primary keyword appears in title, description, first 100 words, and in 2-4 H2s. Not stuffed — read naturally. Adjust if obvious gaps. Avoid stuffing.
> 4. **Internal links**: verify every `[label](/foo)` resolves to a real path under `apps/marketing/content/` or a top-level marketing route (`/`, `/blog`, `/docs`, `/changelog`, `/roadmap`, `/status`, `/sign-up`, `/sign-in`). Replace broken ones with the closest real URL or remove with a brief note in your report.
> 5. **External link rel**: all `https?://` URLs in markdown links are fine as-is (MDX renderer handles rel=noopener for external links if the Link component supports it, otherwise it's a follow-up). Don't rewrite, just count.
> 6. **Image placeholders**: every `<!-- image: ... -->` block must have a non-empty `alt`. If any are missing, infer alt from the surrounding paragraph.
> 7. **FAQ schema-readiness**: the `## FAQ` section format must be exactly `**Q. ...**` paragraphs followed by an A paragraph — fumadocs converts those to FAQPage JSON-LD downstream.
> 8. **Reading time**: re-count words (`wc -w` excluding frontmatter), recompute reading time at ~230 wpm, update the `readingTime` frontmatter field.
>
> Edit the file in place using `Edit`. Don't rewrite the whole thing. Don't change voice or argument.
>
> Report the changes you made as a short bulleted list, plus the final word count and reading time. Under 200 words.

### Agent D — Image Producer *(runs AFTER C1 + C2 both return)*
Owns: walk the draft (with prompts now rewritten by C1), generate each inline image via Gemini, replace placeholders with `<img>` HTML.

**Prompt template:**

> Working dir: /home/smilox/git/side/starter-saas. Generate inline images for `{DRAFT_FILE_PATH}`.
>
> Pipeline:
> 1. Read the file. Find every `<!-- image: { "prompt": "...", "alt": "..." } -->` block.
> 2. For each placeholder, in order: derive an output filename from the post's slug + image index, e.g. `apps/marketing/content/blog/{slug}/images/01-{kebab-slugified-alt}.png`.
> 3. Run `pnpm exec tsx scripts/gen-image.ts --prompt "..." --out "..." --size 1536x768 --max-kb 320` for each. The script exits 78 if `GOOGLE_AI_API_KEY` is missing — if that happens, stop processing immediately and report the gap. Don't fake images.
> 4. Replace the placeholder comment in the MDX with a Markdown image: `![{alt}]({relPath})`. Compute `relPath` relative to the MDX file (e.g. `./{slug}/images/01-foo.png`).
> 5. The FIRST image becomes the cover. Also write a `cover` frontmatter field pointing at it.
> 6. Don't generate images if any already exist on disk at the target path — reuse them (idempotency).
>
> Use `Bash` for `pnpm exec tsx scripts/agents/gen-blog-inline-images.ts --file "{DRAFT_FILE_PATH}"` — that worker script does all of the above in one shot. If the script exits 78, report the missing key and stop. If exit 0, report how many images landed.
>
> Report: number of images generated, total bytes on disk, any prompts that returned a "model refused" or similar (Gemini sometimes rejects). Under 150 words.

## Phase 2 — Sequence

Five workers, three stages. Do not collapse:

1. **Researcher (A)** alone — keyword work, outline, citation set, *positions* of image breakpoints (not their content).
2. **Writer (B)** alone, on A's brief — drafts the full body MDX with `<!-- image: ... -->` placeholders at the marked positions. The placeholder `prompt` field can be a one-line stub at this stage (e.g. `"placeholder, will be rewritten"`) because C1 owns the real prompts.
3. **SEO Editor (C2) + Image Prompt Architect (C1)** in parallel — one Task message, two Agent calls. C2 edits prose/metadata/alts outside the image blocks. C1 rewrites the JSON inside the image blocks (anchored to the actual section text). Tell each agent the other is running concurrently and to keep edits non-overlapping.
4. **Image Producer (D)** alone, after both C1 and C2 return — generates images from the rewritten prompts and replaces every placeholder with an `<img>` HTML tag.
5. **Publisher (you)** — read the final MDX, summarise to the user, leave as draft.

Never spawn D before C1 has returned. If you skip C1 and let D consume the Writer's stub prompts, you get exactly the "abstract gold shape" failure mode that motivated adding C1 in the first place.

## Phase 2.5 — Re-running prompts on an existing draft

If a user looks at images on an already-published draft and says they're generic, you can re-run **just** the Image Prompt Architect (C1) plus Image Producer (D) on the existing MDX without redoing research or writing. Steps:

1. Spawn C1 alone with `{DRAFT_FILE_PATH}` set to the existing post. The agent reads the file, rewrites every `<!-- image: ... -->` block's `prompt` and `alt`. It does not touch any prose.
2. Delete the stale image files: `rm -rf apps/marketing/public/blog/<slug>/` (the producer is idempotent and will regenerate). Or rename the directory to keep the originals.
3. Spawn D alone. It re-reads the file, sees the new prompts, regenerates every image.

You can also do a single-image targeted rerun: open the MDX, edit only the offending block's `prompt` by hand, delete the matching PNG under `public/blog/<slug>/`, then run `pnpm blog:images --file <path>` directly without any agents.

## Phase 3 — Publish & report back

After C and D both return:

1. Read the final MDX. Show the user:
   - Title, slug, final word count, reading time, image count.
   - The first 2-3 paragraphs (so they can sniff-test voice).
   - Frontmatter summary.
2. Suggest the next step: `pnpm dev:marketing` then open `http://localhost:3000/blog/{slug}` to preview. To publish: edit the file, flip `draft: false`, commit, open a PR titled `content(blog): {title}`.
3. If `GOOGLE_AI_API_KEY` was missing and images didn't land, the post still ships as a text-only draft — say so explicitly and tell the user to set the key and re-run `pnpm exec tsx scripts/agents/gen-blog-inline-images.ts --file <path>`.

## Hard rules

- **Never commit or push.** Always leave the draft as `draft: true` for human review.
- **Never invent citations.** Every external URL must be reachable; if a research source 404s, drop it.
- **Never use em dashes** in body copy.
- **No AI-slop vocabulary**: delve, leverage, harness, unlock, tapestry, realm, journey, embark, intricate, paradigm, ecosystem (unless literal), navigate the complexities of, in today's world, it is important to note. Replace with concrete verbs.
- **Don't rewrite the file all at once after C+D**. They use `Edit`, not `Write`, so they preserve each other's changes.
- **Skip honestly.** If keyword research can't complete (no toprank, WebSearch fails), say so — don't fabricate volumes.

## Style direction the swarm inherits

The vibestack journal voice (set in `apps/marketing/src/app/[locale]/blog/page.tsx`'s editorial header):

> "Field notes from the people building vibestack. Essays, post-mortems, and small ideas. Published when something is worth saying, not on a schedule."

That's the bar. Posts read like a senior engineer wrote them between commits, not like a content marketer scheduled them.

</what-to-do>

<supporting-info>

## Worker scripts

The Image producer agent calls `scripts/agents/gen-blog-inline-images.ts`. The Writer agent can optionally use `scripts/agents/write-long-blog-post.ts` (single-shot Gemini long-form generator) if direct Claude drafting is unavailable. The Researcher agent has no dedicated script; it uses WebSearch + Read + Grep.

## Output layout

```
apps/marketing/content/blog/
  YYYY-MM-DD-{slug}.mdx
  {slug}/
    images/
      01-cover.png
      02-{section-alt}.png
      ...
```

The MDX references images via relative paths (`./{slug}/images/...`). Fumadocs serves them from `apps/marketing/content/blog/{slug}/images/`.

## Frontmatter template

```yaml
---
title: "Postgres Connection Pooling in 2026: What Actually Matters"
description: "Real-world tuning for pgBouncer, RDS Proxy, and the new in-Postgres pooler. What to pick, when to scale, and the failure modes nobody warns you about."
date: "2026-05-15"
keywords: ["postgres connection pooling", "pgbouncer", "rds proxy", "postgres performance"]
author: "vibestack"
readingTime: 18
draft: true
aiGenerated: true
aiReviewedBy: pending
cover: "./postgres-connection-pooling-2026/images/01-cover.png"
tags: ["postgres", "performance", "infra", "deep-dive"]
---
```

## Cost guardrail

A full run with images = ~5 Gemini text calls (researcher + writer + SEO editor passes) + 4-8 image calls. At Gemini 3.1 Flash pricing as of mid-2026 that's roughly $0.05-$0.15 per post. If the user runs `/blog-writer` 10× in a session, that's still under $2. No need to gate, but mention the rough cost once if asked.

</supporting-info>
