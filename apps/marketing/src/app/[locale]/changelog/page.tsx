import type { Metadata } from "next";
import Link from "next/link";
import { WebsiteJsonLd } from "@/components/seo/json-ld";
import { ogMetadata, siteBase } from "@/lib/og";
import { changelogSource } from "@/lib/source";

const TITLE = "Changelog";
const SUBTITLE = "Every release of vibestack, sorted newest first.";

export const metadata: Metadata = {
	title: TITLE,
	description: SUBTITLE,
	...ogMetadata({
		title: TITLE,
		subtitle: SUBTITLE,
		eyebrow: "Changelog",
	}),
};

type Entry = {
	url: string;
	data: {
		title: string;
		description?: string;
		date?: string;
		draft?: boolean;
		breakingCount?: number;
	};
};

function parseDate(input?: string): number {
	if (!input) {
		return 0;
	}
	const ms = Date.parse(input);
	return Number.isFinite(ms) ? ms : 0;
}

export default function ChangelogIndex() {
	const entries = (changelogSource.getPages() as Entry[])
		.filter((e) => !e.data.draft)
		.sort((a, b) => parseDate(b.data.date) - parseDate(a.data.date));

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<WebsiteJsonLd
				siteUrl={siteBase()}
				name="vibestack"
				description={SUBTITLE}
			/>
			<header>
				<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
					— What's new
				</p>
				<h1 className="mt-4 font-display text-5xl tracking-tight sm:text-6xl">
					Changelog
				</h1>
				<p className="mt-4 text-[color:var(--marketing-fg)]/70 text-lg">
					{SUBTITLE}
				</p>
			</header>

			<ol className="mt-14 space-y-10">
				{entries.length === 0 ? (
					<li className="rounded-lg border border-dashed p-10 text-center text-[color:var(--marketing-muted)]">
						Nothing here yet. Releases land via `pnpm gen:changelog`.
					</li>
				) : null}

				{entries.map((entry) => {
					const breaking = entry.data.breakingCount ?? 0;
					return (
						<li key={entry.url} className="grid gap-2">
							<div className="flex flex-wrap items-center gap-3">
								<time
									dateTime={entry.data.date ?? ""}
									className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-widest"
								>
									{entry.data.date ?? "—"}
								</time>
								{breaking > 0 ? (
									<span className="rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 font-mono text-[10px] text-destructive uppercase tracking-widest">
										{breaking} breaking
									</span>
								) : null}
							</div>
							<Link
								href={entry.url}
								className="block rounded-xl border border-[color:var(--marketing-line)] p-6 transition-colors hover:bg-[color:var(--marketing-line)]/20"
							>
								<h2 className="font-display text-2xl tracking-tight">
									{entry.data.title}
								</h2>
								{entry.data.description ? (
									<p className="mt-2 text-[color:var(--marketing-fg)]/70 text-sm">
										{entry.data.description}
									</p>
								) : null}
								<p className="mt-4 inline-flex items-center gap-1 text-[color:var(--marketing-accent)] text-xs">
									Read release →
								</p>
							</Link>
						</li>
					);
				})}
			</ol>
		</main>
	);
}
