import Link from "next/link";
import { Suspense } from "react";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = { title: "Sign in · vibestack" };

export default function SignInPage() {
	return (
		<div className="space-y-10">
			<div className="space-y-3">
				<span className="font-mono-label text-muted-foreground">
					Sign in · vol. 01
				</span>
				<h1 className="font-display text-[2.25rem] text-foreground leading-[1.05] tracking-[-0.02em]">
					Welcome back.
				</h1>
				<p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
					Pick up where you left off. We hold your projects, billing, and
					organisations until you're ready.
				</p>
			</div>

			<OAuthButtons />

			<div
				className="relative flex items-center"
				aria-hidden
				role="presentation"
			>
				<span className="h-px flex-1 bg-border" />
				<span className="px-3 font-mono-label text-muted-foreground">
					or with email
				</span>
				<span className="h-px flex-1 bg-border" />
			</div>

			<Suspense>
				<SignInForm />
			</Suspense>

			<p className="text-muted-foreground text-sm">
				No account yet?{" "}
				<Link
					href="/sign-up"
					className="font-medium text-foreground underline-offset-4 hover:underline"
				>
					Create one
				</Link>
				.
			</p>
		</div>
	);
}
