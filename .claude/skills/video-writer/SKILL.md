---
name: video-writer
description: Topic-fresh Instagram Reel generator for vibestack. Spawns a seven-role swarm (researcher, script writer, visual director, parallel asset producers for voice + images + SFX + music, motion designer, renderer, publisher) that produces a 30-90 second 9:16 vertical MP4 with ElevenLabs voiceover + section-anchored Gemini stills + per-shot SFX + curated music bed + burned-in captions. Output lands at apps/marketing/public/reels/<slug>.mp4 with all source assets next to it. Use when the user asks to write a reel, generate an Instagram video, make a short video, produce a TikTok, or any "make a video about X" intent.
---

<what-to-do>

You are orchestrating a swarm that ships one 9:16 vertical Instagram Reel for vibestack. Topic-fresh only (not derived from existing blog posts). Output: MP4 at `apps/marketing/public/reels/<slug>.mp4`, all source assets at `apps/marketing/public/reels/<slug>/`. Default 60 seconds, configurable 30-90.

## Phase 0 — Brief

Ask at most two clarifying questions in one round. Required inputs:

- **Topic** — what the reel is about. May be product-adjacent or domain content.
- **Audience** — `developer` / `founder` / `mixed`. Defaults to `mixed`.
- **Mood** — `energetic` / `contemplative` / `urgent` / `chill`. Drives the music bed pick.
- **Duration** — seconds. Defaults to 60.
- **Angle** (optional) — the take. Invent one if the user did not provide and surface it for confirmation: *"Going to angle this as 'X: the thing nobody warns you about'. OK or counter?"*

If the user types `/video-writer` with no args:

> "Topic, audience (dev / founder / mixed), and mood (energetic / contemplative / urgent / chill)? I'll pick a default angle and a 60 second duration."

After one round, infer the rest and proceed.

## Phase 1 — Swarm

Six roles. Three stages, parallel in the middle:

```
Researcher (solo)
  → Script Writer (solo)
     → ( Voice + SFX + Music )  parallel
        → Motion Designer (solo)
           → Renderer (CLI)
              → Publisher (you)
```

**No image producer.** Reels are pure typographic / UI-mockup composition (see `packages/video/src/compositions/Reel.tsx`). AI-generated stills are forbidden in this surface — they read as generic and undercut the editorial register.

The Script Writer's worker (`pnpm reel:write`) picks from a fixed treatment vocabulary:

- `serif-headline` — Fraunces line with one accent-italic word
- `code-window` — editor mockup with filename + lines + caption strip
- `pr-card` — GitHub-PR-style card with optional rotated stamp
- `metric-tile` — large numeral with caps label + progress bar
- `logo-grid` — 2-6 labelled tiles
- `repetition-list` — cascading repeated phrase with optional payoff
- `eyebrow-only` — 1-second breath
- `transition` — gold-rule / split-wipe / type-cascade

Each shot also carries a `theme: "dark" | "cream"` so chapters swap palettes between vibestack's deep blue-black and warm parchment modes. One gold accent per shot, never two.

Each agent's prompt is self-contained. Use `Task` with `subagent_type: general-purpose`.

### Agent A — Researcher (solo)

> Working dir: /home/smilox/git/side/starter-saas. Research brief for a {DURATION}s Instagram Reel.
>
> Topic: "{TOPIC}". Audience: {AUDIENCE}. Angle: {ANGLE}. Mood: {MOOD}.
>
> 1. Use WebSearch to identify the **one** load-bearing claim the reel must land. Three competing reels' hooks (real, dated 2025-2026). What makes them work or fail.
> 2. Pull 2-3 source citations (real URLs) the writer can lean on.
> 3. Identify one number / contrast / specific that earns surprise (e.g. "Postgres pooler latency drops from 14ms to 2ms").
> 4. Mark the **hook**: the literal first-2s line. Must be specific, must not start with "today", "let's talk", "did you know", or any wind-up.
>
> Output one JSON object: `{ "topic", "angle", "audience", "durationSec", "mood", "hook", "loadBearingClaim", "surprise", "citations": [{"url","label"}] }`. Under 200 words plus the JSON.

