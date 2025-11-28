import type { SiteConfig } from "@/types";

const BASE_URL = import.meta.env.PROD
	? "https://raillyhugo.com"
	: "http://localhost:4321";

export const siteConfig: SiteConfig = {
	name: "Railly Hugo",
	description:
		"Software Engineer and UI Developer from Lima. Dive into my projects, tutorials, and digital explorations. Always learning, always crafting.",
	url: BASE_URL,
	ogImage: `${BASE_URL}/images/og.png`,
	author: "Railly Hugo",
	email: "contact@raillyhugo.com",
	links: {
		twitter: "https://twitter.com/raillyhugo",
		github: "https://github.com/Railly/website",
		linkedin: "https://linkedin.com/in/railly-hugo",
	},
	keywords: [
		"Railly Hugo",
		"Software Engineer",
		"UI Developer",
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
		light: "#fffcf0", // flexoki paper
		dark: "#100F0F", // flexoki black
	},
	icons: {
		icon: "/favicon/favicon.ico",
		shortcut: "/favicon/favicon-16x16.png",
		apple: "/favicon/apple-touch-icon.png",
	},
	manifest: "/favicon/site.webmanifest",
};
