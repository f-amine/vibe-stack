// `sendEmail` has a deliberate dev fallback: with no RESEND_API_KEY it
// renders the email to plain text and prints it to the terminal, so flows
// that depend on an emailed link (verification, magic link, password
// reset) stay usable on a zero-key boot. In production the same gap is a
// hard error. These tests pin both behaviours.
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockEnv = vi.hoisted(() => ({
	NODE_ENV: "development" as "development" | "production" | "test",
	RESEND_API_KEY: undefined as string | undefined,
	EMAIL_FROM: undefined as string | undefined,
}));
vi.mock("@vibestack/env/server", () => ({ env: mockEnv }));

import { emailConfigured, sendEmail } from "./client";

// A minimal stand-in for a real template like magic-link.tsx.
const magicLinkEmail = createElement(
	"p",
	null,
	"Your magic link: https://app.example.com/magic?token=tok_123",
);

beforeEach(() => {
	mockEnv.NODE_ENV = "development";
	mockEnv.RESEND_API_KEY = undefined;
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("emailConfigured", () => {
	it("is false when RESEND_API_KEY is unset", () => {
		expect(emailConfigured()).toBe(false);
	});

	it("is true when RESEND_API_KEY is set", () => {
		mockEnv.RESEND_API_KEY = "re_test_key";
		expect(emailConfigured()).toBe(true);
	});
});

describe("sendEmail without RESEND_API_KEY", () => {
	it("in development, resolves null and logs the rendered email to the console", async () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => {});

		const result = await sendEmail({
			to: "dev@example.com",
			subject: "Sign in to vibestack",
			react: magicLinkEmail,
		});

		expect(result).toBeNull();
		expect(log).toHaveBeenCalledOnce();

		// The logged block carries everything a dev needs to continue the
		// flow: recipient, subject, and the rendered plain-text body
		// (including the link they would have clicked).
		const logged = log.mock.calls[0]?.[0] as string;
		expect(logged).toContain("to:      dev@example.com");
		expect(logged).toContain("subject: Sign in to vibestack");
		expect(logged).toContain("https://app.example.com/magic?token=tok_123");
	});

	it("in production, throws instead of silently dropping the email", async () => {
		mockEnv.NODE_ENV = "production";

		await expect(
			sendEmail({
				to: "user@example.com",
				subject: "Sign in to vibestack",
				react: magicLinkEmail,
			}),
		).rejects.toThrow(/Email is not configured/);
	});
});
