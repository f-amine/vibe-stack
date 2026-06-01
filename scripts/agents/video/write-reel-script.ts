#!/usr/bin/env tsx
/**
 * Generate a reel script as a structured shot array via Gemini. Writes the
 * result to apps/marketing/public/reels/<slug>/manifest.json so downstream
 * workers (voice / images / sfx / music / render) can fill in their fields.
 *
 *   pnpm reel:write \
 *     --topic "Why your AI agent is bad at race conditions" \
 *     --audience developer \
 *     --duration 60 \
 *     --mood urgent \
 *     --voice-id 21m00Tcm4TlvDq8ikWAM
 *
 * Exit codes: 0 ok, 64 usage, 70 runtime, 78 missing key.
 */
import path from "node:path";

import { GoogleGenAI } from "@google/genai";
import mri from "mri";
import "dotenv/config";

import {
	EXIT_OK,
	EXIT_RUNTIME,
	EXIT_SKIPPED,
	EXIT_USAGE,
	ensureReelDir,
	geminiKey,
	manifestPath,
	slugify,
	writeManifest,
} from "./lib";

type Audience = "developer" | "founder" | "mixed";

function asAudience(raw: unknown): Audience {
	const s = String(raw ?? "mixed").toLowerCase();
	if (s.startsWith("dev")) return "developer";
	if (s.startsWith("fou") || s.startsWith("ind")) return "founder";
	return "mixed";
}

