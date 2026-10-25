/** Where a corner was grabbed and where it is now, in artwork pixels. */
export type Fold = { ax: number; ay: number; px: number; py: number };

const ROLL = 0.014;
const STRIP = 1;
/** Narrowest the sheet gets while turning over, so it never vanishes edge-on. */
const EDGE_ON = 0.06;

type Layers = {
	size: number;
	face: HTMLCanvasElement;
	back: HTMLCanvasElement;
	kept: HTMLCanvasElement;
	lifted: HTMLCanvasElement;
};
let layers: Layers | null = null;
let shade: HTMLCanvasElement | null = null;

function layer(width: number, height = width) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

function work(size: number) {
	if (layers && layers.size === size) return layers;
	layers = {
		size,
		face: layer(size),
		back: layer(size),
		kept: layer(size),
		lifted: layer(size * 4, size),
	};
	return layers;
}

const bell = (value: number, centre: number, spread: number) =>
	Math.exp(-(((value - centre) / spread) ** 2));

/**
 * Paints a sticker, optionally peeled the way a real one lifts. The grabbed point follows
 * the pointer; the sheet leaves the surface at a line between the two, rolls over a small
 * cylinder (front first, then its pale backing) and lies back over the sticker with a
 * soft shadow. Everything is worked out in a frame turned so the pull runs left to right.
 */
