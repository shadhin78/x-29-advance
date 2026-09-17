const fs = require('fs');
const path = require('path');

const eventAttrs = ['onclick', 'ondblclick', 'onchange', 'onsubmit', 'oninput', 'onkeydown', 'onkeyup', 'onfocus', 'onblur', 'onmouseenter', 'onmouseleave'];
const regex = new RegExp(`\\b(${eventAttrs.join('|')})\\s*=`, 'gi');

function scanDir(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'scratch') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            results = results.concat(scanDir(full));
        } else if (e.isFile() && (e.name.endsWith('.html') || e.name.endsWith('.js'))) {
            const content = fs.readFileSync(full, 'utf8');
            let m;
            while ((m = regex.exec(content)) !== null) {
                const line = content.substring(0, m.index).split('\n').length;
                results.push({ file: full, line, attr: m[1].toLowerCase() });
            }
        }
    }
    return results;
}

const allMatches = scanDir('.');
console.log('Total matches across repo (HTML + JS):', allMatches.length);

const byExt = {};
allMatches.forEach(m => {
    const ext = path.extname(m.file);
    byExt[ext] = (byExt[ext] || 0) + 1;
});
console.log('By extension:', byExt);

const byFile = {};
allMatches.forEach(m => {
    byFile[m.file] = (byFile[m.file] || 0) + 1;
});
console.log('Top files:', Object.entries(byFile).sort((a,b) => b[1] - a[1]));
