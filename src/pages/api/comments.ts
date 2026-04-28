import { createClient } from "@vercel/kv";
import type { APIRoute } from "astro";
import { httpError, json } from "@/lib/http";

export const prerender = false;

interface Reply {
	id: string;
	name: string;
	text: string;
	timestamp: number;
}

interface Comment {
	id: string;
	name: string;
	text: string;
	quote?: string;
	x: number;
	y: number;
	timestamp: number;
	resolved: boolean;
	replies?: Reply[];
}

function getKv() {
	return createClient({
		url: import.meta.env.KV_REST_API_URL!,
		token: import.meta.env.KV_REST_API_TOKEN!,
	});
}

export const GET: APIRoute = async ({ url }) => {
	const draftId = url.searchParams.get("draftId");
	if (!draftId) return httpError("Missing draftId", "MISSING_DRAFT_ID", 400);

	if (import.meta.env.DEV) {
		return json({ draftId, comments: [] });
	}

	const kv = getKv();
	const comments = (await kv.get<Comment[]>(`draft-comments:${draftId}`)) ?? [];
	return json({ draftId, comments });
};

export const POST: APIRoute = async ({ request }) => {
	const body = await request.json();
	const { draftId, name, text, quote, x, y } = body;

	if (!draftId || !name || !text || x == null || y == null) {
		return httpError("Missing fields", "MISSING_FIELDS", 400);
	}

	if (import.meta.env.DEV) {
		return json({
			ok: true,
			comment: {
				id: "dev",
				name,
				text,
				x,
				y,
				timestamp: Date.now(),
				resolved: false,
			},
		});
	}

	const kv = getKv();
	const key = `draft-comments:${draftId}`;
	const comments = (await kv.get<Comment[]>(key)) ?? [];

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

export const PATCH: APIRoute = async ({ request }) => {
	const body = await request.json();
	const { draftId, commentId, action, name, text } = body;

	if (!draftId || !commentId || !action) {
		return httpError("Missing fields", "MISSING_FIELDS", 400);
	}

	if (import.meta.env.DEV) {
		return json({ ok: true });
	}

	const kv = getKv();
	const key = `draft-comments:${draftId}`;
	const comments = (await kv.get<Comment[]>(key)) ?? [];
	const idx = comments.findIndex((c) => c.id === commentId);
	if (idx === -1) return httpError("Not found", "NOT_FOUND", 404);

	if (action === "resolve") {
		comments[idx].resolved = !comments[idx].resolved;
	} else if (action === "reply" && name && text) {
		if (!comments[idx].replies) comments[idx].replies = [];
		comments[idx].replies!.push({
			id: crypto.randomUUID().slice(0, 8),
			name,
			text,
			timestamp: Date.now(),
		});
	}

	await kv.set(key, comments);
	return json({ ok: true, comment: comments[idx] });
};

export const DELETE: APIRoute = async ({ request }) => {
	const body = await request.json();
	const { draftId, commentId, name } = body;

	if (!draftId || !commentId || !name) {
		return httpError("Missing fields", "MISSING_FIELDS", 400);
	}

	if (import.meta.env.DEV) {
		return json({ ok: true });
	}

	const kv = getKv();
	const key = `draft-comments:${draftId}`;
	const comments = (await kv.get<Comment[]>(key)) ?? [];
	const idx = comments.findIndex((c) => c.id === commentId && c.name === name);
	if (idx === -1) {
		return httpError("Not found or not yours", "NOT_FOUND_OR_NOT_YOURS", 404);
	}

	comments.splice(idx, 1);
	await kv.set(key, comments);
	return json({ ok: true });
};
