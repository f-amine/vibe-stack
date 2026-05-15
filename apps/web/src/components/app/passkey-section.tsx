"use client";

import { Button } from "@vibestack/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import { EmptyState } from "@vibestack/ui/components/empty-state";
import { Skeleton } from "@vibestack/ui/components/skeleton";
import { Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type PasskeyRow = {
	id: string;
	name?: string | null;
	deviceType?: string | null;
	createdAt?: string | Date | null;
};

export function PasskeySection() {
	const [passkeys, setPasskeys] = useState<PasskeyRow[] | null>(null);
	const [enrolling, setEnrolling] = useState(false);

	const refresh = async () => {
		try {
			// Better Auth's passkey plugin exposes listUserPasskeys on the
			// `passkey` namespace of the client.
			const res = await authClient.passkey.listUserPasskeys();
			setPasskeys((res?.data ?? []) as PasskeyRow[]);
		} catch {
			setPasskeys([]);
		}
	};

	useEffect(() => {
		refresh();
	}, []);

	const enroll = async () => {
		setEnrolling(true);
		const id = toast.loading("Tap your security key or biometric sensor…");
		try {
			const result = await authClient.passkey.addPasskey();
			if (result?.error) {
				toast.error("Couldn't register passkey", {
					id,
					description: result.error.message,
				});
				return;
			}
			toast.success("Passkey registered", { id });
			await refresh();
		} catch (err) {
			toast.error("Couldn't register passkey", {
				id,
				description: err instanceof Error ? err.message : "?",
			});
		} finally {
			setEnrolling(false);
		}
	};

	const remove = async (passkeyId: string) => {
		try {
			await authClient.passkey.deletePasskey({ id: passkeyId });
			toast.success("Passkey removed");
			await refresh();
		} catch (err) {
			toast.error("Couldn't remove passkey", {
				description: err instanceof Error ? err.message : "?",
			});
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Fingerprint className="h-5 w-5" />
					Passkeys
				</CardTitle>
				<CardDescription>
					Sign in with Face ID, Touch ID, Windows Hello, or a hardware key —
					phishing-resistant, no password to forget.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{passkeys === null ? (
					<div className="space-y-2">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				) : passkeys.length === 0 ? (
					<EmptyState
						illustration="arc"
						title="No passkeys yet"
						description="Register one to skip passwords on this device next time you sign in."
						className="border-0 bg-transparent py-6"
					/>
				) : (
					<ul className="divide-y">
						{passkeys.map((pk) => (
							<li key={pk.id} className="flex items-center gap-3 py-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
									<Fingerprint className="h-4 w-4" />
								</div>
								<div className="flex-1">
									<p className="font-medium text-sm">
										{pk.name?.trim() || "Unnamed passkey"}
									</p>
									<p className="text-muted-foreground text-xs">
										{pk.deviceType ?? "—"}
										{pk.createdAt
											? ` · ${new Date(pk.createdAt).toLocaleDateString()}`
											: ""}
									</p>
								</div>
								<Button variant="ghost" size="sm" onClick={() => remove(pk.id)}>
									Remove
								</Button>
							</li>
						))}
					</ul>
				)}
				<Button onClick={enroll} disabled={enrolling}>
					{enrolling ? "Waiting for device…" : "Register a passkey"}
				</Button>
			</CardContent>
		</Card>
	);
}
