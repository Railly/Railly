import { Resend } from "resend";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const auth = request.headers.get("Authorization");
	const secret = import.meta.env.NEWSLETTER_API_SECRET;

	if (!auth || auth !== `Bearer ${secret}`) {
		return new Response(
			JSON.stringify({
				error: { message: "Unauthorized", code: "UNAUTHORIZED" },
			}),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	const body = await request.json().catch(() => null);

	if (!body?.subject || !body?.html) {
		return new Response(
			JSON.stringify({
				error: {
					message: "Missing subject or html",
					code: "MISSING_FIELDS",
				},
			}),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	if (import.meta.env.DEV) {
		return new Response(
			JSON.stringify({ success: true, dev: true, id: "dev_broadcast" }),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
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
			return new Response(
				JSON.stringify({
					error: { message: error.message, code: "BROADCAST_ERROR" },
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const broadcastId = data?.id;

		if (broadcastId) {
			await resend.broadcasts.send(broadcastId);
		}

		return new Response(
			JSON.stringify({ success: true, id: broadcastId }),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	} catch (_error) {
		return new Response(
			JSON.stringify({
				error: { message: "Internal server error", code: "SERVER_ERROR" },
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
