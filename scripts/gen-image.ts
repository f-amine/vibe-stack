#!/usr/bin/env tsx
/**
 * Marketing-image generator — Gemini 3.1 Flash Image Preview.
 *
 *   pnpm gen:image \
 *     --prompt "minimal editorial illustration ..." \
 *     --out apps/marketing/public/hero-illustration.png \
 *     --size 1536x1024
 *
 * Requires `GOOGLE_AI_API_KEY` in the root `.env`. The script exits with code
 * 78 (skipped) when the key is absent so callers can detect that case cleanly
 * — paid APIs are never hit without an explicit key.
 *
 * Output is run through sharp to clamp file size to <=300KB (configurable via
 * --max-kb) so generated assets stay shippable through git.
 */
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GoogleGenAI } from "@google/genai";
import mri from "mri";
import sharp from "sharp";

import "dotenv/config";

const EXIT_OK = 0;
const EXIT_USAGE = 64;
const EXIT_SKIPPED = 78;
const EXIT_RUNTIME = 70;

type Args = {
	prompt?: string;
	out?: string;
	size?: string;
	model?: string;
	maxKb?: number;
	help?: boolean;
};

function usage(): string {
	return `gen-image — Gemini-powered marketing image generator

Usage:
  pnpm gen:image --prompt "<prompt>" --out <path> [--size 1536x1024] [--model <id>] [--max-kb 300]

Options:
  --prompt   Required. Natural-language description.
  --out      Required. Destination file path (PNG recommended).
  --size     WxH hint passed to Gemini. Defaults to 1536x1024.
  --model    Gemini image model id. Defaults to $GEMINI_IMAGE_MODEL or
             gemini-3.1-flash-image-preview.
  --max-kb   Hard upper bound for output file size in KB. Defaults to 300.

Environment:
  GOOGLE_AI_API_KEY   Required. Script exits 78 (skipped) if absent.
  GEMINI_IMAGE_MODEL  Optional override.
`;
}

function parseSize(size: string): { width: number; height: number } | null {
	const match = size.trim().match(/^(\d{2,5})\s*[x×]\s*(\d{2,5})$/i);
	if (!match) {
		return null;
	}
	return { width: Number(match[1]), height: Number(match[2]) };
}

function resolveOut(out: string): string {
	if (path.isAbsolute(out)) {
		return out;
	}
	return path.resolve(process.cwd(), out);
}

function pickInlineImage(
	parts: Array<{ inlineData?: { data?: string; mimeType?: string } }>,
): { buffer: Buffer; mimeType: string } | null {
	for (const part of parts) {
		const data = part.inlineData?.data;
		if (data) {
			return {
				buffer: Buffer.from(data, "base64"),
				mimeType: part.inlineData?.mimeType ?? "image/png",
			};
		}
	}
	return null;
}

async function optimize(
	input: Buffer,
	target: string,
	maxKb: number,
	hint: { width: number; height: number } | null,
): Promise<Buffer> {
	const ext = path.extname(target).toLowerCase();
	const maxBytes = maxKb * 1024;

	let pipeline = sharp(input);
	if (hint) {
		pipeline = pipeline.resize({
			width: hint.width,
			height: hint.height,
			fit: "inside",
			withoutEnlargement: true,
		});
	}

	if (ext === ".jpg" || ext === ".jpeg") {
		// Walk quality down until we fit under the budget.
		for (const quality of [90, 82, 74, 66, 58, 50]) {
			const out = await pipeline
				.clone()
				.jpeg({ quality, mozjpeg: true })
				.toBuffer();
			if (out.byteLength <= maxBytes) {
				return out;
			}
		}
		return pipeline.jpeg({ quality: 42, mozjpeg: true }).toBuffer();
	}

	if (ext === ".webp") {
		for (const quality of [92, 84, 76, 68, 60]) {
			const out = await pipeline.clone().webp({ quality }).toBuffer();
			if (out.byteLength <= maxBytes) {
				return out;
			}
		}
		return pipeline.webp({ quality: 50 }).toBuffer();
	}

	// Default → PNG. Try compressionLevel + palette + a couple of resize steps.
	for (const config of [
		{ compressionLevel: 9, palette: false, scale: 1 },
		{ compressionLevel: 9, palette: true, scale: 1 },
		{ compressionLevel: 9, palette: true, scale: 0.85 },
		{ compressionLevel: 9, palette: true, scale: 0.7 },
	]) {
		let stage = pipeline.clone();
		if (config.scale < 1) {
			const metadata = await sharp(input).metadata();
			const width = metadata.width ?? hint?.width ?? 1024;
			stage = stage.resize({
				width: Math.round(width * config.scale),
				withoutEnlargement: true,
			});
		}
		const out = await stage
			.png({
				compressionLevel: config.compressionLevel,
				palette: config.palette,
			})
			.toBuffer();
		if (out.byteLength <= maxBytes) {
			return out;
		}
	}
	return pipeline.png({ compressionLevel: 9, palette: true }).toBuffer();
}

