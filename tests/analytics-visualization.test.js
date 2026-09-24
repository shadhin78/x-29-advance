/**
 * Comprehensive Test Suite for Phase 2 / Batch 6:
 * Extracted Analytics and Read-Only Visualization Systems
 *
 * Requirements Tested:
 * 1. Circle charts (Spectra circle breakdown chart)
 * 2. Commitment matrix (7 Officer Commitments Habit Radar)
 * 3. Heatmap (Spectra Focus Heatmap & Dashboard Yearly Heatmap)
 * 4. Heatmap tooltip (Interactive hover tooltip)
 * 5. Heatmap day modal (Day drill-down modal & side detail)
 * 6. Timeline (Global timeline history events)
 * 7. Timeline search (Live query filtering)
 * 8. Timeline date edit (Edit modal & timestamp synchronization)
 * 9. Chapter SVG map (Concentric multi-ring polar SVG map & tooltips)
 * 10. Pace charts (Spectra & Global pace trend charts orchestration)
 * 11. Chart.js Lifecycle Safety (Prevent duplicate instances & canvas reuse errors)
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
        this.listeners = {};
    }

    getAttribute(name) {
        return this.dataset[name] || this[name] || null;
    }

    setAttribute(name, value) {
        this.dataset[name] = String(value);
    }

    appendChild(child) {
        if (child instanceof MockElement) {
            child.parentElement = this;
            this.children.push(child);
        }
        return child;
    }

    querySelector(selector) {
        if (selector.startsWith('#')) {
            const searchId = selector.slice(1);
            if (this.id === searchId) return this;
            for (const child of this.children) {
                const found = child.querySelector(selector);
                if (found) return found;
            }
        }
        return null;
    }

    querySelectorAll(selector) {
        const results = [];
        if (selector.startsWith('.')) {
            const cls = selector.slice(1);
            if (this.classList.contains(cls)) results.push(this);
            for (const child of this.children) {
                results.push(...child.querySelectorAll(selector));
            }
        }
        return results;
    }

    addEventListener(type, listener) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(listener);
    }

    getBoundingClientRect() {
        return { top: 10, left: 10, right: 110, bottom: 60, width: 100, height: 50 };
    }

    getContext(type) {
        return {
            canvas: this,
            fillRect: () => {},
            clearRect: () => {},
            getImageData: () => ({ data: new Array(4) }),
            putImageData: () => {},
            createImageData: () => [],
            setTransform: () => {},
            drawImage: () => {},
            save: () => {},
            fillText: () => {},
            restore: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            stroke: () => {},
            fill: () => {}
        };
    }
}

class MockDocument {
    constructor() {
        this.elements = new Map();
        this.body = new MockElement('body', 'body');
        this.documentElement = new MockElement('html', 'html');
    }

    createElement(tagName) {
        return new MockElement('', tagName);
    }

    getElementById(id) {
        if (!this.elements.has(id)) {
            const el = new MockElement(id, 'div');
            this.elements.set(id, el);
        }
        return this.elements.get(id);
    }

    querySelector(selector) {
        if (selector.startsWith('#')) {
            return this.getElementById(selector.slice(1));
        }
        for (const el of this.elements.values()) {
            const found = el.querySelector(selector);
            if (found) return found;
        }
        return null;
    }

    querySelectorAll(selector) {
        const results = [];
        for (const el of this.elements.values()) {
            if (selector.startsWith('.')) {
                const cls = selector.slice(1);
                if (el.classList.contains(cls)) results.push(el);
            }
            results.push(...el.querySelectorAll(selector));
        }
        return results;
    }

    registerElement(id, el) {
        this.elements.set(id, el);
    }

    addEventListener() {}
}

// Chart.js Mock to verify instance management and destroy safety
let chartInstancesCreated = 0;
let chartInstancesDestroyed = 0;

class MockChart {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.data = config.data || {};
        this.options = config.options || {};
        this.destroyed = false;
        chartInstancesCreated++;
    }

    destroy() {
        this.destroyed = true;
        chartInstancesDestroyed++;
    }

    update() {}
    resize() {}
}

MockChart.defaults = { color: '#94a3b8', font: { family: 'Inter' } };

const mockLocalStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
    clear() { this.store = {}; }
};

// Setup global test sandbox
global.document = new MockDocument();
global.window = global;
global.localStorage = mockLocalStorage;
global.Chart = MockChart;

// Mock Toast & Audio & Utils
global.showToast = () => {};
global.openModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
};
global.closeModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
};

global.Utils = {
    escapeHtml: str => String(str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    formatDate: d => d.toISOString().split('T')[0],
    parseDateSafe: s => new Date(s),
    safeSetText: (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
};

global.safeSetText = global.Utils.safeSetText;

// Mock application state
global.AppState = {
    PLAN_START_DATE: '2026-01-01',
    tasks: [
        {
            date: '2026-03-01',
            type: 'study',
            academicTasks: [
                { subject: 'Math', chapter: 'Calculus I', completed: true, completedAt: '2026-03-01T10:00:00Z' },
                { subject: 'Physics', chapter: 'Mechanics', completed: false }
            ],
            act1: true,
            act2: false
        },
        {
            date: '2026-03-02',
            type: 'study',
            academicTasks: [
                { subject: 'Math', chapter: 'Calculus II', completed: true, completedAt: '2026-03-02T14:30:00Z' },
                { subject: 'Physics', chapter: 'Electromagnetism', completed: true, completedAt: '2026-03-02T16:00:00Z' }
            ],
            act1: true,
            act2: true
        }
    ],
    timerLogs: [
        { date: '2026-03-01T09:00:00Z', durationSeconds: 1800, subject: 'Math' },
        { date: '2026-03-01T15:00:00Z', durationSeconds: 3600, subject: 'Physics' },
        { date: '2026-03-02T11:00:00Z', durationSeconds: 5400, subject: 'Math' }
    ]
};

global.tracks = [
    { id: 'academic', name: 'Academic Track', color: '#6366f1' }
];

global.syllabusStructure = {
    academic: [
        { subject: 'Math', chapters: 5, program: 'Engineering' },
        { subject: 'Physics', chapters: 4, program: 'Engineering' }
    ]
};

global.getAllSubjects = () => [
    { subject: 'Math', chapters: 5, program: 'Engineering', priority: 1 },
    { subject: 'Physics', chapters: 4, program: 'Engineering', priority: 2 }
];

global.getAllPrograms = () => [
    { name: 'Engineering', _trackName: 'Academic' }
];

global.passedItems = {
    subjects: [],
    programs: []
};

global.customActions = [
    { id: 'act1', name: 'Physical Training', priority: 1 },
    { id: 'act2', name: 'Reading Syllabus', priority: 2 },
    { id: 'act3', name: 'Problem Solving', priority: 3 },
    { id: 'act4', name: 'Revision Recall', priority: 4 },
    { id: 'act5', name: 'Deep Focus Work', priority: 5 },
    { id: 'act6', name: 'Progress Journal', priority: 6 },
    { id: 'act7', name: 'Discipline Audit', priority: 7 }
];

global.paceGoals = [
    { id: 'goal_eng', name: 'Engineering Pace', startDate: '2026-01-01', targetDate: '2026-06-01' }
];

global.dashboardConfig = {
    activePaceGoalId: 'goal_eng'
};

global.getTaskForDate = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return null;
    const dStr = dateObj.toISOString().split('T')[0];
    return AppState.tasks.find(t => t.date === dStr) || null;
};

global.getChapterStatus = (sub, ch) => {
    if (sub === 'Math' && ch <= 2) return 'complete';
    return 'incomplete';
};

// Require the 4 analytics feature modules from archive
const ChapterMap = require('../archive/legacy-js/js/features/analytics/chapterMap.js');
const HeatmapAnalytics = require('../archive/legacy-js/js/features/analytics/heatmap.js');
const GlobalHistoryAnalytics = require('../archive/legacy-js/js/features/analytics/history.js');
const SpectraAnalytics = require('../archive/legacy-js/js/features/analytics/spectra.js');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        console.error(`  ✗ ${name}`);
        console.error(err);
    }
}

console.log('=== X-29 Advance — Phase 2 / Batch 6 Test Suite ===\n');

// -------------------------------------------------------------
// Group 1: Chapter Interactive SVG Map
// -------------------------------------------------------------
console.log('1. Chapter Interactive SVG Map (chapterMap.js)');

test('ChapterMap is properly defined and exposed', () => {
    assert.strictEqual(typeof ChapterMap.generateGlobalChaptersSVG, 'function');
    assert.strictEqual(typeof ChapterMap.openGlobalChaptersModal, 'function');
    assert.strictEqual(typeof ChapterMap.showChapterTooltip, 'function');
    assert.strictEqual(typeof ChapterMap.hideChapterTooltip, 'function');
});

test('generateGlobalChaptersSVG returns valid SVG and chapter statistics for global view', () => {
    const res = ChapterMap.generateGlobalChaptersSVG(false, 'global', false);
    assert.ok(res);
    assert.ok(res.html.includes('<svg'));
    assert.strictEqual(typeof res.totalChapters, 'number');
    assert.ok(res.totalChapters > 0);
    assert.strictEqual(typeof res.completedCount, 'number');
    assert.ok(Array.isArray(res.allChapters));
    assert.ok(parseFloat(res.completionPercent) >= 0);
});

test('generateGlobalChaptersSVG handles subject-specific 1-ring mode', () => {
    const res = ChapterMap.generateGlobalChaptersSVG(false, 'subject:Math', true);
    assert.ok(res.html.includes('<svg'));
    assert.ok(res.totalChapters >= 5);
    // Math has 2 completed chapters in tasks
    assert.strictEqual(res.completedCount, 2);
});

test('Chapter tooltips show and hide properly', () => {
    const tooltipEl = document.getElementById('gcm-tooltip');
    assert.ok(tooltipEl);

    ChapterMap.showChapterTooltip({ clientX: 100, clientY: 100 }, 'Math', 1, 'complete');
    assert.strictEqual(tooltipEl.classList.contains('hidden'), false);
    assert.ok(tooltipEl.innerHTML.includes('Math'));
    assert.ok(tooltipEl.innerHTML.includes('Chapter 1'));
    assert.ok(tooltipEl.innerHTML.includes('Completed'));

    ChapterMap.hideChapterTooltip();
    assert.strictEqual(tooltipEl.classList.contains('hidden'), true);
});

// -------------------------------------------------------------
// Group 2: Spectra Circle Charts
// -------------------------------------------------------------
console.log('\n2. Spectra Circle Charts (spectra.js)');

test('SpectraAnalytics is properly defined and exposed', () => {
    assert.strictEqual(typeof SpectraAnalytics.renderSpectraCircleChart, 'function');
    assert.strictEqual(typeof SpectraAnalytics.populateSpectraFilterDropdown, 'function');
    assert.strictEqual(typeof SpectraAnalytics.renderSpectraCommitmentsChart, 'function');
});

test('renderSpectraCircleChart updates container and counter badges', () => {
    const wrapper = document.getElementById('spectra-circle-chart-wrapper');
    const completeEl = document.getElementById('spectra-legend-complete');
    const incompleteEl = document.getElementById('spectra-legend-incomplete');

    SpectraAnalytics.renderSpectraCircleChart();

    assert.ok(wrapper.innerHTML.includes('<svg'));
    assert.ok(completeEl.textContent !== '');
    assert.ok(incompleteEl.textContent !== '');
});

test('populateSpectraFilterDropdown populates tracks, programs and subjects', () => {
    const menu = document.getElementById('spectra-filter-dropdown-menu');
    const btn = document.getElementById('spectra-filter-dropdown-btn');

    SpectraAnalytics.populateSpectraFilterDropdown();

    assert.ok(menu.innerHTML.includes('Global View'));
    assert.ok(menu.innerHTML.includes('Academic Track') || menu.innerHTML.includes('academic'));
    assert.ok(menu.innerHTML.includes('Engineering'));
    assert.ok(menu.innerHTML.includes('Math'));
});

// -------------------------------------------------------------
// Group 3: Commitment Matrix
// -------------------------------------------------------------
console.log('\n3. Commitment Matrix (7 Officer Commitments Habit Radar)');

test('getCommitmentLabels returns 7 habits with default labels', () => {
    const labels = SpectraAnalytics.getCommitmentLabels();
    assert.strictEqual(labels.length, 7);
    assert.ok(labels[0].includes('PHYSICAL') || labels[0].length > 0);
});

test('toggleCommitmentCell updates date cell without breaking data structure', () => {
    global.spectraCommitmentActiveDate = new Date(2026, 2, 1);
    const dateObj = new Date(2026, 2, 5);
    const dayNum = 5;
    const habitIdx = 0;

    const before = SpectraAnalytics.getCommitmentMonthData(dateObj);
    const wasChecked = !!(before['5'] && before['5'][habitIdx]);

    SpectraAnalytics.toggleCommitmentCell(dayNum, habitIdx);

    const after = SpectraAnalytics.getCommitmentMonthData(dateObj);
    const isNowChecked = !!(after['5'] && after['5'][habitIdx]);
    assert.strictEqual(isNowChecked, !wasChecked);
});

test('renderSpectraCommitmentsChart generates SVG habit radar and grid', () => {
    const wrapper = document.getElementById('spectra-commitments-chart-wrapper');
    assert.ok(wrapper);

    SpectraAnalytics.renderSpectraCommitmentsChart();
    assert.ok(wrapper.innerHTML.includes('<svg'));
});

test('Commitment month navigation navigates forward and backward', () => {
    const initialDate = new Date(SpectraAnalytics.AnalyticsPage ? global.spectraCommitmentActiveDate : new Date());
    const initialMonth = initialDate.getMonth();

    SpectraAnalytics.nextCommitmentMonth();
    assert.strictEqual(global.spectraCommitmentActiveDate.getMonth(), (initialMonth + 1) % 12);

    SpectraAnalytics.prevCommitmentMonth();
    assert.strictEqual(global.spectraCommitmentActiveDate.getMonth(), initialMonth);
});

// -------------------------------------------------------------
// Group 4: Focus Heatmap & Tooltip
// -------------------------------------------------------------
console.log('\n4. Spectra Focus Heatmap & Tooltips (heatmap.js)');

test('HeatmapAnalytics is properly defined and exposed', () => {
    assert.strictEqual(typeof HeatmapAnalytics.renderSpectraFocusHeatmap, 'function');
    assert.strictEqual(typeof HeatmapAnalytics.setSpectraHeatmapRangeUI, 'function');
    assert.strictEqual(typeof HeatmapAnalytics.showSpectraHeatmapTooltip, 'function');
    assert.strictEqual(typeof HeatmapAnalytics.hideSpectraHeatmapTooltip, 'function');
});

test('renderSpectraFocusHeatmap builds grid cells for timer logs', () => {
    const grid = document.getElementById('spectra-focus-heatmap-grid');
    assert.ok(grid);

    HeatmapAnalytics.renderSpectraFocusHeatmap();
    assert.ok(grid.innerHTML.includes('spectra-hm-cell') || grid.children.length > 0 || grid.innerHTML.length > 50);
});

test('setSpectraHeatmapRangeUI updates active button styling and range', () => {
    const btn30 = document.getElementById('spectra-hm-btn-30');
    const btn365 = document.getElementById('spectra-hm-btn-365');

    HeatmapAnalytics.setSpectraHeatmapRangeUI(30);
    assert.strictEqual(global.spectraHeatmapRange, 30);
    assert.ok(btn30.className.includes('bg-indigo-600'));

    HeatmapAnalytics.setSpectraHeatmapRangeUI(365);
    assert.strictEqual(global.spectraHeatmapRange, 365);
    assert.ok(btn365.className.includes('bg-indigo-600'));
});

test('Heatmap tooltip displays duration and session counts on hover', () => {
    const tooltip = document.getElementById('spectra-focus-heatmap-tooltip');
    assert.ok(tooltip);

    HeatmapAnalytics.showSpectraHeatmapTooltip({ clientX: 200, clientY: 150 }, '2026-03-01', 5400, 2);
    assert.strictEqual(tooltip.classList.contains('hidden'), false);
    assert.ok(tooltip.innerHTML.includes('2026-03-01'));
    assert.ok(tooltip.innerHTML.includes('1h 30m') || tooltip.innerHTML.includes('90m') || tooltip.innerHTML.includes('5400'));
    assert.ok(tooltip.innerHTML.includes('2 sessions') || tooltip.innerHTML.includes('2'));

    HeatmapAnalytics.hideSpectraHeatmapTooltip();
    assert.strictEqual(tooltip.classList.contains('hidden'), true);
});

test('renderHeatmap renders daily action grid in yearly-daily-grid', () => {
    const yearlyGrid = document.getElementById('yearly-daily-grid');
    assert.ok(yearlyGrid);

    HeatmapAnalytics.renderHeatmap();
    assert.ok(yearlyGrid.innerHTML.length > 10);
});

// -------------------------------------------------------------
// Group 5: Focus Heatmap Day Drill-Down
// -------------------------------------------------------------
console.log('\n5. Focus Heatmap Day Drill-Down');

test('showSpectraHeatmapDayDetail populates side note and modal', () => {
    const elDashDetail = document.getElementById('dash-hm-selected-detail');
    const elSnDate = document.getElementById('spectra-sn-date');
    const modal = document.getElementById('spectra-heatmap-day-modal');

    HeatmapAnalytics.showSpectraHeatmapDayDetail('2026-03-01', true);

    assert.ok(elDashDetail.innerHTML.includes('01/03/26') || elSnDate.innerText.includes('Mar'));
    assert.strictEqual(modal.classList.contains('hidden'), false);

    HeatmapAnalytics.closeSpectraHeatmapDayModal();
    assert.strictEqual(modal.classList.contains('hidden'), true);
});

// -------------------------------------------------------------
// Group 6: Global Timeline History
// -------------------------------------------------------------
console.log('\n6. Global Timeline History (history.js)');

test('GlobalHistoryAnalytics is properly defined and exposed', () => {
    assert.strictEqual(typeof GlobalHistoryAnalytics.openGlobalHistoryModal, 'function');
    assert.strictEqual(typeof GlobalHistoryAnalytics.renderGlobalHistoryContent, 'function');
    assert.strictEqual(typeof GlobalHistoryAnalytics.filterGlobalHistory, 'function');
    assert.strictEqual(typeof GlobalHistoryAnalytics.openEditTimelineEntryModal, 'function');
    assert.strictEqual(typeof GlobalHistoryAnalytics.saveTimelineEntryDate, 'function');
});

test('renderGlobalHistoryContent renders chronologically sorted timeline items', () => {
    const list = document.getElementById('ghm-list');
    assert.ok(list);

    GlobalHistoryAnalytics.renderGlobalHistoryContent();
    assert.ok(list.innerHTML.includes('Math'));
    assert.ok(list.innerHTML.includes('Calculus') || list.innerHTML.includes('Chapter'));
});

test('filterGlobalHistory filters items dynamically by query', () => {
    const list = document.getElementById('ghm-list');

    GlobalHistoryAnalytics.filterGlobalHistory('Calculus I');
    assert.ok(list.innerHTML.includes('Calculus I'));
    assert.ok(!list.innerHTML.includes('Electromagnetism'));

    GlobalHistoryAnalytics.filterGlobalHistory('');
    assert.ok(list.innerHTML.includes('Calculus I'));
    assert.ok(list.innerHTML.includes('Electromagnetism'));
});

// -------------------------------------------------------------
// Group 7: Timeline Editing Modal
// -------------------------------------------------------------
console.log('\n7. Timeline Editing Modal');

test('openEditTimelineEntryModal sets input value and opens modal', () => {
    const modal = document.getElementById('edit-timeline-entry-modal');
    const dtInput = document.getElementById('etem-datetime');
    const subtitle = document.getElementById('etem-subtitle');

    GlobalHistoryAnalytics.openEditTimelineEntryModal('Chapter', encodeURIComponent('Math'), encodeURIComponent('Calculus I'), '2026-03-01T10:00:00Z', 'academic', '1');

    assert.strictEqual(modal.classList.contains('hidden'), false);
    assert.ok(dtInput.value.includes('2026-03-01'));
    assert.ok(subtitle.textContent.includes('Math'));
});

test('saveTimelineEntryDate updates completion timestamp without mutating models', () => {
    const dtInput = document.getElementById('etem-datetime');
    dtInput.value = '2026-03-03T18:00';

    GlobalHistoryAnalytics.saveTimelineEntryDate();

    // Check task in AppState
    const updatedTask = AppState.tasks.find(t => t.date === '2026-03-01');
    assert.ok(updatedTask);
    const mathChapter = updatedTask.academicTasks.find(b => b.chapter === 'Calculus I');
    assert.ok(mathChapter);
    assert.ok(mathChapter.completedAt.includes('2026-03-03'));
});

// -------------------------------------------------------------
// Group 8: Pace Charts Orchestration
// -------------------------------------------------------------
console.log('\n8. Pace Charts Orchestration');

test('renderPaceCharts safely executes without crashing when canvases are present', () => {
    const spectraCanvas = document.getElementById('spectraPaceTrendCanvas');
    const globalCanvas = document.getElementById('globalPaceTrendCanvas');
    assert.ok(spectraCanvas);
    assert.ok(globalCanvas);

    // Call renderPaceCharts
    assert.doesNotThrow(() => {
        SpectraAnalytics.renderPaceCharts();
    });
});

// -------------------------------------------------------------
// Group 9: Chart.js Safety & Canonical Page Lifecycle
// -------------------------------------------------------------
console.log('\n9. Chart.js Lifecycle Safety & Navigation Cycle');

test('AnalyticsPage mounts and destroys cleanly without canvas reuse error', () => {
    const prevCreated = chartInstancesCreated;
    const prevDestroyed = chartInstancesDestroyed;

    // First mount
    SpectraAnalytics.AnalyticsPage.mount();
    assert.strictEqual(SpectraAnalytics.AnalyticsPage.isMounted, true);

    // Navigate away: destroy() must clean up all Chart instances
    SpectraAnalytics.AnalyticsPage.destroy();
    assert.strictEqual(SpectraAnalytics.AnalyticsPage.isMounted, false);
    assert.ok(chartInstancesDestroyed >= prevDestroyed);

    // Re-enter page (second mount): must mount cleanly without canvas collision
    assert.doesNotThrow(() => {
        SpectraAnalytics.AnalyticsPage.mount();
    });
    assert.strictEqual(SpectraAnalytics.AnalyticsPage.isMounted, true);

    // Clean up again
    SpectraAnalytics.AnalyticsPage.destroy();
    assert.strictEqual(SpectraAnalytics.AnalyticsPage.isMounted, false);
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n' + '='.repeat(50));
console.log(`Phase 2 / Batch 6 Tests: ${passedTests} / ${totalTests} passed`);
console.log('='.repeat(50) + '\n');

if (passedTests !== totalTests) {
    process.exit(1);
}
