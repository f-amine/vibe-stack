import { sendEmail } from "@starter-saas/email/client";
import MagicLink from "@starter-saas/email/templates/magic-link";
import OrgInvite from "@starter-saas/email/templates/org-invite";
import PasswordReset from "@starter-saas/email/templates/password-reset";
import VerifyEmail from "@starter-saas/email/templates/verify-email";

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
