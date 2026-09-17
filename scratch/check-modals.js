const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const modalsJs = fs.readFileSync('js/shared/modals.js', 'utf8');

const modalRegex = /<div\s+[^>]*id=["']([^"']*-modal)["']/gi;
let m;
const modals = [];
while ((m = modalRegex.exec(html)) !== null) {
    modals.push(m[1]);
}
console.log('Total modals found in index.html:', modals.length);

modals.forEach(id => {
    const inBackdrops = modalsJs.includes(`'${id}':`);
    // Extract modal block
    const idx = html.indexOf(`id="${id}"`);
    const slice = html.slice(idx, idx + 800);
    const hasCloseBtn = slice.includes('data-modal-close') || slice.includes('btn-modal-close') || slice.includes('closeModal') || slice.includes('close');
    console.log(`${id} | in MODAL_BACKDROPS: ${inBackdrops} | hasCloseRef: ${hasCloseBtn}`);
});
