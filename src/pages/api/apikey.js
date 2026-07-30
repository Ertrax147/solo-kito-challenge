export const prerender = false;

import { getStore } from '@netlify/blobs';

export async function POST({ request }) {
  try {
    const { apiKey } = await request.json();
    if (apiKey) {
      const store = getStore({ name: 'solo-kito-accounts', consistency: 'strong' });
      await store.set('global_riot_api_key', apiKey);
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
