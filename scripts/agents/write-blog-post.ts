#!/usr/bin/env tsx
/**
 * Drafts a 1500-2500 word MDX blog post via Gemini and writes it as a
 * draft into `apps/marketing/content/blog/`. Skips with exit 78 when
 * GOOGLE_AI_API_KEY is unset so callers can chain it cleanly.
 *
 *   pnpm exec tsx scripts/agents/write-blog-post.ts \
 *     --topic "Self-hosting a SaaS on Dokploy" \
 *     --keyword "self-host saas" \
 *     --length 2000
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

function buildPrompt(opts: {
	topic: string;
	keyword?: string;
	length: number;
}): string {
	return [
		"You are writing a long-form blog post for stack/saas — an opinionated SaaS starter.",
		"",
		`Topic: ${opts.topic}`,
		opts.keyword
			? `Primary keyword to weave in naturally: "${opts.keyword}"`
			: "",
		`Target length: ${opts.length} words (between 1500 and 2500).`,
		"",
		"Structure:",
		"- A short opening hook (2-3 sentences).",
		"- A `## TL;DR` section with 3-5 bullet points.",
		"- Multiple `## H2` sections, with `### H3` sub-sections where it helps.",
		"- A `## FAQ` section with exactly 5 question/answer pairs (use bold for the Q).",
		"- A `## Closing` section with one call to action linking to /sign-up.",
		"",
		"Style:",
		"- Conversational but technical. No filler.",
		"- Concrete examples > generic platitudes.",
		"- Use code fences for any snippet.",
		"- Link to /docs internal pages where relevant (e.g. /docs/auth).",
		"",
		"Return only valid MDX. No explanations outside the body. Don't include a frontmatter block — the caller will add it.",
	]
		.filter(Boolean)
		.join("\n");
}

async function main(): Promise<number> {
	const args = mri(process.argv.slice(2), {
		string: ["topic", "keyword", "model"],
		default: { length: 2000 },
	});

	if (!args.topic) {
		process.stderr.write("--topic is required\n");
		return EXIT_USAGE;
	}

	const apiKey = process.env.GOOGLE_AI_API_KEY;
	if (!apiKey) {
		process.stderr.write(
			"GOOGLE_AI_API_KEY is not set — skipping. Add it to .env to enable.\n",
		);
		return EXIT_SKIPPED;
	}

	const ai = new GoogleGenAI({ apiKey });
	const model =
		args.model ?? process.env.GEMINI_TEXT_MODEL ?? "gemini-3.1-flash";
	const length = Math.max(1500, Math.min(2500, Number(args.length) || 2000));

	const prompt = buildPrompt({
		topic: String(args.topic),
		keyword: args.keyword ? String(args.keyword) : undefined,
		length,
	});

	let response: Awaited<ReturnType<typeof ai.models.generateContent>>;
	try {
		response = await ai.models.generateContent({
			model,
			contents: prompt,
		});
	} catch (err) {
		process.stderr.write(
			`gemini request failed: ${err instanceof Error ? err.message : "?"}\n`,
		);
		return EXIT_RUNTIME;
	}

	const text =
		response.candidates?.[0]?.content?.parts
			?.map((p) => ("text" in p ? p.text : ""))
			.filter(Boolean)
			.join("\n") ?? "";
	if (!text.trim()) {
		process.stderr.write("empty response from gemini\n");
		return EXIT_RUNTIME;
	}

	mkdirSync(BLOG_DIR, { recursive: true });
	const slug = slugify(String(args.topic));
	const filename = path.join(BLOG_DIR, `${fmDate()}-${slug}.mdx`);
	if (existsSync(filename)) {
		process.stderr.write(`${filename} already exists. Aborting.\n`);
		return EXIT_RUNTIME;
	}
	const mdx = [
		"---",
		`title: "${String(args.topic).replace(/"/g, '\\"')}"`,
		`description: "${args.keyword ? `Long-form post on ${String(args.keyword)}.` : "Long-form post."}"`,
		`date: "${fmDate()}"`,
		"draft: true",
		"aiGenerated: true",
		"aiReviewedBy: pending",
		"---",
		"",
		text.trim(),
		"",
	].join("\n");

	writeFileSync(filename, mdx, "utf8");
	process.stdout.write(`wrote ${filename}\n`);
	process.stdout.write(
		"Review, flip draft: false, then open a PR titled `content(blog): <title>`.\n",
	);
	return EXIT_OK;
}

main().then(
	(code) => process.exit(code),
	(err) => {
		process.stderr.write(`write-blog-post crashed: ${err}\n`);
		process.exit(EXIT_RUNTIME);
	},
);
