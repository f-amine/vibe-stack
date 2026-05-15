import { auth } from "@vibestack/auth";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@vibestack/ui/components/sidebar";
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
				<header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-border border-b bg-background/85 px-5 backdrop-blur-sm">
					<SidebarTrigger className="-ml-1.5 text-muted-foreground hover:text-foreground" />
					<span
						aria-hidden
						className="hidden h-3.5 w-px bg-border sm:inline-block"
					/>
					<span className="hidden font-mono-label text-muted-foreground sm:inline">
						vibestack · workspace
					</span>
					<div className="ml-auto flex items-center gap-2.5">
						<button
							type="button"
							className="vs-focus-ring hidden h-8 items-center gap-2 rounded-full border border-border bg-transparent px-3 text-muted-foreground text-xs transition-colors hover:border-foreground/30 hover:text-foreground sm:inline-flex"
							aria-label="Open command palette"
							data-command-palette-trigger
						>
							<span>Jump to…</span>
							<kbd className="font-mono text-[0.6875rem] text-muted-foreground/80">
								⌘K
							</kbd>
						</button>
						<NotificationBell />
					</div>
				</header>
				<div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-14">{children}</div>
				<CommandPalette />
			</SidebarInset>
		</SidebarProvider>
	);
}
