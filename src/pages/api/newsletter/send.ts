import type { APIRoute } from "astro";
import { Resend } from "resend";
import { isAuthorized } from "@/lib/auth";
import { httpError, json } from "@/lib/http";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const auth = request.headers.get("Authorization");

	if (!isAuthorized(auth, import.meta.env.NEWSLETTER_API_SECRET)) {
		return httpError("Unauthorized", "UNAUTHORIZED", 401);
	}

	const body = await request.json().catch(() => null);

	if (!body?.subject || !body?.html) {
		return httpError("Missing subject or html", "MISSING_FIELDS", 400);
	}

	if (import.meta.env.DEV) {
		return json({ success: true, dev: true, id: "dev_broadcast" });
	}

	try {
		const resend = new Resend(import.meta.env.RESEND_API_KEY);

		const { data, error } = await resend.broadcasts.create({
			segmentId: import.meta.env.RESEND_SEGMENT_ID,
			from: "Railly Hugo <newsletter@updates.railly.dev>",
			subject: body.subject,
			html: body.html,
		});

		if (error) {
			return httpError(error.message, "BROADCAST_ERROR", 400);
		}

		const broadcastId = data?.id;

		if (broadcastId) {
			await resend.broadcasts.send(broadcastId);
		}

		return json({ success: true, id: broadcastId });
	} catch (_error) {
		return httpError("Internal server error", "SERVER_ERROR", 500);
	}
};
