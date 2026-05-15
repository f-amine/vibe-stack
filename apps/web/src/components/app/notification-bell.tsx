"use client";

import { Badge } from "@starter-saas/ui/components/badge";
import { Button } from "@starter-saas/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@starter-saas/ui/components/dropdown-menu";
import { Skeleton } from "@starter-saas/ui/components/skeleton";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import Link from "next/link";
import * as React from "react";

type Row = {
	id: string;
	kind: string;
	title: string | null;
	body: string | null;
	href: string | null;
	readAt: string | null;
	createdAt: string;
};

const POLL_MS = 60_000;

function timeAgo(iso: string): string {
	const diffMs = Date.now() - new Date(iso).getTime();
	const minutes = Math.floor(diffMs / 60_000);
	if (minutes < 1) {
		return "just now";
	}
	if (minutes < 60) {
		return `${minutes}m ago`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours}h ago`;
	}
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export function NotificationBell() {
	const [rows, setRows] = React.useState<Row[] | null>(null);
	const [unread, setUnread] = React.useState(0);

	const load = React.useCallback(async () => {
		try {
			const res = await fetch("/api/notifications", { cache: "no-store" });
			if (!res.ok) {
				return;
			}
			const data = (await res.json()) as { rows: Row[]; unread: number };
			setRows(data.rows);
			setUnread(data.unread);
		} catch {
			/* offline → keep last state */
		}
	}, []);

	React.useEffect(() => {
		void load();
		const id = setInterval(load, POLL_MS);
		return () => clearInterval(id);
	}, [load]);

	const markAllRead = async () => {
		setUnread(0);
		setRows(
			(prev) =>
				prev?.map((r) => ({
					...r,
					readAt: r.readAt ?? new Date().toISOString(),
				})) ?? null,
		);
		await fetch("/api/notifications", { method: "PATCH" });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						className="relative"
						aria-label={`Notifications, ${unread} unread`}
					>
						<Bell className="h-4 w-4" />
						{unread > 0 ? (
							<Badge
								variant="default"
								className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px]"
							>
								{unread > 9 ? "9+" : unread}
							</Badge>
						) : null}
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-80">
				<DropdownMenuGroup>
					<div className="flex items-center justify-between gap-2 px-1">
						<DropdownMenuLabel className="font-semibold">
							Notifications
						</DropdownMenuLabel>
						{unread > 0 ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 gap-1 text-xs"
								onClick={markAllRead}
							>
								<CheckCheck className="h-3 w-3" /> Mark all read
							</Button>
						) : null}
					</div>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />

				{rows === null ? (
					<div className="space-y-2 p-2">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex gap-3 p-2">
								<Skeleton className="h-9 w-9 rounded-md" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-3 w-32" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
						))}
					</div>
				) : rows.length === 0 ? (
					<div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted-foreground">
						<Inbox className="h-6 w-6" aria-hidden />
						<p className="font-medium text-sm">No notifications yet</p>
						<p className="text-xs">
							We'll ping you here when something needs your attention.
						</p>
					</div>
				) : (
					<ul className="grid gap-1 p-1">
						{rows.map((row) => {
							const isUnread = row.readAt === null;
							const Wrapper: React.ElementType = row.href ? Link : "div";
							const wrapperProps: Record<string, unknown> = row.href
								? { href: { pathname: row.href } }
								: {};
							return (
								<li key={row.id}>
									<Wrapper
										{...wrapperProps}
										className={`block rounded-md px-2 py-2 transition-colors hover:bg-muted/50 ${isUnread ? "bg-muted/30" : ""}`}
									>
										<div className="flex items-start gap-3">
											<span
												aria-hidden
												className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full ${isUnread ? "bg-foreground" : "bg-muted-foreground/40"}`}
											/>
											<div className="flex-1">
												<p className="font-medium text-sm">
													{row.title ?? row.kind}
												</p>
												{row.body ? (
													<p className="mt-0.5 text-muted-foreground text-xs">
														{row.body}
													</p>
												) : null}
												<p className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
													{timeAgo(row.createdAt)}
												</p>
											</div>
										</div>
									</Wrapper>
								</li>
							);
						})}
					</ul>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
