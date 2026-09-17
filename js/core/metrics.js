/**
 * X-29 Core Module: KPI Metrics Calculation Engine (metrics.js)
 *
 * Responsibilities:
 * 1. KPI Metrics Calculation Engine (updateMetrics):
 *    - Reentrancy protection against circular callback cascades.
 *    - Calculates subjectStats per subject (active chapters, completed, effective, actual pace).
 *    - Caches window.lastSubjectStats for modal and page reuse.
 *    - Computes global overall syllabus completion % and chapter counts.
 *    - Aggregates multi-track and global pace metrics (curPace, reqPace, days needed, est finish date).
 *    - Updates DOM KPI elements, status badges, contextual comments, and timeline labels.
 *    - Safely manages Doughnut Chart.js instances (progressChart, dbProgressChart).
 *    - Coordinates downstream renderers (subject progress, category/track progress, pace goals).
 * 2. Totals & Global Date Bounds:
 *    - recalculateTotals: Sums total static chapters in syllabusStructure.
 *    - updateGlobalDates: Synchronizes AppState.PLAN_START_DATE and PLAN_END_DATE.
 * 3. Success Score & Milestone Celebrations:
 *    - updateSuccessScore: Computes passed subjects vs total subjects.
 *    - Detects celebration completion and triggers showCongratsModal.
 * 4. Countdown & Timeline Elapsed:
 *    - updateCountdown: Computes final deadline days remaining and time elapsed days.
 * 5. Analytical Pace Helpers:
 *    - calculateIndependentEstFinish, calculatePaceGoalStats, getTargetedSubjectsForGoal.
 *
 * State:
 * - Reads AppState.tasks, AppState.globalStartDate, AppState.globalEndDate, window.paceGoals,
 *   window.passedItems, window.celebrationTargets, window.syllabusStructure.
 * - Writes window.lastSubjectStats, window.latestPaceData, AppState.progressChart, window.dbProgressChartInstance.
 */

