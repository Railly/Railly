import {
	createTooltipController,
	Tooltip,
	TooltipTrigger,
} from "@ui-sdk/react/tooltip";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Day } from "./model";
import { dayLabel, fmt, Legend, levelOf, Tip } from "./shared";

type Props = {
	weeks: Day[][];
	thresholds: number[];
	months: { col: number; label: string }[];
};

export function Heatmap({ weeks, thresholds, months }: Props) {
	const [tooltip] = useState(() => createTooltipController<Day>());
	const [focus, setFocus] = useState(-1);
	const scroller = useRef<HTMLDivElement>(null);
	const grid = useRef<HTMLDivElement>(null);
	const days = weeks.flat();
	const first = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
	const active = focus < 0 ? days.length - 1 : focus;

	// On narrow screens the grid scrolls; start at the latest weeks.
	useEffect(() => {
		const el = scroller.current;
		if (el) el.scrollLeft = el.scrollWidth;
	}, []);

	const move = (e: KeyboardEvent) => {
		const step: Record<string, number> = {
			ArrowUp: -1,
			ArrowDown: 1,
			ArrowLeft: -7,
			ArrowRight: 7,
			Home: -days.length,
			End: days.length,
		};
		if (!(e.key in step)) return;
		e.preventDefault();
		const next = Math.max(0, Math.min(days.length - 1, active + step[e.key]));
		setFocus(next);
		grid.current?.querySelector<HTMLElement>(`[data-i="${next}"]`)?.focus();
	};

	return (
		<div className="flex flex-col gap-2">
			<div
				ref={scroller}
				className="sg-scroll -mx-1 overflow-x-auto px-1 pt-1 pb-2"
			>
				<div className="sg-heat min-w-[600px]">
					<div className="sg-months" aria-hidden="true">
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
					{/* biome-ignore lint/a11y/useSemanticElements: a 2D grid of days with roving focus */}
					<div
						ref={grid}
						role="group"
						aria-label="Daily contributions, last 12 months. Arrow keys move between days."
						className="sg-days"
						onKeyDown={move}
					>
						{days.map((d, i) => (
							<TooltipTrigger
								key={d.date}
								controller={tooltip}
								payload={d}
								render={<span />}
								data-i={i}
								data-l={levelOf(d.count, thresholds)}
								tabIndex={i === active ? 0 : -1}
								aria-label={`${fmt(d.count)} contributions on ${dayLabel(d.date, { year: "numeric" })}`}
								onFocus={() => setFocus(i)}
								className="sg-cell sg-day"
								style={{
									gridColumnStart: Math.floor((i + first) / 7) + 1,
									gridRowStart: ((i + first) % 7) + 1,
								}}
							/>
						))}
					</div>
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="ed-label">
					{dayLabel(days[0].date, { year: "numeric" })} to{" "}
					{dayLabel(days[days.length - 1].date, { year: "numeric" })}
				</span>
				<Legend />
			</div>
			<Tooltip controller={tooltip} delay={80} closeDelay={40}>
				<Tip<Day>>
					{(d) => (
						<>
							<strong className="font-medium">
								{d.count === 0 ? "No" : fmt(d.count)} contribution
								{d.count === 1 ? "" : "s"}
							</strong>{" "}
							<span className="opacity-70">
								{dayLabel(d.date, { weekday: "short" })}
							</span>
						</>
					)}
				</Tip>
			</Tooltip>
		</div>
	);
}
