"use client";

import { Button } from "@vibestack/ui/components/button";
import Link from "next/link";
import { useEffect } from "react";

type Props = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="flex flex-col items-center justify-center py-24 text-center">
			<p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
				Something broke
			</p>
			<h1 className="mt-3 font-semibold text-3xl tracking-tight">
				Something went wrong.
			</h1>
			<p className="mt-3 max-w-md text-muted-foreground text-sm">
				This page hit an error it couldn't recover from. Try again, and if it
				keeps happening, check the server logs for the reference below.
			</p>
			{error.digest ? (
				<p className="mt-3 font-mono text-muted-foreground text-xs">
					ref {error.digest}
				</p>
			) : null}
			<div className="mt-8 flex items-center gap-2">
				<Button type="button" onClick={reset}>
					Try again
				</Button>
				<Button variant="outline" render={<Link href="/" />}>
					Back to overview
				</Button>
			</div>
		</main>
	);
}
