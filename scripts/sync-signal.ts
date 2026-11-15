#!/usr/bin/env bun
/**
 * Snapshot of public GitHub contributions for /signal.
 * Uses GITHUB_TOKEN or `gh auth token`; keeps the existing JSON without one.
 *
 * Privacy: the token can see private repos. Only repos with
 * visibility PUBLIC reach the JSON. Private work survives only as the
 * aggregate counts GitHub already shows on the public profile.
 *
 * Usage: bun run scripts/sync-signal.ts
 */

import { execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LOGIN = "Railly";
const OUTPUT = join(import.meta.dir, "..", "src/data/signal.json");
const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const AVATAR_SIZE = 96;

function resolveToken(): string | undefined {
	if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
	try {
		const token = execSync("gh auth token", { encoding: "utf8" }).trim();
		return token || undefined;
	} catch {
		return undefined;
	}
}

const token = resolveToken();
if (!token) {
	if (existsSync(OUTPUT)) {
		console.warn("No GitHub token found. Keeping existing signal.json.");
		process.exit(0);
	}
	console.error(
		"No GitHub token found. Set GITHUB_TOKEN or run `gh auth login`.",
	);
	process.exit(1);
}

async function request(
	query: string,
	variables: Record<string, unknown> = {},
): Promise<any> {
	const res = await fetch(GITHUB_GRAPHQL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			"User-Agent": "railly.dev",
		},
		body: JSON.stringify({ query, variables }),
	});
	if (!res.ok) {
		throw new Error(`GitHub GraphQL failed: ${res.status} ${await res.text()}`);
	}
	const data = await res.json();
	if (!data.data) {
		throw new Error(
			`GitHub GraphQL failed: ${JSON.stringify(data.errors ?? data)}`,
		);
	}
	if (data.errors?.length) {
		console.warn(
			"GraphQL warnings:",
			data.errors.map((e: { message: string }) => e.message).join("; "),
		);
	}
	return data.data;
}

// A failed sync keeps the last snapshot so a GitHub outage never breaks a build.
async function gql(query: string, variables: Record<string, unknown> = {}) {
	try {
		return await request(query, variables);
	} catch (error) {
		if (!existsSync(OUTPUT)) throw error;
		console.warn(
			`GitHub sync failed, keeping existing signal.json: ${String(error).slice(0, 200)}`,
		);
		process.exit(0);
	}
}

type RepoInfo = {
	nameWithOwner: string;
	isPrivate: boolean;
	visibility: string;
	url: string;
	description: string | null;
	stargazerCount: number;
	owner: {
		login: string;
		avatarUrl: string;
		url: string;
		__typename: string;
		name?: string | null;
	};
};

const REPO_FIELDS = `
	nameWithOwner isPrivate visibility url description stargazerCount
	owner {
		__typename login url avatarUrl(size: ${AVATAR_SIZE})
		... on Organization { name }
		... on User { name }
	}
`;

const skippedPrivate = new Set<string>();
const isPublic = (repo: RepoInfo | null | undefined): repo is RepoInfo => {
	if (!repo) return false;
	const ok = repo.isPrivate === false && repo.visibility === "PUBLIC";
	if (!ok) skippedPrivate.add(repo.nameWithOwner);
	return ok;
};

// 1. Calendar and year totals (default window: the last year).
const base = await gql(`
	query {
		user(login: "${LOGIN}") {
			id login name url avatarUrl(size: ${AVATAR_SIZE})
			contributionsCollection {
				startedAt endedAt
				restrictedContributionsCount
				totalCommitContributions totalPullRequestContributions
				totalIssueContributions totalPullRequestReviewContributions
				totalRepositoryContributions
				contributionCalendar {
					totalContributions
					weeks { contributionDays { date contributionCount weekday } }
				}
			}
		}
	}
`);

const user = base.user;
const cc = user.contributionsCollection;
const startedAt = new Date(cc.startedAt);
const endedAt = new Date(cc.endedAt);
// The calendar is in the profile's time zone; startedAt is local midnight in UTC.
const offsetMs =
	startedAt.getUTCHours() * 3_600_000 + startedAt.getUTCMinutes() * 60_000;
