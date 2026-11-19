/**
 * Writes the latest posts from the Substack RSS feed to src/data/substack.json.
 * Keeps the existing file when the feed is unreachable.
 *
 * Usage: bun run scripts/sync-substack.ts
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FEED = "https://railly.substack.com/feed";
const OUTPUT = join(import.meta.dir, "..", "src/data/substack.json");

const text = (item: string, tag: string) =>
	item
		.match(
			new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`),
		)?.[1]
		?.trim() ?? "";

try {
	const res = await fetch(FEED);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const xml = await res.text();
	const posts = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
		.map(([, item]) => ({
			title: text(item, "title"),
			url: text(item, "link"),
			published: new Date(text(item, "pubDate")).toISOString(),
		}))
		// Substack's default placeholder post.
		.filter((post) => !post.url.endsWith("/p/coming-soon"));
	writeFileSync(
		OUTPUT,
		`${JSON.stringify({ generatedAt: new Date().toISOString(), posts }, null, 2)}\n`,
	);
	console.log(`Wrote ${posts.length} posts to ${OUTPUT}`);
} catch (error) {
	if (!existsSync(OUTPUT)) throw error;
	console.warn(
		`Substack feed unavailable (${error}). Keeping existing substack.json.`,
	);
}
