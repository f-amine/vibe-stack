import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ogMetadata } from "@/lib/og";
import { blogSource } from "@/lib/source";

const BLOG_TITLE = "Journal · vibestack";
const BLOG_DESCRIPTION =
	"Notes from the people building vibestack and the SaaS we build with it.";

const EYEBROW = "Journal · vol. 01";
const HEADLINE = "Field notes from the people building vibestack.";
const SUBTITLE =
	"Essays, post-mortems, and small ideas from inside the starter. Published when something is worth saying, not on a schedule.";

export const metadata: Metadata = {
	title: BLOG_TITLE,
	description: BLOG_DESCRIPTION,
	alternates: {
		canonical: "/blog",
	},
	...ogMetadata({
		title: BLOG_TITLE,
		subtitle: BLOG_DESCRIPTION,
		eyebrow: "Journal",
	}),
};

type BlogEntry = {
	url: string;
	data: {
		title: string;
		description?: string;
		date?: string;
		author?: string;
		tags?: string[];
		cover?: string;
	};
};

function parseDate(input?: string): number {
	if (!input) return 0;
	const ms = Date.parse(input);
	return Number.isFinite(ms) ? ms : 0;
}

function formatDate(input?: string): string {
	if (!input) return "Undated";
	const ms = Date.parse(input);
	if (!Number.isFinite(ms)) return input;
	return new Date(ms).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "2-digit",
	});
}

function TagChips({ tags }: { tags?: string[] }) {
	if (!tags?.length) return null;
	return (
		<ul className="flex flex-wrap gap-2">
			{tags.map((tag) => (
				<li
					key={tag}
					className="border border-[color:var(--marketing-line)] px-2 py-1 font-mono text-[10px] text-[color:var(--marketing-muted)] uppercase tracking-[0.18em]"
				>
					{tag}
				</li>
			))}
		</ul>
	);
}

export default function BlogIndex() {
	const posts = (blogSource.getPages() as BlogEntry[])
		.slice()
		.sort((a, b) => parseDate(b.data.date) - parseDate(a.data.date));

	const [featured, ...rest] = posts;

	return (
		<main className="mx-auto max-w-4xl px-6 pt-24 pb-32 sm:pt-32">
			<header>
				<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
					{EYEBROW}
				</p>
				<h1 className="mt-8 max-w-3xl font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] tracking-[-0.025em]">
					{HEADLINE}
				</h1>
				<p className="mt-8 max-w-2xl text-[color:var(--marketing-fg)]/70 text-lg leading-relaxed">
					{SUBTITLE}
				</p>
			</header>

			<div
				className="mt-16 h-px w-full bg-[color:var(--marketing-line)]"
				aria-hidden
			/>

			{posts.length === 0 ? (
				<div className="flex min-h-[420px] items-center justify-center py-[200px]">
					<p className="text-center font-display text-2xl text-[color:var(--marketing-fg)]/80 tracking-tight sm:text-3xl">
						No posts yet, the first one's on its way.
					</p>
				</div>
			) : (
				<>
					{featured ? (
						<article className="mt-16">
							<Link
								href={featured.url}
								className="group block focus:outline-none focus-visible:outline-none"
							>
								<div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
									<div>
										<div className="flex flex-wrap items-center gap-3 font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.22em]">
											<span>Featured</span>
											<span aria-hidden>/</span>
											<time dateTime={featured.data.date ?? ""}>
												{formatDate(featured.data.date)}
											</time>
											{featured.data.author ? (
												<>
													<span aria-hidden>/</span>
													<span>{featured.data.author}</span>
												</>
											) : null}
										</div>

										<h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.04] tracking-[-0.02em] transition-colors duration-150 ease-out group-hover:text-[color:var(--marketing-accent)]">
											{featured.data.title}
										</h2>

										{featured.data.description ? (
											<p className="mt-6 max-w-xl text-[color:var(--marketing-fg)]/75 text-lg leading-relaxed">
												{featured.data.description}
											</p>
										) : null}

										{featured.data.tags?.length ? (
											<div className="mt-8">
												<TagChips tags={featured.data.tags} />
											</div>
										) : null}

										<p className="mt-10 inline-flex items-center gap-2 font-mono text-[color:var(--marketing-accent)] text-xs uppercase tracking-[0.24em]">
											Read post
											<span
												aria-hidden
												className="transition-transform duration-150 ease-out group-hover:translate-x-1"
											>
												→
											</span>
										</p>
									</div>

									{featured.data.cover ? (
										<div className="relative aspect-[4/3] w-full overflow-hidden lg:aspect-[5/6]">
											<Image
												src={featured.data.cover}
												alt={featured.data.title}
												fill
												sizes="(min-width: 1024px) 40vw, 100vw"
												className="object-cover"
												loading="lazy"
											/>
										</div>
									) : null}
								</div>
							</Link>
						</article>
					) : null}

					{rest.length > 0 ? (
						<section className="mt-24">
							<div className="flex items-baseline justify-between">
								<h2 className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
									The Ledger
								</h2>
								<p className="font-mono text-[10px] text-[color:var(--marketing-muted)] uppercase tracking-[0.22em]">
									{rest.length} {rest.length === 1 ? "entry" : "entries"}
								</p>
							</div>

							<ol className="mt-8 border-[color:var(--marketing-line)] border-t">
								{rest.map((post) => (
									<li
										key={post.url}
										className="border-[color:var(--marketing-line)] border-b"
									>
										<Link
											href={post.url}
											className="group block py-8 transition-transform duration-100 ease-out hover:-translate-y-px"
										>
											<div className="grid gap-3 sm:grid-cols-[8rem_1fr] sm:gap-8">
												<time
													dateTime={post.data.date ?? ""}
													className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.22em] sm:pt-2"
												>
													{formatDate(post.data.date)}
												</time>
												<div>
													<h3 className="font-display text-2xl leading-[1.15] tracking-[-0.015em] transition-colors duration-100 ease-out group-hover:text-[color:var(--marketing-accent)] sm:text-[1.75rem]">
														{post.data.title}
													</h3>
													{post.data.description ? (
														<p className="mt-3 max-w-2xl text-[color:var(--marketing-fg)]/65 text-base leading-relaxed">
															{post.data.description}
														</p>
													) : null}
													{post.data.tags?.length ? (
														<div className="mt-4">
															<TagChips tags={post.data.tags} />
														</div>
													) : null}
												</div>
											</div>
										</Link>
									</li>
								))}
							</ol>
						</section>
					) : null}
				</>
			)}
		</main>
	);
}
