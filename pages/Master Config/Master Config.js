/**
 * Master Config Page Module (pages/Master Config/Master Config.js)
 * Canonical single source of truth for Master Configuration logic:
 * - Dynamic Chapters, Subjects, and Programs expansion
 * - Manage Data (renaming & deleting programs, subjects, actions)
 * - Dashboard Top Tag, Main Title, and Subtitle updates
 * - Priority order ranking (Tracks, Programs, Subjects, Actions)
 * - Dynamic Tracks management (Add, Rename, Delete tracks)
 */

(function () {
    'use strict';

    /**
     * Page Lifecycle & Manager
     */
    const MasterConfigPage = {
        isMounted: false,
        activeTab: 'chapter',

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            // 1. Populate dashboard header input fields
            const tagInput = document.getElementById('edit-header-tag');
            if (tagInput && window.dashboardConfig) tagInput.value = window.dashboardConfig.topTag || '';
            const titleInput = document.getElementById('edit-header-title');
            if (titleInput && window.dashboardConfig) titleInput.value = window.dashboardConfig.mainTitle || '';
            const subInput = document.getElementById('edit-header-sub');
            if (subInput && window.dashboardConfig) subInput.value = window.dashboardConfig.subTitle || '';

            // 2. Populate track dropdowns in forms
            if (typeof window.populateTrackDropdowns === 'function') {
                window.populateTrackDropdowns();
            }

            // 3. Mount current or default active tab
            const activeSysTab = document.querySelector('[id^="sys-tab-"].bg-blue-600');
            const currentTab = activeSysTab ? activeSysTab.id.replace('sys-tab-', '') : this.activeTab || 'chapter';
            window.switchSysTab(currentTab);
        },

        destroy: function () {
            this.isMounted = false;

            // Safely close edit-track-modal if open when navigating away
            if (typeof window.closeModal === 'function') {
                const editTrackModal = document.getElementById('edit-track-modal');
                if (editTrackModal && !editTrackModal.classList.contains('hidden')) {
                    window.closeModal('edit-track-modal');
                }
            }
        }
    };

    window.MasterConfigPage = MasterConfigPage;

    // --- Tab Switching Logic ---

    window.switchSysTab = function (tab) {
        MasterConfigPage.activeTab = tab;
        ['chapter', 'subject', 'program', 'manage', 'priority', 'track'].forEach(t => {
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
        if (tab === 'chapter') window.updateChProgDropdown();
        if (tab === 'subject') window.updateSubProgDropdown();
        if (tab === 'manage') window.updateManageDropdown();
        if (tab === 'priority') window.renderPriorityConfig();
        if (tab === 'track') window.renderTrackList();
    };

    // --- Manage Data Logic (Rename / Delete Items & Header Config) ---

    window.updateManageDropdown = function () {
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
            sortedActions.forEach(a => targetSelect.innerHTML += `<option value="${a.id}">${a.title}</option>`);
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
            window.updateManageSubjects();
        }
    };

    window.updateManageSubjects = function () {
        const trackSelect = document.getElementById('manage-track');
        const progSelect = document.getElementById('manage-program');
        const targetSelect = document.getElementById('manage-target');
        if (!trackSelect || !progSelect || !targetSelect) return;

        const track = trackSelect.value;
        const prog = progSelect.value;
        targetSelect.innerHTML = '';

        const subs = (typeof syllabusStructure !== 'undefined' && syllabusStructure[track] ? syllabusStructure[track] : [])
            .filter(s => s.program === prog)
            .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

        subs.forEach(s => targetSelect.innerHTML += `<option value="${s.subject}">${s.subject}</option>`);
        if (subs.length === 0) targetSelect.innerHTML = '<option value="">No subjects found</option>';
    };

    window.executeManageEdit = function () {
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

        if (type === 'program') {
            let renamed = false;
            if (newName && oldName.toLowerCase() !== newName.toLowerCase()) {
                if (window.customPrograms[track] && window.customPrograms[track].some(p => (p.name || p).toLowerCase() === newName.toLowerCase())) return showToast("Program already exists.", "error");
                renamed = true;
            }

            const pIdx = window.customPrograms[track] ? window.customPrograms[track].findIndex(p => (p.name || p) === oldName) : -1;
            if (pIdx > -1) {
                let progObj = window.customPrograms[track][pIdx];
                if (typeof progObj !== 'object') {
                    progObj = {
                        id: oldName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'prog-' + pIdx,
                        name: oldName,
                        priority: 3,
                        order: pIdx
                    };
                    window.customPrograms[track][pIdx] = progObj;
                }

                if (renamed) {
                    progObj.name = newName;
                }
            }

            if (renamed) {
                if (typeof syllabusStructure !== 'undefined' && syllabusStructure[track]) {
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
            }

            // Update rename on existing overall and subject results
            if (window.successResults) {
                window.successResults.forEach(r => {
                    if (r.type === 'cgpa' && r.title === (renamed ? newName : oldName)) {
                        if (renamed) {
                            r.title = newName;
                        }
                    }
                });
            }

            if (renamed) {
                showToast("Program renamed successfully!", "success");
            } else {
                showToast("No changes made.", "warning");
            }

        } else if (type === 'subject') {
            if (oldName.toLowerCase() === newName.toLowerCase()) return showToast("New name must be different.", "error");
            const isGlobalDuplicate = typeof window.getAllSubjects === 'function' && window.getAllSubjects().some(s => s.subject.toLowerCase() === newName.toLowerCase());
            if (isGlobalDuplicate) return showToast("Subject name must be unique globally.", "error");

            const sObj = (typeof syllabusStructure !== 'undefined' && syllabusStructure[track]) ? syllabusStructure[track].find(s => s.subject === oldName) : null;
            if (sObj) sObj.subject = newName;

            if (AppState.subjectColors && AppState.subjectColors[oldName]) {
                AppState.subjectColors[newName] = AppState.subjectColors[oldName];
            }
            for (let i = 0; i < AppState.tasks.length; i++) {
                if (AppState.tasks[i].type !== 'study') continue;
                const key = track + 'Tasks';
                if (Array.isArray(AppState.tasks[i][key])) {
                    AppState.tasks[i][key].forEach(b => { if (b.subject === oldName) b.subject = newName; });
                }
            }

            if (AppState.currentFilter === oldName) AppState.currentFilter = newName;
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
            if (act) { act.title = newName; showToast("Action title updated!", "success"); }
        }

        newNameEl.value = '';
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        window.updateManageDropdown();
    };

    window.requestManageDelete = function () {
        const targetName = document.getElementById('manage-target')?.value;
        if (!targetName) return showToast("Please select an item to delete.", "error");
        window.openConfirmModal("Delete Item", `Are you sure you want to completely delete "${targetName}"? This action cannot be undone.`, window.executeManageDelete);
    };

    window.executeManageDelete = function () {
        const type = document.getElementById('manage-type')?.value;
        const targetName = document.getElementById('manage-target')?.value;
        if (!targetName) return showToast("Please select an item to delete.", "error");

        if (type === 'action') {
            if (typeof window.recordItemDeletion === 'function') {
                window.recordItemDeletion(targetName);
                const act = (window.customActions || []).find(a => a.id === targetName || a.name === targetName);
                if (act && act.id) window.recordItemDeletion(act.id);
            }
            window.customActions = (window.customActions || []).filter(a => a.id !== targetName && a.name !== targetName);
            if (window.chartVisibility && window.chartVisibility.monthly) delete window.chartVisibility.monthly[targetName];
            if (window.chartVisibility && window.chartVisibility.yearly) delete window.chartVisibility.yearly[targetName];
            showToast(`Action tracker deleted.`, "success");
        } else {
            const track = document.getElementById('manage-track')?.value;
            if (type === 'program') {
                const subsToDelete = (typeof syllabusStructure !== 'undefined' && syllabusStructure[track] ? syllabusStructure[track] : [])
                    .filter(s => s.program === targetName).map(s => s.subject);

                if (typeof window.recordItemDeletion === 'function') {
                    window.recordItemDeletion(targetName);
                    subsToDelete.forEach(sub => window.recordItemDeletion(sub));
                    (window.paceGoals || []).filter(g => (g.type === 'program' && g.target === targetName) || (g.type === 'subject' && subsToDelete.includes(g.target))).forEach(g => window.recordItemDeletion(g.id));
                    (window.successResults || []).filter(r => r.type === 'cgpa' && r.title === targetName).forEach(r => window.recordItemDeletion(r.id));
                }
                window.customPrograms[track] = (window.customPrograms[track] || []).filter(p => (p.name || p) !== targetName);
                if (typeof syllabusStructure !== 'undefined' && syllabusStructure[track]) {
                    syllabusStructure[track] = syllabusStructure[track].filter(s => s.program !== targetName);
                }
                if (window.chartVisibility && window.chartVisibility.prog) delete window.chartVisibility.prog[targetName];
                if (window.chartVisibility && window.chartVisibility.subjects) subsToDelete.forEach(sub => delete window.chartVisibility.subjects[sub]);

                for (let i = 0; i < AppState.tasks.length; i++) {
                    if (AppState.tasks[i].type !== 'study') continue;
                    const key = track + 'Tasks';
                    if (Array.isArray(AppState.tasks[i][key])) {
                        AppState.tasks[i][key] = AppState.tasks[i][key].map(b => subsToDelete.includes(b.subject) ? { subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: b.id } : b);
                    }
                }
                if (AppState.currentFilter !== 'All') AppState.currentFilter = 'All';
                window.paceGoals = (window.paceGoals || []).filter(g => !(g.type === 'program' && g.target === targetName) && !(g.type === 'subject' && subsToDelete.includes(g.target)));
                window.paceGoals.forEach(g => {
                    if (g.type === 'bundle' && g.programs) g.programs = g.programs.filter(p => p !== targetName);
                    if (g.type === 'bundle' && g.subjects) g.subjects = g.subjects.filter(s => !subsToDelete.includes(s));
                });
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
                if (typeof syllabusStructure !== 'undefined' && syllabusStructure[track]) {
                    syllabusStructure[track] = syllabusStructure[track].filter(s => s.subject !== targetName);
                }
                if (window.chartVisibility && window.chartVisibility.subjects) delete window.chartVisibility.subjects[targetName];

                for (let i = 0; i < AppState.tasks.length; i++) {
                    if (AppState.tasks[i].type !== 'study') continue;
                    const key = track + 'Tasks';
                    if (Array.isArray(AppState.tasks[i][key])) {
                        AppState.tasks[i][key] = AppState.tasks[i][key].map(b => b.subject === targetName ? { subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: b.id } : b);
                    }
                }
                if (AppState.currentFilter === targetName) AppState.currentFilter = 'All';
                window.paceGoals = (window.paceGoals || []).filter(g => !(g.type === 'subject' && g.target === targetName));
                window.paceGoals.forEach(g => {
                    if (g.type === 'bundle' && g.subjects) g.subjects = g.subjects.filter(s => s !== targetName);
                });
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
        window.updateManageDropdown();
    };

    window.saveHeaderConfigFromForm = function () {
        const topTagEl = document.getElementById('edit-header-tag');
        const mainTitleEl = document.getElementById('edit-header-title');
        const subTitleEl = document.getElementById('edit-header-sub');
        if (!topTagEl || !mainTitleEl) return;

        const topTag = topTagEl.value.trim();
        const mainTitle = mainTitleEl.value.trim();
        const subTitle = subTitleEl ? subTitleEl.value.trim() : '';

        if (!topTag || !mainTitle) return showToast("Top Tag and Main Title are required.", "error");

        window.dashboardConfig = window.dashboardConfig || {};
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
        } else {
            document.title = "X-29";
        }

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        showToast("Dashboard titles updated!", "success");
    };

    // --- Add Chapter / Subject / Program Dropdowns & Actions ---

    window.updateChProgDropdown = function () {
        const trackEl = document.getElementById('add-ch-track');
        const progSelect = document.getElementById('add-ch-program');
        if (!trackEl || !progSelect) return;

        const track = trackEl.value;
        progSelect.innerHTML = '';
        if (window.customPrograms && window.customPrograms[track]) {
            window.customPrograms[track].forEach(p => {
                const pName = p.name || p;
                progSelect.innerHTML += `<option value="${pName}">${pName}</option>`;
            });
        }
        window.updateChSubjDropdown();
    };

    window.updateChSubjDropdown = function () {
        const trackEl = document.getElementById('add-ch-track');
        const progEl = document.getElementById('add-ch-program');
        const subjSelect = document.getElementById('add-ch-subject');
        if (!trackEl || !progEl || !subjSelect) return;

        const track = trackEl.value;
        const prog = progEl.value;
        subjSelect.innerHTML = '';
        const subs = (typeof syllabusStructure !== 'undefined' && syllabusStructure[track] ? syllabusStructure[track] : [])
            .filter(s => s.program === prog)
            .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

        subs.forEach(s => subjSelect.innerHTML += `<option value="${s.subject}">${s.subject}</option>`);
        if (subs.length === 0) subjSelect.innerHTML = '<option value="">No subjects found</option>';
    };

    window.updateSubProgDropdown = function () {
        const trackEl = document.getElementById('add-sub-track');
        const progSelect = document.getElementById('add-sub-program');
        if (!trackEl || !progSelect) return;

        const track = trackEl.value;
        progSelect.innerHTML = '';
        if (window.customPrograms && window.customPrograms[track]) {
            window.customPrograms[track].forEach(p => {
                const pName = p.name || p;
                progSelect.innerHTML += `<option value="${pName}">${pName}</option>`;
            });
        }
    };

    window.appendNewProgram = function () {
        const trackEl = document.getElementById('add-prog-track');
        const nameEl = document.getElementById('add-prog-name');
        if (!trackEl || !nameEl) return;

        const track = trackEl.value;
        const name = nameEl.value.trim();
        if (!name) return showToast("Program name required.", "error");

        window.customPrograms[track] = window.customPrograms[track] || [];
        if (window.customPrograms[track].some(p => (p.name || p).toLowerCase() === name.toLowerCase())) return showToast("Program already exists.", "error");

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const nextOrder = window.customPrograms[track].length;
        window.customPrograms[track].push({
            id: slug || 'prog-' + Date.now(),
            name: name,
            priority: 3,
            order: nextOrder,
            targetCGPA: ''
        });
        if (typeof window.sortAllCustomData === 'function') window.sortAllCustomData();

        nameEl.value = '';
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        showToast("Program successfully added!", "success");
    };

    window.appendNewSubject = function () {
        const trackEl = document.getElementById('add-sub-track');
        const progEl = document.getElementById('add-sub-program');
        const nameEl = document.getElementById('add-sub-name');
        const bulkCb = document.getElementById('add-sub-bulk-cb');
        const bulkNumEl = document.getElementById('add-sub-bulk-num');
        if (!trackEl || !progEl || !nameEl) return;

        const track = trackEl.value;
        const prog = progEl.value;
        const name = nameEl.value.trim();
        const doBulk = bulkCb ? bulkCb.checked : false;
        const bulkNum = bulkNumEl ? (parseInt(bulkNumEl.value) || 0) : 0;

        if (!name) return showToast("Subject name required.", "error");

        const isGlobalDuplicate = typeof window.getAllSubjects === 'function' && window.getAllSubjects().some(s => s.subject.toLowerCase() === name.toLowerCase());
        if (isGlobalDuplicate) return showToast("Subject already exists. Names must be unique.", "error");

        if (doBulk && bulkNum <= 0) return showToast("Please enter a valid number of chapters to bulk add.", "error");

        let chaptersToAssign = doBulk ? bulkNum : 0;
        const todayStr = Utils.formatDate(new Date());
        let todayIdx = AppState.tasks.findIndex(t => t.date === todayStr);
        if (todayIdx === -1) todayIdx = 0;

        if (doBulk && typeof ensureAvailableSlots === 'function') {
            ensureAvailableSlots(chaptersToAssign, track, todayIdx);
        }

        syllabusStructure[track] = syllabusStructure[track] || [];
        const nextSubOrder = syllabusStructure[track].filter(s => s.program === prog).length;
        syllabusStructure[track].push({ program: prog, subject: name, chapters: chaptersToAssign, priority: 3, order: nextSubOrder });
        if (typeof window.sortAllCustomData === 'function') window.sortAllCustomData();
        if (typeof getSubjectColor === 'function') getSubjectColor(name);

        if (doBulk) {
            let currentChapter = 1;
            const key = track + 'Tasks';
            for (let i = todayIdx; i < AppState.tasks.length && currentChapter <= chaptersToAssign; i++) {
                if (AppState.tasks[i].type !== 'study') continue;
                if (Array.isArray(AppState.tasks[i][key])) {
                    const bIdx = AppState.tasks[i][key].findIndex(b => b.subject === 'Revision');
                    if (bIdx > -1) {
                        AppState.tasks[i][key][bIdx] = { subject: name, chapter: `Ch. ${currentChapter}`, title: `Topic ${currentChapter}`, completed: false, id: AppState.tasks[i][key][bIdx].id };
                        currentChapter++;
                    }
                }
            }
            if (typeof reorderSubjectChapters === 'function') reorderSubjectChapters(track, name);
        }

        nameEl.value = '';
        if (bulkCb) bulkCb.checked = false;
        if (bulkNumEl) {
            bulkNumEl.value = '';
            bulkNumEl.classList.add('hidden');
        }

        if (typeof recalculateTotals === 'function') recalculateTotals();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        setTimeout(() => {
            if (typeof renderUI === 'function') renderUI();
            showToast(doBulk ? `Subject created and ${chaptersToAssign} chapters scheduled!` : "Subject successfully created!", "success");
        }, 50);
    };

    window.appendNewChapter = function () {
        const trackEl = document.getElementById('add-ch-track');
        const progEl = document.getElementById('add-ch-program');
        const subjEl = document.getElementById('add-ch-subject');
        const numEl = document.getElementById('add-ch-num');
        const titleEl = document.getElementById('add-ch-title');
        if (!trackEl || !subjEl || !numEl || !titleEl) return;

        const track = trackEl.value;
        const subj = subjEl.value;
        const num = numEl.value;
        const title = titleEl.value;
        const formattedCh = `Ch. ${num}`;

        if (!subj || !num || !title) return showToast("Please fill all fields.", "error");

        let isDuplicate = false;
        const key = track + 'Tasks';
        for (let i = 0; i < AppState.tasks.length; i++) {
            if (AppState.tasks[i].type !== 'study') continue;
            if (Array.isArray(AppState.tasks[i][key]) && AppState.tasks[i][key].some(b => b.subject === subj && b.chapter === formattedCh)) { isDuplicate = true; break; }
        }
        if (isDuplicate) return showToast(`Chapter ${num} already exists for ${subj}!`, "error");

        const todayStr = Utils.formatDate(new Date());
        let todayIdx = AppState.tasks.findIndex(t => t.date === todayStr);
        if (todayIdx === -1) todayIdx = 0;

        if (typeof ensureAvailableSlots === 'function') {
            ensureAvailableSlots(1, track, todayIdx);
        }

        let slotted = false;
        for (let i = todayIdx; i < AppState.tasks.length; i++) {
            if (AppState.tasks[i].type !== 'study') continue;
            if (Array.isArray(AppState.tasks[i][key])) {
                const bIdx = AppState.tasks[i][key].findIndex(b => b.subject === 'Revision');
                if (bIdx > -1) {
                    AppState.tasks[i][key][bIdx] = { subject: subj, chapter: formattedCh, title: title, completed: false, id: AppState.tasks[i][key][bIdx].id };
                    slotted = true;
                    break;
                }
            }
        }

        if (!slotted) return showToast("No upcoming 'Revision' slots left for this track!", "error");

        if (typeof reorderSubjectChapters === 'function') reorderSubjectChapters(track, subj);
        const targetSub = (typeof syllabusStructure !== 'undefined' && syllabusStructure[track] ? syllabusStructure[track] : []).find(s => s.subject === subj);
        if (targetSub) targetSub.chapters++;

        if (typeof recalculateTotals === 'function') recalculateTotals();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        numEl.value = '';
        titleEl.value = '';
        showToast("Chapter added and sequenced!", "success");
    };

    // --- Set Priority Logic ---

    window.syncPriorityInputsFromDOM = function () {
        // Tracks
        if (window.tracks) {
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
            const orig = (window.customPrograms && window.customPrograms[p._trackId] ? window.customPrograms[p._trackId] : []).find(x => x.id === p.id);
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
            const select = document.getElementById(`priority-subject-${s.subject.replace(/[^a-zA-Z0-9]/g, '-')}`);
            if (select) {
                const val = parseInt(select.value);
                s.priority = isNaN(val) ? 3 : val;
            }
            s.order = idx;
        });

        // Daily Action priorities
        if (window.customActions) {
            window.customActions.forEach((a, idx) => {
                const select = document.getElementById(`priority-action-${a.id}`);
                if (select) {
                    const val = parseInt(select.value);
                    a.priority = isNaN(val) ? 3 : val;
                }
                a.order = idx;
            });
        }
    };

    window.moveTrack = function (index, direction) {
        const list = window.tracks;
        if (!list) return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= list.length) return;

        window.syncPriorityInputsFromDOM();

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
        list.forEach((t, idx) => t.order = idx);

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        window.renderPriorityConfig();
        showToast("Track order updated!", "success");
    };

    window.moveProgramGlobal = function (flatIndex, direction) {
        window.syncPriorityInputsFromDOM();

        // Build a globally-sorted flat list of all programs across all tracks
        const flat = [];
        (window.tracks || []).forEach(t => {
            (window.customPrograms && window.customPrograms[t.id] ? window.customPrograms[t.id] : []).forEach(p => {
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
        (window.tracks || []).forEach(t => {
            if (window.customPrograms && window.customPrograms[t.id]) {
                window.customPrograms[t.id].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
            }
        });
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        window.renderPriorityConfig();
        showToast("Program order updated!", "success");
    };

    window.moveSubjectGlobal = function (index, direction) {
        const list = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= list.length) return;

        window.syncPriorityInputsFromDOM();

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

        if (typeof window.sortAllCustomData === 'function') window.sortAllCustomData();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        window.renderPriorityConfig();
        showToast("Subject order updated!", "success");
    };

    window.moveAction = function (index, direction) {
        const list = window.customActions;
        if (!list) return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= list.length) return;

        window.syncPriorityInputsFromDOM();

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
        list.forEach((a, idx) => a.order = idx);

        if (typeof window.sortAllCustomData === 'function') window.sortAllCustomData();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        window.renderPriorityConfig();
        showToast("Daily action order updated!", "success");
    };

    window.onPriorityDropdownChange = function (category, itemId, newValue) {
        const val = parseInt(newValue);
        if (isNaN(val)) return;

        if (category === 'track') {
            const item = (window.tracks || []).find(t => t.id === itemId);
            if (!item) return;
            const oldPriority = item.priority;
            const other = (window.tracks || []).find(t => t.id !== itemId && t.priority === val);
            if (other) {
                other.priority = oldPriority;
            }
            item.priority = val;
            window.tracks.sort((a, b) => a.priority - b.priority);
            window.tracks.forEach((t, idx) => {
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
            (window.tracks || []).forEach(trackObj => {
                if (window.customPrograms && window.customPrograms[trackObj.id]) {
                    window.customPrograms[trackObj.id].forEach(p => {
                        if (p.id === itemId) p.priority = val;
                        else if (other && p.id === other.id) p.priority = oldPriority;
                    });
                }
            });

            // Collect all custom program objects globally
            const actualProgs = [];
            (window.tracks || []).forEach(trackObj => {
                if (window.customPrograms && window.customPrograms[trackObj.id]) {
                    window.customPrograms[trackObj.id].forEach(p => {
                        actualProgs.push(p);
                    });
                }
            });

            actualProgs.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
            actualProgs.forEach((p, idx) => {
                p.priority = idx + 1;
                p.order = idx;
            });

            (window.tracks || []).forEach(trackObj => {
                if (window.customPrograms && Array.isArray(window.customPrograms[trackObj.id])) {
                    window.customPrograms[trackObj.id].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
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

            flatSubs.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (a.order ?? 999) - (b.order ?? 999));
            flatSubs.forEach((s, idx) => {
                s.priority = idx + 1;
                s.order = idx;
            });
        } else if (category === 'action') {
            const item = (window.customActions || []).find(a => a.id === itemId);
            if (!item) return;
            const oldPriority = item.priority;
            const other = (window.customActions || []).find(a => a.id !== itemId && a.priority === val);
            if (other) {
                other.priority = oldPriority;
            }
            item.priority = val;

            window.customActions.sort((a, b) => a.priority - b.priority);
            window.customActions.forEach((a, idx) => {
                a.priority = idx + 1;
                a.order = idx;
            });
        }

        if (typeof window.sortAllCustomData === 'function') window.sortAllCustomData();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        window.renderPriorityConfig();
    };

    window.renderPriorityConfig = function () {
        const container = document.getElementById('sys-content-priority');
        if (!container) return;

        const currentDataString = JSON.stringify({
            tracks: window.tracks,
            programs: window.customPrograms,
            syllabus: typeof syllabusStructure !== 'undefined' ? syllabusStructure : {},
            actions: window.customActions
        });
        if (currentDataString === window.lastPriorityRenderData) {
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

        // Section: Tracks
        html += `
                <div class="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-indigo-500 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"></path></svg>
                        Tracks Priority Order
                        <span class="ml-auto text-[8px] font-bold text-slate-400 normal-case tracking-normal">(Affects Completion Rate &amp; Subject Progress)</span>
                    </h4>
                    <div class="flex flex-col gap-2">`;
        if (!window.tracks || window.tracks.length === 0) {
            html += `<p class="text-xs font-bold text-slate-400">No tracks found.</p>`;
        } else {
            window.tracks.forEach((t, idx) => {
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
                        for (let i = 1; i <= window.tracks.length; i++) {
                            options += `<option value="${i}" ${(t.priority ?? 3) === i ? 'selected' : ''}>${i}</option>`;
                        }
                        return options;
                    })()}
                                </select>
                                <div class="flex flex-col gap-0.5 shrink-0">
                                    ${arrowUpBtn(`window.moveTrack(${idx}, -1)`, idx === 0)}
                                    ${arrowDownBtn(`window.moveTrack(${idx}, 1)`, idx === window.tracks.length - 1)}
                                </div>
                            </div>
                        </div>`;
            });
        }
        html += `</div></div>`;

        // Section: Programs
        html += `
                <div class="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-violet-500 border-b border-slate-200/60 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        Programs Priority Order
                        <span class="ml-auto text-[8px] font-bold text-slate-400 normal-case tracking-normal">(Independent from Subjects)</span>
                    </h4>
                    <div class="flex flex-col gap-2">`;
        const flatProgList = [];
        (window.tracks || []).forEach(trackObj => {
            (window.customPrograms && window.customPrograms[trackObj.id] ? window.customPrograms[trackObj.id] : []).forEach(p => {
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

        // Section: Syllabus Subjects + Daily Actions
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
                const color = typeof getSubjectColor === 'function' ? getSubjectColor(s.subject) : '#10b981';
                let trackName = '';
                for (const t of (window.tracks || [])) {
                    if (typeof syllabusStructure !== 'undefined' && syllabusStructure[t.id] && syllabusStructure[t.id].some(x => x.subject === s.subject)) {
                        trackName = t.name;
                        break;
                    }
                }
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
                                <select id="priority-subject-${s.subject.replace(/[^a-zA-Z0-9]/g, '-')}" onchange="window.onPriorityDropdownChange('subject', '${s.subject.replace(/'/g, "\\'")}', this.value)"
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
        if (!window.customActions || window.customActions.length === 0) {
            html += `<p class="text-xs font-bold text-slate-400">No custom actions created yet.</p>`;
        } else {
            window.customActions.forEach((a, idx) => {
                const pVal = a.priority !== undefined ? a.priority : 3;
                const cMap = (AppState.twColors && AppState.twColors[a.color]) ? AppState.twColors[a.color] : (AppState.twColors ? AppState.twColors.indigo : { hex: '#6366f1' });
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
                        for (let i = 1; i <= window.customActions.length; i++) {
                            options += `<option value="${i}" ${pVal === i ? 'selected' : ''}>${i}</option>`;
                        }
                        return options;
                    })()}
                                </select>
                                <div class="flex flex-col gap-0.5 shrink-0">
                                    ${arrowUpBtn(`window.moveAction(${idx}, -1)`, idx === 0)}
                                    ${arrowDownBtn(`window.moveAction(${idx}, 1)`, idx === window.customActions.length - 1)}
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
    };

    window.savePriorities = function () {
        window.syncPriorityInputsFromDOM();
        if (typeof window.sortAllCustomData === 'function') window.sortAllCustomData();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') renderUI();
        window.renderPriorityConfig();
        showToast("Priorities saved and synced successfully!", "success");
    };

    // --- Dynamic Tracks Configuration System Logic ---

    window.renderTrackList = function () {
        const container = document.getElementById('sys-content-track');
        if (!container) return;

        let html = `
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">Add, rename, or delete academic or professional tracks. WARNING: Deleting a track deletes all its programs, subjects, and study progress data.</p>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <!-- Add Track Card -->
                    <div class="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">Add New Track</h4>
                        <div class="flex flex-col gap-3">
                            <div class="flex flex-col gap-1.5">
                                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Track Name</label>
                                <input type="text" id="add-track-name" placeholder="e.g. Postgraduate (MBA)"
                                    class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold w-full">
                            </div>
                            <button onclick="window.appendNewTrack()"
                                class="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] md:text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                Add Track
                            </button>
                        </div>
                    </div>

                    <!-- Existing Tracks List -->
                    <div class="lg:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">Existing Tracks</h4>
                        <div class="flex flex-col gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                `;

        (window.tracks || []).forEach(track => {
            const totalPrograms = window.customPrograms && window.customPrograms[track.id] ? window.customPrograms[track.id].length : 0;
            const totalSubjects = typeof syllabusStructure !== 'undefined' && syllabusStructure[track.id] ? syllabusStructure[track.id].length : 0;

            html += `
                    <div class="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-all hover:border-blue-400">
                        <div class="flex flex-col min-w-0 pr-2 flex-1">
                            <span class="text-xs font-black text-slate-800 dark:text-slate-200 break-words whitespace-normal leading-normal">${track.name}</span>
                            <div class="flex flex-wrap items-center gap-2 mt-1">
                                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ID: ${track.id}</span>
                                <span class="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">${totalPrograms} Programs</span>
                                <span class="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">${totalSubjects} Subjects</span>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2 shrink-0 ml-2">
                            <button onclick="window.editTrackName('${track.id}')"
                                class="p-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                                title="Rename Track">Rename</button>
                            <button onclick="window.requestDeleteTrack('${track.id}')"
                                class="p-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all active:scale-95"
                                title="Delete Track">Delete</button>
                        </div>
                    </div>`;
        });

        html += `
                        </div>
                    </div>
                </div>
                `;

        container.innerHTML = html;
    };

    window.appendNewTrack = function () {
        const nameInput = document.getElementById('add-track-name');
        if (!nameInput) return;
        const name = nameInput.value.trim();
        if (!name) return showToast("Track name required.", "error");

        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!id) return showToast("Invalid track name.", "error");

        window.tracks = window.tracks || [];
        if (window.tracks.some(t => t.id === id)) {
            return showToast("A track with this ID or name already exists.", "error");
        }

        window.tracks.push({ id: id, name: name });
        window.customPrograms[id] = [];
        syllabusStructure[id] = [];

        if (Array.isArray(AppState.tasks)) {
            AppState.tasks.forEach(task => {
                if (task.type === 'study') {
                    if (task[id + 'Study'] === undefined) {
                        task[id + 'Study'] = false;
                    }
                    const key = id + 'Tasks';
                    if (!task[key]) {
                        task[key] = [{ subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: `${id}-${task.id}` }];
                    }
                } else if (task.type === 'holiday') {
                    if (task[id + 'Study'] === undefined) {
                        task[id + 'Study'] = false;
                    }
                }
            });
        }

        nameInput.value = '';
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof window.populateTrackDropdowns === 'function') window.populateTrackDropdowns();
        if (typeof renderUI === 'function') renderUI();
        window.renderTrackList();
        showToast(`Track "${name}" successfully created!`, "success");
    };

    window.editTrackName = function (id) {
        const track = (window.tracks || []).find(t => t.id === id);
        if (!track) return;

        const idEl = document.getElementById('etm-track-id');
        const nameEl = document.getElementById('etm-track-name');
        if (idEl) idEl.value = id;
        if (nameEl) nameEl.value = track.name;
        if (typeof openModal === 'function') openModal('edit-track-modal');
    };

    window.saveTrackEditModal = function () {
        const idEl = document.getElementById('etm-track-id');
        const nameEl = document.getElementById('etm-track-name');
        if (!idEl || !nameEl) return;

        const id = idEl.value;
        const newName = nameEl.value.trim();
        if (!newName) return showToast("Track name cannot be empty.", "error");

        const track = (window.tracks || []).find(t => t.id === id);
        if (!track) return;

        track.name = newName;
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof window.populateTrackDropdowns === 'function') window.populateTrackDropdowns();
        if (typeof renderUI === 'function') renderUI();
        window.renderTrackList();
        if (typeof closeModal === 'function') closeModal('edit-track-modal');
        showToast("Track renamed successfully!", "success");
    };

    window.requestDeleteTrack = function (id) {
        const track = (window.tracks || []).find(t => t.id === id);
        if (!track) return;

        window.openConfirmModal(
            "Delete Track",
            `Are you sure you want to completely delete the track "${track.name}"? This will delete all its programs, subjects, and daily task data. This action cannot be undone.`,
            () => {
                window.executeDeleteTrack(id);
            }
        );
    };

    window.executeDeleteTrack = function (id) {
        const track = (window.tracks || []).find(t => t.id === id);
        if (!track) return;

        const programsToCleanup = (window.customPrograms[id] || []).map(p => p.name || p);
        const subjectsToCleanup = (typeof syllabusStructure !== 'undefined' && syllabusStructure[id] ? syllabusStructure[id] : []).map(s => s.subject);

        if (typeof window.recordItemDeletion === 'function') {
            window.recordItemDeletion(id);
            programsToCleanup.forEach(p => window.recordItemDeletion(p));
            subjectsToCleanup.forEach(s => window.recordItemDeletion(s));
        }

        window.tracks = window.tracks.filter(t => t.id !== id);

        if (Array.isArray(window.customActions)) {
            window.customActions.forEach(a => {
                if (a.track === id) a.track = null;
            });
        }

        if (window.customPrograms && window.customPrograms[id]) delete window.customPrograms[id];
        if (typeof syllabusStructure !== 'undefined' && syllabusStructure[id]) delete syllabusStructure[id];

        const keyTasks = id + 'Tasks';
        const keyStudy = id + 'Study';
        if (Array.isArray(AppState.tasks)) {
            AppState.tasks.forEach(task => {
                if (task[keyTasks]) delete task[keyTasks];
                if (task[keyStudy] !== undefined) delete task[keyStudy];
            });
        }

        if (window.passedItems) {
            if (window.passedItems.programs) {
                window.passedItems.programs = window.passedItems.programs.filter(p => !programsToCleanup.includes(p));
            }
            if (window.passedItems.subjects) {
                window.passedItems.subjects = window.passedItems.subjects.filter(s => !subjectsToCleanup.includes(s));
            }
        }

        if (window.revisionData) {
            if (window.revisionData.active) {
                window.revisionData.active = window.revisionData.active.filter(s => !subjectsToCleanup.includes(s));
            }
            if (window.revisionData.progress) {
                subjectsToCleanup.forEach(sub => {
                    if (window.revisionData.progress[sub]) delete window.revisionData.progress[sub];
                });
            }
        }

        if (window.subjectTimeLinks) {
            subjectsToCleanup.forEach(sub => {
                if (window.subjectTimeLinks[sub]) delete window.subjectTimeLinks[sub];
            });
        }

        if (window.successResults) {
            window.successResults = window.successResults.filter(r => {
                if (r.type === 'cgpa') {
                    if (programsToCleanup.includes(r.title)) return false;
                    if (r.subject && subjectsToCleanup.includes(r.subject)) return false;
                }
                return true;
            });
        }

        if (window.paceGoals) {
            window.paceGoals = window.paceGoals.filter(g => {
                if (g.type === 'program' && programsToCleanup.includes(g.target)) return false;
                if (g.type === 'subject' && subjectsToCleanup.includes(g.target)) return false;
                return true;
            });
            window.paceGoals.forEach(g => {
                if (g.type === 'bundle') {
                    if (g.programs) g.programs = g.programs.filter(p => !programsToCleanup.includes(p));
                    if (g.subjects) g.subjects = g.subjects.filter(s => !subjectsToCleanup.includes(s));
                } else if (g.type === 'global') {
                    if (g.subjects) g.subjects = g.subjects.filter(s => !subjectsToCleanup.includes(s));
                }
            });
            window.paceGoals = window.paceGoals.filter(g => {
                if (g.type === 'bundle' && (!g.programs || g.programs.length === 0) && (!g.subjects || g.subjects.length === 0)) return false;
                return true;
            });
        }

        if (window.subjectDetailsState) {
            subjectsToCleanup.forEach(sub => {
                const safeSubId = sub.replace(/[^a-zA-Z0-9]/g, '-');
                if (window.subjectDetailsState[safeSubId] !== undefined) {
                    delete window.subjectDetailsState[safeSubId];
                }
            });
        }

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof window.populateTrackDropdowns === 'function') window.populateTrackDropdowns();
        if (typeof renderUI === 'function') renderUI();
        if (AppState.currentFilter && (programsToCleanup.includes(AppState.currentFilter) || subjectsToCleanup.includes(AppState.currentFilter))) {
            AppState.currentFilter = 'All';
            if (typeof renderUI === 'function') renderUI();
        }
        window.renderTrackList();
        showToast(`Track "${track.name}" and all associated data deleted.`, "success");
    };

    // Auto-init if container exists and is visible on initial load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-master-config');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.MasterConfigPage.init();
        }
    }
})();
