import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { isPostVisible } from "../config/blog";
import { siteConfig } from "../config/site";

export async function GET(context: { site: URL }) {
	const posts = await getCollection("blog", ({ data }) => {
		return isPostVisible(data);
	});

	const sortedPosts = posts.sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);

	return rss({
		title: siteConfig.name,
		description: siteConfig.description,
		site: context.site ?? siteConfig.url,
		items: sortedPosts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description,
			link: `/blog/${post.slug}/`,
			categories: post.data.tags,
		})),
		customData: `<language>en-us</language>`,
	});
}
