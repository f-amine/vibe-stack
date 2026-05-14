"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/use-gsap";

const steps = [
	{
		num: "i.",
		title: "Clone the starter",
		body: "pnpm create from the GitHub template. Rename the package scope. You're moving in 30 seconds.",
	},
	{
		num: "ii.",
		title: "Fill in five env vars",
		body: "Postgres URL, Better Auth secret, Polar token, Resend key, R2 keys. The rest is optional.",
	},
	{
		num: "iii.",
		title: "Push schema, run dev",
		body: "pnpm db:push, pnpm dev. Three apps boot in parallel. Marketing on 3000. Product on 3001. Admin on 3002.",
	},
	{
		num: "iv.",
		title: "Hand to AI, or ship yourself",
		body: "Run the autonomous loop with ruflo. Or just commit features one PR at a time with the bundled skills.",
	},
];

export function HowItWorks() {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			gsap.from(".how-step", {
				scrollTrigger: {
					trigger: root.current,
					start: "top 75%",
				},
				x: -40,
				autoAlpha: 0,
				duration: 0.8,
				ease: "expo.out",
				stagger: 0.15,
			});

			gsap.from(".how-line", {
				scrollTrigger: {
					trigger: root.current,
					start: "top 75%",
				},
				scaleY: 0,
				duration: 1.6,
				ease: "expo.inOut",
				transformOrigin: "top",
			});
		},
		{ scope: root },
	);

	return (
		<section
			ref={root}
			className="relative border-[color:var(--marketing-line)] border-t py-32 sm:py-40"
		>
			<div className="mx-auto max-w-7xl px-6 lg:px-10">
				<div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
					<div>
						<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
							— From clone to first deploy
						</p>
						<h2 className="mt-6 font-display text-5xl tracking-[-0.03em] sm:text-6xl">
							Four steps. <br />
							<span className="text-[color:var(--marketing-accent)] italic">
								Then features.
							</span>
						</h2>
					</div>

					<ol className="relative grid gap-0 border-[color:var(--marketing-line)] border-l">
						<div className="how-line absolute top-0 left-0 h-full w-px bg-gradient-to-b from-[color:var(--marketing-accent)] via-[color:var(--marketing-accent)]/40 to-transparent" />
						{steps.map((s) => (
							<li
								key={s.num}
								className="how-step relative grid gap-3 py-8 pl-10 first:pt-0 last:pb-0"
							>
								<span className="absolute top-9 left-[-9px] h-4 w-4 rounded-full border-2 border-[color:var(--marketing-bg)] bg-[color:var(--marketing-accent)] first:top-1" />
								<span className="font-display text-2xl text-[color:var(--marketing-accent)] italic">
									{s.num}
								</span>
								<h3 className="font-display text-3xl tracking-tight">
									{s.title}
								</h3>
								<p className="max-w-xl text-[color:var(--marketing-fg)]/65">
									{s.body}
								</p>
							</li>
						))}
					</ol>
				</div>
			</div>
		</section>
	);
}
