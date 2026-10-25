export interface Appearance {
	kind: "Talk" | "Interview" | "Press";
	title: string;
	where: string;
	date: string;
	url?: string;
}

export const appearances: Appearance[] = [
	{
		kind: "Talk",
		title: "DevDay Exchange Lima",
		where: "OpenAI community event, UNMSM, Lima",
		date: "2026-10",
		url: "https://devday.crafter.run",
	},
	{
		kind: "Interview",
		title: "A las y 7, S01E05",
		where: "YouTube",
		date: "2026-10",
		url: "https://www.youtube.com/live/bKfvnVOBOS0",
	},
	{
		kind: "Talk",
		title: "Second Brain: cómo construirlo y mantenerlo vivo",
		where: "React BA, Buenos Aires",
		date: "2026-09",
		url: "https://react-ba.crafter.run",
	},
	{
		kind: "Talk",
		title: "La nueva generación de ingenieros",
		where: "Semana Industrial, UNAT, Tayacaja",
		date: "2026-09",
		url: "https://unat.crafter.run",
	},
	{
		kind: "Press",
		title: "Codex Globe in the official Codex Ambassadors directory",
		where: "OpenAI",
		date: "2026",
		url: "https://developers.openai.com/community/codex-ambassadors/directory",
	},
	{
		kind: "Press",
		title: "Petdex cited as the source of 3,200+ sprites",
		where: "Decrypt",
		date: "2026",
		url: "https://decrypt.co/es/372082/tu-agente-hermes-ahora-tiene-una-mascota-que-no-hace-absolutamente-nada-y-ese-es-el-punto",
	},
	{
		kind: "Press",
		title: "Crafter Station ranked in the OSSCAR index",
		where: "Supabase OSSCAR",
		date: "2026",
		url: "https://osscar.dev/org/crafter-station",
	},
	{
		kind: "Talk",
		title: "Conferencias Magistrales, invited alumni speaker",
		where: "UNMSM, Lima",
		date: "2025-12",
	},
];
