import { db } from "@vibestack/db";
import { polarCustomer, subscription } from "@vibestack/db/schema/billing";
import { and, eq, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "../index";

export const billingRouter = router({
	mySubscription: protectedProcedure.query(async ({ ctx }) => {
		const customers = await db
			.select({ id: polarCustomer.polarCustomerId })
			.from(polarCustomer)
			.where(eq(polarCustomer.userId, ctx.session.user.id));
		if (customers.length === 0) {
			return null;
		}
		const [row] = await db
			.select()
			.from(subscription)
			.where(
				and(
					inArray(
						subscription.polarCustomerId,
						customers.map((c) => c.id),
					),
					eq(subscription.status, "active"),
				),
			)
			.limit(1);
		return row ?? null;
	}),
});
