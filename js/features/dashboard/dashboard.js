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

    const safeGetEl = (typeof window !== 'undefined' && typeof window.safeGetEl === 'function')
        ? window.safeGetEl
        : (typeof global !== 'undefined' && typeof global.safeGetEl === 'function')
            ? global.safeGetEl
            : (typeof require === 'function' ? require('../../utils/dom.js').safeGetEl : null);

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
        if (typeof window !== 'undefined' && typeof window.hexToRgba === 'function') {
            return window.hexToRgba(hex, alpha);
        }
        if (typeof global !== 'undefined' && typeof global.hexToRgba === 'function') {
            return global.hexToRgba(hex, alpha);
        }
        if (typeof Utils !== 'undefined' && typeof Utils.hexToRgba === 'function') {
            return Utils.hexToRgba(hex, alpha);
        }
        if (typeof require === 'function') {
            try { return require('../../utils/colors.js').hexToRgba(hex, alpha); } catch (e) {}
        }
        return `rgba(16, 185, 129, ${alpha})`;
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

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const todayStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function')
            ? Utils.formatDate(now)
            : now.toISOString().split('T')[0];

        if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};

        const parseDk = (dk) => {
            if (typeof window.parseDailyTargetDateKey === 'function') {
                return window.parseDailyTargetDateKey(dk);
            }
            if (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function') {
                return Utils.parseDateSafe(dk);
            }
            return new Date(dk);
        };

        const isSameDayAsToday = (dk) => {
            if (dk === todayStr) return true;
            const d = parseDk(dk);
            if (!d || isNaN(d.getTime())) return false;
            return d.getFullYear() === now.getFullYear() &&
                   d.getMonth() === now.getMonth() &&
                   d.getDate() === now.getDate();
        };

        const allDateKeys = Object.keys(window.dailyTargetsDatabase);
        const todayDateKeys = allDateKeys.filter(dk => isSameDayAsToday(dk));
        if (todayDateKeys.length === 0 && window.dailyTargetsDatabase[todayStr]) {
            todayDateKeys.push(todayStr);
        }

        const dashboardItems = [];

        // 1. Current day targets
        todayDateKeys.forEach(tDk => {
            const currentTargets = window.dailyTargetsDatabase[tDk] || [];
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
                    dateKey: tDk,
                    idx,
                    isCompleted,
                    isToday: true
                });
            });
        });

        // 2. Previous days targets (uncompleted only)
        const pastDateKeys = allDateKeys.filter(dk => {
            if (todayDateKeys.includes(dk)) return false;
            const d = parseDk(dk);
            if (!d || isNaN(d.getTime())) return false;
            const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            return dTime < todayStart;
        }).sort((a, b) => {
            const timeA = parseDk(a).getTime();
            const timeB = parseDk(b).getTime();
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

        const displayToday = todayDateKeys.length > 0 ? todayDateKeys[0] : todayStr;
        if (rangeEl) {
            if (pastPendingCount > 0) {
                rangeEl.textContent = `Today: ${displayToday} (+${pastPendingCount} Pending)`;
            } else {
                rangeEl.textContent = `Today: ${displayToday}`;
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
            progressEl.style.width = `${pct}%`;
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

        let activeWeekKey = currentWeekKey;
        if (!window.weeklyTargetsDatabase[activeWeekKey]) {
            const canonical = (typeof window.getCanonicalWeeklyRangeKey === 'function')
                ? window.getCanonicalWeeklyRangeKey(currentWeekKey)
                : null;
            if (canonical && window.weeklyTargetsDatabase[canonical]) {
                activeWeekKey = canonical;
            } else {
                const foundKey = Object.keys(window.weeklyTargetsDatabase).find(wk => {
                    return (typeof Utils !== 'undefined' && typeof Utils.isDateInWeekRange === 'function')
                        ? Utils.isDateInWeekRange(new Date(), wk)
                        : false;
                });
                if (foundKey) activeWeekKey = foundKey;
            }
        }

        const dashboardItems = [];

        // 1. Current week targets
        const currentTargets = window.weeklyTargetsDatabase[activeWeekKey] || [];
        currentTargets.forEach((target, idx) => {
            const foundTask = typeof window.findTaskChapter === 'function' ? window.findTaskChapter(target.track, target.subject, target.chapter) : null;
            if (foundTask && foundTask.subTask.skipped) return;
            const progress = typeof window.getWeeklyTargetProgress === 'function'
                ? window.getWeeklyTargetProgress(target, activeWeekKey)
                : { completed: 0, total: 0, percent: 0, isSizeBased: false };
            const isCompleted = target.completed || (foundTask ? foundTask.subTask.completed : false) || (target.totalChapterSize && progress.percent >= 100);
            dashboardItems.push({
                target,
                weekKey: activeWeekKey,
                idx,
                isCompleted,
                progress,
                isCurrentWeek: true
            });
        });

        // 2. Previous weeks targets (uncompleted only)
        const pastWeekKeys = Object.keys(window.weeklyTargetsDatabase).filter(wk => {
            if (wk === activeWeekKey || wk === currentWeekKey) return false;
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
                rangeEl.textContent = `Week: ${activeWeekKey} (+${pastPendingCount} Pending)`;
            } else {
                rangeEl.textContent = `Week: ${activeWeekKey}`;
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
            progressEl.style.width = `${pct}%`;
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
        const currentRange = (typeof window.getMonthlyTargetRange === 'function')
            ? window.getMonthlyTargetRange(currentMonthDate)
            : { start: new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1), end: new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0) };

        let activeMonthKey = (typeof window.formatMonthRangeKey === 'function')
            ? window.formatMonthRangeKey(currentRange.start, currentRange.end)
            : null;

        if (!window.monthlyTargetsDatabase) window.monthlyTargetsDatabase = {};

        if (!activeMonthKey || !window.monthlyTargetsDatabase[activeMonthKey]) {
            const allMonthKeys = Object.keys(window.monthlyTargetsDatabase);
            const curY = currentMonthDate.getFullYear();
            const curM = currentMonthDate.getMonth();
            const found = allMonthKeys.find(k => {
                const parts = k.split(' - ');
                const d = (typeof window.Utils !== 'undefined' && typeof window.Utils.parseDateSafe === 'function')
                    ? window.Utils.parseDateSafe(parts[0])
                    : new Date(parts[0]);
                return !isNaN(d.getTime()) && d.getFullYear() === curY && d.getMonth() === curM;
            });
            if (found) {
                activeMonthKey = found;
            } else if (allMonthKeys.length > 0 && !activeMonthKey) {
                activeMonthKey = allMonthKeys[0];
            }
        }

        const targets = (activeMonthKey && window.monthlyTargetsDatabase[activeMonthKey]) ? window.monthlyTargetsDatabase[activeMonthKey] : [];
        const totalTargets = targets.length;

        let completedTargets = 0;
        targets.forEach(t => {
            const prog = typeof window.getMonthlyTargetProgress === 'function' ? window.getMonthlyTargetProgress(t, activeMonthKey) : { completed: 0, total: 0, percent: 0 };
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
                ? window.getMonthlyTargetProgress(target, activeMonthKey)
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
                <button onclick="window.toggleDashboardMonthlyTargetCompletion(${idx}, ${!isCompleted}, '${activeMonthKey}')"
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
            progressEl.style.width = `${pct}%`;
        }
    }

    function toggleDashboardMonthlyTargetCompletion(idx, isCompleted, monthKey = null) {
        if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleMonthlyTargetCompletion === 'function') {
            window.MonthlyTargets.toggleMonthlyTargetCompletion(idx, isCompleted, monthKey);
        } else if (typeof window.toggleMonthlyTargetCompletion === 'function') {
            window.toggleMonthlyTargetCompletion(idx, isCompleted, monthKey);
        }
        renderDashboardMonthlyChecklist();
    }

    function renderDashboardOutcomeCard() {
        const cardEl = safeGetEl('dashboard-outcome-section');
        const overallBadgeEl = safeGetEl('db-outcome-overall-badge');
        const listEl = safeGetEl('db-outcome-program-list');

        const AppStateRef = (typeof window !== 'undefined' && window.AppState) || (typeof global !== 'undefined' && global.AppState) || {};
        let activeResults = (typeof window.getProcessedResults === 'function')
            ? window.getProcessedResults()
            : (window.OutcomeResults && typeof window.OutcomeResults.getProcessedResults === 'function'
                ? window.OutcomeResults.getProcessedResults()
                : []);
        if ((!activeResults || activeResults.length === 0) && AppStateRef && AppStateRef.successResults && AppStateRef.successResults.length > 0) {
            if (typeof window !== 'undefined') window.successResults = AppStateRef.successResults;
            activeResults = (typeof window.getProcessedResults === 'function')
                ? window.getProcessedResults()
                : (window.OutcomeResults && typeof window.OutcomeResults.getProcessedResults === 'function'
                    ? window.OutcomeResults.getProcessedResults()
                    : AppStateRef.successResults);
        }

        // Group only logged results by program name
        const programGroups = {};
        const achievements = [];

        if (Array.isArray(activeResults)) {
            activeResults.forEach(res => {
                if (!res) return;
                if (res.type === 'cgpa') {
                    const progName = res.title || '';
                    if (!progName) return;
                    if (!programGroups[progName]) {
                        programGroups[progName] = {
                            name: progName,
                            overall: null,
                            subjects: [],
                            date: res.date
                        };
                    }
                    const parseDate = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                        ? Utils.parseDateSafe
                        : (d => new Date(d));
                    if (parseDate(res.date) > parseDate(programGroups[progName].date)) {
                        programGroups[progName].date = res.date;
                    }
                    if (!res.subject) {
                        programGroups[progName].overall = res;
                    } else {
                        programGroups[progName].subjects.push(res);
                    }
                } else {
                    achievements.push(res);
                }
            });
        }

        const inputtedItems = [];

        // Filter and collect ONLY programs with actual user input / logged scores
        Object.values(programGroups).forEach(group => {
            const progName = group.name;
            const overall = group.overall;
            const subjects = group.subjects;

            const hasOverallScore = Boolean(overall && ((overall.value && overall.value !== '') || (overall.grade && overall.grade !== '')));
            const hasSubjectScores = subjects.some(s => (s.value && s.value !== '') || (s.grade && s.grade !== ''));

            // If no scores inputted at all, exclude from card
            if (!hasOverallScore && !hasSubjectScores) return;

            const evalType = (overall && overall.evaluationType) || (subjects.length > 0 && subjects[0].evaluationType) || 'cgpa';
            const isGradeMode = evalType === 'grade';

            let actCgpa = overall?.value || '';
            let actGrade = overall?.grade || '';

            if (!actCgpa && !actGrade && subjects.length > 0) {
                const subjectsWithScores = subjects.filter(s => s.value && !isNaN(parseFloat(s.value)));
                if (subjectsWithScores.length > 0) {
                    const sum = subjectsWithScores.reduce((acc, s) => acc + parseFloat(s.value), 0);
                    const avg = sum / subjectsWithScores.length;
                    actCgpa = (typeof Utils !== 'undefined' && typeof Utils.formatCgpaMin2Dec === 'function')
                        ? Utils.formatCgpaMin2Dec(avg)
                        : avg.toFixed(2);
                    actGrade = (typeof Utils !== 'undefined' && typeof Utils.mapCgpaToGrade === 'function')
                        ? Utils.mapCgpaToGrade(avg, evalType)
                        : '';
                }
            }

            if (!actGrade && actCgpa && !isNaN(parseFloat(actCgpa))) {
                actGrade = (typeof Utils !== 'undefined' && typeof Utils.mapCgpaToGrade === 'function')
                    ? Utils.mapCgpaToGrade(parseFloat(actCgpa), evalType)
                    : '';
            }
            if (!actCgpa && actGrade) {
                actCgpa = (typeof Utils !== 'undefined' && typeof Utils.mapGradeToNumeric === 'function' && typeof Utils.formatCgpaMin2Dec === 'function')
                    ? Utils.formatCgpaMin2Dec(Utils.mapGradeToNumeric(actGrade, evalType))
                    : '';
            }

            const mainTarget = typeof window.getProgramMainTarget === 'function'
                ? window.getProgramMainTarget(progName)
                : { targetCGPA: '', targetGrade: '' };
            const targetCGPA = (overall && overall.targetCGPA) || mainTarget.targetCGPA || '';
            const targetGrade = (overall && overall.targetGrade) || mainTarget.targetGrade || (targetCGPA && targetCGPA !== 'none' && typeof Utils !== 'undefined' && typeof Utils.mapCgpaToGrade === 'function' ? Utils.mapCgpaToGrade(targetCGPA, evalType) : '');

            const hasTgt = targetCGPA && targetCGPA !== 'none' && targetCGPA !== '';

            let isGoalMet = false;
            if (hasTgt) {
                if (isGradeMode && actGrade && targetGrade && targetGrade !== 'none' && typeof Utils !== 'undefined' && typeof Utils.mapGradeToNumeric === 'function') {
                    isGoalMet = Utils.mapGradeToNumeric(actGrade, 'grade') >= Utils.mapGradeToNumeric(targetGrade, 'grade');
                } else if (actCgpa && targetCGPA) {
                    const actVal = parseFloat(actCgpa);
                    const tgtVal = parseFloat(targetCGPA);
                    if (!isNaN(actVal) && !isNaN(tgtVal)) {
                        isGoalMet = actVal >= tgtVal;
                    }
                }
            }

            const color = typeof window.getProgramColor === 'function' ? window.getProgramColor(progName) : '#eab308';

            inputtedItems.push({
                type: 'program',
                name: progName,
                date: group.date,
                hasTgt,
                tgtCgpa: hasTgt ? (isNaN(parseFloat(targetCGPA)) ? targetCGPA : (typeof Utils !== 'undefined' && typeof Utils.formatCgpaMin2Dec === 'function' ? Utils.formatCgpaMin2Dec(targetCGPA) : targetCGPA)) : '—',
                tgtGrade: hasTgt ? (targetGrade || '—') : '—',
                actCgpa: actCgpa ? (isNaN(parseFloat(actCgpa)) ? actCgpa : (typeof Utils !== 'undefined' && typeof Utils.formatCgpaMin2Dec === 'function' ? Utils.formatCgpaMin2Dec(actCgpa) : actCgpa)) : '—',
                actGrade: actGrade || '—',
                isGradeMode,
                isGoalMet,
                color: color
            });
        });

        // Also include non-CGPA achievements that were inputted
        achievements.forEach(ach => {
            if (!ach) return;
            inputtedItems.push({
                type: 'achievement',
                name: ach.title || 'Achievement',
                date: ach.date,
                hasTgt: false,
                tgtCgpa: '—',
                tgtGrade: '—',
                actCgpa: ach.value || '—',
                actGrade: ach.grade || '—',
                isGradeMode: false,
                isGoalMet: false,
                color: '#f59e0b'
            });
        });

        // Sort by date according to the chosen/saved order
        const sortOrder = window.outcomeDateSortOrder || (typeof safeStorage !== 'undefined' ? safeStorage.getItem('outcome_date_sort_order') : null) || 'desc';
        const isAsc = sortOrder === 'asc';

        inputtedItems.sort((a, b) => {
            const parseDate = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                ? Utils.parseDateSafe
                : (d => new Date(d));
            const timeA = parseDate(a.date).getTime();
            const timeB = parseDate(b.date).getTime();
            return isAsc ? (timeA - timeB) : (timeB - timeA);
        });

        // Calculate overall stats for badge
        let targetSum = 0;
        let targetCount = 0;
        let actualSum = 0;
        let actualCount = 0;

        inputtedItems.forEach(item => {
            if (item.hasTgt && item.tgtCgpa !== '—') {
                const val = parseFloat(item.tgtCgpa);
                if (!isNaN(val) && val > 0) {
                    targetSum += val;
                    targetCount++;
                }
            }
            if (item.actCgpa !== '—') {
                const val = parseFloat(item.actCgpa);
                if (!isNaN(val) && val > 0) {
                    actualSum += val;
                    actualCount++;
                }
            }
        });

        const avgTargetCgpa = targetCount > 0 ? (targetSum / targetCount) : null;
        const avgActualCgpa = actualCount > 0 ? (actualSum / actualCount) : null;

        // Overall Badge Status
        if (overallBadgeEl) {
            if (actualCount > 0 && targetCount > 0) {
                if (avgActualCgpa >= avgTargetCgpa) {
                    overallBadgeEl.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 shadow-xs';
                    overallBadgeEl.textContent = 'Goal Met';
                } else {
                    overallBadgeEl.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 shadow-xs';
                    overallBadgeEl.textContent = 'In Progress';
                }
            } else if (actualCount > 0) {
                overallBadgeEl.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 shadow-xs';
                overallBadgeEl.textContent = 'Logged';
            } else {
                overallBadgeEl.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                overallBadgeEl.textContent = 'No Results';
            }
        }

        // Render [ Name - Target - Actual ] List
        if (listEl) {
            if (inputtedItems.length === 0) {
                listEl.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center py-4 text-center select-none">
                        <span class="text-2xl mb-1.5 opacity-50">🏆</span>
                        <p class="text-xs font-black text-slate-600 dark:text-slate-300">No results logged yet</p>
                        <p class="text-[9px] text-slate-400 mt-0.5 mb-2.5">Input your BBA, CA or program scores</p>
                        <button onclick="window.openResultModal()" class="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                            <span>Add Result</span>
                        </button>
                    </div>`;
            } else {
                let html = '';
                inputtedItems.forEach(item => {
                    if (item.type === 'program') {
                        const tgtDisplay = item.hasTgt
                            ? (item.isGradeMode ? `${item.tgtGrade}` : `${item.tgtCgpa}`)
                            : '—';
                        const tgtSub = item.hasTgt
                            ? (item.isGradeMode ? `CGPA ${item.tgtCgpa}` : (item.tgtGrade !== '—' ? `(${item.tgtGrade})` : ''))
                            : 'No Target';

                        const actDisplay = item.isGradeMode
                            ? `${item.actGrade !== '—' ? item.actGrade : item.actCgpa}`
                            : `${item.actCgpa !== '—' ? item.actCgpa : item.actGrade}`;
                        const actSub = item.isGradeMode
                            ? `CGPA ${item.actCgpa}`
                            : (item.actGrade !== '—' ? `(${item.actGrade})` : '');

                        const statusBadge = item.hasTgt
                            ? (item.isGoalMet
                                ? `<span class="text-[7px] font-black px-1.5 py-0.25 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-800/50">MET</span>`
                                : `<span class="text-[7px] font-black px-1.5 py-0.25 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-800/50">NOT MET</span>`)
                            : `<span class="text-[7px] font-black px-1.5 py-0.25 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800/50">LOGGED</span>`;

                        html += `
                            <div class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all flex items-center justify-between gap-2 shadow-2xs select-none">
                                <!-- [ Name ] -->
                                <div class="flex items-center space-x-2.5 min-w-0 flex-1">
                                    <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${item.color}; box-shadow: 0 0 6px ${item.color}"></div>
                                    <div class="min-w-0">
                                        <span class="font-black text-xs text-slate-800 dark:text-slate-100 truncate block leading-tight">${item.name}</span>
                                        <div class="flex items-center gap-1.5 mt-0.5">
                                            <span class="text-[8px] font-extrabold uppercase text-slate-400">${item.isGradeMode ? 'Grade' : 'CGPA'}</span>
                                            ${statusBadge}
                                        </div>
                                    </div>
                                </div>

                                <!-- [ Target ] -->
                                <div class="flex flex-col items-center px-2.5 py-1 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 shrink-0 min-w-[76px] text-center">
                                    <span class="text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 leading-none">Target</span>
                                    <span class="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight mt-0.5">${tgtDisplay}</span>
                                    ${tgtSub ? `<span class="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5 truncate max-w-[70px]">${tgtSub}</span>` : ''}
                                </div>

                                <!-- [ Actual ] -->
                                <div class="flex flex-col items-center px-2.5 py-1 rounded-xl ${item.isGoalMet ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/40' : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50'} border shrink-0 min-w-[76px] text-center">
                                    <span class="text-[8px] font-black uppercase tracking-wider ${item.isGoalMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'} leading-none">Actual</span>
                                    <span class="text-xs font-black ${item.isGoalMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'} leading-tight mt-0.5">${actDisplay}</span>
                                    ${actSub ? `<span class="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5 truncate max-w-[70px]">${actSub}</span>` : ''}
                                </div>
                            </div>`;
                    } else {
                        html += `
                            <div class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all flex items-center justify-between gap-2 shadow-2xs select-none">
                                <!-- [ Name ] -->
                                <div class="flex items-center space-x-2.5 min-w-0 flex-1">
                                    <div class="w-2.5 h-2.5 rounded-full shrink-0 bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]"></div>
                                    <div class="min-w-0">
                                        <span class="font-black text-xs text-slate-800 dark:text-slate-100 truncate block leading-tight">${item.name}</span>
                                        <span class="text-[8px] font-extrabold uppercase text-slate-400">Achievement</span>
                                    </div>
                                </div>

                                <!-- [ Target ] -->
                                <div class="flex flex-col items-center px-2.5 py-1 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 shrink-0 min-w-[76px] text-center">
                                    <span class="text-[8px] font-black uppercase tracking-wider text-slate-400 leading-none">Target</span>
                                    <span class="text-xs font-bold text-slate-400 leading-tight mt-0.5">—</span>
                                </div>

                                <!-- [ Actual ] -->
                                <div class="flex flex-col items-center px-2.5 py-1 rounded-xl bg-yellow-50/70 dark:bg-yellow-950/30 border border-yellow-200/50 dark:border-yellow-800/40 shrink-0 min-w-[76px] text-center">
                                    <span class="text-[8px] font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400 leading-none">Actual</span>
                                    <span class="text-xs font-black text-yellow-600 dark:text-yellow-400 leading-tight mt-0.5">${item.actCgpa}</span>
                                </div>
                            </div>`;
                    }
                });
                listEl.innerHTML = html;
            }
        }

        // Test environment fallback elements
        const cgpaEl = safeGetEl('db-outcome-cgpa');
        const gradeEl = safeGetEl('db-outcome-grade');
        const passedEl = safeGetEl('db-outcome-passed');
        const creditEl = safeGetEl('db-outcome-credit');
        const progressValEl = safeGetEl('db-outcome-progress-val');
        if (progressValEl) progressValEl.textContent = avgActualCgpa ? avgActualCgpa.toFixed(2) : '--';
        if (cgpaEl) cgpaEl.textContent = avgActualCgpa ? avgActualCgpa.toFixed(2) : '--';
        if (gradeEl) gradeEl.textContent = (avgActualCgpa && typeof Utils !== 'undefined' && typeof Utils.mapCgpaToGrade === 'function') ? Utils.mapCgpaToGrade(avgActualCgpa) : '--';
        if (passedEl) passedEl.textContent = `${inputtedItems.length} Logged`;
        if (creditEl) creditEl.textContent = `-- Credits`;
    }

    function renderDashboardUpcomingExamCard() {
        const cardEl = safeGetEl('dashboard-upcoming-exams-section');
        const countBadgeEl = safeGetEl('db-upcoming-exams-count-badge');
        const listEl = safeGetEl('db-upcoming-exams-list');

        // Test environment fallback elements
        const testTitleEl = safeGetEl('db-upcoming-exam-title');
        const testSubEl = safeGetEl('db-upcoming-exam-subtitle');
        const testDateEl = safeGetEl('db-upcoming-exam-date');
        const testTimeEl = safeGetEl('db-upcoming-exam-time');
        const testCountdownEl = safeGetEl('db-upcoming-exam-countdown');

        const exams = (window.AppState && window.AppState.examRoutine) ? window.AppState.examRoutine : (Array.isArray(window.examRoutineData) ? window.examRoutineData : []);
        const sessions = (window.AppState && window.AppState.examSessions) ? window.AppState.examSessions : [];
        const now = Date.now();

        const getExamTimestamp = (dateStr, timeStr) => {
            if (!dateStr) return NaN;
            const parts = dateStr.split('-');
            if (parts.length !== 3) return NaN;
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            let hours = 0, minutes = 0;
            if (timeStr) {
                const timeParts = timeStr.split(':');
                hours = parseInt(timeParts[0], 10) || 0;
                minutes = parseInt(timeParts[1], 10) || 0;
            }
            return new Date(year, month, day, hours, minutes, 0, 0).getTime();
        };

        const upcomingExams = exams
            .filter(e => e && (e.subject || e.title) && e.date && e.status !== 'completed')
            .map(e => {
                const timeMs = getExamTimestamp(e.date, e.time || e.startTime);
                return { ...e, timeMs };
            })
            .filter(e => !isNaN(e.timeMs) && e.timeMs > (now - 7200000))
            .sort((a, b) => a.timeMs - b.timeMs);

        // Update count badge in header
        if (countBadgeEl) {
            if (upcomingExams.length > 0) {
                countBadgeEl.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50 shadow-xs';
                countBadgeEl.textContent = `${upcomingExams.length} Upcoming`;
            } else {
                countBadgeEl.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                countBadgeEl.textContent = 'No Exams';
            }
        }

        if (listEl) {
            if (upcomingExams.length === 0) {
                listEl.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center py-4 text-center select-none">
                        <span class="text-2xl mb-1.5 opacity-60">🎓</span>
                        <p class="text-xs font-black text-slate-600 dark:text-slate-300">No upcoming exams</p>
                        <p class="text-[9px] text-slate-400 mt-0.5 mb-2.5">Schedule subjects & exam routine</p>
                        <button onclick="window.switchPage('exam')" class="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                            <span>Schedule Exam</span>
                        </button>
                    </div>`;
            } else {
                let html = '';
                const nowDt = new Date(now);

                upcomingExams.forEach(ex => {
                    const parentSession = sessions.find(s => s.id === ex.sessionId);
                    const sessionTag = parentSession
                        ? (parentSession.name ? `${parentSession.program} - ${parentSession.name}` : parentSession.program)
                        : (ex.program && ex.program !== 'Non-Program' ? ex.program : 'Custom');

                    const subjName = ex.subject || ex.title || 'General';
                    const subjColor = typeof window.getSubjectColor === 'function' ? window.getSubjectColor(subjName) : '#f43f5e';
                    const dtObj = new Date(ex.timeMs);
                    const dtFormatted = dtObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                    const timeFormatted = (ex.time || ex.startTime) ? dtObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                    const rem = typeof window.calculateExamTimeRemaining === 'function'
                        ? window.calculateExamTimeRemaining(nowDt, dtObj)
                        : null;

                    let countdownHtml = '';
                    if (rem && rem.isPast && rem.diffMs > -7200000) {
                        countdownHtml = `<span class="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse shrink-0">● Live Today</span>`;
                    } else if (rem && !rem.isPast) {
                        const cdText = typeof window.formatExamCountdownString === 'function'
                            ? window.formatExamCountdownString(rem)
                            : `${rem.days}d ${rem.hours}h`;
                        countdownHtml = `
                            <span class="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 shrink-0 inline-flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                <span data-db-exam-target-time="${ex.timeMs}">${cdText}</span>
                            </span>`;
                    } else {
                        countdownHtml = `<span class="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-500 shrink-0">Ended</span>`;
                    }

                    const displayName = ex.title && ex.title.toLowerCase() !== subjName.toLowerCase()
                        ? `${subjName} <span class="font-normal text-slate-400 dark:text-slate-500 text-[9px]">(${ex.title})</span>`
                        : subjName;

                    html += `
                        <div class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 select-none shadow-2xs">
                            <div class="flex items-center space-x-2.5 min-w-0 flex-1">
                                <div class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style="background-color: ${subjColor}; box-shadow: 0 0 6px ${subjColor}"></div>
                                <div class="min-w-0">
                                    <div class="flex items-center gap-1.5 min-w-0">
                                        <span class="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                                            ${displayName}
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-1.5 text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
                                        <span class="text-rose-500/80 font-black truncate max-w-[90px] sm:max-w-[120px]">${sessionTag}</span>
                                        <span>•</span>
                                        <span class="truncate">${dtFormatted}${timeFormatted ? ' ' + timeFormatted : ''}</span>
                                    </div>
                                </div>
                            </div>
                            ${countdownHtml}
                        </div>`;
                });

                listEl.innerHTML = html;
            }
        }

        // Test fallback elements update
        if (testTitleEl) {
            const nearest = upcomingExams[0];
            if (nearest) {
                testTitleEl.textContent = nearest.subject || nearest.title || 'Exam';
                if (testSubEl) testSubEl.textContent = nearest.code || nearest.program || 'Upcoming';
                if (testDateEl) testDateEl.textContent = nearest.date || '--';
                if (testTimeEl) testTimeEl.textContent = nearest.time || nearest.startTime || '--';
                if (testCountdownEl) testCountdownEl.textContent = 'Upcoming';
            } else {
                testTitleEl.textContent = 'No Upcoming Exams';
                if (testSubEl) testSubEl.textContent = 'Schedule clear';
                if (testDateEl) testDateEl.textContent = '--';
                if (testTimeEl) testTimeEl.textContent = '--';
                if (testCountdownEl) testCountdownEl.textContent = 'Relax';
            }
        }
    }

    function renderDashboardPassedSubjectsCard() {
        const cardEl = safeGetEl('dashboard-passed-subjects-section');
        const rateBadgeEl = safeGetEl('db-passed-subjects-rate-badge');
        const countBadgeEl = safeGetEl('db-passed-subjects-count-badge');
        const listEl = safeGetEl('db-passed-subjects-list');

        // Test environment fallback elements
        const testContainer = safeGetEl('db-passed-subjects-container');
        const testCountEl = safeGetEl('db-passed-subjects-count');

        const allSubjects = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
        const passedProgs = (window.passedItems && Array.isArray(window.passedItems.programs)) ? window.passedItems.programs : [];
        const passedSubs = (window.passedItems && Array.isArray(window.passedItems.subjects)) ? window.passedItems.subjects : [];

        // Filter all subjects that are marked as passed/frozen (via program or individual subject)
        const passedSubjectList = allSubjects.filter(s => {
            if (!s || !s.subject) return false;
            const isProgPassed = passedProgs.includes(s.program);
            const isSubPassed = passedSubs.includes(s.subject);
            return isProgPassed || isSubPassed;
        });

        const totalCount = allSubjects.length;
        const successPct = totalCount > 0 ? Math.round((passedSubjectList.length / totalCount) * 100) : 0;

        // Update success rate badge in header
        if (rateBadgeEl) {
            if (passedSubjectList.length > 0) {
                rateBadgeEl.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 shadow-xs';
                rateBadgeEl.textContent = `${successPct}%`;
                rateBadgeEl.title = `Success Rate: ${successPct}% (${passedSubjectList.length} of ${totalCount} subjects passed)`;
            } else {
                rateBadgeEl.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                rateBadgeEl.textContent = '0%';
                rateBadgeEl.title = 'Success Rate: 0%';
            }
        }

        // Update count badge in header
        if (countBadgeEl) {
            if (passedSubjectList.length > 0) {
                countBadgeEl.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 shadow-xs';
                countBadgeEl.textContent = `${passedSubjectList.length} Passed`;
                countBadgeEl.title = `${passedSubjectList.length} of ${totalCount} subjects passed`;
            } else {
                countBadgeEl.className = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                countBadgeEl.textContent = '0 Passed';
                countBadgeEl.title = '0 subjects passed';
            }
        }

        if (listEl) {
            if (passedSubjectList.length === 0) {
                listEl.innerHTML = `
                    <div class="col-span-2 h-full flex flex-col items-center justify-center py-4 text-center select-none">
                        <span class="text-2xl mb-1.5 opacity-60">🛡️</span>
                        <p class="text-xs font-black text-slate-600 dark:text-slate-300">No passed subjects yet</p>
                        <p class="text-[9px] text-slate-400 mt-0.5 mb-2.5">Configure pass & freeze criteria in Outcome</p>
                        <button onclick="window.switchPage('outcome')" class="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            <span>Manage Pass / Freeze</span>
                        </button>
                    </div>`;
            } else {
                let html = '';
                passedSubjectList.forEach(s => {
                    const subjColor = typeof window.getSubjectColor === 'function' ? window.getSubjectColor(s.subject || 'General') : '#10b981';
                    const chaptersCount = s.chapters || 0;

                    let displaySub = s.subject;
                    if (s.program && displaySub.startsWith(s.program + ' - ')) {
                        displaySub = displaySub.replace(s.program + ' - ', '');
                    } else if (s.program && displaySub.startsWith(s.program + ' ')) {
                        displaySub = displaySub.replace(s.program + ' ', '');
                    }

                    html += `
                        <div class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 select-none shadow-2xs">
                            <div class="flex items-center space-x-2 min-w-0 flex-1">
                                <div class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style="background-color: ${subjColor}; box-shadow: 0 0 6px ${subjColor}"></div>
                                <div class="min-w-0">
                                    <span class="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-slate-100 truncate block leading-tight" title="${s.subject}">
                                        ${displaySub}
                                    </span>
                                    <div class="flex items-center gap-1 text-[7.5px] sm:text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
                                        <span class="text-emerald-600 dark:text-emerald-400 font-black truncate max-w-[65px] sm:max-w-[85px]">${s.program || 'Custom'}</span>
                                        <span>•</span>
                                        <span class="truncate">${chaptersCount} Ch</span>
                                    </div>
                                </div>
                            </div>
                            <div class="shrink-0">
                                <span class="text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 inline-flex items-center gap-0.5" title="Passed & Frozen">
                                    <svg class="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span>Pass</span>
                                </span>
                            </div>
                        </div>`;
                });
                listEl.innerHTML = html;
            }
        }

        // Test fallback elements update
        if (testCountEl) testCountEl.textContent = `${passedSubs.length}`;
        if (testContainer) {
            if (passedSubs.length === 0) {
                testContainer.innerHTML = `<span class="text-slate-400 text-[10px] font-bold">No passed subjects recorded yet.</span>`;
            } else {
                testContainer.innerHTML = passedSubs.map(s => {
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
                try { if (typeof window.renderChart === 'function') window.renderChart(); } catch (e) { console.error('renderChart error:', e); }
                try { updateTrendsBar(); } catch (e) { console.error('updateTrendsBar error:', e); }
                try { if (typeof window.renderDailyTracker === 'function') window.renderDailyTracker(); } catch (e) { console.error('renderDailyTracker error:', e); }
                try { if (typeof window.renderDailyLogs === 'function') window.renderDailyLogs(); } catch (e) { console.error('renderDailyLogs error:', e); }
                try { if (typeof window.renderSpectraCommitmentsChart === 'function') window.renderSpectraCommitmentsChart(); } catch (e) { console.error('renderSpectraCommitmentsChart error:', e); }
                try { if (typeof window.renderTrendCharts === 'function') window.renderTrendCharts(); } catch (e) { console.error('renderTrendCharts error:', e); }
                try { if (typeof window.renderResults === 'function') window.renderResults(); } catch (e) { console.error('renderResults error:', e); }
                try { renderDashboardOutcomeCard(); } catch (e) { console.error('renderDashboardOutcomeCard error:', e); }
                try { renderDashboardUpcomingExamCard(); } catch (e) { console.error('renderDashboardUpcomingExamCard error:', e); }
                try { renderDashboardPassedSubjectsCard(); } catch (e) { console.error('renderDashboardPassedSubjectsCard error:', e); }
                try { if (typeof window.renderMonthlyTargets === 'function') window.renderMonthlyTargets(); } catch (e) { console.error('renderMonthlyTargets error:', e); }
                try { renderDashboardMonthlyChecklist(); } catch (e) { console.error('renderDashboardMonthlyChecklist error:', e); }
                try { if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets(); } catch (e) { console.error('renderWeeklyTargets error:', e); }
                try { if (typeof window.autoSyncWeeklyToDailyTargets === 'function') window.autoSyncWeeklyToDailyTargets(); } catch (e) { console.error('autoSyncWeeklyToDailyTargets error:', e); }
                try { renderDashboardWeeklyChecklist(); } catch (e) { console.error('renderDashboardWeeklyChecklist error:', e); }
                try { if (typeof window.renderDailyTargets === 'function') window.renderDailyTargets(); } catch (e) { console.error('renderDailyTargets error:', e); }
                try { renderDashboardDailyChecklist(); } catch (e) { console.error('renderDashboardDailyChecklist error:', e); }
                try { if (typeof window.renderOutcomeProgramToggles === 'function') window.renderOutcomeProgramToggles(); } catch (e) { console.error('renderOutcomeProgramToggles error:', e); }
                try { if (typeof window.renderSchedulePage === 'function') window.renderSchedulePage(); } catch (e) { console.error('renderSchedulePage error:', e); }
                try { if (typeof window.renderExamPage === 'function') window.renderExamPage(); } catch (e) { console.error('renderExamPage error:', e); }
                try { if (typeof window.updateActiveScheduleSlot === 'function') window.updateActiveScheduleSlot(); } catch (e) { console.error('updateActiveScheduleSlot error:', e); }
            }, 20);

            // Dynamic Form & Manage UI Syncs
            if (typeof window.populateTrackDropdowns === 'function') window.populateTrackDropdowns();
            if (typeof window.renderPassConfig === 'function') window.renderPassConfig();
            if (typeof window.renderCelebrationConfig === 'function') window.renderCelebrationConfig();
            if (typeof window.togglePaceBundleType === 'function') window.togglePaceBundleType();

            if (typeof document !== 'undefined' && typeof document.querySelector === 'function') {
                const activeSysTab = document.querySelector('[id^="sys-tab-"].bg-blue-600');
                if (activeSysTab) {
                    const tabName = activeSysTab.id.replace('sys-tab-', '');
                    if (tabName === 'chapter' && typeof window.updateChProgDropdown === 'function') window.updateChProgDropdown();
                    if (tabName === 'subject' && typeof window.updateSubProgDropdown === 'function') window.updateSubProgDropdown();
                    if (tabName === 'manage' && typeof window.updateManageDropdown === 'function') window.updateManageDropdown();
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
        renderChart,
        renderUI,
        DashboardPage
    };

    function renderChart() {
        if (typeof document === 'undefined') return;
        const canvas = document.getElementById('progressChart');
        if (!canvas) return;

        let displayCompleted = 0;
        let totalChapters = 1;
        const AppStateRef = typeof AppState !== 'undefined' ? AppState : (typeof window !== 'undefined' ? window.AppState : {});
        const stats = window.lastSubjectStats || (typeof window.updateMetrics === 'function' ? (window.updateMetrics(), window.lastSubjectStats) : null);
        if (stats) {
            let eff = 0;
            let total = 0;
            const getAllSubsFn = typeof window.getAllSubjects === 'function' ? window.getAllSubjects : () => [];
            const allSubs = getAllSubsFn().map(s => s.subject);
            allSubs.forEach(sub => {
                if (stats[sub]) {
                    total += stats[sub].totalChapters || 0;
                    eff += stats[sub].effectiveChapters || 0;
                }
            });
            if (total > 0) {
                displayCompleted = Math.round(eff);
                totalChapters = total;
            }
        }

        const remaining = Math.max(0, totalChapters - displayCompleted);

        if (AppStateRef.progressChart && typeof AppStateRef.progressChart.update === 'function') {
            AppStateRef.progressChart.data.datasets[0].data = [displayCompleted, remaining];
            AppStateRef.progressChart.update();
            return;
        }

        if (typeof Chart === 'undefined') return;

        if (AppStateRef.progressChart && typeof AppStateRef.progressChart.destroy === 'function') {
            AppStateRef.progressChart.destroy();
        }

        AppStateRef.progressChart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [displayCompleted, remaining],
                    backgroundColor: ['#3b82f6', 'rgba(148, 163, 184, 0.15)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '82%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

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
    window.renderChart = renderChart;

    window.renderUI = renderUI;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DashboardCore;
    }

})(typeof window !== 'undefined' ? window : global);
