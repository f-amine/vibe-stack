import type { ReactNode } from "react";

type Props = {
	/** Optional all-caps mono eyebrow above the title. */
	eyebrow?: string;
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: Props) {
	return (
		<header className="mb-10 border-border border-b pb-8 sm:mb-12 sm:pb-10">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2.5">
					{eyebrow ? (
						<span className="font-mono-label text-muted-foreground">
							{eyebrow}
						</span>
					) : null}
					<h1 className="font-display text-[2.25rem] leading-[1.04] tracking-[-0.018em] text-foreground sm:text-[2.75rem]">
						{title}
					</h1>
					{description ? (
						<p className="max-w-2xl text-muted-foreground text-sm leading-relaxed">
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
