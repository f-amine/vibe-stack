"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/use-gsap";

// The section where a pricing table would normally sit. There is no
// pricing. Saying so plainly is the strongest pitch a free starter has,
// so the layout is a definition list, not three rounded rectangles.
const terms = [
	{
		term: "The license",
		def: "MIT. Client work, commercial products, white-label, resale of what you build with it: all fine, no asterisk.",
	},
	{
		term: "The billing pages",
		def: "Polar wired end-to-end, working out of the box. They exist so your customers can pay you. We never appear on the invoice.",
	},
	{
		term: "The catch",
		def: "There isn't one. The starter is the demo of the workflow. If it saves your weekend, it has done its job.",
	},
	{
		term: "The ask",
		def: "A star on the repo, a note about what you shipped. That's the whole exchange.",
	},
];

export function Free() {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			gsap.from(".free-title-line", {
				scrollTrigger: { trigger: root.current, start: "top 75%" },
				y: "115%",
				duration: 1.1,
				ease: "expo.out",
				stagger: 0.08,
			});
			gsap.from(".free-term", {
				scrollTrigger: { trigger: root.current, start: "top 70%" },
				y: 30,
				autoAlpha: 0,
				duration: 0.8,
				ease: "expo.out",
				stagger: 0.1,
			});
		},
		{ scope: root },
	);

	return (
		<section
			ref={root}
			id="free"
			className="border-[color:var(--marketing-line)] border-t py-32 sm:py-40"
		>
			<div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[1fr_1.2fr] lg:gap-24 lg:px-10">
				<div>
					<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
						— The pricing section
					</p>
					<h2 className="mt-6 font-display text-6xl tracking-[-0.03em] sm:text-7xl">
						<span className="block overflow-hidden">
							<span className="free-title-line block">
								<span className="text-[color:var(--marketing-accent)] italic">
									Free.
								</span>{" "}
								MIT.
							</span>
						</span>
						<span className="block overflow-hidden">
							<span className="free-title-line block">No tiers.</span>
						</span>
					</h2>
					<p className="mt-8 max-w-md text-[color:var(--marketing-fg)]/70 leading-relaxed">
						There is no pro plan hiding behind a toggle, and no seat math. Clone
						it, rename it, ship it, charge for it.
					</p>
				</div>

				<dl className="divide-y divide-[color:var(--marketing-line)] self-center border-[color:var(--marketing-line)] border-y">
					{terms.map((t) => (
						<div
							key={t.term}
							className="free-term grid gap-2 py-7 sm:grid-cols-[11rem_1fr] sm:gap-8"
						>
							<dt className="font-mono text-[0.7rem] text-[color:var(--marketing-muted)] uppercase leading-relaxed tracking-[0.2em]">
								{t.term}
							</dt>
							<dd className="text-[color:var(--marketing-fg)]/80 leading-relaxed">
								{t.def}
							</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
}
