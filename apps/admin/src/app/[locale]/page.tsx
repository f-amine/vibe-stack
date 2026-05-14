import { requireAdmin } from "@/lib/require-admin";

export default async function AdminHome() {
	const session = await requireAdmin();
	return (
		<div>
			<h1 className="font-bold text-3xl">Admin overview</h1>
			<p className="mt-2 text-muted-foreground text-sm">
				Signed in as {session.user.email}
			</p>
		</div>
	);
}
