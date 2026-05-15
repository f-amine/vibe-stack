import { auth } from "@vibestack/auth";
import { polar } from "@vibestack/billing/client";
import {
	findPlan,
	formatPrice,
	PLANS,
	type PlanDef,
	type PlanId,
} from "@vibestack/billing/plans";
import { paidPlans } from "@vibestack/billing/plans-server";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
	searchParams: Promise<{ checkout_id?: string; checkoutId?: string }>;
};

function pickProductId(
	checkout: {
		productId?: string | null;
		product?: { id?: string | null } | null;
		products?: Array<{ id?: string | null }>;
	} | null,
): string | null {
	if (!checkout) {
		return null;
	}
	return (
		checkout.productId ??
		checkout.product?.id ??
		checkout.products?.[0]?.id ??
		null
	);
}

async function resolvePlanFromCheckout(
	checkoutId: string | undefined,
): Promise<{ plan: PlanDef | null; checkoutKnown: boolean }> {
	if (!checkoutId) {
		return { plan: null, checkoutKnown: false };
	}
	try {
		// Polar SDK shape varies between minor versions; we treat the response
		// loosely so a backwards-incompatible bump doesn't break the page.
		const checkout = (await polar.checkouts.get({ id: checkoutId })) as {
			productId?: string | null;
			product?: { id?: string | null } | null;
			products?: Array<{ id?: string | null }>;
		} | null;
		const productId = pickProductId(checkout);
		if (!productId) {
			return { plan: null, checkoutKnown: true };
		}
		const matchedPaid = paidPlans().find((p) => p.polarProductId === productId);
		if (matchedPaid) {
			return { plan: matchedPaid, checkoutKnown: true };
		}
		return { plan: null, checkoutKnown: true };
	} catch {
		return { plan: null, checkoutKnown: !!checkoutId };
	}
}

export default async function SuccessPage({ searchParams }: Props) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/sign-in?next=/success");
	}

	const params = await searchParams;
	const checkoutId = params.checkout_id ?? params.checkoutId;

	const { plan, checkoutKnown } = await resolvePlanFromCheckout(checkoutId);
	const fallbackPlan: PlanDef =
		findPlan("pro" as PlanId) ?? PLANS[1] ?? PLANS[0];
	const display = plan ?? fallbackPlan;
	const price = formatPrice(display);
	const interval =
		display.interval === "month"
			? "per month"
			: display.interval === "year"
				? "per year"
				: display.interval === "one-time"
					? "one-time"
					: null;

	const statusLine = checkoutKnown && plan
		? "Subscription active. Receipt sent."
		: checkoutId
			? "Checkout received. We'll finalise your subscription in a moment."
			: "Welcome aboard. Your plan is active.";

	return (
		<div className="relative min-h-dvh bg-background">
			{/* Single warm spotlight, top-centre, falling off fast */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 -z-10"
				style={{
					background:
						"radial-gradient(48% 36% at 50% -8%, oklch(0.84 0.13 88 / 0.18), transparent 70%)",
				}}
			/>

			<header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
				<Link
					href="/"
					className="vs-focus-ring inline-flex items-center gap-2 rounded-sm"
					aria-label="vibestack — home"
				>
					<span className="inline-block bg-foreground px-1.5 py-0.5 font-display font-medium text-[0.875rem] text-background leading-none">
						vibe
					</span>
					<span className="font-display text-[0.95rem] text-foreground/80">
						/stack
					</span>
				</Link>
				<span className="font-mono-label text-muted-foreground">
					Receipt · vol. 01
				</span>
			</header>

			<main className="mx-auto max-w-2xl px-6 pt-12 pb-24 vs-fade-up">
				<div className="space-y-5">
					<span className="font-mono-label text-muted-foreground">
						Subscription active
					</span>
					<span aria-hidden className="gold-rule" />
					<h1 className="font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.04] tracking-[-0.02em] text-foreground">
						You're on <em
							className="not-italic"
							style={{ color: "var(--vs-gold)", fontStyle: "italic" }}
						>
							{display.name}
						</em>.
					</h1>
					<p className="max-w-lg text-muted-foreground text-sm leading-relaxed">
						{statusLine}
					</p>
				</div>

				{/* Receipt ledger — typographic, no card */}
				<section
					aria-labelledby="plan-heading"
					className="mt-12 border-border border-y py-10"
				>
					<h2 id="plan-heading" className="sr-only">
						{display.name} plan summary
					</h2>
					<div className="flex items-end justify-between gap-6">
						<div>
							<p className="font-mono-label text-muted-foreground">
								{display.name} plan
							</p>
							<div className="mt-3 flex items-baseline gap-3">
								<span className="font-display text-[3.5rem] leading-none tracking-[-0.02em] text-foreground">
									{price}
								</span>
								{interval ? (
									<span className="font-mono text-muted-foreground text-sm">
										{interval}
									</span>
								) : null}
							</div>
							{display.description ? (
								<p className="mt-3 max-w-md text-muted-foreground text-sm leading-relaxed">
									{display.description}
								</p>
							) : null}
						</div>
					</div>

					<ul className="mt-10 grid gap-3 text-sm sm:grid-cols-2">
						{display.features.map((f) => (
							<li
								key={f}
								className="flex items-start gap-2.5 text-foreground/85"
							>
								<span
									aria-hidden
									className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[color:var(--vs-gold)]"
								/>
								<span>{f}</span>
							</li>
						))}
					</ul>
				</section>

				<div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
					<Link
						href="/dashboard"
						className="vs-focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--vs-gold)] px-6 font-medium text-[color:var(--vs-ink)] text-sm transition-transform hover:bg-[color:var(--vs-gold-deep)] hover:scale-[1.015]"
					>
						Go to dashboard
						<span aria-hidden>→</span>
					</Link>
					<Link
						href="/dashboard/settings#billing"
						className="vs-focus-ring inline-flex h-11 items-center justify-center rounded-full border border-border bg-transparent px-6 text-foreground/85 text-sm transition-colors hover:bg-[color:var(--vs-ink-line)]/40 hover:text-foreground"
					>
						Manage billing
					</Link>
				</div>

				<p className="mt-12 text-muted-foreground text-xs leading-relaxed">
					A receipt was sent to{" "}
					<strong className="text-foreground/90">{session.user.email}</strong>
					{checkoutId ? (
						<>
							{" · checkout reference "}
							<span className="font-mono text-foreground/80">
								{checkoutId}
							</span>
						</>
					) : null}
					.
				</p>
			</main>
		</div>
	);
}

export const metadata = {
	title: "Welcome aboard · vibestack",
	robots: { index: false },
};
