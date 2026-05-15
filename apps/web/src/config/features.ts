// Feature toggle registry — single source of truth for which features
// are exposed in this build of the starter. Flipping `enabled: false`
// hides the corresponding settings tab, sidebar link, and (for most
// features) prevents the API routes from being reachable.
//
// See docs/features/README.md for the full toggle guide.

export type FeatureKey =
	| "appearance"
	| "billing"
	| "security"
	| "passkeys"
	| "twoFactor"
	| "apiKeys"
	| "webhooks"
	| "notifications"
	| "gdpr"
	| "files"
	| "organizations"
	| "affiliate"
	| "referrals"
	| "search";

export type FeatureConfig = {
	enabled: boolean;
	/** Human label used by the settings hub tabs and sidebar. */
	label: string;
	/** Short description for docs / inline help. */
	description?: string;
};

// Edit this object to turn features on or off. Restart `pnpm dev` after
// changes (config is imported at module load).
export const features = {
	appearance: {
		enabled: true,
		label: "Appearance",
		description: "Theme, density, locale, motion preferences.",
	},
	billing: {
		enabled: true,
		label: "Billing",
		description: "Polar-backed subscriptions and plan management.",
	},
	security: {
		enabled: true,
		label: "Security",
		description: "Sessions, password, 2FA toggle, GDPR controls.",
	},
	passkeys: {
		enabled: true,
		label: "Passkeys",
		description: "WebAuthn sign-in via @better-auth/passkey.",
	},
	twoFactor: {
		enabled: true,
		label: "Two-factor",
		description: "TOTP second factor (Better Auth twoFactor plugin).",
	},
	apiKeys: {
		enabled: true,
		label: "API keys",
		description: "User-issued bearer tokens for /api/v1.",
	},
	webhooks: {
		enabled: true,
		label: "Webhooks",
		description: "Outbox-pattern outbound webhooks with retry + replay.",
	},
	notifications: {
		enabled: true,
		label: "Notifications",
		description: "In-app bell + cron-driven digest emails.",
	},
	gdpr: {
		enabled: true,
		label: "GDPR",
		description: "Data export + soft-delete account with 7d grace.",
	},
	files: {
		enabled: true,
		label: "Files",
		description: "R2-backed user file uploads with presigned PUT/GET.",
	},
	organizations: {
		enabled: true,
		label: "Organizations",
		description: "Multi-tenant workspaces with member invitations.",
	},
	affiliate: {
		enabled: false,
		label: "Affiliate program",
		description: "Code-based referrals + click attribution + payouts.",
	},
	referrals: {
		enabled: false,
		label: "Refer a friend",
		description: "Email-based invites with one-time reward credit.",
	},
	search: {
		enabled: true,
		label: "Global search",
		description: "Postgres ILIKE search + ⌘K command palette.",
	},
} as const satisfies Record<FeatureKey, FeatureConfig>;

export function isFeatureEnabled(key: FeatureKey): boolean {
	return features[key]?.enabled === true;
}
