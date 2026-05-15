"use client";

import { cn } from "@vibestack/ui/lib/utils";
import { useRef } from "react";
import { WEB_URLS } from "@/lib/app-urls";
import { gsap, useGSAP } from "@/lib/use-gsap";

const tiers = [
	{
		id: "starter",
		name: "Starter",
		price: "$0",
		period: "/forever",
		desc: "For prototypes and weekend bets.",
		features: [
			"All starter features",
			"Self-host on Dokploy",
			"Community Discord",
			"MIT license",
		],
		cta: "Clone repo",
		featured: false,
	},
	{
		id: "pro",
		name: "Pro",
		price: "$29",
		period: "/mo",
		desc: "For the project you actually plan to ship.",
		features: [
			"Everything in Starter",
			"Private templates",
			"Priority issue triage",
			"Quarterly stack upgrades",
			"Email support",
		],
		cta: "Start free trial",
		featured: true,
	},
	{
		id: "team",
		name: "Team",
		price: "$99",
		period: "/mo",
		desc: "For agencies and small founding teams.",
		features: [
			"Everything in Pro",
			"5 seats included",
			"White-label license",
			"Slack channel",
			"Onboarding session",
		],
		cta: "Talk to us",
		featured: false,
	},
];

export function Pricing() {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			gsap.from(".pricing-card", {
				scrollTrigger: {
					trigger: root.current,
					start: "top 75%",
				},
				y: 60,
				autoAlpha: 0,
				duration: 0.9,
				ease: "expo.out",
				stagger: 0.1,
			});
		},
		{ scope: root },
	);

	return (
		<section
			ref={root}
			id="pricing"
			className="border-[color:var(--marketing-line)] border-t py-32 sm:py-40"
		>
			<div className="mx-auto max-w-7xl px-6 lg:px-10">
				<div className="mx-auto max-w-2xl text-center">
					<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
						— Pricing
					</p>
					<h2 className="mt-6 font-display text-5xl tracking-[-0.03em] sm:text-6xl">
						No <span className="italic">enterprise</span> surprises.
					</h2>
					<p className="mt-6 text-[color:var(--marketing-fg)]/70">
						Use it free forever. Pay only when you want the maintained edition
						and our help.
					</p>
				</div>

				<div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
					{tiers.map((t) => (
						<article
							key={t.id}
							className={cn(
								"pricing-card relative flex flex-col rounded-3xl border p-8 transition-colors",
								t.featured
									? "border-[color:var(--marketing-accent)] bg-[color:var(--marketing-accent)] text-[color:var(--marketing-bg)]"
									: "border-[color:var(--marketing-line)] bg-[color:var(--marketing-bg)]",
							)}
						>
							{t.featured && (
								<span className="absolute top-6 right-6 rounded-full bg-[color:var(--marketing-bg)] px-3 py-1 font-mono text-[10px] text-[color:var(--marketing-accent)] uppercase tracking-widest">
									Popular
								</span>
							)}
							<h3 className="font-display text-3xl tracking-tight">{t.name}</h3>
							<p
								className={cn(
									"mt-2 text-sm",
									t.featured
										? "text-[color:var(--marketing-bg)]/80"
										: "text-[color:var(--marketing-fg)]/65",
								)}
							>
								{t.desc}
							</p>

							<div className="mt-8 flex items-baseline gap-1">
								<span className="font-display text-6xl tracking-tighter">
									{t.price}
								</span>
								<span className="font-mono text-sm uppercase tracking-widest opacity-60">
									{t.period}
								</span>
							</div>

							<ul className="mt-10 space-y-3 text-sm">
								{t.features.map((f) => (
									<li key={f} className="flex items-start gap-3">
										<span
											aria-hidden
											className={cn(
												"mt-1 inline-block h-1.5 w-1.5 rounded-full",
												t.featured
													? "bg-[color:var(--marketing-bg)]"
													: "bg-[color:var(--marketing-accent)]",
											)}
										/>
										<span>{f}</span>
									</li>
								))}
							</ul>

							<a
								href={WEB_URLS.signUp}
								className={cn(
									"mt-10 inline-flex items-center justify-center rounded-full px-5 py-3 font-medium text-sm transition-transform hover:scale-[1.02]",
									t.featured
										? "bg-[color:var(--marketing-bg)] text-[color:var(--marketing-fg)]"
										: "border border-[color:var(--marketing-line)] text-[color:var(--marketing-fg)] hover:bg-[color:var(--marketing-line)]/40",
								)}
							>
								{t.cta} →
							</a>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
