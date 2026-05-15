import { proxyPostHog } from "@starter-saas/analytics/proxy";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: Ctx) {
	const { path } = await params;
	return proxyPostHog(request, path);
}

export async function POST(request: NextRequest, { params }: Ctx) {
	const { path } = await params;
	return proxyPostHog(request, path);
}

export function OPTIONS(request: NextRequest) {
	return proxyPostHog(request, []);
}
