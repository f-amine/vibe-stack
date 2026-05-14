import Link from "next/link";
import { blogSource } from "@/lib/source";

export default function BlogIndex() {
	const posts = blogSource.getPages();
	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<h1 className="font-bold text-4xl">Blog</h1>
			<ul className="mt-10 space-y-6">
				{posts.map((post) => (
					<li key={post.url}>
						<Link
							href={post.url}
							className="block rounded-lg border p-5 hover:bg-muted"
						>
							<h2 className="font-semibold text-xl">{post.data.title}</h2>
							{post.data.description && (
								<p className="mt-1 text-muted-foreground text-sm">
									{post.data.description}
								</p>
							)}
						</Link>
					</li>
				))}
			</ul>
		</main>
	);
}
