import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { polar as polarClient } from "@starter-saas/billing/client";
import { polarCheckoutProducts } from "@starter-saas/billing/plans-server";
import { createDb } from "@starter-saas/db";
import * as schema from "@starter-saas/db/schema/auth";
import { env } from "@starter-saas/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink, organization, twoFactor } from "better-auth/plugins";
// TODO: passkey plugin not exported from better-auth@1.6.9. Re-enable when upgrading.
// import { passkey } from "better-auth/plugins/passkey";

import { ac, admin as adminRole, member, owner } from "./lib/permissions";
import {
	sendMagicLink,
	sendOrgInvite,
	sendPasswordReset,
	sendVerify,
} from "./lib/send";

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		appName: "starter-saas",
		trustedOrigins: [env.CORS_ORIGIN, env.APP_URL],
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				await sendPasswordReset({ to: user.email, url });
			},
		},

		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, url }) => {
				await sendVerify({ to: user.email, name: user.name, url });
			},
		},

		socialProviders: {
			...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
				? {
						google: {
							clientId: env.GOOGLE_CLIENT_ID,
							clientSecret: env.GOOGLE_CLIENT_SECRET,
						},
					}
				: {}),
		},

		rateLimit: {
			enabled: true,
			window: 60,
			max: 100,
		},

		plugins: [
			magicLink({
				sendMagicLink: async ({ email, url }) => {
					await sendMagicLink({ to: email, url });
				},
			}),
			// passkey({ rpID: new URL(env.APP_URL).hostname, rpName: "starter-saas", origin: env.APP_URL }),
			twoFactor(),
			admin({
				defaultRole: "user",
				adminRoles: ["admin"],
			}),
			organization({
				ac,
				roles: { member, admin: adminRole, owner },
				sendInvitationEmail: async (data) => {
					const acceptUrl = `${env.APP_URL}/orgs/invitations/${data.id}`;
					await sendOrgInvite({
						to: data.email,
						inviterName: data.inviter.user.name ?? data.inviter.user.email,
						orgName: data.organization.name,
						acceptUrl,
					});
				},
				teams: { enabled: false },
				cancelPendingInvitationsOnReInvite: true,
			}),
			polar({
				client: polarClient,
				createCustomerOnSignUp: true,
				enableCustomerPortal: true,
				use: [
					checkout({
						products: polarCheckoutProducts(),
						successUrl: env.POLAR_SUCCESS_URL,
						authenticatedUsersOnly: true,
					}),
					portal(),
					...(env.POLAR_WEBHOOK_SECRET
						? [
								webhooks({
									secret: env.POLAR_WEBHOOK_SECRET,
								}),
							]
						: []),
				],
			}),
			nextCookies(),
		],
	});
}

export const auth = createAuth();

export type Auth = ReturnType<typeof createAuth>;
export type Session = Awaited<ReturnType<Auth["api"]["getSession"]>>;
