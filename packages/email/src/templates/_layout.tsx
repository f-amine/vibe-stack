import {
	Body,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Tailwind,
} from "@react-email/components";
import type { ReactNode } from "react";

type Props = {
	preview: string;
	children: ReactNode;
};

export function EmailLayout({ preview, children }: Props) {
	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Tailwind>
				<Body className="bg-neutral-50 font-sans">
					<Container className="mx-auto my-10 max-w-[560px] rounded-lg bg-white p-8 shadow">
						<Section>{children}</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
