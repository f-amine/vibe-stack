import type { MetadataRoute } from "next";
import { siteBase } from "@/lib/og";

export default function robots(): MetadataRoute.Robots {
	const host = siteBase();
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
			},
		],
		sitemap: `${host}/sitemap.xml`,
		host,
	};
}
