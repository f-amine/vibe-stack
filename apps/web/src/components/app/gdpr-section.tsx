"use client";

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@vibestack/ui/components/alert";
import { Button } from "@vibestack/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@vibestack/ui/components/dialog";
import { Input } from "@vibestack/ui/components/input";
import { Label } from "@vibestack/ui/components/label";
import { AlertCircle, Download, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
	cancelDeletionAction,
	exportMyDataAction,
	pendingDeletionState,
	scheduleDeletionAction,
} from "@/app/(app)/dashboard/security/_gdpr-actions";

export function GdprSection() {
	const [exporting, setExporting] = React.useState(false);
	const [deleteOpen, setDeleteOpen] = React.useState(false);
	const [confirmation, setConfirmation] = React.useState("");
	const [reason, setReason] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [scheduledAt, setScheduledAt] = React.useState<string | null>(null);

	React.useEffect(() => {
		void pendingDeletionState().then((s) => setScheduledAt(s.scheduledAt));
	}, []);

	const exportMine = async () => {
		setExporting(true);
		const toastId = toast.loading("Building your export…");
		try {
			const result = await exportMyDataAction();
			if (!result.ok) {
				toast.error("Couldn't export", {
					id: toastId,
					description: result.error,
				});
				return;
			}
			toast.success("Export ready — emailed to you", { id: toastId });
			if (result.data?.url) {
				window.open(result.data.url, "_blank", "noopener,noreferrer");
			}
		} finally {
			setExporting(false);
		}
	};

	const schedule = async () => {
		setSubmitting(true);
		const toastId = toast.loading("Scheduling deletion…");
		try {
			const result = await scheduleDeletionAction({
				confirmation,
				reason: reason || undefined,
			});
			if (!result.ok) {
				toast.error("Couldn't schedule", {
					id: toastId,
					description: result.error,
				});
				return;
			}
			toast.success("Scheduled — cancel anytime in the next 7 days", {
				id: toastId,
			});
			setScheduledAt(result.data?.scheduledAt ?? null);
			setDeleteOpen(false);
			setConfirmation("");
			setReason("");
		} finally {
			setSubmitting(false);
		}
	};

	const cancel = async () => {
		const toastId = toast.loading("Canceling deletion…");
		const result = await cancelDeletionAction();
		if (!result.ok) {
			toast.error("Couldn't cancel", {
				id: toastId,
				description: result.error,
			});
			return;
		}
		toast.success("Deletion canceled", { id: toastId });
		setScheduledAt(null);
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Download className="h-4 w-4" />
						Export my data
					</CardTitle>
					<CardDescription>
						We'll generate a JSON archive with your profile, memberships,
						billing, and audit history. The download link is valid for 24 hours.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" onClick={exportMine} disabled={exporting}>
						{exporting ? "Generating…" : "Request export"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base text-destructive">
						<Trash2 className="h-4 w-4" />
						Delete my account
					</CardTitle>
					<CardDescription>
						We hold your data for 7 days before permanent deletion. Sign-in is
						revoked immediately on confirmation; you can cancel any time during
						the grace period.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3">
					{scheduledAt ? (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Deletion scheduled</AlertTitle>
							<AlertDescription>
								Permanent purge at{" "}
								<strong>{new Date(scheduledAt).toLocaleString()}</strong>.
								Cancel below if you change your mind.
							</AlertDescription>
						</Alert>
					) : null}
					<div className="flex flex-wrap gap-2">
						<Button
							variant={scheduledAt ? "outline" : "destructive"}
							onClick={() => setDeleteOpen(true)}
							disabled={Boolean(scheduledAt)}
						>
							Delete my account
						</Button>
						{scheduledAt ? (
							<Button variant="outline" onClick={cancel}>
								Cancel deletion
							</Button>
						) : null}
					</div>
				</CardContent>
			</Card>

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm account deletion</DialogTitle>
						<DialogDescription>
							Type <code>DELETE my account</code> below to confirm. All your
							data will be permanently removed after 7 days.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3">
						<div className="grid gap-1.5">
							<Label htmlFor="confirm-phrase">Confirmation phrase</Label>
							<Input
								id="confirm-phrase"
								value={confirmation}
								onChange={(e) => setConfirmation(e.target.value)}
								placeholder="DELETE my account"
								disabled={submitting}
								autoFocus
							/>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="reason">Reason (optional)</Label>
							<Input
								id="reason"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="Helps us improve"
								disabled={submitting}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setDeleteOpen(false)}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={schedule}
							disabled={submitting || confirmation !== "DELETE my account"}
						>
							{submitting ? "Scheduling…" : "Schedule deletion"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
