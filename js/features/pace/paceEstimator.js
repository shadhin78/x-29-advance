/**
 * X-29 Module: features/pace/paceEstimator.js
 * Pace completion statistical estimator & required velocity calculator:
 * - Statistical estimation of velocity (reqPace, curPace)
 * - Projected finish date calculation
 * - Target subjects resolution for global, program, subject, and bundled goals
 * - Independent pace finish estimations
 */
(function (global) {
    'use strict';

    /**
     * Resolves and returns the Set of subject names targeted by a given pace goal.
     * Supports global aggregate/manual timelines, bundles, programs, and individual subjects.
     *
     * @param {Object} goal
     * @returns {Set<string>} Set of targeted subject names
     */
    function getTargetedSubjectsForGoal(goal) {
        let targetedSubjects = new Set();
        if (!goal) return targetedSubjects;

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        const parseDate = (typeof global.Utils !== 'undefined' && typeof global.Utils.parseDateSafe === 'function')
            ? global.Utils.parseDateSafe
            : (d => new Date(d));

        if (goal.type === 'global') {
            const isManual = goal.subjects || goal.secondaryPaces;
            if (isManual) {
                if (goal.subjects && Array.isArray(goal.subjects)) {
                    goal.subjects.forEach(s => targetedSubjects.add(s));
                }
                if (goal.secondaryPaces && Array.isArray(goal.secondaryPaces)) {
                    goal.secondaryPaces.forEach(pid => {
                        const g = (global.paceGoals || (typeof window !== 'undefined' && window.paceGoals) || []).find(x => x.id === pid);
                        if (g) {
                            if (g.type === 'bundle') {
                                if (g.subjects && Array.isArray(g.subjects)) g.subjects.forEach(s => targetedSubjects.add(s));
                                if (g.programs && Array.isArray(g.programs)) {
                                    const allSubs = typeof global.getAllSubjects === 'function' ? global.getAllSubjects() : [];
                                    allSubs.forEach(s => {
                                        if (g.programs.includes(s.program)) targetedSubjects.add(s.subject);
                                    });
                                }
                            } else if (g.type === 'subject') {
                                if (g.target) targetedSubjects.add(g.target);
                            } else if (g.type === 'program') {
                                const allSubs = typeof global.getAllSubjects === 'function' ? global.getAllSubjects() : [];
                                allSubs.forEach(s => {
                                    if (g.target === s.program) targetedSubjects.add(s.subject);
                                });
                            }
                        }
                    });
                }
            } else {
                const goalsList = global.paceGoals || (typeof window !== 'undefined' && window.paceGoals) || [];
                goalsList.forEach(g => {
                    if (g.id === goal.id) return;
                    if (!AppStateRef.globalStartDate || !AppStateRef.globalEndDate) return;
                    const gStart = g.startDate ? parseDate(g.startDate) : new Date(AppStateRef.globalStartDate);
                    const gEnd = g.deadline ? parseDate(g.deadline) : new Date(AppStateRef.globalEndDate);
                    gStart.setHours(0, 0, 0, 0);
                    gEnd.setHours(23, 59, 59, 999);
                    if (gEnd < AppStateRef.globalStartDate || gStart > AppStateRef.globalEndDate) return;

                    if (g.type === 'bundle') {
                        if (g.subjects && Array.isArray(g.subjects)) g.subjects.forEach(s => targetedSubjects.add(s));
                        if (g.programs && Array.isArray(g.programs)) {
                            const allSubs = typeof global.getAllSubjects === 'function' ? global.getAllSubjects() : [];
                            allSubs.forEach(s => {
                                if (g.programs.includes(s.program)) targetedSubjects.add(s.subject);
                            });
                        }
                    } else if (g.type === 'subject') {
                        if (g.target) targetedSubjects.add(g.target);
                    } else if (g.type === 'program') {
                        const allSubs = typeof global.getAllSubjects === 'function' ? global.getAllSubjects() : [];
                        allSubs.forEach(s => {
                            if (g.target === s.program) targetedSubjects.add(s.subject);
                        });
                    }
                });
            }
        } else if (goal.type === 'bundle') {
            if (goal.subjects && Array.isArray(goal.subjects)) {
                goal.subjects.forEach(sub => targetedSubjects.add(sub));
            }
            if (goal.programs && Array.isArray(goal.programs)) {
                const allSubs = typeof global.getAllSubjects === 'function' ? global.getAllSubjects() : [];
                allSubs.forEach(s => {
                    if (goal.programs.includes(s.program)) targetedSubjects.add(s.subject);
                });
            }
        } else if (goal.type === 'subject') {
            if (goal.target) targetedSubjects.add(goal.target);
        } else if (goal.type === 'program') {
            const allSubs = typeof global.getAllSubjects === 'function' ? global.getAllSubjects() : [];
            allSubs.forEach(s => {
                if (s.program === goal.target) targetedSubjects.add(s.subject);
            });
        }
        return targetedSubjects;
    }

    /**
     * Calculates complete, accurate velocity and finish date statistics for a pace goal without NaN/null errors.
     *
     * @param {Object} goal
     * @param {Object} [subjectStats={}]
     * @returns {Object|null}
     */
    function calculatePaceGoalStats(goal, subjectStats) {
        if (!goal) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const msPerDay = 1000 * 60 * 60 * 24;

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        const parseDate = (typeof global.Utils !== 'undefined' && typeof global.Utils.parseDateSafe === 'function')
            ? global.Utils.parseDateSafe
            : (d => new Date(d));
        const formatDate = (typeof global.Utils !== 'undefined' && typeof global.Utils.formatDateResponsive === 'function')
            ? global.Utils.formatDateResponsive
            : (d => d ? new Date(d).toLocaleDateString('en-GB') : '');

        // Safety fallback: ensure subjectStats contains objects with totalChapters
        if (!subjectStats || Object.keys(subjectStats).length === 0 || typeof Object.values(subjectStats)[0] !== 'object' || Object.values(subjectStats)[0] === null || !('totalChapters' in (Object.values(subjectStats)[0] || {}))) {
            if (global.lastSubjectStats && Object.keys(global.lastSubjectStats).length > 0 && typeof Object.values(global.lastSubjectStats)[0] === 'object' && ('totalChapters' in (Object.values(global.lastSubjectStats)[0] || {}))) {
                subjectStats = global.lastSubjectStats;
            } else if (typeof global.updateMetrics === 'function') {
                global.updateMetrics();
                subjectStats = global.lastSubjectStats || {};
            } else {
                subjectStats = subjectStats || {};
            }
        }

        const targetedSubjects = getTargetedSubjectsForGoal(goal);

        let total = 0;
        let completed = 0;

        targetedSubjects.forEach(sub => {
            if (subjectStats && subjectStats[sub] && typeof subjectStats[sub] === 'object' && typeof subjectStats[sub].totalChapters === 'number') {
                total += (subjectStats[sub].totalChapters || 0);
                completed += (subjectStats[sub].effectiveChapters || 0);
            } else if (global.lastSubjectStats && global.lastSubjectStats[sub] && typeof global.lastSubjectStats[sub] === 'object' && typeof global.lastSubjectStats[sub].totalChapters === 'number') {
                total += (global.lastSubjectStats[sub].totalChapters || 0);
                completed += (global.lastSubjectStats[sub].effectiveChapters || 0);
            } else {
                const sObj = typeof global.getAllSubjects === 'function' ? global.getAllSubjects().find(s => s.subject === sub) : null;
                if (sObj) {
                    total += (sObj.chapters || 0);
                }
            }
        });

        total = isNaN(total) ? 0 : Math.max(0, total);
        completed = isNaN(completed) ? 0 : Math.max(0, completed);
        const remaining = Math.max(0, total - completed);

        const defaultPlanStart = (AppStateRef && AppStateRef.PLAN_START_DATE) ? AppStateRef.PLAN_START_DATE : '2026-01-01';
        const startDate = goal.startDate ? parseDate(goal.startDate) : new Date(defaultPlanStart);
        const targetDate = goal.deadline ? parseDate(goal.deadline) : new Date();
        startDate.setHours(0, 0, 0, 0);
        targetDate.setHours(23, 59, 59, 999);

        const totalDays = Math.max(1, Math.ceil((targetDate - startDate) / msPerDay));
        const daysElapsed = Math.floor((today - startDate) / msPerDay) + 1;
        const daysRemaining = Math.max(0, Math.ceil((targetDate - today) / msPerDay));

        let reqPaceVal = 0;
        let curPaceVal = 0;

        if (total > 0) {
            if (today < startDate) {
                reqPaceVal = total / totalDays;
                curPaceVal = 0;
            } else if (today > targetDate) {
                reqPaceVal = remaining > 0 ? remaining : 0;
                curPaceVal = completed / Math.max(1, daysElapsed);
            } else {
                reqPaceVal = remaining > 0 ? remaining / Math.max(1, daysRemaining) : 0;
                curPaceVal = completed / Math.max(1, daysElapsed);
            }
        }

        reqPaceVal = isNaN(reqPaceVal) ? 0 : reqPaceVal;
        curPaceVal = isNaN(curPaceVal) ? 0 : curPaceVal;

        let finishDisplay = '';
        let timeGoalCountdownStr = '';
        let estDaysNeededStr = '<span class="opacity-50 font-normal">Unknown</span>';
        let diffDaysTG = Math.ceil((targetDate - today) / msPerDay);
        let projectedDate = new Date(today);

        if (total === 0) {
            finishDisplay = '<span class="opacity-50">No Target</span>';
        } else if (remaining <= 0) {
            finishDisplay = '<span class="text-emerald-400">Finished</span>';
            timeGoalCountdownStr = '<span class="text-emerald-400">Done</span>';
            estDaysNeededStr = '<span class="text-emerald-400">0 Days</span>';
        } else {
            if (curPaceVal <= 0) {
                if (today < startDate) finishDisplay = '<span class="text-blue-400 font-bold">Future</span>';
                else if (today > targetDate) finishDisplay = '<span class="text-red-400 font-bold">Overdue</span>';
                else finishDisplay = '<span class="opacity-50">No Data</span>';
            } else {
                const daysToFinish = remaining / curPaceVal;
                projectedDate.setDate(today.getDate() + Math.ceil(daysToFinish));
                finishDisplay = formatDate(projectedDate);
                estDaysNeededStr = `<span class="text-orange-400">${Math.ceil(daysToFinish)} Days Needed</span>`;
            }

            if (diffDaysTG > 0) timeGoalCountdownStr = `${diffDaysTG} Days Left`;
            else if (diffDaysTG === 0) timeGoalCountdownStr = `<span class="text-orange-400">Due Today</span>`;
            else timeGoalCountdownStr = `<span class="text-red-400">${Math.abs(diffDaysTG)} Days Overdue</span>`;
        }

        return {
            total,
            completed,
            remaining,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            startDate,
            targetDate,
            totalDays,
            daysElapsed,
            daysRemaining,
            reqPaceVal,
            curPaceVal,
            reqPace: reqPaceVal.toFixed(2),
            curPace: curPaceVal.toFixed(2),
            finishDisplay,
            timeGoalCountdownStr,
            estDaysNeededStr,
            diffDaysTG,
            projectedDate,
            targetedSubjects
        };
    }

    /**
     * Calculates projected finish date across independent active paces.
     *
     * @returns {string} Formatted finish description
     */
    function calculateIndependentEstFinish() {
        const subjectStats = global.lastSubjectStats || (typeof global.updateMetrics === 'function' ? (global.updateMetrics(), global.lastSubjectStats) : {});
        const allSubs = typeof global.getAllSubjects === 'function' ? global.getAllSubjects() : [];
        const uniqueSubs = Array.from(new Set(allSubs.map(s => s.subject)));

        let totalRemaining = 0;
        let totalPace = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const msPerDay = 1000 * 60 * 60 * 24;

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        const syllabusStructure = global.syllabusStructure || (AppStateRef && AppStateRef.syllabusStructure) || {};
        const tracksList = global.tracks || (AppStateRef && AppStateRef.tracks) || [];
        const dashboardConfig = global.dashboardConfig || (AppStateRef && AppStateRef.dashboardConfig) || {};

        uniqueSubs.forEach(subjectName => {
            const sObj = allSubs.find(s => s.subject === subjectName);
            if (!sObj) return;

            // Find track ID for this subject
            let trackId = null;
            for (const tid in syllabusStructure) {
                if (Array.isArray(syllabusStructure[tid]) && syllabusStructure[tid].some(x => x.subject === subjectName)) {
                    trackId = tid;
                    break;
                }
            }

            // Check if subject matches current filter
            let matchesFilter = false;
            const currentFilter = AppStateRef.currentFilter || 'All';
            if (currentFilter === 'All') {
                matchesFilter = true;
            } else {
                const isTrack = tracksList.some(t => t.name === currentFilter || t.id === currentFilter);
                const allProgs = typeof global.getAllPrograms === 'function' ? global.getAllPrograms() : [];
                const isProgram = Array.from(new Set(allProgs.map(p => p.name || p))).includes(currentFilter);

                if (isTrack) {
                    matchesFilter = (trackId === currentFilter || (tracksList.find(t => t.id === trackId)?.name === currentFilter));
                } else if (isProgram) {
                    matchesFilter = (sObj.program === currentFilter);
                } else {
                    matchesFilter = (subjectName === currentFilter);
                }
            }

            if (matchesFilter) {
                const isTrackPaceEnabled = trackId && dashboardConfig.independentPaces?.tracks?.[trackId] === true;
                const isProgPaceEnabled = sObj.program && dashboardConfig.independentPaces?.programs?.[sObj.program] === true;
                const isSubPaceEnabled = dashboardConfig.independentPaces?.subjects?.[subjectName] === true;

                if (isTrackPaceEnabled || isProgPaceEnabled || isSubPaceEnabled) {
                    const stats = subjectStats[subjectName];
                    if (stats) {
                        const rem = Math.max(0, stats.totalChapters - stats.effectiveChapters);
                        totalRemaining += rem;
                        totalPace += (stats.actualPace || 0);
                    }
                }
            }
        });

        if (totalPace <= 0) {
            return '--';
        }

        const daysNeeded = Math.ceil(totalRemaining / totalPace);
        const projectedDate = new Date(today.getTime() + daysNeeded * msPerDay);
        const finishDateStr = projectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return `${finishDateStr} (${daysNeeded} Days @ ${totalPace.toFixed(2)} Ch/Day)`;
    }

    // Attach to global scope
    const PaceEstimator = {
        getTargetedSubjectsForGoal,
        calculatePaceGoalStats,
        calculateIndependentEstFinish
    };

    global.PaceEstimator = PaceEstimator;
    global.getTargetedSubjectsForGoal = getTargetedSubjectsForGoal;
    global.calculatePaceGoalStats = calculatePaceGoalStats;
    global.calculateIndependentEstFinish = calculateIndependentEstFinish;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PaceEstimator;
    }
})(typeof window !== 'undefined' ? window : globalThis);
