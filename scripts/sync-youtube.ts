/**
 * Writes the latest videos from the YouTube channel RSS feed to src/data/youtube.json.
 * Keeps the existing file when the feed is unreachable.
 *
 * Usage: bun run scripts/sync-youtube.ts
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHANNEL_ID = "UCXc8NTy6st3o26kWX6tmX2A";
const LIMIT = 6;
const OUTPUT = join(import.meta.dir, "..", "src/data/youtube.json");

const decode = (s: string) =>
	s
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");

try {
	const res = await fetch(
		`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
	);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const xml = await res.text();
	const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
		.slice(0, LIMIT)
		.map(([, entry]) => {
			const id = entry.match(/<yt:videoId>([^<]+)/)?.[1] ?? "";
			return {
				id,
				title: decode(entry.match(/<title>([^<]+)/)?.[1] ?? ""),
				published: entry.match(/<published>([^<]+)/)?.[1] ?? "",
				url: `https://www.youtube.com/watch?v=${id}`,
				thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
			};
		});
	writeFileSync(
		OUTPUT,
		`${JSON.stringify({ generatedAt: new Date().toISOString(), videos }, null, 2)}\n`,
	);
	console.log(`Wrote ${videos.length} videos to ${OUTPUT}`);
} catch (error) {
	if (!existsSync(OUTPUT)) throw error;
	console.warn(
		`YouTube feed unavailable (${error}). Keeping existing youtube.json.`,
	);
}
