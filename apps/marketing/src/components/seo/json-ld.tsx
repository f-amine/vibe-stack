// Structured data (JSON-LD) helpers for SEO.
// Server components — rendered inline as <script type="application/ld+json">.

type JsonLdData = Record<string, unknown>;

function JsonLdScript({ data }: { data: JsonLdData }) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw JSON in a script tag.
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}

export type WebsiteJsonLdProps = {
	siteUrl: string;
	name: string;
	description: string;
};

export function WebsiteJsonLd({
	siteUrl,
	name,
	description,
}: WebsiteJsonLdProps) {
	const graph: JsonLdData = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Organization",
				"@id": `${siteUrl}/#organization`,
				name,
				url: siteUrl,
				description,
			},
			{
				"@type": "WebSite",
				"@id": `${siteUrl}/#website`,
				name,
				url: siteUrl,
				description,
				publisher: { "@id": `${siteUrl}/#organization` },
				potentialAction: {
					"@type": "SearchAction",
					target: {
						"@type": "EntryPoint",
						urlTemplate: `${siteUrl}/docs?q={search_term_string}`,
					},
					"query-input": "required name=search_term_string",
				},
			},
		],
	};
	return <JsonLdScript data={graph} />;
}

export type SoftwareApplicationJsonLdProps = {
	siteUrl: string;
};

export function SoftwareApplicationJsonLd({
	siteUrl,
}: SoftwareApplicationJsonLdProps) {
	const data: JsonLdData = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: "vibestack",
		applicationCategory: "DeveloperApplication",
		operatingSystem: "Web",
		url: siteUrl,
		description:
			"Opinionated, AI-first SaaS starter. Stack pre-wired, Claude Code skills vendored in the repo.",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
			description: "Free, open-source",
		},
	};
	return <JsonLdScript data={data} />;
}

export type BlogPostingJsonLdProps = {
	url: string;
	title: string;
	description?: string;
	datePublished?: string;
	dateModified?: string;
	author?: string;
};

export function BlogPostingJsonLd({
	url,
	title,
	description,
	datePublished,
	dateModified,
	author,
}: BlogPostingJsonLdProps) {
	const data: JsonLdData = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: title,
		description,
		url,
		mainEntityOfPage: url,
		datePublished,
		dateModified: dateModified ?? datePublished,
		author: {
			"@type": "Person",
			name: author ?? "vibestack",
		},
	};
	return <JsonLdScript data={data} />;
}

export type TechArticleJsonLdProps = {
	url: string;
	title: string;
	description?: string;
	dateModified?: string;
};

export function TechArticleJsonLd({
	url,
	title,
	description,
	dateModified,
}: TechArticleJsonLdProps) {
	const data: JsonLdData = {
		"@context": "https://schema.org",
		"@type": "TechArticle",
		headline: title,
		description,
		url,
		mainEntityOfPage: url,
		dateModified: dateModified ?? new Date().toISOString(),
	};
	return <JsonLdScript data={data} />;
}
