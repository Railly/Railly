import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
    type: 'content',
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
        heroImage: z.object({
            src: z.string(),
            alt: z.string().default(''),
        }).optional(),
        tags: z.array(z.string()).default([]),
        category: z.enum(['tech', 'personal', 'tutorial', 'thoughts']).optional(),
        status: z.enum(['draft', 'published', 'archived']).default('published'),
        featured: z.boolean().default(false),
    }),
});

export const collections = {
    blog,
}; 