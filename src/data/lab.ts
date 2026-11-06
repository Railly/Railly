// Lab experiments, newest first. Shared by /lab and the home preview.
export interface LabExperiment {
	n: string;
	href: string;
	title: string;
	summary: string;
	date: string;
	status: string;
	poster: string;
	video: string;
}

export const labExperiments: LabExperiment[] = [
	{
		n: "001",
		href: "/lab/grid-drill",
		title: "Grid drill",
		summary:
			"A short code for every place on Earth, one cell at a time. An AI agent did better without it.",
		date: "Nov 2026",
		status: "Didn't ship",
		poster: "/lab/grid-drill/run-card-poster.webp",
		video: "/lab/grid-drill/run-card.mp4",
	},
];
