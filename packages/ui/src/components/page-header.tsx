import { cn } from "@vibestack/ui/lib/utils";
import type { ReactNode } from "react";

type PageHeaderProps = {
	/** Optional all-caps mono eyebrow above the title. */
	eyebrow?: string;
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
	/**
	 * Editorial variant: display-serif title with a hairline rule under the
	 * whole header (the web app's look). Default is the plain sans variant
	 * used by the admin app.
	 */
	bordered?: boolean;
};

export function PageHeader({
	eyebrow,
	title,
	description,
	actions,
	bordered = false,
}: PageHeaderProps) {
	return (
		<header
			className={
				bordered
					? "mb-10 border-border border-b pb-8 sm:mb-12 sm:pb-10"
					: "mb-8"
			}
		>
			<div
				className={cn(
					"flex flex-col sm:flex-row sm:items-end sm:justify-between",
					bordered ? "gap-4" : "gap-3",
				)}
			>
				<div className={bordered ? "space-y-2.5" : undefined}>
					{eyebrow ? (
						<span className="font-medium font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-[0.18em]">
							{eyebrow}
						</span>
					) : null}
					{bordered ? (
						<h1 className="font-display text-[2.25rem] text-foreground leading-[1.04] tracking-[-0.018em] sm:text-[2.75rem]">
							{title}
						</h1>
					) : (
						<h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
							{title}
						</h1>
					)}
					{description ? (
						<p
							className={
								bordered
									? "max-w-2xl text-muted-foreground text-sm leading-relaxed"
									: "mt-2 max-w-xl text-muted-foreground text-sm"
							}
						>
							{description}
						</p>
					) : null}
				</div>
				{actions ? (
					<div className="flex shrink-0 items-center gap-2">{actions}</div>
				) : null}
			</div>
		</header>
	);
}
