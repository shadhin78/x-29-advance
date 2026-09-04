/**
 * Daily Actions Page Module (pages/Daily Actions/Daily Actions.js)
 * Single Source of Truth for Daily Actions Page logic and lifecycle.
 */

(function () {
    'use strict';

    /**
     * Helper to populate the 'add-act-track' dropdown on the Daily Actions creation form
     */
    function populateDailyActionTrackDropdown() {
        const trackSelect = document.getElementById('add-act-track');
        if (!trackSelect) return;

        const currentValue = trackSelect.value;
        trackSelect.innerHTML = '<option value="">All Tracks (Default)</option>';
        if (Array.isArray(window.tracks)) {
            window.tracks.forEach(track => {
                trackSelect.innerHTML += `<option value="${track.id}">${track.name || track.id}</option>`;
            });
        }
        if (currentValue) {
            trackSelect.value = currentValue;
        }
    }

    /**
     * Daily Actions Page Lifecycle Controller
     */
    window.DailyActionsPage = {
        isMounted: false,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            // 1. Populate track dropdown on create form
            populateDailyActionTrackDropdown();
            if (typeof window.populateTrackDropdowns === 'function') {
                window.populateTrackDropdowns();
            }

            // 2. Render main Daily Actions cards & progress bar
            if (typeof window.renderDailyTracker === 'function') {
                window.renderDailyTracker();
            }

            // 3. Render 180-day action log mini-heatmaps
            if (typeof window.renderDailyLogs === 'function') {
                window.renderDailyLogs();
            }

            // 4. Render Monthly Targets checklist & pace metrics
            if (typeof window.renderMonthlyTargets === 'function') {
                window.renderMonthlyTargets();
            }

            // 5. Render Weekly Targets checklist & pace metrics
            if (typeof window.renderWeeklyTargets === 'function') {
                window.renderWeeklyTargets();
            }

            // 6. Render Daily Targets checklist
            if (typeof window.renderDailyTargets === 'function') {
                window.renderDailyTargets();
            }
        },

        destroy: function () {
            this.isMounted = false;

            // Safely close modals if open when navigating away
            if (typeof window.closeModal === 'function') {
                const modals = [
                    'daily-actions-db-modal',
                    'monthly-targets-db-modal',
                    'weekly-targets-db-modal',
                    'daily-targets-db-modal',
                    'analytics-modal',
                    'edit-daily-action-modal'
                ];
                modals.forEach(m => {
                    const el = document.getElementById(m);
                    if (el && !el.classList.contains('hidden')) {
                        window.closeModal(m);
                    }
                });
            }
        }
    };

    // Auto-init if container exists and is visible on initial page load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-daily-actions');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.DailyActionsPage.init();
        }
    }
})();
