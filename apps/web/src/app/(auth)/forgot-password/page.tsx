"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@starter-saas/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@starter-saas/ui/components/form";
import { Input } from "@starter-saas/ui/components/input";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const schema = z.object({ email: z.email() });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
	const [sent, setSent] = useState(false);
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { email: "" },
	});

	const onSubmit = async (values: Values) => {
		const { error } = await authClient.requestPasswordReset({
			email: values.email,
			redirectTo: "/reset-password",
		});
		if (error) {
			toast.error("Couldn't send reset email", { description: error.message });
			return;
		}
		setSent(true);
	};

	return (
		<div className="grid gap-8">
			<div>
				<h1 className="font-semibold text-3xl tracking-tight">
					Reset your password
				</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					Enter the email tied to your account.
				</p>
			</div>

			{sent ? (
				<div className="rounded-lg border bg-muted/30 p-5 text-sm">
					Sent. Check your inbox for the reset link.
				</div>
			) : (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="you@company.com"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" size="lg">
							Send reset link
						</Button>
					</form>
				</Form>
			)}

			<p className="text-center text-muted-foreground text-sm">
				<Link
					href="/sign-in"
					className="text-foreground underline-offset-4 hover:underline"
				>
					← Back to sign in
				</Link>
			</p>
		</div>
	);
}
