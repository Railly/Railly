import { chamfer } from "./sticker-mark";

/** The Makeables symbol (see `components/brand/mark.tsx`): five rounded arms, a hub and two pill eyes. */
function markPath(size: number) {
	const unit = size / 100;
	const path = new Path2D();
	const place = new DOMMatrix().translate(-50 * unit, -52 * unit);
	for (let arm = 0; arm < 5; arm++) {
		const turn = new DOMMatrix()
			.translate(50 * unit, 52 * unit)
			.rotate(arm * 72);
		const part = new Path2D();
		part.roundRect(-12.5 * unit, -46 * unit, 25 * unit, 46 * unit, 12.5 * unit);
		path.addPath(part, turn);
	}
	const hub = new Path2D();
	hub.arc(0, 0, 15 * unit, 0, Math.PI * 2);
	path.addPath(hub, new DOMMatrix().translate(50 * unit, 52 * unit));
	const eyes = new Path2D();
	for (const x of [43.3, 56.7])
		eyes.roundRect(
			(x - 3.6) * unit,
			41.5 * unit,
			7.2 * unit,
			13 * unit,
			3.6 * unit,
		);
	return { path, eyes, place };
}

/** Mark and wordmark sizes on the backing, in artwork pixels: fixed, so every sheet prints the same. */
const MARK = 54;
const TYPE = 34;
const ROW = 118;
const TILT = (-14 * Math.PI) / 180;

/**
 * The liner print: rows of the mark and makeables.dev running on a diagonal, tone on tone.
 * Drawn mirrored, because the backing is only ever seen folded over across the crease, which
 * mirrors it back to reading order.
 */
function linerPrint(
	context: CanvasRenderingContext2D,
	width: number,
	height: number,
) {
	const ink = "rgba(93, 100, 118, 0.17)";
	const stamp = document.createElement("canvas");
	stamp.width = stamp.height = MARK;
	const mark = stamp.getContext("2d");
	if (!mark) return;
	const { path, eyes, place } = markPath(MARK);
	mark.translate(MARK / 2, MARK / 2);
	mark.transform(place.a, place.b, place.c, place.d, place.e, place.f);
	mark.fillStyle = ink;
	mark.fill(path);
	mark.globalCompositeOperation = "destination-out";
	mark.fill(eyes);

	const family =
		getComputedStyle(document.body).fontFamily || "ui-sans-serif, sans-serif";
	const label = "makeables.dev";
	context.save();
	context.font = `700 ${TYPE}px ${family}`;
	const cell = MARK + 14 + context.measureText(label).width + 72;
	const span = Math.hypot(width, height);
	context.translate(width / 2, height / 2);
	context.scale(-1, 1);
	context.rotate(TILT);
	context.fillStyle = ink;
	context.textBaseline = "middle";
	for (let row = 0, y = -span / 2; y < span / 2 + ROW; y += ROW, row++) {
		for (
			let x = -span / 2 - (row % 2) * (cell / 2);
			x < span / 2 + cell;
			x += cell
		) {
			context.drawImage(stamp, x, y - MARK / 2);
			context.fillText(label, x + MARK + 14, y + 2);
		}
	}
	context.restore();
}

/**
 * A band just inside the die-cut edge, the way the paper backing shows its own border: a
 * pale ring with a faint line on its inner side. It is measured from the silhouette with a
 * distance transform, so both edges stay smooth along curves.
 */
function distanceField(face: HTMLCanvasElement) {
	const scale = 0.5;
	const w = Math.ceil(face.width * scale);
	const h = Math.ceil(face.height * scale);
	const small = document.createElement("canvas");
	small.width = w;
	small.height = h;
	const reader = small.getContext("2d", { willReadFrequently: true });
	if (!reader) throw new Error("Canvas is unavailable.");
	reader.drawImage(face, 0, 0, w, h);
	return {
		reach: chamfer(reader.getImageData(0, 0, w, h).data, w, h),
		w,
		h,
		scale,
	};
}

function border(
	context: CanvasRenderingContext2D,
	face: HTMLCanvasElement,
	field: ReturnType<typeof distanceField>,
) {
	const { reach, w, h, scale } = field;
	const band = Math.max(3, face.width * 0.024 * scale);
	const line = Math.max(1, face.width * 0.0025 * scale);
	const ring = new ImageData(w, h);
	const rule = new ImageData(w, h);
	const clamp = (value: number) => Math.max(0, Math.min(1, value));
	for (let i = 0; i < reach.length; i++) {
		const d = reach[i];
		const inside = clamp(d); // antialiases the silhouette edge itself
		const pale = inside * clamp(band - d + 0.5);
		const dark =
			inside * clamp(1 - Math.abs(d - band - line / 2) / (line / 2 + 0.75));
		ring.data.set([241, 242, 246, Math.round(pale * 235)], i * 4);
		rule.data.set([96, 104, 126, Math.round(dark * 70)], i * 4);
	}
	for (const layer of [ring, rule]) {
		const target = document.createElement("canvas");
		target.width = w;
		target.height = h;
		target.getContext("2d")?.putImageData(layer, 0, 0);
		context.drawImage(target, 0, 0, face.width, face.height);
	}
}

/** The pale backing paper: the die-cut silhouette with the liner print and its border ring. */
export function makeBacking(face: HTMLCanvasElement) {
	const { width, height } = face;
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas is unavailable.");
	const paper = context.createLinearGradient(0, 0, width, height);
	paper.addColorStop(0, "#eceef1");
	paper.addColorStop(1, "#d3d7de");
	context.fillStyle = paper;
	context.fillRect(0, 0, width, height);
	linerPrint(context, width, height);
	border(context, face, distanceField(face));

	context.globalCompositeOperation = "destination-in";
	context.drawImage(face, 0, 0);
	return canvas;
}
