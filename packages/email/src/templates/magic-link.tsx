import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

type Props = {
	url: string;
};

export default function MagicLink({ url }: Props) {
	return (
		<EmailLayout preview="Your sign-in link">
			<Heading className="font-semibold text-xl">Sign in</Heading>
			<Text>
				Click the button below to sign in. This link expires in 10 minutes.
			</Text>
			<Button href={url} className="rounded-md bg-black px-4 py-2 text-white">
				Sign in
			</Button>
			<Text className="mt-6 text-neutral-500 text-xs">
				Didn't request this? Ignore this email.
			</Text>
		</EmailLayout>
	);
}
