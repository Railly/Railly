import { useState, useEffect } from "react";

interface TilFiltersProps {
	topics: string[];
}

export default function TilFilters({ topics }: TilFiltersProps) {
	const [active, setActive] = useState<string | null>(null);

	useEffect(() => {
		const hash = window.location.hash.slice(1);
		const params = new URLSearchParams(window.location.search);
		const topic = params.get("topic");
		if (topic && topics.includes(topic)) {
			setActive(topic);
		}
		if (hash) {
			const el = document.getElementById(hash);
			if (el) {
				setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
			}
		}
	}, []);

	useEffect(() => {
		const articles = document.querySelectorAll<HTMLElement>("article[data-topic]");
		articles.forEach((article) => {
			if (!active || article.dataset.topic === active) {
				article.style.display = "";
			} else {
				article.style.display = "none";
			}
		});
	}, [active]);

	function toggle(topic: string) {
		const next = active === topic ? null : topic;
		setActive(next);
		const url = new URL(window.location.href);
		if (next) {
			url.searchParams.set("topic", next);
		} else {
			url.searchParams.delete("topic");
		}
		window.history.replaceState({}, "", url.toString());
	}

	return (
		<div className="flex flex-wrap gap-1.5 mb-8">
			{topics.map((topic) => (
				<button
					key={topic}
					onClick={() => toggle(topic)}
					className={`px-2 py-0.5 text-[11px] rounded-md transition-colors cursor-pointer ${
						active === topic
							? "bg-flexoki-tx text-flexoki-bg"
							: "text-flexoki-tx-3 hover:text-flexoki-tx"
					}`}
				>
					{topic}
				</button>
			))}
		</div>
	);
}
