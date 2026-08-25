import { describe, expect, it } from "bun:test";
import { openApiDocument } from "./openapi";

describe("OpenAPI document", () => {
	it("describes the public project catalog for function calling", () => {
		const operation = openApiDocument.paths["/api/projects.json"].get;
		expect(openApiDocument.openapi).toBe("3.1.0");
		expect(operation.operationId).toBe("listRaillyProjects");
		expect(operation.description.length).toBeGreaterThan(20);
		expect(
			operation.responses["200"].content["application/json"].schema,
		).toEqual({ $ref: "#/components/schemas/ProjectCatalog" });
		expect(
			openApiDocument.components.schemas.ProjectCatalog.required,
		).toContain("projects");
	});
});
