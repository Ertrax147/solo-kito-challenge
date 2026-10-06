// Utilidades compartidas para hablar con la API de Riot Games:
// - resolveApiKey(): decide qué clave usar, dando prioridad a la clave
//   global guardada en Netlify Blobs (así nunca una clave vieja cacheada
//   en localStorage del navegador "tapa" a la clave oficial más reciente).
// - riotFetch(): wrapper de fetch con reintento automático y backoff
//   cuando Riot responde 429 (rate limit), respetando el header
//   "Retry-After" que manda Riot.

import { getStore } from '@netlify/blobs';

export async function resolveApiKey(url) {
  // 1. Prioridad máxima: la clave global guardada en Netlify Blobs.
  //    Es la "fuente de verdad" para todos los visitantes del sitio.
  try {
    const store = getStore({ name: 'solo-kito-accounts', consistency: 'strong' });
    const globalKey = await store.get('global_riot_api_key');
    if (globalKey && globalKey.trim()) return globalKey.trim();
  } catch (err) {}

  // 2. Si todavía no hay clave global guardada, usamos la que mande el
  //    cliente (ej. justo antes de que el admin la guarde por primera vez).
  const paramKey = url.searchParams.get('apiKey')?.trim();
  if (paramKey) return paramKey;

  // 3. Último recurso: variable de entorno configurada en Netlify.
  //    (Ya no hay ninguna clave de Riot hardcodeada en el código fuente.)
  return process.env.RIOT_API_KEY || '';
}

/**
 * fetch() con reintento automático ante 429 (rate limit de Riot).
 * Espera lo que indique el header "Retry-After" (o un backoff simple
 * si Riot no lo manda) antes de reintentar, hasta `retries` veces.
 */
export async function riotFetch(url, { retries = 2 } = {}) {
  let attempt = 0;
  let lastRes;

  while (attempt <= retries) {
    const res = await fetch(url);
    if (res.status !== 429) return res;

    lastRes = res;
    const retryAfterHeader = res.headers.get('Retry-After');
    const waitSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) || 1 : attempt + 1;
    await new Promise(r => setTimeout(r, Math.min(waitSeconds, 5) * 1000));
    attempt++;
  }

  // Se agotaron los reintentos y Riot sigue devolviendo 429
  return lastRes;
}
