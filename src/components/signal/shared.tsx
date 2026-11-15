import { TooltipContent } from "@ui-sdk/react/tooltip";
import type { ReactNode } from "react";

export const tipClass =
	"z-50 origin-(--transform-origin) rounded-[4px] bg-foreground px-2.5 py-1.5 text-[12.5px] leading-snug text-background shadow-[3px_3px_0_var(--ed-shadow-2)] transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-instant:transition-none data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-opacity motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100";

export function Tip<T>({ children }: { children: (payload: T) => ReactNode }) {
	return (
		<TooltipContent<T>
			side="top"
			sideOffset={6}
			collisionPadding={12}
			className={tipClass}
		>
			{(state) =>
				state.payload === undefined ? null : children(state.payload as T)
			}
		</TooltipContent>
	);
}

/** 0 for empty, 1-4 by quartile thresholds. */
export const levelOf = (count: number, t: number[]) =>
	count <= 0
		? 0
		: count <= t[0]
			? 1
			: count <= t[1]
				? 2
				: count <= t[2]
					? 3
					: 4;

/** GitHub avatar at an exact pixel size; pass 2x the rendered size. */
export const avatarAt = (url: string, size: number) =>
	/[?&]s=\d+/.test(url)
		? url.replace(/([?&])s=\d+/, `$1s=${size}`)
		: `${url}${url.includes("?") ? "&" : "?"}s=${size}`;

export const fmt = (n: number) => n.toLocaleString("en-US");

export const dayLabel = (date: string, opts: Intl.DateTimeFormatOptions = {}) =>
	new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
		...opts,
	});

export function Avatar({
	src,
	size,
	round,
	alt,
	className = "",
}: {
	src: string;
	size: number;
	round?: boolean;
	alt: string;
	className?: string;
}) {
	return (
		<img
			src={src}
			alt={alt}
			width={size}
			height={size}
			loading="lazy"
			decoding="async"
			className={`shrink-0 bg-[var(--ed-wash)] object-cover ring-1 ring-[var(--ed-line-2)] ${round ? "rounded-full" : "rounded-[4px]"} ${className}`}
			style={{ width: size, height: size }}
		/>
	);
}

export function Legend({ label }: { label?: string }) {
	return (
		<span className="flex items-center gap-1.5">
			{label && <span className="ed-label mr-1">{label}</span>}
			<span className="ed-label">Less</span>
			{[0, 1, 2, 3, 4].map((l) => (
				<span key={l} data-l={l} className="sg-cell size-[9px]" />
			))}
			<span className="ed-label">More</span>
		</span>
	);
}
