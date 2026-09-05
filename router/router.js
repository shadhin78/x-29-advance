/**
 * Router Module (router/router.js)
 * Lightweight Vanilla JavaScript Router for X-29 Advance.
 *
 * Responsibilities:
 * 1. Internal application state switching (NO URL routing, NO pushState, NO page reload).
 * 2. Dynamic loading of modular pages (HTML, CSS, JS) with caching.
 * 3. Lifecycle management (mount, render, destroy).
 * 4. Slide-up page transitions.
 * 5. Complete preservation of persistent application shell.
 */

(function () {
    'use strict';

    const Router = {
        activePageId: 'dashboard',
        htmlCache: {},
        cssCache: {},
        jsLoaded: {},
        isNavigating: false,

        routes: {
            'dashboard': {
                containerId: 'page-dashboard',
                htmlUrl: 'pages/Dashboard/Dashboard.html',
                cssUrl: 'pages/Dashboard/Dashboard.css',
                jsUrl: 'pages/Dashboard/Dashboard.js',
                cssId: 'route-dashboard-css',
                jsId: 'route-dashboard-js',
                onMount: function () {
                    if (window.DashboardPage && typeof window.DashboardPage.mount === 'function') {
                        window.DashboardPage.mount();
                    } else if (typeof window.renderApp === 'function') {
                        window.renderApp();
                    }
                },
                onDestroy: function () {
                    if (window.DashboardPage && typeof window.DashboardPage.destroy === 'function') {
                        window.DashboardPage.destroy();
                    }
                }
            },
            'spectra-analytics': {
                containerId: 'page-spectra-analytics',
                htmlUrl: 'pages/Analytics/Analytics.html',
                cssUrl: 'pages/Analytics/Analytics.css',
                jsUrl: 'pages/Analytics/Analytics.js',
                cssId: 'route-analytics-css',
                jsId: 'route-analytics-js',
                onMount: function () {
                    if (window.AnalyticsPage && typeof window.AnalyticsPage.mount === 'function') {
                        window.AnalyticsPage.mount();
                    }
                },
                onDestroy: function () {
                    if (window.AnalyticsPage && typeof window.AnalyticsPage.destroy === 'function') {
                        window.AnalyticsPage.destroy();
                    }
                }
            },
            'timer': {
                containerId: 'page-timer',
                htmlUrl: 'pages/Focus/Focus.html',
                cssUrl: 'pages/Focus/Focus.css',
                jsUrl: 'pages/Focus/Focus.js',
                cssId: 'route-focus-css',
                jsId: 'route-focus-js',
                onMount: function () {
                    if (window.FocusPage && typeof window.FocusPage.mount === 'function') {
                        window.FocusPage.mount();
                    } else if (typeof window.renderTimerPage === 'function') {
                        window.renderTimerPage();
                    }
                },
                onDestroy: function () {
                    if (window.FocusPage && typeof window.FocusPage.destroy === 'function') {
                        window.FocusPage.destroy();
                    }
                }
            },
            'focus': {
                containerId: 'page-timer',
                htmlUrl: 'pages/Focus/Focus.html',
                cssUrl: 'pages/Focus/Focus.css',
                jsUrl: 'pages/Focus/Focus.js',
                cssId: 'route-focus-css',
                jsId: 'route-focus-js',
                onMount: function () {
                    if (window.FocusPage && typeof window.FocusPage.mount === 'function') {
                        window.FocusPage.mount();
                    } else if (typeof window.renderTimerPage === 'function') {
                        window.renderTimerPage();
                    }
                },
                onDestroy: function () {
                    if (window.FocusPage && typeof window.FocusPage.destroy === 'function') {
                        window.FocusPage.destroy();
                    }
                }
            },
            'daily-actions': {
                containerId: 'page-daily-actions',
                htmlUrl: 'pages/Daily Actions/Daily Actions.html',
                cssUrl: 'pages/Daily Actions/Daily Actions.css',
                jsUrl: 'pages/Daily Actions/Daily Actions.js',
                cssId: 'route-daily-actions-css',
                jsId: 'route-daily-actions-js',
                onMount: function () {
                    if (window.DailyActionsPage && typeof window.DailyActionsPage.mount === 'function') {
                        window.DailyActionsPage.mount();
                    } else {
                        if (typeof window.renderDailyTracker === 'function') window.renderDailyTracker();
                        if (typeof window.renderDailyLogs === 'function') window.renderDailyLogs();
                        if (typeof window.renderMonthlyTargets === 'function') window.renderMonthlyTargets();
                        if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets();
                        if (typeof window.renderDailyTargets === 'function') window.renderDailyTargets();
                    }
                },
                onDestroy: function () {
                    if (window.DailyActionsPage && typeof window.DailyActionsPage.destroy === 'function') {
                        window.DailyActionsPage.destroy();
                    }
                }
            },
            'schedule': {
                containerId: 'page-schedule',
                htmlUrl: 'pages/Daily Schedule/Daily Schedule.html',
                cssUrl: 'pages/Daily Schedule/Daily Schedule.css',
                jsUrl: 'pages/Daily Schedule/Daily Schedule.js',
                cssId: 'route-schedule-css',
                jsId: 'route-schedule-js',
                onMount: function () {
                    if (window.DailySchedulePage && typeof window.DailySchedulePage.mount === 'function') {
                        window.DailySchedulePage.mount();
                    } else if (typeof window.renderSchedulePage === 'function') {
                        window.renderSchedulePage();
                    }
                },
                onDestroy: function () {
                    if (window.DailySchedulePage && typeof window.DailySchedulePage.destroy === 'function') {
                        window.DailySchedulePage.destroy();
                    }
                }
            },
            'daily-schedule': {
                containerId: 'page-schedule',
                htmlUrl: 'pages/Daily Schedule/Daily Schedule.html',
                cssUrl: 'pages/Daily Schedule/Daily Schedule.css',
                jsUrl: 'pages/Daily Schedule/Daily Schedule.js',
                cssId: 'route-schedule-css',
                jsId: 'route-schedule-js',
                onMount: function () {
                    if (window.DailySchedulePage && typeof window.DailySchedulePage.mount === 'function') {
                        window.DailySchedulePage.mount();
                    } else if (typeof window.renderSchedulePage === 'function') {
                        window.renderSchedulePage();
                    }
                },
                onDestroy: function () {
                    if (window.DailySchedulePage && typeof window.DailySchedulePage.destroy === 'function') {
                        window.DailySchedulePage.destroy();
                    }
                }
            },
            'monthly-target-setup': {
                containerId: 'page-monthly-target-setup',
                htmlUrl: 'pages/Daily Actions/monthly target setup/monthly target setup.html',
                cssUrl: 'pages/Daily Actions/monthly target setup/monthly target setup.css',
                jsUrl: 'pages/Daily Actions/monthly target setup/monthly target setup.js',
                cssId: 'route-monthly-target-css',
                jsId: 'route-monthly-target-js',
                onMount: function () {
                    if (window.MonthlyTargetPage && typeof window.MonthlyTargetPage.mount === 'function') {
                        window.MonthlyTargetPage.mount();
                    }
                },
                onDestroy: function () {
                    if (window.MonthlyTargetPage && typeof window.MonthlyTargetPage.destroy === 'function') {
                        window.MonthlyTargetPage.destroy();
                    }
                }
            },
            'monthly target': {
                containerId: 'page-monthly-target-setup',
                htmlUrl: 'pages/Daily Actions/monthly target setup/monthly target setup.html',
                cssUrl: 'pages/Daily Actions/monthly target setup/monthly target setup.css',
                jsUrl: 'pages/Daily Actions/monthly target setup/monthly target setup.js',
                cssId: 'route-monthly-target-css',
                jsId: 'route-monthly-target-js',
                onMount: function () {
                    if (window.MonthlyTargetPage && typeof window.MonthlyTargetPage.mount === 'function') {
                        window.MonthlyTargetPage.mount();
                    }
                },
                onDestroy: function () {
                    if (window.MonthlyTargetPage && typeof window.MonthlyTargetPage.destroy === 'function') {
                        window.MonthlyTargetPage.destroy();
                    }
                }
            },
            'monthly target setup': {
                containerId: 'page-monthly-target-setup',
                htmlUrl: 'pages/Daily Actions/monthly target setup/monthly target setup.html',
                cssUrl: 'pages/Daily Actions/monthly target setup/monthly target setup.css',
                jsUrl: 'pages/Daily Actions/monthly target setup/monthly target setup.js',
                cssId: 'route-monthly-target-css',
                jsId: 'route-monthly-target-js',
                onMount: function () {
                    if (window.MonthlyTargetPage && typeof window.MonthlyTargetPage.mount === 'function') {
                        window.MonthlyTargetPage.mount();
                    }
                },
                onDestroy: function () {
                    if (window.MonthlyTargetPage && typeof window.MonthlyTargetPage.destroy === 'function') {
                        window.MonthlyTargetPage.destroy();
                    }
                }
            },
            'subjects': {
                containerId: 'page-subjects',
                htmlUrl: 'pages/Subjects/Subjects.html',
                cssUrl: 'pages/Subjects/Subjects.css',
                jsUrl: 'pages/Subjects/Subjects.js',
                cssId: 'route-subjects-css',
                jsId: 'route-subjects-js',
                onMount: function () {
                    if (window.SubjectsPage && typeof window.SubjectsPage.mount === 'function') {
                        window.SubjectsPage.mount();
                    } else {
                        if (typeof window.renderSubjectNavigation === 'function') window.renderSubjectNavigation();
                        if (typeof window.renderSubjectProgress === 'function') window.renderSubjectProgress(window.lastSubjectStats || {});
                        if (typeof window.renderTaskList === 'function') window.renderTaskList();
                        if (typeof window.updateMetrics === 'function') window.updateMetrics();
                    }
                },
                onDestroy: function () {
                    if (window.SubjectsPage && typeof window.SubjectsPage.destroy === 'function') {
                        window.SubjectsPage.destroy();
                    }
                }
            },
            'paces-management': {
                containerId: 'page-paces-management',
                htmlUrl: 'pages/Pace Management/Pace Management.html',
                cssUrl: 'pages/Pace Management/Pace Management.css',
                jsUrl: 'pages/Pace Management/Pace Management.js',
                cssId: 'route-pace-management-css',
                jsId: 'route-pace-management-js',
                onMount: function () {
                    if (window.PaceManagementPage && typeof window.PaceManagementPage.mount === 'function') {
                        window.PaceManagementPage.mount();
                    } else if (typeof window.renderPaceGoals === 'function') {
                        window.renderPaceGoals(window.lastSubjectStats || (typeof updateMetrics === 'function' ? (updateMetrics(), window.lastSubjectStats) : {}));
                    }
                },
                onDestroy: function () {
                    if (window.PaceManagementPage && typeof window.PaceManagementPage.destroy === 'function') {
                        window.PaceManagementPage.destroy();
                    }
                }
            },
            'master-config': {
                containerId: 'page-master-config',
                htmlUrl: 'pages/Master Config/Master Config.html',
                cssUrl: 'pages/Master Config/Master Config.css',
                jsUrl: 'pages/Master Config/Master Config.js',
                cssId: 'route-master-config-css',
                jsId: 'route-master-config-js',
                onMount: function () {
                    if (window.MasterConfigPage && typeof window.MasterConfigPage.mount === 'function') {
                        window.MasterConfigPage.mount();
                    } else {
                        if (typeof window.populateTrackDropdowns === 'function') window.populateTrackDropdowns();
                        if (typeof window.updateManageDropdown === 'function') window.updateManageDropdown();
                        if (typeof window.renderPriorityConfig === 'function') window.renderPriorityConfig();
                        if (typeof window.renderTrackList === 'function') window.renderTrackList();
                    }
                },
                onDestroy: function () {
                    if (window.MasterConfigPage && typeof window.MasterConfigPage.destroy === 'function') {
                        window.MasterConfigPage.destroy();
                    }
                }
            },
            'outcome': {
                containerId: 'page-outcome',
                htmlUrl: 'pages/Outcome/Outcome.html',
                cssUrl: 'pages/Outcome/Outcome.css',
                jsUrl: 'pages/Outcome/Outcome.js',
                cssId: 'route-outcome-css',
                jsId: 'route-outcome-js',
                onMount: function () {
                    if (window.OutcomePage && typeof window.OutcomePage.mount === 'function') {
                        window.OutcomePage.mount();
                    } else {
                        if (typeof window.renderResults === 'function') window.renderResults();
                        if (typeof window.renderPassConfig === 'function') window.renderPassConfig();
                        if (typeof window.renderCelebrationConfig === 'function') window.renderCelebrationConfig();
                    }
                },
                onDestroy: function () {
                    if (window.OutcomePage && typeof window.OutcomePage.destroy === 'function') {
                        window.OutcomePage.destroy();
                    }
                }
            },
            'exam': {
                containerId: 'page-exam',
                htmlUrl: 'pages/Exam Routine/Exam Routine.html',
                cssUrl: 'pages/Exam Routine/Exam Routine.css',
                jsUrl: 'pages/Exam Routine/Exam Routine.js',
                cssId: 'route-exam-routine-css',
                jsId: 'route-exam-routine-js',
                onMount: function () {
                    if (window.ExamRoutinePage && typeof window.ExamRoutinePage.mount === 'function') {
                        window.ExamRoutinePage.mount();
                    } else if (typeof window.renderExamPage === 'function') {
                        window.renderExamPage();
                    }
                },
                onDestroy: function () {
                    if (window.ExamRoutinePage && typeof window.ExamRoutinePage.destroy === 'function') {
                        window.ExamRoutinePage.destroy();
                    }
                }
            },
            'exam-routine': {
                containerId: 'page-exam',
                htmlUrl: 'pages/Exam Routine/Exam Routine.html',
                cssUrl: 'pages/Exam Routine/Exam Routine.css',
                jsUrl: 'pages/Exam Routine/Exam Routine.js',
                cssId: 'route-exam-routine-css',
                jsId: 'route-exam-routine-js',
                onMount: function () {
                    if (window.ExamRoutinePage && typeof window.ExamRoutinePage.mount === 'function') {
                        window.ExamRoutinePage.mount();
                    } else if (typeof window.renderExamPage === 'function') {
                        window.renderExamPage();
                    }
                },
                onDestroy: function () {
                    if (window.ExamRoutinePage && typeof window.ExamRoutinePage.destroy === 'function') {
                        window.ExamRoutinePage.destroy();
                    }
                }
            }
        },

        allPages: [
            'dashboard',
            'spectra-analytics',
            'timer',
            'daily-actions',
            'schedule',
            'subjects',
            'paces-management',
            'master-config',
            'outcome',
            'exam',
            'monthly-target-setup'
        ],

        buttonStyles: {
            'dashboard': { active: 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-lg', hover: 'hover:border-blue-400' },
            'spectra-analytics': { active: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-transparent shadow-lg shadow-fuchsia-500/20', hover: 'hover:border-fuchsia-400' },
            'daily-actions': { active: 'bg-orange-500 text-white border-orange-500 shadow-lg', hover: 'hover:border-orange-400' },
            'subjects': { active: 'bg-violet-600 text-white border-violet-600 shadow-lg', hover: 'hover:border-violet-400' },
            'paces-management': { active: 'bg-red-600 text-white border-red-600 shadow-lg', hover: 'hover:border-red-400' },
            'master-config': { active: 'bg-indigo-600 text-white border-indigo-600 shadow-lg', hover: 'hover:border-indigo-400' },
            'outcome': { active: 'bg-yellow-500 text-white border-yellow-500 shadow-lg', hover: 'hover:border-yellow-400' },
            'timer': { active: 'bg-emerald-600 text-white border-emerald-600 shadow-lg', hover: 'hover:border-emerald-400' },
            'schedule': { active: 'bg-cyan-600 text-white border-cyan-600 shadow-lg', hover: 'hover:border-cyan-400' },
            'exam': { active: 'bg-rose-600 text-white border-rose-600 shadow-lg', hover: 'hover:border-rose-400' }
        },

        /**
         * Dynamically inject page CSS if not already present.
         */
        loadCss: function (url, id) {
            const cleanUrl = encodeURI(decodeURI(url));
            return new Promise((resolve) => {
                if (document.getElementById(id) || this.cssCache[cleanUrl]) {
                    return resolve();
                }
                const link = document.createElement('link');
                link.id = id;
                link.rel = 'stylesheet';
                link.href = cleanUrl;
                link.onload = () => {
                    this.cssCache[cleanUrl] = true;
                    resolve();
                };
                link.onerror = () => {
                    console.warn(`[Router] Could not load CSS at ${url}`);
                    resolve(); // Soft fail to not block page rendering
                };
                document.head.appendChild(link);
            });
        },

        /**
         * Dynamically inject page JS if not already loaded.
         */
        loadJs: function (url, id) {
            const cleanUrl = encodeURI(decodeURI(url));
            return new Promise((resolve) => {
                if (document.getElementById(id) || this.jsLoaded[cleanUrl]) {
                    return resolve();
                }
                const script = document.createElement('script');
                script.id = id;
                script.src = cleanUrl;
                script.async = false;
                script.onload = () => {
                    this.jsLoaded[cleanUrl] = true;
                    resolve();
                };
                script.onerror = () => {
                    console.error(`[Router] Failed to load script at ${url}`);
                    resolve();
                };
                document.body.appendChild(script);
            });
        },

        /**
         * Fetch and cache page HTML.
         */
        loadHtml: async function (url) {
            const cleanUrl = encodeURI(decodeURI(url));
            if (this.htmlCache[cleanUrl]) {
                return this.htmlCache[cleanUrl];
            }
            try {
                const res = await fetch(cleanUrl);
                if (!res.ok) {
                    throw new Error(`HTTP error ${res.status}`);
                }
                const html = await res.text();
                this.htmlCache[cleanUrl] = html;
                return html;
            } catch (err) {
                console.error(`[Router] Error fetching HTML from ${url}:`, err);
                return null;
            }
        },

        /**
         * Update sidebar navigation active states.
         */
        updateNavButtons: function (targetPageId) {
            this.allPages.forEach(p => {
                const btn = document.getElementById(`btn-nav-${p}`);
                if (btn && this.buttonStyles[p]) {
                    const baseClass = "w-full border-2 px-4 py-3 rounded-2xl font-black text-xs transition-all duration-300 hover:translate-x-1.5 hover:shadow-md active:scale-98 flex items-center gap-3";
                    const isActive = (p === targetPageId) || (targetPageId === 'monthly-target-setup' && p === 'daily-actions');
                    if (isActive) {
                        btn.className = `${baseClass} ${this.buttonStyles[p].active}`;
                    } else {
                        btn.className = `${baseClass} bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 ${this.buttonStyles[p].hover}`;
                    }
                }
            });
        },

        /**
         * Main navigation method.
         * Switches the active page internally with NO URL modification.
         */
        loadPage: async function (pageId, sectionId) {
            // Normalize ID
            if (pageId === 'dashboard-page') pageId = 'dashboard';
            if (pageId === 'analytics') pageId = 'spectra-analytics';
            if (pageId === 'focus') pageId = 'timer';
            if (pageId === 'daily actions' || pageId === 'Daily Actions') pageId = 'daily-actions';
            if (pageId === 'daily-schedule' || pageId === 'Daily Schedule' || pageId === 'daily schedule') pageId = 'schedule';
            if (pageId === 'monthly target' || pageId === 'Monthly Target' || pageId === 'monthly-target' || pageId === 'monthly target setup' || pageId === 'Monthly Target Setup' || pageId === 'monthly-target-setup' || pageId === 'add-monthly-target' || pageId === 'Add Monthly Target') pageId = 'monthly-target-setup';
            if (pageId === 'subjects' || pageId === 'Subjects' || pageId === 'subject' || pageId === 'Subject') pageId = 'subjects';
            if (pageId === 'paces-management' || pageId === 'pace-management' || pageId === 'Pace Management' || pageId === 'pace management' || pageId === 'paces' || pageId === 'pace') pageId = 'paces-management';
            if (pageId === 'master-config' || pageId === 'master-configuration' || pageId === 'Master Config' || pageId === 'master config' || pageId === 'Master Configuration' || pageId === 'master configuration') pageId = 'master-config';
            if (pageId === 'outcome' || pageId === 'Outcome' || pageId === 'results' || pageId === 'Results') pageId = 'outcome';
            if (pageId === 'exam' || pageId === 'exam-routine' || pageId === 'Exam Routine' || pageId === 'exam routine') pageId = 'exam';

            const previousPageId = this.activePageId;
            const isSamePage = previousPageId === pageId;

            // Prevent redundant recursive navigation if already navigating to the same target page
            if (this.isNavigating && isSamePage) {
                return;
            }
            this.isNavigating = true;

            try {
                // 1. Cleanup previous page if navigating away
                if (!isSamePage && this.routes[previousPageId] && typeof this.routes[previousPageId].onDestroy === 'function') {
                    try {
                        this.routes[previousPageId].onDestroy();
                    } catch (e) {
                        console.warn(`[Router] Error in onDestroy for ${previousPageId}:`, e);
                    }
                }

                // 2. Load modular page (HTML, CSS, JS)
                if (this.routes[pageId]) {
                    const route = this.routes[pageId];
                    let container = document.getElementById(route.containerId);

                    if (!container) {
                        const mainPanel = document.getElementById('main-content-panel');
                        if (mainPanel) {
                            container = document.createElement('div');
                            container.id = route.containerId;
                            container.className = 'space-y-6 md:space-y-8';
                            mainPanel.prepend(container);
                        }
                    }

                    // Check if container is empty or needs HTML injection
                    const needsHtml = container && (!container.hasChildNodes() || container.children.length === 0 || container.innerHTML.trim() === '');
                    if (needsHtml) {
                        // Concurrently load CSS and HTML
                        const [, htmlContent] = await Promise.all([
                            this.loadCss(route.cssUrl, route.cssId),
                            this.loadHtml(route.htmlUrl)
                        ]);

                        if (htmlContent && container) {
                            container.innerHTML = htmlContent;
                        }

                        // Load JS module
                        await this.loadJs(route.jsUrl, route.jsId);
                    } else {
                        // Ensure CSS is loaded even if container was pre-populated
                        this.loadCss(route.cssUrl, route.cssId);
                        this.loadJs(route.jsUrl, route.jsId);
                    }
                }

                // 3. Toggle page visibility & slide-up animation FIRST so elements are visible
                this.allPages.forEach(p => {
                    const el = document.getElementById(`page-${p}`);
                    if (el) {
                        if (p === pageId) {
                            el.classList.remove('hidden');
                            if (!isSamePage) {
                                el.classList.add('animate-page-enter');
                            }
                        } else {
                            el.classList.add('hidden');
                            el.classList.remove('animate-page-enter');
                        }
                    }
                });

                // 4. Update Navigation Buttons
                this.updateNavButtons(pageId);
                this.activePageId = pageId;

                // 5. Call mount / render on active route
                if (this.routes[pageId] && typeof this.routes[pageId].onMount === 'function') {
                    try {
                        this.routes[pageId].onMount();
                    } catch (e) {
                        console.warn(`[Router] Error mounting ${pageId}:`, e);
                    }
                }

            // 5. Special logic for other monolithic pages
            if (pageId === 'subjects') {
                if (window.SubjectsPage && typeof window.SubjectsPage.mount === 'function') {
                    window.SubjectsPage.mount();
                } else {
                    if (typeof renderSubjectNavigation === 'function') renderSubjectNavigation();
                    if (typeof renderSubjectProgress === 'function') renderSubjectProgress(window.lastSubjectStats || {});
                    if (typeof renderTaskList === 'function') renderTaskList();
                    if (typeof updateMetrics === 'function') updateMetrics();
                    const refreshSubjectProgressChart = () => {
                        const canvas = document.getElementById('progressChart');
                        if (canvas && AppState.progressChart && typeof AppState.progressChart.resize === 'function') {
                            AppState.progressChart.resize();
                            if (typeof AppState.progressChart.update === 'function') {
                                AppState.progressChart.update('none');
                            }
                        } else if (typeof renderChart === 'function') {
                            renderChart();
                        }
                    };
                    setTimeout(refreshSubjectProgressChart, 50);
                    setTimeout(refreshSubjectProgressChart, 420);
                }
            } else if (pageId === 'daily-actions') {
                if (typeof window.renderDailyTracker === 'function') window.renderDailyTracker();
                if (typeof window.renderDailyLogs === 'function') window.renderDailyLogs();
                if (typeof window.renderMonthlyTargets === 'function') window.renderMonthlyTargets();
                if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets();
                if (typeof window.renderDailyTargets === 'function') window.renderDailyTargets();
            } else if (pageId === 'paces-management') {
                if (window.PaceManagementPage && typeof window.PaceManagementPage.mount === 'function') {
                    window.PaceManagementPage.mount();
                } else if (typeof window.renderPaceGoals === 'function') {
                    window.renderPaceGoals(window.lastSubjectStats || (typeof updateMetrics === 'function' ? (updateMetrics(), window.lastSubjectStats) : {}));
                }
            } else if (pageId === 'outcome') {
                if (window.OutcomePage && typeof window.OutcomePage.mount === 'function') {
                    window.OutcomePage.mount();
                } else {
                    if (typeof window.renderResults === 'function') window.renderResults();
                    if (typeof window.renderPassConfig === 'function') window.renderPassConfig();
                    if (typeof window.renderCelebrationConfig === 'function') window.renderCelebrationConfig();
                }
                setTimeout(() => {
                    if (window.resultsTrendChartInstance) window.resultsTrendChartInstance.resize();
                }, 50);
            } else if (pageId === 'schedule') {
                if (typeof window.renderSchedulePage === 'function') window.renderSchedulePage();
                if (typeof window.updateActiveScheduleSlot === 'function') window.updateActiveScheduleSlot();
            }

            // 6. Handle chart resizing for dashboard, spectra-analytics, timer
            if (pageId === 'dashboard' || pageId === 'spectra-analytics' || pageId === 'timer') {
                const resizeAndUpdateAll = () => {
                    const charts = [
                        window.mainChartPrograms,
                        window.monthlyChartActions,
                        window.yearlyChartActions,
                        window.spectraPaceTrendChartInstance,
                        window.globalPaceTrendChartInstance,
                        window.dbProgressChartInstance,
                        window.spectraFocusAnalyticsChartInstance,
                        window.timerAnalyticsChartInstance
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
                setTimeout(resizeAndUpdateAll, 50);
                setTimeout(resizeAndUpdateAll, 420);

                if (window.setSpectraHeatmapRangeUI) setTimeout(() => window.setSpectraHeatmapRangeUI(window.spectraHeatmapRange), 50);
                else if (window.renderSpectraFocusHeatmap) setTimeout(window.renderSpectraFocusHeatmap, 50);

                if (pageId === 'spectra-analytics' || pageId === 'timer') {
                    if (window.updateTimerAnalyticsControls) setTimeout(window.updateTimerAnalyticsControls, 50);
                    if (window.renderTimerAnalyticsChart) setTimeout(window.renderTimerAnalyticsChart, 50);
                    if (window.setSessionHistoryFilterUI) setTimeout(() => window.setSessionHistoryFilterUI(window.sessionHistoryFilter || 'all'), 50);
                    if (pageId === 'timer') {
                        if (window.renderTimerPage) setTimeout(window.renderTimerPage, 50);
                        if (window.updateSubjectTargetUI) setTimeout(window.updateSubjectTargetUI, 50);
                    }
                    if (pageId === 'spectra-analytics') {
                        if (window.renderSpectraCircleChart) setTimeout(window.renderSpectraCircleChart, 50);
                        if (window.renderSpectraCommitmentsChart) setTimeout(window.renderSpectraCommitmentsChart, 50);
                    }
                }
            }

            // 7. Handle smooth scroll
            if (sectionId) {
                setTimeout(() => {
                    const target = document.getElementById(sectionId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 120);
            } else if (!isSamePage) {
                const contentPanel = document.getElementById('main-content-panel');
                if (contentPanel) {
                    contentPanel.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
            } finally {
                this.isNavigating = false;
            }
        },

        /**
         * Initialize the router and seamlessly mount the initial page.
         */
        init: function () {
            // Bind global switchPage to Router.loadPage
            window.switchPage = (pageId, sectionId) => {
                return this.loadPage(pageId, sectionId);
            };

            // Pre-load and mount Dashboard module if page-dashboard is in DOM
            if (document.getElementById('page-dashboard')) {
                this.loadPage('dashboard');
            }
        }
    };

    // Expose Router on window
    window.Router = Router;

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            Router.init();
        });
    } else {
        Router.init();
    }
})();
