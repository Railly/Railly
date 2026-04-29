export interface SiteConfig {
	name: string;
	description: string;
	url: string;
	ogImage: string;
	hero: {
		title: string;
		role: string;
		location: string;
	};
	author: string;
	email: string;
	links: {
		twitter: string;
		github: string;
		linkedin: string;
	};
	keywords: string[];
	locale: string;
	themeColor: {
		light: string;
		dark: string;
	};
	icons: {
		icon: string;
		shortcut: string;
		apple: string;
	};
	manifest: string;
}
