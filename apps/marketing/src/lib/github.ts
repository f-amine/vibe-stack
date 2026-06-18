// Repo identity + a cached server-side star count. getRepoStars() runs in
// RSC only; the result is revalidated hourly so we hit GitHub once an hour
// for the whole site, never per visitor.
export const GITHUB_REPO = "f-amine/vibe-stack";
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

export async function getRepoStars(): Promise<number | null> {
	try {
		const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
			headers: { Accept: "application/vnd.github+json" },
			next: { revalidate: 3600 },
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { stargazers_count?: number };
		return typeof data.stargazers_count === "number"
			? data.stargazers_count
			: null;
	} catch {
		return null;
	}
}

/** 1234 -> "1.2k", 2 -> "2". */
export function formatStars(n: number): string {
	return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : `${n}`;
}
