import { auth } from "@starter-saas/auth";
import { Badge } from "@starter-saas/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { headers } from "next/headers";
import { PageHeader } from "@/components/app/page-header";

const stats = [
	{ label: "Active projects", value: "12", delta: "+2 this week" },
	{ label: "Storage used", value: "8.4 GB", delta: "of 50 GB" },
	{ label: "Team members", value: "4", delta: "1 pending invite" },
	{ label: "Plan", value: "Free", delta: "Upgrade for unlimited" },
];

const recent = [
	{ id: "evt_01", text: "Signed in from Chrome on macOS", at: "2 min ago" },
	{
		id: "evt_02",
		text: "Invited alex@example.com to org Acme",
		at: "1 hr ago",
	},
	{ id: "evt_03", text: "Created project 'launch-plan'", at: "Yesterday" },
	{ id: "evt_04", text: "Updated billing email", at: "2 days ago" },
];

export default async function DashboardPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	const name = session?.user?.name?.split(" ")[0] ?? "there";

	return (
		<>
			<PageHeader
				title={`Welcome back, ${name}`}
				description="Here's a snapshot of your workspace."
			/>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((s) => (
					<Card key={s.label}>
						<CardHeader className="pb-2">
							<CardDescription>{s.label}</CardDescription>
							<CardTitle className="font-semibold text-3xl tracking-tight">
								{s.value}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-xs">{s.delta}</p>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="mt-8 grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Getting started</CardTitle>
						<CardDescription>
							A few things to do to get the most out of stack/saas.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ol className="space-y-4 text-sm">
							{[
								{
									title: "Complete your profile",
									desc: "Add your name and avatar in Settings.",
									status: "Done",
								},
								{
									title: "Connect your billing",
									desc: "Upgrade to unlock the full feature set.",
									status: "Pending",
								},
								{
									title: "Invite your team",
									desc: "Bring collaborators into your first organization.",
									status: "Pending",
								},
								{
									title: "Enable 2FA",
									desc: "Protect your account with a second factor.",
									status: "Pending",
								},
							].map((step, idx) => (
								<li
									key={step.title}
									className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
								>
									<span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted font-mono text-xs">
										{idx + 1}
									</span>
									<div className="flex-1">
										<p className="font-medium">{step.title}</p>
										<p className="text-muted-foreground text-xs">{step.desc}</p>
									</div>
									<Badge
										variant={step.status === "Done" ? "default" : "secondary"}
									>
										{step.status}
									</Badge>
								</li>
							))}
						</ol>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recent activity</CardTitle>
						<CardDescription>Your last few actions.</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="space-y-4 text-sm">
							{recent.map((evt) => (
								<li key={evt.id} className="flex items-start gap-3">
									<span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
									<div>
										<p>{evt.text}</p>
										<p className="text-muted-foreground text-xs">{evt.at}</p>
									</div>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
