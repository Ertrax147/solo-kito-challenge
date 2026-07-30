import fs from 'node:fs';

const html = fs.readFileSync('opgg_page.html', 'utf8');

// Search for script tags containing JSON or state data
const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];

console.log(`Total script tags found: ${scriptMatches.length}`);

for (const script of scriptMatches) {
  if (script.includes('league_stats') || script.includes('tier_info') || script.includes('Diamond') || script.includes('SOLORANK')) {
    console.log('--- MATCHING SCRIPT SNIPPET ---');
    console.log(script.slice(0, 800));
  }
}

// Search for solo rank HTML patterns
const soloRankSection = html.match(/class="tier-header"[\s\S]*?<\/div>/i) || 
                         html.match(/SOLO\/DOU[\s\S]*?<\/div>/i) || 
                         html.match(/class="tier"[\s\S]*?<\/div>/gi);

console.log('Tier matches:', soloRankSection?.slice(0, 3));
