import { Separator } from "@starter-saas/ui/components/separator";
import Link from "next/link";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
	return (
		<div className="grid gap-8">
			<div>
				<h1 className="font-semibold text-3xl tracking-tight">
					Create your account
				</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					Free forever. No credit card.
				</p>
			</div>

			<OAuthButtons />

			<div className="relative">
				<Separator />
				<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-muted-foreground text-xs uppercase tracking-widest">
					or
				</span>
			</div>

			<SignUpForm />

			<p className="text-center text-muted-foreground text-sm">
				Already have one?{" "}
				<Link
					href="/sign-in"
					className="font-medium text-foreground underline-offset-4 hover:underline"
				>
					Sign in
				</Link>
			</p>
		</div>
	);
}
