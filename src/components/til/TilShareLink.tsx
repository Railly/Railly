import { useState } from "react";

interface TilShareLinkProps {
	slug: string;
}

export default function TilShareLink({ slug }: TilShareLinkProps) {
	const [copied, setCopied] = useState(false);

	function copy() {
		const url = `${window.location.origin}/til#${slug}`;
		navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<button
			onClick={copy}
			className="inline-flex items-center gap-1 text-xs text-flexoki-tx-3 hover:text-flexoki-tx transition-colors cursor-pointer"
			title="Copy link to this TIL"
		>
			{copied ? (
				<>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M20 6 9 17l-5-5" />
					</svg>
					Copied!
				</>
			) : (
				<>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
						<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
					</svg>
					Share
				</>
			)}
		</button>
	);
}
