/**
 * X-29 Module: features/outcome/outcomePassConfig.js
 * Pass & Freeze configuration for programs and individual subjects:
 * - Pass checklist rendering across all tracks and programs (renderPassConfig)
 * - In-place DOM and state toggling for program/subject pass status (togglePassStatus)
 * - Automatic cascade: passing a program freezes all its subjects; passing all subjects freezes the program
 * - State sync with window.passedItems & AppState.passedItems
 */
(function (global) {
    'use strict';

    /**
     * Renders Pass / Freeze configuration checklist.
     *
     * @param {boolean} [forceRebuild=false]
     */
    function renderPassConfig(forceRebuild = false) {
        const container = document.getElementById('outcome-pass-container');
        if (!container) return;

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        if (!global.passedItems) global.passedItems = { programs: [], subjects: [] };
        if (AppStateRef && !AppStateRef.passedItems) AppStateRef.passedItems = global.passedItems;

        const existingProgInputs = container.querySelectorAll('input[data-pass-type="program"]');
        const existingSubInputs = container.querySelectorAll('input[data-pass-type="subject"]');

        if (!forceRebuild && existingProgInputs.length > 0 && existingSubInputs.length > 0) {
            existingProgInputs.forEach(input => {
                const pName = input.getAttribute('data-pass-prog');
                const shouldBeChecked = Boolean(global.passedItems.programs && global.passedItems.programs.includes(pName));
                if (input.checked !== shouldBeChecked) input.checked = shouldBeChecked;
            });
            existingSubInputs.forEach(input => {
                const sName = input.getAttribute('data-pass-subject');
                const pName = input.getAttribute('data-pass-parent-prog');
                const isProgPassed = Boolean(global.passedItems.programs && global.passedItems.programs.includes(pName));
                const shouldBeChecked = Boolean(isProgPassed || (global.passedItems.subjects && global.passedItems.subjects.includes(sName)));
                if (input.checked !== shouldBeChecked) input.checked = shouldBeChecked;
            });
            return;
        }

        const openAccordions = new Set();
        const existingDetails = container.querySelectorAll('details[data-details-prog]');
        existingDetails.forEach(d => {
            if (d.open) {
                const p = d.getAttribute('data-details-prog');
                if (p) openAccordions.add(p);
            }
        });

        const tracksList = global.tracks || (AppStateRef && AppStateRef.tracks) || [];
        const customPrograms = global.customPrograms || (AppStateRef && AppStateRef.customPrograms) || {};
        const syllabusStructure = global.syllabusStructure || (AppStateRef && AppStateRef.syllabusStructure) || {};

        let html = `
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">Mark entire programs or specific subjects as "Passed". This freezes them, compressing their UI in the Task List and instantly satisfying their pacing requirements.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        `;

        // Programs Column
        html += '<div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"><h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">Programs (Freeze All Subs)</h4><div class="flex flex-col gap-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-2">';
        tracksList.forEach(track => {
            if (customPrograms[track.id] && customPrograms[track.id].length > 0) {
                html += `<div class="mt-2 text-[9px] font-black uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1">${track.name.toUpperCase()}</div>`;
                customPrograms[track.id].forEach(p => {
                    const pName = p.name || p;
                    const isChecked = (global.passedItems.programs && global.passedItems.programs.includes(pName)) ? 'checked' : '';
                    const safePName = pName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    html += `
                        <label class="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800/80 active:translate-y-[0.5px] transition-colors duration-75">
                            <input type="checkbox" data-pass-type="program" data-pass-prog="${pName.replace(/"/g, '&quot;')}" onchange="window.togglePassStatus('program', '${safePName}', this.checked)" class="form-checkbox h-4 w-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer active:scale-95 transition-transform duration-75" ${isChecked}>
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${pName}</span>
                        </label>`;
                });
            }
        });
        html += '</div></div>';

        // Subjects Column
        html += '<div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"><h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">Individual Subjects</h4><div class="flex flex-col gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-2">';
        tracksList.forEach(track => {
            if (customPrograms[track.id]) {
                customPrograms[track.id].forEach(prog => {
                    const progName = prog.name || prog;
                    const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                    if (subs.length > 0) {
                        const isOpen = openAccordions.has(progName) ? 'open' : '';
                        html += `
                            <details data-details-prog="${progName.replace(/"/g, '&quot;')}" ${isOpen} class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                                <summary class="cursor-pointer font-black text-[10px] md:text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300 p-3 outline-none select-none list-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors duration-75 [&::-webkit-details-marker]:hidden">
                                    <div class="flex items-center space-x-2">
                                        <span>${progName}</span>
                                        <span class="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[8px]">${subs.length} Subs</span>
                                    </div>
                                    <svg class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </summary>
                                <div class="p-3 pt-0 border-t border-slate-100 dark:border-slate-700">
                                    <div class="flex flex-col gap-1 mt-2.5">
                        `;
                        subs.forEach(s => {
                            const isProgPassed = Boolean(global.passedItems.programs && global.passedItems.programs.includes(progName));
                            const isChecked = (global.passedItems.subjects && global.passedItems.subjects.includes(s.subject)) || isProgPassed ? 'checked' : '';
                            let displaySub = s.subject.replace(s.program + ' - ', '').replace(s.program + ' ', '');
                            const safeSub = s.subject.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                            html += `
                                <label class="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 active:translate-y-[0.5px] transition-colors duration-75">
                                    <input type="checkbox" data-pass-type="subject" data-pass-subject="${s.subject.replace(/"/g, '&quot;')}" data-pass-parent-prog="${progName.replace(/"/g, '&quot;')}" onchange="window.togglePassStatus('subject', '${safeSub}', this.checked)" class="form-checkbox h-4 w-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer active:scale-95 transition-transform duration-75" ${isChecked}>
                                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">${displaySub}</span>
                                </label>`;
                        });
                        html += `
                                    </div>
                                </div>
                            </details>`;
                    }
                });
            }
        });
        html += '</div></div></div>';

        container.innerHTML = html;
    }

    /**
     * Toggles pass/freeze status for either a whole program or an individual subject.
     *
     * @param {'program'|'subject'} type
     * @param {string} name
     * @param {boolean} isChecked
     */
    function togglePassStatus(type, name, isChecked) {
        if (!global.passedItems) global.passedItems = { programs: [], subjects: [] };
        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        if (AppStateRef) AppStateRef.passedItems = global.passedItems;

        const tracksList = global.tracks || (AppStateRef && AppStateRef.tracks) || [];
        const syllabusStructure = global.syllabusStructure || (AppStateRef && AppStateRef.syllabusStructure) || {};

        if (type === 'program') {
            if (isChecked) {
                if (!global.passedItems.programs.includes(name)) global.passedItems.programs.push(name);

                let programSubs = [];
                tracksList.forEach(track => {
                    if (syllabusStructure[track.id]) {
                        syllabusStructure[track.id].forEach(s => {
                            if (s.program === name) programSubs.push(s.subject);
                        });
                    }
                });
                programSubs.forEach(sub => {
                    if (!global.passedItems.subjects.includes(sub)) global.passedItems.subjects.push(sub);
                });
            } else {
                global.passedItems.programs = global.passedItems.programs.filter(p => p !== name);

                let programSubs = [];
                tracksList.forEach(track => {
                    if (syllabusStructure[track.id]) {
                        syllabusStructure[track.id].forEach(s => {
                            if (s.program === name) programSubs.push(s.subject);
                        });
                    }
                });
                global.passedItems.subjects = global.passedItems.subjects.filter(s => !programSubs.includes(s));
            }
        } else if (type === 'subject') {
            if (isChecked) {
                if (!global.passedItems.subjects.includes(name)) global.passedItems.subjects.push(name);

                const sObj = typeof global.getAllSubjects === 'function' ? global.getAllSubjects().find(s => s.subject === name) : null;
                if (sObj) {
                    const progName = sObj.program;
                    let allSubsInProg = [];
                    tracksList.forEach(track => {
                        if (syllabusStructure[track.id]) {
                            syllabusStructure[track.id].forEach(s => {
                                if (s.program === progName) allSubsInProg.push(s.subject);
                            });
                        }
                    });
                    const allPassed = allSubsInProg.length > 0 && allSubsInProg.every(sub => global.passedItems.subjects.includes(sub));
                    if (allPassed && !global.passedItems.programs.includes(progName)) {
                        global.passedItems.programs.push(progName);
                    }
                }
            } else {
                global.passedItems.subjects = global.passedItems.subjects.filter(s => s !== name);

                const sObj = typeof global.getAllSubjects === 'function' ? global.getAllSubjects().find(s => s.subject === name) : null;
                if (sObj) {
                    const progName = sObj.program;
                    global.passedItems.programs = global.passedItems.programs.filter(p => p !== progName);
                }
            }
        }

        // In-place DOM update
        const container = document.getElementById('outcome-pass-container');
        if (container) {
            const escapeSelectorVal = (val) => (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(val) : val.replace(/["\\]/g, '\\$&');
            if (type === 'program') {
                const pInput = container.querySelector(`input[data-pass-type="program"][data-pass-prog="${escapeSelectorVal(name)}"]`);
                if (pInput && pInput.checked !== isChecked) pInput.checked = isChecked;
                const subInputs = container.querySelectorAll(`input[data-pass-type="subject"][data-pass-parent-prog="${escapeSelectorVal(name)}"]`);
                subInputs.forEach(si => {
                    if (si.checked !== isChecked) si.checked = isChecked;
                });
            } else if (type === 'subject') {
                const sInput = container.querySelector(`input[data-pass-type="subject"][data-pass-subject="${escapeSelectorVal(name)}"]`);
                if (sInput && sInput.checked !== isChecked) sInput.checked = isChecked;
                const sObj = typeof global.getAllSubjects === 'function' ? global.getAllSubjects().find(s => s.subject === name) : null;
                if (sObj) {
                    const progName = sObj.program;
                    const isParentChecked = global.passedItems.programs.includes(progName);
                    const pInput = container.querySelector(`input[data-pass-type="program"][data-pass-prog="${escapeSelectorVal(progName)}"]`);
                    if (pInput && pInput.checked !== isParentChecked) pInput.checked = isParentChecked;
                }
            }
        }

        if (typeof global.markLocalMutation === 'function') {
            global.markLocalMutation('passedItems');
        } else if (AppStateRef) {
            AppStateRef.isLocalDirty = true;
        }
        if (global.FirebaseService && typeof global.FirebaseService.saveToCloud === 'function') {
            global.FirebaseService.saveToCloud(false);
        }

        if (global._passConfigDebounceTimer) clearTimeout(global._passConfigDebounceTimer);
        global._passConfigDebounceTimer = setTimeout(() => {
            global._passConfigDebounceTimer = null;
            if (typeof global.updateSuccessScore === 'function') global.updateSuccessScore();
            if (typeof global.renderUI === 'function') global.renderUI();
        }, 80);

        if (global._passToastTimer) clearTimeout(global._passToastTimer);
        global._passToastTimer = setTimeout(() => {
            global._passToastTimer = null;
            const toast = typeof global.showToast === 'function' ? global.showToast : console.log;
            toast("Pass / Freeze configuration updated!", "success");
        }, 250);
    }

    /**
     * Convenience wrapper for toggling a program pass state.
     */
    function togglePassProgram(pName, isChecked) {
        togglePassStatus('program', pName, isChecked);
    }

    /**
     * Convenience wrapper for toggling a subject pass state.
     */
    function togglePassSubject(subName, isChecked) {
        togglePassStatus('subject', subName, isChecked);
    }

    /**
     * Convenience wrapper for bulk passing/unpassing a program.
     */
    function bulkPassProgram(pName, passAll) {
        togglePassStatus('program', pName, passAll);
    }

    // Attach to global scope
    const OutcomePassConfig = {
        renderPassConfig,
        togglePassStatus,
        togglePassProgram,
        togglePassSubject,
        bulkPassProgram
    };

    global.OutcomePassConfig = OutcomePassConfig;
    global.renderPassConfig = renderPassConfig;
    global.togglePassStatus = togglePassStatus;
    global.togglePassProgram = togglePassProgram;
    global.togglePassSubject = togglePassSubject;
    global.bulkPassProgram = bulkPassProgram;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = OutcomePassConfig;
    }
})(typeof window !== 'undefined' ? window : globalThis);
