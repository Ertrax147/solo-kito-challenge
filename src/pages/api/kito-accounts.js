export const prerender = false;

import { getStore } from '@netlify/blobs';

const DEFAULT_ACCOUNTS = [];

export async function GET() {
  try {
    const store = getStore({ name: 'kito-personal-accounts', consistency: 'strong' });
    const stored = await store.get('accounts_list', { type: 'json' });
    const list = stored && Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_ACCOUNTS;

    return new Response(JSON.stringify(list), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify(DEFAULT_ACCOUNTS), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function POST({ request }) {
  try {
    const newAcc = await request.json();
    const store = getStore({ name: 'kito-personal-accounts', consistency: 'strong' });
    const stored = (await store.get('accounts_list', { type: 'json' })) || DEFAULT_ACCOUNTS;

    let list = Array.isArray(stored) ? stored : DEFAULT_ACCOUNTS;

    // Si es un array, es una importación masiva. Sobrescribimos.
    if (Array.isArray(newAcc)) {
      list = newAcc;
    } else {
      const existsIndex = list.findIndex(a => a.name.toLowerCase() === newAcc.name.toLowerCase() && a.tag.toLowerCase() === newAcc.tag.toLowerCase());

      if (existsIndex >= 0) {
        list[existsIndex] = { ...list[existsIndex], ...newAcc };
      } else {
        list.push(newAcc);
      }
    }

    await store.setJSON('accounts_list', list);

    return new Response(JSON.stringify({ success: true, accounts: list }), {
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

export async function DELETE({ request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const store = getStore({ name: 'kito-personal-accounts', consistency: 'strong' });
    const stored = (await store.get('accounts_list', { type: 'json' })) || DEFAULT_ACCOUNTS;

    const filtered = stored.filter(a => a.id !== id);
    await store.setJSON('accounts_list', filtered);

    return new Response(JSON.stringify({ success: true, accounts: filtered }), {
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
