import {
	Accordion,
	AccordionHeader,
	AccordionItem,
	AccordionPanel,
	AccordionTrigger,
} from "@ui-sdk/react/accordion";
import type { Owner, Repo } from "./model";
import { Avatar, avatarAt, dayLabel, fmt, Legend, levelOf } from "./shared";
import { useOwner } from "./store";

type Props = {
	owners: Owner[];
	repos: Repo[];
	thresholds: number[];
	months: { col: number; label: string }[];
	weekStarts: string[];
};

function Strip({
	repo,
	thresholds,
	weekStarts,
}: {
	repo: Repo;
	thresholds: number[];
	weekStarts: string[];
}) {
	const peak = repo.weekly.indexOf(Math.max(...repo.weekly));
	const activeWeeks = repo.weekly.filter((c) => c > 0).length;
	return (
		<li className="sg-repo-row">
			<a
				href={repo.url}
				target="_blank"
				rel="noopener noreferrer"
				className="sg-repo-name truncate"
			>
				{repo.name}
			</a>
			<span
				className="sg-strip"
				role="img"
				aria-label={`${repo.name}: ${fmt(repo.total)} contributions over ${activeWeeks} active weeks, busiest the week of ${dayLabel(weekStarts[peak])}`}
			>
				{repo.weekly.map((count, i) => (
					<span
						key={weekStarts[i]}
						className="sg-cell"
						data-l={levelOf(count, thresholds)}
					/>
				))}
			</span>
			<span className="ed-num sg-repo-total">{fmt(repo.total)}</span>
		</li>
	);
}

function Group({
	owner,
	repos,
	visible,
	thresholds,
	weekStarts,
}: {
	owner: Owner;
	repos: Repo[];
	visible: number;
	thresholds: number[];
	weekStarts: string[];
}) {
	const head = repos.slice(0, visible);
	const tail = repos.slice(visible);
	return (
		<section className="sg-group" aria-label={owner.label}>
			<header className="sg-group-head">
				{owner.avatars.length === 1 ? (
					<Avatar
						src={avatarAt(owner.avatars[0], 40)}
						size={20}
						round={owner.round}
						alt={`${owner.label} avatar`}
					/>
				) : (
					<span className="flex -space-x-1.5" aria-hidden="true">
						{owner.avatars.slice(0, 5).map((src) => (
							<Avatar
								key={src}
								src={avatarAt(src, 32)}
								size={16}
								alt=""
								className="ring-2 ring-background"
							/>
						))}
					</span>
				)}
				{owner.url ? (
					<a
						href={owner.url}
						target="_blank"
						rel="noopener noreferrer"
						className="ed-link text-[14px] font-medium text-foreground"
					>
						{owner.label}
					</a>
				) : (
					<span className="text-[14px] font-medium">{owner.label}</span>
				)}
				<span className="ed-leader" aria-hidden="true" />
				<span className="ed-num">
					{fmt(owner.total)} · {owner.repoCount} repo
					{owner.repoCount === 1 ? "" : "s"}
				</span>
			</header>
			<ul className="sg-repos">
				{head.map((r) => (
					<Strip
						key={r.nameWithOwner}
						repo={r}
						thresholds={thresholds}
						weekStarts={weekStarts}
					/>
				))}
			</ul>
			{tail.length > 0 && (
				<Accordion>
					<AccordionItem value="more">
						<AccordionPanel className="h-(--accordion-panel-height) overflow-hidden transition-[height,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:h-0 data-ending-style:opacity-0 data-starting-style:h-0 data-starting-style:opacity-0 motion-reduce:transition-none">
							<ul className="sg-repos">
								{tail.map((r) => (
									<Strip
										key={r.nameWithOwner}
										repo={r}
										thresholds={thresholds}
										weekStarts={weekStarts}
									/>
								))}
							</ul>
						</AccordionPanel>
						<AccordionHeader>
							<AccordionTrigger className="sg-more sg-more-sm group">
								<span className="group-data-open:hidden">
									Show {tail.length} more repo{tail.length === 1 ? "" : "s"}
								</span>
								<span className="hidden group-data-open:inline">
									Show fewer
								</span>
							</AccordionTrigger>
						</AccordionHeader>
					</AccordionItem>
				</Accordion>
			)}
		</section>
	);
}

export function WeekGrid({
	owners,
	repos,
	thresholds,
	months,
	weekStarts,
}: Props) {
	const owner = useOwner();
	const groups = owners.filter(
		(o) => o.key !== "all" && (owner === "all" || o.key === owner),
	);

	return (
		<div className="flex flex-col gap-2">
			<div className="sg-repo-row sg-axis" aria-hidden="true">
				<span className="ed-label">Repo</span>
				<span className="sg-axis-months">
					{months.map((m) => (
						<span
							key={m.col}
							className="ed-label"
							style={{ gridColumnStart: m.col + 1 }}
						>
							{m.label}
						</span>
					))}
				</span>
				<span className="ed-label text-right">Total</span>
			</div>
			<div key={owner} className="ed-rise flex flex-col gap-7">
				{groups.map((g) => (
					<Group
						key={g.key}
						owner={g}
						repos={repos.filter((r) => r.group === g.key)}
						visible={owner === "all" ? 3 : 12}
						thresholds={thresholds}
						weekStarts={weekStarts}
					/>
				))}
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-2">
				<span className="ed-label">
					One cell per week. Commits, pull requests, issues and reviews.
				</span>
				<Legend />
			</div>
		</div>
	);
}
