import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@vibestack/api/context";
import { appRouter } from "@vibestack/api/routers/index";
import type { NextRequest } from "next/server";

function handler(req: NextRequest) {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
	});
}

export { handler as GET, handler as POST };
