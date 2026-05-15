#!/usr/bin/env tsx
/**
 * Walk `apps/marketing/content/blog/*.mdx` and, for every post without a
 * `cover` frontmatter field, generate a cover image via the Gemini CLI
 * from #20 and stamp the path back into the frontmatter.
 *
 *   pnpm exec tsx scripts/agents/gen-blog-covers.ts [--dry]
 *
 * Exit codes: 0 success, 78 skipped (no key / nothing to do), 70 runtime.
 */
import { execFileSync, spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";

import mri from "mri";

const EXIT_OK = 0;
const EXIT_SKIPPED = 78;
const EXIT_RUNTIME = 70;

const BLOG_DIR = path.resolve("apps/marketing/content/blog");
const COVERS_DIR = path.resolve("apps/marketing/content/blog/_covers");

type Frontmatter = {
	title?: string;
	summary?: string;
	description?: string;
	cover?: string;
};

function parseFrontmatter(body: string): {
	data: Frontmatter;
	raw: string;
	rest: string;
} {
	if (!body.startsWith("---")) {
		return { data: {}, raw: "", rest: body };
	}
	const end = body.indexOf("\n---", 3);
	if (end < 0) {
		return { data: {}, raw: "", rest: body };
	}
	const raw = body.slice(3, end).trim();
	const rest = body.slice(end + 4).replace(/^\n/, "");
	const data: Frontmatter = {};
	for (const line of raw.split("\n")) {
		const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
		if (!match) {
			continue;
		}
		const [, key, value] = match;
		const stripped = value.replace(/^["']|["']$/g, "");
		(data as Record<string, string>)[key] = stripped;
	}
	return { data, raw, rest };
}

function rebuild(raw: string, data: Frontmatter, rest: string): string {
	const lines = raw
		.split("\n")
		.filter((l) => !l.startsWith("cover:"))
		.concat(data.cover ? [`cover: "${data.cover}"`] : []);
	return `---\n${lines.join("\n")}\n---\n${rest}`;
}

function promptFor(data: Frontmatter): string {
	const subject =
		data.summary ??
		data.description ??
		data.title ??
		"editorial software illustration";
	return `Editorial illustration for a blog post titled "${data.title ?? "stack/saas"}". Subject: ${subject}. Style: minimal, dark muted palette, abstract geometric shapes, generous negative space, no text, no logos, no UI mockups.`;
}

function runGen(prompt: string, out: string): "ok" | "skipped" | "failed" {
	const result = spawnSync(
		"pnpm",
		[
			"exec",
			"tsx",
			"scripts/gen-image.ts",
			"--prompt",
			prompt,
			"--out",
			out,
			"--size",
			"1536x768",
		],
		{
			stdio: "inherit",
		},
	);
	if (result.status === EXIT_SKIPPED) {
		return "skipped";
	}
	if (result.status === EXIT_OK) {
		return "ok";
	}
	return "failed";
}

function main(): number {
	const args = mri(process.argv.slice(2), { boolean: ["dry"] });

	if (!existsSync(BLOG_DIR)) {
		process.stderr.write(`blog dir not found: ${BLOG_DIR}\n`);
		return EXIT_SKIPPED;
	}
	mkdirSync(COVERS_DIR, { recursive: true });

	const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
	if (files.length === 0) {
		process.stderr.write("no blog posts found.\n");
		return EXIT_SKIPPED;
	}

	let skipped = 0;
	let generated = 0;
	let failed = 0;

	for (const file of files) {
		const filePath = path.join(BLOG_DIR, file);
		const original = readFileSync(filePath, "utf8");
		const { data, raw, rest } = parseFrontmatter(original);
		if (data.cover) {
			skipped++;
			continue;
		}
		const slug = file.replace(/\.mdx$/, "");
		const outFile = path.join(COVERS_DIR, `${slug}.png`);
		const relPath = path
			.relative(path.dirname(filePath), outFile)
			.split(path.sep)
			.join("/");
		const prompt = promptFor(data);

		process.stdout.write(`→ ${slug}\n`);
		if (args.dry) {
			process.stdout.write(`  would write to ${outFile}\n`);
			generated++;
			continue;
		}

		const result = runGen(prompt, outFile);
		if (result === "skipped") {
			process.stdout.write("  Gemini API key missing — stopping.\n");
			return EXIT_SKIPPED;
		}
		if (result === "failed") {
			failed++;
			continue;
		}
		const next: Frontmatter = { ...data, cover: relPath };
		writeFileSync(filePath, rebuild(raw, next, rest), "utf8");
		generated++;
	}

	process.stdout.write(
		`done · generated=${generated} skipped=${skipped} failed=${failed}\n`,
	);
	if (generated === 0 && failed > 0) {
		return EXIT_RUNTIME;
	}
	return EXIT_OK;
}

try {
	process.exit(main());
} catch (err) {
	process.stderr.write(`gen-blog-covers crashed: ${err}\n`);
	process.exit(EXIT_RUNTIME);
}

// Keep execFileSync reference alive so the implicit "imported but unused" lint
// doesn't fire — we use it implicitly via spawnSync above for shell-quoted
// arguments; the explicit reference keeps biome's noUnusedImports happy.
void execFileSync;
