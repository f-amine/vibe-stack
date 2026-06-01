# ADR-0008 — `/video-writer` is the default skill for short-form video

**Status**: Accepted
**Date**: 2026-05-15

## Context

vibestack ships a marketing blog (`/blog-writer`, ADR-0007) and SEO surface (`toprank`, ADR-0006) for organic written content. Short-form vertical video (Instagram Reels, TikTok, YouTube Shorts) is the other half of 2026 content distribution. Algorithm preference, time-on-platform, and AI-search discovery (ChatGPT image-and-video tools reference embedded Reels) all skew toward video.

A vibe-coder cannot reasonably script, voice-over, storyboard, source music, render, caption, and publish a 60-second reel for every product update. We need a swarm that produces one reel from a topic and an audience hint.

The component pieces are mature in mid-2026:

- **Remotion 4** for React-defined compositions rendered to MP4 via headless Chromium.
- **ElevenLabs** for TTS (with character-level timestamp endpoint) and Sound Generation.
- **Gemini 3.1 Flash Image Preview** for vertical stills.
- **GSAP 3** already used in the marketing app for editorial motion.

What did not exist was an orchestrator that gates each piece behind a brand-aware agent, prevents the "abstract gold shapes" image failure mode (ADR-0007), and lands the output where the rest of the project can find it.

## Decision

`/video-writer` is the default skill for any short-form vertical video intent in vibestack. Eight load-bearing pieces:

1. **Topic-fresh only**, no blog-derivation. Reduces orchestration surface and forces every reel to earn its own hook. Blog-to-reel reuse can be added later as a researcher mode if demand emerges.
2. **Reels-first, 60s default, 30-90s range**. 9:16 vertical. Same composition serves TikTok and YouTube Shorts without re-render.
3. **Workspace at `packages/video/`** as `@vibestack/video`. Remotion compositions in `src/compositions/`, types in `src/lib/`, shared music library in `assets/music/<mood>/`, default manifest in `src/lib/default-manifest.ts` so Remotion Studio opens standalone.
4. **Output under `apps/marketing/public/reels/`**: the rendered MP4 at `<slug>.mp4`, all source assets (manifest, voice, music, images, SFX) at `<slug>/`. Marketing app serves them directly; no second deploy.
5. **Seven-role swarm**:
   ```
   Researcher → Script Writer → Visual Director → ( Voice + Images + SFX + Music )parallel → Motion Designer → Renderer → Publisher
   ```
   Visual Director runs before any asset gen so image prompts are section-anchored, not generic — same lesson as ADR-0007's blog-writer Image Prompt Architect.
6. **Audio stack: ElevenLabs for voice + SFX, curated local music library**. One vendor for synth audio (one key, one billing relationship). Music stays local because per-render AI music in 2026 is uneven and AI-music licensing is unsettled. Mood-keyed directories (`energetic` / `contemplative` / `urgent` / `chill`) make the picker trivial.
7. **Burned-in captions from ElevenLabs character timestamps**. Word-perfect, no Whisper round-trip, no Instagram auto-caption drift. The composition's `Captions` component renders them with gold accent on key words.
8. **Save MP4, no auto-publish**. Instagram Graph API publish requires a Facebook Business account, an Instagram Business profile, a long-lived access token, and Meta verification. We surface the MP4 + preview URL; the user uploads via Instagram's composer. Auto-publish becomes a downstream ADR if/when scale demands.

## Consequences

- A vibe-coder can ship a reel-per-week without scripting, voicing, illustrating, or rendering anything by hand. Per-reel API cost ≈ $0.15-$0.30.
- Remotion's headless render is CPU-heavy. A 60s reel on a typical laptop takes 1-3 minutes. Acceptable for now; cloud render (Remotion Lambda) can be added later behind the same `pnpm reel:render` interface without touching the swarm.
- ElevenLabs is the second hard API dependency after Gemini. We accept the lock-in trade because voice quality is the dominant retention driver on Reels, and ElevenLabs leads in 2026.
- The curated music library is empty by default. Without files in `packages/video/assets/music/<mood>/`, reels render with no music bed; the music picker exits 78 (skipped) gracefully and the user sees a clear "drop mp3 files here" message. We ship `README.md` files in each mood directory explaining the convention.
- The whole pipeline degrades gracefully on missing keys: no Gemini key → no images (kinetic-type fallback); no ElevenLabs key → no voice or SFX (silent render with captions only impossible, but the swarm reports the gap and the user can still use the manifest as a script source).
- The `apps/marketing/public/reels/` directory becomes the single source of truth for video output. Marketing's static deploy serves them at `/reels/<slug>.mp4` post-deploy; no separate CDN setup.

## Considered alternatives

- **AI-generated video shots per shot (Veo, Runway).** Rejected for now: ~$0.20-1 per shot, uneven quality, 2-5 minute renders per shot. The kinetic-type + Gemini-still mix matches the marketing brand and costs an order of magnitude less. Revisit when Veo/Runway pricing drops or our brand calls for full motion.
- **Stock B-roll from Pexels / Pixabay APIs.** Rejected: stock footage looks like stock footage, undercuts the editorial register the marketing site cultivates. AI stills with strict art direction stay on-brand.
- **Auto-publish via Instagram Graph API at MVP.** Rejected for ~3 hours of Meta verification dance that gates the rest of the work. Save-and-upload is the right MVP; auto-publish becomes an opt-in extension.
- **AI music gen (Suno / AudioCraft / Mubert).** Rejected: licensing is unsettled in 2026 and the music output is the least mature corner of generative audio. A curated 20-track local library covers the four moods without the IP question.
- **Whisper-transcribe the voice for captions.** Rejected: ElevenLabs already returns character-level timestamps, Whisper adds a third API hop, and we control the script so transcription has nothing to discover.
- **Composition co-located with the marketing app.** Rejected: Remotion's Chromium-based render pulls a heavy dependency tree that doesn't belong in the marketing app's `node_modules`. Workspace isolation keeps the marketing deploy lean.
- **Larger-than-7-role swarm (split researcher + script editor + caption editor, etc.).** Rejected: each additional agent compounds orchestration latency. Seven is the minimum that keeps the parallelism (4 asset producers) and the failure isolation that justifies the swarm shape.
