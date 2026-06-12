import { render } from "@react-email/components";
import { env } from "@vibestack/env/server";
import type { ReactElement } from "react";
import { Resend } from "resend";

/** Whether a Resend key is configured for this deployment. */
export function emailConfigured(): boolean {
	return Boolean(env.RESEND_API_KEY);
}

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
	// No Resend key: in dev, print the email to the terminal so flows that
	// depend on a link (verification, magic link, password reset) stay
	// usable without an account. In production, missing key is an error.
	if (!env.RESEND_API_KEY) {
		if (env.NODE_ENV === "production") {
			throw new Error(
				"Email is not configured. Set RESEND_API_KEY + EMAIL_FROM in .env to send email (https://resend.com).",
			);
		}
		const text = await render(react, { plainText: true });
		console.log(
			[
				"",
				"┌──────────────────────────────────────────────────────",
				"│ 📧 dev email (RESEND_API_KEY not set — logged, not sent)",
				`│ to:      ${Array.isArray(to) ? to.join(", ") : to}`,
				`│ subject: ${subject}`,
				"├──────────────────────────────────────────────────────",
				text.trim(),
				"└──────────────────────────────────────────────────────",
				"",
			].join("\n"),
		);
		return null;
	}

	const sender = from ?? env.EMAIL_FROM;
	if (!sender) {
		throw new Error("EMAIL_FROM is not set — required when sending email.");
	}
	const { data, error } = await getResend().emails.send({
		from: sender,
		to,
		subject,
		react,
		replyTo,
	});
	if (error) throw error;
	return data;
}
