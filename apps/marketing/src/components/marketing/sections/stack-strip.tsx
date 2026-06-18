// The stack itself is the proof for a free starter — real logos, no invented
// customer wall. Calm/monochrome at rest, brand color on hover.
const stack = [
	{ name: "Next.js", meta: "16", logo: "/logos/nextjs.svg" },
	{ name: "React", meta: "19", logo: "/logos/react.svg" },
	{ name: "Better Auth", meta: "1.6", logo: "/logos/better-auth.svg" },
	{ name: "Drizzle", meta: "pg", logo: "/logos/drizzle.svg" },
	{ name: "tRPC", meta: "v11", logo: "/logos/trpc.svg" },
	{ name: "Tailwind", meta: "v4", logo: "/logos/tailwind.svg" },
	{ name: "Polar", meta: "billing", logo: "/logos/polar.svg" },
	{ name: "Resend", meta: "email", logo: "/logos/resend.svg" },
	{ name: "R2", meta: "storage", logo: "/logos/cloudflare.svg" },
	{ name: "Turborepo", meta: "pnpm", logo: "/logos/turborepo.svg" },
];

export function StackStrip() {
	return (
		<section
			className="border-[color:var(--marketing-line)] border-y bg-[color:var(--marketing-bg)] py-12 sm:py-14"
			aria-label="The stack vibestack is built on"
		>
			<div className="mx-auto max-w-7xl px-6 lg:px-10">
				<p className="text-center font-mono text-[0.7rem] text-[color:var(--marketing-muted)] uppercase tracking-[0.32em]">
					The whole stack, already wired. You just build.
				</p>
				<ul className="mt-9 flex flex-wrap items-center justify-center gap-x-9 gap-y-7">
					{stack.map((s) => (
						<li
							key={s.name}
							className="group flex items-center gap-2.5 opacity-80 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
						>
							<img
								src={s.logo}
								alt={s.name}
								className="h-6 w-auto"
								loading="lazy"
								decoding="async"
							/>
							<span className="hidden items-baseline gap-1.5 sm:inline-flex">
								<span className="font-display text-[color:var(--marketing-fg)]/85 text-lg leading-none tracking-tight">
									{s.name}
								</span>
								<span className="font-mono text-[0.6rem] text-[color:var(--marketing-muted)] uppercase tracking-widest">
									{s.meta}
								</span>
							</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
