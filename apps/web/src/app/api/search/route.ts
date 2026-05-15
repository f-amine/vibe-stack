import { search } from "@vibestack/api/search";
import { auth } from "@vibestack/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const url = new URL(request.url);
	const q = url.searchParams.get("q") ?? "";
	const hits = await search({ q, requesterId: session.user.id });
	return NextResponse.json({ hits });
}
