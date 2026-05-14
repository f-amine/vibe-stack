import { env } from "@starter-saas/env/server";
import type { ReactElement } from "react";
import { Resend } from "resend";

export const resend = new Resend(env.RESEND_API_KEY);

export type SendEmailInput = {
	to: string | string[];
	subject: string;
	react: ReactElement;
	from?: string;
	replyTo?: string;
};

export async function sendEmail({
	to,
	subject,
	react,
	from,
	replyTo,
}: SendEmailInput) {
	const { data, error } = await resend.emails.send({
		from: from ?? env.EMAIL_FROM,
		to,
		subject,
		react,
		replyTo,
	});
	if (error) throw error;
	return data;
}
