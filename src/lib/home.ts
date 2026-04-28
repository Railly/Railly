export const heroData = {
	name: "Railly Hugo",
	title: "Hunter",
} as const;

export const projectsData = [
	{
		title: "Tinte",
		description: "Multiplatform theme builder",
		href: "https://tinte.dev",
		icon: "tinte",
	},
	{
		title: "Elements",
		description: "Full-stack shadcn components",
		href: "https://tryelements.dev",
		icon: "elements",
	},
	{
		title: "Agentfiles",
		description: "AI agent files in Obsidian",
		href: "https://github.com/Railly/agentfiles",
		icon: "agentfiles",
	},
	{
		title: "One Hunter Theme",
		description: "VS Code theme (35k+ downloads)",
		href: "https://marketplace.visualstudio.com/items?itemName=RaillyHugo.one-hunter",
		icon: "oneHunter",
	},
	{
		title: "trx",
		description: "Agent-first transcription CLI",
		href: "https://github.com/crafter-station/trx",
		icon: "trx",
	},
	{
		title: "hack0",
		description: "LATAM tech ecosystem map",
		href: "https://hack0.dev",
		icon: "hack0",
	},
] as const;

export const achievementsData = [
	{
		year: "2026",
		achievement: "ElevenLabs Prize",
		event: "Agents Hackathon Brazil",
		eventUrl:
			"https://www.linkedin.com/posts/railly-hugo_aiagents-hackathon-buildinginpublic-activity-7423521448687919104-ybiq",
		project: "i18n",
		projectUrl: "https://i18n.crafter.run",
		scope: "br",
	},
	{
		year: "2026",
		achievement: "2nd Place",
		event: "v0 × Sanity Builder Challenge",
		eventUrl:
			"https://www.sanity.io/blog/v0-sanity-builder-challenge-the-winners",
		project: "Annual Calendar 2026",
		projectUrl: "https://v0-annual-calendar.vercel.app",
		scope: "global",
	},
	{
		year: "2026",
		achievement: "Online Winner",
		event: "Platanus Hack 25'| Voting",
		eventUrl: "https://25.hack.platan.us/vote/scrapifast",
		project: "Scrapi",
		projectUrl: "https://scrapi.fast",
		scope: "cl",
	},
	{
		year: "2025",
		achievement: "Overall Winner",
		event: "Next.js Global Hackathon",
		eventUrl: "https://www.youtube.com/watch?v=KDRwgbwq0_c&t=1142s",
		project: "text0",
		projectUrl: "https://text0.dev",
		scope: "global",
	},
	{
		year: "2025",
		achievement: "1st Place",
		event: "Vercel AI Gateway Hackathon",
		eventUrl: "https://www.youtube.com/watch?v=yKzXoJgPenw&t=28889s",
		project: "Chess Battle",
		projectUrl: "https://github.com/crafter-station/chess-battle",
		scope: "global",
	},
	{
		year: "2025",
		achievement: "Judge & Mentor",
		event: "IA Hackathon Colombia Tech Fest",
		eventUrl:
			"https://www.linkedin.com/posts/railly-hugo_de-vuelta-en-lima-despu%C3%A9s-de-una-experiencia-activity-7369217715481362432-XgLj",
		scope: "co",
	},
	{
		year: "2025",
		achievement: "Outstanding Graduate",
		event: "UNMSM Engineering",
		eventUrl: "https://www.youtube.com/watch?v=swdmucdGGLA&t=10362s",
		scope: "pe",
	},
	{
		year: "2025",
		achievement: "Finalist",
		event: "Platanus Hack 25' | In-person",
		eventUrl:
			"https://www.linkedin.com/posts/railly-hugo_gran-experiencia-en-la-platanus-hack-25-activity-7400005671913684992-A1WW",
		project: "Scrapi",
		projectUrl: "https://scrapi.fast",
		scope: "cl",
	},
	{
		year: "2025",
		achievement: "Finalist",
		event: "IA Hackathon LATAM",
		eventUrl:
			"https://www.linkedin.com/feed/update/urn:li:ugcPost:7328521111485243393",
		project: "GitHunter",
		projectUrl: "https://github.com/crafter-station/githunter",
		scope: "global",
	},
	{
		year: "2024",
		achievement: "3rd Place",
		event: "Vercel × Midudev Hackathon",
		eventUrl:
			"https://www.linkedin.com/feed/update/urn:li:ugcPost:7232743944592240640",
		project: "Tinte",
		projectUrl: "https://tinte.dev",
		scope: "global",
	},
] as const;

export type ProjectIconKey = (typeof projectsData)[number]["icon"];
