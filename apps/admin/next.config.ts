import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const config: NextConfig = {
	reactStrictMode: true,
	transpilePackages: [
		"@vibestack/ui",
		"@vibestack/api",
		"@vibestack/auth",
		"@vibestack/db",
		"@vibestack/env",
		"@vibestack/i18n",
		"@vibestack/analytics",
	],
	reactCompiler: true,
};

export default withNextIntl(config);
