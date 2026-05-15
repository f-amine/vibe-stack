// Build a fully-qualified URL to the marketing OG image renderer.
// The renderer lives at /og and accepts ?title= &subtitle= &eyebrow= .

export const OG_DIMENSIONS = { width: 1200, height: 630 } as const;

const FALLBACK_BASE = "http://localhost:3000";

function siteBase(): string {
	const fromEnv =
		process.env.NEXT_PUBLIC_MARKETING_URL ??
		process.env.NEXT_PUBLIC_SITE_URL ??
		process.env.NEXT_PUBLIC_APP_URL ??
		FALLBACK_BASE;
	return fromEnv.replace(/\/$/, "");
}

export type OgParams = {
	title: string;
	subtitle?: string;
	eyebrow?: string;
};

export function ogImageUrl(params: OgParams): string {
	const search = new URLSearchParams();
	search.set("title", params.title);
	if (params.subtitle) {
		search.set("subtitle", params.subtitle);
	}
	if (params.eyebrow) {
		search.set("eyebrow", params.eyebrow);
	}
	return `${siteBase()}/og?${search.toString()}`;
}

export function ogMetadata(params: OgParams) {
	const url = ogImageUrl(params);
	return {
		openGraph: {
			title: params.title,
			description: params.subtitle,
			images: [
				{
					url,
					width: OG_DIMENSIONS.width,
					height: OG_DIMENSIONS.height,
					alt: params.title,
				},
			],
		},
		twitter: {
			card: "summary_large_image" as const,
			title: params.title,
			description: params.subtitle,
			images: [url],
		},
	};
}
