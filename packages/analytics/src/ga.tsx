"use client";

import Script from "next/script";

type Props = {
	gaId?: string | null;
	/**
	 * Disable third-party-cookies / Google signals by passing `false`.
	 * Defaults to `false` (privacy-first) so the starter is cookie-light
	 * out of the box; flip when the project is ready for full tracking.
	 */
	allowGoogleSignals?: boolean;
};

export function GoogleAnalytics({ gaId, allowGoogleSignals = false }: Props) {
	if (!gaId) {
		return null;
	}

	const config = JSON.stringify({
		send_page_view: true,
		allow_google_signals: allowGoogleSignals,
		allow_ad_personalization_signals: allowGoogleSignals,
	});

	return (
		<>
			<Script
				strategy="afterInteractive"
				src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
			/>
			<Script id="ga-init" strategy="afterInteractive">
				{`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}window.gtag = gtag;gtag('js', new Date());gtag('config', '${gaId}', ${config});`}
			</Script>
		</>
	);
}
