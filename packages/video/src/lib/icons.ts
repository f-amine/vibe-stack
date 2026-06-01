/**
 * Curated brand-icon barrel. Imports only the slugs vibestack's reels
 * actually reach for, so the Remotion bundle stays tight. Add new entries
 * here when a topic demands a brand not yet listed; do not import all of
 * `simple-icons` (3000+ icons, multi-MB bundle).
 *
 * Slugs use simple-icons' canonical naming (`nextdotjs`, not `nextjs`).
 * Look up at https://simple-icons.org/.
 */
import {
	siAnthropic,
	siAstro,
	siBetterstack,
	siBiome,
	siBun,
	siClaude,
	siCloudflare,
	siDeno,
	siDocker,
	siDrizzle,
	siElevenlabs,
	siExpo,
	siFastify,
	siFigma,
	siGithub,
	siGitlab,
	siGo,
	siGoogle,
	siGooglegemini,
	siGraphql,
	siHono,
	siJavascript,
	siKubernetes,
	siLinear,
	siLinux,
	siMongodb,
	siMysql,
	siNetlify,
	siNextdotjs,
	siNodedotjs,
	siNotion,
	siNpm,
	siNuxt,
	siOpenjsfoundation,
	siPnpm,
	siPostgresql,
	siPosthog,
	siPython,
	siReact,
	siReactrouter,
	siRedis,
	siRemix,
	siResend,
	siRust,
	siSentry,
	siShadcnui,
	siStripe,
	siSupabase,
	siSvelte,
	siTailwindcss,
	siTrpc,
	siTypescript,
	siVercel,
	siVite,
	siVitest,
	siWebassembly,
	siZod,
} from "simple-icons";

export type IconRecord = {
	title: string;
	slug: string;
	hex: string;
	path: string;
};

const RAW: Array<IconRecord> = [
	siAnthropic,
	siAstro,
	siBetterstack,
	siBiome,
	siBun,
	siClaude,
	siCloudflare,
	siDeno,
	siDocker,
	siDrizzle,
	siElevenlabs,
	siExpo,
	siFastify,
	siFigma,
	siGithub,
	siGitlab,
	siGo,
	siGoogle,
	siGooglegemini,
	siGraphql,
	siHono,
	siJavascript,
	siKubernetes,
	siLinear,
	siLinux,
	siMongodb,
	siMysql,
	siNetlify,
	siNextdotjs,
	siNodedotjs,
	siNotion,
	siNpm,
	siNuxt,
	siOpenjsfoundation,
	siPnpm,
	siPostgresql,
	siPosthog,
	siPython,
	siReact,
	siReactrouter,
	siRedis,
	siRemix,
	siResend,
	siRust,
	siSentry,
	siShadcnui,
	siStripe,
	siSupabase,
	siSvelte,
	siTailwindcss,
	siTrpc,
	siTypescript,
	siVercel,
	siVite,
	siVitest,
	siWebassembly,
	siZod,
];

export const ICONS: Record<string, IconRecord> = Object.fromEntries(
	RAW.map((i) => [i.slug, i]),
);

/** Slugs whose canonical brand colour is so dark it disappears on dark
 * surfaces. Renderer should override fill with the theme foreground in
 * that case. */
const NEEDS_LIGHT_OVERRIDE = new Set<string>([
	"nextdotjs",
	"openai",
	"anthropic",
	"github",
	"vercel",
	"shadcnui",
	"openjsfoundation",
	"npm",
]);

export function iconFill(
	slug: string | undefined,
	theme: "dark" | "cream",
	fallback: string,
): string {
	if (!slug) return fallback;
	const icon = ICONS[slug];
	if (!icon) return fallback;
	if (theme === "dark" && NEEDS_LIGHT_OVERRIDE.has(slug)) return fallback;
	return `#${icon.hex}`;
}

export function iconPath(slug: string | undefined): string | null {
	if (!slug) return null;
	return ICONS[slug]?.path ?? null;
}

export const ALL_ICON_SLUGS: string[] = RAW.map((i) => i.slug).sort();
