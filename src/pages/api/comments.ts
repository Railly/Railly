import { createClient } from "@vercel/kv";
import type { APIRoute } from "astro";

export const prerender = false;

interface Comment {
	id: string;
	name: string;
	text: string;
	quote?: string;
	x: number;
	y: number;
	timestamp: number;
	resolved: boolean;
}

function getKv() {
	return createClient({
		url: import.meta.env.KV_REST_API_URL!,
		token: import.meta.env.KV_REST_API_TOKEN!,
	});
}

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export const GET: APIRoute = async ({ url }) => {
	const draftId = url.searchParams.get("draftId");
	if (!draftId) return json({ error: "Missing draftId" }, 400);

	if (import.meta.env.DEV) {
		return json({ draftId, comments: [] });
	}

	const kv = getKv();
	const comments = await kv.get<Comment[]>(`draft-comments:${draftId}`) ?? [];
	return json({ draftId, comments });
};

export const POST: APIRoute = async ({ request }) => {
	const body = await request.json();
	const { draftId, name, text, quote, x, y } = body;

	if (!draftId || !name || !text || x == null || y == null) {
		return json({ error: "Missing fields" }, 400);
	}

	if (import.meta.env.DEV) {
		return json({ ok: true, comment: { id: "dev", name, text, x, y, timestamp: Date.now(), resolved: false } });
	}

	const kv = getKv();
	const key = `draft-comments:${draftId}`;
	const comments = await kv.get<Comment[]>(key) ?? [];

	const comment: Comment = {
		id: crypto.randomUUID().slice(0, 8),
		name,
		text,
		...(quote ? { quote } : {}),
		x,
		y,
		timestamp: Date.now(),
		resolved: false,
	};

	comments.push(comment);
	await kv.set(key, comments);

	return json({ ok: true, comment });
};
