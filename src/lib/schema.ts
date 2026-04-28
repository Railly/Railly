import { siteConfig } from "@/config/site";

export interface SchemaProps {
	title: string;
	description: string;
	canonicalURL: URL;
	socialImageURL: URL;
	article: boolean;
	publishedTime?: Date;
	modifiedTime?: Date;
	readingTimeMinutes?: number;
	wordCount?: number;
}

export function buildSchemaGraph(props: SchemaProps): object {
	const graph: Record<string, unknown>[] = [
		{
			"@type": "WebSite",
			"@id": `${siteConfig.url}/#website`,
			url: siteConfig.url,
			name: siteConfig.name,
			description: siteConfig.description,
			inLanguage: "en-US",
		},
		{
			"@type": "Person",
			"@id": `${siteConfig.url}/#person`,
			name: siteConfig.author,
			url: siteConfig.url,
			image: `${siteConfig.url}/images/profile.webp`,
			sameAs: [
				siteConfig.links.twitter,
				siteConfig.links.github,
				siteConfig.links.linkedin,
			],
			jobTitle: "AI Software Engineer",
			worksFor: {
				"@type": "Organization",
				name: "Clerk",
				url: "https://clerk.com",
			},
			founder: {
				"@type": "Organization",
				name: "Crafter Station",
				url: "https://crafterstation.com",
			},
			alumniOf: {
				"@type": "CollegeOrUniversity",
				name: "Universidad Nacional Mayor de San Marcos",
				url: "https://unmsm.edu.pe",
			},
		},
	];
	if (props.article && props.publishedTime) {
		const blogPosting: Record<string, unknown> = {
			"@type": "BlogPosting",
			headline: props.title,
			description: props.description,
			image: props.socialImageURL.toString(),
			datePublished: props.publishedTime.toISOString(),
			dateModified: (props.modifiedTime || props.publishedTime).toISOString(),
			author: { "@id": `${siteConfig.url}/#person` },
			publisher: { "@id": `${siteConfig.url}/#person` },
			mainEntityOfPage: { "@id": props.canonicalURL.toString() },
		};
		if (props.readingTimeMinutes) {
			blogPosting.timeRequired = `PT${props.readingTimeMinutes}M`;
		}
		if (props.wordCount) {
			blogPosting.wordCount = props.wordCount;
		}
		graph.push(blogPosting);
	}
	const breadcrumbItems: Record<string, unknown>[] = [
		{ "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
	];
	if (props.article) {
		breadcrumbItems.push({
			"@type": "ListItem",
			position: 2,
			name: "Writing",
			item: `${siteConfig.url}/writing`,
		});
		breadcrumbItems.push({
			"@type": "ListItem",
			position: 3,
			name: props.title,
		});
	} else if (
		props.title !== siteConfig.name &&
		props.title !==
			"Railly Hugo - AI Software Engineer | Crafter Station Founder"
	) {
		breadcrumbItems.push({
			"@type": "ListItem",
			position: 2,
			name: props.title,
		});
	}
	if (breadcrumbItems.length > 1) {
		graph.push({ "@type": "BreadcrumbList", itemListElement: breadcrumbItems });
	}
	return { "@context": "https://schema.org", "@graph": graph };
}
