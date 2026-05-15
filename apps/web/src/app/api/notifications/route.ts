import { auth } from "@starter-saas/auth";
import { db } from "@starter-saas/db";
import { notification } from "@starter-saas/db/schema/notification";
import { and, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}

	const rows = await db
		.select()
		.from(notification)
		.where(eq(notification.userId, session.user.id))
		.orderBy(desc(notification.createdAt))
		.limit(10);

	const unread = rows.filter((r) => r.readAt === null).length;

	return NextResponse.json(
		{ rows, unread },
		{ headers: { "cache-control": "no-store" } },
	);
}

export async function PATCH() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}

	await db
		.update(notification)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(notification.userId, session.user.id),
				isNull(notification.readAt),
			),
		);

	return NextResponse.json({ ok: true });
}
