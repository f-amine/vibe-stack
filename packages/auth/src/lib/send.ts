import { sendEmail } from "@vibestack/email/client";
import MagicLink from "@vibestack/email/templates/magic-link";
import OrgInvite from "@vibestack/email/templates/org-invite";
import PasswordReset from "@vibestack/email/templates/password-reset";
import VerifyEmail from "@vibestack/email/templates/verify-email";
import Welcome from "@vibestack/email/templates/welcome";
import { env } from "@vibestack/env/server";

export async function sendVerify(opts: {
	to: string;
	name?: string;
	url: string;
}) {
	return sendEmail({
		to: opts.to,
		subject: "Verify your email",
		react: VerifyEmail({ name: opts.name, verifyUrl: opts.url }),
	});
}

export async function sendMagicLink(opts: { to: string; url: string }) {
	return sendEmail({
		to: opts.to,
		subject: "Your sign-in link",
		react: MagicLink({ url: opts.url }),
	});
}

export async function sendPasswordReset(opts: { to: string; url: string }) {
	return sendEmail({
		to: opts.to,
		subject: "Reset your password",
		react: PasswordReset({ url: opts.url }),
	});
}

export async function sendWelcome(opts: { to: string; name?: string }) {
	return sendEmail({
		to: opts.to,
		subject: "Welcome aboard",
		react: Welcome({ name: opts.name, appUrl: env.APP_URL }),
	});
}

export async function sendOrgInvite(opts: {
	to: string;
	inviterName: string;
	orgName: string;
	acceptUrl: string;
}) {
	return sendEmail({
		to: opts.to,
		subject: `Join ${opts.orgName}`,
		react: OrgInvite({
			inviterName: opts.inviterName,
			orgName: opts.orgName,
			acceptUrl: opts.acceptUrl,
		}),
	});
}
