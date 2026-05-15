import { Badge } from "@vibestack/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import { EmptyState } from "@vibestack/ui/components/empty-state";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@vibestack/ui/components/table";
import { GrowthArea } from "@/components/charts/area-chart";
import { CountBar } from "@/components/charts/bar-chart";
import { PageHeader } from "@/components/layout/page-header";
import {
	fetchChurn,
	fetchMrr,
	fetchTopPlans,
	formatMoney,
	formatPercent,
} from "@/lib/billing-stats";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

function shortMonth(month: string): string {
	const [year, m] = month.split("-");
	if (!year || !m) {
		return month;
	}
	const date = new Date(`${month}-01T00:00:00Z`);
	return date.toLocaleDateString("en-US", {
		month: "short",
		year: "2-digit",
		timeZone: "UTC",
	});
}

export default async function AdminBillingPage() {
	await requireAdmin();
	const [mrr, churn, top] = await Promise.all([
		fetchMrr(12),
		fetchChurn(12),
		fetchTopPlans(8),
	]);

	const latest = mrr.at(-1);
	const previous = mrr.at(-2);
	const mrrDelta =
		latest && previous && previous.mrrCents > 0
			? (latest.mrrCents - previous.mrrCents) / previous.mrrCents
			: null;

	const latestChurn = churn.at(-1);
	const previousChurn = churn.at(-2);
	const churnDelta =
		latestChurn && previousChurn
			? latestChurn.churnRate - previousChurn.churnRate
			: null;

	const totalSubs = top.reduce((acc, row) => acc + row.subscribers, 0);

	const mrrSeries = mrr.map((p) => ({
		date: shortMonth(p.month),
		value: p.mrrCents / 100,
	}));
	const churnSeries = churn.map((p) => ({
		label: shortMonth(p.month),
		value: Number((p.churnRate * 100).toFixed(2)),
	}));

	return (
		<>
			<PageHeader
				title="Billing analytics"
				description="MRR, churn, and the products driving revenue. Numbers come live off the `subscription` table."
			/>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>MRR · current month</CardDescription>
						<CardTitle className="font-semibold text-3xl tracking-tight">
							{formatMoney(latest?.mrrCents ?? 0)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							{mrrDelta !== null
								? `${mrrDelta >= 0 ? "+" : ""}${formatPercent(mrrDelta)} vs last month`
								: "—"}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Active subscribers</CardDescription>
						<CardTitle className="font-semibold text-3xl tracking-tight">
							{totalSubs}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							across {top.length} active product{top.length === 1 ? "" : "s"}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Monthly churn rate</CardDescription>
						<CardTitle className="font-semibold text-3xl tracking-tight">
							{latestChurn ? formatPercent(latestChurn.churnRate) : "—"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							{churnDelta !== null
								? `${churnDelta >= 0 ? "+" : ""}${(churnDelta * 100).toFixed(2)} pp vs last month`
								: "—"}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="mt-8 grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle>MRR · last 12 months</CardTitle>
						<CardDescription>
							USD, normalized so annual plans are amortized to monthly.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{mrrSeries.some((p) => p.value > 0) ? (
							<GrowthArea data={mrrSeries} label="MRR" />
						) : (
							<EmptyState
								illustration="arc"
								title="No paid subscriptions yet"
								description="Once subscriptions start coming in, MRR will plot here automatically."
								className="border-0 bg-transparent py-12"
							/>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Churn rate · last 12 months</CardTitle>
						<CardDescription>
							Cancelled this month ÷ active at month start.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{churnSeries.some((p) => p.value > 0) ? (
							<CountBar data={churnSeries} />
						) : (
							<EmptyState
								illustration="stack"
								title="No cancellations yet"
								description="The chart will populate once a subscription is canceled."
								className="border-0 bg-transparent py-12"
							/>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="border-b">
						<CardTitle className="text-base">Top plans by MRR</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{top.length === 0 ? (
							<EmptyState
								illustration="orbits"
								title="No active subscriptions"
								description="Top plans will appear here as subscriptions become active."
								className="border-0 bg-transparent py-12"
							/>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Plan</TableHead>
										<TableHead>Subscribers</TableHead>
										<TableHead>Price</TableHead>
										<TableHead>MRR</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{top.map((row) => (
										<TableRow key={row.productId}>
											<TableCell>
												<div className="font-medium">{row.productName}</div>
												<div className="font-mono text-muted-foreground text-xs">
													{row.productId}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="secondary">{row.subscribers}</Badge>
											</TableCell>
											<TableCell>
												{formatMoney(row.priceCents, row.currency)}
											</TableCell>
											<TableCell className="font-medium">
												{formatMoney(row.mrrCents, row.currency)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	);
}
