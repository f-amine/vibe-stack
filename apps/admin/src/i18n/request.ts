import { DEFAULT_LOCALE, isLocale } from "@starter-saas/i18n";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = requested && isLocale(requested) ? requested : DEFAULT_LOCALE;
	return {
		locale,
		messages: (await import(`@starter-saas/i18n/messages/${locale}`)).default,
	};
});
