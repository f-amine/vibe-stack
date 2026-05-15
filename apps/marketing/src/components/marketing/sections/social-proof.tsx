type Mark = {
	name: string;
	glyph: React.ReactNode;
	className?: string;
};

function Diamond() {
	return (
		<svg
			viewBox="0 0 16 16"
			className="h-3.5 w-3.5"
			fill="currentColor"
			aria-hidden
		>
			<title>mark</title>
			<path d="M8 0l8 8-8 8L0 8z" />
		</svg>
	);
}

function Hex() {
	return (
		<svg
			viewBox="0 0 16 16"
			className="h-3.5 w-3.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			aria-hidden
		>
			<title>mark</title>
			<path d="M8 1.5l5.5 3.25v6.5L8 14.5 2.5 11.25v-6.5z" />
		</svg>
	);
}

function Bars() {
	return (
		<svg
			viewBox="0 0 16 16"
			className="h-3.5 w-3.5"
			fill="currentColor"
			aria-hidden
		>
			<title>mark</title>
			<rect x="1" y="3" width="3" height="10" />
			<rect x="6.5" y="6" width="3" height="7" />
			<rect x="12" y="1" width="3" height="12" />
		</svg>
	);
}

function Triangle() {
	return (
		<svg
			viewBox="0 0 16 16"
			className="h-3.5 w-3.5"
			fill="currentColor"
			aria-hidden
		>
			<title>mark</title>
			<path d="M8 1l7 13H1z" />
		</svg>
	);
}

function Circle() {
	return (
		<svg
			viewBox="0 0 16 16"
			className="h-3.5 w-3.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			aria-hidden
		>
			<title>mark</title>
			<circle cx="8" cy="8" r="6" />
			<circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
		</svg>
	);
}

function Plus() {
	return (
		<svg
			viewBox="0 0 16 16"
			className="h-3.5 w-3.5"
			fill="currentColor"
			aria-hidden
		>
			<title>mark</title>
			<rect x="6.5" y="1" width="3" height="14" />
			<rect x="1" y="6.5" width="14" height="3" />
		</svg>
	);
}

function Slash() {
	return (
		<svg
			viewBox="0 0 16 16"
			className="h-3.5 w-3.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden
		>
			<title>mark</title>
			<path d="M1 14L14 2" />
			<path d="M5 14L18 2" opacity="0.4" />
		</svg>
	);
}

function Arc() {
	return (
		<svg
			viewBox="0 0 16 16"
			className="h-3.5 w-3.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			aria-hidden
		>
			<title>mark</title>
			<path d="M2 13a6 6 0 0112 0" />
			<line x1="2" y1="13" x2="14" y2="13" />
		</svg>
	);
}

const marks: Mark[] = [
	{ name: "Halcyon", glyph: <Diamond />, className: "font-display italic" },
	{
		name: "NORTHCAPE",
		glyph: <Hex />,
		className: "font-mono tracking-[0.18em]",
	},
	{ name: "Drumlin", glyph: <Bars />, className: "font-display" },
	{ name: "Quillon", glyph: <Triangle />, className: "font-display italic" },
	{
		name: "MARLOW & CO.",
		glyph: <Circle />,
		className: "font-mono tracking-[0.16em] text-[0.78rem]",
	},
	{ name: "Brindle", glyph: <Plus />, className: "font-display" },
	{
		name: "tessera",
		glyph: <Slash />,
		className: "font-display lowercase tracking-tight",
	},
	{ name: "VERGE", glyph: <Arc />, className: "font-mono tracking-[0.22em]" },
];

export function SocialProof() {
	return (
		<section
			className="border-[color:var(--marketing-line)] border-y bg-[color:var(--marketing-bg)] py-12 sm:py-16"
			aria-label="Trusted by teams shipping serious software"
		>
			<div className="mx-auto max-w-7xl px-6 lg:px-10">
				<p className="text-center font-mono text-[0.7rem] text-[color:var(--marketing-muted)] uppercase tracking-[0.35em]">
					Trusted by teams shipping serious software
				</p>
				<ul className="mt-8 grid grid-cols-2 items-center gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-8 lg:gap-x-4">
					{marks.map((m) => (
						<li
							key={m.name}
							className="flex items-center justify-center gap-2 text-[color:var(--marketing-fg)]/55 transition-colors hover:text-[color:var(--marketing-fg)]/80"
						>
							<span className="opacity-70">{m.glyph}</span>
							<span
								className={`whitespace-nowrap text-lg leading-none ${m.className ?? ""}`}
							>
								{m.name}
							</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
