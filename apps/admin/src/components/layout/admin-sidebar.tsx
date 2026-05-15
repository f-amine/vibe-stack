"use client";

import { Avatar, AvatarFallback } from "@vibestack/ui/components/avatar";
import { Badge } from "@vibestack/ui/components/badge";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@vibestack/ui/components/sidebar";
import {
	BarChart3,
	Building2,
	CreditCard,
	Flag,
	LayoutGrid,
	LogOut,
	ScrollText,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
	{ href: "/", label: "Overview", icon: LayoutGrid },
	{ href: "/users", label: "Users", icon: Users },
	{ href: "/orgs", label: "Organizations", icon: Building2 },
	{ href: "/audit", label: "Audit log", icon: ScrollText },
	{ href: "/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/billing", label: "Billing", icon: CreditCard },
	{ href: "/feature-flags", label: "Feature flags", icon: Flag },
];

type Props = { user?: { name?: string | null; email?: string | null } };

export function AdminSidebar({ user }: Props) {
	const pathname = usePathname();
	const router = useRouter();
	const initials =
		(user?.name ?? user?.email ?? "?")
			.split(" ")
			.map((s) => s[0])
			.slice(0, 2)
			.join("")
			.toUpperCase() || "A";

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<Link
					href="/"
					className="flex h-12 items-center gap-2 px-2 font-semibold tracking-tight"
				>
					<span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs">
						A
					</span>
					<span className="group-data-[collapsible=icon]:hidden">
						Admin · vibestack
					</span>
					<Badge
						variant="secondary"
						className="ml-auto text-[10px] uppercase group-data-[collapsible=icon]:hidden"
					>
						root
					</Badge>
				</Link>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Manage</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => {
								const Icon = item.icon;
								const active =
									pathname === item.href ||
									(item.href !== "/" && pathname?.startsWith(item.href));
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											isActive={active}
											tooltip={item.label}
											render={<Link href={item.href} />}
										>
											<Icon className="h-4 w-4" />
											<span>{item.label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" tooltip="Account">
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarFallback className="rounded-lg">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{user?.name ?? "Admin"}
								</span>
								<span className="truncate text-muted-foreground text-xs">
									{user?.email ?? "—"}
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltip="Sign out"
							onClick={() => router.push("/sign-in")}
						>
							<LogOut className="h-4 w-4" />
							<span>Sign out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
