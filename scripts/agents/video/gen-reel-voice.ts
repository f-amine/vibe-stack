#!/usr/bin/env tsx
/**
 * Generate the reel voiceover via ElevenLabs TTS-with-timestamps, then
 * back-fill each shot's captionChunks based on character-level alignments.
 *
 *   pnpm reel:voice --slug <slug> [--voice-id <id>] [--model eleven_v3]
 *
 * Reads:  apps/marketing/public/reels/<slug>/manifest.json
 * Writes: apps/marketing/public/reels/<slug>/voice.mp3
 *         apps/marketing/public/reels/<slug>/manifest.json (updated)
 *
 * Exits 78 when ELEVENLABS_API_KEY is unset.
 */
import { Buffer } from "node:buffer";
import { writeFileSync } from "node:fs";
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
	text: string;
	durationSec: number;
	captionChunks?: Array<{
		text: string;
		startSec: number;
		endSec: number;
		accent?: boolean;
	}>;
};

type Manifest = {
	slug: string;
	title: string;
	voiceId?: string;
	shots: Shot[];
	voiceover?: {
		path: string;
		voiceId: string;
		volumeDb?: number;
	};
};

type Alignment = {
	characters: string[];
	character_start_times_seconds: number[];
	character_end_times_seconds: number[];
};

function buildScriptFromShots(shots: Shot[]): {
	script: string;
	shotRanges: Array<{ id: string; charStart: number; charEnd: number }>;
} {
	let cursor = 0;
	const ranges: Array<{ id: string; charStart: number; charEnd: number }> = [];
	const parts: string[] = [];
	for (const s of shots) {
		const text = s.text.trim();
		if (!text) {
			ranges.push({ id: s.id, charStart: cursor, charEnd: cursor });
			continue;
		}
		const padded = parts.length === 0 ? text : ` ${text}`;
		ranges.push({
			id: s.id,
			charStart: cursor + (parts.length === 0 ? 0 : 1),
			charEnd: cursor + padded.length,
		});
		parts.push(padded);
		cursor += padded.length;
	}
	return { script: parts.join(""), shotRanges: ranges };
}

function chunksFromAlignment(
	alignment: Alignment,
	startChar: number,
	endChar: number,
	scriptOffsetSec: number,
): Shot["captionChunks"] {
	if (endChar <= startChar) return undefined;
	const words: Array<{
		text: string;
		startSec: number;
		endSec: number;
	}> = [];
	let currentWord = "";
	let wordStartSec = 0;
	for (let i = startChar; i < endChar; i++) {
		const char = alignment.characters[i] ?? "";
		const s = alignment.character_start_times_seconds[i] ?? 0;
		const e = alignment.character_end_times_seconds[i] ?? s;
		const isSep = /\s/.test(char);
		if (isSep) {
			if (currentWord) {
				words.push({
					text: currentWord,
					startSec: wordStartSec - scriptOffsetSec,
					endSec:
						(alignment.character_end_times_seconds[i - 1] ?? e) -
						scriptOffsetSec,
				});
				currentWord = "";
			}
			continue;
		}
		if (currentWord === "") wordStartSec = s;
		currentWord += char;
	}
	if (currentWord) {
		const lastIdx = endChar - 1;
		const lastEnd = alignment.character_end_times_seconds[lastIdx] ?? 0;
		words.push({
			text: currentWord,
			startSec: wordStartSec - scriptOffsetSec,
			endSec: lastEnd - scriptOffsetSec,
		});
	}

	// Group into ~3-word chunks for readable captions.
	const chunks: Shot["captionChunks"] = [];
	const groupSize = 3;
	for (let i = 0; i < words.length; i += groupSize) {
		const group = words.slice(i, i + groupSize);
		if (group.length === 0) continue;
		const first = group[0]!;
		const last = group[group.length - 1]!;
		chunks.push({
			text: group.map((w) => w.text).join(" "),
			startSec: Math.max(0, first.startSec),
			endSec: Math.max(first.startSec + 0.05, last.endSec),
			accent: false,
		});
	}
	return chunks;
}

async function main(): Promise<number> {
	const args = mri(process.argv.slice(2), {
		string: ["slug", "voice-id", "model"],
	});

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
	let manifest: Manifest;
	try {
		manifest = readManifest<Manifest>(slug);
	} catch (err) {
		process.stderr.write(`${err instanceof Error ? err.message : "?"}\n`);
		return EXIT_RUNTIME;
	}

	const voiceId =
		(args["voice-id"] as string) ??
		manifest.voiceId ??
		process.env.ELEVENLABS_DEFAULT_VOICE_ID ??
		"21m00Tcm4TlvDq8ikWAM";
	const modelId =
		(args.model as string) ??
		process.env.ELEVENLABS_TEXT_MODEL ??
		"eleven_multilingual_v2";

	const { script, shotRanges } = buildScriptFromShots(manifest.shots);
	if (!script.trim()) {
		process.stderr.write("script is empty after concatenating shots.\n");
		return EXIT_RUNTIME;
	}

	const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;
	const body = {
		text: script,
		model_id: modelId,
		voice_settings: {
			stability: 0.45,
			similarity_boost: 0.85,
			style: 0.25,
			use_speaker_boost: true,
		},
	};

	let response: Response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers: {
				"xi-api-key": key,
				"content-type": "application/json",
				accept: "application/json",
			},
			body: JSON.stringify(body),
		});
	} catch (err) {
		process.stderr.write(
			`elevenlabs request failed: ${err instanceof Error ? err.message : "?"}\n`,
		);
		return EXIT_RUNTIME;
	}

	if (!response.ok) {
		const errText = await response.text();
		process.stderr.write(
			`elevenlabs returned ${response.status}: ${errText.slice(0, 400)}\n`,
		);
		return EXIT_RUNTIME;
	}

	const payload = (await response.json()) as {
		audio_base64: string;
		alignment?: Alignment;
		normalized_alignment?: Alignment;
	};

	const audio = Buffer.from(payload.audio_base64, "base64");
	const outPath = path.join(reelDir(slug), "voice.mp3");
	writeFileSync(outPath, audio);

	const alignment = payload.normalized_alignment ?? payload.alignment;
	if (alignment) {
		// Build per-shot captionChunks, offsetting time by where each shot
		// starts within the concatenated script.
		const shotsWithCaptions = manifest.shots.map((s) => {
			const range = shotRanges.find((r) => r.id === s.id);
			if (!range) return s;
			const startSec =
				alignment.character_start_times_seconds[range.charStart] ?? 0;
			const chunks = chunksFromAlignment(
				alignment,
				range.charStart,
				range.charEnd,
				startSec,
			);
			// Replace shot duration with the actual measured length so the
			// composition uses real timings.
			const endSec =
				alignment.character_end_times_seconds[
					Math.max(range.charStart, range.charEnd - 1)
				] ?? startSec + s.durationSec;
			const measured = Math.max(0.5, endSec - startSec + 0.15);
			return {
				...s,
				durationSec: measured,
				captionChunks: chunks,
			};
		});
		manifest.shots = shotsWithCaptions;
	}

	manifest.voiceover = {
		path: toPublicRelative(outPath),
		voiceId,
		volumeDb: 0,
	};
	writeManifest(slug, manifest);

	process.stdout.write(
		`${JSON.stringify(
			{
				ok: true,
				slug,
				voicePath: manifest.voiceover.path,
				bytes: audio.length,
				captionsBackfilled: !!alignment,
				model: modelId,
				voiceId,
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
		process.stderr.write(`gen-reel-voice crashed: ${err}\n`);
		process.exit(EXIT_RUNTIME);
	},
);
