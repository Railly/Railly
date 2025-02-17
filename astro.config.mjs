// @ts-check
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import oneHunterThemeLight2024 from "./public/themes/one-hunter-light.json";
import oneHunterThemeDark2024 from "./public/themes/one-hunter-dark.json";
import tailwindcss from "@tailwindcss/vite";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://www.railly.dev",
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [mdx(
    {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }
  )],
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
});