import { auth } from "@starter-saas/auth";
import { Separator } from "@starter-saas/ui/components/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@starter-saas/ui/components/sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/app-sidebar";
import { CommandPalette } from "@/components/app/command-palette";
import { NotificationBell } from "@/components/app/notification-bell";
import { hasCompletedOnboarding } from "@/lib/onboarding";

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/sign-in");
	if (!(await hasCompletedOnboarding(session.user.id))) {
		// Next typedRoutes hasn't picked up /onboarding yet on first compile;
		// route is real, cast quiets the static-route narrowing.
		redirect("/onboarding" as never);
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="h-4" />
					<span className="text-muted-foreground text-sm">stack/saas</span>
					<div className="ml-auto flex items-center gap-2">
						<span className="hidden rounded-md border bg-muted px-2 py-0.5 font-mono text-muted-foreground text-xs sm:inline">
							⌘K to search
						</span>
						<NotificationBell />
					</div>
				</header>
				<div className="p-6 sm:p-10">{children}</div>
				<CommandPalette />
			</SidebarInset>
		</SidebarProvider>
	);
}
