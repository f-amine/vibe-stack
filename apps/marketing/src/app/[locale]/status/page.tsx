import type { Metadata } from "next";
import { ogMetadata } from "@/lib/og";

export const revalidate = 30;

type CheckStatus = "up" | "degraded" | "down";

type Check = {
	name: string;
	status: CheckStatus;
	latencyMs?: number;
	detail?: string;
};

type AppHealth = {
	app: string;
	status: CheckStatus;
	checks: Check[];
	at?: string;
};

type StatusEntry = {
	label: string;
	url: string;
	health: AppHealth | null;
	error?: string;
};

const TITLE = "Status";
const SUBTITLE = "Component health across the stack, refreshed every 30s.";

export const metadata: Metadata = {
	title: TITLE,
	description: SUBTITLE,
	...ogMetadata({
		title: TITLE,
		subtitle: SUBTITLE,
		eyebrow: "Status",
	}),
};

function urlFor(envKey: string, fallback: string, suffix = "/api/health") {
	const base = (process.env[envKey] ?? fallback).replace(/\/$/, "");
	return `${base}${suffix}`;
}

const APPS: { label: string; url: string }[] = [
	{
		label: "marketing",
		url: urlFor("NEXT_PUBLIC_MARKETING_URL", "http://localhost:3000"),
	},
	{
		label: "web",
		url: urlFor("NEXT_PUBLIC_WEB_APP_URL", "http://localhost:3001"),
	},
	{
		label: "admin",
		url: urlFor("NEXT_PUBLIC_ADMIN_URL", "http://localhost:3002"),
	},
];

async function fetchHealth(url: string): Promise<StatusEntry["health"]> {
	try {
		const res = await fetch(url, {
			cache: "no-store",
			signal: AbortSignal.timeout(4000),
		});
		const json = (await res.json()) as AppHealth;
		return json;
	} catch {
		return null;
	}
}

function StatusDot({ status }: { status: CheckStatus | "unknown" }) {
	const cls =
		status === "up"
			? "bg-emerald-500"
			: status === "degraded"
				? "bg-amber-500"
				: status === "down"
					? "bg-red-500"
					: "bg-zinc-500";
	return (
		<span
			aria-hidden
			className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`}
		/>
	);
}

function StatusLabel({ status }: { status: CheckStatus | "unknown" }) {
	const text =
		status === "up"
			? "Operational"
			: status === "degraded"
				? "Degraded"
				: status === "down"
					? "Down"
					: "Unknown";
	return (
		<span className="font-mono text-xs uppercase tracking-widest">{text}</span>
	);
}

export default async function StatusPage() {
	const entries: StatusEntry[] = await Promise.all(
		APPS.map(async (app) => {
			const health = await fetchHealth(app.url);
			return { label: app.label, url: app.url, health };
		}),
	);

	const overall: CheckStatus | "unknown" = entries.some(
		(e) => !e.health || e.health.status === "down",
	)
		? entries.some((e) => !e.health)
			? "unknown"
			: "down"
		: entries.some((e) => e.health?.status === "degraded")
			? "degraded"
			: "up";

	return (
		<main className="mx-auto max-w-5xl px-6 py-16">
			<header>
				<p className="font-mono text-[color:var(--marketing-muted)] text-xs uppercase tracking-[0.3em]">
					— System status
				</p>
				<h1 className="mt-4 font-display text-5xl tracking-tight sm:text-6xl">
					{overall === "up"
						? "All systems operational."
						: overall === "degraded"
							? "Some components degraded."
							: overall === "down"
								? "Major outage in progress."
								: "Status partly unknown."}
				</h1>
				<p className="mt-4 max-w-2xl text-[color:var(--marketing-fg)]/70 text-lg">
					{SUBTITLE}
				</p>
			</header>

			<section className="mt-12 grid gap-3">
				{entries.map((entry) => {
					const status = entry.health?.status ?? "unknown";
					return (
						<article
							key={entry.label}
							className="rounded-xl border border-[color:var(--marketing-line)] p-5"
						>
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-3">
									<StatusDot status={status} />
									<h2 className="font-display text-xl capitalize tracking-tight">
										{entry.label}
									</h2>
								</div>
								<StatusLabel status={status} />
							</div>

							<div className="mt-4 grid gap-2">
								{entry.health?.checks.length ? (
									entry.health.checks.map((c) => (
										<div
											key={c.name}
											className="flex items-center justify-between rounded-md bg-[color:var(--marketing-line)]/20 px-3 py-2 font-mono text-xs"
										>
											<span className="flex items-center gap-2">
												<StatusDot status={c.status} />
												<span className="uppercase tracking-widest">
													{c.name}
												</span>
											</span>
											<span className="text-[color:var(--marketing-muted)]">
												{c.detail ??
													(typeof c.latencyMs === "number"
														? `${c.latencyMs}ms`
														: c.status)}
											</span>
										</div>
									))
								) : (
									<p className="text-[color:var(--marketing-fg)]/50 text-xs">
										Couldn't reach health endpoint.{" "}
										<span className="font-mono">{entry.url}</span>
									</p>
								)}
							</div>
						</article>
					);
				})}
			</section>

			<section className="mt-12 rounded-xl border border-[color:var(--marketing-line)] border-dashed p-8 text-[color:var(--marketing-fg)]/60">
				<h2 className="font-display text-2xl tracking-tight">
					Incident history
				</h2>
				<p className="mt-2 text-sm">
					Nothing to report. Past incidents will appear here once we wire the
					archive in a follow-up.
				</p>
			</section>

			<footer className="mt-12 font-mono text-[color:var(--marketing-muted)] text-xs">
				Snapshot taken {new Date().toISOString()}. Refreshes every 30s.
			</footer>
		</main>
	);
}
