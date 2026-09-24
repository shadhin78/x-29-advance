/**
 * Analytics Page Module (pages/Analytics/Analytics.js)
 * Single Source of Truth for Analytics Page lifecycle and router coordination.
 *
 * Core analytical algorithms and visualization renderers are modularized in:
 * - js/features/analytics/spectra.js      (Syllabus Breakdown, Circle Chart, Habit Radar, Trend Charts, Pacing)
 * - js/features/analytics/heatmap.js      (Focus Heatmap Matrix & Day Drill-down)
 * - js/features/analytics/history.js      (Global Timeline History & Edit Modal)
 * - js/features/analytics/chapterMap.js   (Interactive SVG Concentric Chapter Maps & Tooltips)
 */

(function () {
    'use strict';

    // Delegate lifecycle to AnalyticsPage module if available, or initialize local coordinator
    const AnalyticsPage = window.AnalyticsPage || {
        isMounted: false,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            // Initialize filters
            if (typeof window.populateSpectraFilterDropdown === 'function') {
                window.populateSpectraFilterDropdown();
            }

            // 1. Chapters Breakdown circle chart
            if (typeof window.renderSpectraCircleChart === 'function') {
                window.renderSpectraCircleChart();
            }

            // 2. Commitments Habit Radar chart
            if (typeof window.renderSpectraCommitmentsChart === 'function') {
                window.renderSpectraCommitmentsChart();
            }

            // 3. Program Completion & Daily Actions Trend charts and Stat cards
            if (typeof window.renderTrendCharts === 'function') {
                window.renderTrendCharts();
            }

            // 4. Pacing Trend charts (X Bar and Global Scope burn-up)
            if (typeof window.renderPaceCharts === 'function') {
                window.renderPaceCharts();
            }

            // 5. Focus Analytics line/bar/combo chart
            if (typeof window.updateTimerAnalyticsControls === 'function') {
                window.updateTimerAnalyticsControls();
            }
            if (typeof window.renderTimerAnalyticsChart === 'function') {
                window.renderTimerAnalyticsChart(true);
            }

            // 6. Focus Matrix GitHub Box Heatmap
            if (typeof window.setSpectraHeatmapRangeUI === 'function') {
                window.setSpectraHeatmapRangeUI(window.spectraHeatmapRange || 365);
            } else if (typeof window.renderSpectraFocusHeatmap === 'function') {
                window.renderSpectraFocusHeatmap();
            }

            // 7. Resize charts to match container dimensions
            this.resizeCharts();
        },

        resizeCharts: function () {
            const resizeFn = () => {
                const charts = [
                    window.mainChartPrograms,
                    window.monthlyChartActions,
                    window.spectraPaceTrendChartInstance,
                    window.globalPaceTrendChartInstance,
                    window.spectraFocusAnalyticsChartInstance
                ];
                charts.forEach(chart => {
                    if (chart && typeof chart.resize === 'function') {
                        chart.resize();
                        if (typeof chart.update === 'function') {
                            chart.update('none');
                        }
                    }
                });
            };
            setTimeout(resizeFn, 50);
            setTimeout(resizeFn, 420);
        },

        destroy: function () {
            this.isMounted = false;

            // Close filter dropdown if open
            const menu = document.getElementById('spectra-filter-dropdown-menu');
            const btn = document.getElementById('spectra-filter-dropdown-btn');
            if (menu && !menu.classList.contains('hidden')) {
                menu.classList.add('hidden');
                if (btn && btn.querySelector('svg')) {
                    btn.querySelector('svg').style.transform = '';
                }
            }

            // Hide tooltips
            if (typeof window.hideSpectraChapterTooltip === 'function') window.hideSpectraChapterTooltip();
            if (typeof window.hideCommitmentTooltip === 'function') window.hideCommitmentTooltip();

            // Destroy Chart.js instances to prevent canvas reuse error
            const chartKeys = [
                'mainChartPrograms',
                'monthlyChartActions',
                'yearlyChartActions',
                'spectraPaceTrendChartInstance',
                'globalPaceTrendChartInstance'
            ];
            chartKeys.forEach(k => {
                if (window[k] && typeof window[k].destroy === 'function') {
                    try {
                        window[k].destroy();
                    } catch (e) {}
                    window[k] = null;
                }
            });
        }
    };

    window.AnalyticsPage = AnalyticsPage;

    // Auto-init if DOM is already loaded and page container is present & visible
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-spectra-analytics');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.AnalyticsPage.init();
        }
    }
})();
