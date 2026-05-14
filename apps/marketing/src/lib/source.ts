import { loader } from "fumadocs-core/source";
import { blog, docs } from "../../.source/server";

export const source = loader({
	baseUrl: "/docs",
	source: docs.toFumadocsSource(),
});

export const blogSource = loader({
	baseUrl: "/blog",
	source: blog.toFumadocsSource(),
});
