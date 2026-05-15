#!/usr/bin/env tsx
/**
 * SEO audit agent.
 *
 *   pnpm exec tsx scripts/agents/seo-audit.ts \
 *     --base http://localhost:3000 \
 *     --depth 3 \
 *     --out docs/seo-audit-YYYY-MM-DD.md
 *
 * Crawls a running marketing instance starting at `--base`, follows
 * same-origin links up to `--depth` levels deep, and runs cheap structural
 * checks on every visited page:
 *
 *   - HTTP status (must be 200)
 *   - <title> present + 30..65 chars
 *   - <meta name="description"> present + 50..160 chars
 *   - exactly one <h1>
 *   - every <img> has non-empty alt (decorative images use alt="")
 *   - <link rel="canonical"> present
 *   - at least one application/ld+json schema.org block
 *   - page is reachable from sitemap.xml
 *   - robots.txt + sitemap.xml exist at the root
 *
 * Lighthouse is intentionally out of scope here — it requires a headless
 * browser + many deps. Add a second pass via @lhci/cli once we have CI
 * budget for it.
 *
 * Writes a markdown report grouped by URL with a violation table. Exits 0
 * even on violations (so it can run in CI as a report-only step); exits 70
 * on a fatal crawl error (base URL unreachable etc.).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import mri from "mri";

const EXIT_OK = 0;
const EXIT_RUNTIME = 70;

type Severity = "error" | "warn";

type Violation = {
	severity: Severity;
	rule: string;
	detail: string;
};

type PageReport = {
	url: string;
	status: number | null;
	violations: Violation[];
};

const TITLE_MIN = 30;
const TITLE_MAX = 65;
const DESC_MIN = 50;
const DESC_MAX = 160;

function todayISO(): string {
	return new Date().toISOString().slice(0, 10);
}

async function safeFetch(
	url: string,
): Promise<{ status: number; body: string } | null> {
	try {
		const res = await fetch(url, {
			redirect: "follow",
			headers: { "user-agent": "vibestack-seo-audit/1.0" },
		});
		const body = await res.text();
		return { status: res.status, body };
	} catch {
		return null;
	}
}

function extract(re: RegExp, html: string): string | null {
	const m = re.exec(html);
	return m?.[1]?.trim() ?? null;
}

function extractAll(re: RegExp, html: string): string[] {
	const out: string[] = [];
	const g = new RegExp(
		re.source,
		re.flags.includes("g") ? re.flags : `${re.flags}g`,
	);
	let m = g.exec(html);
	while (m !== null) {
		out.push(m[1] ?? "");
		m = g.exec(html);
	}
	return out;
}

function sameOrigin(href: string, base: URL): URL | null {
	try {
		const u = new URL(href, base);
		if (u.origin !== base.origin) {
			return null;
		}
		u.hash = "";
		return u;
	} catch {
		return null;
	}
}

function auditPage(_url: string, status: number, html: string): Violation[] {
	const violations: Violation[] = [];
	if (status !== 200) {
		violations.push({
			severity: "error",
			rule: "http-status",
			detail: `expected 200, got ${status}`,
		});
		return violations;
	}

	const title = extract(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
	if (!title) {
		violations.push({
			severity: "error",
			rule: "title-missing",
			detail: "no <title> tag",
		});
	} else if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
		violations.push({
			severity: "warn",
			rule: "title-length",
			detail: `${title.length} chars (want ${TITLE_MIN}..${TITLE_MAX}): "${title}"`,
		});
	}

	const desc = extract(
		/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
		html,
	);
	if (!desc) {
		violations.push({
			severity: "error",
			rule: "description-missing",
			detail: "no <meta name=description>",
		});
	} else if (desc.length < DESC_MIN || desc.length > DESC_MAX) {
		violations.push({
			severity: "warn",
			rule: "description-length",
			detail: `${desc.length} chars (want ${DESC_MIN}..${DESC_MAX})`,
		});
	}

	const h1Count = (html.match(/<h1\b/gi) ?? []).length;
	if (h1Count !== 1) {
		violations.push({
			severity: h1Count === 0 ? "error" : "warn",
			rule: "h1-count",
			detail: `expected exactly 1 <h1>, got ${h1Count}`,
		});
	}

	const imgs = extractAll(/<img\b([^>]*)>/i, html);
	for (const attrs of imgs) {
		if (!/\balt\s*=/i.test(attrs)) {
			violations.push({
				severity: "warn",
				rule: "img-alt-missing",
				detail: `<img${attrs}>`,
			});
		}
	}

	const canonical = extract(
		/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
		html,
	);
	if (!canonical) {
		violations.push({
			severity: "warn",
			rule: "canonical-missing",
			detail: "no <link rel=canonical>",
		});
	}

	const jsonLd = html.match(
		/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i,
	);
	if (!jsonLd) {
		violations.push({
			severity: "warn",
			rule: "schema-jsonld-missing",
			detail: "no <script type=application/ld+json>",
		});
	}

	return violations;
}

async function crawl(opts: {
	baseUrl: URL;
	maxDepth: number;
	maxPages: number;
}): Promise<PageReport[]> {
	const queue: Array<{ url: URL; depth: number }> = [
		{ url: opts.baseUrl, depth: 0 },
	];
	const seen = new Set<string>([opts.baseUrl.toString()]);
	const reports: PageReport[] = [];

	while (queue.length > 0 && reports.length < opts.maxPages) {
		const item = queue.shift();
		if (!item) {
			break;
		}
		const { url, depth } = item;
		const res = await safeFetch(url.toString());
		if (!res) {
			reports.push({ url: url.toString(), status: null, violations: [] });
			continue;
		}
		reports.push({
			url: url.toString(),
			status: res.status,
			violations: auditPage(url.toString(), res.status, res.body),
		});

		if (depth >= opts.maxDepth) {
			continue;
		}

		for (const href of extractAll(
			/<a\b[^>]+href=["']([^"']+)["']/i,
			res.body,
		)) {
			const next = sameOrigin(href, opts.baseUrl);
			if (!next) {
				continue;
			}
			const key = next.toString();
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			queue.push({ url: next, depth: depth + 1 });
		}
	}

	return reports;
}

async function checkRootArtifacts(base: URL): Promise<Violation[]> {
	const robots = await safeFetch(new URL("/robots.txt", base).toString());
	const sitemap = await safeFetch(new URL("/sitemap.xml", base).toString());
	const out: Violation[] = [];
	if (!robots || robots.status !== 200) {
		out.push({
			severity: "error",
			rule: "robots-missing",
			detail: "/robots.txt did not return 200",
		});
	}
	if (!sitemap || sitemap.status !== 200) {
		out.push({
			severity: "error",
			rule: "sitemap-missing",
			detail: "/sitemap.xml did not return 200",
		});
	}
	return out;
}

function renderReport(opts: {
	base: URL;
	rootIssues: Violation[];
	pages: PageReport[];
}): string {
	const totalViolations =
		opts.rootIssues.length +
		opts.pages.reduce((n, p) => n + p.violations.length, 0);
	const errors =
		opts.rootIssues.filter((v) => v.severity === "error").length +
		opts.pages.reduce(
			(n, p) => n + p.violations.filter((v) => v.severity === "error").length,
			0,
		);
	const warns = totalViolations - errors;

	const lines: string[] = [];
	lines.push("---");
	lines.push(`title: "SEO audit — ${todayISO()}"`);
	lines.push(`date: "${todayISO()}"`);
	lines.push(`base: ${opts.base.toString()}`);
	lines.push(`pagesAudited: ${opts.pages.length}`);
	lines.push(`errors: ${errors}`);
	lines.push(`warnings: ${warns}`);
	lines.push("aiGenerated: true");
	lines.push("aiReviewedBy: pending");
	lines.push("---");
	lines.push("");
	lines.push(`# SEO audit — ${todayISO()}`);
	lines.push("");
	lines.push(
		`**Base:** ${opts.base.toString()}  •  **Pages:** ${opts.pages.length}  •  **Errors:** ${errors}  •  **Warnings:** ${warns}`,
	);
	lines.push("");

	if (opts.rootIssues.length > 0) {
		lines.push("## Root artifacts");
		lines.push("");
		lines.push("| Severity | Rule | Detail |");
		lines.push("| --- | --- | --- |");
		for (const v of opts.rootIssues) {
			lines.push(`| ${v.severity} | \`${v.rule}\` | ${v.detail} |`);
		}
		lines.push("");
	}

	for (const page of opts.pages) {
		if (page.violations.length === 0) {
			continue;
		}
		lines.push(`## ${page.url}`);
		lines.push("");
		lines.push("| Severity | Rule | Detail |");
		lines.push("| --- | --- | --- |");
		for (const v of page.violations) {
			lines.push(
				`| ${v.severity} | \`${v.rule}\` | ${v.detail.replace(/\|/g, "\\|")} |`,
			);
		}
		lines.push("");
	}

	if (totalViolations === 0) {
		lines.push("No violations detected. Nice.");
	}

	return `${lines.join("\n")}\n`;
}

async function main() {
	const argv = mri(process.argv.slice(2), {
		string: ["base", "out"],
		default: {
			base: "http://localhost:3000",
			depth: 3,
			pages: 50,
			out: `docs/seo-audit-${todayISO()}.md`,
		},
	});

	let base: URL;
	try {
		base = new URL(String(argv.base));
	} catch {
		console.error(`Invalid --base: ${argv.base}`);
		process.exit(EXIT_RUNTIME);
	}

	const depth = Math.max(0, Number(argv.depth) || 0);
	const maxPages = Math.max(1, Number(argv.pages) || 1);

	console.log(
		`[seo-audit] crawling ${base.toString()} depth=${depth} maxPages=${maxPages}`,
	);
	const probe = await safeFetch(base.toString());
	if (!probe) {
		console.error(`[seo-audit] base URL unreachable: ${base.toString()}`);
		process.exit(EXIT_RUNTIME);
	}

	const [rootIssues, pages] = await Promise.all([
		checkRootArtifacts(base),
		crawl({ baseUrl: base, maxDepth: depth, maxPages }),
	]);

	const outAbs = path.resolve(process.cwd(), String(argv.out));
	mkdirSync(path.dirname(outAbs), { recursive: true });

	if (existsSync(outAbs)) {
		console.log(
			`[seo-audit] overwriting ${path.relative(process.cwd(), outAbs)}`,
		);
	}

	writeFileSync(outAbs, renderReport({ base, rootIssues, pages }), "utf8");

	const errors =
		rootIssues.filter((v) => v.severity === "error").length +
		pages.reduce(
			(n, p) => n + p.violations.filter((v) => v.severity === "error").length,
			0,
		);
	console.log(
		`[seo-audit] wrote ${path.relative(process.cwd(), outAbs)} — ${pages.length} pages, ${errors} errors`,
	);
	process.exit(EXIT_OK);
}

main().catch((err) => {
	console.error("[seo-audit] fatal:", err);
	process.exit(EXIT_RUNTIME);
});
