import type { BrandName } from "../components/brand/registry";

export interface ProjectData {
	name: string;
	repo: string;
	description: string;
	url: string;
	icon: BrandName;
}

export const projects: ProjectData[] = [
	{
		name: "Tinte",
		repo: "Railly/tinte",
		description: "Theme builder for VS Code, shadcn, and more",
		url: "https://tinte.dev",
		icon: "tinte",
	},
	{
		name: "Elements",
		repo: "crafter-station/elements",
		description: "Full-stack shadcn components for auth, ai, and more",
		url: "https://tryelements.dev",
		icon: "elements",
	},
	{
		name: "Agentfiles",
		repo: "Railly/agentfiles",
		description: "Browse, create, and edit AI agent files from Obsidian",
		url: "https://github.com/Railly/agentfiles",
		icon: "agentfiles",
	},
	{
		name: "One Hunter",
		repo: "Railly/one-hunter-vscode",
		description: "VS Code theme inspired by Vercel and One Dark Pro",
		url: "https://marketplace.visualstudio.com/items?itemName=RaillyHugo.one-hunter",
		icon: "oneHunter",
	},
	{
		name: "trx",
		repo: "crafter-station/trx",
		description: "Agent-first CLI for audio/video transcription",
		url: "https://github.com/crafter-station/trx",
		icon: "trx",
	},
	{
		name: "SkillKit",
		repo: "crafter-station/skill-kit",
		description: "Local-first analytics for AI agent skills",
		url: "https://github.com/crafter-station/skill-kit",
		icon: "skillKit",
	},
	{
		name: "Skills",
		repo: "crafter-station/skills",
		description: "Agent skills, starting with context engineering",
		url: "https://github.com/crafter-station/skills",
		icon: "skills",
	},
	{
		name: "hack0",
		repo: "crafter-station/hack0",
		description: "Mapping LATAM's tech ecosystem - hackathons + events",
		url: "https://hack0.dev",
		icon: "hack0",
	},
	{
		name: "IA Hackathon Peru",
		repo: "crafter-station/peru.ai-hackathon.co",
		description: "Biggest AI hackathon in Peru - 3 editions in 2025-2026",
		url: "https://peru.ai-hackathon.co",
		icon: "iaHack",
	},
	{
		name: "Voxtype",
		repo: "Railly/voxtype",
		description: "3D typography in pure SVG - voxel sculptures, zero WebGL",
		url: "https://github.com/Railly/voxtype",
		icon: "voxtype",
	},
	{
		name: "Agent Brain",
		repo: "Railly/agent-brain",
		description: "Agent-powered knowledge system on Obsidian + Claude Code",
		url: "https://github.com/Railly/agent-brain",
		icon: "agentBrain",
	},
	{
		name: "Roast Roulette",
		repo: "Railly/roast-roulette",
		description: "Paste any URL, get roasted by AI with sound effects",
		url: "https://github.com/Railly/roast-roulette",
		icon: "roastRoulette",
	},
	{
		name: "Codex Globe",
		repo: "crafter-station/codex-globe",
		description: "Interactive 3D globe mapping Codex Ambassadors worldwide",
		url: "https://github.com/crafter-station/codex-globe",
		icon: "codexGlobe",
	},
	{
		name: "spoti-cli",
		repo: "crafter-station/spoti-cli",
		description: "Spotify Web API from your terminal, built for AI agents",
		url: "https://github.com/crafter-station/spoti-cli",
		icon: "spotiCli",
	},
	{
		name: "Zones",
		repo: "Railly/zones",
		description: "Timezone dashboard for remote teams",
		url: "https://github.com/Railly/zones",
		icon: "zones",
	},
	{
		name: "Hypeman",
		repo: "Railly/hypeman",
		description: "AI-powered hype generation platform",
		url: "https://github.com/Railly/hypeman",
		icon: "hypeman",
	},
	{
		name: "text0",
		repo: "crafter-station/text0",
		description: "AI-powered text editor with real-time collaboration",
		url: "https://text0.dev",
		icon: "text0",
	},
	{
		name: "Scrapi",
		repo: "crafter-station/scrapi",
		description: "Fast web scraper with AI-powered data extraction",
		url: "https://scrapi.fast",
		icon: "scrapi",
	},
	{
		name: "sunat-cli",
		repo: "Railly/sunat-cli",
		description: "Agent-first CLI for SUNAT tax automation in Peru",
		url: "https://github.com/Railly/sunat-cli",
		icon: "sunatCli",
	},
	{
		name: "hapi-cli",
		repo: "crafter-station/hapi-cli",
		description: "Agent-first CLI for Hapi Trade brokerage",
		url: "https://github.com/crafter-station/hapi-cli",
		icon: "hapiCli",
	},
	{
		name: "cligentic",
		repo: "Railly/cligentic",
		description: "Copy-paste CLI blocks for the agent era",
		url: "https://cligentic.railly.dev",
		icon: "cligentic",
	},
	{
		name: "Pintel",
		repo: "crafter-station/pintel",
		description: "Draw, guess, evaluate - a multimodal AI evaluation game",
		url: "https://github.com/crafter-station/pintel",
		icon: "pintel",
	},
	{
		name: "Chess Battle",
		repo: "crafter-station/chess-battle",
		description: "Real-time AI-vs-AI chess battles for benchmarking LLMs",
		url: "https://github.com/crafter-station/chess-battle",
		icon: "chessBattle",
	},
	{
		name: "Pawboard",
		repo: "crafter-station/pawboard",
		description: "Real-time collaborative ideation board",
		url: "https://github.com/crafter-station/pawboard",
		icon: "pawboard",
	},
	{
		name: "GitHunter",
		repo: "crafter-station/githunter",
		description: "GitHub user discovery and analysis platform",
		url: "https://github.com/crafter-station/githunter",
		icon: "githunter",
	},
	{
		name: "latex0",
		repo: "crafter-station/latex0",
		description: "The future of typesetting - LaTeX editor",
		url: "https://github.com/crafter-station/latex0",
		icon: "latex0",
	},
	{
		name: "Flow",
		repo: "crafter-station/flow",
		description: "Zero-dependency tree layout and infinite canvas for React",
		url: "https://github.com/crafter-station/flow",
		icon: "flow",
	},
];

export const featuredProjects = projects.slice(0, 6);

export const projectsData = projects;
export const homeProjectsData = featuredProjects.map((project) => ({
	title: project.name,
	description: project.description,
	href: project.url,
	icon: project.icon,
}));
