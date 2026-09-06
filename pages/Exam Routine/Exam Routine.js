/**
 * Exam Routine Page Module (pages/Exam Routine/Exam Routine.js)
 * Router entry point for Exam Routine page.
 * Canonical logic extracted to: js/features/exam/examRoutine.js
 */

(function () {
    'use strict';

    if (window.ExamRoutinePage && typeof window.ExamRoutinePage.mount === 'function') {
        const pageEl = document.getElementById('page-exam');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.ExamRoutinePage.mount();
        }
    } else if (typeof window.renderExamPage === 'function') {
        window.renderExamPage();
    }
})();
