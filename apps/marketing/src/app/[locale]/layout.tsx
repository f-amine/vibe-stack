import { GoogleAnalytics } from "@vibestack/analytics/ga";
import { LOCALES } from "@vibestack/i18n";
import type { Metadata } from "next";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ogMetadata, siteBase } from "@/lib/og";
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

const SITE_TITLE = "vibestack — The SaaS starter where Claude writes the rest.";
const SITE_DESCRIPTION =
	"Opinionated, AI-first SaaS starter. Stack pre-wired, Claude Code skills vendored in the repo. For devs and vibe-coders. Bring the business logic, skip the plumbing.";

const SITE_BASE = siteBase();

export const metadata: Metadata = {
	metadataBase: new URL(SITE_BASE),
	title: SITE_TITLE,
	description: SITE_DESCRIPTION,
	alternates: {
		canonical: "/",
		languages: {
			en: `${SITE_BASE}/`,
			fr: `${SITE_BASE}/fr`,
		},
		types: {
			"application/atom+xml": [
				{ url: "/blog/feed.xml", title: "vibestack journal" },
			],
		},
	},
	...ogMetadata({
		title: "Claude writes the rest.",
		subtitle:
			"Auth, billing, email, storage, deploy, pre-wired. Skills vendored.",
		eyebrow: "vibestack",
	}),
};

type Props = {
	children: ReactNode;
	params: Promise<{ locale: string }>;
};

// Prerender both locales so docs/blog/changelog static params can fan out
// under each. Without this the [locale] segment is request-time only.
export function generateStaticParams() {
	return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;
	// Opt into static rendering for next-intl: pins the locale into the request
	// store so getMessages()/translations don't fall back to headers() (which
	// would make every page dynamic and throw DYNAMIC_SERVER_USAGE on prerender).
	setRequestLocale(locale);
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
