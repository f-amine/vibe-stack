// Playwright config for the accessibility smoke suite.
//
// This is intentionally separate from any future e2e config so the a11y
// scans can be wired into CI on their own cadence (they don't need a
// database — they only hit static/public marketing + auth routes).
//
// The webServer block boots `pnpm dev:marketing` on :3000 and
// `pnpm dev:web` on :3001 in parallel. Both must come up within 120s.
// Locally: `pnpm test:a11y`. In CI: same after `pnpm exec playwright install --with-deps chromium`.

import { defineConfig, devices } from "@playwright/test";

const PORT_MARKETING = 3000;
const PORT_WEB = 3001;

export default defineConfig({
	testDir: "./tests/a11y",
	timeout: 60_000,
	expect: { timeout: 5_000 },
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "mobile-375",
			use: { ...devices["iPhone 13"], viewport: { width: 375, height: 800 } },
		},
		{
			name: "desktop-1280",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1280, height: 800 },
			},
		},
	],
	webServer: [
		{
			command: "pnpm dev:marketing",
			url: `http://localhost:${PORT_MARKETING}`,
			timeout: 120_000,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: "pnpm dev:web",
			url: `http://localhost:${PORT_WEB}/sign-in`,
			timeout: 120_000,
			reuseExistingServer: !process.env.CI,
			env: {
				// web defaults to :3000 — push it to :3001 so it doesn't collide
				// with marketing.
				PORT: String(PORT_WEB),
			},
		},
	],
});