const localDate = (iso: string) =>
	new Date(new Date(iso).getTime() - offsetMs).toISOString().slice(0, 10);

const weeks: { date: string; count: number }[][] =
	cc.contributionCalendar.weeks.map(
		(w: { contributionDays: { date: string; contributionCount: number }[] }) =>
			w.contributionDays.map((d) => ({
				date: d.date,
				count: d.contributionCount,
			})),
	);
const weekOf = new Map<string, number>();
weeks.forEach((w, i) => {
	for (const d of w) weekOf.set(d.date, i);
});

// 2. Per-repo contributions, month by month. A collection lists at most 100
// repos per kind, so monthly windows reach the long tail.
type RepoAgg = {
	info: RepoInfo;
	commits: number;
	prs: number;
	issues: number;
	reviews: number;
	weekly: number[];
	lastActive: string;
};
const repos = new Map<string, RepoAgg>();

function bump(
	info: RepoInfo,
	kind: "commits" | "prs" | "issues" | "reviews",
	count: number,
	occurredAt: string,
) {
	if (!isPublic(info)) return;
	let agg = repos.get(info.nameWithOwner);
	if (!agg) {
		agg = {
			info,
			commits: 0,
			prs: 0,
			issues: 0,
			reviews: 0,
			weekly: new Array(weeks.length).fill(0),
			lastActive: occurredAt,
		};
		repos.set(info.nameWithOwner, agg);
	}
	agg[kind] += count;
	const week = weekOf.get(localDate(occurredAt));
	if (week !== undefined) agg.weekly[week] += count;
	if (occurredAt > agg.lastActive) agg.lastActive = occurredAt;
}

const slices: [Date, Date][] = [];
for (let from = new Date(startedAt); from < endedAt; ) {
	const to = new Date(from);
	to.setUTCMonth(to.getUTCMonth() + 1);
	const end = to < endedAt ? new Date(to.getTime() - 1000) : endedAt;
	slices.push([new Date(from), end]);
	from = to;
}

const byRepo = (field: string, max: string, nodes: string) => `
	${field}(${max}) {
		repository { ${REPO_FIELDS} }
		contributions(first: 100) { totalCount pageInfo { hasNextPage } nodes { ${nodes} } }
	}
`;

let truncated = 0;
for (const [from, to] of slices) {
	const data = await gql(
		`query($from: DateTime!, $to: DateTime!) {
			user(login: "${LOGIN}") {
				contributionsCollection(from: $from, to: $to) {
					${byRepo("commitContributionsByRepository", "maxRepositories: 100", "occurredAt commitCount")}
					${byRepo("pullRequestContributionsByRepository", "maxRepositories: 100", "occurredAt")}
					${byRepo("issueContributionsByRepository", "maxRepositories: 100", "occurredAt")}
					${byRepo("pullRequestReviewContributionsByRepository", "maxRepositories: 100", "occurredAt")}
				}
			}
		}`,
		{ from: from.toISOString(), to: to.toISOString() },
	);
	const c = data.user.contributionsCollection;
	const kinds = [
		["commitContributionsByRepository", "commits"],
		["pullRequestContributionsByRepository", "prs"],
		["issueContributionsByRepository", "issues"],
		["pullRequestReviewContributionsByRepository", "reviews"],
	] as const;
	for (const [field, kind] of kinds) {
		for (const entry of c[field]) {
			if (entry.contributions.pageInfo.hasNextPage) truncated++;
			for (const node of entry.contributions.nodes) {
				bump(entry.repository, kind, node.commitCount ?? 1, node.occurredAt);
			}
		}
	}
}
if (truncated)
	console.warn(`${truncated} repo-month lists had more than 100 entries.`);

const repoList = [...repos.values()]
	.map((r) => ({
		name: r.info.nameWithOwner.split("/")[1],
		nameWithOwner: r.info.nameWithOwner,
		owner: r.info.owner.login,
		url: r.info.url,
		description: r.info.description,
		stars: r.info.stargazerCount,
		isPrivate: false as const,
		commits: r.commits,
		prs: r.prs,
		issues: r.issues,
		reviews: r.reviews,
		total: r.commits + r.prs + r.issues + r.reviews,
		lastActive: r.lastActive,
		weekly: r.weekly,
	}))
	.sort((a, b) => b.total - a.total);

