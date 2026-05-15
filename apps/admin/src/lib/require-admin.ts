import "server-only";
import { auth } from "@vibestack/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const WEB_URL = (
	process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
).replace(/\/$/, "");
const ADMIN_URL = (
	process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002"
).replace(/\/$/, "");

export async function requireAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		const url = new URL(`${WEB_URL}/sign-in`);
		url.searchParams.set("next", `${ADMIN_URL}/`);
		redirect(url.toString());
	}
	const role = (session.user as { role?: string }).role;
	if (role !== "admin") redirect(WEB_URL);
	return session;
}
