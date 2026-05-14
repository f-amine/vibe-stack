import { db } from "@starter-saas/db";
import { organization } from "@starter-saas/db/schema/auth";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/require-admin";

export default async function OrgsPage() {
	await requireAdmin();
	const orgs = await db
		.select()
		.from(organization)
		.orderBy(desc(organization.createdAt))
		.limit(200);
	return (
		<div>
			<h1 className="font-bold text-3xl">Organizations</h1>
			<ul className="mt-6 space-y-2 text-sm">
				{orgs.map((o) => (
					<li key={o.id} className="rounded border p-3">
						<div className="font-medium">{o.name}</div>
						<div className="text-muted-foreground">{o.slug}</div>
					</li>
				))}
			</ul>
		</div>
	);
}
