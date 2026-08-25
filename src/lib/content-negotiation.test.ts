import { describe, expect, it } from "bun:test";
import {
	appendNegotiationHeaders,
	isDocumentRequest,
	preferredRepresentation,
} from "./content-negotiation";

describe("preferredRepresentation", () => {
	const cases: Array<[string | null, "html" | "markdown" | null]> = [
		[null, "html"],
		["", "html"],
		["*/*", "html"],
		["text/html", "html"],
		["text/markdown", "markdown"],
		["text/markdown, text/html", "markdown"],
		["text/html, text/markdown", "html"],
		["text/html;q=0.5, text/markdown;q=1", "markdown"],
		["text/html;q=1, text/markdown;q=0.5", "html"],
		["text/markdown;q=0, */*;q=1", "html"],
		["text/html;q=0, text/markdown;q=0", null],
		["application/json", null],
		["text/*;q=0.8, text/markdown;q=0.9", "markdown"],
	];

	for (const [header, expected] of cases) {
		it(`${header ?? "missing"} selects ${expected ?? "406"}`, () => {
			expect(preferredRepresentation(header)).toBe(expected);
		});
	}
});

describe("appendNegotiationHeaders", () => {
	it("sets both cache variation dimensions", () => {
		const headers = new Headers();
		appendNegotiationHeaders(headers);
		expect(headers.get("Vary")).toBe("Accept, Accept-Encoding");
	});

	it("preserves existing Vary values without duplicating negotiation values", () => {
		const headers = new Headers({ Vary: "RSC, Accept" });
		appendNegotiationHeaders(headers);
		expect(headers.get("Vary")).toBe("RSC, Accept, Accept-Encoding");
	});
});

describe("isDocumentRequest", () => {
	it("accepts canonical GET and HEAD document requests", () => {
		expect(isDocumentRequest(new Request("https://www.railly.dev/"), "/")).toBe(
			true,
		);
		expect(
			isDocumentRequest(
				new Request("https://www.railly.dev/about", { method: "HEAD" }),
				"/about",
			),
		).toBe(true);
	});

	it("excludes API, asset, and mutation requests", () => {
		expect(
			isDocumentRequest(
				new Request("https://www.railly.dev/api/projects.json"),
				"/api/projects.json",
			),
		).toBe(false);
		expect(
			isDocumentRequest(
				new Request("https://www.railly.dev/rss.xml"),
				"/rss.xml",
			),
		).toBe(false);
		expect(
			isDocumentRequest(
				new Request("https://www.railly.dev/", { method: "POST" }),
				"/",
			),
		).toBe(false);
	});
});
