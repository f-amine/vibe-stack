"use client";

import { Badge } from "@vibestack/ui/components/badge";
import { Button } from "@vibestack/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import { EmptyState } from "@vibestack/ui/components/empty-state";
import { Label } from "@vibestack/ui/components/label";
import { Skeleton } from "@vibestack/ui/components/skeleton";
import { Switch } from "@vibestack/ui/components/switch";
import {
	KeyRound,
	Laptop,
	LogOut,
	ShieldCheck,
	Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GdprSection } from "@/components/app/gdpr-section";
import { PasskeySection } from "@/components/app/passkey-section";
import { isFeatureEnabled } from "@/config/features";
import { authClient } from "@/lib/auth-client";

type SessionRow = {
	id: string;
	userAgent?: string | null;
	ipAddress?: string | null;
	createdAt: string | Date;
	current?: boolean;
};

export function SecuritySection() {
	const { data } = authClient.useSession();
	const twoFA = Boolean(
		(data?.user as { twoFactorEnabled?: boolean })?.twoFactorEnabled,
	);
	const [sessions, setSessions] = useState<SessionRow[] | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const res = await authClient.listSessions();
				setSessions(((res?.data as unknown as SessionRow[]) ?? []).slice(0, 6));
			} catch {
				setSessions([]);
			}
		})();
	}, []);

	const revoke = async (id: string) => {
		try {
			await authClient.revokeSession({ token: id });
			toast.success("Session revoked");
			setSessions((s) => s?.filter((x) => x.id !== id) ?? null);
		} catch (err) {
			toast.error("Couldn't revoke", {
				description: err instanceof Error ? err.message : "?",
			});
		}
	};

	return (
		<div className="grid gap-6">
			{isFeatureEnabled("twoFactor") ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ShieldCheck className="h-5 w-5" />
							Two-factor authentication
						</CardTitle>
						<CardDescription>
							Require a one-time code in addition to your password.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex items-center justify-between">
						<Label htmlFor="2fa" className="text-sm">
							{twoFA ? "Enabled" : "Disabled"}
						</Label>
						<Switch
							id="2fa"
							checked={twoFA}
							onCheckedChange={(next) => {
								toast.info(
									next
										? "2FA setup flow — wire to /security/2fa wizard"
										: "Disabling 2FA — wire confirmation modal",
								);
							}}
						/>
					</CardContent>
				</Card>
			) : null}

			{isFeatureEnabled("passkeys") ? <PasskeySection /> : null}

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<KeyRound className="h-5 w-5" />
						Password
					</CardTitle>
					<CardDescription>
						Change your password — you'll be signed out everywhere else.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline">Change password</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<LogOut className="h-5 w-5" />
						Active sessions
					</CardTitle>
					<CardDescription>
						Devices currently signed in to your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{sessions !== null && sessions.length === 0 ? (
						<EmptyState
							illustration="arc"
							title="No other devices signed in"
							description="When you sign in from another browser or device, it'll appear here so you can revoke it."
							className="border-0 bg-transparent py-8"
						/>
					) : null}
					<ul className="divide-y">
						{sessions === null
							? Array.from({ length: 3 }).map((_, i) => (
									<li key={i} className="flex items-center gap-3 py-4">
										<Skeleton className="h-9 w-9 rounded-md" />
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-48" />
											<Skeleton className="h-3 w-32" />
										</div>
									</li>
								))
							: sessions.map((s) => {
									const ua = s.userAgent ?? "";
									const isMobile = /Mobile|Android|iPhone/i.test(ua);
									const Icon = isMobile ? Smartphone : Laptop;
									return (
										<li key={s.id} className="flex items-center gap-3 py-4">
											<div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
												<Icon className="h-4 w-4" />
											</div>
											<div className="flex-1">
												<p className="font-medium text-sm">
													{isMobile ? "Mobile" : "Desktop"}
													{s.current && (
														<Badge variant="secondary" className="ml-2">
															This device
														</Badge>
													)}
												</p>
												<p className="text-muted-foreground text-xs">
													{s.ipAddress ?? "—"} ·{" "}
													{new Date(s.createdAt).toLocaleString()}
												</p>
											</div>
											{!s.current && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => revoke(s.id)}
												>
													Revoke
												</Button>
											)}
										</li>
									);
								})}
					</ul>
				</CardContent>
			</Card>

			{isFeatureEnabled("gdpr") ? <GdprSection /> : null}
		</div>
	);
}
