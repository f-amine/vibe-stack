"use client";

import { Avatar, AvatarFallback } from "@vibestack/ui/components/avatar";
import { Badge } from "@vibestack/ui/components/badge";
import { Button, buttonVariants } from "@vibestack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import { EmptyState } from "@vibestack/ui/components/empty-state";
import { Input } from "@vibestack/ui/components/input";
import { Label } from "@vibestack/ui/components/label";
import { PageHeader } from "@vibestack/ui/components/page-header";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vibestack/ui/components/select";
import { Skeleton } from "@vibestack/ui/components/skeleton";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

type Role = "owner" | "admin" | "member";

type Member = {
	id: string;
	role: Role;
	user: { id: string; name: string | null; email: string };
};

type Invitation = {
	id: string;
	email: string;
	role: Role;
	status: "pending" | "accepted" | "expired" | "canceled";
	expiresAt: string;
};

type OrgDetail = {
	id: string;
	name: string;
	slug?: string | null;
	members?: Member[];
	invitations?: Invitation[];
};

type Props = {
	params: Promise<{ id: string }>;
};

export default function OrgDetailPage({ params }: Props) {
	const { id } = use(params);
	const [org, setOrg] = useState<OrgDetail | null>(null);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState<Role>("member");
	const [inviting, setInviting] = useState(false);

	const load = async () => {
		try {
			const res = await authClient.organization.getFullOrganization({
				query: { organizationId: id },
			});
			setOrg((res?.data as unknown as OrgDetail | null) ?? null);
		} catch (err) {
			toast.error(formatError(err as Error, "Couldn't load organization"));
			setOrg(null);
		}
	};

	useEffect(() => {
		void load();
	}, [id]);

	const invite = async () => {
		const email = inviteEmail.trim();
		if (!email) {
			toast.error("Enter an email");
			return;
		}
		setInviting(true);
		const toastId = toast.loading(`Inviting ${email}…`);
		try {
			const { error } = await authClient.organization.inviteMember({
				email,
				role: inviteRole,
				organizationId: id,
			});
			if (error) {
				toast.error(formatError(error, "Couldn't invite"), { id: toastId });
				return;
			}
			toast.success(`Invited ${email}`, { id: toastId });
			setInviteEmail("");
			await load();
		} finally {
			setInviting(false);
		}
	};

	const removeMember = async (memberId: string) => {
		if (!confirm("Remove this member from the organization?")) {
			return;
		}
		const toastId = toast.loading("Removing member…");
		try {
			const { error } = await authClient.organization.removeMember({
				memberIdOrEmail: memberId,
				organizationId: id,
			});
			if (error) {
				toast.error(formatError(error, "Couldn't remove"), { id: toastId });
				return;
			}
			toast.success("Member removed", { id: toastId });
			await load();
		} catch (err) {
			toast.error(formatError(err as Error, "Couldn't remove"), {
				id: toastId,
			});
		}
	};

	const cancelInvitation = async (invitationId: string) => {
		const toastId = toast.loading("Cancelling invitation…");
		try {
			const { error } = await authClient.organization.cancelInvitation({
				invitationId,
			});
			if (error) {
				toast.error(formatError(error, "Couldn't cancel"), { id: toastId });
				return;
			}
			toast.success("Invitation cancelled", { id: toastId });
			await load();
		} catch (err) {
			toast.error(formatError(err as Error, "Couldn't cancel"), {
				id: toastId,
			});
		}
	};

	if (org === null) {
		return (
			<>
				<PageHeader
					bordered
					title="Loading…"
					description="Fetching organization."
				/>
				<div className="grid gap-3">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-32" />
				</div>
			</>
		);
	}

	const pendingInvitations =
		org.invitations?.filter((i) => i.status === "pending") ?? [];

	return (
		<>
			<PageHeader
				bordered
				title={org.name}
				description={`${org.slug ?? "—"} · ${org.members?.length ?? 0} member${
					(org.members?.length ?? 0) === 1 ? "" : "s"
				}${pendingInvitations.length > 0 ? ` · ${pendingInvitations.length} pending invite` : ""}`}
				actions={
					<Link
						href={{ pathname: "/dashboard/organizations" }}
						className={buttonVariants({ variant: "outline" })}
					>
						← Back
					</Link>
				}
			/>

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Invite by email</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"
							onSubmit={(e) => {
								e.preventDefault();
								void invite();
							}}
						>
							<div className="grid gap-1.5">
								<Label htmlFor="invite-email" className="sr-only">
									Email
								</Label>
								<Input
									id="invite-email"
									type="email"
									autoComplete="email"
									value={inviteEmail}
									onChange={(e) => setInviteEmail(e.target.value)}
									placeholder="teammate@example.com"
									disabled={inviting}
								/>
							</div>
							<Select
								value={inviteRole}
								onValueChange={(v) => setInviteRole(v as Role)}
								disabled={inviting}
							>
								<SelectTrigger>
									<SelectValue placeholder="Role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="member">Member</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="owner">Owner</SelectItem>
								</SelectContent>
							</Select>
							<Button type="submit" disabled={inviting}>
								{inviting ? "Sending…" : "Send invite"}
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="border-b">
						<CardTitle className="text-base">
							Members ({org.members?.length ?? 0})
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{(org.members ?? []).length === 0 ? (
							<EmptyState
								illustration="orbits"
								title="No members"
								description="Invite teammates by email — they'll get a magic-link invitation."
								className="border-0 bg-transparent py-12"
							/>
						) : (
							<ul className="divide-y">
								{org.members?.map((m) => (
									<li key={m.id} className="flex items-center gap-3 px-6 py-4">
										<Avatar className="h-9 w-9">
											<AvatarFallback>
												{(m.user.name ?? m.user.email)
													.split(" ")
													.map((s) => s[0])
													.slice(0, 2)
													.join("")
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1">
											<p className="font-medium text-sm">
												{m.user.name ?? m.user.email}
											</p>
											<p className="text-muted-foreground text-xs">
												{m.user.email}
											</p>
										</div>
										<Badge variant="secondary" className="capitalize">
											{m.role}
										</Badge>
										{m.role !== "owner" ? (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => removeMember(m.id)}
												className="text-destructive hover:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
												<span className="sr-only">Remove</span>
											</Button>
										) : null}
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				{pendingInvitations.length > 0 ? (
					<Card>
						<CardHeader className="border-b">
							<CardTitle className="text-base">
								Pending invitations ({pendingInvitations.length})
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<ul className="divide-y">
								{pendingInvitations.map((inv) => (
									<li
										key={inv.id}
										className="flex items-center gap-3 px-6 py-4"
									>
										<div className="flex-1">
											<p className="font-medium text-sm">{inv.email}</p>
											<p className="text-muted-foreground text-xs">
												Expires {new Date(inv.expiresAt).toLocaleDateString()}
											</p>
										</div>
										<Badge variant="outline" className="capitalize">
											{inv.role}
										</Badge>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => cancelInvitation(inv.id)}
										>
											Cancel
										</Button>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				) : null}
			</div>
		</>
	);
}
