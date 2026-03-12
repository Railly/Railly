const WORDS_PER_MINUTE = 200;

export function getReadingTime(content: string): {
	words: number;
	minutes: number;
	text: string;
} {
	const clean = content
		.replace(/---[\s\S]*?---/, "")
		.replace(/import\s+.*?from\s+['"].*?['"]/g, "")
		.replace(/<[^>]+>/g, "")
		.replace(/```[\s\S]*?```/g, "")
		.replace(/`[^`]*`/g, "")
		.replace(/!\[.*?\]\(.*?\)/g, "")
		.replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
		.replace(/[#*_~>|=-]/g, "");

	const words = clean
		.split(/\s+/)
		.filter((word) => word.length > 0).length;

	const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

	return {
		words,
		minutes,
		text: `${minutes} min read`,
	};
}
