import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<RootProvider
			theme={{
				// Site already enforces dark via next-themes in the [locale] layout;
				// tell Fumadocs not to wrap its own theme provider on top.
				enabled: false,
			}}
		>
			<DocsLayout tree={source.pageTree} nav={{ title: "starter-saas docs" }}>
				{children}
			</DocsLayout>
		</RootProvider>
	);
}
