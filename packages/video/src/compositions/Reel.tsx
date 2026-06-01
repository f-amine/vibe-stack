import {
	AbsoluteFill,
	Audio,
	interpolate,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { iconFill, iconPath } from "../lib/icons";
import type { ReelManifest, Shot, Theme } from "../lib/types";

/*
 * vibestack Reel composition (1080×1920, 9:16).
 *
 * Frame structure for every shot:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │ TOP STRIP   eyebrow ●                  01/08│  ← persistent counter + chip
 *   │                                             │
 *   │ HERO ZONE   [treatment-specific content]    │  ← fills mid 50–60% of frame
 *   │                                             │
 *   │ AUX ZONE    secondary line / metric / chip  │  ← always populated
 *   │                                             │
 *   │ BOTTOM      vibe/stack ────────●  progress  │  ← signature + reel progress bar
 *   └─────────────────────────────────────────────┘
 *
 * Plus a faded oversized shot-index numeral as background watermark.
 * Net effect: no shot ever leaves the lower 40% of the frame empty.
 */

const PALETTES: Record<
	Theme,
	{
		bg: string;
		raised: string;
		line: string;
		fg: string;
		mute: string;
		gold: string;
		goldDeep: string;
		signal: string;
	}
> = {
	dark: {
		bg: "#0a0d14",
		raised: "#11151e",
		line: "#1f2536",
		fg: "#f3efe4",
		mute: "#a8a496",
		gold: "#e0b048",
		goldDeep: "#c4923a",
		signal: "#d9583e",
	},
	cream: {
		bg: "#efe9dc",
		raised: "#e6dfd0",
		line: "#d3ccba",
		fg: "#1a1f2e",
		mute: "#5a5648",
		gold: "#b88a2c",
		goldDeep: "#8e6a1f",
		signal: "#c54a30",
	},
};

const FRAUNCES = '"Fraunces", ui-serif, Georgia, serif';
const GEIST = '"Geist", ui-sans-serif, system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

const SAFE_LEFT = 80;
const SAFE_RIGHT = 80;

function asset(p: string): string {
	if (/^https?:\/\//i.test(p)) return p;
	return staticFile(p.replace(/^\//, ""));
}
function dbToVolume(db: number): number {
	return 10 ** (db / 20);
}
function lift(frame: number, delay: number, fps: number) {
	const f = Math.max(0, frame - delay);
	const t = Math.min(f / (fps * 0.55), 1);
	const eased = 1 - (1 - t) ** 4;
	return { y: (1 - eased) * 28, opacity: eased };
}
function exit(frame: number, shotFrames: number) {
	const start = Math.max(0, shotFrames - 10);
	const t = Math.min(Math.max(frame - start, 0) / 10, 1);
	return { y: -t * 12, opacity: 1 - t };
}
function springIn(frame: number, delay: number, fps: number) {
	return spring({
		frame: frame - delay,
		fps,
		config: { damping: 18, stiffness: 140, mass: 0.7 },
	});
}
function pad2(n: number): string {
	return n.toString().padStart(2, "0");
}

// ──── Persistent chrome ──────────────────────────────────────────────────────
function GridOverlay({ theme }: { theme: Theme }) {
	const p = PALETTES[theme];
	const stroke = theme === "dark" ? p.gold : p.fg;
	return (
		<svg
			aria-hidden
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				opacity: 0.05,
			}}
		>
			<title>grid</title>
			<defs>
				<pattern id="reel-grid" width="48" height="48" patternUnits="userSpaceOnUse">
					<path d="M 48 0 L 0 0 0 48" fill="none" stroke={stroke} strokeWidth="0.5" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#reel-grid)" />
		</svg>
	);
}

function IndexWatermark({
	index,
	theme,
}: {
	index: number;
	theme: Theme;
}) {
	const p = PALETTES[theme];
	return (
		<div
			aria-hidden
			style={{
				position: "absolute",
				right: -120,
				bottom: 220,
				fontFamily: FRAUNCES,
				fontWeight: 350,
				fontSize: 1100,
				lineHeight: 0.78,
				color: p.fg,
				opacity: theme === "dark" ? 0.04 : 0.06,
				letterSpacing: "-0.06em",
				pointerEvents: "none",
				userSelect: "none",
			}}
		>
			{pad2(index)}
		</div>
	);
}

function TopStrip({
	eyebrow,
	index,
	total,
	theme,
	frame,
	fps,
}: {
	eyebrow?: string;
	index: number;
	total: number;
	theme: Theme;
	frame: number;
	fps: number;
}) {
	const p = PALETTES[theme];
	const { y, opacity } = lift(frame, 0, fps);
	return (
		<div
			style={{
				position: "absolute",
				top: 80,
				left: SAFE_LEFT,
				right: SAFE_RIGHT,
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				transform: `translateY(${y * 0.3}px)`,
				opacity,
			}}
		>
			{eyebrow ? (
				<div
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 14,
						fontFamily: MONO,
						fontSize: 22,
						letterSpacing: "0.22em",
						textTransform: "uppercase",
						color: p.gold,
					}}
				>
					<span
						style={{
							width: 8,
							height: 8,
							borderRadius: 999,
							background: p.gold,
						}}
					/>
					<span>{eyebrow}</span>
				</div>
			) : (
				<span />
			)}
			<div
				style={{
					fontFamily: MONO,
					fontSize: 20,
					letterSpacing: "0.22em",
					color: p.mute,
					textTransform: "uppercase",
				}}
			>
				<span style={{ color: p.fg }}>{pad2(index)}</span>
				<span style={{ color: p.mute }}> / {pad2(total)}</span>
			</div>
		</div>
	);
}

