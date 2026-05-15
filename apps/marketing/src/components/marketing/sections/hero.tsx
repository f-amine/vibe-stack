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
				.from(".hero-meta", { autoAlpha: 0 }, "-=0.5")
				.from(
					".hero-art",
					{ autoAlpha: 0, scale: 0.92, duration: 1.4 },
					"-=1.4",
				);

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

			gsap.to(".hero-art", {
				yPercent: -18,
				ease: "none",
				scrollTrigger: {
					trigger: root.current,
					start: "top top",
					end: "bottom top",
					scrub: true,
				},
			});

			gsap.to(".hero-art-ring", {
				rotation: 360,
				transformOrigin: "50% 50%",
				ease: "none",
				duration: 80,
				repeat: -1,
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

			<div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:px-10">
				<div>
					<p className="hero-eyebrow font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
						— A starter for serious operators
					</p>

					<h1 className="hero-title mt-8 font-display text-[clamp(3rem,9vw,8rem)] leading-[0.92] tracking-[-0.04em]">
						<span className="block overflow-hidden">
							<span className="hero-title-line inline-block">
								Ship the{" "}
								<span className="text-[color:var(--marketing-accent)] italic">
									interesting
								</span>{" "}
								part.
							</span>
						</span>
						<span className="block overflow-hidden">
							<span className="hero-title-line inline-block">
								We wired the rest.
							</span>
						</span>
					</h1>

					<p className="hero-sub mt-10 max-w-xl text-[color:var(--marketing-fg)]/70 text-lg sm:text-xl">
						A pre-wired SaaS foundation — auth, billing, email, storage,
						analytics, admin, AI workflow. So your launch is the feature, not
						the plumbing.
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
				<div
					className="hero-art relative hidden aspect-square w-full max-w-[480px] justify-self-end lg:block"
					aria-hidden
				>
					<svg
						viewBox="0 0 400 400"
						className="h-full w-full"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Editorial geometric mark</title>
						<defs>
							<linearGradient id="hero-art-grad" x1="0" y1="0" x2="1" y2="1">
								<stop
									offset="0%"
									stopColor="color-mix(in oklab, var(--marketing-accent) 90%, transparent)"
								/>
								<stop
									offset="100%"
									stopColor="color-mix(in oklab, var(--marketing-accent) 10%, transparent)"
								/>
							</linearGradient>
							<radialGradient id="hero-art-glow" cx="0.5" cy="0.5" r="0.5">
								<stop
									offset="0%"
									stopColor="color-mix(in oklab, var(--marketing-accent) 35%, transparent)"
								/>
								<stop offset="100%" stopColor="transparent" />
							</radialGradient>
						</defs>
						<circle cx="200" cy="200" r="180" fill="url(#hero-art-glow)" />
						<g
							className="hero-art-ring"
							stroke="url(#hero-art-grad)"
							strokeWidth="1"
							fill="none"
						>
							<circle cx="200" cy="200" r="160" />
							<circle cx="200" cy="200" r="120" />
							<circle cx="200" cy="200" r="80" />
							<line x1="40" y1="200" x2="360" y2="200" />
							<line x1="200" y1="40" x2="200" y2="360" />
						</g>
						<g
							stroke="color-mix(in oklab, var(--marketing-fg) 60%, transparent)"
							strokeWidth="1.4"
							fill="none"
						>
							<path d="M 80 280 Q 200 80 320 280" />
							<path d="M 110 250 L 200 130 L 290 250 Z" />
						</g>
						<g fill="var(--marketing-accent)">
							<circle cx="200" cy="130" r="5" />
							<circle cx="110" cy="250" r="3" />
							<circle cx="290" cy="250" r="3" />
						</g>
						<text
							x="200"
							y="380"
							textAnchor="middle"
							fill="color-mix(in oklab, var(--marketing-fg) 50%, transparent)"
							fontFamily="ui-monospace, monospace"
							fontSize="9"
							letterSpacing="4"
						>
							STARTER · SAAS · 2026
						</text>
					</svg>
				</div>
			</div>
		</section>
	);
}