function buildPrompt(opts: {
	topic: string;
	audience: Audience;
	durationSec: number;
	mood: string;
	angle?: string;
}): string {
	const targetShots = Math.round(opts.durationSec / 6);
	return `Write the script for a vertical Instagram Reel for vibestack. The video is rendered in Remotion as a sequence of composed scenes. NO AI imagery. NO stock footage. Every scene is built from a fixed vocabulary of typographic / UI-mockup treatments.

Topic: ${opts.topic}
${opts.angle ? `Angle: ${opts.angle}` : ""}
Audience: ${opts.audience}
Total duration: ${opts.durationSec}s
Mood: ${opts.mood}
Target shot count: ${targetShots}

VOICE (the line being spoken — \`shot.text\`):
- Senior practitioner talking to a friend. Conversational, not corporate.
- Each shot's \`text\` is the literal voice line. It is what the viewer HEARS, not what they see.
- The voice and the on-screen display are NOT the same thing. The voice continues the thought; the display crystallises one moment of it. (Example: voice says "every founder rebuilds the same three files day one"; on-screen headline shows "the same three files."). NEVER use the voice line verbatim as the on-screen headline. The display is always shorter, punchier, sometimes a single word.
- Concrete > abstract. Use real numbers ("11 modules", "1240 lines"), real product names ("Stripe webhooks", "Better Auth"), real timeframes ("week one", "by Monday").
- BANNED clichés (instant rejection if used): delve, leverage, harness, unlock, tapestry, realm, journey, embark, intricate, paradigm, ecosystem, "in today's world", "it is important to note", "in the realm of", "navigate the complexities of", "supercharge", "harness the power of", "game-changer", "needle-moving", "hit the ground running".
- BANNED punctuation: em dashes (—). Use commas, colons, periods, parentheses, or two short sentences.
- Average ~6s per shot. First shot 3-4s, last shot 3-4s, mids 5-8s.
- Each voice line must do work. If you can delete it without losing the argument, delete it.

DISPLAY (what's shown on screen in each treatment):
- Headlines should be 2-6 words, NOT a paraphrase of the voice line. They name the moment.
- Stats must be specific numbers, not "many" or "lots". If the topic doesn't give a real number, invent a plausible-precise one ("47 webhooks", not "many webhooks").
- Code lines must reference real APIs from real libraries (Stripe, Better Auth, Drizzle, Resend, Next App Router). No "yourFunc()" stand-ins.
- PR card messages mimic real commit subjects ("fix: stop reinventing the same plumbing"), real shas (8-char hex), real time stamps ("2 weeks ago").
- Brand names get italicised + gold accent on serif headlines.

Output a single JSON object only. No prose, no markdown, no fences. Schema:

{
  "slug": "kebab-case-from-topic-max-48-chars",
  "title": "Short title to file under",
  "hook": "The literal first-2s line",
  "cta": "The literal closing CTA line",
  "shots": [
    {
      "id": "01-hook",
      "text": "The line being voiced for this shot. Sentence-cased. No quotes around it.",
      "durationSec": 4,
      "theme": "dark" | "cream",
      "treatment": { ... see vocabulary below ... },
      "sfx": { "prompt": "optional ElevenLabs SFX, sparingly: at most 2 across the whole reel" }
    }
  ]
}

theme: alternate "dark" (deep blue-black) and "cream" (warm parchment) between chapters. Default to dark. Use cream for 2-3 shots that mark a pivot.

TREATMENT VOCABULARY — pick exactly one kind per shot. Match the kind to what the voice line is doing.

(A) serif-headline — the dominant building block. Use for the hook, the punchline, and the CTA. Splits a Fraunces line into words; mark ONE word as "accent: true" to italicise it in gold.
{
  "kind": "serif-headline",
  "eyebrow": "optional caps-mono chip above, ≤6 words",
  "words": [ { "text": "the" }, { "text": "same" }, { "text": "disease.", "accent": true } ],
  "subline": "optional small Geist line that drops after the headline"
}

(B) code-window — a CSS/TS/SQL editor mockup. Use to show the problem ("the same boilerplate everyone writes") or the solution ("auth.signUp({...})"). Pick ONE line to "highlight: true" for the line that matters.
{
  "kind": "code-window",
  "filename": "filename.ts",
  "caption": "BOTTOM CAPS LABEL",
  "lines": [
    { "text": "auth.signUp({ email, password });" },
    { "text": "billing.createCheckout({ priceId });", "highlight": true },
    { "text": "webhooks.verify(req.body, sig);", "strike": true }
  ]
}

(C) pr-card — GitHub PR comment mockup. Use for a "moment of judgment" beat (senior reviewing, customer reacting). Optional stamp slaps a rotated tag on top.
{
  "kind": "pr-card",
  "author": "senior-dev@team",
  "message": "the bold message",
  "sha": "a1f3c92",
  "ago": "2 weeks ago",
  "stamp": { "text": "RIPPED OUT", "color": "red", "rotation": -10 }
}

(D) metric-tile — large numeral with caps label + optional progress bar. Use for one numeric beat per reel ("11 pre-wired modules", "3,500 lines of boilerplate skipped").
{
  "kind": "metric-tile",
  "label": "PRE-WIRED MODULES",
  "value": "11",
  "barFraction": 0.92,
  "subline": "optional small line below the bar"
}

(E) logo-grid — 2-4 labelled tiles (browser support / stack / integrations). Use REAL brand icons via "slug" (simple-icons names). Provide a 1-3 char "mark" as fallback only.

Valid slugs (use exactly these, lowercase, no dashes/dots):
nextdotjs, react, vue (NOT supported, use mark "Vue" instead), svelte, astro, nuxt, remix, reactrouter
typescript, javascript, python, go, rust, nodedotjs, deno, bun, webassembly
drizzle, postgresql, mysql, mongodb, redis, supabase
tailwindcss, shadcnui, vite, vitest
trpc, zod, hono, fastify, graphql
vercel, cloudflare, netlify, docker, kubernetes, linux
github, gitlab, npm, pnpm
claude, anthropic, googlegemini, google
stripe, resend, posthog, sentry, elevenlabs
linear, notion, figma, expo, biome, openjsfoundation, betterstack

If brand not in list, omit "slug" — uses letter mark fallback. Example:

{
  "kind": "logo-grid",
  "eyebrow": "STACK YOU ALREADY KNOW",
  "items": [
    { "slug": "nextdotjs", "mark": "Nx", "name": "Next 16", "ok": true },
    { "slug": "drizzle",   "mark": "Dz", "name": "Drizzle" },
    { "slug": "trpc",      "mark": "tR", "name": "tRPC" },
    { "mark": "BA",        "name": "Better Auth" }
  ]
}

(F) repetition-list — same phrase stacked in cascading positions. Use ONCE per reel max, to visualise a problem before stating it ("!important !important !important …" before "nobody trusts the cascade").
{
  "kind": "repetition-list",
  "phrase": "!important",
  "count": 6,
  "payoff": "optional Fraunces punchline that drops after the cascade"
}

(G) eyebrow-only — pure 1-second breath beat with just a caps chip. Use between chapters.
{ "kind": "eyebrow-only", "text": "PART TWO" }

(H) transition — a 1-second motif breath. Use sparingly.
{ "kind": "transition", "motif": "gold-rule" | "split-wipe" | "type-cascade" }

DISTRIBUTION for a ${opts.durationSec}s reel (~${targetShots} shots):
- Shot 01: serif-headline (hook). Eyebrow names the trap. Headline 3-5 words with an italic-gold accent word. Subline is one sharp body sentence stating the stakes.
- Shot 02-03: code-window OR metric-tile OR repetition-list — show the problem concretely. NEVER two text-only treatments adjacent.
- Shot 04 or 05: pr-card with a stamp — the "moment of judgment". Voice carries the dialog around it.
- Shot 06: metric-tile with the headline number that justifies the product (e.g. "11" pre-wired modules).
- Shot 07: logo-grid with 4 real brand slugs from the catalogue, showing the stack.
- Shot 08 (last): serif-headline (CTA). Accent on the brand word.

EVERY shot needs:
- A precise \`subline\` (serif-headline) OR a precise \`subline\` (metric-tile) OR a precise \`payoff\` (repetition-list) OR a precise \`caption\` (code-window). The composition is built to display secondary context in every shot. Don't leave optional fields empty unless the treatment has no slot for them. The composition fills the lower half from these fields.
- Treatments without an explicit secondary slot (pr-card, logo-grid) auto-render stats / footers — your job is just to make the primary content sharp enough that the secondary contextualises it.

Hard rules:
- Shot 01 MUST be serif-headline.
- Last shot MUST be serif-headline with the CTA, accent on the brand word.
- Total shots' durationSec must sum to within 2s of the target duration.
- Never use the same treatment kind twice in a row.
- Never use "kinetic-type" or "image-anchor" (removed).
- Voice line ≠ display headline. Verify after writing each shot.
- No em dashes anywhere in voice or display. Run a final pass.

Return ONLY the JSON object.`;
}

