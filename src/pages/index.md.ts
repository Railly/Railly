import type { APIRoute } from "astro";
import { getAgentMarkdown } from "@/lib/agent-content";
import { appendNegotiationHeaders } from "@/lib/content-negotiation";

export const GET: APIRoute = () => {
	const headers = new Headers({
		"Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
		"Content-Type": "text/markdown; charset=utf-8",
		"X-Robots-Tag": "noindex",
	});
	appendNegotiationHeaders(headers);
	return new Response(getAgentMarkdown("/"), { headers });
};
