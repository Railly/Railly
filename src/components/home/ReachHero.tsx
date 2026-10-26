import { useEffect, useRef, useState } from "react";

type Pt = [number, number];
type Part = { pts: Pt[]; w: number };

// Hand in local units: wrist at the origin, pointing +x, y down.
function handParts(t: number, reach: number): Part[] {
	const curl = Math.sin(t * 0.0012) * 2;
	const ext = 196 + reach * 12;
	return [
		{
			pts: [
				[-560, 50],
				[-10, 8],
			],
			w: 80,
		},
		{
			pts: [
				[4, 4],
				[72, 4],
			],
			w: 74,
		},
		{
			pts: [
				[70, 32],
				[110, 40],
				[118, 54 + curl],
				[106, 62 + curl],
			],
			w: 16,
		},
		{
			pts: [
				[78, 14],
				[130, 20],
				[142, 36 + curl],
				[128, 48 + curl],
			],
			w: 19,
		},
		{
			pts: [
				[80, -6],
				[140, -4],
				[158, 14 + curl],
				[146, 30 + curl],
			],
			w: 20,
		},
		{
			pts: [
				[14, -30],
				[50, -54],
				[86, -60 - curl],
				[106, -58 - curl],
			],
			w: 21,
		},
		{
			pts: [
				[70, -26],
				[130, -34],
				[ext, -38],
			],
			w: 20,
		},
	];
}

const tipOf = (parts: Part[]): Pt => {
	const index = parts[parts.length - 1];
	const [x, y] = index.pts[index.pts.length - 1];
	return [x + index.w / 2, y];
};

function drawHand(
	ctx: CanvasRenderingContext2D,
	parts: Part[],
	channel: "r" | "g",
) {
	const tone = (v: number) =>
		channel === "r" ? `rgb(${v},0,0)` : `rgb(0,${v},0)`;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	for (const p of parts) {
		const passes: [number, number, number][] = [
			[1, 0, 90],
			[0.78, -0.12, 150],
			[0.42, -0.22, 255],
		];
		for (const [k, dy, v] of passes) {
			ctx.beginPath();
			ctx.moveTo(p.pts[0][0], p.pts[0][1] + dy * p.w);
			for (const [x, y] of p.pts.slice(1)) ctx.lineTo(x, y + dy * p.w);
			ctx.lineWidth = p.w * k;
			ctx.strokeStyle = tone(v);
			ctx.stroke();
		}
	}
}

const LEVELS = 8;
function makeSprites(chars: string[], size: number, dpr: number) {
	return chars.map((ch) =>
		Array.from({ length: LEVELS }, (_, i) => {
			const c = document.createElement("canvas");
			c.width = c.height = Math.ceil(size * dpr);
			const x = c.getContext("2d") as CanvasRenderingContext2D;
			x.scale(dpr, dpr);
			x.fillStyle = `rgba(255,255,255,${0.18 + (0.82 * (i + 1)) / LEVELS})`;
			x.font = `${size * (0.7 + (0.45 * i) / LEVELS)}px "Commit Mono", ui-monospace, monospace`;
			x.textAlign = "center";
			x.textBaseline = "middle";
			x.fillText(ch, size / 2, size / 2);
			return c;
		}),
	);
}

