import type { APIRoute } from "astro";
import { createClient } from "@vercel/kv";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("id");
  const incr = url.searchParams.get("incr");

  if (!id) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Missing "id" query',
          code: "MISSING_ID",
        },
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // Initialize KV client with environment variables
    const kv = createClient({
      url: import.meta.env.KV_REST_API_URL!,
      token: import.meta.env.KV_REST_API_TOKEN!,
    });

    let views: number;

    if (incr) {
      // Increment view count
      views = await kv.hincrby("views", id, Number(incr));
    } else {
      // Just fetch view count
      const result = await kv.hget("views", id);
      views = result ? Number(result) : 0;
    }

    return new Response(
      JSON.stringify({
        slug: id,
        views: views,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          message: "Internal server error",
          code: "SERVER_ERROR",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
