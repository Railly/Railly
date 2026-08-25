import { describe, expect, it } from "bun:test";
import { getAgentMarkdown, getNotFoundMarkdown } from "./agent-content";

describe("agent content", () => {
	it("publishes specific when-to-use guidance and machine-readable resources", () => {
		const markdown = getAgentMarkdown("/");
		expect(markdown).toContain("# Railly Hugo");
		expect(markdown).toContain("## When to use this site");
		expect(markdown).toContain("/developers");
		expect(markdown).toContain("/api/projects.json");
		expect(markdown?.length).toBeGreaterThan(500);
	});

	it("publishes honest developer-resource boundaries", () => {
		const markdown = getAgentMarkdown("/developers");
		expect(markdown).toContain("not a hosted API product");
		expect(markdown).toContain("There is no site-wide API key");
	});

	it("returns null for unknown canonical content", () => {
		expect(getAgentMarkdown("/does-not-exist")).toBeNull();
	});

	it("gives agents actionable 404 recovery paths", () => {
		const markdown = getNotFoundMarkdown("/does-not-exist");
		expect(markdown).toContain("# 404: Page not found");
		expect(markdown).toContain("/llms.txt");
		expect(markdown).toContain("/sitemap-index.xml");
	});
});
