import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const config: NextConfig = {
	reactStrictMode: true,
	transpilePackages: [
		"@starter-saas/ui",
		"@starter-saas/api",
		"@starter-saas/auth",
		"@starter-saas/db",
		"@starter-saas/env",
		"@starter-saas/i18n",
		"@starter-saas/analytics",
	],
	reactCompiler: true,
};

export default withNextIntl(config);
