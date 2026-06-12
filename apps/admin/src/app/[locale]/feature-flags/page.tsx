import { listFlags } from "@vibestack/feature-flags/admin";
import { Badge } from "@vibestack/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import { EmptyState } from "@vibestack/ui/components/empty-state";
import { PageHeader } from "@vibestack/ui/components/page-header";
import { AlertCircle, Flag } from "lucide-react";
import { requireAdmin } from "@/lib/require-admin";

import { FlagToggle } from "./_flag-toggle";

export const dynamic = "force-dynamic";

export default async function FeatureFlagsPage() {
	await requireAdmin();
	const result = await listFlags();

	return (
		<>
			<PageHeader
				title="Feature flags"
				description="Read live from your PostHog project. Toggling here persists via the PostHog admin API."
			/>

			{result.status === "unconfigured" ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<AlertCircle className="h-4 w-4 text-amber-500" />
							PostHog admin not configured
						</CardTitle>
						<CardDescription>
							Set <code>POSTHOG_PERSONAL_API_KEY</code> and{" "}
							<code>POSTHOG_PROJECT_ID</code> in <code>.env</code> to surface
							flags here.
						</CardDescription>
					</CardHeader>
				</Card>
			) : result.status === "error" ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<AlertCircle className="h-4 w-4 text-destructive" />
							Couldn't load flags
						</CardTitle>
						<CardDescription>{result.message}</CardDescription>
					</CardHeader>
				</Card>
			) : result.flags.length === 0 ? (
				<EmptyState
					illustration="grid"
					title="No feature flags yet"
					description="Create one in your PostHog project and it'll appear here. The shipped client + server helpers default to false for unknown flags so it's safe to push code before a flag exists."
				/>
			) : (
				<div className="grid gap-3">
					{result.flags.map((flag) => (
						<Card key={flag.id}>
							<CardHeader className="flex flex-row items-center justify-between gap-4">
								<div className="min-w-0">
									<CardTitle className="flex items-center gap-2 text-base">
										<Flag className="h-4 w-4 text-muted-foreground" />
										<span className="truncate">{flag.name}</span>
									</CardTitle>
									<CardDescription className="font-mono text-xs">
										{flag.key}
										{flag.variants.length > 0 ? (
											<span className="ml-2 inline-flex items-center gap-1">
												{flag.variants.map((v) => (
													<Badge
														key={v.key}
														variant="secondary"
														className="font-mono text-[10px] uppercase tracking-widest"
													>
														{v.key}
														{typeof v.rolloutPercentage === "number"
															? ` · ${v.rolloutPercentage}%`
															: null}
													</Badge>
												))}
											</span>
										) : typeof flag.rolloutPercentage === "number" ? (
											<span className="ml-2 font-mono text-muted-foreground">
												· {flag.rolloutPercentage}%
											</span>
										) : null}
									</CardDescription>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant={flag.active ? "default" : "outline"}>
										{flag.active ? "Active" : "Off"}
									</Badge>
									<FlagToggle
										id={flag.id}
										keyName={flag.key}
										active={flag.active}
									/>
								</div>
							</CardHeader>
							{flag.createdAt ? (
								<CardContent className="pt-0 text-muted-foreground text-xs">
									Created {new Date(flag.createdAt).toLocaleDateString()}
								</CardContent>
							) : null}
						</Card>
					))}
				</div>
			)}
		</>
	);
}
