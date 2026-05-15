"use client";

import { Button } from "@starter-saas/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@starter-saas/ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@starter-saas/ui/components/dropdown-menu";
import { Input } from "@starter-saas/ui/components/input";
import { Label } from "@starter-saas/ui/components/label";
import {
	Ban,
	CheckCircle2,
	MoreHorizontal,
	ShieldOff,
	ShieldUser,
	UserCog,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
	banUserAction,
	impersonateUserAction,
	setRoleAction,
	unbanUserAction,
} from "./_actions";

type Row = {
	id: string;
	email: string;
	name: string | null;
	role: string | null;
	banned: boolean | null;
};

type Props = {
	row: Row;
	currentUserId: string;
};

export function UserActionsMenu({ row, currentUserId }: Props) {
	const [banOpen, setBanOpen] = React.useState(false);
	const [pending, setPending] = React.useState(false);
	const isSelf = row.id === currentUserId;

	const wrap = async (
		label: string,
		fn: () => Promise<{ ok: boolean; error?: string; redirectTo?: string }>,
	) => {
		if (pending) {
			return;
		}
		setPending(true);
		const toastId = toast.loading(`${label}…`);
		try {
			const result = await fn();
			if (!result.ok) {
				toast.error(label + " failed", {
					id: toastId,
					description: result.error ?? "?",
				});
				return;
			}
			toast.success(`${label} done`, { id: toastId });
			if (result.redirectTo) {
				window.location.href = result.redirectTo;
			}
		} catch (err) {
			toast.error(`${label} failed`, {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		} finally {
			setPending(false);
		}
	};

	const onUnban = () =>
		wrap("Unban", () => unbanUserAction({ userId: row.id }));
	const onPromote = () =>
		wrap("Promote to admin", () =>
			setRoleAction({ userId: row.id, role: "admin" }),
		);
	const onDemote = () =>
		wrap("Demote to user", () =>
			setRoleAction({ userId: row.id, role: "user" }),
		);
	const onImpersonate = () =>
		wrap("Impersonate", () => impersonateUserAction({ userId: row.id }));

	const isAdmin = row.role === "admin";

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button variant="ghost" size="icon" disabled={pending}>
							<MoreHorizontal className="h-4 w-4" />
							<span className="sr-only">Actions</span>
						</Button>
					}
				/>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuLabel className="truncate">
						{row.name ?? row.email}
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{isAdmin ? (
						<DropdownMenuItem onClick={onDemote} disabled={pending || isSelf}>
							<ShieldOff className="mr-2 h-4 w-4" />
							Demote to user
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem onClick={onPromote} disabled={pending}>
							<ShieldUser className="mr-2 h-4 w-4" />
							Promote to admin
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						onClick={onImpersonate}
						disabled={pending || isSelf}
					>
						<UserCog className="mr-2 h-4 w-4" />
						Impersonate
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					{row.banned ? (
						<DropdownMenuItem onClick={onUnban} disabled={pending}>
							<CheckCircle2 className="mr-2 h-4 w-4" />
							Unban
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem
							onClick={() => setBanOpen(true)}
							disabled={pending || isSelf}
							className="text-destructive focus:text-destructive"
						>
							<Ban className="mr-2 h-4 w-4" />
							Ban…
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			<BanDialog
				open={banOpen}
				onOpenChange={setBanOpen}
				userLabel={row.name ?? row.email}
				disabled={pending}
				onSubmit={async (reason, days) => {
					await wrap("Ban", () =>
						banUserAction({
							userId: row.id,
							reason,
							expiresInDays: days,
						}),
					);
					setBanOpen(false);
				}}
			/>
		</>
	);
}

function BanDialog({
	open,
	onOpenChange,
	userLabel,
	disabled,
	onSubmit,
}: {
	open: boolean;
	onOpenChange: (next: boolean) => void;
	userLabel: string;
	disabled: boolean;
	onSubmit: (reason: string, expiresInDays?: number) => Promise<void>;
}) {
	const [reason, setReason] = React.useState("");
	const [days, setDays] = React.useState("");

	const submit = async () => {
		const parsedDays = days.trim() === "" ? undefined : Number(days);
		if (parsedDays !== undefined && !Number.isFinite(parsedDays)) {
			toast.error("Duration must be a number of days or empty");
			return;
		}
		await onSubmit(reason.trim() || "Banned by admin", parsedDays);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Ban {userLabel}?</DialogTitle>
					<DialogDescription>
						All of their sessions will be revoked immediately. They'll see your
						reason on the sign-in page if they try to log back in.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-2">
					<div className="grid gap-2">
						<Label htmlFor="ban-reason">Reason</Label>
						<Input
							id="ban-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Repeated abuse reports"
							disabled={disabled}
							autoFocus
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="ban-days">Duration (days, blank = permanent)</Label>
						<Input
							id="ban-days"
							value={days}
							onChange={(e) => setDays(e.target.value)}
							inputMode="numeric"
							placeholder="e.g. 30"
							disabled={disabled}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={disabled}
					>
						Cancel
					</Button>
					<Button variant="destructive" onClick={submit} disabled={disabled}>
						Ban user
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
