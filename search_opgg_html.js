import fs from 'node:fs';

const html = fs.readFileSync('opgg_page.html', 'utf8');

const textMatches = html.match(/.{0,100}(Diamond|Ergoz|solo_tier|league_stats|solo_d|WinRate).{0,100}/gi) || [];

console.log(`Matches count: ${textMatches.length}`);
console.log(textMatches.slice(0, 15));
