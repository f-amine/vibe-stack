import { auth } from "@vibestack/auth";
import { PageHeader } from "@vibestack/ui/components/page-header";
import { headers } from "next/headers";
import Link from "next/link";

/*
 * Dashboard overview — the "lit reading room" landing.
 * Replaces the anti-reference shadcn 4-card stat grid with a typographic
 * ledger and a single spotlit next-action panel. Data is illustrative;
 * real wiring lives in packages/api + the audit log. The structure is the
 * point — copy the layout, swap the source.
 */

const ledger = [
	{ label: "Active projects", value: "12", note: "+2 this week" },
	{ label: "Storage used", value: "8.4", suffix: "GB", note: "of 50 GB" },
	{ label: "Team members", value: "4", note: "1 invite pending" },
	{ label: "Plan", value: "Free", note: "Upgrade ready" },
];

const checklist = [
	{
		title: "Complete your profile",
		desc: "Add your name and avatar in Settings.",
		done: true,
	},
	{
		title: "Connect billing",
		desc: "Unlock the full feature set with a Pro plan.",
		done: false,
		href: "/dashboard/settings#billing",
	},
	{
		title: "Invite your team",
		desc: "Bring collaborators into your first organisation.",
		done: false,
		href: "/dashboard/organizations",
	},
	{
		title: "Enable 2FA",
		desc: "Protect your account with a second factor.",
		done: false,
		href: "/dashboard/settings#security",
	},
];

const recent = [
	{ id: "evt_01", text: "Signed in from Chrome on macOS", at: "2 min ago" },
	{
		id: "evt_02",
		text: "Invited alex@example.com to org Acme",
		at: "1 hr ago",
	},
	{ id: "evt_03", text: "Created project ‘launch-plan’", at: "Yesterday" },
	{ id: "evt_04", text: "Updated billing email", at: "2 days ago" },
];

export default async function DashboardPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	const name = session?.user?.name?.split(" ")[0] ?? "there";

	const next = checklist.find((c) => !c.done);
	const done = checklist.filter((c) => c.done).length;

	return (
		<>
			<PageHeader
				bordered
				eyebrow={`Overview · ${new Date().toLocaleDateString("en", {
					weekday: "long",
					day: "numeric",
					month: "short",
				})}`}
				title={`Welcome back, ${name}.`}
				description="The quiet rundown. Pick the one thing that moves you forward today."
			/>

			{/* Typographic ledger — replaces the SaaS-stat-card cliché. */}
			<dl
				className="grid gap-x-10 gap-y-8 border-border border-b pb-10 sm:grid-cols-2 lg:grid-cols-4"
				aria-label="Workspace summary"
			>
				{ledger.map((row) => (
					<div key={row.label}>
						<dt className="font-mono-label text-muted-foreground">
							{row.label}
						</dt>
						<dd className="mt-3 flex items-baseline gap-2">
							<span className="font-display text-[2.5rem] text-foreground leading-none tracking-[-0.02em]">
								{row.value}
							</span>
							{row.suffix ? (
								<span className="font-mono text-muted-foreground text-sm">
									{row.suffix}
								</span>
							) : null}
						</dd>
						<p className="mt-2 text-muted-foreground text-xs">{row.note}</p>
					</div>
				))}
			</dl>

			<div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
				{/* Setup — the only spotlit unit on the page */}
				<section aria-labelledby="setup-heading">
					<div className="mb-6 flex items-end justify-between">
						<div>
							<span className="font-mono-label text-muted-foreground">
								Setup · {done} of {checklist.length}
							</span>
							<h2
								id="setup-heading"
								className="mt-2 font-display text-[1.625rem] text-foreground leading-tight tracking-[-0.015em]"
							>
								Getting set up
							</h2>
						</div>
						{next?.href ? (
							<Link
								href={next.href as never}
								className="vs-focus-ring inline-flex h-9 items-center gap-1.5 rounded-full bg-[color:var(--vs-gold)] px-4 font-medium text-[color:var(--vs-ink)] text-sm transition-transform hover:scale-[1.015] hover:bg-[color:var(--vs-gold-deep)]"
							>
								{next.title}
								<span aria-hidden>→</span>
							</Link>
						) : null}
					</div>

					<ol className="divide-y divide-border border-border border-y">
						{checklist.map((step, idx) => (
							<li
								key={step.title}
								className="flex items-start gap-5 py-5"
								aria-current={step === next ? "step" : undefined}
							>
								<span
									className={[
										"mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
										step.done
											? "border-[color:var(--vs-affirm)] bg-[color:var(--vs-affirm)]/15 text-[color:var(--vs-affirm)]"
											: step === next
												? "border-[color:var(--vs-gold)] bg-[color:var(--vs-gold)]/15 text-[color:var(--vs-gold)]"
												: "border-border text-muted-foreground",
									].join(" ")}
								>
									{step.done ? "✓" : String(idx + 1).padStart(2, "0")}
								</span>
								<div className="min-w-0 flex-1">
									<p className="font-medium text-foreground text-sm">
										{step.title}
									</p>
									<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
										{step.desc}
									</p>
								</div>
								<span className="font-mono-label text-muted-foreground">
									{step.done ? "Done" : step === next ? "Next" : "Later"}
								</span>
							</li>
						))}
					</ol>
				</section>

				{/* Activity — quiet column, no card */}
				<section aria-labelledby="activity-heading">
					<div className="mb-6">
						<span className="font-mono-label text-muted-foreground">
							Recent activity
						</span>
						<h2
							id="activity-heading"
							className="mt-2 font-display text-[1.625rem] text-foreground leading-tight tracking-[-0.015em]"
						>
							The last few things
						</h2>
					</div>
					<ol className="space-y-5">
						{recent.map((evt) => (
							<li key={evt.id} className="flex items-start gap-3 text-sm">
								<span
									aria-hidden
									className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--vs-gold)]/70"
								/>
								<div className="min-w-0 flex-1">
									<p className="text-foreground/90 leading-snug">{evt.text}</p>
									<p className="mt-1 font-mono text-muted-foreground text-xs">
										{evt.at}
									</p>
								</div>
							</li>
						))}
					</ol>
					<div className="mt-8 border-border border-t pt-5">
						<Link
							href="/dashboard/settings#security"
							className="vs-focus-ring inline-flex items-center gap-1.5 font-mono-label text-muted-foreground transition-colors hover:text-foreground"
						>
							Full audit log
							<span aria-hidden>→</span>
						</Link>
					</div>
				</section>
			</div>
		</>
	);
}
