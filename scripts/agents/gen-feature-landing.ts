#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
/**
 * Landing-variant generator. Given a feature slug + headline + bullets,
 * writes a self-contained marketing route at
 * `apps/marketing/src/app/[locale]/features/<slug>/page.tsx` with hero +
 * three explainer sections + CTA. Tries to call gen-image for a side
 * illustration; gracefully degrades to a placeholder SVG if Gemini
 * isn't configured.
 *
 *   pnpm exec tsx scripts/agents/gen-feature-landing.ts \
 *     --slug "file-uploads" \
 *     --headline "R2 file uploads, end-to-end" \
 *     --subtitle "Presigned PUTs, signed downloads, drop-in dropzone." \
 *     --bullet "Drop-in <Dropzone />" \
 *     --bullet "MIME + size guards" \
 *     --bullet "Per-user prefix isolation"
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import mri from "mri";

const EXIT_OK = 0;
const EXIT_USAGE = 64;
const EXIT_RUNTIME = 70;

function slugify(input: string): string {
	return input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "");
}

function asArray(value: string | string[] | undefined): string[] {
	if (!value) {
		return [];
	}
	return Array.isArray(value) ? value : [value];
}

function tryGenIllustration(slug: string, headline: string): string | null {
	const outDir = path.resolve("apps/marketing/public/illustrations/features");
	mkdirSync(outDir, { recursive: true });
	const out = path.join(outDir, `${slug}.png`);
	const result = spawnSync(
		"pnpm",
		[
			"exec",
			"tsx",
			"scripts/gen-image.ts",
			"--prompt",
			`Editorial illustration for a SaaS landing page about ${headline}. Minimal line-art on dark muted palette, abstract geometric shapes, generous negative space, no text, no logos.`,
			"--out",
			out,
			"--size",
			"1280x960",
		],
		{ stdio: "inherit" },
	);
	if (result.status === EXIT_OK) {
		return `/illustrations/features/${slug}.png`;
	}
	return null;
}

function pageBody(opts: {
	slug: string;
	headline: string;
	subtitle: string;
	bullets: string[];
	illustration: string | null;
}): string {
	const bulletItems = opts.bullets
		.map(
			(b) =>
				`\t\t\t<li>\n\t\t\t\t<span className="font-medium">${b.replace(/"/g, '\\"')}</span>\n\t\t\t</li>`,
		)
		.join("\n");

	const heroImage = opts.illustration
		? `\n\t\t<div className="mt-12 overflow-hidden rounded-2xl border border-[color:var(--marketing-line)]">\n\t\t\t<img src="${opts.illustration}" alt="${opts.headline} illustration" className="h-auto w-full" />\n\t\t</div>\n`
		: "";

	return `import Link from "next/link";
import { ogMetadata } from "@/lib/og";

const TITLE = "${opts.headline.replace(/"/g, '\\"')}";
const SUBTITLE = "${opts.subtitle.replace(/"/g, '\\"')}";

export const metadata = {
\ttitle: TITLE,
\tdescription: SUBTITLE,
\t...ogMetadata({
\t\ttitle: TITLE,
\t\tsubtitle: SUBTITLE,
\t\teyebrow: "Feature",
\t}),
};

export default function FeaturePage() {
\treturn (
\t\t<main className="mx-auto max-w-5xl px-6 py-20">
\t\t<header>
\t\t\t<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">— Feature</p>
\t\t\t<h1 className="mt-4 font-display text-5xl tracking-tight sm:text-6xl">{TITLE}</h1>
\t\t\t<p className="mt-4 max-w-2xl text-[color:var(--marketing-fg)]/70 text-lg">{SUBTITLE}</p>
\t\t</header>${heroImage}
\t\t<section className="mt-16 grid gap-12 md:grid-cols-3">
\t\t\t<div>
\t\t\t\t<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-widest">01 — Drop-in</p>
\t\t\t\t<h2 className="mt-3 font-display text-xl tracking-tight">Wired by default</h2>
\t\t\t\t<p className="mt-2 text-[color:var(--marketing-fg)]/70 text-sm">Clone the repo, set the env vars, ship.</p>
\t\t\t</div>
\t\t\t<div>
\t\t\t\t<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-widest">02 — Production-grade</p>
\t\t\t\t<h2 className="mt-3 font-display text-xl tracking-tight">Real ops, not demos</h2>
\t\t\t\t<p className="mt-2 text-[color:var(--marketing-fg)]/70 text-sm">Audit logs, error boundaries, signed URLs — the boring parts already done right.</p>
\t\t\t</div>
\t\t\t<div>
\t\t\t\t<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-widest">03 — Yours to extend</p>
\t\t\t\t<h2 className="mt-3 font-display text-xl tracking-tight">No vendor lock-in</h2>
\t\t\t\t<p className="mt-2 text-[color:var(--marketing-fg)]/70 text-sm">Self-host on Dokploy, swap providers, refactor at will.</p>
\t\t\t</div>
\t\t</section>
\t\t<section className="mt-20">
\t\t\t<h2 className="font-display text-2xl tracking-tight">What's inside</h2>
\t\t\t<ul className="mt-6 grid gap-2 text-sm">
${bulletItems}
\t\t\t</ul>
\t\t</section>
\t\t<section className="mt-20 rounded-2xl border border-[color:var(--marketing-line)] p-10 text-center">
\t\t\t<h2 className="font-display text-3xl tracking-tight">Ready to ship the interesting part?</h2>
\t\t\t<p className="mt-3 text-[color:var(--marketing-fg)]/70 text-sm">The boring parts are pre-wired. Clone the repo and start your launch.</p>
\t\t\t<Link href="/" className="mt-6 inline-flex rounded-full bg-[color:var(--marketing-accent)] px-7 py-3 font-medium text-[color:var(--marketing-bg)]">Start free →</Link>
\t\t</section>
\t</main>
\t);
}
`;
}

function main(): number {
	const args = mri(process.argv.slice(2), {
		string: ["slug", "headline", "subtitle"],
	});
	const slug = slugify(String(args.slug ?? ""));
	const headline = String(args.headline ?? "");
	const subtitle = String(args.subtitle ?? "");
	const bullets = asArray(args.bullet as string | string[] | undefined);

	if (!slug || !headline) {
		process.stderr.write("--slug and --headline are required\n");
		return EXIT_USAGE;
	}

	const dir = path.resolve("apps/marketing/src/app/[locale]/features", slug);
	if (existsSync(dir)) {
		process.stderr.write(`${dir} already exists. Aborting.\n`);
		return EXIT_RUNTIME;
	}
	mkdirSync(dir, { recursive: true });

	const illustration = tryGenIllustration(slug, headline);
	const body = pageBody({ slug, headline, subtitle, bullets, illustration });
	writeFileSync(path.join(dir, "page.tsx"), body, "utf8");

	process.stdout.write(
		`wrote ${dir}/page.tsx${illustration ? ` (illustration: ${illustration})` : ""}\n`,
	);
	return EXIT_OK;
}

try {
	process.exit(main());
} catch (err) {
	process.stderr.write(`gen-feature-landing crashed: ${err}\n`);
	process.exit(EXIT_RUNTIME);
}
