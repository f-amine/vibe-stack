import "server-only";
import { auth } from "@starter-saas/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/sign-in");
	const role = (session.user as { role?: string }).role;
	if (role !== "admin") redirect("/");
	return session;
}
