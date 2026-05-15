"use client";

import {
	findPlan,
	formatPrice,
	PLANS,
	type PlanId,
} from "@starter-saas/billing/plans";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@starter-saas/ui/components/alert";
import { Badge } from "@starter-saas/ui/components/badge";
import { Button } from "@starter-saas/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { Skeleton } from "@starter-saas/ui/components/skeleton";
import { cn } from "@starter-saas/ui/lib/utils";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

type CustomerState = {
	activeSubscriptions?: Array<{
		id: string;
		productId: string;
		currentPeriodEnd?: string | Date | null;
	}>;
};

export function BillingSection() {
	const [state, setState] = useState<CustomerState | null>(null);
	const [loading, setLoading] = useState(true);
	const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
	const [opening, setOpening] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const res = await authClient.customer.state();
				setState((res?.data as unknown as CustomerState) ?? {});
			} catch (err) {
				toast.error(formatError(err as Error, "Couldn't load billing state"));
				setState({});
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const active = state?.activeSubscriptions?.[0];
	const currentPlanId: PlanId = active ? "pro" : "free";
	const current = findPlan(currentPlanId) ?? findPlan("free");

	const onUpgrade = async (slug: string, id: PlanId) => {
		setPendingPlan(id);
		const toastId = toast.loading(`Opening ${slug} checkout…`);
		try {
			await authClient.checkout({ slug });
			toast.dismiss(toastId);
		} catch (err) {
			toast.error(formatError(err as Error, "Couldn't start checkout"), {
				id: toastId,
				description:
					"Make sure POLAR_PRODUCT_ID_PRO is set in your .env and matches a product in your Polar dashboard.",
			});
			setPendingPlan(null);
		}
	};

	const onManage = async () => {
		setOpening(true);
		const toastId = toast.loading("Opening customer portal…");
		try {
			await authClient.customer.portal();
			toast.dismiss(toastId);
		} catch (err) {
			toast.error(formatError(err as Error, "Couldn't open portal"), {
				id: toastId,
			});
		} finally {
			setOpening(false);
		}
	};

	const hasActiveSub = Boolean(active);

	return (
		<div className="grid gap-6">
			<Card>
				<CardHeader>
					<CardTitle>Current plan</CardTitle>
					<CardDescription>What you're paying for today.</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						{loading ? (
							<Skeleton className="h-8 w-32" />
						) : (
							<div className="flex items-center gap-3">
								<span className="font-semibold text-2xl tracking-tight">
									{current?.name ?? "Free"}
								</span>
								<Badge variant={hasActiveSub ? "default" : "secondary"}>
									{hasActiveSub ? "Active" : "Free tier"}
								</Badge>
							</div>
						)}
						{active?.currentPeriodEnd && (
							<p className="mt-1 text-muted-foreground text-xs">
								Renews{" "}
								{new Date(active.currentPeriodEnd).toLocaleDateString(
									undefined,
									{ dateStyle: "long" },
								)}
							</p>
						)}
					</div>
					{hasActiveSub && (
						<Button onClick={onManage} disabled={opening}>
							{opening ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening…
								</>
							) : (
								"Manage subscription"
							)}
						</Button>
					)}
				</CardContent>
			</Card>

			<div>
				<h2 className="font-semibold text-xl">Plans</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Defined in{" "}
					<code className="font-mono">packages/billing/src/plans.ts</code>.
					Polar product IDs come from <code className="font-mono">.env</code>.
				</p>

				<div className="mt-6 grid gap-4 md:grid-cols-3">
					{PLANS.map((p) => {
						const isCurrent = p.id === currentPlanId;
						const isPaid = p.priceCents > 0;
						const isPending = pendingPlan === p.id;
						return (
							<Card
								key={p.id}
								className={cn(
									"flex flex-col",
									p.highlight && !isCurrent && "border-foreground/40 shadow-sm",
									isCurrent && "border-foreground bg-muted/30",
								)}
							>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											{p.name}
											{p.highlight && (
												<Sparkles className="h-4 w-4 text-foreground/60" />
											)}
										</CardTitle>
										{isCurrent && (
											<Badge
												variant="outline"
												className="font-mono text-[10px] uppercase"
											>
												Current
											</Badge>
										)}
									</div>
									<CardDescription>{p.description}</CardDescription>
									<div className="mt-3 flex items-baseline gap-1">
										<span className="font-semibold text-3xl text-foreground tracking-tight">
											{formatPrice(p)}
										</span>
										{p.interval && (
											<span className="text-muted-foreground text-sm">
												/{p.interval === "month" ? "mo" : "yr"}
											</span>
										)}
									</div>
								</CardHeader>
								<CardContent className="flex-1">
									<ul className="space-y-2 text-sm">
										{p.features.map((f) => (
											<li key={f} className="flex items-start gap-2">
												<span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
												<span>{f}</span>
											</li>
										))}
									</ul>
								</CardContent>
								<CardFooter>
									{!isPaid ? (
										<Button variant="outline" disabled className="w-full">
											Always free
										</Button>
									) : isCurrent ? (
										<Button
											variant="outline"
											onClick={onManage}
											disabled={opening}
											className="w-full"
										>
											{opening ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
													Opening…
												</>
											) : (
												"Manage"
											)}
										</Button>
									) : (
										<Button
											onClick={() => onUpgrade(p.slug, p.id)}
											disabled={isPending || pendingPlan !== null}
											className="w-full"
										>
											{isPending ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
													Redirecting…
												</>
											) : (
												p.cta
											)}
										</Button>
									)}
								</CardFooter>
							</Card>
						);
					})}
				</div>

				{process.env.NODE_ENV === "development" && (
					<Alert className="mt-8">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Set Polar product IDs to enable checkout</AlertTitle>
						<AlertDescription className="text-xs">
							Add <code className="font-mono">POLAR_PRODUCT_ID_PRO</code> (and
							optionally{" "}
							<code className="font-mono">POLAR_PRODUCT_ID_TEAM</code>) to your{" "}
							<code className="font-mono">.env</code> with the product IDs from{" "}
							<a
								href="https://sandbox.polar.sh"
								className="underline"
								target="_blank"
								rel="noreferrer"
							>
								sandbox.polar.sh
							</a>
							, then restart <code className="font-mono">pnpm dev</code>.
						</AlertDescription>
					</Alert>
				)}
			</div>
		</div>
	);
}
