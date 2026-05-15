import type { Metadata } from "next";
import { ogMetadata } from "@/lib/og";
import {
	fetchRoadmap,
	groupByStatus,
	type RoadmapItem,
	type RoadmapStatus,
} from "@/lib/roadmap";

export const revalidate = 600;

const TITLE = "Roadmap";
const SUBTITLE =
	"What we're planning, building, and have already shipped. Updates every 10 minutes from GitHub issues.";

export const metadata: Metadata = {
	title: TITLE,
	description: SUBTITLE,
	...ogMetadata({
		title: TITLE,
		subtitle: SUBTITLE,
		eyebrow: "Roadmap",
	}),
};

const COLUMNS: { key: RoadmapStatus; title: string; description: string }[] = [
	{
		key: "planned",
		title: "Planned",
		description: "Up next. Order isn't a commitment.",
	},
	{
		key: "in-progress",
		title: "In progress",
		description: "Active branches with open PRs.",
	},
	{
		key: "done",
		title: "Done",
		description: "Shipped to master.",
	},
];

function Column({
	title,
	description,
	items,
}: {
	title: string;
	description: string;
	items: RoadmapItem[];
}) {
	return (
		<section className="flex flex-col">
			<header className="border-[color:var(--marketing-line)] border-b pb-3">
				<h2 className="font-display text-2xl tracking-tight">{title}</h2>
				<p className="mt-1 text-[color:var(--marketing-fg)]/60 text-xs">
					{description}
				</p>
				<span className="mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--marketing-line)]/40 font-mono text-[10px]">
					{items.length}
				</span>
			</header>
			<ol className="mt-4 grid gap-2">
				{items.length === 0 ? (
					<li className="rounded-lg border border-[color:var(--marketing-line)] border-dashed p-4 text-center text-[color:var(--marketing-fg)]/40 text-xs">
						Nothing here right now.
					</li>
				) : null}
				{items.map((item) => (
					<li
						key={item.id}
						className="rounded-lg border border-[color:var(--marketing-line)] p-4 transition-colors hover:bg-[color:var(--marketing-line)]/20"
					>
						<a
							href={item.url}
							target="_blank"
							rel="noreferrer noopener"
							className="block"
						>
							<p className="font-medium text-sm leading-snug">{item.title}</p>
							<p className="mt-1.5 font-mono text-[10px] text-[color:var(--marketing-muted)] uppercase tracking-widest">
								#{item.number} · updated{" "}
								{new Date(item.updatedAt).toLocaleDateString()}
							</p>
						</a>
					</li>
				))}
			</ol>
		</section>
	);
}

export default async function RoadmapPage() {
	const { items, repo } = await fetchRoadmap();
	const groups = groupByStatus(items);

	return (
		<main className="mx-auto max-w-7xl px-6 py-16">
			<header>
				<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
					— Public roadmap
				</p>
				<h1 className="mt-4 font-display text-5xl tracking-tight sm:text-6xl">
					What we're building.
				</h1>
				<p className="mt-4 max-w-2xl text-[color:var(--marketing-fg)]/70 text-lg">
					{SUBTITLE}
				</p>
				{repo ? (
					<p className="mt-4 font-mono text-[color:var(--marketing-muted)] text-xs">
						source:{" "}
						<a
							href={`https://github.com/${repo}/issues?q=is:open+label:roadmap:planned,roadmap:in-progress,roadmap:done`}
							target="_blank"
							rel="noreferrer noopener"
							className="underline-offset-4 hover:underline"
						>
							github.com/{repo}
						</a>
					</p>
				) : (
					<p className="mt-4 rounded-md bg-[color:var(--marketing-line)]/40 px-3 py-2 font-mono text-[color:var(--marketing-muted)] text-xs">
						Set <code>NEXT_PUBLIC_GITHUB_REPO=&lt;owner&gt;/&lt;repo&gt;</code>{" "}
						(and optionally <code>GITHUB_TOKEN</code>) to surface issues here.
					</p>
				)}
			</header>

			<div className="mt-12 grid gap-8 lg:grid-cols-3">
				{COLUMNS.map((c) => (
					<Column
						key={c.key}
						title={c.title}
						description={c.description}
						items={groups[c.key]}
					/>
				))}
			</div>
		</main>
	);
}
