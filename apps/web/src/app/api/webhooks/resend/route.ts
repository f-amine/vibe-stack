import { createHmac, timingSafeEqual } from "node:crypto";
import { db, recordAuditLog } from "@vibestack/db";
import { user as userTable } from "@vibestack/db/schema/auth";
import { env } from "@vibestack/env/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Svix delivers Resend webhooks. Verify signature exactly as Svix's libraries
// do, but without pulling the library — the algorithm is stable and a few
// dozen lines.
function verifySignature({
	secret,
	id,
	timestamp,
	signatureHeader,
	body,
}: {
	secret: string;
	id: string;
	timestamp: string;
	signatureHeader: string;
	body: string;
}): boolean {
	// Tolerate the documented `whsec_` prefix that Resend's dashboard hands out.
	const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
	let keyBytes: Buffer;
	try {
		keyBytes = Buffer.from(raw, "base64");
		if (keyBytes.length === 0) {
			throw new Error("empty key");
		}
	} catch {
		// Fall back to treating the secret as raw bytes.
		keyBytes = Buffer.from(raw, "utf8");
	}

	const signed = `${id}.${timestamp}.${body}`;
	const expected = createHmac("sha256", keyBytes)
		.update(signed)
		.digest("base64");
	const expectedBuf = Buffer.from(expected, "base64");

	for (const part of signatureHeader.split(" ")) {
		const [, sig] = part.split(",");
		if (!sig) {
			continue;
		}
		try {
			const provided = Buffer.from(sig, "base64");
			if (provided.length !== expectedBuf.length) {
				continue;
			}
			if (timingSafeEqual(provided, expectedBuf)) {
				return true;
			}
		} catch {
			// fall through to the next signature segment
		}
	}
	return false;
}

type ResendEventBase = {
	type: string;
	created_at: string;
	data?: {
		email_id?: string;
		to?: string[] | string;
		from?: string;
		subject?: string;
		bounce?: { type?: string; reason?: string };
		complaint?: { type?: string };
	};
};

function actionFor(eventType: string): string {
	const slug = eventType.replace(/^email\./, "").replace(/\./g, "_");
	return `resend.${slug}`;
}

function recipientOf(payload: ResendEventBase): string | null {
	const to = payload.data?.to;
	if (Array.isArray(to)) {
		return to[0] ?? null;
	}
	if (typeof to === "string") {
		return to;
	}
	return null;
}

async function actorIdFor(email: string | null): Promise<string | null> {
	if (!email) {
		return null;
	}
	const rows = await db
		.select({ id: userTable.id })
		.from(userTable)
		.where(eq(userTable.email, email))
		.limit(1);
	return rows[0]?.id ?? null;
}

export async function POST(request: Request) {
	if (!env.RESEND_WEBHOOK_SECRET) {
		return NextResponse.json(
			{ error: "webhooks_disabled", message: "RESEND_WEBHOOK_SECRET unset" },
			{ status: 503 },
		);
	}

	const id = request.headers.get("svix-id");
	const timestamp = request.headers.get("svix-timestamp");
	const signatureHeader = request.headers.get("svix-signature");
	if (!id || !timestamp || !signatureHeader) {
		return NextResponse.json(
			{ error: "missing_signature_headers" },
			{ status: 400 },
		);
	}

	const body = await request.text();
	const ok = verifySignature({
		secret: env.RESEND_WEBHOOK_SECRET,
		id,
		timestamp,
		signatureHeader,
		body,
	});
	if (!ok) {
		return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
	}

	let payload: ResendEventBase;
	try {
		payload = JSON.parse(body) as ResendEventBase;
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}
	if (!payload?.type) {
		return NextResponse.json({ error: "missing_type" }, { status: 400 });
	}

	const recipient = recipientOf(payload);
	const actorUserId = await actorIdFor(recipient);

	await recordAuditLog({
		action: actionFor(payload.type),
		actorUserId,
		targetType: "email",
		targetId: payload.data?.email_id ?? undefined,
		metadata: {
			to: recipient,
			from: payload.data?.from,
			subject: payload.data?.subject,
			bounce: payload.data?.bounce,
			complaint: payload.data?.complaint,
			svixId: id,
			createdAt: payload.created_at,
		},
	});

	return NextResponse.json({ ok: true });
}
