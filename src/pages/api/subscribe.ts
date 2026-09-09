import type { APIRoute } from "astro";
import { json } from "@/lib/http";

export const prerender = false;

export const POST: APIRoute = () =>
	json(
		{
			error: {
				message: "Subscriptions have moved to Substack.",
				code: "SUBSCRIPTIONS_MOVED",
			},
			url: "https://railly.substack.com",
		},
		410,
	);
