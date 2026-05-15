import { listPayouts, topReferrers } from "@starter-saas/api/affiliate";
import { Badge } from "@starter-saas/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { EmptyState } from "@starter-saas/ui/components/empty-state";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@starter-saas/ui/components/table";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/require-admin";

import { PayoutActions } from "./_payout-actions";

export const dynamic = "force-dynamic";

function moneyFor(cents: number, currency: string) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
	}).format(cents / 100);
}

export default async function AdminAffiliatePage() {
	await requireAdmin();
	const [payouts, top] = await Promise.all([
		listPayouts({ status: "pending" }),
		topReferrers(50),
	]);

	return (
		<>
			<PageHeader
				title="Affiliate program"
				description="Review payouts and surface top referrers."
			/>

			<div className="grid gap-6">
				<Card>
					<CardHeader className="border-b">
						<CardTitle className="text-base">
							Payouts awaiting review ({payouts.length})
						</CardTitle>
						<CardDescription>
							Approve or deny pending requests. Approved payouts mark the row
							ready for the Polar payout API; the actual dispatch is your job.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{payouts.length === 0 ? (
							<EmptyState
								illustration="grid"
								title="No pending payouts"
								description="When affiliates request payouts they'll show up here."
								className="border-0 bg-transparent py-12"
							/>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Affiliate</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Requested</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{payouts.map((p) => (
										<TableRow key={p.id}>
											<TableCell className="font-mono text-xs">
												{p.affiliateId.slice(0, 12)}…
											</TableCell>
											<TableCell>
												{moneyFor(p.amountCents, p.currency)}
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{new Date(p.requestedAt).toLocaleString()}
											</TableCell>
											<TableCell className="text-right">
												<PayoutActions id={p.id} />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="border-b">
						<CardTitle className="text-base">
							Top referrers ({top.length})
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{top.length === 0 ? (
							<EmptyState
								illustration="orbits"
								title="No referrals yet"
								description="Once someone signs up via an affiliate link, they'll appear here."
								className="border-0 bg-transparent py-12"
							/>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Code</TableHead>
										<TableHead>User</TableHead>
										<TableHead className="text-right">Signups</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{top.map((t) => (
										<TableRow key={t.affiliateId}>
											<TableCell>
												<Badge
													variant="secondary"
													className="font-mono text-xs"
												>
													{t.code}
												</Badge>
											</TableCell>
											<TableCell className="font-mono text-xs">
												{t.userId.slice(0, 12)}…
											</TableCell>
											<TableCell className="text-right font-medium">
												{t.signups}
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
