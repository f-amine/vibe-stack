import { auth } from "@starter-saas/auth";
import { polar } from "@starter-saas/billing/client";
import {
	findPlan,
	formatPrice,
	PLANS,
	type PlanDef,
	type PlanId,
} from "@starter-saas/billing/plans";
import { paidPlans } from "@starter-saas/billing/plans-server";
import { buttonVariants } from "@starter-saas/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { CheckCircle2, Receipt, Sparkles } from "lucide-react";
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

	return (
		<div className="grain relative min-h-dvh bg-background">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 -z-10"
				style={{
					background:
						"radial-gradient(circle at 50% 0%, oklch(0.84 0.13 88 / 0.18), transparent 55%)",
				}}
			/>
			<header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
				<Link
					href="/"
					className="inline-flex items-center gap-2 font-semibold tracking-tight"
				>
					<span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs">
						S
					</span>
					<span>stack/saas</span>
				</Link>
				<span className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
					Receipt
				</span>
			</header>

			<main className="mx-auto max-w-2xl px-6 pt-8 pb-20">
				<div className="flex flex-col items-center text-center">
					<div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
						<CheckCircle2 className="h-8 w-8 text-emerald-500" aria-hidden />
					</div>
					<h1 className="mt-6 font-display text-4xl tracking-tight sm:text-5xl">
						You're on {display.name}.
					</h1>
					<p className="mt-3 max-w-md text-muted-foreground text-sm sm:text-base">
						{checkoutKnown && plan
							? "Checkout complete — your subscription is active."
							: checkoutId
								? "Checkout received — we'll finalize your subscription momentarily."
								: "Welcome aboard. Your plan is active."}
					</p>
				</div>

				<Card className="mt-10">
					<CardHeader>
						<div className="flex items-center justify-between gap-3">
							<div>
								<CardTitle className="text-2xl">{display.name}</CardTitle>
								<CardDescription>{display.description}</CardDescription>
							</div>
							<Sparkles className="h-5 w-5 text-muted-foreground" aria-hidden />
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex items-baseline gap-2">
							<span className="font-display text-4xl tracking-tight">
								{price}
							</span>
							{interval ? (
								<span className="text-muted-foreground text-sm">
									{interval}
								</span>
							) : null}
						</div>

						<ul className="mt-6 grid gap-2 text-sm">
							{display.features.map((f) => (
								<li key={f} className="flex items-start gap-2">
									<CheckCircle2
										className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
										aria-hidden
									/>
									<span className="text-foreground/85">{f}</span>
								</li>
							))}
						</ul>

						{checkoutId ? (
							<p className="mt-6 inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 font-mono text-muted-foreground text-xs">
								<Receipt className="h-3.5 w-3.5" aria-hidden />
								<span className="truncate">checkout · {checkoutId}</span>
							</p>
						) : null}
					</CardContent>
					<CardFooter className="flex flex-col gap-2 sm:flex-row">
						<Link
							href="/dashboard"
							className={`${buttonVariants()} w-full sm:w-auto`}
						>
							Go to dashboard
						</Link>
						<Link
							href="/dashboard/billing"
							className={`${buttonVariants({ variant: "outline" })} w-full sm:w-auto`}
						>
							View billing
						</Link>
					</CardFooter>
				</Card>

				<p className="mt-8 text-center text-muted-foreground text-xs">
					A receipt was sent to <strong>{session.user.email}</strong>. Need
					help?{" "}
					<Link
						href="/dashboard/billing"
						className="underline-offset-4 hover:underline"
					>
						Manage your subscription
					</Link>
					.
				</p>
			</main>
		</div>
	);
}

export const metadata = {
	title: "Welcome aboard",
	robots: { index: false },
};
