import type { APIRoute } from "astro";
import { httpError, json } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	const hookUrl = import.meta.env.VERCEL_DEPLOY_HOOK;
	if (!hookUrl) {
		return httpError(
			"VERCEL_DEPLOY_HOOK not configured",
			"MISSING_DEPLOY_HOOK",
			500,
		);
	}

	const res = await fetch(hookUrl, { method: "POST" });
	const data = await res.json();

	return json({ ok: true, deploy: data });
};
