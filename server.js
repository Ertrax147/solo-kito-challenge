import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4321;
const DIST_DIR = path.join(__dirname, 'dist');
const DDRAGON_VER = '16.15.1';
const ACCOUNTS_FILE = path.join(__dirname, 'accounts_store.json');

let globalRiotKey = 'RGAPI-a6e6ae1e-068c-484d-883d-a7672ab00feb';

const DEFAULT_ACCOUNTS = [
  {
    id: '1',
    name: 'Ergoz',
    tag: '#LAS',
    region: 'LAS',
    role: 'MID',
    rank: 'DIAMOND IV',
    lp: 12,
    wins: 50,
    losses: 36,
    posDelta: '▲2',
    avgGain: 25,
    avgLoss: 18,
    sparkline: '10,25 25,15 40,25 55,10 70,12',
    isLive: false,
    profileIconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.15.1/img/profileicon/6879.png',
    opggUrl: 'https://www.op.gg/summoners/las/Ergoz-LAS'
  },
  {
    id: '2',
    name: 'Ertrax',
    tag: '#LAS',
    region: 'LAS',
    role: 'MID',
    rank: 'EMERALD III',
    lp: 21,
    wins: 21,
    losses: 11,
    posDelta: '▲1',
    avgGain: 30,
    avgLoss: 12,
    sparkline: '10,35 25,30 40,20 55,10 70,5',
    isLive: true,
    profileIconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.15.1/img/profileicon/5414.png',
    opggUrl: 'https://www.op.gg/summoners/las/Ertrax-LAS'
  },
  {
    id: '3',
    name: 'CrixxD',
    tag: '#LAS',
    region: 'LAS',
    role: 'MID',
    rank: 'PLATINUM I',
    lp: 61,
    wins: 26,
    losses: 18,
    posDelta: '-',
    avgGain: 28,
    avgLoss: 14,
    sparkline: '10,30 25,25 40,15 55,20 70,5',
    isLive: true,
    profileIconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.15.1/img/profileicon/4655.png',
    opggUrl: 'https://www.op.gg/summoners/las/CrixxD-LAS'
  },
  {
    id: '4',
    name: 'LUCOOOCK',
    tag: '#LAS',
    region: 'LAS',
    role: 'MID',
    rank: 'PLATINUM IV',
    lp: 89,
    wins: 172,
    losses: 159,
    posDelta: '▲1',
    avgGain: 28,
    avgLoss: 14,
    sparkline: '10,30 25,20 40,15 55,10 70,5',
    isLive: true,
    profileIconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.15.1/img/profileicon/1155.png',
    opggUrl: 'https://www.op.gg/summoners/las/Lucooock-LAS'
  }
];

function getStoredAccounts() {
  if (fs.existsSync(ACCOUNTS_FILE)) {
    try {
      const content = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch(e) {}
  }
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(DEFAULT_ACCOUNTS, null, 2));
  return DEFAULT_ACCOUNTS;
}

function saveStoredAccounts(list) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(list, null, 2));
}

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

  // API Route: /api/accounts (Global Store endpoint)
  if (reqUrl.pathname === '/api/accounts') {
    if (req.method === 'GET') {
      const list = getStoredAccounts();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(list));
    }

    if (req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => { bodyStr += chunk; });
      req.on('end', async () => {
        try {
          const newAcc = JSON.parse(bodyStr);
          const list = getStoredAccounts();
          const idx = list.findIndex(a => a.name.toLowerCase() === newAcc.name.toLowerCase() && a.tag.toLowerCase() === newAcc.tag.toLowerCase());
          
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...newAcc };
          } else {
            list.push(newAcc);
          }
          saveStoredAccounts(list);

          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ success: true, accounts: list }));
        } catch(e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      const id = reqUrl.searchParams.get('id');
      let list = getStoredAccounts();
      list = list.filter(a => a.id !== id);
      saveStoredAccounts(list);

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ success: true, accounts: list }));
    }
  }

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

    if (apiKey) {
      try {
        const accUrl = `https://${regConfig.regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`;
        const accRes = await fetch(accUrl);

        if (accRes.ok) {
          const accData = await accRes.json();
          
          const sumUrl = `https://${regConfig.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accData.puuid}?api_key=${apiKey}`;
          const sumRes = await fetch(sumUrl);
          const sumData = sumRes.ok ? await sumRes.json() : {};

          // League Entries by PUUID
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
              opggUrl: `https://www.op.gg/summoners/${region.toLowerCase()}/${encodeURIComponent(gameName)}-${tagLine}`
            }));
          }
        }
      } catch (err) {
        console.error('Riot API error:', err);
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({
      success: true,
      source: 'Default Unranked',
      name: gameName,
      tag: `#${tagLine}`,
      tier: 'UNRANKED',
      lp: 0,
      wins: 0,
      losses: 0,
      winrate: '0.0',
      profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/profileicon/29.png`,
      opggUrl: `https://www.op.gg/summoners/${region.toLowerCase()}/${encodeURIComponent(gameName)}-${tagLine}`
    }));
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
