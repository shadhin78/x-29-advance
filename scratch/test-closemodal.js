const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const regex = /<([^>]+onclick=["'](?:window\.)?closeModal\([^>]+)>/g;
let m;
let count = 0;
let backdrops = 0;
let buttons = 0;
while ((m = regex.exec(html)) !== null) {
    count++;
    const tag = m[1];
    const isBackdrop = tag.includes('-backdrop');
    if (isBackdrop) backdrops++;
    else buttons++;
    const id = tag.match(/id=["']([^"']+)["']/)?.[1] || 'NO-ID';
    const modalTarget = m[0].match(/closeModal\(['"]([^'"]+)['"]\)/)?.[1] || '';
    console.log(`${count}: ${isBackdrop ? 'BACKDROP' : 'BUTTON  '} | ID: ${id.padEnd(30)} | Target: ${modalTarget}`);
}
console.log(`Total: ${count}, Backdrops: ${backdrops}, Buttons: ${buttons}`);
