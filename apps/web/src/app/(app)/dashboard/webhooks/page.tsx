import { redirect } from "next/navigation";

// Consolidated into /dashboard/settings (Webhooks tab).
export default function WebhooksPage() {
	redirect("/dashboard/settings#webhooks" as never);
}
