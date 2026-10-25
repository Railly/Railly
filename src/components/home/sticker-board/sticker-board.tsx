import {
	type KeyboardEvent,
	type PointerEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { flushSync } from "react-dom";
import { createApplySound, readMutedPreference } from "./sound";
import { makeBacking } from "./sticker-back";
import {
	cornerAnchor,
	nearEdge,
	SIZE,
	solid,
	toLocal,
} from "./sticker-geometry";
import { type Fold, paintSticker } from "./sticker-peel";

type StickerStyleId = string;
type PreparedSticker = { width: number; height: number };

/** Artwork for the board: transparent images, each given a white die-cut border on load. */
const STICKERS = [
	{ id: "boba", src: "/images/makeables/boba.webp", scale: 0.7, pixel: true },
	{
		id: "cache-capy",
		src: "/images/makeables/cache-capy.webp",
		scale: 0.72,
		pixel: true,
	},
	{
		id: "cash-cuy",
		src: "/images/makeables/cash-cuy.webp",
		scale: 0.72,
		pixel: true,
	},
	{ id: "cosmo", src: "/images/makeables/cosmo.webp", scale: 0.7, pixel: true },
	{
		id: "pixel-panda",
		src: "/images/makeables/pixel-panda.webp",
		scale: 0.7,
		pixel: true,
	},
	{
		id: "prompt-penguin",
		src: "/images/makeables/prompt-penguin.webp",
		scale: 0.68,
		pixel: true,
	},
	{ id: "crafter", src: "/images/makeables/crafter.webp", scale: 0.84 },
];
const FACE = 1024;
const BORDER = 26;

function loadImage(src: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Could not load ${src}`));
		image.src = src;
	});
}

/** Draws the artwork centred on a square face with a white die-cut border around its silhouette. */
async function prepareSticker(entry: (typeof STICKERS)[number]) {
	const image = await loadImage(entry.src);
	const fitScale = (FACE * entry.scale) / Math.max(image.width, image.height);
	const w = image.width * fitScale;
	const h = image.height * fitScale;
	const x = (FACE - w) / 2;
	const y = (FACE - h) / 2;
	const art = document.createElement("canvas");
	art.width = art.height = FACE;
	const a = art.getContext("2d");
	if (!a) throw new Error("Canvas is unavailable.");
	a.imageSmoothingEnabled = !entry.pixel;
	a.drawImage(image, x, y, w, h);
	const cut = document.createElement("canvas");
	cut.width = cut.height = FACE;
	const c = cut.getContext("2d");
	if (!c) throw new Error("Canvas is unavailable.");
	for (let angle = 0; angle < 360; angle += 10) {
		const r = (angle * Math.PI) / 180;
		c.drawImage(art, Math.cos(r) * BORDER, Math.sin(r) * BORDER);
	}
	c.globalCompositeOperation = "source-in";
	c.fillStyle = "#fff";
	c.fillRect(0, 0, FACE, FACE);
	c.globalCompositeOperation = "source-over";
	c.drawImage(art, 0, 0);
	return {
		width: FACE,
		height: FACE,
		draw(context: CanvasRenderingContext2D) {
			context.drawImage(cut, 0, 0);
		},
	};
}
const FRICTION = 0.92;
const NUDGE = 12;
const MAX_THROW = 22;
/** Fraction of the artwork a fold can travel: far enough to peel the whole sticker off and carry it. */
const MAX_PULL = 2;
/** Pull, in sticker widths, at which the sheet is fully off and becomes a sticker you carry. */
const DETACH = 1.6;
const FLIP_MS = 320;
const EASE = 0.2;
/** Scale of a sticker held in the hand. */
const LIFT = 1.07;
/** Painting resolution; the board shows stickers at 200px, so half the 1024 master is plenty. */
const PAINT = 512;
/** Spare canvas around each sticker, so a lifted flap and its shadow are never clipped to a square. */
const MARGIN = 128;
/** While a sticker is being peeled its canvas grows, so the lifted sheet can be carried anywhere around it. */
const PEEL_MARGIN = 1024;

function fit(canvas: HTMLCanvasElement, margin: number) {
	if (canvas.dataset.margin === String(margin)) return;
	const pct = (margin / PAINT) * 100;
	canvas.dataset.margin = String(margin);
	canvas.width = canvas.height = PAINT + margin * 2;
	canvas.style.inset = `-${pct}%`;
	canvas.style.width = canvas.style.height = `${100 + pct * 2}%`;
}

type Item = {
	id: StickerStyleId;
	sticker: PreparedSticker;
	face: HTMLCanvasElement;
	back: HTMLCanvasElement;
	/** Half-size copies the fold is painted from, so dragging stays smooth. */
	small: { face: HTMLCanvasElement; back: HTMLCanvasElement };
	alpha: Uint8ClampedArray;
	x: number;
	y: number;
	rotation: number;
	z: number;
};
type Grab = {
	id: StickerStyleId;
	mode: "move" | "peel";
	dx: number;
	dy: number;
	lastX: number;
	lastY: number;
	vx: number;
	vy: number;
};
type Peel = {
	id: StickerStyleId;
	ax: number;
	ay: number;
	px: number;
	py: number;
	held: boolean;
	/** Keyboard peel: the fold rests at (tx, ty) until toggled off. */
	rest?: { x: number; y: number };
};

/** Hand-placed spots, as fractions of the board, so the sheet reads as a composed layout. */
const SPOTS = [
	{ x: 0.14, y: 0.3, rotation: -10 },
	{ x: 0.86, y: 0.26, rotation: 8 },
	{ x: 0.2, y: 0.74, rotation: 6 },
	{ x: 0.82, y: 0.72, rotation: -7 },
	{ x: 0.36, y: 0.3, rotation: 12 },
	{ x: 0.64, y: 0.8, rotation: -12 },
	{ x: 0.5, y: 0.5, rotation: -4 },
];

function scatter(index: number, width: number, height: number) {
	const spot = SPOTS[index % SPOTS.length];
	return {
		x: width * spot.x - SIZE / 2,
		y: height * spot.y - SIZE / 2,
		rotation: spot.rotation,
	};
}

function shrink(source: HTMLCanvasElement) {
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = PAINT;
	canvas.getContext("2d")?.drawImage(source, 0, 0, PAINT, PAINT);
	return canvas;
}

export function StickerBoard() {
	const board = useRef<HTMLDivElement>(null);
	const [items, setItems] = useState<Item[]>([]);
	const [lifted, setLifted] = useState<StickerStyleId | null>(null);
	const [failed, setFailed] = useState(false);
	const grab = useRef<Grab | null>(null);
	const frame = useRef(0);
	const settle = useRef(0);
	const swung = useRef(0);
	const flipping = useRef<{
		id: StickerStyleId;
		fold: Fold;
		start: number;
	} | null>(null);
	const turned = useRef(0);
	const top = useRef(1);
	const sound = useRef<ReturnType<typeof createApplySound> | null>(null);
	const reduced = useRef(true);
	const canvases = useRef(new Map<StickerStyleId, HTMLCanvasElement>());
	const peel = useRef<Peel | null>(null);
	const loaded = useRef(new Map<StickerStyleId, Item>());
	const refs = useRef(
		new Map<StickerStyleId, (canvas: HTMLCanvasElement | null) => void>(),
	);

	useEffect(() => {
		const media = matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => {
			reduced.current = media.matches;
		};
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);

	useEffect(() => {
		let cancelled = false;
		const rect = board.current?.getBoundingClientRect();
		const width = rect?.width ?? 960;
		const height = rect?.height ?? 640;
		(async () => {
			try {
				const all: Item[] = [];
				for (const [index, entry] of STICKERS.entries()) {
					const id = entry.id;
					const sticker = await prepareSticker(entry);
					if (cancelled) return;
					const face = document.createElement("canvas");
					face.width = sticker.width;
					face.height = sticker.height;
					const context = face.getContext("2d", { willReadFrequently: true });
					if (!context) throw new Error("Canvas is unavailable.");
					sticker.draw(context);
					const alpha = context.getImageData(
						0,
						0,
						face.width,
						face.height,
					).data;
					const back = makeBacking(face);
					const item = {
						id,
						sticker,
						face,
						back,
						small: { face: shrink(face), back: shrink(back) },
						alpha,
						z: index,
						...scatter(index, width, height),
					};
					loaded.current.set(id, item);
					all.push(item);
					setItems([...all]);
				}
				top.current = all.length;
			} catch (error) {
				console.error("sticker board", error);
				if (!cancelled) setFailed(true);
			}
		})();
		return () => {
			cancelled = true;
			cancelAnimationFrame(frame.current);
			cancelAnimationFrame(settle.current);
			cancelAnimationFrame(swung.current);
			cancelAnimationFrame(turned.current);
			sound.current?.dispose();
		};
	}, []);

	/** One stable ref per sticker, so a re-render never resizes and repaints a canvas mid-peel. */
	function canvasRef(id: StickerStyleId) {
		let ref = refs.current.get(id);
		if (!ref) {
			ref = (canvas: HTMLCanvasElement | null) => {
				if (!canvas) return void canvases.current.delete(id);
				canvases.current.set(id, canvas);
				fit(canvas, MARGIN);
				paint(id);
			};
			refs.current.set(id, ref);
		}
		return ref;
	}
	function paint(id: StickerStyleId) {
		const item = loaded.current.get(id);
		const canvas = canvases.current.get(id);
		if (!item || !canvas) return;
		const state = peel.current?.id === id ? peel.current : null;
		const k = PAINT / item.face.width;
		const turn = flipping.current?.id === id ? flipping.current : null;
		fit(canvas, state || turn ? PEEL_MARGIN : MARGIN);
		const at = turn ? turn.fold : state;
		const progress = turn
			? Math.min(1, (performance.now() - turn.start) / FLIP_MS)
			: undefined;
		paintSticker(
			canvas,
			item.small.face,
			item.small.back,
			at
				? { ax: at.ax * k, ay: at.ay * k, px: at.px * k, py: at.py * k }
				: null,
			progress === undefined
				? undefined
				: progress * progress * (3 - 2 * progress),
		);
	}
	/** Eases a released fold back onto its anchor, so the sticker lays itself down. */
	function lay() {
		cancelAnimationFrame(settle.current);
		const step = () => {
			const state = peel.current;
			if (!state || state.held) return;
			const goal = state.rest ?? { x: state.ax, y: state.ay };
			state.px += (goal.x - state.px) * EASE;
			state.py += (goal.y - state.py) * EASE;
			if (
				reduced.current ||
				Math.hypot(goal.x - state.px, goal.y - state.py) < 2
			) {
				if (state.rest) {
					state.px = goal.x;
					state.py = goal.y;
				} else peel.current = null;
				paint(state.id);
				return;
			}
			paint(state.id);
			settle.current = requestAnimationFrame(step);
		};
		settle.current = requestAnimationFrame(step);
	}

	function clamp(value: number, axis: "x" | "y") {
		const rect = board.current?.getBoundingClientRect();
		const limit = (axis === "x" ? rect?.width : rect?.height) ?? 960;
		return Math.min(Math.max(value, -SIZE * 0.25), limit - SIZE * 0.75);
	}
	function move(id: StickerStyleId, patch: (item: Item) => Partial<Item>) {
		setItems((all) =>
			all.map((item) => (item.id === id ? { ...item, ...patch(item) } : item)),
		);
	}
	function playDrop() {
		if (readMutedPreference()) return;
		sound.current ??= createApplySound();
		sound.current.play();
	}
	function coast(id: StickerStyleId, vx: number, vy: number) {
		cancelAnimationFrame(frame.current);
		if (reduced.current) return;
		const step = () => {
			vx *= FRICTION;
			vy *= FRICTION;
			move(id, (item) => ({
				x: clamp(item.x + vx, "x"),
				y: clamp(item.y + vy, "y"),
			}));
			if (Math.hypot(vx, vy) > 0.4) frame.current = requestAnimationFrame(step);
		};
		frame.current = requestAnimationFrame(step);
	}
	/** The topmost sticker whose actual artwork is under the pointer. */
	function pick(event: PointerEvent<HTMLElement>) {
		const origin = board.current?.getBoundingClientRect();
		if (!origin) return null;
		for (const item of [...items].sort((a, b) => b.z - a.z)) {
			const scale = lifted === item.id ? LIFT : 1;
			const { u, v } = toLocal(
				item,
				origin,
				event.clientX,
				event.clientY,
				scale,
			);
			if (solid(item, u, v)) return { item, u, v };
		}
		return null;
	}
	/**
	 * A sticker held by a point hangs from it: the body trails the pointer and swings about
	 * the grab point, then settles upright once let go.
	 */
	function swing(id: StickerStyleId) {
		cancelAnimationFrame(swung.current);
		if (reduced.current) return;
		let base: number | null = null;
		const step = () => {
			const held =
				grab.current?.id === id && grab.current.mode === "move"
					? grab.current
					: null;
			let target = 0;
			if (held) {
				// The centre sits at (rx, ry) from the grab point; it lags the motion, which turns the sheet.
				const rx = SIZE / 2 - held.dx;
				const ry = SIZE / 2 - held.dy;
				const arm = Math.max(40, Math.hypot(rx, ry));
				target = Math.max(
					-38,
					Math.min(38, ((ry * held.vx - rx * held.vy) / arm) * 2.4),
				);
				held.vx *= 0.86;
				held.vy *= 0.86;
			}
			let done = false;
			move(id, (item) => {
				base ??= item.rotation;
				const next =
					item.rotation +
					(base + target - item.rotation) * (held ? 0.22 : 0.14);
				done = !held && Math.abs(next - base) < 0.4;
				return { rotation: done ? base : next };
			});
			if (held || !done) swung.current = requestAnimationFrame(step);
		};
		swung.current = requestAnimationFrame(step);
	}
	/** Plays the sheet turning over, then lets the sticker lie flat in the hand. */
	function turnOver(id: StickerStyleId) {
		cancelAnimationFrame(turned.current);
		const step = () => {
			paint(id);
			const turn = flipping.current;
			if (!turn || performance.now() - turn.start >= FLIP_MS) {
				flipping.current = null;
				paint(id);
				return;
			}
			turned.current = requestAnimationFrame(step);
		};
		if (reduced.current) {
			flipping.current = null;
			paint(id);
			return;
		}
		step();
	}
	function down(
		event: PointerEvent<HTMLElement>,
		item: Item,
		u: number,
		v: number,
	) {
		cancelAnimationFrame(frame.current);
		event.currentTarget.setPointerCapture(event.pointerId);
		if (board.current) board.current.style.cursor = "grabbing";
		const origin = board.current?.getBoundingClientRect();
		top.current += 1;
		const z = top.current;
		move(item.id, () => ({ z }));
		const peeling = nearEdge(item, u, v);
		if (peeling) {
			const { width, height } = item.sticker;
			const old = peel.current;
			// Pressing a corner already lifts it a little, before the pointer moves.
			const inwardX = width / 2 - u * width;
			const inwardY = height / 2 - v * height;
			const inward = Math.hypot(inwardX, inwardY) || 1;
			const lift = width * 0.035;
			peel.current = {
				id: item.id,
				ax: u * width,
				ay: v * height,
				px: u * width + (inwardX / inward) * lift,
				py: v * height + (inwardY / inward) * lift,
				held: true,
			};
			paint(item.id);
			cancelAnimationFrame(settle.current);
			if (old && old.id !== item.id) paint(old.id);
		} else {
			setLifted(item.id);
			swing(item.id);
		}
		grab.current = {
			id: item.id,
			mode: peeling ? "peel" : "move",
			dx: event.clientX - (origin?.left ?? 0) - item.x,
			dy: event.clientY - (origin?.top ?? 0) - item.y,
			lastX: event.clientX,
			lastY: event.clientY,
			vx: 0,
			vy: 0,
		};
	}
	function drag(event: PointerEvent<HTMLElement>) {
		const held = grab.current;
		if (!held) return;
		if (held.mode === "peel") {
			const state = peel.current;
			const item = items.find((candidate) => candidate.id === held.id);
			const origin = board.current?.getBoundingClientRect();
			if (!state || !item || !origin) return;
			const { width, height } = item.sticker;
			const { u, v } = toLocal(item, origin, event.clientX, event.clientY);
			const dx = u * width - state.ax;
			const dy = v * height - state.ay;
			const reach = Math.hypot(dx, dy);
			// Pulling away from the sticker peels nothing: it just drags the sticker along.
			const centreX = width / 2 - state.ax;
			const centreY = height / 2 - state.ay;
			const inward =
				(dx * centreX + dy * centreY) / (Math.hypot(centreX, centreY) || 1);
			// A sheet already folded back comes off as soon as the pull turns away; a pressed corner
			// has a little slack first.
			const folded =
				Math.hypot(state.px - state.ax, state.py - state.ay) >= width * 0.05;
			const outward = inward < (folded ? 0 : -width * 0.05);
			// A fold only follows a pull towards the sticker; anything else would fold its whole body.
			if (inward > 0) {
				const scale = reach > width * MAX_PULL ? (width * MAX_PULL) / reach : 1;
				state.px = state.ax + dx * scale;
				state.py = state.ay + dy * scale;
			}
			if (reach > width * DETACH || outward) {
				// The sheet has come clean off: turn it over, face up, and carry it by the same point.
				const base = origin;
				peel.current = null;
				if (!folded && reach <= width * DETACH) paint(state.id);
				else {
					// A sheet lifted past the press turns over, so the carried face never jumps sides.
					flipping.current = {
						id: state.id,
						fold: { ax: state.ax, ay: state.ay, px: state.px, py: state.py },
						start: performance.now(),
					};
					turnOver(state.id);
				}
				setLifted(state.id);
				held.mode = "move";
				// The grab point in board space, through the sticker's tilt and its lifted scale.
				const radians = (item.rotation * Math.PI) / 180;
				const lx = ((state.ax / width) * SIZE - SIZE / 2) * LIFT;
				const ly = ((state.ay / height) * SIZE - SIZE / 2) * LIFT;
				held.dx = SIZE / 2 + lx * Math.cos(radians) - ly * Math.sin(radians);
				held.dy = SIZE / 2 + lx * Math.sin(radians) + ly * Math.cos(radians);
				held.vx = 0;
				held.vy = 0;
				held.lastX = event.clientX;
				held.lastY = event.clientY;
				// Commit the new placement now: the canvas is already painted for it, and a frame
				// drawn against the old placement shows the sheet in the wrong spot.
				flushSync(() =>
					move(state.id, () => ({
						x: clamp(event.clientX - base.left - held.dx, "x"),
						y: clamp(event.clientY - base.top - held.dy, "y"),
					})),
				);
				swing(state.id);
				return;
			}
			paint(state.id);
			return;
		}
		const origin = board.current?.getBoundingClientRect();
		held.vx += (event.clientX - held.lastX - held.vx) * 0.5;
		held.vy += (event.clientY - held.lastY - held.vy) * 0.5;
		held.lastX = event.clientX;
		held.lastY = event.clientY;
		move(held.id, () => ({
			x: clamp(event.clientX - (origin?.left ?? 0) - held.dx, "x"),
			y: clamp(event.clientY - (origin?.top ?? 0) - held.dy, "y"),
		}));
	}
	function hover(event: PointerEvent<HTMLElement>) {
		if (board.current) board.current.style.cursor = pick(event) ? "grab" : "";
	}
	function up(event: PointerEvent<HTMLElement>) {
		const held = grab.current;
		grab.current = null;
		setLifted(null);
		if (board.current) board.current.style.cursor = pick(event) ? "grab" : "";
		if (!held) return;
		playDrop();
		if (held.mode === "peel") {
			if (peel.current) peel.current.held = false;
			lay();
			return;
		}
		const cap = (value: number) =>
			Math.max(-MAX_THROW, Math.min(MAX_THROW, value));
		coast(held.id, cap(held.vx), cap(held.vy));
	}
	function togglePeel(item: Item) {
		const open = peel.current?.id === item.id && peel.current.rest;
		if (peel.current && peel.current.id !== item.id) {
			const old = peel.current.id;
			peel.current = null;
			paint(old);
		}
		if (open && peel.current) {
			peel.current.rest = undefined;
		} else {
			const { x, y, cx, cy } = cornerAnchor(item);
			peel.current = {
				id: item.id,
				ax: x,
				ay: y,
				px: x,
				py: y,
				held: false,
				rest: { x: x + (cx - x) * 0.9, y: y + (cy - y) * 0.9 },
			};
		}
		playDrop();
		lay();
	}
	function key(event: KeyboardEvent<HTMLButtonElement>, item: Item) {
		if (event.key === "Escape") event.currentTarget.blur();
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			togglePeel(item);
			return;
		}
		const delta = (
			{
				ArrowLeft: [-NUDGE, 0],
				ArrowRight: [NUDGE, 0],
				ArrowUp: [0, -NUDGE],
				ArrowDown: [0, NUDGE],
			} as Record<string, [number, number] | undefined>
		)[event.key];
		if (!delta) return;
		event.preventDefault();
		top.current += 1;
		const z = top.current;
		move(item.id, (current) => ({
			x: clamp(current.x + delta[0], "x"),
			y: clamp(current.y + delta[1], "y"),
			z,
		}));
	}

	return (
		<div
			className="sticker-board"
			ref={board}
			onPointerDown={(event) => {
				const hit = pick(event);
				if (hit) down(event, hit.item, hit.u, hit.v);
			}}
			onPointerMove={(event) => (grab.current ? drag(event) : hover(event))}
			onPointerUp={up}
			onPointerCancel={up}
		>
			<p className="sticker-board-hint">
				{failed
					? "Stickers could not load."
					: "Drag, throw and stack. Pull an edge to peel."}
			</p>
			{items.map((item) => (
				<button
					key={item.id}
					type="button"
					className="sticker-board-item"
					data-lifted={lifted === item.id}
					aria-label={`Sticker ${item.id}`}
					style={{
						width: SIZE,
						height: SIZE,
						zIndex: item.z,
						transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg) scale(${lifted === item.id ? LIFT : 1})`,
					}}
					onKeyDown={(event) => key(event, item)}
				>
					<canvas ref={canvasRef(item.id)} />
				</button>
			))}
		</div>
	);
}
