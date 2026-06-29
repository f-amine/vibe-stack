import { randomUUID } from "node:crypto";

import { db } from "./index";
import { type AuditLogInsert, auditLog } from "./schema/audit";

/**
 * Everything a caller must supply to record one consequential action. The id,
 * conflict policy, and immutability invariant live behind the seam — callers
 * never touch `randomUUID`, the `auditLog` schema, or `db` directly.
 */
export interface AuditEvent {
	/** `<resource>.<verb>`, e.g. `org.create`, `user.banned`. */
	action: string;
	targetType?: string;
	targetId?: string;
	actorUserId?: string | null;
	organizationId?: string | null;
	metadata?: Record<string, unknown>;
	/** Request context, when the action originates from an HTTP handler. */
	request?: { ipAddress?: string | null; userAgent?: string | null };
}

/**
 * The single sanctioned write path into the Audit context. Server-side action
 * handlers call this; clients never write audit rows directly (CONTEXT.md).
 * Append-only: rows are immutable once written, and a duplicate id is tolerated
 * rather than overwriting.
 */
export async function recordAuditLog(event: AuditEvent): Promise<void> {
	const row: AuditLogInsert = {
		id: randomUUID(),
		action: event.action,
		targetType: event.targetType,
		targetId: event.targetId,
		actorUserId: event.actorUserId ?? null,
		organizationId: event.organizationId ?? null,
		metadata: event.metadata,
		ipAddress: event.request?.ipAddress ?? null,
		userAgent: event.request?.userAgent ?? null,
	};
	await db.insert(auditLog).values(row).onConflictDoNothing();
}
