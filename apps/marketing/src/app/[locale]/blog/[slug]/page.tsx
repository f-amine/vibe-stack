import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ogMetadata } from "@/lib/og";
import { blogSource } from "@/lib/source";

type Props = {
	params: Promise<{ slug: string }>;
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
	const description = (page.data as { description?: string }).description;
	return {
		title: page.data.title,
		description,
		...ogMetadata({
			title: page.data.title,
			subtitle: description ?? "From the stack/saas journal.",
			eyebrow: "Journal",
		}),
	};
}

export default async function BlogPost({ params }: Props) {
	const { slug } = await params;
	const page = blogSource.getPage([slug]);
	if (!page) notFound();
	const MDX = page.data.body;
	return (
		<main className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-6 py-16">
			<h1>{page.data.title}</h1>
			<MDX />
		</main>
	);
}
