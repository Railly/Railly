import { createClient } from "@vercel/kv";
import type { APIRoute } from "astro";
import {
	cleanCoordinates,
	cleanString,
	LIMITS,
} from "@/lib/comment-validation";
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
	ownerToken?: string;
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
	const safe = comments.map(({ ownerToken: _ownerToken, ...rest }) => rest);
	return json({ draftId, comments: safe });
};

export const POST: APIRoute = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body) return httpError("Invalid JSON", "INVALID_JSON", 400);

	const { draftId } = body;
	if (!draftId) return httpError("Missing fields", "MISSING_FIELDS", 400);

	const name = cleanString(body.name, LIMITS.name);
	const text = cleanString(body.text, LIMITS.text);
	const coords = cleanCoordinates(body.x, body.y);

	if (!name || !text || !coords) {
		return httpError("Invalid fields", "INVALID_FIELDS", 400);
	}

	const quote =
		body.quote != null ? cleanString(body.quote, LIMITS.quote) : undefined;
	if (body.quote != null && quote === null) {
		return httpError("Invalid fields", "INVALID_FIELDS", 400);
	}

	if (import.meta.env.DEV) {
		return json({
			ok: true,
			comment: {
				id: "dev",
				name,
				text,
				x: coords.x,
				y: coords.y,
				timestamp: Date.now(),
				resolved: false,
				ownerToken: crypto.randomUUID(),
			},
		});
	}

	const kv = getKv();
	const key = `draft-comments:${draftId}`;
	const comments = (await kv.get<Comment[]>(key)) ?? [];

	if (comments.length >= LIMITS.maxCommentsPerDraft) {
		return httpError("Comment limit reached", "LIMIT_REACHED", 429);
	}

	const comment: Comment = {
		id: crypto.randomUUID().slice(0, 8),
		name,
		text,
		...(quote ? { quote } : {}),
		x: coords.x,
		y: coords.y,
		timestamp: Date.now(),
		resolved: false,
		ownerToken: crypto.randomUUID(),
	};

	comments.push(comment);
	await kv.set(key, comments);

	return json({ ok: true, comment });
};

export const PATCH: APIRoute = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body) return httpError("Invalid JSON", "INVALID_JSON", 400);

	const { draftId, commentId, action } = body;

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
	} else if (action === "reply") {
		const replyName = cleanString(body.name, LIMITS.name);
		const replyText = cleanString(body.text, LIMITS.text);
		if (replyName && replyText) {
			if (!comments[idx].replies) comments[idx].replies = [];
			comments[idx].replies!.push({
				id: crypto.randomUUID().slice(0, 8),
				name: replyName,
				text: replyText,
				timestamp: Date.now(),
			});
		}
	}

	await kv.set(key, comments);
	const { ownerToken: _ownerToken, ...safeComment } = comments[idx];
	return json({ ok: true, comment: safeComment });
};

export const DELETE: APIRoute = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body) return httpError("Invalid JSON", "INVALID_JSON", 400);

	const { draftId, commentId } = body;
	const ownerToken = cleanString(body.ownerToken, 64);

	if (!draftId || !commentId || !ownerToken) {
		return httpError("Missing fields", "MISSING_FIELDS", 400);
	}

	if (import.meta.env.DEV) {
		return json({ ok: true });
	}

	const kv = getKv();
	const key = `draft-comments:${draftId}`;
	const comments = (await kv.get<Comment[]>(key)) ?? [];
	const idx = comments.findIndex(
		(c) => c.id === commentId && c.ownerToken && c.ownerToken === ownerToken,
	);
	if (idx === -1) {
		return httpError("Not found or not yours", "NOT_FOUND_OR_NOT_YOURS", 404);
	}

	comments.splice(idx, 1);
	await kv.set(key, comments);
	return json({ ok: true });
};
