// Shapes src/data/signal.json into the slim props the /signal islands need.
// Runs at build time only; the full JSON never ships to the browser.
import data from "@/data/signal.json";

export const OTHERS = "others";
const TOP_OWNERS = 10;

export type Day = { date: string; count: number };

export type Owner = {
	key: string;
	label: string;
	name: string | null;
	url: string | null;
	avatars: string[];
	round: boolean;
	total: number;
	share: number;
	repoCount: number;
	commits: number;
	prs: number;
	topRepos: string[];
	weekly: number[];
};

export type Repo = {
	nameWithOwner: string;
	name: string;
	owner: string;
	group: string;
	url: string;
	total: number;
	weekly: number[];
};

export type ShippedItem = {
	kind: "pr" | "release" | "commit";
	group: string;
	repo: string;
	avatar: string;
	round: boolean;
	title: string;
	url: string;
	date: string;
	meta: string;
};

const weeks = data.calendar.weeks as Day[][];
const ownerType = new Map(data.orgs.map((o) => [o.login, o.type]));
const ranked = data.orgs.slice(0, TOP_OWNERS);
const topKeys = new Set(ranked.map((o) => o.login));
const groupOf = (login: string) => (topKeys.has(login) ? login : OTHERS);
const isUser = (login: string) => ownerType.get(login) === "User";

const sumWeekly = (rows: { weekly: number[] }[]) =>
	weeks.map((_, i) => rows.reduce((sum, r) => sum + (r.weekly[i] ?? 0), 0));

const publicTotal = data.totals.publicInRepos;

function ownerFrom(
	key: string,
	label: string,
	owners: typeof data.orgs,
): Owner {
	const logins = new Set(owners.map((o) => o.login));
	const repos = data.repos.filter((r) => logins.has(r.owner));
	const total = repos.reduce((sum, r) => sum + r.total, 0);
	return {
		key,
		label,
		name: owners.length === 1 ? owners[0].name : null,
		url: owners.length === 1 ? owners[0].url : null,
		avatars: owners.map((o) => o.avatarUrl),
		round: owners.length === 1 && owners[0].type === "User",
		total,
		share: publicTotal ? total / publicTotal : 0,
		repoCount: repos.length,
		commits: repos.reduce((sum, r) => sum + r.commits, 0),
		prs: repos.reduce((sum, r) => sum + r.prs, 0),
		topRepos: repos.slice(0, 3).map((r) => r.name),
		weekly: sumWeekly(repos),
	};
}

const rest = data.orgs.slice(TOP_OWNERS);
export const owners: Owner[] = [
	ownerFrom("all", "All", data.orgs),
	...ranked.map((o) => ownerFrom(o.login, o.login, [o])),
	...(rest.length ? [ownerFrom(OTHERS, `${rest.length} others`, rest)] : []),
];

export const repos: Repo[] = data.repos.map((r) => ({
	nameWithOwner: r.nameWithOwner,
	name: r.name,
	owner: r.owner,
	group: groupOf(r.owner),
	url: r.url,
	total: r.total,
	weekly: r.weekly,
}));

const shortDate = (iso: string) =>
	new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});

const diff = (a: number, d: number) =>
	`+${a.toLocaleString("en-US")} −${d.toLocaleString("en-US")}`;

export const pulls: ShippedItem[] = data.mergedPrs.map((pr) => ({
	kind: "pr" as const,
	group: groupOf(pr.owner),
	repo: pr.repo,
	avatar: pr.ownerAvatarUrl,
	round: isUser(pr.owner),
	title: pr.title,
	url: pr.url,
	date: pr.mergedAt,
	meta: `#${pr.number} · ${diff(pr.additions, pr.deletions)}`,
}));

export const releases: ShippedItem[] = data.releases.map((rel) => ({
	kind: "release" as const,
	group: groupOf(rel.owner),
	repo: rel.repo,
	avatar: rel.ownerAvatarUrl,
	round: isUser(rel.owner),
	title: rel.name,
	url: rel.url,
	date: rel.publishedAt,
	meta: rel.name.includes(rel.tag) ? "" : rel.tag,
}));

export const commits: ShippedItem[] = data.commits.map((c) => ({
	kind: "commit",
	group: groupOf(c.owner),
	repo: c.repo,
	avatar: c.ownerAvatarUrl,
	round: isUser(c.owner),
	title: c.message,
	url: c.url,
	date: c.committedAt,
	meta: c.sha,
}));

/** Month labels for a run of weeks: the column where each month starts. */
export const months = weeks
	.map((w, i) => ({ i, date: w[0].date }))
	.filter(
		({ i, date }) =>
			i === 0 || date.slice(5, 7) !== weeks[i - 1][0].date.slice(5, 7),
	)
	.map(({ i, date }) => ({
		col: i,
		label: new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
			month: "short",
			timeZone: "UTC",
		}),
	}))
	// Drop a label that sits within four weeks of the next one (a partial first month).
	.filter((m, i, all) => i === all.length - 1 || all[i + 1].col - m.col >= 4);

/** Week ranges, for tooltips on weekly cells. */
export const weekStarts = weeks.map((w) => w[0].date);

/** Quartile thresholds over non-zero values: level 1-4 boundaries. */
function quartiles(values: number[]): number[] {
	const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
	if (!sorted.length) return [1, 1, 1];
	const at = (q: number) =>
		sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
	return [at(0.25), at(0.5), at(0.75)];
}

export const calendar = {
	total: data.calendar.total,
	privateCount: data.totals.privateContributions,
	weeks,
	thresholds: quartiles(weeks.flat().map((d) => d.count)),
};

export const weeklyThresholds = quartiles(repos.flatMap((r) => r.weekly));

const busiest = data.stats.busiestDay;
export const stats = [
	{
		label: "Merged pull requests",
		value: data.stats.mergedPrs.toLocaleString("en-US"),
	},
	{ label: "Releases", value: data.stats.releases.toLocaleString("en-US") },
	{
		label: "Public repos",
		value: data.stats.publicRepos.toLocaleString("en-US"),
	},
	{ label: "GitHub owners", value: data.stats.orgs.toLocaleString("en-US") },
	{
		label: "Longest streak, days",
		value: data.stats.longestStreak.days.toLocaleString("en-US"),
	},
	{
		label: `Busiest day, ${shortDate(`${busiest.date}T12:00:00Z`)}`,
		value: busiest.count.toLocaleString("en-US"),
	},
];

export const meta = {
	generatedAt: data.generatedAt,
	updated: shortDate(data.generatedAt),
	from: data.window.from,
	to: data.window.to,
	mergedPrs: data.stats.mergedPrs,
	releases: data.stats.releases,
	ownerCount: data.stats.orgs,
	publicInRepos: data.totals.publicInRepos,
	activeDays: data.stats.activeDays,
	userUrl: data.user.url,
};
