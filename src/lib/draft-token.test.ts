import { describe, expect, it } from "bun:test";
import { findSlugByToken, generateDraftToken } from "./draft-token";

describe("generateDraftToken", () => {
	it("returns a 12-char hex string", () => {
		const token = generateDraftToken("my-post");
		expect(token).toBeTypeOf("string");
		expect(token?.length).toBe(12);
		expect(token).toMatch(/^[0-9a-f]{12}$/);
	});

	it("is deterministic — same slug returns same token", () => {
		expect(generateDraftToken("my-post")).toBe(generateDraftToken("my-post"));
	});

	it("different slugs produce different tokens", () => {
		expect(generateDraftToken("my-post")).not.toBe(
			generateDraftToken("other-post"),
		);
	});
});

describe("findSlugByToken", () => {
	it("finds the matching slug", () => {
		const token = generateDraftToken("my-post");
		expect(token).not.toBeNull();
		expect(findSlugByToken(token!, ["my-post", "other"])).toBe("my-post");
	});

	it("returns null when no slug matches", () => {
		expect(findSlugByToken("000000000000", ["my-post"])).toBeNull();
	});
});
