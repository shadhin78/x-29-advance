/**
 * X-29 Feature Module: Subject Goals & Management (subjectGoals.js)
 *
 * Responsibilities:
 * 1. Subject Daily Time Goals:
 *    - openSubjectTimeModal: Populates modal with pace goals or custom target dates.
 *    - saveSubjectTimeGoal: Saves target deadline / pace goal link to window.subjectTimeLinks.
 *    - clearSubjectTimeGoal: Resets subject time link with tombstone tracking.
 * 2. Subject Editing & Deletion:
 *    - openSubjectEditModal: Pre-fills track, program, and subject name inputs.
 *    - updateEsmProgramDropdown: Cascades programs when track changes.
 *    - saveSubjectEditModal: Validates global uniqueness, migrates cross-track tasks,
 *      and cascades rename across colors, filters, pace goals, passed items, revision, and time links.
 *    - requestDeleteSubjectFromModal & executeDeleteSubjectFromModal: Confirms and purges subject
 *      from syllabus, tasks (converts to Revision), pace goals, passed items, revision data, and time links.
 * 3. Subject Progress & Navigation Visualizations:
 *    - renderSubjectNavigation: Program and subject filter pill buttons with active highlights.
 *    - renderSubjectProgress: Detailed subject progress bars with track summaries and program groupings.
 *    - renderCategoryProgress: Radial circular progress cards for each program.
 *    - renderTrackProgress: Radial circular progress cards for each track.
 *    - openProgramCompletionsModal: Modal detailing subject completion percentages for a program or track.
 *
 * State:
 * - Mutates window.subjectTimeLinks, window.syllabusStructure, window.currentSubjectForTimeGoal.
 */

