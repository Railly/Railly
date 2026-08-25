import { defineMiddleware } from "astro:middleware";
import { getAgentMarkdown, getNotFoundMarkdown } from "@/lib/agent-content";
import {
	appendNegotiationHeaders,
	isDocumentRequest,
	preferredRepresentation,
} from "@/lib/content-negotiation";

const markdownHeaders = () => {
	const headers = new Headers({
		"Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
		"Content-Type": "text/markdown; charset=utf-8",
		Link: '</llms.txt>; rel="describedby"',
	});
	appendNegotiationHeaders(headers);
	return headers;
};

export const onRequest = defineMiddleware(async ({ request, url }, next) => {
	if (!isDocumentRequest(request, url.pathname)) return next();

	const representation = preferredRepresentation(request.headers.get("Accept"));
	if (!representation) {
		const headers = new Headers({
			"Content-Type": "text/plain; charset=utf-8",
		});
		appendNegotiationHeaders(headers);
		return new Response(
			"Not acceptable. Available representations: text/html, text/markdown.\n",
			{
				status: 406,
				headers,
			},
		);
	}

	if (representation === "markdown") {
		const markdown = getAgentMarkdown(url.pathname);
		if (markdown) {
			return new Response(request.method === "HEAD" ? null : markdown, {
				status: 200,
				headers: markdownHeaders(),
			});
		}
	}

	const response = await next();
	appendNegotiationHeaders(response.headers);
	response.headers.append(
		"Link",
		`<${url.pathname}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"`,
	);

	if (representation === "markdown") {
		if (response.status === 404) {
			return new Response(
				request.method === "HEAD" ? null : getNotFoundMarkdown(url.pathname),
				{
					status: 404,
					headers: markdownHeaders(),
				},
			);
		}
		if (response.ok) {
			const fallback = `# ${url.pathname} | Railly Hugo\n\nThis page exists on railly.dev, but a detailed Markdown representation is not yet published.\n\n- [Open the canonical HTML page](${url.toString()})\n- [Developer resources](${new URL("/developers", url).toString()})\n- [Sitemap](${new URL("/sitemap-index.xml", url).toString()})\n`;
			return new Response(request.method === "HEAD" ? null : fallback, {
				status: response.status,
				headers: markdownHeaders(),
			});
		}
	}

	return response;
});
