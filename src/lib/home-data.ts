import { getCollection } from "astro:content";
import { isPostListable } from "@/config/blog";
import { achievements } from "@/data/achievements";
import { appearances } from "@/data/appearances";
import { featuredProjects } from "@/data/projects";
import substack from "@/data/substack.json";
import youtube from "@/data/youtube.json";
import { withRepoStars } from "@/lib/github-stars";

export async function homeData() {
	const blog = (
		await getCollection("blog", ({ data }) =>
			import.meta.env.PROD ? data.status !== "draft" : true,
		)
	)
		.filter(({ data }) => isPostListable(data))
		.map((p) => ({
			title: p.data.title,
			href: `/blog/${p.slug}`,
			date: p.data.pubDate,
			external: false,
		}));
	const newsletter = substack.posts.map((p) => ({
		title: p.title,
		href: p.url,
		date: new Date(p.published),
		external: true,
	}));
	const posts = [...blog, ...newsletter]
		.sort((a, b) => b.date.valueOf() - a.date.valueOf())
		.slice(0, 5);
	return {
		posts,
		projects: await withRepoStars(featuredProjects),
		appearances,
		achievements: achievements.filter((a) => a.highlight),
		videos: youtube.videos,
	};
}

export const compact = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});
