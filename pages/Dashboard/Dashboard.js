/**
 * Dashboard Page Module (pages/Dashboard/Dashboard.js)
 * Single Source of Truth for Dashboard Page logic and lifecycle.
 */

window.updateTrendsBar = function () {
    const barStartVal = document.getElementById('trends-bar-start-date');
    const barPassedVal = document.getElementById('trends-bar-days-passed');
    const barRemainVal = document.getElementById('trends-bar-days-remaining');
    const barRemainContainer = document.getElementById('trends-bar-days-remain-container');
    const barEstFinishVal = document.getElementById('trends-bar-est-finish');

    if (barStartVal) {
        let activeGoalId = window.dashboardConfig.activePaceGoalId;
        if (!activeGoalId && window.paceGoals && window.paceGoals.length > 0) {
            activeGoalId = window.paceGoals[0].id;
            window.dashboardConfig.activePaceGoalId = activeGoalId;
        }
        const activeGoal = activeGoalId ? window.paceGoals.find(g => g.id === activeGoalId) : null;

        if (activeGoal) {
            const stats = window.calculatePaceGoalStats(activeGoal, window.lastSubjectStats);
            if (!stats) return;

            // 1. Start Date
            barStartVal.textContent = stats.startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            // 2. Days Passed
            barPassedVal.textContent = Utils.formatDaysPassed(Math.max(0, stats.daysElapsed));

            // 3. Days Remain
            barRemainVal.textContent = `${stats.daysRemaining} Days`;
            barRemainContainer.classList.remove('hidden');

            // 4. Req & Actual Pace
            const barReqPaceVal = document.getElementById('trends-bar-req-pace');
            if (barReqPaceVal) {
                barReqPaceVal.textContent = `${stats.reqPace} Ch/Day`;
            }
            const barActualPaceVal = document.getElementById('trends-bar-actual-pace');
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
            barRemainContainer.classList.add('hidden');
            const barReqPaceVal = document.getElementById('trends-bar-req-pace');
            if (barReqPaceVal) barReqPaceVal.textContent = '--';
            const barActualPaceVal = document.getElementById('trends-bar-actual-pace');
            if (barActualPaceVal) barActualPaceVal.textContent = '--';
            barEstFinishVal.textContent = '--';
        }
    }
};

