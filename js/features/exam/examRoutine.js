/**
 * X-29 Module: features/exam/examRoutine.js
 * Exam Routine and Session Scheduler.
 */
(function (global) {
    'use strict';

/**
 * X-29 Module: features/exam/examRoutine.js
 * Exam Routine & Session Scheduler:
 * - Session timeframe group management (CRUD, date bounds)
 * - Subject Exam scheduling (program-wise & custom non-program modes)
 * - Live timetable filtering (All, Upcoming, Completed), search, status toggles
 * - Live Hero Countdown banner integration (with target selector)
 * - ExamRoutinePage lifecycle management
 */

// Filter state
let examCurrentFilter = 'upcoming';

/**
 * Synchronizes filter tab button UI states.
 *
 * @param {string} filter - 'all' | 'upcoming' | 'completed'
 */
function setExamFilterUI(filter) {
    ['all', 'upcoming', 'completed'].forEach(f => {
        const btn = document.getElementById(`btn-exam-filter-${f}`);
        if (btn) {
            if (f === filter) {
                btn.className = "justify-center py-2 px-2.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm transition-all min-h-[34px] flex items-center";
            } else {
                btn.className = "justify-center py-2 px-2.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all min-h-[34px] flex items-center";
            }
        }
    });
}

/**
 * Sets active filter and updates routine list.
 *
 * @param {string} filter
 */
function setExamFilter(filter) {
    examCurrentFilter = filter;
    
    // Global attachments
    global.ExamRoutinePage = ExamRoutinePage;
    global.examCurrentFilter = global.examCurrentFilter || examCurrentFilter;
    global.setExamFilterUI = setExamFilterUI;
    global.setExamFilter = setExamFilter;
    global.onSelectCountdownTarget = onSelectCountdownTarget;
    global.updateExamHeroCountdown = updateExamHeroCountdown;
    global.setExamMode = setExamMode;
    global.onExamProgramChange = onExamProgramChange;
    global.openSessionModal = openSessionModal;
    global.closeSessionModal = closeSessionModal;
    global.saveSessionForm = saveSessionForm;
    global.deleteSession = deleteSession;
    global.deleteExamSession = deleteExamSession;
    global.renderExamRoutine = renderExamRoutine;
    global.openExamModal = openExamModal;
    global.closeExamModal = closeExamModal;
    global.saveExamForm = saveExamForm;
    global.toggleExamStatus = toggleExamStatus;
    global.deleteExam = deleteExam;
    global.renderExamPage = renderExamPage;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ExamRoutinePage, renderExamRoutine, renderExamPage };
    }
})(typeof window !== 'undefined' ? window : globalThis);
