import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	const hookUrl = import.meta.env.VERCEL_DEPLOY_HOOK;
	if (!hookUrl) {
		return new Response(
			JSON.stringify({ error: "VERCEL_DEPLOY_HOOK not configured" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

	const res = await fetch(hookUrl, { method: "POST" });
	const data = await res.json();

	return new Response(
		JSON.stringify({ ok: true, deploy: data }),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
};
