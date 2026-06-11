import { describe, expect, it } from "bun:test";
import { httpError, json } from "./http";

describe("json", () => {
	it("returns 200 with JSON body by default", async () => {
		const res = json({ ok: true });
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("application/json");
		expect(await res.json()).toEqual({ ok: true });
	});

	it("respects custom status", () => {
		expect(json({}, 201).status).toBe(201);
	});
});

describe("httpError", () => {
	it("wraps message and code in error envelope", async () => {
		const res = httpError("Missing id", "MISSING_ID", 400);
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			error: { message: "Missing id", code: "MISSING_ID" },
		});
	});

	it("defaults to status 400", () => {
		expect(httpError("x", "X").status).toBe(400);
	});
});
