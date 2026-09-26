import fs from 'fs';
import path from 'path';

function getFiles(dir, res = []) {
  if (!fs.existsSync(dir)) return res;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      getFiles(full, res);
    } else {
      res.push({
        path: full.replace(/\\/g, '/'),
        relPath: path.relative(process.cwd(), full).replace(/\\/g, '/'),
        size: fs.statSync(full).size
      });
    }
  }
  return res;
}

const buildFiles = getFiles('.next/static');
console.log(`Found ${buildFiles.length} files in .next/static`);

const cssChunks = buildFiles.filter(f => f.relPath.endsWith('.css'));
console.log(`\n=== CSS Chunks (${cssChunks.length} files) ===`);
cssChunks.forEach(f => console.log(`  ${f.relPath} (${f.size} bytes)`));

const jsChunks = buildFiles.filter(f => f.relPath.endsWith('.js'));
console.log(`\n=== JS Chunks (${jsChunks.length} files) ===`);

// Let's search inside CSS chunks for legacy CSS class names or comments
const legacyCssSamples = [
  '#header-exam-countdown-compact',
  'glass-card',
  'dashboard-grid',
  'focus-hero',
  'monthly-target-grid'
];

for (const c of cssChunks) {
  const content = fs.readFileSync(c.path, 'utf8');
  console.log(`\nAnalyzing CSS Chunk: ${c.relPath} (${c.size} bytes)`);
  legacyCssSamples.forEach(sample => {
    console.log(`  Contains "${sample}": ${content.includes(sample)}`);
  });
}

// Let's search inside JS chunks for any strings that would only exist in legacy js/
const legacyJsSamples = [
  'window.AppState',
  'window.FirebaseService',
  'dev-server.js',
  'js/core/metrics.js',
  'archive/legacy-js'
];

let foundLegacyJsInChunks = false;
for (const j of jsChunks) {
  const content = fs.readFileSync(j.path, 'utf8');
  for (const s of legacyJsSamples) {
    if (content.includes(s)) {
      console.log(`[ALERT] Found "${s}" in JS chunk ${j.relPath}!`);
      foundLegacyJsInChunks = true;
    }
  }
}
if (!foundLegacyJsInChunks) {
  console.log('\n[CONFIRMED] Zero legacy JS signatures found across all .next/static JS chunks.');
}
