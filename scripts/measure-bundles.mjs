import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function scanDir(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) files = files.concat(scanDir(full));
    else if (f.endsWith('.js')) files.push(full);
  });
  return files;
}

const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks');
if (fs.existsSync(chunksDir)) {
  const files = scanDir(chunksDir);
  console.log('=== X-29 Advance — Client Bundle Size & Chunk Analysis ===\n');
  console.log('Total JS files in .next/static/chunks:', files.length);
  let totalRaw = 0;
  let totalGzip = 0;
  const list = files.map(f => {
    const content = fs.readFileSync(f);
    const gzipped = zlib.gzipSync(content);
    totalRaw += content.length;
    totalGzip += gzipped.length;
    return { name: path.relative(chunksDir, f), raw: content.length, gzip: gzipped.length };
  });
  list.sort((a,b) => b.gzip - a.gzip);
  console.log('\nTop 15 largest individual client chunks:');
  list.slice(0, 15).forEach(c => {
    console.log(`  ${c.name.padEnd(55)} Raw: ${(c.raw/1024).toFixed(1).padStart(7)} KB | Gzip: ${(c.gzip/1024).toFixed(1).padStart(6)} KB`);
  });
  console.log('\nTotal Client JS across all chunks (Raw):  ' + (totalRaw/1024).toFixed(1) + ' KB');
  console.log('Total Client JS across all chunks (Gzip): ' + (totalGzip/1024).toFixed(1) + ' KB');

  // Route breakdown from app-build-manifest.json
  const manifestPath = path.join(process.cwd(), '.next', 'app-build-manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('\nPer-Route First Load Client JS (App Router):');
    for (const [route, chunks] of Object.entries(manifest.pages)) {
      let raw = 0;
      let gzip = 0;
      for (const c of chunks) {
        const chunkPath = path.join(process.cwd(), '.next', c);
        if (fs.existsSync(chunkPath)) {
          const buf = fs.readFileSync(chunkPath);
          raw += buf.length;
          gzip += zlib.gzipSync(buf).length;
        }
      }
      console.log(`  ${route.padEnd(45)} Chunks: ${String(chunks.length).padStart(2)} | Raw: ${(raw/1024).toFixed(1).padStart(6)} KB | Gzip: ${(gzip/1024).toFixed(1).padStart(5)} KB`);
    }
  }
} else {
  console.log('.next/static/chunks does not exist');
}
