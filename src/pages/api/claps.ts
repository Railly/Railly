import { createClient } from "@vercel/kv";
import type { APIRoute } from "astro";
import {
	isValidSlug,
	MAX_CLAP_INCREMENT,
	parseIncrement,
} from "@/lib/counters";
import { httpError, json } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const id = url.searchParams.get("id");
	const incr = url.searchParams.get("incr");

	if (!id) {
		return httpError('Missing "id" query', "MISSING_ID", 400);
	}

	if (!isValidSlug(id)) {
		return httpError('Invalid "id"', "INVALID_ID", 400);
	}

	let increment: number | null = null;
	if (incr != null) {
		increment = parseIncrement(incr, MAX_CLAP_INCREMENT);
		if (increment == null) {
			return httpError('Invalid "incr"', "INVALID_INCR", 400);
		}
	}

	if (import.meta.env.DEV) {
		return json({ slug: id, claps: 42, dev: true });
	}

	try {
		const kv = createClient({
			url: import.meta.env.KV_REST_API_URL!,
			token: import.meta.env.KV_REST_API_TOKEN!,
		});

		let claps: number;

		if (increment != null) {
			claps = await kv.hincrby("claps", id, increment);
		} else {
			const result = await kv.hget("claps", id);
			claps = result ? Number(result) : 0;
		}

		return json({ slug: id, claps });
	} catch {
		return httpError("Internal server error", "SERVER_ERROR", 500);
	}
};
