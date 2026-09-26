import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();
const ARCHIVE_BASE = path.join(ROOT_DIR, 'archive', 'legacy-js');

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
  'js/core/rollover.js',
  'js/core/scheduleSlot.js',
  'js/core/state.js',
  'js/pages/login/login.js',
  'js/services/backup.js',
  'js/services/firebase.js',
  'js/services/taxonomy.js',
  'js/shared/audio.js',
  'js/shared/confetti.js',
  'js/shared/toast.js',
  'js/state.js',
  'js/utils/date.js',
  'js/utils/format.js',
  'js/utils/id.js',
  'js/utils/sanitize.js',
  'js/utils/storage.js'
];

console.log('================================================================');
console.log('  X-29 LEGACY STEP 003 — ARCHIVE UNREFERENCED LEGACY JS         ');
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

  console.log(`Archiving: ${relPath} (${srcSize} bytes) | SHA-256: ${srcHash.slice(0, 16)}...`);

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

// Update js/core/app.js to point to archived paths for state.js and rollover.js
const appJsPath = path.join(ROOT_DIR, 'js', 'core', 'app.js');
if (fs.existsSync(appJsPath)) {
  let appJsContent = fs.readFileSync(appJsPath, 'utf8');
  appJsContent = appJsContent.replace("import '../state.js';", "import '../../archive/legacy-js/js/state.js';");
  appJsContent = appJsContent.replace("import './rollover.js';", "import '../../archive/legacy-js/js/core/rollover.js';");
  fs.writeFileSync(appJsPath, appJsContent, 'utf8');
  console.log('  ✓ Updated js/core/app.js imports for state.js and rollover.js to point to archive/legacy-js/');
}

// Unlink source files
console.log('\nUnlinking source files from active js/ directory:');
for (const relPath of filesToArchive) {
  const src = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(src)) {
    fs.unlinkSync(src);
    console.log(`  ✓ Unlinked: ${relPath}`);
  }
}

// Clean up empty directories
function cleanEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      cleanEmptyDirs(full);
    }
  }
  if (fs.readdirSync(dir).length === 0 && dir !== path.join(ROOT_DIR, 'js')) {
    fs.rmdirSync(dir);
    console.log(`  ✓ Removed empty folder: ${path.relative(ROOT_DIR, dir)}`);
  }
}

cleanEmptyDirs(path.join(ROOT_DIR, 'js', 'pages'));
cleanEmptyDirs(path.join(ROOT_DIR, 'js'));

console.log('\n================================================================');
console.log('  LEGACY STEP 003 ARCHIVAL ENGINE COMPLETE                      ');
console.log('================================================================\n');
