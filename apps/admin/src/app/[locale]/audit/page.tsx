import { db } from "@starter-saas/db";
import { auditLog } from "@starter-saas/db/schema/audit";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/require-admin";

export default async function AuditPage() {
	await requireAdmin();
	const rows = await db
		.select()
		.from(auditLog)
		.orderBy(desc(auditLog.createdAt))
		.limit(200);
	return (
		<div>
			<h1 className="font-bold text-3xl">Audit log</h1>
			<table className="mt-6 w-full text-sm">
				<thead className="border-b text-left">
					<tr>
						<th className="py-2">When</th>
						<th>Action</th>
						<th>Actor</th>
						<th>Target</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r) => (
						<tr key={r.id} className="border-b">
							<td className="py-2">{r.createdAt.toISOString()}</td>
							<td>{r.action}</td>
							<td>{r.actorUserId ?? "—"}</td>
							<td>{r.targetType ? `${r.targetType}#${r.targetId}` : "—"}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
