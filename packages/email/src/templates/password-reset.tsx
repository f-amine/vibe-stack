import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

type Props = {
	url: string;
};

export default function PasswordReset({ url }: Props) {
	return (
		<EmailLayout preview="Reset your password">
			<Heading className="font-semibold text-xl">Reset password</Heading>
			<Text>Click below to set a new password. Link expires in 1 hour.</Text>
			<Button href={url} className="rounded-md bg-black px-4 py-2 text-white">
				Reset password
			</Button>
			<Text className="mt-6 text-neutral-500 text-xs">
				Didn't request this? Ignore this email and your password stays
				unchanged.
			</Text>
		</EmailLayout>
	);
}
