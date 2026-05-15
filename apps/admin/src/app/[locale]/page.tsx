import { Badge } from "@starter-saas/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { Building2, CreditCard, TrendingUp, Users } from "lucide-react";
import { CountBar, GrowthArea } from "@/components/charts/lazy";
import { PageHeader } from "@/components/layout/page-header";
import {
	fetchAuditByAction,
	fetchKpis,
	fetchSignupsByDay,
} from "@/lib/mock-stats";

const formatter = new Intl.NumberFormat("en", { notation: "compact" });

export default async function AdminOverview() {
	const [kpis, signups, audit] = await Promise.all([
		fetchKpis(),
		fetchSignupsByDay(30),
		fetchAuditByAction(6),
	]);

	const cards = [
		{
			label: "Total users",
			value: formatter.format(kpis.totalUsers),
			delta: `+${kpis.newUsers30d} in 30d`,
			icon: Users,
		},
		{
			label: "Organizations",
			value: formatter.format(kpis.totalOrgs),
			delta: "Active workspaces",
			icon: Building2,
		},
		{
			label: "Active subscriptions",
			value: formatter.format(kpis.activeSubs),
			delta: "Paying customers",
			icon: CreditCard,
		},
		{
			label: "30-day growth",
			value: `${kpis.totalUsers > 0 ? Math.round((kpis.newUsers30d / kpis.totalUsers) * 100) : 0}%`,
			delta: "New / total",
			icon: TrendingUp,
		},
	];

	return (
		<>
			<PageHeader
				title="Overview"
				description="The numbers that matter, refreshed on every page load."
				actions={
					<Badge variant="outline" className="font-mono text-[10px] uppercase">
						Live · Postgres
					</Badge>
				}
			/>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{cards.map((c) => {
					const Icon = c.icon;
					return (
						<Card key={c.label}>
							<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
								<CardDescription>{c.label}</CardDescription>
								<Icon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-semibold text-3xl tracking-tight">
									{c.value}
								</div>
								<p className="mt-1 text-muted-foreground text-xs">{c.delta}</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<div className="mt-8 grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Signups · last 30 days</CardTitle>
						<CardDescription>
							Daily new user count from the auth table.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<GrowthArea data={signups} label="signups" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Top audit actions</CardTitle>
						<CardDescription>By volume, all-time.</CardDescription>
					</CardHeader>
					<CardContent>
						{audit.length === 0 ? (
							<p className="py-12 text-center text-muted-foreground text-sm">
								No audit events yet.
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
