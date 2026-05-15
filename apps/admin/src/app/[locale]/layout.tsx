import { GoogleAnalytics } from "@vibestack/analytics/ga";
import { Badge } from "@vibestack/ui/components/badge";
import { Separator } from "@vibestack/ui/components/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@vibestack/ui/components/sidebar";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requireAdmin } from "@/lib/require-admin";
import "../globals.css";

export const metadata = {
	title: "Admin · vibestack",
};

type Props = {
	children: ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
	const { locale } = await params;
	const messages = await getMessages();
	const session = await requireAdmin();

	return (
		<html lang={locale} suppressHydrationWarning>
			<body className="min-h-dvh bg-background text-foreground antialiased">
				<NextIntlClientProvider locale={locale} messages={messages}>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<SidebarProvider>
							<AdminSidebar
								user={{
									name: session.user.name,
									email: session.user.email,
								}}
							/>
							<SidebarInset>
								<header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
									<SidebarTrigger className="-ml-1" />
									<Separator orientation="vertical" className="h-4" />
									<span className="text-muted-foreground text-sm">Admin</span>
									<Badge
										variant="outline"
										className="ml-2 text-[10px] uppercase"
									>
										root
									</Badge>
								</header>
								<div className="p-6 sm:p-10">{children}</div>
							</SidebarInset>
						</SidebarProvider>
						<Toaster />
					</ThemeProvider>
				</NextIntlClientProvider>
				<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
			</body>
		</html>
	);
}
