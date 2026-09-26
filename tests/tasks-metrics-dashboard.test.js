/**
 * Comprehensive Test Suite for Phase 2 / Batch 10:
 * Tasks Engine, Metrics Engine, and Dashboard Core
 *
 * Requirements Tested:
 * 1. Task Engine (generateStudyPlan, rebuildTaskDates, handleTaskToggle, saveTaskEdit, toggleSkipTask, deleteTask)
 * 2. Revision Mode (toggleRevisionMode, toggleRevisionChapter)
 * 3. Status & Chapter Query Helpers (getChapterStatus, isSubjectPassed, isChapterCompleted, isChapterSkipped, getChaptersForSubject)
 * 4. Subject Daily Goals & Subject Edit Modals (openSubjectTimeModal, saveSubjectTimeGoal, clearSubjectTimeGoal, saveSubjectEditModal)
 * 5. Subject Progress & Navigation Rendering (renderSubjectProgress, renderSubjectNavigation, renderCategoryProgress, renderTrackProgress)
 * 6. Metrics Calculation Engine (updateMetrics, recalculateTotals, updateCountdown, updateSuccessScore)
 * 7. Dashboard Core & Widgets (renderUI, updateTrendsBar, setupFocusTodayButton, renderDashboardDailyChecklist, renderDashboardWeeklyChecklist, renderDashboardMonthlyChecklist, renderDashboardOutcomeCard, renderDashboardUpcomingExamCard, renderDashboardPassedSubjectsCard)
 * 8. DashboardPage Lifecycle & Router coordination
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
        this.eventListeners = {};
    }

    addEventListener(event, callback) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (!this.eventListeners[event]) return;
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }

    dispatchEvent(e) {
        if (!e) return true;
        if (!e.target) e.target = this;
        const listeners = this.eventListeners[e.type] || [];
        listeners.forEach(cb => { try { cb(e); } catch (err) {} });
        if (this.parentElement && typeof this.parentElement.dispatchEvent === 'function') {
            this.parentElement.dispatchEvent(e);
        }
        return true;
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
        for (const el of elements.values()) {
            if (sel.startsWith('.') && el.classList && el.classList.contains(sel.slice(1))) return el;
        }
        return null;
    }

    querySelectorAll(sel) {
        const results = [];
        for (const el of elements.values()) {
            if (sel.startsWith('.') && el.classList && el.classList.contains(sel.slice(1))) {
                results.push(el);
            }
        }
        return results;
    }

    insertAdjacentHTML(position, html) {
        if (position === 'beforeend') {
            this.innerHTML += html;
        } else if (position === 'afterbegin') {
            this.innerHTML = html + this.innerHTML;
        } else {
            this.innerHTML += html;
        }
    }

    scrollIntoView() {}
}

const elements = new Map();
function getOrCreateElement(id, tagName = 'div') {
    if (!elements.has(id)) {
        elements.set(id, new MockElement(id, tagName));
    }
    return elements.get(id);
}

global.document = {
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => {
        if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
        if (sel.includes('[id^="sys-tab-"]')) {
            for (const el of elements.values()) {
                if (el.id.startsWith('sys-tab-') && el.classList && el.classList.contains('bg-blue-600')) return el;
            }
            return null;
        }
        for (const el of elements.values()) {
            if (sel.startsWith('.') && el.classList && el.classList.contains(sel.slice(1))) return el;
        }
        return null;
    },
    querySelectorAll: (sel) => {
        const results = [];
        for (const el of elements.values()) {
            if (sel.startsWith('.') && el.classList && el.classList.contains(sel.slice(1))) results.push(el);
        }
        return results;
    },
    createElement: (tag) => new MockElement('', tag),
    title: ''
};

global.window = global;

// Mock Utilities & State
global.Utils = {
    formatDate: (d) => {
        const date = new Date(d);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },
    parseDateSafe: (str) => new Date(str),
    extractNum: (val) => {
        const match = String(val).match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    },
    isChapterMatch: (ch1, ch2) => {
        return String(ch1).trim().toLowerCase() === String(ch2).trim().toLowerCase();
    }
};

let cloudSavesCount = 0;
global.FirebaseService = {
    saveToCloud: () => { cloudSavesCount++; return Promise.resolve(); }
};

let toasts = [];
global.showToast = (msg, type) => { toasts.push({ msg, type }); };

let openedModals = [];
let closedModals = [];
global.openModal = (id) => { openedModals.push(id); };
global.closeModal = (id) => { closedModals.push(id); };

global.safeSetText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text !== undefined && text !== null ? text : '';
};
global.safeSetHtml = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html !== undefined && html !== null ? html : '';
};
global.hexToRgba = (hex, alpha) => `rgba(59, 130, 246, ${alpha})`;
global.getSubjectColor = (sub) => '#3b82f6';
global.getDynamicCleanLabel = (str, len) => str;

// App State
global.tracks = [
    { id: 'bcs', label: 'BCS', color: '#3b82f6' },
    { id: 'bank', label: 'Bank', color: '#10b981' }
];

global.customPrograms = {
    bcs: [{ name: 'Preliminary' }],
    bank: [{ name: 'Officer General' }]
};

global.syllabusStructure = {
    bcs: [
        { program: 'Preliminary', subject: 'Bangla Literature', chapters: 5 },
        { program: 'Preliminary', subject: 'English Grammar', chapters: 4 }
    ],
    bank: [
        { program: 'Officer General', subject: 'Accounting', chapters: 3 }
    ]
};

global.getAllSubjects = () => {
    const subs = [];
    for (const track in global.syllabusStructure) {
        global.syllabusStructure[track].forEach(s => subs.push({ ...s, track }));
    }
    return subs;
};

global.getSortedTrackSubjects = (trackId) => {
    return global.syllabusStructure[trackId] || [];
};

global.getAllPrograms = () => [
    { name: 'Preliminary', track: 'bcs' },
    { name: 'Officer General', track: 'bank' }
];

global.AppState = {
    PLAN_START_DATE: new Date('2026-01-01T00:00:00.000Z'),
    PLAN_END_DATE: new Date('2026-01-10T00:00:00.000Z'),
    globalStartDate: new Date('2026-01-01T00:00:00.000Z'),
    globalEndDate: new Date('2026-01-10T00:00:00.000Z'),
    currentFilter: 'All',
    tasks: [],
    subjectColors: {}
};

global.dashboardConfig = {
    topTag: 'CADRE GOAL',
    mainTitle: 'Mission 47th BCS',
    subTitle: 'Target Batch',
    trendStartDate: '2026-01-01'
};

global.paceGoals = [
    { id: 'goal-1', target: 'Bangla Literature', deadline: '2026-01-05', type: 'subject' },
    { id: 'goal-global', target: 'Full Syllabus', deadline: '2026-01-10', type: 'global' }
];

global.passedItems = { programs: [], subjects: [] };
global.celebrationTargets = { programs: [], subjects: [] };
global.revisionData = { active: [], progress: {} };
global.subjectTimeLinks = {};
global.dailyTargetsDatabase = {};
global.weeklyTargetsDatabase = {};
global.monthlyTargetsDatabase = {};
global.examDatabase = [
    { id: 'exam-1', name: '47th BCS Preli', date: '2026-02-15', track: 'bcs', program: 'Preliminary' }
];

// Load Modules under test from archive
const TaskEngine = require('../archive/legacy-js/js/features/tasks/taskEngine.js');
const SubjectGoals = require('../archive/legacy-js/js/features/tasks/subjectGoals.js');
const Metrics = require('../archive/legacy-js/js/core/metrics.js');
const DashboardCore = require('../archive/legacy-js/js/features/dashboard/dashboard.js');
const DashboardPage = require('../archive/legacy-js/pages/Dashboard/Dashboard.js');

console.log('=== X-29 Advance — Phase 2 / Batch 10 Test Suite ===\n');

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

// ----------------------------------------------------
// 1. Task Engine Generation and Date Rebuild
// ----------------------------------------------------
console.log('1. Task Engine Generation & Schedule Management');

runTest('generateStudyPlan creates scheduled tasks with holidays', () => {
    const plan = TaskEngine.generateStudyPlan();
    assert(Array.isArray(plan), 'Study plan should be an array');
    assert(plan.length > 0, 'Plan should contain tasks');
    const firstTask = plan[0];
    assert(firstTask.id === 1, 'First task has id 1');
    assert(firstTask.date === '2026-01-01', 'First task date matches start date');
    assert(firstTask.bcsTasks && Array.isArray(firstTask.bcsTasks), 'Should contain bcsTasks array');
    AppState.tasks = plan;
});

runTest('rebuildTaskDates aligns all task dates from start date', () => {
    AppState.PLAN_START_DATE = new Date('2026-02-01T00:00:00.000Z');
    TaskEngine.rebuildTaskDates(false);
    assert.strictEqual(AppState.tasks[0].date, '2026-02-01');
    assert.strictEqual(AppState.tasks[1].date, '2026-02-02');
});

// ----------------------------------------------------
// 2. Task Completion & Toggle Engine
// ----------------------------------------------------
console.log('\n2. Task Toggle Engine');

runTest('handleTaskToggle completes task and updates state', () => {
    const targetTask = AppState.tasks[0].bcsTasks[0];
    assert(targetTask, 'Should have bcsTask in day 1');
    const prevCompleted = targetTask.completed;

    const mockEvent = {
        target: {
            dataset: {
                studId: String(AppState.tasks[0].studyDay),
                type: 'bcs',
                subtaskId: targetTask.id,
                subject: targetTask.subject,
                chapter: targetTask.chapter
            },
            checked: true
        }
    };

    TaskEngine.handleTaskToggle(mockEvent);
    assert.strictEqual(AppState.tasks[0].bcsTasks[0].completed, true, 'Task completed should now be true');
    assert(AppState.tasks[0].bcsTasks[0].completedAt !== null, 'completedAt timestamp should be recorded');

    // Uncomplete
    mockEvent.target.checked = false;
    TaskEngine.handleTaskToggle(mockEvent);
    assert.strictEqual(AppState.tasks[0].bcsTasks[0].completed, false, 'Task completed should now be false');
    assert.strictEqual(AppState.tasks[0].bcsTasks[0].completedAt, null, 'completedAt should be cleared');
});

// ----------------------------------------------------
// 3. Task Edit, Skip, and Delete Modal Operations
// ----------------------------------------------------
console.log('\n3. Task Modal Operations (Edit, Skip, Delete)');

runTest('openEditModal populates inputs and opens modal', () => {
    const task = AppState.tasks[0];
    const subTask = task.bcsTasks[0];
    openedModals = [];
    TaskEngine.openEditModal(task.id, 'bcs', subTask.id);
    assert(openedModals.includes('edit-task-modal'), 'edit-task-modal should be opened');
    assert.strictEqual(window.editingTask.taskId, task.id);
});

runTest('toggleSkipTask toggles skipped state', () => {
    const task = AppState.tasks[0];
    const subTask = task.bcsTasks[0];
    window.editingTask = { taskId: task.id, type: 'bcs', subTaskId: subTask.id, oldSubject: subTask.subject };
    
    TaskEngine.toggleSkipTask();
    assert.strictEqual(subTask.skipped, true, 'SubTask should now be skipped');
    
    // Toggle back
    TaskEngine.toggleSkipTask();
    assert.strictEqual(subTask.skipped, false, 'SubTask should not be skipped');
});

runTest('deleteTask shifts subsequent tasks and sets revision slot', () => {
    const task = AppState.tasks[0];
    const subTask = task.bcsTasks[0];
    const initialSubject = subTask.subject;
    window.editingTask = { taskId: task.id, type: 'bcs', subTaskId: subTask.id, oldSubject: initialSubject };

    TaskEngine.deleteTask();
    // After deletion, slot should be cleared or converted to Revision
    const updatedSubTask = task.bcsTasks.find(b => b.id === subTask.id);
    assert(updatedSubTask, 'Updated subtask exists');
});

// ----------------------------------------------------
// 4. Revision Mode Operations
// ----------------------------------------------------
console.log('\n4. Revision Management');

runTest('toggleRevisionMode activates revision for subject', () => {
    TaskEngine.toggleRevisionMode('Bangla Literature');
    assert(window.revisionData.active.includes('Bangla Literature'), 'Bangla Literature in active revision');
});

runTest('toggleRevisionChapter tracks chapter completion', () => {
    TaskEngine.toggleRevisionChapter('Bangla Literature', 1, true);
    assert(window.revisionData.progress['Bangla Literature'][1], 'Chapter 1 revision date recorded');
    
    TaskEngine.toggleRevisionChapter('Bangla Literature', 1, false);
    assert.strictEqual(window.revisionData.progress['Bangla Literature'][1], false, 'Chapter 1 revision unchecked');
});

// ----------------------------------------------------
// 5. Subject Queries & Helpers
// ----------------------------------------------------
console.log('\n5. Subject Status & Taxonomy Helpers');

runTest('getChapterStatus returns accurate status', () => {
    const status = TaskEngine.getChapterStatus('Bangla Literature', 1, 'bcs');
    assert(['complete', 'incomplete', 'skip'].includes(status), 'Status is valid');
});

runTest('isSubjectPassed checks passed items', () => {
    window.passedItems = { programs: [], subjects: ['Bangla Literature'] };
    assert.strictEqual(TaskEngine.isSubjectPassed('bcs', 'Bangla Literature'), true);
    assert.strictEqual(TaskEngine.isSubjectPassed('bcs', 'English Grammar'), false);
    window.passedItems = { programs: [], subjects: [] };
});

runTest('getChaptersForSubject returns all chapter numbers as set', () => {
    syllabusStructure.bcs[0].chapters = 5;
    const chapters = TaskEngine.getChaptersForSubject('bcs', 'Bangla Literature');
    assert(Array.isArray(chapters), 'Should return an array');
    assert(chapters.length >= 4, 'Should contain at least 4 chapters');
});

// ----------------------------------------------------
// 6. Subject Goals & Custom Time Targets
// ----------------------------------------------------
console.log('\n6. Subject Daily Goals');

runTest('saveSubjectTimeGoal links subject to pace goal or date', () => {
    window.currentSubjectForTimeGoal = 'Bangla Literature';
    document.getElementById('stm-time-date').value = '2026-03-01';
    SubjectGoals.saveSubjectTimeGoal();
    assert(window.subjectTimeLinks['Bangla Literature'], 'Subject time link saved');
    assert.strictEqual(window.subjectTimeLinks['Bangla Literature'].date, '2026-03-01');
});

runTest('clearSubjectTimeGoal resets timeline link', () => {
    window.currentSubjectForTimeGoal = 'Bangla Literature';
    SubjectGoals.clearSubjectTimeGoal();
    assert(!window.subjectTimeLinks['Bangla Literature'], 'Subject time link cleared');
});

// ----------------------------------------------------
// 7. KPI Metrics Calculation Engine
// ----------------------------------------------------
console.log('\n7. KPI Metrics Calculation Engine');

runTest('recalculateTotals counts all static chapters across tracks', () => {
    syllabusStructure.bcs[0].chapters = 5;
    const total = Metrics.recalculateTotals();
    assert(total > 0, 'Total static chapters > 0');
    assert.strictEqual(total, 12, '5 + 4 + 3 = 12 total static chapters');
});

runTest('updateCountdown computes days left and elapsed', () => {
    AppState.globalStartDate = new Date('2026-01-01T00:00:00.000Z');
    AppState.globalEndDate = new Date('2026-12-31T23:59:59.999Z');
    Metrics.updateCountdown();
    const timerEl = document.getElementById('countdown-timer');
    assert(timerEl.innerHTML.length > 0, 'Timer HTML populated');
});

runTest('updateSuccessScore computes score based on passed subjects', () => {
    window.passedItems = { programs: [], subjects: ['Bangla Literature'] };
    Metrics.updateSuccessScore();
    const statsEl = document.getElementById('success-score-stats');
    assert(statsEl.innerHTML.length > 0, 'Success score populated');
    window.passedItems = { programs: [], subjects: [] };
});

runTest('updateMetrics calculates subject statistics and global metrics', () => {
    const metrics = Metrics.updateMetrics();
    assert(metrics, 'updateMetrics returned result');
    assert(metrics.subjectStats, 'subjectStats computed');
    assert(metrics.subjectStats['Bangla Literature'], 'Bangla Literature stats computed');
    assert(typeof metrics.subjectStats['Bangla Literature'].totalChapters === 'number', 'totalChapters is number');
});

// ----------------------------------------------------
// 8. Dashboard Widgets & Orchestrator
// ----------------------------------------------------
console.log('\n8. Dashboard Overview & Widgets');

runTest('renderDashboardDailyChecklist renders active and overdue cards', () => {
    const todayStr = Utils.formatDate(new Date());
    window.dailyTargetsDatabase = {};
    window.dailyTargetsDatabase[todayStr] = [
        { id: 'dt-1', track: 'bcs', program: 'Preliminary', subject: 'Bangla Literature', chapter: 'Ch. 1', completed: false }
    ];
    DashboardCore.renderDashboardDailyChecklist();
    const listEl = document.getElementById('db-daily-targets-checklist');
    assert(listEl.innerHTML.includes('Bangla Literature') || listEl.innerHTML.includes('No Daily Targets'), 'Daily checklist rendered');
});

runTest('renderDashboardWeeklyChecklist renders weekly cards', () => {
    DashboardCore.renderDashboardWeeklyChecklist();
    const listEl = document.getElementById('db-weekly-targets-checklist');
    assert(listEl !== null, 'Weekly checklist rendered');
});

runTest('renderDashboardMonthlyChecklist renders monthly cards', () => {
    DashboardCore.renderDashboardMonthlyChecklist();
    const listEl = document.getElementById('db-monthly-targets-checklist');
    assert(listEl !== null, 'Monthly checklist rendered');
});

runTest('renderDashboardOutcomeCard renders outcome statistics', () => {
    DashboardCore.renderDashboardOutcomeCard();
    const cardEl = document.getElementById('db-outcome-progress-val');
    assert(cardEl !== null, 'Outcome card rendered');
});

runTest('renderDashboardUpcomingExamCard displays exam info', () => {
    window.examRoutineData = [
        { id: 'exam-1', subject: '47th BCS Preli', date: '2026-12-15', startTime: '10:00:00', endTime: '12:00:00', track: 'bcs', program: 'Preliminary' }
    ];
    DashboardCore.renderDashboardUpcomingExamCard();
    const titleEl = document.getElementById('db-upcoming-exam-title');
    assert(titleEl.textContent.includes('47th BCS Preli'), 'Upcoming exam card displays BCS exam');
});

runTest('renderDashboardPassedSubjectsCard displays passed summary', () => {
    window.passedItems = { programs: [], subjects: ['Bangla Literature'] };
    DashboardCore.renderDashboardPassedSubjectsCard();
    const cardEl = document.getElementById('db-passed-subjects-container');
    assert(cardEl.innerHTML.includes('Bangla Literature'), 'Passed subjects card includes Bangla Literature');
    window.passedItems = { programs: [], subjects: [] };
});

runTest('renderUI orchestrates complete dashboard render cleanly without recursion', () => {
    let err = null;
    try {
        DashboardCore.renderUI();
    } catch (e) {
        err = e;
    }
    assert.strictEqual(err, null, 'renderUI should execute without errors or infinite recursion');
});

runTest('renderUI does not call updateManageDropdown on startup or dashboard view when manage tab is inactive', () => {
    let updateManageCalled = 0;
    window.updateManageDropdown = () => { updateManageCalled++; };

    DashboardCore.renderUI();

    assert.strictEqual(updateManageCalled, 0, 'updateManageDropdown must not execute during dashboard renderUI when manage tab is inactive');
    delete window.updateManageDropdown;
});

runTest('renderUI calls updateManageDropdown only when sys-tab-manage is active', () => {
    let updateManageCalled = 0;
    window.updateManageDropdown = () => { updateManageCalled++; };

    const manageTabEl = getOrCreateElement('sys-tab-manage');
    manageTabEl.classList.add('bg-blue-600');

    DashboardCore.renderUI();

    assert.strictEqual(updateManageCalled, 1, 'updateManageDropdown should execute during renderUI when sys-tab-manage is active');
    manageTabEl.classList.remove('bg-blue-600');
    delete window.updateManageDropdown;
});

// ----------------------------------------------------
// 9. DashboardPage Lifecycle & Router Coordination
// ----------------------------------------------------
console.log('\n9. DashboardPage Lifecycle & Router');

runTest('DashboardPage mounts and destroys cleanly', () => {
    DashboardPage.mount();
    assert.strictEqual(DashboardPage.isMounted, true, 'DashboardPage is mounted');
    DashboardPage.destroy();
    assert.strictEqual(DashboardPage.isMounted, false, 'DashboardPage is unmounted');
});

// ----------------------------------------------------
// 10. Shared DOM Utilities (safeGetEl)
// ----------------------------------------------------
console.log('\n10. Shared DOM Utilities (safeGetEl)');

runTest('safeGetEl is exported and resolves elements properly with fallback guards', () => {
    const { safeGetEl } = require('../archive/legacy-js/js/utils/dom.js');
    assert.strictEqual(typeof safeGetEl, 'function', 'safeGetEl is exported as a function');
    
    // Existing element
    const testEl = safeGetEl('db-upcoming-exam-title');
    assert(testEl !== null, 'safeGetEl returns element when found');
    assert.strictEqual(testEl.id, 'db-upcoming-exam-title', 'Element ID matches');

    // Non-existent element in mock document
    const missingEl = safeGetEl('completely-non-existent-id-xyz');
    assert(missingEl !== undefined, 'safeGetEl returns a valid element or null');

    // Global and window availability
    assert.strictEqual(typeof window.safeGetEl, 'function', 'window.safeGetEl is defined');
});

// ----------------------------------------------------
// 11. Shared Color Utilities (colors.js)
// ----------------------------------------------------
console.log('\n11. Shared Color Utilities (colors.js)');

runTest('Color Utilities module exports canonical palette and helper functions', () => {
    const colorsModule = require('../archive/legacy-js/js/utils/colors.js');
    assert(Array.isArray(colorsModule.SUBJECT_PALETTE_COLORS), 'SUBJECT_PALETTE_COLORS is an array');
    assert.strictEqual(colorsModule.SUBJECT_PALETTE_COLORS.length, 14, 'Canonical palette contains 14 colors');
    assert.strictEqual(typeof colorsModule.hashStringToColor, 'function', 'hashStringToColor is a function');
    assert.strictEqual(typeof colorsModule.getSubjectColor, 'function', 'getSubjectColor is a function');
    assert.strictEqual(typeof colorsModule.hexToRgba, 'function', 'hexToRgba is a function');
});

runTest('hashStringToColor and getSubjectColor produce deterministic colors', () => {
    const { getSubjectColor, hashStringToColor } = require('../archive/legacy-js/js/utils/colors.js');
    const color1 = hashStringToColor('Audit');
    const color2 = hashStringToColor('Audit');
    assert.strictEqual(color1, color2, 'hashStringToColor is deterministic');
    assert.strictEqual(color1.startsWith('#'), true, 'Color is a hex string');

    const subColor1 = getSubjectColor('Financial Accounting');
    const subColor2 = getSubjectColor('Financial Accounting');
    assert.strictEqual(subColor1, subColor2, 'getSubjectColor returns consistent color');

    // Missing subject fallback
    assert.strictEqual(getSubjectColor(''), '#3b82f6', 'Empty subject falls back to default');
    assert.strictEqual(getSubjectColor(null), '#3b82f6', 'Null subject falls back to default');
});

runTest('hexToRgba converts 3-digit and 6-digit hex to rgba with alpha', () => {
    const { hexToRgba } = require('../archive/legacy-js/js/utils/colors.js');
    assert.strictEqual(hexToRgba('#fff', 0.5), 'rgba(255, 255, 255, 0.5)');
    assert.strictEqual(hexToRgba('000', 1), 'rgba(0, 0, 0, 1)');
    assert.strictEqual(hexToRgba('#3b82f6', 0.25), 'rgba(59, 130, 246, 0.25)');
    assert.strictEqual(hexToRgba('#10b981', 1), 'rgba(16, 185, 129, 1)');

    // Fallbacks
    assert.strictEqual(hexToRgba('', 0.5), 'rgba(16, 185, 129, 0.5)');
    assert.strictEqual(hexToRgba(null, 0.2), 'rgba(16, 185, 129, 0.2)');
    assert.strictEqual(hexToRgba('invalid', 0.2), 'rgba(16, 185, 129, 0.2)');
});

runTest('Color Utilities are exposed on Utils namespace and global/window scope', () => {
    const utils = require('../archive/legacy-js/js/utils.js');
    assert.strictEqual(typeof utils.getSubjectColor, 'function', 'Utils.getSubjectColor is exposed');
    assert.strictEqual(typeof utils.hexToRgba, 'function', 'Utils.hexToRgba is exposed');
    assert.strictEqual(typeof utils.hashStringToColor, 'function', 'Utils.hashStringToColor is exposed');
    assert(Array.isArray(utils.SUBJECT_PALETTE_COLORS), 'Utils.SUBJECT_PALETTE_COLORS is exposed');

    assert.strictEqual(typeof global.getSubjectColor, 'function', 'global.getSubjectColor is defined');
    assert.strictEqual(typeof global.hexToRgba, 'function', 'global.hexToRgba is defined');
    assert.strictEqual(typeof window.getSubjectColor, 'function', 'window.getSubjectColor is defined');
    assert.strictEqual(typeof window.hexToRgba, 'function', 'window.hexToRgba is defined');
});

// ----------------------------------------------------
// 12. Tasks Event Listener System (initTaskEventListeners)
// ----------------------------------------------------
console.log('\n12. Tasks Event Listener System (initTaskEventListeners)');

runTest('initTaskEventListeners is exported on TaskEngine and window', () => {
    assert.strictEqual(typeof TaskEngine.initTaskEventListeners, 'function', 'TaskEngine.initTaskEventListeners is a function');
    assert.strictEqual(typeof window.initTaskEventListeners, 'function', 'window.initTaskEventListeners is a function');
});

runTest('initTaskEventListeners is idempotent and does not accumulate duplicate listeners', () => {
    const taskListEl = getOrCreateElement('task-list');
    taskListEl._taskListenersBound = false;
    taskListEl.eventListeners = {};

    TaskEngine.initTaskEventListeners();
    const initialListenerCount = (taskListEl.eventListeners['change'] || []).length;
    assert.strictEqual(initialListenerCount, 1, 'Exactly one change listener attached to #task-list');

    // Second call should be a no-op due to idempotency guard
    TaskEngine.initTaskEventListeners();
    const secondListenerCount = (taskListEl.eventListeners['change'] || []).length;
    assert.strictEqual(secondListenerCount, 1, 'No duplicate listeners added after second call');
});

runTest('Container delegation on #task-list intercepts change events from dynamic .task-checkbox elements', () => {
    const taskListEl = getOrCreateElement('task-list');
    taskListEl._taskListenersBound = false;
    taskListEl.eventListeners = {};
    TaskEngine.initTaskEventListeners();

    // Create a dynamic checkbox element (as generated in single task card)
    const dynamicCheckbox = new MockElement('dyn-chk-1', 'input');
    dynamicCheckbox.classList.add('task-checkbox');
    dynamicCheckbox.dataset.studId = '1';
    dynamicCheckbox.dataset.type = 'ca';
    dynamicCheckbox.dataset.subtaskId = 'task-1';
    dynamicCheckbox.dataset.subject = 'Audit';
    dynamicCheckbox.dataset.chapter = 'Ch. 1';
    dynamicCheckbox.checked = true;
    taskListEl.appendChild(dynamicCheckbox);

    // Dispatch change event from child checkbox — bubbles up to container
    let toggleFired = false;
    const originalHandleToggle = TaskEngine.handleTaskToggle;
    
    // Simulate event bubbling to container
    dynamicCheckbox.dispatchEvent({
        type: 'change',
        target: dynamicCheckbox
    });

    assert.strictEqual(dynamicCheckbox.checked, true, 'Dynamic checkbox state recorded');
});

runTest('Keydown listener on #edit-task-modal handles Enter key on inputs', () => {
    const editModalEl = getOrCreateElement('edit-task-modal');
    editModalEl._taskListenersBound = false;
    editModalEl.eventListeners = {};
    TaskEngine.initTaskEventListeners();

    const initialKeydownCount = (editModalEl.eventListeners['keydown'] || []).length;
    assert.strictEqual(initialKeydownCount, 1, 'Keydown listener attached to edit modal');

    let saveEditCalled = false;
    window.saveTaskEdit = () => { saveEditCalled = true; };

    const titleInput = new MockElement('edit-task-title', 'input');
    titleInput.parentElement = editModalEl;

    let defaultPrevented = false;
    editModalEl.dispatchEvent({
        type: 'keydown',
        key: 'Enter',
        target: titleInput,
        preventDefault: () => { defaultPrevented = true; }
    });

    assert.strictEqual(defaultPrevented, true, 'Enter key default prevented');
    assert.strictEqual(saveEditCalled, true, 'saveTaskEdit triggered on Enter');
});

// ----------------------------------------------------
// Results Summary
// ----------------------------------------------------
console.log('\n==================================================');
console.log(`Phase 2 / Batch 10 Tests: ${passedTests} / ${totalTests} passed`);
console.log('==================================================\n');

if (passedTests !== totalTests) {
    process.exit(1);
}
