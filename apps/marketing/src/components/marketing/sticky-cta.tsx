"use client";

import { useEffect, useState } from "react";
import { WEB_URLS } from "@/lib/app-urls";

const DISMISS_KEY = "vibestack:sticky-cta-dismissed";

export function StickyCTA() {
	const [visible, setVisible] = useState(false);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		try {
			if (sessionStorage.getItem(DISMISS_KEY) === "1") {
				setDismissed(true);
				return;
			}
		} catch {
			// sessionStorage unavailable — ignore
		}

		const onScroll = () => {
			const doc = document.documentElement;
			const scrolled = window.scrollY;
			const total = doc.scrollHeight - window.innerHeight;
			if (total <= 0) {
				return;
			}
			setVisible(scrolled / total >= 0.6);
		};

		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const handleDismiss = () => {
		setDismissed(true);
		try {
			sessionStorage.setItem(DISMISS_KEY, "1");
		} catch {
			// noop
		}
	};

	if (dismissed) {
		return null;
	}

	return (
		<div
			aria-hidden={!visible}
			className={`fixed inset-x-4 bottom-4 z-40 mx-auto max-w-3xl rounded-2xl border border-[color:var(--marketing-line)] bg-[color:var(--marketing-bg)]/95 px-4 py-3 shadow-2xl backdrop-blur transition-all duration-500 sm:px-5 ${
				visible
					? "translate-y-0 opacity-100"
					: "pointer-events-none translate-y-6 opacity-0"
			}`}
		>
			<div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col">
					<p className="font-display text-[color:var(--marketing-fg)] text-base leading-tight sm:text-lg">
						Stop wiring plumbing. Start your launch.
					</p>
					<p className="mt-0.5 text-[color:var(--marketing-fg)]/55 text-xs sm:text-sm">
						The boring parts are already done. Clone the repo, ship in days.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<a
						href={WEB_URLS.signUp}
						className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[color:var(--marketing-accent)] px-4 py-2 font-medium text-[color:var(--marketing-bg)] text-sm transition-transform hover:scale-[1.02]"
					>
						Start free
						<span aria-hidden>→</span>
					</a>
					<button
						type="button"
						onClick={handleDismiss}
						aria-label="Dismiss"
						className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--marketing-fg)]/60 transition-colors hover:bg-[color:var(--marketing-line)]/40 hover:text-[color:var(--marketing-fg)]"
					>
						<svg
							viewBox="0 0 16 16"
							className="h-3.5 w-3.5"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
							aria-hidden
						>
							<title>close</title>
							<path d="M2 2l12 12M14 2L2 14" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}
