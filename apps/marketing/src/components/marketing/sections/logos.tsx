"use client";

const logos = [
	"NEXT.JS",
	"REACT 19",
	"BETTER AUTH",
	"DRIZZLE",
	"POSTGRES",
	"POLAR.SH",
	"RESEND",
	"R2",
	"POSTHOG",
	"TURBO",
	"SHADCN",
	"BIOME",
];

export function LogoMarquee() {
	return (
		<section
			className="border-[color:var(--marketing-line)] border-y bg-[color:var(--marketing-bg)] py-8"
			aria-label="Built on"
		>
			<div className="overflow-hidden">
				<div className="flex w-max animate-marquee gap-16 whitespace-nowrap pr-16 font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.4em]">
					{[...logos, ...logos].map((logo, i) => (
						<span key={i} className="flex items-center gap-16">
							{logo}
							<span aria-hidden className="text-[color:var(--marketing-line)]">
								◆
							</span>
						</span>
					))}
				</div>
			</div>
		</section>
	);
}
