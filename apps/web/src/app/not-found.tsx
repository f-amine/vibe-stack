import Link from "next/link";

export default function NotFound() {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
			<span aria-hidden className="gold-rule mb-10" />
			<span className="font-mono-label text-muted-foreground">404</span>
			<h1 className="mt-4 max-w-xl font-display text-[clamp(2rem,4.5vw,3.25rem)] text-foreground leading-[1.04]">
				This page doesn't exist.
			</h1>
			<p className="mt-5 max-w-md text-muted-foreground text-sm leading-relaxed">
				The link may be old, or the page moved somewhere quieter. Head back to
				your dashboard and carry on.
			</p>
			<div className="mt-9 flex items-center gap-3">
				<Link
					href="/dashboard"
					className="vs-focus-ring inline-flex h-10 items-center rounded-full bg-[color:var(--vs-gold)] px-5 font-medium text-[color:var(--vs-ink)] text-sm transition-colors hover:bg-[color:var(--vs-gold-deep)]"
				>
					Back to dashboard
				</Link>
				<Link
					href="/"
					className="vs-focus-ring inline-flex h-10 items-center rounded-full border border-border px-5 font-medium text-foreground text-sm transition-colors hover:bg-secondary/50"
				>
					Go home
				</Link>
			</div>
		</main>
	);
}
