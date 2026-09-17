const fs = require('fs');
const path = require('path');

function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'archive') {
                walkDir(filePath, fileList);
            }
        } else if (file.endsWith('.js') && !filePath.includes('tests') && !filePath.includes('scratch')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const jsFiles = walkDir('.');
let total = 0;
const results = {};

jsFiles.forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    const regex = /\s(on[a-z]+)\s*=\s*(["'][^"']*["']|[^\s>]+)/gi;
    let match;
    let count = 0;
    while ((match = regex.exec(code)) !== null) {
        count++;
        total++;
    }
    if (count > 0) {
        results[f] = count;
    }
});

console.log('Total inline handlers in JS files:', total);
console.log('Files with inline handlers:', results);
