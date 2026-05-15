// Client-side dynamic wrappers for the recharts components. Kept in a
// dedicated client module so the dynamic-import + ssr:false escape hatch
// is allowed (next/dynamic with ssr:false can only be called inside a
// "use client" boundary).
"use client";

import dynamic from "next/dynamic";

function ChartSkeleton() {
	return (
		<div
			aria-hidden
			className="h-[260px] w-full animate-pulse rounded-md bg-muted/40"
		/>
	);
}

export const GrowthArea = dynamic(
	() =>
		import("@/components/charts/area-chart").then((m) => ({
			default: m.GrowthArea,
		})),
	{
		ssr: false,
		loading: () => <ChartSkeleton />,
	},
);

export const CountBar = dynamic(
	() =>
		import("@/components/charts/bar-chart").then((m) => ({
			default: m.CountBar,
		})),
	{
		ssr: false,
		loading: () => <ChartSkeleton />,
	},
);
