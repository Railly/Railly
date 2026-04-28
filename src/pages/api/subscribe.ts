import type { APIRoute } from "astro";
import { Resend } from "resend";
import { httpError, json } from "@/lib/http";

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
	// Rate limiting handled at edge layer (Vercel/Cloudflare) — in-memory rate limiting does not work in serverless
	const body = await request.json().catch(() => null);

	if (body?.honeypot) {
		return json({ success: true });
	}

	if (!body?.email) {
		return httpError("Missing email", "MISSING_EMAIL", 400);
	}

	const email = String(body.email).trim().toLowerCase();
	const firstName = body.firstName
		? String(body.firstName).trim().slice(0, 50)
		: undefined;

	if (!EMAIL_REGEX.test(email) || email.length > 254) {
		return httpError("Invalid email", "INVALID_EMAIL", 400);
	}

	if (import.meta.env.DEV) {
		return json({ success: true, dev: true });
	}

	try {
		const resend = new Resend(import.meta.env.RESEND_API_KEY);

		const { error } = await resend.contacts.create({
			email,
			firstName: firstName || undefined,
			segments: [{ id: import.meta.env.RESEND_SEGMENT_ID }],
		});

		if (error) {
			if (error.message?.includes("already exists")) {
				return httpError("Already subscribed", "ALREADY_SUBSCRIBED", 409);
			}

			return httpError(error.message, "RESEND_ERROR", 400);
		}

		return json({ success: true });
	} catch {
		return httpError("Internal server error", "SERVER_ERROR", 500);
	}
};
