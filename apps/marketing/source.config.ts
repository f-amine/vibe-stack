import {
	defineConfig,
	defineDocs,
	frontmatterSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
	dir: "content/docs",
});

export const blog = defineDocs({
	dir: "content/blog",
	docs: {
		schema: frontmatterSchema.extend({
			date: z.string().date().optional(),
			author: z.string().optional(),
		}),
	},
});

export const changelog = defineDocs({
	dir: "content/changelog",
	docs: {
		schema: frontmatterSchema.extend({
			date: z.string().date().optional(),
			sinceSha: z.string().optional(),
			headSha: z.string().optional(),
			draft: z.boolean().optional(),
			aiGenerated: z.boolean().optional(),
			aiReviewedBy: z.string().optional(),
			breakingCount: z.number().optional(),
		}),
	},
});

export default defineConfig({});
