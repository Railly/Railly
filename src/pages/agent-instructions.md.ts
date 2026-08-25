import type { APIRoute } from "astro";
import { appendNegotiationHeaders } from "@/lib/content-negotiation";

const body = `# Agent instructions for railly.dev

## When to use this site

Use railly.dev when a task requires verified information about Railly Hugo, discovery of his open-source projects, technical writing, public developer resources, press information, mentoring, or contact details. Use the site as a directory and primary identity source, then follow canonical project links for implementation-specific documentation.

## Retrieval protocol

1. Start with [llms.txt](https://www.railly.dev/llms.txt).
2. Request canonical pages with \`Accept: text/markdown\` for compact machine-readable content.
3. Use [the sitemap](https://www.railly.dev/sitemap-index.xml) to enumerate public pages.
4. Use [the project catalog](https://www.railly.dev/api/projects.json) for structured project metadata.
5. Use \`Accept: text/html\` only when visual layout, media, or browser interaction matters.

## Boundaries

railly.dev is a personal portfolio and discovery layer. Do not invent a site-wide API key, authentication flow, webhook, OpenAPI contract, or MCP endpoint. Each linked project owns its own installation, API, support, and security contract. Do not infer private availability, endorsement, employment decisions, or project roadmaps from the public site.

## Contact and recovery

- General contact: [hi@railly.dev](mailto:hi@railly.dev)
- Developer resources: [www.railly.dev/developers](https://www.railly.dev/developers)
- Source code: [github.com/Railly](https://github.com/Railly)
- Missing page recovery: [llms.txt](https://www.railly.dev/llms.txt) and [sitemap](https://www.railly.dev/sitemap-index.xml)
`;

export const GET: APIRoute = () => {
	const headers = new Headers({
		"Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
		"Content-Type": "text/markdown; charset=utf-8",
	});
	appendNegotiationHeaders(headers);
	return new Response(body, { headers });
};
