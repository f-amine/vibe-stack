// Minimal authenticated `/api/v1` endpoint that demonstrates the bearer-token
// auth middleware powered by `verifyApiKey()`. Real public-API routes should
// share `verifyApiKey()` rather than re-implementing the lookup.

import { bearerToken, verifyApiKey } from "@starter-saas/api/api-keys";
import { db } from "@starter-saas/db";
import { user } from "@starter-saas/db/schema/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const token = bearerToken(request.headers.get("authorization"));
	const auth = await verifyApiKey(token);
	if (!auth) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}

	const [u] = await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(eq(user.id, auth.userId))
		.limit(1);
	if (!u) {
		return NextResponse.json({ error: "user_not_found" }, { status: 404 });
	}

	return NextResponse.json({
		user: u,
		keyId: auth.id,
		scopes: auth.scopes,
	});
}
