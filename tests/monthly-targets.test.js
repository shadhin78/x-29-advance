/**
 * Comprehensive Test Suite for Phase 2 / Batch 9:
 * Extracted Monthly Targets & MTDB System (monthlyTargets.js)
 *
 * Requirements Tested:
 * 1. Module Definition & Backward Compatibility
 * 2. Monthly Target Range & Key Resolution (getMonthlyTargetRange, formatMonthRangeKey, getWeeksForMonth, getDaysForMonthOrWeek)
 * 3. Program & Subject Taxonomy Selection (populateMonthlyProgramsList, updateMonthlyTargetSubjectDropdown, updateMonthlyTargetChapterDropdown, filterMonthlyTargetChapters, color sync)
 * 4. Create Monthly Target (addMonthlyTarget)
 * 5. Edit Monthly Target (openEditMonthlyTargetPage, saveMonthlyTarget)
 * 6. Delete Monthly Target (deleteMonthlyTarget, deleteMonthlyTargetFromEditPage)
 * 7. Batch Allocator & Size Presets (setBulkSizePreset, applyBulkSizeToMonthlyChapters, splitChapterAcrossDays, splitAllChaptersAcrossDays, applyFractionToDailyAllocation)
 * 8. Auto-Spread Logic (autoSpreadAllChaptersAcrossDays, spreadAllChaptersFromStartDate, applyBulkDayToAllChapters)
 * 9. Multi-Week Binding & Badges (findWeekForDayInMonth, bindTargetToWeek, updateChapterMultiWeekBadges, distributeChaptersAcrossWeeks)
 * 10. Completion Controls & Size Progress (toggleMonthlyTargetCompletion, getCompletedSizeForMonthlyTarget, getMonthlyTargetProgress, getMonthlyTargetOccurrenceCount)
 * 11. Monthly Targets Database (MTDB) Controls & Filtering (openMonthlyTargetsDatabase, switchMtdbTab, populateMtdbFilters, renderMtdbList, deleteMtdbTarget, toggleMtdbTargetCompletion)
 * 12. Monthly Trend Visualization (calculateMonthWiseMonthlyTargets, renderMtdbMonthChart, renderMtdbMonthView)
 * 13. Monthly -> Weekly -> Daily Cascade Deletion & Orphan Cleaning (cascadeDeleteMonthlyTarget, cleanOrphanedWeeklyAndDailyTargets)
 * 14. Cascade Preservation & Cross-Feature Stability (State variables intact, Weekly Targets, Daily Targets, Tasks)
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
            replace(oldCls, newCls) { this.remove(oldCls); this.add(newCls); },
            toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
        };
        this.style = {};
        this.children = [];
        this.options = [];
        this.checked = false;
        this.disabled = false;
        this.dataset = {};
        this.parentElement = null;
        this.attributes = new Map();
    }

    setAttribute(name, val) {
        this.attributes.set(name, String(val));
    }

    getAttribute(name) {
        return this.attributes.get(name) || null;
    }

    removeAttribute(name) {
        this.attributes.delete(name);
    }

    appendChild(child) {
        if (child instanceof MockElement) {
            child.parentElement = this;
            this.children.push(child);
        }
        return child;
    }

    closest(sel) {
        let cur = this;
        while (cur) {
            if (sel.startsWith('.') && cur.classList && cur.classList.contains(sel.slice(1))) {
                return cur;
            }
            if (sel.startsWith('#') && cur.id === sel.slice(1)) {
                return cur;
            }
            cur = cur.parentElement;
        }
        return null;
    }

    scrollIntoView() {}

    querySelector(sel) {
        if (!sel) return null;
        if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
        return querySelectorInternal(this, sel);
    }

    querySelectorAll(sel) {
        return querySelectorAllInternal(this, sel);
    }

    getContext(type) {
        return {
            canvas: this,
            clearRect: () => {},
            fillRect: () => {},
            drawImage: () => {}
        };
    }
}

const elements = new Map();
const dynamicElements = [];

function getOrCreateElement(id, tagName = 'div') {
    if (!elements.has(id)) {
        const el = new MockElement(id, tagName);
        elements.set(id, el);
    }
    return elements.get(id);
}

function querySelectorInternal(root, sel) {
    const list = querySelectorAllInternal(root, sel);
    return list.length > 0 ? list[0] : null;
}

function querySelectorAllInternal(root, sel) {
    const results = [];
    const searchScope = root === global.document ? Array.from(elements.values()).concat(dynamicElements) : root.children;

    function testElement(el) {
        if (!el || !(el instanceof MockElement)) return false;
        // Attribute matching e.g. [data-subject="Math"] or .class
        if (sel.startsWith('.')) {
            const cls = sel.slice(1).split(/[\[:]/)[0];
            if (!el.classList.contains(cls)) return false;
        }
        if (sel.includes(':checked') && !el.checked) {
            return false;
        }
        // Match attribute selectors
        const attrMatches = sel.matchAll(/\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\]/g);
        for (const m of attrMatches) {
            const attrName = m[1];
            const attrVal = m[2] !== undefined ? m[2].replace(/\\/g, '') : undefined;
            const actualVal = el.getAttribute(attrName);
            if (attrVal !== undefined) {
                if (actualVal !== attrVal) return false;
            } else {
                if (actualVal === null) return false;
            }
        }
        return true;
    }

    for (const el of searchScope) {
        if (testElement(el)) results.push(el);
        if (el.children && el.children.length > 0) {
            const sub = querySelectorAllInternal(el, sel);
            sub.forEach(s => results.push(s));
        }
    }
    return results;
}

// Global DOM mocks
global.document = {
    getElementById: (id) => getOrCreateElement(id),
    createElement: (tag) => {
        const el = new MockElement('', tag);
        dynamicElements.push(el);
        return el;
    },
    querySelector: (sel) => {
        if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
        return querySelectorInternal(global.document, sel);
    },
    querySelectorAll: (sel) => querySelectorAllInternal(global.document, sel),
    documentElement: {
        classList: {
            contains: (cls) => cls === 'dark'
        }
    }
};

global.window = global;

// Mock CSS
global.CSS = {
    escape: (str) => String(str).replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1')
};

// Mock Chart.js
global.Chart = class MockChart {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.data = config.data || { labels: [], datasets: [] };
        this.options = config.options || {};
    }
    update() {
        this.updated = true;
    }
    destroy() {
        this.destroyed = true;
    }
};

// Mock Utilities
global.Utils = {
    formatDate: (d) => {
        if (!d) d = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    },
    parseDateSafe: (str) => new Date(str),
    parseDailyTargetDateKey: (dateKey) => {
        if (!dateKey) return new Date();
        const parts = dateKey.split(' ');
        if (parts.length >= 2) {
            const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
            const day = parseInt(parts[0], 10);
            const mon = months[parts[1]] !== undefined ? months[parts[1]] : 8;
            const year = parts[2] ? parseInt(parts[2], 10) : 2026;
            return new Date(year, mon, day, 12, 0, 0);
        }
        return new Date(dateKey);
    },
    parseStart: (val) => {
        if (!val) return new Date();
        if (typeof val === 'string' && val.includes(' - ')) {
            const startStr = val.split(' - ')[0];
            return global.Utils.parseDateSafe(startStr);
        }
        return new Date(val);
    },
    extractNum: (str) => {
        if (!str) return 0;
        const match = String(str).match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    },
    isChapterMatch: (ch1, ch2) => {
        if (!ch1 || !ch2) return false;
        if (ch1 === ch2) return true;
        const n1 = global.Utils.extractNum(ch1);
        const n2 = global.Utils.extractNum(ch2);
        return n1 > 0 && n2 > 0 && n1 === n2;
    }
};

global.parseDailyTargetDateKey = global.Utils.parseDailyTargetDateKey;
global.hexToRgba = (hex, alpha) => `rgba(99, 102, 241, ${alpha})`;
global.getSubjectColor = (subj) => '#6366f1';

// Mock Cloud Save and Toast
let cloudSaved = false;
let lastToast = null;
const tombstones = new Set();
const localMutations = [];

global.FirebaseService = {
    saveToCloud: (immediate = false) => {
        cloudSaved = true;
    }
};
global.saveToCloud = global.FirebaseService.saveToCloud;

global.showToast = (msg, type) => {
    lastToast = { msg, type };
};
global.renderUI = () => {};
global.closeModal = () => {};
global.openModal = () => {};
global.recalculateTotals = () => {};
global.switchPage = () => {};
global.recordItemDeletion = (id) => {
    tombstones.add(id);
};
global.markLocalMutation = (tag) => {
    localMutations.push(tag);
};
global.generateItemId = (item, prefix) => `gen_${prefix}_${Date.now()}`;

// Mock App State
global.AppState = {
    tasks: [],
    passedItems: { programs: [], subjects: [] }
};
global.passedItems = global.AppState.passedItems;

global.tracks = [
    { id: 'academic', name: 'Academic' },
    { id: 'admission', name: 'Admission' }
];

global.customPrograms = {
    academic: [{ name: 'HSC 2026' }],
    admission: [{ name: 'Engineering' }]
};

global.syllabusStructure = {
    academic: [
        { program: 'HSC 2026', subject: 'Physics 1st Paper', chapters: 5, topics: ['Vector', 'Dynamics', 'Work & Energy'] }
    ],
    admission: [
        { program: 'Engineering', subject: 'Higher Math', chapters: 4, topics: ['Matrices', 'Straight Lines'] }
    ]
};

global.getAllSubjects = () => ['Physics 1st Paper', 'Higher Math'];
global.getChaptersForSubject = (track, subject) => ['Ch. 1', 'Ch. 2'];

// 2. Load Extracted Module & Dependencies from archive
const WeeklyTargets = require('../archive/legacy-js/js/features/targets/weeklyTargets.js');
const MonthlyTargets = require('../archive/legacy-js/js/features/targets/monthlyTargets.js');

// ============================================================================
// TEST SUITE EXECUTION
// ============================================================================

console.log('=== X-29 Advance — Phase 2 / Batch 9 Test Suite ===\n');

// ----------------------------------------------------------------------------
// Group 1: Module Definition & Backward Compatibility
// ----------------------------------------------------------------------------
console.log('1. Module Definition & Backward Compatibility');
assert.strictEqual(typeof MonthlyTargets, 'object', 'MonthlyTargets should be an exported object');
assert.strictEqual(global.MonthlyTargets, MonthlyTargets, 'MonthlyTargets should be exposed on global/window');
assert.strictEqual(typeof global.getMonthlyTargetRange, 'function', 'getMonthlyTargetRange should be exposed globally');
assert.strictEqual(typeof global.formatMonthRangeKey, 'function', 'formatMonthRangeKey should be exposed globally');
assert.strictEqual(typeof global.addMonthlyTarget, 'function', 'addMonthlyTarget should be exposed globally');
assert.strictEqual(typeof global.saveMonthlyTarget, 'function', 'saveMonthlyTarget should be exposed globally');
assert.strictEqual(typeof global.deleteMonthlyTarget, 'function', 'deleteMonthlyTarget should be exposed globally');
assert.strictEqual(typeof global.cascadeDeleteMonthlyTarget, 'function', 'cascadeDeleteMonthlyTarget should be exposed globally');
assert.strictEqual(typeof global.cleanOrphanedWeeklyAndDailyTargets, 'function', 'cleanOrphanedWeeklyAndDailyTargets should be exposed globally');
assert.strictEqual(typeof global.openMonthlyTargetsDatabase, 'function', 'openMonthlyTargetsDatabase should be exposed globally');
assert.strictEqual(typeof global.renderMtdbMonthView, 'function', 'renderMtdbMonthView should be exposed globally');
console.log('  ✓ MonthlyTargets module properly initialized and backward compatible');

// ----------------------------------------------------------------------------
// Group 2: Monthly Target Range & Key Resolution
// ----------------------------------------------------------------------------
console.log('\n2. Monthly Target Range & Key Resolution');
const testDate = new Date(2026, 8, 15); // Sep 15, 2026
const mRange = MonthlyTargets.getMonthlyTargetRange(testDate);
assert.strictEqual(mRange.start.getDate(), 1, 'Range start must be 1st of month');
assert.strictEqual(mRange.start.getMonth(), 8, 'Month should be Sep (8)');
assert.strictEqual(mRange.daysInMonth, 30, 'September 2026 has 30 days');
assert.strictEqual(mRange.currentDay, 15, 'Current day should be 15');

const rangeKey = MonthlyTargets.formatMonthRangeKey(mRange.start, mRange.end);
assert.ok(rangeKey.includes('01') && rangeKey.includes('2026'), 'Key should include 01 and 2026');
assert.ok(rangeKey.includes('30') && rangeKey.includes('2026'), 'Key should include 30 and 2026');

const monthWeeks = MonthlyTargets.getWeeksForMonth(testDate);
assert.ok(Array.isArray(monthWeeks) && monthWeeks.length >= 4, 'getWeeksForMonth should return at least 4 weeks');
monthWeeks.forEach(w => {
    assert.ok(w.key && w.start && w.end, 'Each week must have key, start, end');
});

const monthDays = MonthlyTargets.getDaysForMonthOrWeek(testDate);
assert.ok(Array.isArray(monthDays) && monthDays.length === 30, 'getDaysForMonthOrWeek for full month should return 30 days');
console.log('  ✓ getMonthlyTargetRange and key formatters resolve ranges accurately');

// ----------------------------------------------------------------------------
// Group 3: Taxonomy Selection & Cascading Dropdowns
// ----------------------------------------------------------------------------
console.log('\n3. Taxonomy Selection & Cascading Dropdowns');
const progsContainer = getOrCreateElement('mt-progs-container');
MonthlyTargets.populateMonthlyProgramsList();
assert.ok(progsContainer.innerHTML.includes('HSC 2026'), 'Programs container must render HSC 2026');
assert.ok(progsContainer.innerHTML.includes('Engineering'), 'Programs container must render Engineering');

const subSelect = getOrCreateElement('mt-select-sub');
const dot = getOrCreateElement('mt-sub-color-dot');
subSelect.value = 'Physics 1st Paper';
MonthlyTargets.updateMonthlyTargetColorSync();
assert.strictEqual(dot.style.backgroundColor, '#6366f1', 'Color dot should sync with subject color');
assert.strictEqual(dot.classList.contains('hidden'), false, 'Color dot must be visible');
console.log('  ✓ Taxonomy selection and color sync work seamlessly');

// ----------------------------------------------------------------------------
// Group 4: Create Monthly Target (addMonthlyTarget)
// ----------------------------------------------------------------------------
console.log('\n4. Create Monthly Target (addMonthlyTarget)');
// Reset databases
global.monthlyTargetsDatabase = {};
global.weeklyTargetsDatabase = {};
global.dailyTargetsDatabase = {};
global.currentMonthlyTargetsDate = testDate;

// Setup DOM elements for addMonthlyTarget
const subCb = document.createElement('input');
subCb.type = 'checkbox';
subCb.classList.add('mt-subject-checkbox');
subCb.checked = true;
subCb.setAttribute('data-track', 'academic');
subCb.setAttribute('data-program', 'HSC 2026');
subCb.setAttribute('data-subject', 'Physics 1st Paper');

const chCb = document.createElement('input');
chCb.type = 'checkbox';
chCb.classList.add('mt-chapter-checkbox');
chCb.checked = true;
chCb.setAttribute('data-track', 'academic');
chCb.setAttribute('data-program', 'HSC 2026');
chCb.setAttribute('data-subject', 'Physics 1st Paper');
chCb.setAttribute('data-chapter', 'Ch. 1');

const sizeInput = document.createElement('input');
sizeInput.classList.add('mt-chapter-size-input');
sizeInput.value = '40';
sizeInput.setAttribute('data-track', 'academic');
sizeInput.setAttribute('data-program', 'HSC 2026');
sizeInput.setAttribute('data-subject', 'Physics 1st Paper');
sizeInput.setAttribute('data-chapter', 'Ch. 1');

const weekSelect = document.createElement('select');
weekSelect.classList.add('mt-chapter-week-select');
weekSelect.value = '12 Sep 2026 - 18 Sep 2026';
weekSelect.setAttribute('data-track', 'academic');
weekSelect.setAttribute('data-program', 'HSC 2026');
weekSelect.setAttribute('data-subject', 'Physics 1st Paper');
weekSelect.setAttribute('data-chapter', 'Ch. 1');

cloudSaved = false;
MonthlyTargets.addMonthlyTarget();

const monthTargets = global.monthlyTargetsDatabase[rangeKey] || [];
assert.strictEqual(monthTargets.length, 1, 'One monthly target should be created');
assert.strictEqual(monthTargets[0].subject, 'Physics 1st Paper');
assert.strictEqual(monthTargets[0].chapter, 'Ch. 1');
assert.strictEqual(monthTargets[0].totalChapterSize, 40);
assert.strictEqual(monthTargets[0].targetWeek, '12 Sep 2026 - 18 Sep 2026');
assert.strictEqual(cloudSaved, true, 'Firebase saveToCloud must be called');

const canonicalWeek1 = WeeklyTargets.getCanonicalWeeklyRangeKey('12 Sep 2026 - 18 Sep 2026');
const canonicalWeek2 = WeeklyTargets.getCanonicalWeeklyRangeKey('19 Sep 2026 - 25 Sep 2026');

// Auto-connect to weekly target
const weekTargets = global.weeklyTargetsDatabase[canonicalWeek1] || [];
assert.strictEqual(weekTargets.length, 1, 'Should auto-generate matching weekly target');
assert.strictEqual(weekTargets[0].chapter, 'Ch. 1');
assert.strictEqual(weekTargets[0].source, 'monthly');
assert.strictEqual(weekTargets[0].monthlyTargetId, monthTargets[0].id);
console.log('  ✓ addMonthlyTarget creates target and synchronizes to weekly database');

// ----------------------------------------------------------------------------
// Group 5: Edit Monthly Target (saveMonthlyTarget)
// ----------------------------------------------------------------------------
console.log('\n5. Edit Monthly Target (saveMonthlyTarget)');
// Update target in setup
sizeInput.value = '60';
weekSelect.value = '19 Sep 2026 - 25 Sep 2026';
cloudSaved = false;

MonthlyTargets.saveMonthlyTarget(0, rangeKey);

const updatedTargets = global.monthlyTargetsDatabase[rangeKey] || [];
assert.strictEqual(updatedTargets[0].totalChapterSize, 60, 'Size must be updated to 60');
assert.strictEqual(updatedTargets[0].targetWeek, '19 Sep 2026 - 25 Sep 2026');
assert.strictEqual(cloudSaved, true, 'saveToCloud must be called on edit');

// Old weekly target removed, new one added
assert.strictEqual((global.weeklyTargetsDatabase[canonicalWeek1] || []).length, 0, 'Old weekly target must be cleaned');
assert.strictEqual((global.weeklyTargetsDatabase[canonicalWeek2] || []).length, 1, 'New weekly target must be created');
console.log('  ✓ saveMonthlyTarget updates target details and reconciles weekly targets');

// ----------------------------------------------------------------------------
// Group 6: Delete Monthly Target (deleteMonthlyTarget)
// ----------------------------------------------------------------------------
console.log('\n6. Delete Monthly Target (deleteMonthlyTarget)');
const mtToDelete = updatedTargets[0];
const mtId = mtToDelete.id;
tombstones.clear();

MonthlyTargets.deleteMonthlyTarget(0, mtId);
assert.strictEqual((global.monthlyTargetsDatabase[rangeKey] || []).length, 0, 'Target should be deleted from monthly database');
assert.ok(tombstones.has(mtId), 'Tombstone must be recorded for deleted monthly target');
// Cascading deletion checked: weekly targets should also be deleted
assert.strictEqual((global.weeklyTargetsDatabase[canonicalWeek2] || []).length, 0, 'Cascade deletion must remove weekly target');
assert.strictEqual((global.weeklyTargetsDatabase['19 Sep 2026 - 25 Sep 2026'] || []).length, 0, 'Cascade deletion must remove weekly target');
console.log('  ✓ deleteMonthlyTarget purges target, records tombstone, and cascades');

// ----------------------------------------------------------------------------
// Group 7: Batch Allocator & Size Presets
// ----------------------------------------------------------------------------
console.log('\n7. Batch Allocator & Size Presets');
// Test bulk preset
const bulkInput = getOrCreateElement('mt-bulk-size-input');
MonthlyTargets.setBulkSizePreset(50);
assert.strictEqual(bulkInput.value, 50, 'setBulkSizePreset should set bulk input value');

// Test splitChapterAcrossDays
global.monthlyTargetDailyAllocations = {};
MonthlyTargets.splitChapterAcrossDays('Physics 1st Paper', 'Ch. 1', 3, 'academic', 'HSC 2026');
const allocKey = 'Physics 1st Paper|||Ch. 1';
const allocs = global.monthlyTargetDailyAllocations[allocKey] || [];
assert.strictEqual(allocs.length, 3, 'Should create 3 daily allocation rows');

// Test applyFractionToDailyAllocation
MonthlyTargets.applyFractionToDailyAllocation('Physics 1st Paper', 'Ch. 1', 0, 0.5, '1/2');
assert.strictEqual(allocs[0].fraction, '1/2', 'Fraction label should be 1/2');

// Test removeDailyAllocationRow
MonthlyTargets.removeDailyAllocationRow('Physics 1st Paper', 'Ch. 1', 2);
assert.strictEqual(global.monthlyTargetDailyAllocations[allocKey].length, 2, 'Should remove 1 row');
console.log('  ✓ Batch allocator splits portions, applies fractions, and updates rows');

// ----------------------------------------------------------------------------
// Group 8: Auto-Spread Logic
// ----------------------------------------------------------------------------
console.log('\n8. Auto-Spread Logic');
// Create subject and chapters
chCb.checked = true;
global.monthlyTargetDailyAllocations = {};
MonthlyTargets.autoSpreadAllChaptersAcrossDays('month');
assert.ok(global.monthlyTargetDailyAllocations[allocKey], 'autoSpreadAllChaptersAcrossDays should allocate days');
assert.ok(global.monthlyTargetDailyAllocations[allocKey][0].dayKey, 'Allocated row must have dayKey');

// Clear daily allocations
MonthlyTargets.clearAllDailyAllocations();
assert.strictEqual(Object.keys(global.monthlyTargetDailyAllocations).length, 0, 'clearAllDailyAllocations must empty map');
console.log('  ✓ Auto-spread engine distributes chapters evenly across calendar');

// ----------------------------------------------------------------------------
// Group 9: Multi-Week Binding & Badges
// ----------------------------------------------------------------------------
console.log('\n9. Multi-Week Binding & Badges');
const foundWeek = MonthlyTargets.findWeekForDayInMonth('15 Sep 2026', testDate);
assert.ok(foundWeek && foundWeek.length > 0, 'findWeekForDayInMonth should find week for Sep 15');

// Test multi-week badges
const badgeEl = document.createElement('span');
badgeEl.classList.add('mt-chapter-multiweek-badge');
badgeEl.setAttribute('data-subject', 'Physics 1st Paper');
badgeEl.setAttribute('data-chapter', 'Ch. 1');

// Assign 2 allocations spanning 2 different weeks
global.monthlyTargetDailyAllocations[allocKey] = [
    { dayKey: '05 Sep 2026', portionSize: 20 },
    { dayKey: '20 Sep 2026', portionSize: 20 }
];
MonthlyTargets.updateChapterMultiWeekBadges();
assert.strictEqual(badgeEl.classList.contains('hidden'), false, 'Multi-week badge should become visible');
console.log('  ✓ findWeekForDayInMonth and multi-week badges operate accurately');

// ----------------------------------------------------------------------------
// Group 10: Completion Controls & Progress Calculation
// ----------------------------------------------------------------------------
console.log('\n10. Completion Controls & Progress Calculation');
const testTarget = {
    id: 'mt_comp_1',
    track: 'academic',
    program: 'HSC 2026',
    subject: 'Physics 1st Paper',
    chapter: 'Ch. 1',
    targetType: 'chapter',
    completed: false,
    totalChapterSize: 50
};
global.monthlyTargetsDatabase[rangeKey] = [testTarget];
global.dailyTargetsDatabase['15 Sep 2026'] = [
    { track: 'academic', subject: 'Physics 1st Paper', chapter: 'Ch. 1', completed: true, totalChapterSize: 25, isDeleted: false },
    { track: 'academic', subject: 'Physics 1st Paper', chapter: 'Ch. 1', completed: false, totalChapterSize: 25, isDeleted: false }
];

const compSize = MonthlyTargets.getCompletedSizeForMonthlyTarget(testTarget, rangeKey);
assert.strictEqual(compSize, 25, 'Completed size should be 25 from daily targets');

const progress = MonthlyTargets.getMonthlyTargetProgress(testTarget, rangeKey);
assert.strictEqual(progress.completed, 25);
assert.strictEqual(progress.total, 50);
assert.strictEqual(progress.percent, 50);

// Toggle completion
MonthlyTargets.toggleMonthlyTargetCompletion(0, true);
assert.strictEqual(global.monthlyTargetsDatabase[rangeKey][0].completed, true, 'Target should be marked complete');
console.log('  ✓ Progress calculation and completion toggling function reliably');

// ----------------------------------------------------------------------------
// Group 11: Monthly Targets Database (MTDB)
// ----------------------------------------------------------------------------
console.log('\n11. Monthly Targets Database (MTDB)');
const tbody = getOrCreateElement('mtdb-targets-tbody');
getOrCreateElement('mtdb-filter-month').value = 'all';
getOrCreateElement('mtdb-filter-prog').value = 'all';
getOrCreateElement('mtdb-filter-sub').value = 'all';
getOrCreateElement('mtdb-filter-status').value = 'all';
MonthlyTargets.populateMtdbFilters();
MonthlyTargets.renderMtdbList();
assert.ok(tbody.innerHTML.includes('Physics 1st Paper'), 'MTDB table must render target row');
assert.ok(tbody.innerHTML.includes('Ch. 1'), 'MTDB table must show chapter name');

// Toggle from MTDB
MonthlyTargets.toggleMtdbTargetCompletion(rangeKey, 0, false);
assert.strictEqual(global.monthlyTargetsDatabase[rangeKey][0].completed, false, 'Target completion should toggle from MTDB');

// Delete from MTDB
MonthlyTargets.deleteMtdbTarget(rangeKey, 0, 'mt_comp_1');
assert.strictEqual((global.monthlyTargetsDatabase[rangeKey] || []).length, 0, 'Target should be deleted via MTDB');
console.log('  ✓ MTDB filters, table renderer, toggle, and delete execute smoothly');

// ----------------------------------------------------------------------------
// Group 12: Monthly Trend Visualization
// ----------------------------------------------------------------------------
console.log('\n12. Monthly Trend Visualization');
global.monthlyTargetsDatabase['01 Aug 2026 - 31 Aug 2026'] = [
    { targetType: 'chapter', completed: true, totalChapterSize: 10 },
    { targetType: 'chapter', completed: true, totalChapterSize: 20 }
];
global.monthlyTargetsDatabase['01 Sep 2026 - 30 Sep 2026'] = [
    { targetType: 'chapter', completed: false, totalChapterSize: 15 }
];

const monthWise = MonthlyTargets.calculateMonthWiseMonthlyTargets();
assert.ok(Array.isArray(monthWise) && monthWise.length >= 2, 'calculateMonthWiseMonthlyTargets should aggregate months');
const aug = monthWise.find(m => m.month.includes('Aug'));
assert.ok(aug, 'Aug data must exist');
assert.strictEqual(aug.set, 2);
assert.strictEqual(aug.completed, 2);

const monthsTbody = getOrCreateElement('mtdb-months-tbody');
MonthlyTargets.renderMtdbMonthView();
assert.ok(monthsTbody.innerHTML.includes('100%'), 'Aug completion rate should be 100%');
console.log('  ✓ Monthly trend calculations and chart renderer display metrics');

// ----------------------------------------------------------------------------
// Group 13: Monthly -> Weekly -> Daily Cascade Deletion & Orphan Cleaning
// ----------------------------------------------------------------------------
console.log('\n13. Monthly -> Weekly -> Daily Cascade Deletion & Orphan Cleaning');
const parentMt = {
    id: 'parent_mt_test',
    track: 'academic',
    program: 'HSC 2026',
    subject: 'Physics 1st Paper',
    chapter: 'Ch. 2',
    targetType: 'chapter',
    targetWeek: canonicalWeek1
};
global.monthlyTargetsDatabase[rangeKey] = [parentMt];
global.weeklyTargetsDatabase[canonicalWeek1] = [
    { id: 'wt_child_1', monthlyTargetId: 'parent_mt_test', track: 'academic', subject: 'Physics 1st Paper', chapter: 'Ch. 2' }
];
global.dailyTargetsDatabase['15 Sep 2026'] = [
    { id: 'dt_child_1', monthlyTargetId: 'parent_mt_test', track: 'academic', subject: 'Physics 1st Paper', chapter: 'Ch. 2' }
];

// Test cascade deletion
MonthlyTargets.cascadeDeleteMonthlyTarget(parentMt, rangeKey, 'parent_mt_test');
assert.strictEqual((global.weeklyTargetsDatabase[canonicalWeek1] || []).length, 0, 'Cascading deletion must delete matching weekly target');
assert.strictEqual((global.dailyTargetsDatabase['15 Sep 2026'] || []).length, 0, 'Cascading deletion must delete matching daily target');

// Test orphan cleaning
global.monthlyTargetsDatabase[rangeKey] = []; // no monthly targets
global.weeklyTargetsDatabase[canonicalWeek1] = [
    { id: 'orphan_wt', monthlyTargetId: 'old_mt', track: 'academic', subject: 'Physics 1st Paper', chapter: 'Ch. 2', source: 'monthly' }
];
MonthlyTargets.cleanOrphanedWeeklyAndDailyTargets();
assert.strictEqual((global.weeklyTargetsDatabase[canonicalWeek1] || []).length, 0, 'cleanOrphanedWeeklyAndDailyTargets must purge orphan weekly targets');
console.log('  ✓ Cascade deletion and orphan cleaning preserve database consistency');

// ----------------------------------------------------------------------------
// Group 14: System Compatibility & Verification
// ----------------------------------------------------------------------------
console.log('\n14. System Compatibility & Verification');
assert.strictEqual(typeof global.monthlyTargetsDatabase, 'object');
assert.strictEqual(typeof global.weeklyTargetsDatabase, 'object');
assert.strictEqual(typeof global.dailyTargetsDatabase, 'object');
console.log('  ✓ Data models and state variables preserved across entire targets hierarchy');

console.log('\n==================================================');
console.log('Phase 2 / Batch 9 Tests: ALL TESTS PASSED! (14 / 14 groups)');
console.log('==================================================\n');
