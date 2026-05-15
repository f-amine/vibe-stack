import { redirect } from "next/navigation";

// Consolidated into /dashboard/settings (API keys tab).
export default function ApiKeysPage() {
	redirect("/dashboard/settings#api-keys" as never);
}
