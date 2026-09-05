/**
 * Subjects Page Module (pages/Subjects/Subjects.js)
 * Canonical single source of truth for Subjects page logic, syllabus progress,
 * subject-filtered navigation, task checklists, and chapter completion tracking.
 */

(function () {
    'use strict';

    // Page-specific state variables
    window.subjectDetailsState = window.subjectDetailsState || {};

    /**
     * Renders detailed subject progress cards across tracks and custom programs.
     */
    window.renderSubjectProgress = function (subjectStats) {
        const container = document.getElementById('subject-progress-container');
        if (!container) return;
        if (!subjectStats || Object.keys(subjectStats).length === 0 || typeof Object.values(subjectStats)[0] !== 'object' || !('totalChapters' in (Object.values(subjectStats)[0] || {}))) {
            subjectStats = window.lastSubjectStats || {};
        }

        const colorPairs = [
            { bg: "bg-gradient-to-r from-indigo-400 to-indigo-600", text: "text-indigo-500" },
            { bg: "bg-gradient-to-r from-emerald-400 to-emerald-600", text: "text-emerald-500" },
            { bg: "bg-gradient-to-r from-violet-400 to-violet-600", text: "text-violet-500" },
            { bg: "bg-gradient-to-r from-rose-400 to-rose-600", text: "text-rose-500" },
            { bg: "bg-gradient-to-r from-amber-400 to-amber-600", text: "text-amber-500" },
            { bg: "bg-gradient-to-r from-cyan-400 to-cyan-600", text: "text-cyan-500" }
        ];

        let pIdx = 0;
        let html = '';
        if (Array.isArray(window.tracks)) {
            window.tracks.forEach(trackObj => {
                const track = trackObj.id;
                const trackName = trackObj.name || track;
                if (window.customPrograms && window.customPrograms[track]) {
                    const trackSubs = (typeof syllabusStructure !== 'undefined' && syllabusStructure[track]) ? syllabusStructure[track] : [];
                    if (trackSubs.length === 0) return;

                    let trackTotalChapters = 0;
                    let trackEffectiveChapters = 0;
                    trackSubs.forEach(s => {
                        const stats = subjectStats[s.subject] || { totalChapters: s.chapters || 0, effectiveChapters: 0 };
                        trackTotalChapters += (stats.totalChapters || 0);
                        trackEffectiveChapters += (stats.effectiveChapters || 0);
                    });
                    const trackPerc = trackTotalChapters > 0 ? Math.min(100, (trackEffectiveChapters / trackTotalChapters) * 100) : 0;

                    html += `
                        <div class="mb-8 p-4 sm:p-5 md:p-6 bg-slate-50/50 dark:bg-slate-900/10 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
                            <div class="mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">${trackName}</span>
                                        <span class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">(Track Progress)</span>
                                    </div>
                                    <div class="flex items-center gap-1 text-xs md:text-sm font-black text-indigo-600 dark:text-indigo-400">
                                        <span>${Math.round(trackEffectiveChapters)}/${trackTotalChapters} Ch</span>
                                        <span class="ml-1">(${Math.round(trackPerc)}%)</span>
                                    </div>
                                </div>
                                <div class="w-full bg-slate-100 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden shadow-inner border border-slate-200/40 dark:border-slate-600/30">
                                    <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out shadow-sm" style="width: ${trackPerc}%"></div>
                                </div>
                            </div>
                            <div class="space-y-5">
                    `;

                    window.customPrograms[track].forEach(prog => {
                        const progName = prog.name || prog;
                        const subs = (typeof syllabusStructure !== 'undefined' && syllabusStructure[track]) ? syllabusStructure[track].filter(s => s.program === progName) : [];
                        if (subs.length === 0) return;

                        const cp = colorPairs[pIdx % colorPairs.length];

                        html += `
                            <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
                                <h3 class="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3.5 tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-1.5">${progName} Program</h3>
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        `;

                        subs.forEach(sub => {
                            const stats = subjectStats[sub.subject] || { totalChapters: sub.chapters || 0, effectiveChapters: 0 };
                            const perc = stats.totalChapters > 0 ? Math.min(100, (stats.effectiveChapters / stats.totalChapters) * 100) : 0;

                            let cleanSubName = sub.subject;
                            if (cleanSubName.startsWith(progName + ' - ')) cleanSubName = cleanSubName.replace(progName + ' - ', '');
                            else if (cleanSubName.startsWith(progName + ' ')) cleanSubName = cleanSubName.replace(progName + ' ', '');

                            html += `
                                <div class="group flex flex-col justify-center">
                                    <div class="flex justify-between items-center text-[10px] md:text-[11px] font-black mb-1.5 transition-all group-hover:translate-x-1">
                                        <div class="flex items-center truncate pr-2">
                                            <span class="truncate text-slate-700 dark:text-slate-200" title="${sub.subject}">${cleanSubName}</span>
                                        </div>
                                        <div class="flex items-center shrink-0">
                                            <span class="ml-1">${Math.round(stats.effectiveChapters)}/${stats.totalChapters} <span class="${cp.text} ml-0.5">(${Math.round(perc)}%)</span></span>
                                        </div>
                                    </div>
                                    <div class="w-full bg-slate-100 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden shadow-inner border border-slate-200/40 dark:border-slate-600/30">
                                        <div class="${cp.bg} h-full rounded-full transition-all duration-700 ease-out shadow-sm" style="width: ${perc}%"></div>
                                    </div>
                                </div>
                            `;
                        });
                        html += `
                                </div>
                            </div>
                        `;
                        pIdx++;
                    });

                    html += `
                            </div>
                        </div>
                    `;
                }
            });
        }
        container.innerHTML = html;
    };

    /**
     * Renders the subject filter navigation buttons (All Tasks, Revise Subject, Program buttons, Subject buttons).
     */
    window.renderSubjectNavigation = function () {
        const container = document.getElementById('subject-navigation-container');
        if (!container) return;
        let html = '';

        const btnClass = (val) => {
            const isActive = (typeof AppState !== 'undefined' && AppState.currentFilter === val);
            return `active:scale-95 whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-transparent scale-105' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-md'}`;
        };

        // ALL button and Revise Setup
        html += `<div class="mb-3 flex gap-2"><button class="${btnClass('All')}" onclick="window.setFilter('All')">All Tasks</button><button class="active:scale-95 whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all duration-300 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/60 shadow-sm flex items-center gap-1.5" onclick="window.openRevisionModal()"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Revise Subject</button></div>`;

        if (Array.isArray(window.tracks)) {
            window.tracks.forEach(trackObj => {
                const track = trackObj.id;
                if (window.customPrograms && window.customPrograms[track]) {
                    window.customPrograms[track].forEach(prog => {
                        const progName = prog.name || prog;
                        const subs = ((typeof syllabusStructure !== 'undefined' && syllabusStructure[track]) || []).filter(s => s.program === progName).sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
                        if (subs.length > 0) {
                            html += `
                                <div class="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
                                    <div class="flex items-center gap-2 mb-3">
                                        <span class="text-[9px] md:text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1 w-full">${progName} PROGRAM</span>
                                    </div>
                                    <div class="flex flex-wrap gap-2 md:gap-3">
                                        <button class="${btnClass(progName)}" onclick="window.setFilter('${progName.replace(/'/g, "\\'")}');">[ ENTIRE ${progName} ]</button>
                                        ${subs.map(s => {
                                let displaySub = s.subject;
                                if (displaySub.startsWith(s.program + ' - ')) displaySub = displaySub.replace(s.program + ' - ', '');
                                else if (displaySub.startsWith(s.program + ' ')) displaySub = displaySub.replace(s.program + ' ', '');
                                return `<button class="${btnClass(s.subject)}" onclick="window.setFilter('${s.subject.replace(/'/g, "\\'")}');">${displaySub}</button>`;
                            }).join('')}
                                    </div>
                                </div>`;
                        }
                    });
                }
            });
        }
        container.innerHTML = html;
    };

    /**
     * Sets active filter and updates task list view.
     */
    window.setFilter = function (val) {
        if (typeof AppState !== 'undefined') {
            AppState.currentFilter = val;
        }
        window.subjectDetailsState = {};
        if (typeof window.renderSubjectNavigation === 'function') window.renderSubjectNavigation();
        if (typeof window.renderTaskList === 'function') window.renderTaskList();
        if (typeof window.updateMetrics === 'function') window.updateMetrics();
        if (typeof window.renderTrendCharts === 'function') window.renderTrendCharts();
    };

    /**
     * Renders individual revision task checkbox item.
     */
    window.generateRevisionTaskHtml = function (sub, chNum, isCompleted) {
        const safeSub = sub.replace(/[^a-zA-Z0-9]/g, '-');
        const safeSubQuotes = sub.replace(/'/g, "\\'");
        return `
            <div id="rev-task-${safeSub}-${chNum}" class="relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-700 flex flex-col justify-between min-h-[110px] overflow-hidden group select-none ${isCompleted ? 'ring-1 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20 !border-blue-200 dark:!border-blue-800' : ''}">
                <div class="absolute top-0 left-0 w-full h-1 ${isCompleted ? 'bg-blue-500' : 'bg-blue-300 dark:bg-blue-700'} transition-colors"></div>
                
                <div class="flex justify-start items-center mb-3 mt-1">
                    <span class="text-[9px] px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md font-black tracking-widest uppercase border border-blue-100 dark:border-blue-800/50">REVISION</span>
                </div>

                <div class="flex items-end justify-between mt-auto gap-3">
                    <div class="flex flex-col pr-1">
                        <span class="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base tracking-tight leading-tight mb-0.5 ${isCompleted ? 'line-through text-blue-700 dark:text-blue-400 opacity-70' : ''}">Ch. ${chNum}</span>
                        <span class="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug ${isCompleted ? 'line-through opacity-60' : ''}">Revision Practice</span>
                    </div>
                    <div class="shrink-0 mb-0.5">
                        <div class="relative flex items-center justify-center">
                            <input type="checkbox" onchange="window.toggleRevisionChapter('${safeSubQuotes}', ${chNum}, this.checked)" class="peer relative appearance-none w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 checked:bg-blue-500 checked:border-blue-500 focus:outline-none cursor-pointer transition-all shadow-sm hover:border-blue-400" ${isCompleted ? 'checked' : ''}>
                            <svg class="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>`;
    };

    /**
     * Helper to safely format hex colors with alpha.
     */
    function getHexToRgba(hex, alpha) {
        if (typeof window.hexToRgba === 'function') return window.hexToRgba(hex, alpha);
        if (!hex) return `rgba(16, 185, 129, ${alpha})`;
        let cleanHex = hex.replace('#', '');
        let r = 0, g = 0, b = 0;
        if (cleanHex.length === 3) {
            r = parseInt(cleanHex[0] + cleanHex[0], 16);
            g = parseInt(cleanHex[1] + cleanHex[1], 16);
            b = parseInt(cleanHex[2] + cleanHex[2], 16);
        } else if (cleanHex.length === 6) {
            r = parseInt(cleanHex.substring(0, 2), 16);
            g = parseInt(cleanHex.substring(2, 4), 16);
            b = parseInt(cleanHex.substring(4, 6), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Generates HTML card for a single task row.
     */
    window.generateSingleTaskHtml = function (dayObj, taskObj, type) {
        let subjectColor = '#3b82f6';
        if (typeof window.getSubjectColor === 'function') {
            subjectColor = window.getSubjectColor(taskObj.subject);
        }

        const isSkipped = !!taskObj.skipped;

        // Look up matching weekly target to get size-based progress
        let progressPercent = 0;
        let progressTextHtml = '';
        let isSizeBased = false;

        const progress = (typeof window.getChapterWeeklyTargetProgress === 'function')
            ? window.getChapterWeeklyTargetProgress(type, taskObj.subject, taskObj.chapter)
            : null;

        if (progress && progress.isSizeBased && progress.total > 0) {
            isSizeBased = true;
            progressPercent = progress.percent;
            progressTextHtml = `<span class="text-[9px] text-blue-500 font-bold ml-1.5">(${progress.completed}/${progress.total} p)</span>`;
        }

        const isCompleted = !isSkipped && (!!taskObj.completed || (isSizeBased && progressPercent >= 100));

        let cardClass = 'relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[110px] overflow-hidden group';
        let barBgStyle = `background-color: ${subjectColor};`;
        let cardStyle = '';

        const isDarkMode = document.documentElement.classList.contains('dark');

        if (isSkipped) {
            cardClass += ' border border-slate-350 bg-slate-50/50 dark:bg-slate-900/20 !border-slate-300 dark:!border-slate-800 opacity-60';
            barBgStyle = `background-color: ${isDarkMode ? '#475569' : '#94a3b8'};`;
        } else if (isCompleted) {
            cardClass += ' border';
            cardStyle = `border-color: ${subjectColor}; background-color: ${isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'};`;
            barBgStyle = `background-color: ${subjectColor};`;
        } else {
            cardClass += ' border border-slate-100 dark:border-slate-700';
            if (isSizeBased && progressPercent > 0) {
                const fillRgba = getHexToRgba(subjectColor, isDarkMode ? 0.25 : 0.15);
                cardStyle = `background: linear-gradient(to right, ${fillRgba} ${progressPercent}%, transparent ${progressPercent}%); border-color: ${isDarkMode ? '#334155' : '#e2e8f0'};`;
            }
        }

        return `
            <div id="single-task-${taskObj.id}-${dayObj.studyDay}" class="${cardClass}" style="${cardStyle}">
                
                <!-- Color Accent Bar -->
                <div class="absolute top-0 left-0 w-full h-1" style="${barBgStyle} transition: background-color 0.3s;"></div>
                
                <div class="flex justify-between items-start mb-3 mt-1">
                    <span class="text-[9px] px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded-md font-black tracking-widest uppercase">${typeof dayObj.studyDay === 'number' ? `DAY ${dayObj.studyDay}` : 'CH ' + (taskObj.chapter.replace(/\D/g, '') || dayObj.studyDay)} ${isSkipped ? '<span class="text-amber-600 dark:text-amber-400 font-extrabold ml-1">(SKIPPED)</span>' : ''}</span>
                    <button onclick="window.openEditModal ? window.openEditModal(${typeof dayObj.id === 'number' ? dayObj.id : `'${dayObj.id}'`}, '${type}', '${taskObj.id}') : (openEditModal(${typeof dayObj.id === 'number' ? dayObj.id : `'${dayObj.id}'`}, '${type}', '${taskObj.id}'))" class="text-slate-400 hover:text-blue-500 active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700" title="Edit/Delete Task">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                </div>

                <div class="flex items-end justify-between mt-auto gap-3">
                    <div class="flex flex-col pr-1">
                        <span class="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base tracking-tight leading-tight mb-0.5 ${isCompleted ? 'line-through text-emerald-700 dark:text-emerald-400 opacity-70' : ''} ${isSkipped ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-400' : ''}">${taskObj.chapter}</span>
                        <span class="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 ${isCompleted ? 'line-through opacity-60' : ''} ${isSkipped ? 'opacity-55' : ''}">${taskObj.title}${progressTextHtml}</span>
                    </div>
                    <div class="shrink-0 mb-0.5">
                        <div class="relative flex items-center justify-center">
                            <input type="checkbox" data-stud-id="${dayObj.studyDay}" data-subtask-id="${taskObj.id}" data-type="${type}" data-subject="${taskObj.subject}" data-chapter="${taskObj.chapter}" class="task-checkbox peer relative appearance-none w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 checked:bg-emerald-500 checked:border-emerald-500 focus:outline-none cursor-pointer transition-all shadow-sm hover:border-emerald-400" ${isCompleted ? 'checked' : ''} ${isSkipped ? 'disabled bg-slate-100 dark:bg-slate-800 border-slate-200 cursor-not-allowed' : ''}>
                            <svg class="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>`;
    };

    /**
     * Renders the main task cards and subject groups list.
     */
    window.renderTaskList = function () {
    const getTaskDate = (typeof window.getTaskDate === 'function') ? window.getTaskDate : function (task) {
        if (!task) return new Date(NaN);
        if (task.date && !String(task.date).includes('Invalid') && !String(task.date).includes('NaN')) {
            const d = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                ? Utils.parseDateSafe(task.date)
                : new Date(task.date);
            if (d && !isNaN(d.getTime())) return d;
        }
        return new Date(NaN);
    };

    const list = document.getElementById('task-list');
    if (!list) return;
    list.className = 'flex flex-col space-y-6 md:space-y-8 w-full pb-4';

    let subjectsToRender = [];
    if (AppState.currentFilter === 'All') {
        subjectsToRender = window.getAllSubjects().map(s => s.subject);
    } else {
        const isProgram = window.getAllPrograms().some(p => (p.name || p) === AppState.currentFilter);
        if (isProgram) {
            subjectsToRender = window.getAllSubjects().filter(s => s.program === AppState.currentFilter).map(s => s.subject);
        } else {
            subjectsToRender = [AppState.currentFilter];
        }
    }

    const grouped = {};
    subjectsToRender.forEach(sub => {
        let track = null;
        let sObj = null;
        for (const t of window.tracks) {
            if (syllabusStructure[t.id]) {
                sObj = syllabusStructure[t.id].find(s => s.subject === sub);
                if (sObj) { track = t.id; break; }
            }
        }
        if (sObj) {
            grouped[sub] = {
                type: track,
                program: sObj.program,
                totalChapters: sObj.chapters,
                tasks: []
            };
        }
    });

    AppState.tasks.forEach(t => {
        if (t.type === 'study') {
            window.tracks.forEach(trackObj => {
                const trackId = trackObj.id;
                const key = trackId + 'Tasks';
                if (t[key]) {
                    t[key].forEach(b => {
                        if (grouped[b.subject]) {
                            grouped[b.subject].tasks.push({ dayObj: t, taskObj: b, type: trackId });
                        }
                    });
                }
            });
        }
    });

    for (const sub in grouped) {
        const group = grouped[sub];
        const sObj = window.getAllSubjects().find(s => s.subject === sub);
        const safeSubId = sub.replace(/[^a-zA-Z0-9]/g, '-');
        const isFrozen = (window.passedItems && window.passedItems.subjects && window.passedItems.subjects.includes(sub)) ||
            (window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(group.program));

        if (sObj && sObj.chapters > 0) {
            const allChapterTasks = [];
            for (let chNum = 1; chNum <= sObj.chapters; chNum++) {
                const existingTask = group.tasks.find(x => {
                    const chStr = x.taskObj.chapter;
                    if (chStr === `Ch. ${chNum}` || chStr === `Ch.${chNum}` || chStr === String(chNum)) return true;
                    const match = chStr.match(/(\d+)(?!.*\d)/);
                    return match && parseInt(match[0]) === chNum;
                });

                if (existingTask) {
                    allChapterTasks.push(existingTask);
                } else {
                    allChapterTasks.push({
                        dayObj: { studyDay: '—', id: `unsched-${safeSubId}-${chNum}`, date: '' },
                        taskObj: {
                            id: `unsched-${group.type || 'ca'}-${safeSubId}-${chNum}`,
                            subject: sub,
                            chapter: `Ch. ${chNum}`,
                            title: `Topic ${chNum}`,
                            completed: false,
                            skipped: false
                        },
                        type: group.type || 'ca'
                    });
                }
            }
            group.tasks = allChapterTasks;
        }

        const skippedCount = group.tasks.filter(x => x.taskObj.skipped).length;
        group.totalChapters = Math.max(0, (sObj ? sObj.chapters : group.totalChapters) - skippedCount);
    }

    let html = '';
    const shadowMap = { indigo: 'shadow-[0_0_10px_rgba(99,102,241,0.6)]', emerald: 'shadow-[0_0_10px_rgba(16,185,129,0.6)]', violet: 'shadow-[0_0_10px_rgba(139,92,246,0.6)]' };

    subjectsToRender.forEach(sub => {
        const group = grouped[sub];
        if (!group) return;

        const isFrozen = (window.passedItems && window.passedItems.subjects && window.passedItems.subjects.includes(sub)) ||
            (window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(group.program));

        const isRevising = window.revisionData && window.revisionData.active && window.revisionData.active.includes(sub);
        const sObj = window.getAllSubjects().find(s => s.subject === sub);

        // If subject has 0 scheduled study tasks and is not frozen, not revising, and has no chapters in syllabus, skip
        if (group.tasks.length === 0 && !isFrozen && !isRevising && (!sObj || sObj.chapters === 0)) return;

        const trackIdx = window.tracks.findIndex(t => t.id === group.type);
        const colorMap = ['indigo', 'emerald', 'violet', 'rose', 'amber', 'cyan'];
        const colorClass = trackIdx !== -1 ? colorMap[trackIdx % colorMap.length] : 'blue';

        const trackObj = window.tracks.find(t => t.id === group.type);
        const trackName = trackObj ? trackObj.name : group.type.toUpperCase();

        let displaySubName = sub;
        if (displaySubName.startsWith(group.program + ' - ')) displaySubName = displaySubName.replace(group.program + ' - ', '');
        else if (displaySubName.startsWith(group.program + ' ')) displaySubName = displaySubName.replace(group.program + ' ', '');
        const finalTitle = `<span class="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white mr-2">${displaySubName}</span><span class="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider mr-1.5">- ${group.program}</span><span class="text-[10px] md:text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">- ${trackName}</span>`;

        const shadowClass = shadowMap[colorClass];
        const safeSubId = sub.replace(/[^a-zA-Z0-9]/g, '-');
        const safeSubQuotes = sub.replace(/'/g, "\\'");

        const analyticsBtnHtml = `
                    <button onclick="event.preventDefault(); event.stopPropagation(); window.openSingleSubjectTrendModal('${safeSubQuotes}');" class="p-2 md:p-2.5 shrink-0 text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl shadow-sm transition-all border border-slate-200 dark:border-slate-600/50 active:scale-95" title="View Subject Trend">
                        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    </button>
                `;

        const editBtnHtml = `
                    <button onclick="event.preventDefault(); event.stopPropagation(); window.openSubjectEditModal('${safeSubQuotes}');" class="p-2 md:p-2.5 shrink-0 text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl shadow-sm transition-all border border-slate-200 dark:border-slate-600/50 active:scale-95" title="Edit Subject Details">
                        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                `;

        const formatDateStr = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        let targetDate = null;
        let startDate = null;
        let linkLabel = '';
        let hasTimeGoal = false;

        if (window.subjectTimeLinks && window.subjectTimeLinks[sub]) {
            const link = window.subjectTimeLinks[sub];
            if (link.type === 'date') {
                hasTimeGoal = true;
                if (link.startDate) startDate = Utils.parseDateSafe(link.startDate);
                targetDate = Utils.parseDateSafe(link.date);
                targetDate.setHours(23, 59, 59, 999);
                if (startDate) startDate.setHours(0, 0, 0, 0);
                linkLabel = '<span class="block text-[8px] text-orange-500 dark:text-orange-400 mt-1 uppercase tracking-widest font-black bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded border border-orange-100 dark:border-orange-800/50 inline-block">Custom Timeline</span>';
            } else if (link.type === 'goal') {
                const pg = window.paceGoals.find(g => g.id === link.id);
                if (pg) {
                    hasTimeGoal = true;
                    if (pg.startDate) startDate = Utils.parseDateSafe(pg.startDate);
                    targetDate = Utils.parseDateSafe(pg.deadline);
                    targetDate.setHours(23, 59, 59, 999);
                    if (startDate) startDate.setHours(0, 0, 0, 0);
                    linkLabel = `<span class="block text-[8px] text-indigo-500 dark:text-indigo-400 mt-1 truncate max-w-[120px] mx-auto uppercase tracking-widest font-black bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50 inline-block" title="${pg.target}">Link: ${pg.target}</span>`;
                }
            }
        }

        if (!hasTimeGoal) {
            let firstCompletedTask = group.tasks.find(x => x.taskObj.completed);
            if (firstCompletedTask) {
                if (firstCompletedTask.taskObj.completedAt) {
                    startDate = new Date(firstCompletedTask.taskObj.completedAt);
                } else {
                    startDate = getTaskDate(firstCompletedTask.dayObj);
                }
            }
        }

        const startDateStr = startDate ? formatDateStr(startDate) : '--';
        const endDateStr = targetDate ? formatDateStr(targetDate) : '--';
        const headerDatesStr = (hasTimeGoal || startDate) ? `${startDateStr} <span class="mx-1 opacity-50">&rarr;</span> ${endDateStr}` : "No Timeline Set";

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const msPerDay = 1000 * 60 * 60 * 24;

        let completedCount = 0;
        group.tasks.forEach(x => {
            if (x.taskObj.skipped) return;
            if (x.taskObj.completed) {
                completedCount += 1;
            } else {
                const prog = window.getChapterWeeklyTargetProgress ? window.getChapterWeeklyTargetProgress(x.type, x.taskObj.subject, x.taskObj.chapter) : null;
                if (prog && prog.isSizeBased && prog.total > 0 && prog.completed > 0) {
                    completedCount += Math.min(1, prog.completed / prog.total);
                }
            }
        });
        const progressPct = isFrozen ? 100 : (group.totalChapters > 0 ? Math.min(100, Math.round((completedCount / group.totalChapters) * 100)) : 100);
        const displayCompleted = isFrozen ? group.totalChapters : ((completedCount % 1 === 0) ? completedCount : (Math.round(completedCount * 10) / 10));

        let remainingCh = Math.max(0, group.totalChapters - completedCount);
        let actPaceRaw = 0;
        let reqPaceRaw = 0;

        let actualStartDateForPace = null;
        let firstCompletedTaskForPace = group.tasks.find(x => x.taskObj.completed);
        if (firstCompletedTaskForPace) {
            actualStartDateForPace = firstCompletedTaskForPace.taskObj.completedAt ? new Date(firstCompletedTaskForPace.taskObj.completedAt) : getTaskDate(firstCompletedTaskForPace.dayObj);
            actualStartDateForPace.setHours(0, 0, 0, 0);
        }

        let daysElapsed = 0;
        if (group.totalChapters > 0) {
            if (completedCount > 0 && actualStartDateForPace && actualStartDateForPace <= today) {
                daysElapsed = Math.floor((today - actualStartDateForPace) / msPerDay) + 1;
                actPaceRaw = completedCount / daysElapsed;
            } else if (startDate && startDate <= today) {
                daysElapsed = Math.floor((today - startDate) / msPerDay) + 1;
                actPaceRaw = completedCount / daysElapsed;
            }

            if (hasTimeGoal && targetDate) {
                if (today > targetDate) {
                    reqPaceRaw = remainingCh > 0 ? remainingCh : 0;
                } else {
                    let baselineDateForReq = (startDate && startDate > today) ? startDate : today;
                    const daysRemaining = Math.max(1, Math.ceil((targetDate - baselineDateForReq) / msPerDay));
                    reqPaceRaw = remainingCh / daysRemaining;
                }
            }
        }

        const actPace = actPaceRaw.toFixed(2);
        const reqPace = hasTimeGoal ? reqPaceRaw.toFixed(2) : '--';

        let subjectDaysPassedStr = '<span class="opacity-60">0 Days Passed</span>';
        if (completedCount > 0 && daysElapsed > 0) {
            subjectDaysPassedStr = `${Utils.formatDaysPassed(daysElapsed)} Passed`;
        }

        let estFinishStr = '--';
        let estDaysNeededStr = '<span class="opacity-60">Unknown</span>';
        if (isFrozen || completedCount >= group.totalChapters) {
            estFinishStr = '<span class="text-emerald-500 font-black">Finished</span>';
            estDaysNeededStr = '<span class="text-emerald-500 font-bold">0 Days</span>';
        } else if (completedCount === 0) {
            estFinishStr = '<span class="text-slate-400 text-[10px]">No Data</span>';
        } else if (actPaceRaw > 0) {
            const daysLeft = remainingCh / actPaceRaw;
            const estDate = new Date(today.getTime() + (daysLeft * msPerDay));
            estFinishStr = formatDateStr(estDate);
            estDaysNeededStr = `${Math.ceil(daysLeft)} Days Needed`;
        }

        let timeGoalCountdownStr = '';
        if (isFrozen || completedCount >= group.totalChapters) {
            timeGoalCountdownStr = '<span class="text-emerald-500 font-bold">Done</span>';
        } else if (!hasTimeGoal) {
            timeGoalCountdownStr = '<span class="text-slate-400 font-bold">No Goal</span>';
        } else {
            let diffDaysTG = Math.ceil((targetDate - today) / msPerDay);
            if (diffDaysTG > 0) timeGoalCountdownStr = `${diffDaysTG} Days Left`;
            else if (diffDaysTG === 0) timeGoalCountdownStr = `<span class="text-orange-500 font-bold">Due Today</span>`;
            else timeGoalCountdownStr = `<span class="text-red-500 font-bold">${Math.abs(diffDaysTG)} Days Overdue</span>`;
        }

        let headerIcon = `<div class="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-${colorClass}-50 dark:bg-${colorClass}-500/10 border border-${colorClass}-100 dark:border-${colorClass}-500/20 shadow-sm shrink-0"><div class="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-${colorClass}-500 ${shadowClass}"></div></div>`;
        if (isFrozen) headerIcon = `<div class="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm shrink-0 text-base md:text-lg drop-shadow-md">🏆</div>`;

        let isDetailsOpen = window.subjectDetailsState[safeSubId] !== undefined ? window.subjectDetailsState[safeSubId] : (subjectsToRender.length === 1);
        let openAttr = isDetailsOpen ? 'open' : '';

        const isProgramVisible = !window.programVisibility || window.programVisibility[group.program] !== false;
        let blockHtml = '';

        if (!isProgramVisible) {
            blockHtml = `
                        <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm mb-3 opacity-60">
                            <div class="flex items-center space-x-2.5 min-w-0">
                                <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${window.getProgramColor(group.program)}"></div>
                                <h4 class="text-xs font-black text-slate-650 dark:text-slate-400 truncate">${displaySubName} <span class="text-[9px] font-bold text-slate-400 uppercase">- ${group.program} (Compressed)</span></h4>
                            </div>
                            <div class="flex items-center space-x-2 shrink-0">
                                <span class="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">${progressPct}%</span>
                                <button onclick="window.toggleOutcomeProgram('${group.program.replace(/'/g, "\\'")}')" class="p-1 text-slate-400 hover:text-slate-600 rounded" title="Spread Program Everywhere">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>`;
        } else if (isFrozen) {
            blockHtml = `
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4 md:p-5 rounded-[1.25rem] shadow-sm mb-4">
                            <div class="flex items-center space-x-3 md:space-x-4 w-full">
                                <div class="text-3xl drop-shadow-md">🏆</div>
                                <div class="flex flex-wrap items-center flex-1">
                                    <div class="flex items-center w-full">
                                        <h2 class="tracking-tight truncate flex-1"><span class="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white mr-2">${displaySubName}</span><span class="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mr-1.5">- ${group.program}</span><span class="text-[10px] md:text-xs font-medium text-emerald-500/80 dark:text-emerald-500/60 uppercase tracking-widest whitespace-nowrap">- ${trackName}</span></h2>
                                    </div>
                                    <span class="w-full text-[9px] font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-500 mt-0.5">Status: Passed & Frozen</span>
                                </div>
                                ${editBtnHtml}
                            </div>
                        </div>`;
        } else {
            blockHtml = `
                        <details id="details-${safeSubId}" ontoggle="window.subjectDetailsState['${safeSubId}'] = this.open;" class="bg-white dark:bg-slate-800 rounded-[1.25rem] md:rounded-[2rem] shadow-sm border border-slate-200/80 dark:border-slate-700/60 mb-5 group overflow-hidden transition-all duration-300 hover:shadow-md" ${openAttr}>
                            <summary class="cursor-pointer p-4 md:p-6 outline-none select-none list-none flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/80 [&::-webkit-details-marker]:hidden relative z-10">
                                
                                <!-- Left side: Subject, Program, Time Period -->
                                <div class="flex flex-col gap-2.5 w-full lg:w-[40%] shrink-0">
                                    <div class="flex items-center gap-3">
                                        ${headerIcon}
                                        <div class="flex flex-col overflow-hidden w-full pr-2">
                                            <div class="flex items-center w-full">
                                                <h2 class="tracking-tight truncate flex-1" title="${displaySubName}">${finalTitle}</h2>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 lg:ml-[3.25rem] uppercase tracking-widest bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md w-fit border border-slate-200 dark:border-slate-700/50">
                                        <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <span>${headerDatesStr}</span>
                                    </div>
                                </div>

                                <!-- Middle: Progress Bar & Status -->
                                <div class="flex flex-col gap-2 w-full lg:w-[35%] lg:px-4">
                                    <div class="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                                        <span id="group-text-${safeSubId}" class="text-slate-500 dark:text-slate-400">${displayCompleted} <span class="opacity-60 text-[9px] mx-0.5">/</span> ${group.totalChapters} <span class="opacity-60">CH</span></span>
                                        <span id="group-pct-${safeSubId}" class="text-${colorClass}-600 dark:text-${colorClass}-400 bg-${colorClass}-50 dark:bg-${colorClass}-900/30 px-1.5 py-0.5 rounded border border-${colorClass}-100 dark:border-${colorClass}-800/50 shadow-sm">${progressPct}%</span>
                                    </div>
                                    <div class="w-full bg-slate-100 dark:bg-slate-700/50 h-2.5 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-600/30 relative">
                                        <div id="group-bar-${safeSubId}" class="h-full bg-gradient-to-r from-${colorClass}-400 to-${colorClass}-600 transition-all duration-700 ease-out relative" style="width: ${progressPct}%">
                                            <div class="absolute right-0 top-0 bottom-0 w-2 bg-white/40 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Right: EST Finish & Dropdown Arrow -->
                                <div class="flex items-center justify-between lg:justify-end gap-4 lg:gap-6 w-full lg:w-[25%] lg:pl-0">
                                    <div class="flex flex-col text-left lg:text-right flex-1 lg:flex-none">
                                        <span class="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-0.5">EST. Finish</span>
                                        <span id="header-est-${safeSubId}" class="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">${estFinishStr}</span>
                                    </div>
                                    <div class="flex items-center gap-2 shrink-0">
                                        ${analyticsBtnHtml}
                                        ${editBtnHtml}
                                        <div class="p-2 md:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 group-open:rotate-180 group-open:bg-${colorClass}-50 group-open:text-${colorClass}-600 dark:group-open:bg-${colorClass}-900/30 dark:group-open:text-${colorClass}-400 transition-all duration-300 shrink-0 shadow-sm border border-slate-200/50 dark:border-slate-600/30">
                                            <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </summary>

                            <div class="p-4 md:p-6 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/10">
                                
                                <!-- Inside Expanded View: 4 Action Analytics Cards -->
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                                    <div onclick="window.openSubjectTimeModal('${safeSubQuotes}')" class="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 transition-all cursor-pointer group/tg scale-100 active:scale-[0.98]">
                                        <div class="absolute top-2 right-2 opacity-0 group-hover/tg:opacity-100 transition-opacity"><svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></div>
                                        <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Time Goal</span>
                                        <span class="text-sm md:text-[1.05rem] font-black text-slate-800 dark:text-slate-100 leading-tight">${endDateStr}</span>
                                        <span id="tg-tg-days-${safeSubId}" class="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">${timeGoalCountdownStr}</span>
                                        ${linkLabel}
                                    </div>
                                    <div class="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm flex flex-col justify-center text-center">
                                        <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-500/90 dark:text-blue-400/90 mb-1">Req Pace</span>
                                        <span class="text-sm md:text-[1.1rem] font-black text-blue-700 dark:text-blue-400"><span id="tg-req-${safeSubId}">${reqPace}</span> <span class="text-[9px] opacity-70 font-bold uppercase tracking-widest">ch/d</span></span>
                                    </div>
                                    <div class="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-${colorClass}-50/80 to-${colorClass}-100/50 dark:from-${colorClass}-900/20 dark:to-${colorClass}-900/30 rounded-2xl border border-${colorClass}-100 dark:border-${colorClass}-800/50 shadow-sm flex flex-col justify-center text-center">
                                        <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-${colorClass}-500/90 dark:text-${colorClass}-400/90 mb-1">Actual Pace</span>
                                        <span class="text-sm md:text-[1.1rem] font-black text-${colorClass}-700 dark:text-${colorClass}-400"><span id="tg-act-${safeSubId}">${actPace}</span> <span class="text-[9px] opacity-70 font-bold uppercase tracking-widest">ch/d</span></span>
                                        <span id="tg-act-days-${safeSubId}" class="text-[9px] text-${colorClass}-500/80 font-bold mt-0.5">${subjectDaysPassedStr}</span>
                                    </div>
                                    <div class="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-orange-50/80 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/30 rounded-2xl border border-orange-100 dark:border-orange-800/50 shadow-sm flex flex-col justify-center text-center">
                                        <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-orange-500/90 dark:text-orange-400/90 mb-1">Est. Finish</span>
                                        <span id="tg-est-${safeSubId}" class="text-sm md:text-[1.05rem] font-black text-orange-600 dark:text-orange-400">${estFinishStr}</span>
                                        <span id="tg-est-days-${safeSubId}" class="text-[9px] text-orange-500/80 font-bold mt-0.5">${estDaysNeededStr}</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                                    ${group.tasks.length > 0
                                        ? group.tasks.map(x => (window.generateSingleTaskHtml || generateSingleTaskHtml)(x.dayObj, x.taskObj, x.type)).join('')
                                        : `<div class="col-span-full py-8 text-center text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 p-4">
                                            <span class="text-2xl block mb-2 opacity-60">📅</span>
                                            <p class="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">No active timeline dates assigned</p>
                                            <p class="text-[10px] font-bold text-slate-400 mt-1">All ${group.totalChapters} chapters exist in syllabus. Mark Passed & Frozen or configure revisions as needed.</p>
                                        </div>`
                                    }
                                </div>
                    `;
            if (isRevising) {
                if (isFrozen) {
                    blockHtml += `
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 p-4 md:p-5 rounded-[1.25rem] shadow-sm mb-4">
                            <div class="flex items-center space-x-3 md:space-x-4 w-full">
                                <div class="text-3xl drop-shadow-md">🏅</div>
                                <div class="flex flex-wrap items-center flex-1">
                                    <h2 class="tracking-tight flex-1"><span class="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white mr-2">${displaySubName}</span><span class="text-xs md:text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mr-1.5">- ${group.program}</span><span class="text-[10px] md:text-xs font-medium text-blue-500/80 dark:text-blue-500/60 uppercase tracking-widest whitespace-nowrap">- ${trackName} - Revision</span></h2>
                                    <span class="w-full text-[9px] font-black tracking-widest uppercase text-blue-600 dark:text-blue-500 mt-0.5">Status: Revision Passed & Frozen</span>
                                </div>
                            </div>
                        </div>`;
                } else {
                    const sObj = window.getAllSubjects().find(s => s.subject === sub);
                    const staticChapters = sObj ? sObj.chapters : 0;

                    let revCompletedCount = 0;
                    if (window.revisionData.progress[sub]) {
                        for (let i = 1; i <= staticChapters; i++) {
                            let isChapterSkipped = AppState.tasks.some(t => t.type === 'study' && window.tracks.some(trackObj => Array.isArray(t[trackObj.id + 'Tasks']) && t[trackObj.id + 'Tasks'].some(b => b.subject === sub && b.chapter === `Ch. ${i}` && b.skipped)));
                            if (!isChapterSkipped && window.revisionData.progress[sub][i]) {
                                revCompletedCount++;
                            }
                        }
                    }
                    let revPct = group.totalChapters > 0 ? Math.round((revCompletedCount / group.totalChapters) * 100) : 0;

                    let revGridHtml = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mt-4">`;
                    for (let i = 1; i <= staticChapters; i++) {
                        let isChapterSkipped = AppState.tasks.some(t => t.type === 'study' && window.tracks.some(trackObj => Array.isArray(t[trackObj.id + 'Tasks']) && t[trackObj.id + 'Tasks'].some(b => b.subject === sub && b.chapter === `Ch. ${i}` && b.skipped)));
                        if (isChapterSkipped) continue;
                        let isCompleted = window.revisionData.progress[sub] && window.revisionData.progress[sub][i];
                        revGridHtml += (window.generateRevisionTaskHtml || generateRevisionTaskHtml)(sub, i, isCompleted);
                    }
                    revGridHtml += `</div>`;

                    let revisionHeaderHtml = `
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-blue-200 dark:border-blue-800/50 pb-3 gap-3">
                                <div class="flex flex-wrap items-center gap-y-2 space-x-3 w-full">
                                    <div class="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse"></div>
                                    <h2 class="tracking-tight"><span class="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white mr-2">${displaySubName}</span><span class="text-sm md:text-base font-bold text-blue-500 dark:text-blue-300 uppercase tracking-wider mr-1.5">- ${group.program}</span><span class="text-xs md:text-sm font-medium text-blue-400 dark:text-blue-400 uppercase tracking-widest whitespace-nowrap">- ${trackName} - Revision</span></h2>
                                    <button onclick="window.openRevisionTrendModal()" class="ml-auto text-[9px] md:text-[10px] font-black text-white bg-blue-600 px-2.5 md:px-4 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg> Analytics</button>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800/50 w-fit mb-4">
                                <span id="rev-group-text-${safeSubId}" class="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">${revCompletedCount} <span class="opacity-60 text-[9px] mx-0.5">/</span> ${group.totalChapters} <span class="opacity-60">CH</span></span>
                                <span id="rev-group-pct-${safeSubId}" class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-[10px] font-black border border-blue-100 dark:border-blue-800/50 shadow-sm">${revPct}%</span>
                                <div class="w-24 md:w-32 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-600/30">
                                    <div id="rev-group-bar-${safeSubId}" class="h-full bg-blue-500 transition-all duration-500 ease-out relative" style="width: ${revPct}%"><div class="absolute right-0 top-0 bottom-0 w-2 bg-white/40 rounded-full"></div></div>
                                </div>
                            </div>
                        `;

                    blockHtml += `<div class="mt-8 w-full bg-blue-50/40 dark:bg-blue-900/10 p-4 md:p-6 rounded-[2rem] border-2 border-blue-200 dark:border-blue-800/50 shadow-sm relative overflow-hidden"><div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>${revisionHeaderHtml}${revGridHtml}</div>`;
                }
            }
        }

        if (isProgramVisible && !isFrozen) {
            blockHtml += `
                            </div>
                        </details>
                    `;
        }

        html += blockHtml;
    });

    if (html === '') html = `<div class="flex flex-col items-center py-12 text-slate-400"><span class="text-4xl mb-4">📭</span><p class="font-black uppercase tracking-widest text-sm">No tasks scheduled for this selection</p></div>`;

    list.innerHTML = html;
    list.querySelectorAll('.task-checkbox').forEach(cb => cb.onchange = (window.handleTaskToggle || handleTaskToggle));
}



    window.handleTaskToggle = function (e) {
        const studyDayId = parseInt(e.target.dataset.studId);
        const type = e.target.dataset.type;
        const subTaskId = e.target.dataset.subtaskId;
        const subj = e.target.dataset.subject;
        const chapter = e.target.dataset.chapter;
        let taskIndex = !isNaN(studyDayId) ? AppState.tasks.findIndex(t => t.studyDay === studyDayId && t.type === 'study') : -1;

        const isCompleted = e.target.checked;
        const nowIso = new Date().toISOString();
        let taskObj = null;
        const key = type + 'Tasks';

        if (taskIndex !== -1 && AppState.tasks[taskIndex][key]) {
            AppState.tasks[taskIndex][key] = AppState.tasks[taskIndex][key].map(b => b.id === subTaskId ? { ...b, completed: isCompleted, completedAt: isCompleted ? nowIso : null } : b);
            taskObj = AppState.tasks[taskIndex][key].find(b => b.id === subTaskId);
        }

        if (!taskObj && subj && chapter) {
            // Find existing task by subject & chapter in AppState.tasks
            for (let i = 0; i < AppState.tasks.length; i++) {
                if (AppState.tasks[i].type === 'study' && Array.isArray(AppState.tasks[i][key])) {
                    const b = AppState.tasks[i][key].find(b => b.subject === subj && b.chapter === chapter);
                    if (b) {
                        b.completed = isCompleted;
                        b.completedAt = isCompleted ? nowIso : null;
                        taskObj = b;
                        taskIndex = i;
                        break;
                    }
                }
            }

            // If not in AppState.tasks yet, slot it into the first available Revision slot
            if (!taskObj) {
                for (let i = 0; i < AppState.tasks.length; i++) {
                    if (AppState.tasks[i].type === 'study' && Array.isArray(AppState.tasks[i][key])) {
                        const bIdx = AppState.tasks[i][key].findIndex(b => b.subject === 'Revision');
                        if (bIdx > -1) {
                            AppState.tasks[i][key][bIdx] = {
                                subject: subj,
                                chapter: chapter,
                                title: `Topic ${chapter.replace(/\D/g, '') || ''}`,
                                completed: isCompleted,
                                completedAt: isCompleted ? nowIso : null,
                                id: AppState.tasks[i][key][bIdx].id
                            };
                            taskObj = AppState.tasks[i][key][bIdx];
                            taskIndex = i;
                            break;
                        }
                    }
                }
            }

            // If still not slotted, append a slot and assign it
            if (!taskObj) {
                if (typeof window.ensureAvailableSlots === 'function') {
                    window.ensureAvailableSlots(1, type, 0);
                } else if (typeof ensureAvailableSlots === 'function') {
                    ensureAvailableSlots(1, type, 0);
                }
                for (let i = 0; i < AppState.tasks.length; i++) {
                    if (AppState.tasks[i].type === 'study' && Array.isArray(AppState.tasks[i][key])) {
                        const bIdx = AppState.tasks[i][key].findIndex(b => b.subject === 'Revision');
                        if (bIdx > -1) {
                            AppState.tasks[i][key][bIdx] = {
                                subject: subj,
                                chapter: chapter,
                                title: `Topic ${chapter.replace(/\D/g, '') || ''}`,
                                completed: isCompleted,
                                completedAt: isCompleted ? nowIso : null,
                                id: AppState.tasks[i][key][bIdx].id
                            };
                            taskObj = AppState.tasks[i][key][bIdx];
                            taskIndex = i;
                            break;
                        }
                    }
                }
            }
        }

        if (!taskObj) return;

        // Synchronize across all study tasks in AppState.tasks matching this track, subject, and chapter
        AppState.tasks.forEach(t => {
            if (t.type === 'study' && Array.isArray(t[key])) {
                t[key].forEach(b => {
                    if (b.subject === taskObj.subject && b.chapter === taskObj.chapter) {
                        b.completed = isCompleted;
                        b.completedAt = isCompleted ? nowIso : null;
                    }
                });
            }
        });

        // Synchronize to monthlyTargetsDatabase if this subtask is a monthly target
        if (window.monthlyTargetsDatabase) {
            Object.keys(window.monthlyTargetsDatabase).forEach(monthKey => {
                const targets = window.monthlyTargetsDatabase[monthKey] || [];
                targets.forEach(t => {
                    if (t.track === type && t.subject === taskObj.subject) {
                        if (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters') {
                            const isAllDone = window.isSubjectCompleted ? window.isSubjectCompleted(type, t.subject) : isCompleted;
                            t.completed = isAllDone;
                            t.completedAt = isAllDone ? nowIso : null;
                        } else if (t.chapter === taskObj.chapter) {
                            t.completed = isCompleted;
                            t.completedAt = isCompleted ? nowIso : null;
                        }
                    }
                });
            });
        }

        // Synchronize to weeklyTargetsDatabase if this subtask is a weekly target
        if (window.weeklyTargetsDatabase) {
            Object.keys(window.weeklyTargetsDatabase).forEach(weekKey => {
                const targets = window.weeklyTargetsDatabase[weekKey] || [];
                targets.forEach(t => {
                    if (t.track === type && t.subject === taskObj.subject && t.chapter === taskObj.chapter) {
                        t.completed = isCompleted;
                        t.completedAt = isCompleted ? nowIso : null;
                    }
                });
            });
        }

        // Synchronize to dailyTargetsDatabase if this subtask is a daily target
        if (window.dailyTargetsDatabase) {
            Object.keys(window.dailyTargetsDatabase).forEach(dateKey => {
                const targets = window.dailyTargetsDatabase[dateKey] || [];
                targets.forEach(t => {
                    if (t.track === type && t.subject === taskObj.subject && t.chapter === taskObj.chapter) {
                        t.completed = isCompleted;
                        t.completedAt = isCompleted ? nowIso : null;
                    }
                });
            });
        }

        // 1. Optimistic UI update: Immediate Card State styling (zero-lag)
        const cardEl = document.getElementById(`single-task-${taskObj.id}-${studyDayId}`);
        if (cardEl) {
            const titleEl = cardEl.querySelector('.tracking-tight');
            const descEl = cardEl.querySelector('.line-clamp-2');
            const accentBar = cardEl.querySelector('.absolute.top-0.left-0');

            if (titleEl) {
                if (isCompleted) titleEl.classList.add('line-through', 'text-emerald-700', 'dark:text-emerald-400', 'opacity-70');
                else titleEl.classList.remove('line-through', 'text-emerald-700', 'dark:text-emerald-400', 'opacity-70');
            }
            if (descEl) isCompleted ? descEl.classList.add('line-through', 'opacity-60') : descEl.classList.remove('line-through', 'opacity-60');

            const subjectColor = window.getSubjectColor ? window.getSubjectColor(taskObj.subject) : '#3b82f6';
            const isDarkMode = document.documentElement.classList.contains('dark');

            if (isCompleted) {
                cardEl.style.borderColor = subjectColor;
                cardEl.style.background = '';
                cardEl.style.backgroundColor = isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)';
                if (accentBar) {
                    accentBar.style.backgroundColor = subjectColor;
                }
            } else {
                // Check if size-based progress should fill
                let progressPercent = 0;
                let isSizeBased = false;
                const progress = (typeof window.getChapterWeeklyTargetProgress === 'function')
                    ? window.getChapterWeeklyTargetProgress(type, taskObj.subject, taskObj.chapter)
                    : null;
                if (progress && progress.isSizeBased && progress.total > 0) {
                    isSizeBased = true;
                    progressPercent = progress.percent;
                }

                if (isSizeBased && progressPercent > 0) {
                    const fillRgba = getHexToRgba(subjectColor, isDarkMode ? 0.25 : 0.15);
                    cardEl.style.background = `linear-gradient(to right, ${fillRgba} ${progressPercent}%, transparent ${progressPercent}%)`;
                    cardEl.style.borderColor = isDarkMode ? '#334155' : '#e2e8f0';
                    cardEl.style.backgroundColor = '';
                } else {
                    cardEl.style.background = '';
                    cardEl.style.borderColor = '';
                    cardEl.style.backgroundColor = '';
                }
                if (accentBar) {
                    accentBar.style.backgroundColor = subjectColor;
                }
            }
        }

        // 2. Optimistic UI update: Specific Subject Progress Bar
        const safeSubId = taskObj.subject.replace(/[^a-zA-Z0-9]/g, '-');
        const subName = taskObj.subject;
        const groupTasks = AppState.tasks.flatMap(t => t.type === 'study' ? (t[key] || []) : []).filter(x => x.subject === subName);
        const sObj = (typeof syllabusStructure !== 'undefined' && syllabusStructure[type]) ? syllabusStructure[type].find(s => s.subject === subName) : null;
        const isFrozenSub = (window.passedItems && window.passedItems.subjects && window.passedItems.subjects.includes(subName)) ||
            (window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(sObj ? sObj.program : ''));

        let skippedCount = 0;
        let completedCount = 0;
        if (sObj && sObj.chapters > 0) {
            for (let chNum = 1; chNum <= sObj.chapters; chNum++) {
                const matched = groupTasks.find(x => {
                    const chStr = x.chapter;
                    if (chStr === `Ch. ${chNum}` || chStr === `Ch.${chNum}` || chStr === String(chNum)) return true;
                    const match = chStr.match(/(\d+)(?!.*\d)/);
                    return match && parseInt(match[0]) === chNum;
                });
                if (matched && matched.skipped) {
                    skippedCount++;
                } else if (matched && matched.completed) {
                    completedCount += 1;
                } else {
                    const prog = (typeof window.getChapterWeeklyTargetProgress === 'function')
                        ? window.getChapterWeeklyTargetProgress(type, subName, `Ch. ${chNum}`)
                        : null;
                    if (prog && prog.isSizeBased && prog.total > 0 && prog.completed > 0) {
                        completedCount += Math.min(1, prog.completed / prog.total);
                    }
                }
            }
        } else {
            groupTasks.forEach(x => {
                if (x.skipped) {
                    skippedCount++;
                } else if (x.completed) {
                    completedCount += 1;
                } else {
                    const prog = (typeof window.getChapterWeeklyTargetProgress === 'function')
                        ? window.getChapterWeeklyTargetProgress(type, subName, x.chapter)
                        : null;
                    if (prog && prog.isSizeBased && prog.total > 0 && prog.completed > 0) {
                        completedCount += Math.min(1, prog.completed / prog.total);
                    }
                }
            });
        }

        const totalChapters = sObj ? Math.max(0, sObj.chapters - skippedCount) : 1;
        const progressPct = isFrozenSub ? 100 : (totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 100);
        const displayCompleted = isFrozenSub ? totalChapters : ((completedCount % 1 === 0) ? completedCount : (Math.round(completedCount * 10) / 10));

        const textEl = document.getElementById(`group-text-${safeSubId}`);
        if (textEl) textEl.innerHTML = `${displayCompleted} <span class="opacity-60 text-[9px] mx-0.5">/</span> ${totalChapters} <span class="opacity-60">CH</span>`;

        const pctEl = document.getElementById(`group-pct-${safeSubId}`);
        if (pctEl) pctEl.textContent = `${progressPct}%`;

        const barEl = document.getElementById(`group-bar-${safeSubId}`);
        if (barEl) barEl.style.width = `${progressPct}%`;

        // 3. Optimistic UI update: Recalculate and update the 4 specific analytics cards inside the subject view
        const allSubTasks = AppState.tasks.filter(t => t.type === 'study' && t[key] && t[key].some(b => b.subject === subName));

        let targetDate = null;
        let startDate = null;

        let hasTimeGoal = false;
        if (window.subjectTimeLinks && window.subjectTimeLinks[subName]) {
            const link = window.subjectTimeLinks[subName];
            if (link.type === 'date') {
                hasTimeGoal = true;
                if (link.startDate && typeof Utils !== 'undefined' && Utils.parseDateSafe) startDate = Utils.parseDateSafe(link.startDate);
                targetDate = typeof Utils !== 'undefined' && Utils.parseDateSafe ? Utils.parseDateSafe(link.date) : new Date(link.date);
            } else if (link.type === 'goal' && Array.isArray(window.paceGoals)) {
                const pg = window.paceGoals.find(g => g.id === link.id);
                if (pg) {
                    hasTimeGoal = true;
                    if (pg.startDate && typeof Utils !== 'undefined' && Utils.parseDateSafe) startDate = Utils.parseDateSafe(pg.startDate);
                    targetDate = typeof Utils !== 'undefined' && Utils.parseDateSafe ? Utils.parseDateSafe(pg.deadline) : new Date(pg.deadline);
                }
            }
        }

        if (!hasTimeGoal) {
            let firstCompletedDay = allSubTasks.find(t => t[key] && t[key].some(b => b.subject === subName && b.completed));
            if (firstCompletedDay) {
                let taskO = firstCompletedDay[key].find(b => b.subject === subName && b.completed);
                if (taskO.completedAt) {
                    startDate = new Date(taskO.completedAt);
                } else if (typeof window.getTaskDate === 'function') {
                    startDate = window.getTaskDate(firstCompletedDay);
                }
            }
        }

        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (targetDate) targetDate.setHours(23, 59, 59, 999);

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const msPerDay = 1000 * 60 * 60 * 24;

        let remainingCh = Math.max(0, totalChapters - completedCount);
        let actPaceRaw = 0;
        let reqPaceRaw = 0;

        let actualStartDateForPace = null;
        let firstCompletedDayForPace = allSubTasks.find(t => t[key] && t[key].some(b => b.subject === subName && b.completed));
        if (firstCompletedDayForPace) {
            let taskO = firstCompletedDayForPace[key].find(b => b.subject === subName && b.completed);
            actualStartDateForPace = taskO.completedAt
                ? new Date(taskO.completedAt)
                : (typeof window.getTaskDate === 'function' ? window.getTaskDate(firstCompletedDayForPace) : null);
            if (actualStartDateForPace) actualStartDateForPace.setHours(0, 0, 0, 0);
        }

        let daysElapsed = 0;
        if (totalChapters > 0) {
            if (completedCount > 0 && actualStartDateForPace && actualStartDateForPace <= today) {
                daysElapsed = Math.floor((today - actualStartDateForPace) / msPerDay) + 1;
                actPaceRaw = completedCount / daysElapsed;
            } else if (startDate && startDate <= today) {
                daysElapsed = Math.floor((today - startDate) / msPerDay) + 1;
                actPaceRaw = completedCount / daysElapsed;
            }

            if (hasTimeGoal && targetDate) {
                if (today > targetDate) {
                    reqPaceRaw = remainingCh > 0 ? remainingCh : 0;
                } else {
                    let baselineDateForReq = (startDate && startDate > today) ? startDate : today;
                    const daysRemaining = Math.max(1, Math.ceil((targetDate - baselineDateForReq) / msPerDay));
                    reqPaceRaw = remainingCh / daysRemaining;
                }
            }
        }

        const actPaceStr = actPaceRaw.toFixed(2);
        const reqPaceStr = hasTimeGoal ? reqPaceRaw.toFixed(2) : '--';

        let estFinishStr = '--';
        let estDaysNeededStr = '<span class="opacity-60">Unknown</span>';
        if (isFrozenSub || completedCount >= totalChapters) {
            estFinishStr = '<span class="text-emerald-500 font-black">Finished</span>';
            estDaysNeededStr = '<span class="text-emerald-500 font-bold">0 Days</span>';
        } else if (completedCount === 0) {
            estFinishStr = '<span class="text-slate-400 text-[10px]">No Data</span>';
        } else if (actPaceRaw > 0) {
            const daysLeft = remainingCh / actPaceRaw;
            const estDate = new Date(today.getTime() + (daysLeft * msPerDay));
            estFinishStr = estDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            estDaysNeededStr = `${Math.ceil(daysLeft)} Days Needed`;
        }

        let timeGoalCountdownStr = '';
        if (isFrozenSub || completedCount >= totalChapters) {
            timeGoalCountdownStr = '<span class="text-emerald-500 font-bold">Done</span>';
        } else if (!hasTimeGoal) {
            timeGoalCountdownStr = '<span class="text-slate-400 font-bold">No Goal</span>';
        } else {
            let diffDaysTG = Math.ceil((targetDate - today) / msPerDay);
            if (diffDaysTG > 0) timeGoalCountdownStr = `${diffDaysTG} Days Left`;
            else if (diffDaysTG === 0) timeGoalCountdownStr = `<span class="text-orange-500 font-bold">Due Today</span>`;
            else timeGoalCountdownStr = `<span class="text-red-500 font-bold">${Math.abs(diffDaysTG)} Days Overdue</span>`;
        }

        const reqEl = document.getElementById(`tg-req-${safeSubId}`);
        if (reqEl) reqEl.textContent = reqPaceStr;

        const actEl = document.getElementById(`tg-act-${safeSubId}`);
        if (actEl) actEl.textContent = actPaceStr;

        let subjectDaysPassedStr = '<span class="opacity-60">0 Days Passed</span>';
        if (completedCount > 0 && daysElapsed > 0) {
            subjectDaysPassedStr = (typeof Utils !== 'undefined' && Utils.formatDaysPassed)
                ? `${Utils.formatDaysPassed(daysElapsed)} Passed`
                : `${daysElapsed}d Passed`;
        }
        const actDaysEl = document.getElementById(`tg-act-days-${safeSubId}`);
        if (actDaysEl) actDaysEl.innerHTML = subjectDaysPassedStr;

        const estEl1 = document.getElementById(`tg-est-${safeSubId}`);
        if (estEl1) estEl1.innerHTML = estFinishStr;

        const estEl2 = document.getElementById(`header-est-${safeSubId}`);
        if (estEl2) estEl2.innerHTML = estFinishStr;

        const tgDaysEl = document.getElementById(`tg-tg-days-${safeSubId}`);
        if (tgDaysEl) tgDaysEl.innerHTML = timeGoalCountdownStr;

        const estDaysEl = document.getElementById(`tg-est-days-${safeSubId}`);
        if (estDaysEl) estDaysEl.innerHTML = estDaysNeededStr;

        // Core Global updates & Saves
        if (typeof window.updateMetrics === 'function') {
            window.updateMetrics();
        } else if (typeof updateMetrics === 'function') {
            updateMetrics();
        }

        if (typeof FirebaseService !== 'undefined' && typeof FirebaseService.saveToCloud === 'function') {
            FirebaseService.saveToCloud();
        }

        // Smart background debounce for heavy canvas operations
        if (window.chartDebounce) clearTimeout(window.chartDebounce);
        window.chartDebounce = setTimeout(() => {
            if (typeof window.renderTrendCharts === 'function') {
                requestAnimationFrame(window.renderTrendCharts);
            } else if (typeof renderTrendCharts === 'function') {
                requestAnimationFrame(renderTrendCharts);
            }
        }, 600);
    };

    /**
     * Subjects Page Lifecycle Controller
     */
    window.SubjectsPage = {
        isMounted: false,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            // Ensure task container is visible
            const dashContent = document.getElementById('dashboard-content');
            if (dashContent) dashContent.classList.remove('hidden');

            // 1. Render Subject Navigation Filter Bar
            if (typeof window.renderSubjectNavigation === 'function') {
                window.renderSubjectNavigation();
            }

            // 2. Render Subject Progress Breakdown
            if (typeof window.renderSubjectProgress === 'function') {
                window.renderSubjectProgress(window.lastSubjectStats || {});
            }

            // 3. Render Task List
            if (typeof window.renderTaskList === 'function') {
                window.renderTaskList();
            }

            // 4. Update Metrics (calculations, donut chart, global completion)
            if (typeof window.updateMetrics === 'function') {
                window.updateMetrics();
            } else if (typeof updateMetrics === 'function') {
                updateMetrics();
            }

            // 5. Refresh progress donut chart with double timeout for transition smoothness
            this.refreshProgressChart();
        },

        refreshProgressChart: function () {
            const refresh = () => {
                const canvas = document.getElementById('progressChart');
                if (canvas && typeof AppState !== 'undefined' && AppState.progressChart && typeof AppState.progressChart.resize === 'function') {
                    AppState.progressChart.resize();
                    if (typeof AppState.progressChart.update === 'function') {
                        AppState.progressChart.update('none');
                    }
                } else if (typeof window.updateMetrics === 'function') {
                    window.updateMetrics();
                } else if (typeof updateMetrics === 'function') {
                    updateMetrics();
                }
            };
            setTimeout(refresh, 50);
            setTimeout(refresh, 420);
        },

        destroy: function () {
            this.isMounted = false;

            // Safely close any subject-related modals if open when navigating away
            if (typeof window.closeModal === 'function') {
                const modals = ['global-history-modal', 'global-chapters-modal', 'revision-manage-modal', 'subject-time-modal', 'subject-trend-modal', 'edit-subject-modal', 'edit-timeline-entry-modal'];
                modals.forEach(m => {
                    const el = document.getElementById(m);
                    if (el && !el.classList.contains('hidden')) {
                        window.closeModal(m);
                    }
                });
            }
        }
    };

    // Auto-init if container exists and is visible on initial page load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-subjects');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.SubjectsPage.init();
        }
    }
})();
