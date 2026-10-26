import type { SiteConfig } from "@/types";

interface OgUrlOptions {
	title: string;
	description: string;
	tag?: string;
	date?: string;
}

export const siteConfig: SiteConfig = {
	name: "Railly Hugo",
	description:
		"Railly Hugo builds at the frontier of what agents and interfaces can do. Software engineer at Vercel Labs and founder of Crafter Station, based in Buenos Aires.",
	url: "https://www.railly.dev",
	ogImage: "https://www.railly.dev/images/og.webp",
	hero: {
		title: "Hunter",
		role: "Software Engineer",
		location: "Buenos Aires, Argentina",
	},
	author: "Railly Hugo",
	email: "hi@railly.dev",
	links: {
		twitter: "https://twitter.com/raillyhugo",
		github: "https://github.com/Railly",
		linkedin: "https://linkedin.com/in/railly-hugo",
	},
	keywords: [
		"Railly Hugo",
		"Software Engineer",
		"Vercel",
		"Vercel Labs",
		"Crafter Station",
		"agents",
		"civic tech",
		"open source",
		"developer tools",
		"TypeScript",
		"Next.js",
		"React",
		"Lima",
		"Peru",
		"Buenos Aires",
		"Argentina",
		"LATAM tech",
	],
	locale: "en_US",
	themeColor: {
		light: "#fcfcfc",
		dark: "#0a0a0a",
	},
	icons: {
		icon: "/favicon/favicon.ico",
		shortcut: "/favicon/favicon-16x16.png",
		apple: "/favicon/apple-touch-icon.png",
	},
	manifest: "/favicon/site.webmanifest",
};

export function ogUrl({ title, description, tag, date }: OgUrlOptions) {
	const searchParams = new URLSearchParams({ title, description });

	if (tag) {
		searchParams.set("tag", tag);
	}

	if (date) {
		searchParams.set("date", date);
	}

	return `/api/og?${searchParams.toString()}`;
}
