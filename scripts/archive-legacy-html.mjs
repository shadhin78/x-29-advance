import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();
const ARCHIVE_BASE = path.join(ROOT_DIR, 'archive', 'legacy-html');

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const htmlFiles = [
  'pages/Dashboard/Dashboard.html',
  'pages/Focus/Focus.html',
  'pages/Subjects/Subjects.html',
  'pages/Daily Actions/Daily Actions.html',
  'pages/Daily Actions/monthly target setup/monthly target setup.html',
  'pages/Daily Schedule/Daily Schedule.html',
  'pages/Pace Management/Pace Management.html',
  'pages/Outcome/Outcome.html',
  'pages/Exam Routine/Exam Routine.html',
  'pages/Master Config/Master Config.html',
  'pages/Analytics/Analytics.html'
];

const cssFilesToPreserve = [
  'pages/Dashboard/Dashboard.css',
  'pages/Focus/Focus.css',
  'pages/Subjects/Subjects.css',
  'pages/Daily Actions/Daily Actions.css',
  'pages/Daily Actions/monthly target setup/monthly target setup.css',
  'pages/Daily Schedule/Daily Schedule.css',
  'pages/Pace Management/Pace Management.css',
  'pages/Outcome/Outcome.css',
  'pages/Exam Routine/Exam Routine.css',
  'pages/Master Config/Master Config.css',
  'pages/Analytics/Analytics.css'
];

console.log('================================================================');
console.log('  X-29 LEGACY STEP 005 — ARCHIVE INACTIVE LEGACY HTML TEMPLATES  ');
console.log('================================================================\n');

let totalArchivedBytes = 0;
let successCount = 0;

for (const relPath of htmlFiles) {
  const src = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(src)) {
    console.warn(`[WARN] Source HTML not found: ${relPath}`);
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

console.log(`\nVerified ${successCount}/${htmlFiles.length} HTML files (${(totalArchivedBytes / 1024).toFixed(1)} KB) copied to archive with matching SHA-256 checksums.`);

// Unlink source HTML files
console.log('\nUnlinking source HTML files from pages/ directory:');
for (const relPath of htmlFiles) {
  const src = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(src)) {
    fs.unlinkSync(src);
    console.log(`  ✓ Unlinked: ${relPath}`);
  }
}

// Safety check: verify all active CSS files are completely intact
console.log('\nSafety Check: Verifying 11 active CSS stylesheets remain intact in pages/:');
let cssIntactCount = 0;
for (const relCss of cssFilesToPreserve) {
  const cssPath = path.join(ROOT_DIR, relCss);
  if (fs.existsSync(cssPath)) {
    const size = fs.statSync(cssPath).size;
    console.log(`  ✓ Intact: ${relCss} (${size.toLocaleString()} bytes)`);
    cssIntactCount++;
  } else {
    throw new Error(`CRITICAL ERROR: Active CSS file was removed or missing: ${relCss}!`);
  }
}

if (cssIntactCount !== cssFilesToPreserve.length) {
  throw new Error(`CSS count mismatch! Expected ${cssFilesToPreserve.length}, found ${cssIntactCount}`);
}

console.log('\n================================================================');
console.log('  LEGACY STEP 005 COMPLETE — ALL 11 HTML FILES ARCHIVED SAFELY  ');
console.log('================================================================\n');
