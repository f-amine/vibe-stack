"use client";

import { useRef } from "react";
import { WEB_URLS } from "@/lib/app-urls";
import { gsap, useGSAP } from "@/lib/use-gsap";

export function Hero() {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const tl = gsap.timeline({
				defaults: { ease: "expo.out", duration: 1.2 },
			});

			tl.from(".hero-eyebrow", { y: 30, autoAlpha: 0 })
				.from(
					".hero-title-line",
					{ y: "110%", duration: 1.3, stagger: 0.08 },
					"-=0.8",
				)
				.from(".hero-sub", { y: 30, autoAlpha: 0 }, "-=0.6")
				.from(".hero-cta", { y: 20, autoAlpha: 0, stagger: 0.08 }, "-=0.7")
				.from(".hero-meta", { autoAlpha: 0 }, "-=0.5");

			// Parallax on scroll
			gsap.to(".hero-bg-art", {
				yPercent: 30,
				ease: "none",
				scrollTrigger: {
					trigger: root.current,
					start: "top top",
					end: "bottom top",
					scrub: true,
				},
			});

			gsap.to(".hero-title", {
				yPercent: -10,
				autoAlpha: 0.6,
				ease: "none",
				scrollTrigger: {
					trigger: root.current,
					start: "top top",
					end: "bottom top",
					scrub: true,
				},
			});
		},
		{ scope: root },
	);

	return (
		<section
			ref={root}
			className="relative overflow-hidden pt-40 pb-28 sm:pt-48 sm:pb-40"
		>
			{/* Background art */}
			<div
				className="hero-bg-art pointer-events-none absolute inset-0 -z-10"
				aria-hidden
			>
				<div
					className="absolute inset-x-0 top-32 mx-auto h-[640px] max-w-5xl rounded-full opacity-30 blur-3xl"
					style={{
						background:
							"radial-gradient(circle at 50% 40%, color-mix(in oklab, var(--marketing-accent) 60%, transparent) 0%, transparent 60%)",
					}}
				/>
				<svg
					className="absolute inset-0 h-full w-full opacity-[0.04]"
					viewBox="0 0 1200 800"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<title>Decorative grid</title>
					<defs>
						<pattern
							id="grid"
							width="48"
							height="48"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M 48 0 L 0 0 0 48"
								fill="none"
								stroke="currentColor"
								strokeWidth="0.5"
							/>
						</pattern>
					</defs>
					<rect width="1200" height="800" fill="url(#grid)" />
				</svg>
			</div>

			<div className="mx-auto max-w-7xl px-6 lg:px-10">
				<p className="hero-eyebrow font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
					— A starter for serious operators
				</p>

				<h1 className="hero-title mt-8 font-display text-[clamp(3rem,9vw,8rem)] leading-[0.92] tracking-[-0.04em]">
					<span className="block overflow-hidden">
						<span className="hero-title-line inline-block">
							Build the boring{" "}
							<span className="text-[color:var(--marketing-accent)] italic">
								parts
							</span>
						</span>
					</span>
					<span className="block overflow-hidden">
						<span className="hero-title-line inline-block">once. Ship the</span>
					</span>
					<span className="block overflow-hidden">
						<span className="hero-title-line inline-block">
							rest <span className="italic">a hundred</span> times.
						</span>
					</span>
				</h1>

				<p className="hero-sub mt-10 max-w-xl text-[color:var(--marketing-fg)]/70 text-lg sm:text-xl">
					A pre-wired SaaS foundation — auth, billing, email, storage,
					analytics, admin, AI workflow. So your launch is the feature, not the
					plumbing.
				</p>

				<div className="mt-12 flex flex-col gap-3 sm:flex-row">
					<a
						href={WEB_URLS.signUp}
						className="hero-cta group inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--marketing-accent)] px-7 py-3.5 font-medium text-[color:var(--marketing-bg)] text-base transition-transform hover:scale-[1.02]"
					>
						Start your project
						<span
							aria-hidden
							className="transition-transform group-hover:translate-x-0.5"
						>
							→
						</span>
					</a>
					<a
						href="#features"
						className="hero-cta inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--marketing-line)] px-7 py-3.5 text-[color:var(--marketing-fg)]/90 text-base transition-colors hover:bg-[color:var(--marketing-line)]/40"
					>
						See what's inside
					</a>
				</div>

				<div className="hero-meta mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-widest">
					<span>Next 16 / React 19</span>
					<span aria-hidden>·</span>
					<span>Better Auth</span>
					<span aria-hidden>·</span>
					<span>Drizzle / Postgres</span>
					<span aria-hidden>·</span>
					<span>Polar.sh</span>
					<span aria-hidden>·</span>
					<span>Resend</span>
				</div>
			</div>
		</section>
	);
}
