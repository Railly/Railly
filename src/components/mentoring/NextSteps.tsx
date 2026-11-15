import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox";
import {
	Progress,
	ProgressIndicator,
	ProgressLabel,
	ProgressTrack,
	ProgressValue,
} from "@ui-sdk/react/progress";
import { useState } from "react";

export function CheckMark() {
	return (
		<svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
			<path
				d="M2.5 6.5 5 9l4.5-6"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export const boxClass =
	"mt-0.5 inline-flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[3px] border border-[var(--ed-line-2)] bg-background text-background shadow-[2px_2px_0_var(--ed-shadow)] transition-colors data-checked:border-foreground data-checked:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export const indicatorClass =
	"inline-flex transition-[opacity,scale] duration-150 data-ending-style:scale-50 data-ending-style:opacity-0 data-starting-style:scale-50 data-starting-style:opacity-0";

export function NextSteps({ steps }: { steps: string[] }) {
	const [done, setDone] = useState<boolean[]>(() => steps.map(() => false));
	const count = done.filter(Boolean).length;

	return (
		<div className="ed flex flex-col gap-4">
			<Progress
				value={count}
				max={steps.length}
				getValueLabel={(value) => `${value ?? 0} of ${steps.length} done`}
				className="grid grid-cols-[1fr_auto] items-baseline gap-y-2"
			>
				<ProgressLabel className="ed-label">Your progress</ProgressLabel>
				<ProgressValue className="font-mono text-[12px] text-foreground-2 tabular-nums">
					{`${count} / ${steps.length}`}
				</ProgressValue>
				<ProgressTrack className="col-span-2 h-1.5 overflow-hidden rounded-full bg-foreground/8">
					<ProgressIndicator className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
				</ProgressTrack>
			</Progress>
			<ul className="flex flex-col">
				{steps.map((step, i) => (
					<li
						key={step}
						className="border-t border-[var(--ed-line)] last:border-b"
					>
						{/* biome-ignore lint/a11y/noLabelWithoutControl: ui-sdk Checkbox is the control, wrapped in its label as its docs show */}
						<label className="flex cursor-pointer items-start gap-3 py-3 text-[14.5px] leading-snug">
							<Checkbox
								checked={done[i]}
								onCheckedChange={(checked) =>
									setDone((prev) =>
										prev.map((v, j) => (j === i ? checked === true : v)),
									)
								}
								className={boxClass}
							>
								<CheckboxIndicator className={indicatorClass}>
									<CheckMark />
								</CheckboxIndicator>
							</Checkbox>
							<span
								className={`transition-colors ${done[i] ? "text-foreground-3 line-through decoration-foreground-3" : "text-foreground"}`}
							>
								{step}
							</span>
						</label>
					</li>
				))}
			</ul>
		</div>
	);
}
