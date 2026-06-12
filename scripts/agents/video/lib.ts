/**
 * Shared helpers for the video swarm worker scripts.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const EXIT_OK = 0;
export const EXIT_USAGE = 64;
export const EXIT_SKIPPED = 78;
export const EXIT_RUNTIME = 70;

export const REELS_PUBLIC_DIR = path.resolve("apps/marketing/public/reels");
export const MUSIC_DIR = path.resolve("packages/video/assets/music");

export function reelDir(slug: string): string {
	return path.join(REELS_PUBLIC_DIR, slug);
}

export function manifestPath(slug: string): string {
	return path.join(reelDir(slug), "manifest.json");
}

export function ensureReelDir(slug: string): string {
	const dir = reelDir(slug);
	mkdirSync(dir, { recursive: true });
	mkdirSync(path.join(dir, "images"), { recursive: true });
	mkdirSync(path.join(dir, "sfx"), { recursive: true });
	return dir;
}

export function readManifest<T = unknown>(slug: string): T {
	const p = manifestPath(slug);
	if (!existsSync(p)) {
		throw new Error(`Manifest not found: ${p}`);
	}
	return JSON.parse(readFileSync(p, "utf8")) as T;
}

export function writeManifest(slug: string, manifest: unknown): void {
	ensureReelDir(slug);
	writeFileSync(manifestPath(slug), JSON.stringify(manifest, null, 2), "utf8");
}

export function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

export function geminiKey(): string | undefined {
	return process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
}

export function elevenLabsKey(): string | undefined {
	return process.env.ELEVENLABS_API_KEY ?? process.env.ELEVEN_API_KEY;
}

/**
 * Convert paths in the manifest to be relative to apps/marketing/public so
 * Remotion's `--public-dir=apps/marketing/public` flag resolves them as
 * static files at render time. Returns the cleaned path without a leading
 * slash.
 */
export function toPublicRelative(absoluteOrRelative: string): string {
	const publicRoot = path.resolve("apps/marketing/public");
	const abs = path.isAbsolute(absoluteOrRelative)
		? absoluteOrRelative
		: path.resolve(absoluteOrRelative);
	const rel = path.relative(publicRoot, abs);
	if (rel.startsWith("..")) {
		throw new Error(
			`Path ${absoluteOrRelative} is outside ${publicRoot}; cannot serve as public asset.`,
		);
	}
	return rel;
}
