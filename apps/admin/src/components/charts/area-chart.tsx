"use client";

import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

type Point = { date: string; value: number };

type Props = {
	data: Point[];
	color?: string;
	label?: string;
};

export function GrowthArea({
	data,
	color = "var(--foreground)",
	label = "Value",
}: Props) {
	return (
		<div className="h-72 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart
					data={data}
					margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
				>
					<defs>
						<linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor={color} stopOpacity={0.35} />
							<stop offset="95%" stopColor={color} stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid
						vertical={false}
						strokeDasharray="3 3"
						stroke="var(--border)"
					/>
					<XAxis
						dataKey="date"
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
						labelStyle={{ color: "var(--muted-foreground)" }}
					/>
					<Area
						type="monotone"
						dataKey="value"
						name={label}
						stroke={color}
						strokeWidth={2}
						fill="url(#grad)"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
