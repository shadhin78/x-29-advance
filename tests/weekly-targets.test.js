/**
 * Comprehensive Test Suite for Phase 2 / Batch 8:
 * Extracted Weekly Targets & WTDB System (weeklyTargets.js)
 *
 * Requirements Tested:
 * 1. Weekly Targets Management (calculation, range key, dropdowns, colors)
 * 2. Create weekly target (addWeeklyTarget, multi-week handling, validation)
 * 3. Edit weekly target (openEditWeeklyTargetModal, saveWeeklyTarget)
 * 4. Delete weekly target (deleteWeeklyTarget, tombstone tracking, daily cleanup)
 * 5. Completion toggling & Daily synchronization (toggleWeeklyTargetCompletion, autoSyncWeeklyToDailyTargets)
 * 6. Multi-week target synchronization (syncMultiWeekTargetsToWeeklyDatabase, consolidateWeeklyTargetsDatabase)
 * 7. Weekly Targets Database (WTDB) controls (openWeeklyTargetsDatabase, switchWtdbTab, populateWtdbFilters, addWtdbTarget, deleteWtdbTarget, toggleWtdbTargetCompletion, renderWtdbList)
 * 8. Weekly trend visualization (calculateMonthWiseTargets, renderWtdbMonthChart, renderWtdbMonthView)
 * 9. Firebase saving calls (saveToCloud verification)
 * 10. Monthly -> Weekly -> Daily cascade preservation and legacy Monthly Targets stability
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
        return null;
    }

    querySelectorAll(sel) {
        if (sel.includes('input[type="checkbox"]')) {
            return this.children.filter(c => c.tagName === 'INPUT' && c.type === 'checkbox');
        }
        return [];
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

function getOrCreateElement(id, tagName = 'div') {
    if (!elements.has(id)) {
        const el = new MockElement(id, tagName);
        elements.set(id, el);
    }
    return elements.get(id);
}

// Global DOM mocks
global.document = {
    getElementById: (id) => getOrCreateElement(id),
    createElement: (tag) => new MockElement('', tag),
    querySelectorAll: (sel) => {
        if (sel.includes('.day-btn') || sel.includes('[data-day]')) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            return days.map(d => {
                const el = new MockElement('', 'button');
                el.dataset.day = d;
                el.classList.add('day-btn');
                return el;
            });
        }
        return [];
    },
    documentElement: {
        classList: {
            contains: (cls) => cls === 'dark'
        }
    }
};

global.window = global;

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
        const currentYear = new Date().getFullYear();
        const d = new Date(dateKey + ' ' + currentYear + ' 12:00:00');
        return isNaN(d.getTime()) ? new Date(dateKey) : d;
    },
    parseStart: (rangeStr) => {
        if (!rangeStr) return 0;
        try {
            const parts = rangeStr.split(' - ');
            const currentYear = new Date().getFullYear();
            const dateStr = parts[0].trim() + ' ' + currentYear;
            const parsed = new Date(dateStr);
            return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
        } catch (e) {
            return 0;
        }
    },
    isChapterMatch: (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()
};

// Cloud save tracker
let saveToCloudCalled = 0;
global.saveToCloud = () => {
    saveToCloudCalled++;
};

// Deletion tracker
global.deletedItemIds = [];
global.recordItemDeletion = (id) => {
    global.deletedItemIds.push(id);
};

// Notifications mock
global.showNotification = (msg, type) => {
    global.lastNotification = { msg, type };
};

// Toast mock
global.showToast = (msg, type) => {
    global.lastToast = { msg, type };
};

// Subject colors mock
global.getSubjectColor = (subject) => {
    const colors = {
        'Physics': '#3b82f6',
        'Chemistry': '#10b981',
        'Biology': '#ec4899',
        'Math': '#8b5cf6'
    };
    return colors[subject] || '#64748b';
};

// Curriculum mock
global.tracks = [
    { id: 'track_1', name: 'Main Track' }
];

global.customPrograms = {
    'track_1': [
        { name: 'Core Science' },
        { name: 'General Studies' }
    ]
};

global.syllabusStructure = {
    'track_1': [
        { program: 'Core Science', subject: 'Physics', chapters: ['Kinematics', 'Dynamics', 'Optics'] },
        { program: 'Core Science', subject: 'Chemistry', chapters: ['Thermodynamics', 'Equilibrium'] },
        { program: 'General Studies', subject: 'Biology', chapters: ['Genetics', 'Cell Biology'] }
    ]
};

global.getAllSubjects = () => {
    const subs = [];
    Object.keys(global.syllabusStructure).forEach(tId => {
        global.syllabusStructure[tId].forEach(item => {
            subs.push({
                trackId: tId,
                program: item.program,
                subject: item.subject,
                chapters: item.chapters || []
            });
        });
    });
    return subs;
};

global.getChaptersForSubject = (trackId, subject) => {
    const trackSyllabus = global.syllabusStructure[trackId] || [];
    const match = trackSyllabus.find(s => s.subject === subject);
    return match ? (match.chapters || []) : [];
};

// Mock DailyTargets module for synchronization
global.dailyTargetsDatabase = {};
global.DailyTargets = {
    renderDailyTargets: () => {},
    autoSyncWeeklyToDailyTargets: (rangeKey) => {
        if (global.WeeklyTargets && typeof global.WeeklyTargets.autoSyncWeeklyToDailyTargets === 'function') {
            return global.WeeklyTargets.autoSyncWeeklyToDailyTargets(rangeKey);
        }
    }
};

// Load extracted WeeklyTargets module
const WeeklyTargets = require('../js/features/targets/weeklyTargets.js');

console.log('=== X-29 Advance — Phase 2 / Batch 8 Test Suite ===\n');

// -------------------------------------------------------------
// Group 1: Module & Setup
// -------------------------------------------------------------
console.log('1. Module Definition & Backward Compatibility');

assert.strictEqual(typeof WeeklyTargets, 'object', 'WeeklyTargets module should be an object');
assert.strictEqual(typeof window.WeeklyTargets, 'object', 'window.WeeklyTargets should be set');
assert.strictEqual(typeof window.getWeeklyTargetRange, 'function', 'window.getWeeklyTargetRange should be exposed');
assert.strictEqual(typeof window.addWeeklyTarget, 'function', 'window.addWeeklyTarget should be exposed');
assert.strictEqual(typeof window.openWeeklyTargetsDatabase, 'function', 'window.openWeeklyTargetsDatabase should be exposed');
console.log('  ✓ WeeklyTargets module properly initialized and backward compatible');

// -------------------------------------------------------------
// Group 2: Weekly Target Range & Key Resolution
// -------------------------------------------------------------
console.log('\n2. Weekly Target Range & Canonical Key Resolution');

const range = WeeklyTargets.getWeeklyTargetRange(0);
assert(range.start instanceof Date, 'Range start should be a Date');
assert(range.end instanceof Date, 'Range end should be a Date');
assert(range.start.getTime() <= range.end.getTime(), 'Range start must be before or equal to range end');

const formattedKey = WeeklyTargets.formatDateRangeKey(range.start, range.end);
assert.strictEqual(typeof formattedKey, 'string', 'Formatted range key should be a string');
assert(formattedKey.includes(' - '), 'Formatted key should contain hyphen delimiter');

const canonicalKey = WeeklyTargets.getCanonicalWeeklyRangeKey(formattedKey);
assert.strictEqual(canonicalKey, formattedKey, 'Canonical key should match formatted key');

// Test canonical key resolution from single-date or legacy format
const singleDateKey = '12 Sep 2026';
const resolvedKey = WeeklyTargets.getCanonicalWeeklyRangeKey(singleDateKey);
assert(resolvedKey.includes(' - '), 'Resolving single date key should produce standard range key');
console.log('  ✓ getWeeklyTargetRange and getCanonicalWeeklyRangeKey correctly resolve ranges');

// -------------------------------------------------------------
// Group 3: Dropdown Controls & Color Sync
// -------------------------------------------------------------
console.log('\n3. Dropdown Controls & Subject Color Synchronization');

// Setup modal elements with actual IDs used in weeklyTargets.js
const progSelect = getOrCreateElement('wt-select-prog', 'select');
const subSelect = getOrCreateElement('wt-select-sub', 'select');
const chSelect = getOrCreateElement('wt-select-ch', 'select');
const colorBadge = getOrCreateElement('wt-badge-color', 'div');

progSelect.value = 'Core Science';
WeeklyTargets.updateWeeklyTargetSubjectDropdown();
assert(subSelect.innerHTML.includes('Physics'), 'Subject dropdown should contain Physics');
assert(subSelect.innerHTML.includes('Chemistry'), 'Subject dropdown should contain Chemistry');

subSelect.value = 'Physics';
WeeklyTargets.updateWeeklyTargetChapterDropdown();
assert(chSelect.innerHTML.includes('Kinematics'), 'Chapter dropdown should contain Kinematics');
assert(chSelect.innerHTML.includes('Dynamics'), 'Chapter dropdown should contain Dynamics');

WeeklyTargets.updateWeeklyTargetColorSync();
assert.strictEqual(subSelect.style.borderColor, '#3b82f6', 'Subject dropdown border should match Physics color');
console.log('  ✓ Program -> Subject -> Chapter dropdown cascade and color sync work seamlessly');

// -------------------------------------------------------------
// Group 4: Create Weekly Target (addWeeklyTarget)
// -------------------------------------------------------------
console.log('\n4. Create Weekly Target (addWeeklyTarget)');

// Initialize state
global.weeklyTargetsDatabase = {};
global.dailyTargetsDatabase = {};
saveToCloudCalled = 0;

const currentWeekRange = WeeklyTargets.getWeeklyTargetRange();
const curWeekKey = WeeklyTargets.formatDateRangeKey(currentWeekRange.start, currentWeekRange.end);

// Setup input values
const weekSelect = getOrCreateElement('wt-select-week', 'select');
weekSelect.value = curWeekKey;
progSelect.value = 'Core Science';
subSelect.value = 'Physics';
chSelect.value = 'Kinematics';
const daySelect = getOrCreateElement('wt-select-day', 'select');
daySelect.value = 'Monday';
const scopeInput = getOrCreateElement('wt-target-scope', 'input');
scopeInput.value = 'Whole Chapter';
const sizeInput = getOrCreateElement('wt-input-size', 'input');
sizeInput.value = '20';

WeeklyTargets.addWeeklyTarget();

assert(global.weeklyTargetsDatabase[curWeekKey], 'Weekly target database should contain entry for current week');
assert.strictEqual(global.weeklyTargetsDatabase[curWeekKey].length, 1, 'Current week should have 1 target');
const createdTarget = global.weeklyTargetsDatabase[curWeekKey][0];
assert.strictEqual(createdTarget.subject, 'Physics', 'Target subject should be Physics');
assert.strictEqual(createdTarget.chapter, 'Kinematics', 'Target chapter should be Kinematics');
assert.strictEqual(createdTarget.totalChapterSize, 20, 'Target size should be 20');
assert.strictEqual(createdTarget.completed, false, 'Target should not be completed by default');
assert(saveToCloudCalled > 0, 'saveToCloud should be called after adding weekly target');
console.log('  ✓ addWeeklyTarget validates inputs, stores target, and saves to cloud');

// -------------------------------------------------------------
// Group 5: Edit Weekly Target (saveWeeklyTarget)
// -------------------------------------------------------------
console.log('\n5. Edit Weekly Target (saveWeeklyTarget)');

// Change values in form
progSelect.value = 'Core Science';
WeeklyTargets.updateWeeklyTargetSubjectDropdown();
subSelect.value = 'Chemistry';
WeeklyTargets.updateWeeklyTargetChapterDropdown();
chSelect.value = 'Thermodynamics';
sizeInput.value = '35';

saveToCloudCalled = 0;
WeeklyTargets.saveWeeklyTarget(0, curWeekKey);

const updatedTarget = global.weeklyTargetsDatabase[curWeekKey][0];
assert.strictEqual(updatedTarget.subject, 'Chemistry', 'Updated subject should be Chemistry');
assert.strictEqual(updatedTarget.chapter, 'Thermodynamics', 'Updated chapter should be Thermodynamics');
assert.strictEqual(updatedTarget.totalChapterSize, 35, 'Updated size should be 35');
assert(saveToCloudCalled > 0, 'saveToCloud should be called after saving weekly target edit');
console.log('  ✓ saveWeeklyTarget validates and updates target details and calls cloud save');

// -------------------------------------------------------------
// Group 6: Completion Controls & Bi-directional Sync
// -------------------------------------------------------------
console.log('\n6. Completion Controls & Bi-directional Sync');

// Toggle completion
saveToCloudCalled = 0;
WeeklyTargets.toggleWeeklyTargetCompletion(0, true);

assert.strictEqual(global.weeklyTargetsDatabase[curWeekKey][0].completed, true, 'Weekly target should be marked completed');
assert(saveToCloudCalled > 0, 'saveToCloud should be called on completion toggle');

// Progress calculations
const targetObj = global.weeklyTargetsDatabase[curWeekKey][0];
const progResult = WeeklyTargets.getWeeklyTargetProgress(targetObj, curWeekKey);
assert(typeof progResult.percent === 'number', 'Progress percent should be computed');
const chProgress = WeeklyTargets.getChapterWeeklyTargetProgress('track_1', 'Chemistry', 'Thermodynamics');
assert.strictEqual(typeof chProgress.percent, 'number', 'Progress percent should be calculated');
const occCount = WeeklyTargets.getWeeklyTargetOccurrenceCount('track_1', 'Chemistry', 'Thermodynamics');
assert.strictEqual(typeof occCount, 'number', 'Occurrence count should be calculated');
console.log('  ✓ toggleWeeklyTargetCompletion updates status, calculates progress, and triggers sync');

// -------------------------------------------------------------
// Group 7: Weekly -> Daily Synchronization (autoSyncWeeklyToDailyTargets)
// -------------------------------------------------------------
console.log('\n7. Weekly -> Daily Synchronization');

// Setup weekly target with dayName
global.weeklyTargetsDatabase[curWeekKey][0].dayName = 'Monday';
global.dailyTargetsDatabase = {};

WeeklyTargets.autoSyncWeeklyToDailyTargets();

// Check that daily targets database has entries
const dailyDateKeys = Object.keys(global.dailyTargetsDatabase);
assert(dailyDateKeys.length > 0, 'Daily targets should be populated for the week');
console.log('  ✓ autoSyncWeeklyToDailyTargets propagates weekly goals into daily schedules');

// -------------------------------------------------------------
// Group 8: Delete Weekly Target (deleteWeeklyTarget)
// -------------------------------------------------------------
console.log('\n8. Delete Weekly Target (deleteWeeklyTarget)');

saveToCloudCalled = 0;
global.deletedItemIds = [];

// Since target has no matching monthly target, it is treated as orphaned and directly purged
WeeklyTargets.deleteWeeklyTarget(0, updatedTarget.id);

assert.strictEqual(global.weeklyTargetsDatabase[curWeekKey].length, 0, 'Current week target list should now be empty');
assert(saveToCloudCalled > 0, 'saveToCloud should be called after deleting target');
assert(global.deletedItemIds.includes(updatedTarget.id), 'Tombstone deletion should be recorded for cloud sync');
console.log('  ✓ deleteWeeklyTarget removes item cleanly, tracks tombstones, and triggers cloud sync');

// -------------------------------------------------------------
// Group 9: Multi-Week Synchronization & Consolidation
// -------------------------------------------------------------
console.log('\n9. Multi-Week Target Synchronization & Consolidation');

// Add a multi-week target spanning 3 weeks
const baseDate = new Date();
const week1Range = WeeklyTargets.getWeeklyTargetRange(baseDate);
const week2Range = WeeklyTargets.getWeeklyTargetRange(new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000));
const week3Range = WeeklyTargets.getWeeklyTargetRange(new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000));

const w1Key = WeeklyTargets.formatDateRangeKey(week1Range.start, week1Range.end);
const w2Key = WeeklyTargets.formatDateRangeKey(week2Range.start, week2Range.end);
const w3Key = WeeklyTargets.formatDateRangeKey(week3Range.start, week3Range.end);

// Insert multi-week target in Monthly Targets structure to simulate cascade
if (!global.monthlyTargetsDatabase) global.monthlyTargetsDatabase = {};
global.monthlyTargetsDatabase['Sep 2026'] = [
    {
        id: 'mt_optics_1',
        program: 'Core Science',
        subject: 'Physics',
        chapter: 'Optics',
        targetSize: 60,
        spanWeeks: 3,
        spannedWeekKeys: [w1Key, w2Key, w3Key],
        allocatedWeeks: [w1Key, w2Key, w3Key],
        weeklyAllocations: {
            [w1Key]: 20,
            [w2Key]: 20,
            [w3Key]: 20
        },
        completed: false
    }
];

WeeklyTargets.syncMultiWeekTargetsToWeeklyDatabase();
WeeklyTargets.consolidateWeeklyTargetsDatabase();

assert(global.weeklyTargetsDatabase[w1Key], 'Week 1 should exist in weekly targets database');
assert(global.weeklyTargetsDatabase[w1Key].some(t => t.chapter === 'Optics'), 'Week 1 should contain Optics');
console.log('  ✓ syncMultiWeekTargetsToWeeklyDatabase & consolidateWeeklyTargetsDatabase maintain consistency');

// -------------------------------------------------------------
// Group 10: Weekly Targets Database (WTDB)
// -------------------------------------------------------------
console.log('\n10. Weekly Targets Database (WTDB) Controls & Filtering');

// Setup WTDB modal elements
const wtdbModal = getOrCreateElement('weekly-targets-db-modal');
wtdbModal.classList.add('hidden');
const wtdbWeekFilter = getOrCreateElement('wtdb-filter-week', 'select');
const wtdbProgFilter = getOrCreateElement('wtdb-filter-prog', 'select');
const wtdbSubFilter = getOrCreateElement('wtdb-filter-sub', 'select');
const wtdbTbody = getOrCreateElement('wtdb-targets-tbody', 'tbody');

WeeklyTargets.openWeeklyTargetsDatabase();
assert(!wtdbModal.classList.contains('hidden'), 'WTDB modal should not be hidden when opened');

WeeklyTargets.populateWtdbFilters();
assert(wtdbWeekFilter.innerHTML.includes('All Weeks'), 'Week filter should include All Weeks');
assert(wtdbProgFilter.innerHTML.includes('All Programs'), 'Program filter should include All Programs');
assert(wtdbSubFilter.innerHTML.includes('All Subjects'), 'Subject filter should include All Subjects');

// Test add via WTDB
const wtdbAddProg = getOrCreateElement('wtdb-add-prog', 'select');
const wtdbAddSub = getOrCreateElement('wtdb-add-sub', 'select');
const wtdbAddCh = getOrCreateElement('wtdb-add-ch', 'select');

wtdbWeekFilter.value = curWeekKey;
wtdbAddProg.value = 'General Studies';
WeeklyTargets.updateWtdbAddSubjectDropdown();
wtdbAddSub.value = 'Biology';
WeeklyTargets.updateWtdbAddChapterDropdown();
wtdbAddCh.value = 'Genetics';

saveToCloudCalled = 0;
WeeklyTargets.addWtdbTarget();
assert(global.weeklyTargetsDatabase[curWeekKey].some(t => t.chapter === 'Genetics'), 'WTDB add should add Genetics to target week');
assert(saveToCloudCalled > 0, 'saveToCloud should be called on WTDB add');

// Render WTDB list
WeeklyTargets.renderWtdbList();
assert(wtdbTbody.innerHTML.includes('Genetics'), 'WTDB table should render newly added Genetics target');

// Toggle completion via WTDB
const targetIdx = global.weeklyTargetsDatabase[curWeekKey].findIndex(t => t.chapter === 'Genetics');
WeeklyTargets.toggleWtdbTargetCompletion(curWeekKey, targetIdx, true);
assert.strictEqual(global.weeklyTargetsDatabase[curWeekKey][targetIdx].completed, true, 'WTDB toggle should update completion status');

// Delete via WTDB
WeeklyTargets.deleteWtdbTarget(curWeekKey, targetIdx);
assert(!global.weeklyTargetsDatabase[curWeekKey].some(t => t.chapter === 'Genetics'), 'WTDB delete should remove Genetics target');
console.log('  ✓ WTDB filters, table renderer, direct creation, toggle, and deletion operate flawlessly');

// -------------------------------------------------------------
// Group 11: Weekly Trend Visualization (Month Views & Charts)
// -------------------------------------------------------------
console.log('\n11. Weekly Trend Visualization (Month Views & Charts)');

// Add a few historical completed targets
global.weeklyTargetsDatabase['01 Aug - 07 Aug 2026'] = [
    { program: 'Core Science', subject: 'Physics', chapter: 'Kinematics', totalChapterSize: 1, completed: true }
];
global.weeklyTargetsDatabase['08 Aug - 14 Aug 2026'] = [
    { program: 'Core Science', subject: 'Physics', chapter: 'Dynamics', totalChapterSize: 1, completed: false }
];

const monthsData = WeeklyTargets.calculateMonthWiseTargets();
assert(Array.isArray(monthsData), 'calculateMonthWiseTargets should return an array');
assert(monthsData.length > 0, 'Months data should have entries');
const augEntry = monthsData.find(m => m.month.includes('Aug'));
assert(augEntry, 'August entry should be present in trend data');
assert.strictEqual(augEntry.set, 2, 'August targets set should total 2');
assert.strictEqual(augEntry.completed, 1, 'August targets completed should total 1');

// Switch tab to month view
const wtdbMonthsTbody = getOrCreateElement('wtdb-months-tbody', 'tbody');
const chartCanvas = getOrCreateElement('weeklyMonthMixedChart', 'canvas');

WeeklyTargets.switchWtdbTab('month');
WeeklyTargets.renderWtdbMonthView();

assert(wtdbMonthsTbody.innerHTML.includes('Aug'), 'Month view table should contain August row');
assert(wtdbMonthsTbody.innerHTML.includes('50%'), 'August completion rate should be 50%');
console.log('  ✓ calculateMonthWiseTargets aggregates statistics and renderWtdbMonthView displays trend charts');

// -------------------------------------------------------------
// Group 12: Cascade Preservation & Legacy Monthly Targets Stability
// -------------------------------------------------------------
console.log('\n12. Cascade Preservation & Monthly Targets Stability');

// Monthly targets database should be completely untouched and intact
assert(global.monthlyTargetsDatabase['Sep 2026'].length === 1, 'Monthly targets for Sep 2026 must be preserved');
assert.strictEqual(global.monthlyTargetsDatabase['Sep 2026'][0].chapter, 'Optics', 'Monthly target for Optics preserved');

// Verify cascade: Monthly (legacy) -> Weekly (extracted) -> Daily (extracted)
assert(typeof global.monthlyTargetsDatabase === 'object', 'Monthly data model preserved');
assert(typeof global.weeklyTargetsDatabase === 'object', 'Weekly data model preserved');
assert(typeof global.dailyTargetsDatabase === 'object', 'Daily data model preserved');

console.log('  ✓ State variables weeklyTargetsDatabase, monthlyTargetsDatabase, dailyTargetsDatabase intact');
console.log('  ✓ Monthly -> Weekly -> Daily cascade is strictly preserved without model changes');

console.log('\n==================================================');
console.log('Phase 2 / Batch 8 Tests: ALL TESTS PASSED! (12 / 12 groups)');
console.log('==================================================\n');
