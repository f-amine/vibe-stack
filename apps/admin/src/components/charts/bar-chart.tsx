"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

type Point = { label: string; value: number };

export function CountBar({ data }: { data: Point[] }) {
	return (
		<div className="h-64 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
				>
					<CartesianGrid
						vertical={false}
						strokeDasharray="3 3"
						stroke="var(--border)"
					/>
					<XAxis
						dataKey="label"
						stroke="var(--muted-foreground)"
						tickLine={false}
						axisLine={false}
						fontSize={11}
					/>
					<YAxis
						stroke="var(--muted-foreground)"
						tickLine={false}
						axisLine={false}
						fontSize={11}
					/>
					<Tooltip
						contentStyle={{
							background: "var(--popover)",
							border: "1px solid var(--border)",
							borderRadius: 8,
							fontSize: 12,
						}}
					/>
					<Bar dataKey="value" fill="var(--foreground)" radius={[6, 6, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
