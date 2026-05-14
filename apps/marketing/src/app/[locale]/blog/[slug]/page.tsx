import { notFound } from "next/navigation";
import { blogSource } from "@/lib/source";

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
	return blogSource.generateParams();
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
