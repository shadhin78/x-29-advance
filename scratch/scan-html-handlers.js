const fs = require('fs');
const path = require('path');

const eventAttrs = ['onclick', 'ondblclick', 'onchange', 'onsubmit', 'oninput', 'onkeydown', 'onkeyup', 'onfocus', 'onblur', 'onmouseenter', 'onmouseleave'];
const regex = new RegExp(`\\s(${eventAttrs.join('|')})\\s*=`, 'gi');

function scanHtml(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'scratch' || e.name === 'archive') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            results = results.concat(scanHtml(full));
        } else if (e.isFile() && e.name.endsWith('.html')) {
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

const list = scanHtml('.');
console.log('Total inline event handlers across active HTML files:', list.length);
const byFile = {};
list.forEach(item => {
    byFile[item.file] = (byFile[item.file] || 0) + 1;
});
console.log('Breakdown by HTML file:', byFile);
