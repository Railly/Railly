import { useEffect, useState } from "react";

interface PremiereCountdownProps {
	pubDate: string;
}

function getTimeLeft(target: Date) {
	const diff = target.getTime() - Date.now();
	if (diff <= 0) return null;

	const days = Math.floor(diff / 86400000);
	const hours = Math.floor((diff % 86400000) / 3600000);
	const minutes = Math.floor((diff % 3600000) / 60000);
	const seconds = Math.floor((diff % 60000) / 1000);

	return { days, hours, minutes, seconds };
}

function formatCountdown(t: { days: number; hours: number; minutes: number; seconds: number }) {
	if (t.days > 0) return `${t.days}d ${t.hours}h ${t.minutes}m`;
	if (t.hours > 0) return `${t.hours}h ${t.minutes}m ${t.seconds}s`;
	return `${t.minutes}m ${t.seconds}s`;
}

export default function PremiereCountdown({ pubDate }: PremiereCountdownProps) {
	const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(new Date(pubDate)));

	useEffect(() => {
		const id = setInterval(() => {
			const t = getTimeLeft(new Date(pubDate));
			setTimeLeft(t);
			if (!t) clearInterval(id);
		}, 1000);
		return () => clearInterval(id);
	}, [pubDate]);

	if (!timeLeft) {
		return (
			<span className="text-xs font-mono text-flexoki-tx-2">
				Available now
			</span>
		);
	}

	return (
		<span className="inline-flex items-center gap-1.5 text-xs font-mono text-flexoki-tx-3 tabular-nums">
			<span className="relative flex h-1.5 w-1.5">
				<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-flexoki-tx-3 opacity-50" />
				<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-flexoki-tx-3" />
			</span>
			{formatCountdown(timeLeft)}
		</span>
	);
}
