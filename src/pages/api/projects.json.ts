export const prerender = true;

import { projects as projectsData } from "@/data/projects";
import { withRepoStars } from "@/lib/github-stars";

export async function GET() {
	const projectsWithStars = await withRepoStars(projectsData);
	const projects = projectsWithStars
		.map((project) => ({
			name: project.name,
			repo: project.repo,
			description: project.description,
			url: project.url,
			stars: project.stars,
			github: project.repo ? `https://github.com/${project.repo}` : undefined,
		}))
		.sort((a, b) => b.stars - a.stars);

	return new Response(
		JSON.stringify({
			generatedAt: new Date().toISOString(),
			count: projects.length,
			projects,
		}),
		{
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=3600, s-maxage=3600",
			},
		},
	);
}
