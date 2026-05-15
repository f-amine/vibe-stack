import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { source } from "@/lib/source";
import "./docs.css";

export const metadata: Metadata = {
	title: {
		template: "%s · vibestack docs",
		default: "Documentation · vibestack",
	},
	description: "How vibestack works, top to bottom.",
	alternates: {
		canonical: "/docs",
	},
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<RootProvider
			theme={{
				// Site already enforces dark via next-themes in the [locale] layout;
				// tell Fumadocs not to wrap its own theme provider on top.
				enabled: false,
			}}
		>
			<DocsLayout tree={source.pageTree} nav={{ title: "vibestack docs" }}>
				{children}
			</DocsLayout>
		</RootProvider>
	);
}
