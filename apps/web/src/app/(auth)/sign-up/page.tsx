import Link from "next/link";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata = { title: "Create account · vibestack" };

export default function SignUpPage() {
	return (
		<div className="space-y-10">
			<div className="space-y-3">
				<span className="font-mono-label text-muted-foreground">
					New here · ch. 01
				</span>
				<h1 className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.02em] text-foreground">
					Make space for what's next.
				</h1>
				<p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
					Free to start, no credit card. You can invite a team and connect
					billing whenever you're ready.
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

			<SignUpForm />

			<p className="text-muted-foreground text-sm">
				Already have an account?{" "}
				<Link
					href="/sign-in"
					className="font-medium text-foreground underline-offset-4 hover:underline"
				>
					Sign in
				</Link>
				.
			</p>
		</div>
	);
}
