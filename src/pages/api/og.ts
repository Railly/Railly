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
	font("redaction", "redaction-latin-400-italic.woff"),
	font("ibm-plex-mono", "ibm-plex-mono-latin-400-normal.woff"),
]);

// Deterministic hash so every card gets the same garúa for the same title.
const hash = (x: number, y: number) => {
	const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return h - Math.floor(h);
};

type El = { type: string; props: Record<string, unknown> };
const el = (type: string, props: Record<string, unknown>): El => ({
	type,
	props,
});

// The scene, drawn as rows of monospace characters: fog dots, a coast, a lighthouse, the sea.
function sceneRows(isDark: boolean) {
	const cols = 120;
	const rows = 11;
	const lines: El[] = [];
	const fog = isDark ? "#8f93c4" : "#b9a9a6";
	const sea = isDark ? "#5a6ac4" : "#8ea0d6";
	const band = isDark ? "#ff80a0" : "#f0808c";
	const tower = isDark ? "#cec8ec" : "#ffffff";
	const house = isDark ? "#ffd68c" : "#eb8c3c";
	const fx = 100;
	for (let y = 0; y < rows; y++) {
		const spans: El[] = [];
		for (let x = 0; x < cols; x++) {
			let c = " ";
			let color = fog;
			const towerTop = 1;
			if (
				y < 8 &&
				Math.abs(x - fx) <= (y < towerTop + 1 ? 0 : 1 + (y > 5 ? 1 : 0))
			) {
				c = y === 0 ? "*" : "#";
				color = y === 0 ? house : Math.floor(y / 2) % 2 ? band : tower;
			} else if (y < 8) {
				const edge = Math.min(x, cols - x) / cols;
				const coast = y > 5 - Math.round((0.5 - edge) * 4);
				if (coast && y >= 5) {
					c = hash(x, y) > 0.8 ? "o" : hash(x, y) > 0.4 ? "=" : ":";
					color = c === "o" ? house : fog;
				} else if (hash(x * 3, y) > 0.55 - y * 0.05) {
					c = hash(x, y) > 0.7 ? ":" : ".";
				}
			} else if (hash(x, y * 7) > 0.35) {
				c = hash(x, y) > 0.5 ? "~" : "-";
				color = sea;
			}
			spans.push(el("span", { style: { color, width: 10 }, children: c }));
		}
		lines.push(
			el("div", { style: { display: "flex", height: 16 }, children: spans }),
		);
	}
	return el("div", {
		style: { display: "flex", flexDirection: "column", opacity: 0.85 },
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

	const [serif, serifItalic, mono] = await fontsPromise;
	const bg = isDark ? "#0f0e0c" : "#f4f1ea";
	const fg = isDark ? "#ebe7df" : "#1b1915";
	const muted = isDark ? "#8a867f" : "#7a756c";
	const sky = isDark
		? "linear-gradient(180deg, #0f0e0c 0%, #0f0e0c 45%, #1a1640 100%)"
		: "linear-gradient(180deg, #f4f1ea 0%, #f4f1ea 45%, #f4c4be 100%)";
	const desc =
		description.length > 120 ? `${description.slice(0, 117)}…` : description;
	const titleSize = title.length > 60 ? 54 : title.length > 36 ? 64 : 78;

	const tree = el("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			width: "100%",
			height: "100%",
			backgroundColor: bg,
			backgroundImage: sky,
			fontFamily: "Redaction",
		},
		children: [
			el("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: "56px 72px 0",
				},
				children: [
					el("div", {
						style: {
							display: "flex",
							justifyContent: "space-between",
							fontFamily: "Commit Mono",
							fontSize: 18,
							color: muted,
						},
						children: [
							el("span", {
								children: tag ? `railly.dev / ${tag}` : "railly.dev",
							}),
							el("span", { children: date || "Railly Hugo" }),
						],
					}),
					el("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							marginTop: 48,
							maxWidth: 980,
						},
						children: [
							el("div", {
								style: {
									fontSize: titleSize,
									lineHeight: 1.08,
									color: fg,
									letterSpacing: "-0.01em",
								},
								children: title,
							}),
							...(desc
								? [
										el("div", {
											style: {
												marginTop: 22,
												fontSize: 30,
												lineHeight: 1.35,
												color: muted,
												fontStyle: "italic",
											},
											children: desc,
										}),
									]
								: []),
						],
					}),
				],
			}),
			el("div", {
				style: {
					display: "flex",
					fontFamily: "Commit Mono",
					fontSize: 14,
					paddingLeft: 0,
				},
				children: [sceneRows(isDark)],
			}),
		],
	});

	return new ImageResponse(tree as unknown as ReactElement<unknown>, {
		width: 1200,
		height: 630,
		fonts: [
			{ name: "Redaction", data: serif, weight: 400, style: "normal" },
			{ name: "Redaction", data: serifItalic, weight: 400, style: "italic" },
			{ name: "Commit Mono", data: mono, weight: 400, style: "normal" },
		],
	});
};
