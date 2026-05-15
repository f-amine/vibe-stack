import { db } from "@starter-saas/db";
import { member, organization } from "@starter-saas/db/schema/auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

export const orgRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		const rows = await db
			.select({
				id: organization.id,
				name: organization.name,
				slug: organization.slug,
				role: member.role,
				createdAt: organization.createdAt,
			})
			.from(organization)
			.innerJoin(member, eq(member.organizationId, organization.id))
			.where(eq(member.userId, ctx.session.user.id));
		return rows;
	}),
	byId: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [row] = await db
				.select()
				.from(organization)
				.innerJoin(
					member,
					and(
						eq(member.organizationId, organization.id),
						eq(member.userId, ctx.session.user.id),
					),
				)
				.where(eq(organization.id, input.id))
				.limit(1);
			return row ?? null;
		}),
});
