import type { APIRoute } from "astro";
import { openApiDocument } from "@/lib/openapi";

export const GET: APIRoute = () =>
	new Response(JSON.stringify(openApiDocument), {
		headers: {
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
			"Content-Type": "application/vnd.oai.openapi+json; charset=utf-8",
		},
	});
