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

// Target groups of legacy files
const legacyFiles = [
  ...all.filter(f => f.relPath.startsWith('pages/')),
  ...all.filter(f => f.relPath.startsWith('js/')),
  ...all.filter(f => f.relPath.startsWith('css/')),
  ...all.filter(f => f.relPath.startsWith('api/')),
  ...all.filter(f => ['manifest.json', 'ext'].includes(f.relPath))
];

// Modern codebase files
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

// All searchable files (including tests and scripts)
const allSearchable = all.filter(f => 
  !f.relPath.startsWith('archive/') &&
  !f.relPath.startsWith('scratch/')
);

console.log(`Auditing ${legacyFiles.length} legacy candidate files...`);
console.log(`Checking against ${modernFiles.length} modern files and ${allSearchable.length} total active files.`);

// Preload file contents
const modernContents = modernFiles.map(f => ({
  relPath: f.relPath,
  content: fs.readFileSync(f.path, 'utf8')
}));

const allContents = allSearchable.map(f => ({
  relPath: f.relPath,
  content: fs.readFileSync(f.path, 'utf8')
}));

const report = [];

for (const leg of legacyFiles) {
  const baseName = path.basename(leg.relPath);
  const relNoExt = leg.relPath.replace(/\.[^/.]+$/, "");
  const baseNoExt = baseName.replace(/\.[^/.]+$/, "");
  
  // Specific search patterns
  const exactRel = leg.relPath;
  
  const modernRefs = [];
  const otherRefs = [];

  for (const m of modernContents) {
    if (m.relPath === leg.relPath) continue;
    // Check if modern file mentions this legacy path or filename
    if (m.content.includes(exactRel) || 
        m.content.includes(leg.relPath.replace(/\s+/g, '%20')) ||
        (baseName.endsWith('.css') && m.content.includes(baseName)) ||
        (m.content.includes(`/${baseName}`) || m.content.includes(`"${baseName}"`) || m.content.includes(`'${baseName}'`))) {
      modernRefs.push(m.relPath);
    }
  }

  for (const a of allContents) {
    if (a.relPath === leg.relPath) continue;
    if (modernRefs.includes(a.relPath)) continue;
    if (a.content.includes(exactRel) || 
        a.content.includes(leg.relPath.replace(/\s+/g, '%20')) ||
        (baseName.endsWith('.css') && a.content.includes(baseName)) ||
        (a.content.includes(`/${baseName}`) || a.content.includes(`"${baseName}"`) || a.content.includes(`'${baseName}'`))) {
      otherRefs.push(a.relPath);
    }
  }

  report.push({
    file: leg.relPath,
    size: leg.size,
    modernRefs,
    otherRefs
  });
}

// Print results by sub-group
console.log('\n================ LEGACY CSS FILES ================');
report.filter(r => r.file.endsWith('.css')).forEach(r => {
  console.log(`FILE: ${r.file} (${r.size}B)`);
  console.log(`  Modern refs: ${r.modernRefs.join(', ') || 'NONE'}`);
  console.log(`  Other refs:  ${r.otherRefs.join(', ') || 'NONE'}`);
});

console.log('\n================ LEGACY HTML FILES ================');
report.filter(r => r.file.endsWith('.html')).forEach(r => {
  console.log(`FILE: ${r.file} (${r.size}B)`);
  console.log(`  Modern refs: ${r.modernRefs.join(', ') || 'NONE'}`);
  console.log(`  Other refs:  ${r.otherRefs.join(', ') || 'NONE'}`);
});

console.log('\n================ LEGACY JS FILES (in js/) ================');
report.filter(r => r.file.startsWith('js/')).forEach(r => {
  console.log(`FILE: ${r.file} (${r.size}B)`);
  console.log(`  Modern refs: ${r.modernRefs.join(', ') || 'NONE'}`);
  console.log(`  Other refs:  ${r.otherRefs.join(', ') || 'NONE'}`);
});

console.log('\n================ API & ROOT FILES ================');
report.filter(r => r.file.startsWith('api/') || !r.file.includes('/')).forEach(r => {
  console.log(`FILE: ${r.file} (${r.size}B)`);
  console.log(`  Modern refs: ${r.modernRefs.join(', ') || 'NONE'}`);
  console.log(`  Other refs:  ${r.otherRefs.join(', ') || 'NONE'}`);
});