window.renderDashboardDailyChecklist = function () {
    const listContainer = document.getElementById('db-daily-targets-checklist');
    const pctEl = document.getElementById('db-daily-checklist-pct');
    const rangeEl = document.getElementById('db-daily-checklist-date');
    const progressEl = document.getElementById('db-daily-checklist-progress');
    if (!listContainer) return;

    const todayStr = Utils.formatDate(new Date());

    if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};

    const dashboardItems = [];

    // 1. Current day targets (both completed and uncompleted)
    const currentTargets = window.dailyTargetsDatabase[todayStr] || [];
    currentTargets.forEach((target, idx) => {
        if (target.isDeleted) return;
        const isTodo = target.isTodo === true;
        if (!isTodo) {
            const foundTask = window.findTaskChapter(target.track, target.subject, target.chapter);
            if (foundTask && foundTask.subTask.skipped) return;
        }
        const isCompleted = isTodo ? (target.completed || false) : (target.completed || (window.findTaskChapter(target.track, target.subject, target.chapter)?.subTask.completed ?? false));
        dashboardItems.push({
            target,
            dateKey: todayStr,
            idx,
            isCompleted,
            isToday: true
        });
    });

    // 2. Previous days targets (uncompleted only, sorted descending by date: newest past days first, older below)
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
            if (!isTodo) {
                const foundTask = window.findTaskChapter(target.track, target.subject, target.chapter);
                if (foundTask && foundTask.subTask.skipped) return;
            }
            const isCompleted = isTodo ? (target.completed || false) : (target.completed || (window.findTaskChapter(target.track, target.subject, target.chapter)?.subTask.completed ?? false));
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

    if (listContainer) {
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
            const trackName = target.track ? (window.tracks.find(t => t.id === target.track)?.name || '') : '';
            displaySubtitle = trackName ? `Task | ${trackName}` : 'Task';
            subjectColor = '#8b5cf6';
        } else {
            let displaySub = target.subject.replace(target.program + ' - ', '').replace(target.program + ' ', '');
            displayTitle = `${target.chapter}: ${displaySub}`;
            displaySubtitle = target.program;
            subjectColor = window.getSubjectColor ? window.getSubjectColor(target.subject) : '#3b82f6';
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
                            <span class="block text-[10px] md:text-xs font-black truncate ${isCompleted ? 'line-through opacity-75' : ''}">
                                ${displayTitle}
                                ${target.totalChapterSize ? `<span class="text-[9px] text-blue-500 font-bold ml-1">(${target.totalChapterSize} p)</span>` : ''}
                                ${target.scope && target.scope !== 'Whole Chapter' && target.scope !== 'Whole' ? `<span class="inline-block px-1 rounded-[3px] text-[6px] font-black uppercase tracking-widest ${isCompleted ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'} ml-1">${target.scope}</span>` : ''}
                            </span>
                            <div class="flex items-center space-x-1.5 flex-wrap">
                                <span class="block text-[7px] uppercase tracking-wider font-bold opacity-75 truncate">${displaySubtitle} | ${isCompleted ? 'YES' : 'NO'}</span>
                                ${dateTagHtml}
                            </div>
                        </div>
                    </div>
                    <div class="shrink-0">
                        ${isCompleted
                ? `<span class="flex h-4 w-4 rounded-full bg-white text-blue-500 items-center justify-center shadow-sm text-[8px] font-black">✓</span>`
                : `<span class="flex h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 items-center justify-center text-[7px] font-black">✕</span>`
            }
                    </div>
                </button>`;
        listContainer.innerHTML += itemHtml;
    });

    if (totalTargets === 0) {
        listContainer.innerHTML = `
                <div class="py-8 text-center text-[9px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 w-full col-span-2 sm:col-span-4 lg:col-span-2 h-full flex items-center justify-center">
                    No active or overdue daily targets.
                </div>`;
        listContainer.style.gridTemplateRows = '1fr';
        listContainer.style.height = '100%';
    }

    const pct = totalTargets === 0 ? 0 : Math.round((completedTargets / totalTargets) * 100);
    if (pctEl) pctEl.textContent = `${completedTargets}/${totalTargets} (${pct}%)`;
    if (progressEl) progressEl.style.width = `${pct}%`;
};

window.toggleDashboardDailyTargetCompletion = function (dateKey, idx, isCompleted) {
    if (typeof isCompleted === 'undefined' && typeof dateKey === 'number') {
        isCompleted = idx;
        idx = dateKey;
        dateKey = Utils.formatDate(new Date());
    }

    if (!window.dailyTargetsDatabase || !window.dailyTargetsDatabase[dateKey] || !window.dailyTargetsDatabase[dateKey][idx]) return;

    const target = window.dailyTargetsDatabase[dateKey][idx];
    target.completed = isCompleted;
    target.completedAt = isCompleted ? new Date().toISOString() : null;

    if (target.isTodo) {
        FirebaseService.saveToCloud();
        renderUI();
        showToast("To-Do task updated!", "success");
        return;
    }

    // Sync with Weekly Target (if exists in that date's week)
    const targetDate = window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(dateKey) : new Date();
    const targetRange = window.getWeeklyTargetRange(targetDate);
    const targetWeekKey = window.formatDateRangeKey(targetRange.start, targetRange.end);
    let wtCompleted = isCompleted;
    let wtCompletedAt = target.completedAt;
    let hasWtSize = false;

    if (window.weeklyTargetsDatabase && window.weeklyTargetsDatabase[targetWeekKey]) {
        const matchingWt = window.weeklyTargetsDatabase[targetWeekKey].find(t => t.track === target.track && t.subject === target.subject && t.chapter === target.chapter);
        if (matchingWt) {
            if (matchingWt.totalChapterSize) {
                hasWtSize = true;
                const progress = window.getWeeklyTargetProgress(matchingWt, targetWeekKey);
                matchingWt.completed = (progress.percent >= 100);
                matchingWt.completedAt = matchingWt.completed ? new Date().toISOString() : null;
                wtCompleted = matchingWt.completed;
                wtCompletedAt = matchingWt.completedAt;
            } else {
                matchingWt.completed = isCompleted;
                matchingWt.completedAt = target.completedAt;
            }
        }
    }

    // Also sync with current week if different
    const currentRange = window.getWeeklyTargetRange();
    const currentWeekKey = window.formatDateRangeKey(currentRange.start, currentRange.end);
    if (currentWeekKey !== targetWeekKey && window.weeklyTargetsDatabase && window.weeklyTargetsDatabase[currentWeekKey]) {
        const matchingCurrentWt = window.weeklyTargetsDatabase[currentWeekKey].find(t => t.track === target.track && t.subject === target.subject && t.chapter === target.chapter);
        if (matchingCurrentWt && !matchingCurrentWt.totalChapterSize) {
            matchingCurrentWt.completed = isCompleted;
            matchingCurrentWt.completedAt = target.completedAt;
        }
    }

    // Sync with daily study task (subtask in tasks)
    if (hasWtSize) {
        window.syncTaskChapterCompletion(target.track, target.subject, target.chapter, wtCompleted, wtCompletedAt);
    } else {
        window.syncTaskChapterCompletion(target.track, target.subject, target.chapter, isCompleted, target.completedAt);
    }
    recalculateTotals();

    FirebaseService.saveToCloud();
    renderUI();
    showToast("Daily checklist completion synchronized!", "success");
};

window.renderDashboardWeeklyChecklist = function () {
    if (typeof window.consolidateWeeklyTargetsDatabase === 'function') {
        window.consolidateWeeklyTargetsDatabase();
    }
    const listContainer = document.getElementById('db-weekly-targets-checklist');
    const pctEl = document.getElementById('db-weekly-checklist-pct');
    const rangeEl = document.getElementById('db-weekly-checklist-range');
    const progressEl = document.getElementById('db-weekly-checklist-progress');
    if (!listContainer) return;

    const currentRange = window.getWeeklyTargetRange();
    const currentWeekKey = window.formatDateRangeKey(currentRange.start, currentRange.end);
    const currentStartTime = currentRange.start.getTime();

    if (!window.weeklyTargetsDatabase) window.weeklyTargetsDatabase = {};

    const dashboardItems = [];

    // 1. Current week targets (both completed and uncompleted)
    const currentTargets = window.weeklyTargetsDatabase[currentWeekKey] || [];
    currentTargets.forEach((target, idx) => {
        const foundTask = window.findTaskChapter(target.track, target.subject, target.chapter);
        if (foundTask && foundTask.subTask.skipped) return;
        const progress = window.getWeeklyTargetProgress(target, currentWeekKey);
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

    // 2. Previous weeks targets (uncompleted only, sorted descending by start date: newest past weeks first, older below)
    const pastWeekKeys = Object.keys(window.weeklyTargetsDatabase).filter(wk => {
        if (wk === currentWeekKey) return false;
        const st = Utils.parseStart(wk).getTime();
        return st < currentStartTime;
    }).sort((a, b) => {
        return Utils.parseStart(b) - Utils.parseStart(a);
    });

    pastWeekKeys.forEach(wkKey => {
        const list = window.weeklyTargetsDatabase[wkKey] || [];
        list.forEach((target, idx) => {
            const foundTask = window.findTaskChapter(target.track, target.subject, target.chapter);
            if (foundTask && foundTask.subTask.skipped) return;
            const progress = window.getWeeklyTargetProgress(target, wkKey);
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

    if (listContainer) {
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
    }

    dashboardItems.forEach(item => {
        const target = item.target;
        let displaySub = target.subject.replace(target.program + ' - ', '').replace(target.program + ' ', '');
        const subjectColor = window.getSubjectColor ? window.getSubjectColor(target.subject) : '#10b981';

        const activeStyle = `background-color: ${subjectColor}cc; border-color: ${subjectColor}; color: white; box-shadow: 0 4px 12px ${subjectColor}33;`;

        let bgStyle = '';
        if (!item.isCompleted && target.totalChapterSize && item.progress.percent > 0) {
            const isDarkMode = document.documentElement.classList.contains('dark');
            const fillAlpha = isDarkMode ? 0.25 : 0.15;
            const fillRgba = hexToRgba(subjectColor, fillAlpha);
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
                            <div class="flex items-center space-x-1.5 flex-wrap">
                                <span class="block text-[7px] uppercase tracking-wider font-bold opacity-75 truncate">${target.program}${target.dayName ? ' | ' + target.dayName.toUpperCase() : ''} | ${item.isCompleted ? 'YES' : 'NO'}</span>
                                ${weekTagHtml}
                                ${targetScope !== 'Whole Chapter' && targetScope !== 'Whole' ? `
                                    <span class="inline-block px-1 rounded-[3px] text-[6px] font-black uppercase tracking-widest ${item.isCompleted ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}">
                                        ${targetScope}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="shrink-0">
                        ${item.isCompleted
                ? `<span class="flex h-4 w-4 rounded-full bg-white text-emerald-500 items-center justify-center shadow-sm text-[8px] font-black">✓</span>`
                : `<span class="flex h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 items-center justify-center text-[7px] font-black">✕</span>`
            }
                    </div>
                </button>`;
        listContainer.innerHTML += itemHtml;
    });

    if (totalTargets === 0) {
        listContainer.innerHTML = `
                <div class="py-8 text-center text-[9px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 w-full col-span-2 sm:col-span-4 lg:col-span-2 h-full flex items-center justify-center">
                    No active or overdue targets.
                </div>`;
        listContainer.style.gridTemplateRows = '1fr';
        listContainer.style.height = '100%';
    }

    const pct = totalTargets === 0 ? 0 : Math.round((completedTargets / totalTargets) * 100);
    if (pctEl) pctEl.textContent = `${completedTargets}/${totalTargets} (${pct}%)`;
    if (progressEl) progressEl.style.width = `${pct}%`;
};

window.toggleDashboardWeeklyTargetCompletion = function (weekKey, idx, isCompleted) {
    if (typeof isCompleted === 'undefined' && typeof weekKey === 'number') {
        isCompleted = idx;
        idx = weekKey;
        const currentRange = window.getWeeklyTargetRange();
        weekKey = window.formatDateRangeKey(currentRange.start, currentRange.end);
    }

    if (!window.weeklyTargetsDatabase || !window.weeklyTargetsDatabase[weekKey] || !window.weeklyTargetsDatabase[weekKey][idx]) return;

    const target = window.weeklyTargetsDatabase[weekKey][idx];
    target.completed = isCompleted;
    target.completedAt = isCompleted ? new Date().toISOString() : null;

    // Sync with Daily Targets across this week
    const startDate = Utils.parseStart ? Utils.parseStart(weekKey) : (window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(weekKey.split(' - ')[0]) : new Date());
    if (startDate && !isNaN(startDate.getTime()) && window.dailyTargetsDatabase) {
        const range = window.getWeeklyTargetRange(startDate);
        for (let i = 0; i < 7; i++) {
            const d = new Date(range.start.getTime() + i * 24 * 60 * 60 * 1000);
            const dateKey = Utils.formatDate(d);
            const list = window.dailyTargetsDatabase[dateKey] || [];
            list.forEach(matchingDt => {
                if (matchingDt.track === target.track && matchingDt.subject === target.subject && matchingDt.chapter === target.chapter) {
                    matchingDt.completed = isCompleted;
                    matchingDt.completedAt = target.completedAt;
                }
            });
        }
    }

    const todayKey = Utils.formatDate(new Date());
    if (window.dailyTargetsDatabase && window.dailyTargetsDatabase[todayKey]) {
        const matchingDt = window.dailyTargetsDatabase[todayKey].find(t => t.track === target.track && t.subject === target.subject && t.chapter === target.chapter);
        if (matchingDt) {
            matchingDt.completed = isCompleted;
            matchingDt.completedAt = target.completedAt;
        }
    }

    const found = window.findTaskChapter(target.track, target.subject, target.chapter);
    if (found) {
        found.subTask.completed = isCompleted;
        found.subTask.completedAt = target.completedAt;
        recalculateTotals();
    }

    FirebaseService.saveToCloud();
    renderUI();
    showToast("Weekly checklist completion synchronized!", "success");
};

window.renderDashboardMonthlyChecklist = function () {
    const listContainer = document.getElementById('db-monthly-targets-checklist');
    const pctEl = document.getElementById('db-monthly-checklist-pct');
    const rangeEl = document.getElementById('db-monthly-checklist-range');
    const progressEl = document.getElementById('db-monthly-checklist-progress');
    if (!listContainer) return;

    const currentRange = window.getMonthlyTargetRange();
    const currentMonthKey = window.formatMonthRangeKey(currentRange.start, currentRange.end);
    const currentStartTime = currentRange.start.getTime();

    if (!window.monthlyTargetsDatabase) window.monthlyTargetsDatabase = {};

    const dashboardItems = [];

    // 1. Current month targets (both completed and uncompleted)
    const currentTargets = window.monthlyTargetsDatabase[currentMonthKey] || [];
    currentTargets.forEach((target, idx) => {
        const isSubjectTarget = (target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters');
        const progress = window.getMonthlyTargetProgress(target, currentMonthKey);

        let isCompleted = false;
        if (isSubjectTarget) {
            isCompleted = target.completed || (window.isSubjectCompleted ? window.isSubjectCompleted(target.track, target.subject) : false) || (progress.percent >= 100);
        } else {
            const foundTask = window.findTaskChapter(target.track, target.subject, target.chapter);
            if (foundTask && foundTask.subTask.skipped) return;
            isCompleted = target.completed || (foundTask ? foundTask.subTask.completed : false) || (target.totalChapterSize && progress.percent >= 100);
        }

        dashboardItems.push({
            target,
            monthKey: currentMonthKey,
            idx,
            isCompleted,
            progress,
            isCurrentMonth: true
        });
    });

    // 2. Previous months targets (uncompleted only, sorted descending by start date: newest past months first, older below)
    const pastMonthKeys = Object.keys(window.monthlyTargetsDatabase).filter(mk => {
        if (mk === currentMonthKey) return false;
        const st = Utils.parseStart ? Utils.parseStart(mk).getTime() : new Date(mk.split(' - ')[0]).getTime();
        return st < currentStartTime;
    }).sort((a, b) => {
        const timeA = Utils.parseStart ? Utils.parseStart(a).getTime() : new Date(a.split(' - ')[0]).getTime();
        const timeB = Utils.parseStart ? Utils.parseStart(b).getTime() : new Date(b.split(' - ')[0]).getTime();
        return timeB - timeA;
    });

    pastMonthKeys.forEach(mkKey => {
        const list = window.monthlyTargetsDatabase[mkKey] || [];
        list.forEach((target, idx) => {
            const isSubjectTarget = (target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters');
            const progress = window.getMonthlyTargetProgress(target, mkKey);

            let isCompleted = false;
            if (isSubjectTarget) {
                isCompleted = target.completed || (window.isSubjectCompleted ? window.isSubjectCompleted(target.track, target.subject) : false) || (progress.percent >= 100);
            } else {
                const foundTask = window.findTaskChapter(target.track, target.subject, target.chapter);
                if (foundTask && foundTask.subTask.skipped) return;
                isCompleted = target.completed || (foundTask ? foundTask.subTask.completed : false) || (target.totalChapterSize && progress.percent >= 100);
            }

            if (!isCompleted) {
                dashboardItems.push({
                    target,
                    monthKey: mkKey,
                    idx,
                    isCompleted: false,
                    progress,
                    isCurrentMonth: false
                });
            }
        });
    });

    const totalTargets = dashboardItems.length;
    const completedTargets = dashboardItems.filter(item => item.isCompleted).length;
    const pastPendingCount = dashboardItems.filter(item => !item.isCurrentMonth).length;

    const currentMonthName = currentRange.start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    if (rangeEl) {
        if (pastPendingCount > 0) {
            rangeEl.textContent = `Month: ${currentMonthName} (+${pastPendingCount} Pending)`;
        } else {
            rangeEl.textContent = `Month: ${currentMonthName}`;
        }
    }

    listContainer.innerHTML = '';

    if (listContainer) {
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
    }

    dashboardItems.forEach(item => {
        const target = item.target;
        const isSubjectTarget = (target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters');
        let displaySub = target.subject.replace(target.program + ' - ', '').replace(target.program + ' ', '');
        const subjectColor = window.getSubjectColor ? window.getSubjectColor(target.subject) : '#6366f1';

        const activeStyle = `background-color: ${subjectColor}cc; border-color: ${subjectColor}; color: white; box-shadow: 0 4px 12px ${subjectColor}33;`;

        let bgStyle = '';
        if (!item.isCompleted && item.progress.percent > 0) {
            const isDarkMode = document.documentElement.classList.contains('dark');
            const fillAlpha = isDarkMode ? 0.25 : 0.15;
            const fillRgba = hexToRgba(subjectColor, fillAlpha);
            bgStyle = `background: linear-gradient(to right, ${fillRgba} ${item.progress.percent}%, transparent ${item.progress.percent}%);`;
        }

        const buttonClass = item.isCompleted
            ? `text-white border-transparent`
            : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-900/60';

        const progressTextHtml = item.progress.label ? `<span class="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold ml-1">${item.progress.label}</span>` : '';
        const targetScope = target.scope || (isSubjectTarget ? 'Whole Subject' : 'Whole Chapter');

        const monthTagHtml = !item.isCurrentMonth ? `
            <span class="inline-block px-1 rounded-[3px] text-[6px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
                ${item.monthKey.split(' - ')[0]}
            </span>
        ` : '';

        const titleText = isSubjectTarget
            ? `📚 ${displaySub}`
            : `${target.chapter}: ${displaySub}`;

        const itemHtml = `
                <button onclick="window.toggleDashboardMonthlyTargetCompletion('${item.monthKey}', ${item.idx}, ${!item.isCompleted})"
                        class="flex items-center justify-between p-2 md:p-2.5 rounded-xl border font-black transition-all duration-300 active:scale-95 text-left w-full gap-1.5 h-full ${buttonClass}"
                        style="${item.isCompleted ? activeStyle : bgStyle}">
                    <div class="flex items-center space-x-1.5 min-w-0 flex-1">
                        <div class="p-1 rounded-lg ${item.isCompleted ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'} shrink-0">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div class="min-w-0 leading-tight">
                            <span class="block text-[10px] md:text-xs font-black truncate ${item.isCompleted ? 'line-through opacity-75' : ''}">${titleText} ${progressTextHtml}</span>
                            <div class="flex items-center space-x-1.5 flex-wrap">
                                <span class="block text-[7px] uppercase tracking-wider font-bold opacity-75 truncate">${target.program} | ${item.isCompleted ? 'YES' : 'NO'}</span>
                                ${monthTagHtml}
                                ${isSubjectTarget ? `
                                    <span class="inline-block px-1 rounded-[3px] text-[6px] font-black uppercase tracking-widest ${item.isCompleted ? 'bg-white/20 text-white' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}">
                                        Subject
                                    </span>
                                ` : (targetScope !== 'Whole Chapter' && targetScope !== 'Whole' ? `
                                    <span class="inline-block px-1 rounded-[3px] text-[6px] font-black uppercase tracking-widest ${item.isCompleted ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}">
                                        ${targetScope}
                                    </span>
                                ` : '')}
                            </div>
                        </div>
                    </div>
                    <div class="shrink-0">
                        ${item.isCompleted
                ? `<span class="flex h-4 w-4 rounded-full bg-white text-indigo-600 items-center justify-center shadow-sm text-[8px] font-black">✓</span>`
                : `<span class="flex h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 items-center justify-center text-[7px] font-black">✕</span>`
            }
                    </div>
                </button>`;
        listContainer.innerHTML += itemHtml;
    });

    if (totalTargets === 0) {
        listContainer.innerHTML = `
                <div class="py-8 text-center text-[9px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 w-full col-span-2 sm:col-span-4 lg:col-span-2 h-full flex items-center justify-center">
                    No active or overdue targets.
                </div>`;
        listContainer.style.gridTemplateRows = '1fr';
        listContainer.style.height = '100%';
    }

    const pct = totalTargets === 0 ? 0 : Math.round((completedTargets / totalTargets) * 100);
    if (pctEl) pctEl.textContent = `${completedTargets}/${totalTargets} (${pct}%)`;
    if (progressEl) progressEl.style.width = `${pct}%`;
};

/**
 * Renders the Academic Outcome / Results summary card on the Dashboard.
 * ONLY displays results that have been inputted by the user, formatted as [ Name - Target - Actual ].
 */
window.renderDashboardOutcomeCard = function () {
    const cardEl = document.getElementById('dashboard-outcome-section');
    if (!cardEl) return;

    const overallBadgeEl = document.getElementById('db-outcome-overall-badge');
    const listEl = document.getElementById('db-outcome-program-list');

    const activeResults = typeof window.getProcessedResults === 'function' ? window.getProcessedResults() : [];

    // Group only logged results by program name
    const programGroups = {};
    const achievements = [];

    activeResults.forEach(res => {
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
            if (Utils.parseDateSafe(res.date) > Utils.parseDateSafe(programGroups[progName].date)) {
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
                actCgpa = Utils.formatCgpaMin2Dec(avg);
                actGrade = Utils.mapCgpaToGrade(avg, evalType);
            }
        }

        if (!actGrade && actCgpa && !isNaN(parseFloat(actCgpa))) {
            actGrade = Utils.mapCgpaToGrade(parseFloat(actCgpa), evalType);
        }
        if (!actCgpa && actGrade) {
            actCgpa = Utils.formatCgpaMin2Dec(Utils.mapGradeToNumeric(actGrade, evalType));
        }

        const mainTarget = typeof window.getProgramMainTarget === 'function' ? window.getProgramMainTarget(progName) : { targetCGPA: '', targetGrade: '' };
        const targetCGPA = (overall && overall.targetCGPA) || mainTarget.targetCGPA || '';
        const targetGrade = (overall && overall.targetGrade) || mainTarget.targetGrade || (targetCGPA && targetCGPA !== 'none' ? Utils.mapCgpaToGrade(targetCGPA, evalType) : '');

        const hasTgt = targetCGPA && targetCGPA !== 'none' && targetCGPA !== '';

        let isGoalMet = false;
        if (hasTgt) {
            if (isGradeMode && actGrade && targetGrade && targetGrade !== 'none') {
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
            tgtCgpa: hasTgt ? (isNaN(parseFloat(targetCGPA)) ? targetCGPA : Utils.formatCgpaMin2Dec(targetCGPA)) : '—',
            tgtGrade: hasTgt ? (targetGrade || '—') : '—',
            actCgpa: actCgpa ? (isNaN(parseFloat(actCgpa)) ? actCgpa : Utils.formatCgpaMin2Dec(actCgpa)) : '—',
            actGrade: actGrade || '—',
            isGradeMode,
            isGoalMet,
            color: color
        });
    });

    // Also include non-CGPA achievements that were inputted
    achievements.forEach(ach => {
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
        const timeA = Utils.parseDateSafe(a.date).getTime();
        const timeB = Utils.parseDateSafe(b.date).getTime();
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
                    <button onclick="window.openResultModal()" class="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-all active:scale-95 shadow-xs flex items-center gap-1.5">
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
};

/**
 * Renders the Upcoming Exam Subjects card on the Dashboard.
 * Displays scheduled exams from AppState.examRoutine that are not yet completed,
 * sorted chronologically by nearest exam date & time.
 */
window.renderDashboardUpcomingExamCard = function () {
    const cardEl = document.getElementById('dashboard-upcoming-exams-section');
    if (!cardEl) return;

    const countBadgeEl = document.getElementById('db-upcoming-exams-count-badge');
    const listEl = document.getElementById('db-upcoming-exams-list');

    const exams = AppState.examRoutine || [];
    const sessions = AppState.examSessions || [];
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

    // Filter valid upcoming exams (not completed, valid date, and not older than 2hr past start)
    const upcomingExams = exams
        .filter(e => e && e.subject && e.date && e.status !== 'completed')
        .map(e => {
            const timeMs = getExamTimestamp(e.date, e.time);
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
                    <button onclick="window.switchPage('exam')" class="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all active:scale-95 shadow-xs flex items-center gap-1.5">
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

                const subjColor = typeof getSubjectColor === 'function' ? getSubjectColor(ex.subject || 'General') : '#f43f5e';
                const dtObj = new Date(ex.timeMs);
                const dtFormatted = dtObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                const timeFormatted = ex.time ? dtObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

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

                const displayName = ex.title && ex.title.toLowerCase() !== ex.subject.toLowerCase()
                    ? `${ex.subject} <span class="font-normal text-slate-400 dark:text-slate-500 text-[9px]">(${ex.title})</span>`
                    : ex.subject;

                html += `
                    <div class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 select-none shadow-2xs">
                        <!-- Subject & Session Info -->
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

                        <!-- Live Countdown Badge -->
                        ${countdownHtml}
                    </div>`;
            });

            listEl.innerHTML = html;
        }
    }
};

/**
 * Renders the Passed Subjects card on the Dashboard.
 * Displays all subjects that meet the pass/freeze criteria (configured from Outcome page).
 * Items are static (non-interactive display only).
 */
window.renderDashboardPassedSubjectsCard = function () {
    const cardEl = document.getElementById('dashboard-passed-subjects-section');
    if (!cardEl) return;

    const rateBadgeEl = document.getElementById('db-passed-subjects-rate-badge');
    const countBadgeEl = document.getElementById('db-passed-subjects-count-badge');
    const listEl = document.getElementById('db-passed-subjects-list');

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

    // Update success rate badge in header (left of the passed count badge)
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
                const isProgFreeze = passedProgs.includes(s.program);
                const subjColor = typeof getSubjectColor === 'function' ? getSubjectColor(s.subject || 'General') : '#10b981';
                const chaptersCount = s.chapters || 0;

                // Clean display name if subject starts with program name
                let displaySub = s.subject;
                if (s.program && displaySub.startsWith(s.program + ' - ')) {
                    displaySub = displaySub.substring((s.program + ' - ').length);
                } else if (s.program && displaySub.startsWith(s.program + ' ')) {
                    displaySub = displaySub.substring((s.program + ' ').length);
                }

                html += `
                    <div class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 select-none shadow-2xs min-w-0">
                        <!-- Subject & Program Info -->
                        <div class="flex items-center space-x-2 min-w-0 flex-1">
                            <div class="w-2 h-2 rounded-full shrink-0 shadow-xs" style="background-color: ${subjColor}; box-shadow: 0 0 5px ${subjColor}"></div>
                            <div class="min-w-0 flex-1">
                                <span class="text-[10px] sm:text-[10.5px] font-black text-slate-800 dark:text-slate-100 truncate block leading-tight" title="${s.subject}">
                                    ${displaySub}
                                </span>
                                <div class="flex items-center gap-1 text-[7.5px] sm:text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
                                    <span class="text-emerald-600 dark:text-emerald-400 font-black truncate max-w-[65px] sm:max-w-[85px]">${s.program || 'Custom'}</span>
                                    <span>•</span>
                                    <span class="truncate">${chaptersCount} Ch</span>
                                </div>
                            </div>
                        </div>

                        <!-- Passed / Freeze Status Badge (Static) -->
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
};

