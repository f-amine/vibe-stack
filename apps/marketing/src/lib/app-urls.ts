/**
 * URLs for the cross-app product surface (web app). Marketing is its own
 * deploy, so we link to the web app via a public env var. In production we
 * require an explicit value so we never accidentally ship localhost links.
 */
const explicit =
	process.env.NEXT_PUBLIC_WEB_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;

let warned = false;

function resolveWebUrl(): string {
	if (explicit) {
		return explicit;
	}
	if (process.env.NODE_ENV === "production") {
		throw new Error(
			"Marketing build requires NEXT_PUBLIC_WEB_APP_URL (or NEXT_PUBLIC_APP_URL) to be set in production. Refusing to fall back to http://localhost:3001.",
		);
	}
	if (!warned) {
		warned = true;
		console.warn(
			"[marketing] NEXT_PUBLIC_WEB_APP_URL not set, falling back to http://localhost:3001 (dev only).",
		);
	}
	return "http://localhost:3001";
}

const WEB = resolveWebUrl();

export const WEB_URLS = {
	signIn: `${WEB}/sign-in`,
	signUp: `${WEB}/sign-up`,
	dashboard: `${WEB}/dashboard`,
} as const;
