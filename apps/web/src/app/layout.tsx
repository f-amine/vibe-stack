import { GoogleAnalytics } from "@vibestack/analytics/ga";
import type { Metadata } from "next";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	display: "swap",
});

const fraunces = Fraunces({
	variable: "--font-display",
	subsets: ["latin"],
	display: "swap",
	weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "vibestack",
	description: "The SaaS starter where Claude writes the rest.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} min-h-dvh bg-background text-foreground antialiased`}
			>
				<Providers>{children}</Providers>
				<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
			</body>
		</html>
	);
}
