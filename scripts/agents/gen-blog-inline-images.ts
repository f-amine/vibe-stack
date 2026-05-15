#!/usr/bin/env tsx
/**
 * Walk a single MDX blog post, find every inline image placeholder, and
 * generate the image via `scripts/gen-image.ts` (Gemini). Replace each
 * placeholder with a Markdown image reference, then stamp the first image
 * back into the frontmatter as `cover`.
 *
 *   pnpm exec tsx scripts/agents/gen-blog-inline-images.ts \
 *     --file apps/marketing/content/blog/2026-05-15-postgres-connection-pooling.mdx
 *
 * Placeholder format (emitted by the Writer worker):
 *
 *   <!-- image: { "prompt": "Editorial illustration: ...", "alt": "..." } -->
 *
 * Output paths (served from Next's /public root so Image works without any
 * MDX-relative resolution gymnastics):
 *
 *   apps/marketing/public/blog/<slug>/01-<kebab-alt>.png
 *   apps/marketing/public/blog/<slug>/02-<kebab-alt>.png
 *   ...
 *
 * In the MDX the writer references them as `/blog/<slug>/<n>-<alt>.png`.
 * The first image becomes the cover. Idempotent: skips images that already
 * exist on disk. Exits 78 when GOOGLE_AI_API_KEY is unset.
 */
import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";

import mri from "mri";
import "dotenv/config";

const EXIT_OK = 0;
const EXIT_USAGE = 64;
const EXIT_SKIPPED = 78;
const EXIT_RUNTIME = 70;

type Placeholder = {
	index: number;
	raw: string;
	prompt: string;
	alt: string;
};

function kebab(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

function parseFrontmatter(body: string): {
	raw: string;
	rest: string;
	endIdx: number;
} {
	if (!body.startsWith("---")) {
		return { raw: "", rest: body, endIdx: 0 };
	}
	const end = body.indexOf("\n---", 3);
	if (end < 0) {
		return { raw: "", rest: body, endIdx: 0 };
	}
	const raw = body.slice(3, end).trim();
	const rest = body.slice(end + 4).replace(/^\n/, "");
	return { raw, rest, endIdx: end + 4 };
}

function rebuildFrontmatter(raw: string, cover: string): string {
	const lines = raw
		.split("\n")
		.filter((l) => !/^cover\s*:/.test(l))
		.concat([`cover: "${cover}"`]);
	return `---\n${lines.join("\n")}\n---\n`;
}

function findPlaceholders(body: string): Placeholder[] {
	const out: Placeholder[] = [];
	const re = /<!--\s*image:\s*(\{[\s\S]*?\})\s*-->/g;
	let match: RegExpExecArray | null = re.exec(body);
	let i = 0;
	while (match) {
		const jsonText = match[1];
		try {
			const obj = JSON.parse(jsonText) as { prompt?: string; alt?: string };
			if (obj.prompt && obj.alt) {
				i += 1;
				out.push({
					index: i,
					raw: match[0],
					prompt: obj.prompt,
					alt: obj.alt,
				});
			}
		} catch {
			// Skip malformed placeholders; the SEO editor pass should have caught them.
		}
		match = re.exec(body);
	}
	return out;
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
			"--max-kb",
			"320",
		],
		{ stdio: "inherit" },
	);
	if (result.status === EXIT_SKIPPED) return "skipped";
	if (result.status === EXIT_OK) return "ok";
	return "failed";
}

