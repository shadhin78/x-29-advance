/**
 * Dashboard Page Module (pages/Dashboard/Dashboard.js)
 * Slim page coordinator delegating directly to js/features/dashboard/dashboard.js
 *
 * Core Dashboard systems, KPI cards, summaries, and orchestrators are modularized in:
 * - js/features/dashboard/dashboard.js (DashboardCore)
 * - js/core/metrics.js (Metrics)
 * - js/features/tasks/taskEngine.js (TaskEngine)
 */

(function () {
    'use strict';

    if (typeof window === 'undefined') {
        global.window = global;
    }
    if (typeof require === 'function' && (!window.DashboardCore || !window.renderDashboardDailyChecklist)) {
        try {
            require('../../js/features/dashboard/dashboard.js');
        } catch (e) {}
    }

    // Ensure DashboardPage is defined and delegate to DashboardCore if available
    const DashboardPage = (window.DashboardCore && window.DashboardCore.DashboardPage) || window.DashboardPage || {
        isMounted: false,
        init: function () {
            this.mount();
        },
        mount: function () {
            this.isMounted = true;
            this.render();
        },
        render: function () {
            const pageEl = document.getElementById('page-dashboard');
            if (!pageEl) return;

            // Render card checklists & outcome
            if (typeof window.renderDashboardDailyChecklist === 'function') window.renderDashboardDailyChecklist();
            if (typeof window.renderDashboardWeeklyChecklist === 'function') window.renderDashboardWeeklyChecklist();
            if (typeof window.renderDashboardMonthlyChecklist === 'function') window.renderDashboardMonthlyChecklist();
            if (typeof window.renderDashboardOutcomeCard === 'function') window.renderDashboardOutcomeCard();
            if (typeof window.renderDashboardUpcomingExamCard === 'function') window.renderDashboardUpcomingExamCard();
            if (typeof window.renderDashboardPassedSubjectsCard === 'function') window.renderDashboardPassedSubjectsCard();
            if (typeof window.updateTrendsBar === 'function') window.updateTrendsBar();

            // Render program and track progress
            const stats = window.lastSubjectStats || (typeof window.updateMetrics === 'function' ? (window.updateMetrics(), window.lastSubjectStats) : {});
            if (typeof window.renderCategoryProgress === 'function') window.renderCategoryProgress(stats);
            if (typeof window.renderTrackProgress === 'function') window.renderTrackProgress(stats);

            // Compact daily actions tracker on dashboard
            if (typeof window.renderDailyTracker === 'function') window.renderDailyTracker();

            // Active slot and heatmap
            if (typeof window.updateActiveScheduleSlot === 'function') window.updateActiveScheduleSlot();
            if (typeof window.renderSpectraFocusHeatmap === 'function') window.renderSpectraFocusHeatmap();

            // Chart resize and repaint
            if (window.dbProgressChartInstance && typeof window.dbProgressChartInstance.resize === 'function') {
                window.dbProgressChartInstance.resize();
                if (typeof window.dbProgressChartInstance.update === 'function') {
                    window.dbProgressChartInstance.update('none');
                }
            }

            this.initEventListeners();
        },
        initEventListeners: function () {
            if (this._listenersInitialized) return;
            this._listenersInitialized = true;
            document.addEventListener('click', (e) => {
                if (e.target.closest('#btn-open-trends-settings, [data-modal-open="edit-trends-pace-modal"]')) {
                    if (typeof window.openTrendsSettingsModal === 'function') {
                        window.openTrendsSettingsModal();
                    }
                }
            });
        },
        destroy: function () {
            this.isMounted = false;
        }
    };

    window.DashboardPage = DashboardPage;

    // Self-initialize if page is active on DOM load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if (document.getElementById('page-dashboard') && !document.getElementById('page-dashboard').classList.contains('hidden')) {
            window.DashboardPage.init();
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DashboardPage;
    }

})();
