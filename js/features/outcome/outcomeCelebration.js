/**
 * X-29 Module: features/outcome/outcomeCelebration.js
 * Milestone celebration setup, live criteria progress tracking, congratulations modal, and confetti:
 * - Milestone celebration criteria configuration & checklist (renderCelebrationConfig, openCelebrationSetupModal)
 * - Criteria selection actions (selectCelebrationModalTargets, selectAllCelebrationTargets, saveCelebrationSetup)
 * - Real-time celebration status card updater (updateCelebrationLiveStatus)
 * - Congratulations celebration modal & multi-page achievement summary (showCongratsModal, switchCongratsPage, renderCongratsSummary, closeCongratsModal)
 * - Full-screen visual celebration integration (fireConfetti)
 */
(function (global) {
    'use strict';

    /**
     * Renders Milestone Celebration Criteria configuration section.
     *
     * @param {boolean} [forceRebuild=false]
     */
    function renderCelebrationConfig(forceRebuild = false) {
        const container = document.getElementById('outcome-celebration-container');
        if (!container) return;

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        if (!global.celebrationTargets) global.celebrationTargets = { programs: [], subjects: [] };
        if (!global.passedItems) global.passedItems = { programs: [], subjects: [] };

        const hasCustomCeleb = Boolean(
            (global.celebrationTargets.programs && global.celebrationTargets.programs.length > 0) ||
            (global.celebrationTargets.subjects && global.celebrationTargets.subjects.length > 0)
        );

        let html = `
            <div class="space-y-5">
                <!-- Header description & Action buttons -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 font-bold">
                            Define which essential programs and subjects must be passed to unlock your completion celebration. Non-selected electives or extra courses won't block your celebration.
                        </p>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap shrink-0">
                        <button onclick="window.openCelebrationSetupModal()" class="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-amber-400/30">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span>Setup Criteria</span>
                        </button>
                        <button onclick="window.showCongratsModal(true, 1, 1)" class="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-emerald-400/30">
                            <span>🎉</span>
                            <span>Preview Celebration</span>
                        </button>
                        ${hasCustomCeleb ? `
                        <button onclick="window.selectAllCelebrationTargets('clear')" class="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 border border-rose-200/60 dark:border-rose-800/50 shadow-sm" title="Reset celebration criteria to default (all courses)">
                            Reset to Default
                        </button>` : ''}
                    </div>
                </div>

                <!-- Live Status Progress Card -->
                <div id="celeb-live-status-card" class="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-amber-200/60 dark:border-amber-700/40 shadow-sm transition-all">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span id="celeb-live-badge" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm">
                                <span>⚙️</span>
                                <span>Default: 100% All</span>
                            </span>
                            <span id="celeb-live-text" class="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">0 of 0 Core Courses Passed (0%)</span>
                        </div>
                    </div>
                    <div class="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-2.5 overflow-hidden mb-2">
                        <div id="celeb-live-bar" class="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 shadow-sm" style="width: 0%;"></div>
                    </div>
                    <p id="celeb-live-subtext" class="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Currently set to default. Click "Setup Criteria" to select specific core courses.</p>
                </div>

                <!-- Configured Core Celebration Targets Section -->
                <div class="bg-slate-50/70 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-inner">
                    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 mb-3.5">
                        <div class="flex items-center space-x-2">
                            <span class="text-amber-500 dark:text-amber-400 text-sm">🎯</span>
                            <h4 class="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Configured Celebration Criteria</h4>
                        </div>
                        <button onclick="window.openCelebrationSetupModal()" class="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline flex items-center gap-1">
                            <span>Configure / Edit</span>
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>

                    <div id="celeb-targets-summary-list" class="flex flex-wrap gap-2">
        `;

        if (!hasCustomCeleb) {
            html += `
                <div class="w-full py-4 px-4 text-center rounded-xl bg-white/60 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700">
                    <p class="text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span class="text-amber-500 font-black">Default Mode:</span> All subjects across all programs are currently required for the celebration.
                    </p>
                    <button onclick="window.openCelebrationSetupModal()" class="mt-2 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline">
                        + Select Essential Core Courses
                    </button>
                </div>
            `;
        } else {
            (global.celebrationTargets.programs || []).forEach(pName => {
                const isPassed = Boolean(global.passedItems && global.passedItems.programs && global.passedItems.programs.includes(pName));
                html += `
                    <div class="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border ${isPassed ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-amber-200/80 dark:border-amber-700/50'} shadow-sm text-xs font-bold">
                        <span class="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${isPassed ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}">Program</span>
                        <span class="text-slate-800 dark:text-slate-200">${pName}</span>
                        <span class="text-[9px] font-black uppercase tracking-wider ${isPassed ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400'}">${isPassed ? '✓ Passed' : 'Pending'}</span>
                    </div>
                `;
            });

            (global.celebrationTargets.subjects || []).forEach(subName => {
                const allSubs = typeof global.getAllSubjects === 'function' ? global.getAllSubjects() : [];
                const sObj = allSubs.find(s => s.subject === subName);
                const progName = sObj ? sObj.program : '';
                if (global.celebrationTargets.programs && global.celebrationTargets.programs.includes(progName)) {
                    return;
                }
                const isPassed = Boolean(global.passedItems && ((global.passedItems.subjects && global.passedItems.subjects.includes(subName)) || (global.passedItems.programs && global.passedItems.programs.includes(progName))));
                let displaySub = progName ? subName.replace(progName + ' - ', '').replace(progName + ' ', '') : subName;

                html += `
                    <div class="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border ${isPassed ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700'} shadow-sm text-xs font-bold">
                        <span class="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${isPassed ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">Subject</span>
                        <span class="text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-xs" title="${subName}">${displaySub}</span>
                        <span class="text-[9px] font-black uppercase tracking-wider ${isPassed ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400'}">${isPassed ? '✓ Passed' : 'Pending'}</span>
                    </div>
                `;
            });
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        if (typeof global.updateSuccessScore === 'function') global.updateSuccessScore();
    }

    /**
     * Opens modal to configure celebration requirements.
     */
    function openCelebrationSetupModal() {
        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        if (!global.celebrationTargets) global.celebrationTargets = { programs: [], subjects: [] };
        if (!global.passedItems) global.passedItems = { programs: [], subjects: [] };

        const searchInput = document.getElementById('csm-search-input');
        if (searchInput) searchInput.value = '';

        const container = document.getElementById('csm-checklist-container');
        if (!container) return;

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        const tracksList = global.tracks || (AppStateRef && AppStateRef.tracks) || [];
        const customPrograms = global.customPrograms || (AppStateRef && AppStateRef.customPrograms) || {};
        const syllabusStructure = global.syllabusStructure || (AppStateRef && AppStateRef.syllabusStructure) || {};

        let html = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        `;

        // 1. Programs Column
        html += `
            <div class="bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col csm-column-programs">
                <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-2.5">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Programs (All Subs Included)</span>
                    <span class="text-[9px] text-amber-500 font-black uppercase tracking-wider">Fast Select</span>
                </div>
                <div class="flex flex-col gap-1 max-h-72 overflow-y-auto custom-scrollbar pr-1">
        `;

        tracksList.forEach(track => {
            if (customPrograms[track.id] && customPrograms[track.id].length > 0) {
                html += `<div class="mt-2 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 pb-0.5 border-b border-slate-200/50 dark:border-slate-800">${track.name}</div>`;
                customPrograms[track.id].forEach(p => {
                    const pName = p.name || p;
                    const isChecked = Boolean(global.celebrationTargets.programs && global.celebrationTargets.programs.includes(pName)) ? 'checked' : '';
                    const isPassed = Boolean(global.passedItems && global.passedItems.programs && global.passedItems.programs.includes(pName));
                    const safePName = pName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    html += `
                        <label data-csm-name="${pName.toLowerCase().replace(/"/g, '&quot;')}" class="csm-program-item flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-amber-200 dark:hover:border-amber-800/50 cursor-pointer active:scale-[0.99] transition-all">
                            <div class="flex items-center space-x-2.5 min-w-0 flex-1">
                                <input type="checkbox" data-modal-celeb-prog="${pName.replace(/"/g, '&quot;')}" ${isChecked} onchange="window.updateModalSelectedCount()" class="modal-celeb-prog-cb form-checkbox h-4 w-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer">
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">${pName}</span>
                            </div>
                            <span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isPassed ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'}">${isPassed ? 'Passed' : 'Pending'}</span>
                        </label>
                    `;
                });
            }
        });
        html += `</div></div>`;

        // 2. Subjects Column
        html += `
            <div class="bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col csm-column-subjects">
                <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-2.5">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Individual Subjects</span>
                    <span class="text-[9px] text-slate-400 font-bold">Selective</span>
                </div>
                <div class="flex flex-col gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
        `;

        tracksList.forEach(track => {
            if (customPrograms[track.id]) {
                customPrograms[track.id].forEach(prog => {
                    const progName = prog.name || prog;
                    const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                    if (subs.length > 0) {
                        const isProgCeleb = Boolean(global.celebrationTargets.programs && global.celebrationTargets.programs.includes(progName));
                        html += `
                            <details data-csm-details-prog="${progName.replace(/"/g, '&quot;')}" class="csm-subject-group bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm group">
                                <summary class="cursor-pointer font-black text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 p-2.5 outline-none select-none list-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl transition-colors [&::-webkit-details-marker]:hidden">
                                    <div class="flex items-center space-x-2">
                                        <span>${progName}</span>
                                        <span class="text-[8px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">${subs.length} Subs</span>
                                    </div>
                                    <svg class="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                </summary>
                                <div class="p-2.5 pt-0 border-t border-slate-100 dark:border-slate-700/60">
                                    <div class="flex flex-col gap-1 mt-2">
                        `;
                        subs.forEach(s => {
                            const isSubChecked = Boolean(isProgCeleb || (global.celebrationTargets.subjects && global.celebrationTargets.subjects.includes(s.subject)));
                            const isPassed = Boolean(global.passedItems && ((global.passedItems.subjects && global.passedItems.subjects.includes(s.subject)) || (global.passedItems.programs && global.passedItems.programs.includes(progName))));
                            let displaySub = s.subject.replace(s.program + ' - ', '').replace(s.program + ' ', '');

                            html += `
                                <label data-csm-subname="${s.subject.toLowerCase().replace(/"/g, '&quot;')}" class="csm-sub-item flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-amber-200 dark:hover:border-amber-800/40 cursor-pointer active:scale-[0.99] transition-all">
                                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                                        <input type="checkbox" data-modal-celeb-subject="${s.subject.replace(/"/g, '&quot;')}" data-modal-celeb-parent-prog="${progName.replace(/"/g, '&quot;')}" ${isSubChecked ? 'checked' : ''} onchange="window.updateModalSelectedCount()" class="modal-celeb-sub-cb form-checkbox h-3.5 w-3.5 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer">
                                        <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">${displaySub}</span>
                                    </div>
                                    <span class="text-[7px] font-black uppercase px-1 py-0.5 rounded ${isPassed ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}">${isPassed ? 'Passed' : 'Pending'}</span>
                                </label>
                            `;
                        });
                        html += `</div></div></details>`;
                    }
                });
            }
        });
        html += `</div></div></div>`;

        container.innerHTML = html;
        updateModalSelectedCount();

        if (typeof global.openModal === 'function') {
            global.openModal('celebration-setup-modal');
        }
    }

    /**
     * Batch selector in celebration setup modal.
     */
    function selectCelebrationModalTargets(mode) {
        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        if (!global.passedItems) global.passedItems = { programs: [], subjects: [] };

        const progInputs = modal.querySelectorAll('input.modal-celeb-prog-cb');
        const subInputs = modal.querySelectorAll('input.modal-celeb-sub-cb');
        const toast = typeof global.showToast === 'function' ? global.showToast : console.log;

        if (mode === 'all-passed') {
            progInputs.forEach(input => {
                const pName = input.getAttribute('data-modal-celeb-prog');
                input.checked = Boolean(global.passedItems.programs && global.passedItems.programs.includes(pName));
            });
            subInputs.forEach(input => {
                const sName = input.getAttribute('data-modal-celeb-subject');
                const pName = input.getAttribute('data-modal-celeb-parent-prog');
                const isProgPassed = Boolean(global.passedItems.programs && global.passedItems.programs.includes(pName));
                input.checked = Boolean(isProgPassed || (global.passedItems.subjects && global.passedItems.subjects.includes(sName)));
            });
            toast("Checked passed courses as celebration targets!", "info");
        } else if (mode === 'all') {
            progInputs.forEach(input => { input.checked = true; });
            subInputs.forEach(input => { input.checked = true; });
            toast("Checked all courses!", "info");
        } else if (mode === 'clear') {
            progInputs.forEach(input => { input.checked = false; });
            subInputs.forEach(input => { input.checked = false; });
            toast("Cleared selection!", "info");
        }

        updateModalSelectedCount();
    }

    /**
     * Real-time search filter in celebration setup modal.
     */
    function filterCelebrationSetupItems(query) {
        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        const q = (query || '').toLowerCase().trim();
        const progItems = modal.querySelectorAll('.csm-program-item');
        const subGroups = modal.querySelectorAll('.csm-subject-group');

        progItems.forEach(item => {
            const name = item.getAttribute('data-csm-name') || '';
            item.style.display = (!q || name.includes(q)) ? 'flex' : 'none';
        });

        subGroups.forEach(group => {
            const progName = (group.getAttribute('data-csm-details-prog') || '').toLowerCase();
            const subItems = group.querySelectorAll('.csm-sub-item');
            let groupHasMatch = !q || progName.includes(q);

            subItems.forEach(si => {
                const subName = (si.getAttribute('data-csm-subname') || '');
                const match = !q || progName.includes(q) || subName.includes(q);
                si.style.display = match ? 'flex' : 'none';
                if (match) groupHasMatch = true;
            });

            group.style.display = groupHasMatch ? 'block' : 'none';
            if (q && groupHasMatch) {
                group.open = true;
            }
        });
    }

    /**
     * Updates footer counter of selected celebration courses.
     */
    function updateModalSelectedCount() {
        const countEl = document.getElementById('csm-selected-count');
        if (!countEl) return;

        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        const checkedProgs = modal.querySelectorAll('input.modal-celeb-prog-cb:checked').length;
        const checkedSubs = modal.querySelectorAll('input.modal-celeb-sub-cb:checked').length;

        if (checkedProgs === 0 && checkedSubs === 0) {
            countEl.innerHTML = `<span class="text-amber-600 dark:text-amber-400 font-black">Default Mode</span> (All courses required)`;
        } else {
            countEl.innerHTML = `<span class="font-black text-amber-600 dark:text-amber-400">${checkedProgs}</span> Program${checkedProgs === 1 ? '' : 's'} & <span class="font-black text-amber-600 dark:text-amber-400">${checkedSubs}</span> Subject${checkedSubs === 1 ? '' : 's'} selected`;
        }
    }

    /**
     * Saves chosen celebration criteria to state and cloud.
     */
    function saveCelebrationSetup() {
        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        const progInputs = modal.querySelectorAll('input.modal-celeb-prog-cb:checked');
        const subInputs = modal.querySelectorAll('input.modal-celeb-sub-cb:checked');

        const selectedProgs = Array.from(progInputs).map(i => i.getAttribute('data-modal-celeb-prog')).filter(Boolean);
        const selectedSubs = Array.from(subInputs).map(i => i.getAttribute('data-modal-celeb-subject')).filter(Boolean);

        global.celebrationTargets = {
            programs: selectedProgs,
            subjects: selectedSubs
        };

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        if (AppStateRef) {
            AppStateRef.celebrationTargets = global.celebrationTargets;
            AppStateRef.isLocalDirty = true;
        }

        if (typeof global.markLocalMutation === 'function') {
            global.markLocalMutation('celebrationTargets');
        }
        if (global.FirebaseService && typeof global.FirebaseService.saveToCloud === 'function') {
            global.FirebaseService.saveToCloud(false);
        }

        if (typeof global.closeModal === 'function') {
            global.closeModal('celebration-setup-modal');
        }
        renderCelebrationConfig(true);
        if (typeof global.updateSuccessScore === 'function') global.updateSuccessScore();

        const toast = typeof global.showToast === 'function' ? global.showToast : console.log;
        toast("Milestone celebration criteria saved!", "success");
    }

    /**
     * Resets or selects celebration targets outside the modal.
     */
    function selectAllCelebrationTargets(mode) {
        if (!global.celebrationTargets) global.celebrationTargets = { programs: [], subjects: [] };
        if (!global.passedItems) global.passedItems = { programs: [], subjects: [] };
        const toast = typeof global.showToast === 'function' ? global.showToast : console.log;

        if (mode === 'all-passed') {
            global.celebrationTargets.programs = [...(global.passedItems.programs || [])];
            global.celebrationTargets.subjects = [...(global.passedItems.subjects || [])];
            toast("Set all currently passed courses as celebration criteria!", "success");
        } else if (mode === 'all') {
            const allProgs = [];
            const allSubs = [];
            const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
            const tracksList = global.tracks || (AppStateRef && AppStateRef.tracks) || [];
            const customPrograms = global.customPrograms || (AppStateRef && AppStateRef.customPrograms) || {};
            const syllabusStructure = global.syllabusStructure || (AppStateRef && AppStateRef.syllabusStructure) || {};

            tracksList.forEach(track => {
                if (customPrograms[track.id]) {
                    customPrograms[track.id].forEach(p => {
                        const pName = p.name || p;
                        if (!allProgs.includes(pName)) allProgs.push(pName);
                    });
                }
                if (syllabusStructure[track.id]) {
                    syllabusStructure[track.id].forEach(s => {
                        if (!allSubs.includes(s.subject)) allSubs.push(s.subject);
                    });
                }
            });
            global.celebrationTargets.programs = allProgs;
            global.celebrationTargets.subjects = allSubs;
            toast("All courses selected for celebration criteria!", "success");
        } else if (mode === 'clear') {
            global.celebrationTargets.programs = [];
            global.celebrationTargets.subjects = [];
            toast("Celebration criteria reset to default!", "info");
        }

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        if (AppStateRef) AppStateRef.celebrationTargets = global.celebrationTargets;

        if (typeof global.markLocalMutation === 'function') {
            global.markLocalMutation('celebrationTargets');
        }
        if (global.FirebaseService && typeof global.FirebaseService.saveToCloud === 'function') {
            global.FirebaseService.saveToCloud(false);
        }

        renderCelebrationConfig(true);
        if (typeof global.updateSuccessScore === 'function') global.updateSuccessScore();
    }

    /**
     * Updates the live celebration criteria progress card in the outcome tab.
     */
    function updateCelebrationLiveStatus(corePassed, coreTotal, hasCustomCeleb, celebrationMet) {
        const card = document.getElementById('celeb-live-status-card');
        if (!card) return;

        const pct = coreTotal > 0 ? Math.round((corePassed / coreTotal) * 100) : 0;
        const badgeEl = document.getElementById('celeb-live-badge');
        const textEl = document.getElementById('celeb-live-text');
        const barEl = document.getElementById('celeb-live-bar');
        const subTextEl = document.getElementById('celeb-live-subtext');

        if (badgeEl) {
            if (celebrationMet) {
                badgeEl.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg animate-pulse flex items-center gap-1.5";
                badgeEl.innerHTML = "<span>🎉</span><span>Celebration Unlocked!</span>";
            } else if (hasCustomCeleb) {
                badgeEl.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5";
                badgeEl.innerHTML = "<span>🎯</span><span>Core Target Active</span>";
            } else {
                badgeEl.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5";
                badgeEl.innerHTML = "<span>⚙️</span><span>Default: 100% All</span>";
            }
        }

        if (textEl) {
            if (hasCustomCeleb) {
                textEl.textContent = `${corePassed} of ${coreTotal} Core Courses Passed (${pct}%)`;
            } else {
                textEl.textContent = `${corePassed} of ${coreTotal} Total Courses Passed (${pct}%)`;
            }
        }

        if (subTextEl) {
            if (celebrationMet) {
                subTextEl.textContent = "All required core milestone courses have been conquered! Celebration modal active.";
            } else if (hasCustomCeleb) {
                const remaining = Math.max(0, coreTotal - corePassed);
                subTextEl.textContent = `${remaining} core course${remaining === 1 ? '' : 's'} remaining until celebration.`;
            } else {
                subTextEl.textContent = "Currently set to default (all courses required). Select core items below to customize your celebration criteria.";
            }
        }

        if (barEl) {
            barEl.style.width = `${pct}%`;
            if (celebrationMet) {
                barEl.className = "h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500 shadow-sm";
            } else {
                barEl.className = "h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 shadow-sm";
            }
        }
    }

    /**
     * Opens the full congratulations celebration modal and launches confetti.
     *
     * @param {boolean} [isCustom=false]
     * @param {number} [corePassed=0]
     * @param {number} [coreTotal=0]
     */
    function showCongratsModal(isCustom = false, corePassed = 0, coreTotal = 0) {
        const modal = document.getElementById('congrats-modal');
        const backdrop = document.getElementById('congrats-backdrop');
        const content = document.getElementById('congrats-content');
        const dateEl = document.getElementById('congrats-end-date');
        const statusBadge = document.getElementById('congrats-status-badge');

        if (!modal || !backdrop || !content) return;

        const today = new Date();
        if (dateEl) dateEl.textContent = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        if (statusBadge) {
            if (isCustom && coreTotal > 0) {
                statusBadge.textContent = `${corePassed}/${coreTotal} Core Goals Passed! 🎉`;
            } else {
                statusBadge.textContent = '100% Success Score 🎉';
            }
        }

        switchCongratsPage(1);

        modal.classList.remove('hidden');
        void modal.offsetWidth;
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        content.classList.remove('scale-50', 'opacity-0', 'translate-y-10');
        content.classList.add('scale-100', 'opacity-100', 'translate-y-0');
        document.body.classList.add('overflow-hidden');

        setTimeout(() => {
            if (typeof global.fireConfetti === 'function') {
                global.fireConfetti();
            }
        }, 300);
    }

    /**
     * Switches between greeting and achievement summary in congratulations modal.
     */
    function switchCongratsPage(pageNum) {
        const page1 = document.getElementById('congrats-page-1');
        const page2 = document.getElementById('congrats-page-2');
        if (!page1 || !page2) return;

        if (pageNum === 1) {
            page2.classList.add('hidden');
            page1.classList.remove('hidden');
        } else {
            page1.classList.add('hidden');
            page2.classList.remove('hidden');
            renderCongratsSummary();
        }
    }

    /**
     * Populates summary of logged achievements and CGPA scores on page 2 of congrats modal.
     */
    function renderCongratsSummary() {
        const listContainer = document.getElementById('congrats-summary-list');
        if (!listContainer) return;

        const getResultsFn = typeof global.getProcessedResults === 'function'
            ? global.getProcessedResults
            : () => (global.successResults || []);
        const activeResults = getResultsFn();

        if (!activeResults || activeResults.length === 0) {
            listContainer.innerHTML = '<div class="text-center py-8 text-slate-400"><span class="text-4xl block mb-3 opacity-50 grayscale">🌟</span><p class="text-xs font-black uppercase tracking-widest">You conquered the syllabus!</p><p class="text-[10px] mt-1 font-bold">No explicit achievements logged yet.</p></div>';
            return;
        }

        const parseDate = (typeof global.Utils !== 'undefined' && typeof global.Utils.parseDateSafe === 'function')
            ? global.Utils.parseDateSafe
            : (d => new Date(d));

        const sorted = [...activeResults].sort((a, b) => parseDate(b.date) - parseDate(a.date));
        let html = '';
        sorted.forEach(res => {
            const isCgpa = res.type === 'cgpa';
            let colorClass = 'yellow';
            let badgeText = 'Achievement';
            let icon = '🏆';
            let displayTitle = res.title;

            if (isCgpa) {
                if (res.subject) {
                    colorClass = 'emerald';
                    badgeText = 'Subject CGPA';
                    icon = '📚';
                    displayTitle = `${res.title} - ${res.subject}`;
                } else {
                    colorClass = 'blue';
                    badgeText = 'Program CGPA';
                    icon = '🎓';
                }
            }
            const dateStr = parseDate(res.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            const isFailed = isCgpa && (
                res.evaluationType === 'grade'
                    ? (res.grade && ['C', 'D', 'E', 'F'].includes(res.grade.trim().toUpperCase()))
                    : (res.value && parseFloat(res.value) < 2.0)
            );

            const valColor = isFailed ? 'text-red-500 dark:text-red-400' : `text-${colorClass}-600 dark:text-${colorClass}-400`;
            const gradeColor = isFailed ? 'text-red-500 dark:text-red-400 font-bold' : 'text-slate-400';

            html += `
                <div class="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center gap-3 hover:shadow-md transition-shadow">
                    <div class="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <div class="text-2xl sm:text-3xl drop-shadow-sm">${icon}</div>
                        <div class="flex flex-col truncate pr-2">
                            <span class="text-[10px] font-black uppercase tracking-widest text-${colorClass}-500 dark:text-${colorClass}-400 mb-0.5">${badgeText}</span>
                            <span class="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">${displayTitle}</span>
                            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">${dateStr}</span>
                        </div>
                    </div>
                    <div class="shrink-0 bg-white dark:bg-slate-800 px-3 sm:px-4 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 text-center min-w-[3.5rem] flex flex-col justify-center items-center">
                        <span class="text-xs sm:text-sm font-black ${valColor} leading-none">${res.value || 'N/A'}</span>
                        ${res.grade ? `<span class="text-[8px] font-bold ${gradeColor} mt-0.5">${res.grade}</span>` : ''}
                        ${isCgpa ? `<span class="inline-block text-[7px] font-black px-1 mt-1 rounded ${isFailed ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'}">${isFailed ? 'FAIL' : 'PASS'}</span>` : ''}
                    </div>
                </div>`;
        });
        listContainer.innerHTML = html;
    }

    /**
     * Closes congratulations modal with exit animation.
     */
    function closeCongratsModal() {
        const modal = document.getElementById('congrats-modal');
        const backdrop = document.getElementById('congrats-backdrop');
        const content = document.getElementById('congrats-content');
        if (!modal || !backdrop || !content) return;

        backdrop.classList.remove('opacity-100'); backdrop.classList.add('opacity-0');
        content.classList.remove('scale-100', 'opacity-100', 'translate-y-0');
        content.classList.add('scale-95', 'opacity-0', 'translate-y-4');

        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }, 500);
    }

    // Attach to global scope
    const OutcomeCelebration = {
        renderCelebrationConfig,
        openCelebrationSetupModal,
        selectCelebrationModalTargets,
        filterCelebrationSetupItems,
        updateModalSelectedCount,
        saveCelebrationSetup,
        selectAllCelebrationTargets,
        updateCelebrationLiveStatus,
        showCongratsModal,
        switchCongratsPage,
        renderCongratsSummary,
        closeCongratsModal
    };

    global.OutcomeCelebration = OutcomeCelebration;
    global.renderCelebrationConfig = renderCelebrationConfig;
    global.openCelebrationSetupModal = openCelebrationSetupModal;
    global.selectCelebrationModalTargets = selectCelebrationModalTargets;
    global.filterCelebrationSetupItems = filterCelebrationSetupItems;
    global.updateModalSelectedCount = updateModalSelectedCount;
    global.saveCelebrationSetup = saveCelebrationSetup;
    global.selectAllCelebrationTargets = selectAllCelebrationTargets;
    global.updateCelebrationLiveStatus = updateCelebrationLiveStatus;
    global.showCongratsModal = showCongratsModal;
    global.switchCongratsPage = switchCongratsPage;
    global.renderCongratsSummary = renderCongratsSummary;
    global.closeCongratsModal = closeCongratsModal;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = OutcomeCelebration;
    }
})(typeof window !== 'undefined' ? window : globalThis);
