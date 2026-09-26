import fs from 'fs';
import path from 'path';

function getFiles(dir, res = []) {
  if (!fs.existsSync(dir)) return res;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.git' && item.name !== '.next') {
        getFiles(full, res);
      }
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

const all = getFiles('.');
const modernFiles = all.filter(f => 
  f.relPath.startsWith('app/') ||
  f.relPath.startsWith('components/') ||
  f.relPath.startsWith('features/') ||
  f.relPath.startsWith('stores/') ||
  f.relPath.startsWith('lib/') ||
  f.relPath.startsWith('services/')
);

const patterns = {
  getElementById: /document\.getElementById/g,
  querySelector: /document\.querySelector/g,
  querySelectorAll: /document\.querySelectorAll/g,
  innerHTML: /\.innerHTML/g,
  dangerouslySetInnerHTML: /dangerouslySetInnerHTML/g,
  manualAddEventListener: /document\.addEventListener|window\.addEventListener/g,
  windowGlobals: /window\.[a-zA-Z0-9_$]+/g,
  firebaseInit: /initializeApp/g,
  onSnapshot: /onSnapshot/g
};

console.log('=== SEARCHING FOR LEGACY PATTERNS IN MODERN CODEBASE ===');
for (const [name, regex] of Object.entries(patterns)) {
  const matches = [];
  for (const mf of modernFiles) {
    const content = fs.readFileSync(mf.path, 'utf8');
    let m;
    while ((m = regex.exec(content)) !== null) {
      matches.push({ file: mf.relPath, match: m[0] });
    }
  }
  console.log(`\nPATTERN: ${name} (${matches.length} occurrences)`);
  // Group by file
  const grouped = {};
  for (const match of matches) {
    grouped[match.file] = (grouped[match.file] || 0) + 1;
  }
  for (const [file, count] of Object.entries(grouped)) {
    console.log(`  ${file}: ${count}`);
  }
}
