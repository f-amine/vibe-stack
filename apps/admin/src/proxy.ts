import { DEFAULT_LOCALE, LOCALES } from "@starter-saas/i18n";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const intl = createIntlMiddleware({
	locales: LOCALES,
	defaultLocale: DEFAULT_LOCALE,
	localePrefix: "as-needed",
});

// Admin shares cookies with the web app. Sign-in lives on the web app.
const WEB_SIGN_IN =
	process.env.NEXT_PUBLIC_WEB_SIGN_IN_URL ||
	process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") + "/sign-in" ||
	"http://localhost:3001/sign-in";

export default async function middleware(req: NextRequest) {
	const sessionCookie =
		req.cookies.get("better-auth.session_token") ||
		req.cookies.get("__Secure-better-auth.session_token");

	if (!sessionCookie) {
		const url = new URL(WEB_SIGN_IN);
		url.searchParams.set(
			"next",
			`${process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002"}${req.nextUrl.pathname}`,
		);
		return NextResponse.redirect(url);
	}
	return intl(req);
}

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
