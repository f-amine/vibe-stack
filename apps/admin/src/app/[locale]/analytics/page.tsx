import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { GrowthArea } from "@/components/charts/area-chart";
import { CountBar } from "@/components/charts/bar-chart";
import { PageHeader } from "@/components/layout/page-header";
import { fetchAuditByAction, fetchSignupsByDay } from "@/lib/mock-stats";

export default async function AnalyticsPage() {
	const [signups90, audit] = await Promise.all([
		fetchSignupsByDay(90),
		fetchAuditByAction(8),
	]);

	return (
		<>
			<PageHeader
				title="Analytics"
				description="Behavior pulled live from your own database."
			/>

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Signups · 90 days</CardTitle>
						<CardDescription>
							Daily signups, sourced from the auth.user table.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<GrowthArea data={signups90} label="signups" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Action breakdown</CardTitle>
						<CardDescription>
							Top distinct actions in your audit log.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{audit.length === 0 ? (
							<p className="py-12 text-center text-muted-foreground text-sm">
								No audit events yet. Once your app writes to audit_log, this
								chart will populate automatically.
							</p>
						) : (
							<CountBar data={audit} />
						)}
					</CardContent>
				</Card>
			</div>
		</>
	);
}
