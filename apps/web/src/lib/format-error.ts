// Turn Better Auth / generic errors into human messages.
// Keep keys aligned with Better Auth error codes; add yours as you find them.

const FRIENDLY: Record<string, string> = {
	INVALID_EMAIL_OR_PASSWORD:
		"That email and password combination doesn't match anything we have on file.",
	INVALID_PASSWORD: "That password is incorrect.",
	USER_NOT_FOUND: "We couldn't find an account with that email.",
	EMAIL_NOT_VERIFIED:
		"Verify your email first — check your inbox for the link.",
	EMAIL_ALREADY_EXISTS:
		"An account with that email already exists. Try signing in instead.",
	USER_ALREADY_EXISTS: "That account already exists. Try signing in.",
	PASSWORD_TOO_SHORT: "Use at least 8 characters.",
	PASSWORD_TOO_LONG: "Password is too long.",
	INVALID_TOKEN: "This link is no longer valid.",
	TOKEN_EXPIRED: "This link has expired. Request a fresh one.",
	TOO_MANY_REQUESTS: "Too many tries — wait a minute, then try again.",
	UNAUTHORIZED: "You need to be signed in to do that.",
	FORBIDDEN: "You don't have permission to do that.",
	NETWORK_ERROR: "Couldn't reach the server. Check your connection.",
	INTERNAL_SERVER_ERROR:
		"Something on our end went wrong. Try again in a moment.",
	RATE_LIMIT_EXCEEDED: "Slow down — too many requests in a short time.",
	INVALID_VERIFICATION_CODE: "That code is wrong or has expired.",
	SESSION_EXPIRED: "Your session expired — please sign in again.",
	OAUTH_ACCOUNT_NOT_LINKED:
		"An account with this email already exists using another sign-in method.",
};

type ErrorLike =
	| Error
	| { code?: string; message?: string; status?: number }
	| string
	| null
	| undefined;

export function formatError(
	err: ErrorLike,
	fallback = "Something went wrong",
): string {
	if (!err) return fallback;
	if (typeof err === "string") {
		return FRIENDLY[err] ?? err;
	}
	if (err instanceof Error) {
		const code = (err as unknown as { code?: string }).code;
		if (code && FRIENDLY[code]) return FRIENDLY[code];
		return err.message || fallback;
	}
	if (err.code && FRIENDLY[err.code]) return FRIENDLY[err.code];
	return err.message || fallback;
}
