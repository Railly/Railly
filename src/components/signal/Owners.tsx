import { Toggle, ToggleGroup } from "@ui-sdk/react/toggle";
import {
	createTooltipController,
	Tooltip,
	TooltipTrigger,
} from "@ui-sdk/react/tooltip";
import { useEffect, useState } from "react";
import type { Owner } from "./model";
import { Avatar, avatarAt, dayLabel, fmt, Tip } from "./shared";
import { initOwnerFromUrl, setOwner, useOwner } from "./store";

type Props = {
	owners: Owner[];
	weekStarts: string[];
	months: { col: number; label: string }[];
};

type Week = { start: string; count: number };

function Faces({ owner, size }: { owner: Owner; size: number }) {
	if (owner.avatars.length === 1) {
		return (
			<Avatar
				src={avatarAt(owner.avatars[0], size * 2)}
				size={size}
				round={owner.round}
				alt={`${owner.label} avatar`}
			/>
		);
	}
	const shown = owner.avatars.slice(0, 4);
	return (
		<span className="flex -space-x-2" aria-hidden="true">
			{shown.map((src) => (
				<Avatar
					key={src}
					src={avatarAt(src, size * 2)}
					size={size}
					alt=""
					className="ring-2 ring-background"
				/>
			))}
		</span>
	);
}

export function Owners({ owners, weekStarts, months }: Props) {
	const owner = useOwner();
	const [tooltip] = useState(() => createTooltipController<Week>());
	const selected = owners.find((o) => o.key === owner) ?? owners[0];
	const max = Math.max(1, ...selected.weekly);
	const peak = selected.weekly.indexOf(Math.max(...selected.weekly));

	useEffect(() => {
		initOwnerFromUrl(owners.map((o) => o.key));
	}, [owners]);

	return (
		<div className="flex flex-col gap-6">
			<ToggleGroup
				aria-label="Filter the page by GitHub owner"
				value={[owner]}
				deselectable={false}
				loop
				onValueChange={(next) => {
					if (next[0]) setOwner(String(next[0]));
				}}
				className="sg-owners grid grid-cols-2 gap-2.5 sm:grid-cols-3"
			>
				{owners.map((o) => (
					<Toggle
						key={o.key}
						value={o.key}
						aria-label={`${o.key === "all" ? "All owners" : o.label}, ${fmt(o.total)} public contributions`}
						className="sg-owner group"
					>
						<span className="flex items-center justify-between gap-2">
							<Faces owner={o} size={o.avatars.length === 1 ? 28 : 22} />
							<span className="sg-owner-share ed-num">
								{o.key === "all"
									? "100%"
									: `${(o.share * 100).toFixed(o.share < 0.01 ? 1 : 0)}%`}
							</span>
						</span>
						<span className="mt-3 flex min-w-0 flex-col gap-0.5">
							<span className="truncate text-[14px] font-medium">
								{o.key === "all" ? "All owners" : o.label}
							</span>
							<span className="sg-owner-meta ed-num truncate">
								{fmt(o.total)} · {o.repoCount} repo
								{o.repoCount === 1 ? "" : "s"}
							</span>
						</span>
						<span className="sg-owner-bar" aria-hidden="true">
							<span style={{ width: `${Math.max(o.share * 100, 1.5)}%` }} />
						</span>
					</Toggle>
				))}
			</ToggleGroup>

			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
					<p className="text-[14.5px] text-foreground-2">
						<span key={selected.key} className="ed-rise inline-block">
							<span className="font-medium text-foreground">
								{selected.key === "all" ? "Every owner" : selected.label}
							</span>
							{selected.name && selected.name !== selected.label
								? ` (${selected.name})`
								: ""}
							: {fmt(selected.commits)} commits and {fmt(selected.prs)} pull
							requests across {selected.repoCount} public repo
							{selected.repoCount === 1 ? "" : "s"}.
						</span>
					</p>
					{selected.topRepos.length > 0 && (
						<span className="ed-label truncate">
							Top: {selected.topRepos.join(", ")}
						</span>
					)}
				</div>
				<div className="sg-wave" aria-hidden="true">
					{selected.weekly.map((count, i) => (
						<TooltipTrigger
							key={weekStarts[i]}
							controller={tooltip}
							payload={{ start: weekStarts[i], count }}
							render={<span />}
							tabIndex={-1}
							className="sg-bar"
							data-peak={i === peak && count > 0 ? "" : undefined}
						>
							<span
								style={{
									height: `${count ? Math.max(6, (count / max) * 100) : 0}%`,
								}}
							/>
						</TooltipTrigger>
					))}
				</div>
				<div className="sg-wave-months" aria-hidden="true">
					{months.map((m) => (
						<span
							key={m.col}
							className="ed-label"
							style={{ gridColumnStart: m.col + 1 }}
						>
							{m.label}
						</span>
					))}
				</div>
				<p className="sr-only">
					Busiest week for {selected.label}: {dayLabel(weekStarts[peak])},{" "}
					{fmt(selected.weekly[peak] ?? 0)} contributions.
				</p>
				<Tooltip controller={tooltip} delay={60} closeDelay={40}>
					<Tip<Week>>
						{(w) => (
							<>
								<strong className="font-medium">{fmt(w.count)}</strong>{" "}
								<span className="opacity-70">week of {dayLabel(w.start)}</span>
							</>
						)}
					</Tip>
				</Tooltip>
			</div>
		</div>
	);
}
