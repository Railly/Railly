import { describe, expect, it } from "bun:test";
import { isValidSlug, parseIncrement } from "./counters";

describe("isValidSlug", () => {
	it("accepts simple slug", () => {
		expect(isValidSlug("tinte")).toBe(true);
	});

	it("accepts slug with digits and hyphens", () => {
		expect(isValidSlug("2000-stars-later")).toBe(true);
	});

	it("rejects empty string", () => {
		expect(isValidSlug("")).toBe(false);
	});

	it("rejects uppercase letters", () => {
		expect(isValidSlug("UPPER")).toBe(false);
	});

	it("rejects slug with spaces", () => {
		expect(isValidSlug("a b")).toBe(false);
	});

	it("rejects path traversal", () => {
		expect(isValidSlug("a/../b")).toBe(false);
	});

	it("rejects leading hyphen", () => {
		expect(isValidSlug("-leading")).toBe(false);
	});

	it("rejects trailing hyphen", () => {
		expect(isValidSlug("trailing-")).toBe(false);
	});

	it("rejects string longer than 128 chars", () => {
		expect(isValidSlug("a".repeat(200))).toBe(false);
	});
});

describe("isValidSlug — batch list validation", () => {
	it("every() returns true for a list of valid slugs", () => {
		expect("a,b,c".split(",").every(isValidSlug)).toBe(true);
	});

	it("every() returns false when list contains an invalid slug", () => {
		expect(["valid-slug", "BAD SLUG"].every(isValidSlug)).toBe(false);
	});

	it("empty string split with filter(Boolean) produces empty array", () => {
		const ids = "".split(",").filter(Boolean);
		expect(ids.length).toBe(0);
	});
});

describe("parseIncrement", () => {
	it('("1", 50) → 1', () => {
		expect(parseIncrement("1", 50)).toBe(1);
	});

	it('("50", 50) → 50', () => {
		expect(parseIncrement("50", 50)).toBe(50);
	});

	it('("51", 50) → null', () => {
		expect(parseIncrement("51", 50)).toBeNull();
	});

	it('("0", 50) → null', () => {
		expect(parseIncrement("0", 50)).toBeNull();
	});

	it('("-5", 50) → null', () => {
		expect(parseIncrement("-5", 50)).toBeNull();
	});

	it('("1.5", 50) → null', () => {
		expect(parseIncrement("1.5", 50)).toBeNull();
	});

	it('("abc", 50) → null', () => {
		expect(parseIncrement("abc", 50)).toBeNull();
	});

	it('("999999999", 50) → null', () => {
		expect(parseIncrement("999999999", 50)).toBeNull();
	});

	it("(null, 50) → null", () => {
		expect(parseIncrement(null, 50)).toBeNull();
	});
});
