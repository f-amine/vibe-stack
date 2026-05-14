"use client";

import { Button } from "@starter-saas/ui/components/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

function Inner() {
	const params = useSearchParams();
	const email = params.get("email") ?? "";
	const [resending, setResending] = useState(false);

	const resend = async () => {
		if (!email) {
			toast.error("We don't know which email to resend to — sign up again");
			return;
		}
		setResending(true);
		const id = toast.loading("Resending verification email…");
		try {
			const { error } = await authClient.sendVerificationEmail({
				email,
				callbackURL: "/dashboard",
			});
			if (error) {
				toast.error(formatError(error, "Couldn't resend"), { id });
				return;
			}
			toast.success("Sent — check your inbox", { id });
		} finally {
			setResending(false);
		}
	};

	return (
		<div className="grid gap-6 text-center">
			<div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted">
				<svg
					className="h-6 w-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					aria-hidden="true"
				>
					<title>Email</title>
					<rect x="3" y="5" width="18" height="14" rx="2" />
					<path d="M3 7l9 6 9-6" />
				</svg>
			</div>
			<div>
				<h1 className="font-semibold text-3xl tracking-tight">
					Check your email
				</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					{email ? (
						<>
							We sent a verification link to <strong>{email}</strong>. Click it
							to finish creating your account.
						</>
					) : (
						"We sent you a verification link."
					)}
				</p>
			</div>
			<Button onClick={resend} variant="outline" disabled={resending}>
				{resending ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
					</>
				) : (
					"Resend email"
				)}
			</Button>
			<p className="text-muted-foreground text-sm">
				<Link
					href="/sign-in"
					className="text-foreground underline-offset-4 hover:underline"
				>
					Back to sign in
				</Link>
			</p>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense>
			<Inner />
		</Suspense>
	);
}
