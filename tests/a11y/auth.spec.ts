// Accessibility smoke suite for the web app's public auth routes.
//
// Dashboard/settings pages live behind auth — out of scope here. Once we
// have a seeded fixtures account + login helper, expand this to cover
// /dashboard/* at 375px too.

import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/sign-in", "/sign-up", "/forgot-password"];

for (const route of ROUTES) {
	test(`web ${route} has no serious a11y violations`, async ({ page }) => {
		await page.goto(`http://localhost:3001${route}`, {
			waitUntil: "domcontentloaded",
		});
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();

		const serious = results.violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		);
		if (serious.length > 0) {
			console.log(JSON.stringify(serious, null, 2));
		}
		expect(serious, "no serious/critical WCAG violations").toEqual([]);
	});
}
