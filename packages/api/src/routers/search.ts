import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { search } from "../search";

export const searchRouter = router({
	query: protectedProcedure
		.input(z.object({ q: z.string().min(1).max(120) }))
		.query(async ({ ctx, input }) => {
			return search({ q: input.q, requesterId: ctx.session.user.id });
		}),
});
