/**
 * Comprehensive Test Suite for Phase 2 / Batch 5:
 * Extracted Pace and Outcome Systems
 *
 * Requirements Tested:
 * PACE:
 * - Create goal
 * - Edit goal
 * - Delete goal
 * - Velocity calculations
 * - Estimated finish
 * - Day allocation
 * - Trend chart dataset builder
 * - Candlestick chart modal/intervals
 *
 * OUTCOME:
 * - Create result
 * - Edit result
 * - Delete result
 * - CGPA calculation
 * - Grade mapping
 * - Trend chart
 * - Pass/freeze configuration
 * - Celebration setup
 * - Congratulations modal
 * - Confetti integration
 *
 * DASHBOARD:
 * - Compatibility & metrics integration
 */

const assert = require('assert');

// 1. Mock DOM and Environment Setup
class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.value = '';
        this.innerHTML = '';
        this.innerText = '';
        this.textContent = '';
        this.className = '';
        this.classList = {
            classes: new Set(),
            add(...cls) { cls.forEach(c => this.classes.add(c)); },
            remove(...cls) { cls.forEach(c => this.classes.delete(c)); },
            contains(c) { return this.classes.has(c); },
            toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
        };
        this.style = {};
        this.children = [];
        this.checked = false;
        this.disabled = false;
        this.dataset = {};
        this.parentElement = null;
    }

    appendChild(child) {
        if (child instanceof MockElement) {
            child.parentElement = this;
            this.children.push(child);
        }
        return child;
    }

    querySelector(sel) {
        if (!sel) return null;
        if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
        if (sel.startsWith('.')) {
            const cls = sel.slice(1);
            return this.children.find(c => c.classList.contains(cls)) || null;
        }
        return null;
    }

    querySelectorAll(sel) {
        return [];
    }

    getContext(type) {
        return {
            createLinearGradient: () => ({ addColorStop: () => {} }),
            fillRect: () => {},
            clearRect: () => {},
            getImageData: () => ({ data: [] }),
            putImageData: () => {}
        };
    }
}

const elements = new Map();
function getOrCreateElement(id, tagName = 'div') {
    if (!elements.has(id)) {
        elements.set(id, new MockElement(id, tagName));
    }
    return elements.get(id);
}

const mockDocument = {
    getElementById(id) {
        return getOrCreateElement(id);
    },
    querySelector(sel) {
        if (!sel) return null;
        if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
        return null;
    },
    querySelectorAll(sel) {
        return [];
    },
    createElement(tag) {
        return new MockElement('', tag);
    },
    body: new MockElement('body', 'body')
};

// Create all necessary elements for Pace and Outcome
[
    // Pace elements
    'pace-goals-container', 'pace-target-type', 'pace-target', 'pace-start-date', 'pace-deadline',
    'pace-bundle-selection-area', 'pace-bundle-items-container', 'pace-type-bundle-cb', 'pace-type-subject-cb',
    'edit-pace-id', 'edit-pace-type', 'edit-pace-target', 'edit-pace-start-date', 'edit-pace-deadline',
    'edit-pace-bundle-items-container', 'edit-pace-type-bundle-cb', 'edit-pace-type-subject-cb',
    'goal-details-title', 'goal-details-subjects-body', 'goal-details-pace-badge', 'goal-details-dates',
    'goal-details-days', 'goal-details-finish', 'goal-details-total-ch', 'goal-details-comp-ch',
    'goal-details-rem-ch', 'goal-details-progress-bar', 'goal-details-progress-pct',
    'ptm-goal-title', 'paceTrendCanvas', 'paceCandleCanvas',
    'active-pace-selection-container', 'trends-pace-selection-container',

    // Outcome elements
    'outcome-results-container', 'results-history-table', 'results-count-badge',
    'res-id', 'res-title', 'res-type', 'res-score', 'res-max', 'res-date', 'res-grade', 'res-cgpa',
    'res-evaluation-type', 'res-credits', 'res-overall-target-cgpa', 'res-overall-target-grade',
    'res-modal-est-score', 'res-modal-cgpa-wrapper', 'res-modal-grade-wrapper',
    'res-group-cgpa-fields', 'res-group-other-fields', 'result-subjects-grid',
    'program-trend-modal-title', 'programTrendCanvas', 'subjectWiseCanvas',
    'pass-config-container', 'pass-core-toggle-state',
    'celebration-config-container', 'celebration-setup-items-container', 'celebration-search-input',
    'celebration-selected-count', 'congrats-modal', 'congrats-page-1', 'congrats-page-2',
    'congrats-summary-content', 'congrats-title', 'congrats-subtitle', 'congrats-badge-banner'
].forEach(id => getOrCreateElement(id));

