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
import { Input } from "@starter-saas/ui/components/input";
import { Label } from "@starter-saas/ui/components/label";
import * as React from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

const SLUG_RE = /[^a-z0-9-]+/g;

function slugify(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFKD")
		.replace(SLUG_RE, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

type Props = {
	open: boolean;
	onOpenChange: (next: boolean) => void;
	onCreated: () => void;
};

export function CreateOrgDialog({ open, onOpenChange, onCreated }: Props) {
	const [name, setName] = React.useState("");
	const [slug, setSlug] = React.useState("");
	const [slugTouched, setSlugTouched] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);

	const effectiveSlug = slugTouched ? slug : slugify(name);

	const submit = async () => {
		const trimmedName = name.trim();
		const finalSlug = effectiveSlug.trim();
		if (trimmedName.length < 2) {
			toast.error("Pick a name with at least 2 characters");
			return;
		}
		if (finalSlug.length < 2) {
			toast.error("Slug needs at least 2 characters (letters, digits, dashes)");
			return;
		}
		setSubmitting(true);
		const toastId = toast.loading("Creating organization…");
		try {
			const { error } = await authClient.organization.create({
				name: trimmedName,
				slug: finalSlug,
			});
			if (error) {
				toast.error(formatError(error, "Couldn't create organization"), {
					id: toastId,
				});
				return;
			}
			toast.success(`Created ${trimmedName}`, { id: toastId });
			setName("");
			setSlug("");
			setSlugTouched(false);
			onOpenChange(false);
			onCreated();
		} catch (err) {
			toast.error(formatError(err as Error, "Couldn't create organization"), {
				id: toastId,
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New organization</DialogTitle>
					<DialogDescription>
						Organizations group teammates, billing, and audit history. You can
						switch between them from the workspace switcher.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-2">
					<div className="grid gap-2">
						<Label htmlFor="org-name">Name</Label>
						<Input
							id="org-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Acme Robotics"
							disabled={submitting}
							autoFocus
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="org-slug">Slug</Label>
						<Input
							id="org-slug"
							value={effectiveSlug}
							onChange={(e) => {
								setSlugTouched(true);
								setSlug(e.target.value.toLowerCase());
							}}
							placeholder="acme-robotics"
							disabled={submitting}
						/>
						<p className="text-muted-foreground text-xs">
							Used in URLs and email tags. Auto-derived from name unless edited.
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button onClick={submit} disabled={submitting}>
						{submitting ? "Creating…" : "Create organization"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