// 3. Orgs (repo owners), ranked by public contributions.
const orgMap = new Map<
	string,
	{
		login: string;
		name: string | null;
		type: string;
		url: string;
		avatarUrl: string;
		total: number;
		repos: string[];
	}
>();
for (const r of repos.values()) {
	const o = r.info.owner;
	const org = orgMap.get(o.login) ?? {
		login: o.login,
		name: o.name ?? null,
		type: o.__typename,
		url: o.url,
		avatarUrl: o.avatarUrl,
		total: 0,
		repos: [],
	};
	org.total += r.commits + r.prs + r.issues + r.reviews;
	org.repos.push(r.info.nameWithOwner);
	orgMap.set(o.login, org);
}
const orgs = [...orgMap.values()]
	.map((o) => ({
		...o,
		repoCount: o.repos.length,
		repos: repoList
			.filter((r) => r.owner === o.login)
			.map((r) => r.nameWithOwner),
	}))
	.sort((a, b) => b.total - a.total);

// 4. Merged pull requests (public only).
const since = cc.startedAt.slice(0, 10);
const prSearch = await gql(`
	query {
		count: search(type: ISSUE, query: "author:${LOGIN} is:pr is:merged is:public merged:>=${since}", first: 1) { issueCount }
		recent: search(type: ISSUE, query: "author:${LOGIN} is:pr is:merged is:public sort:updated-desc", first: 100) {
			nodes {
				... on PullRequest {
					number title url mergedAt additions deletions
					repository { ${REPO_FIELDS} }
				}
			}
		}
	}
`);
const mergedPrs = prSearch.recent.nodes
	.filter(
		(pr: { repository: RepoInfo; mergedAt: string | null }) =>
			isPublic(pr.repository) && pr.mergedAt,
	)
	.map(
		(pr: {
			number: number;
			title: string;
			url: string;
			mergedAt: string;
			additions: number;
			deletions: number;
			repository: RepoInfo;
		}) => ({
			repo: pr.repository.nameWithOwner,
			owner: pr.repository.owner.login,
			ownerAvatarUrl: pr.repository.owner.avatarUrl,
			isPrivate: false as const,
			number: pr.number,
			title: pr.title,
			url: pr.url,
			mergedAt: pr.mergedAt,
			additions: pr.additions,
			deletions: pr.deletions,
		}),
	)
	.sort((a: { mergedAt: string }, b: { mergedAt: string }) =>
		b.mergedAt.localeCompare(a.mergedAt),
	)
	.slice(0, 100);

// 5. Releases he published, from the most active repos.
const releaseRepos = repoList.slice(0, 60);
const releases: {
	repo: string;
	owner: string;
	ownerAvatarUrl: string;
	isPrivate: false;
	name: string;
	tag: string;
	url: string;
	publishedAt: string;
}[] = [];
for (let i = 0; i < releaseRepos.length; i += 20) {
	const chunk = releaseRepos.slice(i, i + 20);
	const data = await gql(`query {
		${chunk
			.map(
				(r, j) =>
					`r${j}: repository(owner: ${JSON.stringify(r.owner)}, name: ${JSON.stringify(r.name)}) {
						${REPO_FIELDS}
						releases(first: 10, orderBy: { field: CREATED_AT, direction: DESC }) {
							nodes { name tagName url publishedAt isDraft author { login } }
						}
					}`,
			)
			.join("\n")}
	}`);
	chunk.forEach((_, j) => {
		const repo = data[`r${j}`];
		if (!isPublic(repo)) return;
		for (const rel of repo.releases.nodes) {
			if (rel.isDraft || !rel.publishedAt || rel.author?.login !== LOGIN)
				continue;
			if (new Date(rel.publishedAt) < startedAt) continue;
			releases.push({
				repo: repo.nameWithOwner,
				owner: repo.owner.login,
				ownerAvatarUrl: repo.owner.avatarUrl,
				isPrivate: false,
				name: rel.name || rel.tagName,
				tag: rel.tagName,
				url: rel.url,
				publishedAt: rel.publishedAt,
			});
		}
	});
}
releases.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

