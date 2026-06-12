"use client";

import { Avatar, AvatarFallback } from "@vibestack/ui/components/avatar";
import { Button, buttonVariants } from "@vibestack/ui/components/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import { EmptyState } from "@vibestack/ui/components/empty-state";
import { PageHeader } from "@vibestack/ui/components/page-header";
import { Skeleton } from "@vibestack/ui/components/skeleton";
import { CheckCircle2, Plus, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

import { CreateOrgDialog } from "./_create-dialog";

type Org = {
	id: string;
	name: string;
	slug?: string | null;
	createdAt?: string | Date;
};

export default function OrgsPage() {
	const [orgs, setOrgs] = useState<Org[] | null>(null);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [switching, setSwitching] = useState<string | null>(null);

	const load = async () => {
		try {
			const [orgsRes, sessionRes] = await Promise.all([
				authClient.organization.list(),
				authClient.getSession(),
			]);
			setOrgs((orgsRes?.data as unknown as Org[]) ?? []);
			const session = sessionRes?.data as {
				session?: { activeOrganizationId?: string | null };
			} | null;
			setActiveId(session?.session?.activeOrganizationId ?? null);
		} catch {
			setOrgs([]);
			setActiveId(null);
		}
	};

	useEffect(() => {
		void load();
	}, []);

	const onSwitch = async (org: Org) => {
		if (switching) {
			return;
		}
		setSwitching(org.id);
		const toastId = toast.loading(`Switching to ${org.name}…`);
		try {
			const { error } = await authClient.organization.setActive({
				organizationId: org.id,
			});
			if (error) {
				toast.error(formatError(error, "Couldn't switch"), { id: toastId });
				return;
			}
			toast.success(`Active workspace: ${org.name}`, { id: toastId });
			setActiveId(org.id);
		} finally {
			setSwitching(null);
		}
	};

	return (
		<>
			<PageHeader
				bordered
				title="Organizations"
				description="Workspaces you own or belong to."
				actions={
					<Button onClick={() => setCreateOpen(true)}>
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
					<div className="md:col-span-2 lg:col-span-3">
						<EmptyState
							illustration="orbits"
							title="You're flying solo"
							description="Create your first organization to invite teammates, manage shared billing, and split work into clean workspaces."
							action={
								<Button onClick={() => setCreateOpen(true)}>
									<Plus className="mr-1.5 h-4 w-4" />
									Create organization
								</Button>
							}
							secondaryAction={
								<Link
									href={{ pathname: "/dashboard/organizations" }}
									className={`${buttonVariants({ variant: "ghost", size: "sm" })} gap-2`}
								>
									<UsersRound className="h-4 w-4" /> Learn about orgs
								</Link>
							}
						/>
					</div>
				) : (
					orgs.map((o) => {
						const isActive = activeId === o.id;
						const isSwitching = switching === o.id;
						return (
							<Card
								key={o.id}
								className={`relative ${isActive ? "border-foreground" : ""}`}
							>
								{isActive ? (
									<div className="absolute top-3 right-3 inline-flex items-center gap-1 font-mono text-emerald-500 text-xs">
										<CheckCircle2 className="h-3.5 w-3.5" /> Active
									</div>
								) : null}
								<CardHeader>
									<Avatar className="h-12 w-12 rounded-lg">
										<AvatarFallback className="rounded-lg font-semibold">
											{o.name.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<CardTitle className="mt-3">{o.name}</CardTitle>
									<CardDescription>{o.slug ?? "—"}</CardDescription>
									<div className="mt-4 flex items-center gap-2">
										<Link
											href={{
												pathname: `/dashboard/organizations/${o.id}`,
											}}
											className={buttonVariants({
												variant: "outline",
												size: "sm",
											})}
										>
											Manage
										</Link>
										{!isActive ? (
											<Button
												size="sm"
												onClick={() => onSwitch(o)}
												disabled={Boolean(switching)}
											>
												{isSwitching ? "Switching…" : "Switch to"}
											</Button>
										) : null}
									</div>
								</CardHeader>
							</Card>
						);
					})
				)}
			</div>

			<CreateOrgDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={() => void load()}
			/>
		</>
	);
}
