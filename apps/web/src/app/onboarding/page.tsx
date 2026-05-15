import { auth } from "@vibestack/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasCompletedOnboarding } from "@/lib/onboarding";

import { OnboardingWizard } from "./_wizard";

export const metadata = {
	title: "Welcome",
	robots: { index: false },
};

export default async function OnboardingPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		redirect("/sign-in?next=/onboarding");
	}

	if (await hasCompletedOnboarding(session.user.id)) {
		redirect("/dashboard");
	}

	return (
		<OnboardingWizard
			user={{
				id: session.user.id,
				name: session.user.name,
				email: session.user.email,
				image: session.user.image,
			}}
		/>
	);
}
