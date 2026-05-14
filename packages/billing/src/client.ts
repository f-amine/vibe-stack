import { Polar } from "@polar-sh/sdk";
import { env } from "@starter-saas/env/server";

export const polar = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
	server: env.POLAR_SERVER,
});

export type PolarServer = "sandbox" | "production";
