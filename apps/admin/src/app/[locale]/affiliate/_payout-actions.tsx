"use client";

import { Button } from "@starter-saas/ui/components/button";
import * as React from "react";
import { toast } from "sonner";

import { decidePayoutAction } from "./_actions";

export function PayoutActions({ id }: { id: string }) {
	const [busy, setBusy] = React.useState(false);
	const decide = async (status: "approved" | "denied") => {
		setBusy(true);
		const toastId = toast.loading(
			`${status === "approved" ? "Approving" : "Denying"}…`,
		);
		try {
			const result = await decidePayoutAction({ id, status });
			if (!result.ok) {
				toast.error("Couldn't update", {
					id: toastId,
					description: result.error,
				});
				return;
			}
			toast.success(status === "approved" ? "Approved" : "Denied", {
				id: toastId,
			});
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className="flex justify-end gap-2">
			<Button
				size="sm"
				variant="ghost"
				onClick={() => decide("denied")}
				disabled={busy}
			>
				Deny
			</Button>
			<Button size="sm" onClick={() => decide("approved")} disabled={busy}>
				Approve
			</Button>
		</div>
	);
}