function BottomStrip({
	theme,
	progress,
}: {
	theme: Theme;
	progress: number;
}) {
	const p = PALETTES[theme];
	return (
		<div
			style={{
				position: "absolute",
				bottom: 80,
				left: SAFE_LEFT,
				right: SAFE_RIGHT,
				display: "flex",
				alignItems: "center",
				gap: 18,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					fontFamily: MONO,
					fontSize: 18,
					letterSpacing: "0.22em",
					color: p.mute,
					textTransform: "uppercase",
				}}
			>
				<span
					style={{
						background: p.fg,
						color: p.bg,
						padding: "2px 6px",
						fontFamily: FRAUNCES,
						fontWeight: 500,
						fontSize: 20,
						letterSpacing: 0,
						textTransform: "lowercase",
					}}
				>
					vibe
				</span>
				<span style={{ color: p.mute }}>/ stack</span>
			</div>
			<div
				style={{
					flex: 1,
					height: 2,
					background: `${p.fg}14`,
					borderRadius: 999,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						width: `${Math.min(100, Math.max(0, progress * 100))}%`,
						height: "100%",
						background: p.gold,
					}}
				/>
			</div>
			<span
				style={{
					fontFamily: MONO,
					fontSize: 14,
					color: p.mute,
					letterSpacing: "0.22em",
					textTransform: "uppercase",
				}}
			>
				the saas starter
			</span>
		</div>
	);
}

// ──── Treatments — every treatment fills HERO + AUX zones ─────────────────────
function SerifHeadline({
	shot,
	frame,
	shotFrames,
	fps,
}: {
	shot: Shot;
	frame: number;
	shotFrames: number;
	fps: number;
}) {
	if (shot.treatment.kind !== "serif-headline") return null;
	const t = shot.treatment;
	const theme = shot.theme ?? "dark";
	const p = PALETTES[theme];
	const ex = exit(frame, shotFrames);

	return (
		<div
			style={{
				position: "absolute",
				inset: `260px ${SAFE_RIGHT}px 260px ${SAFE_LEFT}px`,
				display: "flex",
				flexDirection: "column",
				transform: `translateY(${ex.y}px)`,
				opacity: ex.opacity,
			}}
		>
			{/* HERO zone — left-anchored display headline */}
			<div
				style={{
					fontFamily: FRAUNCES,
					fontSize: 138,
					lineHeight: 0.98,
					letterSpacing: "-0.028em",
					color: p.fg,
					fontWeight: 350,
					maxWidth: 920,
					textAlign: "left",
				}}
			>
				{t.words.map((w, i) => {
					const delay = 8 + i * 7;
					const { y, opacity } = lift(frame, delay, fps);
					return (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: stable order
							key={i}
							style={{
								display: "inline-block",
								transform: `translateY(${y}px)`,
								opacity,
								color: w.accent ? p.gold : p.fg,
								fontStyle: w.accent ? "italic" : "normal",
								marginRight: 22,
								fontWeight: w.accent ? 500 : 350,
							}}
						>
							{w.text}
						</span>
					);
				})}
			</div>

			{/* AUX zone — push to bottom of inset */}
			<div style={{ marginTop: "auto" }}>
				{t.subline ? (
					(() => {
						const { y, opacity } = lift(frame, 14 + t.words.length * 7 + 4, fps);
						return (
							<div
								style={{
									marginBottom: 36,
									fontFamily: GEIST,
									fontSize: 38,
									lineHeight: 1.32,
									color: p.mute,
									maxWidth: 780,
									transform: `translateY(${y}px)`,
									opacity,
								}}
							>
								{t.subline}
							</div>
						);
					})()
				) : null}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 16,
					}}
				>
					<div style={{ width: 200, height: 1, background: p.gold }} />
					<span
						style={{
							fontFamily: MONO,
							fontSize: 18,
							letterSpacing: "0.22em",
							color: p.mute,
							textTransform: "uppercase",
						}}
					>
						vibestack.dev
					</span>
				</div>
			</div>
		</div>
	);
}

