import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

type Props = {
	name?: string;
	verifyUrl: string;
};

export default function VerifyEmail({ name, verifyUrl }: Props) {
	return (
		<EmailLayout preview="Verify your email address">
			<Heading className="font-semibold text-xl">
				{name ? `Welcome, ${name}!` : "Welcome!"}
			</Heading>
			<Text>Confirm your email address to finish creating your account.</Text>
			<Button
				href={verifyUrl}
				className="rounded-md bg-black px-4 py-2 text-white"
			>
				Verify email
			</Button>
			<Text className="mt-6 text-neutral-500 text-xs">
				If the button doesn't work, paste this link: {verifyUrl}
			</Text>
		</EmailLayout>
	);
}