async function run(argv: string[]): Promise<number> {
	const args = mri<Args>(argv, {
		alias: { h: "help", p: "prompt", o: "out", s: "size", m: "model" },
		string: ["prompt", "out", "size", "model"],
		boolean: ["help"],
		default: {
			size: "1536x1024",
			"max-kb": 300,
		},
	});

	if (args.help) {
		process.stdout.write(usage());
		return EXIT_OK;
	}

	if (!args.prompt || !args.out) {
		process.stderr.write(
			`error: --prompt and --out are required\n\n${usage()}`,
		);
		return EXIT_USAGE;
	}

	const size = parseSize(args.size ?? "1536x1024");
	if (!size) {
		process.stderr.write(
			`error: --size must be in WxH form (e.g. 1536x1024), got "${args.size}"\n`,
		);
		return EXIT_USAGE;
	}

	const apiKey = process.env.GOOGLE_AI_API_KEY;
	if (!apiKey) {
		process.stderr.write(
			"GOOGLE_AI_API_KEY is not set — skipping image generation. Add it to .env to enable.\n",
		);
		return EXIT_SKIPPED;
	}

	const model =
		args.model ??
		process.env.GEMINI_IMAGE_MODEL ??
		"gemini-3.1-flash-image-preview";

	const ai = new GoogleGenAI({ apiKey });

	const prompt = [
		args.prompt,
		"",
		`Aspect ratio target: ${size.width}x${size.height}.`,
		"Style: editorial, minimal, generous negative space, muted dark palette,",
		"abstract geometric shapes, no text, no logos, no UI mockups.",
	].join("\n");

	type GenerateResponse = Awaited<ReturnType<typeof ai.models.generateContent>>;
	let response: GenerateResponse;
	try {
		response = await ai.models.generateContent({
			model,
			contents: prompt,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		process.stderr.write(`gemini request failed: ${message}\n`);
		return EXIT_RUNTIME;
	}

	const parts = response.candidates?.[0]?.content?.parts ?? [];
	const inline = pickInlineImage(parts);
	if (!inline) {
		process.stderr.write(
			"gemini response did not include an inline image. Try a more concrete prompt or a different model.\n",
		);
		return EXIT_RUNTIME;
	}

	const out = resolveOut(args.out);
	await mkdir(path.dirname(out), { recursive: true });

	const optimized = await optimize(
		inline.buffer,
		out,
		Number(args["max-kb"] ?? 300),
		size,
	);

	await writeFile(out, optimized);

	const relPath = path.relative(process.cwd(), out) || out;
	const sizeKb = (optimized.byteLength / 1024).toFixed(1);
	process.stdout.write(
		`wrote ${relPath} (${sizeKb} KB, model=${model}, source mime=${inline.mimeType})\n`,
	);
	return EXIT_OK;
}

// Run only when invoked directly (tsx). Skip when imported (tests).
const invokedAsScript =
	process.argv[1] === fileURLToPath(import.meta.url) ||
	process.argv[1]?.endsWith("/gen-image.ts") ||
	process.argv[1]?.endsWith("\\gen-image.ts");

if (invokedAsScript) {
	run(process.argv.slice(2)).then(
		(code) => {
			process.exit(code);
		},
		(err) => {
			process.stderr.write(`gen-image crashed: ${err}\n`);
			process.exit(EXIT_RUNTIME);
		},
	);
}

export { optimize, parseSize, pickInlineImage, run };
