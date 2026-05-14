"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { Label } from "@starter-saas/ui/components/label";
import {
	RadioGroup,
	RadioGroupItem,
} from "@starter-saas/ui/components/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@starter-saas/ui/components/select";
import { Switch } from "@starter-saas/ui/components/switch";
import { cn } from "@starter-saas/ui/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";

const themes = [
	{ id: "light", label: "Light", icon: Sun },
	{ id: "dark", label: "Dark", icon: Moon },
	{ id: "system", label: "System", icon: Monitor },
];

export default function AppearancePage() {
	const { theme, setTheme } = useTheme();
	const [density, setDensity] = useState("comfortable");
	const [locale, setLocale] = useState("en");
	const [reduceMotion, setReduceMotion] = useState(false);

	return (
		<>
			<PageHeader
				title="Appearance"
				description="Customize how stack/saas looks to you."
			/>

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Theme</CardTitle>
						<CardDescription>
							Pick a color scheme. System follows your OS.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<RadioGroup
							value={theme}
							onValueChange={setTheme}
							className="grid gap-3 md:grid-cols-3"
						>
							{themes.map((t) => {
								const Icon = t.icon;
								const active = theme === t.id;
								return (
									<Label
										key={t.id}
										htmlFor={`theme-${t.id}`}
										className={cn(
											"flex cursor-pointer flex-col items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30",
											active && "border-foreground bg-muted/30",
										)}
									>
										<div className="flex w-full items-center justify-between">
											<Icon className="h-5 w-5" />
											<RadioGroupItem
												id={`theme-${t.id}`}
												value={t.id}
												className="sr-only"
											/>
											{active && (
												<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
													Selected
												</span>
											)}
										</div>
										<div>
											<span className="font-medium text-sm">{t.label}</span>
										</div>
									</Label>
								);
							})}
						</RadioGroup>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Density & language</CardTitle>
						<CardDescription>
							Tighter spacing and your preferred locale.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-6 md:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="density">Interface density</Label>
							<Select value={density} onValueChange={(v) => v && setDensity(v)}>
								<SelectTrigger id="density">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="comfortable">Comfortable</SelectItem>
									<SelectItem value="compact">Compact</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="locale">Language</Label>
							<Select value={locale} onValueChange={(v) => v && setLocale(v)}>
								<SelectTrigger id="locale">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="en">English</SelectItem>
									<SelectItem value="fr">Français</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Motion</CardTitle>
						<CardDescription>
							Disable animations if you prefer a calmer interface.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex items-center justify-between">
						<Label htmlFor="reduce-motion">Reduce motion</Label>
						<Switch
							id="reduce-motion"
							checked={reduceMotion}
							onCheckedChange={setReduceMotion}
						/>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
