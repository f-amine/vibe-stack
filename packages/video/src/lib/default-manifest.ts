import type { ReelManifest } from "./types";

/**
 * Used when Remotion Studio opens the project standalone without an input
 * manifest. Demonstrates the full treatment vocabulary across one short reel
 * so designers can preview each block in isolation.
 */
export const defaultReelManifest: ReelManifest = {
	slug: "preview",
	title: "vibestack preview reel",
	hook: "The boring parts are wired.",
	cta: "vibestack.dev",
	durationSec: 30,
	fps: 30,
	dimensions: { width: 1080, height: 1920 },
	mood: "contemplative",
	shots: [
		{
			id: "01-hook",
			text: "Every SaaS, the same disease.",
			durationSec: 4,
			theme: "dark",
			treatment: {
				kind: "serif-headline",
				eyebrow: "Every SaaS, day one",
				words: [
					{ text: "the" },
					{ text: "same" },
					{ text: "disease.", accent: true },
				],
			},
		},
		{
			id: "02-code",
			text: "Half your sprint goes to auth, billing, webhooks.",
			durationSec: 5,
			theme: "dark",
			treatment: {
				kind: "code-window",
				filename: "your-saas-week-one.ts",
				caption: "yet another auth flow",
				lines: [
					{ text: "auth.signUp({ email, password });" },
					{ text: "billing.createCheckout({ priceId });", highlight: true },
					{ text: "webhooks.verify(req.body, sig);" },
					{ text: "uploads.presign({ key, contentType });" },
				],
			},
		},
		{
			id: "03-pr",
			text: "Then a senior shows up and says you reinvented the wheel.",
			durationSec: 5,
			theme: "cream",
			treatment: {
				kind: "pr-card",
				author: "senior-dev@team",
				message: "fix: stop reinventing the same plumbing",
				ago: "2 weeks ago",
				sha: "a1f3c92",
				stamp: { text: "RIPPED OUT", color: "red", rotation: -10 },
			},
		},
		{
			id: "04-metric",
			text: "vibestack ships with all of it. Day zero.",
			durationSec: 5,
			theme: "dark",
			treatment: {
				kind: "metric-tile",
				label: "Pre-wired modules",
				value: "11",
				barFraction: 0.92,
				subline:
					"auth, billing, email, R2, jobs, audit, i18n, errors, analytics, admin, content.",
			},
		},
		{
			id: "05-grid",
			text: "Standard stack so LLMs already know it.",
			durationSec: 5,
			theme: "cream",
			treatment: {
				kind: "logo-grid",
				eyebrow: "Stack LLMs already know",
				items: [
					{ mark: "Nx", name: "Next 16", ok: true },
					{ mark: "Dz", name: "Drizzle", ok: true },
					{ mark: "tR", name: "tRPC", ok: true },
					{ mark: "Ba", name: "Better Auth", ok: true },
				],
			},
		},
		{
			id: "06-cta",
			text: "vibestack dot dev.",
			durationSec: 6,
			theme: "dark",
			treatment: {
				kind: "serif-headline",
				eyebrow: "Ship the rest",
				words: [{ text: "vibestack" }, { text: ".dev", accent: true }],
				subline: "The SaaS starter where Claude writes the rest.",
			},
		},
	],
	createdAt: new Date().toISOString(),
	aiGenerated: false,
};
