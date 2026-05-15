import "server-only";
import { db } from "@starter-saas/db";
import { userPreferences } from "@starter-saas/db/schema/preferences";
import { eq } from "drizzle-orm";

export type Preferences = {
	theme: "light" | "dark" | "system";
	density: "compact" | "comfortable" | "spacious";
	locale: string;
};

export const DEFAULT_PREFERENCES: Preferences = {
	theme: "system",
	density: "comfortable",
	locale: "en",
};

const THEMES = new Set<Preferences["theme"]>(["light", "dark", "system"]);
const DENSITIES = new Set<Preferences["density"]>([
	"compact",
	"comfortable",
	"spacious",
]);

function normalize(input: Partial<Preferences>): Preferences {
	return {
		theme: THEMES.has(input.theme as Preferences["theme"])
			? (input.theme as Preferences["theme"])
			: DEFAULT_PREFERENCES.theme,
		density: DENSITIES.has(input.density as Preferences["density"])
			? (input.density as Preferences["density"])
			: DEFAULT_PREFERENCES.density,
		locale:
			typeof input.locale === "string" &&
			/^[a-z]{2}(-[A-Z]{2})?$/.test(input.locale)
				? input.locale
				: DEFAULT_PREFERENCES.locale,
	};
}

export async function getPreferences(userId: string): Promise<Preferences> {
	const [row] = await db
		.select()
		.from(userPreferences)
		.where(eq(userPreferences.userId, userId))
		.limit(1);
	if (!row) {
		return DEFAULT_PREFERENCES;
	}
	return normalize({
		theme: row.theme as Preferences["theme"],
		density: row.density as Preferences["density"],
		locale: row.locale,
	});
}

export async function setPreferences(
	userId: string,
	input: Partial<Preferences>,
): Promise<Preferences> {
	const current = await getPreferences(userId);
	const next = normalize({ ...current, ...input });
	await db
		.insert(userPreferences)
		.values({
			userId,
			theme: next.theme,
			density: next.density,
			locale: next.locale,
		})
		.onConflictDoUpdate({
			target: userPreferences.userId,
			set: {
				theme: next.theme,
				density: next.density,
				locale: next.locale,
			},
		});
	return next;
}
