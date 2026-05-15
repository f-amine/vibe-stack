"use client";

import { Avatar, AvatarFallback } from "@starter-saas/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
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
	KeyRound,
	LayoutDashboard,
	LogOut,
	Palette,
	Settings,
	Shield,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const groups = [
	{
		label: "Workspace",
		items: [
			{ href: "/dashboard", label: "Overview", icon: LayoutDashboard },
			{ href: "/dashboard/organizations", label: "Organizations", icon: Users },
			{ href: "/dashboard/files", label: "Files", icon: FolderOpen },
		],
	},
	{
		label: "Account",
		items: [
			{ href: "/dashboard/settings", label: "Settings", icon: Settings },
			{ href: "/dashboard/billing", label: "Billing", icon: CreditCard },
			{ href: "/dashboard/appearance", label: "Appearance", icon: Palette },
			{ href: "/dashboard/security", label: "Security", icon: Shield },
			{ href: "/dashboard/api-keys", label: "API keys", icon: KeyRound },
		],
	},
] as const;

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
				{groups.map((g) => (
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
								<DropdownMenuLabel>My account</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => router.push("/dashboard/settings")}
								>
									<Settings className="mr-2 h-4 w-4" />
									Settings
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => router.push("/dashboard/billing")}
								>
									<CreditCard className="mr-2 h-4 w-4" />
									Billing
								</DropdownMenuItem>
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
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
