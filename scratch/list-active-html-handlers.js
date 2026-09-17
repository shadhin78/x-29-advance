const fs = require('fs');

const files = [
    'index.html',
    'pages/Focus/Focus.html',
    'pages/Master Config/Master Config.html',
    'pages/Subjects/Subjects.html'
];

files.forEach(file => {
    const html = fs.readFileSync(file, 'utf8');
    const regex = /\s(on[a-z]+)\s*=\s*(["'][^"']*["']|[^\s>]+)/gi;
    let match;
    console.log(`\n=== File: ${file} ===`);
    while ((match = regex.exec(html)) !== null) {
        const line = html.substring(0, match.index).split('\n').length;
        const tagStart = html.lastIndexOf('<', match.index);
        const tagEnd = html.indexOf('>', match.index);
        const tagSnippet = html.substring(tagStart, tagEnd + 1);
        const idMatch = tagSnippet.match(/id\s*=\s*["']([^"']+)["']/i);
        const id = idMatch ? idMatch[1] : 'NO_ID';
        console.log(`L${line} [${match[1]}][id:${id}]: ${match[2]}`);
    }
});
