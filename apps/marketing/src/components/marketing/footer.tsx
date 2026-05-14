import Link from "next/link";

const columns = [
	{
		title: "Product",
		links: [
			{ label: "Features", href: "#features" },
			{ label: "Pricing", href: "#pricing" },
			{ label: "Changelog", href: "/blog" },
		],
	},
	{
		title: "Resources",
		links: [
			{ label: "Documentation", href: "/docs" },
			{ label: "Journal", href: "/blog" },
			{ label: "GitHub", href: "https://github.com" },
		],
	},
	{
		title: "Company",
		links: [
			{ label: "About", href: "#" },
			{ label: "Contact", href: "#" },
			{ label: "Twitter", href: "#" },
		],
	},
];

export function MarketingFooter() {
	return (
		<footer className="border-[color:var(--marketing-line)] border-t bg-[color:var(--marketing-bg)] py-20">
			<div className="mx-auto max-w-7xl px-6 lg:px-10">
				<div className="grid gap-12 lg:grid-cols-[2fr_3fr]">
					<div>
						<Link href="/" className="font-display text-2xl tracking-tight">
							<span className="inline-block bg-[color:var(--marketing-fg)] px-2 py-0.5 font-medium text-[color:var(--marketing-bg)]">
								stack
							</span>
							<span className="ml-1.5 text-[color:var(--marketing-fg)]/70">
								/saas
							</span>
						</Link>
						<p className="mt-6 max-w-md text-[color:var(--marketing-fg)]/60 text-sm leading-relaxed">
							The boring parts of a SaaS, pre-wired and ready. So you ship the
							part of your product nobody else has.
						</p>
					</div>

					<div className="grid grid-cols-3 gap-6">
						{columns.map((c) => (
							<div key={c.title}>
								<h4 className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-widest">
									{c.title}
								</h4>
								<ul className="mt-4 space-y-2.5 text-sm">
									{c.links.map((l) => (
										<li key={l.label}>
											<Link
												href={l.href}
												className="text-[color:var(--marketing-fg)]/80 transition-colors hover:text-[color:var(--marketing-fg)]"
											>
												{l.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				<div className="mt-16 flex flex-col items-start justify-between gap-4 border-[color:var(--marketing-line)] border-t pt-8 font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-widest sm:flex-row sm:items-center">
					<span>© {new Date().getFullYear()} — Stack/saas</span>
					<span>Built on Next 16 · React 19 · TypeScript 6</span>
				</div>
			</div>
		</footer>
	);
}