export function paintSticker(
	canvas: HTMLCanvasElement,
	face: HTMLCanvasElement,
	back: HTMLCanvasElement,
	fold: Fold | null,
	/**
	 * Once the sheet is completely off (0 → 1): it turns over about the grab point, from its
	 * pale back to the printed face, ending exactly where a flat sticker held there would sit.
	 */
	flip?: number,
) {
	const context = canvas.getContext("2d");
	if (!context) return;
	context.imageSmoothingQuality = "high";
	// The canvas is larger than the artwork so a lifted flap and its shadow are never cut square.
	const { width, height } = face;
	const margin = (canvas.width - width) / 2;
	context.clearRect(0, 0, canvas.width, canvas.height);
	const dx = fold ? fold.px - fold.ax : 0;
	const dy = fold ? fold.py - fold.ay : 0;
	const pull = Math.hypot(dx, dy);
	if (!fold || pull < 3) {
		context.drawImage(face, margin, margin);
		return;
	}

	const turn = Math.atan2(dy, dx);
	const cos = Math.cos(turn);
	const sin = Math.sin(turn);
	const cx = width / 2;
	const cy = height / 2;
	const size = Math.ceil(Math.hypot(width, height));
	const { face: flatFace, back: flatBack, kept, lifted } = work(size);
	const half = size / 2;

	// Turn both faces so the pull points along +x.
	for (const [target, source] of [
		[flatFace, face],
		[flatBack, back],
	] as const) {
		const turned = target.getContext("2d");
		if (!turned) return;
		turned.setTransform(1, 0, 0, 1, 0, 0);
		turned.clearRect(0, 0, size, size);
		turned.translate(half, half);
		turned.rotate(-turn);
		turned.translate(-cx, -cy);
		turned.drawImage(source, 0, 0);
	}

	// The radius grows out of nothing for short pulls.
	const radius = Math.max(2, Math.min(width * ROLL, pull / Math.PI));
	const anchor = half + (fold.ax - cx) * cos + (fold.ay - cy) * sin;
	const lift = anchor + (pull + Math.PI * radius) / 2;
	const rollEnd = Math.PI * radius;

	// The sheet still stuck down, darkened where the roll presses near it.
	const stuck = kept.getContext("2d");
	const rolled = lifted.getContext("2d");
	if (!stuck || !rolled) return;
	rolled.imageSmoothingQuality = "high";
	stuck.imageSmoothingQuality = "high";
	stuck.setTransform(1, 0, 0, 1, 0, 0);
	stuck.globalCompositeOperation = "source-over";
	stuck.clearRect(0, 0, size, size);
	const edge = Math.max(0, Math.min(size, Math.floor(lift)));
	if (edge < size)
		stuck.drawImage(
			flatFace,
			edge,
			0,
			size - edge,
			size,
			edge,
			0,
			size - edge,
			size,
		);
	stuck.globalCompositeOperation = "source-atop";
	const contact = stuck.createLinearGradient(lift, 0, lift + radius * 3.4, 0);
	contact.addColorStop(0, "rgba(22, 16, 36, 0.1)");
	contact.addColorStop(0.3, "rgba(22, 16, 36, 0.05)");
	contact.addColorStop(0.7, "rgba(22, 16, 36, 0.015)");
	contact.addColorStop(1, "rgba(22, 16, 36, 0)");
	stuck.fillStyle = contact;
	stuck.fillRect(edge, 0, size - edge, size);

	// The part that has left the surface: a rolled edge, then the backing lying flat.
	rolled.setTransform(1, 0, 0, 1, 0, 0);
	rolled.globalCompositeOperation = "source-over";
	rolled.clearRect(0, 0, size * 4, size);
	for (let travel = 0; travel < rollEnd; travel += STRIP) {
		const near = travel / radius;
		const far = Math.min(Math.PI, (travel + STRIP) / radius);
		const from = lift - radius * Math.sin(near);
		const to = lift - radius * Math.sin(far);
		const left = Math.min(from, to);
		const span = Math.abs(from - to) + 1;
		const source = Math.max(0, lift - travel - STRIP);
		const reach = Math.min(STRIP, size - source);
		if (reach <= 0 || left + span < 0 || left > size * 4) continue;
		const mid = near + (far - near) / 2;
		// The face-up half of the roll is hidden beneath its own outer layer.
		if (mid < Math.PI / 2) continue;
		rolled.drawImage(flatBack, source, 0, reach, size, left, 0, span, size);
		rolled.globalCompositeOperation = "source-over";
	}
	// Shade the roll once, as a smooth gradient over the whole cylinder, so no strip seams show.
	const shadeRoll = (colour: string, strength: (angle: number) => number) => {
		const gradient = rolled.createLinearGradient(lift - radius, 0, lift, 0);
		for (let step = 0; step <= 24; step++) {
			const across = step / 24;
			const angle = Math.PI - Math.asin(1 - across);
			gradient.addColorStop(across, `rgba(${colour}, ${strength(angle)})`);
		}
		rolled.globalCompositeOperation = "source-atop";
		rolled.fillStyle = gradient;
		rolled.fillRect(lift - radius, 0, radius, size);
		rolled.globalCompositeOperation = "source-over";
	};
	shadeRoll("22, 16, 36", (angle) => 0.46 * bell(angle, 1.7, 0.5));
	shadeRoll("255, 255, 255", (angle) => 0.3 * bell(angle, 2.5, 0.55));
	const flat = Math.max(0, Math.floor(lift - rollEnd));
	if (flat > 0) {
		rolled.save();
		rolled.setTransform(-1, 0, 0, 1, 2 * lift - rollEnd, 0);
		const across = Math.min(flat, size);
		rolled.drawImage(flatBack, 0, 0, across, size, 0, 0, across, size);
		rolled.restore();
		rolled.globalCompositeOperation = "source-atop";
		// Starts exactly where the roll ends (no seam), then falls away over a fixed length.
		const reach = Math.min(flat, width * 0.7);
		const sheen = rolled.createLinearGradient(lift, 0, lift + reach, 0);
		sheen.addColorStop(
			0,
			`rgba(255, 255, 255, ${0.3 * bell(Math.PI, 2.5, 0.55)})`,
		);
		sheen.addColorStop(0.2, "rgba(255, 255, 255, 0.14)");
		sheen.addColorStop(0.65, "rgba(255, 255, 255, 0.03)");
		sheen.addColorStop(1, "rgba(34, 30, 52, 0.08)");
		rolled.fillStyle = sheen;
		rolled.fillRect(lift, 0, flat, size);
		rolled.globalCompositeOperation = "source-over";
	}

	const place = (
		target: CanvasRenderingContext2D,
		source: HTMLCanvasElement,
		shift = 0,
	) => {
		target.save();
		target.translate(cx + shift + margin, cy + margin);
		target.rotate(turn);
		target.translate(-half, -half);
		target.drawImage(source, 0, 0);
		target.restore();
	};

	if (flip !== undefined) {
		const tip = anchor + pull;
		const turnOver = Math.cos(flip * Math.PI);
		context.save();
		context.translate(cx + margin, cy + margin);
		context.rotate(turn);
		context.translate(-half - pull, -half);
		context.shadowColor = "rgba(22, 16, 36, 0.28)";
		context.shadowBlur = width * 0.05;
		context.shadowOffsetY = width * 0.03;
		if (turnOver > 0) {
			context.translate(tip, 0);
			context.scale(Math.max(turnOver, EDGE_ON), 1);
			context.translate(-tip, 0);
			context.drawImage(lifted, 0, 0);
		} else {
			context.translate(tip, 0);
			context.scale(Math.max(-turnOver, EDGE_ON), 1);
			context.translate(-anchor, 0);
			context.drawImage(flatFace, 0, 0);
		}
		context.restore();
		return;
	}

	place(context, kept);

	// The flap's shadow falls only on the sticker beneath it, never on the board around it.
	if (!shade || shade.width !== canvas.width)
		shade = layer(canvas.width, canvas.height);
	const cast = shade.getContext("2d");
	if (cast) {
		const away = width * 4;
		cast.setTransform(1, 0, 0, 1, 0, 0);
		cast.globalCompositeOperation = "source-over";
		cast.clearRect(0, 0, canvas.width, canvas.height);
		cast.save();
		cast.shadowColor = "rgba(22, 16, 36, 0.4)";
		cast.shadowBlur = width * 0.05;
		cast.shadowOffsetX = away + width * 0.012;
		cast.shadowOffsetY = width * 0.026;
		place(cast, lifted, -away);
		cast.restore();
		cast.globalCompositeOperation = "destination-in";
		cast.drawImage(face, margin, margin);
		cast.globalCompositeOperation = "source-over";
		context.drawImage(shade, 0, 0);
	}

	// The lifted sheet also shades whatever is beneath it, board included, so its edge reads.
	context.save();
	context.shadowColor = "rgba(22, 16, 36, 0.22)";
	context.shadowBlur = width * 0.035;
	context.shadowOffsetY = width * 0.018;
	place(context, lifted);
	context.restore();
}
