#!/usr/bin/env bun
/**
 * Refresh cached GitHub star counts for projects.
 * Uses GITHUB_TOKEN or `gh auth token` when available.
 *
 * Usage: bun run scripts/sync-project-stars.ts
 */

import { execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { projects } from "../src/data/projects";

const OUTPUT = join(import.meta.dir, "..", "src/data/project-stars.json");
const GITHUB_GRAPHQL = "https://api.github.com/graphql";

function resolveToken(): string | undefined {
	if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;

	try {
		const token = execSync("gh auth token", { encoding: "utf8" }).trim();
		return token || undefined;
	} catch {
		return undefined;
	}
}

async function fetchStars(token: string, repos: string[]): Promise<Record<string, number>> {
	const stars: Record<string, number> = {};
	const unique = [...new Set(repos.filter(Boolean))];

	const fragments = unique
		.map((repo, i) => {
			const [owner, name] = repo.split("/");
			return `r${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { stargazerCount }`;
		})
		.join("\n");

	const res = await fetch(GITHUB_GRAPHQL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			"User-Agent": "railly.dev",
		},
		body: JSON.stringify({ query: `query { ${fragments} }` }),
	});

	if (!res.ok) {
		throw new Error(`GitHub GraphQL failed: ${res.status} ${await res.text()}`);
	}

	const data = await res.json();
	if (!data.data) {
		throw new Error(`GitHub GraphQL failed: ${JSON.stringify(data.errors ?? data)}`);
	}

	if (data.errors?.length) {
		console.warn("Some repositories were skipped:", data.errors.map((error: { message: string }) => error.message).join("; "));
	}

	for (const [i, repo] of unique.entries()) {
		stars[repo] = data.data?.[`r${i}`]?.stargazerCount ?? 0;
	}

	return stars;
}

const token = resolveToken();
if (!token) {
	if (existsSync(OUTPUT)) {
		console.warn("No GitHub token found. Keeping existing project-stars.json cache.");
		process.exit(0);
	}

	console.error("No GitHub token found. Set GITHUB_TOKEN or run `gh auth login`.");
	process.exit(1);
}

const repos = projects.map((project) => project.repo).filter((repo): repo is string => Boolean(repo));
const stars = await fetchStars(token, repos);

const payload = {
	generatedAt: new Date().toISOString(),
	stars,
};

writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${Object.keys(stars).length} star counts to ${OUTPUT}`);
