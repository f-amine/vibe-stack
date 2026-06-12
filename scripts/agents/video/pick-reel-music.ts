#!/usr/bin/env tsx
/**
 * Pick a music bed for the reel from packages/video/assets/music/<mood>/.
 * Copies the chosen file into apps/marketing/public/reels/<slug>/music.mp3
 * so it lives next to the rest of the assets and ships with the static
 * deploy.
 *
 *   pnpm reel:music --slug <slug>
 */
import { copyFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";

import mri from "mri";

import {
	EXIT_OK,
	EXIT_RUNTIME,
	EXIT_SKIPPED,
	EXIT_USAGE,
	MUSIC_DIR,
	readManifest,
	reelDir,
	toPublicRelative,
	writeManifest,
} from "./lib";

type Manifest = {
	slug: string;
	mood?: string;
	music?: { path: string; volumeDb?: number };
};

function pickFromDir(dir: string): string | null {
	if (!existsSync(dir)) return null;
	const files = readdirSync(dir).filter((f) => /\.(mp3|wav|m4a|ogg)$/i.test(f));
	if (files.length === 0) return null;
	return path.join(dir, files[Math.floor(Math.random() * files.length)]!);
}

async function main(): Promise<number> {
	const args = mri(process.argv.slice(2), {
		string: ["slug", "mood", "file"],
	});
	if (!args.slug) {
		process.stderr.write("--slug is required\n");
		return EXIT_USAGE;
	}

	const slug = String(args.slug);
	const manifest = readManifest<Manifest>(slug);
	const mood = (args.mood as string) ?? manifest.mood ?? "contemplative";

	let source: string | null;
	if (args.file) {
		source = path.resolve(String(args.file));
		if (!existsSync(source)) {
			process.stderr.write(`--file ${source} not found\n`);
			return EXIT_USAGE;
		}
	} else {
		const moodDir = path.join(MUSIC_DIR, mood);
		source = pickFromDir(moodDir);
		if (!source) {
			process.stderr.write(
				`No music tracks in ${moodDir}. Drop .mp3 files there to enable this mood, or pass --file.\n`,
			);
			return EXIT_SKIPPED;
		}
	}

	const dest = path.join(reelDir(slug), "music.mp3");
	copyFileSync(source, dest);
	manifest.music = {
		path: toPublicRelative(dest),
		volumeDb: -22,
	};
	writeManifest(slug, manifest);

	process.stdout.write(
		`${JSON.stringify(
			{
				ok: true,
				slug,
				picked: path.relative(process.cwd(), source),
				dest: toPublicRelative(dest),
				mood,
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
		process.stderr.write(`pick-reel-music crashed: ${err}\n`);
		process.exit(EXIT_RUNTIME);
	},
);
