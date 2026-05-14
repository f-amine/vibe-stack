export const EVENTS = {
	USER_SIGNED_UP: "user.signed_up",
	USER_SIGNED_IN: "user.signed_in",
	USER_SIGNED_OUT: "user.signed_out",
	EMAIL_VERIFIED: "email.verified",
	CHECKOUT_STARTED: "checkout.started",
	CHECKOUT_COMPLETED: "checkout.completed",
	SUBSCRIPTION_CREATED: "subscription.created",
	SUBSCRIPTION_CANCELED: "subscription.canceled",
	ORG_CREATED: "org.created",
	ORG_MEMBER_INVITED: "org.member.invited",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export type EventProps = Record<
	string,
	string | number | boolean | null | undefined
>;
