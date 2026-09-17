const fs = require('fs');

const path = 'C:/Users/ratul/.gemini/antigravity-ide/brain/ba62847d-8782-4a0c-aec0-3b770e77bb6f/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.content && obj.content.includes('capture_browser_console_logs')) {
            const matches = obj.content.match(/capture_browser_console_logs[\s\S]*?(?:Status: CORTEX_STEP_STATUS_DONE[\s\S]*?(?:Output|output|result)[\s\S]*?)(?=\n###|\n\n|$)/g);
            if (matches) {
                console.log('--- CONSOLE CAPTURES ---');
                matches.forEach(m => console.log(m.substring(0, 400)));
            }
        }
    } catch (e) {}
}
