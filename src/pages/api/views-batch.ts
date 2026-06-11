import { createClient } from "@vercel/kv";
import type { APIRoute } from "astro";
import { isValidSlug } from "@/lib/counters";
import { httpError } from "@/lib/http";

export const prerender = false;

const MAX_IDS = 100;

export const GET: APIRoute = async ({ url }) => {
	const raw = url.searchParams.get("ids");
	if (!raw) return httpError('Missing "ids" query', "MISSING_IDS", 400);

	const ids = raw.split(",").filter(Boolean);
	if (ids.length === 0 || ids.length > MAX_IDS) {
		return httpError('Invalid "ids" query', "INVALID_IDS", 400);
	}
	if (!ids.every(isValidSlug)) {
		return httpError('Invalid "ids" query', "INVALID_IDS", 400);
	}

	if (import.meta.env.DEV) {
		return new Response(
			JSON.stringify({ views: Object.fromEntries(ids.map((id) => [id, 0])) }),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=60",
				},
			},
		);
	}

	try {
		const kv = createClient({
			url: import.meta.env.KV_REST_API_URL!,
			token: import.meta.env.KV_REST_API_TOKEN!,
		});
		const values = await kv.hmget<Record<string, number | string | null>>(
			"views",
			...ids,
		);
		const views: Record<string, number> = {};
		for (const id of ids) {
			const v = values?.[id];
			views[id] = v ? Number(v) : 0;
		}
		return new Response(JSON.stringify({ views }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60",
			},
		});
	} catch {
		return httpError("Internal server error", "SERVER_ERROR", 500);
	}
};
