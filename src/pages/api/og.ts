import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Font } from "@takumi-rs/core";
import { ImageResponse } from "@takumi-rs/image-response/wasm";
import module from "@takumi-rs/wasm/next";
import type { APIRoute } from "astro";

export const prerender = false;

const fontsPromise = Promise.all([
	readFile(
		join(
			process.cwd(),
			"node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff",
		),
	),
	readFile(
		join(
			process.cwd(),
			"node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff",
		),
	),
	readFile(
		join(
			process.cwd(),
			"node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff",
		),
	),
]);

const logoPromise = readFile(
	join(process.cwd(), "public/favicon/favicon-192x192.png"),
	"base64",
);

export const GET: APIRoute = async ({ url }) => {
	const title = url.searchParams.get("title") || "Railly Hugo";
	const description = url.searchParams.get("description") || "";
	const theme = url.searchParams.get("theme") || "dark";
	const date = url.searchParams.get("date") || "";
	const tag = url.searchParams.get("tag") || "";

	const isDark = theme === "dark";

	const [plexBold, plexRegular, plexMono] = await fontsPromise;
	const logoBase64 = await logoPromise;
	const logoSrc = `data:image/png;base64,${logoBase64}`;

	const fonts: Font[] = [
		{ name: "IBM Plex Sans", data: plexBold, weight: 700 },
		{ name: "IBM Plex Sans", data: plexRegular, weight: 400 },
		{ name: "IBM Plex Mono", data: plexMono, weight: 400 },
	];

	const bg = isDark ? "#111111" : "#FDFDFC";
	const fg = isDark ? "#fafafa" : "#111111";
	const muted = isDark ? "#a3a3a3" : "#525252";
	const border = isDark ? "#262626" : "#e5e5e5";
const truncatedDesc =
		description.length > 120 ? `${description.slice(0, 120)}...` : description;

	const titleSize = title.length > 30 ? "52px" : "62px";

	return new ImageResponse(
		{
			type: "div",
			props: {
				tw: "flex flex-col w-full h-full",
				style: {
					fontFamily: "IBM Plex Sans",
					backgroundColor: bg,
					backgroundImage: "noise-v1()",
				},
				children: [
					{
						type: "div",
						props: {
							tw: "flex flex-col flex-1 px-16 pt-16 pb-16",
							style: {
								backgroundColor: isDark
									? "rgba(17, 17, 17, 0.85)"
									: "rgba(253, 253, 252, 0.85)",
							},
							children: [
								{
									type: "div",
									props: {
										tw: "flex flex-row items-center justify-between mb-8",
										children: [
											{
												type: "div",
												props: {
													tw: "flex flex-row items-center gap-4",
													children: [
														{
															type: "img",
															props: {
																src: logoSrc,
																width: 48,
																height: 48,
																tw: "rounded-full",
															},
														},
														{
															type: "div",
															props: {
																style: {
																	fontFamily: "IBM Plex Mono",
																	fontSize: "22px",
																	color: muted,
																},
																children: "railly.dev",
															},
														},
													],
												},
											},
											...(date
												? [
														{
															type: "div",
															props: {
																style: {
																	fontFamily: "IBM Plex Mono",
																	fontSize: "20px",
																	color: muted,
																},
																children: date,
															},
														},
													]
												: []),
										],
									},
								},
								{
									type: "div",
									props: {
										tw: "flex flex-col flex-1 justify-center",
										children: [
											...(tag
												? [
														{
															type: "div",
															props: {
																tw: "mb-4",
																style: {
																	fontFamily: "IBM Plex Mono",
																	fontSize: "18px",
																	color: muted,
																	textTransform: "uppercase",
																	letterSpacing: "0.1em",
																},
																children: tag,
															},
														},
													]
												: []),
											{
												type: "div",
												props: {
													style: {
														fontSize: titleSize,
														fontWeight: 700,
														color: fg,
														lineHeight: 1.1,
														letterSpacing: "-0.03em",
													},
													children: title,
												},
											},
											...(truncatedDesc
												? [
														{
															type: "div",
															props: {
																tw: "mt-4",
																style: {
																	fontSize: "26px",
																	color: muted,
																	lineHeight: 1.5,
																},
																children: truncatedDesc,
															},
														},
													]
												: []),
										],
									},
								},
								{
									type: "div",
									props: {
										tw: "flex w-full",
										style: {
											height: "1px",
											backgroundColor: border,
										},
									},
								},
							],
						},
					},
				],
			},
		},
		{
			module,
			width: 1200,
			height: 630,
			fonts,
			format: "webp",
		},
	);
};
