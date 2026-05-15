// Unified search across user-visible entities. Uses Postgres ILIKE for
// portability — once the data set gets bigger, swap to tsvector +
// to_tsquery via a generated column. Scoping: results are filtered to
// what the requesting user is allowed to see (own row + orgs they're a
// member of).

import "server-only";
import { db } from "@vibestack/db";
import { member, organization, user } from "@vibestack/db/schema/auth";
import { and, eq, ilike, inArray, or } from "drizzle-orm";

export type SearchHit = {
	type: "user" | "organization";
	id: string;
	label: string;
	detail: string;
	href: string;
};

const MAX_PER_TYPE = 8;

export async function search(opts: {
	q: string;
	requesterId: string;
}): Promise<SearchHit[]> {
	const term = opts.q.trim();
	if (term.length < 2) {
		return [];
	}
	const pattern = `%${term.replace(/[%_]/g, (m) => `\\${m}`)}%`;

	const memberships = await db
		.select({ organizationId: member.organizationId })
		.from(member)
		.where(eq(member.userId, opts.requesterId));
	const visibleOrgIds = memberships.map((m) => m.organizationId);

	const orgHits: SearchHit[] =
		visibleOrgIds.length > 0
			? await db
					.select({
						id: organization.id,
						name: organization.name,
						slug: organization.slug,
					})
					.from(organization)
					.where(
						and(
							inArray(organization.id, visibleOrgIds),
							or(
								ilike(organization.name, pattern),
								ilike(organization.slug, pattern),
							),
						),
					)
					.limit(MAX_PER_TYPE)
					.then((rows) =>
						rows.map((r) => ({
							type: "organization" as const,
							id: r.id,
							label: r.name,
							detail: r.slug ?? "—",
							href: `/dashboard/organizations/${r.id}`,
						})),
					)
			: [];

	const userScopeIds = new Set<string>([opts.requesterId]);
	if (visibleOrgIds.length > 0) {
		const sharedRows = await db
			.select({ userId: member.userId })
			.from(member)
			.where(inArray(member.organizationId, visibleOrgIds));
		for (const row of sharedRows) {
			userScopeIds.add(row.userId);
		}
	}

	const userHits: SearchHit[] = await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(
			and(
				inArray(user.id, Array.from(userScopeIds)),
				or(ilike(user.name, pattern), ilike(user.email, pattern)),
			),
		)
		.limit(MAX_PER_TYPE)
		.then((rows) =>
			rows.map((r) => ({
				type: "user" as const,
				id: r.id,
				label: r.name,
				detail: r.email,
				href: r.id === opts.requesterId ? "/dashboard/settings" : "/dashboard",
			})),
		);

	// Order: orgs first (more meaningful in a workspace context), then users.
	return [...orgHits, ...userHits].slice(0, MAX_PER_TYPE * 2);
}
