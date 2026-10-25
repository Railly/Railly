/** Distance-to-edge maths for the backing's border ring. */

/** Distance of every opaque pixel to the nearest transparent one, in pixels. */
export function chamfer(pixels: Uint8ClampedArray, w: number, h: number) {
	const reach = new Float32Array(w * h);
	for (let i = 0; i < reach.length; i++)
		reach[i] = pixels[i * 4 + 3] > 127 ? 1e6 : 0;
	const at = (x: number, y: number) =>
		x < 0 || y < 0 || x >= w || y >= h ? 0 : reach[y * w + x];
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			reach[i] = Math.min(
				reach[i],
				at(x - 1, y) + 1,
				at(x, y - 1) + 1,
				at(x - 1, y - 1) + Math.SQRT2,
				at(x + 1, y - 1) + Math.SQRT2,
			);
		}
	}
	for (let y = h - 1; y >= 0; y--) {
		for (let x = w - 1; x >= 0; x--) {
			const i = y * w + x;
			reach[i] = Math.min(
				reach[i],
				at(x + 1, y) + 1,
				at(x, y + 1) + 1,
				at(x + 1, y + 1) + Math.SQRT2,
				at(x - 1, y + 1) + Math.SQRT2,
			);
		}
	}
	return reach;
}
