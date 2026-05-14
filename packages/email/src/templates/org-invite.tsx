import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

type Props = {
	inviterName: string;
	orgName: string;
	acceptUrl: string;
};

export default function OrgInvite({ inviterName, orgName, acceptUrl }: Props) {
	return (
		<EmailLayout preview={`Join ${orgName}`}>
			<Heading className="font-semibold text-xl">Join {orgName}</Heading>
			<Text>
				{inviterName} invited you to join <strong>{orgName}</strong>.
			</Text>
			<Button
				href={acceptUrl}
				className="rounded-md bg-black px-4 py-2 text-white"
			>
				Accept invitation
			</Button>
		</EmailLayout>
	);
}
