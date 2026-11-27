import { describe, expect, it } from "bun:test";
import { buildSchemaGraph } from "./schema";

describe("buildSchemaGraph", () => {
	it("publishes complete person and organization identity data", () => {
		const schema = buildSchemaGraph({
			title: "Railly Hugo",
			description: "Personal site",
			canonicalURL: new URL("https://www.railly.dev/"),
			socialImageURL: new URL("https://www.railly.dev/api/og?title=Railly+Hugo"),
			article: false,
		}) as { "@graph": Array<Record<string, unknown>> };
		const person = schema["@graph"].find(
			(entry) => entry["@type"] === "Person",
		);
		const organization = schema["@graph"].find(
			(entry) => entry["@type"] === "Organization",
		);

		expect(person).toMatchObject({
			"@id": "https://www.railly.dev/#person",
			name: "Railly Hugo",
			url: "https://www.railly.dev",
			jobTitle: "Software Engineer",
			founder: { "@id": "https://crafter.run/#organization" },
		});
		expect(person?.sameAs).toBeArray();
		expect(organization).toEqual({
			"@type": "Organization",
			"@id": "https://crafter.run/#organization",
			name: "Crafter Station",
			url: "https://crafter.run",
		});
	});
});
