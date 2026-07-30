import fs from 'node:fs';

const html = fs.readFileSync('opgg_page.html', 'utf8');

// Find all matches for "Diamond", "Master", "Platinum", "Challenger", "LP"
const matches = [];
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Diamond') || line.includes('tier') || line.includes('solorank') || line.includes('winrate') || line.includes('lp')) {
    matches.push(`L${idx+1}: ${line.trim().slice(0, 200)}`);
  }
});

console.log(`Found ${matches.length} matching lines. Sample:`);
console.log(matches.slice(0, 25).join('\n'));
