import "@vibestack/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	// docker/Dockerfile.next copies .next/standalone — required for prod images.
	output: "standalone",
};

export default nextConfig;
