"use client";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@starter-saas/ui/components/tabs";
import {
	CreditCard,
	KeyRound,
	Palette,
	Shield,
	User,
	Webhook,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { ApiKeysSection } from "@/components/settings/api-keys-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { BillingSection } from "@/components/settings/billing-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { SecuritySection } from "@/components/settings/security-section";
import { WebhooksSection } from "@/components/settings/webhooks-section";
import { type FeatureKey, isFeatureEnabled } from "@/config/features";

type Tab = {
	id: string;
	/** Feature gate. `null` = always shown (e.g. profile). */
	feature: FeatureKey | null;
	label: string;
	icon: ComponentType<{ className?: string }>;
	render: () => React.ReactNode;
};

const ALL_TABS: Tab[] = [
	{
		id: "profile",
		feature: null,
		label: "Profile",
		icon: User,
		render: () => <ProfileSection />,
	},
	{
		id: "appearance",
		feature: "appearance",
		label: "Appearance",
		icon: Palette,
		render: () => <AppearanceSection />,
	},
	{
		id: "billing",
		feature: "billing",
		label: "Billing",
		icon: CreditCard,
		render: () => <BillingSection />,
	},
	{
		id: "security",
		feature: "security",
		label: "Security",
		icon: Shield,
		render: () => <SecuritySection />,
	},
	{
		id: "api-keys",
		feature: "apiKeys",
		label: "API keys",
		icon: KeyRound,
		render: () => <ApiKeysSection />,
	},
	{
		id: "webhooks",
		feature: "webhooks",
		label: "Webhooks",
		icon: Webhook,
		render: () => <WebhooksSection />,
	},
];

const tabs = ALL_TABS.filter(
	(t) => t.feature === null || isFeatureEnabled(t.feature),
);

function initialTab(): string {
	if (typeof window === "undefined") {
		return tabs[0]?.id ?? "profile";
	}
	const hash = window.location.hash.replace(/^#/, "");
	if (tabs.some((t) => t.id === hash)) {
		return hash;
	}
	return tabs[0]?.id ?? "profile";
}

export default function SettingsPage() {
	const [active, setActive] = useState<string>(() => initialTab());

	useEffect(() => {
		const onHash = () => setActive(initialTab());
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, []);

	const onValueChange = (value: string | null | undefined) => {
		if (!value) {
			return;
		}
		setActive(value);
		if (typeof window !== "undefined") {
			window.history.replaceState(null, "", `#${value}`);
		}
	};

	return (
		<>
			<PageHeader
				title="Settings"
				description="Profile, appearance, billing, security, integrations — all in one place."
			/>

			<Tabs
				value={active}
				onValueChange={onValueChange}
				orientation="vertical"
				className="grid gap-8 lg:grid-cols-[200px_1fr] lg:gap-12"
			>
				<aside className="lg:sticky lg:top-20 lg:self-start">
					<TabsList
						variant="line"
						className="flex w-full flex-row overflow-x-auto lg:flex-col lg:overflow-visible"
					>
						{tabs.map((tab) => {
							const Icon = tab.icon;
							return (
								<TabsTrigger
									key={tab.id}
									value={tab.id}
									className="justify-start gap-2"
								>
									<Icon className="h-4 w-4" />
									<span>{tab.label}</span>
								</TabsTrigger>
							);
						})}
					</TabsList>
				</aside>

				<div className="min-w-0">
					{tabs.map((tab) => (
						<TabsContent key={tab.id} value={tab.id} className="mt-0">
							{tab.render()}
						</TabsContent>
					))}
				</div>
			</Tabs>
		</>
	);
}
