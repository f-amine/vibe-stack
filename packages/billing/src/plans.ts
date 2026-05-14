// Plan definitions — pure constants, no env. Safe to import from client + server.
// Polar product IDs live in env and are resolved server-side via `polarCheckoutProducts`.

export type PlanInterval = "month" | "year" | "one-time";

export type PlanDef = {
	/** Stable internal id used in code + URLs. */
	id: "free" | "pro" | "team";
	/** Slug the Polar plugin uses for `checkout({ slug })`. */
	slug: string;
	name: string;
	description: string;
	priceCents: number;
	currency: "USD" | "EUR";
	interval: PlanInterval | null;
	features: string[];
	highlight?: boolean;
	cta: string;
};

export const PLANS: readonly PlanDef[] = [
	{
		id: "free",
		slug: "free",
		name: "Free",
		description: "For prototypes and weekend bets.",
		priceCents: 0,
		currency: "USD",
		interval: null,
		features: [
			"1 project",
			"Community support",
			"Self-host on Dokploy",
			"MIT license",
		],
		cta: "Get started",
	},
	{
		id: "pro",
		slug: "pro",
		name: "Pro",
		description: "For the project you actually plan to ship.",
		priceCents: 2900,
		currency: "USD",
		interval: "month",
		features: [
			"Unlimited projects",
			"Priority support",
			"Quarterly stack upgrades",
			"Email support",
		],
		highlight: true,
		cta: "Upgrade to Pro",
	},
	{
		id: "team",
		slug: "team",
		name: "Team",
		description: "For agencies and small founding teams.",
		priceCents: 9900,
		currency: "USD",
		interval: "month",
		features: [
			"Everything in Pro",
			"5 seats included",
			"White-label license",
			"Slack channel",
			"Onboarding session",
		],
		cta: "Choose Team",
	},
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

export function findPlan(id: PlanId): PlanDef | undefined {
	return PLANS.find((p) => p.id === id);
}

export function formatPrice(plan: Pick<PlanDef, "priceCents" | "currency">) {
	if (plan.priceCents === 0) return "$0";
	const dollars = plan.priceCents / 100;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: plan.currency,
		minimumFractionDigits: 0,
	}).format(dollars);
}
