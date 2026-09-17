const fs = require('fs');

const files = [
    'index.html',
    'pages/Focus/Focus.html',
    'pages/Master Config/Master Config.html',
    'pages/Subjects/Subjects.html'
];

const inventory = [];

files.forEach(file => {
    const html = fs.readFileSync(file, 'utf8');
    const regex = /\s(on[a-z]+)\s*=\s*(["'][^"']*["']|[^\s>]+)/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const line = html.substring(0, match.index).split('\n').length;
        const tagStart = html.lastIndexOf('<', match.index);
        const tagEnd = html.indexOf('>', match.index);
        const tag = html.substring(tagStart, tagEnd + 1);
        const idMatch = tag.match(/id\s*=\s*["']([^"']+)["']/i);
        const id = idMatch ? idMatch[1] : null;
        const event = match[1].toLowerCase();
        const handler = match[2].replace(/^["']|["']$/g, '');

        let owner = 'Shared / Modals';
        let newLocation = 'js/shared/modals.js';
        let fn = handler.split('(')[0].replace(/^window\./, '');

        if (fn.includes('closeModal')) {
            owner = 'Shared / Modals';
            newLocation = 'js/shared/modals.js';
        } else if (fn.includes('ConfirmModal') || fn.includes('executeConfirmedDelete') || fn.includes('TimerWarningModal')) {
            owner = 'Shared / Deletion';
            newLocation = 'js/shared/deletion.js';
        } else if (fn.includes('Timer') || fn.includes('Atsm') || fn.includes('Alarm') || fn.includes('Session')) {
            owner = 'Features / Focus & Timer';
            newLocation = 'pages/Focus/Focus.js';
        } else if (fn.includes('ActionAnalytics') || fn.includes('SpectraHeatmap')) {
            owner = 'Features / Analytics';
            newLocation = 'js/features/analytics/heatmap.js';
        } else if (fn.includes('SubjectTrend')) {
            owner = 'Features / Analytics';
            newLocation = 'js/features/analytics/chapterMap.js';
        } else if (fn.includes('ProgramAnalytics')) {
            owner = 'Features / Outcome';
            newLocation = 'js/features/outcome/outcomeAnalytics.js';
        } else if (fn.includes('SubjectEdit') || fn.includes('EsmProgram')) {
            owner = 'Features / Tasks';
            newLocation = 'js/features/tasks/subjectGoals.js';
        } else if (fn.includes('DailyActionEdit')) {
            owner = 'Features / Habits';
            newLocation = 'js/features/habits/dailyTracker.js';
        } else if (fn.includes('TrackEdit')) {
            owner = 'Features / Config';
            newLocation = 'js/features/config/tracksConfig.js';
        } else if (fn.includes('AccountUpdate') || fn.includes('Logout')) {
            owner = 'Services / Auth';
            newLocation = 'js/services/auth.js';
        } else if (fn.includes('SysTab') || fn.includes('ChProg') || fn.includes('SubProg') || fn.includes('Manage') || fn.includes('HeaderConfig') || fn.includes('CleanSlate') || fn.includes('appendNew')) {
            owner = 'Features / Config';
            newLocation = 'pages/Master Config/Master Config.js';
        } else if (fn.includes('GlobalHistory') || fn.includes('GlobalChapters')) {
            owner = 'Pages / Subjects';
            newLocation = 'pages/Subjects/Subjects.js';
        }

        inventory.push({
            file,
            line,
            id: id || 'Generated ID',
            event,
            handler,
            fn,
            owner,
            globalDep: fn,
            newLocation
        });
    }
});

console.log('Total inventory count:', inventory.length);
fs.writeFileSync('scratch/inventory.json', JSON.stringify(inventory, null, 2));
console.log('Saved to scratch/inventory.json');
