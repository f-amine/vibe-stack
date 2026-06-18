"use client";

import { useRef } from "react";
import { WEB_URLS } from "@/lib/app-urls";
import { gsap, useGSAP } from "@/lib/use-gsap";

// Full-viewport hero: a muted looping video fills the section edge-to-edge,
// a dimming gradient keeps foreground copy readable, and the content stack
// is anchored to the lower-left. The site's fixed MarketingHeader is the top
// overlay (it sits above this on z). Background falls back to the ink canvas
// for reduced-motion users and while the video loads.
export function Hero() {
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
			className="relative flex h-[100svh] max-h-[960px] min-h-[600px] flex-col justify-end overflow-hidden bg-[color:var(--marketing-bg)]"
		>
			{/* Background video — decorative, muted, looping. Hidden for
			    reduced-motion; the ink section background shows through. */}
			<video
				className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
				autoPlay
				loop
				muted
				playsInline
				aria-hidden
				tabIndex={-1}
				preload="auto"
			>
				<source src="/hero-bg.mp4" type="video/mp4" />
			</video>

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
			<div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 sm:pb-20 lg:px-10">
				<div className="max-w-2xl">
					<p className="hero-eyebrow font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
						— The AI-first SaaS starter
					</p>

					<h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,4rem)] leading-[1] tracking-[-0.03em]">
						<span className="block overflow-hidden">
							<span className="hero-title-line inline-block">
								The SaaS starter where
							</span>
						</span>
						<span className="block overflow-hidden">
							<span className="hero-title-line inline-block">
								<span className="text-[color:var(--marketing-accent)] italic">
									Claude
								</span>{" "}
								writes the rest.
							</span>
						</span>
					</h1>

					<p className="hero-sub mt-5 max-w-xl text-[color:var(--marketing-fg)]/75 text-base leading-relaxed">
						Auth, billing, email, storage, admin, deploy: all pre-wired. Every
						Claude Code skill vendored in the repo. Bring the business logic,
						skip the plumbing.
					</p>

					<div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
						<a
							href={WEB_URLS.signUp}
							className="hero-cta group inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--marketing-accent)] px-7 py-3.5 font-medium text-[color:var(--marketing-bg)] text-base transition-transform hover:scale-[1.02]"
						>
							Start your SaaS
							<span
								aria-hidden
								className="transition-transform group-hover:translate-x-0.5"
							>
								→
							</span>
						</a>
						<a
							href="#how-it-works"
							className="hero-cta inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--marketing-fg)]/25 px-7 py-3.5 text-[color:var(--marketing-fg)] text-base backdrop-blur-sm transition-colors hover:bg-[color:var(--marketing-fg)]/10"
						>
							See the workflow
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
