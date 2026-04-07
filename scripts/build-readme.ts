#!/usr/bin/env bun
/**
 * Regenerate README.md with live data from railly.dev.
 *
 * Fetches:
 *   - Projects (with stars) from https://railly.dev/api/projects.json
 *   - Latest posts from https://railly.dev/rss.xml
 *
 * Replaces content between markers:
 *   <!-- START:PROJECTS --> ... <!-- END:PROJECTS -->
 *   <!-- START:WRITING --> ... <!-- END:WRITING -->
 *
 * Usage:  bun run scripts/build-readme.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://railly.dev";
const README_PATH = join(import.meta.dir, "..", "README.md");
const TOP_PROJECTS = 6;
const TOP_POSTS = 5;

type Project = {
	name: string;
	description: string;
	url: string;
	github: string;
	stars: number;
};

async function fetchProjects(): Promise<Project[]> {
	const res = await fetch(`${SITE}/api/projects.json`);
	if (!res.ok) throw new Error(`projects.json fetch failed: ${res.status}`);
	const data = await res.json();
	return data.projects;
}

type Post = { title: string; link: string; pubDate: Date };

async function fetchPosts(): Promise<Post[]> {
	const res = await fetch(`${SITE}/rss.xml`);
	if (!res.ok) throw new Error(`rss.xml fetch failed: ${res.status}`);
	const xml = await res.text();

	const items: Post[] = [];
	const itemRegex = /<item>([\s\S]*?)<\/item>/g;
	const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
	const linkRegex = /<link>(.*?)<\/link>/;
	const dateRegex = /<pubDate>(.*?)<\/pubDate>/;

	let match: RegExpExecArray | null;
	while ((match = itemRegex.exec(xml)) !== null) {
		const block = match[1];
		const t = block.match(titleRegex);
		const l = block.match(linkRegex);
		const d = block.match(dateRegex);
		if (t && l && d) {
			items.push({
				title: (t[1] || t[2] || "").trim(),
				link: l[1].trim(),
				pubDate: new Date(d[1]),
			});
		}
	}

	return items
		.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf())
		.slice(0, TOP_POSTS);
}

function renderProjects(projects: Project[]): string {
	const top = projects.slice(0, TOP_PROJECTS);
	const rows = top
		.map((p) => {
			const link = p.url.startsWith("https://github.com") ? p.github : p.url;
			return `| [${p.name}](${link}) | ${p.description} \`${p.stars}★\` |`;
		})
		.join("\n");

	return ["| Project | Description |", "|---------|-------------|", rows].join(
		"\n",
	);
}

function formatDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function renderPosts(posts: Post[]): string {
	if (posts.length === 0) return "_No posts yet._";
	return posts.map((p) => `- [${p.title}](${p.link}) — ${formatDate(p.pubDate)}`).join("\n");
}

function replaceBlock(
	content: string,
	marker: string,
	replacement: string,
): string {
	const start = `<!-- START:${marker} -->`;
	const end = `<!-- END:${marker} -->`;
	const regex = new RegExp(`${start}[\\s\\S]*?${end}`, "m");
	const block = `${start}\n${replacement}\n${end}`;
	if (!regex.test(content)) {
		throw new Error(`Marker ${marker} not found in README.md`);
	}
	return content.replace(regex, block);
}

async function main() {
	console.log("Fetching projects and posts from railly.dev...");
	const [projects, posts] = await Promise.all([fetchProjects(), fetchPosts()]);
	console.log(`  ${projects.length} projects, ${posts.length} posts`);

	let readme = readFileSync(README_PATH, "utf-8");
	readme = replaceBlock(readme, "PROJECTS", renderProjects(projects));
	readme = replaceBlock(readme, "WRITING", renderPosts(posts));

	writeFileSync(README_PATH, readme);
	console.log("README.md updated.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
