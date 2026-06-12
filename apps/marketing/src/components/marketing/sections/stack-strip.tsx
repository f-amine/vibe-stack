// Honest social proof: the stack itself. No invented customer logos —
// for a free starter, the credible flex is what it's built on.

const stack = [
	{ name: "Next.js", meta: "16" },
	{ name: "React", meta: "19" },
	{ name: "Better Auth", meta: "1.6" },
	{ name: "Drizzle", meta: "pg" },
	{ name: "tRPC", meta: "v11" },
	{ name: "Tailwind", meta: "v4" },
	{ name: "Polar", meta: "billing" },
	{ name: "Resend", meta: "email" },
	{ name: "R2", meta: "storage" },
	{ name: "Turborepo", meta: "pnpm" },
];

export function StackStrip() {
	return (
		<section
			className="border-[color:var(--marketing-line)] border-y bg-[color:var(--marketing-bg)] py-10 sm:py-12"
			aria-label="The stack vibestack is built on"
		>
			<div className="mx-auto max-w-7xl px-6 lg:px-10">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-baseline lg:justify-between">
					<p className="shrink-0 font-mono text-[0.7rem] text-[color:var(--marketing-muted)] uppercase tracking-[0.35em]">
						No fake logos. The stack is the proof.
					</p>
					<ul className="flex flex-wrap items-baseline gap-x-7 gap-y-3">
						{stack.map((s) => (
							<li
								key={s.name}
								className="flex items-baseline gap-1.5 whitespace-nowrap text-[color:var(--marketing-fg)]/60 transition-colors hover:text-[color:var(--marketing-fg)]/90"
							>
								<span className="font-display text-lg leading-none tracking-tight">
									{s.name}
								</span>
								<span className="font-mono text-[0.65rem] text-[color:var(--marketing-muted)] uppercase tracking-widest">
									{s.meta}
								</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}
