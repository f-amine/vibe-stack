import { siteBase } from "@/lib/og";
import { blogSource } from "@/lib/source";

type BlogEntry = {
	url: string;
	data: {
		title: string;
		description?: string;
		date?: string;
		author?: string;
	};
};

function escapeXml(input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function toIsoDate(input?: string): string {
	if (!input) {
		return new Date(0).toISOString();
	}
	const ms = Date.parse(input);
	if (!Number.isFinite(ms)) {
		return new Date(0).toISOString();
	}
	return new Date(ms).toISOString();
}

export async function GET() {
	const base = siteBase();
	const feedUrl = `${base}/blog/feed.xml`;
	const blogUrl = `${base}/blog`;

	const entries = (blogSource.getPages() as BlogEntry[])
		.slice()
		.sort((a, b) => {
			const aMs = a.data.date ? Date.parse(a.data.date) : 0;
			const bMs = b.data.date ? Date.parse(b.data.date) : 0;
			return bMs - aMs;
		});

	const latestDate = entries[0]?.data.date;
	const feedUpdated = toIsoDate(latestDate);

	const entriesXml = entries
		.map((entry) => {
			const absoluteUrl = `${base}${entry.url}`;
			const updated = toIsoDate(entry.data.date);
			const authorName = entry.data.author ?? "vibestack";
			const summary = entry.data.description ?? "";
			return [
				"  <entry>",
				`    <id>${escapeXml(absoluteUrl)}</id>`,
				`    <title>${escapeXml(entry.data.title)}</title>`,
				`    <link rel="alternate" type="text/html" href="${escapeXml(absoluteUrl)}"/>`,
				`    <updated>${updated}</updated>`,
				`    <summary>${escapeXml(summary)}</summary>`,
				"    <author>",
				`      <name>${escapeXml(authorName)}</name>`,
				"    </author>",
				"  </entry>",
			].join("\n");
		})
		.join("\n");

	const xml = [
		'<?xml version="1.0" encoding="utf-8"?>',
		'<feed xmlns="http://www.w3.org/2005/Atom">',
		"  <title>vibestack journal</title>",
		"  <subtitle>Notes from the people building vibestack and the SaaS we build with it.</subtitle>",
		`  <id>${escapeXml(feedUrl)}</id>`,
		`  <link rel="self" type="application/atom+xml" href="${escapeXml(feedUrl)}"/>`,
		`  <link rel="alternate" type="text/html" href="${escapeXml(blogUrl)}"/>`,
		`  <updated>${feedUpdated}</updated>`,
		"  <author>",
		"    <name>vibestack</name>",
		"  </author>",
		entriesXml,
		"</feed>",
	]
		.filter((line) => line !== "")
		.join("\n");

	return new Response(xml, {
		headers: {
			"content-type": "application/atom+xml; charset=utf-8",
			"cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
