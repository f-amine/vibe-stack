// Reverse proxy for PostHog ingest traffic. Each Next app mounts this at
// /ingest/[...path]/route.ts so analytics requests look first-party to ad
// blockers + privacy tools, and so cookies can be set on the same origin.

const DEFAULT_API_HOST = "https://us.i.posthog.com";
const STATIC_HOST = "https://us-assets.i.posthog.com";

type Result = {
	body: BodyInit | null;
	init: ResponseInit;
};

function targetForPath(path: string[]): string {
	// Static assets (`/static/*`) live on a separate host; everything else
	// (capture, decide, etc.) lives on the api host.
	const isStatic = path[0] === "static";
	const baseHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "");
	const apiHost = baseHost ?? DEFAULT_API_HOST;
	const staticHost = isStatic
		? baseHost
			? `${new URL(apiHost).origin.replace("i.", "-assets.i.")}`
			: STATIC_HOST
		: apiHost;
	return isStatic ? staticHost : apiHost;
}

function buildOutgoing(request: Request, path: string[]): Request {
	const target = targetForPath(path);
	const incoming = new URL(request.url);
	const upstream = new URL(`${target}/${path.join("/")}`);
	for (const [key, value] of incoming.searchParams) {
		upstream.searchParams.set(key, value);
	}

	const headers = new Headers(request.headers);
	headers.delete("host");
	headers.delete("connection");
	headers.delete("content-length");
	headers.set("accept-encoding", "identity");

	return new Request(upstream.toString(), {
		method: request.method,
		headers,
		body:
			request.method === "GET" || request.method === "HEAD"
				? null
				: request.body,
		// @ts-expect-error — Next/undici extension required for streaming bodies.
		duplex: "half",
	});
}

async function readForward(upstreamResponse: Response): Promise<Result> {
	const headers = new Headers(upstreamResponse.headers);
	headers.delete("content-encoding");
	headers.delete("content-length");
	headers.delete("transfer-encoding");
	const body = await upstreamResponse.arrayBuffer();
	return {
		body,
		init: {
			status: upstreamResponse.status,
			statusText: upstreamResponse.statusText,
			headers,
		},
	};
}

/** Implementation of GET / POST / OPTIONS for the proxy route. */
export async function proxyPostHog(
	request: Request,
	path: string[],
): Promise<Response> {
	if (request.method === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: {
				"access-control-allow-origin": "*",
				"access-control-allow-methods": "GET,POST,OPTIONS",
				"access-control-allow-headers": "content-type,authorization",
				"access-control-max-age": "86400",
			},
		});
	}

	try {
		const outgoing = buildOutgoing(request, path);
		const upstream = await fetch(outgoing);
		const { body, init } = await readForward(upstream);
		return new Response(body, init);
	} catch (err) {
		return new Response(
			JSON.stringify({
				error: "posthog_proxy_failed",
				message: err instanceof Error ? err.message : "unknown",
			}),
			{
				status: 502,
				headers: { "content-type": "application/json" },
			},
		);
	}
}
