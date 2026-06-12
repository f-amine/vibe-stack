#!/usr/bin/env tsx
/**
 * Wrap `remotion render` with sensible defaults for the reel pipeline.
 * Loads the manifest, passes it as input props, points public-dir at
 * apps/marketing/public so Remotion can resolve voice/music/image/sfx
 * paths as static files, writes the MP4 next to its assets.
 *
 *   pnpm reel:render --slug <slug>
 *
 * Output: apps/marketing/public/reels/<slug>.mp4
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

import mri from "mri";

import {
	EXIT_OK,
	EXIT_RUNTIME,
	EXIT_USAGE,
	manifestPath,
	REELS_PUBLIC_DIR,
	readManifest,
} from "./lib";

type Manifest = { slug: string };

async function main(): Promise<number> {
	const args = mri(process.argv.slice(2), {
		string: ["slug", "concurrency"],
	});
	if (!args.slug) {
		process.stderr.write("--slug is required\n");
		return EXIT_USAGE;
	}
	const slug = String(args.slug);
	const manifest = readManifest<Manifest>(slug);
	if (manifest.slug !== slug) {
		process.stderr.write(
			`manifest.slug (${manifest.slug}) does not match --slug (${slug}); refusing to render.\n`,
		);
		return EXIT_RUNTIME;
	}

	const out = path.join(REELS_PUBLIC_DIR, `${slug}.mp4`);
	const publicDir = path.resolve("apps/marketing/public");
	const entry = path.resolve("packages/video/src/index.ts");
	const propsPath = manifestPath(slug);
	const concurrency = String(args.concurrency ?? "1");

	process.stdout.write(`→ rendering ${slug} to ${out}\n`);
	// Remotion CLI is installed under packages/video — invoke from that
	// workspace so the binary resolves.
	const result = spawnSync(
		"pnpm",
		[
			"--filter",
			"@vibestack/video",
			"exec",
			"remotion",
			"render",
			entry,
			"Reel",
			out,
			`--props=${propsPath}`,
			`--public-dir=${publicDir}`,
			`--concurrency=${concurrency}`,
			"--log=info",
		],
		{ stdio: "inherit" },
	);

	if (result.status !== 0) {
		process.stderr.write(`remotion render exited ${result.status}\n`);
		return EXIT_RUNTIME;
	}

	process.stdout.write(
		`${JSON.stringify({ ok: true, slug, out, url: `/reels/${slug}.mp4` }, null, 2)}\n`,
	);
	return EXIT_OK;
}

main().then(
	(code) => process.exit(code),
	(err) => {
		process.stderr.write(`render-reel crashed: ${err}\n`);
		process.exit(EXIT_RUNTIME);
	},
);
