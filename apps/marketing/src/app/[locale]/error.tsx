"use client";

import { useEffect } from "react";

type Props = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="marketing grain relative min-h-dvh">
			<main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
				<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
					— Something broke
				</p>
				<h1 className="mt-6 font-display text-5xl tracking-tight sm:text-6xl">
					That wasn't supposed to happen.
				</h1>
				<p className="mt-5 max-w-md text-[color:var(--marketing-fg)]/70 text-lg">
					Something went wrong on our side. Try again, and if it keeps
					happening, mention the reference below.
				</p>
				{error.digest ? (
					<p className="mt-4 font-mono text-[color:var(--marketing-muted)] text-xs">
						ref {error.digest}
					</p>
				) : null}
				<div className="mt-10 flex items-center gap-3">
					<button
						type="button"
						onClick={reset}
						className="inline-flex h-11 items-center rounded-full bg-[color:var(--marketing-accent)] px-6 font-medium text-[color:var(--marketing-bg)] text-sm transition-opacity hover:opacity-90"
					>
						Try again
					</button>
					<a
						href="/"
						className="inline-flex h-11 items-center rounded-full border border-[color:var(--marketing-line)] px-6 font-medium text-[color:var(--marketing-fg)] text-sm transition-colors hover:border-[color:var(--marketing-muted)]"
					>
						Go home
					</a>
				</div>
			</main>
		</div>
	);
}
