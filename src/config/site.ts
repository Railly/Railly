import type { SiteConfig } from "@/types";

const BASE_URL = import.meta.env.PROD
	? "https://www.railly.dev"
	: "http://localhost:4321";

export const siteConfig: SiteConfig = {
	name: "Railly Hugo",
	description:
		"Design Engineer from Lima. Building developer tools, winning hackathons, and crafting interfaces that ship.",
	url: BASE_URL,
	ogImage: `${BASE_URL}/images/og.webp`,
	author: "Railly Hugo",
	email: "contact@railly.dev",
	links: {
		twitter: "https://twitter.com/raillyhugo",
		github: "https://github.com/Railly/website",
		linkedin: "https://linkedin.com/in/railly-hugo",
	},
	keywords: [
		"Railly Hugo",
		"Design Engineer",
		"Web Development",
		"Frontend Development",
		"JavaScript",
		"TypeScript",
		"React",
		"Astro",
		"Lima",
		"Peru",
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
