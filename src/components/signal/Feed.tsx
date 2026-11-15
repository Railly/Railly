import {
	Accordion,
	AccordionHeader,
	AccordionItem,
	AccordionPanel,
	AccordionTrigger,
} from "@ui-sdk/react/accordion";
import { useEffect, useState } from "react";
import type { ShippedItem } from "./model";
import { Avatar, avatarAt } from "./shared";
import { useOwner } from "./store";

type Props = {
	items: ShippedItem[];
	visible: number;
	label: string;
	empty: string;
};

const KIND = {
	pr: { mark: "sg-mark-pr", word: "Merged" },
	release: { mark: "sg-mark-release", word: "Released" },
	commit: { mark: "sg-mark-commit", word: "Commit" },
} as const;

const shortDate = (iso: string) =>
	new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});

function relative(iso: string, now: number) {
	const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
	if (days < 1) return "today";
	if (days < 2) return "yesterday";
	if (days < 30) return `${days}d ago`;
	return shortDate(iso);
}

function Row({ item, now }: { item: ShippedItem; now: number | null }) {
	const [owner, name] = item.repo.split("/");
	const kind = KIND[item.kind];
	return (
		<li className="ed ed-item">
			<a
				href={item.url}
				target="_blank"
				rel="noopener noreferrer"
				className="sg-feed-row group"
			>
				<Avatar
					src={avatarAt(item.avatar, 40)}
					size={20}
					round={item.round}
					alt={`${owner} avatar`}
					className="mt-0.5"
				/>
				<span className="flex min-w-0 flex-col gap-1">
					<span className="flex min-w-0 items-center gap-2">
						<span aria-hidden="true" className={`sg-mark ${kind.mark}`} />
						<span className="sr-only">{kind.word}</span>
						<span className="ed-label truncate">
							{owner}/<span className="sg-repo">{name}</span>
						</span>
					</span>
					<span className="sg-feed-title">{item.title}</span>
				</span>
				<span className="flex shrink-0 flex-col items-end gap-1 text-right">
					<time dateTime={item.date} className="ed-num">
						{now ? relative(item.date, now) : shortDate(item.date)}
					</time>
					<span className="ed-label hidden whitespace-nowrap sm:block">
						{item.meta}
					</span>
				</span>
			</a>
		</li>
	);
}

export function Feed({ items, visible, label, empty }: Props) {
	const owner = useOwner();
	const [now, setNow] = useState<number | null>(null);
	useEffect(() => setNow(Date.now()), []);

	const shown =
		owner === "all" ? items : items.filter((item) => item.group === owner);
	const head = shown.slice(0, visible);
	const tail = shown.slice(visible);

	if (!shown.length) {
		return (
			<p className="border-y border-[var(--ed-line)] py-4 text-[14.5px] text-foreground-3">
				{empty}
			</p>
		);
	}

	return (
		<div key={owner} className="ed-rise">
			<ul className="ed ed-list" aria-label={label}>
				{head.map((item) => (
					<Row key={item.url} item={item} now={now} />
				))}
			</ul>
			{tail.length > 0 && (
				<Accordion className="ed">
					<AccordionItem value="more">
						<AccordionPanel className="h-(--accordion-panel-height) overflow-hidden transition-[height,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:h-0 data-ending-style:opacity-0 data-starting-style:h-0 data-starting-style:opacity-0 motion-reduce:transition-none">
							<ul className="ed ed-list sg-tail" aria-label={`${label}, older`}>
								{tail.map((item) => (
									<Row key={item.url} item={item} now={now} />
								))}
							</ul>
						</AccordionPanel>
						<AccordionHeader>
							<AccordionTrigger className="sg-more group">
								<span className="group-data-open:hidden">
									Show {tail.length} more
								</span>
								<span className="hidden group-data-open:inline">
									Show fewer
								</span>
							</AccordionTrigger>
						</AccordionHeader>
					</AccordionItem>
				</Accordion>
			)}
		</div>
	);
}
