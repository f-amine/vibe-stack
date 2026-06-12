import { Polar } from "@polar-sh/sdk";
import { env } from "@vibestack/env/server";

/** Whether a Polar access token is configured for this deployment. */
export function billingEnabled(): boolean {
	return Boolean(env.POLAR_ACCESS_TOKEN);
}

// Lazy singleton — instantiating Polar at module load means any caller
// that imports `@vibestack/billing/client` (auth does, transitively, on
// every boot) crashes when the token is absent, even if billing is never
// used. Defer to first actual API call so the app boots key-free.
let _polar: Polar | null = null;
function getPolar(): Polar {
	if (!_polar) {
		if (!env.POLAR_ACCESS_TOKEN) {
			throw new Error(
				"Billing is not configured. Set POLAR_ACCESS_TOKEN in .env to enable Polar (https://polar.sh).",
			);
		}
		_polar = new Polar({
			accessToken: env.POLAR_ACCESS_TOKEN,
			server: env.POLAR_SERVER,
		});
	}
	return _polar;
}

export const polar = new Proxy({} as Polar, {
	get(_target, prop) {
		const client = getPolar();
		const value = (client as unknown as Record<string | symbol, unknown>)[prop];
		return typeof value === "function"
			? (value as (...args: unknown[]) => unknown).bind(client)
			: value;
	},
});

export type PolarServer = "sandbox" | "production";
