import { DynamicIslandTOC } from "@vibestack/ui/components/dynamic-island-toc";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeader } from "@/components/marketing/header";
import { BlogPostingJsonLd } from "@/components/seo/json-ld";
import { ogMetadata, siteBase } from "@/lib/og";
import { blogSource } from "@/lib/source";

type Props = {
	params: Promise<{ slug: string }>;
};

type PostData = {
	title: string;
	description?: string;
	date?: string;
	author?: string;
	tags?: string[];
	cover?: string;
	readingTime?: number;
};

export async function generateStaticParams() {
	return blogSource.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const page = blogSource.getPage([slug]);
	if (!page) {
		return {};
	}
	const data = page.data as PostData;
	return {
		title: data.title,
		description: data.description,
		alternates: { canonical: page.url },
		...ogMetadata({
			title: data.title,
			subtitle: data.description ?? "From the vibestack journal.",
			eyebrow: "Journal",
		}),
	};
}

function formatDate(input?: string): string {
	if (!input) return "Undated";
	const ms = Date.parse(input);
	if (!Number.isFinite(ms)) return input;
	return new Date(ms).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export default async function BlogPost({ params }: Props) {
	const { slug } = await params;
	const page = blogSource.getPage([slug]);
	if (!page) notFound();
	const MDX = page.data.body;
	const data = page.data as PostData;
	const absoluteUrl = `${siteBase()}${page.url}`;
	const cover = data.cover;

	return (
		<div className="marketing grain relative min-h-dvh">
			<MarketingHeader />
			<BlogPostingJsonLd
				url={absoluteUrl}
				title={data.title}
				description={data.description}
				datePublished={data.date}
				dateModified={data.date}
				author={data.author ?? "vibestack"}
			/>

			<article>
				{/* Editorial header */}
				<header className="mx-auto max-w-3xl px-6 pt-32 pb-12 sm:pt-40 lg:px-8">
					<div className="flex flex-wrap items-center gap-3 font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.22em]">
						<Link
							href="/blog"
							className="transition-colors hover:text-[color:var(--marketing-fg)]"
						>
							Journal
						</Link>
						<span aria-hidden>/</span>
						<time dateTime={data.date ?? ""}>{formatDate(data.date)}</time>
						{typeof data.readingTime === "number" ? (
							<>
								<span aria-hidden>/</span>
								<span>{data.readingTime} min read</span>
							</>
						) : null}
					</div>

					<h1 className="mt-8 font-display text-[clamp(2.5rem,5.5vw,4rem)] leading-[1.04] tracking-[-0.022em] text-[color:var(--marketing-fg)]">
						{data.title}
					</h1>

					{data.description ? (
						<p className="mt-6 max-w-2xl text-[color:var(--marketing-fg)]/70 text-lg leading-relaxed">
							{data.description}
						</p>
					) : null}

					{data.author ? (
						<p className="mt-10 inline-flex items-center gap-3 font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.22em]">
							<span
								className="h-px w-8 bg-[color:var(--marketing-accent)]"
								aria-hidden
							/>
							<span>{data.author}</span>
						</p>
					) : null}
				</header>

				{/* Cover hero */}
				{cover ? (
					<div className="mx-auto max-w-5xl px-6 lg:px-8">
						<div className="relative aspect-[16/9] w-full overflow-hidden border border-[color:var(--marketing-line)]">
							<Image
								src={cover}
								alt={data.title}
								fill
								sizes="(min-width: 1024px) 80vw, 100vw"
								className="object-cover"
								priority
							/>
						</div>
					</div>
				) : null}

				{/* Body */}
				<div className="blog-body mx-auto max-w-3xl px-6 py-20 lg:px-8">
					<MDX />
				</div>

				{/* Closing rule + back link */}
				<div className="mx-auto max-w-3xl px-6 pb-32 lg:px-8">
					<div
						className="mx-auto h-px w-16 bg-[color:var(--marketing-accent)]"
						aria-hidden
					/>
					<p className="mt-10 text-center font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.22em]">
						<Link
							href="/blog"
							className="transition-colors hover:text-[color:var(--marketing-fg)]"
						>
							← Back to the journal
						</Link>
					</p>
				</div>
			</article>

			<DynamicIslandTOC />
			<MarketingFooter />
		</div>
	);
}
