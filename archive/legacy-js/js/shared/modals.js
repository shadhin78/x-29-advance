/**
 * X-29 Module: shared/modals.js
 * Universal Modal visibility controller & transition manager.
 * 
 * Responsibilities:
 * 1. Manages open/close transitions and animations for 35 distinct application modals.
 * 2. Manages backdrop and modal container element resolution via dictionary maps.
 * 3. Enforces body scroll locking/unlocking during modal presentation.
 * 4. Dispatches modal-specific hooks (analytics data population, tooltip dismissal).
 * 5. Synchronizes and resizes Chart.js canvas dimensions after CSS entrance transitions (320ms).
 */

(function () {
    'use strict';

    const _root = (typeof window !== 'undefined') ? window : ((typeof global !== 'undefined') ? global : globalThis);

    const MODAL_BACKDROPS = {
    'celebration-setup-modal': 'csm-backdrop',
    'edit-timeline-entry-modal': 'etem-backdrop',
    'global-chapters-modal': 'gcm-backdrop',
    'program-completions-modal': 'pcm-completions-backdrop',
    'create-schedule-group-modal': 'csgm-backdrop',
    'pace-candle-modal': 'pcm-backdrop',
    'program-trend-modal': 'ptm-results-backdrop',
    'analytics-modal': 'am-backdrop',
    'yearly-actions-modal': 'ym-backdrop',
    'subject-trend-modal': 'stm-backdrop',
    'edit-task-modal': 'etm-backdrop',
    'edit-pace-modal': 'epm-backdrop',
    'edit-trends-pace-modal': 'etpm-backdrop',
    'pace-trend-modal': 'ptm-backdrop',
    'goal-details-modal': 'gdm-backdrop',
    'revision-manage-modal': 'rmm-backdrop',
    'revision-trend-modal': 'rvm-backdrop',
    'global-history-modal': 'ghm-backdrop',
    'subject-time-modal': 'stm-time-backdrop',
    'daily-actions-db-modal': 'dadb-backdrop',
    'daily-targets-db-modal': 'dtdb-backdrop',
    'weekly-targets-db-modal': 'wtdb-backdrop',
    'monthly-targets-db-modal': 'mtdb-backdrop',
    'result-modal': 'resm-backdrop',
    'edit-subject-modal': 'esm-backdrop',
    'edit-track-modal': 'etm-track-backdrop',
    'edit-daily-action-modal': 'edam-backdrop',
    'custom-timer-modal': 'ctm-backdrop',
    'account-settings-modal': 'asm-account-backdrop',
    'add-schedule-modal': 'asm-schedule-backdrop',
    'add-timer-session-modal': 'atsm-backdrop',
    'edit-timer-session-modal': 'etsm-backdrop',
    'timer-analytics-modal': 'tam-backdrop',
    'add-daily-target-modal': 'adtm-backdrop',
    'add-weekly-target-modal': 'wtm-backdrop',
    'subject-target-modal': 'stm-target-backdrop',
    'confirm-modal': 'cm-backdrop',
    'timer-warning-modal': 'tw-backdrop',
    'congrats-modal': 'congrats-backdrop',
    'spectra-heatmap-day-modal': 'spectra-heatmap-day-modal'
};

const MODAL_CONTENTS = {
    'celebration-setup-modal': 'csm-content',
    'edit-timeline-entry-modal': 'etem-content',
    'global-chapters-modal': 'gcm-content',
    'program-completions-modal': 'pcm-completions-content',
    'create-schedule-group-modal': 'csgm-content',
    'pace-candle-modal': 'pcm-content',
    'program-trend-modal': 'ptm-results-content',
    'analytics-modal': 'am-content',
    'yearly-actions-modal': 'ym-content',
    'subject-trend-modal': 'stm-content',
    'edit-task-modal': 'etm-content',
    'edit-pace-modal': 'epm-content',
    'edit-trends-pace-modal': 'etpm-content',
    'pace-trend-modal': 'ptm-content',
    'goal-details-modal': 'gdm-content',
    'revision-manage-modal': 'rmm-content',
    'revision-trend-modal': 'rvm-content',
    'global-history-modal': 'ghm-content',
    'subject-time-modal': 'stm-time-content',
    'daily-actions-db-modal': 'dadb-content',
    'daily-targets-db-modal': 'dtdb-content',
    'weekly-targets-db-modal': 'wtdb-content',
    'monthly-targets-db-modal': 'mtdb-content',
    'result-modal': 'resm-content',
    'edit-subject-modal': 'esm-content',
    'edit-track-modal': 'etm-track-content',
    'edit-daily-action-modal': 'edam-content',
    'custom-timer-modal': 'ctm-content',
    'account-settings-modal': 'asm-account-content',
    'add-schedule-modal': 'asm-schedule-content',
    'add-timer-session-modal': 'atsm-content',
    'edit-timer-session-modal': 'etsm-content',
    'timer-analytics-modal': 'tam-content',
    'add-daily-target-modal': 'adtm-content',
    'add-weekly-target-modal': 'wtm-content',
    'subject-target-modal': 'stm-target-content',
    'confirm-modal': 'cm-content',
    'timer-warning-modal': 'tw-content',
    'congrats-modal': 'congrats-content',
    'spectra-heatmap-day-modal': 'spectra-heatmap-day-modal'
};

/**
 * Universal modal opener.
 * 
 * @param {string} modalId - DOM element ID of modal
 * @param {string|null} [typeKey=null] - Optional type key passed to modal population hooks
 */
function openModal(modalId, typeKey = null) {
    if (modalId === 'analytics-modal' && typeKey) {
        try {
            if (typeof window !== 'undefined' && typeof window.populateAnalyticsModal === 'function') {
                window.populateAnalyticsModal(typeKey);
            } else if (typeof populateAnalyticsModal === 'function') {
                populateAnalyticsModal(typeKey);
            }
        } catch (err) {
            console.error('[openModal] Error populating analytics modal:', err);
        }
    }

    const modal = document.getElementById(modalId);
    const backdrop = (MODAL_BACKDROPS[modalId] && document.getElementById(MODAL_BACKDROPS[modalId])) || (modal ? modal.children[0] : null);
    const content = (MODAL_CONTENTS[modalId] && document.getElementById(MODAL_CONTENTS[modalId])) || (modal ? modal.children[1] : null);
    if (!modal || !backdrop || !content) return;

    modal.classList.remove('hidden');
    void modal.offsetWidth;
    backdrop.classList.remove('opacity-0');
    backdrop.classList.add('opacity-100');
    content.classList.remove('scale-95', 'opacity-0', 'translate-y-4');
    content.classList.add('scale-100', 'opacity-100', 'translate-y-0');
    if (document.body) {
        document.body.classList.add('overflow-hidden');
    }

    if (modalId === 'revision-trend-modal') {
        if (typeof window !== 'undefined' && typeof window.renderRevisionTrendChart === 'function') {
            window.renderRevisionTrendChart();
        } else if (typeof renderRevisionTrendChart === 'function') {
            renderRevisionTrendChart();
        }
    }
    if (modalId === 'timer-analytics-modal') {
        if (typeof window !== 'undefined' && typeof window.renderTimerAnalyticsChart === 'function') {
            window.renderTimerAnalyticsChart();
        } else if (typeof renderTimerAnalyticsChart === 'function') {
            renderTimerAnalyticsChart();
        }
    }

    // Sync all charts properly by giving the CSS transform transition time (300ms) to complete
    // before recalculating canvas dimensions. This applies to Analytics, Yearly, Pace, and Subject modals.
    setTimeout(() => {
        const resizeAndUpdate = (chart) => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
                if (typeof chart.update === 'function') {
                    chart.update('none');
                }
            }
        };

        const win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
        const appSt = typeof AppState !== 'undefined' ? AppState : (win.AppState || {});

        if (modalId === 'yearly-actions-modal') resizeAndUpdate(win.yearlyChartActions);
        if (modalId === 'timer-analytics-modal') resizeAndUpdate(win.timerAnalyticsChartInstance);

        if (modalId === 'revision-trend-modal') resizeAndUpdate(win.revisionTrendChartInstance);
        if (modalId === 'pace-trend-modal') resizeAndUpdate(win.paceTrendChartInstance);
        if (modalId === 'analytics-modal') resizeAndUpdate(appSt.masterLineChart || win.masterLineChart);
        if (modalId === 'global-history-modal') resizeAndUpdate(win.globalHistoryChartInstance);
        if (modalId === 'daily-actions-db-modal') resizeAndUpdate(win.dadbTrendChartInstance);
        if (modalId === 'weekly-targets-db-modal') resizeAndUpdate(win.wtdbMixedChartInstance);
        if (modalId === 'monthly-targets-db-modal') resizeAndUpdate(win.mtdbMixedChartInstance);
        if (modalId === 'program-trend-modal') {
            resizeAndUpdate(win.programTrendChartInstance);
            resizeAndUpdate(win.subjectWiseChartInstance);
        }
        if (modalId === 'pace-candle-modal') resizeAndUpdate(win.paceCandleChartInstance);
        if (modalId === 'subject-trend-modal') resizeAndUpdate(win.subjectTrendLineChartInstance);
    }, 320);
}

