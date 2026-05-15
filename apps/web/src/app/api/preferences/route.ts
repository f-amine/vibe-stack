import { getPreferences, setPreferences } from "@vibestack/api/preferences";
import { auth } from "@vibestack/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
	theme: z.enum(["light", "dark", "system"]).optional(),
	density: z.enum(["compact", "comfortable", "spacious"]).optional(),
	locale: z.string().min(2).max(8).optional(),
});

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const prefs = await getPreferences(session.user.id);
	return NextResponse.json(prefs);
}

export async function PATCH(request: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}
	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "invalid_input", details: parsed.error.format() },
			{ status: 400 },
		);
	}
	const next = await setPreferences(session.user.id, parsed.data);
	return NextResponse.json(next);
}
