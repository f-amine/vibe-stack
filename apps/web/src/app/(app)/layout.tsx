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
				</header>
				<div className="p-6 sm:p-10">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
