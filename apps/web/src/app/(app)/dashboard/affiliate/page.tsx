"use client";

import { Button } from "@starter-saas/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { EmptyState } from "@starter-saas/ui/components/empty-state";
import { Input } from "@starter-saas/ui/components/input";
import { Skeleton } from "@starter-saas/ui/components/skeleton";
import { Copy, MousePointerClick, Sparkles, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";

type State = {
	enrolled: boolean;
	code?: string;
	commissionRate?: number;
	stats?: { clicks: number; signups: number; pendingPayoutCents: number };
	shareUrl?: string;
};

function formatMoney(cents: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	}).format(cents / 100);
}

export default function AffiliatePage() {
	const [state, setState] = useState<State | null>(null);
	const [enrolling, setEnrolling] = useState(false);
	const [payoutAmount, setPayoutAmount] = useState("");

	const load = async () => {
		try {
			const res = await fetch("/api/affiliate/me", { cache: "no-store" });
			if (!res.ok) {
				throw new Error(`status ${res.status}`);
			}
			setState((await res.json()) as State);
		} catch {
			setState({ enrolled: false });
		}
	};

	useEffect(() => {
		void load();
	}, []);

	const enroll = async () => {
		setEnrolling(true);
		const toastId = toast.loading("Enrolling…");
		try {
			const res = await fetch("/api/affiliate/me", { method: "POST" });
			if (!res.ok) {
				throw new Error(`status ${res.status}`);
			}
			toast.success("Enrolled — share your link", { id: toastId });
			await load();
		} catch (err) {
			toast.error("Couldn't enroll", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		} finally {
			setEnrolling(false);
		}
	};

	const copy = async () => {
		if (!state?.shareUrl) {
			return;
		}
		try {
			await navigator.clipboard.writeText(state.shareUrl);
			toast.success("Copied");
		} catch {
			toast.error("Clipboard blocked — copy manually");
		}
	};

	const requestPayout = async () => {
		const cents = Math.round(Number(payoutAmount) * 100);
		if (!Number.isFinite(cents) || cents < 2500) {
			toast.error("Enter at least $25.00");
			return;
		}
		const toastId = toast.loading("Submitting payout…");
		try {
			const res = await fetch("/api/affiliate/payouts", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ amountCents: cents }),
			});
			if (!res.ok) {
				const text = await res.text().catch(() => "");
				throw new Error(text || `status ${res.status}`);
			}
			toast.success("Payout queued for review", { id: toastId });
			setPayoutAmount("");
			await load();
		} catch (err) {
			toast.error("Couldn't submit payout", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		}
	};

	if (state === null) {
		return (
			<>
				<PageHeader
					title="Affiliate program"
					description="Share, refer, get paid."
				/>
				<Skeleton className="h-40 w-full" />
			</>
		);
	}

	if (!state.enrolled) {
		return (
			<>
				<PageHeader
					title="Affiliate program"
					description="Share, refer, get paid."
				/>
				<EmptyState
					illustration="orbits"
					title="Join the affiliate program"
					description="Get a personalized link. Every signup that came in through it earns a commission you can withdraw via Polar."
					action={
						<Button onClick={enroll} disabled={enrolling}>
							<Sparkles className="mr-1.5 h-4 w-4" />
							{enrolling ? "Enrolling…" : "Enroll me"}
						</Button>
					}
				/>
			</>
		);
	}

	const stats = state.stats ?? {
		clicks: 0,
		signups: 0,
		pendingPayoutCents: 0,
	};
	const commission = state.commissionRate ?? 0.2;
	const canPayout = stats.pendingPayoutCents >= 2500;

	return (
		<>
			<PageHeader
				title="Affiliate program"
				description={`Your commission rate: ${(commission * 100).toFixed(0)}%`}
			/>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Clicks</CardDescription>
						<CardTitle className="font-semibold text-3xl tracking-tight">
							{stats.clicks}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Signups</CardDescription>
						<CardTitle className="font-semibold text-3xl tracking-tight">
							{stats.signups}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Pending payout</CardDescription>
						<CardTitle className="font-semibold text-3xl tracking-tight">
							{formatMoney(stats.pendingPayoutCents)}
						</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle className="text-base">Your share link</CardTitle>
					<CardDescription>
						Anyone who hits this URL gets attributed to you for 30 days.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-[1fr_auto]">
					<Input value={state.shareUrl ?? ""} readOnly />
					<Button onClick={copy}>
						<Copy className="mr-1.5 h-4 w-4" />
						Copy
					</Button>
				</CardContent>
			</Card>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle className="text-base">Request a payout</CardTitle>
					<CardDescription>
						Minimum $25. Payouts are reviewed by an admin then dispatched via
						Polar.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-[1fr_auto]">
					<Input
						type="number"
						min="25"
						step="0.01"
						value={payoutAmount}
						onChange={(e) => setPayoutAmount(e.target.value)}
						placeholder="25.00"
					/>
					<Button onClick={requestPayout} disabled={!canPayout}>
						<UserPlus className="mr-1.5 h-4 w-4" />
						Request
					</Button>
				</CardContent>
			</Card>

			<p className="mt-6 inline-flex items-center gap-1.5 text-muted-foreground text-xs">
				<MousePointerClick className="h-3.5 w-3.5" /> Numbers update on every
				page load.
			</p>
		</>
	);
}
