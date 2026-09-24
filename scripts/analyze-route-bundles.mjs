import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function scanHtmlFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = scanHtmlFiles('.next/server/app');
console.log('================================================================================');
console.log('       X-29 ADVANCE — INITIAL CLIENT JAVASCRIPT PER ROUTE (STEP 025)           ');
console.log('================================================================================');
console.log('Route Target                        | Chunks | Raw Size  | Gzip Size | Target Status');
console.log('------------------------------------+--------+-----------+-----------+--------------');

let maxGzip = 0;
let routeCount = 0;

for (const htmlFile of htmlFiles) {
  const relPath = path.relative('.next/server/app', htmlFile).replace(/\\/g, '/').replace(/\.html$/, '');
  const html = fs.readFileSync(htmlFile, 'utf8');
  
  // Find all script tags referencing static chunks
  const scriptRegex = /src=["'](\/_next\/static\/chunks\/[^"']+\.js)["']/g;
  let match;
  const scripts = new Set();
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.add(match[1]);
  }
  
  let totalRaw = 0;
  let totalGzip = 0;
  const chunkDetails = [];
  for (const s of scripts) {
    const chunkRel = s.replace('/_next/', '');
    const chunkPath = path.join('.next', chunkRel);
    if (fs.existsSync(chunkPath)) {
      const buf = fs.readFileSync(chunkPath);
      const gz = zlib.gzipSync(buf).length;
      totalRaw += buf.length;
      totalGzip += gz;
      chunkDetails.push({ name: path.basename(chunkPath), raw: buf.length, gzip: gz, buf });
    }
  }
  
  const gzipKb = totalGzip / 1024;
  if (gzipKb > maxGzip) maxGzip = gzipKb;
  routeCount++;
  
  const status = gzipKb < 350 ? 'PASSED (<350KB)' : 'FAILED (>350KB)';
  console.log(
    `${relPath.padEnd(35)} | ${String(scripts.size).padStart(6)} | ${(totalRaw / 1024).toFixed(1).padStart(7)} KB | ${(totalGzip / 1024).toFixed(1).padStart(7)} KB | ${status}`
  );

  if (relPath === 'index' || relPath === 'login') {
    console.log(`\n--- Detailed Chunks for route: ${relPath} ---`);
    chunkDetails.sort((a,b) => b.gzip - a.gzip);
    for (const c of chunkDetails) {
      // Sample keywords
      const text = c.buf.toString('utf8', 0, 5000);
      let tag = 'unknown';
      if (text.includes('firestore') || text.includes('firebase')) tag = 'firebase';
      else if (text.includes('react-dom') || text.includes('createRoot')) tag = 'react-dom';
      else if (text.includes('lucide')) tag = 'lucide';
      else if (text.includes('idb') || text.includes('indexedDB')) tag = 'idb';
      else if (text.includes('zustand')) tag = 'zustand';
      else if (text.includes('next')) tag = 'next-framework';
      console.log(`    ${c.name.padEnd(30)} Raw: ${(c.raw/1024).toFixed(1).padStart(6)} KB | Gzip: ${(c.gzip/1024).toFixed(1).padStart(5)} KB | Likely: ${tag}`);
    }
    console.log('');
  }
}

console.log('------------------------------------+--------+-----------+-----------+--------------');
console.log(`Summary: Evaluated ${routeCount} routes. Peak route bundle: ${maxGzip.toFixed(1)} KB Gzip.`);
console.log('================================================================================\n');
