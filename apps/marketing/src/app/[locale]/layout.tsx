import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "../globals.css";

export const metadata = {
	title:
		"stack/saas — Build the boring parts once. Ship the rest a hundred times.",
	description:
		"A pre-wired SaaS starter: auth, billing, email, storage, analytics, admin, AI workflow. Ship features, not plumbing.",
};

type Props = {
	children: ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;
	const messages = await getMessages();
	return (
		<html lang={locale} suppressHydrationWarning>
			<body className="min-h-dvh antialiased">
				<NextIntlClientProvider locale={locale} messages={messages}>
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						forcedTheme="dark"
						disableTransitionOnChange
					>
						{children}
						<Toaster theme="dark" />
					</ThemeProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