export function ReachHero() {
	const wrapRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const holdRef = useRef(false);
	const [touched, setTouched] = useState(false);

	useEffect(() => {
		const wrap = wrapRef.current;
		const canvas = canvasRef.current;
		if (!wrap || !canvas) return;
		const ctx = canvas.getContext("2d");
		const buf = document.createElement("canvas");
		const bctx = buf.getContext("2d", { willReadFrequently: true });
		if (!ctx || !bctx) return;

		const reduce = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		let W = 0;
		let H = 0;
		let cell = 6;
		let cols = 0;
		let rows = 0;
		let dpr = 1;
		let human: HTMLCanvasElement[][] = [];
		let agent: HTMLCanvasElement[][] = [];
		let stars: { x: number; y: number; p: number; s: number }[] = [];
		const sparks: {
			x: number;
			y: number;
			vx: number;
			vy: number;
			life: number;
		}[] = [];
		const pointer = { x: -1e4, y: -1e4, active: false };
		let gap = 0;
		let flash = 0;
		let wasTouching = false;
		let raf = 0;
		let visible = true;

		const resize = () => {
			const r = wrap.getBoundingClientRect();
			W = r.width;
			H = r.height;
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			cell = W < 500 ? 5 : 6;
			cols = Math.floor(W / cell);
			rows = Math.floor(H / cell);
			canvas.width = Math.floor(W * dpr);
			canvas.height = Math.floor(H * dpr);
			buf.width = cols;
			buf.height = rows;
			human = makeSprites(["×"], cell * 1.6, dpr);
			agent = makeSprites(["0", "1", "+"], cell * 1.6, dpr);
			stars = Array.from({ length: Math.round((W * H) / 2600) }, () => ({
				x: Math.random() * W,
				y: Math.random() * H,
				p: Math.random() * Math.PI * 2,
				s: Math.random() < 0.1 ? 1.6 : 1,
			}));
			gap = W * 0.07;
		};

		const frame = (t: number) => {
			const k = W / (W < 500 ? 620 : 820);
			const hold = holdRef.current;
			const idleGap = W * (0.05 + 0.012 * Math.sin(t * 0.0011));
			const target = hold ? 0 : pointer.active ? idleGap * 0.6 : idleGap;
			gap += (target - gap) * (hold ? 0.06 : 0.04);
			const reach = 1 - gap / (W * 0.07);

			// Meeting point leans toward the pointer.
			let mx = W * 0.5;
			let my = H * (W < 500 ? 0.38 : 0.34);
			if (pointer.active) {
				mx += (pointer.x - mx) * 0.06;
				my += (pointer.y - my) * 0.06;
			}

			const parts = handParts(t, reach);
			const tip = tipOf(parts);
			bctx.setTransform(1, 0, 0, 1, 0, 0);
			bctx.globalCompositeOperation = "source-over";
			bctx.fillStyle = "#000";
			bctx.fillRect(0, 0, cols, rows);
			bctx.globalCompositeOperation = "lighter";

			bctx.setTransform(1 / cell, 0, 0, 1 / cell, 0, 0);
			bctx.translate(mx - gap / 2, my);
			bctx.rotate(-0.22);
			bctx.scale(k, k);
			bctx.translate(-tip[0], -tip[1]);
			drawHand(bctx, parts, "r");

			bctx.setTransform(1 / cell, 0, 0, 1 / cell, 0, 0);
			bctx.translate(mx + gap / 2, my);
			bctx.rotate(0.28);
			bctx.scale(-k, k);
			bctx.translate(-tip[0], -tip[1]);
			drawHand(bctx, handParts(t + 900, reach), "g");

			const data = bctx.getImageData(0, 0, cols, rows).data;

			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.fillStyle = "#050505";
			ctx.fillRect(0, 0, W, H);

			for (const s of stars) {
				const a = 0.25 + 0.35 * Math.sin(t * 0.0015 + s.p);
				ctx.fillStyle = `rgba(255,255,255,${Math.max(0.05, a)})`;
				ctx.fillRect(s.x, s.y, s.s, s.s);
			}

			const R = 70;
			const size = cell * 1.6;
			for (let y = 0; y < rows; y++) {
				for (let x = 0; x < cols; x++) {
					const i = (y * cols + x) * 4;
					const h = data[i];
					const g = data[i + 1];
					const v = Math.max(h, g);
					if (v < 22) continue;
					// Dither: sparse at the edges, dense in the light.
					const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
					if (v < 140 && Math.abs(n) > (v / 140) * 1.1) continue;
					let px = x * cell + cell / 2;
					let py = y * cell + cell / 2;
					const dx = px - pointer.x;
					const dy = py - pointer.y;
					const d2 = dx * dx + dy * dy;
					if (d2 < R * R) {
						const d = Math.sqrt(d2) || 1;
						const f = (1 - d / R) ** 2 * 14;
						px += (dx / d) * f;
						py += (dy / d) * f;
					}
					const lvl = Math.min(LEVELS - 1, Math.floor((v / 256) * LEVELS));
					let sprite: HTMLCanvasElement;
					if (h >= g) {
						sprite = human[0][lvl];
					} else {
						const flicker = Math.floor(t / 120 + x * 7 + y * 13) % 3;
						sprite = agent[(x + y + flicker) % 3][lvl];
					}
					ctx.drawImage(sprite, px - size / 2, py - size / 2, size, size);
				}
			}

			const touching = gap < 1.5;
			if (touching && !wasTouching) {
				flash = 1;
				for (let s = 0; s < 140; s++) {
					const a = Math.random() * Math.PI * 2;
					const sp = 0.6 + Math.random() * 4.5;
					sparks.push({
						x: mx,
						y: my,
						vx: Math.cos(a) * sp,
						vy: Math.sin(a) * sp,
						life: 1,
					});
				}
				setTouched(true);
			}
			wasTouching = touching;

			if (flash > 0) {
				const g = ctx.createRadialGradient(
					mx,
					my,
					0,
					mx,
					my,
					W * 0.5 * (1.2 - flash),
				);
				g.addColorStop(0, `rgba(255,255,255,${flash * 0.55})`);
				g.addColorStop(1, "rgba(255,255,255,0)");
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, W, H);
				flash *= 0.94;
				if (flash < 0.01) flash = 0;
			}
			for (let s = sparks.length - 1; s >= 0; s--) {
				const p = sparks[s];
				p.x += p.vx;
				p.y += p.vy;
				p.vx *= 0.97;
				p.vy *= 0.97;
				p.life -= 0.012;
				if (p.life <= 0) {
					sparks.splice(s, 1);
					continue;
				}
				const lvl = Math.min(LEVELS - 1, Math.floor(p.life * LEVELS));
				ctx.drawImage(
					human[0][lvl],
					p.x - size / 2,
					p.y - size / 2,
					size,
					size,
				);
			}
		};

		const loop = (t: number) => {
			if (visible) frame(t);
			raf = requestAnimationFrame(loop);
		};

		resize();
		if (reduce) {
			frame(0);
		} else {
			raf = requestAnimationFrame(loop);
		}

		const ro = new ResizeObserver(() => {
			resize();
			if (reduce) frame(0);
		});
		ro.observe(wrap);
		const io = new IntersectionObserver(([e]) => {
			visible = e.isIntersecting;
		});
		io.observe(wrap);

		const move = (e: PointerEvent) => {
			const r = wrap.getBoundingClientRect();
			pointer.x = e.clientX - r.left;
			pointer.y = e.clientY - r.top;
			pointer.active = true;
		};
		const leave = () => {
			pointer.active = false;
			pointer.x = pointer.y = -1e4;
			holdRef.current = false;
		};
		const down = (e: PointerEvent) => {
			move(e);
			holdRef.current = true;
		};
		const up = () => {
			holdRef.current = false;
		};
		wrap.addEventListener("pointermove", move);
		wrap.addEventListener("pointerleave", leave);
		wrap.addEventListener("pointerdown", down);
		window.addEventListener("pointerup", up);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			io.disconnect();
			wrap.removeEventListener("pointermove", move);
			wrap.removeEventListener("pointerleave", leave);
			wrap.removeEventListener("pointerdown", down);
			window.removeEventListener("pointerup", up);
		};
	}, []);

	const key = (e: React.KeyboardEvent, on: boolean) => {
		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			holdRef.current = on;
		}
	};

	return (
		<div
			ref={wrapRef}
			role="img"
			aria-label="A human hand drawn in crosses and an agent hand drawn in binary reach toward each other across a starfield. Press and hold to close the gap."
			tabIndex={0}
			onKeyDown={(e) => key(e, true)}
			onKeyUp={(e) => key(e, false)}
			className="relative aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-xl bg-[#050505] text-white outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:aspect-[16/10]"
		>
			<canvas ref={canvasRef} className="absolute inset-0 size-full" />
			<div className="pointer-events-none absolute inset-x-4 top-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
				<span>fig. 01</span>
				<span>human × agent</span>
			</div>
			<p
				className="pointer-events-none absolute inset-x-0 bottom-[9%] text-center text-[clamp(3rem,13vw,6rem)] leading-none text-white"
				style={{
					fontFamily:
						'"Archivo Black", "Arial Black", "Helvetica Neue", sans-serif',
					fontWeight: 900,
					letterSpacing: "-0.045em",
				}}
			>
				HUNTER
			</p>
			<div className="pointer-events-none absolute inset-x-4 bottom-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
				<span>the frontier is the gap</span>
				<span className={touched ? "text-white" : ""}>
					{touched ? "contact" : "hold to reach"}
				</span>
			</div>
		</div>
	);
}