// 2. Global State Setup
global.window = global;
global.document = mockDocument;
global.Chart = class MockChart {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
    }
    destroy() {}
    update() {}
    resize() {}
};

let confettiFired = 0;
global.fireConfetti = () => {
    confettiFired++;
};

let cloudSaved = 0;
global.FirebaseService = {
    saveToCloud: (immediate = false) => {
        cloudSaved++;
    }
};

let recordedDeletions = [];
global.recordItemDeletion = (type, id) => {
    const targetId = id !== undefined ? id : type;
    recordedDeletions.push(targetId);
};

let toasts = [];
global.showToast = (msg, type) => {
    toasts.push({ msg, type });
};

let openedModals = [];
let closedModals = [];
global.openModal = (id) => {
    openedModals.push(id);
    const el = elements.get(id);
    if (el) el.classList.remove('hidden');
};
global.closeModal = (id) => {
    closedModals.push(id);
    const el = elements.get(id);
    if (el) el.classList.add('hidden');
};

global.Utils = {
    parseDateSafe: (d) => new Date(d),
    formatDateResponsive: (d) => d ? new Date(d).toISOString().slice(0, 10) : '',
    validateAndFormatCgpa: (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    },
    mapCgpaToGrade: (cgpa) => {
        const num = parseFloat(cgpa);
        if (num >= 3.8) return 'A+';
        if (num >= 3.5) return 'A';
        if (num >= 3.0) return 'B';
        if (num >= 2.0) return 'C';
        return 'F';
    },
    mapGradeToNumeric: (grade) => {
        const g = (grade || '').trim().toUpperCase();
        if (g === 'A+') return 4.0;
        if (g === 'A') return 3.75;
        if (g === 'B') return 3.0;
        if (g === 'C') return 2.0;
        return 0.0;
    }
};

// Initial AppState
global.AppState = {
    PLAN_START_DATE: '2026-01-01',
    globalStartDate: new Date('2026-01-01'),
    globalEndDate: new Date('2026-12-31'),
    currentFilter: 'All',
    tasks: [
        {
            date: '2026-02-01',
            type: 'study',
            track1Tasks: [
                { subject: 'Computer Networks', chapter: 'Ch 1', completed: true, completedAt: '2026-02-01' },
                { subject: 'Operating Systems', chapter: 'Ch 1', completed: true, completedAt: '2026-02-01' }
            ]
        },
        {
            date: '2026-02-05',
            type: 'study',
            track1Tasks: [
                { subject: 'Computer Networks', chapter: 'Ch 2', completed: true, completedAt: '2026-02-05' }
            ]
        }
    ]
};

global.tracks = [{ id: 'track1', name: 'Computer Science' }];
global.customPrograms = { track1: [{ name: 'B.Sc. CSE', type: 'Major' }] };
global.syllabusStructure = {
    track1: [
        { program: 'B.Sc. CSE', subject: 'Computer Networks', chapters: 10 },
        { program: 'B.Sc. CSE', subject: 'Operating Systems', chapters: 8 }
    ]
};

global.getAllSubjects = () => [
    { trackId: 'track1', program: 'B.Sc. CSE', subject: 'Computer Networks', chapters: 10 },
    { trackId: 'track1', program: 'B.Sc. CSE', subject: 'Operating Systems', chapters: 8 }
];

global.getAllPrograms = () => [{ name: 'B.Sc. CSE', trackId: 'track1' }];

global.lastSubjectStats = {
    'Computer Networks': { totalChapters: 10, effectiveChapters: 2, actualPace: 0.2 },
    'Operating Systems': { totalChapters: 8, effectiveChapters: 1, actualPace: 0.1 }
};

global.dashboardConfig = {
    activePaceGoalId: 'global-timeline',
    independentPaces: {
        tracks: { track1: true },
        programs: { 'B.Sc. CSE': true },
        subjects: { 'Computer Networks': true }
    }
};

global.passedItems = {
    programs: [],
    subjects: []
};

global.celebrationTargets = {
    programs: [],
    subjects: []
};

global.paceGoals = [];
global.successResults = [];

// 3. Load Modules
const PaceEstimator = require('../js/features/pace/paceEstimator.js');
const PaceManager = require('../js/features/pace/paceManager.js');
const OutcomeResults = require('../js/features/outcome/outcomeResults.js');
const OutcomeAnalytics = require('../js/features/outcome/outcomeAnalytics.js');
const OutcomePassConfig = require('../js/features/outcome/outcomePassConfig.js');
const OutcomeCelebration = require('../js/features/outcome/outcomeCelebration.js');

