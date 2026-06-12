// Example test suite: mocking the env module to test env-dependent logic.
//
// `plans-server.ts` joins the static PLANS catalog with Polar product IDs
// from env. We mock `@vibestack/env/server` with a mutable object so each
// test can describe a different deployment (zero-key boot, partially
// configured, fully configured) without touching real env vars.
import { beforeEach, describe, expect, it, vi } from "vitest";

// `plans-server.ts` imports the `server-only` marker, which throws outside
// a React Server Components bundle. Stub it out for the test runtime.
vi.mock("server-only", () => ({}));

// vi.mock factories are hoisted above imports, so shared state they close
// over must be created with vi.hoisted.
const mockEnv = vi.hoisted(() => ({
	POLAR_PRODUCT_ID_PRO: undefined as string | undefined,
	POLAR_PRODUCT_ID_TEAM: undefined as string | undefined,
}));
vi.mock("@vibestack/env/server", () => ({ env: mockEnv }));

// The module reads env at import time (PRODUCT_ID_BY_PLAN is a top-level
// constant), so each test re-imports a fresh copy after setting mockEnv.
async function loadPlansServer() {
	vi.resetModules();
	return import("./plans-server");
}

beforeEach(() => {
	mockEnv.POLAR_PRODUCT_ID_PRO = undefined;
	mockEnv.POLAR_PRODUCT_ID_TEAM = undefined;
});

describe("paidPlans", () => {
	it("returns no plans on a zero-key boot (no Polar product IDs in env)", async () => {
		const { paidPlans } = await loadPlansServer();
		expect(paidPlans()).toEqual([]);
	});

	it("returns only the plans whose product ID is configured", async () => {
		mockEnv.POLAR_PRODUCT_ID_PRO = "prod_pro_123";
		const { paidPlans } = await loadPlansServer();

		const plans = paidPlans();
		expect(plans).toHaveLength(1);
		expect(plans[0]?.id).toBe("pro");
	});

	it("attaches the env product ID to each paid plan", async () => {
		mockEnv.POLAR_PRODUCT_ID_PRO = "prod_pro_123";
		mockEnv.POLAR_PRODUCT_ID_TEAM = "prod_team_456";
		const { paidPlans } = await loadPlansServer();

		expect(paidPlans().map((p) => [p.id, p.polarProductId])).toEqual([
			["pro", "prod_pro_123"],
			["team", "prod_team_456"],
		]);
	});

	it("never includes the free plan (it has no Polar product)", async () => {
		mockEnv.POLAR_PRODUCT_ID_PRO = "prod_pro_123";
		mockEnv.POLAR_PRODUCT_ID_TEAM = "prod_team_456";
		const { paidPlans } = await loadPlansServer();

		expect(paidPlans().some((p) => p.id === "free")).toBe(false);
	});
});

describe("polarCheckoutProducts", () => {
	it("maps paid plans to the { productId, slug } shape the Polar checkout plugin expects", async () => {
		mockEnv.POLAR_PRODUCT_ID_PRO = "prod_pro_123";
		const { polarCheckoutProducts } = await loadPlansServer();

		expect(polarCheckoutProducts()).toEqual([
			{ productId: "prod_pro_123", slug: "pro" },
		]);
	});
});

describe("billingConfigured", () => {
	it("is false when no plan is wired to a Polar product", async () => {
		const { billingConfigured } = await loadPlansServer();
		expect(billingConfigured()).toBe(false);
	});

	it("is true once at least one plan has a Polar product ID", async () => {
		mockEnv.POLAR_PRODUCT_ID_TEAM = "prod_team_456";
		const { billingConfigured } = await loadPlansServer();
		expect(billingConfigured()).toBe(true);
	});
});
