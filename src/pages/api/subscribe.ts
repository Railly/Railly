import { Resend } from "resend";
import type { APIRoute } from "astro";

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW = 60_000;
const MAX_REQUESTS_PER_WINDOW = 3;
const ipRequests = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const requests = ipRequests.get(ip) ?? [];
	const recent = requests.filter((t) => now - t < RATE_LIMIT_WINDOW);
	if (recent.length >= MAX_REQUESTS_PER_WINDOW) return true;
	recent.push(now);
	ipRequests.set(ip, recent);
	return false;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
	if (isRateLimited(clientAddress)) {
		return new Response(
			JSON.stringify({
				error: { message: "Too many requests", code: "RATE_LIMITED" },
			}),
			{ status: 429, headers: { "Content-Type": "application/json" } },
		);
	}

	const body = await request.json().catch(() => null);

	if (body?.honeypot) {
		return new Response(
			JSON.stringify({ success: true }),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	}

	if (!body?.email) {
		return new Response(
			JSON.stringify({
				error: { message: "Missing email", code: "MISSING_EMAIL" },
			}),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const email = String(body.email).trim().toLowerCase();
	const firstName = body.firstName ? String(body.firstName).trim().slice(0, 50) : undefined;

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
			firstName: firstName || undefined,
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
