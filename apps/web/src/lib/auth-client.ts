import { passkeyClient } from "@better-auth/passkey/client";
import { polarClient } from "@polar-sh/better-auth";
import {
	adminClient,
	magicLinkClient,
	organizationClient,
	twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	plugins: [
		magicLinkClient(),
		twoFactorClient(),
		adminClient(),
		organizationClient(),
		polarClient(),
		passkeyClient(),
	],
});

export const { signIn, signUp, signOut, useSession } = authClient;
