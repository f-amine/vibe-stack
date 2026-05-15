// Accessibility smoke suite for the marketing app.
//
// Scans the public routes for WCAG 2.1 A + AA violations on both mobile
// (375px) and desktop (1280px) viewports. Fails on any serious or
// critical violation — minor / moderate are surfaced in the report but
// don't break CI. Tune the threshold once we have a clean baseline.

import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/en", "/en/changelog", "/en/roadmap", "/en/status"];

for (const route of ROUTES) {
	test(`marketing ${route} has no serious a11y violations`, async ({
		page,
	}) => {
		const res = await page.goto(`http://localhost:3000${route}`, {
			waitUntil: "domcontentloaded",
		});
		// Allow 404s for routes that may not exist in every locale — those are
		// linting concerns elsewhere, not a11y.
		if (res && res.status() === 404) {
			test.skip(true, `route ${route} returned 404`);
			return;
		}
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
