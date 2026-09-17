const fs = require('fs');
const path = require('path');

function checkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            if (f !== 'node_modules' && f !== '.git') checkDir(full);
        } else if (f.endsWith('.js')) {
            const content = fs.readFileSync(full, 'utf8');
            // Does this file define global or have an IIFE with (function(global) or const global?
            const hasGlobalDef = /function\s*\([^)]*\bglobal\b/.test(content) || /(?:var|let|const)\s+global\b/.test(content);
            if (!hasGlobalDef) {
                const lines = content.split('\n');
                lines.forEach((line, idx) => {
                    if (/\bglobal\./.test(line) && !/typeof\s+global/.test(line)) {
                        console.log(`${full}:${idx + 1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

checkDir('js');
checkDir('pages');
checkDir('router');
