import projectStarsCache from "../data/project-stars.json";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

type StarsCache = {
	generatedAt: string;
	stars: Record<string, number>;
};

const cache = projectStarsCache as StarsCache;

function githubToken(): string | undefined {
	return import.meta.env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
}

function githubHeaders(token?: string): HeadersInit {
	const resolved = token ?? githubToken();
	return {
		"Content-Type": "application/json",
		"User-Agent": "railly.dev",
		...(resolved ? { Authorization: `Bearer ${resolved}` } : {}),
	};
}

async function fetchStarsLive(repos: string[], token: string): Promise<Map<string, number> | null> {
	const stars = new Map<string, number>();
	const unique = [...new Set(repos.filter(Boolean))];
	if (unique.length === 0) return stars;

	const fragments = unique
		.map((repo, i) => {
			const [owner, name] = repo.split("/");
			return `r${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { stargazerCount }`;
		})
		.join("\n");

	try {
		const res = await fetch(GITHUB_GRAPHQL, {
			method: "POST",
			headers: githubHeaders(token),
			body: JSON.stringify({ query: `query { ${fragments} }` }),
		});

		if (!res.ok) return null;

		const data = await res.json();
		if (!data.data) return null;

		for (const [i, repo] of unique.entries()) {
			stars.set(repo, data.data?.[`r${i}`]?.stargazerCount ?? 0);
		}

		return stars;
	} catch {
		return null;
	}
}

function starsFromCache(repos: string[]): Map<string, number> {
	const stars = new Map<string, number>();
	for (const repo of repos) {
		stars.set(repo, cache.stars[repo] ?? 0);
	}
	return stars;
}

export async function fetchRepoStars(repos: string[]): Promise<Map<string, number>> {
	const unique = [...new Set(repos.filter(Boolean))];
	const token = githubToken();

	if (token) {
		const live = await fetchStarsLive(unique, token);
		if (live) return live;
	}

	return starsFromCache(unique);
}

export async function withRepoStars<T extends { repo?: string }>(
	items: T[],
): Promise<(T & { stars: number })[]> {
	const repos = items.map((item) => item.repo).filter((repo): repo is string => Boolean(repo));
	const stars = await fetchRepoStars(repos);

	return items.map((item) => ({
		...item,
		stars: item.repo ? (stars.get(item.repo) ?? 0) : 0,
	}));
}