function main(): number {
	const args = mri(process.argv.slice(2), {
		string: ["file"],
		boolean: ["dry"],
	});

	if (!args.file) {
		process.stderr.write("--file is required (path to the MDX draft)\n");
		return EXIT_USAGE;
	}

	const filePath = path.resolve(String(args.file));
	if (!existsSync(filePath)) {
		process.stderr.write(`${filePath} not found\n`);
		return EXIT_USAGE;
	}

	const body = readFileSync(filePath, "utf8");
	const { raw, rest } = parseFrontmatter(body);

	const placeholders = findPlaceholders(body);
	if (placeholders.length === 0) {
		process.stdout.write(
			"no image placeholders in this MDX. Either already processed or writer skipped them. Nothing to do.\n",
		);
		return EXIT_OK;
	}

	// Slug: derive from filename without YYYY-MM-DD- prefix and .mdx suffix.
	const baseName = path.basename(filePath, ".mdx");
	const slug = baseName.replace(/^\d{4}-\d{2}-\d{2}-/, "");
	// Write to apps/marketing/public/blog/<slug>/ so Next serves them at
	// /blog/<slug>/... without any MDX-relative gymnastics.
	const publicDir = path.resolve("apps/marketing/public/blog", slug);
	mkdirSync(publicDir, { recursive: true });

	let generated = 0;
	let reused = 0;
	let failed = 0;
	let skippedNoKey = false;
	let coverRelPath: string | null = null;

	let mutated = body;

	for (const ph of placeholders) {
		const idx = String(ph.index).padStart(2, "0");
		const altSlug = kebab(ph.alt) || `image-${idx}`;
		const outPath = path.join(publicDir, `${idx}-${altSlug}.png`);
		const relPath = `/blog/${slug}/${idx}-${altSlug}.png`;

		const exists = existsSync(outPath);
		if (!exists) {
			if (args.dry) {
				process.stdout.write(`[dry] would generate ${outPath}\n`);
			} else {
				process.stdout.write(`→ ${relPath}\n`);
				const result = runGen(ph.prompt, outPath);
				if (result === "skipped") {
					process.stdout.write(
						"  GOOGLE_AI_API_KEY missing — stopping. Set it and re-run.\n",
					);
					skippedNoKey = true;
					break;
				}
				if (result === "failed") {
					failed += 1;
					continue;
				}
				generated += 1;
			}
		} else {
			reused += 1;
		}

		// Use HTML <img> instead of Markdown `![]()` because Fumadocs-MDX
		// treats `![]()` as a local-file import and resolves it relative to
		// the content directory. Our images live under /public/, so plain
		// HTML with an absolute src is the only path that round-trips.
		const escapedAlt = ph.alt.replace(/"/g, "&quot;");
		const md = `<img src="${relPath}" alt="${escapedAlt}" loading="lazy" />`;
		mutated = mutated.replace(ph.raw, md);
		if (ph.index === 1) {
			coverRelPath = relPath;
		}
	}

	if (skippedNoKey) {
		return EXIT_SKIPPED;
	}

	// Stamp cover back into frontmatter when we have one.
	let finalBody = mutated;
	if (coverRelPath && raw) {
		const newFm = rebuildFrontmatter(raw, coverRelPath);
		finalBody = `${newFm}${rest.replace(body.slice(0, body.length - rest.length), "")}`;
		// Above is fragile if the rest already mutated; safer rebuild:
		const re = /^---\n[\s\S]*?\n---\n/;
		finalBody = mutated.replace(re, newFm);
	}

	if (!args.dry) {
		writeFileSync(filePath, finalBody, "utf8");
	}

	const totalBytes = placeholders
		.map((ph) => {
			const idx = String(ph.index).padStart(2, "0");
			const altSlug = kebab(ph.alt) || `image-${idx}`;
			const p = path.join(publicDir, `${idx}-${altSlug}.png`);
			try {
				return statSync(p).size;
			} catch {
				return 0;
			}
		})
		.reduce((a, b) => a + b, 0);

	process.stdout.write(
		JSON.stringify(
			{
				ok: true,
				file: filePath,
				placeholders: placeholders.length,
				generated,
				reused,
				failed,
				totalBytes,
				cover: coverRelPath,
			},
			null,
			2,
		),
	);
	process.stdout.write("\n");
	if (failed > 0 && generated === 0) {
		return EXIT_RUNTIME;
	}
	return EXIT_OK;
}

try {
	process.exit(main());
} catch (err) {
	process.stderr.write(`gen-blog-inline-images crashed: ${err}\n`);
	process.exit(EXIT_RUNTIME);
}
