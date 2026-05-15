"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@vibestack/ui/components/alert";
import { Button } from "@vibestack/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@vibestack/ui/components/form";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PasswordInput } from "@/components/auth/password-input";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

const schema = z
	.object({
		password: z.string().min(8, "Min 8 characters"),
		confirm: z.string().min(8, "Min 8 characters"),
	})
	.refine((v) => v.password === v.confirm, {
		message: "Passwords don't match",
		path: ["confirm"],
	});

type Values = z.infer<typeof schema>;

function Inner() {
	const router = useRouter();
	const params = useSearchParams();
	const token = params.get("token");
	const [submitting, setSubmitting] = useState(false);

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { password: "", confirm: "" },
	});

	const onSubmit = async (values: Values) => {
		if (!token) return;
		setSubmitting(true);
		const id = toast.loading("Saving new password…");
		try {
			const { error } = await authClient.resetPassword({
				newPassword: values.password,
				token,
			});
			if (error) {
				toast.error(formatError(error, "Couldn't reset password"), { id });
				return;
			}
			toast.success("Password updated — please sign in", { id });
			router.push("/sign-in");
		} finally {
			setSubmitting(false);
		}
	};

	if (!token) {
		return (
			<div className="space-y-8">
				<div className="space-y-3">
					<span className="font-mono-label text-muted-foreground">
						Account · recovery
					</span>
					<h1 className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.02em] text-foreground">
						Reset link expired.
					</h1>
					<p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
						The link in your inbox is no longer valid. Request a fresh one
						below.
					</p>
				</div>
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>No reset token</AlertTitle>
					<AlertDescription>Request a fresh link below.</AlertDescription>
				</Alert>
				<Link
					href="/forgot-password"
					className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 font-medium text-background text-sm transition-colors hover:bg-foreground/90"
				>
					Send a new reset link
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-10">
			<div className="space-y-3">
				<span className="font-mono-label text-muted-foreground">
					Account · recovery
				</span>
				<h1 className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.02em] text-foreground">
					New password.
				</h1>
				<p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
					Pick something you'll remember. We'll sign you in fresh after.
				</p>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>New password</FormLabel>
								<FormControl>
									<PasswordInput
										autoComplete="new-password"
										placeholder="••••••••"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="confirm"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Confirm</FormLabel>
								<FormControl>
									<PasswordInput
										autoComplete="new-password"
										placeholder="••••••••"
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
								<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
							</>
						) : (
							"Set new password"
						)}
					</Button>
				</form>
			</Form>

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

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<Inner />
		</Suspense>
	);
}
