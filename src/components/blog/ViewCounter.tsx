import { useEffect, useRef, useState } from "react";

interface ViewCounterProps {
	slug: string;
	increment?: boolean;
	className?: string;
}

const STORAGE_KEY = "viewedSlugs";

const getViewedSlugs = (): Set<string> => {
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		return stored ? new Set(JSON.parse(stored)) : new Set();
	} catch {
		return new Set();
	}
};

const markSlugViewed = (slug: string) => {
	try {
		const slugs = getViewedSlugs();
		slugs.add(slug);
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...slugs]));
	} catch {
		// sessionStorage unavailable (e.g. private browsing)
	}
};

const isDev = () => {
	if (typeof window === "undefined") return false;
	return (
		window.location.hostname === "localhost" ||
		window.location.hostname === "127.0.0.1"
	);
};

export default function ViewCounter({
	slug,
	increment = false,
	className = "text-sm text-foreground-2",
}: ViewCounterProps) {
	const [views, setViews] = useState<number | null>(null);
	const hasFetchedRef = useRef(false);

	useEffect(() => {
		if (!slug || hasFetchedRef.current) {
			return;
		}

		if (isDev()) {
			return;
		}

		hasFetchedRef.current = true;

		const alreadyViewed = getViewedSlugs().has(slug);
		const shouldIncrement = increment && !alreadyViewed;
		if (shouldIncrement) {
			markSlugViewed(slug);
		}

		const params = new URLSearchParams({ id: slug });
		if (shouldIncrement) {
			params.append("incr", "1");
		}
		const url = `/api/views?${params.toString()}`;

		let isMounted = true;

		fetch(url)
			.then((res) => {
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				return res.json();
			})
			.then((data) => {
				if (isMounted) {
					if (data.views != null) {
						setViews(data.views);
					} else {
						setViews(0);
					}
				}
			})
			.catch((error) => {
				if (isMounted) {
					setViews(0);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [slug, increment]);

	if (isDev() || views === null) {
		return null;
	}

	return (
		<span className={className}>
			{views.toLocaleString()} {views === 1 ? "view" : "views"}
		</span>
	);
}
