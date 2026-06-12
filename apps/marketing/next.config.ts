import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withMDX = createMDX();
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const config: NextConfig = {
	reactStrictMode: true,
	transpilePackages: [
		"@vibestack/ui",
		"@vibestack/analytics",
		"@vibestack/i18n",
		"@vibestack/env",
	],
	reactCompiler: true,
	// docker/Dockerfile.next copies .next/standalone — required for prod images.
	output: "standalone",
};

export default withNextIntl(withMDX(config));
