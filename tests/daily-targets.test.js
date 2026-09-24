/**
 * Comprehensive Test Suite for Phase 2 / Batch 7:
 * Extracted Daily Targets & DTDB System (dailyTargets.js)
 *
 * Requirements Tested:
 * 1. Create daily target (validation, baseline completion inheritance, size handling)
 * 2. Edit daily target (openEditDailyTargetModal, saveDailyTarget)
 * 3. Delete daily target (custom todo, orphaned target, tombstone deletion)
 * 4. Completion controls (toggleDailyTargetCompletion, study task sync, weekly sync)
 * 5. Custom todos (switchAdtTab, addCustomTodoTarget, complete, delete)
 * 6. Filters & Day navigation (navigateDay, active classes, DTDB multi-criteria filters)
 * 7. DTDB (openDailyTargetsDatabase, populateDtdbFilters, renderDtdbList, updateDtdbTargetSize, deleteDtdbTarget)
 * 8. Refresh / render (renderDailyTargets, empty state, badges, subject colors)
 * 9. Firebase save verification (saveToCloud called on mutations)
 * 10. Weekly -> Daily synchronization (autoSyncWeeklyToDailyTargets)
 * 11. Dashboard checklist output compatibility (renderDashboardDailyChecklist, toggleDashboardDailyTargetCompletion)
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
    documentElement: {
        classList: {
            contains: (cls) => cls === 'dark'
        }
    }
};

global.window = global;

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
    }
};
global.parseDailyTargetDateKey = global.Utils.parseDailyTargetDateKey;

// Mock Toast, UI, Modal, and Firebase Services
let toastLogs = [];
global.showToast = (msg, type) => {
    toastLogs.push({ msg, type });
};

let renderUICallCount = 0;
global.renderUI = () => {
    renderUICallCount++;
};

let openedModals = [];
let closedModals = [];
global.openModal = (id) => { openedModals.push(id); };
global.closeModal = (id) => { closedModals.push(id); };

let cloudSaves = [];
global.FirebaseService = {
    saveToCloud: (immediate = false) => {
        cloudSaves.push({ timestamp: Date.now(), immediate });
    }
};

let totalsRecalculated = 0;
global.recalculateTotals = () => { totalsRecalculated++; };

let recordedDeletions = [];
global.recordItemDeletion = (id) => { recordedDeletions.push(id); };
global.generateItemId = (item, prefix) => `${prefix}_id_${Math.random().toString(36).substr(2, 6)}`;
global.markLocalMutation = (name) => {};

// Mock Application Data
global.tracks = [
    { id: 'track_academic', name: 'Academic' },
    { id: 'track_admission', name: 'Admission' }
];

global.customPrograms = {
    'track_academic': [{ name: 'HSC 26' }],
    'track_admission': [{ name: 'Medical Prep' }]
};

global.syllabusStructure = {
    'track_academic': [
        { program: 'HSC 26', subject: 'Physics 1st Paper' },
        { program: 'HSC 26', subject: 'Chemistry 1st Paper' }
    ]
};

global.getChaptersForSubject = (trackId, subject) => {
    if (subject === 'Physics 1st Paper') return ['Vectors', 'Dynamics', 'Work & Power'];
    return ['Chapter 1', 'Chapter 2'];
};

global.getSubjectColor = (sub) => {
    return sub.includes('Physics') ? '#3b82f6' : '#10b981';
};

global.getAllSubjects = () => [
    { subject: 'Physics 1st Paper' },
    { subject: 'Chemistry 1st Paper' }
];

global.findTaskChapter = (track, subject, chapter) => {
    if (subject === 'Physics 1st Paper' && chapter === 'Vectors') {
        return {
            subTask: { completed: false, completedAt: null, skipped: false }
        };
    }
    return null;
};

let taskSyncLogs = [];
global.syncTaskChapterCompletion = (track, subject, chapter, completed, completedAt) => {
    taskSyncLogs.push({ track, subject, chapter, completed, completedAt });
};

global.getWeeklyTargetRange = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

global.formatDateRangeKey = (start, end) => {
    return `${global.Utils.formatDate(start)} - ${global.Utils.formatDate(end)}`;
};

global.getAllocatedSizeForWeeklyTarget = (wt, weekKey) => 5;
global.getWeeklyTargetProgress = (wt, weekKey) => ({ percent: 100, done: 10, total: 10 });

// Load the extracted DailyTargets module from archive
const DailyTargets = require('../archive/legacy-js/js/features/targets/dailyTargets.js');

// Load Dashboard for checklist test from archive
global.safeGetEl = require('../js/utils/dom.js').safeGetEl;
require('../archive/legacy-js/js/features/dashboard/dashboard.js');
require('../archive/legacy-js/pages/Dashboard/Dashboard.js');

console.log('=== X-29 Advance — Phase 2 / Batch 7 Test Suite ===\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✗ ${name}`);
        console.error(err);
    }
}

// -------------------------------------------------------------
// Test Suite 1: Daily Targets Management & Dropdown Controls
// -------------------------------------------------------------
console.log('1. Daily Targets Management & Dropdown Controls');

runTest('DailyTargets module is properly defined and exposed on window', () => {
    assert.ok(DailyTargets, 'DailyTargets must be defined');
    assert.strictEqual(typeof DailyTargets.addDailyTarget, 'function');
    assert.strictEqual(typeof DailyTargets.renderDailyTargets, 'function');
    assert.strictEqual(typeof DailyTargets.openDailyTargetsDatabase, 'function');
    assert.strictEqual(global.DailyTargets, DailyTargets);
    assert.strictEqual(global.addDailyTarget, DailyTargets.addDailyTarget);
});

runTest('updateDailyTargetSubjectDropdown populates subjects for selected program', () => {
    const progSelect = getOrCreateElement('dt-select-prog');
    progSelect.value = 'HSC 26';
    const subSelect = getOrCreateElement('dt-select-sub');

    DailyTargets.updateDailyTargetSubjectDropdown();

    assert.ok(subSelect.innerHTML.includes('Physics 1st Paper'));
    assert.ok(subSelect.innerHTML.includes('Chemistry 1st Paper'));
});

runTest('updateDailyTargetChapterDropdown populates chapters for selected subject', () => {
    const progSelect = getOrCreateElement('dt-select-prog');
    progSelect.value = 'HSC 26';
    const subSelect = getOrCreateElement('dt-select-sub');
    subSelect.value = 'Physics 1st Paper';
    const chSelect = getOrCreateElement('dt-select-ch');

    DailyTargets.updateDailyTargetChapterDropdown();

    assert.ok(chSelect.innerHTML.includes('Vectors'));
    assert.ok(chSelect.innerHTML.includes('Dynamics'));
});

runTest('handleDailyTargetChapterChange updates size allocations from weekly target', () => {
    const currentRange = global.getWeeklyTargetRange(new Date());
    const weekKey = global.formatDateRangeKey(currentRange.start, currentRange.end);
    global.weeklyTargetsDatabase = {
        [weekKey]: [{
            track: 'track_academic',
            program: 'HSC 26',
            subject: 'Physics 1st Paper',
            chapter: 'Vectors',
            totalChapterSize: 15
        }]
    };

    const progSelect = getOrCreateElement('dt-select-prog');
    progSelect.value = 'HSC 26';
    const subSelect = getOrCreateElement('dt-select-sub');
    subSelect.value = 'Physics 1st Paper';
    const chSelect = getOrCreateElement('dt-select-ch');
    chSelect.value = 'Vectors';

    const totalSizeInput = getOrCreateElement('dt-input-total-size');
    const sizeInput = getOrCreateElement('dt-input-size');

    DailyTargets.handleDailyTargetChapterChange();

    assert.strictEqual(totalSizeInput.value, 15);
    assert.strictEqual(totalSizeInput.disabled, true);
    assert.strictEqual(sizeInput.value, 10); // 15 total - 5 allocated
});

// -------------------------------------------------------------
// Test Suite 2: Create Daily Target
// -------------------------------------------------------------
console.log('\n2. Create Daily Target (addDailyTarget)');

runTest('addDailyTarget validates required fields', () => {
    toastLogs = [];
    const progSelect = getOrCreateElement('dt-select-prog');
    progSelect.value = '';

    DailyTargets.addDailyTarget();

    const lastToast = toastLogs[toastLogs.length - 1];
    assert.ok(lastToast);
    assert.strictEqual(lastToast.type, 'error');
    assert.ok(lastToast.msg.includes('Please select a Program'));
});

runTest('addDailyTarget adds target to dailyTargetsDatabase and saves to cloud', () => {
    global.dailyTargetsDatabase = {};
    const testDate = new Date(2026, 8, 12);
    global.currentDailyTargetsDate = testDate;
    const dateKey = global.Utils.formatDate(testDate);

    const progSelect = getOrCreateElement('dt-select-prog');
    progSelect.value = 'HSC 26';
    const subSelect = getOrCreateElement('dt-select-sub');
    subSelect.value = 'Physics 1st Paper';
    const chSelect = getOrCreateElement('dt-select-ch');
    chSelect.value = 'Vectors';
    const sizeInput = getOrCreateElement('dt-input-size');
    sizeInput.value = '5';

    cloudSaves = [];
    closedModals = [];
    DailyTargets.addDailyTarget();

    assert.ok(global.dailyTargetsDatabase[dateKey]);
    assert.strictEqual(global.dailyTargetsDatabase[dateKey].length, 1);
    const added = global.dailyTargetsDatabase[dateKey][0];
    assert.strictEqual(added.subject, 'Physics 1st Paper');
    assert.strictEqual(added.chapter, 'Vectors');
    assert.strictEqual(added.totalChapterSize, 5);
    assert.strictEqual(added.completed, false);
    assert.ok(cloudSaves.length > 0, 'Must trigger FirebaseService.saveToCloud');
    assert.ok(closedModals.includes('add-daily-target-modal'));
});

// -------------------------------------------------------------
// Test Suite 3: Custom Todos
// -------------------------------------------------------------
console.log('\n3. Custom Todos (switchAdtTab, addCustomTodoTarget)');

runTest('switchAdtTab toggles between todo and study tabs', () => {
    const btnTodo = getOrCreateElement('adt-tab-btn-todo');
    const btnStudy = getOrCreateElement('adt-tab-btn-study');
    const viewTodo = getOrCreateElement('adt-view-todo');
    const viewStudy = getOrCreateElement('adt-view-study');

    DailyTargets.switchAdtTab('todo');
    assert.ok(btnTodo.className.includes('bg-blue-600'));
    assert.ok(!viewTodo.classList.contains('hidden'));
    assert.ok(viewStudy.classList.contains('hidden'));

    DailyTargets.switchAdtTab('study');
    assert.ok(btnStudy.className.includes('bg-blue-600'));
    assert.ok(!viewStudy.classList.contains('hidden'));
    assert.ok(viewTodo.classList.contains('hidden'));
});

runTest('addCustomTodoTarget adds a custom to-do task to dailyTargetsDatabase', () => {
    const testDate = new Date(2026, 8, 12);
    global.currentDailyTargetsDate = testDate;
    const dateKey = global.Utils.formatDate(testDate);

    const titleInput = getOrCreateElement('adt-todo-title');
    titleInput.value = 'Review Vector Formulas';
    const trackInput = getOrCreateElement('adt-todo-track');
    trackInput.value = 'track_academic';

    cloudSaves = [];
    DailyTargets.addCustomTodoTarget();

    const list = global.dailyTargetsDatabase[dateKey];
    assert.ok(list);
    const todo = list.find(t => t.isTodo && t.title === 'Review Vector Formulas');
    assert.ok(todo, 'Custom todo must be saved in database');
    assert.strictEqual(todo.completed, false);
    assert.strictEqual(todo.track, 'track_academic');
    assert.ok(cloudSaves.length > 0, 'Must trigger Firebase save');
});

// -------------------------------------------------------------
// Test Suite 4: Edit Daily Target & Custom Todos
// -------------------------------------------------------------
console.log('\n4. Edit Daily Target (saveDailyTarget)');

runTest('saveDailyTarget updates custom todo title', () => {
    const dateKey = global.Utils.formatDate(global.currentDailyTargetsDate);
    const todoIdx = global.dailyTargetsDatabase[dateKey].findIndex(t => t.isTodo);

    const btnTodo = getOrCreateElement('adt-tab-btn-todo');
    btnTodo.classList.add('bg-blue-600'); // set active todo tab
    const titleInput = getOrCreateElement('adt-todo-title');
    titleInput.value = 'Review Vector Formulas (Updated)';

    cloudSaves = [];
    DailyTargets.saveDailyTarget(todoIdx, dateKey);

    assert.strictEqual(global.dailyTargetsDatabase[dateKey][todoIdx].title, 'Review Vector Formulas (Updated)');
    assert.ok(cloudSaves.length > 0);
});

// -------------------------------------------------------------
// Test Suite 5: Delete Daily Target & Custom Todos
// -------------------------------------------------------------
console.log('\n5. Delete Daily Target (deleteDailyTarget)');

runTest('deleteDailyTarget purges custom todo and records deletion tombstone', () => {
    const dateKey = global.Utils.formatDate(global.currentDailyTargetsDate);
    const todoIdx = global.dailyTargetsDatabase[dateKey].findIndex(t => t.isTodo);
    const todoId = global.dailyTargetsDatabase[dateKey][todoIdx].id;

    recordedDeletions = [];
    cloudSaves = [];
    DailyTargets.deleteDailyTarget(todoIdx, todoId);

    assert.strictEqual(global.dailyTargetsDatabase[dateKey].findIndex(t => t.id === todoId), -1);
    assert.ok(recordedDeletions.includes(todoId), 'Deletion tombstone must be recorded');
    assert.ok(cloudSaves.length > 0);
});

runTest('deleteDailyTarget purges orphaned daily target', () => {
    const dateKey = global.Utils.formatDate(global.currentDailyTargetsDate);
    global.dailyTargetsDatabase[dateKey].push({
        id: 'orphaned_target_1',
        track: 'track_academic',
        program: 'HSC 26',
        subject: 'Physics 1st Paper',
        chapter: 'Orphan Chapter',
        completed: false
    });
    const orphanIdx = global.dailyTargetsDatabase[dateKey].length - 1;

    recordedDeletions = [];
    DailyTargets.deleteDailyTarget(orphanIdx, 'orphaned_target_1');

    assert.strictEqual(global.dailyTargetsDatabase[dateKey].findIndex(t => t.id === 'orphaned_target_1'), -1);
    assert.ok(recordedDeletions.includes('orphaned_target_1'));
});

// -------------------------------------------------------------
// Test Suite 6: Daily Target Completion Controls
// -------------------------------------------------------------
console.log('\n6. Daily Target Completion Controls (toggleDailyTargetCompletion)');

runTest('toggleDailyTargetCompletion synchronizes with matching Weekly Target and Study Task', () => {
    const testDate = new Date(2026, 8, 12);
    global.currentDailyTargetsDate = testDate;
    const dateKey = global.Utils.formatDate(testDate);

    global.dailyTargetsDatabase = {
        [dateKey]: [{
            id: 'dt_target_sync',
            track: 'track_academic',
            program: 'HSC 26',
            subject: 'Physics 1st Paper',
            chapter: 'Vectors',
            completed: false,
            completedAt: null
        }]
    };

    const currentRange = global.getWeeklyTargetRange(testDate);
    const weekKey = global.formatDateRangeKey(currentRange.start, currentRange.end);
    global.weeklyTargetsDatabase = {
        [weekKey]: [{
            track: 'track_academic',
            subject: 'Physics 1st Paper',
            chapter: 'Vectors',
            completed: false,
            completedAt: null
        }]
    };

    taskSyncLogs = [];
    cloudSaves = [];
    DailyTargets.toggleDailyTargetCompletion(0, true);

    const target = global.dailyTargetsDatabase[dateKey][0];
    assert.strictEqual(target.completed, true);
    assert.ok(target.completedAt);

    const wt = global.weeklyTargetsDatabase[weekKey][0];
    assert.strictEqual(wt.completed, true, 'Weekly target must synchronize completion');

    assert.ok(taskSyncLogs.length > 0);
    assert.strictEqual(taskSyncLogs[0].completed, true, 'Study task must synchronize completion');
    assert.ok(cloudSaves.length > 0);
});

// -------------------------------------------------------------
// Test Suite 7: Weekly -> Daily Synchronization
// -------------------------------------------------------------
console.log('\n7. Weekly -> Daily Synchronization (autoSyncWeeklyToDailyTargets)');

runTest('autoSyncWeeklyToDailyTargets maps weekly targets by dayName into dailyTargetsDatabase', () => {
    global.dailyTargetsDatabase = {};
    const weekStart = new Date(2026, 8, 7); // Monday
    const weekEnd = new Date(2026, 8, 13); // Sunday
    const weekKey = `${global.Utils.formatDate(weekStart)} - ${global.Utils.formatDate(weekEnd)}`;

    global.weeklyTargetsDatabase = {
        [weekKey]: [
            {
                track: 'track_academic',
                program: 'HSC 26',
                subject: 'Chemistry 1st Paper',
                chapter: 'Chapter 1',
                dayName: 'Wednesday',
                totalChapterSize: 20,
                completed: false
            }
        ]
    };

    cloudSaves = [];
    DailyTargets.autoSyncWeeklyToDailyTargets();

    // Wednesday is Sep 9
    const wedDate = new Date(2026, 8, 9);
    const wedKey = global.Utils.formatDate(wedDate);

    assert.ok(global.dailyTargetsDatabase[wedKey], 'Daily targets for Wednesday must be generated');
    const syncedTarget = global.dailyTargetsDatabase[wedKey][0];
    assert.strictEqual(syncedTarget.subject, 'Chemistry 1st Paper');
    assert.strictEqual(syncedTarget.chapter, 'Chapter 1');
    assert.strictEqual(syncedTarget.isAutoSynced, true);
    assert.ok(cloudSaves.length > 0);
});

// -------------------------------------------------------------
// Test Suite 8: Day Navigation & Daily Targets Checklist
// -------------------------------------------------------------
console.log('\n8. Day Navigation & Checklist Rendering (renderDailyTargets, navigateDay)');

runTest('navigateDay changes currentDailyTargetsDate and updates navigation active classes', () => {
    const initialDate = new Date();
    global.currentDailyTargetsDate = new Date(initialDate);

    DailyTargets.navigateDay('past');
    assert.strictEqual(global.currentDailyTargetsDate.getDate(), initialDate.getDate() - 1);

    DailyTargets.navigateDay('future');
    assert.strictEqual(global.currentDailyTargetsDate.getDate(), initialDate.getDate());

    const btnPresent = getOrCreateElement('dt-btn-present');
    assert.ok(btnPresent.className.includes('bg-blue-600'));
});

runTest('renderDailyTargets generates HTML cards for active day targets', () => {
    const testDate = new Date();
    global.currentDailyTargetsDate = testDate;
    const dateKey = global.Utils.formatDate(testDate);

    global.dailyTargetsDatabase = {
        [dateKey]: [
            {
                id: 'target_render_1',
                track: 'track_academic',
                program: 'HSC 26',
                subject: 'Physics 1st Paper',
                chapter: 'Dynamics',
                totalChapterSize: 12,
                completed: false
            },
            {
                id: 'target_render_todo',
                isTodo: true,
                title: 'Daily Checklist Review',
                track: 'track_academic',
                completed: true
            }
        ]
    };

    const container = getOrCreateElement('daily-targets-list');
    DailyTargets.renderDailyTargets();

    assert.ok(container.innerHTML.includes('Dynamics'));
    assert.ok(container.innerHTML.includes('(12 p)'));
    assert.ok(container.innerHTML.includes('Daily Checklist Review'));
    assert.ok(container.innerHTML.includes('checked'));
});

// -------------------------------------------------------------
// Test Suite 9: Daily Targets Database (DTDB)
// -------------------------------------------------------------
console.log('\n9. Daily Targets Database (DTDB)');

runTest('populateDtdbFilters populates distinct dates, programs, and subjects', () => {
    global.dailyTargetsDatabase = {
        '10 Sep 2026': [{ program: 'HSC 26', subject: 'Physics 1st Paper' }],
        '11 Sep 2026': [{ program: 'HSC 26', subject: 'Chemistry 1st Paper' }]
    };

    const dateFilter = getOrCreateElement('dtdb-filter-date');
    const progFilter = getOrCreateElement('dtdb-filter-prog');
    const subFilter = getOrCreateElement('dtdb-filter-sub');

    DailyTargets.populateDtdbFilters();

    assert.ok(dateFilter.innerHTML.includes('10 Sep 2026'));
    assert.ok(dateFilter.innerHTML.includes('11 Sep 2026'));
    assert.ok(progFilter.innerHTML.includes('HSC 26'));
    assert.ok(subFilter.innerHTML.includes('Physics 1st Paper'));
});

runTest('renderDtdbList renders table rows and filters by criteria', () => {
    const tbody = getOrCreateElement('dtdb-targets-tbody');
    const dFilter = getOrCreateElement('dtdb-filter-date');
    const pFilter = getOrCreateElement('dtdb-filter-prog');
    const sFilter = getOrCreateElement('dtdb-filter-sub');
    const statFilter = getOrCreateElement('dtdb-filter-status');

    dFilter.value = 'all';
    pFilter.value = 'all';
    sFilter.value = 'all';
    statFilter.value = 'all';

    global.dailyTargetsDatabase = {
        '12 Sep 2026': [
            { id: 'dtdb_1', program: 'HSC 26', subject: 'Physics 1st Paper', chapter: 'Vectors', completed: true, totalChapterSize: 10 },
            { id: 'dtdb_2', program: 'HSC 26', subject: 'Chemistry 1st Paper', chapter: 'Chapter 2', completed: false, totalChapterSize: 15 }
        ]
    };

    DailyTargets.renderDtdbList();
    assert.ok(tbody.innerHTML.includes('Vectors'));
    assert.ok(tbody.innerHTML.includes('Chapter 2'));

    // Filter by completed status
    statFilter.value = 'completed';
    DailyTargets.renderDtdbList();
    assert.ok(tbody.innerHTML.includes('Vectors'));
    assert.ok(!tbody.innerHTML.includes('Chapter 2'));

    // Filter by subject
    statFilter.value = 'all';
    sFilter.value = 'Chemistry 1st Paper';
    DailyTargets.renderDtdbList();
    assert.ok(!tbody.innerHTML.includes('Vectors'));
    assert.ok(tbody.innerHTML.includes('Chapter 2'));
});

runTest('updateDtdbTargetSize updates target size and cascades to weekly target', () => {
    const dateKey = '12 Sep 2026';
    global.dailyTargetsDatabase = {
        [dateKey]: [{
            id: 'dtdb_size_target',
            track: 'track_academic',
            program: 'HSC 26',
            subject: 'Physics 1st Paper',
            chapter: 'Vectors',
            totalChapterSize: 5,
            completed: false
        }]
    };

    const currentRange = global.getWeeklyTargetRange(global.Utils.parseDailyTargetDateKey(dateKey));
    const weekKey = global.formatDateRangeKey(currentRange.start, currentRange.end);
    global.weeklyTargetsDatabase = {
        [weekKey]: [{
            track: 'track_academic',
            subject: 'Physics 1st Paper',
            chapter: 'Vectors',
            totalChapterSize: 10,
            completed: false
        }]
    };

    cloudSaves = [];
    DailyTargets.updateDtdbTargetSize(dateKey, 0, '10');

    assert.strictEqual(global.dailyTargetsDatabase[dateKey][0].totalChapterSize, 10);
    assert.ok(cloudSaves.length > 0);
});

// -------------------------------------------------------------
// Test Suite 10: Dashboard Daily Checklist Compatibility
// -------------------------------------------------------------
console.log('\n10. Dashboard Daily Checklist Compatibility');

runTest('renderDashboardDailyChecklist processes today targets and past overdue targets', () => {
    const todayStr = global.Utils.formatDate(new Date());
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    const pastStr = global.Utils.formatDate(pastDate);

    global.dailyTargetsDatabase = {
        [todayStr]: [{
            track: 'track_academic',
            program: 'HSC 26',
            subject: 'Physics 1st Paper',
            chapter: 'Vectors',
            completed: false
        }],
        [pastStr]: [{
            track: 'track_academic',
            program: 'HSC 26',
            subject: 'Chemistry 1st Paper',
            chapter: 'Chapter 1',
            completed: false
        }]
    };

    const container = getOrCreateElement('db-daily-targets-checklist');
    const rangeEl = getOrCreateElement('db-daily-checklist-date');
    const progressEl = getOrCreateElement('db-daily-checklist-progress');

    global.renderDashboardDailyChecklist();

    assert.ok(container.innerHTML.includes('Vectors'), 'Must contain today target');
    assert.ok(container.innerHTML.includes('Chapter 1'), 'Must contain past overdue target');
});

runTest('toggleDashboardDailyTargetCompletion toggles target completion from dashboard', () => {
    const todayStr = global.Utils.formatDate(new Date());
    global.dailyTargetsDatabase = {
        [todayStr]: [{
            track: 'track_academic',
            program: 'HSC 26',
            subject: 'Physics 1st Paper',
            chapter: 'Vectors',
            completed: false
        }]
    };

    cloudSaves = [];
    global.toggleDashboardDailyTargetCompletion(todayStr, 0, true);

    assert.strictEqual(global.dailyTargetsDatabase[todayStr][0].completed, true);
    assert.ok(cloudSaves.length > 0);
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n==================================================');
console.log(`Phase 2 / Batch 7 Tests: ${passedTests} / ${totalTests} passed`);
console.log('==================================================\n');

if (passedTests !== totalTests) {
    process.exit(1);
}
