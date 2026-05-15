#!/usr/bin/env tsx
/**
 * Changelog writer agent.
 *
 *   pnpm exec tsx scripts/agents/write-changelog.ts [--out apps/marketing/content/changelog/]
 *
 * Reads `git log` since the most recent entry in the changelog directory,
 * groups commits by Conventional-Commit type (feat / fix / perf / docs /
 * refactor / chore / test / ci / build), and writes a single MDX file
 * timestamped today. Frontmatter marks it `draft: true` so the file never
 * publishes accidentally — humans review before flipping the flag.
 *
 * Idempotent: re-running on the same day overwrites the day's entry; if
 * there are zero relevant commits since the last entry, the script exits
 * 78 (skipped) without writing.
 */
import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";

import mri from "mri";

const EXIT_OK = 0;
const EXIT_SKIPPED = 78;
const EXIT_RUNTIME = 70;

type GroupKey =
	| "feat"
	| "fix"
	| "perf"
	| "docs"
	| "refactor"
	| "chore"
	| "test"
	| "ci"
	| "build"
	| "style";

const GROUP_LABEL: Record<GroupKey, string> = {
	feat: "Added",
	fix: "Fixed",
	perf: "Performance",
	docs: "Docs",
	refactor: "Refactored",
	chore: "Chores",
	test: "Tests",
	ci: "CI",
	build: "Build",
	style: "Style",
};

const GROUP_ORDER: GroupKey[] = [
	"feat",
	"fix",
	"perf",
	"refactor",
	"docs",
	"chore",
	"test",
	"ci",
	"build",
	"style",
];

const CONVENTIONAL_RE =
	/^(?<type>feat|fix|perf|docs|refactor|chore|test|ci|build|style)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s*(?<subject>.+)$/i;

type Entry = {
	hash: string;
	type: GroupKey;
	scope?: string;
	subject: string;
	breaking: boolean;
};

function git(args: string[]): string {
	return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function lastEntrySha(dir: string): { sha?: string; date?: string } {
	if (!existsSync(dir)) {
		return {};
	}
	const files = readdirSync(dir)
		.filter((f) => f.endsWith(".mdx"))
		.sort()
		.reverse();
	for (const file of files) {
		const body = readFileSync(path.join(dir, file), "utf8");
		const shaMatch = body.match(/^sinceSha:\s*"?([a-f0-9]{6,40})"?/m);
		const dateMatch = body.match(/^date:\s*"?([0-9-]{10})"?/m);
		if (shaMatch?.[1]) {
			return { sha: shaMatch[1], date: dateMatch?.[1] };
		}
		if (dateMatch?.[1]) {
			return { date: dateMatch[1] };
		}
	}
	return {};
}

function collectCommits(sinceSha?: string): Entry[] {
	const range = sinceSha ? `${sinceSha}..HEAD` : "HEAD";
	const raw = git(["log", range, "--no-merges", "--pretty=format:%H%x09%s"]);
	if (!raw) {
		return [];
	}

	const entries: Entry[] = [];
	for (const line of raw.split("\n")) {
		const [hash, subject] = line.split("\t");
		if (!hash || !subject) {
			continue;
		}
		const match = subject.match(CONVENTIONAL_RE);
		if (!match?.groups) {
			continue;
		}
		const type = match.groups.type?.toLowerCase() as GroupKey | undefined;
		if (!type || !GROUP_LABEL[type]) {
			continue;
		}
		entries.push({
			hash: hash.slice(0, 7),
			type,
			scope: match.groups.scope,
			subject: match.groups.subject.trim(),
			breaking: Boolean(match.groups.bang),
		});
	}
	return entries;
}

function groupByType(entries: Entry[]): Map<GroupKey, Entry[]> {
	const groups = new Map<GroupKey, Entry[]>();
	for (const entry of entries) {
		const list = groups.get(entry.type) ?? [];
		list.push(entry);
		groups.set(entry.type, list);
	}
	return groups;
}

function formatEntryLine(entry: Entry): string {
	const scope = entry.scope ? `**${entry.scope}**: ` : "";
	const bang = entry.breaking ? "**BREAKING** " : "";
	return `- ${bang}${scope}${entry.subject} (\`${entry.hash}\`)`;
}

function renderMdx(args: {
	date: string;
	sinceSha: string;
	headSha: string;
	groups: Map<GroupKey, Entry[]>;
	breakingCount: number;
}): string {
	const { date, sinceSha, headSha, groups, breakingCount } = args;

	const sections: string[] = [];
	for (const key of GROUP_ORDER) {
		const list = groups.get(key);
		if (!list || list.length === 0) {
			continue;
		}
		sections.push(`## ${GROUP_LABEL[key]}`);
		for (const entry of list) {
			sections.push(formatEntryLine(entry));
		}
		sections.push("");
	}

	const frontmatter = [
		"---",
		`title: "Changelog · ${date}"`,
		`date: ${date}`,
		`sinceSha: ${sinceSha}`,
		`headSha: ${headSha}`,
		"draft: true",
		"aiGenerated: true",
		"aiReviewedBy: pending",
		`breakingCount: ${breakingCount}`,
		"---",
		"",
		breakingCount > 0
			? `> **${breakingCount} breaking change${breakingCount === 1 ? "" : "s"} this release.** Read carefully before upgrading.`
			: "> Routine release — no breaking changes.",
		"",
	].join("\n");

	return `${frontmatter}${sections.join("\n").trim()}\n`;
}

function run(argv: string[]): number {
	const args = mri(argv, {
		string: ["out"],
		default: {
			out: path.join("apps", "marketing", "content", "changelog"),
		},
	});

	const outDir = path.resolve(process.cwd(), args.out as string);
	mkdirSync(outDir, { recursive: true });

	const headSha = git(["rev-parse", "--short=12", "HEAD"]);
	const lastEntry = lastEntrySha(outDir);
	const sinceSha = lastEntry.sha ?? "";

	const entries = collectCommits(sinceSha || undefined);
	if (entries.length === 0) {
		process.stderr.write(
			`no Conventional-Commit changes since ${sinceSha ? sinceSha : "the start of history"} — nothing to write.\n`,
		);
		return EXIT_SKIPPED;
	}

	const date = new Date().toISOString().slice(0, 10);
	const groups = groupByType(entries);
	const breakingCount = entries.filter((e) => e.breaking).length;

	const filename = path.join(outDir, `${date}.mdx`);
	const body = renderMdx({
		date,
		sinceSha: sinceSha || "ORIGIN",
		headSha,
		groups,
		breakingCount,
	});

	writeFileSync(filename, body, "utf8");
	const rel = path.relative(process.cwd(), filename) || filename;
	process.stdout.write(
		`wrote ${rel} (${entries.length} commits across ${groups.size} groups, ${breakingCount} breaking, head=${headSha})\n`,
	);
	process.stdout.write(
		"review, flip `draft: false`, then commit. Open a PR titled `content(changelog): YYYY-MM-DD` for human approval.\n",
	);
	return EXIT_OK;
}

try {
	process.exit(run(process.argv.slice(2)));
} catch (err) {
	process.stderr.write(`write-changelog crashed: ${err}\n`);
	process.exit(EXIT_RUNTIME);
}
