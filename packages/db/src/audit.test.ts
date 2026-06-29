// recordAuditLog is the single sanctioned write path into the Audit
// context (CONTEXT.md invariant: audit rows are written server-side, never
// by clients, and are append-only). The interface is the test surface — we
// assert the seam generates an id, tolerates conflicts, and maps the
// optional fields without touching a live Postgres. The db module is mocked
// so importing this never constructs a real drizzle client.
import { beforeEach, describe, expect, it, vi } from "vitest";

const capture = vi.hoisted(() => ({
	rows: [] as Array<Record<string, unknown>>,
	conflictHandled: 0,
}));

const fakeDb = vi.hoisted(() => ({
	insert: (_table: unknown) => ({
		values: (row: Record<string, unknown>) => {
			capture.rows.push(row);
			return {
				onConflictDoNothing: () => {
					capture.conflictHandled += 1;
					return Promise.resolve();
				},
			};
		},
	}),
}));

vi.mock("./index", () => ({ db: fakeDb }));

import { recordAuditLog } from "./audit";

beforeEach(() => {
	capture.rows = [];
	capture.conflictHandled = 0;
});

describe("recordAuditLog", () => {
	it("generates an id and tolerates a conflict on every write", async () => {
		await recordAuditLog({ action: "affiliate.enrolled" });
		await recordAuditLog({ action: "affiliate.enrolled" });

		expect(capture.rows).toHaveLength(2);
		expect(capture.conflictHandled).toBe(2);
		const [a, b] = capture.rows;
		expect(a.id).toBeTruthy();
		expect(b.id).toBeTruthy();
		expect(a.id).not.toBe(b.id);
	});

	it("maps a full event onto the audit row", async () => {
		await recordAuditLog({
			action: "user.banned",
			targetType: "user",
			targetId: "u_123",
			actorUserId: "admin_1",
			organizationId: "org_1",
			metadata: { reason: "spam" },
			request: { ipAddress: "1.2.3.4", userAgent: "curl/8" },
		});

		const row = capture.rows[0];
		expect(row).toMatchObject({
			action: "user.banned",
			targetType: "user",
			targetId: "u_123",
			actorUserId: "admin_1",
			organizationId: "org_1",
			metadata: { reason: "spam" },
			ipAddress: "1.2.3.4",
			userAgent: "curl/8",
		});
	});

	it("defaults the optional actor/org/request fields to null when omitted", async () => {
		await recordAuditLog({ action: "onboarding.completed" });

		const row = capture.rows[0];
		expect(row.actorUserId).toBeNull();
		expect(row.organizationId).toBeNull();
		expect(row.ipAddress).toBeNull();
		expect(row.userAgent).toBeNull();
	});
});
