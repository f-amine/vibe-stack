"use client";

import { useEffect } from "react";

import "./globals.css";

// global-error replaces the locale layout entirely, so it brings its own
// <html> and <body> and cannot use next-intl. Client-side Sentry is not
// wired in this app (init happens server-side via instrumentation.ts), so
// the error is only logged locally.

type Props = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="en">
			<body className="min-h-dvh bg-background text-foreground antialiased">
				<main className="flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center">
					<p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
						Something broke
					</p>
					<h1 className="mt-3 font-semibold text-3xl tracking-tight">
						Something went wrong.
					</h1>
					<p className="mt-3 max-w-md text-muted-foreground text-sm">
						The admin panel hit an error it couldn't recover from. Try again,
						and if it keeps happening, check the server logs for the reference
						below.
					</p>
					{error.digest ? (
						<p className="mt-3 font-mono text-muted-foreground text-xs">
							ref {error.digest}
						</p>
					) : null}
					<div className="mt-8 flex items-center justify-center gap-2">
						<button
							type="button"
							onClick={reset}
							className="inline-flex h-8 items-center bg-primary px-3 font-medium text-primary-foreground text-xs transition-colors hover:bg-primary/80"
						>
							Try again
						</button>
						<a
							href="/"
							className="inline-flex h-8 items-center border border-border bg-background px-3 font-medium text-xs transition-colors hover:bg-muted"
						>
							Back to overview
						</a>
					</div>
				</main>
			</body>
		</html>
	);
}