/**
 * Universal modal closer.
 * 
 * @param {string} modalId - DOM element ID of modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = (MODAL_BACKDROPS[modalId] && document.getElementById(MODAL_BACKDROPS[modalId])) 
        || (modal ? (modal.querySelector('[id$="-backdrop"]') || modal.children[0]) : null);
    const content = (MODAL_CONTENTS[modalId] && document.getElementById(MODAL_CONTENTS[modalId])) 
        || (modal ? (modal.querySelector('[id$="-content"]') || modal.children[1] || modal.children[0]) : null);
    if (!modal) return;

    if (modalId === 'analytics-modal') {
        if (typeof window !== 'undefined' && typeof window.hideActionHeatmapTooltip === 'function') {
            window.hideActionHeatmapTooltip();
        } else if (typeof hideActionHeatmapTooltip === 'function') {
            hideActionHeatmapTooltip();
        }
    }

    if (backdrop) {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
    }
    if (content) {
        content.classList.remove('scale-100', 'opacity-100', 'translate-y-0');
        content.classList.add('scale-95', 'opacity-0', 'translate-y-4');
    }

    setTimeout(() => {
        if (modal) modal.classList.add('hidden');
        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.remove('overflow-hidden');
        }
    }, 300);
}

/**
 * Global click delegation for modal dismissal and backdrop clicks.
 */
