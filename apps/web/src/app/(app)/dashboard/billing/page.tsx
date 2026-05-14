"use client";

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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { authClient } from "@/lib/auth-client";

const plans = [
	{
		id: "free",
		name: "Free",
		price: "$0",
		features: ["1 project", "Community support", "MIT license"],
	},
	{
		id: "pro",
		name: "Pro",
		price: "$29",
		features: [
			"Unlimited projects",
			"Priority support",
			"Quarterly upgrades",
			"Email support",
		],
		highlight: true,
	},
];

export default function BillingPage() {
	type CustomerState = {
		activeSubscriptions?: Array<{
			id: string;
			productId: string;
			currentPeriodEnd?: string | Date | null;
		}>;
	};

	const [state, setState] = useState<CustomerState | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const res = await authClient.customer.state();
				setState((res?.data as unknown as CustomerState) ?? {});
			} catch {
				setState({});
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const onUpgrade = async () => {
		try {
			await authClient.checkout({ slug: "pro" });
		} catch (err) {
			toast.error("Checkout failed", {
				description: err instanceof Error ? err.message : "Unknown error",
			});
		}
	};

	const onManage = async () => {
		try {
			await authClient.customer.portal();
		} catch (err) {
			toast.error("Couldn't open portal", {
				description: err instanceof Error ? err.message : "Unknown error",
			});
		}
	};

	const active = state?.activeSubscriptions?.[0];
	const hasPro = Boolean(active);

	return (
		<>
			<PageHeader
				title="Billing"
				description="Manage your subscription and billing details."
			/>

			<Card className="max-w-3xl">
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
									{hasPro ? "Pro" : "Free"}
								</span>
								<Badge variant={hasPro ? "default" : "secondary"}>
									{hasPro ? "Active" : "Free tier"}
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
					<div className="flex gap-2">
						{hasPro ? (
							<Button onClick={onManage}>Manage subscription</Button>
						) : (
							<Button onClick={onUpgrade}>Upgrade to Pro</Button>
						)}
					</div>
				</CardContent>
			</Card>

			<div className="mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
				{plans.map((p) => (
					<Card
						key={p.id}
						className={p.highlight ? "border-foreground/60 shadow-sm" : ""}
					>
						<CardHeader>
							<CardTitle>{p.name}</CardTitle>
							<CardDescription className="font-semibold text-3xl text-foreground tracking-tight">
								{p.price}
								<span className="ml-1 font-normal text-muted-foreground text-sm">
									/mo
								</span>
							</CardDescription>
						</CardHeader>
						<CardContent>
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
							{p.id === "pro" && !hasPro && (
								<Button onClick={onUpgrade} className="w-full">
									Choose Pro
								</Button>
							)}
							{p.id === "free" && !hasPro && (
								<Button variant="outline" disabled className="w-full">
									Current plan
								</Button>
							)}
						</CardFooter>
					</Card>
				))}
			</div>
		</>
	);
}
