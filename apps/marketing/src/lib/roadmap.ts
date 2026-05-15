// Pulls roadmap items from a GitHub repository via the public Issues API.
// Each issue must carry one of: `roadmap:planned`, `roadmap:in-progress`,
// `roadmap:done`. The repo + token come from env so deploys can point at
// their own fork.

export type RoadmapStatus = "planned" | "in-progress" | "done";

export type RoadmapItem = {
	id: string;
	number: number;
	title: string;
	url: string;
	status: RoadmapStatus;
	body: string | null;
	labels: string[];
	updatedAt: string;
};

const STATUS_BY_LABEL: Record<string, RoadmapStatus> = {
	"roadmap:planned": "planned",
	"roadmap:in-progress": "in-progress",
	"roadmap:done": "done",
};

function repoFromEnv(): { owner: string; repo: string } | null {
	const slug =
		process.env.NEXT_PUBLIC_GITHUB_REPO ??
		process.env.GITHUB_REPOSITORY ??
		null;
	if (!slug) {
		return null;
	}
	const [owner, repo] = slug.split("/");
	if (!owner || !repo) {
		return null;
	}
	return { owner, repo };
}

export async function fetchRoadmap(): Promise<{
	items: RoadmapItem[];
	repo: string | null;
}> {
	const target = repoFromEnv();
	if (!target) {
		return { items: [], repo: null };
	}

	const labels = Object.keys(STATUS_BY_LABEL);
	const params = new URLSearchParams({
		state: "open",
		per_page: "100",
		labels: labels.join(","),
	});
	const url = `https://api.github.com/repos/${target.owner}/${target.repo}/issues?${params.toString()}`;

	const headers: Record<string, string> = {
		accept: "application/vnd.github+json",
		"x-github-api-version": "2022-11-28",
	};
	if (process.env.GITHUB_TOKEN) {
		headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	}

	const res = await fetch(url, {
		headers,
		// ISR: refresh every 10 minutes per spec.
		next: { revalidate: 600 },
	});
	if (!res.ok) {
		return { items: [], repo: `${target.owner}/${target.repo}` };
	}

	const raw = (await res.json()) as Array<{
		id: number;
		number: number;
		title: string;
		html_url: string;
		body: string | null;
		updated_at: string;
		labels: Array<{ name?: string } | string>;
		pull_request?: unknown;
	}>;

	const items: RoadmapItem[] = [];
	for (const issue of raw) {
		if (issue.pull_request) {
			continue;
		}
		const labelNames = issue.labels
			.map((l) => (typeof l === "string" ? l : (l?.name ?? "")))
			.filter(Boolean);
		const statusLabel = labelNames.find((l) => STATUS_BY_LABEL[l]);
		if (!statusLabel) {
			continue;
		}
		items.push({
			id: String(issue.id),
			number: issue.number,
			title: issue.title,
			url: issue.html_url,
			status: STATUS_BY_LABEL[statusLabel] as RoadmapStatus,
			body: issue.body,
			labels: labelNames,
			updatedAt: issue.updated_at,
		});
	}

	return { items, repo: `${target.owner}/${target.repo}` };
}

export function groupByStatus(
	items: RoadmapItem[],
): Record<RoadmapStatus, RoadmapItem[]> {
	const groups: Record<RoadmapStatus, RoadmapItem[]> = {
		planned: [],
		"in-progress": [],
		done: [],
	};
	for (const item of items) {
		groups[item.status].push(item);
	}
	return groups;
}
