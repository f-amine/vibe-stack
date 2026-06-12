#!/usr/bin/env tsx
/**
 * Drafts a 3500-5000 word MDX blog post via Gemini, with inline image
 * placeholders at natural breakpoints, and writes it as a draft into
 * `apps/marketing/content/blog/`. The `blog-writer` skill spawns this
 * (or an equivalent Claude-drafting path) as the Writer worker.
 *
 *   pnpm exec tsx scripts/agents/write-long-blog-post.ts \
 *     --topic "Postgres connection pooling in 2026" \
 *     --keyword "postgres connection pooling" \
 *     --audience developer \
 *     --angle "the underrated reason it's faster than you think" \
 *     --length 4200
 *
 * Output: `apps/marketing/content/blog/YYYY-MM-DD-<slug>.mdx` with
 * `<!-- image: { "prompt": "...", "alt": "..." } -->` placeholders for the
 * image producer worker to fill via `gen-blog-inline-images.ts`.
 *
 * Exits 78 when GOOGLE_AI_API_KEY is unset (skipped, not error). 70 on
 * runtime failure. 64 on usage error. 0 on success.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { GoogleGenAI } from "@google/genai";
import mri from "mri";
import "dotenv/config";

const EXIT_OK = 0;
const EXIT_USAGE = 64;
const EXIT_SKIPPED = 78;
const EXIT_RUNTIME = 70;

const BLOG_DIR = path.resolve("apps/marketing/content/blog");
const MIN_LEN = 3500;
const MAX_LEN = 5000;
const MIN_IMAGES = 4;
const MAX_IMAGES = 8;

type Audience = "developer" | "founder" | "mixed";

function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 64);
}

function fmDate(): string {
	return new Date().toISOString().slice(0, 10);
}

function asAudience(raw: unknown): Audience {
	const s = String(raw ?? "mixed").toLowerCase();
	if (s === "developer" || s === "dev") return "developer";
	if (s === "founder" || s === "indie") return "founder";
	return "mixed";
}

function buildSystem(audience: Audience): string {
	const voice = {
		developer:
			"Senior engineer on Hacker News. Technical depth, code snippets, opinionated takes. Skeptical of marketing language.",
		founder:
			"Indie hacker who reads Lenny + IndieHackers. Concrete decisions, money implications, no jargon walls. Time-poor.",
		mixed:
			"Smart generalist building software. Technical enough to read code, not so deep that they tune out on hand-waves.",
	}[audience];

	return [
		"You are a senior writer for vibestack — an opinionated, AI-first SaaS starter.",
		"Voice baseline:",
		voice,
		"",
		"Hard style rules (non-negotiable):",
		"- No em dashes anywhere. Use commas, colons, periods, parentheses.",
		"- No AI-slop vocabulary. Banned: delve, leverage, harness, unlock, tapestry, realm, journey, embark, intricate, paradigm, navigate the complexities of, in today's world, it is important to note. Replace with concrete verbs.",
		"- No filler intros. The first sentence does real work.",
		"- Concrete examples > generic platitudes. Numbers, names, code, dates.",
		"- Code fences for any snippet. Specify the language.",
	].join("\n");
}

function buildPrompt(opts: {
	topic: string;
	keyword: string;
	angle?: string;
	audience: Audience;
	length: number;
	imageCount: number;
}): string {
	const imagePlaceholderExample = [
		"<!-- image: {",
		'  "prompt": "Editorial illustration: minimal abstract diagram of three Postgres connection pools converging into one, gold accent on a deep blue-black background, no text, no UI, no logos",',
		'  "alt": "Abstract diagram of three Postgres connection pools converging"',
		"} -->",
	].join("\n");

	return [
		`Write a long-form blog post on: "${opts.topic}".`,
		`Primary SEO keyword to weave in naturally: "${opts.keyword}".`,
		opts.angle ? `Angle / take: ${opts.angle}.` : "",
		`Target length: ${opts.length} words (must land between ${MIN_LEN} and ${MAX_LEN}).`,
		`Inline images: include exactly ${opts.imageCount} image placeholders, placed at natural reading breakpoints (one near the top before TL;DR or after the hook, then roughly one per major H2 section).`,
		"",
		"Structure (exact order, exact headings):",
		"1. A 2-3 sentence opening hook. State the angle in the first sentence.",
		"2. The first image placeholder (used as the cover by the image producer).",
		"3. `## TL;DR` — 3-5 punchy bullet points.",
		"4. 6-9 `## H2` sections following a coherent argument, not a checklist. Each H2 ≈ 400-700 words. Use `### H3` sub-sections only when there's real sub-structure.",
		"5. Drop image placeholders between major H2 blocks (≈ every 600-900 words after the cover).",
		"6. `## FAQ` — exactly 5 question/answer pairs. Each formatted as `**Q. <question?>**` paragraph, then the answer as a normal paragraph. (Fumadocs converts this into FAQPage JSON-LD downstream.)",
		"7. `## Closing` — one paragraph + one call to action. Link `/sign-up` if the angle fits, or a relevant `/docs/<slug>` if the reader is mid-task.",
		"",
		"Image placeholder format — emit EXACTLY this (escape JSON properly), one per breakpoint:",
		imagePlaceholderExample,
		"",
		"Each placeholder's `prompt` must follow the vibestack art direction:",
		'- "Editorial illustration: <subject>, minimal, dark blue-black background, warm gold accent, abstract geometric or diagrammatic, no text, no UI mockups, no logos, generous negative space."',
		"- The subject must illustrate the surrounding section's idea, not the whole post.",
		"",
		"Other rules:",
		"- Internal links: include at least 3 markdown links to vibestack surfaces. Prefer `/docs/<thing>`, `/blog/<post>`, `/sign-up`. If you can't confirm a route exists, prefer the closest plausible one (the SEO editor will fix broken links).",
		"- External citations: include at least 4 markdown links to real reachable URLs (Postgres docs, RFCs, well-known engineering blogs, dated 2024-2026 unless canonical).",
		"- Code fences: use them whenever showing a config, command, or schema.",
		"- Never write `# H1` in the body — the title lives in frontmatter only.",
		"",
		"Return only the body MDX. No frontmatter, no preamble, no closing notes. Start with the opening hook paragraph.",
	]
		.filter(Boolean)
		.join("\n");
}

function buildFrontmatter(opts: {
	topic: string;
	keyword: string;
	secondaries: string[];
	audience: Audience;
	wordCount: number;
	tags: string[];
}): string {
	const readingTime = Math.max(15, Math.round(opts.wordCount / 230));
	const keywords = [opts.keyword, ...opts.secondaries].slice(0, 6);
	const description = `${opts.topic}. ${
		opts.audience === "developer"
			? "Engineering deep-dive."
			: opts.audience === "founder"
				? "Practical guide for shipping."
				: "Long-form take."
	} ~${readingTime} min read.`.slice(0, 155);

	return [
		"---",
		`title: ${JSON.stringify(opts.topic)}`,
		`description: ${JSON.stringify(description)}`,
		`date: "${fmDate()}"`,
		`keywords: ${JSON.stringify(keywords)}`,
		`tags: ${JSON.stringify(opts.tags)}`,
		`author: "vibestack"`,
		`readingTime: ${readingTime}`,
		"draft: true",
		"aiGenerated: true",
		"aiReviewedBy: pending",
		"---",
	].join("\n");
}

function countWords(body: string): number {
	return body.trim().split(/\s+/).filter(Boolean).length;
}

async function generate(opts: {
	apiKey: string;
	model: string;
	system: string;
	prompt: string;
}): Promise<string> {
	const ai = new GoogleGenAI({ apiKey: opts.apiKey });
	const response = await ai.models.generateContent({
		model: opts.model,
		contents: [
			{
				role: "user",
				parts: [{ text: `${opts.system}\n\n---\n\n${opts.prompt}` }],
			},
		],
	});
	const text =
		response.candidates?.[0]?.content?.parts
			?.map((p) => ("text" in p ? p.text : ""))
			.filter(Boolean)
			.join("\n") ?? "";
	return text.trim();
}

async function main(): Promise<number> {
	const args = mri(process.argv.slice(2), {
		string: ["topic", "keyword", "angle", "audience", "model", "tags"],
		default: { length: 4200 },
	});

	if (!args.topic) {
		process.stderr.write("--topic is required\n");
		return EXIT_USAGE;
	}
	if (!args.keyword) {
		process.stderr.write("--keyword is required (primary SEO keyword)\n");
		return EXIT_USAGE;
	}

	const apiKey = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
	if (!apiKey) {
		process.stderr.write(
			"Neither GOOGLE_AI_API_KEY nor GEMINI_API_KEY is set, skipping. Add one to .env to enable.\n",
		);
		return EXIT_SKIPPED;
	}

	const model =
		(args.model && String(args.model)) ||
		process.env.GEMINI_TEXT_MODEL ||
		"gemini-3.1-flash";
	const length = Math.max(
		MIN_LEN,
		Math.min(MAX_LEN, Number(args.length) || 4200),
	);
	const imageCount = Math.max(
		MIN_IMAGES,
		Math.min(MAX_IMAGES, Math.round(length / 800)),
	);
	const audience = asAudience(args.audience);
	const topic = String(args.topic);
	const keyword = String(args.keyword);
	const angle = args.angle ? String(args.angle) : undefined;

	const system = buildSystem(audience);
	const prompt = buildPrompt({
		topic,
		keyword,
		angle,
		audience,
		length,
		imageCount,
	});

	let body: string;
	try {
		body = await generate({ apiKey, model, system, prompt });
	} catch (err) {
		process.stderr.write(
			`gemini request failed: ${err instanceof Error ? err.message : "?"}\n`,
		);
		return EXIT_RUNTIME;
	}

	if (!body) {
		process.stderr.write("empty response from gemini\n");
		return EXIT_RUNTIME;
	}

	// Strip any frontmatter the model may have emitted despite the instructions.
	const stripped = body.replace(/^---\n[\s\S]*?\n---\n*/, "");
	const wordCount = countWords(stripped);
	if (wordCount < Math.floor(MIN_LEN * 0.85)) {
		process.stderr.write(
			`draft is under target: ${wordCount} words (target ${length}, min ${Math.floor(
				MIN_LEN * 0.85,
			)}). Aborting; re-run with a more specific topic or higher --length.\n`,
		);
		return EXIT_RUNTIME;
	}

	const tags = args.tags
		? String(args.tags)
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean)
				.slice(0, 4)
		: [audience === "developer" ? "engineering" : "product", "deep-dive"];
	const frontmatter = buildFrontmatter({
		topic,
		keyword,
		secondaries: [],
		audience,
		wordCount,
		tags,
	});

	mkdirSync(BLOG_DIR, { recursive: true });
	const slug = slugify(keyword || topic);
	const filename = path.join(BLOG_DIR, `${fmDate()}-${slug}.mdx`);
	if (existsSync(filename)) {
		process.stderr.write(`${filename} already exists. Aborting.\n`);
		return EXIT_RUNTIME;
	}

	const mdx = `${frontmatter}\n\n${stripped}\n`;
	writeFileSync(filename, mdx, "utf8");

	const imagePlaceholders = (mdx.match(/<!-- image:/g) ?? []).length;
	process.stdout.write(
		JSON.stringify(
			{
				ok: true,
				file: filename,
				slug,
				wordCount,
				readingTime: Math.max(15, Math.round(wordCount / 230)),
				imagePlaceholders,
				model,
			},
			null,
			2,
		),
	);
	process.stdout.write("\n");
	return EXIT_OK;
}

main().then(
	(code) => process.exit(code),
	(err) => {
		process.stderr.write(`write-long-blog-post crashed: ${err}\n`);
		process.exit(EXIT_RUNTIME);
	},
);
