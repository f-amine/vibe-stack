"use client";

import { Badge } from "@starter-saas/ui/components/badge";
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
import { Gift, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";

type Invite = {
	id: string;
	referredEmail: string;
	status: "pending" | "accepted" | "expired";
	rewardCents: number;
	rewardGranted: number;
	createdAt: string;
	acceptedAt: string | null;
};

type Data = {
	rows: Invite[];
	pendingRewardCents: number;
	maxPerMonth: number;
	rewardCents: number;
};

function money(cents: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
	}).format(cents / 100);
}

export default function ReferralsPage() {
	const [data, setData] = useState<Data | null>(null);
	const [email, setEmail] = useState("");
	const [busy, setBusy] = useState(false);

	const load = async () => {
		try {
			const res = await fetch("/api/referrals", { cache: "no-store" });
			if (!res.ok) {
				throw new Error(`status ${res.status}`);
			}
			setData((await res.json()) as Data);
		} catch {
			setData({
				rows: [],
				pendingRewardCents: 0,
				maxPerMonth: 5,
				rewardCents: 2900,
			});
		}
	};

	useEffect(() => {
		void load();
	}, []);

	const invite = async () => {
		if (!email.trim()) {
			toast.error("Enter an email");
			return;
		}
		setBusy(true);
		const toastId = toast.loading(`Inviting ${email}…`);
		try {
			const res = await fetch("/api/referrals", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: email.trim() }),
			});
			if (!res.ok) {
				const text = await res.text().catch(() => "");
				throw new Error(text || `status ${res.status}`);
			}
			toast.success("Invitation queued", { id: toastId });
			setEmail("");
			await load();
		} catch (err) {
			toast.error("Couldn't invite", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		} finally {
			setBusy(false);
		}
	};

	if (data === null) {
		return (
			<>
				<PageHeader title="Refer a friend" description="Loading…" />
				<Skeleton className="h-32 w-full" />
			</>
		);
	}

	const sentThisMonth = data.rows.filter((r) => {
		const ageMs = Date.now() - new Date(r.createdAt).getTime();
		return ageMs < 30 * 24 * 60 * 60 * 1000;
	}).length;
	const remaining = Math.max(0, data.maxPerMonth - sentThisMonth);

	return (
		<>
			<PageHeader
				title="Refer a friend"
				description={`Both of you get ${money(data.rewardCents)} once they sign up.`}
			/>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Send an invite</CardTitle>
					<CardDescription>
						You have <strong>{remaining}</strong> invite
						{remaining === 1 ? "" : "s"} left this month.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="grid gap-3 sm:grid-cols-[1fr_auto]"
						onSubmit={(e) => {
							e.preventDefault();
							void invite();
						}}
					>
						<Input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="friend@example.com"
							disabled={busy || remaining === 0}
						/>
						<Button type="submit" disabled={busy || remaining === 0}>
							<Send className="mr-1.5 h-4 w-4" />
							Send invite
						</Button>
					</form>
				</CardContent>
			</Card>

			<div className="mt-6 grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Pending reward</CardDescription>
						<CardTitle className="font-semibold text-3xl tracking-tight">
							{money(data.pendingRewardCents)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							Credited to your next invoice once your friend stays subscribed.
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>This month</CardDescription>
						<CardTitle className="font-semibold text-3xl tracking-tight">
							{sentThisMonth} / {data.maxPerMonth}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							Invites sent in the rolling 30 days.
						</p>
					</CardContent>
				</Card>
			</div>

			<Card className="mt-6">
				<CardHeader className="border-b">
					<CardTitle className="text-base">Your invitations</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{data.rows.length === 0 ? (
						<EmptyState
							illustration="orbits"
							title="No invites yet"
							description="Send your first invitation above — you'll see acceptances pop up here."
							className="border-0 bg-transparent py-12"
						/>
					) : (
						<ul className="divide-y">
							{data.rows.map((r) => (
								<li key={r.id} className="flex items-center gap-3 px-6 py-3">
									<Gift className="h-4 w-4 text-muted-foreground" />
									<div className="flex-1">
										<p className="font-medium text-sm">{r.referredEmail}</p>
										<p className="text-muted-foreground text-xs">
											{new Date(r.createdAt).toLocaleDateString()}
											{r.acceptedAt
												? ` · joined ${new Date(r.acceptedAt).toLocaleDateString()}`
												: ""}
										</p>
									</div>
									<Badge variant="secondary" className="capitalize">
										{r.status}
									</Badge>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</>
	);
}