function CodeWindow({
	shot,
	frame,
	shotFrames,
	fps,
}: {
	shot: Shot;
	frame: number;
	shotFrames: number;
	fps: number;
}) {
	if (shot.treatment.kind !== "code-window") return null;
	const t = shot.treatment;
	const theme = shot.theme ?? "dark";
	const p = PALETTES[theme];
	const ex = exit(frame, shotFrames);
	const enter = springIn(frame, 0, fps);

	const windowBg = theme === "dark" ? "#0e1119" : "#1c1f28";
	const headerBg = theme === "dark" ? "#181d2a" : "#262a36";
	const codeFg = "#cdc9b6";

	return (
		<div
			style={{
				position: "absolute",
				inset: `260px ${SAFE_RIGHT}px 260px ${SAFE_LEFT}px`,
				display: "flex",
				flexDirection: "column",
				transform: `translateY(${ex.y}px)`,
				opacity: ex.opacity,
			}}
		>
			{/* HERO: serif lead-in line */}
			<div
				style={{
					fontFamily: FRAUNCES,
					fontSize: 76,
					lineHeight: 1.02,
					color: p.fg,
					fontWeight: 350,
					letterSpacing: "-0.022em",
					maxWidth: 820,
				}}
			>
				The same{" "}
				<em style={{ color: p.gold, fontStyle: "italic", fontWeight: 500 }}>
					three files
				</em>
				, every time.
			</div>

			{/* Window */}
			<div
				style={{
					marginTop: 44,
					alignSelf: "flex-start",
					width: "100%",
					borderRadius: 14,
					background: windowBg,
					overflow: "hidden",
					boxShadow: "0 40px 120px -30px rgba(0,0,0,0.65)",
					transform: `translateY(${(1 - enter) * 30}px) scale(${0.94 + 0.06 * enter})`,
					opacity: enter,
				}}
			>
				<div
					style={{
						background: headerBg,
						padding: "16px 20px",
						display: "flex",
						alignItems: "center",
						gap: 10,
						fontFamily: MONO,
						fontSize: 16,
						color: "#9b9684",
					}}
				>
					<span style={{ width: 10, height: 10, borderRadius: 999, background: "#4a4334" }} />
					<span style={{ width: 10, height: 10, borderRadius: 999, background: "#4a4334" }} />
					<span style={{ width: 10, height: 10, borderRadius: 999, background: "#4a4334" }} />
					<span style={{ marginLeft: 10 }}>{t.filename}</span>
				</div>

				<div
					style={{
						padding: "22px 28px 28px",
						fontFamily: MONO,
						fontSize: 24,
						lineHeight: 1.55,
						color: codeFg,
					}}
				>
					{t.lines.map((line, i) => {
						const delay = 10 + i * 5;
						const { y, opacity } = lift(frame, delay, fps);
						return (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: stable order
								key={i}
								style={{
									position: "relative",
									transform: `translateY(${y}px)`,
									opacity,
									padding: "2px 8px",
									margin: "0 -8px",
									background: line.highlight ? `${p.gold}1a` : "transparent",
									borderLeft: line.highlight
										? `3px solid ${p.gold}`
										: "3px solid transparent",
								}}
							>
								<span
									style={{
										whiteSpace: "pre",
										textDecoration: line.strike ? "line-through" : "none",
									}}
								>
									{line.text}
								</span>
							</div>
						);
					})}
				</div>

				<div
					style={{
						background: `${p.gold}1a`,
						borderTop: `1px solid ${p.gold}33`,
						padding: "12px 20px",
						fontFamily: MONO,
						fontSize: 16,
						letterSpacing: "0.22em",
						color: p.gold,
						textTransform: "uppercase",
					}}
				>
					{t.caption}
				</div>
			</div>

			{/* AUX: payoff card */}
			<div
				style={{
					marginTop: "auto",
					padding: "20px 24px",
					background: theme === "dark" ? `${p.gold}10` : `${p.gold}24`,
					border: `1px solid ${p.gold}40`,
					borderRadius: 12,
					maxWidth: 720,
				}}
			>
				<div
					style={{
						fontFamily: MONO,
						fontSize: 16,
						letterSpacing: "0.22em",
						textTransform: "uppercase",
						color: p.gold,
						marginBottom: 8,
					}}
				>
					with vibestack
				</div>
				<div
					style={{
						fontFamily: GEIST,
						fontSize: 30,
						color: p.fg,
						fontWeight: 600,
						lineHeight: 1.3,
					}}
				>
					This file already exists. So do the next ten.
				</div>
			</div>
		</div>
	);
}

