"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/use-gsap";

// Ledger layout, not a card grid: each capability is an index entry with a
// hairline rule, like a table of contents for the repo you're about to own.
const features = [
	{
		id: "01",
		tag: "Better Auth",
		title: "Auth, organizations & roles",
		desc: "Email + magic link + Google + passkeys + 2FA. Multi-tenant orgs, member invites, admin impersonation. All wired through Better Auth.",
	},
	{
		id: "02",
		tag: "Polar.sh",
		title: "Billing, pre-wired, never pre-charged",
		desc: "Polar checkout, customer portal, webhooks, a subscription mirror in your DB. It bills your customers, not you. Boots fine without a token.",
	},
	{
		id: "03",
		tag: "Resend",
		title: "Email that won't embarrass you",
		desc: "React Email templates: verification, magic link, password reset, org invite. No API key yet? Emails print to your terminal in dev.",
	},
	{
		id: "04",
		tag: "Cloudflare R2",
		title: "File storage you control",
		desc: "Presigned uploads straight to your bucket. Nightly Postgres dumps land in the same place on a 30-day rolling retention.",
	},
	{
		id: "05",
		tag: "Turborepo",
		title: "Marketing, product, admin: separate",
		desc: "Three Next.js apps in one workspace. Marketing stays fast and static. Product behind auth. Admin gated by role.",
	},
	{
		id: "06",
		tag: "Claude Code",
		title: "Made for AI agents",
		desc: "CONTEXT.md, ADRs, vendored skills, an autonomous-loop runbook. Describe the feature; the workflow carries it to a PR.",
	},
];

export function Features() {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			gsap.from(".feature-row", {
				scrollTrigger: {
					trigger: ".feature-ledger",
					start: "top 80%",
				},
				y: 36,
				autoAlpha: 0,
				duration: 0.8,
				ease: "expo.out",
				stagger: 0.07,
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
					— What's in the box
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

				<ol className="feature-ledger mt-20 border-[color:var(--marketing-line)] border-t">
					{features.map((f) => (
						<li
							key={f.id}
							className="feature-row group border-[color:var(--marketing-line)] border-b transition-colors hover:bg-[color:var(--marketing-line)]/25"
						>
							<div className="grid items-baseline gap-x-8 gap-y-2 py-8 sm:py-9 lg:grid-cols-[3.5rem_1.1fr_1.4fr_auto]">
								<span className="font-mono text-[color:var(--marketing-accent)] text-xs tracking-widest">
									{f.id}
								</span>
								<h3 className="font-display text-2xl leading-tight tracking-tight sm:text-[1.75rem]">
									{f.title}
								</h3>
								<p className="max-w-prose text-[color:var(--marketing-fg)]/65 text-sm leading-relaxed">
									{f.desc}
								</p>
								<span className="hidden items-baseline gap-3 justify-self-end lg:flex">
									<span className="font-mono text-[0.65rem] text-[color:var(--marketing-muted)] uppercase tracking-[0.2em]">
										{f.tag}
									</span>
									<span
										aria-hidden
										className="text-[color:var(--marketing-fg)]/30 transition-all group-hover:translate-x-1 group-hover:text-[color:var(--marketing-accent)]"
									>
										→
									</span>
								</span>
							</div>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
