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

// Extract all import/require/css-import statements in modern codebase
const modernFiles = all.filter(f => 
  f.relPath.startsWith('app/') ||
  f.relPath.startsWith('components/') ||
  f.relPath.startsWith('features/') ||
  f.relPath.startsWith('stores/') ||
  f.relPath.startsWith('lib/') ||
  f.relPath.startsWith('services/') ||
  f.relPath.startsWith('hooks/') ||
  f.relPath.startsWith('types/') ||
  f.relPath.startsWith('public/') ||
  ['next.config.ts', 'tsconfig.json', 'vercel.json', 'package.json'].includes(f.relPath)
);

const importRegexes = [
  /import\s+.*?\s+from\s+['"](.*?)['"]/g,
  /import\s*\(\s*['"](.*?)['"]\s*\)/g,
  /require\s*\(\s*['"](.*?)['"]\s*\)/g,
  /@import\s+['"](.*?)['"]/g,
  /fetch\s*\(\s*['"](.*?)['"]/g
];

const importedTargets = new Map();

for (const mf of modernFiles) {
  const content = fs.readFileSync(mf.path, 'utf8');
  for (const re of importRegexes) {
    let match;
    while ((match = re.exec(content)) !== null) {
      const impPath = match[1];
      if (!importedTargets.has(impPath)) {
        importedTargets.set(impPath, []);
      }
      importedTargets.get(impPath).push(mf.relPath);
    }
  }
}

console.log('=== MODERN CODE IMPORTS MATCHING LEGACY PATHS ===');
for (const [imp, sources] of importedTargets.entries()) {
  if (imp.includes('pages/') || imp.includes('css/') || imp.includes('js/') || imp.includes('api/') || imp.endsWith('.html')) {
    console.log(`IMPORT: "${imp}"`);
    console.log(`  Imported by: ${sources.join(', ')}`);
  }
}
