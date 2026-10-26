import { getCollection } from "astro:content";
import { isPostListable } from "@/config/blog";
import { achievements } from "@/data/achievements";
import { appearances } from "@/data/appearances";
import { featuredProjects } from "@/data/projects";
import youtube from "@/data/youtube.json";
import { withRepoStars } from "@/lib/github-stars";

export async function homeData() {
	const posts = (
		await getCollection("blog", ({ data }) =>
			import.meta.env.PROD ? data.status !== "draft" : true,
		)
	)
		.filter(({ data }) => isPostListable(data))
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
		.slice(0, 5);
	return {
		posts,
		projects: await withRepoStars(featuredProjects),
		appearances,
		achievements: achievements.filter((a) => a.highlight),
		videos: youtube.videos.slice(0, 4),
	};
}

export const compact = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});
