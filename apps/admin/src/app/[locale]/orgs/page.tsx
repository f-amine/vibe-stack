import { db } from "@vibestack/db";
import { member, organization } from "@vibestack/db/schema/auth";
import { Avatar, AvatarFallback } from "@vibestack/ui/components/avatar";
import { Badge } from "@vibestack/ui/components/badge";
import {
	Card,
	CardContent,
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
import { desc, eq, count as sqlCount } from "drizzle-orm";
import { PageHeader } from "@/components/layout/page-header";

export default async function OrgsPage() {
	const orgs = await db
		.select({
			id: organization.id,
			name: organization.name,
			slug: organization.slug,
			createdAt: organization.createdAt,
			members: sqlCount(member.id),
		})
		.from(organization)
		.leftJoin(member, eq(member.organizationId, organization.id))
		.groupBy(organization.id)
		.orderBy(desc(organization.createdAt))
		.limit(200);

	return (
		<>
			<PageHeader
				title="Organizations"
				description={`${orgs.length} orgs (showing latest 200).`}
			/>

			<Card>
				<CardHeader className="border-b">
					<CardTitle className="text-base">All organizations</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{orgs.length === 0 ? (
						<EmptyState
							illustration="orbits"
							title="No organizations yet"
							description="Once users create workspaces, they'll show up here with member counts and creation dates."
							className="border-0 bg-transparent py-12"
						/>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Organization</TableHead>
									<TableHead>Slug</TableHead>
									<TableHead>Members</TableHead>
									<TableHead>Created</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orgs.map((o) => (
									<TableRow key={o.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-9 w-9 rounded-lg">
													<AvatarFallback className="rounded-lg">
														{o.name.slice(0, 2).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="font-medium">{o.name}</div>
											</div>
										</TableCell>
										<TableCell className="font-mono text-muted-foreground text-xs">
											{o.slug ?? "—"}
										</TableCell>
										<TableCell>
											<Badge variant="secondary">{Number(o.members)}</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{new Date(o.createdAt).toLocaleDateString(undefined, {
												dateStyle: "medium",
											})}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</>
	);
}
