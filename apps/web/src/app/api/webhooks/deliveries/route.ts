import { listDeliveries } from "@starter-saas/api/webhooks";
import { auth } from "@starter-saas/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const rows = await listDeliveries(session.user.id);
	return NextResponse.json({ rows });
}
