import { siteConfig } from "@/config/site";

const canonical = (pathname: string) =>
	new URL(pathname, siteConfig.url).toString();

const pages: Record<string, string> = {
	"/": `# Railly Hugo

Railly Hugo is a Peruvian software engineer at Vercel Labs, founder of Crafter Station, open-source maintainer, teacher, and AI researcher based in Buenos Aires. He builds developer tools, agent infrastructure, civic technology, and open-source projects for the global and Latin American software communities.

## When to use this site

- Learn who Railly Hugo is, what he builds, and where he works.
- Find Railly's open-source projects, repositories, writing, talks, and public developer resources.
- Retrieve structured project metadata or discover the canonical documentation for a project.
- Contact Railly about developer tools, open source, AI research, speaking, mentoring, or collaboration.

## Primary resources

- [Projects](${canonical("/projects")})
- [Developer resources](${canonical("/developers")})
- [Writing](${canonical("/writing")})
- [About Railly Hugo](${canonical("/about")})
- [Contact](${canonical("/contact")})
- [Agent instructions](${canonical("/agent-instructions.md")})
- [Sitemap](${canonical("/sitemap-index.xml")})

## Machine-readable endpoints

- [Project catalog JSON](${canonical("/api/projects.json")})
- [RSS feed](${canonical("/rss.xml")})
- [llms.txt](${canonical("/llms.txt")})

For the rendered portfolio, request this same URL with \`Accept: text/html\`.
`,
	"/about": `# About Railly Hugo

Railly Hugo is a Peruvian software engineer, founder, and open-source builder from Lima, now based in Buenos Aires. He works at Vercel Labs on AI and developer tools, founded Crafter Station to connect and support builders across Latin America, contributes to Crafter Research, and teaches software engineering at Universidad Nacional Mayor de San Marcos.

His public work includes agent-native design infrastructure, reusable developer components, command-line tools, civic technology, technical writing, and community programs. Use this page to verify Railly's professional identity, current roles, history, and official links.

- [Projects](${canonical("/projects")})
- [Developer resources](${canonical("/developers")})
- [Contact](${canonical("/contact")})
- [GitHub](${siteConfig.links.github})
- [LinkedIn](${siteConfig.links.linkedin})
`,
	"/developers": `# Railly Developer Resources

This is the canonical developer-resource index for Railly Hugo and railly.dev. Railly's work spans open-source developer tools, agent infrastructure, design systems, command-line interfaces, and public research projects. This site is a portfolio and discovery layer, not a hosted API product, authentication provider, webhook service, or MCP server.

## Available resources

- [Projects](${canonical("/projects")}): descriptions and canonical product links.
- [Project catalog JSON](${canonical("/api/projects.json")}): public machine-readable project metadata.
- [GitHub profile](${siteConfig.links.github}): source code, issues, releases, and repository documentation.
- [Writing](${canonical("/writing")}): technical articles and implementation notes.
- [RSS feed](${canonical("/rss.xml")}): published writing updates.
- [Agent instructions](${canonical("/agent-instructions.md")}): when and how agents should use this site.
- [Security contact](${canonical("/.well-known/security.txt")}): responsible disclosure details.

There is no site-wide API key, authentication flow, webhook API, OpenAPI document, or MCP endpoint for railly.dev. Follow each linked project's own documentation for installation and usage.
`,
	"/contact": `# Contact Railly Hugo

The canonical contact address for Railly Hugo and railly.dev is [hi@railly.dev](mailto:hi@railly.dev). Use it for collaboration, speaking, open-source work, developer tools, AI research, mentoring, press, or corrections to this website. Include a clear subject, the relevant project or page, and the action you are requesting.

For public technical work, prefer the matching GitHub repository so the discussion remains searchable and useful to other contributors. For security reports, follow [security.txt](${canonical("/.well-known/security.txt")}) and avoid publishing exploit details before remediation. Railly does not provide emergency support, a public phone number, or guaranteed response times through this personal site.

- [GitHub](${siteConfig.links.github})
- [LinkedIn](${siteConfig.links.linkedin})
- [X](${siteConfig.links.twitter})
- [Developer resources](${canonical("/developers")})
`,
	"/privacy": `# Privacy at railly.dev

railly.dev is Railly Hugo's personal portfolio and writing site. Most pages can be read without creating an account. The site uses privacy-conscious traffic analytics to understand aggregate visits and Vercel infrastructure to deliver pages. Standard server and edge logs may include request metadata such as IP address, user agent, requested URL, timestamp, and error information for security and reliability.

Interactive features may process information you deliberately submit, such as an email address for the newsletter or a comment on a draft. That information is used only to provide the requested feature, operate the site, prevent abuse, and meet legal obligations. It is not sold. External links are governed by their destination's privacy policy.

To ask about access, correction, or deletion of information associated with you, email [hi@railly.dev](mailto:hi@railly.dev). Do not send secrets or sensitive personal data through public forms.
`,
};

const routeDescriptions: Record<string, string> = {
	"/agents":
		"Railly Hugo's work and perspective on coding agents, agent infrastructure, and AI developer tools.",
	"/blog": "Technical articles and essays by Railly Hugo.",
	"/bookshelf": "Books and learning resources followed by Railly Hugo.",
	"/flights": "Railly Hugo's public travel and flight map.",
	"/gallery": "A visual gallery from Railly Hugo's work and life.",
	"/meet": "Information for meeting Railly Hugo.",
	"/mentoring": "Railly Hugo's software engineering mentoring information.",
	"/newsletter": "Newsletter issues published by Railly Hugo.",
	"/people": "People and communities connected to Railly Hugo's work.",
	"/press":
		"Verified biographies, media resources, and press contact for Railly Hugo.",
	"/projects":
		"Open-source software and developer tools built or maintained by Railly Hugo.",
	"/uses": "Hardware, software, and tools used by Railly Hugo.",
	"/writing": "Technical writing and essays by Railly Hugo.",
};

export function getAgentMarkdown(pathname: string): string | null {
	const normalized = pathname !== "/" ? pathname.replace(/\/$/, "") : pathname;
	if (pages[normalized]) return pages[normalized];
	const description = routeDescriptions[normalized];
	if (!description) return null;
	const title = normalized
		.slice(1)
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
	return `# ${title} | Railly Hugo\n\n${description}\n\n- [Home](${canonical("/")})\n- [Developer resources](${canonical("/developers")})\n- [Agent instructions](${canonical("/agent-instructions.md")})\n- [Sitemap](${canonical("/sitemap-index.xml")})\n`;
}

export function getNotFoundMarkdown(pathname: string): string {
	return `# 404: Page not found\n\nNo resource exists at \`${pathname}\` on railly.dev. Use one of these recovery paths:\n\n- [Home](${canonical("/")})\n- [Developer resources](${canonical("/developers")})\n- [Projects](${canonical("/projects")})\n- [Writing](${canonical("/writing")})\n- [llms.txt](${canonical("/llms.txt")})\n- [Sitemap](${canonical("/sitemap-index.xml")})\n`;
}
