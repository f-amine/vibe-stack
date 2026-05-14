"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@starter-saas/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@starter-saas/ui/components/form";
import { Input } from "@starter-saas/ui/components/input";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/app/page-header";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

const profile = z.object({
	name: z.string().min(2, "Required"),
	email: z.email(),
});

type ProfileValues = z.infer<typeof profile>;

export default function SettingsPage() {
	const { data } = authClient.useSession();
	const [saving, setSaving] = useState(false);

	const form = useForm<ProfileValues>({
		resolver: zodResolver(profile),
		values: {
			name: data?.user?.name ?? "",
			email: data?.user?.email ?? "",
		},
	});

	useEffect(() => {
		if (data?.user) {
			form.reset({ name: data.user.name ?? "", email: data.user.email ?? "" });
		}
	}, [data, form]);

	const onSubmit = async (values: ProfileValues) => {
		setSaving(true);
		const id = toast.loading("Saving…");
		try {
			const { error } = await authClient.updateUser({ name: values.name });
			if (error) {
				toast.error(formatError(error, "Couldn't save"), { id });
				return;
			}
			toast.success("Profile updated", { id });
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<PageHeader
				title="Settings"
				description="Manage your profile and account preferences."
			/>

			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>
						Your name and email — what shows up on receipts and invites.
					</CardDescription>
				</CardHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<CardContent className="grid gap-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Full name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input type="email" {...field} disabled />
										</FormControl>
										<FormDescription>
											Changing your email triggers a re-verification.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
						<CardFooter className="border-t pt-6">
							<Button type="submit" disabled={saving}>
								{saving ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
									</>
								) : (
									"Save changes"
								)}
							</Button>
						</CardFooter>
					</form>
				</Form>
			</Card>

			<Card className="mt-6 max-w-2xl border-destructive/40">
				<CardHeader>
					<CardTitle className="text-destructive">Danger zone</CardTitle>
					<CardDescription>
						Permanent actions. There is no undo.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
						<div>
							<p className="font-medium text-sm">Delete account</p>
							<p className="text-muted-foreground text-xs">
								Wipes your user, organizations you own, and all data.
							</p>
						</div>
						<Button variant="destructive" size="sm">
							Delete
						</Button>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
