import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="relative grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
			{/* Form column */}
			<main className="relative flex flex-col px-6 py-10 sm:px-12 lg:px-20">
				<header className="flex items-center justify-between">
					<Link
						href="/"
						className="vs-focus-ring inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-none"
						aria-label="vibestack — home"
					>
						<span className="inline-block bg-foreground px-1.5 py-0.5 font-display font-medium text-[0.875rem] text-background leading-none">
							vibe
						</span>
						<span className="font-display text-[0.95rem] text-foreground/80">
							/stack
						</span>
					</Link>
					<Link
						href="/"
						className="font-mono-label text-muted-foreground transition-colors hover:text-foreground"
					>
						← Back
					</Link>
				</header>

				<div className="vs-fade-up flex flex-1 items-center py-16 lg:py-20">
					<div className="w-full max-w-md">{children}</div>
				</div>

				<footer className="flex items-center justify-between font-mono-label text-muted-foreground">
					<span>© {new Date().getFullYear()} · vibestack</span>
					<span className="hidden sm:inline">
						Terms · Privacy · Security
					</span>
				</footer>
			</main>

			{/* Editorial column */}
			<aside
				aria-hidden
				className="relative hidden overflow-hidden border-border border-l lg:block"
				style={{ backgroundColor: "var(--vs-ink)" }}
			>
				{/* Soft warm glow anchored top-left, falling off */}
				<div
					aria-hidden
					className="absolute inset-0"
					style={{
						background:
							"radial-gradient(60% 50% at 25% 28%, oklch(0.84 0.13 88 / 0.22), transparent 70%)",
					}}
				/>
				{/* Hairline grid, very low opacity */}
				<svg
					aria-hidden="true"
					className="absolute inset-0 h-full w-full opacity-[0.05]"
					viewBox="0 0 1000 1000"
					fill="none"
				>
					<title>Decorative grid</title>
					<defs>
						<pattern
							id="auth-grid"
							width="64"
							height="64"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M 64 0 L 0 0 0 64"
								fill="none"
								stroke="var(--vs-parchment)"
								strokeWidth="0.5"
							/>
						</pattern>
					</defs>
					<rect width="1000" height="1000" fill="url(#auth-grid)" />
				</svg>

				<div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
					<div
						className="font-mono-label"
						style={{ color: "var(--vs-graphite)" }}
					>
						The SaaS starter, vol. 01
					</div>

					<div className="max-w-md">
						<span
							className="block h-px w-16"
							style={{ background: "var(--vs-gold)" }}
						/>
						<p
							className="mt-8 font-display text-[2rem] leading-[1.08] xl:text-[2.5rem]"
							style={{
								color: "var(--vs-parchment)",
								fontFeatureSettings: '"ss01", "ss02"',
								letterSpacing: "-0.022em",
							}}
						>
							The boring parts are wired. Claude writes the{" "}
							<em
								className="not-italic"
								style={{
									color: "var(--vs-gold)",
									fontStyle: "italic",
								}}
							>
								rest.
							</em>
						</p>
						<p
							className="mt-6 max-w-sm text-[0.875rem] leading-relaxed"
							style={{ color: "var(--vs-parchment-mute)" }}
						>
							Auth, billing, email, storage, deploy. Pre-wired in a Turborepo
							monorepo. Open Claude Code, describe what you're building, ship.
						</p>
					</div>

					<div
						className="flex items-center justify-between font-mono-label"
						style={{ color: "var(--vs-graphite)" }}
					>
						<span>Next 16 · Better Auth · Drizzle · Polar.sh</span>
						<span>2026</span>
					</div>
				</div>
			</aside>
		</div>
	);
}