(function (global) {
    'use strict';

    const window = global;

    const safeGetEl = (typeof window !== 'undefined' && typeof window.safeGetEl === 'function')
        ? window.safeGetEl
        : (typeof global !== 'undefined' && typeof global.safeGetEl === 'function')
            ? global.safeGetEl
            : (typeof require === 'function' ? require('../../utils/dom.js').safeGetEl : null);

    // =========================================================================
    // 1. SUBJECT DAILY TIME GOALS
    // =========================================================================

    window.currentSubjectForTimeGoal = null;

    function openSubjectTimeModal(subjectName) {
        window.currentSubjectForTimeGoal = subjectName;
        const titleEl = safeGetEl('stm-time-title');
        if (titleEl) titleEl.textContent = subjectName;

        const select = safeGetEl('stm-time-goal-select');
        if (select) {
            select.innerHTML = '<option value="">-- None Selected --</option>';
            if (Array.isArray(window.paceGoals)) {
                window.paceGoals.forEach(g => {
                    const deadlineStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function' && typeof Utils.parseDateSafe === 'function')
                        ? Utils.formatDate(Utils.parseDateSafe(g.deadline))
                        : (g.deadline || '');
                    select.innerHTML += `<option value="${g.id}">${g.target} (${deadlineStr})</option>`;
                });
            }
            select.value = '';
        }

        const startEl = safeGetEl('stm-time-start');
        const dateEl = safeGetEl('stm-time-date');
        if (startEl) startEl.value = '';
        if (dateEl) dateEl.value = '';

        if (window.subjectTimeLinks && window.subjectTimeLinks[subjectName]) {
            const link = window.subjectTimeLinks[subjectName];
            if (link.type === 'goal' && select) select.value = link.id;
            if (link.type === 'date') {
                if (startEl) startEl.value = link.startDate || '';
                if (dateEl) dateEl.value = link.date || '';
            }
        }

        if (typeof window.openModal === 'function') {
            window.openModal('subject-time-modal');
        }
    }

    function saveSubjectTimeGoal() {
        if (!window.currentSubjectForTimeGoal) return;
        const sub = window.currentSubjectForTimeGoal;
        const select = safeGetEl('stm-time-goal-select');
        const startEl = safeGetEl('stm-time-start');
        const dateEl = safeGetEl('stm-time-date');

        const goalId = select ? select.value : '';
        const startDateVal = startEl ? startEl.value : '';
        const dateVal = dateEl ? dateEl.value : '';

        if (!window.subjectTimeLinks) window.subjectTimeLinks = {};

        if (dateVal) {
            window.subjectTimeLinks[sub] = { type: 'date', startDate: startDateVal, date: dateVal };
        } else if (goalId) {
            window.subjectTimeLinks[sub] = { type: 'goal', id: goalId };
        } else {
            if (typeof window.recordItemDeletion === 'function') {
                window.recordItemDeletion(sub);
            }
            delete window.subjectTimeLinks[sub];
        }

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();
        if (typeof window.renderUI === 'function') window.renderUI();
        if (typeof window.closeModal === 'function') window.closeModal('subject-time-modal');
        if (typeof window.showToast === 'function') window.showToast("Subject Time Goal updated!", "success");
    }

    function clearSubjectTimeGoal() {
        if (!window.currentSubjectForTimeGoal) return;
        const sub = window.currentSubjectForTimeGoal;
        if (window.subjectTimeLinks && window.subjectTimeLinks[sub]) {
            if (typeof window.recordItemDeletion === 'function') {
                window.recordItemDeletion(sub);
            }
            delete window.subjectTimeLinks[sub];
        }
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();
        if (typeof window.renderUI === 'function') window.renderUI();
        if (typeof window.closeModal === 'function') window.closeModal('subject-time-modal');
        if (typeof window.showToast === 'function') window.showToast("Time Goal reset to default timeline.", "success");
    }

    // =========================================================================
    // 2. SUBJECT EDITING & DELETION
    // =========================================================================

    function updateEsmProgramDropdown() {
        const trackEl = safeGetEl('esm-track');
        const progSelect = safeGetEl('esm-program');
        if (!trackEl || !progSelect) return;
        const track = trackEl.value;
        progSelect.innerHTML = '';
        if (window.customPrograms && window.customPrograms[track]) {
            window.customPrograms[track].forEach(p => {
                const pName = p.name || p;
                progSelect.innerHTML += `<option value="${pName}">${pName}</option>`;
            });
        }
    }

    function openSubjectEditModal(subName) {
        let track = null;
        let sObj = null;
        if (Array.isArray(window.tracks) && window.syllabusStructure) {
            for (const t of window.tracks) {
                if (window.syllabusStructure[t.id]) {
                    sObj = window.syllabusStructure[t.id].find(s => s.subject === subName);
                    if (sObj) {
                        track = t.id;
                        break;
                    }
                }
            }
        }
        if (!sObj) return;

        const oldNameEl = safeGetEl('esm-old-name');
        const oldTrackEl = safeGetEl('esm-old-track');
        const trackEl = safeGetEl('esm-track');
        const nameEl = safeGetEl('esm-name');
        const progEl = safeGetEl('esm-program');

        if (oldNameEl) oldNameEl.value = subName;
        if (oldTrackEl) oldTrackEl.value = track;
        if (trackEl) trackEl.value = track;
        if (nameEl) nameEl.value = subName;

        updateEsmProgramDropdown();
        if (progEl) progEl.value = sObj.program;

        if (typeof window.openModal === 'function') {
            window.openModal('edit-subject-modal');
        }
    }

    function saveSubjectEditModal() {
        const oldNameEl = safeGetEl('esm-old-name');
        const oldTrackEl = safeGetEl('esm-old-track');
        const trackEl = safeGetEl('esm-track');
        const nameEl = safeGetEl('esm-name');
        const progEl = safeGetEl('esm-program');

        const oldName = oldNameEl ? oldNameEl.value : '';
        const oldTrack = oldTrackEl ? oldTrackEl.value : '';
        const newTrack = trackEl ? trackEl.value : '';
        const newName = nameEl ? nameEl.value.trim() : '';
        const newProg = progEl ? progEl.value : '';

        if (!newName) {
            if (typeof window.showToast === 'function') window.showToast("Subject name cannot be empty.", "error");
            return;
        }

        if (!window.syllabusStructure || !window.syllabusStructure[oldTrack]) return;
        const sObj = window.syllabusStructure[oldTrack].find(s => s.subject === oldName);
        if (!sObj) return;

        if (oldName.toLowerCase() !== newName.toLowerCase()) {
            const allSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
            const isGlobalDuplicate = allSubs.some(s => s.subject.toLowerCase() === newName.toLowerCase());
            if (isGlobalDuplicate) {
                if (typeof window.showToast === 'function') window.showToast("Subject name must be unique globally.", "error");
                return;
            }
        }

        let changed = false;

        // Handle Track Migration Safely
        if (oldTrack !== newTrack) {
            window.syllabusStructure[oldTrack] = window.syllabusStructure[oldTrack].filter(s => s.subject !== oldName);
            sObj.program = newProg;
            sObj.subject = newName;
            window.syllabusStructure[newTrack] = window.syllabusStructure[newTrack] || [];
            window.syllabusStructure[newTrack].push(sObj);

            if (AppState.tasks && Array.isArray(AppState.tasks)) {
                for (let i = 0; i < AppState.tasks.length; i++) {
                    if (AppState.tasks[i].type !== 'study') continue;
                    const oldKey = oldTrack + 'Tasks';
                    const newKey = newTrack + 'Tasks';
                    if (Array.isArray(AppState.tasks[i][oldKey])) {
                        const bIdx = AppState.tasks[i][oldKey].findIndex(b => b.subject === oldName);
                        if (bIdx > -1) {
                            const taskToMove = {
                                ...AppState.tasks[i][oldKey][bIdx],
                                subject: newName,
                                id: `${newTrack}-${AppState.tasks[i].id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                            };
                            AppState.tasks[i][oldKey].splice(bIdx, 1);
                            AppState.tasks[i][newKey] = AppState.tasks[i][newKey] || [];
                            AppState.tasks[i][newKey].push(taskToMove);
                        }
                    }
                }
            }
            changed = true;
        }

        // Standard Program or Name Changes within same track
        if (oldTrack === newTrack) {
            if (sObj.program !== newProg) {
                sObj.program = newProg;
                changed = true;
            }

            if (oldName !== newName) {
                sObj.subject = newName;
                if (AppState.tasks && Array.isArray(AppState.tasks)) {
                    for (let i = 0; i < AppState.tasks.length; i++) {
                        if (AppState.tasks[i].type !== 'study') continue;
                        const key = newTrack + 'Tasks';
                        if (Array.isArray(AppState.tasks[i][key])) {
                            AppState.tasks[i][key].forEach(b => { if (b.subject === oldName) b.subject = newName; });
                        }
                    }
                }
                changed = true;
            }
        }

        if (changed) {
            if (oldName !== newName) {
                if (AppState.subjectColors && AppState.subjectColors[oldName]) {
                    AppState.subjectColors[newName] = AppState.subjectColors[oldName];
                }
                if (AppState.currentFilter === oldName) {
                    AppState.currentFilter = newName;
                }

                if (window.chartVisibility && window.chartVisibility.subjects) {
                    if (window.chartVisibility.subjects[oldName] !== undefined) {
                        window.chartVisibility.subjects[newName] = window.chartVisibility.subjects[oldName];
                        delete window.chartVisibility.subjects[oldName];
                    }
                }
                if (window.chartVisibility && window.chartVisibility.revSubjects) {
                    if (window.chartVisibility.revSubjects[oldName] !== undefined) {
                        window.chartVisibility.revSubjects[newName] = window.chartVisibility.revSubjects[oldName];
                        delete window.chartVisibility.revSubjects[oldName];
                    }
                }

                if (Array.isArray(window.paceGoals)) {
                    window.paceGoals.forEach(g => {
                        if (g.type === 'subject' && g.target === oldName) g.target = newName;
                        if (g.type === 'bundle' && g.subjects) {
                            const idx = g.subjects.indexOf(oldName);
                            if (idx > -1) g.subjects[idx] = newName;
                        }
                    });
                }
                if (window.passedItems && Array.isArray(window.passedItems.subjects)) {
                    if (window.passedItems.subjects.includes(oldName)) {
                        window.passedItems.subjects = window.passedItems.subjects.filter(s => s !== oldName);
                        window.passedItems.subjects.push(newName);
                    }
                }
                if (window.revisionData) {
                    if (window.revisionData.active && window.revisionData.active.includes(oldName)) {
                        window.revisionData.active = window.revisionData.active.filter(s => s !== oldName);
                        window.revisionData.active.push(newName);
                    }
                    if (window.revisionData.progress && window.revisionData.progress[oldName]) {
                        window.revisionData.progress[newName] = window.revisionData.progress[oldName];
                        delete window.revisionData.progress[oldName];
                    }
                }
                if (window.subjectTimeLinks && window.subjectTimeLinks[oldName]) {
                    window.subjectTimeLinks[newName] = window.subjectTimeLinks[oldName];
                    delete window.subjectTimeLinks[oldName];
                }
            }

            if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();
            if (typeof window.renderUI === 'function') window.renderUI();
            if (window.chartDebounce) clearTimeout(window.chartDebounce);
            window.chartDebounce = setTimeout(() => {
                if (typeof window.renderTrendCharts === 'function') {
                    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(window.renderTrendCharts);
                    else window.renderTrendCharts();
                }
            }, 600);
            if (typeof window.showToast === 'function') window.showToast("Subject updated successfully!", "success");
        }
        if (typeof window.closeModal === 'function') window.closeModal('edit-subject-modal');
    }

    function requestDeleteSubjectFromModal() {
        const oldNameEl = safeGetEl('esm-old-name');
        const subName = oldNameEl ? oldNameEl.value : '';
        if (typeof window.openConfirmModal === 'function') {
            window.openConfirmModal("Delete Subject", `Are you sure you want to completely delete "${subName}"? This action cannot be undone.`, () => {
                executeDeleteSubjectFromModal(subName);
            });
        } else {
            executeDeleteSubjectFromModal(subName);
        }
    }

    function executeDeleteSubjectFromModal(targetName) {
        const oldTrackEl = safeGetEl('esm-old-track');
        const track = oldTrackEl ? oldTrackEl.value : '';

        if (typeof window.recordItemDeletion === 'function') {
            window.recordItemDeletion(targetName);
            if (Array.isArray(window.paceGoals)) {
                window.paceGoals.filter(g => g.type === 'subject' && g.target === targetName).forEach(g => window.recordItemDeletion(g.id));
            }
        }

        if (window.syllabusStructure && window.syllabusStructure[track]) {
            window.syllabusStructure[track] = window.syllabusStructure[track].filter(s => s.subject !== targetName);
        }
        if (window.chartVisibility && window.chartVisibility.subjects) {
            delete window.chartVisibility.subjects[targetName];
        }
        if (window.chartVisibility && window.chartVisibility.revSubjects) {
            delete window.chartVisibility.revSubjects[targetName];
        }

        if (AppState.tasks && Array.isArray(AppState.tasks)) {
            for (let i = 0; i < AppState.tasks.length; i++) {
                if (AppState.tasks[i].type !== 'study') continue;
                const key = track + 'Tasks';
                if (Array.isArray(AppState.tasks[i][key])) {
                    AppState.tasks[i][key] = AppState.tasks[i][key].map(b => b.subject === targetName ? { subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: b.id } : b);
                }
            }
        }

        if (AppState.currentFilter === targetName) AppState.currentFilter = 'All';

        if (Array.isArray(window.paceGoals)) {
            window.paceGoals = window.paceGoals.filter(g => !(g.type === 'subject' && g.target === targetName));
            window.paceGoals.forEach(g => {
                if (g.type === 'bundle' && g.subjects) g.subjects = g.subjects.filter(s => s !== targetName);
            });
        }
        if (window.passedItems && Array.isArray(window.passedItems.subjects)) {
            window.passedItems.subjects = window.passedItems.subjects.filter(s => s !== targetName);
        }
        if (window.revisionData) {
            if (window.revisionData.active) window.revisionData.active = window.revisionData.active.filter(s => s !== targetName);
            if (window.revisionData.progress && window.revisionData.progress[targetName]) delete window.revisionData.progress[targetName];
        }
        if (window.subjectTimeLinks && window.subjectTimeLinks[targetName]) delete window.subjectTimeLinks[targetName];

        if (typeof window.recalculateTotals === 'function') window.recalculateTotals();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();
        if (typeof window.renderUI === 'function') window.renderUI();
        if (typeof window.closeModal === 'function') window.closeModal('edit-subject-modal');
        if (typeof window.showToast === 'function') window.showToast(`Subject "${targetName}" deleted.`, "success");
    }

    // =========================================================================
    // 3. SUBJECT PROGRESS & NAVIGATION VISUALIZATIONS
    // =========================================================================

    function renderSubjectNavigation() {
        const container = safeGetEl('subject-navigation-container');
        if (!container) return;
        let html = '';

        const btnClass = (val) => {
            const isActive = AppState.currentFilter === val;
            return `active:scale-95 whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-transparent scale-105' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-md'}`;
        };

        // ALL button and Revise Setup
        html += `<div class="mb-3 flex gap-2"><button class="${btnClass('All')}" onclick="window.setFilter('All')">All Tasks</button><button class="active:scale-95 whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all duration-300 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/60 shadow-sm flex items-center gap-1.5" onclick="window.openRevisionModal()"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Revise Subject</button></div>`;

        if (Array.isArray(window.tracks) && window.customPrograms && window.syllabusStructure) {
            window.tracks.forEach(trackObj => {
                const track = trackObj.id;
                if (window.customPrograms[track]) {
                    window.customPrograms[track].forEach(prog => {
                        const progName = prog.name || prog;
                        const subs = (window.syllabusStructure[track] || []).filter(s => s.program === progName).sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
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
    }

    function renderSubjectProgress(subjectStats) {
        const container = safeGetEl('subject-progress-container');
        if (!container) return;
        if (!subjectStats || Object.keys(subjectStats).length === 0 || typeof Object.values(subjectStats)[0] !== 'object' || !('totalChapters' in (Object.values(subjectStats)[0] || {}))) {
            subjectStats = window.lastSubjectStats || {};
        }

        const colorPairs = [
            { bg: "bg-gradient-to-r from-indigo-400 to-indigo-600", text: "text-indigo-500" }, { bg: "bg-gradient-to-r from-emerald-400 to-emerald-600", text: "text-emerald-500" },
            { bg: "bg-gradient-to-r from-violet-400 to-violet-600", text: "text-violet-500" }, { bg: "bg-gradient-to-r from-rose-400 to-rose-600", text: "text-rose-500" },
            { bg: "bg-gradient-to-r from-amber-400 to-amber-600", text: "text-amber-500" }, { bg: "bg-gradient-to-r from-cyan-400 to-cyan-600", text: "text-cyan-500" }
        ];

        let pIdx = 0;
        let html = '';
        if (Array.isArray(window.tracks) && window.customPrograms && window.syllabusStructure) {
            window.tracks.forEach(trackObj => {
                const track = trackObj.id;
                const trackName = trackObj.name || track;
                if (window.customPrograms[track]) {
                    const trackSubs = window.syllabusStructure[track] || [];
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
                        const subs = window.syllabusStructure[track] ? window.syllabusStructure[track].filter(s => s.program === progName) : [];
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
    }

    function renderCategoryProgress(subjectStats) {
        const container = safeGetEl('category-progress-container');
        if (!container) return;
        if (!subjectStats || Object.keys(subjectStats).length === 0 || typeof Object.values(subjectStats)[0] !== 'object' || !('totalChapters' in (Object.values(subjectStats)[0] || {}))) {
            subjectStats = window.lastSubjectStats || {};
        }

        const colors = ['text-indigo-500', 'text-emerald-500', 'text-violet-500', 'text-rose-500', 'text-amber-500', 'text-cyan-500'];
        const shadows = ['shadow-[0_0_15px_rgba(99,102,241,0.3)]', 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', 'shadow-[0_0_15px_rgba(139,92,246,0.3)]', 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', 'shadow-[0_0_15px_rgba(6,182,212,0.3)]'];

        let html = '';
        let catIdx = 0;

        if (Array.isArray(window.tracks) && window.customPrograms && window.syllabusStructure) {
            window.tracks.map(t => t.id).forEach(track => {
                if (window.customPrograms[track]) {
                    window.customPrograms[track].forEach(prog => {
                        const progName = prog.name || prog;
                        if (window.programVisibility && window.programVisibility[progName] === false) return;
                        const subs = window.syllabusStructure[track] ? window.syllabusStructure[track].filter(s => s.program === progName) : [];
                        if (subs.length === 0) return;

                        let totalChap = 0;
                        let doneChap = 0;
                        subs.forEach(sub => {
                            const s = subjectStats[sub.subject];
                            totalChap += (s ? s.totalChapters : sub.chapters) || 0;
                            doneChap += (s ? s.effectiveChapters : 0) || 0;
                        });
                        const perc = totalChap > 0 ? Math.round((doneChap / totalChap) * 100) : 0;
                        const color = colors[catIdx % colors.length];
                        const shadow = shadows[catIdx % shadows.length];

                        html += `<div class="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between group">
                            <div>
                                <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform">${progName}</h3>
                                <p class="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">${Math.round(doneChap)} / ${totalChap} Chapters</p>
                            </div>
                            <button onclick="window.openProgramCompletionsModal('${track}', '${progName.replace(/'/g, "\\'")}')" class="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 ${shadow} rounded-full bg-white dark:bg-slate-800 shrink-0 hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer border-0 p-0" title="View Subject Completions">
                                <svg class="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36"><path class="text-slate-100 dark:text-slate-700/50" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path class="${color}" stroke-width="3.5" stroke-dasharray="${perc}, 100" stroke="currentColor" fill="none" stroke-linecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
                                <span class="absolute text-[9px] md:text-[10px] font-black ${color}">${perc}%</span>
                            </button>
                        </div>`;
                        catIdx++;
                    });
                }
            });
        }
        container.innerHTML = html;
    }

    function renderTrackProgress(subjectStats) {
        const container = safeGetEl('track-progress-container');
        if (!container) return;
        if (!subjectStats || Object.keys(subjectStats).length === 0 || typeof Object.values(subjectStats)[0] !== 'object' || !('totalChapters' in (Object.values(subjectStats)[0] || {}))) {
            subjectStats = window.lastSubjectStats || {};
        }

        const colors = ['text-blue-500', 'text-purple-500', 'text-teal-500', 'text-rose-500', 'text-orange-500', 'text-emerald-500'];
        const shadows = ['shadow-[0_0_15px_rgba(59,130,246,0.3)]', 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', 'shadow-[0_0_15px_rgba(20,184,166,0.3)]', 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', 'shadow-[0_0_15px_rgba(249,115,22,0.3)]', 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'];

        let html = '';
        let trackIdx = 0;

        if (Array.isArray(window.tracks) && window.syllabusStructure) {
            window.tracks.forEach(trackObj => {
                const trackId = trackObj.id;
                const trackName = trackObj.name || trackId;
                const subs = window.syllabusStructure[trackId] || [];
                if (subs.length === 0) return;

                let totalChap = 0;
                let doneChap = 0;
                subs.forEach(sub => {
                    const s = subjectStats[sub.subject];
                    totalChap += (s ? s.totalChapters : sub.chapters) || 0;
                    doneChap += (s ? s.effectiveChapters : 0) || 0;
                });
                const perc = totalChap > 0 ? Math.round((doneChap / totalChap) * 100) : 0;
                const color = colors[trackIdx % colors.length];
                const shadow = shadows[trackIdx % shadows.length];

                html += `<div class="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between group">
                    <div>
                        <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform">${trackName}</h3>
                        <p class="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">${Math.round(doneChap)} / ${totalChap} Chapters</p>
                    </div>
                    <button onclick="window.openProgramCompletionsModal('${trackId}', 'EntireTrack')" class="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 ${shadow} rounded-full bg-white dark:bg-slate-800 shrink-0 hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer border-0 p-0" title="View Track Completions">
                        <svg class="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
                            <path class="text-slate-100 dark:text-slate-700/50" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path class="${color}" stroke-width="3.5" stroke-dasharray="${perc}, 100" stroke="currentColor" fill="none" stroke-linecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span class="absolute text-[9px] md:text-[10px] font-black ${color}">${perc}%</span>
                    </button>
                </div>`;
                trackIdx++;
            });
        }
        container.innerHTML = html;
    }

    function openProgramCompletionsModal(track, programName) {
        const subjectStats = window.lastSubjectStats || {};
        let subs = [];
        let title = '';
        let subtitle = '';

        const allSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];

        if (track === 'Global' || !track) {
            subs = allSubs;
            title = 'Global Completion Status';
            subtitle = 'Subject completions across the entire syllabus';
        } else if (programName === 'EntireTrack' || !programName) {
            subs = window.syllabusStructure && window.syllabusStructure[track] ? window.syllabusStructure[track] : [];
            title = track + ' Track Completion Status';
            subtitle = `Subject completions inside the ${track} track`;
        } else if (programName === 'Global') {
            subs = allSubs;
            title = 'Global Completion Status';
            subtitle = 'Subject completions across the entire syllabus';
        } else {
            subs = window.syllabusStructure && window.syllabusStructure[track] ? window.syllabusStructure[track].filter(s => s.program === programName) : [];
            title = programName + ' Completion Status';
            subtitle = `Subject completions inside the ${programName} program`;
        }

        const titleEl = safeGetEl('pcm-completions-title');
        const subEl = safeGetEl('pcm-completions-subtitle');
        if (titleEl) titleEl.textContent = title;
        if (subEl) subEl.textContent = subtitle;

        const container = safeGetEl('pcm-completions-container');
        if (!container) return;

        let html = '';
        if (subs.length === 0) {
            html = '<div class="text-center text-xs text-slate-500 font-bold py-6">No subjects found in this program.</div>';
        } else {
            html = '<div class="flex flex-col gap-4 py-2">';

            const colorPairs = [
                { bg: "bg-gradient-to-r from-indigo-400 to-indigo-600", text: "text-indigo-500" }, { bg: "bg-gradient-to-r from-emerald-400 to-emerald-600", text: "text-emerald-500" },
                { bg: "bg-gradient-to-r from-violet-400 to-violet-600", text: "text-violet-500" }, { bg: "bg-gradient-to-r from-rose-400 to-rose-600", text: "text-rose-500" },
                { bg: "bg-gradient-to-r from-amber-400 to-amber-600", text: "text-amber-500" }, { bg: "bg-gradient-to-r from-cyan-400 to-cyan-600", text: "text-cyan-500" }
            ];

            subs.forEach((sub, idx) => {
                const stats = subjectStats[sub.subject] || { totalChapters: 0, effectiveChapters: 0 };
                const perc = stats.totalChapters > 0 ? Math.min(100, (stats.effectiveChapters / stats.totalChapters) * 100) : 0;

                let cleanSubName = sub.subject;
                const pName = sub.program || programName;
                if (pName && cleanSubName.startsWith(pName + ' - ')) cleanSubName = cleanSubName.replace(pName + ' - ', '');
                else if (pName && cleanSubName.startsWith(pName + ' ')) cleanSubName = cleanSubName.replace(pName + ' ', '');

                const cp = colorPairs[idx % colorPairs.length];

                html += `
                    <div class="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm flex flex-col gap-2.5">
                        <div class="flex justify-between items-center text-xs font-black">
                            <span class="text-slate-800 dark:text-slate-200">${cleanSubName}</span>
                            <span class="text-slate-500 font-bold">${Math.round(stats.effectiveChapters)} / ${stats.totalChapters} Ch <span class="${cp.text}">(${Math.round(perc)}%)</span></span>
                        </div>
                        <div class="w-full bg-slate-100 dark:bg-slate-700/50 h-2.5 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-600/30 shadow-inner">
                            <div class="${cp.bg} h-full rounded-full transition-all duration-500 ease-out" style="width: ${perc}%"></div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        container.innerHTML = html;
        if (typeof window.openModal === 'function') {
            window.openModal('program-completions-modal');
        }
    }

    // =========================================================================
    // EXPORTS & GLOBAL ASSIGNMENTS
    // =========================================================================

    const SubjectGoals = {
        openSubjectTimeModal,
        saveSubjectTimeGoal,
        clearSubjectTimeGoal,
        updateEsmProgramDropdown,
        openSubjectEditModal,
        saveSubjectEditModal,
        requestDeleteSubjectFromModal,
        executeDeleteSubjectFromModal,
        renderSubjectNavigation,
        renderSubjectProgress,
        renderCategoryProgress,
        renderTrackProgress,
        openProgramCompletionsModal,
        initSubjectGoalsEventListeners
    };

    function initSubjectGoalsEventListeners() {
        if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
        if (global._subjectGoalsListenersInitialized) return;
        global._subjectGoalsListenersInitialized = true;

        document.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'esm-track') {
                updateEsmProgramDropdown();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('#esm-btn-delete, [data-esm-delete]')) {
                requestDeleteSubjectFromModal();
                return;
            }
            if (e.target.closest('#esm-btn-save, [data-esm-save]')) {
                saveSubjectEditModal();
                return;
            }
        });
    }

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initSubjectGoalsEventListeners);
        } else {
            initSubjectGoalsEventListeners();
        }
    }

    window.SubjectGoals = SubjectGoals;
    window.initSubjectGoalsEventListeners = initSubjectGoalsEventListeners;

    window.openSubjectTimeModal = openSubjectTimeModal;
    window.saveSubjectTimeGoal = saveSubjectTimeGoal;
    window.clearSubjectTimeGoal = clearSubjectTimeGoal;

    window.updateEsmProgramDropdown = updateEsmProgramDropdown;
    window.openSubjectEditModal = openSubjectEditModal;
    window.saveSubjectEditModal = saveSubjectEditModal;
    window.requestDeleteSubjectFromModal = requestDeleteSubjectFromModal;
    window.executeDeleteSubjectFromModal = executeDeleteSubjectFromModal;

    window.renderSubjectNavigation = renderSubjectNavigation;
    window.renderSubjectProgress = renderSubjectProgress;
    window.renderCategoryProgress = renderCategoryProgress;
    window.renderTrackProgress = renderTrackProgress;
    window.openProgramCompletionsModal = openProgramCompletionsModal;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SubjectGoals;
    }

})(typeof window !== 'undefined' ? window : global);
