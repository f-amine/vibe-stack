"use client";

import { Button } from "@starter-saas/ui/components/button";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" aria-label="Google" role="img" {...props}>
			<title>Google</title>
			<path
				fill="#4285F4"
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
			/>
			<path
				fill="#34A853"
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
			/>
			<path
				fill="#FBBC05"
				d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z"
			/>
			<path
				fill="#EA4335"
				d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05L5.84 9.9c.87-2.6 3.3-4.52 6.16-4.52Z"
			/>
		</svg>
	);
}

type Props = { next?: string };

export function OAuthButtons({ next = "/dashboard" }: Props) {
	const [loading, setLoading] = useState<string | null>(null);

	const signInWith = async (provider: "google") => {
		try {
			setLoading(provider);
			await authClient.signIn.social({ provider, callbackURL: next });
		} catch (err) {
			toast.error(`Couldn't sign in with ${provider}`, {
				description: err instanceof Error ? err.message : "Unknown error",
			});
			setLoading(null);
		}
	};

	return (
		<div className="grid gap-2">
			<Button
				type="button"
				variant="outline"
				size="lg"
				disabled={loading !== null}
				onClick={() => signInWith("google")}
				className="gap-2"
			>
				<GoogleIcon className="h-4 w-4" />
				{loading === "google" ? "Redirecting…" : "Continue with Google"}
			</Button>
		</div>
	);
}
