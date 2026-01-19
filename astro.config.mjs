// @ts-check

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import vesperDark from "./public/themes/vesper-flexoki.json";
import vesperLight from "./public/themes/vesper-flexoki-light.json";

// https://astro.build/config
export default defineConfig({
	site: "https://www.railly.dev",

	vite: {
		plugins: [tailwindcss()],
		ssr: {
			external: ["@takumi-rs/image-response"],
		},
	},

	integrations: [
		mdx({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
		react(),
	],

	markdown: {
		shikiConfig: {
			themes: {
				// @ts-expect-error
				light: vesperLight,
				// @ts-expect-error
				dark: vesperDark,
			},
			defaultColor: "light",
			cssVariablePrefix: "--shiki-",
			transformers: [
				{
					line(node, line) {
						node.properties["data-line"] = line;
						this.addClassToHast(node, "line");
					},
				},
			],
		},
	},
	adapter: vercel({
		webAnalytics: {
			enabled: true,
		},
	}),
	serverExternalPackages: ["@takumi-rs/core", "@takumi-rs/image-response"],
});
