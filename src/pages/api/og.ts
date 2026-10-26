import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "@vercel/og";
import type { APIRoute } from "astro";
import type { ReactElement } from "react";

export const prerender = false;

const font = (pkg: string, file: string) =>
	readFile(join(process.cwd(), "node_modules/@fontsource", pkg, "files", file));

const fontsPromise = Promise.all([
	font("redaction", "redaction-latin-400-normal.woff"),
	font("geist-sans", "geist-sans-latin-400-normal.woff"),
	font("geist-sans", "geist-sans-latin-500-normal.woff"),
	font("ibm-plex-mono", "ibm-plex-mono-latin-400-normal.woff"),
]);

const hash = (x: number, y: number) => {
	const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return h - Math.floor(h);
};

type El = { type: string; props: Record<string, unknown> };
const el = (type: string, props: Record<string, unknown>): El => ({
	type,
	props,
});

// Same 5x7 bitmaps as the README signature and the site footer.
const GLYPHS: Record<string, string[]> = {
	H: ["1...1", "1...1", "1...1", "11111", "1...1", "1...1", "1...1"],
	u: [".....", ".....", "1...1", "1...1", "1...1", "1..11", ".11.1"],
	n: [".....", ".....", "1.11.", "11..1", "1...1", "1...1", "1...1"],
	t: [".1...", ".1...", "1111.", ".1...", ".1...", ".1..1", "..11."],
	e: [".....", ".....", ".111.", "1...1", "11111", "1....", ".1111"],
	r: [".....", ".....", "1.11.", "11..1", "1....", "1....", "1...."],
};
const RAMP = "+*#%@";

// "Hunter" in ASCII, as rows of monospace text.
function signature(ink: string) {
	const word = "Hunter";
	const px = 2;
	const cols = word.length * 6 * px - px;
	const rows: El[] = [];
	for (let r = 0; r < 7 * px; r++) {
		let line = "";
		for (let c = 0; c < cols; c++) {
			const letter = Math.floor(c / (6 * px));
			const gx = Math.floor((c % (6 * px)) / px);
			const on = gx < 5 && GLYPHS[word[letter]][Math.floor(r / px)][gx] === "1";
			line += on ? RAMP[Math.floor(hash(c, r) * RAMP.length)] : " ";
		}
		rows.push(
			el("div", {
				style: { display: "flex", height: 9, whiteSpace: "pre" },
				children: line,
			}),
		);
	}
	return el("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			fontFamily: "Plex Mono",
			fontSize: 9,
			color: ink,
			opacity: 0.45,
		},
		children: rows,
	});
}

// The margin field from the site: dense at the outer edge, gone before the text.
function field(ink: string, side: "left" | "right") {
	const cols = 28;
	const rows = 40;
	const lines: El[] = [];
	for (let r = 0; r < rows; r++) {
		let line = "";
		for (let c = 0; c < cols; c++) {
			const edge = side === "right" ? c / cols : 1 - c / cols;
			const v =
				((Math.sin(c * 0.5 + r * 0.21) + Math.sin(r * 0.17 - c * 0.3)) / 4 +
					0.5) *
				edge ** 2.2;
			line += v < 0.18 ? " " : " .·:-=+*#"[Math.min(8, Math.floor(v * 9) + 1)];
		}
		lines.push(
			el("div", {
				style: { display: "flex", height: 15.75, whiteSpace: "pre" },
				children: line,
			}),
		);
	}
	return el("div", {
		style: {
			position: "absolute",
			top: 0,
			[side]: 0,
			display: "flex",
			flexDirection: "column",
			fontFamily: "Plex Mono",
			fontSize: 11,
			color: ink,
			opacity: 0.32,
		},
		children: lines,
	});
}

export const GET: APIRoute = async ({ url }) => {
	const title = url.searchParams.get("title") || "Railly Hugo";
	const description = url.searchParams.get("description") || "";
	const theme = url.searchParams.get("theme") || "dark";
	const date = url.searchParams.get("date") || "";
	const tag = url.searchParams.get("tag") || "";
	const isDark = theme === "dark";

	const [serif, sans, sansMedium, mono] = await fontsPromise;
	const bg = isDark ? "#0f0e0c" : "#f4f1ea";
	const fg = isDark ? "#ebe7df" : "#1b1915";
	const muted = isDark ? "#8f8b84" : "#6e695f";
	const tile = isDark ? "rgba(235,231,223,0.08)" : "rgba(27,25,21,0.07)";
	const shadow = isDark ? "rgba(235,231,223,0.22)" : "rgba(27,25,21,0.22)";
	const desc =
		description.length > 130 ? `${description.slice(0, 127)}…` : description;
	const titleSize = title.length > 60 ? 56 : title.length > 34 ? 66 : 80;

	const tree = el("div", {
		style: {
			position: "relative",
			display: "flex",
			width: "100%",
			height: "100%",
			backgroundColor: bg,
			fontFamily: "Geist",
		},
		children: [
			field(fg, "left"),
			field(fg, "right"),
			el("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					width: "100%",
					padding: "60px 190px 56px",
				},
				children: [
					// Header row: the same identity as the site header.
					el("div", {
						style: {
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							fontSize: 22,
							color: muted,
						},
						children: [
							el("div", {
								style: { display: "flex", alignItems: "center", gap: 10 },
								children: [
									el("span", {
										style: { color: fg, fontWeight: 500 },
										children: "Railly Hugo",
									}),
									el("span", { children: "aka" }),
									el("span", {
										style: {
											fontFamily: "Plex Mono",
											fontSize: 20,
											color: fg,
											padding: "1px 8px",
											backgroundColor: tile,
											boxShadow: `3px 3px 0 ${shadow}`,
										},
										children: "Hunter",
									}),
								],
							}),
							el("span", {
								children: [tag, date].filter(Boolean).join(" · "),
							}),
						],
					}),
					el("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							flex: 1,
							justifyContent: "center",
						},
						children: [
							el("div", {
								style: {
									fontFamily: "Redaction",
									fontSize: titleSize,
									lineHeight: 1.12,
									letterSpacing: "-0.01em",
									color: fg,
								},
								children: title,
							}),
							...(desc
								? [
										el("div", {
											style: {
												marginTop: 24,
												fontSize: 26,
												lineHeight: 1.45,
												color: muted,
											},
											children: desc,
										}),
									]
								: []),
						],
					}),
					el("div", {
						style: {
							display: "flex",
							alignItems: "flex-end",
							justifyContent: "space-between",
							fontSize: 20,
							color: muted,
						},
						children: [signature(fg), el("span", { children: "railly.dev" })],
					}),
				],
			}),
		],
	});

	return new ImageResponse(tree as unknown as ReactElement<unknown>, {
		width: 1200,
		height: 630,
		fonts: [
			{ name: "Redaction", data: serif, weight: 400, style: "normal" },
			{ name: "Geist", data: sans, weight: 400, style: "normal" },
			{ name: "Geist", data: sansMedium, weight: 500, style: "normal" },
			{ name: "Plex Mono", data: mono, weight: 400, style: "normal" },
		],
	});
};
