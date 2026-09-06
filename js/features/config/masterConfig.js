/**
 * X-29 Advance - Master Configuration & Curriculum Taxonomy Module
 * File: js/features/config/masterConfig.js
 *
 * Provides:
 * - Master Config Tab Switcher (switchSysTab)
 * - Curriculum Dropdown Cascades (updateChProgDropdown, updateChSubjDropdown, updateSubProgDropdown)
 * - Taxonomy Builders: Programs, Subjects, Chapters (appendNewProgram, appendNewSubject, appendNewChapter)
 * - Manage Data Engine: Universal Item Renaming and Cascading Deletion (updateManageDropdown, updateManageSubjects, executeManageEdit, requestManageDelete, executeManageDelete)
 * - Dashboard Header Configuration (saveHeaderConfigFromForm)
 * - Clean Slate Workspace Reset (resetToCleanSlate)
 */

(function (global) {
    'use strict';

    /**
     * Switches the active tab inside the Master Configuration panel.
     */
    function switchSysTab(tab) {
        if (window.MasterConfigPage) {
            window.MasterConfigPage.activeTab = tab;
        }

        const tabKeys = ['chapter', 'subject', 'program', 'manage', 'priority', 'track'];
        tabKeys.forEach(t => {
            const btn = document.getElementById(`sys-tab-${t}`);
            const content = document.getElementById(`sys-content-${t}`);
            if (!btn || !content) return;

            if (t === tab) {
                btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
                btn.classList.remove('bg-slate-100', 'dark:bg-slate-700', 'text-slate-500', 'dark:text-slate-400');
                content.classList.remove('hidden');
            } else {
                btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
                btn.classList.add('bg-slate-100', 'dark:bg-slate-700', 'text-slate-500', 'dark:text-slate-400');
                content.classList.add('hidden');
            }
        });

        if (tab === 'chapter' && typeof window.updateChProgDropdown === 'function') window.updateChProgDropdown();
        if (tab === 'subject' && typeof window.updateSubProgDropdown === 'function') window.updateSubProgDropdown();
        if (tab === 'manage' && typeof window.updateManageDropdown === 'function') window.updateManageDropdown();
        if (tab === 'priority' && typeof window.renderPriorityConfig === 'function') window.renderPriorityConfig();
        if (tab === 'track' && typeof window.renderTrackList === 'function') window.renderTrackList();
    }

    // ==========================================
    // FORM DROPDOWN LINKERS
    // ==========================================

    function updateChProgDropdown() {
        const trackSelect = document.getElementById('add-ch-track');
        const progSelect = document.getElementById('add-ch-program');
        if (!trackSelect || !progSelect) return;

        const track = trackSelect.value;
        progSelect.innerHTML = '';

        if (window.customPrograms && window.customPrograms[track]) {
            window.customPrograms[track].forEach(p => {
                const pName = p.name || p;
                progSelect.innerHTML += `<option value="${pName}">${pName}</option>`;
            });
        }
        updateChSubjDropdown();
    }

    function updateChSubjDropdown() {
        const trackSelect = document.getElementById('add-ch-track');
        const progSelect = document.getElementById('add-ch-program');
        const subjSelect = document.getElementById('add-ch-subject');
        if (!trackSelect || !progSelect || !subjSelect) return;

        const track = trackSelect.value;
        const prog = progSelect.value;
        subjSelect.innerHTML = '';

        const syllabusStructure = window.syllabusStructure || {};
        const subs = (syllabusStructure[track] || [])
            .filter(s => s.program === prog)
            .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

        subs.forEach(s => {
            subjSelect.innerHTML += `<option value="${s.subject}">${s.subject}</option>`;
        });

        if (subs.length === 0) {
            subjSelect.innerHTML = '<option value="">No subjects found</option>';
        }
    }

    function updateSubProgDropdown() {
        const trackSelect = document.getElementById('add-sub-track');
        const progSelect = document.getElementById('add-sub-program');
        if (!trackSelect || !progSelect) return;

        const track = trackSelect.value;
        progSelect.innerHTML = '';

        if (window.customPrograms && window.customPrograms[track]) {
            window.customPrograms[track].forEach(p => {
                const pName = p.name || p;
                progSelect.innerHTML += `<option value="${pName}">${pName}</option>`;
            });
        }
    }

    // ==========================================
    // TAXONOMY CREATION (Program / Subject / Chapter)
    // ==========================================

    function appendNewProgram() {
        const trackSelect = document.getElementById('add-prog-track');
        const nameInput = document.getElementById('add-prog-name');
        if (!trackSelect || !nameInput) return;

        const track = trackSelect.value;
        const name = nameInput.value.trim();
        if (!name) return showToast("Program name required.", "error");

        if (!window.customPrograms) window.customPrograms = {};
        window.customPrograms[track] = window.customPrograms[track] || [];

        if (window.customPrograms[track].some(p => (p.name || p).toLowerCase() === name.toLowerCase())) {
            return showToast("Program already exists.", "error");
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const nextOrder = window.customPrograms[track].length;
        window.customPrograms[track].push({
            id: slug || 'prog-' + Date.now(),
            name: name,
            priority: 3,
            order: nextOrder,
            targetCGPA: ''
        });

        if (typeof window.sortAllCustomData === 'function') {
            window.sortAllCustomData();
        }

        nameInput.value = '';

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        showToast("Program successfully added!", "success");
    }

    function appendNewSubject() {
        const trackSelect = document.getElementById('add-sub-track');
        const progSelect = document.getElementById('add-sub-program');
        const nameInput = document.getElementById('add-sub-name');
        const bulkCb = document.getElementById('add-sub-bulk-cb');
        const bulkNumInput = document.getElementById('add-sub-bulk-num');

        if (!trackSelect || !progSelect || !nameInput) return;

        const track = trackSelect.value;
        const prog = progSelect.value;
        const name = nameInput.value.trim();
        const doBulk = bulkCb ? bulkCb.checked : false;
        const bulkNum = bulkNumInput ? (parseInt(bulkNumInput.value) || 0) : 0;

        if (!name) return showToast("Subject name required.", "error");

        const isGlobalDuplicate = typeof window.getAllSubjects === 'function' &&
            window.getAllSubjects().some(s => s.subject.toLowerCase() === name.toLowerCase());
        if (isGlobalDuplicate) return showToast("Subject already exists. Names must be unique.", "error");

        if (doBulk && bulkNum <= 0) return showToast("Please enter a valid number of chapters to bulk add.", "error");

        let chaptersToAssign = doBulk ? bulkNum : 0;
        const todayStr = (window.Utils && typeof window.Utils.formatDate === 'function') ?
            window.Utils.formatDate(new Date()) : new Date().toLocaleDateString('en-GB');

        let todayIdx = (typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) ?
            AppState.tasks.findIndex(t => t.date === todayStr) : 0;
        if (todayIdx === -1) todayIdx = 0;

        if (doBulk && typeof window.ensureAvailableSlots === 'function') {
            window.ensureAvailableSlots(chaptersToAssign, track, todayIdx);
        }

        if (!window.syllabusStructure) window.syllabusStructure = {};
        window.syllabusStructure[track] = window.syllabusStructure[track] || [];

        const nextSubOrder = window.syllabusStructure[track].filter(s => s.program === prog).length;
        window.syllabusStructure[track].push({
            program: prog,
            subject: name,
            chapters: chaptersToAssign,
            priority: 3,
            order: nextSubOrder
        });

        if (typeof window.sortAllCustomData === 'function') {
            window.sortAllCustomData();
        }
        if (typeof window.getSubjectColor === 'function') {
            window.getSubjectColor(name);
        }

        if (doBulk && typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) {
            let currentChapter = 1;
            const key = track + 'Tasks';
            for (let i = todayIdx; i < AppState.tasks.length && currentChapter <= chaptersToAssign; i++) {
                if (AppState.tasks[i].type !== 'study') continue;
                if (Array.isArray(AppState.tasks[i][key])) {
                    const bIdx = AppState.tasks[i][key].findIndex(b => b.subject === 'Revision');
                    if (bIdx > -1) {
                        AppState.tasks[i][key][bIdx] = {
                            subject: name,
                            chapter: `Ch. ${currentChapter}`,
                            title: `Topic ${currentChapter}`,
                            completed: false,
                            id: AppState.tasks[i][key][bIdx].id
                        };
                        currentChapter++;
                    }
                }
            }
            if (typeof window.reorderSubjectChapters === 'function') {
                window.reorderSubjectChapters(track, name);
            }
        }

        nameInput.value = '';
        if (bulkCb) bulkCb.checked = false;
        if (bulkNumInput) {
            bulkNumInput.value = '';
            bulkNumInput.classList.add('hidden');
        }

        if (typeof recalculateTotals === 'function') recalculateTotals();

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        setTimeout(() => {
            if (typeof renderUI === 'function') renderUI();
            showToast(doBulk ? `Subject created and ${chaptersToAssign} chapters scheduled!` : "Subject successfully created!", "success");
        }, 50);
    }

    function appendNewChapter() {
        const trackSelect = document.getElementById('add-ch-track');
        const progSelect = document.getElementById('add-ch-program');
        const subjSelect = document.getElementById('add-ch-subject');
        const numInput = document.getElementById('add-ch-num');
        const titleInput = document.getElementById('add-ch-title');

        if (!trackSelect || !subjSelect || !numInput || !titleInput) return;

        const track = trackSelect.value;
        const subj = subjSelect.value;
        const num = numInput.value;
        const title = titleInput.value.trim();
        const formattedCh = `Ch. ${num}`;

        if (!subj || !num || !title) return showToast("Please fill all fields.", "error");

        let isDuplicate = false;
        const key = track + 'Tasks';
        if (typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) {
            for (let i = 0; i < AppState.tasks.length; i++) {
                if (AppState.tasks[i].type !== 'study') continue;
                if (Array.isArray(AppState.tasks[i][key]) && AppState.tasks[i][key].some(b => b.subject === subj && b.chapter === formattedCh)) {
                    isDuplicate = true;
                    break;
                }
            }
        }
        if (isDuplicate) return showToast(`Chapter ${num} already exists for ${subj}!`, "error");

        const todayStr = (window.Utils && typeof window.Utils.formatDate === 'function') ?
            window.Utils.formatDate(new Date()) : new Date().toLocaleDateString('en-GB');
        let todayIdx = (typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) ?
            AppState.tasks.findIndex(t => t.date === todayStr) : 0;
        if (todayIdx === -1) todayIdx = 0;

        if (typeof window.ensureAvailableSlots === 'function') {
            window.ensureAvailableSlots(1, track, todayIdx);
        }

        let slotted = false;
        if (typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) {
            for (let i = todayIdx; i < AppState.tasks.length; i++) {
                if (AppState.tasks[i].type !== 'study') continue;
                if (Array.isArray(AppState.tasks[i][key])) {
                    const bIdx = AppState.tasks[i][key].findIndex(b => b.subject === 'Revision');
                    if (bIdx > -1) {
                        AppState.tasks[i][key][bIdx] = {
                            subject: subj,
                            chapter: formattedCh,
                            title: title,
                            completed: false,
                            id: AppState.tasks[i][key][bIdx].id
                        };
                        slotted = true;
                        break;
                    }
                }
            }
        }

        if (!slotted) return showToast("No upcoming 'Revision' slots left for this track!", "error");

        if (typeof window.reorderSubjectChapters === 'function') {
            window.reorderSubjectChapters(track, subj);
        }

        const syllabusStructure = window.syllabusStructure || {};
        const targetSub = (syllabusStructure[track] || []).find(s => s.subject === subj);
        if (targetSub) targetSub.chapters = (targetSub.chapters || 0) + 1;

        if (typeof recalculateTotals === 'function') recalculateTotals();

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        if (typeof renderUI === 'function') renderUI();

        numInput.value = '';
        titleInput.value = '';
        showToast("Chapter added and sequenced!", "success");
    }

    // ==========================================
    // MANAGE DATA ENGINE (Rename & Cascading Deletion)
    // ==========================================

    function updateManageDropdown() {
        const typeEl = document.getElementById('manage-type');
        const targetSelect = document.getElementById('manage-target');
        const trackBox = document.getElementById('manage-track-box');
        const progBox = document.getElementById('manage-program-box');
        if (!typeEl || !targetSelect) return;

        const type = typeEl.value;
        targetSelect.innerHTML = '';

        if (type === 'action') {
            if (trackBox) trackBox.classList.add('hidden');
            if (progBox) progBox.classList.add('hidden');
            const sortedActions = [...(window.customActions || [])].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
            sortedActions.forEach(a => { targetSelect.innerHTML += `<option value="${a.id}">${a.title}</option>`; });
        } else if (type === 'program') {
            if (trackBox) trackBox.classList.remove('hidden');
            if (progBox) progBox.classList.add('hidden');
            const trackSelect = document.getElementById('manage-track');
            const track = trackSelect ? trackSelect.value : '';
            if (window.customPrograms && window.customPrograms[track]) {
                window.customPrograms[track].forEach(p => {
                    const pName = p.name || p;
                    targetSelect.innerHTML += `<option value="${pName}">${pName}</option>`;
                });
            }
        } else if (type === 'subject') {
            if (trackBox) trackBox.classList.remove('hidden');
            if (progBox) progBox.classList.remove('hidden');
            const trackSelect = document.getElementById('manage-track');
            const track = trackSelect ? trackSelect.value : '';
            const progSelect = document.getElementById('manage-program');
            if (progSelect) {
                progSelect.innerHTML = '';
                if (window.customPrograms && window.customPrograms[track]) {
                    window.customPrograms[track].forEach(p => {
                        const pName = p.name || p;
                        progSelect.innerHTML += `<option value="${pName}">${pName}</option>`;
                    });
                }
            }
            updateManageSubjects();
        }
    }

    function updateManageSubjects() {
        const trackSelect = document.getElementById('manage-track');
        const progSelect = document.getElementById('manage-program');
        const targetSelect = document.getElementById('manage-target');
        if (!trackSelect || !progSelect || !targetSelect) return;

        const track = trackSelect.value;
        const prog = progSelect.value;
        targetSelect.innerHTML = '';

        const syllabusStructure = window.syllabusStructure || {};
        const subs = (syllabusStructure[track] || [])
            .filter(s => s.program === prog)
            .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

        subs.forEach(s => { targetSelect.innerHTML += `<option value="${s.subject}">${s.subject}</option>`; });
        if (subs.length === 0) targetSelect.innerHTML = '<option value="">No subjects found</option>';
    }

    function executeManageEdit() {
        const typeEl = document.getElementById('manage-type');
        const targetEl = document.getElementById('manage-target');
        const newNameEl = document.getElementById('manage-new-name');
        if (!typeEl || !targetEl || !newNameEl) return;

        const type = typeEl.value;
        const track = type !== 'action' ? (document.getElementById('manage-track')?.value || null) : null;
        const oldName = targetEl.value;
        const newName = newNameEl.value.trim();

        if (!oldName) return showToast("Please select an item to edit.", "error");
        if (!newName && type !== 'action' && type !== 'program') return showToast("New name cannot be empty.", "error");

        const customPrograms = window.customPrograms || {};
        const syllabusStructure = window.syllabusStructure || {};

        if (type === 'program') {
            let renamed = false;
            if (newName && oldName.toLowerCase() !== newName.toLowerCase()) {
                if (customPrograms[track] && customPrograms[track].some(p => (p.name || p).toLowerCase() === newName.toLowerCase())) {
                    return showToast("Program already exists.", "error");
                }
                renamed = true;
            }

            const pIdx = customPrograms[track] ? customPrograms[track].findIndex(p => (p.name || p) === oldName) : -1;
            if (pIdx > -1) {
                let progObj = customPrograms[track][pIdx];
                if (typeof progObj !== 'object') {
                    progObj = {
                        id: oldName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'prog-' + pIdx,
                        name: oldName,
                        priority: 3,
                        order: pIdx
                    };
                    customPrograms[track][pIdx] = progObj;
                }

                if (renamed) {
                    progObj.name = newName;
                }
            }

            if (renamed) {
                if (syllabusStructure[track]) {
                    syllabusStructure[track].forEach(s => { if (s.program === oldName) s.program = newName; });
                }
                if (window.chartVisibility && window.chartVisibility.prog && window.chartVisibility.prog[oldName] !== undefined) {
                    window.chartVisibility.prog[newName] = window.chartVisibility.prog[oldName];
                    delete window.chartVisibility.prog[oldName];
                }

                if (Array.isArray(window.paceGoals)) {
                    window.paceGoals.forEach(g => {
                        if (g.type === 'program' && g.target === oldName) g.target = newName;
                        if (g.type === 'bundle' && g.programs) {
                            const idx = g.programs.indexOf(oldName);
                            if (idx > -1) g.programs[idx] = newName;
                        }
                    });
                }

                if (window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(oldName)) {
                    window.passedItems.programs = window.passedItems.programs.filter(p => p !== oldName);
                    window.passedItems.programs.push(newName);
                }

                if (window.successResults) {
                    window.successResults.forEach(r => {
                        if (r.type === 'cgpa' && r.title === oldName) {
                            r.title = newName;
                        }
                    });
                }
            }

            if (renamed) {
                showToast("Program renamed successfully!", "success");
            } else {
                showToast("No changes made.", "warning");
            }

        } else if (type === 'subject') {
            if (oldName.toLowerCase() === newName.toLowerCase()) return showToast("New name must be different.", "error");
            const isGlobalDuplicate = typeof window.getAllSubjects === 'function' &&
                window.getAllSubjects().some(s => s.subject.toLowerCase() === newName.toLowerCase());
            if (isGlobalDuplicate) return showToast("Subject name must be unique globally.", "error");

            const sObj = syllabusStructure[track] ? syllabusStructure[track].find(s => s.subject === oldName) : null;
            if (sObj) sObj.subject = newName;

            if (typeof AppState !== 'undefined' && AppState.subjectColors && AppState.subjectColors[oldName]) {
                AppState.subjectColors[newName] = AppState.subjectColors[oldName];
            }

            if (typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) {
                for (let i = 0; i < AppState.tasks.length; i++) {
                    if (AppState.tasks[i].type !== 'study') continue;
                    const key = track + 'Tasks';
                    if (Array.isArray(AppState.tasks[i][key])) {
                        AppState.tasks[i][key].forEach(b => { if (b.subject === oldName) b.subject = newName; });
                    }
                }
                if (AppState.currentFilter === oldName) AppState.currentFilter = newName;
            }

            if (window.chartVisibility && window.chartVisibility.subjects && window.chartVisibility.subjects[oldName] !== undefined) {
                window.chartVisibility.subjects[newName] = window.chartVisibility.subjects[oldName];
                delete window.chartVisibility.subjects[oldName];
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

            if (window.passedItems && window.passedItems.subjects && window.passedItems.subjects.includes(oldName)) {
                window.passedItems.subjects = window.passedItems.subjects.filter(s => s !== oldName);
                window.passedItems.subjects.push(newName);
            }

            showToast("Subject renamed universally!", "success");

        } else if (type === 'action') {
            if (!newName) return showToast("New title cannot be empty.", "error");
            const act = (window.customActions || []).find(a => a.id === oldName);
            if (act) {
                act.title = newName;
                showToast("Action title updated!", "success");
            }
        }

        newNameEl.value = '';

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        updateManageDropdown();
    }

    function requestManageDelete() {
        const targetEl = document.getElementById('manage-target');
        const targetName = targetEl ? targetEl.value : '';
        if (!targetName) return showToast("Please select an item to delete.", "error");

        if (typeof window.openConfirmModal === 'function') {
            window.openConfirmModal(
                "Delete Item",
                `Are you sure you want to completely delete "${targetName}"? This action cannot be undone.`,
                executeManageDelete
            );
        } else if (confirm(`Are you sure you want to delete "${targetName}"?`)) {
            executeManageDelete();
        }
    }

    function executeManageDelete() {
        const typeEl = document.getElementById('manage-type');
        const targetEl = document.getElementById('manage-target');
        if (!typeEl || !targetEl) return;

        const type = typeEl.value;
        const targetName = targetEl.value;
        if (!targetName) return showToast("Please select an item to delete.", "error");

        const customPrograms = window.customPrograms || {};
        const syllabusStructure = window.syllabusStructure || {};

        if (type === 'action') {
            if (typeof window.recordItemDeletion === 'function') {
                window.recordItemDeletion(targetName);
                const act = (window.customActions || []).find(a => a.id === targetName || a.name === targetName);
                if (act && act.id) window.recordItemDeletion(act.id);
            }
            window.customActions = (window.customActions || []).filter(a => a.id !== targetName && a.name !== targetName);

            if (window.chartVisibility) {
                if (window.chartVisibility.monthly) delete window.chartVisibility.monthly[targetName];
                if (window.chartVisibility.yearly) delete window.chartVisibility.yearly[targetName];
            }
            showToast(`Action tracker deleted.`, "success");

        } else {
            const trackSelect = document.getElementById('manage-track');
            const track = trackSelect ? trackSelect.value : '';

            if (type === 'program') {
                const subsToDelete = (syllabusStructure[track] || []).filter(s => s.program === targetName).map(s => s.subject);

                if (typeof window.recordItemDeletion === 'function') {
                    window.recordItemDeletion(targetName);
                    subsToDelete.forEach(sub => window.recordItemDeletion(sub));
                    (window.paceGoals || []).filter(g => (g.type === 'program' && g.target === targetName) || (g.type === 'subject' && subsToDelete.includes(g.target))).forEach(g => window.recordItemDeletion(g.id));
                    (window.successResults || []).filter(r => r.type === 'cgpa' && r.title === targetName).forEach(r => window.recordItemDeletion(r.id));
                }

                customPrograms[track] = (customPrograms[track] || []).filter(p => (p.name || p) !== targetName);
                if (syllabusStructure[track]) {
                    syllabusStructure[track] = syllabusStructure[track].filter(s => s.program !== targetName);
                }

                if (window.chartVisibility) {
                    if (window.chartVisibility.prog) delete window.chartVisibility.prog[targetName];
                    if (window.chartVisibility.subjects) subsToDelete.forEach(sub => delete window.chartVisibility.subjects[sub]);
                }

                if (typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) {
                    for (let i = 0; i < AppState.tasks.length; i++) {
                        if (AppState.tasks[i].type !== 'study') continue;
                        const key = track + 'Tasks';
                        if (Array.isArray(AppState.tasks[i][key])) {
                            AppState.tasks[i][key] = AppState.tasks[i][key].map(b =>
                                subsToDelete.includes(b.subject) ? { subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: b.id } : b
                            );
                        }
                    }
                    if (AppState.currentFilter !== 'All') AppState.currentFilter = 'All';
                }

                if (Array.isArray(window.paceGoals)) {
                    window.paceGoals = window.paceGoals.filter(g => !(g.type === 'program' && g.target === targetName) && !(g.type === 'subject' && subsToDelete.includes(g.target)));
                    window.paceGoals.forEach(g => {
                        if (g.type === 'bundle' && g.programs) g.programs = g.programs.filter(p => p !== targetName);
                        if (g.type === 'bundle' && g.subjects) g.subjects = g.subjects.filter(s => !subsToDelete.includes(s));
                    });
                }

                if (window.passedItems) {
                    if (window.passedItems.programs) window.passedItems.programs = window.passedItems.programs.filter(p => p !== targetName);
                    if (window.passedItems.subjects) window.passedItems.subjects = window.passedItems.subjects.filter(s => !subsToDelete.includes(s));
                }

                if (window.revisionData) {
                    if (window.revisionData.active) window.revisionData.active = window.revisionData.active.filter(s => !subsToDelete.includes(s));
                    if (window.revisionData.progress) subsToDelete.forEach(sub => delete window.revisionData.progress[sub]);
                }

                if (window.successResults) {
                    window.successResults = window.successResults.filter(r => !(r.type === 'cgpa' && r.title === targetName));
                }

                showToast(`Program "${targetName}" and its subjects deleted.`, "success");

            } else if (type === 'subject') {
                if (typeof window.recordItemDeletion === 'function') {
                    window.recordItemDeletion(targetName);
                    (window.paceGoals || []).filter(g => g.type === 'subject' && g.target === targetName).forEach(g => window.recordItemDeletion(g.id));
                    (window.successResults || []).filter(r => r.type === 'cgpa' && r.subject === targetName).forEach(r => window.recordItemDeletion(r.id));
                }

                if (syllabusStructure[track]) {
                    syllabusStructure[track] = syllabusStructure[track].filter(s => s.subject !== targetName);
                }

                if (window.chartVisibility && window.chartVisibility.subjects) {
                    delete window.chartVisibility.subjects[targetName];
                }

                if (typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) {
                    for (let i = 0; i < AppState.tasks.length; i++) {
                        if (AppState.tasks[i].type !== 'study') continue;
                        const key = track + 'Tasks';
                        if (Array.isArray(AppState.tasks[i][key])) {
                            AppState.tasks[i][key] = AppState.tasks[i][key].map(b =>
                                b.subject === targetName ? { subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: b.id } : b
                            );
                        }
                    }
                    if (AppState.currentFilter === targetName) AppState.currentFilter = 'All';
                }

                if (Array.isArray(window.paceGoals)) {
                    window.paceGoals = window.paceGoals.filter(g => !(g.type === 'subject' && g.target === targetName));
                    window.paceGoals.forEach(g => {
                        if (g.type === 'bundle' && g.subjects) g.subjects = g.subjects.filter(s => s !== targetName);
                    });
                }

                if (window.passedItems && window.passedItems.subjects) {
                    window.passedItems.subjects = window.passedItems.subjects.filter(s => s !== targetName);
                }

                if (window.revisionData) {
                    if (window.revisionData.active) window.revisionData.active = window.revisionData.active.filter(s => s !== targetName);
                    if (window.revisionData.progress && window.revisionData.progress[targetName]) delete window.revisionData.progress[targetName];
                }

                if (window.successResults) {
                    window.successResults = window.successResults.filter(r => !(r.type === 'cgpa' && r.subject === targetName));
                }

                showToast(`Subject "${targetName}" deleted.`, "success");
            }
        }

        if (typeof recalculateTotals === 'function') recalculateTotals();

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        if (typeof renderUI === 'function') renderUI();
        updateManageDropdown();
    }

    // ==========================================
    // HEADER CONFIGURATION
    // ==========================================

    function saveHeaderConfigFromForm() {
        const topTagInput = document.getElementById('edit-header-tag');
        const mainTitleInput = document.getElementById('edit-header-title');
        const subTitleInput = document.getElementById('edit-header-sub');

        const topTag = topTagInput ? topTagInput.value.trim() : '';
        const mainTitle = mainTitleInput ? mainTitleInput.value.trim() : '';
        const subTitle = subTitleInput ? subTitleInput.value.trim() : '';

        if (!topTag || !mainTitle) return showToast("Top Tag and Main Title are required.", "error");

        if (!window.dashboardConfig) window.dashboardConfig = {};
        window.dashboardConfig.topTag = topTag;
        window.dashboardConfig.mainTitle = mainTitle;
        window.dashboardConfig.subTitle = subTitle;

        if (typeof safeSetText === 'function') {
            safeSetText('dash-top-tag', window.dashboardConfig.topTag);
            safeSetText('dash-top-tag-mobile', window.dashboardConfig.topTag);
            safeSetText('dash-main-title', window.dashboardConfig.mainTitle);
            safeSetText('dash-main-title-mobile', window.dashboardConfig.mainTitle);
            safeSetText('dash-sub-title', window.dashboardConfig.subTitle);
            safeSetText('dash-sub-title-mobile', window.dashboardConfig.subTitle);
        }

        if (window.dashboardConfig.topTag && window.dashboardConfig.mainTitle) {
            if (window.dashboardConfig.mainTitle.toLowerCase().startsWith(window.dashboardConfig.topTag.toLowerCase())) {
                document.title = window.dashboardConfig.mainTitle;
            } else {
                document.title = `${window.dashboardConfig.topTag} - ${window.dashboardConfig.mainTitle}`;
            }
        } else if (window.dashboardConfig.topTag || window.dashboardConfig.mainTitle) {
            document.title = window.dashboardConfig.topTag || window.dashboardConfig.mainTitle;
        }

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        if (typeof renderUI === 'function') renderUI();
        showToast("Dashboard headers updated successfully!", "success");
    }

    // ==========================================
    // CLEAN SLATE WORKSPACE RESET
    // ==========================================

    function resetToCleanSlate(confirmFirst = true) {
        const doWipe = () => {
            if (typeof window !== 'undefined') {
                window.tracks = [];
                window.syllabusStructure = {};
                window.customPrograms = {};
                window.customActions = [];
                window.paceGoals = [];
                window.passedItems = { programs: [], subjects: [] };
                window.revisionData = { active: [], progress: {} };
                window.subjectTimeLinks = {};
                window.successResults = [];
                window.subjectFocusTargets = {};
            }
            if (typeof AppState !== 'undefined') {
                AppState.tracks = [];
                AppState.syllabusStructure = {};
                AppState.customPrograms = {};
                AppState.customActions = [];
                AppState.paceGoals = [];
                AppState.examSessions = [];
                AppState.examRoutine = [];
                AppState.tasks = [];
                AppState.timerLogs = [];
                AppState.scheduleBlocks = [];
                AppState.scheduleBlocks2 = [];
                AppState.scheduleGroups = [];
                AppState.weeklyTargetsDatabase = {};
                AppState.monthlyTargetsDatabase = {};
                AppState.dailyTargetsDatabase = {};
                AppState.passedItems = { programs: [], subjects: [] };
                AppState.revisionData = { active: [], progress: {} };
                AppState.subjectFocusTargets = {};
                AppState.subjectTimeLinks = {};
                AppState.successResults = [];
                AppState.programVisibility = {};
                AppState.fiscalLedger = { transactions: [], budgets: [], vaults: [] };

                AppState.dashboardConfig = {
                    topTag: "X-29",
                    mainTitle: "X-29 Dashboard",
                    subTitle: "",
                    trendStartDate: new Date().toISOString().split('T')[0],
                    trendEndDate: "",
                    showDaysRemaining: false,
                    independentPaces: { tracks: {}, programs: {}, subjects: {} }
                };

                AppState.PLAN_START_DATE = new Date();
                AppState.PLAN_START_DATE.setHours(0, 0, 0, 0);
                AppState.PLAN_END_DATE = new Date();
                AppState.PLAN_END_DATE.setMonth(AppState.PLAN_END_DATE.getMonth() + 10);
                AppState.PLAN_END_DATE.setHours(23, 59, 59, 999);
            }

            if (typeof safeStorage !== 'undefined') {
                try {
                    safeStorage.removeItem('local_app_state');
                    safeStorage.removeItem('appState');
                    safeStorage.removeItem('cached_fullAppState');
                    safeStorage.removeItem('cached_examSessions');
                    safeStorage.removeItem('cached_examRoutine');
                    safeStorage.removeItem('cached_selectedCountdownExamId');
                } catch (e) { }
            }
            try {
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.removeItem('local_app_state');
                    sessionStorage.removeItem('appState');
                }
            } catch (e) { }

            if (typeof recalculateTotals === 'function') recalculateTotals();

            if (window.FirebaseService && window.FirebaseService.cloudDocumentExists !== false) {
                if (typeof window.FirebaseService.wipeCloudWorkspace === 'function') {
                    window.FirebaseService.wipeCloudWorkspace();
                } else if (typeof window.FirebaseService.saveToCloud === 'function') {
                    window.FirebaseService.saveToCloud(true);
                }
            }

            if (typeof renderUI === 'function') renderUI();

            if (typeof window.populateTrackDropdowns === 'function') window.populateTrackDropdowns();
            if (typeof window.updateManageDropdown === 'function') window.updateManageDropdown();
            if (typeof window.renderTrackList === 'function') window.renderTrackList();
            if (typeof window.renderExamSessions === 'function') window.renderExamSessions();

            if (typeof showToast === 'function') {
                showToast("Workspace reset successfully to a fresh, clean state!", "success");
            }
        };

        if (confirmFirst && typeof window.openConfirmModal === 'function') {
            window.openConfirmModal(
                "Reset Workspace Data",
                "Are you sure you want to completely clear all data? This will delete all tracks, subjects, chapters, daily actions, pace goals, exams, routines, tasks, and history. This action cannot be undone.",
                doWipe
            );
        } else {
            doWipe();
        }
    }

    // Attach to global window
    global.switchSysTab = switchSysTab;
    global.updateChProgDropdown = updateChProgDropdown;
    global.updateChSubjDropdown = updateChSubjDropdown;
    global.updateSubProgDropdown = updateSubProgDropdown;
    global.appendNewProgram = appendNewProgram;
    global.appendNewSubject = appendNewSubject;
    global.appendNewChapter = appendNewChapter;
    global.updateManageDropdown = updateManageDropdown;
    global.updateManageSubjects = updateManageSubjects;
    global.executeManageEdit = executeManageEdit;
    global.requestManageDelete = requestManageDelete;
    global.executeManageDelete = executeManageDelete;
    global.saveHeaderConfigFromForm = saveHeaderConfigFromForm;
    global.resetToCleanSlate = resetToCleanSlate;

    // CommonJS / module export compatibility
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            switchSysTab,
            updateChProgDropdown,
            updateChSubjDropdown,
            updateSubProgDropdown,
            appendNewProgram,
            appendNewSubject,
            appendNewChapter,
            updateManageDropdown,
            updateManageSubjects,
            executeManageEdit,
            requestManageDelete,
            executeManageDelete,
            saveHeaderConfigFromForm,
            resetToCleanSlate
        };
    }

})(typeof window !== 'undefined' ? window : this);
