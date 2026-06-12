// R2 storage is optional: the app must boot (and clearly report why
// uploads are off) when the R2_* env vars are absent. `r2` is a lazy
// proxy, so merely importing this package never constructs an S3 client —
// only the first real use does, and that use fails loudly when
// unconfigured. The AWS SDK itself is never exercised here.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEnv = vi.hoisted(() => ({
	R2_ENDPOINT: undefined as string | undefined,
	R2_ACCESS_KEY_ID: undefined as string | undefined,
	R2_SECRET_ACCESS_KEY: undefined as string | undefined,
	R2_BUCKET: undefined as string | undefined,
	R2_PUBLIC_URL: undefined as string | undefined,
}));
vi.mock("@vibestack/env/server", () => ({ env: mockEnv }));

import { r2, storageConfigured } from "./index";

function configureAll() {
	mockEnv.R2_ENDPOINT = "https://acct.r2.cloudflarestorage.com";
	mockEnv.R2_ACCESS_KEY_ID = "key-id";
	mockEnv.R2_SECRET_ACCESS_KEY = "secret";
	mockEnv.R2_BUCKET = "uploads";
}

beforeEach(() => {
	mockEnv.R2_ENDPOINT = undefined;
	mockEnv.R2_ACCESS_KEY_ID = undefined;
	mockEnv.R2_SECRET_ACCESS_KEY = undefined;
	mockEnv.R2_BUCKET = undefined;
});

describe("storageConfigured", () => {
	it("is false on a zero-key boot (no R2 vars at all)", () => {
		expect(storageConfigured()).toBe(false);
	});

	it("is false when any required var is missing — all four are needed", () => {
		configureAll();
		mockEnv.R2_BUCKET = undefined;
		expect(storageConfigured()).toBe(false);

		configureAll();
		mockEnv.R2_ENDPOINT = undefined;
		expect(storageConfigured()).toBe(false);

		configureAll();
		mockEnv.R2_ACCESS_KEY_ID = undefined;
		expect(storageConfigured()).toBe(false);

		configureAll();
		mockEnv.R2_SECRET_ACCESS_KEY = undefined;
		expect(storageConfigured()).toBe(false);
	});

	it("is true when endpoint, key pair, and bucket are all set", () => {
		configureAll();
		expect(storageConfigured()).toBe(true);
	});
});

describe("r2 lazy proxy", () => {
	it("throws a clear 'not configured' error on first use when R2 vars are missing", () => {
		// Touching any property (e.g. `r2.send`) is what a real call site
		// does first — that access must fail with an actionable message,
		// not a cryptic SDK error.
		expect(() => r2.send).toThrow(/File storage is not configured/);
		expect(() => r2.send).toThrow(/R2_\*/);
	});
});
