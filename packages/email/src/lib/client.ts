import { env } from "@vibestack/env/server";
import type { ReactElement } from "react";
import { Resend } from "resend";

// Lazy singleton — instantiating Resend at module load means any caller
// that imports `@vibestack/email` pays the cost (and crashes if the
// key is absent) even when no email is actually sent. Defer to first use.
let _resend: Resend | null = null;
function getResend(): Resend {
	if (!_resend) {
		if (!env.RESEND_API_KEY) {
			throw new Error("RESEND_API_KEY is not set");
		}
		_resend = new Resend(env.RESEND_API_KEY);
	}
	return _resend;
}

// Kept as an export for direct callers (webhooks etc.) — same lazy path.
export const resend = new Proxy({} as Resend, {
	get(_target, prop) {
		const r = getResend();
		const value = (r as unknown as Record<string | symbol, unknown>)[prop];
		return typeof value === "function"
			? (value as () => unknown).bind(r)
			: value;
	},
});

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
	const { data, error } = await getResend().emails.send({
		from: from ?? env.EMAIL_FROM,
		to,
		subject,
		react,
		replyTo,
	});
	if (error) throw error;
	return data;
}
