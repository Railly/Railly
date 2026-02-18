import { createClient } from "@vercel/kv";

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
	console.error("Missing KV_REST_API_URL or KV_REST_API_TOKEN env vars");
	console.error("Run: source .env.local && bun run scripts/seed-claps.ts");
	process.exit(1);
}

const kv = createClient({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN });

const views = (await kv.hgetall("views")) as Record<string, number> | null;
if (!views) {
	console.log("No views found in KV.");
	process.exit(0);
}

const claps = (await kv.hgetall("claps")) as Record<string, number> | null;

let seeded = 0;

for (const [slug, viewCount] of Object.entries(views)) {
	const existing = claps?.[slug] ?? 0;
	if (existing > 0) {
		console.log(`  skip ${slug} (already has ${existing} claps)`);
		continue;
	}

	const rate = 0.03 + Math.random() * 0.09;
	const seedClaps = Math.max(1, Math.floor(Number(viewCount) * rate));

	await kv.hset("claps", { [slug]: seedClaps });
	console.log(`  seed ${slug}: ${viewCount} views -> ${seedClaps} claps (${(rate * 100).toFixed(1)}%)`);
	seeded++;
}

console.log(`\nDone. Seeded ${seeded} posts.`);
