"use client";

import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";
import { useEffect } from "react";

import "../index.css";

// global-error replaces the root layout, so it has to bring its own
// <html>, <body>, stylesheet, and fonts. Client-side Sentry is not wired
// in this app (init happens server-side via instrumentation.ts), so the
// error is only logged locally.

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	display: "swap",
});

const fraunces = Fraunces({
	variable: "--font-display",
	subsets: ["latin"],
	display: "swap",
	weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
	display: "swap",
});

type Props = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="en" className="dark">
			<body
				className={`${geistSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} min-h-dvh bg-background text-foreground antialiased`}
			>
				<main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
					<span aria-hidden className="gold-rule mb-10" />
					<span className="font-mono-label text-muted-foreground">
						Something broke
					</span>
					<h1 className="mt-4 max-w-xl font-display text-[clamp(2rem,4.5vw,3.25rem)] text-foreground leading-[1.04]">
						That wasn't supposed to happen.
					</h1>
					<p className="mt-5 max-w-md text-muted-foreground text-sm leading-relaxed">
						The whole page tripped over itself. Reloading usually clears it; if
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
							href="/"
							className="vs-focus-ring inline-flex h-10 items-center rounded-full border border-border px-5 font-medium text-foreground text-sm transition-colors hover:bg-secondary/50"
						>
							Go home
						</a>
					</div>
				</main>
			</body>
		</html>
	);
}
