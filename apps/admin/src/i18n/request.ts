import { DEFAULT_LOCALE, isLocale } from "@vibestack/i18n";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = requested && isLocale(requested) ? requested : DEFAULT_LOCALE;
	return {
		locale,
		messages: (await import(`@vibestack/i18n/messages/${locale}`)).default,
	};
});
