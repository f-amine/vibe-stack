"use client";

import { Avatar, AvatarFallback } from "@starter-saas/ui/components/avatar";
import { Button } from "@starter-saas/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { Skeleton } from "@starter-saas/ui/components/skeleton";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { authClient } from "@/lib/auth-client";

type Org = {
	id: string;
	name: string;
	slug?: string | null;
	createdAt?: string | Date;
};

export default function OrgsPage() {
	const [orgs, setOrgs] = useState<Org[] | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const res = await authClient.organization.list();
				setOrgs((res?.data as unknown as Org[]) ?? []);
			} catch {
				setOrgs([]);
			}
		})();
	}, []);

	return (
		<>
			<PageHeader
				title="Organizations"
				description="Workspaces you own or belong to."
				actions={
					<Button>
						<Plus className="mr-1.5 h-4 w-4" />
						New org
					</Button>
				}
			/>

			<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
				{orgs === null ? (
					Array.from({ length: 3 }).map((_, i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-12 w-12 rounded-full" />
								<Skeleton className="mt-3 h-5 w-32" />
								<Skeleton className="mt-1.5 h-3 w-24" />
							</CardHeader>
						</Card>
					))
				) : orgs.length === 0 ? (
					<Card className="md:col-span-2 lg:col-span-3">
						<CardHeader>
							<CardTitle>You're solo</CardTitle>
							<CardDescription>
								Create your first organization to invite teammates.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button>
								<Plus className="mr-1.5 h-4 w-4" />
								Create organization
							</Button>
						</CardContent>
					</Card>
				) : (
					orgs.map((o) => (
						<Card key={o.id} className="cursor-pointer hover:bg-muted/30">
							<CardHeader>
								<Avatar className="h-12 w-12 rounded-lg">
									<AvatarFallback className="rounded-lg font-semibold">
										{o.name.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<CardTitle className="mt-3">{o.name}</CardTitle>
								<CardDescription>{o.slug ?? "—"}</CardDescription>
							</CardHeader>
						</Card>
					))
				)}
			</div>
		</>
	);
}
