"use client";

import { Avatar, AvatarFallback } from "@starter-saas/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@starter-saas/ui/components/dropdown-menu";
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
} from "@starter-saas/ui/components/sidebar";
import {
	CreditCard,
	FolderOpen,
	Gift,
	HandCoins,
	LayoutDashboard,
	LogOut,
	Settings,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { type FeatureKey, isFeatureEnabled } from "@/config/features";
import { authClient } from "@/lib/auth-client";

type Item = {
	href: string;
	label: string;
	icon: ComponentType<{ className?: string }>;
	feature?: FeatureKey;
};

type Group = { label: string; items: Item[] };

// One-source-of-truth nav. Items with a `feature` are filtered out at
// render time when that feature is disabled in `config/features.ts`.
// "Settings" lives at /dashboard/settings and contains profile +
// appearance + billing + security + api-keys + webhooks tabs in a hub.
const groups: readonly Group[] = [
	{
		label: "Workspace",
		items: [
			{ href: "/dashboard", label: "Overview", icon: LayoutDashboard },
			{
				href: "/dashboard/organizations",
				label: "Organizations",
				icon: Users,
				feature: "organizations",
			},
			{
				href: "/dashboard/files",
				label: "Files",
				icon: FolderOpen,
				feature: "files",
			},
		],
	},
	{
		label: "Growth",
		items: [
			{
				href: "/dashboard/affiliate",
				label: "Affiliate",
				icon: HandCoins,
				feature: "affiliate",
			},
			{
				href: "/dashboard/referrals",
				label: "Referrals",
				icon: Gift,
				feature: "referrals",
			},
		],
	},
	{
		label: "Account",
		items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
	},
];

function visibleGroups(): Group[] {
	return groups
		.map((g) => ({
			label: g.label,
			items: g.items.filter((i) => !i.feature || isFeatureEnabled(i.feature)),
		}))
		.filter((g) => g.items.length > 0);
}

export function AppSidebar() {
	const router = useRouter();
	const pathname = usePathname();
	const { data } = authClient.useSession();
	const user = data?.user;
	const initials =
		(user?.name ?? user?.email ?? "?")
			.split(" ")
			.map((s) => s[0])
			.slice(0, 2)
			.join("")
			.toUpperCase() || "U";

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<Link
					href="/dashboard"
					className="flex h-12 items-center gap-2 px-2 font-semibold tracking-tight"
				>
					<span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs">
						S
					</span>
					<span className="group-data-[collapsible=icon]:hidden">
						stack/saas
					</span>
				</Link>
			</SidebarHeader>

			<SidebarContent>
				{visibleGroups().map((g) => (
					<SidebarGroup key={g.label}>
						<SidebarGroupLabel>{g.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{g.items.map((item) => {
									const Icon = item.icon;
									const active =
										pathname === item.href ||
										(item.href !== "/dashboard" &&
											pathname?.startsWith(item.href));
									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												isActive={active}
												render={<Link href={{ pathname: item.href }} />}
												tooltip={item.label}
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
				))}
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<SidebarMenuButton
										size="lg"
										className="data-[state=open]:bg-sidebar-accent"
									/>
								}
							>
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarFallback className="rounded-lg">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{user?.name ?? "—"}
									</span>
									<span className="truncate text-muted-foreground text-xs">
										{user?.email ?? "Not signed in"}
									</span>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" align="end" className="w-56">
								<DropdownMenuGroup>
									<DropdownMenuLabel>My account</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => router.push("/dashboard/settings")}
									>
										<Settings className="mr-2 h-4 w-4" />
										Settings
									</DropdownMenuItem>
									{isFeatureEnabled("billing") ? (
										<DropdownMenuItem
											onClick={() =>
												router.push("/dashboard/settings#billing" as never)
											}
										>
											<CreditCard className="mr-2 h-4 w-4" />
											Billing
										</DropdownMenuItem>
									) : null}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={async () => {
											await authClient.signOut();
											window.location.href = "/sign-in";
										}}
									>
										<LogOut className="mr-2 h-4 w-4" />
										Sign out
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
