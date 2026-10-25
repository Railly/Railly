/** Pure geometry for the sticker board: no DOM, so it can be tested directly. */

/** The board draws each sticker in a square this many CSS pixels wide. */
export const SIZE = 140;
/** How close to the silhouette edge, as a fraction of the artwork, still counts as a grab point. */
export const EDGE_REACH = 0.3;

/** What the helpers need to know about a sticker: its artwork size and alpha, and where it sits. */
export type Placed = {
	sticker: { width: number; height: number };
	alpha: Uint8ClampedArray;
	x: number;
	y: number;
	rotation: number;
};

/** A screen point in a sticker's own 0..1 space, undoing its position, tilt and lift. */
export function toLocal(
	item: Placed,
	origin: { left: number; top: number },
	clientX: number,
	clientY: number,
	scale = 1,
) {
	const radians = (item.rotation * Math.PI) / 180;
	const half = SIZE / 2;
	const px = clientX - origin.left - item.x - half;
	const py = clientY - origin.top - item.y - half;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	return {
		u: ((px * cos + py * sin) / scale + half) / SIZE,
		v: ((-px * sin + py * cos) / scale + half) / SIZE,
	};
}

/** Stickers are hit-tested by their die-cut silhouette, so transparent corners never block anything. */
export function solid(item: Placed, u: number, v: number) {
	const { width, height } = item.sticker;
	const x = Math.floor(u * width);
	const y = Math.floor(v * height);
	return (
		x >= 0 &&
		y >= 0 &&
		x < width &&
		y < height &&
		item.alpha[(y * width + x) * 4 + 3] > 20
	);
}

/** The far bottom-right edge of the artwork, where a keyboard peel starts. */
export function cornerAnchor(item: Placed) {
	const { width, height } = item.sticker;
	const cx = width / 2;
	const cy = height / 2;
	let reach = 0;
	for (let step = 0; step < width; step += 4) {
		const x = Math.floor(cx + step * Math.SQRT1_2);
		const y = Math.floor(cy + step * Math.SQRT1_2);
		if (x >= width || y >= height) break;
		if (item.alpha[(y * width + x) * 4 + 3] > 20) reach = step;
	}
	const back = Math.max(0, reach - width * 0.04);
	return { x: cx + back * Math.SQRT1_2, y: cy + back * Math.SQRT1_2, cx, cy };
}

/** True when the pointer is on opaque artwork close to its outer silhouette. */
export function nearEdge(item: Placed, u: number, v: number) {
	const { width, height } = item.sticker;
	const opaque = (x: number, y: number) => {
		const ix = Math.floor(x);
		const iy = Math.floor(y);
		return (
			ix >= 0 &&
			iy >= 0 &&
			ix < width &&
			iy < height &&
			item.alpha[(iy * width + ix) * 4 + 3] > 20
		);
	};
	const px = u * width;
	const py = v * height;
	if (!opaque(px, py)) return false;
	const cx = width / 2;
	const cy = height / 2;
	const length = Math.hypot(px - cx, py - cy);
	if (length < width * 0.12) return false;
	const dx = (px - cx) / length;
	const dy = (py - cy) / length;
	let edge = length;
	for (let step = length; step < width; step += 4) {
		if (opaque(cx + dx * step, cy + dy * step)) edge = step;
	}
	return edge - length < width * EDGE_REACH;
}
