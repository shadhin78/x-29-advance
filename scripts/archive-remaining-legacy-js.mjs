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

const remainingFiles = [
  'js/core/app.js',
  'js/core/metrics.js',
  'js/dev-server.js',
  'js/firebase.js',
  'js/services/auth.js',
  'js/shared/deletion.js',
  'js/shared/modals.js',
  'js/shared/sidebar.js',
  'js/utils/colors.js',
  'js/utils/dom.js',
  'js/utils.js'
];

console.log('================================================================');
console.log('  X-29 LEGACY STEP 004 — ARCHIVE REMAINING 11 LEGACY JS FILES    ');
console.log('================================================================\n');

let totalArchivedBytes = 0;
let successCount = 0;

for (const relPath of remainingFiles) {
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

console.log(`\nVerified ${successCount}/${remainingFiles.length} files (${(totalArchivedBytes / 1024).toFixed(1)} KB) copied to archive with matching SHA-256 checksums.`);

// Normalize internal imports inside archive/legacy-js/js/core/app.js
const archivedAppJs = path.join(ARCHIVE_BASE, 'js', 'core', 'app.js');
if (fs.existsSync(archivedAppJs)) {
  let content = fs.readFileSync(archivedAppJs, 'utf8');
  // Make all imports relative within archive/legacy-js
  content = content.replace(/import\s+['"].*?archive\/legacy-js\/js\/state\.js['"];?/, "import '../state.js';");
  content = content.replace(/import\s+['"].*?archive\/legacy-js\/js\/core\/rollover\.js['"];?/, "import './rollover.js';");
  content = content.replace(/import\s+['"].*?archive\/legacy-js\/shared\/services\/timerService\.js['"];?/, "import '../../shared/services/timerService.js';");
  content = content.replace(/import\s+['"].*?archive\/legacy-js\/router\/router\.js['"];?/, "import '../../router/router.js';");
  content = content.replace(/import\s+['"].*?archive\/legacy-js\/js\/features\/dashboard\/dashboard\.js['"];?/, "import '../features/dashboard/dashboard.js';");
  fs.writeFileSync(archivedAppJs, content, 'utf8');
  console.log('  ✓ Normalized import paths inside archive/legacy-js/js/core/app.js to self-contained archive relative paths.');
}

// Adjust ROOT_DIR in archive/legacy-js/js/dev-server.js
const archivedDevServer = path.join(ARCHIVE_BASE, 'js', 'dev-server.js');
if (fs.existsSync(archivedDevServer)) {
  let content = fs.readFileSync(archivedDevServer, 'utf8');
  content = content.replace("const ROOT_DIR = path.join(__dirname, '..');", "const ROOT_DIR = path.join(__dirname, '..', '..', '..');");
  fs.writeFileSync(archivedDevServer, content, 'utf8');
  console.log('  ✓ Adjusted ROOT_DIR in archive/legacy-js/js/dev-server.js to project root.');
}

// Update tests/*.test.js to point to archive/legacy-js/js/
const testsToUpdate = [
  'tests/app-core.test.js',
  'tests/auth-service.test.js',
  'tests/modals.test.js',
  'tests/tasks-metrics-dashboard.test.js',
  'tests/daily-targets.test.js',
  'tests/full-regression.test.js'
];

for (const t of testsToUpdate) {
  const tPath = path.join(ROOT_DIR, t);
  if (fs.existsSync(tPath)) {
    let tContent = fs.readFileSync(tPath, 'utf8');
    // Replace '../js/' with '../archive/legacy-js/js/'
    tContent = tContent.replace(/require\(['"]\.\.\/js\//g, "require('../archive/legacy-js/js/");
    // Replace fs.readFileSync('js/' with fs.readFileSync('archive/legacy-js/js/'
    tContent = tContent.replace(/fs\.readFileSync\(['"]js\//g, "fs.readFileSync('archive/legacy-js/js/");
    
    // Additional paths for full regression test
    if (t === 'tests/full-regression.test.js') {
      tContent = tContent.replace("fs.existsSync('router/router.js')", "fs.existsSync('archive/legacy-js/router/router.js')");
      tContent = tContent.replace("fs.readFileSync('shared/services/timerService.js'", "fs.readFileSync('archive/legacy-js/shared/services/timerService.js'");
      tContent = tContent.replace("fs.readFileSync('pages/Focus/Focus.js'", "fs.readFileSync('archive/legacy-js/pages/Focus/Focus.js'");
      tContent = tContent.replace("path.join('js/core', imp)", "path.join('archive/legacy-js/js/core', imp)");
      tContent = tContent.replace("const jsFiles = getFiles('./js');", "const jsFiles = getFiles('./archive/legacy-js/js');");
    }
    
    fs.writeFileSync(tPath, tContent, 'utf8');
    console.log(`  ✓ Updated test require/read paths in: ${t}`);
  }
}

// Unlink source files
console.log('\nUnlinking source files from active js/ directory:');
for (const relPath of remainingFiles) {
  const src = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(src)) {
    fs.unlinkSync(src);
    console.log(`  ✓ Unlinked: ${relPath}`);
  }
}

// Clean up empty directories recursively in js/
function cleanEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      cleanEmptyDirs(full);
    }
  }
  if (fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    console.log(`  ✓ Removed empty folder: ${path.relative(ROOT_DIR, dir)}/`);
  }
}

cleanEmptyDirs(path.join(ROOT_DIR, 'js'));

console.log('\n================================================================');
console.log('  LEGACY STEP 004 ARCHIVAL COMPLETE — JS/ DECOMMISSIONED        ');
console.log('================================================================\n');
