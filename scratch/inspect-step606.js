const fs = require('fs');

const path = 'C:/Users/ratul/.gemini/antigravity-ide/brain/ba62847d-8782-4a0c-aec0-3b770e77bb6f/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.step_index === 606) {
            console.log('STEP 606 CONTENT:');
            console.log(obj.content);
        }
    } catch (e) {}
}
