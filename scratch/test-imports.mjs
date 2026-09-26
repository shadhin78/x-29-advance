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
const nonModern = all.filter(f => f.relPath.startsWith('tests/') || f.relPath.startsWith('scripts/'));

const importRegexes = [
  /import\s+.*?\s+from\s+['"](.*?)['"]/g,
  /import\s*\(\s*['"](.*?)['"]\s*\)/g,
  /require\s*\(\s*['"](.*?)['"]\s*\)/g
];

console.log('=== IMPORTS IN TESTS/ AND SCRIPTS/ ===');
for (const f of nonModern) {
  const content = fs.readFileSync(f.path, 'utf8');
  const fileImports = [];
  for (const re of importRegexes) {
    let match;
    while ((match = re.exec(content)) !== null) {
      fileImports.push(match[1]);
    }
  }
  
  const legacyImports = fileImports.filter(imp => 
    imp.includes('js/') || imp.includes('pages/') || imp.includes('css/') || imp.includes('state') || imp.includes('firebase')
  );
  if (legacyImports.length > 0) {
    console.log(`\nFILE: ${f.relPath}`);
    legacyImports.forEach(imp => console.log(`  -> ${imp}`));
  }
}
