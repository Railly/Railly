export function ogUrl(
	title: string,
	description: string,
	tag?: string,
): string {
	const params = new URLSearchParams({ title, description });
	if (tag) params.set("tag", tag);
	return `/api/og?${params.toString()}`;
}
