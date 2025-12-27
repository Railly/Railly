// @ts-check
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import oneHunterThemeLight2024 from "./public/themes/one-hunter-light.json";
import oneHunterThemeDark2024 from "./public/themes/one-hunter-dark.json";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

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
        // @ts-ignore
        light: oneHunterThemeLight2024,
        // @ts-ignore
        dark: oneHunterThemeDark2024,
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
