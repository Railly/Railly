#!/usr/bin/env bun
/**
 * Draw the ASCII "Hunter" signature from the site footer as two animated SVGs
 * (dark and light) for the GitHub profile README. Transparent background so it
 * sits on whatever GitHub theme is active.
 *
 * Usage:  bun run scripts/build-readme-scene.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dir, "..", "public", "readme");
const CH = 11;
// Monospace advance is ~0.6em; textLength pins it so every font lines up the same.
const CW = CH * 0.6;
const PX = 2;
const RAMP = "+*#%@";

// 5x7 bitmaps, lowercase on a shared baseline.
const GLYPHS: Record<string, string[]> = {
	H: ["1...1", "1...1", "1...1", "11111", "1...1", "1...1", "1...1"],
	u: [".....", ".....", "1...1", "1...1", "1...1", "1..11", ".11.1"],
	n: [".....", ".....", "1.11.", "11..1", "1...1", "1...1", "1...1"],
	t: [".1...", ".1...", "1111.", ".1...", ".1...", ".1..1", "..11."],
	e: [".....", ".....", ".111.", "1...1", "11111", "1....", ".1111"],
	r: [".....", ".....", "1.11.", "11..1", "1....", "1....", "1...."],
};
const WORD = "Hunter";

const hash = (x: number, y: number) => {
	const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return h - Math.floor(h);
};

const INK = { dark: "#ebe7df", light: "#1b1915" } as const;

function scene(mode: "dark" | "light") {
	const cols = WORD.length * 6 * PX - PX;
	const rows = 7 * PX;
	const fieldCols = 26;
	const W = (cols + fieldCols) * CW;
	const H = rows * CH + 8;
	const lines: string[] = [];
	for (let r = 0; r < rows; r++) {
		let line = "";
		for (let c = 0; c < cols + fieldCols; c++) {
			const letter = Math.floor(c / (6 * PX));
			const gx = Math.floor((c % (6 * PX)) / PX);
			const on = c < cols && gx < 5 && GLYPHS[WORD[letter]][Math.floor(r / PX)][gx] === "1";
			if (on) line += RAMP[Math.floor(hash(c, r) * RAMP.length)];
			else if (c >= cols + 2) {
				// A thin ASCII field trails off to the right, like the site margins.
				const fade = 1 - (c - cols) / fieldCols;
				line += hash(c, r + 9) < fade * 0.35 ? (hash(r, c) < 0.5 ? "·" : ":") : " ";
			} else line += " ";
		}
		lines.push(
			`<text x="0" y="${(r + 1) * CH}" textLength="${W}" lengthAdjust="spacing" xml:space="preserve">${line.replace(/&/g, "&amp;")}</text>`,
		);
	}
	const ink = INK[mode];
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Hunter, written in ASCII">
<style>
text{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:${CH}px;fill:${ink};white-space:pre}
.base{opacity:.42}
.glow{mask:url(#sweep)}
.band{animation:sweep 7s ease-in-out infinite}
@keyframes sweep{from{transform:translateX(-${W * 0.6}px)}to{transform:translateX(${W}px)}}
@media (prefers-reduced-motion:reduce){.band{animation:none;transform:none}.glow{mask:none;opacity:.8}}
</style>
<defs>
<linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="sweep" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect class="band" width="${W * 0.6}" height="${H}" fill="url(#g)"/></mask>
</defs>
<g class="base">${lines.join("")}</g>
<g class="glow">${lines.join("")}</g>
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
for (const mode of ["dark", "light"] as const)
	writeFileSync(join(OUT, `hunter-${mode}.svg`), scene(mode));
console.log("wrote public/readme/hunter-{dark,light}.svg");
