#!/usr/bin/env tsx
/**
 * Walk a reel manifest, generate a Gemini still for every shot whose
 * treatment is `image-anchor`, and back-fill the manifest with the
 * resulting `imagePath` (relative to apps/marketing/public so Remotion's
 * --public-dir flag can resolve it).
 *
 *   pnpm reel:images --slug <slug>
 *
 * Idempotent: skips images that already exist on disk.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import mri from "mri";
import "dotenv/config";

import {
	EXIT_OK,
	EXIT_RUNTIME,
	EXIT_SKIPPED,
	EXIT_USAGE,
	geminiKey,
	readManifest,
	reelDir,
	toPublicRelative,
	writeManifest,
} from "./lib";

type Treatment =
	| { kind: "kinetic-type"; hero?: string }
	| {
			kind: "image-anchor";
			imagePrompt: string;
			imagePath?: string;
			kenBurns?: "in" | "out" | "pan-left" | "pan-right";
	  }
	| { kind: "transition"; motif: string };

type Shot = { id: string; text: string; treatment: Treatment };
type Manifest = { slug: string; shots: Shot[] };

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
			"1080x1920",
			"--max-kb",
			"480",
		],
		{ stdio: "inherit" },
	);
	if (result.status === EXIT_SKIPPED) return "skipped";
	if (result.status === EXIT_OK) return "ok";
	return "failed";
}

async function main(): Promise<number> {
	const args = mri(process.argv.slice(2), { string: ["slug"] });
	if (!args.slug) {
		process.stderr.write("--slug is required\n");
		return EXIT_USAGE;
	}

	if (!geminiKey()) {
		process.stderr.write(
			"Neither GOOGLE_AI_API_KEY nor GEMINI_API_KEY is set, skipping.\n",
		);
		return EXIT_SKIPPED;
	}

	const slug = String(args.slug);
	const manifest = readManifest<Manifest>(slug);
	const imagesDir = path.join(reelDir(slug), "images");

	let generated = 0;
	let reused = 0;
	let failed = 0;
	const updatedShots = manifest.shots.map((shot) => {
		if (shot.treatment.kind !== "image-anchor") return shot;
		const t = shot.treatment;
		const outPath = path.join(imagesDir, `${shot.id}.png`);
		if (existsSync(outPath)) {
			reused++;
			return {
				...shot,
				treatment: { ...t, imagePath: toPublicRelative(outPath) },
			};
		}
		process.stdout.write(`→ ${shot.id}\n`);
		const result = runGen(t.imagePrompt, outPath);
		if (result === "skipped") {
			process.stdout.write("  GEMINI key missing mid-run, aborting.\n");
			return shot;
		}
		if (result === "failed") {
			failed++;
			return shot;
		}
		generated++;
		return {
			...shot,
			treatment: { ...t, imagePath: toPublicRelative(outPath) },
		};
	});

	manifest.shots = updatedShots;
	writeManifest(slug, manifest);

	process.stdout.write(
		`${JSON.stringify({ ok: true, slug, generated, reused, failed }, null, 2)}\n`,
	);
	if (failed > 0 && generated === 0) return EXIT_RUNTIME;
	return EXIT_OK;
}

main().then(
	(code) => process.exit(code),
	(err) => {
		process.stderr.write(`gen-reel-images crashed: ${err}\n`);
		process.exit(EXIT_RUNTIME);
	},
);
