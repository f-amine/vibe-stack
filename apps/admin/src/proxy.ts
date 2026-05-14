import { DEFAULT_LOCALE, LOCALES } from "@starter-saas/i18n";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const intl = createIntlMiddleware({
	locales: LOCALES,
	defaultLocale: DEFAULT_LOCALE,
	localePrefix: "as-needed",
});

export default async function middleware(req: NextRequest) {
	const sessionCookie = req.cookies.get("better-auth.session_token");
	if (!sessionCookie && !req.nextUrl.pathname.startsWith("/sign-in")) {
		const url = new URL("/sign-in", req.url);
		url.searchParams.set("next", req.nextUrl.pathname);
		return NextResponse.redirect(url);
	}
	return intl(req);
}

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
