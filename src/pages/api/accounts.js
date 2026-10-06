export const prerender = false;

import { getStore } from '@netlify/blobs';

const DEFAULT_ACCOUNTS = [];
const MAX_ACCOUNTS = 200; // Tope defensivo para evitar payloads absurdos

function isValidAccount(acc) {
  return (
    acc &&
    typeof acc === 'object' &&
    typeof acc.name === 'string' && acc.name.trim().length > 0 && acc.name.length <= 40 &&
    typeof acc.tag === 'string' && acc.tag.length <= 10
  );
}

export async function GET() {
  try {
    const store = getStore({ name: 'solo-kito-accounts', consistency: 'strong' });
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
    const store = getStore({ name: 'solo-kito-accounts', consistency: 'strong' });
    const stored = (await store.get('accounts_list', { type: 'json' })) || DEFAULT_ACCOUNTS;

    let list = Array.isArray(stored) ? stored : DEFAULT_ACCOUNTS;

    // Si es un array, es una importación masiva. Sobrescribimos.
    if (Array.isArray(newAcc)) {
      if (newAcc.length > MAX_ACCOUNTS) {
        return new Response(JSON.stringify({ success: false, error: `Demasiadas cuentas en el import (máx ${MAX_ACCOUNTS}).` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      if (!newAcc.every(isValidAccount)) {
        return new Response(JSON.stringify({ success: false, error: 'Una o más cuentas del import no tienen el formato esperado (name/tag).' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      list = newAcc;
    } else {
      if (!isValidAccount(newAcc)) {
        return new Response(JSON.stringify({ success: false, error: 'La cuenta enviada no tiene el formato esperado (name/tag).' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      if (list.length >= MAX_ACCOUNTS) {
        return new Response(JSON.stringify({ success: false, error: `Se alcanzó el máximo de ${MAX_ACCOUNTS} cuentas.` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const existsIndex = list.findIndex(a => a.name.toLowerCase() === newAcc.name.toLowerCase() && (a.tag || '').toLowerCase() === (newAcc.tag || '').toLowerCase());

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
    const store = getStore({ name: 'solo-kito-accounts', consistency: 'strong' });
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
