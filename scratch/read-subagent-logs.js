const fs = require('fs');

const path = 'C:/Users/ratul/.gemini/antigravity-ide/brain/ba62847d-8782-4a0c-aec0-3b770e77bb6f/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.content && obj.content.includes('capture_browser_console_logs')) {
            console.log('Found subagent step:');
            console.log(obj.content.substring(0, 1000));
            break;
        }
    } catch (e) {}
}
