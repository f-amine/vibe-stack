import { protectedProcedure, publicProcedure, router } from "../index";

import { billingRouter } from "./billing";
import { orgRouter } from "./org";
import { searchRouter } from "./search";
import { userRouter } from "./user";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		user: ctx.session.user,
	})),
	user: userRouter,
	org: orgRouter,
	billing: billingRouter,
	search: searchRouter,
});

export type AppRouter = typeof appRouter;
