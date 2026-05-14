// Server-only helpers that join Plan definitions w/ env-supplied Polar product IDs.
import "server-only";
import { env } from "@starter-saas/env/server";
import { PLANS, type PlanDef, type PlanId } from "./plans";

const PRODUCT_ID_BY_PLAN: Partial<Record<PlanId, string | undefined>> = {
	pro: env.POLAR_PRODUCT_ID_PRO,
	team: env.POLAR_PRODUCT_ID_TEAM,
};

export type PlanWithProduct = PlanDef & { polarProductId: string };

/** Plans that have a Polar product configured via env. */
export function paidPlans(): PlanWithProduct[] {
	return PLANS.flatMap((p) => {
		const productId = PRODUCT_ID_BY_PLAN[p.id];
		return productId ? [{ ...p, polarProductId: productId }] : [];
	});
}

/** Shape consumed by the Polar `checkout()` plugin. */
export function polarCheckoutProducts() {
	return paidPlans().map((p) => ({
		productId: p.polarProductId,
		slug: p.slug,
	}));
}

/** Whether plan tiers are wired to real Polar products. */
export function billingConfigured() {
	return paidPlans().length > 0;
}

export type { PlanDef, PlanId, PlanInterval } from "./plans";
export { findPlan, formatPrice, PLANS } from "./plans";
