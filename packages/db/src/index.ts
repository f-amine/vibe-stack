import { env } from "@vibestack/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export function createDb() {
	return drizzle(env.DATABASE_URL, { schema });
}

export const db = createDb();

export { type AuditEvent, recordAuditLog } from "./audit";
