"use client";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@vibestack/ui/components/command";
import {
	Building2,
	CreditCard,
	KeyRound,
	LayoutDashboard,
	Settings,
	UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

type Hit = {
	type: "user" | "organization";
	id: string;
	label: string;
	detail: string;
	href: string;
};

const NAV_ITEMS: { label: string; href: string; icon: React.ElementType }[] = [
	{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{
		label: "Organizations",
		href: "/dashboard/organizations",
		icon: UsersRound,
	},
	{ label: "Billing", href: "/dashboard/billing", icon: CreditCard },
	{ label: "Settings", href: "/dashboard/settings", icon: Settings },
	{
		label: "API keys",
		href: "/dashboard/api-keys",
		icon: KeyRound,
	},
];

export function CommandPalette() {
	const [open, setOpen] = React.useState(false);
	const [query, setQuery] = React.useState("");
	const [hits, setHits] = React.useState<Hit[]>([]);
	const router = useRouter();

	React.useEffect(() => {
		const handle = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setOpen((v) => !v);
			}
		};
		window.addEventListener("keydown", handle);
		return () => window.removeEventListener("keydown", handle);
	}, []);

	React.useEffect(() => {
		const term = query.trim();
		if (term.length < 2) {
			setHits([]);
			return;
		}
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
					signal: controller.signal,
					cache: "no-store",
				});
				if (!res.ok) {
					return;
				}
				const data = (await res.json()) as { hits: Hit[] };
				setHits(data.hits ?? []);
			} catch {
				/* aborted or offline */
			}
		}, 180);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [query]);

	const go = (href: string) => {
		setOpen(false);
		router.push(href as never);
	};

	return (
		<CommandDialog
			open={open}
			onOpenChange={setOpen}
			title="Search"
			description="Jump anywhere or find a teammate."
		>
			<CommandInput
				placeholder="Search · type to find users, orgs, or jump…"
				value={query}
				onValueChange={setQuery}
			/>
			<CommandList>
				<CommandEmpty>No results.</CommandEmpty>
				<CommandGroup heading="Navigation">
					{NAV_ITEMS.map((item) => {
						const Icon = item.icon;
						return (
							<CommandItem key={item.href} onSelect={() => go(item.href)}>
								<Icon className="mr-2 h-4 w-4" />
								{item.label}
							</CommandItem>
						);
					})}
				</CommandGroup>
				{hits.length > 0 ? (
					<CommandGroup heading="Results">
						{hits.map((hit) => (
							<CommandItem
								key={`${hit.type}-${hit.id}`}
								onSelect={() => go(hit.href)}
							>
								{hit.type === "organization" ? (
									<Building2 className="mr-2 h-4 w-4" />
								) : (
									<UsersRound className="mr-2 h-4 w-4" />
								)}
								<span>{hit.label}</span>
								<span className="ml-2 text-muted-foreground text-xs">
									· {hit.detail}
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				) : null}
			</CommandList>
		</CommandDialog>
	);
}
