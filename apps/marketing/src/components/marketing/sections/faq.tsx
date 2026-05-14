"use client";

import { cn } from "@starter-saas/ui/lib/utils";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/use-gsap";

const faqs = [
	{
		q: "Why a starter instead of a hosted platform?",
		a: "Because the data and the customer relationship belong to you, not a vendor. Self-host on Dokploy, Hetzner, Fly, wherever you like — swap providers without rewriting your product.",
	},
	{
		q: "How is this different from create-next-app?",
		a: "create-next-app gives you a Next.js project. This gives you a Next.js project that already knows how to sign people in, send them email, take their money, store their files, and tell you what they did.",
	},
	{
		q: "Can I use this for client work?",
		a: "Yes. Starter and Pro tiers are licensed for unlimited internal and client projects. Team tier includes a white-label license.",
	},
	{
		q: "What if I want to deploy to Vercel?",
		a: "It works. Set DATABASE_URL to a Neon connection string and skip the Dokploy compose file. Everything else stays the same.",
	},
	{
		q: "Why Polar instead of Stripe?",
		a: "Polar is developer-first, has fewer dashboards to click through, and ships a Better Auth plugin that handles the boring identity-to-billing wiring for you. You can swap to Stripe later if needed.",
	},
];

export function FAQ() {
	const root = useRef<HTMLElement>(null);
	const [open, setOpen] = useState<number | null>(0);

	useGSAP(
		() => {
			gsap.from(".faq-item", {
				scrollTrigger: { trigger: root.current, start: "top 80%" },
				y: 30,
				autoAlpha: 0,
				duration: 0.8,
				stagger: 0.08,
				ease: "expo.out",
			});
		},
		{ scope: root },
	);

	return (
		<section
			ref={root}
			className="border-[color:var(--marketing-line)] border-t py-32 sm:py-40"
		>
			<div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[1fr_2fr] lg:px-10">
				<div>
					<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
						— Questions
					</p>
					<h2 className="mt-6 font-display text-5xl tracking-[-0.03em] sm:text-6xl">
						Things <br />
						<span className="text-[color:var(--marketing-accent)] italic">
							people ask.
						</span>
					</h2>
				</div>

				<ul className="divide-y divide-[color:var(--marketing-line)]">
					{faqs.map((f, i) => {
						const isOpen = open === i;
						return (
							<li key={f.q} className="faq-item py-2">
								<button
									type="button"
									onClick={() => setOpen(isOpen ? null : i)}
									className="flex w-full items-center justify-between gap-6 py-6 text-left"
								>
									<span className="font-display text-xl tracking-tight sm:text-2xl">
										{f.q}
									</span>
									<span
										className={cn(
											"inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--marketing-line)] text-[color:var(--marketing-fg)]/80 transition-all",
											isOpen
												? "rotate-45 border-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)] text-[color:var(--marketing-bg)]"
												: "",
										)}
										aria-hidden
									>
										+
									</span>
								</button>
								<div
									className={cn(
										"grid overflow-hidden transition-all duration-500 ease-out",
										isOpen
											? "grid-rows-[1fr] pb-6 opacity-100"
											: "grid-rows-[0fr] opacity-0",
									)}
								>
									<div className="overflow-hidden">
										<p className="max-w-2xl text-[color:var(--marketing-fg)]/70 leading-relaxed">
											{f.a}
										</p>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
