const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const MAX_CLAP_INCREMENT = 50; // matches ClapButton's MAX_SESSION_CLAPS

export function isValidSlug(id: string): boolean {
	return id.length > 0 && id.length <= 128 && SLUG_REGEX.test(id);
}

export function parseIncrement(raw: string | null, max: number): number | null {
	if (raw == null) return null;
	const n = Number(raw);
	if (!Number.isInteger(n) || n < 1 || n > max) return null;
	return n;
}
