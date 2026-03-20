import { Resend } from "resend";
import type { APIRoute } from "astro";

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
	const body = await request.json().catch(() => null);

	if (!body?.email) {
		return new Response(
			JSON.stringify({
				error: { message: "Missing email", code: "MISSING_EMAIL" },
			}),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const email = String(body.email).trim().toLowerCase();

	if (!EMAIL_REGEX.test(email) || email.length > 254) {
		return new Response(
			JSON.stringify({
				error: { message: "Invalid email", code: "INVALID_EMAIL" },
			}),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	if (import.meta.env.DEV) {
		return new Response(
			JSON.stringify({ success: true, dev: true }),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	}

	try {
		const resend = new Resend(import.meta.env.RESEND_API_KEY);

		const { error } = await resend.contacts.create({
			email,
			segments: [{ id: import.meta.env.RESEND_SEGMENT_ID }],
		});

		if (error) {
			if (error.message?.includes("already exists")) {
				return new Response(
					JSON.stringify({
						error: {
							message: "Already subscribed",
							code: "ALREADY_SUBSCRIBED",
						},
					}),
					{ status: 409, headers: { "Content-Type": "application/json" } },
				);
			}

			return new Response(
				JSON.stringify({
					error: { message: error.message, code: "RESEND_ERROR" },
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		return new Response(
			JSON.stringify({ success: true }),
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
