import { createClient } from "@vercel/kv";
import type { APIRoute } from "astro";
import { httpError, json } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const id = url.searchParams.get("id");
	const incr = url.searchParams.get("incr");

	if (!id) {
		return httpError('Missing "id" query', "MISSING_ID", 400);
	}

	if (import.meta.env.DEV) {
		return json({
			slug: id,
			views: 0,
			dev: true,
		});
	}

	try {
		const kv = createClient({
			url: import.meta.env.KV_REST_API_URL!,
			token: import.meta.env.KV_REST_API_TOKEN!,
		});

		let views: number;

		if (incr) {
			views = await kv.hincrby("views", id, Number(incr));
		} else {
			const result = await kv.hget("views", id);
			views = result ? Number(result) : 0;
		}

		return json({
			slug: id,
			views,
		});
	} catch {
		return httpError("Internal server error", "SERVER_ERROR", 500);
	}
};
