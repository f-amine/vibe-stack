"use client";

import { Badge } from "@starter-saas/ui/components/badge";
import { Button } from "@starter-saas/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@starter-saas/ui/components/dialog";
import { EmptyState } from "@starter-saas/ui/components/empty-state";
import { Input } from "@starter-saas/ui/components/input";
import { Label } from "@starter-saas/ui/components/label";
import { Skeleton } from "@starter-saas/ui/components/skeleton";
import { Copy, Key, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Row = {
	id: string;
	name: string;
	prefix: string;
	scopes: string[];
	lastUsedAt: string | null;
	expiresAt: string | null;
	revokedAt: string | null;
	createdAt: string;
};

type IssuedKey = {
	id: string;
	prefix: string;
	plaintext: string;
};

export function ApiKeysSection() {
	const [rows, setRows] = useState<Row[] | null>(null);
	const [newName, setNewName] = useState("");
	const [busy, setBusy] = useState(false);
	const [issued, setIssued] = useState<IssuedKey | null>(null);

	const load = async () => {
		try {
			const res = await fetch("/api/api-keys", { cache: "no-store" });
			if (!res.ok) {
				throw new Error(`status ${res.status}`);
			}
			const data = (await res.json()) as { rows: Row[] };
			setRows(data.rows);
		} catch (err) {
			toast.error("Couldn't load API keys", {
				description: err instanceof Error ? err.message : "?",
			});
			setRows([]);
		}
	};

	useEffect(() => {
		void load();
	}, []);

	const create = async () => {
		if (newName.trim().length < 1) {
			toast.error("Give the key a name");
			return;
		}
		setBusy(true);
		const toastId = toast.loading("Generating key…");
		try {
			const res = await fetch("/api/api-keys", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ name: newName.trim() }),
			});
			if (!res.ok) {
				const text = await res.text().catch(() => "");
				throw new Error(text || `status ${res.status}`);
			}
			const data = (await res.json()) as IssuedKey;
			setIssued(data);
			setNewName("");
			toast.success("Key created", { id: toastId });
			await load();
		} catch (err) {
			toast.error("Couldn't create key", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		} finally {
			setBusy(false);
		}
	};

	const revoke = async (row: Row) => {
		if (
			!confirm(`Revoke ${row.name}? Apps using this key will stop working.`)
		) {
			return;
		}
		const toastId = toast.loading("Revoking…");
		try {
			const res = await fetch(`/api/api-keys/${row.id}`, { method: "DELETE" });
			if (!res.ok) {
				throw new Error(`status ${res.status}`);
			}
			toast.success("Revoked", { id: toastId });
			await load();
		} catch (err) {
			toast.error("Couldn't revoke", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		}
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Generate a key</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						className="grid gap-3 sm:grid-cols-[1fr_auto]"
						onSubmit={(e) => {
							e.preventDefault();
							void create();
						}}
					>
						<div className="grid gap-1.5">
							<Label htmlFor="key-name" className="sr-only">
								Key name
							</Label>
							<Input
								id="key-name"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								placeholder="laptop-cli, ci-bot, etc."
								disabled={busy}
							/>
						</div>
						<Button type="submit" disabled={busy}>
							<Plus className="mr-1.5 h-4 w-4" /> Create
						</Button>
					</form>
				</CardContent>
			</Card>

			<div className="mt-6">
				{rows === null ? (
					<div className="grid gap-2">
						{Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				) : rows.length === 0 ? (
					<EmptyState
						illustration="grid"
						title="No keys yet"
						description="Generate your first key above. We show the full token once — you'll need to copy it then."
					/>
				) : (
					<ul className="divide-y rounded-lg border">
						{rows.map((row) => (
							<li key={row.id} className="flex items-center gap-3 px-4 py-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
									<Key className="h-4 w-4 text-muted-foreground" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-medium text-sm">{row.name}</p>
									<p className="font-mono text-muted-foreground text-xs">
										{row.prefix}…
									</p>
									<p className="text-muted-foreground text-xs">
										{row.lastUsedAt
											? `Last used ${new Date(row.lastUsedAt).toLocaleString()}`
											: "Never used"}
										{row.expiresAt
											? ` · expires ${new Date(row.expiresAt).toLocaleDateString()}`
											: ""}
									</p>
								</div>
								{row.revokedAt ? (
									<Badge variant="outline" className="capitalize">
										Revoked
									</Badge>
								) : (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => revoke(row)}
										className="text-destructive hover:text-destructive"
									>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only">Revoke</span>
									</Button>
								)}
							</li>
						))}
					</ul>
				)}
			</div>

			<IssuedKeyDialog
				keyData={issued}
				onOpenChange={(open) => {
					if (!open) {
						setIssued(null);
					}
				}}
			/>
		</>
	);
}

function IssuedKeyDialog({
	keyData,
	onOpenChange,
}: {
	keyData: IssuedKey | null;
	onOpenChange: (open: boolean) => void;
}) {
	const open = keyData !== null;
	const copy = async () => {
		if (!keyData) {
			return;
		}
		try {
			await navigator.clipboard.writeText(keyData.plaintext);
			toast.success("Copied");
		} catch {
			toast.error("Clipboard blocked — copy manually");
		}
	};
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Copy this key now</DialogTitle>
					<DialogDescription>
						We won't show it again. Store it somewhere safe — anyone with this
						token can act as you on the API.
					</DialogDescription>
				</DialogHeader>
				{keyData ? (
					<div className="grid gap-3">
						<div className="rounded-md border bg-muted/40 p-3 font-mono text-sm">
							{keyData.plaintext}
						</div>
						<Button type="button" onClick={copy} className="w-full">
							<Copy className="mr-1.5 h-4 w-4" />
							Copy to clipboard
						</Button>
					</div>
				) : null}
				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						I've stored it
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
