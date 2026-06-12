"use client";

import { useEffect } from "react";

type Props = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
	useEffect(() => {
		// Surface the error in the console for local debugging. Server-side
		// occurrences are already reported through instrumentation.ts.
		console.error(error);
	}, [error]);

	return (
		<main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
			<span aria-hidden className="gold-rule mb-10" />
			<span className="font-mono-label text-muted-foreground">
				Something broke
			</span>
			<h1 className="mt-4 max-w-xl font-display text-[clamp(2rem,4.5vw,3.25rem)] text-foreground leading-[1.04]">
				That wasn't supposed to happen.
			</h1>
			<p className="mt-5 max-w-md text-muted-foreground text-sm leading-relaxed">
				Something went wrong on our side. Your work is safe; try again, and if
				it keeps happening, send us the reference below.
			</p>
			{error.digest ? (
				<p className="mt-3 font-mono text-muted-foreground text-xs">
					ref {error.digest}
				</p>
			) : null}
			<div className="mt-9 flex items-center gap-3">
				<button
					type="button"
					onClick={reset}
					className="vs-focus-ring inline-flex h-10 items-center rounded-full bg-[color:var(--vs-gold)] px-5 font-medium text-[color:var(--vs-ink)] text-sm transition-colors hover:bg-[color:var(--vs-gold-deep)]"
				>
					Try again
				</button>
				<a
					href="/dashboard"
					className="vs-focus-ring inline-flex h-10 items-center rounded-full border border-border px-5 font-medium text-foreground text-sm transition-colors hover:bg-secondary/50"
				>
					Back to dashboard
				</a>
			</div>
		</main>
	);
}
