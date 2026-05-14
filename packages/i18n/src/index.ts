export const LOCALES = ["en", "fr"] as const;
export const DEFAULT_LOCALE = "en";
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
	return (LOCALES as readonly string[]).includes(value);
}

export async function getMessages(locale: Locale) {
	return (
		await import(`../messages/${locale}.json`, { with: { type: "json" } })
	).default;
}
