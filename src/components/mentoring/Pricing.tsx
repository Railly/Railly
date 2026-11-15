import {
	Dialog,
	DialogBackdrop,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@ui-sdk/react/dialog";
import {
	SegmentedControl,
	SegmentedControlIndicator,
	SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-sdk/react/tooltip";
import { useState } from "react";

export type Tier = {
	name: string;
	price: string;
	regionalPrice: string | null;
	ppp: string | null;
	cadence: string;
	description: string;
	includes: string[];
	cta: string;
	href: string;
	featured: boolean;
};

type Region = "global" | "regional";

const steps = [
	"You pay through a Stripe checkout page.",
	"You get the prep form. I read it before we talk.",
	"We meet, 1:1, in Spanish or English.",
	"The report and full transcript land in your inbox.",
	"On day 30 I check in on your next steps.",
];

function priceFor(tier: Tier, region: Region) {
	return region === "regional" && tier.regionalPrice
		? tier.regionalPrice
		: tier.price;
}

function Price({ tier, region }: { tier: Tier; region: Region }) {
	const discounted = region === "regional" && tier.regionalPrice;
	return (
		<span className="flex shrink-0 items-baseline gap-2">
			{discounted ? (
				<s className="ed-rise font-mono text-[13px] text-foreground-3">
					<span className="sr-only">was </span>
					{tier.price}
				</s>
			) : null}
			<span
				key={`${tier.name}-${region}`}
				className="ed-rise font-mono text-[26px] leading-none font-medium tracking-[-0.03em] text-foreground tabular-nums sm:text-[30px]"
			>
				{priceFor(tier, region)}
			</span>
		</span>
	);
}

function Checkout({ tier, region }: { tier: Tier; region: Region }) {
	return (
		<Dialog>
			<DialogTrigger
				className={`ed-btn ${tier.featured ? "ed-btn-ink" : ""}`}
				aria-label={`${tier.cta}: ${tier.name}`}
			>
				{tier.cta}
				<span aria-hidden="true">&rarr;</span>
			</DialogTrigger>
			<DialogBackdrop className="fixed inset-0 z-50 bg-[#1b1915]/35 backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-black/60" />
			<DialogContent className="ed fixed inset-0 z-50 m-auto flex h-fit max-h-[calc(100dvh-32px)] w-[min(30rem,calc(100vw-32px))] flex-col gap-5 overflow-y-auto rounded-[4px] border border-[var(--ed-line-2)] bg-background p-5 text-foreground shadow-[5px_5px_0_var(--ed-shadow-2)] transition-[opacity,translate,scale] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:translate-y-3 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:translate-y-3 data-starting-style:scale-[0.98] data-starting-style:opacity-0 sm:p-6">
				<div className="flex flex-col gap-1.5">
					<span className="ed-label">Checkout preview</span>
					<DialogTitle className="font-serif text-[26px] leading-tight font-normal">
						{tier.name}
					</DialogTitle>
					<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<span className="font-mono text-[22px] font-medium tracking-[-0.02em] tabular-nums">
							{priceFor(tier, region)}
						</span>
						<span className="ed-label">
							{tier.cadence}
							{region === "regional" && tier.regionalPrice
								? " · LATAM & Africa"
								: ""}
						</span>
					</div>
					<DialogDescription className="text-[14px] leading-relaxed text-foreground-2">
						{tier.description}
					</DialogDescription>
				</div>

				<div className="flex flex-col gap-2.5">
					<span className="ed-label">What happens next</span>
					<ol className="flex flex-col">
						{steps.map((step, i) => (
							<li
								key={step}
								className="grid grid-cols-[1.75rem_1fr] items-baseline border-t border-[var(--ed-line)] py-2 text-[14px] leading-snug text-foreground-2"
							>
								<span className="font-mono text-[11px] text-foreground-3">
									{String(i + 1).padStart(2, "0")}
								</span>
								{step}
							</li>
						))}
					</ol>
				</div>

				<p className="ed-art px-3.5 py-3 text-[13px] leading-relaxed text-foreground-2">
					<span className="font-medium text-foreground">
						Stripe checkout is coming.
					</span>{" "}
					This is a preview, nothing is charged. Until it ships, write to me to
					book.
				</p>

				<div className="flex flex-wrap items-center gap-3">
					<a href="/contact" className="ed-btn ed-btn-ink">
						Write to me to book
					</a>
					<DialogClose className="ed-btn">Close</DialogClose>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function Pricing({ tiers }: { tiers: Tier[] }) {
	const [region, setRegion] = useState<Region>("global");

	return (
		<div className="ed flex flex-col gap-6">
			<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
				<SegmentedControl
					aria-label="Pricing region"
					value={region}
					onValueChange={(next) => {
						if (next === "global" || next === "regional") setRegion(next);
					}}
					className="relative isolate inline-flex rounded-[4px] border border-[var(--ed-line)] bg-[var(--ed-wash)] p-[3px]"
				>
					<SegmentedControlIndicator className="absolute top-(--segmented-control-indicator-top) left-(--segmented-control-indicator-left) -z-10 h-(--segmented-control-indicator-height) w-(--segmented-control-indicator-width) rounded-[3px] border border-[var(--ed-line-2)] bg-background shadow-[2px_2px_0_var(--ed-shadow-2)] transition-[left,width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]" />
					{(
						[
							["global", "Global"],
							["regional", "LATAM & Africa"],
						] as const
					).map(([value, label]) => (
						<SegmentedControlItem
							key={value}
							value={value}
							className="cursor-pointer rounded-[3px] px-3 py-1.5 font-mono text-[12px] text-foreground-3 transition-colors data-checked:text-foreground hover:text-foreground"
						>
							{label}
						</SegmentedControlItem>
					))}
				</SegmentedControl>
				<Tooltip toggleable delay={150}>
					<TooltipTrigger
						aria-label="About regional pricing"
						className="inline-flex size-6 cursor-help items-center justify-center rounded-full border border-[var(--ed-line-2)] font-serif text-[13px] italic text-foreground-2 hover:border-foreground hover:text-foreground"
					>
						i
					</TooltipTrigger>
					<TooltipContent
						side="top"
						sideOffset={8}
						collisionPadding={16}
						className="z-50 max-w-[16rem] origin-(--transform-origin) rounded-[4px] bg-foreground px-3 py-2 text-[12.5px] leading-snug text-background shadow-[3px_3px_0_var(--ed-shadow-2)] transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
					>
						Lower prices for developers in Latin America and Africa. Regional
						pricing applies automatically at checkout.
					</TooltipContent>
				</Tooltip>
				<span className="ed-label">
					{region === "regional"
						? "Showing LATAM & Africa prices"
						: "Prices in USD"}
				</span>
			</div>

			<ol className="flex flex-col">
				{tiers.map((tier, i) => (
					<li
						key={tier.name}
						className={`relative flex flex-col gap-3 py-6 ${
							tier.featured
								? "ed-tile my-2 bg-[var(--ed-wash)] px-4 sm:px-5 [&+li]:border-t-0"
								: "border-t border-[var(--ed-line)]"
						}`}
					>
						<div className="flex items-center gap-3">
							<span className="ed-label">{String(i + 1).padStart(2, "0")}</span>
							{tier.featured ? (
								<span className="ed-label rounded-[3px] border border-[var(--ed-line-2)] px-1.5 py-px text-foreground-2">
									Recommended
								</span>
							) : null}
						</div>
						<div className="flex items-end gap-3">
							<h3 className="font-serif text-[23px] leading-tight font-normal tracking-[-0.01em] sm:text-[26px]">
								{tier.name}
							</h3>
							<span aria-hidden="true" className="ed-leader" />
							<Price tier={tier} region={region} />
						</div>
						<span className="ed-label -mt-1.5">{tier.cadence}</span>
						<p className="max-w-[34rem] text-[14.5px] leading-relaxed text-foreground-2">
							{tier.description}
						</p>
						<ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13.5px] text-foreground-2 sm:grid-cols-2">
							{tier.includes.map((item) => (
								<li key={item} className="flex gap-2">
									<span aria-hidden="true" className="text-foreground-3">
										&rarr;
									</span>
									{item}
								</li>
							))}
						</ul>
						<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
							{tier.href.startsWith("#") ? (
								<Checkout tier={tier} region={region} />
							) : (
								<a
									href={tier.href}
									className={`ed-btn ${tier.featured ? "ed-btn-ink" : ""}`}
								>
									{tier.cta}
									<span aria-hidden="true">&rarr;</span>
								</a>
							)}
							{tier.ppp && region === "global" ? (
								<span className="ed-label">{tier.ppp}</span>
							) : null}
						</div>
					</li>
				))}
			</ol>
			<p className="ed-label">
				Payments through Stripe. Regional pricing applies automatically at
				checkout.
			</p>
		</div>
	);
}
