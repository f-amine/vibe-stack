import { redirect } from "next/navigation";

// Consolidated into /dashboard/settings (Security tab).
export default function SecurityPage() {
	redirect("/dashboard/settings#security" as never);
}
