import { ImageResponse } from "@vercel/og";
import type { APIRoute } from "astro";

export const prerender = false;

const interBold = fetch(
	"https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff",
).then((res) => res.arrayBuffer());

const interRegular = fetch(
	"https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff",
).then((res) => res.arrayBuffer());

const siteUrl = import.meta.env.PROD
	? "https://www.railly.dev"
	: "http://localhost:4321";

export const GET: APIRoute = async ({ url }) => {
	const title = url.searchParams.get("title") || "Railly Hugo";
	const description = url.searchParams.get("description") || "";
	const theme = url.searchParams.get("theme") || "light";

	const isDark = theme === "dark";

	if (isDark) {
		const html = {
			type: "div",
			props: {
				style: {
					display: "flex",
					width: "100%",
					height: "100%",
					backgroundColor: "#0a0a0a",
					fontFamily: "Inter",
					position: "relative",
					overflow: "hidden",
				},
				children: [
					{
						type: "div",
						props: {
							style: {
								position: "absolute",
								top: "-100px",
								left: "-100px",
								width: "500px",
								height: "500px",
								background: "radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)",
								filter: "blur(60px)",
							},
						},
					},
					{
						type: "div",
						props: {
							style: {
								position: "absolute",
								bottom: "-100px",
								right: "-100px",
								width: "500px",
								height: "500px",
								background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)",
								filter: "blur(60px)",
							},
						},
					},
					{
						type: "div",
						props: {
							style: {
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								width: "100%",
								height: "100%",
								padding: "64px",
								gap: "48px",
							},
							children: [
								{
									type: "img",
									props: {
										src: `${siteUrl}/favicon/favicon-192x192.png`,
										width: 180,
										height: 180,
										style: {
											borderRadius: "50%",
											boxShadow: "0 0 80px 20px rgba(249, 115, 22, 0.3), 0 0 120px 40px rgba(6, 182, 212, 0.2)",
										},
									},
								},
								{
									type: "div",
									props: {
										style: {
											display: "flex",
											flexDirection: "column",
											flex: 1,
											justifyContent: "center",
										},
										children: [
											{
												type: "div",
												props: {
													style: {
														fontSize: title.length > 30 ? "48px" : "64px",
														fontWeight: "bold",
														color: "#fafafa",
														lineHeight: 1.1,
														letterSpacing: "-0.02em",
													},
													children: title,
												},
											},
											...(description
												? [
														{
															type: "div",
															props: {
																style: {
																	fontSize: "24px",
																	color: "#a1a1aa",
																	marginTop: "16px",
																	lineHeight: 1.4,
																	maxWidth: "600px",
																},
																children:
																	description.length > 120
																		? `${description.slice(0, 120)}...`
																		: description,
															},
														},
													]
												: []),
											{
												type: "div",
												props: {
													style: {
														display: "flex",
														alignItems: "center",
														marginTop: "24px",
														gap: "8px",
													},
													children: [
														{
															type: "div",
															props: {
																style: {
																	fontSize: "18px",
																	color: "#a1a1aa",
																},
																children: "railly.dev",
															},
														},
													],
												},
											},
										],
									},
								},
							],
						},
					},
				],
			},
		};

		return new ImageResponse(html as any, {
			width: 1200,
			height: 630,
			fonts: [
				{
					name: "Inter",
					data: await interBold,
					weight: 700,
					style: "normal",
				},
				{
					name: "Inter",
					data: await interRegular,
					weight: 400,
					style: "normal",
				},
			],
		});
	}

	const html = {
		type: "div",
		props: {
			style: {
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: "#FFFCF0",
				padding: "64px",
				fontFamily: "Inter",
			},
			children: [
				{
					type: "div",
					props: {
						style: {
							display: "flex",
							flexDirection: "column",
							flex: 1,
							justifyContent: "center",
						},
						children: [
							{
								type: "div",
								props: {
									style: {
										fontSize: title.length > 40 ? "56px" : "72px",
										fontWeight: "bold",
										color: "#100F0F",
										lineHeight: 1.1,
										letterSpacing: "-0.02em",
									},
									children: title,
								},
							},
							...(description
								? [
										{
											type: "div",
											props: {
												style: {
													fontSize: "28px",
													color: "#6F6E69",
													marginTop: "24px",
													lineHeight: 1.4,
													maxWidth: "900px",
												},
												children:
													description.length > 150
														? `${description.slice(0, 150)}...`
														: description,
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
						style: {
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-end",
							gap: "12px",
						},
						children: [
							{
								type: "img",
								props: {
									src: `${siteUrl}/favicon/favicon-96x96.png`,
									width: 32,
									height: 32,
									style: {
										borderRadius: "50%",
									},
								},
							},
							{
								type: "div",
								props: {
									style: {
										fontSize: "20px",
										fontWeight: 500,
										color: "#100F0F",
									},
									children: "railly.dev",
								},
							},
						],
					},
				},
			],
		},
	};

	return new ImageResponse(html as any, {
		width: 1200,
		height: 630,
		fonts: [
			{
				name: "Inter",
				data: await interBold,
				weight: 700,
				style: "normal",
			},
			{
				name: "Inter",
				data: await interRegular,
				weight: 400,
				style: "normal",
			},
		],
	});
};
