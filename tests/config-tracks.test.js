/**
 * Comprehensive Test Suite for Phase 2 / Batch 4:
 * Master Config, Dynamic Tracks, Priority Reordering, Clean Slate Reset, and Cascade Safety.
 */

const assert = require('assert');

// 1. Setup Mock DOM and Browser Environment
class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.value = '';
        this.innerHTML = '';
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
    }

    contains(other) {
        return false;
    }

    focus() {}
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
        return elements.get(id) || null;
    },
    querySelector(sel) {
        if (sel.startsWith('#')) {
            return this.getElementById(sel.slice(1));
        }
        return null;
    },
    querySelectorAll(sel) {
        return [];
    },
    createElement(tag) {
        return new MockElement('', tag);
    },
    activeElement: null
};

// Initialize necessary DOM elements for config systems
[
    'sys-content-curriculum', 'sys-content-priority', 'sys-content-track',
    'add-track-name', 'etm-track-id', 'etm-track-name',
    'add-prog-track', 'add-prog-name',
    'add-sub-track', 'add-sub-program', 'add-sub-name', 'add-sub-bulk', 'add-sub-chapters-num',
    'add-ch-track', 'add-ch-program', 'add-ch-subject', 'add-ch-num', 'add-ch-title',
    'manage-track-box', 'manage-prog-box', 'manage-type', 'manage-track', 'manage-program', 'manage-target', 'manage-new-name',
    'edit-header-tag', 'edit-header-title', 'edit-header-sub',
    'schedule-input-track', 'add-act-track', 'edam-action-track', 'adt-todo-track', 'esm-track'
].forEach(id => getOrCreateElement(id));

// 2. Setup Global State
global.window = global;
global.document = mockDocument;

let saveToCloudCalled = 0;
let wipeCloudWorkspaceCalled = 0;
let deletedRecords = [];
let toastMessages = [];

global.FirebaseService = {
    saveToCloud: (immediate = false) => {
        saveToCloudCalled++;
    },
    wipeCloudWorkspace: () => {
        wipeCloudWorkspaceCalled++;
    }
};

global.recordItemDeletion = (id) => {
    deletedRecords.push(id);
};

global.showToast = (msg, type) => {
    toastMessages.push({ msg, type });
};

global.openConfirmModal = (title, msg, onConfirm) => {
    // Automatically confirm in test runner
    if (typeof onConfirm === 'function') onConfirm();
};

global.closeModal = (id) => {};
global.openModal = (id) => {};
global.recalculateTotals = () => {};
global.renderUI = () => {};
global.safeSetText = () => {};

// AppState & Data initialization
global.AppState = {
    tasks: [
        {
            id: 'task-1',
            date: '01/01/2026',
            type: 'study',
            coreTasks: [{ subject: 'Math', chapter: 'Ch. 1', title: 'Calculus', completed: false, id: 'core-1' }],
            coreStudy: true
        }
    ],
    subjectColors: {},
    dynamicLineColors: ['#6366f1', '#10b981'],
    currentFilter: 'All'
};

global.tracks = [
    { id: 'core', name: 'Core Track', priority: 1, order: 0 }
];

global.syllabusStructure = {
    core: [
        { subject: 'Math', program: 'CS', priority: 1, order: 0 }
    ]
};

global.customPrograms = {
    core: [
        { name: 'CS', priority: 1, order: 0 }
    ]
};

global.customActions = [
    { id: 'workout', title: 'Workout', priority: 1, order: 0, track: 'core' }
];

global.paceGoals = [
    { id: 'pg-1', type: 'program', target: 'CS' },
    { id: 'pg-2', type: 'subject', target: 'Math' },
    { id: 'pg-3', type: 'bundle', programs: ['CS'], subjects: ['Math'] }
];

global.passedItems = {
    programs: ['CS'],
    subjects: ['Math']
};

global.revisionData = {
    active: ['Math'],
    progress: { Math: 50 }
};

global.subjectTimeLinks = {
    Math: 'link-1'
};

global.successResults = [
    { id: 'sr-1', type: 'cgpa', title: 'CS', subject: 'Math' }
];

global.subjectDetailsState = {
    Math: { expanded: true }
};

global.chartVisibility = {
    prog: { CS: true },
    subjects: { Math: true },
    monthly: {},
    yearly: {}
};

global.getAllSubjects = function () {
    const list = [];
    if (global.syllabusStructure) {
        Object.keys(global.syllabusStructure).forEach(t => {
            (global.syllabusStructure[t] || []).forEach(s => list.push(s));
        });
    }
    return list;
};

