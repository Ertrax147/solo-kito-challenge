export const prerender = false;

const DDRAGON_VER = '16.15.1';
const DEFAULT_API_KEY = 'RGAPI-a6e6ae1e-068c-484d-883d-a7672ab00feb';

const platformMap = {
  'LAS': { platform: 'la2', regional: 'americas', name: 'LAS' },
  'LAN': { platform: 'la1', regional: 'americas', name: 'LAN' },
  'EUW': { platform: 'euw1', regional: 'europe', name: 'EUW' },
  'NA': { platform: 'na1', regional: 'americas', name: 'NA' },
  'KR': { platform: 'kr', regional: 'asia', name: 'KR' },
  'BR': { platform: 'br1', regional: 'americas', name: 'BR' }
};

import { getStore } from '@netlify/blobs';

export async function GET({ request }) {
  const url = new URL(request.url);
  const gameName = url.searchParams.get('gameName')?.trim();
  const tagLine = url.searchParams.get('tagLine')?.replace('#', '').trim();
  const region = (url.searchParams.get('region') || 'LAS').toUpperCase();
  
  let apiKey = url.searchParams.get('apiKey')?.trim();
  
  if (!apiKey) {
    try {
      const store = getStore({ name: 'solo-kito-accounts', consistency: 'strong' });
      apiKey = await store.get('global_riot_api_key');
    } catch (err) {}
  }
  
  if (!apiKey) {
    apiKey = process.env.RIOT_API_KEY || DEFAULT_API_KEY;
  }

  if (!gameName || !tagLine) {
    return new Response(JSON.stringify({ error: 'Falta el nombre de invocador o tag' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const regConfig = platformMap[region] || platformMap['LAS'];

  // Consultar la API oficial de Riot Games (v4 por PUUID)
  if (apiKey) {
    try {
      const accountUrl = `https://${regConfig.regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`;
      const accRes = await fetch(accountUrl);

      if (accRes.ok) {
        const accData = await accRes.json();

        // 2. Datos del invocador (Ícono y Nivel)
        const summonerUrl = `https://${regConfig.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accData.puuid}?api_key=${apiKey}`;
        const sumRes = await fetch(summonerUrl);
        const sumData = sumRes.ok ? await sumRes.json() : {};

        // 3. Entradas de liga por PUUID
        const leagueUrl = `https://${regConfig.platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${accData.puuid}?api_key=${apiKey}`;
        const leagueRes = await fetch(leagueUrl);

        if (leagueRes.ok) {
          const leagueEntries = await leagueRes.json();
          const soloQ = leagueEntries.find(e => e.queueType === 'RANKED_SOLO_5x5') || leagueEntries[0] || {
            tier: 'UNRANKED',
            rank: '',
            leaguePoints: 0,
            wins: 0,
            losses: 0
          };

          const wins = soloQ.wins || 0;
          const losses = soloQ.losses || 0;
          const total = wins + losses;
          const tierFormatted = soloQ.tier ? `${soloQ.tier} ${soloQ.rank}`.trim() : 'UNRANKED';
          const iconId = sumData.profileIconId || 29;

          return new Response(JSON.stringify({
            success: true,
            source: 'Riot Games Official API',
            name: accData.gameName || gameName,
            tag: `#${accData.tagLine || tagLine}`,
            puuid: accData.puuid,
            tier: tierFormatted,
            lp: soloQ.leaguePoints || 0,
            wins: wins,
            losses: losses,
            winrate: total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0',
            profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/profileicon/${iconId}.png`,
            opggUrl: `https://www.op.gg/summoners/${region.toLowerCase()}/${gameName}-${tagLine}`
          }), {
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
            }
          });
        }
      }
      // Ignorar error y usar la respuesta alternativa por defecto
    } catch (err) {}
  }

  // Respuesta alternativa (fallback) para cuentas sin clasificar / desconocidas o si se alcanza el límite de peticiones
  return new Response(JSON.stringify({
    success: false,
    source: 'Default Unranked',
    name: gameName,
    tag: `#${tagLine}`,
    tier: 'UNRANKED',
    lp: 0,
    wins: 0,
    losses: 0,
    winrate: '0.0',
    profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/profileicon/29.png`,
    opggUrl: `https://www.op.gg/summoners/${region.toLowerCase()}/${gameName}-${tagLine}`
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