function PrCard({
	shot,
	frame,
	shotFrames,
	fps,
}: {
	shot: Shot;
	frame: number;
	shotFrames: number;
	fps: number;
}) {
	if (shot.treatment.kind !== "pr-card") return null;
	const t = shot.treatment;
	const theme = shot.theme ?? "cream";
	const p = PALETTES[theme];
	const ex = exit(frame, shotFrames);
	const cardEnter = springIn(frame, 0, fps);
	const stampEnter = springIn(frame, 20, fps);

	const cardBg = theme === "cream" ? "#fbf8f0" : "#1a1f2e";
	const cardFg = theme === "cream" ? "#1a1f2e" : "#f3efe4";
	const cardMute = theme === "cream" ? "#5a5648" : "#a8a496";

	return (
		<div
			style={{
				position: "absolute",
				inset: `260px ${SAFE_RIGHT}px 260px ${SAFE_LEFT}px`,
				display: "flex",
				flexDirection: "column",
				transform: `translateY(${ex.y}px)`,
				opacity: ex.opacity,
			}}
		>
			{/* HERO serif lead */}
			<div
				style={{
					fontFamily: FRAUNCES,
					fontSize: 76,
					lineHeight: 1.02,
					color: p.fg,
					fontWeight: 350,
					letterSpacing: "-0.022em",
					maxWidth: 820,
				}}
			>
				A senior takes one look and{" "}
				<em style={{ color: p.gold, fontStyle: "italic", fontWeight: 500 }}>
					guts it.
				</em>
			</div>

			{/* PR card middle */}
			<div style={{ position: "relative", marginTop: 56 }}>
				<div
					style={{
						background: cardBg,
						borderRadius: 14,
						padding: "28px 36px",
						boxShadow: "0 32px 90px -30px rgba(0,0,0,0.5)",
						transform: `translateY(${(1 - cardEnter) * 30}px) scale(${0.94 + 0.06 * cardEnter}) rotate(-1.2deg)`,
						opacity: cardEnter,
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							fontFamily: MONO,
							fontSize: 20,
							color: cardMute,
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
							<span
								style={{
									width: 28,
									height: 28,
									borderRadius: 999,
									background: cardMute,
									opacity: 0.4,
								}}
							/>
							<span>{t.author}</span>
						</div>
						<span>{t.ago ?? "just now"}</span>
					</div>
					<div
						style={{
							marginTop: 20,
							fontFamily: GEIST,
							fontSize: 42,
							fontWeight: 600,
							color: cardFg,
							lineHeight: 1.18,
						}}
					>
						{t.message}
					</div>
					{t.sha ? (
						<div
							style={{
								marginTop: 16,
								fontFamily: MONO,
								fontSize: 18,
								color: cardMute,
								opacity: 0.7,
							}}
						>
							{t.sha}
						</div>
					) : null}
				</div>

				{t.stamp ? (
					(() => {
						const stamp = t.stamp;
						const stampBg =
							stamp.color === "gold"
								? p.gold
								: stamp.color === "green"
									? "#3a9a5a"
									: "#c83a23";
						return (
							<div
								style={{
									position: "absolute",
									right: -40,
									top: -36,
									padding: "16px 28px",
									background: stampBg,
									color: "#fff",
									fontFamily: GEIST,
									fontWeight: 700,
									fontSize: 36,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									transform: `rotate(${stamp.rotation}deg) scale(${0.6 + 0.4 * stampEnter})`,
									opacity: stampEnter,
									boxShadow: "0 18px 40px -10px rgba(0,0,0,0.4)",
									borderRadius: 4,
								}}
							>
								{stamp.text}
							</div>
						);
					})()
				) : null}
			</div>

			{/* AUX bottom stat list */}
			<div
				style={{
					marginTop: "auto",
					display: "flex",
					gap: 28,
					fontFamily: GEIST,
				}}
			>
				{[
					{ label: "Lines deleted", value: "+1240" },
					{ label: "Tests passing", value: "94%" },
					{ label: "Shipped", value: "+2 days" },
				].map((stat) => (
					<div key={stat.label} style={{ flex: 1 }}>
						<div
							style={{
								fontFamily: MONO,
								fontSize: 14,
								letterSpacing: "0.22em",
								textTransform: "uppercase",
								color: p.mute,
								marginBottom: 6,
							}}
						>
							{stat.label}
						</div>
						<div
							style={{
								fontFamily: FRAUNCES,
								fontSize: 56,
								fontWeight: 400,
								letterSpacing: "-0.02em",
								color: p.fg,
								lineHeight: 1,
							}}
						>
							{stat.value}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function MetricTile({
	shot,
	frame,
	fps,
}: {
	shot: Shot;
	frame: number;
	fps: number;
}) {
	if (shot.treatment.kind !== "metric-tile") return null;
	const t = shot.treatment;
	const theme = shot.theme ?? "dark";
	const p = PALETTES[theme];

	const valueLift = lift(frame, 4, fps);
	const barEnter = springIn(frame, 18, fps);
	const sublineLift = lift(frame, 24, fps);

	return (
		<div
			style={{
				position: "absolute",
				inset: `260px ${SAFE_RIGHT}px 260px ${SAFE_LEFT}px`,
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* HERO: giant numeral */}
			<div
				style={{
					fontFamily: FRAUNCES,
					fontSize: 560,
					fontWeight: 400,
					lineHeight: 0.82,
					letterSpacing: "-0.06em",
					color: p.fg,
					transform: `translateY(${valueLift.y}px)`,
					opacity: valueLift.opacity,
				}}
			>
				{t.value}
			</div>

			{/* AUX zone */}
			<div style={{ marginTop: "auto" }}>
				{t.barFraction !== undefined ? (
					<div
						style={{
							height: 8,
							background: `${p.fg}14`,
							borderRadius: 999,
							overflow: "hidden",
							marginBottom: 28,
						}}
					>
						<div
							style={{
								width: `${Math.min(1, Math.max(0, t.barFraction)) * 100 * barEnter}%`,
								height: "100%",
								background: p.gold,
							}}
						/>
					</div>
				) : null}
				<div
					style={{
						fontFamily: MONO,
						fontSize: 22,
						letterSpacing: "0.22em",
						textTransform: "uppercase",
						color: p.gold,
						marginBottom: 18,
					}}
				>
					{t.label}
				</div>
				{t.subline ? (
					<div
						style={{
							fontFamily: FRAUNCES,
							fontSize: 56,
							lineHeight: 1.08,
							color: p.fg,
							fontWeight: 350,
							letterSpacing: "-0.02em",
							maxWidth: 820,
							transform: `translateY(${sublineLift.y}px)`,
							opacity: sublineLift.opacity,
						}}
					>
						{t.subline}
					</div>
				) : null}
			</div>
		</div>
	);
}

function LogoGrid({
	shot,
	frame,
	fps,
}: {
	shot: Shot;
	frame: number;
	fps: number;
}) {
	if (shot.treatment.kind !== "logo-grid") return null;
	const t = shot.treatment;
	const theme = shot.theme ?? "dark";
	const p = PALETTES[theme];

	return (
		<div
			style={{
				position: "absolute",
				inset: `260px ${SAFE_RIGHT}px 260px ${SAFE_LEFT}px`,
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* HERO serif lead */}
			<div
				style={{
					fontFamily: FRAUNCES,
					fontSize: 76,
					lineHeight: 1.02,
					color: p.fg,
					fontWeight: 350,
					letterSpacing: "-0.022em",
					maxWidth: 820,
					marginBottom: 56,
				}}
			>
				Built on the stack{" "}
				<em style={{ color: p.gold, fontStyle: "italic", fontWeight: 500 }}>
					Claude already knows.
				</em>
			</div>

			{/* Logo grid */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					gap: 22,
					flex: 1,
				}}
			>
				{t.items.slice(0, 4).map((item, i) => {
					const enter = springIn(frame, 6 + i * 5, fps);
					const path = iconPath(item.slug);
					const fill = iconFill(item.slug, theme, p.fg);
					const mark =
						item.mark ?? item.name.replace(/[^A-Za-z]/g, "").slice(0, 2) ?? "·";
					return (
						<div
							key={item.name}
							style={{
								background: p.raised,
								border: `1px solid ${p.line}`,
								borderRadius: 18,
								padding: "28px 24px",
								display: "flex",
								alignItems: "center",
								gap: 22,
								transform: `translateY(${(1 - enter) * 24}px) scale(${0.94 + 0.06 * enter})`,
								opacity: enter,
							}}
						>
							<div
								style={{
									width: 88,
									height: 88,
									borderRadius: 20,
									background: theme === "dark" ? "#1f2536" : "#d9d2bf",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontFamily: FRAUNCES,
									fontSize: 40,
									fontWeight: 500,
									color: p.fg,
									flexShrink: 0,
								}}
							>
								{path ? (
									<svg
										viewBox="0 0 24 24"
										width="48"
										height="48"
										xmlns="http://www.w3.org/2000/svg"
										aria-hidden
									>
										<title>{item.name}</title>
										<path d={path} fill={fill} />
									</svg>
								) : (
									mark
								)}
							</div>
							<div style={{ minWidth: 0, flex: 1 }}>
								<div
									style={{
										fontFamily: GEIST,
										fontSize: 30,
										fontWeight: 600,
										color: p.fg,
										lineHeight: 1.1,
									}}
								>
									{item.name}
								</div>
								{item.sublabel ? (
									<div
										style={{
											marginTop: 6,
											fontFamily: MONO,
											fontSize: 16,
											color: p.mute,
											letterSpacing: "0.08em",
										}}
									>
										{item.sublabel}
									</div>
								) : null}
							</div>
						</div>
					);
				})}
			</div>

			{/* AUX footer */}
			<div
				style={{
					marginTop: 32,
					fontFamily: GEIST,
					fontSize: 26,
					color: p.mute,
					lineHeight: 1.4,
					maxWidth: 820,
				}}
			>
				Plus seven more modules already wired together so your agent can
				ship features, not glue code.
			</div>
		</div>
	);
}

function RepetitionList({
	shot,
	frame,
	fps,
}: {
	shot: Shot;
	frame: number;
	fps: number;
}) {
	if (shot.treatment.kind !== "repetition-list") return null;
	const t = shot.treatment;
	const theme = shot.theme ?? "cream";
	const p = PALETTES[theme];
	const items = Array.from({ length: Math.min(t.count, 7) });
	const payoffDelay = items.length * 4 + 14;
	const payoff = t.payoff ? lift(frame, payoffDelay, fps) : null;

	return (
		<div
			style={{
				position: "absolute",
				inset: `260px ${SAFE_RIGHT}px 260px ${SAFE_LEFT}px`,
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div style={{ position: "relative", flex: 1 }}>
				{items.map((_, i) => {
					const { y, opacity } = lift(frame, 4 + i * 4, fps);
					const top = i * 130;
					const left = (i % items.length) * 80;
					const isLast = i === items.length - 1;
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: stable order
							key={i}
							style={{
								position: "absolute",
								left,
								top,
								transform: `translateY(${y}px)`,
								opacity,
								fontFamily: MONO,
								fontSize: isLast ? 72 : 62,
								color: p.gold,
								whiteSpace: "nowrap",
								letterSpacing: "-0.01em",
								fontWeight: isLast ? 600 : 400,
							}}
						>
							{t.phrase}
						</div>
					);
				})}
			</div>

			{t.payoff && payoff ? (
				<div
					style={{
						fontFamily: FRAUNCES,
						fontSize: 96,
						lineHeight: 1.0,
						color: p.fg,
						fontWeight: 350,
						letterSpacing: "-0.024em",
						maxWidth: 820,
						transform: `translateY(${payoff.y}px)`,
						opacity: payoff.opacity,
					}}
				>
					{t.payoff}
				</div>
			) : null}
		</div>
	);
}

function EyebrowOnly({
	shot,
}: {
	shot: Shot;
}) {
	if (shot.treatment.kind !== "eyebrow-only") return null;
	const t = shot.treatment;
	const theme = shot.theme ?? "dark";
	const p = PALETTES[theme];

	return (
		<div
			style={{
				position: "absolute",
				inset: `260px ${SAFE_RIGHT}px 260px ${SAFE_LEFT}px`,
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
			}}
		>
			<div
				style={{
					fontFamily: FRAUNCES,
					fontSize: 220,
					lineHeight: 0.92,
					letterSpacing: "-0.04em",
					color: p.gold,
					fontWeight: 350,
					fontStyle: "italic",
				}}
			>
				{t.text}
			</div>
		</div>
	);
}

function TransitionMotif({
	shot,
	frame,
	shotFrames,
}: {
	shot: Shot;
	frame: number;
	shotFrames: number;
}) {
	if (shot.treatment.kind !== "transition") return null;
	const theme = shot.theme ?? "dark";
	const p = PALETTES[theme];
	const t = Math.min(frame / shotFrames, 1);
	const eased = 1 - (1 - t) ** 4;
	if (shot.treatment.motif === "gold-rule") {
		const width = t < 0.5 ? eased * 2 * 800 : (1 - (t - 0.5) * 2) * 800;
		return (
			<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
				<div style={{ width: Math.max(0, width), height: 1, background: p.gold }} />
			</AbsoluteFill>
		);
	}
	if (shot.treatment.motif === "split-wipe") {
		const offset = eased * 100;
		return (
			<AbsoluteFill>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: p.raised,
						transform: `translateY(-${offset}%)`,
					}}
				/>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: p.bg,
						transform: `translateY(${offset}%)`,
					}}
				/>
			</AbsoluteFill>
		);
	}
	const chars = "VIBESTACK".split("");
	return (
		<AbsoluteFill
			style={{
				alignItems: "flex-start",
				justifyContent: "center",
				flexDirection: "row",
				gap: 8,
				paddingLeft: SAFE_LEFT,
			}}
		>
			{chars.map((c, i) => {
				const a = interpolate(frame, [i * 2, i * 2 + 8], [0, 1], {
					extrapolateRight: "clamp",
				});
				return (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: cascade order
						key={i}
						style={{
							fontFamily: MONO,
							color: i % 3 === 1 ? p.gold : p.fg,
							fontSize: 80,
							letterSpacing: "0.18em",
							opacity: a,
						}}
					>
						{c}
					</span>
				);
			})}
		</AbsoluteFill>
	);
}

// ──── Shot dispatcher ────────────────────────────────────────────────────────
function pickEyebrow(shot: Shot): string | undefined {
	const t = shot.treatment;
	if (t.kind === "serif-headline") return t.eyebrow ?? "the saas trap";
	if (t.kind === "code-window") return "the trap";
	if (t.kind === "pr-card") return "code review";
	if (t.kind === "metric-tile") return t.label;
	if (t.kind === "logo-grid") return t.eyebrow ?? "your stack";
	if (t.kind === "repetition-list") return "every. single. time.";
	if (t.kind === "eyebrow-only") return undefined;
	if (t.kind === "transition") return undefined;
	return undefined;
}

function ShotContent({
	shot,
	shotFrame,
	shotFrames,
	fps,
	index,
	total,
	reelProgress,
}: {
	shot: Shot;
	shotFrame: number;
	shotFrames: number;
	fps: number;
	index: number;
	total: number;
	reelProgress: number;
}) {
	const theme = shot.theme ?? "dark";
	const p = PALETTES[theme];
	const t = shot.treatment;

	let inner: React.ReactNode = null;
	switch (t.kind) {
		case "serif-headline":
			inner = (
				<SerifHeadline shot={shot} frame={shotFrame} shotFrames={shotFrames} fps={fps} />
			);
			break;
		case "code-window":
			inner = (
				<CodeWindow shot={shot} frame={shotFrame} shotFrames={shotFrames} fps={fps} />
			);
			break;
		case "pr-card":
			inner = <PrCard shot={shot} frame={shotFrame} shotFrames={shotFrames} fps={fps} />;
			break;
		case "metric-tile":
			inner = <MetricTile shot={shot} frame={shotFrame} fps={fps} />;
			break;
		case "logo-grid":
			inner = <LogoGrid shot={shot} frame={shotFrame} fps={fps} />;
			break;
		case "repetition-list":
			inner = <RepetitionList shot={shot} frame={shotFrame} fps={fps} />;
			break;
		case "eyebrow-only":
			inner = <EyebrowOnly shot={shot} />;
			break;
		case "transition":
			inner = <TransitionMotif shot={shot} frame={shotFrame} shotFrames={shotFrames} />;
			break;
	}

	const showChrome = t.kind !== "transition" && t.kind !== "eyebrow-only";

	return (
		<AbsoluteFill style={{ backgroundColor: p.bg, overflow: "hidden" }}>
			<GridOverlay theme={theme} />
			{showChrome ? <IndexWatermark index={index} theme={theme} /> : null}
			{showChrome ? (
				<TopStrip
					eyebrow={pickEyebrow(shot)}
					index={index}
					total={total}
					theme={theme}
					frame={shotFrame}
					fps={fps}
				/>
			) : null}
			{inner}
			<div
				style={{
					position: "absolute",
					inset: 32,
					border: `1px solid ${p.line}`,
					pointerEvents: "none",
				}}
			/>
			{shot.sfx?.path ? (
				<Audio
					src={asset(shot.sfx.path)}
					startFrom={Math.round((shot.sfx.startSec ?? 0) * fps)}
					volume={dbToVolume(shot.sfx.volumeDb ?? -6)}
				/>
			) : null}
			{showChrome ? <BottomStrip theme={theme} progress={reelProgress} /> : null}
		</AbsoluteFill>
	);
}

// ──── Reel root ──────────────────────────────────────────────────────────────
export const Reel = ({ manifest }: { manifest: ReelManifest }) => {
	const { fps } = useVideoConfig();
	const frame = useCurrentFrame();

	let runningFrame = 0;
	const segments = manifest.shots.map((shot, i) => {
		const start = runningFrame;
		const frames = Math.round(shot.durationSec * fps);
		runningFrame += frames;
		return { shot, start, frames, index: i + 1 };
	});
	const totalFrames = runningFrame;
	const total = segments.length;

	return (
		<AbsoluteFill style={{ backgroundColor: PALETTES.dark.bg }}>
			{manifest.music?.path ? (
				<Audio
					src={asset(manifest.music.path)}
					volume={(f) => {
						const fadeIn = (manifest.music?.fadeInSec ?? 0.8) * fps;
						const fadeOut = (manifest.music?.fadeOutSec ?? 1.2) * fps;
						const base = dbToVolume(manifest.music?.volumeDb ?? -22);
						if (f < fadeIn) return (f / fadeIn) * base;
						if (f > totalFrames - fadeOut)
							return Math.max(0, (totalFrames - f) / fadeOut) * base;
						return base;
					}}
				/>
			) : null}

			{manifest.voiceover?.path ? (
				<Audio
					src={asset(manifest.voiceover.path)}
					volume={dbToVolume(manifest.voiceover.volumeDb ?? 0)}
				/>
			) : null}

			{segments.map(({ shot, start, frames, index }) => (
				<Sequence
					key={shot.id}
					from={start}
					durationInFrames={frames}
					name={shot.id}
				>
					<ShotContent
						shot={shot}
						shotFrame={frame - start}
						shotFrames={frames}
						fps={fps}
						index={index}
						total={total}
						reelProgress={Math.min(1, (start + (frame - start)) / Math.max(1, totalFrames))}
					/>
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