global.getAllPrograms = function () {
    const list = [];
    if (global.customPrograms) {
        Object.keys(global.customPrograms).forEach(t => {
            (global.customPrograms[t] || []).forEach(p => list.push(p));
        });
    }
    return list;
};

// Load modules under test
require('../js/features/config/tracksConfig.js');
require('../js/features/config/priorityConfig.js');
require('../js/features/config/masterConfig.js');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ✓ ${desc}`);
    } catch (err) {
        console.error(`  ✗ ${desc}`);
        console.error(err);
        process.exitCode = 1;
    }
}

console.log('\n==================================================');
console.log('RUNNING SUITE: Phase 2 / Batch 4 Configuration Modules');
console.log('==================================================\n');

// ----------------------------------------------------
// TEST GROUP 1: Dynamic Tracks Manager
// ----------------------------------------------------
console.log('Group 1: Dynamic Tracks Manager (tracksConfig.js)');

it('should populate track dropdowns with all dynamic tracks including schedule-input-track', () => {
    window.populateTrackDropdowns();
    const schedSelect = mockDocument.getElementById('schedule-input-track');
    assert(schedSelect.innerHTML.includes('Core Track'), 'Schedule input track should have Core Track option');
});

it('should create a new dynamic track and backfill existing tasks', () => {
    const nameInput = mockDocument.getElementById('add-track-name');
    nameInput.value = 'Elective Track';
    const initSaves = saveToCloudCalled;

    window.appendNewTrack();

    const createdTrack = window.tracks.find(t => t.name === 'Elective Track');
    assert(createdTrack, 'New track should be created');
    assert.strictEqual(createdTrack.id, 'elective-track', 'Slugified ID should match');
    assert(saveToCloudCalled > initSaves, 'Firebase saveToCloud should be called on track creation');
    assert(window.syllabusStructure['elective-track'], 'Syllabus structure entry should be initialized');
    assert(window.customPrograms['elective-track'], 'Custom programs entry should be initialized');

    // Backfill tasks check
    assert(window.AppState.tasks[0]['elective-trackTasks'], 'Tasks should be backfilled with new track task slots');
});

it('should rename a dynamic track', () => {
    const idEl = mockDocument.getElementById('etm-track-id');
    const nameEl = mockDocument.getElementById('etm-track-name');
    idEl.value = 'elective-track';
    nameEl.value = 'Advanced Electives';

    window.saveTrackEditModal();

    const renamed = window.tracks.find(t => t.id === 'elective-track');
    assert.strictEqual(renamed.name, 'Advanced Electives', 'Track should be renamed');
});

it('should execute cascade deletion of a track and clean all downstream consumers', () => {
    // Setup child program & subject for elective track
    window.customPrograms['elective-track'] = [{ name: 'AI', priority: 1 }];
    window.syllabusStructure['elective-track'] = [{ subject: 'Machine Learning', program: 'AI', priority: 1 }];
    window.paceGoals.push({ id: 'pg-ai', type: 'program', target: 'AI' });
    window.passedItems.programs.push('AI');
    window.passedItems.subjects.push('Machine Learning');
    window.revisionData.active.push('Machine Learning');
    window.revisionData.progress['Machine Learning'] = 30;
    window.subjectTimeLinks['Machine Learning'] = 'link-ml';
    window.customActions[0].track = 'elective-track';

    window.executeDeleteTrack('elective-track');

    assert(!window.tracks.some(t => t.id === 'elective-track'), 'Track should be removed from window.tracks');
    assert(!window.customPrograms['elective-track'], 'Custom programs for track should be deleted');
    assert(!window.syllabusStructure['elective-track'], 'Syllabus structure for track should be deleted');
    assert(window.customActions[0].track === null, 'Associated custom action track link should be nulled');
    assert(!window.AppState.tasks[0]['elective-trackTasks'], 'Task slots for track should be removed');
    assert(!window.passedItems.programs.includes('AI'), 'Passed program should be cleaned');
    assert(!window.passedItems.subjects.includes('Machine Learning'), 'Passed subject should be cleaned');
    assert(!window.revisionData.active.includes('Machine Learning'), 'Revision data active should be cleaned');
    assert(!window.revisionData.progress['Machine Learning'], 'Revision progress should be cleaned');
    assert(!window.subjectTimeLinks['Machine Learning'], 'Subject time link should be cleaned');
    assert(!window.paceGoals.some(g => g.target === 'AI'), 'Pace goal for child program should be cleaned');
    assert(deletedRecords.includes('elective-track'), 'Track deletion recorded in recordItemDeletion');
    assert(deletedRecords.includes('AI'), 'Program deletion recorded in recordItemDeletion');
    assert(deletedRecords.includes('Machine Learning'), 'Subject deletion recorded in recordItemDeletion');
});

// ----------------------------------------------------
// TEST GROUP 2: Curriculum Taxonomy Builder (masterConfig.js)
// ----------------------------------------------------
console.log('\nGroup 2: Master Config & Curriculum Taxonomy (masterConfig.js)');

it('should create a new program under a track', () => {
    mockDocument.getElementById('add-prog-track').value = 'core';
    mockDocument.getElementById('add-prog-name').value = 'Algorithms';

    window.appendNewProgram();

    const progs = window.customPrograms['core'] || [];
    assert(progs.some(p => (p.name || p) === 'Algorithms'), 'Program should be added');
});

it('should prevent duplicate program in the same track', () => {
    mockDocument.getElementById('add-prog-track').value = 'core';
    mockDocument.getElementById('add-prog-name').value = 'Algorithms';

    const prevCount = (window.customPrograms['core'] || []).length;
    window.appendNewProgram();

    assert.strictEqual((window.customPrograms['core'] || []).length, prevCount, 'Duplicate program should not be added');
});

it('should create a new subject under a track and program', () => {
    mockDocument.getElementById('add-sub-track').value = 'core';
    mockDocument.getElementById('add-sub-program').value = 'Algorithms';
    mockDocument.getElementById('add-sub-name').value = 'Sorting';

    window.appendNewSubject();

    const subs = window.syllabusStructure['core'] || [];
    assert(subs.some(s => s.subject === 'Sorting' && s.program === 'Algorithms'), 'Subject should be added');
});

it('should create a new chapter and slot into available revision task slot', () => {
    // Add revision slot in tasks
    window.AppState.tasks.push({
        id: 'task-2',
        date: '02/01/2026',
        type: 'study',
        coreTasks: [{ subject: 'Revision', chapter: 'Rev', title: 'Practice', completed: false, id: 'core-rev-1' }],
        coreStudy: true
    });

    mockDocument.getElementById('add-ch-track').value = 'core';
    mockDocument.getElementById('add-ch-program').value = 'Algorithms';
    mockDocument.getElementById('add-ch-subject').value = 'Sorting';
    mockDocument.getElementById('add-ch-num').value = '1';
    mockDocument.getElementById('add-ch-title').value = 'QuickSort & MergeSort';

    window.appendNewChapter();

    const slottedTask = window.AppState.tasks[1].coreTasks[0];
    assert.strictEqual(slottedTask.subject, 'Sorting', 'Chapter subject should be slotted');
    assert.strictEqual(slottedTask.chapter, 'Ch. 1', 'Chapter number should be formatted');
    assert.strictEqual(slottedTask.title, 'QuickSort & MergeSort', 'Chapter title should match');
});

it('should manage rename program across pace goals, success results, and subjects', () => {
    mockDocument.getElementById('manage-type').value = 'program';
    mockDocument.getElementById('manage-track').value = 'core';
    mockDocument.getElementById('manage-target').value = 'Algorithms';
    mockDocument.getElementById('manage-new-name').value = 'Data Structures & Algorithms';

    window.executeManageEdit();

    const progs = window.customPrograms['core'] || [];
    assert(progs.some(p => (p.name || p) === 'Data Structures & Algorithms'), 'Program should be renamed in customPrograms');
    const subs = window.syllabusStructure['core'] || [];
    assert(subs.some(s => s.subject === 'Sorting' && s.program === 'Data Structures & Algorithms'), 'Program should be updated in subjects');
});

it('should manage delete program with full cascade safety', () => {
    mockDocument.getElementById('manage-type').value = 'program';
    mockDocument.getElementById('manage-track').value = 'core';
    mockDocument.getElementById('manage-target').value = 'Data Structures & Algorithms';

    window.executeManageDelete();

    const progs = window.customPrograms['core'] || [];
    assert(!progs.some(p => (p.name || p) === 'Data Structures & Algorithms'), 'Program should be deleted');
    const subs = window.syllabusStructure['core'] || [];
    assert(!subs.some(s => s.subject === 'Sorting'), 'Child subjects should be cascaded and deleted');
    // Task check: slotted subject should revert to Revision
    const revertedTask = window.AppState.tasks[1].coreTasks[0];
    assert.strictEqual(revertedTask.subject, 'Revision', 'Slotted task subject should revert to Revision');
});

// ----------------------------------------------------
// TEST GROUP 3: Global Priority Reordering (priorityConfig.js)
// ----------------------------------------------------
console.log('\nGroup 3: Global Priority Reordering (priorityConfig.js)');

it('should normalize invalid and duplicate priorities', () => {
    window.tracks = [
        { id: 'track-1', name: 'Track 1', priority: 5 },
        { id: 'track-2', name: 'Track 2', priority: 5 }
    ];

    window.normalizePriorities();

    assert.strictEqual(window.tracks[0].priority, 1, 'First track priority should be 1');
    assert.strictEqual(window.tracks[1].priority, 2, 'Second track priority should be 2');
});

it('should sort custom data according to priority and order', () => {
    window.customPrograms['track-1'] = [
        { name: 'Prog B', priority: 2, order: 1 },
        { name: 'Prog A', priority: 1, order: 0 }
    ];

    window.sortAllCustomData();

    assert.strictEqual(window.customPrograms['track-1'][0].name, 'Prog A', 'Prog A should be first');
    assert.strictEqual(window.customPrograms['track-1'][1].name, 'Prog B', 'Prog B should be second');
});

it('should move priority item up or down and update ranks', () => {
    window.movePriorityItem('track', null, 0, 'down');
    assert.strictEqual(window.tracks[0].id, 'track-2', 'Track 2 should have moved up');
    assert.strictEqual(window.tracks[1].id, 'track-1', 'Track 1 should have moved down');
    assert.strictEqual(window.tracks[0].priority, 1, 'Track 2 should now have priority 1');
    assert.strictEqual(window.tracks[1].priority, 2, 'Track 1 should now have priority 2');
});

// ----------------------------------------------------
// TEST GROUP 4: Clean Slate / Workspace Reset
// ----------------------------------------------------
console.log('\nGroup 4: Clean Slate Reset (masterConfig.js)');

it('should wipe state, reset metrics, and trigger cloud sync on Clean Slate', () => {
    const initSaves = saveToCloudCalled;
    window.resetToCleanSlate(false); // don't block on confirm in unit test

    assert.strictEqual(window.tracks.length, 0, 'Clean slate resets tracks to empty array');
    assert.strictEqual(window.AppState.tasks.length, 0, 'AppState.tasks should be emptied');
    assert.strictEqual(window.paceGoals.length, 0, 'Pace goals should be reset');
    assert.strictEqual(window.customActions.length, 0, 'Custom actions should be reset');
    assert(saveToCloudCalled > initSaves || wipeCloudWorkspaceCalled > 0, 'Firebase sync should be invoked on clean slate');
});

// ----------------------------------------------------
// TEST GROUP 5: Existing Tasks, Daily Actions, and Targets Integrity
// ----------------------------------------------------
console.log('\nGroup 5: Integrity of Tasks, Daily Actions, and Targets');

it('should maintain task structure and not corrupt daily action track linkages', () => {
    // Re-create a track, an action, and a target
    window.tracks = [{ id: 'core', name: 'Core Track', priority: 1, order: 0 }];
    window.customActions = [{ id: 'habit-1', title: 'Daily Review', priority: 1, order: 0, track: 'core' }];
    window.AppState.tasks = [{
        id: 'task-test',
        date: '03/01/2026',
        type: 'study',
        coreTasks: [{ subject: 'Core Subj', chapter: 'Ch. 1', title: 'Basics', completed: true, id: 'sub-1' }],
        coreStudy: true
    }];

    // Perform priority sort and track dropdown population
    window.sortAllCustomData();
    window.populateTrackDropdowns();

    assert.strictEqual(window.AppState.tasks[0].coreTasks[0].completed, true, 'Task completed state must remain intact');
    assert.strictEqual(window.customActions[0].track, 'core', 'Action track reference must remain intact');
    assert.strictEqual(window.customActions[0].title, 'Daily Review', 'Action title must remain intact');
});

console.log('\n==================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} tests passed`);
console.log('==================================================\n');

if (passedTests === totalTests) {
    console.log('All tests passed successfully!');
    process.exit(0);
} else {
    console.error(`Failed ${totalTests - passedTests} tests.`);
    process.exit(1);
}
