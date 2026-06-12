import { passkey } from "@better-auth/passkey";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import {
	billingEnabled,
	polar as polarClient,
} from "@vibestack/billing/client";
import { polarCheckoutProducts } from "@vibestack/billing/plans-server";
import { createDb } from "@vibestack/db";
import * as schema from "@vibestack/db/schema/auth";
import { env } from "@vibestack/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink, organization, twoFactor } from "better-auth/plugins";

import { ac, admin as adminRole, member, owner } from "./lib/permissions";
import { createRedisSecondaryStorage } from "./lib/redis";
import {
	sendMagicLink,
	sendOrgInvite,
	sendPasswordReset,
	sendVerify,
} from "./lib/send";
import { maybeSendWelcomeOnVerify } from "./lib/welcome";

// Email delivery must never take an auth flow down with it: a Resend
// outage during signup would otherwise 500 the whole request. Log and
// continue — every flow has a resend/retry path in the UI.
async function trySend(label: string, send: () => Promise<unknown>) {
	try {
		await send();
	} catch (err) {
		console.error(`[auth] failed to send ${label} email:`, err);
	}
}

export function createAuth() {
	const db = createDb();
	const secondaryStorage = createRedisSecondaryStorage();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		// When REDIS_URL is set, Better Auth uses Redis as secondaryStorage
		// for rate-limit counters (see `rateLimit.storage` below).
		//
		// We pin OAuth state + verification rows + sessions to Postgres
		// regardless of Redis state — losing them when Redis hiccups is
		// catastrophic (OAuth callbacks fail with "state mismatch", users
		// get signed out). Redis is a cache for rate-limit only.
		...(secondaryStorage ? { secondaryStorage } : {}),
		verification: { storeInDatabase: true },
		session: { storeSessionInDatabase: true },
		appName: "vibestack",
		trustedOrigins: [env.CORS_ORIGIN, env.APP_URL],
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				await trySend("password-reset", () =>
					sendPasswordReset({ to: user.email, url }),
				);
			},
		},

		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, url }) => {
				await trySend("verification", () =>
					sendVerify({ to: user.email, name: user.name, url }),
				);
			},
		},

		databaseHooks: {
			user: {
				update: {
					after: async (user) => {
						// First-verified login → welcome email (idempotent via audit_log).
						await maybeSendWelcomeOnVerify({
							id: user.id,
							email: user.email,
							name: user.name,
							emailVerified: user.emailVerified,
						});
					},
				},
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
			// Route counters through Redis when configured so the limit is
			// shared across replicas + survives restarts. Without Redis the
			// in-memory default still applies per-process.
			...(secondaryStorage ? { storage: "secondary-storage" as const } : {}),
		},

		plugins: [
			magicLink({
				sendMagicLink: async ({ email, url }) => {
					await trySend("magic-link", () => sendMagicLink({ to: email, url }));
				},
			}),
			passkey({
				rpID: new URL(env.APP_URL).hostname,
				rpName: "vibestack",
				origin: env.APP_URL,
			}),
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
					await trySend("org-invite", () =>
						sendOrgInvite({
							to: data.email,
							inviterName: data.inviter.user.name ?? data.inviter.user.email,
							orgName: data.organization.name,
							acceptUrl,
						}),
					);
				},
				teams: { enabled: false },
				cancelPendingInvitationsOnReInvite: true,
			}),
			// Billing plugin only mounts when POLAR_ACCESS_TOKEN is set — the
			// app boots (and auth works) without a Polar account.
			...(billingEnabled()
				? [
						polar({
							client: polarClient,
							createCustomerOnSignUp: true,
							enableCustomerPortal: true,
							use: [
								checkout({
									products: polarCheckoutProducts(),
									successUrl: env.POLAR_SUCCESS_URL ?? `${env.APP_URL}/success`,
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
					]
				: []),
			nextCookies(),
		],
	});
}

export const auth = createAuth();

export type Auth = ReturnType<typeof createAuth>;
export type Session = Awaited<ReturnType<Auth["api"]["getSession"]>>;
