import { Button } from "@vibestack/ui/components/button";
import Link from "next/link";

export default function NotFound() {
	return (
		<main className="flex flex-col items-center justify-center py-24 text-center">
			<p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
				404
			</p>
			<h1 className="mt-3 font-semibold text-3xl tracking-tight">
				This page doesn't exist.
			</h1>
			<p className="mt-3 max-w-md text-muted-foreground text-sm">
				Nothing lives at this address. The overview has the numbers you came
				for.
			</p>
			<div className="mt-8">
				<Button render={<Link href="/" />}>Back to overview</Button>
			</div>
		</main>
	);
}
