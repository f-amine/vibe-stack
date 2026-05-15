"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@vibestack/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@vibestack/ui/components/form";
import { Input } from "@vibestack/ui/components/input";
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

const schema = z.object({ email: z.email("Enter a valid email") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
	const [sent, setSent] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { email: "" },
	});

	const onSubmit = async (values: Values) => {
		setSubmitting(true);
		const id = toast.loading("Sending reset link…");
		try {
			const { error } = await authClient.requestPasswordReset({
				email: values.email,
				redirectTo: "/reset-password",
			});
			if (error) {
				toast.error(formatError(error, "Couldn't send reset email"), { id });
				return;
			}
			toast.success("Reset link sent", {
				id,
				description: `Check ${values.email} for the link. It expires in 1 hour.`,
			});
			setSent(true);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="space-y-10">
			<div className="space-y-3">
				<span className="font-mono-label text-muted-foreground">
					Account · recovery
				</span>
				<h1 className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.02em] text-foreground">
					Lost the key.
				</h1>
				<p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
					Enter the email tied to your account. We'll send a one-time reset
					link that expires in an hour.
				</p>
			</div>

			{sent ? (
				<div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-5 text-sm">
					<MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
					<div>
						<p className="font-medium">Check your inbox</p>
						<p className="mt-1 text-muted-foreground">
							We sent a reset link to <strong>{form.getValues("email")}</strong>
							. It expires in 1 hour.
						</p>
					</div>
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
											disabled={submitting}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" size="lg" disabled={submitting}>
							{submitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
								</>
							) : (
								"Send reset link"
							)}
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
