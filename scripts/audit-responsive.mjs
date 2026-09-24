import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const DIRS_TO_SCAN = ['components', 'features', 'app'];

const findings = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check 1: Fixed large widths in tailwind like w-[400px], w-[500px], min-w-[500px]
    const fixedWidthMatches = line.match(/(min-w|w)-\[(\d+)px\]/g);
    if (fixedWidthMatches) {
      fixedWidthMatches.forEach(match => {
        const numMatch = match.match(/\d+/);
        if (numMatch && parseInt(numMatch[0], 10) > 340) {
          findings.push({
            file: path.relative(ROOT_DIR, filePath),
            lineNum,
            type: 'LARGE_FIXED_WIDTH',
            match,
            content: line.trim()
          });
        }
      });
    }

    // Check 2: Fixed pixel margins or paddings that might overflow 360px
    const largePadMatches = line.match(/(p|px|py|m|mx|my)-\[(\d+)px\]/g);
    if (largePadMatches) {
      largePadMatches.forEach(match => {
        const numMatch = match.match(/\d+/);
        if (numMatch && parseInt(numMatch[0], 10) > 80) {
          findings.push({
            file: path.relative(ROOT_DIR, filePath),
            lineNum,
            type: 'LARGE_FIXED_PADDING_MARGIN',
            match,
            content: line.trim()
          });
        }
      });
    }

    // Check 3: Raw tables without overflow-x-auto parent in close proximity
    if (line.includes('<table') && !content.includes('overflow-x-auto')) {
      findings.push({
        file: path.relative(ROOT_DIR, filePath),
        lineNum,
        type: 'TABLE_WITHOUT_OVERFLOW',
        match: '<table',
        content: line.trim()
      });
    }

    // Check 4: grid-cols-X on base class without responsive sm/md prefixes
    const baseMultiColGrid = line.match(/className="[^"]*\bgrid-cols-(?:[3-9]|1[0-2])\b[^"]*"/);
    if (baseMultiColGrid && !baseMultiColGrid[0].includes('grid-cols-1') && !baseMultiColGrid[0].includes('grid-cols-2')) {
      // If it has grid-cols-3 directly on mobile without sm: or md: override
      const classStr = baseMultiColGrid[0];
      const hasResponsiveCols = /grid-cols-1\s+(?:sm|md|lg):grid-cols-/.test(classStr);
      if (!hasResponsiveCols) {
        findings.push({
          file: path.relative(ROOT_DIR, filePath),
          lineNum,
          type: 'MOBILE_MULTI_COL_GRID',
          match: baseMultiColGrid[0],
          content: line.trim()
        });
      }
    }
  });
}

function walkDir(dir) {
  const fullPath = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(fullPath)) return;

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      walkDir(path.relative(ROOT_DIR, entryPath));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      scanFile(entryPath);
    }
  }
}

DIRS_TO_SCAN.forEach(walkDir);

console.log(`Scan completed. Found ${findings.length} potential responsive items.\n`);

const byType = {};
findings.forEach(f => {
  byType[f.type] = byType[f.type] || [];
  byType[f.type].push(f);
});

for (const [type, items] of Object.entries(byType)) {
  console.log(`=== ${type} (${items.length} occurrences) ===`);
  items.slice(0, 15).forEach(item => {
    console.log(`  [${item.file}:${item.lineNum}] ${item.match}`);
    console.log(`    Line: ${item.content.substring(0, 100)}`);
  });
  if (items.length > 15) {
    console.log(`  ... and ${items.length - 15} more`);
  }
  console.log();
}
