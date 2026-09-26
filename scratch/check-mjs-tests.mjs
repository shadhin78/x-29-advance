import fs from 'fs';

const mjsTests = fs.readdirSync('tests').filter(f => f.endsWith('.test.mjs'));
for (const t of mjsTests) {
  const content = fs.readFileSync(`tests/${t}`, 'utf8');
  const importLines = content.split('\n').filter(l => l.startsWith('import ') || l.includes('from '));
  console.log(`\nTEST: tests/${t}`);
  importLines.forEach(l => console.log(`  ${l.trim()}`));
}
