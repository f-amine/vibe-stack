"use client";

import { Badge } from "@vibestack/ui/components/badge";
import { Button } from "@vibestack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import { EmptyState } from "@vibestack/ui/components/empty-state";
import { Input } from "@vibestack/ui/components/input";
import { Label } from "@vibestack/ui/components/label";
import { Skeleton } from "@vibestack/ui/components/skeleton";
import { Plus, Repeat, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Subscription = {
	id: string;
	url: string;
	events: string[];
	status: string;
	lastDeliveryAt: string | null;
	failureCount: number;
	createdAt: string;
};

type Delivery = {
	id: string;
	webhookId: string;
	event: string;
	status: string;
	attempts: number;
	responseCode: number | null;
	deliveredAt: string | null;
	createdAt: string;
};

function statusBadge(status: string) {
	const variant =
		status === "delivered"
			? "default"
			: status === "failed"
				? "destructive"
				: "secondary";
	return (
		<Badge variant={variant} className="capitalize">
			{status}
		</Badge>
	);
}

export function WebhooksSection() {
	const [subs, setSubs] = useState<Subscription[] | null>(null);
	const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
	const [url, setUrl] = useState("");
	const [eventsStr, setEventsStr] = useState("");
	const [busy, setBusy] = useState(false);

	const load = async () => {
		try {
			const [s, d] = await Promise.all([
				fetch("/api/webhooks/subscriptions", { cache: "no-store" }).then((r) =>
					r.json(),
				),
				fetch("/api/webhooks/deliveries", { cache: "no-store" }).then((r) =>
					r.json(),
				),
			]);
			setSubs(s.rows ?? []);
			setDeliveries(d.rows ?? []);
		} catch {
			toast.error("Couldn't load webhooks");
			setSubs([]);
			setDeliveries([]);
		}
	};

	useEffect(() => {
		void load();
	}, []);

	const create = async () => {
		if (!url.trim()) {
			toast.error("Enter a URL");
			return;
		}
		setBusy(true);
		const toastId = toast.loading("Creating subscription…");
		try {
			const events = eventsStr
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			const res = await fetch("/api/webhooks/subscriptions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ url: url.trim(), events }),
			});
			if (!res.ok) {
				throw new Error(`status ${res.status}`);
			}
			toast.success("Subscription created", { id: toastId });
			setUrl("");
			setEventsStr("");
			await load();
		} catch (err) {
			toast.error("Couldn't create", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		} finally {
			setBusy(false);
		}
	};

	const remove = async (id: string) => {
		if (!confirm("Delete this webhook? Deliveries to it will stop.")) {
			return;
		}
		const toastId = toast.loading("Deleting…");
		try {
			await fetch(`/api/webhooks/subscriptions/${id}`, { method: "DELETE" });
			toast.success("Deleted", { id: toastId });
			await load();
		} catch {
			toast.error("Couldn't delete", { id: toastId });
		}
	};

	const replay = async (id: string) => {
		const toastId = toast.loading("Replaying…");
		try {
			const res = await fetch(`/api/webhooks/deliveries/${id}/replay`, {
				method: "POST",
			});
			if (!res.ok) {
				throw new Error(`status ${res.status}`);
			}
			toast.success("Re-queued — will fire on next worker tick", {
				id: toastId,
			});
			await load();
		} catch (err) {
			toast.error("Couldn't replay", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		}
	};

	return (
		<div className="grid gap-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Add a subscription</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						className="grid gap-3"
						onSubmit={(e) => {
							e.preventDefault();
							void create();
						}}
					>
						<div className="grid gap-1.5">
							<Label htmlFor="hook-url">URL</Label>
							<Input
								id="hook-url"
								type="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://your-server.example.com/webhooks/stack"
								disabled={busy}
							/>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="hook-events">Events (comma-separated)</Label>
							<Input
								id="hook-events"
								value={eventsStr}
								onChange={(e) => setEventsStr(e.target.value)}
								placeholder="user.created,subscription.updated  ·  blank = all"
								disabled={busy}
							/>
						</div>
						<Button type="submit" disabled={busy} className="justify-self-end">
							<Plus className="mr-1.5 h-4 w-4" />
							Add subscription
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="border-b">
					<CardTitle className="text-base">Subscriptions</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{subs === null ? (
						<div className="space-y-2 p-4">
							{Array.from({ length: 2 }).map((_, i) => (
								<Skeleton key={i} className="h-14 w-full" />
							))}
						</div>
					) : subs.length === 0 ? (
						<EmptyState
							illustration="arc"
							title="No webhooks yet"
							description="Add a subscription above and we'll start firing events to your URL."
							className="border-0 bg-transparent py-10"
						/>
					) : (
						<ul className="divide-y">
							{subs.map((s) => (
								<li key={s.id} className="flex items-center gap-3 px-4 py-3">
									<div className="min-w-0 flex-1">
										<p className="truncate font-mono text-sm">{s.url}</p>
										<p className="text-muted-foreground text-xs">
											{s.events.length === 0
												? "all events"
												: s.events.join(", ")}
											{s.lastDeliveryAt
												? ` · last delivery ${new Date(s.lastDeliveryAt).toLocaleString()}`
												: " · never delivered"}
											{s.failureCount > 0
												? ` · ${s.failureCount} failure${s.failureCount === 1 ? "" : "s"}`
												: ""}
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="text-destructive hover:text-destructive"
										onClick={() => remove(s.id)}
									>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only">Delete</span>
									</Button>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="border-b">
					<CardTitle className="text-base">Recent deliveries</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{deliveries === null ? (
						<div className="space-y-2 p-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : deliveries.length === 0 ? (
						<EmptyState
							illustration="stack"
							title="No deliveries yet"
							description="Once an event fires, every attempt shows up here so you can replay failures."
							className="border-0 bg-transparent py-10"
						/>
					) : (
						<ul className="divide-y">
							{deliveries.map((d) => (
								<li key={d.id} className="flex items-center gap-3 px-4 py-3">
									<div className="min-w-0 flex-1">
										<p className="font-mono text-sm">{d.event}</p>
										<p className="text-muted-foreground text-xs">
											{statusBadge(d.status)} · attempts {d.attempts}
											{d.responseCode ? ` · HTTP ${d.responseCode}` : ""}
											{d.deliveredAt
												? ` · delivered ${new Date(d.deliveredAt).toLocaleString()}`
												: ""}
										</p>
									</div>
									{d.status === "failed" || d.status === "retry" ? (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => replay(d.id)}
										>
											<Repeat className="mr-1.5 h-4 w-4" />
											Replay
										</Button>
									) : null}
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
