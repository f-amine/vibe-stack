import { deleteSubscription } from "@starter-saas/api/webhooks";
import { auth } from "@starter-saas/auth";
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
	await deleteSubscription({ userId: session.user.id, id });
	return NextResponse.json({ ok: true });
}
