import {
	Tabs,
	TabsIndicator,
	TabsList,
	TabsPanel,
	TabsTab,
} from "@ui-sdk/react/tabs";
import type { ReactNode } from "react";

export type Deliverable = { title: string; detail: string; tag: string };

export type ReportPreview = {
	mentee: string;
	date: string;
	sections: string[];
};

const sectionInk = ["#4385BE", "#4385BE", "#879A39", "#DA702C", "#8B7EC8"];

function ReportArt({ preview }: { preview: ReportPreview }) {
	return (
		<div className="overflow-hidden rounded-[4px] border border-[var(--ed-line)] bg-background-2 shadow-[3px_3px_0_var(--ed-shadow)]">
			<div className="px-5 pt-4 pb-3">
				<div className="flex items-center gap-3">
					<img
						src="/favicon/favicon-32x32.png"
						alt=""
						className="size-7 rounded-full"
					/>
					<div className="flex items-baseline gap-2">
						<span className="text-sm font-semibold">Railly Hugo</span>
						<span className="font-serif text-[11px] italic text-foreground-3">
							Mentoring Report
						</span>
					</div>
				</div>
				<div className="mt-3 h-px bg-foreground" />
			</div>
			<div className="px-5 pb-4">
				<dl className="flex flex-wrap gap-x-5 gap-y-1 rounded-[3px] bg-foreground/5 p-3">
					{[
						["Mentee", preview.mentee],
						["Fecha", preview.date],
						["Duración", "30 minutos"],
						["Cobertura", "Completa"],
					].map(([k, v]) => (
						<div key={k} className="flex items-baseline gap-1.5">
							<dt className="font-serif text-[9px] tracking-wider text-foreground-3 uppercase">
								{k}
							</dt>
							<dd className="text-xs font-medium">{v}</dd>
						</div>
					))}
				</dl>
				<ul className="mt-4 flex flex-wrap gap-3">
					{preview.sections.map((section, i) => (
						<li key={section} className="flex items-center gap-1.5">
							<span
								className="h-3 w-1 rounded-full"
								style={{ background: sectionInk[i], opacity: 1 - i * 0.15 }}
							/>
							<span className="text-[11px] font-medium">{section}</span>
						</li>
					))}
				</ul>
				<div className="mt-4 flex flex-col gap-1.5" aria-hidden="true">
					<span className="h-1.5 w-11/12 rounded-full bg-foreground/8" />
					<span className="h-1.5 w-9/12 rounded-full bg-foreground/8" />
					<span className="h-1.5 w-10/12 rounded-full bg-foreground/8" />
				</div>
			</div>
			<div className="flex items-center justify-between border-t border-[var(--ed-line)] px-5 py-2 text-[9px] text-foreground-3">
				<span>railly.dev · @raillyhugo · railly@crafterstation.com</span>
				<span>1 / 2</span>
			</div>
		</div>
	);
}

function TranscriptArt() {
	const lines: [string, string, number][] = [
		["00:00", "Railly", 82],
		["00:41", "You", 64],
		["02:13", "Railly", 90],
		["03:05", "You", 48],
		["04:30", "Railly", 72],
	];
	return (
		<div
			className="ed-art flex flex-col gap-2.5 bg-background p-5"
			aria-hidden="true"
		>
			{lines.map(([t, who, w]) => (
				<div
					key={t}
					className="grid grid-cols-[3rem_3.5rem_1fr] items-center gap-2"
				>
					<span className="font-mono text-[10.5px] text-foreground-3">{t}</span>
					<span className="font-mono text-[10.5px] text-foreground-2">
						{who}
					</span>
					<span
						className="h-1.5 rounded-full bg-foreground/12"
						style={{ width: `${w}%` }}
					/>
				</div>
			))}
			<span className="ed-label mt-1">Every word, corrected.</span>
		</div>
	);
}

function PlaybookArt() {
	return (
		<div
			className="ed-art grid grid-cols-3 gap-2 bg-background p-4 sm:grid-cols-4"
			aria-hidden="true"
		>
			{Array.from({ length: 12 }, (_, i) => (
				<div
					key={i}
					className="flex aspect-[3/4] flex-col justify-between rounded-[3px] border border-[var(--ed-line)] bg-background-2 p-2 shadow-[2px_2px_0_var(--ed-shadow)]"
				>
					<span className="font-serif text-[15px] leading-none">
						{String(i + 1).padStart(2, "0")}
					</span>
					<span className="flex flex-col gap-1">
						<span className="h-1 w-full rounded-full bg-foreground/10" />
						<span className="h-1 w-2/3 rounded-full bg-foreground/10" />
					</span>
				</div>
			))}
		</div>
	);
}

