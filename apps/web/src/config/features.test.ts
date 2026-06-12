// The feature registry is the single source of truth for what this build
// exposes (settings tabs, sidebar links, API route guards all consult it).
// These tests pin the contract of `isFeatureEnabled` against the registry.
import { describe, expect, it } from "vitest";
import { type FeatureKey, features, isFeatureEnabled } from "./features";

describe("isFeatureEnabled", () => {
	it("returns true for a feature the starter ships enabled (billing)", () => {
		expect(isFeatureEnabled("billing")).toBe(true);
	});

	it("returns false for a feature the starter ships disabled (affiliate)", () => {
		expect(isFeatureEnabled("affiliate")).toBe(false);
	});

	it("mirrors the `enabled` flag for every key in the registry", () => {
		for (const key of Object.keys(features) as FeatureKey[]) {
			expect(isFeatureEnabled(key)).toBe(features[key].enabled);
		}
	});
});
