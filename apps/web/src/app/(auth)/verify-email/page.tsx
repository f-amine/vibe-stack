"use client";

import { Button } from "@vibestack/ui/components/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

const RESEND_COOLDOWN_SECONDS = 60;

function Inner() {
	const params = useSearchParams();
	const email = params.get("email") ?? "";
	const [resending, setResending] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (cooldown <= 0) {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
			return;
		}
		timerRef.current = setInterval(() => {
			setCooldown((c) => (c <= 1 ? 0 : c - 1));
		}, 1000);
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [cooldown]);

	const resend = async () => {
		if (cooldown > 0 || resending) {
			return;
		}
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
			setCooldown(RESEND_COOLDOWN_SECONDS);
		} finally {
			setResending(false);
		}
	};

	return (
		<div className="space-y-10">
			<div className="space-y-3">
				<span className="font-mono-label text-muted-foreground">
					Almost there · ch. 02
				</span>
				<span aria-hidden className="gold-rule" />
				<h1 className="font-display text-[2.25rem] text-foreground leading-[1.05] tracking-[-0.02em]">
					Check your email.
				</h1>
				<p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
					{email ? (
						<>
							We sent a verification link to{" "}
							<strong className="text-foreground">{email}</strong>. Click it
							once and we'll finish setting up your account.
						</>
					) : (
						"We sent a verification link. Click it to finish creating your account."
					)}
				</p>
			</div>
			<Button
				onClick={resend}
				variant="outline"
				disabled={resending || cooldown > 0}
				aria-live="polite"
			>
				{resending ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
					</>
				) : cooldown > 0 ? (
					`Resend in ${cooldown}s`
				) : (
					"Resend email"
				)}
			</Button>
			{cooldown > 0 ? (
				<p className="-mt-2 text-muted-foreground text-xs">
					Email already sent — you can ask for another in {cooldown}s.
				</p>
			) : null}
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
