"use client";

import { useRef } from "react";
import { WEB_URLS } from "@/lib/app-urls";
import { gsap, useGSAP } from "@/lib/use-gsap";

export function CTA() {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			gsap.from(".cta-words .cta-word", {
				scrollTrigger: { trigger: root.current, start: "top 70%" },
				y: "120%",
				duration: 1.2,
				ease: "expo.out",
				stagger: 0.06,
			});
			gsap.from(".cta-foot", {
				scrollTrigger: { trigger: root.current, start: "top 70%" },
				autoAlpha: 0,
				duration: 1,
				delay: 0.6,
			});
		},
		{ scope: root },
	);

	return (
		<section ref={root} className="relative overflow-hidden py-32 sm:py-40">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 -z-10 opacity-40"
				style={{
					background:
						"radial-gradient(ellipse at 50% 80%, color-mix(in oklab, var(--marketing-accent) 50%, transparent), transparent 60%)",
				}}
			/>

			<div className="mx-auto max-w-5xl px-6 text-center lg:px-10">
				<h2 className="cta-words font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95] tracking-[-0.04em]">
					{["Stop", "rebuilding.", "Start", "shipping."].map((w, i) => (
						<span key={i} className="mr-4 inline-block overflow-hidden">
							<span className="cta-word inline-block">
								{i % 2 === 1 ? (
									<span className="text-[color:var(--marketing-accent)] italic">
										{w}
									</span>
								) : (
									w
								)}
							</span>
						</span>
					))}
				</h2>

				<div className="cta-foot mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
					<a
						href={WEB_URLS.signUp}
						className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--marketing-fg)] px-8 py-4 font-medium text-[color:var(--marketing-bg)] text-base transition-transform hover:scale-[1.02]"
					>
						Start your project
						<span aria-hidden>→</span>
					</a>
					<a
						href="/docs"
						className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--marketing-line)] px-8 py-4 text-base transition-colors hover:bg-[color:var(--marketing-line)]/40"
					>
						Read the docs
					</a>
				</div>
			</div>
		</section>
	);
}
