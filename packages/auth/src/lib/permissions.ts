import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	memberAc,
	ownerAc,
} from "better-auth/plugins/organization/access";

export const statement = {
	...defaultStatements,
	project: ["create", "read", "update", "delete"],
	billing: ["read", "manage"],
} as const;

export const ac = createAccessControl(statement);

export const member = ac.newRole({
	...memberAc.statements,
	project: ["read"],
});

export const admin = ac.newRole({
	...adminAc.statements,
	project: ["create", "read", "update", "delete"],
	billing: ["read"],
});

export const owner = ac.newRole({
	...ownerAc.statements,
	project: ["create", "read", "update", "delete"],
	billing: ["read", "manage"],
});

export const roles = { member, admin, owner };
