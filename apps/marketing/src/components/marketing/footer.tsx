import Link from "next/link";

type FooterLink = {
	label: string;
	href: string;
	external?: boolean;
};

const columns: { title: string; links: FooterLink[] }[] = [
	{
		title: "Product",
		links: [
			{ label: "Features", href: "#features" },
			{ label: "Workflow", href: "#how-it-works" },
			{ label: "Changelog", href: "/changelog" },
		],
	},
	{
		title: "Resources",
		links: [
			{ label: "Documentation", href: "/docs" },
			{ label: "Journal", href: "/blog" },
			{
				label: "GitHub",
				href: "https://github.com/f-amine/vibestack",
				external: true,
			},
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
								vibe
							</span>
							<span className="ml-1.5 text-[color:var(--marketing-fg)]/70">
								/stack
							</span>
						</Link>
						<p className="mt-6 max-w-md text-[color:var(--marketing-fg)]/60 text-sm leading-relaxed">
							The opinionated, AI-first SaaS starter. Full stack pre-wired,
							every Claude Code skill vendored in the repo. You bring the
							business logic.
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
												{...(l.external
													? {
															target: "_blank",
															rel: "noopener noreferrer",
														}
													: {})}
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

				<div className="mt-16 flex flex-col items-start justify-between gap-6 border-[color:var(--marketing-line)] border-t pt-8 font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-widest lg:flex-row lg:items-center">
					<span>© {new Date().getFullYear()} — vibestack</span>
					<span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
						<span className="text-[color:var(--marketing-fg)]/45">
							Built on
						</span>
						<span>Next 16</span>
						<span aria-hidden>·</span>
						<span>React 19</span>
						<span aria-hidden>·</span>
						<span>Better Auth</span>
						<span aria-hidden>·</span>
						<span>Drizzle</span>
						<span aria-hidden>·</span>
						<span>Postgres</span>
						<span aria-hidden>·</span>
						<span>Polar.sh</span>
						<span aria-hidden>·</span>
						<span>Resend</span>
						<span aria-hidden>·</span>
						<span>R2</span>
						<span aria-hidden>·</span>
						<span>PostHog</span>
						<span aria-hidden>·</span>
						<span>Turborepo</span>
						<span aria-hidden>·</span>
						<span>shadcn</span>
						<span aria-hidden>·</span>
						<span>Biome</span>
					</span>
				</div>
			</div>
		</footer>
	);
}
