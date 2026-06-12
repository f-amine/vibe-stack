"use client";

import { cn } from "@vibestack/ui/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { WEB_URLS } from "@/lib/app-urls";

const links = [
	{ href: "#features", label: "Features" },
	{ href: "#how-it-works", label: "Workflow" },
	{ href: "/blog", label: "Journal" },
	{ href: "/docs", label: "Docs" },
];

export function MarketingHeader() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 16);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			className={cn(
				"fixed inset-x-0 top-0 z-50 transition-all duration-500",
				scrolled
					? "border-[color:var(--marketing-line)] border-b bg-[color:var(--marketing-bg)]/80 backdrop-blur-xl"
					: "border-transparent",
			)}
		>
			<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
				<Link
					href="/"
					className="font-display text-xl tracking-tight"
					aria-label="Home"
				>
					<span className="inline-block bg-[color:var(--marketing-fg)] px-2 py-0.5 font-medium text-[color:var(--marketing-bg)]">
						vibe
					</span>
					<span className="ml-1.5 text-[color:var(--marketing-fg)]/70">
						/stack
					</span>
				</Link>

				<ul className="hidden items-center gap-1 text-sm md:flex">
					{links.map((l) => (
						<li key={l.href}>
							<Link
								href={l.href}
								className="rounded-full px-4 py-2 text-[color:var(--marketing-fg)]/70 transition-colors hover:bg-[color:var(--marketing-line)]/40 hover:text-[color:var(--marketing-fg)]"
							>
								{l.label}
							</Link>
						</li>
					))}
				</ul>

				<div className="flex items-center gap-2">
					<Link
						href={WEB_URLS.signIn}
						className="hidden rounded-full px-4 py-2 text-[color:var(--marketing-fg)]/80 text-sm transition-colors hover:text-[color:var(--marketing-fg)] sm:inline-block"
					>
						Sign in
					</Link>
					<Link
						href={WEB_URLS.signUp}
						className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-[color:var(--marketing-accent)] px-5 py-2 font-medium text-[color:var(--marketing-bg)] text-sm transition-transform hover:scale-[1.02]"
					>
						Start free
						<span
							aria-hidden
							className="transition-transform group-hover:translate-x-0.5"
						>
							→
						</span>
					</Link>
				</div>
			</nav>
		</header>
	);
}
