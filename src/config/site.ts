import type { SiteConfig } from "@/types";

const BASE_URL = import.meta.env.PROD
	? "https://www.railly.dev"
	: "http://localhost:4321";

export const siteConfig: SiteConfig = {
	name: "Railly Hugo",
	description:
		"AI Software Engineer at Clerk and Founder of Crafter Station. Building open-source developer tools, winning hackathons, and growing Peru's tech ecosystem from Lima.",
	url: BASE_URL,
	ogImage: `${BASE_URL}/images/og.webp`,
	author: "Railly Hugo",
	email: "contact@railly.dev",
	links: {
		twitter: "https://twitter.com/raillyhugo",
		github: "https://github.com/Railly",
		linkedin: "https://linkedin.com/in/railly-hugo",
	},
	keywords: [
		"Railly Hugo",
		"AI Software Engineer",
		"Crafter Station",
		"Clerk",
		"open source",
		"developer tools",
		"hackathon winner",
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
