import {
	Accordion,
	AccordionHeader,
	AccordionItem,
	AccordionPanel,
	AccordionTrigger,
} from "@ui-sdk/react/accordion";

export type Question = { q: string; a: string };

export function Faq({ questions }: { questions: Question[] }) {
	return (
		<Accordion className="ed flex flex-col border-b border-[var(--ed-line)]">
			{questions.map((item) => (
				<AccordionItem
					key={item.q}
					value={item.q}
					className="border-t border-[var(--ed-line)]"
				>
					<AccordionHeader>
						<AccordionTrigger className="group flex w-full cursor-pointer items-baseline justify-between gap-4 py-3.5 text-left text-[15px] font-medium text-foreground">
							{item.q}
							<span
								aria-hidden="true"
								className="relative size-3 shrink-0 self-center text-foreground-3 group-hover:text-foreground"
							>
								<span className="absolute top-1/2 left-0 h-px w-3 bg-current" />
								<span className="absolute top-0 left-1/2 h-3 w-px bg-current transition-transform duration-200 group-data-open:scale-y-0" />
							</span>
						</AccordionTrigger>
					</AccordionHeader>
					<AccordionPanel className="h-(--accordion-panel-height) overflow-hidden transition-[height,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:h-0 data-ending-style:opacity-0 data-starting-style:h-0 data-starting-style:opacity-0">
						<p className="max-w-[34rem] pb-4 text-[14.5px] leading-relaxed text-foreground-2">
							{item.a}
						</p>
					</AccordionPanel>
				</AccordionItem>
			))}
		</Accordion>
	);
}
