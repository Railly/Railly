import { describe, expect, it } from "bun:test";
import { isAuthorized, safeEqual } from "./auth";

describe("safeEqual", () => {
	it("returns true for equal strings", () => {
		expect(safeEqual("abc", "abc")).toBe(true);
	});

	it("returns false for different strings of same length", () => {
		expect(safeEqual("abc", "xyz")).toBe(false);
	});

	it("returns false for strings of different length", () => {
		expect(safeEqual("abc", "abcd")).toBe(false);
	});
});

describe("isAuthorized", () => {
	it("returns false when authHeader is null", () => {
		expect(isAuthorized(null, "s")).toBe(false);
	});

	it("returns false when secret is undefined (fail-closed regression)", () => {
		expect(isAuthorized("Bearer s", undefined)).toBe(false);
	});

	it("returns false for the exact exploit string when secret is undefined", () => {
		expect(isAuthorized("Bearer undefined", undefined)).toBe(false);
	});

	it("returns false when secret is present but header is wrong", () => {
		expect(isAuthorized("Bearer wrong", "s")).toBe(false);
	});

	it("returns true when header matches secret", () => {
		expect(isAuthorized("Bearer s", "s")).toBe(true);
	});
});