### Agent B — Script Writer (solo)

> Working dir: /home/smilox/git/side/starter-saas. Draft a {DURATION}s Instagram Reel script for vibestack.
>
> Inputs (from researcher):
> ```json
> {RESEARCH_JSON}
> ```
>
> Use the worker: `pnpm reel:write --topic "..." --keyword "..." --audience {AUDIENCE} --duration {DURATION} --mood {MOOD} --angle "..." --voice-id {VOICE_ID}`. The worker calls Gemini and writes the manifest to `apps/marketing/public/reels/<slug>/manifest.json`.
>
> The worker's Gemini prompt enforces structure (hook 2-4s, 6-8 mid shots, CTA 3-4s) but it lacks the researcher's findings. After the worker writes the manifest, READ it back, identify any shot whose `text` is vague, and rewrite it using the researcher's `surprise` and `loadBearingClaim`. The first shot's text MUST be the researcher's `hook` verbatim (no paraphrase).
>
> Style rules:
> - No em dashes. Use commas, colons, periods, parens.
> - No "delve", "leverage", "harness", "unlock", "in today's world", "let's talk about".
> - Each shot speaks one beat. Sentence-cased.
> - The last shot is the CTA. One concrete action.
>
> Report the slug, shot count, total seconds, and the first three lines verbatim. Under 200 words.

### Stage 3 — Asset producers in parallel

Spawn three agents in one Task message. Each runs one worker script and reports back.

#### Agent C1 — Voice Producer
> Run `pnpm reel:voice --slug {SLUG} --voice-id EXAVITQu4vr4xnSDxMaL`. (`EXAVITQu4vr4xnSDxMaL` = Sarah, a premade voice on ElevenLabs free tier. The default Rachel voice `21m00Tcm4TlvDq8ikWAM` is library-only and 402s on free.) If it exits 78, report missing ELEVENLABS_API_KEY and stop. On success, the worker writes voice.mp3 and back-fills `captionChunks` + per-shot `durationSec` based on ElevenLabs character timestamps. Report: voice path, total seconds, caption chunk count. Under 80 words.

#### Agent C2 — SFX Producer
> Run `pnpm reel:sfx --slug {SLUG}`. Worker generates ElevenLabs SFX for every shot with an `sfx.prompt`. If no shots carry SFX, exits 0 with `generated=0`. Report counts. Under 60 words.

#### Agent C3 — Music Picker
> Run `pnpm reel:music --slug {SLUG} --mood {MOOD}`. If `packages/video/assets/music/{MOOD}/` is empty, the worker exits 78. In that case, tell the user the reel will render with no music bed and proceed. Otherwise report the picked track filename. Under 60 words.

### Agent D — Motion Designer (solo, after C1-C3)

> Working dir: /home/smilox/git/side/starter-saas. Read `apps/marketing/public/reels/{SLUG}/manifest.json` and verify the composition pipeline is ready to render:
>
> 1. Every shot has a `treatment.kind` from the supported vocabulary: `serif-headline`, `code-window`, `pr-card`, `metric-tile`, `logo-grid`, `repetition-list`, `eyebrow-only`, or `transition`. Reject `kinetic-type` and `image-anchor` (legacy).
> 2. The first shot is `serif-headline` and the last shot is `serif-headline` with an accent word.
> 3. No two adjacent shots share `treatment.kind`.
> 4. `theme` alternates between `dark` and `cream` at least once across the reel.
> 5. The manifest's `voiceover.path` resolves (or note no narration).
> 6. The manifest's `music.path` resolves (or note silent bed).
> 7. Total `durationSec` summed across shots is within 2 seconds of the manifest's stated duration. If off, adjust the last (CTA) shot's `durationSec` to compensate.
>
> If anything is mis-shaped, fix the manifest with `Edit`. Do NOT regenerate assets. Do NOT modify Reel.tsx unless you encounter a clear bug.
>
> Report the readiness checklist + any fixes you applied. Under 150 words.

