import { describe, expect, it } from "bun:test";
import { cleanCoordinates, cleanString, LIMITS } from "./comment-validation";

describe("cleanString", () => {
	it("trims surrounding whitespace", () => {
		expect(cleanString("  hello  ", 50)).toBe("hello");
	});

	it("rejects a number", () => {
		expect(cleanString(42, 50)).toBeNull();
	});

	it("rejects null", () => {
		expect(cleanString(null, 50)).toBeNull();
	});

	it("rejects an object", () => {
		expect(cleanString({}, 50)).toBeNull();
	});

	it("rejects empty string", () => {
		expect(cleanString("", 50)).toBeNull();
	});

	it("rejects whitespace-only string", () => {
		expect(cleanString("   ", 50)).toBeNull();
	});

	it("rejects a string over the limit", () => {
		expect(cleanString("a".repeat(51), 50)).toBeNull();
	});

	it("accepts a string exactly at the limit", () => {
		const s = "a".repeat(50);
		expect(cleanString(s, 50)).toBe(s);
	});

	it("accepts a normal string", () => {
		expect(cleanString("hello world", 50)).toBe("hello world");
	});
});

describe("cleanCoordinates", () => {
	it("accepts (0, 0)", () => {
		expect(cleanCoordinates(0, 0)).toEqual({ x: 0, y: 0 });
	});

	it("accepts (100, 99999)", () => {
		expect(cleanCoordinates(100, 99999)).toEqual({ x: 100, y: 99999 });
	});

	it("accepts numeric strings", () => {
		expect(cleanCoordinates("50", "300")).toEqual({ x: 50, y: 300 });
	});

	it("rejects x > 100", () => {
		expect(cleanCoordinates(101, 0)).toBeNull();
	});

	it("rejects x < 0", () => {
		expect(cleanCoordinates(-1, 0)).toBeNull();
	});

	it("rejects y < 0", () => {
		expect(cleanCoordinates(50, -5)).toBeNull();
	});

	it("rejects NaN for x", () => {
		expect(cleanCoordinates(Number.NaN, 0)).toBeNull();
	});

	it("rejects Infinity for y", () => {
		expect(cleanCoordinates(50, Number.POSITIVE_INFINITY)).toBeNull();
	});

	it(`rejects y > ${LIMITS.maxYPixels}`, () => {
		expect(cleanCoordinates(50, 200_000)).toBeNull();
	});

	it("rejects non-numeric string for x", () => {
		expect(cleanCoordinates("abc", 0)).toBeNull();
	});
});
