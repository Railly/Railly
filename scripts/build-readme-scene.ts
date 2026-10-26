#!/usr/bin/env bun
/**
 * Draw the garúa scene as two animated SVGs (dark and light) for the GitHub profile README.
 * The background is transparent so the sea runs into whatever GitHub theme is active.
 *
 * Usage:  bun run scripts/build-readme-scene.ts
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dir, "..", "public", "readme");
const W = 880;
const H = 280;
const CW = 8;
const CH = 13;
const COLS = W / CW;
const HORIZON = 210;

const hash = (x: number, y: number) => {
	const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return h - Math.floor(h);
};

type Pal = {
	fog: string;
	sea: string;
	band: string;
	tower: string;
	trim: string;
	rock: string;
	lamp: string;
	house: string;
	drop: string;
};
const PAL: Record<"dark" | "light", Pal> = {
	dark: {
		fog: "#8f93c4",
		sea: "#5a6ac4",
		band: "#ff80a0",
		tower: "#cec8ec",
		trim: "#46427a",
		rock: "#3a3448",
		lamp: "#ffecaa",
		house: "#ffd68c",
		drop: "#bec8eb",
	},
	light: {
		fog: "#a99a97",
		sea: "#7d90cf",
		band: "#f0808c",
		tower: "#faf4f0",
		trim: "#464e8c",
		rock: "#76604f",
		lamp: "#ffbe5a",
		house: "#eb8c3c",
		drop: "#6e6e8c",
	},
};

function scene(mode: "dark" | "light") {
	const P = PAL[mode];
	const out: string[] = [];
	const text = (x: number, y: number, c: string, fill: string, op: number) =>
		out.push(
			`<text x="${x}" y="${y}" fill="${fill}" fill-opacity="${op.toFixed(2)}">${c}</text>`,
		);

	// Fog over the coast.
	for (let y = 130; y < HORIZON; y += CH) {
		for (let x = 0; x < COLS; x++) {
			const d = (y - 130) / (HORIZON - 130);
			if (hash(x, y) < 0.45 + d * 0.3) continue;
			text(x * CW, y, hash(x * 3, y) > 0.7 ? ":" : ".", P.fog, 0.25 + d * 0.35);
		}
	}
	// Coast with houses on both sides.
	for (let x = 0; x < COLS; x++) {
		const edge = Math.min(x, COLS - x) / COLS;
		const top = HORIZON - Math.max(0, Math.round((0.42 - edge) * 9)) * CH;
		for (let y = top; y < HORIZON; y += CH) {
			const h = hash(x, y);
			const isHouse = y === top && h > 0.6;
			text(
				x * CW,
				y,
				isHouse ? "▪" : h > 0.5 ? "=" : ":",
				isHouse ? P.house : P.fog,
				isHouse ? 0.9 : 0.45,
			);
		}
	}
	// Lighthouse on a rock, right third.
	const fx = 700;
	for (let i = 0; i < 4; i++) {
		const y = HORIZON - CH * (i + 1);
		const half = 30 - i * 5;
		out.push(
			`<rect x="${fx - half}" y="${y - CH + 3}" width="${half * 2}" height="${CH}" fill="${P.rock}"/>`,
		);
	}
	const towerTop = HORIZON - 4 * CH - 10 * 9;
	for (let i = 0; i < 10; i++) {
		const y = HORIZON - 4 * CH - (i + 1) * 9;
		const half = 10 - i * 0.5;
		out.push(
			`<rect x="${fx - half}" y="${y}" width="${half * 2}" height="9" fill="${Math.floor(i / 2) % 2 ? P.band : P.tower}"/>`,
		);
	}
	out.push(
		`<rect x="${fx - 11}" y="${towerTop - 3}" width="22" height="3" fill="${P.trim}"/>`,
	);
	out.push(
		`<rect x="${fx - 4}" y="${towerTop - 10}" width="8" height="7" fill="${P.lamp}" class="lamp"/>`,
	);
	out.push(
		`<rect x="${fx - 5}" y="${towerTop - 14}" width="10" height="4" fill="${P.band}"/>`,
	);
	const lampY = towerTop - 6;
	// Beam: a soft wedge that sweeps slowly; dark mode only feels right at night.
	if (mode === "dark") {
		out.unshift(
			`<defs><radialGradient id="b" cx="${fx}" cy="${lampY}" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${P.lamp}" stop-opacity=".35"/><stop offset="1" stop-color="${P.lamp}" stop-opacity="0"/></radialGradient><filter id="s" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="10"/></filter><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="m"><rect width="${W}" height="${H}" fill="url(#f)"/></mask></defs>`,
			`<g mask="url(#m)"><g class="beam" style="transform-origin:${fx}px ${lampY}px"><path d="M${fx} ${lampY} L${fx - 620} ${lampY + 10} L${fx - 620} ${lampY + 110} Z" fill="url(#b)" filter="url(#s)"/></g></g>`,
		);
	} else {
		out.unshift(
			`<circle cx="160" cy="150" r="70" fill="#ffe2c4" fill-opacity=".45" filter="url(#s)"/><circle cx="160" cy="150" r="12" fill="#fff7e6" fill-opacity=".95"/><defs><filter id="s"><feGaussianBlur stdDeviation="18"/></filter></defs>`,
		);
	}
	// Sea: two layers drifting in opposite directions so it never looks like a loop.
	const sea = (cls: string, seed: number) => {
		const rows: string[] = [];
		for (let r = 0; r < 5; r++) {
			const y = HORIZON + 12 + r * CH;
			let line = "";
			for (let x = 0; x < COLS * 2; x++)
				line += hash(x + seed, r) > 0.55 ? (hash(r, x) > 0.5 ? "~" : "-") : " ";
			rows.push(
				`<text x="0" y="${y}" fill="${P.sea}" fill-opacity="${(0.55 - r * 0.08).toFixed(2)}" xml:space="preserve">${line}</text>`,
			);
		}
		return `<g class="${cls}">${rows.join("")}</g>`;
	};
	out.push(sea("sea a", 1), sea("sea b", 9));
	// Reflection of the lamp.
	for (let r = 0; r < 4; r++)
		text(
			fx - 4,
			HORIZON + 12 + r * CH,
			r % 2 ? "'" : ".",
			P.lamp,
			0.6 - r * 0.12,
		);
	// Drizzle.
	const drops: string[] = [];
	for (let i = 0; i < 70; i++) {
		const x = hash(i, 1) * (W + 60);
		const y = hash(i, 2) * H;
		drops.push(
			`<text x="${x.toFixed(0)}" y="${y.toFixed(0)}">${i % 2 ? "'" : ","}</text>`,
		);
	}
	out.push(
		`<g class="rain" fill="${P.drop}" fill-opacity="${mode === "dark" ? 0.35 : 0.4}">${drops.join("")}</g>`,
	);
	out.push(
		`<g class="rain r2" fill="${P.drop}" fill-opacity="${mode === "dark" ? 0.35 : 0.4}">${drops.join("")}</g>`,
	);

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="ASCII garúa over the sea with a lighthouse">
<style>
text{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
.sea.a{animation:drift 40s linear infinite}
.sea.b{animation:drift 60s linear infinite reverse;opacity:.5}
.beam{animation:sweep 9s ease-in-out infinite alternate}
.lamp{animation:pulse 3s ease-in-out infinite}
.rain{animation:fall 14s linear infinite}
.r2{animation-delay:-7s}
@keyframes drift{to{transform:translateX(-${W / 2}px)}}
@keyframes sweep{from{transform:rotate(0deg)}to{transform:rotate(6deg)}}
@keyframes pulse{50%{opacity:.6}}
@keyframes fall{from{transform:translate(0,-${H}px)}to{transform:translate(-60px,${H}px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
${out.join("\n")}
</svg>
`;
}

for (const mode of ["dark", "light"] as const)
	writeFileSync(join(OUT, `garua-${mode}.svg`), scene(mode));
console.log("wrote public/readme/garua-{dark,light}.svg");
