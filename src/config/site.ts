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
		"Software Engineer at Vercel Labs and Founder of Crafter Station, building AI developer tools, open source software, and LATAM's tech ecosystem from Lima, Peru.",
	url: "https://www.railly.dev",
	ogImage: "https://www.railly.dev/images/og.webp",
	hero: {
		title: "Hunter",
		role: "Software Engineer",
		location: "Lima, Peru",
	},
	author: "Railly Hugo",
	email: "contact@railly.dev",
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
		"AI research",
		"civic tech",
		"open source",
		"developer tools",
		"TypeScript",
		"Next.js",
		"React",
		"Lima",
		"Peru",
		"LATAM tech",
	],
	locale: "en_US",
	themeColor: {
		light: "#FDFDFC",
		dark: "#111111",
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
