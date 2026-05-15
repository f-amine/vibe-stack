import type { MetadataRoute } from "next";
import { siteBase } from "@/lib/og";
import { blogSource, changelogSource, source } from "@/lib/source";

type Entry = MetadataRoute.Sitemap[number];

const LOCALES = ["en", "fr"] as const;
const DEFAULT_LOCALE = "en";

function localizedUrl(host: string, locale: string, path: string): string {
	// localePrefix: "as-needed" — default locale serves at the root.
	const normalized = path.startsWith("/") ? path : `/${path}`;
	if (locale === DEFAULT_LOCALE) {
		return `${host}${normalized === "/" ? "" : normalized}` || `${host}/`;
	}
	return `${host}/${locale}${normalized === "/" ? "" : normalized}`;
}

function languageAlternates(
	host: string,
	path: string,
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const locale of LOCALES) {
		out[locale] = localizedUrl(host, locale, path);
	}
	return out;
}

function parseDate(input?: string): Date | undefined {
	if (!input) {
		return undefined;
	}
	const ms = Date.parse(input);
	return Number.isFinite(ms) ? new Date(ms) : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
	const host = siteBase();
	const now = new Date();
	const entries: Entry[] = [];

	// Home (per-locale).
	for (const locale of LOCALES) {
		entries.push({
			url: localizedUrl(host, locale, "/"),
			lastModified: now,
			changeFrequency: "weekly",
			priority: 1.0,
			alternates: { languages: languageAlternates(host, "/") },
		});
	}

	// Static routes (per-locale where it makes sense).
	const staticRoutes: Array<{
		path: string;
		priority: number;
		changeFrequency: Entry["changeFrequency"];
	}> = [
		{ path: "/blog", priority: 0.8, changeFrequency: "daily" },
		{ path: "/changelog", priority: 0.8, changeFrequency: "monthly" },
		{ path: "/docs", priority: 0.8, changeFrequency: "weekly" },
		{ path: "/roadmap", priority: 0.3, changeFrequency: "monthly" },
		{ path: "/status", priority: 0.3, changeFrequency: "daily" },
	];
	for (const route of staticRoutes) {
		for (const locale of LOCALES) {
			entries.push({
				url: localizedUrl(host, locale, route.path),
				lastModified: now,
				changeFrequency: route.changeFrequency,
				priority: route.priority,
				alternates: { languages: languageAlternates(host, route.path) },
			});
		}
	}

	// Blog posts (not locale-split today: emit canonical default-locale URL).
	for (const post of blogSource.getPages()) {
		const data = post.data as { date?: string; draft?: boolean };
		if (data.draft) {
			continue;
		}
		entries.push({
			url: localizedUrl(host, DEFAULT_LOCALE, post.url),
			lastModified: parseDate(data.date) ?? now,
			changeFrequency: "monthly",
			priority: 0.6,
		});
	}

	// Changelog entries.
	for (const entry of changelogSource.getPages()) {
		const data = entry.data as { date?: string; draft?: boolean };
		if (data.draft) {
			continue;
		}
		entries.push({
			url: localizedUrl(host, DEFAULT_LOCALE, entry.url),
			lastModified: parseDate(data.date) ?? now,
			changeFrequency: "monthly",
			priority: 0.6,
		});
	}

	// Docs pages.
	for (const page of source.getPages()) {
		const data = page.data as { draft?: boolean };
		if (data.draft) {
			continue;
		}
		const depth = page.url.split("/").filter(Boolean).length;
		const priority = depth <= 1 ? 0.8 : 0.4;
		entries.push({
			url: localizedUrl(host, DEFAULT_LOCALE, page.url),
			lastModified: now,
			changeFrequency: "weekly",
			priority,
		});
	}

	return entries;
}
