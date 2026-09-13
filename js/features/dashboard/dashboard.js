/**
 * X-29 Feature Module: Dashboard Core (dashboard.js)
 *
 * Responsibilities:
 * 1. Dashboard Overview & Top Header:
 *    - Syncs top tags, main titles, sub titles, document title, and validates AppState.currentFilter.
 *    - setupFocusTodayButton: Smooth scroll and highlight today's active study task card.
 *    - updateTrendsStartDate: Updates baseline date for trend pacing.
 *    - openTrendsSettingsModal, selectActivePaceGoal, saveTrendsSettings, togglePaceSwitch, setPaceToggleState.
 * 2. Dashboard KPI Cards & Trend Bar:
 *    - updateTrendsBar: Renders active pace goal stats (start date, days passed, days remaining, req/act pace, est finish).
 * 3. Dashboard Summaries & Checklists:
 *    - renderDashboardDailyChecklist & toggleDashboardDailyTargetCompletion.
 *    - renderDashboardWeeklyChecklist & toggleDashboardWeeklyTargetCompletion.
 *    - renderDashboardMonthlyChecklist & toggleDashboardMonthlyTargetCompletion.
 *    - renderDashboardOutcomeCard: Overall CGPA, letter grade, passed subjects count, credit score, outcome analytics.
 *    - renderDashboardUpcomingExamCard: Nearest scheduled exam routine card with countdown.
 *    - renderDashboardPassedSubjectsCard: Passed subjects summary with badges.
 * 4. Master UI Orchestrator:
 *    - renderUI: Master application rendering coordinator with reentrancy protection.
 *    - DashboardPage lifecycle (init, mount, render, destroy).
 *
 * State:
 * - Reads AppState, window.dashboardConfig, window.paceGoals, window.dailyTargetsDatabase,
 *   window.weeklyTargetsDatabase, window.monthlyTargetsDatabase, window.passedItems.
 */

