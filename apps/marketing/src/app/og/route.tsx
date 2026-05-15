import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

import { OG_DIMENSIONS } from "@/lib/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const ACCENT = "#facc15"; // matches --marketing-accent
const BG = "#0a0a0a";
const FG = "#fafafa";
const MUTED = "#a3a3a3";
const LINE = "#262626";

function clamp(value: string, max: number): string {
	if (value.length <= max) {
		return value;
	}
	return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const title = clamp(
		searchParams.get("title") ?? "stack/saas — ship the interesting part.",
		90,
	);
	const subtitle = clamp(
		searchParams.get("subtitle") ?? "The boring parts are pre-wired.",
		140,
	);
	const eyebrow = clamp(searchParams.get("eyebrow") ?? "stack/saas", 40);

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				background: BG,
				color: FG,
				padding: 72,
				fontFamily: "system-ui, sans-serif",
				position: "relative",
			}}
		>
			{/* Diagonal grain accent */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(circle at 80% 20%, rgba(250, 204, 21, 0.18), transparent 50%)",
					display: "flex",
				}}
			/>

			{/* Grid */}
			<svg
				width="1200"
				height="630"
				viewBox="0 0 1200 630"
				style={{ position: "absolute", inset: 0, opacity: 0.08 }}
				role="img"
				aria-label="Decorative grid"
			>
				<defs>
					<pattern
						id="og-grid"
						width="48"
						height="48"
						patternUnits="userSpaceOnUse"
					>
						<path
							d="M 48 0 L 0 0 0 48"
							fill="none"
							stroke="#ffffff"
							strokeWidth="1"
						/>
					</pattern>
				</defs>
				<rect width="1200" height="630" fill="url(#og-grid)" />
			</svg>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 16,
					zIndex: 1,
				}}
			>
				<div
					style={{
						width: 44,
						height: 44,
						borderRadius: 10,
						background: FG,
						color: BG,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontWeight: 700,
						fontSize: 22,
					}}
				>
					S
				</div>
				<div
					style={{
						fontFamily: "ui-monospace, monospace",
						fontSize: 18,
						letterSpacing: 6,
						textTransform: "uppercase",
						color: MUTED,
						display: "flex",
					}}
				>
					{eyebrow}
				</div>
			</div>

			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					gap: 28,
					zIndex: 1,
				}}
			>
				<div
					style={{
						fontSize: title.length > 60 ? 64 : 80,
						fontWeight: 700,
						letterSpacing: -2,
						lineHeight: 1.05,
						color: FG,
						display: "flex",
						flexWrap: "wrap",
					}}
				>
					{title}
				</div>
				{subtitle ? (
					<div
						style={{
							fontSize: 28,
							color: MUTED,
							maxWidth: 920,
							display: "flex",
							flexWrap: "wrap",
						}}
					>
						{subtitle}
					</div>
				) : null}
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderTop: `1px solid ${LINE}`,
					paddingTop: 24,
					fontFamily: "ui-monospace, monospace",
					fontSize: 18,
					color: MUTED,
					letterSpacing: 4,
					textTransform: "uppercase",
					zIndex: 1,
				}}
			>
				<div style={{ display: "flex" }}>Built for serious operators</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 12,
					}}
				>
					<div
						style={{
							width: 10,
							height: 10,
							borderRadius: 999,
							background: ACCENT,
						}}
					/>
					<div style={{ display: "flex" }}>stack/saas</div>
				</div>
			</div>
		</div>,
		{
			width: OG_DIMENSIONS.width,
			height: OG_DIMENSIONS.height,
		},
	);
}
