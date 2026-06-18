import { defineCollection, z } from "astro:content";

const blog = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z
			.union([z.coerce.date(), z.string().datetime()])
			.transform((val) => new Date(val)),
		updatedDate: z
			.union([z.coerce.date(), z.string().datetime()])
			.transform((val) => new Date(val))
			.optional(),
		heroImage: z
			.object({
				src: z.string(),
				alt: z.string().default(""),
			})
			.optional(),
		image: z.string().optional(),
		imageDark: z.string().optional(),
		tags: z.array(z.string()).default([]),
		category: z.enum(["tech", "personal", "tutorial", "thoughts"]).optional(),
		status: z
			.enum(["draft", "published", "archived", "premiere"])
			.default("published"),
		featured: z.boolean().default(false),
	}),
});

const newsletter = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		subject: z.string(),
		pubDate: z
			.union([z.coerce.date(), z.string().datetime()])
			.transform((val) => new Date(val)),
		weekNumber: z.number(),
	}),
});

export const collections = {
	blog,
	newsletter,
};
