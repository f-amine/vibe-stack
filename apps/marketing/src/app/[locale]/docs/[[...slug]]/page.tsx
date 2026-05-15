import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TechArticleJsonLd } from "@/components/seo/json-ld";
import { ogMetadata, siteBase } from "@/lib/og";
import { source } from "@/lib/source";

type Props = {
	params: Promise<{ slug?: string[] }>;
};

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const page = source.getPage(slug);
	if (!page) {
		return {};
	}
	const title = page.data.title;
	const description = (page.data as { description?: string }).description;
	return {
		title,
		description,
		alternates: {
			canonical: page.url,
		},
		...ogMetadata({
			title,
			subtitle: description ?? "vibestack documentation.",
			eyebrow: "Docs",
		}),
	};
}

export default async function DocsPageRoute({ params }: Props) {
	const { slug } = await params;
	const page = source.getPage(slug);
	if (!page) notFound();
	const MDX = page.data.body;
	const data = page.data as {
		title: string;
		description?: string;
		lastModified?: string;
	};
	const absoluteUrl = `${siteBase()}${page.url}`;
	return (
		<DocsPage toc={page.data.toc}>
			<TechArticleJsonLd
				url={absoluteUrl}
				title={data.title}
				description={data.description}
				dateModified={data.lastModified}
			/>
			<DocsTitle>{data.title}</DocsTitle>
			<DocsDescription>{data.description}</DocsDescription>
			<DocsBody>
				<MDX />
			</DocsBody>
		</DocsPage>
	);
}
