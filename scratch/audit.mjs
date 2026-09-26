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

console.log('=== PAGES/ DIRECTORY ===');
const pagesFiles = all.filter(f => f.relPath.startsWith('pages/'));
pagesFiles.forEach(f => console.log(`${f.relPath} | ${f.size} bytes`));

console.log('\n=== JS/ DIRECTORY ===');
const jsFiles = all.filter(f => f.relPath.startsWith('js/'));
jsFiles.forEach(f => console.log(`${f.relPath} | ${f.size} bytes`));

console.log('\n=== CSS/ DIRECTORY ===');
const cssFiles = all.filter(f => f.relPath.startsWith('css/'));
cssFiles.forEach(f => console.log(`${f.relPath} | ${f.size} bytes`));

console.log('\n=== API/ DIRECTORY ===');
const apiFiles = all.filter(f => f.relPath.startsWith('api/'));
apiFiles.forEach(f => console.log(`${f.relPath} | ${f.size} bytes`));

console.log('\n=== ARCHIVE/ DIRECTORY ===');
const archiveFiles = all.filter(f => f.relPath.startsWith('archive/'));
archiveFiles.forEach(f => console.log(`${f.relPath} | ${f.size} bytes`));

console.log('\n=== ROOT MISC ===');
const rootMisc = all.filter(f => !f.relPath.includes('/'));
rootMisc.forEach(f => console.log(`${f.relPath} | ${f.size} bytes`));
