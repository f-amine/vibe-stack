import { revokeApiKey } from "@vibestack/api/api-keys";
import { auth } from "@vibestack/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const { id } = await params;
	const ok = await revokeApiKey({ userId: session.user.id, id });
	if (!ok) {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}
	return NextResponse.json({ ok: true });
}
