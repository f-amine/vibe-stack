import { db } from "@starter-saas/db";
import { user } from "@starter-saas/db/schema/auth";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/require-admin";

export default async function UsersPage() {
	await requireAdmin();
	const users = await db
		.select()
		.from(user)
		.orderBy(desc(user.createdAt))
		.limit(200);
	return (
		<div>
			<h1 className="font-bold text-3xl">Users</h1>
			<table className="mt-6 w-full text-sm">
				<thead className="border-b text-left">
					<tr>
						<th className="py-2">Email</th>
						<th>Name</th>
						<th>Role</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{users.map((u) => (
						<tr key={u.id} className="border-b">
							<td className="py-2">{u.email}</td>
							<td>{u.name}</td>
							<td>{u.role ?? "user"}</td>
							<td>{u.createdAt.toISOString().slice(0, 10)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
