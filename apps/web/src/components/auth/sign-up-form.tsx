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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PasswordInput } from "@/components/auth/password-input";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

const schema = z.object({
	name: z.string().min(2, "Tell us your name"),
	email: z.email("Enter a valid email"),
	password: z.string().min(8, "Min 8 characters"),
});

type Values = z.infer<typeof schema>;

export function SignUpForm() {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { name: "", email: "", password: "" },
	});

	const onSubmit = async (values: Values) => {
		setSubmitting(true);
		const id = toast.loading("Creating your account…");
		try {
			const { error } = await authClient.signUp.email({
				name: values.name,
				email: values.email,
				password: values.password,
				callbackURL: "/dashboard",
			});
			if (error) {
				toast.error(formatError(error, "Couldn't create your account"), { id });
				return;
			}
			toast.success("Account created", {
				id,
				description: "Check your email for the verification link.",
			});
			router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
		} catch (err) {
			toast.error(formatError(err as Error, "Couldn't create your account"), {
				id,
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input
									autoComplete="name"
									placeholder="Ada Lovelace"
									disabled={submitting}
									{...field}
								/>
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
								<Input
									type="email"
									autoComplete="email"
									placeholder="you@company.com"
									disabled={submitting}
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
							<FormLabel>Password</FormLabel>
							<FormControl>
								<PasswordInput
									autoComplete="new-password"
									placeholder="••••••••"
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
							<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
							account…
						</>
					) : (
						"Create account"
					)}
				</Button>
			</form>
		</Form>
	);
}
