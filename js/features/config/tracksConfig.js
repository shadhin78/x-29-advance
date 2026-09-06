/**
 * X-29 Advance - Dynamic Tracks Configuration Module
 * File: js/features/config/tracksConfig.js
 *
 * Provides:
 * - Dynamic Tracks Manager (renderTrackList, appendNewTrack, editTrackName, saveTrackEditModal)
 * - Track Deletion & Cascade Safety (requestDeleteTrack, executeDeleteTrack)
 * - Track dropdown population helper (populateTrackDropdowns)
 */

(function (global) {
    'use strict';

    /**
     * Populates all track dropdown selectors across the app with the current track list.
     */
    function populateTrackDropdowns() {
        const trackDropdowns = [
            'add-ch-track',
            'add-sub-track',
            'add-prog-track',
            'manage-track',
            'esm-track',
            'add-act-track',
            'edam-action-track',
            'adt-todo-track',
            'schedule-input-track'
        ];

        const tracksList = Array.isArray(window.tracks) ? window.tracks : [];

        trackDropdowns.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            const currentVal = select.value;
            if (id === 'add-act-track' || id === 'edam-action-track' || id === 'adt-todo-track' || id === 'schedule-input-track') {
                select.innerHTML = '<option value="">-- No Track (Optional) --</option>' +
                    tracksList.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            } else {
                select.innerHTML = tracksList.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            }

            if (currentVal && (tracksList.some(t => t.id === currentVal) || currentVal === '')) {
                select.value = currentVal;
            }
        });
    }

    /**
     * Renders the Dynamic Tracks tab view in Master Configuration.
     */
    function renderTrackList() {
        const container = document.getElementById('sys-content-track');
        if (!container) return;

        const tracksList = Array.isArray(window.tracks) ? window.tracks : [];
        const customPrograms = window.customPrograms || {};
        const syllabusStructure = window.syllabusStructure || {};

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

        tracksList.forEach(track => {
            const totalPrograms = customPrograms[track.id] ? customPrograms[track.id].length : 0;
            const totalSubjects = syllabusStructure[track.id] ? syllabusStructure[track.id].length : 0;

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
    }

    /**
     * Appends a newly created Track to system state and backfills existing task models.
     */
    function appendNewTrack() {
        const nameInput = document.getElementById('add-track-name');
        if (!nameInput) return;
        const name = nameInput.value.trim();
        if (!name) return showToast("Track name required.", "error");

        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!id) return showToast("Invalid track name.", "error");

        if (!Array.isArray(window.tracks)) {
            window.tracks = [];
        }

        if (window.tracks.some(t => t.id === id)) {
            return showToast("A track with this ID or name already exists.", "error");
        }

        // Update State
        window.tracks.push({ id: id, name: name });
        if (!window.customPrograms) window.customPrograms = {};
        window.customPrograms[id] = [];
        if (!window.syllabusStructure) window.syllabusStructure = {};
        window.syllabusStructure[id] = [];

        // Backfill tasks: Loop through all existing AppState.tasks and add the new track properties
        if (typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) {
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

        populateTrackDropdowns();
        if (typeof renderUI === 'function') renderUI();
        renderTrackList();
        showToast(`Track "${name}" successfully created!`, "success");
    }

    /**
     * Opens the track renaming modal.
     */
    function editTrackName(id) {
        const track = (window.tracks || []).find(t => t.id === id);
        if (!track) return;

        const idEl = document.getElementById('etm-track-id');
        const nameEl = document.getElementById('etm-track-name');
        if (idEl) idEl.value = id;
        if (nameEl) nameEl.value = track.name;

        if (typeof openModal === 'function') {
            openModal('edit-track-modal');
        }
    }

    /**
     * Saves changes from the track edit modal.
     */
    function saveTrackEditModal() {
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

        populateTrackDropdowns();
        if (typeof renderUI === 'function') renderUI();
        renderTrackList();

        if (typeof closeModal === 'function') {
            closeModal('edit-track-modal');
        }

        showToast("Track renamed successfully!", "success");
    }

    /**
     * Confirms track deletion.
     */
    function requestDeleteTrack(id) {
        const track = (window.tracks || []).find(t => t.id === id);
        if (!track) return;

        if (typeof window.openConfirmModal === 'function') {
            window.openConfirmModal(
                "Delete Track",
                `Are you sure you want to completely delete the track "${track.name}"? This will delete all its programs, subjects, and daily task data. This action cannot be undone.`,
                () => {
                    executeDeleteTrack(id);
                }
            );
        } else if (confirm(`Are you sure you want to delete track "${track.name}"?`)) {
            executeDeleteTrack(id);
        }
    }

    /**
     * Executes track deletion with complete cascade cleanup across downstream consumers.
     */
    function executeDeleteTrack(id) {
        const track = (window.tracks || []).find(t => t.id === id);
        if (!track) return;

        const customPrograms = window.customPrograms || {};
        const syllabusStructure = window.syllabusStructure || {};

        // Gather associated programs and subjects to clean them up from global configs
        const programsToCleanup = (customPrograms[id] || []).map(p => p.name || p);
        const subjectsToCleanup = (syllabusStructure[id] || []).map(s => s.subject);

        if (typeof window.recordItemDeletion === 'function') {
            window.recordItemDeletion(id);
            programsToCleanup.forEach(p => window.recordItemDeletion(p));
            subjectsToCleanup.forEach(s => window.recordItemDeletion(s));
        }

        // Remove from tracks
        window.tracks = (window.tracks || []).filter(t => t.id !== id);

        // Clean up AppState.customActions track association
        if (Array.isArray(window.customActions)) {
            window.customActions.forEach(a => {
                if (a.track === id) a.track = null;
            });
        }

        // Clean up customPrograms & syllabusStructure
        if (customPrograms[id]) delete customPrograms[id];
        if (syllabusStructure[id]) delete syllabusStructure[id];

        // Remove from AppState.tasks properties
        const keyTasks = id + 'Tasks';
        const keyStudy = id + 'Study';
        if (typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) {
            AppState.tasks.forEach(task => {
                if (task[keyTasks]) delete task[keyTasks];
                if (task[keyStudy] !== undefined) delete task[keyStudy];
            });
        }

        // Cleanup window.passedItems
        if (window.passedItems) {
            if (window.passedItems.programs) {
                window.passedItems.programs = window.passedItems.programs.filter(p => !programsToCleanup.includes(p));
            }
            if (window.passedItems.subjects) {
                window.passedItems.subjects = window.passedItems.subjects.filter(s => !subjectsToCleanup.includes(s));
            }
        }

        // Cleanup window.revisionData
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

        // Cleanup window.subjectTimeLinks
        if (window.subjectTimeLinks) {
            subjectsToCleanup.forEach(sub => {
                if (window.subjectTimeLinks[sub]) delete window.subjectTimeLinks[sub];
            });
        }

        // Cleanup window.successResults
        if (window.successResults) {
            window.successResults = window.successResults.filter(r => {
                if (r.type === 'cgpa') {
                    if (programsToCleanup.includes(r.title)) return false;
                    if (r.subject && subjectsToCleanup.includes(r.subject)) return false;
                }
                return true;
            });
        }

        // Cleanup window.paceGoals
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
            // Remove empty bundles
            window.paceGoals = window.paceGoals.filter(g => {
                if (g.type === 'bundle' && (!g.programs || g.programs.length === 0) && (!g.subjects || g.subjects.length === 0)) return false;
                return true;
            });
        }

        // Cleanup window.subjectDetailsState
        if (window.subjectDetailsState) {
            subjectsToCleanup.forEach(sub => {
                const safeSubId = sub.replace(/[^a-zA-Z0-9]/g, '-');
                if (window.subjectDetailsState[safeSubId] !== undefined) {
                    delete window.subjectDetailsState[safeSubId];
                }
            });
        }

        // Save to cloud, repopulate, and redraw
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        populateTrackDropdowns();
        if (typeof renderUI === 'function') renderUI();

        if (typeof AppState !== 'undefined' && AppState.currentFilter && (programsToCleanup.includes(AppState.currentFilter) || subjectsToCleanup.includes(AppState.currentFilter))) {
            AppState.currentFilter = 'All';
            if (typeof renderUI === 'function') renderUI();
        }

        renderTrackList();
        showToast(`Track "${track.name}" and all associated data deleted.`, "success");
    }

    // Attach to global window
    global.populateTrackDropdowns = populateTrackDropdowns;
    global.renderTrackList = renderTrackList;
    global.appendNewTrack = appendNewTrack;
    global.editTrackName = editTrackName;
    global.saveTrackEditModal = saveTrackEditModal;
    global.requestDeleteTrack = requestDeleteTrack;
    global.executeDeleteTrack = executeDeleteTrack;

    // CommonJS / module export compatibility
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            populateTrackDropdowns,
            renderTrackList,
            appendNewTrack,
            editTrackName,
            saveTrackEditModal,
            requestDeleteTrack,
            executeDeleteTrack
        };
    }

})(typeof window !== 'undefined' ? window : this);
