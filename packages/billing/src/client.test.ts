// `billingEnabled()` is the boot-time switch for the whole billing
// feature: without a POLAR_ACCESS_TOKEN the app runs with billing off
// instead of crashing. The Polar SDK itself is never exercised here.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEnv = vi.hoisted(() => ({
	POLAR_ACCESS_TOKEN: undefined as string | undefined,
	POLAR_SERVER: "sandbox" as const,
}));
vi.mock("@vibestack/env/server", () => ({ env: mockEnv }));

import { billingEnabled } from "./client";

beforeEach(() => {
	mockEnv.POLAR_ACCESS_TOKEN = undefined;
});

describe("billingEnabled", () => {
	it("is false on a zero-key boot (no POLAR_ACCESS_TOKEN)", () => {
		expect(billingEnabled()).toBe(false);
	});

	it("is true when a Polar access token is set", () => {
		mockEnv.POLAR_ACCESS_TOKEN = "polar_oat_test_token";
		expect(billingEnabled()).toBe(true);
	});
});
