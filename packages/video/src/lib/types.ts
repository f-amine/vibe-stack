import { z } from "zod";

/**
 * One shot of the reel. Shots stack into chapters; chapters often swap
 * theme between `dark` (deep blue-black ink, parchment fg) and `cream`
 * (warm parchment bg, ink fg). One gold accent per shot at most.
 *
 * The treatment vocabulary is *compositional*: each treatment is a small
 * scene that arrives in beats. Avoid one-shot static frames.
 */

export const ThemeSchema = z.union([z.literal("dark"), z.literal("cream")]);
export type Theme = z.infer<typeof ThemeSchema>;

const HeadlineWordSchema = z.object({
	text: z.string(),
	/** italicises + tints with the gold accent. Use on ≤2 words per headline. */
	accent: z.boolean().optional(),
});

const CodeLineSchema = z.object({
	/** Raw line text. Whitespace preserved. */
	text: z.string(),
	/** "highlight" draws a faint gold row underlay (the line that matters). */
	highlight: z.boolean().optional(),
	/** Strikes through the line with a thin diagonal — for "before" states. */
	strike: z.boolean().optional(),
});

export const ShotSchema = z.object({
	id: z.string(),
	text: z.string(), // voiceover line
	captionChunks: z
		.array(
			z.object({
				text: z.string(),
				startSec: z.number(),
				endSec: z.number(),
				accent: z.boolean().optional(),
			}),
		)
		.optional(),
	durationSec: z.number(),
	theme: ThemeSchema.optional().default("dark"),
	treatment: z.discriminatedUnion("kind", [
		/* "Eyebrow + serif headline" — the dominant building block. The
		 * eyebrow is a mono caps chip with a leading bullet. The headline
		 * is a Fraunces line where one word lifts into italic gold. */
		z.object({
			kind: z.literal("serif-headline"),
			eyebrow: z.string().optional(),
			words: z.array(HeadlineWordSchema).min(1),
			/** Optional sub line in Geist body, drops in after headline. */
			subline: z.string().optional(),
		}),

		/* A code editor mockup. Chrome bar with filename, body of lines,
		 * bottom strip with caps caption. Lines highlight in beats. */
		z.object({
			kind: z.literal("code-window"),
			filename: z.string(),
			caption: z.string(),
			lines: z.array(CodeLineSchema).min(1),
		}),

		/* GitHub-PR-comment card. Author + branch + bold message + sha.
		 * Optional stamp slaps a rotated red mark on top ("THEY LOST",
		 * "SHIPPED", "BLOCKED"). */
		z.object({
			kind: z.literal("pr-card"),
			author: z.string(),
			message: z.string(),
			sha: z.string().optional(),
			ago: z.string().optional(),
			stamp: z
				.object({
					text: z.string(),
					color: z.union([z.literal("red"), z.literal("gold"), z.literal("green")]).default("red"),
					rotation: z.number().default(-10),
				})
				.optional(),
		}),

		/* Big numeric tile. Number + progress bar + caps label.
		 * Used for "312 IMPORTANT USES" style stats. */
		z.object({
			kind: z.literal("metric-tile"),
			label: z.string(),
			value: z.string(), // e.g. "312" or "8.4 GB"
			/** Fraction 0-1 for the bar fill. Omit for no bar. */
			barFraction: z.number().min(0).max(1).optional(),
			subline: z.string().optional(),
		}),

		/* 2-4-up grid of labelled tiles (e.g. browser support, integrations).
		 * Each tile shows letter-mark + name + version + check icon. */
		z.object({
			kind: z.literal("logo-grid"),
			eyebrow: z.string().optional(),
			items: z
				.array(
					z.object({
						/** simple-icons slug. See packages/video/src/lib/icons.ts. */
						slug: z.string().optional(),
						/** 1-3 char letter glyph fallback. Auto-derived from
						 * `name` when missing. */
						mark: z.string().optional(),
						name: z.string(),
						sublabel: z.string().optional(),
						ok: z.boolean().optional().default(true),
					}),
				)
				.min(2)
				.max(6),
		}),

		/* Same phrase stacked in cascading positions. Visualises a problem
		 * before stating it. Each item arrives a beat later. */
		z.object({
			kind: z.literal("repetition-list"),
			phrase: z.string(),
			count: z.number().min(3).max(12).default(6),
			/** Optional headline that drops after the cascade. */
			payoff: z.string().optional(),
		}),

		/* Pure eyebrow transition — the 1-second breath between sections. */
		z.object({
			kind: z.literal("eyebrow-only"),
			text: z.string(),
		}),

		/* Existing motif transitions, kept for breaths. */
		z.object({
			kind: z.literal("transition"),
			motif: z.union([
				z.literal("gold-rule"),
				z.literal("split-wipe"),
				z.literal("type-cascade"),
			]),
		}),
	]),
	sfx: z
		.object({
			prompt: z.string(),
			path: z.string().optional(),
			startSec: z.number().default(0),
			volumeDb: z.number().default(-6),
		})
		.optional(),
});
export type Shot = z.infer<typeof ShotSchema>;

export const MoodSchema = z.union([
	z.literal("energetic"),
	z.literal("contemplative"),
	z.literal("urgent"),
	z.literal("chill"),
]);
export type Mood = z.infer<typeof MoodSchema>;

export const ReelManifestSchema = z.object({
	slug: z.string(),
	title: z.string(),
	hook: z.string(),
	cta: z.string(),
	durationSec: z.number().min(15).max(90).default(60),
	fps: z.number().default(30),
	dimensions: z
		.object({
			width: z.number().default(1080),
			height: z.number().default(1920),
		})
		.default({ width: 1080, height: 1920 }),
	mood: MoodSchema.default("contemplative"),
	music: z
		.object({
			path: z.string(),
			volumeDb: z.number().default(-22),
			fadeInSec: z.number().default(0.8),
			fadeOutSec: z.number().default(1.2),
		})
		.optional(),
	voiceover: z
		.object({
			path: z.string(),
			voiceId: z.string(),
			volumeDb: z.number().default(0),
		})
		.optional(),
	shots: z.array(ShotSchema).min(2),
	createdAt: z.string(),
	aiGenerated: z.boolean().default(true),
});
export type ReelManifest = z.infer<typeof ReelManifestSchema>;

export function totalDurationSec(m: ReelManifest): number {
	return m.shots.reduce((acc, s) => acc + s.durationSec, 0);
}
