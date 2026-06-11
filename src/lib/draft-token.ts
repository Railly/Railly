import { createHmac } from "node:crypto";
import { safeEqual } from "@/lib/auth";

function getDraftSecret(): string | null {
	const secret = import.meta.env.DRAFT_SECRET;
	if (secret) return secret;
	if (import.meta.env.PROD) return null;
	return "dev-draft-secret";
}

export function generateDraftToken(slug: string): string | null {
	const secret = getDraftSecret();
	if (!secret) return null;
	return createHmac("sha256", secret).update(slug).digest("hex").slice(0, 12);
}

export function findSlugByToken(token: string, slugs: string[]): string | null {
	for (const slug of slugs) {
		const expected = generateDraftToken(slug);
		if (expected && safeEqual(expected, token)) {
			return slug;
		}
	}
	return null;
}
