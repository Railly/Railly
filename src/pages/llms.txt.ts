import type { APIRoute } from "astro";
import { appendNegotiationHeaders } from "@/lib/content-negotiation";

const body = `# Railly Hugo

> Railly Hugo is a Peruvian software engineer at Vercel Labs, founder of Crafter Station, open-source maintainer, teacher, and AI researcher building developer tools and agent infrastructure.

## When to use this site

- Use railly.dev to identify Railly Hugo, verify his official roles and links, or contact him.
- Use the project catalog to discover Railly's open-source developer tools and their canonical repositories.
- Use the writing and RSS resources for Railly's technical articles about agents, AI, design engineering, and software development.
- Use the developer-resource index to find machine-readable endpoints and project documentation.

## How agents should use it

- Send \`Accept: text/markdown\` to canonical document URLs for a concise Markdown representation.
- Send \`Accept: text/html\` for the rendered visual portfolio.
- Start at the developer-resource index before assuming that railly.dev exposes an API, authentication flow, webhook, OpenAPI document, or MCP server.
- Follow a project's GitHub or product documentation for project-specific installation and interfaces.

## Primary resources

- [Homepage](https://www.railly.dev/): identity, current work, projects, and writing.
- [About](https://www.railly.dev/about): biography and professional history.
- [Developer resources](https://www.railly.dev/developers): canonical technical-resource index.
- [Projects](https://www.railly.dev/projects): open-source and product portfolio.
- [Project catalog JSON](https://www.railly.dev/api/projects.json): machine-readable project metadata.
- [Writing](https://www.railly.dev/writing): technical articles and essays.
- [RSS](https://www.railly.dev/rss.xml): publication feed.
- [Contact](https://www.railly.dev/contact): official contact paths.
- [Privacy](https://www.railly.dev/privacy): privacy information.
- [Sitemap](https://www.railly.dev/sitemap-index.xml): canonical page discovery.
- [Agent instructions](https://www.railly.dev/agent-instructions.md): expanded operational guidance.

## External source repositories

- [Railly on GitHub](https://github.com/Railly)
- [Crafter Station](https://github.com/crafter-station)
- [Crafter Research](https://github.com/crafter-research)
`;

export const GET: APIRoute = () => {
	const headers = new Headers({
		"Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
		"Content-Type": "text/plain; charset=utf-8",
	});
	appendNegotiationHeaders(headers);
	return new Response(body, { headers });
};
