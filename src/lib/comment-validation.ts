export const LIMITS = {
	name: 50,
	text: 2000,
	quote: 500,
	maxCommentsPerDraft: 200,
	maxYPixels: 100_000,
} as const;

export function cleanString(value: unknown, maxLength: number): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (trimmed.length === 0 || trimmed.length > maxLength) return null;
	return trimmed;
}

export function cleanCoordinates(
	x: unknown,
	y: unknown,
): { x: number; y: number } | null {
	const nx = Number(x);
	const ny = Number(y);
	if (!Number.isFinite(nx) || !Number.isFinite(ny)) return null;
	if (nx < 0 || nx > 100) return null;
	if (ny < 0 || ny > LIMITS.maxYPixels) return null;
	return { x: nx, y: ny };
}
