import { StickerBoard } from "./sticker-board/sticker-board";

export function MakeablesSheet() {
	return (
		<div className="overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0e] text-[#f4f1ea]">
			<div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 font-mono text-[11px] tracking-wider">
				<span className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-white/20" />
					<span className="size-2 rounded-full bg-white/20" />
					<span className="size-2 rounded-full bg-white/20" />
				</span>
				<span className="text-white/60">
					sticker board <span className="text-white/30">· makeables</span>
				</span>
				<span className="text-[#d7ff3c]">peel me</span>
			</div>
			<div className="p-3 sm:p-5">
				<div className="overflow-hidden rounded-lg">
					<StickerBoard />
				</div>
			</div>
			<div className="flex items-center justify-end border-t border-white/10 px-4 py-3">
				<a
					href="https://makeables.dev"
					target="_blank"
					rel="noopener noreferrer"
					className="rounded-full bg-[#d7ff3c] px-4 py-1.5 text-xs font-medium text-[#0f0f0e] transition-transform hover:-translate-y-0.5"
				>
					Make your own
				</a>
			</div>
		</div>
	);
}
