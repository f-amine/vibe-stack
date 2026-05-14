import Link from "next/link";
import { useTranslations } from "next-intl";

export default function HomePage() {
	const t = useTranslations("marketing.hero");
	return (
		<main className="mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-6 text-center">
			<h1 className="text-balance font-bold text-5xl tracking-tight md:text-7xl">
				{t("title")}
			</h1>
			<p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
				{t("subtitle")}
			</p>
			<div className="mt-8 flex gap-3">
				<Link
					href="/blog"
					className="rounded-md bg-foreground px-5 py-3 text-background"
				>
					{t("ctaPrimary")}
				</Link>
				<Link href="/docs" className="rounded-md border px-5 py-3">
					{t("ctaSecondary")}
				</Link>
			</div>
		</main>
	);
}
