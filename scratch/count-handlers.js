const fs = require('fs');

function analyzeFile(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const html = fs.readFileSync(filePath, 'utf8');
    const regex = /\s(on[a-z]+)\s*=\s*(["'][^"']*["']|[^\s>]+)/gi;
    let match;
    const items = [];
    while ((match = regex.exec(html)) !== null) {
        // compute line number
        const line = html.substring(0, match.index).split('\n').length;
        items.push({
            file: filePath,
            line,
            event: match[1].toLowerCase(),
            handler: match[2]
        });
    }
    return items;
}

const indexItems = analyzeFile('index.html');
const loginItems = analyzeFile('login.html');
const all = [...indexItems, ...loginItems];

console.log('Total in index.html:', indexItems.length);
console.log('Total in login.html:', loginItems.length);

const eventCounts = {};
all.forEach(i => {
    eventCounts[i.event] = (eventCounts[i.event] || 0) + 1;
});
console.log('Event breakdown:', eventCounts);
