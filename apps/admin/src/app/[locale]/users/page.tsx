import { db } from "@vibestack/db";
import { user } from "@vibestack/db/schema/auth";
import { Avatar, AvatarFallback } from "@vibestack/ui/components/avatar";
import { Badge } from "@vibestack/ui/components/badge";
import { Button } from "@vibestack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import { EmptyState } from "@vibestack/ui/components/empty-state";
import { Input } from "@vibestack/ui/components/input";
import { PageHeader } from "@vibestack/ui/components/page-header";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@vibestack/ui/components/table";
import { desc } from "drizzle-orm";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/require-admin";
import { UserActionsMenu } from "./_user-actions-menu";

function initialsOf(name: string | null, email: string) {
	const src = name || email;
	return src
		.split(" ")
		.map((s) => s[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export default async function UsersPage() {
	const session = await requireAdmin();
	const rows = await db
		.select()
		.from(user)
		.orderBy(desc(user.createdAt))
		.limit(200);

	return (
		<>
			<PageHeader
				title="Users"
				description={`${rows.length} users (showing latest 200).`}
				actions={
					<div className="flex items-center gap-2">
						<div className="relative">
							<Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search users…"
								className="w-64 pl-8"
								disabled
							/>
						</div>
						<Button variant="outline">Export CSV</Button>
					</div>
				}
			/>

			<Card>
				<CardHeader className="border-b">
					<CardTitle className="text-base">All users</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{rows.length === 0 ? (
						<EmptyState
							illustration="stack"
							title="No users yet"
							description="Every sign-up appears here. The first user to register gets routed to /onboarding — see #29 for the wizard."
							className="border-0 bg-transparent py-12"
						/>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Joined</TableHead>
									<TableHead className="w-12" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((u) => (
									<TableRow key={u.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-9 w-9">
													<AvatarFallback>
														{initialsOf(u.name, u.email)}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-medium">{u.name}</div>
													<div className="text-muted-foreground text-xs">
														{u.email}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											{u.banned ? (
												<Badge variant="destructive">Banned</Badge>
											) : u.emailVerified ? (
												<Badge>Verified</Badge>
											) : (
												<Badge variant="secondary">Unverified</Badge>
											)}
										</TableCell>
										<TableCell>
											<span className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
												{u.role ?? "user"}
											</span>
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{new Date(u.createdAt).toLocaleDateString(undefined, {
												dateStyle: "medium",
											})}
										</TableCell>
										<TableCell>
											<UserActionsMenu
												row={{
													id: u.id,
													email: u.email,
													name: u.name,
													role: u.role,
													banned: u.banned,
												}}
												currentUserId={session.user.id}
											/>
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
