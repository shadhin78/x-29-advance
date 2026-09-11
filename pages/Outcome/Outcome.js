/**
 * Outcome Page Module (pages/Outcome/Outcome.js)
 * Single Source of Truth for Outcome Page lifecycle and router coordination.
 *
 * Core logic has been modularized into feature modules:
 * - Exam Results & CGPA Computations: js/features/outcome/outcomeResults.js
 * - Progression Analytics & Subject Trends: js/features/outcome/outcomeAnalytics.js
 * - Pass & Freeze Configuration: js/features/outcome/outcomePassConfig.js
 * - Milestone Celebration & Congratulations Modal: js/features/outcome/outcomeCelebration.js
 */
(function () {
    'use strict';

    // Delegate lifecycle to OutcomePage module if available, or initialize local coordinator
    const OutcomePage = window.OutcomePage || {
        isMounted: false,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            if (window.OutcomeResults && typeof window.OutcomeResults.renderOutcomeProgramToggles === 'function') {
                window.OutcomeResults.renderOutcomeProgramToggles();
            } else if (typeof window.renderOutcomeProgramToggles === 'function') {
                window.renderOutcomeProgramToggles();
            }

            if (window.OutcomeResults && typeof window.OutcomeResults.renderResults === 'function') {
                window.OutcomeResults.renderResults();
            } else if (typeof window.renderResults === 'function') {
                window.renderResults();
            }

            if (window.OutcomePassConfig && typeof window.OutcomePassConfig.renderPassConfig === 'function') {
                window.OutcomePassConfig.renderPassConfig();
            } else if (typeof window.renderPassConfig === 'function') {
                window.renderPassConfig();
            }

            if (window.OutcomeCelebration && typeof window.OutcomeCelebration.renderCelebrationConfig === 'function') {
                window.OutcomeCelebration.renderCelebrationConfig();
            } else if (typeof window.renderCelebrationConfig === 'function') {
                window.renderCelebrationConfig();
            }

            setTimeout(() => {
                if (window.resultsTrendChartInstance && typeof window.resultsTrendChartInstance.resize === 'function') {
                    window.resultsTrendChartInstance.resize();
                }
            }, 300);
        },

        destroy: function () {
            this.isMounted = false;

            if (window.resultsTrendChartInstance && typeof window.resultsTrendChartInstance.destroy === 'function') {
                window.resultsTrendChartInstance.destroy();
                window.resultsTrendChartInstance = null;
            }
            if (window.programTrendChartInstance && typeof window.programTrendChartInstance.destroy === 'function') {
                window.programTrendChartInstance.destroy();
                window.programTrendChartInstance = null;
            }
            if (window.subjectWiseChartInstance && typeof window.subjectWiseChartInstance.destroy === 'function') {
                window.subjectWiseChartInstance.destroy();
                window.subjectWiseChartInstance = null;
            }

            if (typeof window.closeModal === 'function') {
                const modals = ['result-modal', 'program-trend-modal', 'celebration-setup-modal', 'congrats-modal'];
                modals.forEach(m => {
                    const el = document.getElementById(m);
                    if (el && !el.classList.contains('hidden')) {
                        window.closeModal(m);
                    }
                });
            }
        },

        openResultModal: function (id = null, editProgramName = null) {
            if (window.OutcomeResults && typeof window.OutcomeResults.openResultModal === 'function') {
                return window.OutcomeResults.openResultModal(id, editProgramName);
            } else if (typeof window.openResultModal === 'function') {
                window.openResultModal(id, editProgramName);
            }
        },

        renderResults: function () {
            if (window.OutcomeResults && typeof window.OutcomeResults.renderResults === 'function') {
                window.OutcomeResults.renderResults();
            } else if (typeof window.renderResults === 'function') {
                window.renderResults();
            }
        },

        toggleOutcomeDateSort: function () {
            if (window.OutcomeResults && typeof window.OutcomeResults.toggleOutcomeDateSort === 'function') {
                return window.OutcomeResults.toggleOutcomeDateSort();
            } else if (typeof window.toggleOutcomeDateSort === 'function') {
                window.toggleOutcomeDateSort();
            }
        },

        deleteResult: function (id) {
            if (window.OutcomeResults && typeof window.OutcomeResults.deleteResult === 'function') {
                return window.OutcomeResults.deleteResult(id);
            } else if (typeof window.deleteResult === 'function') {
                window.deleteResult(id);
            }
        },

        deleteProgramGroup: function (programName) {
            if (window.OutcomeResults && typeof window.OutcomeResults.deleteProgramGroup === 'function') {
                return window.OutcomeResults.deleteProgramGroup(programName);
            } else if (typeof window.deleteProgramGroup === 'function') {
                window.deleteProgramGroup(programName);
            }
        },

        renderPassConfig: function (forceRebuild = false) {
            if (window.OutcomePassConfig && typeof window.OutcomePassConfig.renderPassConfig === 'function') {
                window.OutcomePassConfig.renderPassConfig(forceRebuild);
            }
        },

        renderCelebrationConfig: function () {
            if (window.OutcomeCelebration && typeof window.OutcomeCelebration.renderCelebrationConfig === 'function') {
                window.OutcomeCelebration.renderCelebrationConfig();
            }
        },

        renderOutcomeProgramToggles: function () {
            if (window.OutcomeResults && typeof window.OutcomeResults.renderOutcomeProgramToggles === 'function') {
                window.OutcomeResults.renderOutcomeProgramToggles();
            }
        }
    };

    window.OutcomePage = OutcomePage;

    // Auto-init if container exists and is visible on initial page load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-outcome');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.OutcomePage.init();
        }
    }
})();