async function main(): Promise<number> {
	const args = mri(process.argv.slice(2), {
		string: ["topic", "audience", "mood", "angle", "model", "voice-id"],
		default: { duration: 60 },
	});

	if (!args.topic) {
		process.stderr.write("--topic is required\n");
		return EXIT_USAGE;
	}

	const key = geminiKey();
	if (!key) {
		process.stderr.write(
			"Neither GOOGLE_AI_API_KEY nor GEMINI_API_KEY is set, skipping.\n",
		);
		return EXIT_SKIPPED;
	}

	const topic = String(args.topic);
	const audience = asAudience(args.audience);
	const durationSec = Math.max(15, Math.min(90, Number(args.duration) || 60));
	const mood = (args.mood as string) ?? "contemplative";
	const angle = args.angle ? String(args.angle) : undefined;
	const voiceId =
		(args["voice-id"] as string) ??
		process.env.ELEVENLABS_DEFAULT_VOICE_ID ??
		"21m00Tcm4TlvDq8ikWAM";

	const ai = new GoogleGenAI({ apiKey: key });
	const model =
		(args.model as string) ??
		process.env.GEMINI_TEXT_MODEL ??
		"gemini-flash-latest";

	const prompt = buildPrompt({ topic, audience, durationSec, mood, angle });

	let raw: string;
	try {
		const response = await ai.models.generateContent({
			model,
			contents: [{ role: "user", parts: [{ text: prompt }] }],
		});
		raw =
			response.candidates?.[0]?.content?.parts
				?.map((p) => ("text" in p ? p.text : ""))
				.filter(Boolean)
				.join("\n")
				?.trim() ?? "";
	} catch (err) {
		process.stderr.write(
			`gemini request failed: ${err instanceof Error ? err.message : "?"}\n`,
		);
		return EXIT_RUNTIME;
	}

	if (!raw) {
		process.stderr.write("empty response from gemini\n");
		return EXIT_RUNTIME;
	}

	// Strip code fences if model emitted them.
	const cleaned = raw
		.replace(/^```(?:json)?\n?/, "")
		.replace(/\n?```$/, "")
		.trim();

	let parsed: {
		slug?: string;
		title?: string;
		hook?: string;
		cta?: string;
		shots?: unknown[];
	};
	try {
		parsed = JSON.parse(cleaned);
	} catch (err) {
		process.stderr.write(
			`could not parse model output as JSON: ${err instanceof Error ? err.message : "?"}\n`,
		);
		process.stderr.write(`---raw---\n${cleaned.slice(0, 800)}\n---\n`);
		return EXIT_RUNTIME;
	}

	const slug = parsed.slug ? slugify(parsed.slug) : slugify(topic);
	const dir = ensureReelDir(slug);

	const manifest = {
		slug,
		title: parsed.title ?? topic,
		hook: parsed.hook ?? "",
		cta: parsed.cta ?? "",
		durationSec,
		fps: 30,
		dimensions: { width: 1080, height: 1920 },
		mood,
		shots: parsed.shots ?? [],
		voiceId,
		createdAt: new Date().toISOString(),
		aiGenerated: true,
	};

	writeManifest(slug, manifest);

	process.stdout.write(
		`${JSON.stringify(
			{
				ok: true,
				slug,
				dir,
				manifest: path.relative(process.cwd(), manifestPath(slug)),
				shots: (parsed.shots as unknown[]).length,
				model,
			},
			null,
			2,
		)}\n`,
	);
	return EXIT_OK;
}

main().then(
	(code) => process.exit(code),
	(err) => {
		process.stderr.write(`write-reel-script crashed: ${err}\n`);
		process.exit(EXIT_RUNTIME);
	},
);
