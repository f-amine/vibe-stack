import { Separator } from "@starter-saas/ui/components/separator";
import Link from "next/link";
import { Suspense } from "react";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
	return (
		<div className="grid gap-8">
			<div>
				<h1 className="font-semibold text-3xl tracking-tight">Welcome back</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					Sign in to your account to continue.
				</p>
			</div>

			<OAuthButtons />

			<div className="relative">
				<Separator />
				<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-muted-foreground text-xs uppercase tracking-widest">
					or
				</span>
			</div>

			<Suspense>
				<SignInForm />
			</Suspense>

			<p className="text-center text-muted-foreground text-sm">
				New here?{" "}
				<Link
					href="/sign-up"
					className="font-medium text-foreground underline-offset-4 hover:underline"
				>
					Create an account
				</Link>
			</p>
		</div>
	);
}
