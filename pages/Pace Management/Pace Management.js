/**
 * Pace Management Page Module (pages/Pace Management/Pace Management.js)
 * Single source of truth for Pace Management Page lifecycle and router coordination.
 *
 * Core logic has been modularized into feature modules:
 * - Pace Velocity & Estimations: js/features/pace/paceEstimator.js
 * - Pace Goal Configuration & Charts: js/features/pace/paceManager.js
 */
(function () {
    'use strict';

    // Delegate lifecycle to PaceManagementPage module if available, or initialize local coordinator
    const PaceManagementPage = window.PaceManagementPage || {
        isMounted: false,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            if (typeof window.updateMetrics === 'function') {
                window.updateMetrics();
            }
            if (typeof window.togglePaceBundleType === 'function') {
                window.togglePaceBundleType();
            }
            if (typeof window.renderPaceGoals === 'function') {
                const subjectStats = window.lastSubjectStats || (typeof window.updateMetrics === 'function' ? (window.updateMetrics(), window.lastSubjectStats) : {});
                window.renderPaceGoals(subjectStats || {});
            }
        },

        destroy: function () {
            this.isMounted = false;

            if (typeof window.closeModal === 'function') {
                const modals = ['edit-pace-modal', 'pace-trend-modal', 'goal-details-modal', 'pace-candle-modal', 'edit-trends-pace-modal'];
                modals.forEach(m => {
                    const el = document.getElementById(m);
                    if (el && !el.classList.contains('hidden')) {
                        window.closeModal(m);
                    }
                });
            }
        }
    };

    window.PaceManagementPage = PaceManagementPage;

    // Auto-init if container exists and is visible on initial page load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-paces-management');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.PaceManagementPage.init();
        }
    }
})();
