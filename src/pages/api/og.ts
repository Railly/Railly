import type { APIRoute } from "astro";
import { ImageResponse } from "@vercel/og";

export const prerender = false;

const interBold = fetch(
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff"
).then((res) => res.arrayBuffer());

const interRegular = fetch(
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
).then((res) => res.arrayBuffer());

const siteUrl = import.meta.env.PROD ? "https://www.railly.dev" : "http://localhost:4321";

export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get("title") || "Railly Hugo";
  const description = url.searchParams.get("description") || "";

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
                    fontSize: "72px",
                    fontWeight: "bold",
                    color: "#100F0F",
                    lineHeight: 1.1,
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
                          fontSize: "32px",
                          color: "#6F6E69",
                          marginTop: "24px",
                          lineHeight: 1.4,
                        },
                        children: description,
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
                    marginRight: "12px",
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "20px",
                    fontWeight: 600,
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
    height: 628,
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