function SkillArt() {
	return (
		<div
			className="overflow-hidden rounded-[4px] bg-[#1b1915] font-mono text-[12px] leading-relaxed text-[#ebe7df] shadow-[3px_3px_0_var(--ed-shadow-2)] dark:bg-[#18160f] dark:ring-1 dark:ring-white/10"
			aria-hidden="true"
		>
			<div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
				<span className="size-2 rounded-full bg-white/20" />
				<span className="size-2 rounded-full bg-white/20" />
				<span className="size-2 rounded-full bg-white/20" />
				<span className="ml-2 text-[10.5px] text-white/45">mentor skill</span>
			</div>
			<div className="flex flex-col gap-1 p-4">
				<span className="text-white/45">~/.claude/skills/mentor/</span>
				<span>
					<span className="text-white/45">├─ </span>SKILL.md
					<span className="text-white/40"> my advice</span>
				</span>
				<span>
					<span className="text-white/45">└─ </span>report.md
					<span className="text-white/40"> your session</span>
				</span>
				<span className="mt-3 text-white/45">
					Works in Claude Code or a Claude project.
				</span>
			</div>
		</div>
	);
}

function FollowUpArt() {
	return (
		<div
			className="ed-art flex flex-col items-start gap-3 bg-background p-5"
			aria-hidden="true"
		>
			<span className="ed-label">Day 30</span>
			<div className="max-w-[18rem] rounded-[4px] rounded-bl-none border border-[var(--ed-line)] bg-background-2 px-3.5 py-2.5 text-[13px] shadow-[2px_2px_0_var(--ed-shadow)]">
				How did your next steps go?
			</div>
			<div className="flex flex-col gap-1.5">
				{[70, 55, 62].map((w, i) => (
					<span key={i} className="flex items-center gap-2">
						<span className="size-3 rounded-[2px] border border-[var(--ed-line-2)]" />
						<span
							className="h-1.5 rounded-full bg-foreground/10"
							style={{ width: `${w * 2}px` }}
						/>
					</span>
				))}
			</div>
		</div>
	);
}

export function TakeHome({
	deliverables,
	preview,
	reportBlurb,
}: {
	deliverables: Deliverable[];
	preview: ReportPreview;
	reportBlurb: string;
}) {
	const art: Record<string, ReactNode> = {
		Report: <ReportArt preview={preview} />,
		Transcript: <TranscriptArt />,
		"The Playbook": <PlaybookArt />,
		"Mentor skill": <SkillArt />,
		"Day-30 follow-up": <FollowUpArt />,
	};

	return (
		<Tabs
			defaultValue={deliverables[0]?.title}
			className="ed flex flex-col gap-5"
		>
			<div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:px-0">
				<TabsList
					aria-label="What you take home"
					className="relative flex w-max gap-1 border-b border-[var(--ed-line)] sm:w-full"
				>
					{deliverables.map((d) => (
						<TabsTab
							key={d.title}
							value={d.title}
							className="cursor-pointer px-2.5 pt-1 pb-2.5 font-mono text-[12px] whitespace-nowrap text-foreground-3 transition-colors data-selected:text-foreground hover:text-foreground"
						>
							{d.title}
						</TabsTab>
					))}
					<TabsIndicator className="absolute bottom-[-1px] left-(--active-tab-left) h-[2px] w-(--active-tab-width) bg-foreground transition-[left,width] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-[activation-direction=none]:transition-none" />
				</TabsList>
			</div>
			{deliverables.map((d) => (
				<TabsPanel
					key={d.title}
					value={d.title}
					className="grid grid-cols-1 items-start gap-5 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:gap-7"
				>
					<div className="flex flex-col gap-2 pt-1">
						<span className="ed-label">{d.tag}</span>
						<h3 className="font-serif text-[24px] leading-tight font-normal tracking-[-0.01em]">
							{d.title}
						</h3>
						<p className="text-[14.5px] leading-relaxed text-foreground-2">
							{d.detail}
						</p>
						{d.title === "Report" ? (
							<p className="text-[13.5px] leading-relaxed text-foreground-3">
								{reportBlurb}
							</p>
						) : null}
					</div>
					<div className="ed-rise">{art[d.title]}</div>
				</TabsPanel>
			))}
		</Tabs>
	);
}
