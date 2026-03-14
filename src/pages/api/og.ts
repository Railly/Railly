import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Font } from "@takumi-rs/core";
import { ImageResponse } from "@takumi-rs/image-response";
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

	const titleSize = title.length > 30 ? "48px" : "56px";

	return new ImageResponse(
		{
			type: "div",
			props: {
				tw: "flex flex-col w-full h-full p-16",
				style: {
					fontFamily: "IBM Plex Sans",
					backgroundColor: bg,
				},
				children: [
					{
						type: "div",
						props: {
							tw: "flex flex-row items-center gap-4 mb-8",
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
											fontSize: "20px",
											color: muted,
										},
										children: "railly.dev",
									},
								},
							],
						},
					},
					{
						type: "div",
						props: {
							tw: "flex flex-col flex-1 justify-center",
							children: [
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
														fontSize: "24px",
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
		{
			width: 1200,
			height: 630,
			fonts,
			format: "webp",
		},
	);
};
