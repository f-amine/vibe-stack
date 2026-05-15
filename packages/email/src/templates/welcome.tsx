import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

type Props = {
	name?: string;
	appUrl: string;
	dashboardUrl?: string;
};

export default function Welcome({ name, appUrl, dashboardUrl }: Props) {
	const dashboard = dashboardUrl ?? `${appUrl}/dashboard`;

	return (
		<EmailLayout preview="Welcome aboard — your account is ready.">
			<Heading className="m-0 font-semibold text-2xl text-zinc-900">
				Welcome{name ? `, ${name}` : ""}.
			</Heading>
			<Text className="mt-2 text-zinc-600">
				Your account is verified and ready. You're three clicks from your first
				deploy.
			</Text>

			<Section className="mt-8">
				<Button
					href={dashboard}
					className="rounded-md bg-zinc-900 px-5 py-3 font-medium text-sm text-white no-underline"
				>
					Go to your dashboard →
				</Button>
			</Section>

			<Hr className="my-8 border-zinc-200" />

			<Heading
				as="h2"
				className="m-0 font-medium text-base text-zinc-900 uppercase tracking-wide"
			>
				A few useful pages
			</Heading>
			<Text className="mt-3 text-sm text-zinc-700">
				•{" "}
				<a href={`${appUrl}/dashboard/settings`} className="text-zinc-900">
					Profile & preferences
				</a>
				<br />•{" "}
				<a href={`${appUrl}/dashboard/billing`} className="text-zinc-900">
					Plans & billing
				</a>
				<br />•{" "}
				<a href={`${appUrl}/dashboard/organizations`} className="text-zinc-900">
					Create or join an organization
				</a>
				<br />•{" "}
				<a href={`${appUrl}/dashboard/security`} className="text-zinc-900">
					Two-factor + passkeys
				</a>
			</Text>

			<Hr className="my-8 border-zinc-200" />

			<Text className="text-xs text-zinc-500">
				Stuck? Just reply to this email — a real human will read it.
			</Text>
		</EmailLayout>
	);
}
