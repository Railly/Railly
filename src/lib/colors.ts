export type ColorName =
	| "blue"
	| "teal"
	| "yellow"
	| "cyan"
	| "purple"
	| "magenta"
	| "orange";

export const colorMap = {
	blue: {
		border: "hover:border-blue/30",
		text: "group-hover:text-blue",
		gradient: "from-blue/[0.05]",
		shine: "via-blue/10",
	},
	teal: {
		border: "hover:border-teal/30",
		text: "group-hover:text-teal",
		gradient: "from-teal/[0.05]",
		shine: "via-teal/10",
	},
	yellow: {
		border: "hover:border-yellow/30",
		text: "group-hover:text-yellow",
		gradient: "from-yellow/[0.05]",
		shine: "via-yellow/10",
	},
	cyan: {
		border: "hover:border-cyan/30",
		text: "group-hover:text-cyan",
		gradient: "from-cyan/[0.05]",
		shine: "via-cyan/10",
	},
	purple: {
		border: "hover:border-purple/30",
		text: "group-hover:text-purple",
		gradient: "from-purple/[0.05]",
		shine: "via-purple/10",
	},
	magenta: {
		border: "hover:border-magenta/30",
		text: "group-hover:text-magenta",
		gradient: "from-magenta/[0.05]",
		shine: "via-magenta/10",
	},
	orange: {
		border: "hover:border-orange/30",
		text: "group-hover:text-orange",
		gradient: "from-orange/[0.05]",
		shine: "via-orange/10",
	},
} as const satisfies Record<
	ColorName,
	{
		border: string;
		text: string;
		gradient: string;
		shine: string;
	}
>;
