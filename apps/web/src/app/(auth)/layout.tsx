import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="grid min-h-dvh lg:grid-cols-2">
			{/* Left — form */}
			<main className="relative flex flex-col px-6 py-10 sm:px-12 lg:px-16">
				<header>
					<Link
						href="/"
						className="inline-flex items-center gap-2 font-semibold tracking-tight"
					>
						<span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs">
							S
						</span>
						<span>stack/saas</span>
					</Link>
				</header>

				<div className="flex flex-1 items-center justify-center py-10">
					<div className="w-full max-w-md">{children}</div>
				</div>

				<footer className="text-muted-foreground text-xs">
					© {new Date().getFullYear()} stack/saas
				</footer>
			</main>

			{/* Right — atmospheric panel */}
			<aside className="relative hidden overflow-hidden bg-zinc-950 lg:block">
				<div
					aria-hidden
					className="absolute inset-0 opacity-50"
					style={{
						background:
							"radial-gradient(circle at 30% 30%, oklch(0.84 0.13 88 / 0.4), transparent 50%), radial-gradient(circle at 70% 80%, oklch(0.55 0.2 280 / 0.3), transparent 50%)",
					}}
				/>
				<svg
					aria-hidden="true"
					className="absolute inset-0 h-full w-full text-white opacity-[0.08]"
					viewBox="0 0 1000 1000"
					fill="none"
				>
					<title>Decorative grid</title>
					<defs>
						<pattern
							id="g"
							width="50"
							height="50"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M 50 0 L 0 0 0 50"
								fill="none"
								stroke="currentColor"
								strokeWidth="0.5"
							/>
						</pattern>
					</defs>
					<rect width="1000" height="1000" fill="url(#g)" />
				</svg>

				<div className="relative flex h-full flex-col justify-end p-16">
					<blockquote className="max-w-md">
						<p className="font-serif text-2xl text-white leading-snug">
							"Honestly this is the foundation I wish I'd built five projects
							ago. Cloned it on a Friday and shipped paid plans by Monday."
						</p>
						<footer className="mt-6 text-sm text-zinc-400">
							— A future user (place a real one here)
						</footer>
					</blockquote>
				</div>
			</aside>
		</div>
	);
}
