import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { type Subprocess, spawn } from "bun";

const port = 4_327;
const baseUrl = `http://127.0.0.1:${port}`;
let server: Subprocess;

async function waitForServer() {
	const deadline = Date.now() + 30_000;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(baseUrl);
			if (response.ok) return;
		} catch {}
		await Bun.sleep(100);
	}
	throw new Error("Astro development server did not start in time");
}

beforeAll(async () => {
	server = spawn(
		["bunx", "astro", "dev", "--host", "127.0.0.1", "--port", String(port)],
		{
			cwd: process.cwd(),
			stdout: "pipe",
			stderr: "pipe",
		},
	);
	await waitForServer();
}, 35_000);

afterAll(() => {
	server.kill();
});

describe("agent readiness HTTP contract", () => {
	it("renders a meaningful homepage without JavaScript", async () => {
		const response = await fetch(baseUrl, { headers: { Accept: "text/html" } });
		const html = await response.text();
		const visibleText = html
			.replace(/<script[\s\S]*?<\/script>/gi, "")
			.replace(/<style[\s\S]*?<\/style>/gi, "")
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim();
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(response.headers.get("vary")).toContain("Accept");
		expect(html).toMatch(/<h1[^>]*>[\s\S]*?Railly Hugo[\s\S]*?<\/h1>/);
		expect(visibleText.length).toBeGreaterThan(500);
	});

	it("negotiates Markdown with correct cache headers", async () => {
		const response = await fetch(baseUrl, {
			headers: { Accept: "text/markdown" },
		});
		const markdown = await response.text();
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/markdown");
		expect(response.headers.get("vary")).toContain("Accept");
		expect(response.headers.get("vary")).toContain("Accept-Encoding");
		expect(markdown).toContain("# Railly Hugo");
		expect(markdown).toContain("## When to use this site");
	});

	it("honors quality values and unsupported representations", async () => {
		const preferredMarkdown = await fetch(baseUrl, {
			headers: { Accept: "text/html;q=0.4, text/markdown;q=0.9" },
		});
		expect(preferredMarkdown.headers.get("content-type")).toContain(
			"text/markdown",
		);

		const rejectedMarkdown = await fetch(baseUrl, {
			headers: { Accept: "text/markdown;q=0, */*;q=1" },
		});
		expect(rejectedMarkdown.headers.get("content-type")).toContain("text/html");

		const unsupported = await fetch(baseUrl, {
			headers: { Accept: "application/pdf" },
		});
		expect(unsupported.status).toBe(406);
		expect(unsupported.headers.get("vary")).toContain("Accept");
	});

	it("serves agent-readable recovery with a real 404", async () => {
		const response = await fetch(`${baseUrl}/some-path-that-does-not-exist`, {
			headers: { Accept: "text/markdown" },
		});
		const markdown = await response.text();
		expect(response.status).toBe(404);
		expect(response.headers.get("content-type")).toContain("text/markdown");
		expect(markdown).toContain("# 404: Page not found");
		expect(markdown).toContain("/llms.txt");
		expect(markdown).toContain("/sitemap-index.xml");
	});

	it("serves visible recovery links with a real HTML 404", async () => {
		const response = await fetch(`${baseUrl}/some-path-that-does-not-exist`, {
			headers: { Accept: "text/html" },
		});
		const html = await response.text();
		expect(response.status).toBe(404);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(html).toContain("Page not found");
		expect(html).toContain('href="/llms.txt"');
		expect(html).toContain('href="/sitemap-index.xml"');
	});

	it("preserves negotiated headers and status for HEAD requests", async () => {
		const response = await fetch(baseUrl, {
			method: "HEAD",
			headers: { Accept: "text/markdown" },
		});
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/markdown");
		expect(response.headers.get("vary")).toContain("Accept");
		expect(await response.text()).toBe("");
	});

	it("publishes instructions, developer resources, and trust anchors", async () => {
		for (const pathname of [
			"/llms.txt",
			"/agent-instructions.md",
			"/developers",
			"/contact",
			"/privacy",
		]) {
			const response = await fetch(`${baseUrl}${pathname}`);
			expect(response.status, pathname).toBe(200);
		}
		const llms = await (await fetch(`${baseUrl}/llms.txt`)).text();
		expect(llms).toContain("## When to use this site");
		expect(llms).toContain("/developers");

		for (const pathname of ["/contact", "/privacy"]) {
			const html = await (await fetch(`${baseUrl}${pathname}`)).text();
			const visibleText = html
				.replace(/<script[\s\S]*?<\/script>/gi, "")
				.replace(/<style[\s\S]*?<\/style>/gi, "")
				.replace(/<[^>]+>/g, " ")
				.replace(/\s+/g, " ")
				.trim();
			expect(visibleText.length, pathname).toBeGreaterThan(500);
		}
	});

	it("publishes a typed OpenAPI contract for the project catalog", async () => {
		const response = await fetch(`${baseUrl}/openapi.json`);
		const document = await response.json();
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain(
			"application/vnd.oai.openapi+json",
		);
		expect(document.openapi).toBe("3.1.0");
		expect(document.paths["/api/projects.json"].get.operationId).toBe(
			"listRaillyProjects",
		);
	});

	it("returns actionable JSON for unknown API routes", async () => {
		const response = await fetch(`${baseUrl}/api/does-not-exist`);
		const body = await response.json();
		expect(response.status).toBe(404);
		expect(response.headers.get("content-type")).toContain("application/json");
		expect(response.headers.get("link")).toContain("/openapi.json");
		expect(body.error.code).toBe("API_ROUTE_NOT_FOUND");
		expect(body.error.resolution).toContain("OpenAPI");
		expect(body.error.documentation).toContain("/openapi.json");
	});
});
