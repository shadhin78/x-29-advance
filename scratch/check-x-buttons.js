const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find all occurrences of the X svg or close icon in modals
const buttonRegex = /<button[^>]*>[\s\S]*?M6 18L18 6M6 6l12 12[\s\S]*?<\/button>/gi;
let match;
let count = 0;
while ((match = buttonRegex.exec(html)) !== null) {
    count++;
    const btnHtml = match[0];
    const hasDataModalClose = btnHtml.includes('data-modal-close');
    const hasAnyClose = /close/i.test(btnHtml);
    console.log(`Button ${count}: hasDataModalClose=${hasDataModalClose}, hasAnyClose=${hasAnyClose}`);
    console.log(btnHtml.substring(0, btnHtml.indexOf('>') + 1));
}
