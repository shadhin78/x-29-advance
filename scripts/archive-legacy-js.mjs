import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();
const ARCHIVE_DIR = path.join(ROOT_DIR, 'archive', 'legacy-js');

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyAndVerify(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  const srcHash = hashFile(src);
  const destHash = hashFile(dest);
  if (srcHash !== destHash) {
    throw new Error(`Checksum mismatch for ${src} -> ${dest}`);
  }
  const stat = fs.statSync(src);
  return stat.size;
}

function getFilesRecursively(dir, filterFn) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, filterFn));
    } else if (!filterFn || filterFn(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('=== X-29 STEP 023: Archiving Monolithic Legacy JavaScript Files ===\n');

// 1. Collect js/features files
const jsFeaturesFiles = getFilesRecursively(path.join(ROOT_DIR, 'js', 'features'), (p) => p.endsWith('.js'));
console.log(`Found ${jsFeaturesFiles.length} files in js/features/`);

// 2. Collect pages/*/*.js files
const pagesJsFiles = getFilesRecursively(path.join(ROOT_DIR, 'pages'), (p) => p.endsWith('.js'));
console.log(`Found ${pagesJsFiles.length} legacy .js files in pages/`);

// 3. Collect shared/services/timerService.js
const timerServicePath = path.join(ROOT_DIR, 'shared', 'services', 'timerService.js');
const sharedTimerFiles = fs.existsSync(timerServicePath) ? [timerServicePath] : [];
console.log(`Found ${sharedTimerFiles.length} shared timer service file(s)`);

const allFiles = [
  ...jsFeaturesFiles.map(p => ({
    src: p,
    rel: path.relative(ROOT_DIR, p),
    dest: path.join(ARCHIVE_DIR, path.relative(ROOT_DIR, p))
  })),
  ...pagesJsFiles.map(p => ({
    src: p,
    rel: path.relative(ROOT_DIR, p),
    dest: path.join(ARCHIVE_DIR, path.relative(ROOT_DIR, p))
  })),
  ...sharedTimerFiles.map(p => ({
    src: p,
    rel: path.relative(ROOT_DIR, p),
    dest: path.join(ARCHIVE_DIR, path.relative(ROOT_DIR, p))
  }))
];

console.log(`\nTotal files to archive: ${allFiles.length}`);

let totalBytes = 0;
for (const file of allFiles) {
  const size = copyAndVerify(file.src, file.dest);
  totalBytes += size;
}

console.log(`Successfully verified and copied ${allFiles.length} files (${(totalBytes / (1024 * 1024)).toFixed(2)} MB) to archive/legacy-js/`);

// Now delete source files
for (const file of allFiles) {
  fs.unlinkSync(file.src);
}
console.log(`Removed source files from active workspace.`);

// Clean up empty directories in js/features
function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      removeEmptyDirs(full);
    }
  }
  if (fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}

removeEmptyDirs(path.join(ROOT_DIR, 'js', 'features'));
console.log(`Cleaned up empty folders in js/features/`);

console.log('\n=== Archival Complete ===');
