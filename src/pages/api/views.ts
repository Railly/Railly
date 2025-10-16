import type { APIRoute } from 'astro';
import { kv } from '@vercel/kv';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const incr = url.searchParams.get('incr');

  if (!id) {
    return new Response(JSON.stringify({
      error: {
        message: 'Missing "id" query',
        code: 'MISSING_ID',
      }
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  try {
    let views: number;

    if (incr) {
      // Increment view count
      views = await kv.hincrby('views', id, Number(incr));
    } else {
      // Just fetch view count
      const result = await kv.hget('views', id);
      views = result ? Number(result) : 0;
    }

    return new Response(JSON.stringify({
      slug: id,
      views: views,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Error accessing KV:', error);
    return new Response(JSON.stringify({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR',
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
};
