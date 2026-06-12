#!/usr/bin/env node
// Rename the starter to your product: replaces the `@vibestack/*` workspace
// scope and the `vibestack` brand string across the repo.
//
// Usage:
//   pnpm rename my-product
//   node scripts/rename.mjs my-product [--from vibestack] [--dry-run]
//
// Unlike a raw `sed` over the tree, this:
//   - never touches pnpm-lock.yaml (run `pnpm install` after to regenerate)
//   - skips node_modules, .git, build output, binary assets
//   - skips the init/rename scripts themselves and packages/create-vibestack
//   - handles case variants (vibestack / Vibestack / VIBESTACK)

import { lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const TEXT_EXTENSIONS = new Set([
	".ts",
	".tsx",
	".js",
	".jsx",
	".mjs",
	".cjs",
	".mts",
	".cts",
	".json",
	".jsonc",
	".yaml",
	".yml",
	".toml",
	".md",
	".mdx",
	".txt",
	".html",
	".css",
	".sh",
	".env",
	".example",
	".xml",
	".svg",
]);

const SKIP_DIRS = new Set([
	"node_modules",
	".git",
	".next",
	".turbo",
	"dist",
	"build",
	".ruflo",
]);

const SKIP_FILES = new Set([
	"pnpm-lock.yaml",
	"skills-lock.json",
	join("scripts", "rename.mjs"),
	join("scripts", "init.mjs"),
]);

const SKIP_PREFIXES = [join("packages", "create-vibestack")];

function capitalize(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

export function renameBrand({ from = "vibestack", to, dryRun = false }) {
	if (!/^[a-z][a-z0-9-]*$/.test(to)) {
		throw new Error(
			`Invalid name "${to}" — use a lowercase npm-style slug (letters, digits, dashes).`,
		);
	}
	if (to === from) return { changedFiles: [] };

	const pairs = [
		[`@${from}/`, `@${to}/`],
		[from, to],
		[capitalize(from), capitalize(to)],
		[from.toUpperCase(), to.toUpperCase()],
	];

	const changedFiles = [];

	function walk(dir) {
		for (const entry of readdirSync(dir)) {
			const abs = join(dir, entry);
			const rel = relative(ROOT, abs);
			// lstat + skip symlinks: vendored skills symlink into .agents/ and
			// may dangle; following them would double-process or crash.
			const stats = lstatSync(abs);
			if (stats.isSymbolicLink()) continue;
			if (stats.isDirectory()) {
				if (SKIP_DIRS.has(entry)) continue;
				if (SKIP_PREFIXES.some((p) => rel === p || rel.startsWith(p))) {
					continue;
				}
				walk(abs);
				continue;
			}
			if (SKIP_FILES.has(entry) || SKIP_FILES.has(rel)) continue;
			const ext = extname(entry);
			// Dot-files like `.env.example` have no extname; check full name.
			if (!TEXT_EXTENSIONS.has(ext) && !entry.startsWith(".env")) continue;

			const before = readFileSync(abs, "utf8");
			let after = before;
			for (const [search, replacement] of pairs) {
				after = after.split(search).join(replacement);
			}
			if (after !== before) {
				if (!dryRun) writeFileSync(abs, after);
				changedFiles.push(rel);
			}
		}
	}

	walk(ROOT);
	return { changedFiles };
}

// CLI entrypoint
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run");
	const fromIdx = args.indexOf("--from");
	const from = fromIdx !== -1 ? args[fromIdx + 1] : "vibestack";
	const to = args.find((a) => !a.startsWith("--") && a !== from);

	if (!to) {
		console.error("Usage: pnpm rename <new-name> [--dry-run]");
		process.exit(1);
	}

	try {
		const { changedFiles } = renameBrand({ from, to, dryRun });
		const verb = dryRun ? "Would update" : "Updated";
		console.log(`${verb} ${changedFiles.length} files (${from} → ${to}).`);
		if (dryRun) {
			for (const f of changedFiles) console.log(`  ${f}`);
		}
		if (!dryRun) {
			console.log(
				"\nNext steps:\n  1. pnpm install   (regenerates pnpm-lock.yaml for the new scope)\n  2. Review the diff, then commit.",
			);
		}
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
}
