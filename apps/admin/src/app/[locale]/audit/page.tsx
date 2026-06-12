import { db } from "@vibestack/db";
import { auditLog } from "@vibestack/db/schema/audit";
import { Badge } from "@vibestack/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import { EmptyState } from "@vibestack/ui/components/empty-state";
import { PageHeader } from "@vibestack/ui/components/page-header";
import { desc } from "drizzle-orm";

const ACTION_VARIANT: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	"user.signin": "secondary",
	"user.signout": "outline",
	"user.banned": "destructive",
	"user.role.changed": "default",
};

export default async function AuditPage() {
	const rows = await db
		.select()
		.from(auditLog)
		.orderBy(desc(auditLog.createdAt))
		.limit(200);

	return (
		<>
			<PageHeader
				title="Audit log"
				description={`${rows.length} events (latest 200).`}
			/>

			<Card>
				<CardHeader className="border-b">
					<CardTitle className="text-base">Activity feed</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{rows.length === 0 ? (
						<EmptyState
							illustration="grid"
							title="No audit events yet"
							description="The audit log records every consequential action — bans, role changes, sign-ins, billing events. It'll start populating the moment your app writes its first row."
							className="border-0 bg-transparent py-12"
						/>
					) : (
						<ul className="divide-y">
							{rows.map((r) => (
								<li
									key={r.id}
									className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
								>
									<div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
									<div className="flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant={ACTION_VARIANT[r.action] ?? "outline"}>
												{r.action}
											</Badge>
											{r.targetType && (
												<span className="font-mono text-muted-foreground text-xs">
													{r.targetType}#{r.targetId ?? "—"}
												</span>
											)}
										</div>
										<div className="mt-1 text-muted-foreground text-xs">
											{r.actorUserId ? (
												<>
													actor{" "}
													<span className="font-mono">{r.actorUserId}</span>
												</>
											) : (
												"system"
											)}
											{r.ipAddress && <> · {r.ipAddress}</>}
										</div>
									</div>
									<time
										dateTime={r.createdAt.toISOString()}
										className="text-muted-foreground text-xs"
									>
										{new Date(r.createdAt).toLocaleString()}
									</time>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</>
	);
}
