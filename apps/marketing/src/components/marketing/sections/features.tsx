"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/use-gsap";

const features = [
	{
		id: "01",
		title: "Auth, organizations, & roles",
		desc: "Email + magic link + Google + passkeys + 2FA. Multi-tenant orgs, member invites, admin impersonation. All wired through Better Auth.",
	},
	{
		id: "02",
		title: "Billing in 60 seconds",
		desc: "Polar.sh checkout, customer portal, webhooks. Subscription mirror in your DB so the rest of your app stays simple.",
	},
	{
		id: "03",
		title: "Email that won't embarrass you",
		desc: "Resend + React Email templates: verification, magic link, password reset, org invite. Preview them locally on :3010.",
	},
	{
		id: "04",
		title: "File storage you control",
		desc: "Cloudflare R2 with presigned uploads. Nightly Postgres dumps to the same bucket on a 30-day rolling retention.",
	},
	{
		id: "05",
		title: "Marketing, product, admin — separate",
		desc: "Three Next.js apps in one Turborepo. Marketing stays fast and static. Product behind auth. Admin gated by role.",
	},
	{
		id: "06",
		title: "Made for AI agents",
		desc: "CONTEXT.md, ADRs, Mattpocock skills, and a ruflo autonomous-loop prompt. Hand work to agents and walk away.",
	},
];

export function Features() {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			gsap.utils.toArray<HTMLElement>(".feature-card").forEach((card) => {
				gsap.from(card, {
					y: 60,
					autoAlpha: 0,
					duration: 0.9,
					ease: "expo.out",
					scrollTrigger: {
						trigger: card,
						start: "top 85%",
					},
				});
			});

			gsap.from(".features-eyebrow", {
				scrollTrigger: {
					trigger: ".features-eyebrow",
					start: "top 90%",
				},
				y: 40,
				autoAlpha: 0,
				duration: 1,
				ease: "expo.out",
			});

			gsap.from(".features-title .feature-title-word", {
				scrollTrigger: {
					trigger: ".features-title",
					start: "top 80%",
				},
				y: "120%",
				duration: 1,
				stagger: 0.06,
				ease: "expo.out",
			});
		},
		{ scope: root },
	);

	return (
		<section ref={root} id="features" className="py-32 sm:py-40">
			<div className="mx-auto max-w-7xl px-6 lg:px-10">
				<p className="features-eyebrow font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
					— What's included
				</p>

				<h2 className="features-title mt-6 max-w-3xl font-display text-5xl tracking-[-0.03em] sm:text-6xl">
					{["Everything", "you'd", "build", "anyway,", "already", "wired."].map(
						(w, i) => (
							<span key={i} className="mr-3 inline-block overflow-hidden">
								<span className="feature-title-word inline-block">{w}</span>
							</span>
						),
					)}
				</h2>

				<div className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--marketing-line)] bg-[color:var(--marketing-line)] md:grid-cols-2 lg:grid-cols-3">
					{features.map((f) => (
						<article
							key={f.id}
							className="feature-card group relative flex flex-col gap-5 bg-[color:var(--marketing-bg)] p-10 transition-colors hover:bg-[color:var(--marketing-line)]/30"
						>
							<span className="font-mono text-[color:var(--marketing-accent)] text-xs tracking-widest">
								{f.id}
							</span>
							<h3 className="font-display text-2xl leading-tight tracking-tight">
								{f.title}
							</h3>
							<p className="text-[color:var(--marketing-fg)]/65 text-sm leading-relaxed">
								{f.desc}
							</p>
							<div
								aria-hidden
								className="mt-auto text-[color:var(--marketing-fg)]/30 transition-all group-hover:translate-x-1 group-hover:text-[color:var(--marketing-accent)]"
							>
								→
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
