/**
 * URLs for the cross-app product surface (web app). Marketing is its own
 * deploy, so we link to the web app via a public env var with sensible
 * localhost defaults.
 */
const WEB =
	process.env.NEXT_PUBLIC_WEB_APP_URL ??
	process.env.NEXT_PUBLIC_APP_URL ??
	"http://localhost:3001";

export const WEB_URLS = {
	signIn: `${WEB}/sign-in`,
	signUp: `${WEB}/sign-up`,
	dashboard: `${WEB}/dashboard`,
} as const;