const mergedTitles = new Set(
	mergedPrs.map(
		(pr: { repo: string; title: string }) => `${pr.repo}\n${pr.title}`,
	),
);

// 6. Latest commits on the default branch of the most recently active repos.
const recentRepos = [...repoList]
	.filter((r) => r.commits > 0)
	.sort((a, b) => b.lastActive.localeCompare(a.lastActive))
	.slice(0, 24);
const commitData = await gql(
	`query($author: ID!) {
		${recentRepos
			.map(
				(r, j) =>
					`r${j}: repository(owner: ${JSON.stringify(r.owner)}, name: ${JSON.stringify(r.name)}) {
						${REPO_FIELDS}
						defaultBranchRef { target { ... on Commit {
							history(first: 30, author: { id: $author }) {
								nodes { abbreviatedOid message committedDate url additions deletions }
							}
						} } }
					}`,
			)
			.join("\n")}
	}`,
	{ author: user.id },
);
const commits = recentRepos
	.flatMap((_, j) => {
		const repo = commitData[`r${j}`];
		if (!isPublic(repo)) return [];
		const nodes = repo.defaultBranchRef?.target?.history?.nodes ?? [];
		return nodes
			.filter(
				(c: { message: string }) => !/^Merge\b/.test(c.message.split("\n")[0]),
			)
			.map(
				(c: {
					abbreviatedOid: string;
					message: string;
					committedDate: string;
					url: string;
					additions: number;
					deletions: number;
				}) => ({
					repo: repo.nameWithOwner,
					owner: repo.owner.login,
					ownerAvatarUrl: repo.owner.avatarUrl,
					isPrivate: false as const,
					sha: c.abbreviatedOid,
					message: c.message.split("\n")[0].trim(),
					url: c.url,
					committedAt: c.committedDate,
					additions: c.additions,
					deletions: c.deletions,
				}),
			);
	})
	// A merged PR already speaks for its commits: drop squash commits (#n)
	// and commits titled like a merged PR in the same repo.
	.filter(
		(c) =>
			!/\(#\d+\)$/.test(c.message) &&
			!mergedTitles.has(`${c.repo}\n${c.message}`),
	)
	.sort((a, b) => b.committedAt.localeCompare(a.committedAt))
	.slice(0, 20);

// 7. Stats computed from the calendar.
const days = weeks.flat();
let longest = 0;
let run = 0;
let longestEnd = "";
for (const d of days) {
	run = d.count > 0 ? run + 1 : 0;
	if (run > longest) {
		longest = run;
		longestEnd = d.date;
	}
}
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
	if (days[i].count > 0) current++;
	else if (i === days.length - 1)
		continue; // today may still be empty
	else break;
}
const busiest = days.reduce(
	(best, d) => (d.count > best.count ? d : best),
	days[0],
);
const activeDays = days.filter((d) => d.count > 0).length;

const payload = {
	generatedAt: new Date().toISOString(),
	user: {
		login: user.login,
		name: user.name,
		url: user.url,
		avatarUrl: user.avatarUrl,
	},
	window: { from: cc.startedAt, to: cc.endedAt },
	calendar: { total: cc.contributionCalendar.totalContributions, weeks },
	totals: {
		commits: cc.totalCommitContributions,
		pullRequests: cc.totalPullRequestContributions,
		issues: cc.totalIssueContributions,
		reviews: cc.totalPullRequestReviewContributions,
		repositoriesCreated: cc.totalRepositoryContributions,
		privateContributions: cc.restrictedContributionsCount,
		publicInRepos: repoList.reduce((sum, r) => sum + r.total, 0),
	},
	stats: {
		mergedPrs: prSearch.count.issueCount,
		publicRepos: repoList.length,
		orgs: orgs.length,
		longestStreak: { days: longest, endedOn: longestEnd },
		currentStreak: current,
		busiestDay: busiest,
		activeDays,
		releases: releases.length,
	},
	orgs,
	repos: repoList,
	mergedPrs,
	releases: releases.slice(0, 20),
	commits,
};

writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Skipped ${skippedPrivate.size} non-public repos.`);
console.log(
	`Wrote signal: ${repoList.length} public repos, ${orgs.length} owners, ${mergedPrs.length} PRs, ${releases.length} releases, ${commits.length} commits.`,
);
