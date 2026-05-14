import { DEFAULT_LOCALE, LOCALES } from "@starter-saas/i18n";
import createMiddleware from "next-intl/middleware";

export default createMiddleware({
	locales: LOCALES,
	defaultLocale: DEFAULT_LOCALE,
	localePrefix: "as-needed",
});

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