(function (global) {
    'use strict';

    const window = global;

    let isUpdatingMetrics = false;

    const safeGetEl = (typeof window !== 'undefined' && typeof window.safeGetEl === 'function')
        ? window.safeGetEl
        : (typeof global !== 'undefined' && typeof global.safeGetEl === 'function')
            ? global.safeGetEl
            : (typeof require === 'function' ? require('../utils/dom.js').safeGetEl : null);

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

    function getTaskDateSafe(task) {
        if (!task) return new Date(NaN);
        if (task.date && !String(task.date).includes('Invalid') && !String(task.date).includes('NaN')) {
            const d = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                ? Utils.parseDateSafe(task.date)
                : new Date(task.date);
            if (d && !isNaN(d.getTime())) return d;
        }
        return new Date(NaN);
    }

    // =========================================================================
    // 1. TOTALS & GLOBAL DATES RECALCULATION
    // =========================================================================

    let totalStaticChapters = 0;

    function recalculateTotals() {
        let total = 0;
        if (Array.isArray(window.tracks) && window.syllabusStructure) {
            window.tracks.forEach(trackObj => {
                const track = trackObj.id;
                if (Array.isArray(window.syllabusStructure[track])) {
                    total += window.syllabusStructure[track].reduce((acc, s) => acc + (s.chapters || 0), 0);
                }
            });
        }
        totalStaticChapters = total;
        window.totalStaticChapters = total;
        return total;
    }

    function updateGlobalDates() {
        if (!window.paceGoals) return;
        const globalGoal = window.paceGoals.find(g => g.type === 'global');

        if (window.dashboardConfig && window.dashboardConfig.trendStartDate && typeof Utils !== 'undefined') {
            const trendStart = Utils.parseDateSafe(window.dashboardConfig.trendStartDate);
            if (!isNaN(trendStart.getTime())) {
                trendStart.setHours(0, 0, 0, 0);
                AppState.PLAN_START_DATE = new Date(trendStart.getTime());
            }
        } else if (AppState.tasks && AppState.tasks.length > 0 && AppState.tasks[0].date && typeof Utils !== 'undefined') {
            const firstD = Utils.parseDateSafe(AppState.tasks[0].date);
            if (firstD && !isNaN(firstD.getTime())) {
                firstD.setHours(0, 0, 0, 0);
                AppState.PLAN_START_DATE = new Date(firstD.getTime());
            }
        }

        if (globalGoal) {
            if (globalGoal.startDate && typeof Utils !== 'undefined') {
                const s = Utils.parseDateSafe(globalGoal.startDate);
                if (!isNaN(s.getTime())) {
                    s.setHours(0, 0, 0, 0);
                    AppState.globalStartDate = s;
                }
            } else if (AppState.PLAN_START_DATE) {
                AppState.globalStartDate = new Date(AppState.PLAN_START_DATE);
            }

            if (globalGoal.deadline && typeof Utils !== 'undefined') {
                const e = Utils.parseDateSafe(globalGoal.deadline);
                if (!isNaN(e.getTime())) {
                    e.setHours(23, 59, 59, 999);
                    AppState.globalEndDate = e;
                }
            } else {
                AppState.globalEndDate = null;
            }
        } else {
            AppState.globalStartDate = null;
            AppState.globalEndDate = null;
        }
    }

    // =========================================================================
    // 2. COUNTDOWN & SUCCESS SCORE
    // =========================================================================

    function updateCountdown() {
        if (!AppState.globalStartDate || !AppState.globalEndDate) {
            safeSetHtml('countdown-timer', `<div class="text-center md:text-right"><span class="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Final Deadline</span><span class="text-slate-400 font-black text-sm sm:text-base md:text-base drop-shadow-sm">Not Set</span></div>`);
            safeSetHtml('time-gone-stats', `<div class="flex items-center space-x-2 md:space-x-3 justify-center md:justify-start"><div class="hidden md:flex p-2 md:p-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700/50"><svg class="w-4 h-4 md:w-5 md:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="text-center md:text-left"><span class="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Time Elapsed</span><span class="text-slate-400 font-black text-sm sm:text-base md:text-base">Not Set</span></div></div>`);
            return;
        }

        const today = new Date();
        const start = new Date(AppState.globalStartDate);
        const target = new Date(AppState.globalEndDate);

        const diffLeft = target - today;
        if (diffLeft > 0) {
            const daysLeft = Math.ceil(diffLeft / (1000 * 60 * 60 * 24));
            safeSetHtml('countdown-timer', `<div class="text-center md:text-right"><span class="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Final Deadline</span><span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 font-black text-sm sm:text-base md:text-2xl drop-shadow-sm">${daysLeft} Days</span></div>`);
        } else {
            safeSetHtml('countdown-timer', `<div class="text-center md:text-right"><span class="text-green-500 font-black text-sm sm:text-base md:text-lg drop-shadow-sm">Goal Reached!</span></div>`);
        }

        const diffGone = today - start;
        const daysGone = Math.max(0, Math.floor(diffGone / (1000 * 60 * 60 * 24)));
        safeSetHtml('time-gone-stats', `<div class="flex items-center space-x-2 md:space-x-3 justify-center md:justify-start"><div class="hidden md:flex p-2 md:p-2.5 bg-red-100 dark:bg-red-500/20 rounded-lg md:rounded-xl border border-red-200 dark:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]"><svg class="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="text-center md:text-left"><span class="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Time Elapsed</span><span class="text-red-600 dark:text-red-400 font-black text-sm sm:text-base md:text-2xl drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)]">${daysGone} Days</span></div></div>`);
    }

    function updateSuccessScore() {
        if (!window.passedItems) window.passedItems = { programs: [], subjects: [] };
        if (!window.celebrationTargets) window.celebrationTargets = { programs: [], subjects: [] };

        let totalSubs = 0;
        let passedSubs = 0;

        if (Array.isArray(window.tracks) && window.syllabusStructure) {
            window.tracks.map(t => t.id).forEach(track => {
                if (window.syllabusStructure[track]) {
                    window.syllabusStructure[track].forEach(s => {
                        totalSubs++;
                        if (window.passedItems.programs.includes(s.program) || window.passedItems.subjects.includes(s.subject)) {
                            passedSubs++;
                        }
                    });
                }
            });
        }

        const pct = totalSubs > 0 ? Math.round((passedSubs / totalSubs) * 100) : 0;

        safeSetHtml('success-score-stats', `
            <div class="flex items-center space-x-2 md:space-x-3 justify-center md:justify-start">
                <div class="hidden md:flex p-2 md:p-2.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg md:rounded-xl border border-emerald-200 dark:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    <svg class="w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div class="text-center md:text-left">
                    <span class="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Success Score</span>
                    <span class="text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-base md:text-2xl drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]">${pct}%</span>
                </div>
            </div>
        `);

        // Calculate Milestone Celebration Completion
        const hasCustomCeleb = Boolean(
            (window.celebrationTargets.programs && window.celebrationTargets.programs.length > 0) ||
            (window.celebrationTargets.subjects && window.celebrationTargets.subjects.length > 0)
        );

        let coreTotal = 0;
        let corePassed = 0;
        let celebrationMet = false;

        if (hasCustomCeleb) {
            const requiredSubjectSet = new Set();
            if (Array.isArray(window.tracks) && window.syllabusStructure) {
                window.tracks.map(t => t.id).forEach(track => {
                    if (window.syllabusStructure[track]) {
                        window.syllabusStructure[track].forEach(s => {
                            if (
                                (window.celebrationTargets.programs && window.celebrationTargets.programs.includes(s.program)) ||
                                (window.celebrationTargets.subjects && window.celebrationTargets.subjects.includes(s.subject))
                            ) {
                                requiredSubjectSet.add(s.subject);
                            }
                        });
                    }
                });
            }

            coreTotal = requiredSubjectSet.size;
            const allSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
            requiredSubjectSet.forEach(subName => {
                const sObj = allSubs.find(s => s.subject === subName);
                const isPassed = (window.passedItems.subjects && window.passedItems.subjects.includes(subName)) ||
                                 (sObj && window.passedItems.programs && window.passedItems.programs.includes(sObj.program));
                if (isPassed) corePassed++;
            });

            celebrationMet = (coreTotal > 0 && corePassed === coreTotal);
        } else {
            coreTotal = totalSubs;
            corePassed = passedSubs;
            celebrationMet = (pct === 100 && totalSubs > 0);
        }

        if (celebrationMet && !window.hasShownCongrats) {
            window.hasShownCongrats = true;
            setTimeout(() => {
                if (typeof window.showCongratsModal === 'function') {
                    window.showCongratsModal(hasCustomCeleb, corePassed, coreTotal);
                }
            }, 800);
        } else if (!celebrationMet) {
            window.hasShownCongrats = false;
        }

        if (typeof window.updateCelebrationLiveStatus === 'function') {
            window.updateCelebrationLiveStatus(corePassed, coreTotal, hasCustomCeleb, celebrationMet);
        }
        if (typeof window.renderDashboardPassedSubjectsCard === 'function') {
            window.renderDashboardPassedSubjectsCard();
        }
    }

    // =========================================================================
    // 3. KPI METRICS CALCULATION ENGINE (updateMetrics)
    // =========================================================================

    function updateMetrics() {
        if (isUpdatingMetrics) return;
        isUpdatingMetrics = true;

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const msPerDay = 1000 * 60 * 60 * 24;

            const subjectStats = {};
            const allSubjects = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];

            allSubjects.forEach(sObj => {
                const sub = sObj.subject;
                const totalSyllabusChapters = sObj.chapters || 0;
                let trackId = sObj.track;
                if (!trackId && window.syllabusStructure) {
                    for (const tid in window.syllabusStructure) {
                        if (Array.isArray(window.syllabusStructure[tid]) && window.syllabusStructure[tid].some(s => s.subject === sub)) {
                            trackId = tid;
                            break;
                        }
                    }
                }
                trackId = trackId || 'ca';

                const isFrozen = window.passedItems && (
                    (window.passedItems.subjects && window.passedItems.subjects.includes(sub)) ||
                    (window.passedItems.programs && window.passedItems.programs.includes(sObj.program))
                );

                let skippedChapters = 0;
                let completedChapters = 0;
                let earliestCompletedDate = null;
                let tasksAssigned = 0;

                const subTasks = [];
                if (AppState.tasks && Array.isArray(AppState.tasks)) {
                    AppState.tasks.filter(t => t.type === 'study').forEach(t => {
                        if (Array.isArray(window.tracks)) {
                            window.tracks.forEach(track => {
                                const key = track.id + 'Tasks';
                                if (Array.isArray(t[key])) {
                                    t[key].forEach(b => {
                                        if (b.subject === sub) {
                                            subTasks.push({ dayObj: t, taskObj: b, trackId: track.id });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }

                tasksAssigned = subTasks.filter(x => !x.taskObj.skipped).length;

                if (totalSyllabusChapters > 0) {
                    for (let chNum = 1; chNum <= totalSyllabusChapters; chNum++) {
                        const matchedTaskItem = subTasks.find(x => {
                            const chStr = x.taskObj.chapter;
                            if (chStr === `Ch. ${chNum}` || chStr === `Ch.${chNum}` || chStr === String(chNum)) return true;
                            const match = chStr ? chStr.match(/(\d+)(?!.*\d)/) : null;
                            return match && parseInt(match[0], 10) === chNum;
                        });

                        if (matchedTaskItem && matchedTaskItem.taskObj.skipped) {
                            skippedChapters++;
                        } else if (matchedTaskItem && matchedTaskItem.taskObj.completed) {
                            completedChapters += 1;
                            let d = matchedTaskItem.taskObj.completedAt ? new Date(matchedTaskItem.taskObj.completedAt) : getTaskDateSafe(matchedTaskItem.dayObj);
                            if (isNaN(d.getTime())) d = getTaskDateSafe(matchedTaskItem.dayObj);
                            if (!earliestCompletedDate || d < earliestCompletedDate) {
                                earliestCompletedDate = d;
                            }
                        } else {
                            const prog = window.getChapterWeeklyTargetProgress ? window.getChapterWeeklyTargetProgress(trackId, sub, `Ch. ${chNum}`) : null;
                            if (prog && prog.isSizeBased && prog.total > 0 && prog.completed > 0) {
                                completedChapters += Math.min(1, prog.completed / prog.total);
                            }
                        }
                    }
                } else {
                    subTasks.forEach(x => {
                        if (x.taskObj.skipped) {
                            skippedChapters++;
                        } else if (x.taskObj.completed) {
                            completedChapters += 1;
                            let d = x.taskObj.completedAt ? new Date(x.taskObj.completedAt) : getTaskDateSafe(x.dayObj);
                            if (isNaN(d.getTime())) d = getTaskDateSafe(x.dayObj);
                            if (!earliestCompletedDate || d < earliestCompletedDate) {
                                earliestCompletedDate = d;
                            }
                        }
                    });
                }

                const totalActiveChapters = Math.max(0, totalSyllabusChapters - skippedChapters);
                const effectiveChapters = isFrozen ? totalActiveChapters : Math.min(totalActiveChapters, completedChapters);

                let actualPace = 0;
                if (earliestCompletedDate) {
                    const start = new Date(earliestCompletedDate);
                    start.setHours(0, 0, 0, 0);
                    if (start <= today) {
                        const daysElapsed = Math.floor((today - start) / msPerDay) + 1;
                        actualPace = effectiveChapters / daysElapsed;
                    }
                }

                subjectStats[sub] = {
                    totalChapters: totalActiveChapters,
                    tasksAssigned: tasksAssigned,
                    tasksCompleted: completedChapters,
                    effectiveChapters: effectiveChapters,
                    earliestCompletedDate: earliestCompletedDate,
                    actualPace: actualPace
                };
            });

            window.lastSubjectStats = subjectStats;

            // 1. Calculate Absolute Completion Progress (Top UI Bar - ALL SUBJECTS)
            let scopeTotalChapters = 0;
            let scopeCompleted = 0;
            const allSubs = allSubjects.map(s => s.subject);
            allSubs.forEach(sub => {
                if (subjectStats[sub]) {
                    scopeTotalChapters += subjectStats[sub].totalChapters;
                    scopeCompleted += subjectStats[sub].effectiveChapters;
                }
            });

            const percentage = scopeTotalChapters > 0 ? Math.round((scopeCompleted / scopeTotalChapters) * 100) : 0;
            const displayCompleted = Math.round(scopeCompleted);

            safeSetText('progress-title', "Global Overall Completion");
            safeSetText('progress-text', `${percentage}%`);
            safeSetText('progress-detail', `${displayCompleted} / ${scopeTotalChapters} Chapters`);

            const pBar = safeGetEl('progress-bar');
            if (pBar) pBar.style.width = `${percentage}%`;

            // 2. Accurate Aggregated Pace Engine (Top Boxes)
            if (!AppState.globalStartDate || !AppState.globalEndDate) {
                let earliestDate = null;
                if (AppState.tasks && Array.isArray(AppState.tasks)) {
                    AppState.tasks.forEach(t => {
                        if (t.type === 'study' && Array.isArray(window.tracks)) {
                            window.tracks.forEach(track => {
                                const key = track.id + 'Tasks';
                                if (Array.isArray(t[key])) {
                                    t[key].forEach(b => {
                                        if (b.completed) {
                                            let d = b.completedAt ? new Date(b.completedAt) : getTaskDateSafe(t);
                                            if (!earliestDate || d < earliestDate) earliestDate = d;
                                        }
                                    });
                                }
                            });
                        }
                    });
                }

                let paceTotalChapters = scopeTotalChapters;
                let paceCompleted = scopeCompleted;
                let remaining = Math.max(0, paceTotalChapters - paceCompleted);

                let globalCurPace = 0;
                let start = earliestDate ? new Date(earliestDate) : new Date(today);
                start.setHours(0, 0, 0, 0);

                if (earliestDate && start <= today) {
                    const daysElapsed = Math.floor((today - start) / msPerDay) + 1;
                    globalCurPace = paceCompleted / daysElapsed;
                }

                window.latestPaceData = {
                    total: paceTotalChapters,
                    completed: paceCompleted,
                    start: new Date(start),
                    end: globalCurPace > 0 ? new Date(today.getTime() + (remaining / globalCurPace) * msPerDay) : new Date(today),
                    today: new Date(today),
                    reqPace: 0,
                    curPace: globalCurPace,
                    projectedDate: paceTotalChapters === 0 || globalCurPace <= 0 ? new Date(0) : new Date(today.getTime() + (remaining / globalCurPace) * msPerDay),
                    subjects: allSubs
                };

                const currentPaceDisplay = globalCurPace.toFixed(2);
                safeSetText('target-req-pace', `--`);
                safeSetText('current-pace-stat', `${currentPaceDisplay} Ch/Day`);
                safeSetText('global-pace-req', `--`);
                safeSetText('global-pace-act', `${currentPaceDisplay} Ch/Day`);
                safeSetText('db-target-req-pace', `--`);
                safeSetText('db-current-pace-stat', `${currentPaceDisplay} Ch/Day`);

                let finishDisplay = '';
                let globalDaysLeftStr = '<span class="opacity-50">--</span>';
                let globalDaysNeededStr = '<span class="opacity-50">--</span>';
                let globalDaysPassedStr = '<span class="opacity-50">--</span>';

                if (paceTotalChapters === 0) {
                    finishDisplay = '<span class="text-sm opacity-50 uppercase tracking-widest">No Targets</span>';
                } else if (remaining <= 0) {
                    finishDisplay = '<span class="text-emerald-500">Finished!</span>';
                    globalDaysLeftStr = '<span class="text-emerald-500 font-bold">Done</span>';
                    globalDaysNeededStr = '<span class="text-emerald-500 font-bold">0 Days</span>';
                    if (earliestDate && typeof Utils !== 'undefined' && typeof Utils.formatDaysPassed === 'function') {
                        const daysElapsed = Math.max(0, Math.floor((today - start) / msPerDay) + 1);
                        globalDaysPassedStr = `${Utils.formatDaysPassed(daysElapsed)} Passed`;
                    }
                } else if (globalCurPace <= 0) {
                    finishDisplay = '<span class="text-sm opacity-50 uppercase tracking-widest">No Data</span>';
                    globalDaysLeftStr = '<span class="opacity-50">--</span>';
                } else {
                    let projDate = window.latestPaceData.projectedDate;
                    finishDisplay = typeof Utils !== 'undefined' && typeof Utils.formatDateResponsive === 'function' ? Utils.formatDateResponsive(projDate) : projDate.toLocaleDateString();
                    const globalDaysLeftNeed = remaining / globalCurPace;
                    globalDaysNeededStr = `${Math.ceil(globalDaysLeftNeed)} Days Needed`;
                    globalDaysLeftStr = '<span class="text-slate-400 font-bold">No Goal</span>';
                    if (earliestDate && typeof Utils !== 'undefined' && typeof Utils.formatDaysPassed === 'function') {
                        const daysElapsed = Math.max(0, Math.floor((today - start) / msPerDay) + 1);
                        globalDaysPassedStr = `${Utils.formatDaysPassed(daysElapsed)} Passed`;
                    }
                }

                safeSetHtml('projected-finish', finishDisplay);
                safeSetHtml('db-projected-finish', finishDisplay);

                safeSetHtml('global-days-left', globalDaysLeftStr);
                safeSetHtml('global-days-needed', globalDaysNeededStr);
                safeSetHtml('global-days-passed', globalDaysPassedStr);

                safeSetHtml('db-global-days-left', globalDaysLeftStr);
                safeSetHtml('db-global-days-needed', globalDaysNeededStr);
                safeSetHtml('db-global-days-passed', globalDaysPassedStr);

                let timelineText = earliestDate ? `Started: ${(typeof Utils !== 'undefined' && typeof Utils.formatDateResponsive === 'function') ? Utils.formatDateResponsive(start) : start.toLocaleDateString()}` : `Not Started`;
                let dbTimelineText = earliestDate ? ((typeof Utils !== 'undefined' && typeof Utils.formatDateResponsive === 'function') ? Utils.formatDateResponsive(start) : start.toLocaleDateString()) : `Not Started`;
                safeSetHtml('pace-timeline-info', `<span class="text-slate-500 font-bold">Global Baseline</span> <span class="mx-1 opacity-50">|</span> <span class="tracking-widest text-[9px] uppercase">${timelineText}</span>`);
                safeSetHtml('db-pace-timeline-info', dbTimelineText);

                const statusLabel = safeGetEl('target-status-label');
                if (statusLabel) {
                    statusLabel.className = "text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest drop-shadow-sm";
                    statusLabel.textContent = "NO TARGETS SET";
                }

                const dbStatusLabel = safeGetEl('db-target-status-label');
                if (dbStatusLabel) {
                    dbStatusLabel.className = "text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 truncate";
                    dbStatusLabel.textContent = "NO GOAL";
                }

                let progComment = { text: "No global pace goal is set. Actual pace is calculating dynamically from your first completed chapter.", icon: "📊", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800/50" };
                safeSetHtml('prog-comment', `<div class="flex items-start space-x-3 p-3.5 rounded-xl border ${progComment.bg} ${progComment.border} shadow-sm transition-all duration-300 hover:shadow-md"><span class="text-lg md:text-xl drop-shadow-sm">${progComment.icon}</span><p class="text-[10px] md:text-xs font-bold leading-relaxed mt-0.5 ${progComment.color}">${progComment.text}</p></div>`);
            } else {
                let targetedSubjects = new Set();
                const globalGoal = window.paceGoals.find(g => g.type === 'global');

                if (globalGoal) {
                    const isManualGlobal = globalGoal.subjects || globalGoal.secondaryPaces;
                    if (isManualGlobal) {
                        if (globalGoal.subjects) globalGoal.subjects.forEach(s => targetedSubjects.add(s));
                        if (globalGoal.secondaryPaces) {
                            globalGoal.secondaryPaces.forEach(pid => {
                                const g = window.paceGoals.find(x => x.id === pid);
                                if (g) {
                                    if (g.type === 'bundle') {
                                        if (g.subjects) g.subjects.forEach(s => targetedSubjects.add(s));
                                        if (g.programs && window.tracks && window.syllabusStructure) {
                                            window.tracks.map(t => t.id).forEach(track => {
                                                if (window.syllabusStructure[track]) {
                                                    window.syllabusStructure[track].forEach(s => { if (g.programs.includes(s.program)) targetedSubjects.add(s.subject); });
                                                }
                                            });
                                        }
                                    } else if (g.type === 'subject') {
                                        targetedSubjects.add(g.target);
                                    } else if (g.type === 'program' && window.tracks && window.syllabusStructure) {
                                        window.tracks.map(t => t.id).forEach(track => {
                                            if (window.syllabusStructure[track]) {
                                                window.syllabusStructure[track].forEach(s => { if (g.target === s.program) targetedSubjects.add(s.subject); });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    } else {
                        window.paceGoals.forEach(g => {
                            if (g.type === 'global') return;
                            const gStart = g.startDate && typeof Utils !== 'undefined' ? Utils.parseDateSafe(g.startDate) : new Date(AppState.globalStartDate);
                            const gEnd = g.deadline && typeof Utils !== 'undefined' ? Utils.parseDateSafe(g.deadline) : new Date(AppState.globalEndDate);
                            gStart.setHours(0, 0, 0, 0);
                            gEnd.setHours(23, 59, 59, 999);

                            if (gEnd < AppState.globalStartDate || gStart > AppState.globalEndDate) return;

                            if (g.type === 'bundle') {
                                if (g.subjects) g.subjects.forEach(s => targetedSubjects.add(s));
                                if (g.programs && window.tracks && window.syllabusStructure) {
                                    window.tracks.map(t => t.id).forEach(track => {
                                        if (window.syllabusStructure[track]) {
                                            window.syllabusStructure[track].forEach(s => { if (g.programs.includes(s.program)) targetedSubjects.add(s.subject); });
                                        }
                                    });
                                }
                            } else if (g.type === 'subject') {
                                targetedSubjects.add(g.target);
                            } else if (g.type === 'program' && window.tracks && window.syllabusStructure) {
                                window.tracks.map(t => t.id).forEach(track => {
                                    if (window.syllabusStructure[track]) {
                                        window.syllabusStructure[track].forEach(s => { if (g.target === s.program) targetedSubjects.add(s.subject); });
                                    }
                                });
                            }
                        });
                    }
                }

                let paceTotalChapters = 0;
                let paceCompleted = 0;
                targetedSubjects.forEach(sub => {
                    if (subjectStats[sub]) {
                        paceTotalChapters += subjectStats[sub].totalChapters;
                        paceCompleted += subjectStats[sub].effectiveChapters;
                    }
                });

                const start = new Date(AppState.globalStartDate); start.setHours(0, 0, 0, 0);
                const end = new Date(AppState.globalEndDate); end.setHours(23, 59, 59, 999);

                const remaining = Math.max(0, paceTotalChapters - paceCompleted);
                const totalDays = Math.max(1, Math.ceil((end - start) / msPerDay));
                const daysElapsed = Math.floor((today - start) / msPerDay) + 1;
                const daysRemaining = Math.max(0, Math.ceil((end - today) / msPerDay));

                let globalReqPace = 0;
                let globalCurPace = 0;

                if (paceTotalChapters > 0) {
                    if (today < start) {
                        globalReqPace = paceTotalChapters / totalDays;
                        globalCurPace = 0;
                    } else if (today > end) {
                        globalReqPace = remaining > 0 ? remaining : 0;
                        globalCurPace = paceCompleted / daysElapsed;
                    } else {
                        globalReqPace = remaining > 0 ? remaining / Math.max(1, daysRemaining) : 0;
                        globalCurPace = paceCompleted / daysElapsed;
                    }
                }

                window.latestPaceData = {
                    total: paceTotalChapters,
                    completed: paceCompleted,
                    start: new Date(start),
                    end: new Date(end),
                    today: new Date(today),
                    reqPace: globalReqPace,
                    curPace: globalCurPace,
                    projectedDate: paceTotalChapters === 0 || globalCurPace <= 0 ? new Date(0) : new Date(today.getTime() + (remaining / globalCurPace) * msPerDay),
                    subjects: Array.from(targetedSubjects)
                };

                const currentPaceDisplay = globalCurPace.toFixed(2);
                const reqPaceDisplay = globalReqPace.toFixed(2);

                let maxProjectedDate = window.latestPaceData.projectedDate;
                let finishDisplay = '';

                let globalDaysLeftStr = '<span class="opacity-50">--</span>';
                let globalDaysNeededStr = '<span class="opacity-50">--</span>';
                let globalDaysPassedStr = '<span class="opacity-50">--</span>';
                let diffGlobalDaysTG = Math.ceil((end - today) / msPerDay);

                if (paceTotalChapters === 0) {
                    finishDisplay = '<span class="text-sm opacity-50 uppercase tracking-widest">No Targets</span>';
                } else if (remaining <= 0) {
                    finishDisplay = '<span class="text-emerald-500">Finished!</span>';
                    globalDaysLeftStr = '<span class="text-emerald-500 font-bold">Done</span>';
                    globalDaysNeededStr = '<span class="text-emerald-500 font-bold">0 Days</span>';
                    if (typeof Utils !== 'undefined' && typeof Utils.formatDaysPassed === 'function') {
                        globalDaysPassedStr = `${Utils.formatDaysPassed(Math.max(0, daysElapsed))} Passed`;
                    }
                } else if (globalCurPace <= 0) {
                    if (today < start) finishDisplay = '<span class="text-sm font-black text-blue-400 uppercase tracking-widest">Future Timeline</span>';
                    else if (today > end) finishDisplay = '<span class="text-sm font-black text-red-500 uppercase tracking-widest">Overdue</span>';
                    else finishDisplay = '<span class="text-sm opacity-50 uppercase tracking-widest">No Data</span>';

                    if (diffGlobalDaysTG > 0) globalDaysLeftStr = `${diffGlobalDaysTG} Days Left`;
                    else if (diffGlobalDaysTG === 0) globalDaysLeftStr = `<span class="text-orange-400">Due Today</span>`;
                    else globalDaysLeftStr = `<span class="text-red-400">${Math.abs(diffGlobalDaysTG)} Days Overdue</span>`;
                    if (typeof Utils !== 'undefined' && typeof Utils.formatDaysPassed === 'function') {
                        globalDaysPassedStr = `${Utils.formatDaysPassed(Math.max(0, daysElapsed))} Passed`;
                    }
                } else {
                    finishDisplay = (typeof Utils !== 'undefined' && typeof Utils.formatDateResponsive === 'function') ? Utils.formatDateResponsive(maxProjectedDate) : maxProjectedDate.toLocaleDateString();

                    if (diffGlobalDaysTG > 0) globalDaysLeftStr = `${diffGlobalDaysTG} Days Left`;
                    else if (diffGlobalDaysTG === 0) globalDaysLeftStr = `<span class="text-orange-400">Due Today</span>`;
                    else globalDaysLeftStr = `<span class="text-red-400">${Math.abs(diffGlobalDaysTG)} Days Overdue</span>`;

                    const globalDaysLeftNeed = remaining / globalCurPace;
                    globalDaysNeededStr = `${Math.ceil(globalDaysLeftNeed)} Days Needed`;
                    if (typeof Utils !== 'undefined' && typeof Utils.formatDaysPassed === 'function') {
                        globalDaysPassedStr = `${Utils.formatDaysPassed(Math.max(0, daysElapsed))} Passed`;
                    }
                }

                safeSetText('target-req-pace', `${reqPaceDisplay} Ch/Day`);
                safeSetText('current-pace-stat', `${currentPaceDisplay} Ch/Day`);
                safeSetHtml('projected-finish', finishDisplay);

                safeSetText('global-pace-req', `${reqPaceDisplay} Ch/Day`);
                safeSetText('global-pace-act', `${currentPaceDisplay} Ch/Day`);
                safeSetHtml('global-pace-finish', finishDisplay);

                safeSetText('db-target-req-pace', `${reqPaceDisplay} Ch/Day`);
                safeSetText('db-current-pace-stat', `${currentPaceDisplay} Ch/Day`);
                safeSetHtml('db-projected-finish', finishDisplay);

                safeSetHtml('global-days-left', globalDaysLeftStr);
                safeSetHtml('global-days-needed', globalDaysNeededStr);
                safeSetHtml('global-days-passed', globalDaysPassedStr);

                safeSetHtml('db-global-days-left', globalDaysLeftStr);
                safeSetHtml('db-global-days-needed', globalDaysNeededStr);
                safeSetHtml('db-global-days-passed', globalDaysPassedStr);

                let timelineText = (typeof Utils !== 'undefined' && typeof Utils.formatDateRangeResponsive === 'function') ? Utils.formatDateRangeResponsive(start, end, ' &rarr; ') : `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
                safeSetHtml('pace-timeline-info', `<span class="text-blue-500 font-bold">Global Baseline</span> <span class="mx-1 opacity-50">|</span> <span class="tracking-widest text-[9px] uppercase">${timelineText}</span>`);
                safeSetHtml('db-pace-timeline-info', timelineText);

                const statusLabel = safeGetEl('target-status-label');
                if (statusLabel) {
                    if (paceTotalChapters === 0) {
                        statusLabel.className = "text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest drop-shadow-sm";
                        statusLabel.textContent = "NO TARGETS SET";
                    } else if (today < start) {
                        statusLabel.className = "text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest drop-shadow-sm";
                        statusLabel.textContent = "TIMELINES START IN FUTURE";
                    } else if (today > end && remaining > 0) {
                        statusLabel.className = "text-[9px] md:text-[10px] font-black text-red-500 uppercase tracking-widest drop-shadow-sm";
                        statusLabel.textContent = "TIMELINE OVERDUE";
                    } else if (globalCurPace >= globalReqPace && globalReqPace > 0) {
                        statusLabel.className = "text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest drop-shadow-sm";
                        const endStr = (typeof Utils !== 'undefined' && typeof Utils.formatDateResponsive === 'function') ? Utils.formatDateResponsive(end) : end.toLocaleDateString();
                        statusLabel.innerHTML = `TARGET: ${endStr}`;
                    } else {
                        statusLabel.className = "text-[9px] md:text-[10px] font-black text-red-500 uppercase tracking-widest drop-shadow-sm";
                        const endStr = (typeof Utils !== 'undefined' && typeof Utils.formatDateResponsive === 'function') ? Utils.formatDateResponsive(end) : end.toLocaleDateString();
                        statusLabel.innerHTML = `TARGET: ${endStr}`;
                    }
                }

                const dbStatusLabel = safeGetEl('db-target-status-label');
                if (dbStatusLabel) {
                    if (paceTotalChapters === 0) {
                        dbStatusLabel.className = "text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 truncate";
                        dbStatusLabel.textContent = "NO TARGETS";
                    } else if (today < start) {
                        dbStatusLabel.className = "text-[9px] md:text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mt-0.5 truncate";
                        dbStatusLabel.textContent = "FUTURE";
                    } else if (today > end && remaining > 0) {
                        dbStatusLabel.className = "text-[9px] md:text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mt-0.5 truncate";
                        dbStatusLabel.textContent = "OVERDUE";
                    } else if (remaining <= 0) {
                        dbStatusLabel.className = "text-[9px] md:text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mt-0.5 truncate";
                        dbStatusLabel.textContent = "DONE";
                    } else {
                        dbStatusLabel.className = "text-[9px] md:text-[10px] font-bold text-blue-400 dark:text-blue-400 uppercase tracking-wider mt-0.5 truncate";
                        const endStr = (typeof Utils !== 'undefined' && typeof Utils.formatDateResponsive === 'function') ? Utils.formatDateResponsive(end) : end.toLocaleDateString();
                        dbStatusLabel.innerHTML = `Target: ${endStr}`;
                    }
                }

                let progComment = {};
                if (paceTotalChapters === 0) {
                    progComment = { text: "No pace goals are mapped. Add a goal in Master Configuration to track speed.", icon: "📭", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" };
                } else if (today < start) {
                    progComment = { text: "Your assigned timelines haven't started yet. Get ready to begin when the time comes!", icon: "⏳", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800/50" };
                } else if (today > end && remaining > 0) {
                    progComment = { text: "The target timeline has expired but tasks remain. You are currently overdue!", icon: "⏰", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800/50" };
                } else if (remaining <= 0 && paceTotalChapters > 0) {
                    progComment = { text: "Target timelines completely finished! Outstanding achievement.", icon: "🏆", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/50" };
                } else if (globalCurPace >= globalReqPace && globalCurPace > 0) {
                    progComment = { text: "Excellent pace! You are on track to beat your aggregated deadlines.", icon: "🚀", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/50" };
                } else if (globalCurPace >= globalReqPace * 0.75 && globalCurPace > 0) {
                    progComment = { text: "Good steady progress, but slightly behind the required timeline. Push a bit harder!", icon: "👍", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800/50" };
                } else if (globalCurPace > 0) {
                    progComment = { text: "You're falling behind the required pace. Time to double down on studies!", icon: "⚠️", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800/50" };
                } else {
                    progComment = { text: "No chapters completed in this active timeline yet! Start ticking off tasks to build momentum.", icon: "🚨", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800/50" };
                }

                safeSetHtml('prog-comment', `<div class="flex items-start space-x-3 p-3.5 rounded-xl border ${progComment.bg} ${progComment.border} shadow-sm transition-all duration-300 hover:shadow-md"><span class="text-lg md:text-xl drop-shadow-sm">${progComment.icon}</span><p class="text-[10px] md:text-xs font-bold leading-relaxed mt-0.5 ${progComment.color}">${progComment.text}</p></div>`);
            }

            // Downstream progress rendering calls
            if (typeof window.renderSubjectProgress === 'function') window.renderSubjectProgress(subjectStats);
            if (typeof window.renderSubjectNavigation === 'function') window.renderSubjectNavigation();
            if (typeof window.renderCategoryProgress === 'function') window.renderCategoryProgress(subjectStats);
            if (typeof window.renderTrackProgress === 'function') window.renderTrackProgress(subjectStats);
            if (typeof window.renderPaceGoals === 'function') window.renderPaceGoals(subjectStats);
            if (typeof window.renderGlobalPaceTrendChart === 'function') window.renderGlobalPaceTrendChart();

            // Progress doughnut charts lifecycle
            const pChartCanvas = safeGetEl('progressChart');
            if (pChartCanvas && typeof Chart !== 'undefined') {
                const pChartData = [displayCompleted, Math.max(0, scopeTotalChapters - displayCompleted)];
                if (AppState.progressChart && typeof AppState.progressChart.update === 'function') {
                    AppState.progressChart.data.datasets[0].data = pChartData;
                    AppState.progressChart.update();
                } else {
                    AppState.progressChart = new Chart(pChartCanvas.getContext('2d'), {
                        type: 'doughnut',
                        data: {
                            datasets: [{
                                data: pChartData,
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
            }

            // Compact Global Completion for Dashboard
            safeSetText('db-progress-text', `${percentage}%`);
            safeSetText('db-progress-detail', `${displayCompleted} / ${scopeTotalChapters} Chapters`);
            const dbBar = safeGetEl('db-progress-bar');
            if (dbBar) dbBar.style.width = `${percentage}%`;

            const dbCanvas = safeGetEl('dbProgressChart');
            if (dbCanvas && typeof Chart !== 'undefined') {
                if (window.dbProgressChartInstance && typeof window.dbProgressChartInstance.update === 'function') {
                    window.dbProgressChartInstance.data.datasets[0].data = [displayCompleted, Math.max(0, scopeTotalChapters - displayCompleted)];
                    window.dbProgressChartInstance.update();
                } else {
                    window.dbProgressChartInstance = new Chart(dbCanvas.getContext('2d'), {
                        type: 'doughnut',
                        data: {
                            datasets: [{
                                data: [displayCompleted, Math.max(0, scopeTotalChapters - displayCompleted)],
                                backgroundColor: ['#3b82f6', 'rgba(148, 163, 184, 0.1)'],
                                borderWidth: 0
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '80%',
                            plugins: {
                                legend: { display: false },
                                tooltip: { enabled: false }
                            }
                        }
                    });
                }
            }

            // Live Sync for Modals
            const paceModal = safeGetEl('pace-trend-modal');
            if (paceModal && !paceModal.classList.contains('hidden') && typeof window.renderPaceTrendChart === 'function') {
                window.renderPaceTrendChart(window.activeTrendGoalId);
            }
            const revModal = safeGetEl('revision-trend-modal');
            if (revModal && !revModal.classList.contains('hidden') && typeof window.renderRevisionTrendChart === 'function') {
                window.renderRevisionTrendChart();
            }

            return window.latestChartStats || { subjectStats };
        } finally {
            isUpdatingMetrics = false;
        }
    }

    // =========================================================================
    // 4. ANALYTICAL PACE HELPERS (Consolidated & Delegated to PaceEstimator)
    // =========================================================================

    function getTargetedSubjectsForGoal(goal) {
        if (typeof global.PaceEstimator !== 'undefined' && typeof global.PaceEstimator.getTargetedSubjectsForGoal === 'function') {
            return global.PaceEstimator.getTargetedSubjectsForGoal(goal);
        }
        if (typeof window !== 'undefined' && window.PaceEstimator && typeof window.PaceEstimator.getTargetedSubjectsForGoal === 'function') {
            return window.PaceEstimator.getTargetedSubjectsForGoal(goal);
        }
        return new Set();
    }

    function calculatePaceGoalStats(goal, subjectStats = null) {
        if (typeof global.PaceEstimator !== 'undefined' && typeof global.PaceEstimator.calculatePaceGoalStats === 'function') {
            return global.PaceEstimator.calculatePaceGoalStats(goal, subjectStats);
        }
        if (typeof window !== 'undefined' && window.PaceEstimator && typeof window.PaceEstimator.calculatePaceGoalStats === 'function') {
            return window.PaceEstimator.calculatePaceGoalStats(goal, subjectStats);
        }
        return null;
    }

    function calculateIndependentEstFinish() {
        if (typeof global.PaceEstimator !== 'undefined' && typeof global.PaceEstimator.calculateIndependentEstFinish === 'function') {
            return global.PaceEstimator.calculateIndependentEstFinish();
        }
        if (typeof window !== 'undefined' && window.PaceEstimator && typeof window.PaceEstimator.calculateIndependentEstFinish === 'function') {
            return window.PaceEstimator.calculateIndependentEstFinish();
        }
        return '--';
    }

    // =========================================================================
    // EXPORTS & GLOBAL ASSIGNMENTS
    // =========================================================================

    const Metrics = {
        recalculateTotals,
        updateGlobalDates,
        updateCountdown,
        updateSuccessScore,
        updateMetrics,
        getTargetedSubjectsForGoal,
        calculatePaceGoalStats,
        calculateIndependentEstFinish
    };

    window.Metrics = Metrics;

    window.recalculateTotals = recalculateTotals;
    window.updateGlobalDates = updateGlobalDates;
    window.updateCountdown = updateCountdown;
    window.updateSuccessScore = updateSuccessScore;
    window.updateMetrics = updateMetrics;
    window.getTargetedSubjectsForGoal = getTargetedSubjectsForGoal;
    window.calculatePaceGoalStats = calculatePaceGoalStats;
    window.calculateIndependentEstFinish = calculateIndependentEstFinish;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Metrics;
    }

})(typeof window !== 'undefined' ? window : global);
