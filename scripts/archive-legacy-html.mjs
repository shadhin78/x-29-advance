import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();
const ARCHIVE_HTML_DIR = path.join(ROOT_DIR, 'archive', 'legacy-html');
const ARCHIVE_JS_DIR = path.join(ROOT_DIR, 'archive', 'legacy-js');

// Ensure archive directories exist
fs.mkdirSync(ARCHIVE_HTML_DIR, { recursive: true });
fs.mkdirSync(path.join(ARCHIVE_JS_DIR, 'router'), { recursive: true });

function getHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

const filesToArchive = [
  {
    src: path.join(ROOT_DIR, 'index.html'),
    dests: [path.join(ARCHIVE_HTML_DIR, 'index.html')],
    name: 'index.html'
  },
  {
    src: path.join(ROOT_DIR, 'login.html'),
    dests: [path.join(ARCHIVE_HTML_DIR, 'login.html')],
    name: 'login.html'
  },
  {
    src: path.join(ROOT_DIR, 'router', 'router.js'),
    dests: [
      path.join(ARCHIVE_HTML_DIR, 'router.js'),
      path.join(ARCHIVE_JS_DIR, 'router', 'router.js')
    ],
    name: 'router/router.js'
  }
];

console.log('=== X-29 Advance — STEP 024 Legacy HTML & Shell Archival Engine ===\n');

let totalArchivedBytes = 0;
let archivedCount = 0;

for (const item of filesToArchive) {
  if (!fs.existsSync(item.src)) {
    console.warn(`[WARN] Source file not found: ${item.src}`);
    continue;
  }

  const srcSize = fs.statSync(item.src).size;
  const srcHash = getHash(item.src);
  console.log(`Auditing: ${item.name} (${srcSize} bytes) | SHA-256: ${srcHash}`);

  // Copy to all destinations
  for (const dest of item.dests) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(item.src, dest);
    const destHash = getHash(dest);
    if (srcHash !== destHash) {
      throw new Error(`Hash mismatch for ${item.name} -> ${dest}! Aborting.`);
    }
    console.log(`  ✓ Preserved at: ${path.relative(ROOT_DIR, dest)} (Hash verified)`);
  }

  // Safe to remove source file
  fs.unlinkSync(item.src);
  console.log(`  ✓ Safely unlinked source: ${item.name}`);

  totalArchivedBytes += srcSize;
  archivedCount++;
}

// Remove empty router directory if empty
const routerDir = path.join(ROOT_DIR, 'router');
if (fs.existsSync(routerDir)) {
  const contents = fs.readdirSync(routerDir);
  if (contents.length === 0) {
    fs.rmdirSync(routerDir);
    console.log(`  ✓ Removed empty directory: router/`);
  }
}

console.log(`\nArchival complete! ${archivedCount} files (${(totalArchivedBytes / 1024).toFixed(1)} KB) safely archived with SHA-256 parity verification.\n`);
