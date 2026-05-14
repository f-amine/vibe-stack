import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

type Props = {
	name?: string;
	appUrl: string;
};

export default function Welcome({ name, appUrl }: Props) {
	return (
		<EmailLayout preview="Welcome aboard">
			<Heading className="font-semibold text-xl">
				Welcome{name ? `, ${name}` : ""}!
			</Heading>
			<Text>Your account is ready. Jump in whenever you like.</Text>
			<Text>
				Get started: <a href={appUrl}>{appUrl}</a>
			</Text>
		</EmailLayout>
	);
}
