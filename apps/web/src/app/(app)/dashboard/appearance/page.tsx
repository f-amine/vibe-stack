import { redirect } from "next/navigation";

// Consolidated into /dashboard/settings (Appearance tab).
export default function AppearancePage() {
	redirect("/dashboard/settings#appearance" as never);
}