window.toggleDashboardMonthlyTargetCompletion = function (monthKey, idx, isCompleted) {
    if (typeof isCompleted === 'undefined' && typeof monthKey === 'number') {
        isCompleted = idx;
        idx = monthKey;
        const currentRange = window.getMonthlyTargetRange();
        monthKey = window.formatMonthRangeKey(currentRange.start, currentRange.end);
    }

    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[monthKey] || !window.monthlyTargetsDatabase[monthKey][idx]) return;

    const target = window.monthlyTargetsDatabase[monthKey][idx];
    target.completed = isCompleted;
    target.completedAt = isCompleted ? new Date().toISOString() : null;

    if (target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters') {
        const key = target.track + 'Tasks';
        if (Array.isArray(AppState.tasks)) {
            AppState.tasks.forEach(t => {
                if (t.type === 'study' && Array.isArray(t[key])) {
                    t[key].forEach(b => {
                        if (b.subject === target.subject) {
                            b.completed = isCompleted;
                            b.completedAt = target.completedAt;
                        }
                    });
                }
            });
        }
    } else {
        window.syncTaskChapterCompletion(target.track, target.subject, target.chapter, isCompleted, target.completedAt);
    }

    recalculateTotals();
    renderUI();
    showToast("Monthly checklist completion synchronized!", "success");
    FirebaseService.saveToCloud(false);
};

// Dashboard Page Lifecycle Controller
window.DashboardPage = {
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
        const stats = window.lastSubjectStats || (typeof updateMetrics === 'function' ? (updateMetrics(), window.lastSubjectStats) : {});
        if (typeof window.renderCategoryProgress === 'function') window.renderCategoryProgress(stats);
        if (typeof window.renderTrackProgress === 'function') window.renderTrackProgress();

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
    },
    destroy: function () {
        this.isMounted = false;
    }
};

// If DOM is already loaded and page container is present, self-initialize
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (document.getElementById('page-dashboard') && !document.getElementById('page-dashboard').classList.contains('hidden')) {
        window.DashboardPage.init();
    }
}
