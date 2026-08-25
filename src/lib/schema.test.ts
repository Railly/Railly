import { describe, expect, it } from "bun:test";
import { buildSchemaGraph } from "./schema";

describe("buildSchemaGraph", () => {
	it("publishes complete person and organization identity data", () => {
		const schema = buildSchemaGraph({
			title: "Railly Hugo",
			description: "Personal site",
			canonicalURL: new URL("https://www.railly.dev/"),
			socialImageURL: new URL("https://www.railly.dev/images/og.webp"),
			article: false,
		}) as { "@graph": Array<Record<string, unknown>> };
		const person = schema["@graph"].find(
			(entry) => entry["@type"] === "Person",
		);
		const organization = schema["@graph"].find(
			(entry) => entry["@type"] === "Organization",
		);

		expect(person).toMatchObject({
			name: "Railly Hugo",
			url: "https://www.railly.dev",
			jobTitle: "Software Engineer",
		});
		expect(person?.sameAs).toBeArray();
		expect(organization).toMatchObject({
			name: "Crafter Station",
			contactPoint: {
				email: "hi@railly.dev",
				contactType: "general inquiries",
			},
			address: { addressLocality: "Buenos Aires", addressCountry: "AR" },
		});
	});
});
