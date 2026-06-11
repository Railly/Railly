import { timingSafeEqual } from "node:crypto";

export function safeEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	if (bufA.length !== bufB.length) return false;
	return timingSafeEqual(bufA, bufB);
}

export function isAuthorized(
	authHeader: string | null,
	secret: string | undefined,
): boolean {
	if (!secret) return false;
	if (!authHeader) return false;
	return safeEqual(authHeader, `Bearer ${secret}`);
}
