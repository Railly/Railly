import {
	type PointerEvent as ReactPointerEvent,
	useRef,
	useState,
} from "react";

type Finish = "holo" | "glitter" | "matte";

interface Sticker {
	id: string;
	src: string;
	label: string;
	x: number; // % of the sheet
	y: number;
	w: number; // % of the sheet width
	r: number; // degrees
	pixel?: boolean;
}

const START: Sticker[] = [
	{
		id: "crafter",
		src: "/images/makeables/crafter.webp",
		label: "Crafter Station",
		x: 50,
		y: 50,
		w: 30,
		r: -4,
	},
	{
		id: "boba",
		src: "/images/makeables/boba.webp",
		label: "Boba",
		x: 15,
		y: 30,
		w: 13,
		r: -10,
		pixel: true,
	},
	{
		id: "capy",
		src: "/images/makeables/cache-capy.webp",
		label: "Cache Capy",
		x: 82,
		y: 28,
		w: 15,
		r: 8,
		pixel: true,
	},
	{
		id: "cuy",
		src: "/images/makeables/cash-cuy.webp",
		label: "Cash Cuy",
		x: 20,
		y: 74,
		w: 15,
		r: 6,
		pixel: true,
	},
	{
		id: "cosmo",
		src: "/images/makeables/cosmo.webp",
		label: "Cosmo",
		x: 84,
		y: 73,
		w: 13,
		r: -7,
		pixel: true,
	},
	{
		id: "panda",
		src: "/images/makeables/pixel-panda.webp",
		label: "Pixel Panda",
		x: 37,
		y: 20,
		w: 12,
		r: 12,
		pixel: true,
	},
	{
		id: "penguin",
		src: "/images/makeables/prompt-penguin.webp",
		label: "Prompt Penguin",
		x: 64,
		y: 82,
		w: 11,
		r: -12,
		pixel: true,
	},
];

const FINISHES: { id: Finish; label: string }[] = [
	{ id: "holo", label: "Holo" },
	{ id: "glitter", label: "Glitter" },
	{ id: "matte", label: "Matte" },
];

const OUTLINE =
	"drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff)";

export function MakeablesSheet() {
	const [stickers, setStickers] = useState(START);
	const [order, setOrder] = useState(START.map((s) => s.id));
	const [finish, setFinish] = useState<Finish>("holo");
	const sheetRef = useRef<HTMLDivElement>(null);
	const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

	function toPercent(e: ReactPointerEvent) {
		const rect = sheetRef.current?.getBoundingClientRect();
		if (!rect) return { x: 0, y: 0 };
		return {
			x: ((e.clientX - rect.left) / rect.width) * 100,
			y: ((e.clientY - rect.top) / rect.height) * 100,
		};
	}

	function onDown(e: ReactPointerEvent<HTMLButtonElement>, s: Sticker) {
		e.currentTarget.setPointerCapture(e.pointerId);
		const p = toPercent(e);
		drag.current = { id: s.id, dx: p.x - s.x, dy: p.y - s.y };
		setOrder((o) => [...o.filter((id) => id !== s.id), s.id]);
	}

	function onMove(e: ReactPointerEvent<HTMLButtonElement>) {
		const el = e.currentTarget;
		const rect = el.getBoundingClientRect();
		const px = (e.clientX - rect.left) / rect.width;
		const py = (e.clientY - rect.top) / rect.height;
		el.style.setProperty("--px", px.toFixed(3));
		el.style.setProperty("--py", py.toFixed(3));
		el.style.setProperty("--tilt-x", `${((0.5 - py) * 18).toFixed(2)}deg`);
		el.style.setProperty("--tilt-y", `${((px - 0.5) * 18).toFixed(2)}deg`);

		const d = drag.current;
		if (!d) return;
		const p = toPercent(e);
		const x = Math.min(96, Math.max(4, p.x - d.dx));
		const y = Math.min(94, Math.max(6, p.y - d.dy));
		setStickers((all) => all.map((s) => (s.id === d.id ? { ...s, x, y } : s)));
	}

	function onLeave(e: ReactPointerEvent<HTMLButtonElement>) {
		const el = e.currentTarget;
		el.style.setProperty("--tilt-x", "0deg");
		el.style.setProperty("--tilt-y", "0deg");
	}

	return (
		<div className="mk-root overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0e] text-[#f4f1ea]">
			<div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 font-mono text-[11px] tracking-wider">
				<span className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-white/20" />
					<span className="size-2 rounded-full bg-white/20" />
					<span className="size-2 rounded-full bg-white/20" />
				</span>
				<span className="text-white/60">
					railly-sheet <span className="text-white/30">· A5 · kiss-cut</span>
				</span>
				<span className="text-[#d7ff3c]">drag me</span>
			</div>

			<div className="p-3 sm:p-5">
				<div
					ref={sheetRef}
					className="mk-sheet relative aspect-[4/3] w-full touch-none select-none rounded-lg bg-[#f1ece2] sm:aspect-[16/9]"
				>
					{stickers.map((s) => (
						<button
							key={s.id}
							type="button"
							aria-label={`${s.label} sticker`}
							data-finish={finish}
							className="mk-sticker absolute cursor-grab active:cursor-grabbing"
							style={{
								left: `${s.x}%`,
								top: `${s.y}%`,
								width: `${s.w}%`,
								zIndex: order.indexOf(s.id) + 1,
								transform: `translate(-50%, -50%) rotate(${s.r}deg)`,
								["--mask" as string]: `url(${s.src})`,
							}}
							onPointerDown={(e) => onDown(e, s)}
							onPointerMove={onMove}
							onPointerUp={() => {
								drag.current = null;
							}}
							onPointerLeave={onLeave}
						>
							<span className="mk-tilt block">
								<img
									src={s.src}
									alt=""
									draggable={false}
									className="block w-full"
									style={{
										filter: `${OUTLINE} drop-shadow(0 6px 6px rgba(0,0,0,.28))`,
										imageRendering: s.pixel ? "pixelated" : undefined,
									}}
								/>
								<span aria-hidden className="mk-finish" />
							</span>
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
				<div className="flex items-center gap-2">
					<span className="font-mono text-[11px] tracking-wider text-white/40">
						FINISH
					</span>
					{FINISHES.map((f) => (
						<button
							key={f.id}
							type="button"
							onClick={() => setFinish(f.id)}
							aria-pressed={finish === f.id}
							className={`rounded-full border px-3 py-1 !text-xs leading-none transition-colors ${
								finish === f.id
									? "border-[#d7ff3c] text-[#d7ff3c]"
									: "border-white/15 text-white/60 hover:text-white"
							}`}
						>
							{f.label}
						</button>
					))}
				</div>
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
