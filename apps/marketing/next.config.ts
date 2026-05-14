import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withMDX = createMDX();
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const config: NextConfig = {
	reactStrictMode: true,
	transpilePackages: [
		"@starter-saas/ui",
		"@starter-saas/analytics",
		"@starter-saas/i18n",
		"@starter-saas/env",
	],
	reactCompiler: true,
};

export default withNextIntl(withMDX(config));
