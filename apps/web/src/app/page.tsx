import { auth } from "@vibestack/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
	const session = await auth.api.getSession({ headers: await headers() });
	redirect(session ? "/dashboard" : "/sign-in");
}
