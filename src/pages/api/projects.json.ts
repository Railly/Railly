export const prerender = true;

const projectsData = [
	{
		name: "Tinte",
		repo: "Railly/tinte",
		description: "Theme builder for VS Code, shadcn, and more",
		url: "https://tinte.dev",
	},
	{
		name: "Elements",
		repo: "crafter-station/elements",
		description: "Full-stack shadcn components for auth, ai, and more",
		url: "https://tryelements.dev",
	},
	{
		name: "Agentfiles",
		repo: "Railly/agentfiles",
		description: "Browse, create, and edit AI agent files from Obsidian",
		url: "https://github.com/Railly/agentfiles",
	},
	{
		name: "One Hunter",
		repo: "Railly/one-hunter-vscode",
		description: "VS Code theme inspired by Vercel and One Dark Pro",
		url: "https://marketplace.visualstudio.com/items?itemName=RaillyHugo.one-hunter",
	},
	{
		name: "trx",
		repo: "crafter-station/trx",
		description: "Agent-first CLI for audio/video transcription",
		url: "https://github.com/crafter-station/trx",
	},
	{
		name: "SkillKit",
		repo: "crafter-station/skill-kit",
		description: "Local-first analytics for AI agent skills",
		url: "https://github.com/crafter-station/skill-kit",
	},
	{
		name: "Skills",
		repo: "crafter-station/skills",
		description: "Agent skills, starting with context engineering",
		url: "https://github.com/crafter-station/skills",
	},
	{
		name: "hack0",
		repo: "crafter-station/hack0",
		description: "Mapping LATAM's tech ecosystem - hackathons + events",
		url: "https://hack0.dev",
	},
	{
		name: "IA Hackathon Peru",
		repo: "crafter-station/peru.ai-hackathon.co",
		description: "Biggest AI hackathon in Peru - 3 editions in 2025-2026",
		url: "https://peru.ai-hackathon.co",
	},
	{
		name: "Voxtype",
		repo: "Railly/voxtype",
		description: "3D typography in pure SVG - voxel sculptures, zero WebGL",
		url: "https://github.com/Railly/voxtype",
	},
	{
		name: "Agent Brain",
		repo: "Railly/agent-brain",
		description: "Agent-powered knowledge system on Obsidian + Claude Code",
		url: "https://github.com/Railly/agent-brain",
	},
	{
		name: "Roast Roulette",
		repo: "Railly/roast-roulette",
		description: "Paste any URL, get roasted by AI with sound effects",
		url: "https://github.com/Railly/roast-roulette",
	},
	{
		name: "Codex Globe",
		repo: "crafter-station/codex-globe",
		description: "Interactive 3D globe mapping Codex Ambassadors worldwide",
		url: "https://github.com/crafter-station/codex-globe",
	},
	{
		name: "spoti-cli",
		repo: "crafter-station/spoti-cli",
		description: "Spotify Web API from your terminal, built for AI agents",
		url: "https://github.com/crafter-station/spoti-cli",
	},
	{
		name: "Zones",
		repo: "Railly/zones",
		description: "Timezone dashboard for remote teams",
		url: "https://github.com/Railly/zones",
	},
	{
		name: "Hypeman",
		repo: "Railly/hypeman",
		description: "AI-powered hype generation platform",
		url: "https://github.com/Railly/hypeman",
	},
	{
		name: "text0",
		repo: "crafter-station/text0",
		description: "AI-powered text editor with real-time collaboration",
		url: "https://text0.dev",
	},
	{
		name: "Scrapi",
		repo: "crafter-station/scrapi",
		description: "Fast web scraper with AI-powered data extraction",
		url: "https://scrapi.fast",
	},
];

async function getStars(repo: string): Promise<number> {
	try {
		const res = await fetch(`https://api.github.com/repos/${repo}`);
		if (!res.ok) return 0;
		const data = await res.json();
		return data.stargazers_count || 0;
	} catch {
		return 0;
	}
}

export async function GET() {
	const projects = await Promise.all(
		projectsData.map(async (p) => ({
			...p,
			stars: await getStars(p.repo),
			github: `https://github.com/${p.repo}`,
		})),
	);

	projects.sort((a, b) => b.stars - a.stars);

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
