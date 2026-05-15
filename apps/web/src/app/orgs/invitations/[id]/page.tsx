"use client";

import { buttonVariants } from "@starter-saas/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { Skeleton } from "@starter-saas/ui/components/skeleton";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

type Invitation = {
	id: string;
	email: string;
	role: "owner" | "admin" | "member";
	status: "pending" | "accepted" | "expired" | "canceled";
	expiresAt: string;
	organizationName?: string | null;
	organizationSlug?: string | null;
};

type Props = {
	params: Promise<{ id: string }>;
};

export default function AcceptInvitationPage({ params }: Props) {
	const { id } = use(params);
	const router = useRouter();
	const [invitation, setInvitation] = useState<Invitation | null | undefined>(
		undefined,
	);
	const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const res = await authClient.organization.getInvitation({
					query: { id },
				});
				setInvitation((res?.data as unknown as Invitation | null) ?? null);
			} catch {
				setInvitation(null);
			}
		})();
	}, [id]);

	const accept = async () => {
		setBusy("accept");
		const toastId = toast.loading("Joining organization…");
		try {
			const { error } = await authClient.organization.acceptInvitation({
				invitationId: id,
			});
			if (error) {
				toast.error(formatError(error, "Couldn't accept"), { id: toastId });
				return;
			}
			toast.success("Joined the organization", { id: toastId });
			router.push("/dashboard/organizations");
		} finally {
			setBusy(null);
		}
	};

	const decline = async () => {
		setBusy("decline");
		const toastId = toast.loading("Declining…");
		try {
			const { error } = await authClient.organization.rejectInvitation({
				invitationId: id,
			});
			if (error) {
				toast.error(formatError(error, "Couldn't decline"), { id: toastId });
				return;
			}
			toast.success("Invitation declined", { id: toastId });
			router.push("/dashboard/organizations");
		} finally {
			setBusy(null);
		}
	};

	const renderBody = () => {
		if (invitation === undefined) {
			return (
				<div className="space-y-3 py-6">
					<Skeleton className="h-5 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
				</div>
			);
		}

		if (invitation === null) {
			return (
				<div className="flex flex-col items-center py-6 text-center">
					<XCircle className="h-10 w-10 text-destructive" aria-hidden />
					<p className="mt-3 font-semibold">Invitation not found</p>
					<p className="mt-1 text-muted-foreground text-sm">
						This link may be expired, cancelled, or addressed to a different
						account.
					</p>
				</div>
			);
		}

		if (invitation.status !== "pending") {
			return (
				<div className="flex flex-col items-center py-6 text-center">
					<XCircle className="h-10 w-10 text-muted-foreground" aria-hidden />
					<p className="mt-3 font-semibold capitalize">
						Already {invitation.status}
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Ask whoever invited you to send a fresh link.
					</p>
				</div>
			);
		}

		return (
			<div className="py-2">
				<div className="flex items-center justify-center gap-3">
					<CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden />
				</div>
				<p className="mt-4 text-center">
					You've been invited to join{" "}
					<strong>{invitation.organizationName ?? "an organization"}</strong> as{" "}
					<span className="capitalize">{invitation.role}</span>.
				</p>
				<p className="mt-2 text-center text-muted-foreground text-sm">
					Expires {new Date(invitation.expiresAt).toLocaleString()}.
				</p>
			</div>
		);
	};

	const pending = invitation?.status === "pending";

	return (
		<div className="grain relative min-h-dvh bg-background">
			<header className="mx-auto max-w-3xl px-6 py-8">
				<Link
					href="/"
					className="inline-flex items-center gap-2 font-semibold tracking-tight"
				>
					<span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs">
						S
					</span>
					<span>stack/saas</span>
				</Link>
			</header>

			<main className="mx-auto max-w-md px-6 pt-4 pb-20">
				<Card>
					<CardHeader>
						<CardTitle>You've got an invitation</CardTitle>
						<CardDescription>
							Confirm or decline below — you can change your mind later by
							asking for a new invitation.
						</CardDescription>
					</CardHeader>
					<CardContent>{renderBody()}</CardContent>
					<CardFooter className="flex flex-col gap-2 sm:flex-row">
						<button
							type="button"
							onClick={accept}
							disabled={!pending || busy !== null}
							className={`${buttonVariants()} w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}
						>
							{busy === "accept" ? "Joining…" : "Accept invitation"}
						</button>
						<button
							type="button"
							onClick={decline}
							disabled={!pending || busy !== null}
							className={`${buttonVariants({ variant: "outline" })} w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}
						>
							{busy === "decline" ? "Declining…" : "Decline"}
						</button>
					</CardFooter>
				</Card>
			</main>
		</div>
	);
}
