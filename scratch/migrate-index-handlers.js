const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Backdrops with closeModal
html = html.replace(/(<div[^>]*id=["'][^"']*-backdrop["'][^>]*)onclick=["'](?:window\.)?closeModal\([^'"]*['"]\)/gi, '$1');
html = html.replace(/onclick=["'](?:window\.)?closeModal\([^'"]*['"]\)([^>]*id=["'][^"']*-backdrop["'])/gi, '$1');

// 2. Buttons/elements with closeModal
html = html.replace(/onclick=["'](?:window\.)?closeModal\(['"]([^'"]+)['"]\)\s*;?["']/gi, 'data-modal-close="$1"');

// 3. Confirm Modal and Warning Modal
html = html.replace(/onclick=["']window\.closeConfirmModal\(\)["']/gi, '');
html = html.replace(/<button([^>]*onclick=["']window\.executeConfirmedDelete\(\)["'][^>]*)>/gi, (match) => {
    return match.replace(/onclick=["']window\.executeConfirmedDelete\(\)["']/gi, '').replace('<button', '<button id="cm-confirm-btn"');
});
html = html.replace(/<button([^>]*id=["']cm-cancel-btn["'][^>]*)>/gi, (m) => m); // already has id if any
// Add id="cm-cancel-btn" to cancel button in confirm modal
html = html.replace(/(id=["']cm-message["'][\s\S]*?<button)([^>]*>Cancel<\/button>)/i, '$1 id="cm-cancel-btn"$2');

html = html.replace(/onclick=["']window\.closeTimerWarningModal\(\)["']/gi, '');
html = html.replace(/(id=["']tw-message["'][\s\S]*?<button)([^>]*>Got\s*It<\/button>)/i, '$1 id="tw-confirm-btn"$2');

// 4. Edit Subject Modal
html = html.replace(/<select id="esm-track"\s*onchange=["']window\.updateEsmProgramDropdown\(\)["']/gi, '<select id="esm-track"');
html = html.replace(/<button\s*onclick=["']window\.requestDeleteSubjectFromModal\(\)["']/gi, '<button id="esm-btn-delete"');
html = html.replace(/<button\s*onclick=["']window\.saveSubjectEditModal\(\)["']/gi, '<button id="esm-btn-save"');

// 5. Edit Daily Action Modal
html = html.replace(/<button\s*onclick=["']window\.requestDeleteDailyActionFromModal\(\)["']/gi, '<button id="edam-btn-delete"');
html = html.replace(/<button\s*onclick=["']window\.saveDailyActionEditModal\(\)["']/gi, '<button id="edam-btn-save"');

// 6. Edit Track Modal
html = html.replace(/<button\s*onclick=["']window\.saveTrackEditModal\(\)["']/gi, '<button id="etm-track-save-btn"');

// 7. Subject Trend Modal
html = html.replace(/onclick=["']window\.setSubjectTrendChartStyle\([^)]+\)["']/gi, '');
html = html.replace(/onclick=["']window\.toggleSubjectTrendGlobal\(\)["']/gi, '');

// 8. Program Analytics Tab Switcher
html = html.replace(/onclick=["']window\.switchProgramAnalyticsView\([^)]+\)["']/gi, '');

// 9. Habit / Daily Tracker Analytics Range
html = html.replace(/onclick=["']setActionAnalyticsRange\([^)]+\)["']/gi, '');

// 10. Timer controls in index.html
html = html.replace(/onclick=["']window\.submitCustomTimer\(\)["']/gi, '');
html = html.replace(/onclick=["']window\.switchAtsmTab\([^)]+\)["']/gi, '');
html = html.replace(/<button\s*onclick=["']window\.submitManualTimerSession\(\)["']/gi, '<button id="atsm-btn-submit"');
html = html.replace(/<button\s*onclick=["']window\.submitEditTimerSession\(\)["']/gi, '<button id="etsm-btn-submit"');
html = html.replace(/onclick=["']window\.setTimerAnalyticsRange\([^)]+\)["']/gi, '');
html = html.replace(/onclick=["']window\.navigateTimerAnalyticsDay\([^)]+\)["']/gi, '');
html = html.replace(/onclick=["']window\.resetTimerAnalyticsDayOffset\(\)["']/gi, '');
html = html.replace(/onclick=["']window\.setTimerAnalyticsGrouping\([^)]+\)["']/gi, '');
html = html.replace(/onclick=["']window\.setTimerAnalyticsChartStyle\([^)]+\)["']/gi, '');
html = html.replace(/onchange=["']window\.updateDailyFocusHoursTarget\(this\.value\)["']/gi, '');
html = html.replace(/oninput=["']window\.updateDailyFocusHoursTarget\(this\.value\)["']/gi, '');

// 11. Account Settings & Logout
html = html.replace(/<button\s*onclick=["']window\.submitAccountUpdate\(\)["']/gi, '<button id="asm-save-btn"');
html = html.replace(/onclick=["']window\.handleLogout\(\)["']/gi, '');

// 12. Spectra heatmap modal close
html = html.replace(/<button\s*onclick=["']window\.closeSpectraHeatmapDayModal\(\)["']/gi, '<button id="spectra-hm-modal-close-btn" data-modal-close="spectra-heatmap-day-modal"');

// Clean up any remaining double spaces or trailing whitespace inside tags
html = html.replace(/\s+>/g, '>');

// Check remaining handlers in transformed html
const regex = /\s(on[a-z]+)\s*=\s*(["'][^"']*["']|[^\s>]+)/gi;
const remaining = [];
let match;
while ((match = regex.exec(html)) !== null) {
    const line = html.substring(0, match.index).split('\n').length;
    remaining.push({ line, event: match[1], attr: match[0].trim() });
}

console.log('Remaining inline handlers in index.html:', remaining.length);
if (remaining.length > 0) {
    console.log(remaining);
} else {
    fs.writeFileSync('index.html', html, 'utf8');
    console.log('Successfully written cleaned index.html!');
}
