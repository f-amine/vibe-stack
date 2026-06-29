"use client";

import { useRef } from "react";
import { WEB_URLS } from "@/lib/app-urls";
import { formatStars, GITHUB_URL } from "@/lib/github";
import { gsap, useGSAP } from "@/lib/use-gsap";
import { GithubMark } from "../github-mark";

// Full-viewport hero: a 16:9 backdrop image fills the section edge-to-edge,
// a dimming gradient keeps foreground copy readable, and the content stack
// is anchored to the lower-left. The site's fixed MarketingHeader is the top
// overlay (it sits above this on z). Swap public/hero.png to rebrand the
// backdrop. Content is vertically centered so the backdrop reads on tall
// viewports without a large empty band under the nav.
export function Hero({ stars }: { stars?: number | null }) {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			// Only animate when the user hasn't asked for reduced motion —
			// otherwise the content keeps its natural (visible) state.
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				gsap
					.timeline({ defaults: { ease: "expo.out", duration: 1.1 } })
					.from(".hero-eyebrow", { y: 24, autoAlpha: 0 })
					.from(".hero-title-line", { yPercent: 110, stagger: 0.1 }, "-=0.7")
					.from(".hero-sub", { y: 24, autoAlpha: 0 }, "-=0.7")
					.from(".hero-cta", { y: 18, autoAlpha: 0, stagger: 0.1 }, "-=0.7");
			});
		},
		{ scope: root },
	);

	return (
		<section
			ref={root}
			className="relative flex h-[100svh] max-h-[900px] min-h-[600px] flex-col justify-center overflow-hidden bg-[color:var(--marketing-bg)]"
		>
			{/* Background image — decorative. Swap public/hero.png to rebrand. */}
			<img
				src="/hero.png"
				alt=""
				aria-hidden
				className="absolute inset-0 h-full w-full object-cover"
			/>

			{/* Dimming layers: a vertical scrim (nav legibility up top, copy
			    legibility at the bottom) plus a left scrim for the text column. */}
			<div
				aria-hidden
				className="absolute inset-0"
				style={{
					background:
						"linear-gradient(to bottom, color-mix(in oklab, var(--marketing-bg) 70%, transparent) 0%, color-mix(in oklab, var(--marketing-bg) 22%, transparent) 38%, color-mix(in oklab, var(--marketing-bg) 90%, transparent) 100%)",
				}}
			/>
			<div
				aria-hidden
				className="absolute inset-0"
				style={{
					background:
						"linear-gradient(to right, color-mix(in oklab, var(--marketing-bg) 78%, transparent) 0%, transparent 62%)",
				}}
			/>

			{/* Bottom-anchored content stack */}
			<div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 lg:px-10">
				<div className="max-w-2xl">
					<p className="hero-eyebrow font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
						— Built for vibe-coders in a hurry
					</p>

					<h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,4rem)] leading-[1] tracking-[-0.03em]">
						<span className="block overflow-hidden">
							<span className="hero-title-line inline-block">
								Ship your SaaS this weekend,
							</span>
						</span>
						<span className="block overflow-hidden">
							<span className="hero-title-line inline-block">
								let{" "}
								<span className="text-[color:var(--marketing-accent)] italic">
									Claude
								</span>{" "}
								wire the rest.
							</span>
						</span>
					</h1>

					<p className="hero-sub mt-5 max-w-xl text-[color:var(--marketing-fg)]/75 text-base leading-relaxed">
						Clone it, describe your idea, watch it ship. Auth, billing, email,
						storage, and deploy come pre-wired, so you skip the plumbing and
						build the thing you actually care about. Made for vibe-coders who
						would rather move fast than wire boilerplate.
					</p>

					<div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-stretch">
						<a
							href={WEB_URLS.signUp}
							className="hero-cta group inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-[color:var(--marketing-accent)] px-7 py-3.5 font-medium text-[color:var(--marketing-bg)] text-base transition-transform hover:scale-[1.02]"
						>
							Start building
							<span
								aria-hidden
								className="transition-transform group-hover:translate-x-0.5"
							>
								→
							</span>
						</a>
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noreferrer"
							className="hero-cta inline-flex items-center justify-center gap-2.5 rounded-full border border-[color:var(--marketing-fg)]/25 px-6 py-3.5 text-[color:var(--marketing-fg)] text-base transition-colors hover:bg-[color:var(--marketing-fg)]/10"
						>
							<GithubMark className="h-[1.1em] w-[1.1em]" />
							Star on GitHub
							{typeof stars === "number" && (
								<span className="ml-0.5 inline-flex items-center gap-1 font-mono text-[color:var(--marketing-fg)]/70 text-sm">
									<span aria-hidden>★</span>
									{formatStars(stars)}
								</span>
							)}
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
