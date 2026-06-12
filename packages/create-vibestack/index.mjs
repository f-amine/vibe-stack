#!/usr/bin/env node
// create-vibestack — `npx create-vibestack my-saas`
//
// Thin wrapper: clones the template, strips its git history, then hands
// off to the template's own `scripts/init.mjs` for the interactive part
// (product name, feature selection, API keys, .env, install, db).
// Zero dependencies: works on a bare `npx` with nothing else installed.

import { execFileSync, execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const DEFAULT_REPO = "f-amine/starter-saas";

const args = process.argv.slice(2);
const flag = (name) => {
	const i = args.indexOf(`--${name}`);
	return i !== -1 ? args[i + 1] : undefined;
};

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;

async function main() {
	console.log(
		`\n${bold("create-vibestack")} — the SaaS starter where Claude writes the rest.\n`,
	);

	let dir = args.find((a) => !a.startsWith("--"));
	if (!dir) {
		const rl = createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		dir =
			(
				await rl.question(
					`Where should we create your app? ${dim("(my-saas)")} `,
				)
			).trim() || "my-saas";
		rl.close();
	}

	const target = resolve(process.cwd(), dir);
	if (existsSync(target)) {
		console.error(`Directory ${dir} already exists. Pick another name.`);
		process.exit(1);
	}

	const repo = flag("repo") ?? process.env.VIBESTACK_TEMPLATE ?? DEFAULT_REPO;
	const url =
		repo.includes("://") || repo.startsWith("git@")
			? repo
			: `https://github.com/${repo}.git`;

	console.log(`${dim(`Cloning ${url} …`)}`);
	execFileSync("git", ["clone", "--depth", "1", url, target], {
		stdio: "inherit",
	});
	rmSync(resolve(target, ".git"), { recursive: true, force: true });
	// The wrapper has done its job — the template doesn't need to ship it.
	rmSync(resolve(target, "packages/create-vibestack"), {
		recursive: true,
		force: true,
	});

	console.log(green(`✓ Template ready in ${dir}\n`));

	// Hand off to the template's interactive initializer (zero-dep, runs
	// pre-install). Pass the directory name as the suggested product name.
	const initArgs = ["scripts/init.mjs"];
	for (const passthrough of ["name", "features"]) {
		const v = flag(passthrough);
		if (v) initArgs.push(`--${passthrough}`, v);
	}
	if (args.includes("--yes")) initArgs.push("--yes");
	execFileSync(process.execPath, initArgs, { cwd: target, stdio: "inherit" });

	// Fresh history for the user's product.
	try {
		execSync(
			"git init -q && git add -A && git commit -qm 'feat: initial scaffold from vibestack'",
			{
				cwd: target,
				stdio: "ignore",
			},
		);
		console.log(green("✓ Initialized fresh git history"));
	} catch {
		console.log(
			dim("Skipped git init (git not configured?) — run it yourself."),
		);
	}

	console.log(`\n${bold("cd " + dir)} and ship.\n`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
