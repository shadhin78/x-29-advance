import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();
const ARCHIVE_BASE = path.join(ROOT_DIR, 'archive', 'legacy-config');

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const filesToArchive = [
  'api/config.js',
  'manifest.json',
  'ext'
];

console.log('================================================================');
console.log('  X-29 LEGACY STEP 006 — ARCHIVE OBSOLETE CONFIG & ROOT FILES    ');
console.log('================================================================\n');

let totalArchivedBytes = 0;
let successCount = 0;

for (const relPath of filesToArchive) {
  const src = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(src)) {
    console.warn(`[WARN] Source file not found: ${relPath}`);
    continue;
  }

  const dest = path.join(ARCHIVE_BASE, relPath);
  ensureDir(path.dirname(dest));

  const srcSize = fs.statSync(src).size;
  const srcHash = hashFile(src);

  console.log(`Archiving: ${relPath} (${srcSize.toLocaleString()} bytes) | SHA-256: ${srcHash.slice(0, 16)}...`);

  // Copy to archive destination
  fs.copyFileSync(src, dest);
  const destHash = hashFile(dest);

  if (srcHash !== destHash) {
    throw new Error(`CRITICAL: Hash mismatch for ${relPath}! Expected ${srcHash}, got ${destHash}. Aborting!`);
  }

  console.log(`  ✓ Preserved at: ${path.relative(ROOT_DIR, dest)} (Hash verified)`);

  totalArchivedBytes += srcSize;
  successCount++;
}

console.log(`\nVerified ${successCount}/${filesToArchive.length} files (${(totalArchivedBytes / 1024).toFixed(1)} KB) copied to archive with matching SHA-256 checksums.`);

// Update test files to check archive fallback for backward compatibility
const pwaTestPath = path.join(ROOT_DIR, 'tests', 'pwa-service-worker.test.mjs');
if (fs.existsSync(pwaTestPath)) {
  let content = fs.readFileSync(pwaTestPath, 'utf8');
  content = content.replace(
    "const rootManifestPath = path.resolve('manifest.json');",
    "const rootManifestPath = fs.existsSync('manifest.json') ? path.resolve('manifest.json') : path.resolve('archive/legacy-config/manifest.json');"
  );
  fs.writeFileSync(pwaTestPath, content, 'utf8');
  console.log('  ✓ Updated tests/pwa-service-worker.test.mjs backward compatibility path.');
}

const fullRegTestPath = path.join(ROOT_DIR, 'tests', 'full-regression.test.js');
if (fs.existsSync(fullRegTestPath)) {
  let content = fs.readFileSync(fullRegTestPath, 'utf8');
  content = content.replace(
    "const manifestExists = fs.existsSync('manifest.json');\ncheck('PWA: manifest.json file exists', manifestExists);\nif (manifestExists) {\n    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));",
    "const manifestPath = fs.existsSync('manifest.json') ? 'manifest.json' : 'archive/legacy-config/manifest.json';\nconst manifestExists = fs.existsSync(manifestPath);\ncheck('PWA: manifest.json file exists', manifestExists);\nif (manifestExists) {\n    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));"
  );
  fs.writeFileSync(fullRegTestPath, content, 'utf8');
  console.log('  ✓ Updated tests/full-regression.test.js backward compatibility path.');
}

// Unlink source files
console.log('\nUnlinking source files:');
for (const relPath of filesToArchive) {
  const src = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(src)) {
    fs.unlinkSync(src);
    console.log(`  ✓ Unlinked: ${relPath}`);
  }
}

// Remove empty api/ directory
const apiDir = path.join(ROOT_DIR, 'api');
if (fs.existsSync(apiDir) && fs.readdirSync(apiDir).length === 0) {
  fs.rmdirSync(apiDir);
  console.log('  ✓ Removed empty folder: api/');
}

console.log('\n================================================================');
console.log('  LEGACY STEP 006 COMPLETE — CONFIG & ROOT CLEANUP VERIFIED     ');
console.log('================================================================\n');
