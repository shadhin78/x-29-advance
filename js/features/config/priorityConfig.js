/**
 * X-29 Advance - Global Priority Configuration Module
 * File: js/features/config/priorityConfig.js
 *
 * Provides:
 * - Priority order ranking (Tracks, Programs, Subjects, Actions)
 * - Drag/Drop / Arrow-based reordering handlers
 * - Direct priority dropdown handling
 * - sortAllCustomData and syncPriorityInputsFromDOM
 * - renderPriorityConfig & savePriorities
 */

(function (global) {
    'use strict';

    /**
     * Sorts all customPrograms, syllabusStructure, and customActions by priority then order.
     */
    function sortAllCustomData() {
        const tracks = Array.isArray(window.tracks) ? window.tracks.map(t => t.id) : [];
        const customPrograms = window.customPrograms || {};
        const syllabusStructure = window.syllabusStructure || {};

        // 1. Sort customPrograms
        tracks.forEach(track => {
            if (Array.isArray(customPrograms[track])) {
                customPrograms[track].sort((a, b) => {
                    const pA = a.priority !== undefined ? a.priority : 3;
                    const pB = b.priority !== undefined ? b.priority : 3;
                    if (pA !== pB) return pA - pB;
                    const oA = a.order !== undefined ? a.order : 999;
                    const oB = b.order !== undefined ? b.order : 999;
                    return oA - oB;
                });
            }
        });

        // 2. Sort syllabusStructure track subjects
        tracks.forEach(track => {
            if (Array.isArray(syllabusStructure[track])) {
                syllabusStructure[track].sort((a, b) => {
                    const pA = a.priority !== undefined ? a.priority : 3;
                    const pB = b.priority !== undefined ? b.priority : 3;
                    if (pA !== pB) return pA - pB;
                    const oA = a.order !== undefined ? a.order : 999;
                    const oB = b.order !== undefined ? b.order : 999;
                    return oA - oB;
                });
            }
        });

        // 3. Sort customActions
        if (Array.isArray(window.customActions)) {
            window.customActions.sort((a, b) => {
                const pA = a.priority !== undefined ? a.priority : 3;
                const pB = b.priority !== undefined ? b.priority : 3;
                if (pA !== pB) return pA - pB;
                const oA = a.order !== undefined ? a.order : 999;
                const oB = b.order !== undefined ? b.order : 999;
                return oA - oB;
            });
        }
    }

    /**
     * Normalizes priority values for Tracks, Programs, Subjects, and Actions
     * ensuring consecutive 1..N priorities with valid orders.
     */
    function normalizePriorities() {
        // 1. Tracks
        if (Array.isArray(window.tracks)) {
            const priorities = window.tracks.map(t => t.priority);
            const hasDuplicates = new Set(priorities).size !== priorities.length;
            const hasInvalid = priorities.some(p => typeof p !== 'number' || p < 1 || p > window.tracks.length);
            if (hasDuplicates || hasInvalid) {
                window.tracks.forEach((t, idx) => {
                    t.priority = idx + 1;
                    t.order = idx;
                });
            }
        }

        // 2. Programs
        const flatProgs = [];
        (window.tracks || []).forEach(trackObj => {
            if (window.customPrograms && window.customPrograms[trackObj.id]) {
                window.customPrograms[trackObj.id].forEach(p => {
                    flatProgs.push(p);
                });
            }
        });
        const progPriorities = flatProgs.map(p => p.priority);
        const progsHasDuplicates = new Set(progPriorities).size !== progPriorities.length;
        const progsHasInvalid = progPriorities.some(p => typeof p !== 'number' || p < 1 || p > flatProgs.length);
        if (progsHasDuplicates || progsHasInvalid) {
            flatProgs.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
            flatProgs.forEach((p, idx) => {
                p.priority = idx + 1;
                p.order = idx;
            });
        }

        // 3. Subjects
        const flatSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
        const subPriorities = flatSubs.map(s => s.priority);
        const subsHasDuplicates = new Set(subPriorities).size !== subPriorities.length;
        const subsHasInvalid = subPriorities.some(p => typeof p !== 'number' || p < 1 || p > flatSubs.length);
        if (subsHasDuplicates || subsHasInvalid) {
            flatSubs.forEach((s, idx) => {
                s.priority = idx + 1;
                s.order = idx;
            });
        }

        // 4. Actions
        if (Array.isArray(window.customActions)) {
            const actionPriorities = window.customActions.map(a => a.priority);
            const actionsHasDuplicates = new Set(actionPriorities).size !== actionPriorities.length;
            const actionsHasInvalid = actionPriorities.some(p => typeof p !== 'number' || p < 1 || p > window.customActions.length);
            if (actionsHasDuplicates || actionsHasInvalid) {
                window.customActions.forEach((a, idx) => {
                    a.priority = idx + 1;
                    a.order = idx;
                });
            }
        }
    }

    /**
     * Reads all current priority select inputs from the DOM and commits them to active state.
     */
    function syncPriorityInputsFromDOM() {
        // Tracks
        if (Array.isArray(window.tracks)) {
            window.tracks.forEach((t, idx) => {
                const select = document.getElementById(`priority-track-${t.id}`);
                if (select) {
                    const val = parseInt(select.value);
                    t.priority = isNaN(val) ? 3 : val;
                }
                t.order = idx;
            });
        }

        // Programs
        const flatProgs = typeof window.getAllPrograms === 'function' ? window.getAllPrograms() : [];
        flatProgs.forEach((p, idx) => {
            const select = document.getElementById(`priority-program-${p.id}`);
            const trackProgs = window.customPrograms ? window.customPrograms[p._trackId] : null;
            const orig = Array.isArray(trackProgs) ? trackProgs.find(x => x.id === p.id) : null;
            if (orig) {
                if (select) {
                    const val = parseInt(select.value);
                    orig.priority = isNaN(val) ? 3 : val;
                }
                orig.order = idx;
            }
        });

        // Subjects
        const flatSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
        flatSubs.forEach((s, idx) => {
            const safeSubId = s.subject.replace(/[^a-zA-Z0-9]/g, '-');
            const select = document.getElementById(`priority-subject-${safeSubId}`);
            if (select) {
                const val = parseInt(select.value);
                s.priority = isNaN(val) ? 3 : val;
            }
            s.order = idx;
        });

        // Daily Actions
        if (Array.isArray(window.customActions)) {
            window.customActions.forEach((a, idx) => {
                const select = document.getElementById(`priority-action-${a.id}`);
                if (select) {
                    const val = parseInt(select.value);
                    a.priority = isNaN(val) ? 3 : val;
                }
                a.order = idx;
            });
        }
    }

    /**
     * Moves a Track up or down in the priority order.
     */
    function moveTrack(index, direction) {
        const list = window.tracks;
        if (!Array.isArray(list)) return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= list.length) return;

        syncPriorityInputsFromDOM();

        const itemA = list[index];
        const itemB = list[targetIndex];

        // Swap priority and order
        const tempPriority = itemA.priority;
        itemA.priority = itemB.priority;
        itemB.priority = tempPriority;

        const tempOrder = itemA.order;
        itemA.order = itemB.order;
        itemB.order = tempOrder;

        // Swap position in array
        list[index] = itemB;
        list[targetIndex] = itemA;

        // Re-assign order
        list.forEach((t, idx) => { t.order = idx; });

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        renderPriorityConfig();
        showToast("Track order updated!", "success");
    }

    /**
     * Moves a Program globally up or down across all tracks.
     */
    function moveProgramGlobal(flatIndex, direction) {
        syncPriorityInputsFromDOM();

        const customPrograms = window.customPrograms || {};
        const tracksList = Array.isArray(window.tracks) ? window.tracks : [];

        // Build a globally-sorted flat list of all programs across all tracks
        const flat = [];
        tracksList.forEach(t => {
            (customPrograms[t.id] || []).forEach(p => {
                flat.push({ trackId: t.id, prog: p });
            });
        });

        flat.sort((a, b) => {
            const pA = a.prog.priority !== undefined ? a.prog.priority : 999;
            const pB = b.prog.priority !== undefined ? b.prog.priority : 999;
            if (pA !== pB) return pA - pB;
            return (a.prog.order ?? 999) - (b.prog.order ?? 999);
        });

        const targetIndex = flatIndex + direction;
        if (targetIndex < 0 || targetIndex >= flat.length) return;

        const itemA = flat[flatIndex].prog;
        const itemB = flat[targetIndex].prog;

        // Swap priority and order
        const tempPriority = itemA.priority;
        itemA.priority = itemB.priority;
        itemB.priority = tempPriority;

        const tempOrder = itemA.order;
        itemA.order = itemB.order;
        itemB.order = tempOrder;

        // Swap the two items in the flat list
        const temp = flat[flatIndex];
        flat[flatIndex] = flat[targetIndex];
        flat[targetIndex] = temp;

        // Re-assign order
        flat.forEach((item, idx) => {
            item.prog.order = idx;
        });

        // Re-sort each track's local array by the updated priorities & orders
        tracksList.forEach(t => {
            if (customPrograms[t.id]) {
                customPrograms[t.id].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
            }
        });

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        renderPriorityConfig();
        showToast("Program order updated!", "success");
    }

    /**
     * Moves a Subject globally up or down across all subjects.
     */
    function moveSubjectGlobal(index, direction) {
        const list = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= list.length) return;

        // Sync current input values from DOM to state
        syncPriorityInputsFromDOM();

        const itemA = list[index];
        const itemB = list[targetIndex];

        // Swap priority and order
        const tempPriority = itemA.priority;
        itemA.priority = itemB.priority;
        itemB.priority = tempPriority;

        const tempOrder = itemA.order;
        itemA.order = itemB.order;
        itemB.order = tempOrder;

        // Re-assign order globally across all subjects
        list.forEach((s, idx) => {
            s.order = idx;
        });

        sortAllCustomData();

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        renderPriorityConfig();
        showToast("Subject order updated!", "success");
    }

    /**
     * Moves a Daily Action up or down in priority order.
     */
    function moveAction(index, direction) {
        const list = window.customActions;
        if (!Array.isArray(list)) return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= list.length) return;

        // Sync current input values from DOM to state
        syncPriorityInputsFromDOM();

        const itemA = list[index];
        const itemB = list[targetIndex];

        // Swap priority and order
        const tempPriority = itemA.priority;
        itemA.priority = itemB.priority;
        itemB.priority = tempPriority;

        const tempOrder = itemA.order;
        itemA.order = itemB.order;
        itemB.order = tempOrder;

        // Swap positions in array
        list[index] = itemB;
        list[targetIndex] = itemA;

        // Re-assign order
        list.forEach((a, idx) => { a.order = idx; });

        sortAllCustomData();

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        renderPriorityConfig();
        showToast("Daily action order updated!", "success");
    }

    /**
     * Unified priority mover helper.
     */
    function movePriorityItem(type, parent, index, direction) {
        const dir = (direction === 'up' || direction === -1) ? -1 : 1;
        if (type === 'track') return moveTrack(index, dir);
        if (type === 'program') return moveProgramGlobal(index, dir);
        if (type === 'subject') return moveSubjectGlobal(index, dir);
        if (type === 'action') return moveAction(index, dir);
    }

    /**
     * Handles direct change on a priority dropdown select element.
     */
    function onPriorityDropdownChange(category, itemId, newValue) {
        const val = parseInt(newValue);
        if (isNaN(val)) return;

        const customPrograms = window.customPrograms || {};
        const tracksList = Array.isArray(window.tracks) ? window.tracks : [];

        if (category === 'track') {
            const item = tracksList.find(t => t.id === itemId);
            if (!item) return;
            const oldPriority = item.priority;
            const other = tracksList.find(t => t.id !== itemId && t.priority === val);
            if (other) {
                other.priority = oldPriority;
            }
            item.priority = val;
            // Sort by priority and update order
            tracksList.sort((a, b) => a.priority - b.priority);
            tracksList.forEach((t, idx) => {
                t.priority = idx + 1;
                t.order = idx;
            });
        } else if (category === 'program') {
            const flatProgs = typeof window.getAllPrograms === 'function' ? window.getAllPrograms() : [];
            const item = flatProgs.find(p => p.id === itemId);
            if (!item) return;
            const oldPriority = item.priority;
            const other = flatProgs.find(p => p.id !== itemId && p.priority === val);

            // update in customPrograms
            tracksList.forEach(trackObj => {
                if (customPrograms[trackObj.id]) {
                    customPrograms[trackObj.id].forEach(p => {
                        if (p.id === itemId) p.priority = val;
                        else if (other && p.id === other.id) p.priority = oldPriority;
                    });
                }
            });

            // Collect all custom program objects globally
            const actualProgs = [];
            tracksList.forEach(trackObj => {
                if (customPrograms[trackObj.id]) {
                    customPrograms[trackObj.id].forEach(p => {
                        actualProgs.push(p);
                    });
                }
            });

            // Sort actual program objects globally by priority, then order
            actualProgs.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));

            // Re-assign global priorities and orders sequentially
            actualProgs.forEach((p, idx) => {
                p.priority = idx + 1;
                p.order = idx;
            });

            // Finally, sort each track's program array locally by their updated global priorities & orders
            tracksList.forEach(trackObj => {
                if (Array.isArray(customPrograms[trackObj.id])) {
                    customPrograms[trackObj.id].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
                }
            });
        } else if (category === 'subject') {
            const flatSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
            const item = flatSubs.find(s => s.subject === itemId);
            if (!item) return;
            const oldPriority = item.priority;
            const other = flatSubs.find(s => s.subject !== itemId && s.priority === val);
            if (other) {
                other.priority = oldPriority;
            }
            item.priority = val;

            // Sort subjects
            flatSubs.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
            flatSubs.forEach((s, idx) => {
                s.priority = idx + 1;
                s.order = idx;
            });
        } else if (category === 'action') {
            const actionsList = Array.isArray(window.customActions) ? window.customActions : [];
            const item = actionsList.find(a => a.id === itemId);
            if (!item) return;
            const oldPriority = item.priority;
            const other = actionsList.find(a => a.id !== itemId && a.priority === val);
            if (other) {
                other.priority = oldPriority;
            }
            item.priority = val;

            actionsList.sort((a, b) => a.priority - b.priority);
            actionsList.forEach((a, idx) => {
                a.priority = idx + 1;
                a.order = idx;
            });
        }

        sortAllCustomData();

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        renderPriorityConfig();
    }

    /**
     * Renders the Set Priority tab interface with tracks, programs, subjects, and actions lists.
     */
    function renderPriorityConfig() {
        const container = document.getElementById('sys-content-priority');
        if (!container) return;

        const tracksList = Array.isArray(window.tracks) ? window.tracks : [];
        const customPrograms = window.customPrograms || {};
        const syllabusStructure = window.syllabusStructure || {};
        const customActions = Array.isArray(window.customActions) ? window.customActions : [];

        // Prevent redundant render cycles & flickering by guarding identical data updates
        const currentDataString = JSON.stringify({
            tracks: tracksList,
            programs: customPrograms,
            syllabus: syllabusStructure,
            actions: customActions
        });

        if (currentDataString === window.lastPriorityRenderData && container.innerHTML.trim() !== '') {
            return;
        }
        window.lastPriorityRenderData = currentDataString;

        const arrowUpBtn = (onclick, disabled) => `
            <button onclick="${onclick}" ${disabled ? 'disabled' : ''}
                class="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-indigo-100 dark:bg-slate-700 dark:hover:bg-indigo-900/50 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7"></path></svg>
            </button>`;

        const arrowDownBtn = (onclick, disabled) => `
            <button onclick="${onclick}" ${disabled ? 'disabled' : ''}
                class="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-indigo-100 dark:bg-slate-700 dark:hover:bg-indigo-900/50 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
            </button>`;

        const rankBadge = (n, color) => `
            <span class="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[10px] font-black tracking-tight" style="background:${color}22;color:${color};border:1px solid ${color}55">#${n}</span>`;

        let html = `<p class="text-xs text-slate-500 dark:text-slate-400 mb-5 font-bold">Use ↑ ↓ arrows to reorder. Rank numbers update automatically. Track order affects Program Completion cards and Subject Progress.</p>`;

        // ── Section: Tracks (affects program completion rate + subject progress display order) ──
        html += `
            <div class="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-indigo-500 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"></path></svg>
                    Tracks Priority Order
                    <span class="ml-auto text-[8px] font-bold text-slate-400 normal-case tracking-normal">(Affects Completion Rate &amp; Subject Progress)</span>
                </h4>
                <div class="flex flex-col gap-2">`;

        if (tracksList.length === 0) {
            html += `<p class="text-xs font-bold text-slate-400">No tracks found.</p>`;
        } else {
            tracksList.forEach((t, idx) => {
                const trackColors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#a855f7', '#f97316'];
                const tc = trackColors[idx % trackColors.length];
                html += `
                    <div class="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:border-indigo-400 transition-all">
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            ${rankBadge(idx + 1, tc)}
                            <div class="flex flex-col min-w-0">
                                <span class="text-xs font-black text-slate-800 dark:text-slate-200">${t.name || t.id}</span>
                                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Track &middot; Controls program card &amp; subject order</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0 ml-2">
                            <select id="priority-track-${t.id}" onchange="window.onPriorityDropdownChange('track', '${t.id}', this.value)"
                                class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-[9px] text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 max-w-[72px]">
                                ${(() => {
                                    let options = '';
                                    for (let i = 1; i <= tracksList.length; i++) {
                                        options += `<option value="${i}" ${(t.priority ?? 3) === i ? 'selected' : ''}>${i}</option>`;
                                    }
                                    return options;
                                })()}
                            </select>
                            <div class="flex flex-col gap-0.5 shrink-0">
                                ${arrowUpBtn(`window.moveTrack(${idx}, -1)`, idx === 0)}
                                ${arrowDownBtn(`window.moveTrack(${idx}, 1)`, idx === tracksList.length - 1)}
                            </div>
                        </div>
                    </div>`;
            });
        }
        html += `</div></div>`;

        // ── Section: Programs (flat global list, independent from subjects) ──
        html += `
            <div class="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-violet-500 border-b border-slate-200/60 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    Programs Priority Order
                    <span class="ml-auto text-[8px] font-bold text-slate-400 normal-case tracking-normal">(Independent from Subjects)</span>
                </h4>
                <div class="flex flex-col gap-2">`;

        // Build flat sorted list of all programs across all tracks
        const flatProgList = [];
        tracksList.forEach(trackObj => {
            (customPrograms[trackObj.id] || []).forEach(p => {
                flatProgList.push({ trackId: trackObj.id, trackName: trackObj.name || trackObj.id, prog: p });
            });
        });

        flatProgList.sort((a, b) => {
            const pA = a.prog.priority !== undefined ? a.prog.priority : 999;
            const pB = b.prog.priority !== undefined ? b.prog.priority : 999;
            if (pA !== pB) return pA - pB;
            return (a.prog.order ?? 999) - (b.prog.order ?? 999);
        });

        if (flatProgList.length === 0) {
            html += `<p class="text-xs font-bold text-slate-400">No programs found.</p>`;
        } else {
            const progColors = ['#7c3aed', '#6366f1', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#0284c7'];
            flatProgList.forEach((item, flatIdx) => {
                const pc = progColors[flatIdx % progColors.length];
                html += `
                    <div class="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:border-violet-400 transition-all">
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            ${rankBadge(flatIdx + 1, pc)}
                            <div class="flex flex-col min-w-0">
                                <span class="text-xs font-black text-slate-800 dark:text-slate-200 truncate" title="${item.prog.name || item.prog.id}">${item.prog.name || item.prog.id}</span>
                                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">${item.trackName}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0 ml-2">
                            <select id="priority-program-${item.prog.id}" onchange="window.onPriorityDropdownChange('program', '${item.prog.id}', this.value)"
                                class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-[9px] text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-violet-500 max-w-[72px]">
                                ${(() => {
                                    let options = '';
                                    for (let i = 1; i <= flatProgList.length; i++) {
                                        options += `<option value="${i}" ${(item.prog.priority ?? 3) === i ? 'selected' : ''}>${i}</option>`;
                                    }
                                    return options;
                                })()}
                            </select>
                            <div class="flex flex-col gap-0.5 shrink-0">
                                ${arrowUpBtn(`window.moveProgramGlobal(${flatIdx}, -1)`, flatIdx === 0)}
                                ${arrowDownBtn(`window.moveProgramGlobal(${flatIdx}, 1)`, flatIdx === flatProgList.length - 1)}
                            </div>
                        </div>
                    </div>`;
            });
        }
        html += `</div></div>`;

        // ── Section: Syllabus Subjects + Daily Actions (2 columns) ──
        html += `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">`;

        // Syllabus Subjects
        html += `
            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-emerald-500 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    Syllabus Subjects
                </h4>
                <div class="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">`;

        const allSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
        if (allSubs.length > 0) {
            allSubs.forEach((s, idx) => {
                const color = typeof window.getSubjectColor === 'function' ? window.getSubjectColor(s.subject) : '#10b981';
                let trackName = '';
                for (const t of tracksList) {
                    if (syllabusStructure[t.id] && syllabusStructure[t.id].some(x => x.subject === s.subject)) {
                        trackName = t.name;
                        break;
                    }
                }
                const safeSubId = s.subject.replace(/[^a-zA-Z0-9]/g, '-');
                html += `
                    <div class="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:border-emerald-400 transition-all">
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            ${rankBadge(idx + 1, color)}
                            <div class="flex flex-col min-w-0">
                                <span class="text-xs font-black text-slate-800 dark:text-slate-200 truncate" title="${s.subject}">${s.subject}</span>
                                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">${s.program}${trackName ? ' · ' + trackName : ''}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0 ml-2">
                            <select id="priority-subject-${safeSubId}" onchange="window.onPriorityDropdownChange('subject', '${s.subject.replace(/'/g, "\\'")}', this.value)"
                                class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-[9px] text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 max-w-[72px]">
                                ${(() => {
                                    let options = '';
                                    for (let i = 1; i <= allSubs.length; i++) {
                                        options += `<option value="${i}" ${(s.priority ?? 3) === i ? 'selected' : ''}>${i}</option>`;
                                    }
                                    return options;
                                })()}
                            </select>
                            <div class="flex flex-col gap-0.5 shrink-0">
                                ${arrowUpBtn(`window.moveSubjectGlobal(${idx}, -1)`, idx === 0)}
                                ${arrowDownBtn(`window.moveSubjectGlobal(${idx}, 1)`, idx === allSubs.length - 1)}
                            </div>
                        </div>
                    </div>`;
            });
        } else {
            html += `<p class="text-xs font-bold text-slate-400">No syllabus subjects found.</p>`;
        }
        html += `</div></div>`;

        // Daily Action Trackers
        html += `
            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Daily Action Trackers
                </h4>
                <div class="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">`;

        if (customActions.length === 0) {
            html += `<p class="text-xs font-bold text-slate-400">No custom actions created yet.</p>`;
        } else {
            const twColors = (typeof AppState !== 'undefined' && AppState.twColors) ? AppState.twColors : {};
            customActions.forEach((a, idx) => {
                const pVal = a.priority !== undefined ? a.priority : 3;
                const cMap = twColors[a.color] || twColors.indigo || { hex: '#6366f1' };
                html += `
                    <div class="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:border-amber-400 transition-all">
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            ${rankBadge(idx + 1, cMap.hex)}
                            <div class="flex flex-col min-w-0">
                                <span class="text-xs font-black text-slate-800 dark:text-slate-200 truncate">${a.title}</span>
                                <span class="text-[8px] font-bold text-slate-400 uppercase break-words whitespace-normal mt-0.5">${a.desc || a.question || ''}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0 ml-2">
                            <select id="priority-action-${a.id}" onchange="window.onPriorityDropdownChange('action', '${a.id}', this.value)"
                                class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-[9px] text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500 max-w-[72px]">
                                ${(() => {
                                    let options = '';
                                    for (let i = 1; i <= customActions.length; i++) {
                                        options += `<option value="${i}" ${pVal === i ? 'selected' : ''}>${i}</option>`;
                                    }
                                    return options;
                                })()}
                            </select>
                            <div class="flex flex-col gap-0.5 shrink-0">
                                ${arrowUpBtn(`window.moveAction(${idx}, -1)`, idx === 0)}
                                ${arrowDownBtn(`window.moveAction(${idx}, 1)`, idx === customActions.length - 1)}
                            </div>
                        </div>
                    </div>`;
            });
        }
        html += `</div></div></div>`;

        // Save Button
        html += `
            <div class="mt-6 flex justify-end">
                <button onclick="window.savePriorities()"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest px-8 py-3 rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                    Save &amp; Sync Priorities
                </button>
            </div>`;

        container.innerHTML = html;
    }

    /**
     * Commits all DOM priority modifications to active state, saves to cloud, and updates UI.
     */
    function savePriorities() {
        syncPriorityInputsFromDOM();
        sortAllCustomData();

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        if (typeof renderUI === 'function') renderUI();
        renderPriorityConfig();
        showToast("Priorities saved and synced successfully!", "success");
    }

    // Attach to global window
    global.sortAllCustomData = sortAllCustomData;
    global.normalizePriorities = normalizePriorities;
    global.syncPriorityInputsFromDOM = syncPriorityInputsFromDOM;
    global.moveTrack = moveTrack;
    global.moveProgramGlobal = moveProgramGlobal;
    global.moveSubjectGlobal = moveSubjectGlobal;
    global.moveAction = moveAction;
    global.movePriorityItem = movePriorityItem;
    global.onPriorityDropdownChange = onPriorityDropdownChange;
    global.renderPriorityConfig = renderPriorityConfig;
    global.savePriorities = savePriorities;

    // CommonJS / module export compatibility
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            sortAllCustomData,
            normalizePriorities,
            syncPriorityInputsFromDOM,
            moveTrack,
            moveProgramGlobal,
            moveSubjectGlobal,
            moveAction,
            movePriorityItem,
            onPriorityDropdownChange,
            renderPriorityConfig,
            savePriorities
        };
    }

})(typeof window !== 'undefined' ? window : this);
