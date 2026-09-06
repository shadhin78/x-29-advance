/**
 * X-29 Module: features/schedule/scheduleRoutine.js
 * Daily Schedule Routine management.
 */
(function (global) {
    'use strict';

/**
 * X-29 Module: features/schedule/scheduleRoutine.js
 * Daily Schedule Routine management:
 * - Routine Set switching (Routine 1 vs Routine 2)
 * - Daily Schedule block CRUD (Add, Edit, Delete, Day Start indicator)
 * - Work Group organization & summaries
 * - 24-Hour Routine Allocation list & timeline grid rendering
 * - DailySchedulePage lifecycle controller
 */

// Module state
let selectedScheduleColor = '#6366f1';
let editingScheduleBlockId = null;
let editingScheduleGroupId = null;
let editingScheduleSet = 1;

/**
 * Toggles between Routine 1 and Routine 2 sets.
 *
 * @param {number} [direction]
 */
function switchRoutineSet(direction) {
    const nextSet = (window.activeRoutineSet === 1) ? 2 : 1;
    window.activeRoutineSet = nextSet;

    const badge = document.getElementById('active-routine-badge');
    if (badge) {
        badge.textContent = `Routine ${window.activeRoutineSet}`;
    }

    if (typeof renderSchedulePage === 'function') {
        renderSchedulePage();
    }
    if (typeof window.updateActiveScheduleSlot === 'function') {
        window.updateActiveScheduleSlot();
    }
}

/**
 * Color selection handler for modal block creator.
 *
 * @param {string} color
 * @param {HTMLElement} [btnEl]
 */
function selectScheduleColor(color, btnEl) {
    selectedScheduleColor = color;
    
    // Global attachments
    global.switchRoutineSet = switchRoutineSet;
    global.selectScheduleColor = selectScheduleColor;
    global.onScheduleTrackChange = onScheduleTrackChange;
    global.openAddScheduleModal = openAddScheduleModal;
    global.openEditScheduleModal = openEditScheduleModal;
    global.deleteScheduleBlock = deleteScheduleBlock;
    global.submitAddScheduleBlock = submitAddScheduleBlock;
    global.openAddScheduleModal2 = openAddScheduleModal2;
    global.openCreateScheduleGroup = openCreateScheduleGroup;
    global.submitCreateScheduleGroup = submitCreateScheduleGroup;
    global.deleteScheduleGroup = deleteScheduleGroup;
    global.assignSlotToGroup = assignSlotToGroup;
    global.removeSlotFromGroup = removeSlotFromGroup;
    global.getGroupForWork = getGroupForWork;
    global.renderSchedulePage = renderSchedulePage;
    global.DailySchedulePage = DailySchedulePage;

    if (!global.scheduleGroups) global.scheduleGroups = [];
    if (global.selectedScheduleColor === undefined) global.selectedScheduleColor = '#6366f1';

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { DailySchedulePage, switchRoutineSet, renderSchedulePage };
    }
})(typeof window !== 'undefined' ? window : globalThis);
