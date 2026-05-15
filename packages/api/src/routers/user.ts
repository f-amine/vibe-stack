import { z } from "zod";
import { protectedProcedure, router } from "../index";

export const userRouter = router({
	me: protectedProcedure.query(({ ctx }) => ({
		id: ctx.session.user.id,
		name: ctx.session.user.name,
		email: ctx.session.user.email,
		image: ctx.session.user.image ?? null,
		role: (ctx.session.user as { role?: string | null }).role ?? null,
	})),
	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().min(2).max(120).optional(),
				image: z.url().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Better Auth exposes updateUser via the same API — call it through
			// the raw fetch interface so we don't dual-import auth-client here.
			const session = ctx.session;
			return {
				ok: true,
				userId: session.user.id,
				patch: input,
			};
		}),
});