(async () => {
console.log('--- STARTING PACE & OUTCOME TEST SUITE ---');

// ==========================================
// PACE TESTS
// ==========================================
console.log('\n[Pace Tests]');

// 1. Create Pace Goal
console.log('1. Testing Pace Goal Creation...');
const typeEl = getOrCreateElement('pace-type', 'select');
typeEl.value = 'program';
const targetEl = getOrCreateElement('pace-target', 'input');
targetEl.value = 'B.Sc. CSE';
const startEl = getOrCreateElement('pace-start-date', 'input');
startEl.value = '2026-01-01';
const deadlineEl = getOrCreateElement('pace-deadline', 'input');
deadlineEl.value = '2026-06-30';

PaceManager.addPaceGoal();
assert.strictEqual(global.paceGoals.length, 1, 'Pace goal should be created');
const createdGoal = global.paceGoals[0];
assert.strictEqual(createdGoal.type, 'program');
assert.strictEqual(createdGoal.target, 'B.Sc. CSE');
assert.strictEqual(createdGoal.deadline, '2026-06-30');
console.log('✓ Pace Goal created successfully:', createdGoal.id);

// 2. Velocity Calculations & Estimated Finish
console.log('2. Testing Velocity Calculations & Estimated Finish...');
const stats = PaceEstimator.calculatePaceGoalStats(createdGoal, global.lastSubjectStats);
assert.ok(stats, 'Stats should be calculated');
assert.strictEqual(stats.total, 18, 'Total chapters should be 10 + 8 = 18');
assert.strictEqual(stats.completed, 3, 'Completed chapters should be 2 + 1 = 3');
assert.strictEqual(stats.remaining, 15, 'Remaining should be 18 - 3 = 15');
assert.ok(stats.percentage > 0, 'Percentage should be calculated');
assert.ok(typeof stats.reqPace === 'string', 'reqPace string should be present');
assert.ok(typeof stats.curPace === 'string', 'curPace string should be present');
assert.ok(stats.finishDisplay, 'finishDisplay should be rendered');
console.log('✓ Stats verified: Total:', stats.total, 'Completed:', stats.completed, 'Req Pace:', stats.reqPace, 'Cur Pace:', stats.curPace);

// 3. Independent Estimated Finish
console.log('3. Testing Independent Estimated Finish...');
const indepFinish = PaceEstimator.calculateIndependentEstFinish();
assert.ok(indepFinish && indepFinish !== '--', 'Independent finish date should be computed');
console.log('✓ Independent Finish:', indepFinish);

// 4. Edit Pace Goal
console.log('4. Testing Edit Pace Goal...');
PaceManager.openEditPaceModal(createdGoal.id);
assert.strictEqual(openedModals.includes('edit-pace-modal'), true, 'Edit modal should be opened');
assert.strictEqual(getOrCreateElement('edit-pace-name').value, 'B.Sc. CSE');

// Change deadline
getOrCreateElement('edit-pace-deadline').value = '2026-08-31';
PaceManager.savePaceEdit();
const updatedGoal = global.paceGoals.find(g => g.id === createdGoal.id);
assert.strictEqual(updatedGoal.deadline, '2026-08-31', 'Goal deadline should be updated');
console.log('✓ Pace Goal edited and saved successfully');

// 5. Day Allocation & Goal Details Modal
console.log('5. Testing Day Allocation & Goal Details Modal...');
PaceManager.openGoalDetailsModal(createdGoal.id);
assert.strictEqual(openedModals.includes('goal-details-modal'), true, 'Goal details modal should open');
assert.ok(getOrCreateElement('gdm-target').textContent.includes('B.Sc. CSE'), 'Details target set');
assert.ok(String(getOrCreateElement('gdm-total-ch').textContent).includes('18'), 'Total chapters displayed');
console.log('✓ Day allocation & Goal details inspected');

// 6. Trend Chart Dataset Builder
console.log('6. Testing Trend Chart Dataset Builder...');
const paceData = {
    total: 18,
    completed: 3,
    start: '2026-01-01',
    end: '2026-08-31',
    today: '2026-02-15',
    reqPace: 0.1,
    curPace: 0.08,
    projectedDate: new Date('2026-10-01'),
    subjects: ['Computer Networks', 'Operating Systems']
};
const chartDatasets = PaceManager.buildPaceChartDatasets(paceData);
assert.ok(chartDatasets, 'Chart datasets should be built');
assert.ok(Array.isArray(chartDatasets.labels), 'Labels array present');
assert.ok(Array.isArray(chartDatasets.reqData), 'reqData array present');
assert.ok(Array.isArray(chartDatasets.actData), 'actData array present');
assert.ok(Array.isArray(chartDatasets.estData), 'estData array present');
assert.strictEqual(chartDatasets.total, 18, 'Total matches');
console.log('✓ Trend chart datasets generated successfully with', chartDatasets.labels.length, 'data points');

// 7. Candlestick Chart Modal
console.log('7. Testing Candlestick Chart Modal...');
PaceManager.openPaceCandleChartModal(createdGoal.id);
assert.strictEqual(openedModals.includes('pace-candle-modal'), true, 'Candlestick modal should be opened');
console.log('✓ Candlestick chart modal triggered');

// 8. Delete Pace Goal
console.log('8. Testing Delete Pace Goal...');
const goalIdToDelete = createdGoal.id;
PaceManager.deletePaceGoal(goalIdToDelete);
assert.strictEqual(global.paceGoals.some(g => g.id === goalIdToDelete), false, 'Goal should be removed from paceGoals');
assert.strictEqual(recordedDeletions.includes(goalIdToDelete), true, 'Deletion should be recorded for cloud sync');
console.log('✓ Pace Goal deleted and recorded for deletion sync');


// ==========================================
// OUTCOME TESTS
// ==========================================
console.log('\n[Outcome Tests]');

// 1. Create Result (CGPA & Achievement)
console.log('1. Testing Result Creation...');
getOrCreateElement('res-type').value = 'cgpa';
getOrCreateElement('res-prog-select').value = 'B.Sc. CSE';
getOrCreateElement('res-overall-cgpa').value = '3.85';
getOrCreateElement('res-date').value = '2026-01-15';
getOrCreateElement('res-evaluation-type').value = 'cgpa';

OutcomeResults.saveResult();
assert.ok(global.successResults.length >= 1, 'CGPA result should be saved');
const createdCgpa = global.successResults.find(r => r.title === 'B.Sc. CSE' && r.type === 'cgpa');
assert.ok(createdCgpa, 'CGPA record found');
assert.strictEqual(createdCgpa.value, '3.85');
console.log('✓ CGPA Result created successfully:', createdCgpa.id);

// Create an achievement
getOrCreateElement('res-type').value = 'achievement';
getOrCreateElement('res-title-input').value = 'Top Scorer Award';
getOrCreateElement('res-value').value = '100';
getOrCreateElement('res-date').value = '2026-01-20';
OutcomeResults.saveResult();
const createdAch = global.successResults.find(r => r.title === 'Top Scorer Award');
assert.ok(createdAch, 'Achievement created');
assert.strictEqual(createdAch.value, '100');
console.log('✓ Achievement created successfully:', createdAch.id);

// 2. CGPA Calculation & Grade Mapping
console.log('2. Testing CGPA Calculation & Grade Mapping...');
const parent = new MockElement('parent-wrapper', 'div');
const inputEl = new MockElement('test-cgpa-input', 'input');
const gradeBadge = new MockElement('grade-badge', 'span');
gradeBadge.classList.add('auto-grade-badge');
parent.appendChild(inputEl);
parent.appendChild(gradeBadge);

inputEl.value = '3.92';
OutcomeResults.onCgpaInput(inputEl);
assert.strictEqual(gradeBadge.textContent, 'A+', 'Grade should map to A+');

const gradeSelectEl = new MockElement('test-grade-select', 'select');
const cgpaBadge = new MockElement('cgpa-badge', 'span');
cgpaBadge.classList.add('auto-cgpa-badge');
parent.appendChild(gradeSelectEl);
parent.appendChild(cgpaBadge);

gradeSelectEl.value = 'A';
OutcomeResults.onGradeSelect(gradeSelectEl);
assert.strictEqual(cgpaBadge.textContent, '3.75', 'Grade A should map to CGPA 3.75');

const processed = OutcomeResults.getProcessedResults();
assert.ok(Array.isArray(processed), 'Processed results should return an array');
assert.ok(processed.length >= 1, 'Processed results should have items');
const overallItem = processed.find(r => r.type === 'cgpa' && !r.subject);
assert.ok(overallItem, 'Overall CGPA result present');
assert.strictEqual(overallItem.value, '3.85');
console.log('✓ CGPA & Grade mappings verified. Processed count:', processed.length);

// 3. Edit Result
console.log('3. Testing Edit Result...');
// Edit achievement
OutcomeResults.openResultModal(createdAch.id);
assert.strictEqual(openedModals.includes('result-modal'), true, 'Result modal opened for edit');
getOrCreateElement('res-value').value = '98';
OutcomeResults.saveResult();
assert.strictEqual(createdAch.value, '98', 'Achievement value updated to 98');
console.log('✓ Result edited successfully');

// 4. Pass / Freeze Configuration
console.log('4. Testing Pass / Freeze Configuration...');
OutcomePassConfig.togglePassStatus('program', 'B.Sc. CSE', true);
assert.strictEqual(global.passedItems.programs.includes('B.Sc. CSE'), true, 'Program should be in passedItems');
assert.strictEqual(global.passedItems.subjects.includes('Computer Networks'), true, 'Subject should be cascade-passed');
assert.strictEqual(global.passedItems.subjects.includes('Operating Systems'), true, 'Subject should be cascade-passed');
console.log('✓ Pass configuration toggles verified with cascade');

// 5. Celebration Setup
console.log('5. Testing Celebration Setup...');
OutcomeCelebration.selectAllCelebrationTargets('all-passed');
assert.strictEqual(global.celebrationTargets.programs.includes('B.Sc. CSE'), true, 'Celebration targets set from passed');
assert.strictEqual(global.celebrationTargets.subjects.includes('Computer Networks'), true, 'Celebration targets include subject');

OutcomeCelebration.saveCelebrationSetup();
assert.strictEqual(closedModals.includes('celebration-setup-modal'), true, 'Setup modal closed on save');
console.log('✓ Celebration criteria saved');

// 6. Congratulations Modal & Confetti Integration
console.log('6. Testing Congratulations Modal & Confetti Integration...');
const initialConfetti = confettiFired;
OutcomeCelebration.showCongratsModal(false, 2, 2);
assert.strictEqual(elements.get('congrats-modal').classList.contains('hidden'), false, 'Congrats modal is visible');

// Wait for 300ms setTimeout to fire confetti
await new Promise(r => setTimeout(r, 350));
assert.ok(confettiFired > initialConfetti, 'Confetti should be fired when congratulations modal opens');

OutcomeCelebration.switchCongratsPage(2);
assert.strictEqual(elements.get('congrats-page-2').classList.contains('hidden'), false, 'Switched to page 2');

OutcomeCelebration.closeCongratsModal();
console.log('✓ Congratulations modal and Confetti integration verified');

// 7. Trend Chart & Analytics
console.log('7. Testing Outcome Trend Charts...');
OutcomeAnalytics.showProgramAnalytics('B.Sc. CSE');
assert.strictEqual(openedModals.includes('program-trend-modal'), true, 'Program analytics modal opened');
console.log('✓ Outcome Trend Charts modal triggered');

// 8. Delete Result & Program Group
console.log('8. Testing Delete Result...');
const resIdToDelete = createdAch.id;
OutcomeResults.deleteResult(resIdToDelete);
assert.strictEqual(global.successResults.some(r => r.id === resIdToDelete), false, 'Achievement should be removed');
assert.strictEqual(recordedDeletions.includes(resIdToDelete), true, 'Deletion recorded for cloud sync');

// Delete Program Group
OutcomeResults.deleteProgramGroup('B.Sc. CSE');
assert.strictEqual(global.successResults.some(r => r.title === 'B.Sc. CSE'), false, 'Program group should be removed');
console.log('✓ Result and Program Group deleted successfully');


// ==========================================
// DASHBOARD INTEGRATION TEST
// ==========================================
console.log('\n[Dashboard Integration Test]');
// Verify calculatePaceGoalStats and getProcessedResults compatibility
const dummyGoal = { id: 'test-dash', type: 'global', target: 'Overall' };
const dashStats = PaceEstimator.calculatePaceGoalStats(dummyGoal, global.lastSubjectStats);
assert.ok(dashStats, 'Dashboard pace stats should compute without NaN or exceptions');
assert.strictEqual(typeof dashStats.percentage, 'number');

const dashResults = OutcomeResults.getProcessedResults();
assert.ok(Array.isArray(dashResults), 'dashResults should be an array');
console.log('✓ Dashboard integrations intact: Pace stats and Outcome stats compute cleanly');

console.log('\n🎉 ALL PACE & OUTCOME SYSTEM TESTS PASSED SUCCESSFULLY! 🎉\n');
})().catch(err => {
    console.error(err);
    process.exit(1);
});