(function (global) {
    'use strict';

    const window = global;

    let isRenderingUI = false;

    function getAppState() {
        if (typeof window !== 'undefined' && window.AppState) return window.AppState;
        if (typeof AppState !== 'undefined') return AppState;
        if (typeof global !== 'undefined' && global.AppState) return global.AppState;
        return { currentFilter: 'All', tasks: [] };
    }

    function safeGetEl(id) {
        if (typeof document === 'undefined') return null;
        return document.getElementById(id);
    }

    function safeSetText(id, text) {
        if (typeof window.safeSetText === 'function') {
            window.safeSetText(id, text);
        } else {
            const el = safeGetEl(id);
            if (el) el.textContent = text !== undefined && text !== null ? text : '';
        }
    }

    function safeSetHtml(id, html) {
        if (typeof window.safeSetHtml === 'function') {
            window.safeSetHtml(id, html);
        } else {
            const el = safeGetEl(id);
            if (el) el.innerHTML = html !== undefined && html !== null ? html : '';
        }
    }

    function hexToRgbaSafe(hex, alpha) {
        if (typeof window.hexToRgba === 'function') {
            return window.hexToRgba(hex, alpha);
        }
        if (!hex) return `rgba(16, 185, 129, ${alpha})`;
        hex = hex.replace('#', '');
        let r = 0, g = 0, b = 0;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // =========================================================================
    // 1. DASHBOARD OVERVIEW & HEADER CONTROLS
    // =========================================================================

    function setupFocusTodayButton() {
        const btn = safeGetEl('focus-today-btn');
        if (!btn) return;
        btn.onclick = () => {
            const appState = getAppState();
            if (appState.currentFilter !== 'All') {
                appState.currentFilter = 'All';
                if (typeof window.renderSubjectNavigation === 'function') window.renderSubjectNavigation();
                if (typeof window.renderTaskList === 'function') window.renderTaskList();
                if (typeof window.updateMetrics === 'function') window.updateMetrics();
            }
            const todayString = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function')
                ? Utils.formatDate(new Date())
                : new Date().toISOString().split('T')[0];
            const todayTask = Array.isArray(appState.tasks) ? appState.tasks.find(t => t.date === todayString) : null;
            if (todayTask && todayTask.type === 'study' && typeof document !== 'undefined') {
                setTimeout(() => {
                    const firstTaskCard = document.querySelector(`[id^="single-task-"][id$="-${todayTask.studyDay}"]`);
                    if (firstTaskCard) {
                        if (typeof firstTaskCard.scrollIntoView === 'function') {
                            firstTaskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        firstTaskCard.classList.add('ring-4', 'ring-blue-500', 'ring-offset-4', 'dark:ring-offset-gray-900', 'scale-[1.02]');
                        setTimeout(() => firstTaskCard.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-4', 'dark:ring-offset-gray-900', 'scale-[1.02]'), 2500);
                    }
                }, 100);
            }
        };
    }

    function updateTrendsStartDate(newDateStr) {
        if (!newDateStr) return;
        const parsed = new Date(newDateStr);
        if (isNaN(parsed.getTime())) {
            if (typeof window.showToast === 'function') window.showToast("Invalid Date selected.", "error");
            return;
        }

        parsed.setHours(0, 0, 0, 0);
        const appState = getAppState();
        appState.PLAN_START_DATE = new Date(parsed.getTime());
        if (window.dashboardConfig) {
            window.dashboardConfig.trendStartDate = newDateStr;
        }
        if (typeof window.rebuildTaskDates === 'function') window.rebuildTaskDates(true);
        renderUI();
        if (typeof window.showToast === 'function') window.showToast("Start date updated!", "success");
    }

    function setPaceToggleState(btn, handle, isChecked) {
        if (window.PaceManager && typeof window.PaceManager.setPaceToggleState === 'function') {
            return window.PaceManager.setPaceToggleState(btn, handle, isChecked);
        }
    }

    function togglePaceSwitch(type, rawId) {
        if (window.PaceManager && typeof window.PaceManager.togglePaceSwitch === 'function') {
            return window.PaceManager.togglePaceSwitch(type, rawId);
        }
    }

    function openTrendsSettingsModal() {
        if (window.PaceManager && typeof window.PaceManager.openTrendsSettingsModal === 'function') {
            return window.PaceManager.openTrendsSettingsModal();
        }
    }

    function selectActivePaceGoal(goalId) {
        if (window.PaceManager && typeof window.PaceManager.selectActivePaceGoal === 'function') {
            return window.PaceManager.selectActivePaceGoal(goalId);
        }
    }

    function saveTrendsSettings() {
        if (window.PaceManager && typeof window.PaceManager.saveTrendsSettings === 'function') {
            return window.PaceManager.saveTrendsSettings();
        }
    }

    // =========================================================================
    // 2. DASHBOARD KPI CARDS & TREND BAR
    // =========================================================================

    function updateTrendsBar() {
        const barStartVal = safeGetEl('trends-bar-start-date');
        const barPassedVal = safeGetEl('trends-bar-days-passed');
        const barRemainVal = safeGetEl('trends-bar-days-remaining');
        const barRemainContainer = safeGetEl('trends-bar-days-remain-container');
        const barEstFinishVal = safeGetEl('trends-bar-est-finish');

        if (barStartVal) {
            let activeGoalId = window.dashboardConfig ? window.dashboardConfig.activePaceGoalId : null;
            if (!activeGoalId && window.paceGoals && window.paceGoals.length > 0) {
                activeGoalId = window.paceGoals[0].id;
                if (window.dashboardConfig) window.dashboardConfig.activePaceGoalId = activeGoalId;
            }
            const activeGoal = (activeGoalId && Array.isArray(window.paceGoals)) ? window.paceGoals.find(g => g.id === activeGoalId) : null;

            if (activeGoal && typeof window.calculatePaceGoalStats === 'function') {
                const stats = window.calculatePaceGoalStats(activeGoal, window.lastSubjectStats);
                if (!stats) return;

                // 1. Start Date
                barStartVal.textContent = stats.startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                // 2. Days Passed
                barPassedVal.textContent = (typeof Utils !== 'undefined' && typeof Utils.formatDaysPassed === 'function')
                    ? Utils.formatDaysPassed(Math.max(0, stats.daysElapsed))
                    : `${Math.max(0, stats.daysElapsed)} Days`;

                // 3. Days Remain
                barRemainVal.textContent = `${stats.daysRemaining} Days`;
                if (barRemainContainer) barRemainContainer.classList.remove('hidden');

                // 4. Req & Actual Pace
                const barReqPaceVal = safeGetEl('trends-bar-req-pace');
                if (barReqPaceVal) {
                    barReqPaceVal.textContent = `${stats.reqPace} Ch/Day`;
                }
                const barActualPaceVal = safeGetEl('trends-bar-actual-pace');
                if (barActualPaceVal) {
                    barActualPaceVal.textContent = `${stats.curPace} Ch/Day`;
                }

                // 5. Est Finish
                if (barEstFinishVal) {
                    if (stats.total === 0) {
                        barEstFinishVal.textContent = 'No Target';
                    } else if (stats.remaining <= 0) {
                        barEstFinishVal.textContent = 'Finished';
                    } else {
                        if (stats.curPaceVal <= 0) {
                            const today = new Date(); today.setHours(0, 0, 0, 0);
                            if (today < stats.startDate) barEstFinishVal.textContent = 'Future';
                            else if (today > stats.targetDate) barEstFinishVal.textContent = 'Overdue';
                            else barEstFinishVal.textContent = 'No Data';
                        } else {
                            const finishDateStr = stats.projectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                            barEstFinishVal.textContent = `${finishDateStr} (${Math.ceil(stats.remaining / stats.curPaceVal)} Days @ ${stats.curPace} Ch/Day)`;
                        }
                    }
                }
            } else {
                barStartVal.textContent = '--';
                barPassedVal.textContent = '--';
                barRemainVal.textContent = '--';
                if (barRemainContainer) barRemainContainer.classList.add('hidden');
                const barReqPaceVal = safeGetEl('trends-bar-req-pace');
                if (barReqPaceVal) barReqPaceVal.textContent = '--';
                const barActualPaceVal = safeGetEl('trends-bar-actual-pace');
                if (barActualPaceVal) barActualPaceVal.textContent = '--';
                if (barEstFinishVal) barEstFinishVal.textContent = '--';
            }
        }
    }

    // =========================================================================
    // 3. DASHBOARD SUMMARIES & CHECKLISTS
    // =========================================================================

    function renderDashboardDailyChecklist() {
        const listContainer = safeGetEl('db-daily-targets-checklist');
        const pctEl = safeGetEl('db-daily-checklist-pct');
        const rangeEl = safeGetEl('db-daily-checklist-date');
        const progressEl = safeGetEl('db-daily-checklist-progress');
        if (!listContainer) return;

        const todayStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function')
            ? Utils.formatDate(new Date())
            : new Date().toISOString().split('T')[0];

        if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};

        const dashboardItems = [];

        // 1. Current day targets
        const currentTargets = window.dailyTargetsDatabase[todayStr] || [];
        currentTargets.forEach((target, idx) => {
            if (target.isDeleted) return;
            const isTodo = target.isTodo === true;
            if (!isTodo && typeof window.findTaskChapter === 'function') {
                const foundTask = window.findTaskChapter(target.track, target.subject, target.chapter);
                if (foundTask && foundTask.subTask.skipped) return;
            }
            const isCompleted = isTodo
                ? (target.completed || false)
                : (target.completed || (typeof window.findTaskChapter === 'function' && (window.findTaskChapter(target.track, target.subject, target.chapter)?.subTask.completed ?? false)));
            dashboardItems.push({
                target,
                dateKey: todayStr,
                idx,
                isCompleted,
                isToday: true
            });
        });

        // 2. Previous days targets (uncompleted only)
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
        const pastDateKeys = Object.keys(window.dailyTargetsDatabase).filter(dk => {
            if (dk === todayStr) return false;
            const d = window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(dk) : new Date(dk);
            d.setHours(0, 0, 0, 0);
            return d.getTime() < todayStart.getTime();
        }).sort((a, b) => {
            const timeA = (window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(a) : new Date(a)).getTime();
            const timeB = (window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(b) : new Date(b)).getTime();
            return timeB - timeA;
        });

        pastDateKeys.forEach(pastDk => {
            const list = window.dailyTargetsDatabase[pastDk] || [];
            list.forEach((target, idx) => {
                if (target.isDeleted) return;
                const isTodo = target.isTodo === true;
                if (!isTodo && typeof window.findTaskChapter === 'function') {
                    const foundTask = window.findTaskChapter(target.track, target.subject, target.chapter);
                    if (foundTask && foundTask.subTask.skipped) return;
                }
                const isCompleted = isTodo
                    ? (target.completed || false)
                    : (target.completed || (typeof window.findTaskChapter === 'function' && (window.findTaskChapter(target.track, target.subject, target.chapter)?.subTask.completed ?? false)));
                if (!isCompleted) {
                    dashboardItems.push({
                        target,
                        dateKey: pastDk,
                        idx,
                        isCompleted: false,
                        isToday: false
                    });
                }
            });
        });

        const totalTargets = dashboardItems.length;
        const completedTargets = dashboardItems.filter(item => item.isCompleted).length;
        const pastPendingCount = dashboardItems.filter(item => !item.isToday).length;

        if (rangeEl) {
            if (pastPendingCount > 0) {
                rangeEl.textContent = `Today: ${todayStr} (+${pastPendingCount} Pending)`;
            } else {
                rangeEl.textContent = `Today: ${todayStr}`;
            }
        }

        listContainer.innerHTML = '';
        listContainer.className = "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 text-[10px] flex-1 min-h-0";

        if (dashboardItems.length <= 4) {
            const rows = Math.ceil(dashboardItems.length / 2) || 1;
            listContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
            listContainer.style.gridAutoRows = 'unset';
            listContainer.style.height = '100%';
        } else {
            listContainer.style.gridTemplateRows = 'unset';
            listContainer.style.gridAutoRows = 'minmax(38px, auto)';
            listContainer.style.height = 'auto';
        }

        dashboardItems.forEach(item => {
            const target = item.target;
            const isCompleted = item.isCompleted;
            const isTodo = target.isTodo === true;

            let displayTitle = '';
            let displaySubtitle = '';
            let subjectColor = '#3b82f6';

            if (isTodo) {
                displayTitle = target.title;
                const trackName = (target.track && Array.isArray(window.tracks)) ? (window.tracks.find(t => t.id === target.track)?.name || '') : '';
                displaySubtitle = trackName ? `Task | ${trackName}` : 'Task';
                subjectColor = '#8b5cf6';
            } else {
                let displaySub = target.subject.replace(target.program + ' - ', '').replace(target.program + ' ', '');
                displayTitle = `${target.chapter}: ${displaySub}`;
                displaySubtitle = target.program;
                subjectColor = typeof window.getSubjectColor === 'function' ? window.getSubjectColor(target.subject) : '#3b82f6';
            }

            const activeStyle = `background-color: ${subjectColor}cc; border-color: ${subjectColor}; color: white; box-shadow: 0 4px 12px ${subjectColor}33;`;
            const buttonClass = isCompleted
                ? `text-white border-transparent`
                : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-900/60';

            const dateTagHtml = !item.isToday ? `
                <span class="inline-block px-1 rounded-[3px] text-[6px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
                    ${item.dateKey}
                </span>
            ` : '';

            const itemHtml = `
                <button onclick="window.toggleDashboardDailyTargetCompletion('${item.dateKey}', ${item.idx}, ${!isCompleted})"
                        class="flex items-center justify-between p-2 md:p-2.5 rounded-xl border font-black transition-all duration-300 active:scale-95 text-left w-full gap-1.5 h-full ${buttonClass}"
                        style="${isCompleted ? activeStyle : ''}">
                    <div class="flex items-center space-x-1.5 min-w-0 flex-1">
                        <div class="p-1 rounded-lg ${isCompleted ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'} shrink-0">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                        <div class="min-w-0 leading-tight">
                            <span class="block text-[10px] md:text-xs font-black truncate ${isCompleted ? 'line-through opacity-75' : ''}">${displayTitle}</span>
                            <span class="block text-[8px] md:text-[9px] uppercase font-bold tracking-widest ${isCompleted ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'} truncate">${displaySubtitle}</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end shrink-0 gap-0.5">
                        <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'border-white bg-white/20' : 'border-slate-300 dark:border-slate-600 bg-transparent'}">
                            <svg class="w-2.5 h-2.5 text-white ${isCompleted ? 'block' : 'hidden'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        ${dateTagHtml}
                    </div>
                </button>
            `;
            if (typeof listContainer.insertAdjacentHTML === 'function') {
                listContainer.insertAdjacentHTML('beforeend', itemHtml);
            } else {
                listContainer.innerHTML += itemHtml;
            }
        });

        if (dashboardItems.length === 0) {
            listContainer.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 font-bold uppercase text-[9px] tracking-widest flex flex-col items-center justify-center"><span>No Daily Targets Set</span></div>`;
        }

        const pct = totalTargets > 0 ? Math.round((completedTargets / totalTargets) * 100) : 0;
        if (pctEl) pctEl.textContent = `${pct}%`;
        if (progressEl) {
            progressEl.textContent = `${completedTargets}/${totalTargets} Done`;
        }
    }

    function toggleDashboardDailyTargetCompletion(dateKey, idx, isCompleted) {
        if (window.DailyTargets && typeof window.DailyTargets.toggleDailyTargetCompletion === 'function') {
            window.DailyTargets.toggleDailyTargetCompletion(idx, isCompleted, dateKey);
        } else if (typeof window.toggleDailyTargetCompletion === 'function') {
            window.toggleDailyTargetCompletion(idx, isCompleted, dateKey);
        }
        renderDashboardDailyChecklist();
    }

    function renderDashboardWeeklyChecklist() {
        if (typeof window.consolidateWeeklyTargetsDatabase === 'function') {
            window.consolidateWeeklyTargetsDatabase();
        }
        const listContainer = safeGetEl('db-weekly-targets-checklist');
        const pctEl = safeGetEl('db-weekly-checklist-pct');
        const rangeEl = safeGetEl('db-weekly-checklist-range');
        const progressEl = safeGetEl('db-weekly-checklist-progress');
        if (!listContainer) return;

        const currentRange = typeof window.getWeeklyTargetRange === 'function'
            ? window.getWeeklyTargetRange()
            : { start: new Date(), end: new Date() };
        const currentWeekKey = typeof window.formatDateRangeKey === 'function'
            ? window.formatDateRangeKey(currentRange.start, currentRange.end)
            : 'Current Week';
        const currentStartTime = currentRange.start.getTime();

        if (!window.weeklyTargetsDatabase) window.weeklyTargetsDatabase = {};

        const dashboardItems = [];

        // 1. Current week targets
        const currentTargets = window.weeklyTargetsDatabase[currentWeekKey] || [];
        currentTargets.forEach((target, idx) => {
            const foundTask = typeof window.findTaskChapter === 'function' ? window.findTaskChapter(target.track, target.subject, target.chapter) : null;
            if (foundTask && foundTask.subTask.skipped) return;
            const progress = typeof window.getWeeklyTargetProgress === 'function'
                ? window.getWeeklyTargetProgress(target, currentWeekKey)
                : { completed: 0, total: 0, percent: 0, isSizeBased: false };
            const isCompleted = target.completed || (foundTask ? foundTask.subTask.completed : false) || (target.totalChapterSize && progress.percent >= 100);
            dashboardItems.push({
                target,
                weekKey: currentWeekKey,
                idx,
                isCompleted,
                progress,
                isCurrentWeek: true
            });
        });

        // 2. Previous weeks targets (uncompleted only)
        const pastWeekKeys = Object.keys(window.weeklyTargetsDatabase).filter(wk => {
            if (wk === currentWeekKey) return false;
            const st = (typeof Utils !== 'undefined' && typeof Utils.parseStart === 'function') ? Utils.parseStart(wk).getTime() : 0;
            return st < currentStartTime;
        }).sort((a, b) => {
            const timeA = (typeof Utils !== 'undefined' && typeof Utils.parseStart === 'function') ? Utils.parseStart(a).getTime() : 0;
            const timeB = (typeof Utils !== 'undefined' && typeof Utils.parseStart === 'function') ? Utils.parseStart(b).getTime() : 0;
            return timeB - timeA;
        });

        pastWeekKeys.forEach(wkKey => {
            const list = window.weeklyTargetsDatabase[wkKey] || [];
            list.forEach((target, idx) => {
                const foundTask = typeof window.findTaskChapter === 'function' ? window.findTaskChapter(target.track, target.subject, target.chapter) : null;
                if (foundTask && foundTask.subTask.skipped) return;
                const progress = typeof window.getWeeklyTargetProgress === 'function'
                    ? window.getWeeklyTargetProgress(target, wkKey)
                    : { completed: 0, total: 0, percent: 0, isSizeBased: false };
                const isCompleted = target.completed || (foundTask ? foundTask.subTask.completed : false) || (target.totalChapterSize && progress.percent >= 100);
                if (!isCompleted) {
                    dashboardItems.push({
                        target,
                        weekKey: wkKey,
                        idx,
                        isCompleted: false,
                        progress,
                        isCurrentWeek: false
                    });
                }
            });
        });

        const totalTargets = dashboardItems.length;
        const completedTargets = dashboardItems.filter(item => item.isCompleted).length;
        const pastPendingCount = dashboardItems.filter(item => !item.isCurrentWeek).length;

        if (rangeEl) {
            if (pastPendingCount > 0) {
                rangeEl.textContent = `Week: ${currentWeekKey} (+${pastPendingCount} Pending)`;
            } else {
                rangeEl.textContent = `Week: ${currentWeekKey}`;
            }
        }

        listContainer.innerHTML = '';
        listContainer.className = "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 text-[10px] flex-1 min-h-0";

        if (dashboardItems.length <= 4) {
            const rows = Math.ceil(dashboardItems.length / 2) || 1;
            listContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
            listContainer.style.gridAutoRows = 'unset';
            listContainer.style.height = '100%';
        } else {
            listContainer.style.gridTemplateRows = 'unset';
            listContainer.style.gridAutoRows = 'minmax(38px, auto)';
            listContainer.style.height = 'auto';
        }

        dashboardItems.forEach(item => {
            const target = item.target;
            let displaySub = target.subject.replace(target.program + ' - ', '').replace(target.program + ' ', '');
            const subjectColor = typeof window.getSubjectColor === 'function' ? window.getSubjectColor(target.subject) : '#10b981';

            const activeStyle = `background-color: ${subjectColor}cc; border-color: ${subjectColor}; color: white; box-shadow: 0 4px 12px ${subjectColor}33;`;

            let bgStyle = '';
            if (!item.isCompleted && target.totalChapterSize && item.progress.percent > 0) {
                const isDarkMode = typeof document !== 'undefined' && document.documentElement && document.documentElement.classList && document.documentElement.classList.contains('dark');
                const fillAlpha = isDarkMode ? 0.25 : 0.15;
                const fillRgba = hexToRgbaSafe(subjectColor, fillAlpha);
                bgStyle = `background: linear-gradient(to right, ${fillRgba} ${item.progress.percent}%, transparent ${item.progress.percent}%);`;
            }

            const buttonClass = item.isCompleted
                ? `text-white border-transparent`
                : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-900/60';

            const progressTextHtml = target.totalChapterSize ? `<span class="text-[9px] text-blue-500 font-bold ml-1">(${item.progress.completed}/${item.progress.total} p)</span>` : '';
            const targetScope = target.scope || 'Whole Chapter';

            const weekTagHtml = !item.isCurrentWeek ? `
                <span class="inline-block px-1 rounded-[3px] text-[6px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
                    ${item.weekKey.split(' - ')[0]}
                </span>
            ` : '';

            const itemHtml = `
                <button onclick="window.toggleDashboardWeeklyTargetCompletion('${item.weekKey}', ${item.idx}, ${!item.isCompleted})"
                        class="flex items-center justify-between p-2 md:p-2.5 rounded-xl border font-black transition-all duration-300 active:scale-95 text-left w-full gap-1.5 h-full ${buttonClass}"
                        style="${item.isCompleted ? activeStyle : bgStyle}">
                    <div class="flex items-center space-x-1.5 min-w-0 flex-1">
                        <div class="p-1 rounded-lg ${item.isCompleted ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'} shrink-0">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                        <div class="min-w-0 leading-tight">
                            <span class="block text-[10px] md:text-xs font-black truncate ${item.isCompleted ? 'line-through opacity-75' : ''}">${target.chapter}: ${displaySub} ${progressTextHtml}</span>
                            <span class="block text-[8px] md:text-[9px] uppercase font-bold tracking-widest ${item.isCompleted ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'} truncate">${targetScope} | ${target.program}</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end shrink-0 gap-0.5">
                        <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${item.isCompleted ? 'border-white bg-white/20' : 'border-slate-300 dark:border-slate-600 bg-transparent'}">
                            <svg class="w-2.5 h-2.5 text-white ${item.isCompleted ? 'block' : 'hidden'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        ${weekTagHtml}
                    </div>
                </button>
            `;
            if (typeof listContainer.insertAdjacentHTML === 'function') {
                listContainer.insertAdjacentHTML('beforeend', itemHtml);
            } else {
                listContainer.innerHTML += itemHtml;
            }
        });

        if (dashboardItems.length === 0) {
            listContainer.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 font-bold uppercase text-[9px] tracking-widest flex flex-col items-center justify-center"><span>No Weekly Targets Set</span></div>`;
        }

        const pct = totalTargets > 0 ? Math.round((completedTargets / totalTargets) * 100) : 0;
        if (pctEl) pctEl.textContent = `${pct}%`;
        if (progressEl) {
            progressEl.textContent = `${completedTargets}/${totalTargets} Done`;
        }
    }

    function toggleDashboardWeeklyTargetCompletion(weekKey, idx, isCompleted) {
        if (window.WeeklyTargets && typeof window.WeeklyTargets.toggleWeeklyTargetCompletion === 'function') {
            window.WeeklyTargets.toggleWeeklyTargetCompletion(idx, isCompleted, weekKey);
        } else if (typeof window.toggleWeeklyTargetCompletion === 'function') {
            window.toggleWeeklyTargetCompletion(idx, isCompleted, weekKey);
        }
        renderDashboardWeeklyChecklist();
    }

    function renderDashboardMonthlyChecklist() {
        const listContainer = safeGetEl('db-monthly-targets-checklist');
        const pctEl = safeGetEl('db-monthly-checklist-pct');
        const rangeEl = safeGetEl('db-monthly-checklist-range');
        const progressEl = safeGetEl('db-monthly-checklist-progress');
        if (!listContainer) return;

        const currentMonthDate = window.currentMonthlyTargetsDate ? new Date(window.currentMonthlyTargetsDate) : new Date();
        const currentMonthKey = (typeof Utils !== 'undefined' && typeof Utils.formatYearMonthKey === 'function')
            ? Utils.formatYearMonthKey(currentMonthDate)
            : `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;

        if (!window.monthlyTargetsDatabase) window.monthlyTargetsDatabase = {};

        const targets = window.monthlyTargetsDatabase[currentMonthKey] || [];
        const totalTargets = targets.length;

        let completedTargets = 0;
        targets.forEach(t => {
            const prog = typeof window.getMonthlyTargetProgress === 'function' ? window.getMonthlyTargetProgress(t, currentMonthKey) : { completed: 0, total: 0, percent: 0 };
            if (t.completed || (t.totalChapterSize && prog.percent >= 100)) {
                completedTargets++;
            }
        });

        const monthName = currentMonthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (rangeEl) rangeEl.textContent = `Month: ${monthName}`;

        listContainer.innerHTML = '';
        listContainer.className = "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 text-[10px] flex-1 min-h-0";

        if (targets.length <= 4) {
            const rows = Math.ceil(targets.length / 2) || 1;
            listContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
            listContainer.style.gridAutoRows = 'unset';
            listContainer.style.height = '100%';
        } else {
            listContainer.style.gridTemplateRows = 'unset';
            listContainer.style.gridAutoRows = 'minmax(38px, auto)';
            listContainer.style.height = 'auto';
        }

        targets.forEach((target, idx) => {
            const progress = typeof window.getMonthlyTargetProgress === 'function'
                ? window.getMonthlyTargetProgress(target, currentMonthKey)
                : { completed: 0, total: 0, percent: 0 };
            const isCompleted = target.completed || (target.totalChapterSize && progress.percent >= 100);

            let displaySub = target.subject.replace(target.program + ' - ', '').replace(target.program + ' ', '');
            const subjectColor = typeof window.getSubjectColor === 'function' ? window.getSubjectColor(target.subject) : '#3b82f6';

            const activeStyle = `background-color: ${subjectColor}cc; border-color: ${subjectColor}; color: white; box-shadow: 0 4px 12px ${subjectColor}33;`;

            let bgStyle = '';
            if (!isCompleted && target.totalChapterSize && progress.percent > 0) {
                const isDarkMode = typeof document !== 'undefined' && document.documentElement && document.documentElement.classList && document.documentElement.classList.contains('dark');
                const fillAlpha = isDarkMode ? 0.25 : 0.15;
                const fillRgba = hexToRgbaSafe(subjectColor, fillAlpha);
                bgStyle = `background: linear-gradient(to right, ${fillRgba} ${progress.percent}%, transparent ${progress.percent}%);`;
            }

            const buttonClass = isCompleted
                ? `text-white border-transparent`
                : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-900/60';

            const progressTextHtml = target.totalChapterSize ? `<span class="text-[9px] text-blue-500 font-bold ml-1">(${progress.completed}/${progress.total} p)</span>` : '';
            const targetScope = target.scope || (target.targetType === 'subject' ? 'Whole Subject' : 'Whole Chapter');

            const itemHtml = `
                <button onclick="window.toggleDashboardMonthlyTargetCompletion(${idx}, ${!isCompleted})"
                        class="flex items-center justify-between p-2 md:p-2.5 rounded-xl border font-black transition-all duration-300 active:scale-95 text-left w-full gap-1.5 h-full ${buttonClass}"
                        style="${isCompleted ? activeStyle : bgStyle}">
                    <div class="flex items-center space-x-1.5 min-w-0 flex-1">
                        <div class="p-1 rounded-lg ${isCompleted ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'} shrink-0">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div class="min-w-0 leading-tight">
                            <span class="block text-[10px] md:text-xs font-black truncate ${isCompleted ? 'line-through opacity-75' : ''}">${target.chapter}: ${displaySub} ${progressTextHtml}</span>
                            <span class="block text-[8px] md:text-[9px] uppercase font-bold tracking-widest ${isCompleted ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'} truncate">${targetScope} | ${target.program}</span>
                        </div>
                    </div>
                    <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isCompleted ? 'border-white bg-white/20' : 'border-slate-300 dark:border-slate-600 bg-transparent'}">
                        <svg class="w-2.5 h-2.5 text-white ${isCompleted ? 'block' : 'hidden'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                </button>
            `;
            if (typeof listContainer.insertAdjacentHTML === 'function') {
                listContainer.insertAdjacentHTML('beforeend', itemHtml);
            } else {
                listContainer.innerHTML += itemHtml;
            }
        });

        if (targets.length === 0) {
            listContainer.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 font-bold uppercase text-[9px] tracking-widest flex flex-col items-center justify-center"><span>No Monthly Targets Set</span></div>`;
        }

        const pct = totalTargets > 0 ? Math.round((completedTargets / totalTargets) * 100) : 0;
        if (pctEl) pctEl.textContent = `${pct}%`;
        if (progressEl) {
            progressEl.textContent = `${completedTargets}/${totalTargets} Done`;
        }
    }

    function toggleDashboardMonthlyTargetCompletion(idx, isCompleted) {
        if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleMonthlyTargetCompletion === 'function') {
            window.MonthlyTargets.toggleMonthlyTargetCompletion(idx, isCompleted);
        } else if (typeof window.toggleMonthlyTargetCompletion === 'function') {
            window.toggleMonthlyTargetCompletion(idx, isCompleted);
        }
        renderDashboardMonthlyChecklist();
    }

    function renderDashboardOutcomeCard() {
        const cgpaEl = safeGetEl('db-outcome-cgpa');
        const gradeEl = safeGetEl('db-outcome-grade');
        const passedEl = safeGetEl('db-outcome-passed');
        const creditEl = safeGetEl('db-outcome-credit');
        if (!cgpaEl && !gradeEl && !passedEl) return;

        let totalCredit = 0;
        let totalScore = 0;
        let passedCount = 0;

        const results = (typeof window.getProcessedResults === 'function')
            ? window.getProcessedResults()
            : (window.OutcomeResults && typeof window.OutcomeResults.getProcessedResults === 'function'
                ? window.OutcomeResults.getProcessedResults()
                : []);

        if (Array.isArray(results)) {
            results.forEach(r => {
                if (r.cgpa !== undefined && r.cgpa !== null && !isNaN(parseFloat(r.cgpa))) {
                    const c = parseFloat(r.credit) || 3;
                    totalCredit += c;
                    totalScore += parseFloat(r.cgpa) * c;
                    if (parseFloat(r.cgpa) >= 2.0) passedCount++;
                }
            });
        }

        const overallCgpa = totalCredit > 0 ? (totalScore / totalCredit).toFixed(2) : '--';
        const grade = (overallCgpa !== '--' && typeof Utils !== 'undefined' && typeof Utils.mapCgpaToGrade === 'function')
            ? Utils.mapCgpaToGrade(overallCgpa)
            : '--';

        if (cgpaEl) cgpaEl.textContent = overallCgpa;
        if (gradeEl) gradeEl.textContent = grade;
        if (passedEl) passedEl.textContent = `${passedCount} Passed`;
        if (creditEl) creditEl.textContent = `${totalCredit} Credits`;
    }

    function renderDashboardUpcomingExamCard() {
        const titleEl = safeGetEl('db-upcoming-exam-title');
        const subEl = safeGetEl('db-upcoming-exam-subtitle');
        const dateEl = safeGetEl('db-upcoming-exam-date');
        const timeEl = safeGetEl('db-upcoming-exam-time');
        const countdownEl = safeGetEl('db-upcoming-exam-countdown');
        if (!titleEl) return;

        let nearestExam = null;
        let minDiff = Infinity;
        const now = new Date().getTime();

        if (Array.isArray(window.examRoutineData)) {
            window.examRoutineData.forEach(exam => {
                if (!exam.date) return;
                const examDateTime = new Date(`${exam.date}T${exam.startTime || '09:00:00'}`).getTime();
                const diff = examDateTime - now;
                if (diff > 0 && diff < minDiff) {
                    minDiff = diff;
                    nearestExam = exam;
                }
            });
        }

        if (nearestExam) {
            titleEl.textContent = nearestExam.subject || nearestExam.title || 'Exam';
            if (subEl) subEl.textContent = nearestExam.code || nearestExam.program || 'Upcoming';
            if (dateEl) {
                dateEl.textContent = (typeof Utils !== 'undefined' && typeof Utils.formatDateSafe === 'function')
                    ? Utils.formatDateSafe(nearestExam.date)
                    : nearestExam.date;
            }
            if (timeEl) timeEl.textContent = `${nearestExam.startTime || ''} - ${nearestExam.endTime || ''}`;

            const days = Math.floor(minDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((minDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            if (countdownEl) {
                if (days > 0) countdownEl.textContent = `${days}d ${hours}h left`;
                else countdownEl.textContent = `${hours}h left`;
            }
        } else {
            titleEl.textContent = 'No Upcoming Exams';
            if (subEl) subEl.textContent = 'Schedule clear';
            if (dateEl) dateEl.textContent = '--';
            if (timeEl) timeEl.textContent = '--';
            if (countdownEl) countdownEl.textContent = 'Relax';
        }
    }

    function renderDashboardPassedSubjectsCard() {
        const container = safeGetEl('db-passed-subjects-container');
        const countEl = safeGetEl('db-passed-subjects-count');
        if (!container && !countEl) return;

        const passedSubs = (window.passedItems && Array.isArray(window.passedItems.subjects)) ? window.passedItems.subjects : [];
        if (countEl) countEl.textContent = `${passedSubs.length}`;

        if (container) {
            if (passedSubs.length === 0) {
                container.innerHTML = `<span class="text-slate-400 text-[10px] font-bold">No passed subjects recorded yet.</span>`;
            } else {
                container.innerHTML = passedSubs.map(s => {
                    return `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">${s}</span>`;
                }).join(' ');
            }
        }
    }

    // =========================================================================
    // 4. MASTER UI ORCHESTRATOR (renderUI)
    // =========================================================================

    function renderUI() {
        if (isRenderingUI) return;
        isRenderingUI = true;

        try {
            const loader = safeGetEl('loading-message');
            if (loader) loader.classList.add('hidden');
            const dashContent = safeGetEl('dashboard-content');
            if (dashContent) dashContent.classList.remove('hidden');

            if (window.dashboardConfig) {
                safeSetText('dash-top-tag', window.dashboardConfig.topTag);
                safeSetText('dash-top-tag-mobile', window.dashboardConfig.topTag);
                safeSetText('dash-main-title', window.dashboardConfig.mainTitle);
                safeSetText('dash-main-title-mobile', window.dashboardConfig.mainTitle);
                safeSetText('dash-sub-title', window.dashboardConfig.subTitle);
                safeSetText('dash-sub-title-mobile', window.dashboardConfig.subTitle);

                const trendsStartDateInput = safeGetEl('trends-start-date');
                if (trendsStartDateInput && window.dashboardConfig.trendStartDate) {
                    trendsStartDateInput.value = window.dashboardConfig.trendStartDate;
                }

                if (typeof document !== 'undefined') {
                    if (window.dashboardConfig.topTag && window.dashboardConfig.mainTitle) {
                        if (window.dashboardConfig.mainTitle.toLowerCase().startsWith(window.dashboardConfig.topTag.toLowerCase())) {
                            document.title = window.dashboardConfig.mainTitle;
                        } else {
                            document.title = `${window.dashboardConfig.topTag} - ${window.dashboardConfig.mainTitle}`;
                        }
                    } else if (window.dashboardConfig.topTag || window.dashboardConfig.mainTitle) {
                        document.title = window.dashboardConfig.topTag || window.dashboardConfig.mainTitle;
                    } else {
                        document.title = "X-29";
                    }
                }

                const tagInput = safeGetEl('edit-header-tag');
                if (tagInput) tagInput.value = window.dashboardConfig.topTag || '';
                const titleInput = safeGetEl('edit-header-title');
                if (titleInput) titleInput.value = window.dashboardConfig.mainTitle || '';
                const subInput = safeGetEl('edit-header-sub');
                if (subInput) subInput.value = window.dashboardConfig.subTitle || '';
            }

            // Validate AppState.currentFilter
            const appState = getAppState();
            if (appState.currentFilter && appState.currentFilter !== 'All') {
                const isValidProg = Array.isArray(window.tracks) && window.tracks.some(t => window.customPrograms && window.customPrograms[t.id] && window.customPrograms[t.id].some(p => (p.name || p) === appState.currentFilter));
                const allSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
                const isValidSub = allSubs.some(s => s.subject === appState.currentFilter);
                if (!isValidProg && !isValidSub) appState.currentFilter = 'All';
            }

            if (typeof window.updateGlobalDates === 'function') window.updateGlobalDates();
            setupFocusTodayButton();
            if (typeof window.updateCountdown === 'function') window.updateCountdown();
            if (typeof window.updateExamCountdown === 'function') window.updateExamCountdown();
            if (typeof window.updateSuccessScore === 'function') window.updateSuccessScore();
            if (typeof window.renderSubjectNavigation === 'function') window.renderSubjectNavigation();
            if (typeof window.renderTaskList === 'function') window.renderTaskList();
            if (typeof window.updateMetrics === 'function') window.updateMetrics();

            // Defer heavy chart & analytics rendering
            const deferRender = (fn, delay = 20) => {
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(() => setTimeout(fn, delay));
                } else {
                    setTimeout(fn, delay);
                }
            };

            deferRender(() => {
                if (typeof window.renderChart === 'function') window.renderChart();
                updateTrendsBar();
                if (typeof window.renderDailyTracker === 'function') window.renderDailyTracker();
                if (typeof window.renderDailyLogs === 'function') window.renderDailyLogs();
                if (typeof window.renderSpectraCommitmentsChart === 'function') window.renderSpectraCommitmentsChart();
                if (typeof window.renderTrendCharts === 'function') window.renderTrendCharts();
                if (typeof window.renderResults === 'function') window.renderResults();
                renderDashboardOutcomeCard();
                renderDashboardUpcomingExamCard();
                renderDashboardPassedSubjectsCard();
                if (typeof window.renderMonthlyTargets === 'function') window.renderMonthlyTargets();
                renderDashboardMonthlyChecklist();
                if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets();
                if (typeof window.autoSyncWeeklyToDailyTargets === 'function') window.autoSyncWeeklyToDailyTargets();
                renderDashboardWeeklyChecklist();
                if (typeof window.renderDailyTargets === 'function') window.renderDailyTargets();
                renderDashboardDailyChecklist();
                if (typeof window.renderOutcomeProgramToggles === 'function') window.renderOutcomeProgramToggles();
                if (typeof window.renderSchedulePage === 'function') window.renderSchedulePage();
                if (typeof window.renderExamPage === 'function') window.renderExamPage();
            }, 20);

            // Dynamic Form & Manage UI Syncs
            if (typeof window.populateTrackDropdowns === 'function') window.populateTrackDropdowns();
            if (typeof window.updateManageDropdown === 'function') window.updateManageDropdown();
            if (typeof window.renderPassConfig === 'function') window.renderPassConfig();
            if (typeof window.renderCelebrationConfig === 'function') window.renderCelebrationConfig();
            if (typeof window.togglePaceBundleType === 'function') window.togglePaceBundleType();

            if (typeof document !== 'undefined' && typeof document.querySelector === 'function') {
                const activeSysTab = document.querySelector('[id^="sys-tab-"].bg-blue-600');
                if (activeSysTab) {
                    const tabName = activeSysTab.id.replace('sys-tab-', '');
                    if (tabName === 'chapter' && typeof window.updateChProgDropdown === 'function') window.updateChProgDropdown();
                    if (tabName === 'subject' && typeof window.updateSubProgDropdown === 'function') window.updateSubProgDropdown();
                    if (tabName === 'priority') {
                        const activeEl = document.activeElement;
                        const isFocusInPriority = activeEl && document.getElementById('sys-content-priority')?.contains(activeEl);
                        if (!isFocusInPriority && typeof window.renderPriorityConfig === 'function') {
                            window.renderPriorityConfig();
                        }
                    }
                }
                const revModal = safeGetEl('revision-manage-modal');
                if (revModal && !revModal.classList.contains('hidden') && typeof window.renderRevisionModalContent === 'function') {
                    window.renderRevisionModalContent();
                }
                const analyticsModal = safeGetEl('analytics-modal');
                if (analyticsModal && !analyticsModal.classList.contains('hidden') && window.currentAnalyticsAction && typeof window.populateAnalyticsModal === 'function') {
                    window.populateAnalyticsModal(window.currentAnalyticsAction);
                }
                const historyModal = safeGetEl('global-history-modal');
                if (historyModal && !historyModal.classList.contains('hidden') && typeof window.renderGlobalHistoryContent === 'function') {
                    window.renderGlobalHistoryContent();
                }
                const dadbModal = safeGetEl('daily-actions-db-modal');
                if (dadbModal && !dadbModal.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') {
                    window.openDailyActionsDBModal();
                }
            }

            if (window.TimerService) {
                if (typeof window.TimerService.updateDisplay === 'function') window.TimerService.updateDisplay();
                if (typeof window.TimerService.restore === 'function') window.TimerService.restore();
            }

            // Real-time sync: Refresh Focus Analytics & Heatmap
            if (typeof window.updateTimerAnalyticsControls === 'function') {
                setTimeout(window.updateTimerAnalyticsControls, 50);
            }
            if (typeof window.renderTimerAnalyticsChart === 'function') {
                setTimeout(() => window.renderTimerAnalyticsChart(true), 60);
            }
            if (typeof window.renderSpectraFocusHeatmap === 'function') {
                setTimeout(window.renderSpectraFocusHeatmap, 80);
            }
            if (typeof window.setSessionHistoryFilterUI === 'function') {
                setTimeout(() => window.setSessionHistoryFilterUI(window.sessionHistoryFilter || 'all'), 50);
            }

            const spectraPage = safeGetEl('page-spectra-analytics');
            if (spectraPage && !spectraPage.classList.contains('hidden')) {
                if (typeof window.renderSpectraCircleChart === 'function') {
                    setTimeout(window.renderSpectraCircleChart, 60);
                }
                if (typeof window.renderSpectraCommitmentsChart === 'function') {
                    setTimeout(window.renderSpectraCommitmentsChart, 70);
                }
            }

        } finally {
            isRenderingUI = false;
        }
    }

    // =========================================================================
    // 5. DASHBOARD PAGE LIFECYCLE OBJECT
    // =========================================================================

    const DashboardPage = {
        isMounted: false,
        init: function () {
            this.isMounted = true;
            this.mount();
        },
        mount: function () {
            this.isMounted = true;
            this.render();
        },
        render: function () {
            const pageEl = safeGetEl('page-dashboard');
            if (!pageEl) return;

            renderDashboardDailyChecklist();
            renderDashboardWeeklyChecklist();
            renderDashboardMonthlyChecklist();
            renderDashboardOutcomeCard();
            renderDashboardUpcomingExamCard();
            renderDashboardPassedSubjectsCard();
            updateTrendsBar();

            const stats = window.lastSubjectStats || (typeof window.updateMetrics === 'function' ? (window.updateMetrics(), window.lastSubjectStats) : {});
            if (typeof window.renderCategoryProgress === 'function') window.renderCategoryProgress(stats);
            if (typeof window.renderTrackProgress === 'function') window.renderTrackProgress(stats);

            if (typeof window.renderDailyTracker === 'function') window.renderDailyTracker();
            if (typeof window.updateActiveScheduleSlot === 'function') window.updateActiveScheduleSlot();
            if (typeof window.renderSpectraFocusHeatmap === 'function') window.renderSpectraFocusHeatmap();

            if (window.dbProgressChartInstance && typeof window.dbProgressChartInstance.resize === 'function') {
                window.dbProgressChartInstance.resize();
                if (typeof window.dbProgressChartInstance.update === 'function') {
                    window.dbProgressChartInstance.update('none');
                }
            }
        },
        destroy: function () {
            this.isMounted = false;
        }
    };

    // =========================================================================
    // EXPORTS & GLOBAL ASSIGNMENTS
    // =========================================================================

    const DashboardCore = {
        setupFocusTodayButton,
        updateTrendsStartDate,
        setPaceToggleState,
        togglePaceSwitch,
        openTrendsSettingsModal,
        selectActivePaceGoal,
        saveTrendsSettings,
        updateTrendsBar,
        renderDashboardDailyChecklist,
        toggleDashboardDailyTargetCompletion,
        renderDashboardWeeklyChecklist,
        toggleDashboardWeeklyTargetCompletion,
        renderDashboardMonthlyChecklist,
        toggleDashboardMonthlyTargetCompletion,
        renderDashboardOutcomeCard,
        renderDashboardUpcomingExamCard,
        renderDashboardPassedSubjectsCard,
        renderUI,
        DashboardPage
    };

    window.DashboardCore = DashboardCore;
    window.DashboardPage = DashboardPage;

    window.setupFocusTodayButton = setupFocusTodayButton;
    window.updateTrendsStartDate = updateTrendsStartDate;
    window.setPaceToggleState = setPaceToggleState;
    window.togglePaceSwitch = togglePaceSwitch;
    window.openTrendsSettingsModal = openTrendsSettingsModal;
    window.selectActivePaceGoal = selectActivePaceGoal;
    window.saveTrendsSettings = saveTrendsSettings;

    window.updateTrendsBar = updateTrendsBar;
    window.renderDashboardDailyChecklist = renderDashboardDailyChecklist;
    window.toggleDashboardDailyTargetCompletion = toggleDashboardDailyTargetCompletion;
    window.renderDashboardWeeklyChecklist = renderDashboardWeeklyChecklist;
    window.toggleDashboardWeeklyTargetCompletion = toggleDashboardWeeklyTargetCompletion;
    window.renderDashboardMonthlyChecklist = renderDashboardMonthlyChecklist;
    window.toggleDashboardMonthlyTargetCompletion = toggleDashboardMonthlyTargetCompletion;
    window.renderDashboardOutcomeCard = renderDashboardOutcomeCard;
    window.renderDashboardUpcomingExamCard = renderDashboardUpcomingExamCard;
    window.renderDashboardPassedSubjectsCard = renderDashboardPassedSubjectsCard;

    window.renderUI = renderUI;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DashboardCore;
    }

})(typeof window !== 'undefined' ? window : global);
