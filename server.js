import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4321;
const DIST_DIR = path.join(__dirname, 'dist');
const DDRAGON_VER = '16.15.1';

let globalRiotKey = 'RGAPI-a6e6ae1e-068c-484d-883d-a7672ab00feb';

const platformMap = {
  'LAS': { platform: 'la2', regional: 'americas', name: 'LAS' },
  'LAN': { platform: 'la1', regional: 'americas', name: 'LAN' },
  'EUW': { platform: 'euw1', regional: 'europe', name: 'EUW' },
  'NA': { platform: 'na1', regional: 'americas', name: 'NA' },
  'KR': { platform: 'kr', regional: 'asia', name: 'KR' },
  'BR': { platform: 'br1', regional: 'americas', name: 'BR' }
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  // API Route: /api/summoner
  if (reqUrl.pathname === '/api/summoner') {
    const gameName = reqUrl.searchParams.get('gameName')?.trim();
    const tagLine = reqUrl.searchParams.get('tagLine')?.replace('#', '').trim();
    const region = (reqUrl.searchParams.get('region') || 'LAS').toUpperCase();
    const apiKey = reqUrl.searchParams.get('apiKey')?.trim() || globalRiotKey;

    if (!gameName || !tagLine) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Falta invocador o tag' }));
    }

    const regConfig = platformMap[region] || platformMap['LAS'];

    // 1. Fetch Official Riot Games API (v4 by PUUID)
    if (apiKey) {
      try {
        const accUrl = `https://${regConfig.regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`;
        const accRes = await fetch(accUrl);

        if (accRes.ok) {
          const accData = await accRes.json();
          
          // Get Summoner Profile Icon & Level
          const sumUrl = `https://${regConfig.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accData.puuid}?api_key=${apiKey}`;
          const sumRes = await fetch(sumUrl);
          const sumData = sumRes.ok ? await sumRes.json() : {};

          // Get League Entries by PUUID
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

            const tierFormatted = soloQ.tier ? `${soloQ.tier} ${soloQ.rank}` : 'UNRANKED';
            const iconId = sumData.profileIconId || 29;

            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({
              success: true,
              source: 'Riot Games Official API',
              name: accData.gameName || gameName,
              tag: `#${accData.tagLine || tagLine}`,
              tier: tierFormatted,
              lp: soloQ.leaguePoints || 0,
              wins: wins,
              losses: losses,
              winrate: total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0',
              profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/profileicon/${iconId}.png`,
              opggUrl: `https://www.op.gg/summoners/${region.toLowerCase()}/${gameName}-${tagLine}`
            }));
          }
        }
      } catch (err) {
        console.error('Riot API error:', err);
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({
      success: false,
      error: 'No se pudo obtener datos del invocador'
    }));
  }

  // Set API Key endpoint
  if (reqUrl.pathname === '/api/set-key') {
    const key = reqUrl.searchParams.get('key')?.trim();
    if (key) {
      globalRiotKey = key;
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ success: true, message: 'Key updated' }));
    }
  }

  // Serve static dist files
  let filePath = path.join(DIST_DIR, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Solo Kito Server active on http://localhost:${PORT}`);
});
