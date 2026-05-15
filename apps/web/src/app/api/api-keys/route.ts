import { issueApiKey, listApiKeys } from "@starter-saas/api/api-keys";
import { auth } from "@starter-saas/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const issueSchema = z.object({
	name: z.string().min(1).max(120),
	scopes: z.array(z.string().min(1).max(40)).max(20).optional(),
	expiresAt: z
		.string()
		.datetime()
		.optional()
		.transform((s) => (s ? new Date(s) : null)),
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
	const rows = await listApiKeys(user.id);
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
	const parsed = issueSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "invalid_input", details: parsed.error.format() },
			{ status: 400 },
		);
	}
	const result = await issueApiKey({
		userId: user.id,
		name: parsed.data.name,
		scopes: parsed.data.scopes,
		expiresAt: parsed.data.expiresAt,
	});
	return NextResponse.json(result);
}
