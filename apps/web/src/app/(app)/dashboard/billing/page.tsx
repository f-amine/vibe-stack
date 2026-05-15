import { redirect } from "next/navigation";

// Consolidated into /dashboard/settings (Billing tab).
export default function BillingPage() {
	redirect("/dashboard/settings#billing" as never);
}
