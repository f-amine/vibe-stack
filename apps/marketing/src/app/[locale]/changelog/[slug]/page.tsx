import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TechArticleJsonLd } from "@/components/seo/json-ld";
import { ogMetadata, siteBase } from "@/lib/og";
import { changelogSource } from "@/lib/source";

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
	return changelogSource.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const page = changelogSource.getPage([slug]);
	if (!page) {
		return {};
	}
	const description = (page.data as { description?: string }).description;
	return {
		title: page.data.title,
		description,
		...ogMetadata({
			title: page.data.title,
			subtitle: description ?? "From the vibestack changelog.",
			eyebrow: "Changelog",
		}),
	};
}

export default async function ChangelogEntryPage({ params }: Props) {
	const { slug } = await params;
	const page = changelogSource.getPage([slug]);
	if (!page) {
		notFound();
	}
	const MDX = page.data.body;
	const data = page.data as {
		date?: string;
		breakingCount?: number;
		title: string;
		description?: string;
	};
	const absoluteUrl = `${siteBase()}${page.url}`;
	return (
		<main className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-6 py-16">
			<TechArticleJsonLd
				url={absoluteUrl}
				title={data.title}
				description={data.description}
				dateModified={data.date}
			/>
			<div className="not-prose flex flex-wrap items-center gap-3">
				<time
					dateTime={data.date ?? ""}
					className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-widest"
				>
					{data.date ?? "—"}
				</time>
				{data.breakingCount && data.breakingCount > 0 ? (
					<span className="rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 font-mono text-[10px] text-destructive uppercase tracking-widest">
						{data.breakingCount} breaking
					</span>
				) : null}
			</div>
			<h1>{data.title}</h1>
			<MDX />
		</main>
	);
}