### Agent E — Renderer (solo, after D)

> Working dir: /home/smilox/git/side/starter-saas. Run `pnpm reel:render --slug {SLUG}`. Wraps `npx remotion render` and produces `apps/marketing/public/reels/{SLUG}.mp4`. Renders are CPU-heavy and can take 1-3 minutes for a 60s reel on a typical dev machine. Report: render duration, output path, file size in MB, and the preview URL (`http://localhost:3000/reels/{SLUG}.mp4`). Under 100 words.

## Phase 2 — Publish (you)

After F completes, summarise to the user:

- Title, slug, total seconds, shot count, image count, file size.
- Preview URL on local dev: `http://localhost:3000/reels/{SLUG}.mp4`.
- For uploading to Instagram: open the MP4 in the Files app on phone (AirDrop, Drive, etc.), upload via the Reels composer. Native upload because the Instagram Graph API publish flow requires Meta Business + a long-lived token, not configured here.
- Where to tune: the manifest at `apps/marketing/public/reels/{SLUG}/manifest.json` carries every shot, caption, asset path. Edit it and re-run `pnpm reel:render --slug {SLUG}` to iterate without burning new API calls.

## Hard rules

- Default `draft` posture is "ready to upload, human reviews the MP4 before posting." Never publish to Instagram automatically.
- No em dashes in any script copy.
- No AI-slop vocabulary in scripts.
- Voice + music + SFX + image generation each fail gracefully when their API key is missing. Skip the missing layer, keep going, report what was skipped.

## Visual register the swarm inherits

vibestack reels look like the magazine version of a tech blog: deep blue-black, warm gold accents, Fraunces display + Geist body + JetBrains Mono labels. The bottom-left mark (`vibe/stack`) appears on every reel. The composition lives at `packages/video/src/compositions/Reel.tsx`.

## Re-running a single stage

You can rerun any worker independently without redoing the whole swarm:

- `pnpm reel:write` regenerates the script (overwrites manifest, lose prior edits).
- `pnpm reel:voice` regenerates the voiceover and timestamps (refreshes captions).
- `pnpm reel:images` regenerates only image-anchor shots whose PNG is missing.
- `pnpm reel:sfx` regenerates only SFX whose MP3 is missing.
- `pnpm reel:music` re-picks (random) within the same mood; pass `--file` to lock a specific track.
- `pnpm reel:render` re-renders from the existing manifest.

</what-to-do>

<supporting-info>

## Output layout

```
apps/marketing/public/reels/
  <slug>.mp4                  ← final render
  <slug>/
    manifest.json
    voice.mp3
    music.mp3                 ← copied from packages/video/assets/music/<mood>/
    images/01-hook.png
    images/04-key.png
    ...
    sfx/03-rule.mp3
    ...
```

## Required env

- `GOOGLE_AI_API_KEY` (or `GEMINI_API_KEY`) — script gen + image gen
- `ELEVENLABS_API_KEY` (or `ELEVEN_API_KEY`) — voice + SFX
- `ELEVENLABS_DEFAULT_VOICE_ID` — optional default voice (falls back to "21m00Tcm4TlvDq8ikWAM" — Rachel)
- `ELEVENLABS_TEXT_MODEL` — optional, defaults to `eleven_multilingual_v2`

## Cost (per reel)

- Script: 1 Gemini text call, ~$0.005
- Voice: 1 ElevenLabs TTS call, ~$0.05-0.15 depending on plan
- Images: 2-3 Gemini image calls, ~$0.06
- SFX: 1-2 ElevenLabs SFX calls, ~$0.02
- Music: free (local library)
- Render: free (local CPU)

Total: ~$0.15-0.30 per reel.

## Cost guardrail

If the user runs `/video-writer` 10 times in a session, ask once whether they want to set a per-session cap. Otherwise proceed.

</supporting-info>
