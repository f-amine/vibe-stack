import Link from "next/link";

export default function NotFound() {
	return (
		<div className="marketing grain relative min-h-dvh">
			<main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
				<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
					— 404
				</p>
				<h1 className="mt-6 font-display text-5xl tracking-tight sm:text-6xl">
					This page doesn't exist.
				</h1>
				<p className="mt-5 max-w-md text-[color:var(--marketing-fg)]/70 text-lg">
					The link may be old, or the page moved. The homepage has everything
					worth finding.
				</p>
				<div className="mt-10 flex items-center gap-3">
					<Link
						href="/"
						className="inline-flex h-11 items-center rounded-full bg-[color:var(--marketing-accent)] px-6 font-medium text-[color:var(--marketing-bg)] text-sm transition-opacity hover:opacity-90"
					>
						Go home
					</Link>
					<Link
						href="/blog"
						className="inline-flex h-11 items-center rounded-full border border-[color:var(--marketing-line)] px-6 font-medium text-[color:var(--marketing-fg)] text-sm transition-colors hover:border-[color:var(--marketing-muted)]"
					>
						Read the journal
					</Link>
				</div>
			</main>
		</div>
	);
}
