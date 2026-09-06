/**
 * Daily Schedule Page Module (pages/Daily Schedule/Daily Schedule.js)
 * Router entry point for Daily Schedule page.
 * Canonical logic extracted to: js/features/schedule/scheduleRoutine.js
 */

(function () {
    'use strict';

    if (window.DailySchedulePage && typeof window.DailySchedulePage.mount === 'function') {
        const pageEl = document.getElementById('page-schedule');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.DailySchedulePage.mount();
        }
    } else if (typeof window.renderSchedulePage === 'function') {
        window.renderSchedulePage();
    }
})();
