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

// Legacy files to audit
const legacyPagesHtml = all.filter(f => f.relPath.startsWith('pages/') && f.relPath.endsWith('.html'));
const legacyPagesCss = all.filter(f => f.relPath.startsWith('pages/') && f.relPath.endsWith('.css'));
const legacyCss = all.filter(f => f.relPath.startsWith('css/'));
const legacyJs = all.filter(f => f.relPath.startsWith('js/'));
const legacyApi = all.filter(f => f.relPath.startsWith('api/'));
const rootManifest = all.find(f => f.relPath === 'manifest.json');
const rootExt = all.find(f => f.relPath === 'ext');

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

const testFiles = all.filter(f => f.relPath.startsWith('tests/'));
const scriptFiles = all.filter(f => f.relPath.startsWith('scripts/'));

function findImportsInFiles(targetPattern, fileList) {
  const matches = [];
  for (const file of fileList) {
    const content = fs.readFileSync(file.path, 'utf8');
    if (content.includes(targetPattern)) {
      matches.push(file.relPath);
    }
  }
  return matches;
}

console.log('=== 1. AUDITING LEGACY CSS (pages/*/*.css and css/*.css) ===');
const allLegacyCss = [...legacyPagesCss, ...legacyCss];
for (const cssFile of allLegacyCss) {
  const inModern = findImportsInFiles(cssFile.relPath, modernFiles);
  // Also check relative import paths like ../pages/... or ./style.css or ../css/style.css
  const simpleName = path.basename(cssFile.relPath);
  const inModernByBase = findImportsInFiles(simpleName, modernFiles);
  console.log(`[CSS] ${cssFile.relPath} (${cssFile.size}B):`);
  console.log(`  Imported by modern: ${[...new Set([...inModern, ...inModernByBase])].join(', ') || 'NONE'}`);
}

console.log('\n=== 2. AUDITING LEGACY HTML (pages/*/*.html) ===');
for (const htmlFile of legacyPagesHtml) {
  const inModern = findImportsInFiles(htmlFile.relPath, modernFiles);
  const baseName = path.basename(htmlFile.relPath);
  const inModernByBase = findImportsInFiles(baseName, modernFiles);
  console.log(`[HTML] ${htmlFile.relPath} (${htmlFile.size}B):`);
  console.log(`  Referenced in modern: ${[...new Set([...inModern, ...inModernByBase])].join(', ') || 'NONE'}`);
  const inTests = findImportsInFiles(htmlFile.relPath, testFiles);
  const inScripts = findImportsInFiles(htmlFile.relPath, scriptFiles);
  console.log(`  Referenced in tests: ${inTests.join(', ') || 'NONE'} | scripts: ${inScripts.join(', ') || 'NONE'}`);
}

console.log('\n=== 3. AUDITING LEGACY JS (js/**/*.js) ===');
for (const jsFile of legacyJs) {
  const inModern = findImportsInFiles(jsFile.relPath, modernFiles);
  const baseName = path.basename(jsFile.relPath);
  // Also check without .js extension
  const relNoExt = jsFile.relPath.replace(/\.js$/, '');
  const inModernNoExt = findImportsInFiles(relNoExt, modernFiles);
  
  const inTests = findImportsInFiles(jsFile.relPath, testFiles);
  const inTestsNoExt = findImportsInFiles(relNoExt, testFiles);
  
  const inScripts = findImportsInFiles(jsFile.relPath, scriptFiles);
  
  const totalModern = [...new Set([...inModern, ...inModernNoExt])];
  const totalTests = [...new Set([...inTests, ...inTestsNoExt])];

  console.log(`[JS] ${jsFile.relPath} (${jsFile.size}B):`);
  console.log(`  Modern refs: ${totalModern.join(', ') || 'NONE'}`);
  console.log(`  Tests refs:  ${totalTests.join(', ') || 'NONE'}`);
  console.log(`  Scripts refs: ${inScripts.join(', ') || 'NONE'}`);
}

console.log('\n=== 4. AUDITING API & ROOT FILES ===');
console.log(`[API] api/config.js:`);
console.log(`  Modern refs: ${findImportsInFiles('api/config', modernFiles).join(', ') || 'NONE'}`);
console.log(`  Vercel json: ${fs.readFileSync('vercel.json', 'utf8').includes('api/config') ? 'YES' : 'NO'}`);

console.log(`[MANIFEST] Root manifest.json vs public/manifest.json:`);
const layoutContent = fs.readFileSync('app/layout.tsx', 'utf8');
console.log(`  app/layout.tsx manifest ref: ${layoutContent.includes('/manifest.json') ? '/manifest.json (served from public/)' : 'none'}`);

console.log(`[EXT] ext file:`);
console.log(`  Size: ${rootExt ? rootExt.size : 0} bytes`);
