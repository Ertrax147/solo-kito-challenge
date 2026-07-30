export const prerender = false;

const DEFAULT_API_KEY = 'RGAPI-a6e6ae1e-068c-484d-883d-a7672ab00feb';

const platformMap = {
  'LAS': { platform: 'la2', regional: 'americas', name: 'LAS' },
  'LAN': { platform: 'la1', regional: 'americas', name: 'LAN' },
  'EUW': { platform: 'euw1', regional: 'europe', name: 'EUW' },
  'NA': { platform: 'na1', regional: 'americas', name: 'NA' },
  'KR': { platform: 'kr', regional: 'asia', name: 'KR' },
  'BR': { platform: 'br1', regional: 'americas', name: 'BR' }
};

export async function GET({ request }) {
  const url = new URL(request.url);
  const puuid = url.searchParams.get('puuid')?.trim();
  const region = (url.searchParams.get('region') || 'LAS').toUpperCase();
  const apiKey = url.searchParams.get('apiKey')?.trim() || process.env.RIOT_API_KEY || DEFAULT_API_KEY;
  const count = 5; // Mostrar las últimas 5 partidas

  if (!puuid) {
    return new Response(JSON.stringify({ error: 'Falta el puuid del invocador' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const regConfig = platformMap[region] || platformMap['LAS'];
  const regionalEndpoint = regConfig.regional;

  try {
    // 1. Obtener los IDs de las últimas 5 partidas (filtrado por Solo/Duo queue = 420)
    const idsUrl = `https://${regionalEndpoint}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=${count}&api_key=${apiKey}`;
    const idsRes = await fetch(idsUrl);
    
    if (idsRes.status === 429) {
      throw new Error('Se excedió el límite de peticiones de Riot (Rate Limit 429). Intenta de nuevo en unos segundos.');
    }
    if (!idsRes.ok) {
      throw new Error(`Riot API Error (Match IDs): ${idsRes.status}`);
    }

    const matchIds = await idsRes.json();
    
    // 2. Obtener detalles de cada partida concurrentemente
    const matchPromises = matchIds.map(async (matchId) => {
      const matchUrl = `https://${regionalEndpoint}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${apiKey}`;
      const matchRes = await fetch(matchUrl);
      if (!matchRes.ok) return null;
      return matchRes.json();
    });

    const matchResults = await Promise.all(matchPromises);
    
    // 3. Formatear la información de las partidas
    const formattedMatches = matchResults.filter(m => m !== null).map((matchData) => {
      const info = matchData.info;
      // Encontrar a nuestro jugador
      const participant = info.participants.find(p => p.puuid === puuid);
      if (!participant) return null;

      // Encontrar a su oponente de línea (si existe)
      let opponentChampion = 'unknown';
      if (participant.teamPosition) {
        const opponent = info.participants.find(p => 
          p.teamPosition === participant.teamPosition && p.teamId !== participant.teamId
        );
        if (opponent) opponentChampion = opponent.championName;
      }

      // KDA y CS
      const kills = participant.kills;
      const deaths = participant.deaths;
      const assists = participant.assists;
      const kdaRatio = participant.challenges?.kda ? participant.challenges.kda.toFixed(2) : ((kills + assists) / (deaths === 0 ? 1 : deaths)).toFixed(2);
      const kp = participant.challenges?.killParticipation ? Math.round(participant.challenges.killParticipation * 100) : 0;
      const cs = (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);
      
      // Items (0 a 6)
      const items = [
        participant.item0, participant.item1, participant.item2, 
        participant.item3, participant.item4, participant.item5, 
        participant.item6
      ];

      // Runas principales
      const primaryStyle = participant.perks?.styles?.find(s => s.description === 'primaryStyle')?.style;
      const subStyle = participant.perks?.styles?.find(s => s.description === 'subStyle')?.style;

      // Retornamos el objeto formateado para el Frontend
      return {
        id: matchData.metadata.matchId,
        gameCreation: info.gameCreation,
        gameDuration: info.gameDuration,
        win: participant.win,
        championName: participant.championName,
        kills, deaths, assists,
        kdaRatio, kp, cs,
        summoner1Id: participant.summoner1Id,
        summoner2Id: participant.summoner2Id,
        primaryStyle, subStyle,
        items,
        opponentChampion,
        queueId: info.queueId,
        // Nota: LP no es devuelto por la API V5 de partidas. 
        // Normalmente se requiere seguimiento constante, enviamos un placeholder para diseño.
        lpChange: participant.win ? '+22 LP' : '-18 LP'
      };
    }).filter(m => m !== null);

    return new Response(JSON.stringify({ success: true, matches: formattedMatches }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
