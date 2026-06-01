#!/usr/bin/env tsx
/**
 * Generate per-shot SFX via ElevenLabs Sound Generation. Only shots that
 * carry an `sfx` field with a `prompt` are processed. Idempotent on disk.
 *
 *   pnpm reel:sfx --slug <slug>
 */
import { Buffer } from "node:buffer";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

import mri from "mri";
import "dotenv/config";

import {
	EXIT_OK,
	EXIT_RUNTIME,
	EXIT_SKIPPED,
	EXIT_USAGE,
	elevenLabsKey,
	readManifest,
	reelDir,
	toPublicRelative,
	writeManifest,
} from "./lib";

type Shot = {
	id: string;
	durationSec: number;
	sfx?: {
		prompt: string;
		path?: string;
		startSec?: number;
		volumeDb?: number;
	};
};
type Manifest = { slug: string; shots: Shot[] };

async function generateSfx(
	key: string,
	prompt: string,
	durationSec: number,
): Promise<Buffer> {
	const url = "https://api.elevenlabs.io/v1/sound-generation";
	const body = {
		text: prompt,
		duration_seconds: Math.max(0.5, Math.min(durationSec, 4)),
		prompt_influence: 0.5,
	};
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"xi-api-key": key,
			"content-type": "application/json",
			accept: "audio/mpeg",
		},
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		const errText = await response.text();
		throw new Error(
			`elevenlabs returned ${response.status}: ${errText.slice(0, 200)}`,
		);
	}
	const buf = await response.arrayBuffer();
	return Buffer.from(buf);
}

async function main(): Promise<number> {
	const args = mri(process.argv.slice(2), { string: ["slug"] });
	if (!args.slug) {
		process.stderr.write("--slug is required\n");
		return EXIT_USAGE;
	}
	const key = elevenLabsKey();
	if (!key) {
		process.stderr.write("ELEVENLABS_API_KEY not set, skipping.\n");
		return EXIT_SKIPPED;
	}

	const slug = String(args.slug);
	const manifest = readManifest<Manifest>(slug);
	const sfxDir = path.join(reelDir(slug), "sfx");

	let generated = 0;
	let reused = 0;
	let failed = 0;

	for (const shot of manifest.shots) {
		if (!shot.sfx?.prompt) continue;
		const out = path.join(sfxDir, `${shot.id}.mp3`);
		if (existsSync(out)) {
			shot.sfx.path = toPublicRelative(out);
			reused++;
			continue;
		}
		try {
			process.stdout.write(`→ ${shot.id} sfx\n`);
			const buf = await generateSfx(
				key,
				shot.sfx.prompt,
				Math.min(shot.durationSec, 3),
			);
			writeFileSync(out, buf);
			shot.sfx.path = toPublicRelative(out);
			generated++;
		} catch (err) {
			process.stderr.write(
				`  failed: ${err instanceof Error ? err.message : "?"}\n`,
			);
			failed++;
		}
	}

	writeManifest(slug, manifest);
	process.stdout.write(
		`${JSON.stringify({ ok: true, slug, generated, reused, failed }, null, 2)}\n`,
	);
	if (failed > 0 && generated === 0 && reused === 0) return EXIT_RUNTIME;
	return EXIT_OK;
}

main().then(
	(code) => process.exit(code),
	(err) => {
		process.stderr.write(`gen-reel-sfx crashed: ${err}\n`);
		process.exit(EXIT_RUNTIME);
	},
);
