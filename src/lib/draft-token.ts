import { createHmac } from "node:crypto";

const DRAFT_SECRET = import.meta.env.DRAFT_SECRET || "dev-draft-secret";

export function generateDraftToken(slug: string): string {
	return createHmac("sha256", DRAFT_SECRET)
		.update(slug)
		.digest("hex")
		.slice(0, 12);
}

export function findSlugByToken(
	token: string,
	slugs: string[],
): string | null {
	for (const slug of slugs) {
		if (generateDraftToken(slug) === token) {
			return slug;
		}
	}
	return null;
}
