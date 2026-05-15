import { GoogleAnalytics } from "@starter-saas/analytics/ga";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ogMetadata } from "@/lib/og";
import "../globals.css";

const fraunces = Fraunces({
	subsets: ["latin"],
	variable: "--font-display",
	display: "swap",
});

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-body",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
	display: "swap",
});

const SITE_TITLE = "stack/saas — Ship the interesting part. We wired the rest.";
const SITE_DESCRIPTION =
	"A pre-wired SaaS starter: auth, billing, email, storage, analytics, admin, AI workflow. Ship features, not plumbing.";

export const metadata = {
	title: SITE_TITLE,
	description: SITE_DESCRIPTION,
	...ogMetadata({
		title: "Ship the interesting part.",
		subtitle: "Auth, billing, email, storage, analytics — all pre-wired.",
		eyebrow: "stack/saas",
	}),
};

type Props = {
	children: ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;
	const messages = await getMessages();
	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable}`}
		>
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
				<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
			</body>
		</html>
	);
}
