"use client";

import { Switch } from "@starter-saas/ui/components/switch";
import * as React from "react";
import { toast } from "sonner";

import { toggleFlagAction } from "./_actions";

type Props = {
	id: number;
	keyName: string;
	active: boolean;
};

export function FlagToggle({ id, keyName, active }: Props) {
	const [busy, setBusy] = React.useState(false);
	const [checked, setChecked] = React.useState(active);

	const handle = async (next: boolean) => {
		setBusy(true);
		const previous = checked;
		setChecked(next);
		const toastId = toast.loading(
			`${next ? "Enabling" : "Disabling"} ${keyName}…`,
		);
		try {
			const result = await toggleFlagAction({ id, active: next, key: keyName });
			if (!result.ok) {
				setChecked(previous);
				toast.error("Couldn't update flag", {
					id: toastId,
					description: result.error,
				});
				return;
			}
			toast.success(`${next ? "Enabled" : "Disabled"} ${keyName}`, {
				id: toastId,
			});
		} catch (err) {
			setChecked(previous);
			toast.error("Couldn't update flag", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		} finally {
			setBusy(false);
		}
	};

	return (
		<Switch
			checked={checked}
			onCheckedChange={(v) => handle(Boolean(v))}
			disabled={busy}
			aria-label={`Toggle ${keyName}`}
		/>
	);
}
