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
import { KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PasswordInput } from "@/components/auth/password-input";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
	email: z.email("Enter a valid email"),
	password: z.string().min(8, "Min 8 characters"),
});

type Values = z.infer<typeof schema>;

export function SignInForm() {
	const router = useRouter();
	const search = useSearchParams();
	const next = search.get("next") || "/dashboard";
	const [submitting, setSubmitting] = useState(false);

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = async (values: Values) => {
		setSubmitting(true);
		const { error } = await authClient.signIn.email({
			email: values.email,
			password: values.password,
			callbackURL: next,
		});
		setSubmitting(false);
		if (error) {
			toast.error("Couldn't sign in", { description: error.message });
			return;
		}
		toast.success("Welcome back");
		// Next 16 typed routes — external/dynamic redirect; cast to any
		// biome-ignore lint/suspicious/noExplicitAny: dynamic redirect target
		router.push(next as any);
		router.refresh();
	};

	const onMagicLink = async () => {
		const email = form.getValues("email");
		const parsed = z.email().safeParse(email);
		if (!parsed.success) {
			form.setError("email", { message: "Enter a valid email first" });
			return;
		}
		const { error } = await authClient.signIn.magicLink({
			email,
			callbackURL: next,
		});
		if (error)
			toast.error("Couldn't send link", { description: error.message });
		else toast.success("Check your inbox for a sign-in link");
	};

	const onPasskey = async () => {
		// `signIn.passkey()` triggers the WebAuthn browser prompt. If the user
		// has no registered passkey for this origin, the browser handles the
		// "no credentials" UI; we surface server-side errors via toast.
		const result = await authClient.signIn.passkey();
		if (result?.error) {
			toast.error("Couldn't sign in with passkey", {
				description: result.error.message ?? "Try email + password instead",
			});
			return;
		}
		toast.success("Welcome back");
		// biome-ignore lint/suspicious/noExplicitAny: dynamic redirect target
		router.push(next as any);
		router.refresh();
	};

	return (
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
									autoComplete="email"
									placeholder="you@company.com"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<div className="flex items-center justify-between">
								<FormLabel>Password</FormLabel>
								<a
									href="/forgot-password"
									className="text-muted-foreground text-xs hover:text-foreground"
								>
									Forgot?
								</a>
							</div>
							<FormControl>
								<PasswordInput
									autoComplete="current-password"
									placeholder="••••••••"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" size="lg" disabled={submitting}>
					{submitting ? "Signing in…" : "Sign in"}
				</Button>

				<Button type="button" variant="outline" size="lg" onClick={onPasskey}>
					<KeyRound className="mr-2 h-4 w-4" />
					Sign in with passkey
				</Button>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onMagicLink}
					className="text-muted-foreground"
				>
					or send me a magic link
				</Button>
			</form>
		</Form>
	);
}
