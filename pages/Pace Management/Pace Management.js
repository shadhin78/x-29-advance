/**
 * Pace Management Page Module (pages/Pace Management/Pace Management.js)
 * Canonical single source of truth for Pace Management logic, custom goals,
 * timeline bundling, pace trend charting, and progress calculations.
 */

(function () {
    'use strict';

    /**
     * Page Lifecycle & Manager
     */
    const PaceManagementPage = {
        isMounted: false,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            // 1. Sync global baseline & pace metrics if available
            if (typeof window.updateMetrics === 'function') {
                window.updateMetrics();
            }

            // 2. Initialize Add Goal form state and checklist
            if (typeof window.togglePaceBundleType === 'function') {
                window.togglePaceBundleType();
            }

            // 3. Render active timelines
            if (typeof window.renderPaceGoals === 'function') {
                const subjectStats = window.lastSubjectStats || (typeof window.updateMetrics === 'function' ? (window.updateMetrics(), window.lastSubjectStats) : {});
                window.renderPaceGoals(subjectStats || {});
            }
        },

        destroy: function () {
            this.isMounted = false;

            // Safely close any pace-related modals if open when navigating away
            if (typeof window.closeModal === 'function') {
                const modals = ['edit-pace-modal', 'pace-trend-modal', 'goal-details-modal', 'pace-candle-modal'];
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

    /**
     * Calculates complete, accurate statistics for a single pace goal without NaN/null errors.
     */
    window.calculatePaceGoalStats = function (goal, subjectStats) {
        if (!goal) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const msPerDay = 1000 * 60 * 60 * 24;

        // Safety fallback: ensure subjectStats contains objects with totalChapters
        if (!subjectStats || Object.keys(subjectStats).length === 0 || typeof Object.values(subjectStats)[0] !== 'object' || Object.values(subjectStats)[0] === null || !('totalChapters' in (Object.values(subjectStats)[0] || {}))) {
            if (window.lastSubjectStats && Object.keys(window.lastSubjectStats).length > 0 && typeof Object.values(window.lastSubjectStats)[0] === 'object' && ('totalChapters' in (Object.values(window.lastSubjectStats)[0] || {}))) {
                subjectStats = window.lastSubjectStats;
            } else if (typeof updateMetrics === 'function') {
                updateMetrics();
                subjectStats = window.lastSubjectStats || {};
            } else {
                subjectStats = subjectStats || {};
            }
        }

        const targetedSubjects = typeof window.getTargetedSubjectsForGoal === 'function'
            ? window.getTargetedSubjectsForGoal(goal)
            : new Set();

        let total = 0;
        let completed = 0;

        targetedSubjects.forEach(sub => {
            if (subjectStats && subjectStats[sub] && typeof subjectStats[sub] === 'object' && typeof subjectStats[sub].totalChapters === 'number') {
                total += (subjectStats[sub].totalChapters || 0);
                completed += (subjectStats[sub].effectiveChapters || 0);
            } else if (window.lastSubjectStats && window.lastSubjectStats[sub] && typeof window.lastSubjectStats[sub] === 'object' && typeof window.lastSubjectStats[sub].totalChapters === 'number') {
                total += (window.lastSubjectStats[sub].totalChapters || 0);
                completed += (window.lastSubjectStats[sub].effectiveChapters || 0);
            } else {
                const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
                if (sObj) {
                    total += (sObj.chapters || 0);
                }
            }
        });

        total = isNaN(total) ? 0 : Math.max(0, total);
        completed = isNaN(completed) ? 0 : Math.max(0, completed);
        const remaining = Math.max(0, total - completed);

        const startDate = goal.startDate ? Utils.parseDateSafe(goal.startDate) : new Date(AppState.PLAN_START_DATE);
        const targetDate = Utils.parseDateSafe(goal.deadline);
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
                finishDisplay = Utils.formatDateResponsive(projectedDate);
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
    };

    /**
     * Renders active pace goals grid.
     */
    window.renderPaceGoals = function (subjectStats) {
        const container = document.getElementById('pace-goals-container');
        if (!container) return;
        if (!window.paceGoals || window.paceGoals.length === 0) {
            container.innerHTML = '<div class="col-span-full py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl"><span class="text-2xl mb-2 grayscale opacity-50">🎯</span><p class="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">No custom pace goals set. Add one below to track specific deadlines.</p></div>';
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';
        window.paceGoals.forEach(goal => {
            const stats = window.calculatePaceGoalStats(goal, subjectStats);
            if (!stats) return;

            const {
                total, completed, remaining, percentage,
                startDate, targetDate, daysElapsed,
                reqPaceVal, curPaceVal, reqPace, curPace,
                finishDisplay, timeGoalCountdownStr, estDaysNeededStr
            } = stats;

            const isBehind = remaining > 0 && today >= startDate && curPaceVal < reqPaceVal;
            const reqColor = isBehind ? 'text-red-500' : 'text-emerald-500';
            const reqBg = isBehind ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';

            let isActiveFilter = false;
            if (AppState.currentFilter !== 'All') {
                const sObj = window.getAllSubjects().find(s => s.subject === AppState.currentFilter);
                const filterProg = sObj ? sObj.program : AppState.currentFilter;

                if (goal.type === 'bundle') {
                    if (goal.subjects && (goal.subjects.includes(AppState.currentFilter) || goal.program === AppState.currentFilter)) isActiveFilter = true;
                    if (goal.programs && (goal.programs.includes(AppState.currentFilter) || goal.programs.includes(filterProg))) isActiveFilter = true;
                } else if (goal.type === 'program' && goal.target === AppState.currentFilter) {
                    isActiveFilter = true;
                } else if (goal.type === 'subject' && goal.target === AppState.currentFilter) {
                    isActiveFilter = true;
                } else if (goal.type === 'global') {
                    isActiveFilter = true;
                }
            } else if (goal.type === 'global') {
                isActiveFilter = true;
            }

            let goalColorClass = 'bg-indigo-500';
            if (goal.type === 'program') goalColorClass = 'bg-violet-500';
            if (goal.type === 'bundle') goalColorClass = 'bg-orange-500';
            if (goal.type === 'global') goalColorClass = 'bg-blue-500';

            let subText = '';
            if (goal.type === 'bundle') {
                if (goal.subjects && goal.subjects.length > 0) subText = `<div class="text-[8px] font-bold text-slate-500 dark:text-slate-400 mt-1 line-clamp-1" title="${goal.subjects.join(', ')}">${goal.subjects.join(', ')}</div>`;
                else if (goal.programs && goal.programs.length > 0) subText = `<div class="text-[8px] font-bold text-violet-500 dark:text-violet-400 mt-1 line-clamp-1" title="${goal.programs.join(', ')}">${goal.programs.join(', ')}</div>`;
            } else if (goal.type === 'global') {
                const isManual = goal.subjects || goal.secondaryPaces;
                if (isManual) subText = `<div class="text-[8px] font-bold text-blue-500 dark:text-blue-400 mt-1 line-clamp-1">Manual Global Target</div>`;
                else subText = `<div class="text-[8px] font-bold text-blue-500 dark:text-blue-400 mt-1 line-clamp-1">Aggregates explicitly targeted subjects</div>`;
            }

            html += `
                    <div class="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-[1.25rem] border ${isActiveFilter ? 'border-orange-500 shadow-md scale-[1.02]' : 'border-slate-200 dark:border-slate-700 shadow-sm'} relative group hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                        ${isActiveFilter ? '<div class="absolute -top-2.5 right-4 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">Active Timeline</div>' : ''}
                        <div class="absolute top-3.5 right-3.5 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="window.openPaceTrendModal('${goal.id}')" class="text-slate-300 hover:text-indigo-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all" title="View Pace Trend Chart"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1-1H5a1 1 0 01-1-1V4z"></path></svg></button>
                            <button onclick="window.openGoalDetailsModal('${goal.id}')" class="text-slate-300 hover:text-emerald-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all" title="View Target Details"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></button>
                            <button onclick="window.openEditPaceModal('${goal.id}')" class="text-slate-300 hover:text-blue-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all" title="Edit Goal Dates"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                            <button onclick="window.requestDeletePaceGoal('${goal.id}')" class="text-slate-300 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all" title="Remove Goal"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                        <div class="mb-3 pr-20">
                            <div class="flex items-center space-x-1.5 mb-1">
                                <div class="w-1.5 h-1.5 rounded-full ${goalColorClass}"></div>
                                <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">${goal.type} Goal</span>
                            </div>
                            <h4 class="font-black text-sm md:text-base text-slate-800 dark:text-slate-100 truncate tracking-tight">${goal.target}</h4>
                            <p class="text-[9px] font-bold text-slate-500 tracking-wider mt-0.5">Timeline: <span class="text-indigo-500 dark:text-indigo-400">${Utils.formatDateResponsive(startDate)}</span> - <span class="text-orange-500">${Utils.formatDateResponsive(targetDate)}</span></p>
                            ${subText}
                        </div>
                        
                        <div>
                            <div class="flex justify-between items-end mb-1">
                                <span class="text-[9px] font-bold text-slate-400">${Math.round(completed)} / ${total} Ch</span>
                                <span class="text-[9px] font-black text-slate-500">${percentage}%</span>
                            </div>
                            <div class="w-full bg-slate-100 dark:bg-slate-700/50 h-1.5 rounded-full overflow-hidden mb-4 border border-slate-200/50 dark:border-slate-600/30">
                                <div class="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-700" style="width: ${percentage}%"></div>
                            </div>

                            <div class="grid grid-cols-2 gap-2">
                                <div class="p-2 rounded-xl ${reqBg} border flex flex-col justify-between">
                                    <div>
                                        <span class="block text-[8px] uppercase tracking-widest font-black ${reqColor} opacity-80 mb-0.5">Req Pace</span>
                                        <div class="font-black text-xs md:text-sm ${reqColor}">${reqPace} <span class="text-[8px] opacity-70">ch/d</span></div>
                                    </div>
                                    <div class="text-[9px] font-black ${reqColor} mt-1.5 uppercase tracking-widest">${timeGoalCountdownStr}</div>
                                </div>
                                <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                                    <div>
                                        <span class="block text-[8px] uppercase tracking-widest font-black text-slate-500 opacity-80 mb-0.5">Cur Pace</span>
                                        <div class="font-black text-xs md:text-sm text-slate-700 dark:text-slate-300">${curPace} <span class="text-[8px] opacity-70">ch/d</span></div>
                                    </div>
                                    <div class="text-[9px] font-black text-emerald-500 mt-1.5 uppercase tracking-widest">${Utils.formatDaysPassed(Math.max(0, daysElapsed))} Passed</div>
                                </div>
                                <div class="col-span-2 p-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 border border-slate-800 flex justify-between items-center shadow-inner">
                                    <div class="flex flex-col">
                                        <span class="text-[8px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Est. Finish</span>
                                        <span class="text-[9px] font-black mt-0.5">${estDaysNeededStr}</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <div class="font-black text-[10px] md:text-xs text-white text-right">${finishDisplay}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
        });
        container.innerHTML = html;
    };

    /**
     * Toggles form display according to selected bundle type.
     */
    window.togglePaceBundleType = function () {
        const typeEl = document.getElementById('add-pace-bundle-type');
        if (!typeEl) return;
        const bType = typeEl.value;
        const nameContainer = document.getElementById('add-pace-name-container');
        const checklistSection = document.getElementById('add-pace-checklist-section');
        const checklistLabel = document.getElementById('add-pace-checklist-label');

        if (bType === 'global') {
            if (nameContainer) nameContainer.classList.add('hidden');
            if (checklistSection) checklistSection.classList.remove('hidden');
            if (checklistLabel) checklistLabel.textContent = "Select Subjects & Secondary Paces";
            window.updatePaceSubjects();
        } else {
            if (nameContainer) nameContainer.classList.remove('hidden');
            if (checklistSection) checklistSection.classList.remove('hidden');

            if (checklistLabel) {
                if (bType === 'subjects') {
                    checklistLabel.textContent = "Select Subjects to Include (Organized by Program)";
                } else {
                    checklistLabel.textContent = "Select Entire Programs to Include";
                }
            }
            window.updatePaceSubjects();
        }
    };

    /**
     * Updates the checklist container with subjects/programs.
     */
    window.updatePaceSubjects = function () {
        const typeEl = document.getElementById('add-pace-bundle-type');
        if (!typeEl) return;
        const bType = typeEl.value;
        const container = document.getElementById('add-pace-subjects-container');
        if (!container) return;

        let html = '';

        if (bType === 'subjects') {
            window.tracks.forEach(track => {
                if (window.customPrograms[track.id]) {
                    window.customPrograms[track.id].forEach(prog => {
                        const progName = prog.name || prog;
                        const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                        if (subs.length > 0) {
                            html += `
                                    <details class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                                        <summary class="cursor-pointer font-black text-[10px] md:text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300 p-3 outline-none select-none list-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-95 rounded-xl transition-all [&::-webkit-details-marker]:hidden">
                                            <div class="flex items-center space-x-2">
                                                <span>${progName}</span>
                                                <span class="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md text-[8px]">${subs.length} Subjects</span>
                                            </div>
                                            <svg class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </summary>
                                        <div class="p-3 pt-0 border-t border-slate-100 dark:border-slate-700">
                                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                                    `;
                            subs.forEach(s => {
                                let displaySub = s.subject.replace(progName + ' - ', '').replace(progName + ' ', '');
                                const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(s.subject)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                                if (isPassed) {
                                    html += `
                                                <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${s.subject} (Passed - cannot be added to new pace)">
                                                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                        <input type="checkbox" value="${s.subject}" disabled class="pace-subject-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                                        <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through" title="${s.subject}">${displaySub}</del>
                                                    </div>
                                                    <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                                </label>`;
                                } else {
                                    html += `
                                                <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-400 active:scale-95 transition-all shadow-sm group/label">
                                                    <input type="checkbox" value="${s.subject}" class="pace-subject-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all">
                                                    <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate group-hover/label:text-orange-600 dark:group-hover/label:text-orange-400 transition-colors" title="${s.subject}">${displaySub}</span>
                                                </label>`;
                                }
                            });
                            html += `
                                            </div>
                                        </div>
                                    </details>`;
                        }
                    });
                }
            });
        } else if (bType === 'programs') {
            html += `<div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 w-full">`;
            window.tracks.forEach(track => {
                if (window.customPrograms[track.id] && window.customPrograms[track.id].length > 0) {
                    window.customPrograms[track.id].forEach(p => {
                        const pName = p.name || p;
                        const isProgPassed = Boolean(window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(pName));
                        if (isProgPassed) {
                            html += `
                                    <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${pName} (Passed - cannot be added to new pace)">
                                        <div class="flex items-center space-x-2 min-w-0 flex-1">
                                            <input type="checkbox" value="${pName}" disabled class="pace-subject-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                            <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through">${pName}</del>
                                        </div>
                                        <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                    </label>`;
                        } else {
                            html += `
                                    <label class="flex items-center space-x-2 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-400 active:scale-95 transition-all shadow-sm">
                                        <input type="checkbox" value="${pName}" class="pace-subject-cb form-checkbox h-4 w-4 text-violet-500 rounded border-slate-300 focus:ring-violet-500 accent-violet-500 transition-all">
                                        <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate">${pName}</span>
                                    </label>`;
                        }
                    });
                }
            });
            html += `</div>`;
        } else if (bType === 'global') {
            html += `<div class="mb-4"><h5 class="text-[10px] font-black uppercase text-slate-400 mb-2">Subjects</h5>`;
            window.tracks.forEach(track => {
                if (window.customPrograms[track.id]) {
                    window.customPrograms[track.id].forEach(prog => {
                        const progName = prog.name || prog;
                        const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                        if (subs.length > 0) {
                            html += `
                                    <details class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group mb-2">
                                        <summary class="cursor-pointer font-black text-[10px] md:text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300 p-3 outline-none select-none list-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-95 rounded-xl transition-all [&::-webkit-details-marker]:hidden">
                                            <div class="flex items-center space-x-2">
                                                <span>${progName}</span>
                                                <span class="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md text-[8px]">${subs.length} Subjects</span>
                                            </div>
                                            <svg class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </summary>
                                        <div class="p-3 pt-0 border-t border-slate-100 dark:border-slate-700">
                                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                                    `;
                            subs.forEach(s => {
                                let displaySub = s.subject.replace(progName + ' - ', '').replace(progName + ' ', '');
                                const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(s.subject)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                                if (isPassed) {
                                    html += `
                                                <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${s.subject} (Passed - cannot be added to new pace)">
                                                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                        <input type="checkbox" value="${s.subject}" disabled class="global-subject-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                                        <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through" title="${s.subject}">${displaySub}</del>
                                                    </div>
                                                    <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                                </label>`;
                                } else {
                                    html += `
                                                <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-400 active:scale-95 transition-all shadow-sm group/label">
                                                    <input type="checkbox" value="${s.subject}" class="global-subject-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all">
                                                    <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate group-hover/label:text-orange-600 dark:group-hover/label:text-orange-400 transition-colors" title="${s.subject}">${displaySub}</span>
                                                </label>`;
                                }
                            });
                            html += `
                                            </div>
                                        </div>
                                    </details>`;
                        }
                    });
                }
            });
            html += `</div>`;

            html += `<div><h5 class="text-[10px] font-black uppercase text-slate-400 mb-2">Secondary Paces</h5>`;
            const otherGoals = window.paceGoals.filter(g => g.type !== 'global');
            if (otherGoals.length > 0) {
                html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
                otherGoals.forEach(g => {
                    html += `
                            <label class="flex items-center space-x-2 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 active:scale-95 transition-all shadow-sm">
                                <input type="checkbox" value="${g.id}" class="global-pace-cb form-checkbox h-4 w-4 text-indigo-500 rounded border-slate-300 focus:ring-indigo-500 accent-indigo-500 transition-all">
                                <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${g.target}">${g.target}</span>
                            </label>`;
                });
                html += `</div>`;
            } else {
                html += `<span class="text-[10px] text-slate-500">No other pace goals available to link.</span>`;
            }
            html += `</div>`;
        }

        container.innerHTML = html || '<span class="text-[10px] text-slate-500 col-span-full">No items found.</span>';
    };

    /**
     * Adds a new pace goal to window.paceGoals.
     */
    window.addPaceGoal = function () {
        const bType = document.getElementById('add-pace-bundle-type').value;
        const name = bType === 'global' ? 'Global Overall' : document.getElementById('add-pace-name').value.trim();
        const startStr = document.getElementById('add-pace-start').value;
        const dateStr = document.getElementById('add-pace-date').value;

        if (bType !== 'global' && !name) return showToast("Please provide a Goal Name.", "error");
        if (!startStr) return showToast("Please select a target start date.", "error");
        if (!dateStr) return showToast("Please select a target deadline date.", "error");

        const startDate = Utils.parseDateSafe(startStr);
        const targetDate = Utils.parseDateSafe(dateStr);
        if (targetDate <= startDate) return showToast("Target deadline must be after the start date.", "error");

        if (bType === 'global') {
            if (window.paceGoals.some(g => g.type === 'global')) return showToast("A Global Pace Goal already exists.", "error");

            const subjCheckboxes = document.querySelectorAll('.global-subject-cb:checked');
            const secCheckboxes = document.querySelectorAll('.global-pace-cb:checked');

            const selectedSubjects = Array.from(subjCheckboxes).map(cb => cb.value).filter(sub => {
                const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
                const progName = sObj ? sObj.program : '';
                const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(sub)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                return !isPassed;
            });
            const selectedSec = Array.from(secCheckboxes).map(cb => cb.value);

            window.paceGoals.push({
                id: 'pg_' + Date.now(),
                type: 'global',
                target: name,
                startDate: startStr,
                deadline: dateStr,
                subjects: selectedSubjects,
                secondaryPaces: selectedSec
            });
        } else {
            const checkboxes = document.querySelectorAll('.pace-subject-cb:checked');
            const selectedItems = Array.from(checkboxes).map(cb => cb.value);

            if (selectedItems.length === 0) return showToast("Please select at least one item.", "error");
            if (window.paceGoals.some(g => g.target === name)) return showToast("A custom goal with this name already exists.", "error");

            let filteredItems = [];
            if (bType === 'subjects') {
                filteredItems = selectedItems.filter(sub => {
                    const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
                    const progName = sObj ? sObj.program : '';
                    const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(sub)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                    return !isPassed;
                });
                if (filteredItems.length === 0) return showToast("Selected subjects are already passed and cannot be added to a new pace.", "error");
            } else {
                filteredItems = selectedItems.filter(pName => {
                    const isPassed = Boolean(window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(pName));
                    return !isPassed;
                });
                if (filteredItems.length === 0) return showToast("Selected programs are already passed and cannot be added to a new pace.", "error");
            }

            let newGoal = {
                id: 'pg_' + Date.now(),
                type: 'bundle',
                target: name,
                startDate: startStr,
                deadline: dateStr
            };

            if (bType === 'subjects') {
                newGoal.subjects = filteredItems;
            } else {
                newGoal.programs = filteredItems;
            }

            window.paceGoals.push(newGoal);
        }

        document.getElementById('add-pace-name').value = '';
        document.getElementById('add-pace-start').value = '';
        document.getElementById('add-pace-date').value = '';
        FirebaseService.saveToCloud(); renderUI(); showToast("Custom Pace Goal added!", "success");
    };

    /**
     * Request confirmation before deleting a pace goal.
     */
    window.requestDeletePaceGoal = function (id) {
        window.openConfirmModal("Delete Pace Goal", "Are you sure you want to remove this target timeline?", () => window.deletePaceGoal(id));
    };

    /**
     * Deletes a pace goal and updates active configs.
     */
    window.deletePaceGoal = function (id) {
        if (typeof window.recordItemDeletion === 'function') {
            window.recordItemDeletion(id);
        }
        window.paceGoals = window.paceGoals.filter(g => g.id !== id);
        if (window.dashboardConfig && window.dashboardConfig.activePaceGoalId === id) {
            const defaultGoal = window.paceGoals.find(g => g.id === 'global-timeline') || window.paceGoals[0];
            window.dashboardConfig.activePaceGoalId = defaultGoal ? defaultGoal.id : null;
        }
        FirebaseService.saveToCloud(); renderUI(); showToast("Pace Goal deleted.", "success");
    };

    /**
     * Opens modal to edit pace goal parameters.
     */
    window.openEditPaceModal = function (goalId) {
        const goal = window.paceGoals.find(g => g.id === goalId);
        if (!goal) return;
        window.editingPaceId = goalId;

        const nameContainer = document.getElementById('epm-name-container');
        const checklistSection = document.getElementById('epm-checklist-section');
        const nameInput = document.getElementById('edit-pace-name');
        const subjectsContainer = document.getElementById('edit-pace-subjects-container');

        if (goal.type === 'global') {
            nameContainer.classList.add('hidden');
            checklistSection.classList.remove('hidden');
            nameInput.value = goal.target;

            let html = '';
            html += `<div class="mb-4"><h5 class="text-[10px] font-black uppercase text-slate-400 mb-2">Subjects</h5>`;
            window.tracks.forEach(track => {
                if (window.customPrograms[track.id]) {
                    window.customPrograms[track.id].forEach(prog => {
                        const progName = prog.name || prog;
                        const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                        if (subs.length > 0) {
                            html += `<div class="mb-2"><div class="text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-1">${progName}</div><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
                            subs.forEach(s => {
                                const isChecked = (goal.subjects && goal.subjects.includes(s.subject)) ? 'checked' : '';
                                let displaySub = s.subject.replace(progName + ' - ', '').replace(progName + ' ', '');
                                const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(s.subject)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                                const isAlreadyInGoal = Boolean(goal.subjects && goal.subjects.includes(s.subject));

                                if (isPassed && !isAlreadyInGoal) {
                                    html += `
                                            <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${s.subject} (Passed - cannot be added to pace)">
                                                <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                    <input type="checkbox" value="${s.subject}" disabled class="edit-pace-subject-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                                    <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through" title="${s.subject}">${displaySub}</del>
                                                </div>
                                                <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                            </label>`;
                                } else if (isPassed && isAlreadyInGoal) {
                                    html += `
                                            <label class="flex items-center justify-between space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 active:scale-95 transition-all shadow-sm pace-passed-included-item" title="${s.subject} (Passed - currently included in this pace)">
                                                <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                    <input type="checkbox" value="${s.subject}" class="edit-pace-subject-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all" checked>
                                                    <del class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate line-through" title="${s.subject}">${displaySub}</del>
                                                </div>
                                                <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                            </label>`;
                                } else {
                                    html += `
                                            <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-sm">
                                                <input type="checkbox" value="${s.subject}" class="edit-pace-subject-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all" ${isChecked}>
                                                <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${s.subject}">${displaySub}</span>
                                            </label>`;
                                }
                            });
                            html += `</div></div>`;
                        }
                    });
                }
            });
            html += `</div>`;

            html += `<div><h5 class="text-[10px] font-black uppercase text-slate-400 mb-2">Secondary Paces</h5>`;
            const otherGoals = window.paceGoals.filter(g => g.type !== 'global');
            if (otherGoals.length > 0) {
                html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
                otherGoals.forEach(g => {
                    const isChecked = (goal.secondaryPaces && goal.secondaryPaces.includes(g.id)) ? 'checked' : '';
                    html += `
                            <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-sm">
                                <input type="checkbox" value="${g.id}" class="edit-pace-sec-cb form-checkbox h-4 w-4 text-indigo-500 rounded border-slate-300 focus:ring-indigo-500 accent-indigo-500 transition-all" ${isChecked}>
                                <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${g.target}">${g.target}</span>
                            </label>`;
                });
                html += `</div>`;
            } else {
                html += `<span class="text-[10px] text-slate-500">No other pace goals available.</span>`;
            }
            html += `</div>`;

            subjectsContainer.innerHTML = html;
        } else {
            nameContainer.classList.remove('hidden');
            checklistSection.classList.remove('hidden');
            nameInput.value = goal.target;

            let html = '';
            const isProgramTarget = goal.type === 'program' || (goal.type === 'bundle' && goal.programs);

            if (isProgramTarget) {
                html += `<div class="grid grid-cols-2 gap-2 w-full">`;
                const selectedProgs = goal.programs || (goal.type === 'program' ? [goal.target] : []);
                window.tracks.forEach(track => {
                    if (window.customPrograms[track.id]) {
                        window.customPrograms[track.id].forEach(p => {
                            const pName = p.name || p;
                            const isChecked = selectedProgs.some(sp => (sp.name || sp) === pName) ? 'checked' : '';
                            const isProgPassed = Boolean(window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(pName));
                            const isAlreadyInGoal = Boolean(selectedProgs.some(sp => (sp.name || sp) === pName));

                            if (isProgPassed && !isAlreadyInGoal) {
                                html += `
                                        <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${pName} (Passed - cannot be added to pace)">
                                            <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                <input type="checkbox" value="${pName}" disabled class="edit-pace-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                                <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through">${pName}</del>
                                            </div>
                                            <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                        </label>`;
                            } else if (isProgPassed && isAlreadyInGoal) {
                                html += `
                                        <label class="flex items-center justify-between space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 active:scale-95 transition-all shadow-sm pace-passed-included-item" title="${pName} (Passed - currently included in this pace)">
                                            <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                <input type="checkbox" value="${pName}" class="edit-pace-cb form-checkbox h-4 w-4 text-violet-500 rounded border-slate-300 focus:ring-violet-500 accent-violet-500 transition-all" checked>
                                                <del class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate line-through">${pName}</del>
                                            </div>
                                            <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                        </label>`;
                            } else {
                                html += `
                                        <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-sm">
                                            <input type="checkbox" value="${pName}" class="edit-pace-cb form-checkbox h-4 w-4 text-violet-500 rounded border-slate-300 focus:ring-violet-500 accent-violet-500 transition-all" ${isChecked}>
                                            <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate">${pName}</span>
                                        </label>`;
                            }
                        });
                    }
                });
                html += `</div>`;
            } else {
                const selectedSubs = goal.subjects || (goal.type === 'subject' ? [goal.target] : []);
                window.tracks.forEach(track => {
                    if (window.customPrograms[track.id]) {
                        window.customPrograms[track.id].forEach(prog => {
                            const progName = prog.name || prog;
                            const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                            if (subs.length > 0) {
                                html += `<div class="mb-2"><div class="text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-1">${progName}</div><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
                                subs.forEach(s => {
                                    const isChecked = selectedSubs.includes(s.subject) ? 'checked' : '';
                                    let displaySub = s.subject.replace(progName + ' - ', '').replace(progName + ' ', '');
                                    const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(s.subject)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                                    const isAlreadyInGoal = Boolean(selectedSubs.includes(s.subject));

                                    if (isPassed && !isAlreadyInGoal) {
                                        html += `
                                                <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${s.subject} (Passed - cannot be added to pace)">
                                                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                        <input type="checkbox" value="${s.subject}" disabled class="edit-pace-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                                        <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through" title="${s.subject}">${displaySub}</del>
                                                    </div>
                                                    <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                                </label>`;
                                    } else if (isPassed && isAlreadyInGoal) {
                                        html += `
                                                <label class="flex items-center justify-between space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 active:scale-95 transition-all shadow-sm pace-passed-included-item" title="${s.subject} (Passed - currently included in this pace)">
                                                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                        <input type="checkbox" value="${s.subject}" class="edit-pace-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all" checked>
                                                        <del class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate line-through" title="${s.subject}">${displaySub}</del>
                                                    </div>
                                                    <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                                </label>`;
                                    } else {
                                        html += `
                                                <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-sm">
                                                    <input type="checkbox" value="${s.subject}" class="edit-pace-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all" ${isChecked}>
                                                    <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${s.subject}">${displaySub}</span>
                                                </label>`;
                                    }
                                });
                                html += `</div></div>`;
                            }
                        });
                    }
                });
            }
            subjectsContainer.innerHTML = html || '<span class="text-[10px] text-slate-500">No items available.</span>';
        }

        document.getElementById('edit-pace-start').value = goal.startDate || '';
        document.getElementById('edit-pace-date').value = goal.deadline || '';
        openModal('edit-pace-modal');
    };

    /**
     * Saves changes made inside edit-pace-modal.
     */
    window.savePaceEdit = function () {
        if (!window.editingPaceId) return;
        const goal = window.paceGoals.find(g => g.id === window.editingPaceId);
        if (!goal) return;

        const startStr = document.getElementById('edit-pace-start').value;
        const deadStr = document.getElementById('edit-pace-date').value;
        if (!startStr || !deadStr) return showToast("Both dates are required", "error");
        if (new Date(deadStr) <= new Date(startStr)) return showToast("Deadline must be after start date", "error");

        if (goal.type === 'global') {
            const subjCheckboxes = document.querySelectorAll('.edit-pace-subject-cb:checked');
            const secCheckboxes = document.querySelectorAll('.edit-pace-sec-cb:checked');

            const selectedSubjects = Array.from(subjCheckboxes).map(cb => cb.value).filter(sub => {
                const wasAlreadyInGoal = goal.subjects && goal.subjects.includes(sub);
                if (wasAlreadyInGoal) return true;
                const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
                const progName = sObj ? sObj.program : '';
                const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(sub)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                return !isPassed;
            });
            const selectedSec = Array.from(secCheckboxes).map(cb => cb.value);

            goal.subjects = selectedSubjects;
            goal.secondaryPaces = selectedSec;
        } else if (goal.type !== 'global') {
            const name = document.getElementById('edit-pace-name').value.trim();
            if (!name) return showToast("Goal name is required.", "error");

            const checkboxes = document.querySelectorAll('.edit-pace-cb:checked');
            const selectedItems = Array.from(checkboxes).map(cb => cb.value);

            if (selectedItems.length === 0) return showToast("Please select at least one item.", "error");

            goal.target = name;
            const previousSubjects = goal.subjects || (goal.type === 'subject' ? [goal.target] : []);
            const previousPrograms = goal.programs || (goal.type === 'program' ? [goal.target] : []);

            goal.type = 'bundle';
            delete goal.subjects;
            delete goal.programs;

            const firstItem = selectedItems[0];
            let isProg = false;
            window.tracks.forEach(track => {
                if (window.customPrograms[track.id] && window.customPrograms[track.id].some(p => (p.name || p) === firstItem)) {
                    isProg = true;
                }
            });

            if (isProg) {
                goal.programs = selectedItems.filter(pName => {
                    const wasAlreadyInGoal = previousPrograms.some(sp => (sp.name || sp) === pName);
                    if (wasAlreadyInGoal) return true;
                    const isPassed = Boolean(window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(pName));
                    return !isPassed;
                });
            } else {
                goal.subjects = selectedItems.filter(sub => {
                    const wasAlreadyInGoal = previousSubjects.includes(sub);
                    if (wasAlreadyInGoal) return true;
                    const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
                    const progName = sObj ? sObj.program : '';
                    const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(sub)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                    return !isPassed;
                });
            }
        }

        goal.startDate = startStr;
        goal.deadline = deadStr;
        FirebaseService.saveToCloud(); renderUI(); closeModal('edit-pace-modal'); showToast("Pace Goal timeline updated!", "success");
    };

    /**
     * Opens breakdown modal for a specific pace goal.
     */
    window.openGoalDetailsModal = function (goalId) {
        const goal = window.paceGoals.find(g => g.id === goalId);
        if (!goal) return;

        if (!window.lastSubjectStats && typeof updateMetrics === 'function') {
            updateMetrics();
        }
        const subjectStats = window.lastSubjectStats || {};
        const stats = window.calculatePaceGoalStats(goal, subjectStats);
        if (!stats) return;

        const {
            total, completed, remaining, percentage,
            startDate, targetDate, reqPaceVal, curPaceVal,
            targetedSubjects
        } = stats;

        let scopeHtml = '';
        if (goal.type === 'global') {
            const isManual = goal.subjects || goal.secondaryPaces;
            if (isManual) {
                let detailText = `Manually mapped ${goal.subjects ? goal.subjects.length : 0} explicit Subjects and ${goal.secondaryPaces ? goal.secondaryPaces.length : 0} Secondary Paces.`;
                scopeHtml = `<div class="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-xl shadow-sm">${detailText}</div>`;
            } else {
                scopeHtml = `<div class="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-xl shadow-sm">Aggregates mapped subjects intersecting with the Global Timeline bounds.</div>`;
            }
        } else if (goal.type === 'bundle') {
            if (goal.subjects && goal.subjects.length > 0) {
                scopeHtml = `<div class="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 p-3 rounded-xl shadow-sm">Custom explicit selection of ${goal.subjects.length} subjects.</div>`;
            } else if (goal.programs && goal.programs.length > 0) {
                let pList = goal.programs.join(', ');
                scopeHtml = `<div class="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-3 rounded-xl shadow-sm">Programs Scoped: <span class="text-violet-600 dark:text-violet-400">${pList}</span></div>`;
            }
        } else if (goal.type === 'program') {
            scopeHtml = `<div class="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-3 rounded-xl shadow-sm">Program Scoped: <span class="text-violet-600 dark:text-violet-400">${goal.target}</span></div>`;
        }

        let subjectsListHtml = '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">';
        targetedSubjects.forEach(sub => {
            const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
            const subStat = (subjectStats && subjectStats[sub]) || { totalChapters: sObj ? (sObj.chapters || 0) : 0, effectiveChapters: 0 };
            const sChTotal = subStat.totalChapters || 0;
            const sChDone = Math.round(subStat.effectiveChapters || 0);
            const sPct = sChTotal > 0 ? Math.round((sChDone / sChTotal) * 100) : 0;
            const color = getSubjectColor(sub);
            const progName = sObj ? sObj.program : '';
            const displaySub = sub.replace(progName + ' - ', '').replace(progName + ' ', '');

            subjectsListHtml += `
                    <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-1.5 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                        <div class="flex justify-between items-start mb-0.5">
                            <div class="flex flex-col pr-2">
                                <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">${progName}</span>
                                <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight" title="${sub}"><div class="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-[1px]" style="background-color: ${color}"></div>${displaySub}</span>
                            </div>
                            <span class="text-[9px] md:text-[10px] font-black text-slate-500 shrink-0 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-700">${sChDone} / ${sChTotal}</span>
                        </div>
                        <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-auto">
                            <div class="h-full rounded-full transition-all duration-700 shadow-sm" style="width: ${sPct}%; background-color: ${color}"></div>
                        </div>
                    </div>`;
        });
        subjectsListHtml += '</div>';

        if (targetedSubjects.size === 0) subjectsListHtml = '<div class="p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl"><p class="text-xs font-bold text-slate-400">No subjects currently mapped or active in this scope.</p></div>';

        safeSetText('gdm-title', goal.target);
        safeSetText('gdm-dates', `Timeline: ${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} - ${targetDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`);

        safeSetText('gdm-stat-req', reqPaceVal.toFixed(2));
        safeSetText('gdm-stat-cur', curPaceVal.toFixed(2));
        safeSetText('gdm-stat-rem', remaining.toFixed(1));

        document.getElementById('gdm-scope-list').innerHTML = scopeHtml + subjectsListHtml;

        openModal('goal-details-modal');
    };

    /**
     * Opens modal for Pace Trend Burn-up chart.
     */
    window.openPaceTrendModal = function (goalId) {
        const globalGoal = window.paceGoals ? window.paceGoals.find(g => g.type === 'global') : null;
        const targetId = goalId || (globalGoal ? globalGoal.id : null);
        window.activeTrendGoalId = targetId;
        openModal('pace-trend-modal');
        window.renderPaceTrendChart(targetId);
        setTimeout(() => {
            if (window.paceTrendChartInstance) {
                window.paceTrendChartInstance.resize();
            }
        }, 320);
    };

    /**
     * Renders pace trend line chart for a specific goal inside pace-trend-modal.
     */
    window.renderPaceTrendChart = function (goalId) {
        let paceData = null;
        if (goalId && window.paceGoals) {
            const goal = window.paceGoals.find(g => g.id === goalId);
            if (goal) {
                const stats = window.calculatePaceGoalStats(goal, window.lastSubjectStats);
                if (stats) {
                    paceData = {
                        total: stats.total,
                        completed: stats.completed,
                        start: stats.startDate,
                        end: stats.targetDate,
                        today: new Date(),
                        reqPace: stats.reqPaceVal,
                        curPace: stats.curPaceVal,
                        projectedDate: stats.projectedDate,
                        subjects: Array.from(stats.targetedSubjects),
                        title: goal.target + " Trend",
                        description: "Burn-up comparison of Required vs Actual trajectories for " + goal.target + "."
                    };
                }
            }
        }

        if (!paceData) {
            if (!window.latestPaceData) return;
            paceData = {
                ...window.latestPaceData,
                title: "Pace Trend Analysis",
                description: "Burn-up comparison of Required vs Actual trajectories."
            };
        }

        const ctx = document.getElementById('paceTrendCanvas');
        if (!ctx) return;

        const { total, completed, reqPace, curPace, projectedDate, title, description } = paceData;

        safeSetText('ptm-title', title);
        safeSetText('ptm-desc', description);

        safeSetText('ptm-req-pace', reqPace.toFixed(2));
        safeSetText('ptm-act-pace', curPace.toFixed(2));

        let finishDisplay = '--';
        const finishEl = document.getElementById('ptm-est-finish');

        finishEl.classList.remove('text-red-500', 'text-orange-700', 'dark:text-orange-400', 'text-emerald-500');

        if (total > 0 && completed >= total) {
            finishEl.classList.add('text-emerald-500');
            finishDisplay = 'Finished';
        } else if (total > 0 && curPace > 0) {
            finishEl.classList.add('text-orange-700', 'dark:text-orange-400');
            finishDisplay = Utils.formatDateResponsive(projectedDate);
        } else {
            finishEl.classList.add('text-red-500');
        }
        safeSetHtml('ptm-est-finish', finishDisplay);

        const chartData = window.buildPaceChartDatasets(paceData);
        if (!chartData) return;

        if (window.paceTrendChartInstance) window.paceTrendChartInstance.destroy();
        window.paceTrendChartInstance = window.createOrUpdatePaceChart(ctx, chartData);
    };

    /**
     * Opens modal for Pace Candlestick chart.
     */
    window.openPaceCandleChartModal = function (goalId) {
        const goal = window.paceGoals.find(g => g.id === goalId);
        if (!goal) return;

        document.getElementById('pcm-target-name').textContent = goal.target;
        openModal('pace-candle-modal');

        // 1. Calculate subject completion map for subjects targeted by this goal
        const targetedSubjects = window.getTargetedSubjectsForGoal(goal);
        const subsList = Array.from(targetedSubjects);
        const subjectStats = window.lastSubjectStats || {};

        const startDate = goal.startDate ? Utils.parseDateSafe(goal.startDate) : new Date(AppState.PLAN_START_DATE);
        startDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const msPerDay = 1000 * 60 * 60 * 24;
        const daysElapsed = Math.max(1, Math.floor((today - startDate) / msPerDay) + 1);

        // Collect daily chapter completions accurately
        const dailyCompletedMap = new Map();
        let baselineCompleted = 0;

        if (window.passedItems) {
            subsList.forEach(sub => {
                const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
                const isFrozen = (window.passedItems.subjects && window.passedItems.subjects.includes(sub)) ||
                                 (window.passedItems.programs && sObj && window.passedItems.programs.includes(sObj.program));
                if (isFrozen && subjectStats[sub]) {
                    baselineCompleted += (subjectStats[sub].totalChapters || 0);
                }
            });
        }

        if (Array.isArray(AppState.tasks)) {
            AppState.tasks.forEach(t => {
                if (t.type !== 'study') return;
                const taskDate = getTaskDate(t);
                window.tracks.forEach(track => {
                    const key = track.id + 'Tasks';
                    if (Array.isArray(t[key])) {
                        t[key].forEach(b => {
                            if (b.completed && subsList.includes(b.subject)) {
                                const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === b.subject) : null;
                                const isFrozen = window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(b.subject)) || (window.passedItems.programs && sObj && window.passedItems.programs.includes(sObj.program)));
                                if (isFrozen) return;

                                let weight = 1;
                                const prog = window.getChapterWeeklyTargetProgress ? window.getChapterWeeklyTargetProgress(track.id, b.subject, b.chapter) : null;
                                if (prog && prog.isSizeBased && prog.total > 0) {
                                    weight = Math.min(1, prog.completed / prog.total);
                                }

                                let compDate = b.completedAt ? Utils.parseDateSafe(b.completedAt) : taskDate;
                                if (!compDate || isNaN(compDate.getTime())) compDate = taskDate;
                                if (!compDate || isNaN(compDate.getTime())) compDate = new Date(today);

                                const dayDate = new Date(compDate.getFullYear(), compDate.getMonth(), compDate.getDate());
                                const timeKey = dayDate.getTime();

                                dailyCompletedMap.set(timeKey, (dailyCompletedMap.get(timeKey) || 0) + weight);
                            }
                        });
                    }
                });
            });
        }

        let cumulativeAct = baselineCompleted;
        dailyCompletedMap.forEach((val, timeKey) => {
            if (timeKey < startDate.getTime()) {
                cumulativeAct += val;
            }
        });

        let dailyPaces = [];
        let currentDt = new Date(startDate);

        for (let i = 1; i <= daysElapsed; i++) {
            let compToday = dailyCompletedMap.get(currentDt.getTime()) || 0;
            cumulativeAct += compToday;
            let pace = cumulativeAct / i;
            dailyPaces.push({
                dayIdx: i,
                dateStr: currentDt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
                pace: pace,
                completedToday: compToday
            });
            currentDt.setDate(currentDt.getDate() + 1);
        }

        // 3. Group daily stats into intervals (if daysElapsed > 15) to maintain readable candles
        let intervals = [];
        let daysPerInterval = 1;
        if (daysElapsed > 15) {
            daysPerInterval = Math.ceil(daysElapsed / 10);
        }

        for (let k = 0; k < daysElapsed; k += daysPerInterval) {
            let chunk = dailyPaces.slice(k, k + daysPerInterval);
            if (chunk.length === 0) continue;

            let prevIdx = k - 1;
            let openVal = prevIdx >= 0 ? dailyPaces[prevIdx].pace : 0;
            let closeVal = chunk[chunk.length - 1].pace;

            let completedInChunk = chunk.reduce((sum, d) => sum + d.completedToday, 0);

            let maxPaceInChunk = Math.max(...chunk.map(d => d.pace));
            let minPaceInChunk = Math.min(...chunk.map(d => d.pace));

            let open = openVal;
            let close = closeVal;
            let high = Math.max(open, close, maxPaceInChunk) + (completedInChunk > 0 ? 0.05 * completedInChunk : 0.01);
            let low = Math.max(0, Math.min(open, close, minPaceInChunk) - (completedInChunk === 0 ? 0.02 : 0.005));

            let dateLabel = chunk[0].dateStr;
            if (chunk.length > 1) {
                dateLabel = `${chunk[0].dateStr} - ${chunk[chunk.length - 1].dateStr}`;
            }

            intervals.push({
                label: dateLabel,
                open: open,
                close: close,
                high: high,
                low: low,
                completed: Math.round(completedInChunk * 10) / 10
            });
        }

        // 4. Setup Chart.js
        const ctx = document.getElementById('paceCandleCanvas');
        if (!ctx) return;

        if (window.paceCandleChartInstance) {
            window.paceCandleChartInstance.destroy();
        }

        const canvasCtx = ctx.getContext('2d');
        const isMobile = window.innerWidth < 640;

        window.paceCandleChartInstance = new Chart(canvasCtx, {
            type: 'bar',
            data: {
                labels: intervals.map(item => item.label),
                datasets: [
                    {
                        label: 'Wick',
                        data: intervals.map(item => [item.low, item.high]),
                        backgroundColor: 'rgba(148, 163, 184, 0.7)',
                        borderColor: 'rgba(148, 163, 184, 0.7)',
                        borderWidth: 0,
                        barThickness: isMobile ? 1.5 : 2.5,
                        maxBarThickness: isMobile ? 1.5 : 2.5,
                        grouped: false,
                        order: 2
                    },
                    {
                        label: 'Body',
                        data: intervals.map(item => [item.open, item.close]),
                        backgroundColor: intervals.map(item => item.close >= item.open ? '#10b981' : '#ef4444'),
                        borderColor: intervals.map(item => item.close >= item.open ? '#059669' : '#dc2626'),
                        borderWidth: 1.5,
                        borderRadius: isMobile ? 3 : 5,
                        barPercentage: 0.55,
                        maxBarThickness: isMobile ? 12 : 24,
                        grouped: false,
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 9, weight: 'bold' } }
                    },
                    y: {
                        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
                        ticks: { font: { size: 9, weight: 'bold' } },
                        title: {
                            display: true,
                            text: 'Pace (Chapters/Day)',
                            font: { size: 10, weight: 'black', family: 'Inter' },
                            color: '#94a3b8'
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#fff',
                        titleFont: { size: 12, weight: 'bold' },
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        usePointStyle: true,
                        callbacks: {
                            label: (tooltipItem) => {
                                const item = intervals[tooltipItem.dataIndex];
                                const openStr = item.open.toFixed(3);
                                const closeStr = item.close.toFixed(3);
                                const highStr = item.high.toFixed(3);
                                const lowStr = item.low.toFixed(3);
                                const direction = item.close >= item.open ? '🟩 Pace Improved' : '🟥 Pace Decayed';
                                return [
                                    `Trend: ${direction}`,
                                    `Open Pace: ${openStr} ch/d`,
                                    `High Pace: ${highStr} /d`,
                                    `Low Pace: ${lowStr} ch/d`,
                                    `Close Pace: ${closeStr} ch/d`,
                                    `Completions: ${item.completed} Chapters`
                                ];
                            }
                        }
                    }
                }
            }
        });

        setTimeout(() => {
            if (window.paceCandleChartInstance) {
                window.paceCandleChartInstance.resize();
            }
        }, 320);
    };

    // Auto-init if container exists and is visible on initial page load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-paces-management');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.PaceManagementPage.init();
        }
    }
})();