function initModalEventListeners() {
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    if (_root._modalListenersInitialized) return;
    _root._modalListenersInitialized = true;

    document.addEventListener('click', (e) => {
        // 1. Close button with data-modal-close, data-close-modal, .btn-modal-close, or standard close button
        const closeBtn = e.target.closest('[data-modal-close], [data-close-modal], .btn-modal-close, [data-close-subject-target-modal], [data-close-congrats], button[class*="hover:rotate-90"], [aria-label="Close"], [title="Close"]');
        if (closeBtn) {
            const targetId = closeBtn.getAttribute('data-modal-close') || closeBtn.getAttribute('data-close-modal');
            if (targetId) {
                if (targetId === 'spectra-heatmap-day-modal' && typeof window !== 'undefined' && typeof window.closeSpectraHeatmapDayModal === 'function') {
                    window.closeSpectraHeatmapDayModal();
                    return;
                }
                closeModal(targetId);
                return;
            }
            if (closeBtn.hasAttribute('data-close-subject-target-modal')) {
                if (typeof window !== 'undefined' && typeof window.closeSubjectTargetModal === 'function') {
                    window.closeSubjectTargetModal();
                } else {
                    closeModal('subject-target-modal');
                }
                return;
            }
            if (closeBtn.hasAttribute('data-close-congrats')) {
                if (typeof window !== 'undefined' && typeof window.closeCongratulationsModal === 'function') {
                    window.closeCongratulationsModal();
                } else {
                    closeModal('congrats-modal');
                }
                return;
            }
            const modalEl = closeBtn.closest('[id$="-modal"]');
            if (modalEl && modalEl.id) {
                if (modalEl.id === 'spectra-heatmap-day-modal' && typeof window !== 'undefined' && typeof window.closeSpectraHeatmapDayModal === 'function') {
                    window.closeSpectraHeatmapDayModal();
                    return;
                }
                closeModal(modalEl.id);
                return;
            }
        }

        // 2. Click directly on backdrop element
        const backdrop = e.target.closest('[id$="-backdrop"]');
        if (backdrop && backdrop === e.target) {
            for (const [mId, bId] of Object.entries(MODAL_BACKDROPS)) {
                if (bId === backdrop.id) {
                    closeModal(mId);
                    return;
                }
            }
            const modalEl = backdrop.closest('[id$="-modal"]') || backdrop.parentElement;
            if (modalEl && modalEl.id) {
                closeModal(modalEl.id);
                return;
            }
        }
    });
}

// Global window and environment compatibility bridge
if (typeof window !== 'undefined') {
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.initModalEventListeners = initModalEventListeners;
    window.MODAL_BACKDROPS = MODAL_BACKDROPS;
    window.MODAL_CONTENTS = MODAL_CONTENTS;
}
if (typeof global !== 'undefined') {
    global.openModal = openModal;
    global.closeModal = closeModal;
    global.initModalEventListeners = initModalEventListeners;
    global.MODAL_BACKDROPS = MODAL_BACKDROPS;
    global.MODAL_CONTENTS = MODAL_CONTENTS;
}

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModalEventListeners);
    } else {
        initModalEventListeners();
    }
}

    // CommonJS compatibility for test runners
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            openModal,
            closeModal,
            initModalEventListeners,
            MODAL_BACKDROPS,
            MODAL_CONTENTS,
            backdrops: MODAL_BACKDROPS,
            contents: MODAL_CONTENTS
        };
    }
})();

