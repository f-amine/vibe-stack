import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "../globals.css";

export const metadata = {
	title: "Admin · starter-saas",
};

type Props = {
	children: ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
	const { locale } = await params;
	const messages = await getMessages();
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
						<div className="grid min-h-dvh grid-cols-[260px_1fr]">
							<aside className="border-r p-4">
								<h2 className="px-2 font-semibold text-muted-foreground text-sm uppercase">
									Admin
								</h2>
								<nav className="mt-4 flex flex-col gap-1 text-sm">
									<Link className="rounded px-2 py-1.5 hover:bg-muted" href="/">
										Overview
									</Link>
									<Link
										className="rounded px-2 py-1.5 hover:bg-muted"
										href="/users"
									>
										Users
									</Link>
									<Link
										className="rounded px-2 py-1.5 hover:bg-muted"
										href="/orgs"
									>
										Organizations
									</Link>
									<Link
										className="rounded px-2 py-1.5 hover:bg-muted"
										href="/audit"
									>
										Audit log
									</Link>
								</nav>
							</aside>
							<main className="p-8">{children}</main>
						</div>
						<Toaster />
					</ThemeProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
