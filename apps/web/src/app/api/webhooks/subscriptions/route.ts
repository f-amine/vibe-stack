import { createSubscription, listSubscriptions } from "@vibestack/api/webhooks";
import { auth } from "@vibestack/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
	url: z.url(),
	events: z.array(z.string().min(1)).max(40).default([]),
});

async function requireUser() {
	const session = await auth.api.getSession({ headers: await headers() });
	return session?.user ?? null;
}

export async function GET() {
	const user = await requireUser();
	if (!user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const rows = await listSubscriptions(user.id);
	return NextResponse.json({ rows });
}

export async function POST(request: Request) {
	const user = await requireUser();
	if (!user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}
	const parsed = createSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "invalid_input", details: parsed.error.format() },
			{ status: 400 },
		);
	}
	const id = await createSubscription({
		userId: user.id,
		url: parsed.data.url,
		events: parsed.data.events,
	});
	return NextResponse.json({ id });
}
