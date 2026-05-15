#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
/**
 * Regenerate the marketing-side hero + section illustrations in a single
 * shot via Gemini. Filenames carry a content hash so cache busts when
 * the prompt changes.
 *
 *   pnpm exec tsx scripts/agents/gen-hero-illustrations.ts [--dry]
 *
 * Exit codes: 0 success, 78 skipped (no key), 70 partial / failed.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import mri from "mri";

const EXIT_OK = 0;
const EXIT_SKIPPED = 78;
const EXIT_RUNTIME = 70;

const OUT_DIR = path.resolve("apps/marketing/public/illustrations");

const SLOTS: Array<{
	slug: string;
	size: string;
	prompt: string;
}> = [
	{
		slug: "hero",
		size: "1536x1024",
		prompt:
			"Editorial illustration for the marketing hero: floating concentric rings + accent dots, dark muted palette, generous negative space, no text, no logos.",
	},
	{
		slug: "features",
		size: "1024x1024",
		prompt:
			"Six small abstract icons in a 2x3 grid for SaaS feature tiles: auth, billing, email, storage, analytics, admin. Minimal line-art on dark, no labels.",
	},
	{
		slug: "cta-banner",
		size: "1536x768",
		prompt:
			"Wide editorial banner for a call-to-action section: horizontal abstract gradient with a single bright accent line, dark background, no text.",
	},
	{
		slug: "faq-side",
		size: "1024x1280",
		prompt:
			"Vertical editorial illustration for the FAQ section: minimalist arches + thin lines, dark muted palette, generous negative space, no text.",
	},
	{
		slug: "404",
		size: "1280x1024",
		prompt:
			"Editorial illustration for a 404 page: cracked geometric shape over a void, dark muted palette, no text on the image itself.",
	},
];

function hashSlot(prompt: string, size: string): string {
	return createHash("sha256")
		.update(`${size}|${prompt}`)
		.digest("hex")
		.slice(0, 8);
}

function runGen(
	prompt: string,
	out: string,
	size: string,
): "ok" | "skipped" | "failed" {
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
			size,
		],
		{ stdio: "inherit" },
	);
	if (result.status === EXIT_SKIPPED) {
		return "skipped";
	}
	return result.status === EXIT_OK ? "ok" : "failed";
}

function main(): number {
	const args = mri(process.argv.slice(2), { boolean: ["dry"] });
	mkdirSync(OUT_DIR, { recursive: true });
	let generated = 0;
	let failed = 0;
	for (const slot of SLOTS) {
		const hash = hashSlot(slot.prompt, slot.size);
		const out = path.join(OUT_DIR, `${slot.slug}.${hash}.png`);
		if (existsSync(out)) {
			process.stdout.write(`= ${slot.slug} (cached, hash unchanged)\n`);
			continue;
		}
		process.stdout.write(`→ ${slot.slug}\n`);
		if (args.dry) {
			process.stdout.write(`  would write to ${out}\n`);
			generated++;
			continue;
		}
		const result = runGen(slot.prompt, out, slot.size);
		if (result === "skipped") {
			process.stdout.write("  Gemini API key missing — stopping.\n");
			return EXIT_SKIPPED;
		}
		if (result === "failed") {
			failed++;
			continue;
		}
		generated++;
	}
	process.stdout.write(`done · generated=${generated} failed=${failed}\n`);
	return failed > 0 && generated === 0 ? EXIT_RUNTIME : EXIT_OK;
}

try {
	process.exit(main());
} catch (err) {
	process.stderr.write(`gen-hero-illustrations crashed: ${err}\n`);
	process.exit(EXIT_RUNTIME);
}
