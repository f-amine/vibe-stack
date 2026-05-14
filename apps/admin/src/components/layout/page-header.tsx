import type { ReactNode } from "react";

type Props = {
	title: string;
	description?: string;
	actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: Props) {
	return (
		<div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
					{title}
				</h1>
				{description && (
					<p className="mt-2 max-w-xl text-muted-foreground text-sm">
						{description}
					</p>
				)}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}
