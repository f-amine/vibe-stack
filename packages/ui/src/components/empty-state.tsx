import { cn } from "@starter-saas/ui/lib/utils";
import type * as React from "react";

const VARIANTS = ["orbits", "stack", "arc", "grid"] as const;
type Variant = (typeof VARIANTS)[number];
function isVariant(v: unknown): v is Variant {
	return typeof v === "string" && (VARIANTS as readonly string[]).includes(v);
}

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
	title: string;
	description?: React.ReactNode;
	icon?: React.ReactNode;
	illustration?: Variant | React.ReactNode;
	action?: React.ReactNode;
	secondaryAction?: React.ReactNode;
};

function Illustration({ variant }: { variant: Variant }) {
	if (variant === "orbits") {
		return (
			<svg
				viewBox="0 0 120 120"
				className="h-24 w-24 text-muted-foreground"
				fill="none"
				aria-hidden
			>
				<title>orbits</title>
				<circle
					cx="60"
					cy="60"
					r="48"
					stroke="currentColor"
					strokeWidth="1"
					opacity="0.25"
				/>
				<circle
					cx="60"
					cy="60"
					r="32"
					stroke="currentColor"
					strokeWidth="1"
					opacity="0.45"
				/>
				<circle cx="60" cy="60" r="8" fill="currentColor" opacity="0.75" />
				<circle cx="108" cy="60" r="3" fill="currentColor" />
				<circle cx="60" cy="12" r="3" fill="currentColor" opacity="0.6" />
				<circle cx="92" cy="92" r="2" fill="currentColor" opacity="0.4" />
			</svg>
		);
	}

	if (variant === "stack") {
		return (
			<svg
				viewBox="0 0 120 120"
				className="h-24 w-24 text-muted-foreground"
				fill="none"
				aria-hidden
			>
				<title>stack</title>
				<rect
					x="22"
					y="74"
					width="76"
					height="14"
					rx="3"
					stroke="currentColor"
					strokeWidth="1.2"
					opacity="0.3"
				/>
				<rect
					x="22"
					y="54"
					width="76"
					height="14"
					rx="3"
					stroke="currentColor"
					strokeWidth="1.2"
					opacity="0.5"
				/>
				<rect
					x="22"
					y="34"
					width="76"
					height="14"
					rx="3"
					stroke="currentColor"
					strokeWidth="1.2"
				/>
				<circle cx="30" cy="41" r="2" fill="currentColor" />
				<rect
					x="40"
					y="40"
					width="40"
					height="2"
					rx="1"
					fill="currentColor"
					opacity="0.5"
				/>
			</svg>
		);
	}

	if (variant === "arc") {
		return (
			<svg
				viewBox="0 0 120 120"
				className="h-24 w-24 text-muted-foreground"
				fill="none"
				aria-hidden
			>
				<title>arc</title>
				<path
					d="M 16 96 A 44 44 0 0 1 104 96"
					stroke="currentColor"
					strokeWidth="1.4"
				/>
				<path
					d="M 32 96 A 28 28 0 0 1 88 96"
					stroke="currentColor"
					strokeWidth="1.4"
					opacity="0.55"
				/>
				<line
					x1="16"
					y1="96"
					x2="104"
					y2="96"
					stroke="currentColor"
					strokeWidth="1.4"
					opacity="0.35"
				/>
				<circle cx="60" cy="52" r="4" fill="currentColor" />
			</svg>
		);
	}

	// "grid"
	return (
		<svg
			viewBox="0 0 120 120"
			className="h-24 w-24 text-muted-foreground"
			fill="none"
			aria-hidden
		>
			<title>grid</title>
			<defs>
				<pattern
					id="empty-grid"
					width="14"
					height="14"
					patternUnits="userSpaceOnUse"
				>
					<path
						d="M 14 0 L 0 0 0 14"
						stroke="currentColor"
						strokeWidth="0.5"
						fill="none"
					/>
				</pattern>
			</defs>
			<rect
				x="14"
				y="14"
				width="92"
				height="92"
				fill="url(#empty-grid)"
				opacity="0.45"
			/>
			<circle cx="60" cy="60" r="6" fill="currentColor" />
		</svg>
	);
}

export function EmptyState({
	title,
	description,
	icon,
	illustration = "orbits",
	action,
	secondaryAction,
	className,
	...rest
}: EmptyStateProps) {
	const art = isVariant(illustration) ? (
		<Illustration variant={illustration} />
	) : (
		illustration
	);

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-8 py-14 text-center",
				className,
			)}
			role="status"
			aria-live="polite"
			{...rest}
		>
			<div className="text-muted-foreground">{icon ?? art}</div>
			<h3 className="mt-5 font-semibold text-base text-foreground">{title}</h3>
			{description ? (
				<p className="mt-1.5 max-w-md text-muted-foreground text-sm">
					{description}
				</p>
			) : null}
			{action || secondaryAction ? (
				<div className="mt-6 flex flex-col items-center gap-2 sm:flex-row">
					{action}
					{secondaryAction}
				</div>
			) : null}
		</div>
	);
}
