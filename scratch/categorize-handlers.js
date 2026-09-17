const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const regex = /\s(on[a-z]+)\s*=\s*(["'][^"']*["']|[^\s>]+)/gi;
let match;
const items = [];
while ((match = regex.exec(html)) !== null) {
    const line = html.substring(0, match.index).split('\n').length;
    // get surrounding tag snippet
    const tagStart = html.lastIndexOf('<', match.index);
    const tagEnd = html.indexOf('>', match.index);
    const tagSnippet = html.substring(tagStart, tagEnd + 1);
    
    // find id or class or text
    const idMatch = tagSnippet.match(/id\s*=\s*["']([^"']+)["']/i);
    const id = idMatch ? idMatch[1] : null;

    items.push({
        line,
        event: match[1].toLowerCase(),
        handler: match[2].replace(/^["']|["']$/g, ''),
        id,
        tag: tagSnippet.substring(0, 100)
    });
}

console.log('Total items:', items.length);
// Group by function or category
const groups = {};
items.forEach(it => {
    const fnMatch = it.handler.match(/^(?:window\.)?([a-zA-Z0-9_$]+)/);
    const fn = fnMatch ? fnMatch[1] : it.handler;
    groups[fn] = groups[fn] || [];
    groups[fn].push(it);
});

console.log('Unique functions in handlers:', Object.keys(groups).length);
Object.entries(groups).sort((a,b) => b[1].length - a[1].length).forEach(([fn, list]) => {
    console.log(`${fn} (${list.length}x) [ids: ${list.map(x => x.id || 'NO_ID').join(', ')}]`);
});
