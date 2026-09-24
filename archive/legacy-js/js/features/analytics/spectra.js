/**
 * X-29 Feature Module: Spectra Analytics & Pacing System (spectra.js)
 * Master analytics engine orchestrating syllabus breakdown, habit radar matrix,
 * program completion trends, pacing trajectories, and page lifecycle.
 *
 * Responsibilities:
 * 1. Syllabus chapters filter dropdown (Global, Track, Program, Subject cascading).
 * 2. Spectra Circle Chart renderer with reactive legends.
 * 3. The 7 Officer Commitments Habit Radar (Commitment Matrix) with polar geometry SVG.
 * 4. Pacing trend charts orchestration (X Bar active goal & Global scope burn-up).
 * 5. Program & Action Trend line charts with dataset visibility toggles.
 * 6. Canonical AnalyticsPage lifecycle controller with Chart.js canvas collision safety.
 *
 * Strict Read-Only state consumer: Reads AppState, tracks, paceGoals, customActions, passedItems.
 */

(function (global) {
    'use strict';

    global.selectedSpectraFilters = global.selectedSpectraFilters || ['global'];
    global.spectraCommitmentActiveDate = global.spectraCommitmentActiveDate || new Date();
    global.trendTimeFilter = global.trendTimeFilter || 'ALL';

    function safeEscapeHtml(str) {
        if (global.Utils && typeof global.Utils.escapeHtml === 'function') {
            return global.Utils.escapeHtml(str);
        }
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function safeText(id, text) {
        if (typeof global.safeSetText === 'function') {
            global.safeSetText(id, text);
        } else if (typeof document !== 'undefined') {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        }
    }

    /* ==========================================================================
       1. Syllabus Chapters Analysis & Filter Dropdown Logic
       ========================================================================== */

    let _dropdownListenerAttached = false;

    function populateSpectraFilterDropdown() {
        if (typeof document === 'undefined') return;
        const menu = document.getElementById('spectra-filter-dropdown-menu');
        const btn = document.getElementById('spectra-filter-dropdown-btn');
        if (!menu || !btn) return;

        let html = '';

        // Global option
        const isGlobalChecked = global.selectedSpectraFilters.includes('global');
        html += `
            <label class="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 select-none shrink-0">
                <input type="checkbox" value="global" class="spectra-filter-checkbox rounded text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 h-3.5 w-3.5 transition-all" ${isGlobalChecked ? 'checked' : ''}>
                <span class="font-extrabold uppercase text-[10px] tracking-widest">🌍 Global View</span>
            </label>
            <div class="h-px bg-slate-100 dark:bg-slate-800/60 my-1.5 shrink-0"></div>
        `;

        // Tracks Group
        html += '<div class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1 shrink-0">Tracks</div>';
        const tracksRef = global.tracks || (typeof window !== 'undefined' ? window.tracks : []) || [];
        if (Array.isArray(tracksRef)) {
            tracksRef.forEach(track => {
                const value = `track:${track.id}`;
                const isChecked = global.selectedSpectraFilters.includes(value);
                html += `
                    <label class="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 select-none shrink-0">
                        <input type="checkbox" value="${value}" class="spectra-filter-checkbox rounded text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 h-3.5 w-3.5 transition-all" ${isChecked ? 'checked' : ''}>
                        <span class="font-bold uppercase text-[9px] tracking-wider">🏁 ${track.name || track.id.toUpperCase()}</span>
                    </label>
                `;
            });
        }

        // Programs Group
        html += '<div class="h-px bg-slate-100 dark:bg-slate-800/60 my-1 shrink-0"></div>';
        html += '<div class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1 shrink-0">Programs</div>';
        const getAllSubsFn = global.getAllSubjects || (typeof window !== 'undefined' ? window.getAllSubjects : null) || (() => []);
        const allSubjectsList = getAllSubsFn();
        const uniquePrograms = Array.from(new Set(allSubjectsList.map(s => s.program).filter(Boolean)));
        uniquePrograms.forEach(prog => {
            const value = `program:${prog}`;
            const isChecked = global.selectedSpectraFilters.includes(value);
            html += `
                <label class="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 select-none shrink-0">
                    <input type="checkbox" value="${value}" class="spectra-filter-checkbox rounded text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 h-3.5 w-3.5 transition-all" ${isChecked ? 'checked' : ''}>
                    <span class="font-bold uppercase text-[9px] tracking-wider">🎓 ${prog}</span>
                </label>
            `;
        });

        // Subjects Group (Program-wise sorted & grouped)
        html += '<div class="h-px bg-slate-100 dark:bg-slate-800/60 my-1 shrink-0"></div>';
        html += '<div class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1 shrink-0">Subjects</div>';

        const uniqueProgramsForSubjects = Array.from(new Set(allSubjectsList.map(s => s.program).filter(Boolean)));
        const seenSubjects = new Set();

        uniqueProgramsForSubjects.forEach(prog => {
            const progSubjects = allSubjectsList.filter(s => s.program === prog);
            let addedProgramHeader = false;
            progSubjects.forEach(sub => {
                if (!sub.subject || seenSubjects.has(sub.subject)) return;
                seenSubjects.add(sub.subject);

                if (!addedProgramHeader) {
                    addedProgramHeader = true;
                    html += `
                        <div class="text-[9px] font-extrabold text-indigo-500/80 dark:text-indigo-400/80 uppercase tracking-wider px-2 pt-2 pb-0.5 shrink-0 flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500/60 inline-block"></span>${prog}
                        </div>
                    `;
                }

                const value = `subject:${sub.subject}`;
                const isChecked = global.selectedSpectraFilters.includes(value);
                html += `
                    <label class="flex items-center gap-2.5 px-2 py-1.5 pl-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 select-none shrink-0">
                        <input type="checkbox" value="${value}" class="spectra-filter-checkbox rounded text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 h-3.5 w-3.5 transition-all" ${isChecked ? 'checked' : ''}>
                        <span class="font-bold uppercase text-[9px] tracking-wider">📚 ${sub.subject}</span>
                    </label>
                `;
            });
        });

        const unassignedSubjects = allSubjectsList.filter(s => !s.program || !uniqueProgramsForSubjects.includes(s.program));
        let addedOtherHeader = false;
        unassignedSubjects.forEach(sub => {
            if (!sub.subject || seenSubjects.has(sub.subject)) return;
            seenSubjects.add(sub.subject);

            if (!addedOtherHeader) {
                addedOtherHeader = true;
                html += `
                    <div class="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 pt-2 pb-0.5 shrink-0 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-400/60 inline-block"></span>Other Subjects
                    </div>
                `;
            }

            const value = `subject:${sub.subject}`;
            const isChecked = global.selectedSpectraFilters.includes(value);
            html += `
                <label class="flex items-center gap-2.5 px-2 py-1.5 pl-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 select-none shrink-0">
                    <input type="checkbox" value="${value}" class="spectra-filter-checkbox rounded text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 h-3.5 w-3.5 transition-all" ${isChecked ? 'checked' : ''}>
                    <span class="font-bold uppercase text-[9px] tracking-wider">📚 ${sub.subject}</span>
                </label>
            `;
        });

        menu.innerHTML = html;

        // Toggle dropdown visibility
        btn.onclick = function (e) {
            e.stopPropagation();
            const isHidden = menu.classList.contains('hidden');
            if (isHidden) {
                menu.classList.remove('hidden');
                const svg = btn.querySelector('svg');
                if (svg) svg.style.transform = 'rotate(180deg)';
            } else {
                menu.classList.add('hidden');
                const svg = btn.querySelector('svg');
                if (svg) svg.style.transform = '';
            }
        };

        // Attach click outside once to prevent listener accumulation
        if (!_dropdownListenerAttached && typeof document !== 'undefined') {
            _dropdownListenerAttached = true;
            document.addEventListener('click', function (e) {
                const currentMenu = document.getElementById('spectra-filter-dropdown-menu');
                const currentBtn = document.getElementById('spectra-filter-dropdown-btn');
                if (currentMenu && currentBtn && !currentMenu.contains(e.target) && !currentBtn.contains(e.target)) {
                    currentMenu.classList.add('hidden');
                    const svg = currentBtn.querySelector('svg');
                    if (svg) svg.style.transform = '';
                }
            });
        }

        // Checkbox change handlers
        const checkboxes = menu.querySelectorAll('.spectra-filter-checkbox');
        checkboxes.forEach(cb => {
            cb.onchange = function () {
                const val = cb.value;
                const isChecked = cb.checked;

                if (val === 'global') {
                    if (isChecked) {
                        checkboxes.forEach(other => { if (other !== cb) other.checked = false; });
                    } else {
                        cb.checked = true;
                    }
                } else {
                    if (isChecked) {
                        const globalCb = menu.querySelector('input[value="global"]');
                        if (globalCb) globalCb.checked = false;
                    }

                    const syllabusStructureRef = global.syllabusStructure || (typeof window !== 'undefined' ? window.syllabusStructure : {}) || {};

                    // Cascade Down:
                    if (val.startsWith('track:')) {
                        const trackId = val.replace('track:', '');
                        const trackSubjects = syllabusStructureRef[trackId] || [];
                        const trackSubjectNames = trackSubjects.map(s => s.subject);
                        const trackPrograms = Array.from(new Set(trackSubjects.map(s => s.program).filter(Boolean)));

                        checkboxes.forEach(other => {
                            const otherVal = other.value;
                            if (otherVal.startsWith('subject:')) {
                                const subName = otherVal.replace('subject:', '');
                                if (trackSubjectNames.includes(subName)) {
                                    other.checked = isChecked;
                                }
                            } else if (otherVal.startsWith('program:')) {
                                const progName = otherVal.replace('program:', '');
                                if (trackPrograms.includes(progName)) {
                                    other.checked = isChecked;
                                }
                            }
                        });
                    } else if (val.startsWith('program:')) {
                        const progName = val.replace('program:', '');
                        checkboxes.forEach(other => {
                            const otherVal = other.value;
                            if (otherVal.startsWith('subject:')) {
                                const subName = otherVal.replace('subject:', '');
                                const sObj = allSubjectsList.find(s => s.subject === subName);
                                if (sObj && sObj.program === progName) {
                                    other.checked = isChecked;
                                }
                            }
                        });
                    }

                    // Cascade Up / Uncheck Parent:
                    if (!isChecked) {
                        if (val.startsWith('subject:')) {
                            const subName = val.replace('subject:', '');
                            const sObj = allSubjectsList.find(s => s.subject === subName);
                            if (sObj) {
                                let trackId = null;
                                for (const tid in syllabusStructureRef) {
                                    if (Array.isArray(syllabusStructureRef[tid]) && syllabusStructureRef[tid].some(s => s.subject === subName)) {
                                        trackId = tid;
                                        break;
                                    }
                                }
                                checkboxes.forEach(other => {
                                    if (other.value === `program:${sObj.program}` || other.value === `track:${trackId}`) {
                                        other.checked = false;
                                    }
                                });
                            }
                        } else if (val.startsWith('program:')) {
                            const progName = val.replace('program:', '');
                            const tracksWithProg = [];
                            for (const tid in syllabusStructureRef) {
                                if (Array.isArray(syllabusStructureRef[tid]) && syllabusStructureRef[tid].some(s => s.program === progName)) {
                                    tracksWithProg.push(tid);
                                }
                            }
                            checkboxes.forEach(other => {
                                if (other.value.startsWith('track:') && tracksWithProg.includes(other.value.replace('track:', ''))) {
                                    other.checked = false;
                                }
                            });
                        }
                    } else {
                        // Check if parent should be auto-checked:
                        const uniqueProgs = Array.from(new Set(allSubjectsList.map(s => s.program).filter(Boolean)));
                        uniqueProgs.forEach(prog => {
                            const progSubjects = allSubjectsList.filter(s => s.program === prog).map(s => s.subject);
                            const allChecked = progSubjects.every(subName => {
                                const subCb = menu.querySelector(`input[value="subject:${subName}"]`);
                                return subCb ? subCb.checked : true;
                            });
                            const progCb = menu.querySelector(`input[value="program:${prog}"]`);
                            if (progCb) progCb.checked = allChecked;
                        });

                        if (Array.isArray(tracksRef)) {
                            tracksRef.forEach(track => {
                                const trackSubjects = (syllabusStructureRef[track.id] || []).map(s => s.subject);
                                const allChecked = trackSubjects.every(subName => {
                                    const subCb = menu.querySelector(`input[value="subject:${subName}"]`);
                                    return subCb ? subCb.checked : true;
                                });
                                const trackCb = menu.querySelector(`input[value="track:${track.id}"]`);
                                if (trackCb) trackCb.checked = allChecked;
                            });
                        }
                    }

                    // Fallback to global
                    const anyChecked = Array.from(checkboxes).some(other => other.value !== 'global' && other.checked);
                    if (!anyChecked) {
                        const globalCb = menu.querySelector('input[value="global"]');
                        if (globalCb) globalCb.checked = true;
                    }
                }

                // Re-calculate global.selectedSpectraFilters
                global.selectedSpectraFilters = Array.from(checkboxes)
                    .filter(c => c.checked)
                    .map(c => c.value);

                updateSpectraFilterDropdownLabel();
                renderSpectraCircleChart();
            };
        });

        updateSpectraFilterDropdownLabel();
    }

    function updateSpectraFilterDropdownLabel() {
        if (typeof document === 'undefined') return;
        const labelEl = document.getElementById('spectra-filter-dropdown-label');
        if (!labelEl) return;

        if (global.selectedSpectraFilters.includes('global')) {
            labelEl.textContent = '🌍 Global View';
            return;
        }

        const tracksRef = global.tracks || (typeof window !== 'undefined' ? window.tracks : []) || [];
        const selectedLabels = global.selectedSpectraFilters.map(f => {
            const parts = f.split(':');
            const type = parts[0];
            const target = parts.slice(1).join(':');
            if (type === 'track') {
                const trackObj = (Array.isArray(tracksRef)) ? tracksRef.find(t => t.id === target) : null;
                return '🏁 ' + (trackObj ? trackObj.name : target.toUpperCase());
            } else if (type === 'program') {
                return '🎓 ' + target;
            } else if (type === 'subject') {
                return '📚 ' + target;
            }
            return target;
        });

        const combinedText = selectedLabels.join(', ');
        if (combinedText.length > 28) {
            labelEl.textContent = `${global.selectedSpectraFilters.length} Items Selected`;
        } else {
            labelEl.textContent = combinedText;
        }
    }

    function onSpectraFilterChange(val) {
        renderSpectraCircleChart();
    }

    /**
     * Renders the Spectra Circle Chart inside #spectra-circle-chart-wrapper.
     */
    function renderSpectraCircleChart() {
        if (typeof document === 'undefined') return;

        const dropdownMenu = document.getElementById('spectra-filter-dropdown-menu');
        if (dropdownMenu) {
            const hasTrackOrSubjectElements = dropdownMenu.querySelector('input[value^="track:"], input[value^="subject:"]');
            const tracksRef = global.tracks || (typeof window !== 'undefined' ? window.tracks : []);
            const getAllSubsFn = global.getAllSubjects || (typeof window !== 'undefined' ? window.getAllSubjects : null) || (() => []);
            const hasDataToPopulate = (tracksRef && tracksRef.length > 0) || (getAllSubsFn().length > 0);
            if (dropdownMenu.children.length === 0 || (hasDataToPopulate && !hasTrackOrSubjectElements)) {
                populateSpectraFilterDropdown();
            }
        }

        const wrapper = document.getElementById('spectra-circle-chart-wrapper');
        if (!wrapper) return;

        const filters = global.selectedSpectraFilters || ['global'];
        const genSvgFn = global.generateGlobalChaptersSVG || (typeof window !== 'undefined' ? window.generateGlobalChaptersSVG : null);
        if (typeof genSvgFn !== 'function') return;

        const data = genSvgFn(true, filters);
        wrapper.innerHTML = data.html;

        // Dynamic text detail updates
        let title = 'Syllabus Chapters Analysis';
        let desc = 'A visual distribution of all chapters in your study goals. Hover over segments to view subject names, chapter index, and completion statuses.';

        if (filters.length > 0 && !filters.includes('global')) {
            const tracksRef = global.tracks || (typeof window !== 'undefined' ? window.tracks : []);
            const labels = filters.map(f => {
                const parts = f.split(':');
                const type = parts[0];
                const target = parts.slice(1).join(':');
                if (type === 'track') {
                    const trackObj = (Array.isArray(tracksRef)) ? tracksRef.find(t => t.id === target) : null;
                    return trackObj ? trackObj.name : target.toUpperCase();
                }
                return target;
            });
            title = `Selected Chapters Analysis`;
            desc = `A visual distribution of all chapters matching the selected filters: ${labels.join(', ')}. Hover over segments to view details.`;
        }

        safeText('spectra-analysis-title', title);
        safeText('spectra-analysis-desc', desc);

        const legendComplete = document.getElementById('spectra-legend-complete');
        const legendIncomplete = document.getElementById('spectra-legend-incomplete');
        const legendSkipped = document.getElementById('spectra-legend-skipped');

        if (legendComplete) legendComplete.textContent = data.completedCount;
        if (legendIncomplete) legendIncomplete.textContent = data.incompleteCount;
        if (legendSkipped) legendSkipped.textContent = data.skippedCount;
    }


    /* ==========================================================================
       2. The 7 Officer Commitments Habit Radar Logic (Commitment Matrix)
       ========================================================================== */

    function getCommitmentLabels() {
        const customActionsRef = global.customActions || (typeof window !== 'undefined' ? window.customActions : []) || [];
        if (Array.isArray(customActionsRef) && customActionsRef.length > 0) {
            const sorted = [...customActionsRef].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999));
            return sorted.map(a => (a.title || a.name || '').toUpperCase());
        }
        return [];
    }

    function saveCommitmentLabelsData(labels) {
        // Memory-only mode
    }

    function getCommitmentStorageKey(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        return `spectra_commitments_${y}-${m}`;
    }

    function getCommitmentMonthData(dateObj) {
        const dObj = (dateObj instanceof Date) ? dateObj : (dateObj ? new Date(dateObj) : new Date());
        const y = dObj.getFullYear();
        const m = dObj.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const result = {};

        const customActionsRef = global.customActions || (typeof window !== 'undefined' ? window.customActions : []) || [];
        let sortedActions = Array.isArray(customActionsRef) && customActionsRef.length > 0
            ? [...customActionsRef].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999))
            : [];

        const getTaskFn = global.getTaskForDate || (typeof window !== 'undefined' ? window.getTaskForDate : null);

        for (let d = 1; d <= daysInMonth; d++) {
            const dayKey = String(d);
            const cellDate = new Date(y, m, d);
            const task = getTaskFn ? getTaskFn(cellDate) : null;

            if (task) {
                if (!result[dayKey]) result[dayKey] = {};
                sortedActions.forEach((act, hIdx) => {
                    if (task[act.id] !== undefined) {
                        result[dayKey][hIdx] = !!task[act.id];
                    }
                });
            }
        }

        return result;
    }

    function saveCommitmentMonthData(dateObj, data) {
        // Memory-only mode
    }

    function toggleCommitmentCell(dayNum, habitIndex) {
        const activeDate = global.spectraCommitmentActiveDate || new Date();
        const y = activeDate.getFullYear();
        const m = activeDate.getMonth();
        let actualDay = 1;
        if (typeof dayNum === 'string' && dayNum.includes('-')) {
            const parts = dayNum.split('-');
            actualDay = parseInt(parts[2] || parts[parts.length - 1], 10);
        } else {
            actualDay = parseInt(dayNum, 10);
        }
        if (isNaN(actualDay) || actualDay < 1) actualDay = 1;
        const cellDate = new Date(y, m, actualDay);

        const customActionsRef = global.customActions || (typeof window !== 'undefined' ? window.customActions : []) || [];
        let sortedActions = [...customActionsRef].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999));

        if (!sortedActions[habitIndex]) return;

        const targetAction = sortedActions[habitIndex];
        const today = new Date();
        const isToday = (today.getFullYear() === y && today.getMonth() === m && today.getDate() === actualDay);

        if (isToday) {
            const setDailyStateFn = global.setDailyState || (typeof window !== 'undefined' ? window.setDailyState : null);
            if (typeof setDailyStateFn === 'function') {
                setDailyStateFn(targetAction.id);
            }
            return;
        }

        const getTaskFn = global.getTaskForDate || (typeof window !== 'undefined' ? window.getTaskForDate : null);
        let task = getTaskFn ? getTaskFn(cellDate) : null;

        const UtilsRef = global.Utils || (typeof window !== 'undefined' ? window.Utils : null);
        const dFormatted = (UtilsRef && typeof UtilsRef.formatDate === 'function') ? UtilsRef.formatDate(cellDate) : null;
        const dISO = `${y}-${String(m + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;

        const AppStateRef = global.AppState || (typeof window !== 'undefined' ? window.AppState : null);

        if (!task) {
            task = {
                id: 'task_' + dISO + '_' + Date.now().toString(36),
                date: dFormatted || dISO,
                note: '',
                updatedAt: Date.now() + (global.serverTimeOffset || 0)
            };
            customActionsRef.forEach(a => { task[a.id] = false; });
            if (AppStateRef && Array.isArray(AppStateRef.tasks)) {
                AppStateRef.tasks.push(task);
            }
        }

        const newState = !Boolean(task[targetAction.id]);
        task[targetAction.id] = newState;
        task.updatedAt = Date.now() + (global.serverTimeOffset || 0);

        if (AppStateRef) {
            AppStateRef.isLocalDirty = true;
            if (AppStateRef._tasksDateMap) {
                if (task.date) AppStateRef._tasksDateMap.set(task.date, task);
                AppStateRef._tasksDateMap.set(dISO, task);
                if (dFormatted) AppStateRef._tasksDateMap.set(dFormatted, task);
                if (task.id) AppStateRef._tasksDateMap.set(String(task.id), task);
            }
        }

        renderSpectraCommitmentsChart();

        const renderDailyLogsFn = global.renderDailyLogs || (typeof window !== 'undefined' ? window.renderDailyLogs : null);
        if (typeof renderDailyLogsFn === 'function') renderDailyLogsFn();

        // Broadcast to other open browser tabs
        if (global.X29SyncChannel) {
            try {
                global.X29SyncChannel.postMessage({
                    type: 'DAILY_ACTION_UPDATE',
                    actionId: targetAction.id,
                    dateStr: dFormatted || dISO,
                    newState: newState,
                    timestamp: Date.now()
                });
            } catch (e) {}
        }

        const FirebaseRef = global.FirebaseService || (typeof window !== 'undefined' ? window.FirebaseService : null);
        if (FirebaseRef && typeof FirebaseRef.saveToCloud === 'function') {
            FirebaseRef.saveToCloud(false);
        }

        if (global.commitmentClickDebounce) clearTimeout(global.commitmentClickDebounce);
        global.commitmentClickDebounce = setTimeout(() => {
            if (typeof global.renderTrendCharts === 'function') {
                if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(global.renderTrendCharts);
                else global.renderTrendCharts();
            }
            if (typeof global.updateMetrics === 'function') global.updateMetrics();
        }, 200);
    }

    function prevCommitmentMonth() {
        if (!global.spectraCommitmentActiveDate) global.spectraCommitmentActiveDate = new Date();
        global.spectraCommitmentActiveDate.setMonth(global.spectraCommitmentActiveDate.getMonth() - 1);
        renderSpectraCommitmentsChart();
    }

    function nextCommitmentMonth() {
        if (!global.spectraCommitmentActiveDate) global.spectraCommitmentActiveDate = new Date();
        global.spectraCommitmentActiveDate.setMonth(global.spectraCommitmentActiveDate.getMonth() + 1);
        renderSpectraCommitmentsChart();
    }

    function resetCommitmentMonth() {
        global.spectraCommitmentActiveDate = new Date();
        renderSpectraCommitmentsChart();
    }

    function openCommitmentsModal() {
        if (typeof document === 'undefined') return;
        const modal = document.getElementById('spectra-commitments-modal');
        const container = document.getElementById('spectra-commitments-inputs-container');
        if (!modal || !container) return;
        const labels = getCommitmentLabels();
        container.innerHTML = labels.map((label, idx) => `
            <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">${idx + 1}</span>
                <input type="text" id="spectra-commitment-input-${idx}" value="${safeEscapeHtml(label)}" class="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all shadow-inner" placeholder="Commitment ${idx + 1}" />
            </div>
        `).join('');
        modal.classList.remove('hidden');
    }

    function closeCommitmentsModal() {
        if (typeof document === 'undefined') return;
        const modal = document.getElementById('spectra-commitments-modal');
        if (modal) modal.classList.add('hidden');
    }

    function resetCommitmentLabelsDefault() {
        if (typeof document === 'undefined') return;
        const defaultLabels = global.DEFAULT_COMMITMENT_LABELS || ['Action 1', 'Action 2', 'Action 3', 'Action 4', 'Action 5', 'Action 6', 'Action 7'];
        defaultLabels.forEach((label, idx) => {
            const inp = document.getElementById(`spectra-commitment-input-${idx}`);
            if (inp) inp.value = label;
        });
    }

    function saveCommitmentLabels() {
        if (typeof document === 'undefined') return;
        const customActionsRef = global.customActions || (typeof window !== 'undefined' ? window.customActions : []) || [];
        const sorted = [...customActionsRef].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999));
        const numActions = sorted.length;
        const newLabels = [];

        for (let i = 0; i < numActions; i++) {
            const inp = document.getElementById(`spectra-commitment-input-${i}`);
            const val = inp ? inp.value.trim() : '';
            if (val) {
                sorted[i].title = val;
                newLabels.push(val);
            } else {
                newLabels.push(sorted[i].title || '');
            }
        }

        saveCommitmentLabelsData(newLabels);
        closeCommitmentsModal();

        const FirebaseRef = global.FirebaseService || (typeof window !== 'undefined' ? window.FirebaseService : null);
        if (FirebaseRef && typeof FirebaseRef.saveToCloud === 'function') {
            FirebaseRef.saveToCloud();
        }

        if (typeof global.renderUI === 'function') {
            global.renderUI();
        } else {
            renderSpectraCommitmentsChart();
        }
    }

    function renderSpectraCommitmentsChart() {
        if (typeof document === 'undefined') return;
        const wrapper = document.getElementById('spectra-commitments-chart-wrapper');
        if (!wrapper) return;

        const activeDate = global.spectraCommitmentActiveDate || new Date();
        const year = activeDate.getFullYear();
        const month = activeDate.getMonth();
        const monthName = activeDate.toLocaleString('default', { month: 'long' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthLabel = document.getElementById('spectra-commitments-month-label');
        if (monthLabel) monthLabel.textContent = `${monthName} ${year}`;

        const labels = getCommitmentLabels();
        const numHabits = labels.length;

        if (numHabits === 0) {
            safeText('spectra-commitments-pct', `0%`);
            safeText('spectra-commitments-count', `0 / 0`);
            safeText('spectra-commitments-streak', `0 Days 🔥`);
            safeText('spectra-commitments-days-logged', `0 Days`);

            wrapper.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-center my-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div class="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl mb-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h4 class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">No Daily Actions Configured</h4>
                    <p class="text-xs text-slate-400 max-w-xs mb-1">Create your Daily Action Trackers on the Daily Actions page to populate your radar commitments chart.</p>
                </div>
            `;
            return;
        }

        const monthData = getCommitmentMonthData(activeDate);

        let totalCells = daysInMonth * numHabits;
        let fulfilledCount = 0;
        let daysLoggedSet = new Set();

        for (let d = 1; d <= daysInMonth; d++) {
            const dayKey = String(d);
            if (monthData[dayKey]) {
                let dayHasFulfilled = false;
                for (let h = 0; h < numHabits; h++) {
                    if (monthData[dayKey][h]) {
                        fulfilledCount++;
                        dayHasFulfilled = true;
                    }
                }
                if (dayHasFulfilled) daysLoggedSet.add(d);
            }
        }

        const pct = Math.round((fulfilledCount / totalCells) * 100);
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        let currentStreak = 0;
        const checkStartDay = isCurrentMonth ? today.getDate() : daysInMonth;

        for (let d = checkStartDay; d >= 1; d--) {
            const dayKey = String(d);
            let count = 0;
            if (monthData[dayKey]) {
                for (let h = 0; h < numHabits; h++) {
                    if (monthData[dayKey][h]) count++;
                }
            }
            if (count > 0) {
                currentStreak++;
            } else if (d < checkStartDay) {
                break;
            }
        }

        safeText('spectra-commitments-pct', `${pct}%`);
        safeText('spectra-commitments-count', `${fulfilledCount} / ${totalCells}`);
        safeText('spectra-commitments-streak', `${currentStreak} Days 🔥`);
        safeText('spectra-commitments-days-logged', `${daysLoggedSet.size} Days`);

        // SVG Geometry Parameters
        const width = 580;
        const height = 450;
        const cx = 350;
        const cy = 225;

        const rOuter = 195;
        const rInner = 68;
        const ringStep = (rOuter - rInner) / numHabits;

        const startAngleDeg = -90;
        const totalAngleDeg = 270;
        const angleStepDeg = totalAngleDeg / daysInMonth;

        let svgPaths = '';

        const isDarkMode = (typeof document !== 'undefined') && (
            (document.documentElement && document.documentElement.classList && document.documentElement.classList.contains('dark')) ||
            (document.body && document.body.classList && document.body.classList.contains('dark')) ||
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        );

        const gridStroke = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1';
        const textFill = isDarkMode ? '#e2e8f0' : '#1e293b';
        const lineStroke = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#64748b';
        const cellFillActive = isDarkMode ? '#10b981' : '#059669';
        const cellFillInactive = 'rgb(190, 18, 60)';
        const cellStrokeUpcoming = isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(100, 116, 139, 0.35)';
        const digit7Fill = isDarkMode ? '#818cf8' : '#4f46e5';

        function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
            const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
            return {
                x: centerX + radius * Math.cos(angleInRadians),
                y: centerY + radius * Math.sin(angleInRadians)
            };
        }

        const radialGap = 2.2;
        const angularGapPx = 2.2;

        for (let h = 0; h < numHabits; h++) {
            const baseOuterR = rOuter - h * ringStep;
            const baseInnerR = rOuter - (h + 1) * ringStep;

            const cellOuterR = baseOuterR - (radialGap / 2);
            const cellInnerR = baseInnerR + (radialGap / 2);

            for (let d = 0; d < daysInMonth; d++) {
                const dayNum = d + 1;
                const a1Base = startAngleDeg + d * angleStepDeg;
                const a2Base = startAngleDeg + (d + 1) * angleStepDeg;

                const angleInsetOuter = ((angularGapPx / 2) / cellOuterR) * (180 / Math.PI);
                const angleInsetInner = ((angularGapPx / 2) / cellInnerR) * (180 / Math.PI);

                const aOuter1 = a1Base + angleInsetOuter;
                const aOuter2 = a2Base - angleInsetOuter;
                const aInner1 = a1Base + angleInsetInner;
                const aInner2 = a2Base - angleInsetInner;

                const p1 = polarToCartesian(cx, cy, cellInnerR, aInner1);
                const p2 = polarToCartesian(cx, cy, cellOuterR, aOuter1);
                const p3 = polarToCartesian(cx, cy, cellOuterR, aOuter2);
                const p4 = polarToCartesian(cx, cy, cellInnerR, aInner2);

                const largeArcFlag = (aOuter2 - aOuter1) <= 180 ? '0' : '1';

                const pathData = [
                    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
                    `L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
                    `A ${cellOuterR.toFixed(2)} ${cellOuterR.toFixed(2)} 0 ${largeArcFlag} 1 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
                    `L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
                    `A ${cellInnerR.toFixed(2)} ${cellInnerR.toFixed(2)} 0 ${largeArcFlag} 0 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
                    'Z'
                ].join(' ');

                const dayKey = String(dayNum);
                const isCompleted = !!(monthData[dayKey] && monthData[dayKey][h]);

                const isPastDay = (year < today.getFullYear()) ||
                    (year === today.getFullYear() && month < today.getMonth()) ||
                    (isCurrentMonth && dayNum < today.getDate());

                let fillColor = 'none';
                let strokeAttr = 'stroke="none"';
                let cellClass = 'commitment-cell';

                if (isCompleted) {
                    fillColor = cellFillActive;
                    strokeAttr = 'stroke="none"';
                    cellClass += ' commitment-cell-active';
                } else if (isPastDay) {
                    fillColor = cellFillInactive;
                    strokeAttr = 'stroke="none"';
                    cellClass += ' commitment-cell-inactive';
                } else {
                    fillColor = 'none';
                    strokeAttr = `stroke="${cellStrokeUpcoming}" stroke-width="1.1"`;
                    cellClass += ' commitment-cell-upcoming';
                }

                const labelText = labels[h];

                svgPaths += `
                    <path d="${pathData}"
                        fill="${fillColor}"
                        ${strokeAttr}
                        class="${cellClass} cursor-pointer"
                        data-day="${dayNum}"
                        data-habit="${h}"
                        onclick="window.toggleCommitmentCell(${dayNum}, ${h})"
                        onmouseenter="window.showCommitmentTooltip(event, '${safeEscapeHtml(labelText)}', ${dayNum}, '${monthName} ${dayNum}, ${year}', ${isCompleted})"
                        onmouseleave="window.hideCommitmentTooltip()"
                    />
                `;
            }
        }

        // Leader Lines
        let leaderLinesSvg = '';
        const lineXStart = 15;
        const lineXEnd = cx;

        for (let i = 0; i <= numHabits; i++) {
            const lineY = cy - (rOuter - i * ringStep);
            leaderLinesSvg += `
                <line x1="${lineXStart}" y1="${lineY.toFixed(2)}" x2="${lineXEnd}" y2="${lineY.toFixed(2)}"
                    stroke="${lineStroke}" stroke-width="1.2" class="commitment-leader-line" />
            `;
        }

        const cbSize = Math.max(8, Math.min(14, ringStep * 0.75));
        const fontSize = Math.max(7, Math.min(11, ringStep * 0.6));

        for (let h = 0; h < numHabits; h++) {
            const midY = cy - rOuter + (h + 0.5) * ringStep;
            const habitLabel = labels[h];

            if (isCurrentMonth) {
                const targetDay = today.getDate();
                const dayKey = String(targetDay);
                const isTodayDone = !!(monthData[dayKey] && monthData[dayKey][h]);

                const cbX = lineXStart;
                const cbY = midY - (cbSize / 2);
                const textX = lineXStart + cbSize + 8;

                const cbFill = isTodayDone ? '#10b981' : (isDarkMode ? 'rgba(15, 23, 42, 0.8)' : '#ffffff');
                const cbStroke = isTodayDone ? '#10b981' : (isDarkMode ? '#475569' : '#94a3b8');

                leaderLinesSvg += `
                    <g class="commitment-checkbox-group cursor-pointer select-none" onclick="window.toggleCommitmentCell(${targetDay}, ${h})">
                        <rect x="${cbX}" y="${cbY.toFixed(2)}" width="${cbSize.toFixed(2)}" height="${cbSize.toFixed(2)}" rx="3"
                            fill="${cbFill}" stroke="${cbStroke}" stroke-width="1.4" />
                        ${isTodayDone ? `
                            <path d="M ${(cbX + cbSize * 0.25).toFixed(2)} ${(cbY + cbSize * 0.5).toFixed(2)} L ${(cbX + cbSize * 0.42).toFixed(2)} ${(cbY + cbSize * 0.68).toFixed(2)} L ${(cbX + cbSize * 0.75).toFixed(2)} ${(cbY + cbSize * 0.32).toFixed(2)}"
                                stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                        ` : ''}
                        <text x="${textX.toFixed(2)}" y="${midY.toFixed(2)}"
                            fill="${textFill}" class="commitment-label-text hover:opacity-80 transition-opacity" font-size="${fontSize.toFixed(1)}" font-weight="800"
                            letter-spacing="0.02em" dominant-baseline="central">
                            ${safeEscapeHtml(habitLabel)}
                        </text>
                    </g>
                `;
            } else {
                const textX = lineXStart;
                leaderLinesSvg += `
                    <g class="commitment-checkbox-group select-none">
                        <text x="${textX}" y="${midY.toFixed(2)}"
                            fill="${textFill}" class="commitment-label-text" font-size="${fontSize.toFixed(1)}" font-weight="800"
                            letter-spacing="0.02em" dominant-baseline="central">
                            ${safeEscapeHtml(habitLabel)}
                        </text>
                    </g>
                `;
            }
        }

        // Outer Edge Day Numbers & Radial Tick Marks
        let edgeDaysSvg = '';
        const rDayText = rOuter + 14;

        for (let d = 0; d < daysInMonth; d++) {
            const dayNum = d + 1;
            const aMid = startAngleDeg + (d + 0.5) * angleStepDeg;
            const posText = polarToCartesian(cx, cy, rDayText, aMid);
            const isToday = isCurrentMonth && dayNum === today.getDate();

            const aStart = startAngleDeg + d * angleStepDeg;
            const tickP1 = polarToCartesian(cx, cy, rOuter, aStart);
            const tickP2 = polarToCartesian(cx, cy, rOuter + 4, aStart);

            edgeDaysSvg += `
                <line x1="${tickP1.x.toFixed(2)}" y1="${tickP1.y.toFixed(2)}" x2="${tickP2.x.toFixed(2)}" y2="${tickP2.y.toFixed(2)}"
                    stroke="${gridStroke}" stroke-width="1.1" />
                <text x="${posText.x.toFixed(2)}" y="${posText.y.toFixed(2)}"
                    text-anchor="middle" dominant-baseline="central"
                    fill="${isToday ? '#10b981' : (isDarkMode ? '#94a3b8' : '#64748b')}"
                    font-size="${isToday ? '9.5' : '8'}"
                    font-weight="${isToday ? '900' : '700'}"
                    class="commitment-edge-day ${isToday ? 'commitment-today-text' : ''}">
                    ${dayNum}
                </text>
            `;
        }

        const tickEnd1 = polarToCartesian(cx, cy, rOuter, startAngleDeg + totalAngleDeg);
        const tickEnd2 = polarToCartesian(cx, cy, rOuter + 4, startAngleDeg + totalAngleDeg);
        edgeDaysSvg += `
            <line x1="${tickEnd1.x.toFixed(2)}" y1="${tickEnd1.y.toFixed(2)}" x2="${tickEnd2.x.toFixed(2)}" y2="${tickEnd2.y.toFixed(2)}"
                stroke="${gridStroke}" stroke-width="1.1" />
        `;

        // Center Hub
        const centerHubSvg = `
            <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="${isDarkMode ? '#0f172a' : '#ffffff'}" stroke="${gridStroke}" stroke-width="1.6" class="commitment-hub-circle" />
            <text x="${cx}" y="${cy - 27}" text-anchor="middle" fill="${isDarkMode ? '#94a3b8' : '#64748b'}" font-size="9.5" font-weight="900" letter-spacing="3px" class="commitment-hub-text-sub">THE</text>
            <text x="${cx}" y="${cy - 1}" text-anchor="middle" dominant-baseline="central" fill="${digit7Fill}" font-size="38" font-weight="900" class="commitment-hub-digit">X</text>
            <text x="${cx}" y="${cy + 27}" text-anchor="middle" fill="${isDarkMode ? '#e2e8f0' : '#1e293b'}" font-size="8.5" font-weight="900" letter-spacing="2px" class="commitment-hub-text-main">COMMITMENTS</text>
        `;

        wrapper.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" style="width: 100%; max-width: 720px; height: auto;" class="mx-auto overflow-visible select-none">
                <g id="commitment-grid-cells">${svgPaths}</g>
                <g id="commitment-leader-lines">${leaderLinesSvg}</g>
                <g id="commitment-edge-days">${edgeDaysSvg}</g>
                <g id="commitment-center-hub">${centerHubSvg}</g>
            </svg>
        `;
    }

    function showCommitmentTooltip(event, habitName, dayNum, formattedDate, isCompleted) {
        if (typeof document === 'undefined') return;
        let tooltip = document.getElementById('spectra-commitments-tooltip');
        if (!tooltip) return;

        if (tooltip.parentElement !== document.body) {
            document.body.appendChild(tooltip);
        }

        const statusBadge = isCompleted
            ? `<span class="text-emerald-400 font-extrabold flex items-center gap-1">✓ Completed</span>`
            : `<span class="text-slate-400 font-bold">Not Logged</span>`;

        tooltip.innerHTML = `
            <div class="font-black text-white text-[12px] uppercase tracking-wide">${habitName}</div>
            <div class="text-[10px] text-slate-300 font-bold mt-0.5">Day ${dayNum} &bull; ${formattedDate}</div>
            <div class="text-[10px] mt-1 pt-1 border-t border-white/10 flex items-center justify-between gap-3">
                <span>Status:</span>
                ${statusBadge}
            </div>
            <div class="text-[8.5px] text-slate-400 font-bold mt-1 pt-1 border-t border-white/10">Click to toggle check-in</div>
        `;

        tooltip.classList.remove('hidden');

        const padding = 12;
        const tooltipWidth = tooltip.offsetWidth || 180;
        const tooltipHeight = tooltip.offsetHeight || 80;

        let left = event.clientX + 16;
        let top = event.clientY - Math.round(tooltipHeight / 2);

        if (left + tooltipWidth > window.innerWidth - padding) {
            left = event.clientX - tooltipWidth - 16;
        }

        if (top < padding) {
            top = padding;
        } else if (top + tooltipHeight > window.innerHeight - padding) {
            top = window.innerHeight - tooltipHeight - padding;
        }

        tooltip.style.position = 'fixed';
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.zIndex = '99999';
    }

    function hideCommitmentTooltip() {
        if (typeof document === 'undefined') return;
        const tooltip = document.getElementById('spectra-commitments-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    }


    /* ==========================================================================
       3. Pacing & Trend Charts Orchestration
       ========================================================================== */

    /**
     * Renders pacing trend charts (X Bar and Global Scope burn-up).
     */
    function renderPaceCharts() {
        let activeGoalId = null;
        const dashboardConfigRef = global.dashboardConfig || (typeof window !== 'undefined' ? window.dashboardConfig : {});
        const paceGoalsRef = global.paceGoals || (typeof window !== 'undefined' ? window.paceGoals : []);

        if (dashboardConfigRef && dashboardConfigRef.activePaceGoalId) {
            activeGoalId = dashboardConfigRef.activePaceGoalId;
        } else if (paceGoalsRef && paceGoalsRef.length > 0) {
            activeGoalId = paceGoalsRef[0].id;
        }

        const renderSpectraPaceFn = (global.PaceManager && global.PaceManager.renderSpectraPaceTrendChart) ||
            global.renderSpectraPaceTrendChart ||
            (typeof window !== 'undefined' && window.renderSpectraPaceTrendChart);

        const renderGlobalPaceFn = (global.PaceManager && global.PaceManager.renderGlobalPaceTrendChart) ||
            global.renderGlobalPaceTrendChart ||
            (typeof window !== 'undefined' && window.renderGlobalPaceTrendChart);

        if (typeof renderSpectraPaceFn === 'function') {
            renderSpectraPaceFn(activeGoalId);
        }

        if (typeof renderGlobalPaceFn === 'function') {
            renderGlobalPaceFn();
        }
    }

    /**
     * Renders program completion and daily actions trend charts and stat summary cards.
     */
    function renderTrendCharts() {
        if (typeof document === 'undefined') return;

        const AppStateRef = global.AppState || (typeof window !== 'undefined' ? window.AppState : {}) || {};
        const UtilsRef = global.Utils || (typeof window !== 'undefined' ? window.Utils : {}) || {};
        const tracksRef = global.tracks || (typeof window !== 'undefined' ? window.tracks : []) || [];
        const customActionsRef = global.customActions || (typeof window !== 'undefined' ? window.customActions : []) || [];
        const customProgramsRef = global.customPrograms || (typeof window !== 'undefined' ? window.customPrograms : {}) || {};
        const syllabusStructureRef = global.syllabusStructure || (typeof window !== 'undefined' ? window.syllabusStructure : {}) || {};
        const paceGoalsRef = global.paceGoals || (typeof window !== 'undefined' ? window.paceGoals : []) || [];
        const dashboardConfigRef = global.dashboardConfig || (typeof window !== 'undefined' ? window.dashboardConfig : {}) || {};
        const passedItemsRef = global.passedItems || (typeof window !== 'undefined' ? window.passedItems : { subjects: [], programs: [] }) || { subjects: [], programs: [] };

        if (!global.latestChartStats) global.latestChartStats = { prog: {}, subjects: {}, revSubjects: {}, monthly: {}, yearly: {} };
        if (!global.chartVisibility) global.chartVisibility = { prog: {}, subjects: {}, revSubjects: {}, monthly: {}, yearly: {} };

        // CLEANUP ORPHANED DATA
        const getAllProgsFn = global.getAllPrograms || (typeof window !== 'undefined' ? window.getAllPrograms : null) || (() => []);
        const getAllSubsFn = global.getAllSubjects || (typeof window !== 'undefined' ? window.getAllSubjects : null) || (() => []);

        let validProgs = getAllProgsFn().map(p => p.name || p);
        Object.keys(global.latestChartStats.prog).forEach(k => { if (!validProgs.includes(k)) delete global.latestChartStats.prog[k]; });
        Object.keys(global.chartVisibility.prog).forEach(k => { if (!validProgs.includes(k)) delete global.chartVisibility.prog[k]; });

        let validSubs = getAllSubsFn().map(s => s.subject);
        Object.keys(global.latestChartStats.subjects).forEach(k => { if (!validSubs.includes(k)) delete global.latestChartStats.subjects[k]; });
        Object.keys(global.chartVisibility.subjects).forEach(k => { if (!validSubs.includes(k)) delete global.chartVisibility.subjects[k]; });
        Object.keys(global.latestChartStats.revSubjects).forEach(k => { if (!validSubs.includes(k)) delete global.latestChartStats.revSubjects[k]; });
        Object.keys(global.chartVisibility.revSubjects).forEach(k => { if (!validSubs.includes(k)) delete global.chartVisibility.revSubjects[k]; });

        let validActs = customActionsRef.map(a => a.id);
        Object.keys(global.latestChartStats.monthly).forEach(k => { if (!validActs.includes(k)) delete global.latestChartStats.monthly[k]; });
        Object.keys(global.latestChartStats.yearly).forEach(k => { if (!validActs.includes(k)) delete global.latestChartStats.yearly[k]; });
        Object.keys(global.chartVisibility.monthly).forEach(k => { if (!validActs.includes(k)) delete global.chartVisibility.monthly[k]; });
        Object.keys(global.chartVisibility.yearly).forEach(k => { if (!validActs.includes(k)) delete global.chartVisibility.yearly[k]; });

        const ctx1 = document.getElementById('mainChartPrograms');
        const ctx2 = document.getElementById('monthlyActionsChart');

        let activeGoalId = dashboardConfigRef.activePaceGoalId;
        if (!activeGoalId && paceGoalsRef.length > 0) {
            activeGoalId = paceGoalsRef[0].id;
            dashboardConfigRef.activePaceGoalId = activeGoalId;
        }
        const activeGoal = activeGoalId ? paceGoalsRef.find(g => g.id === activeGoalId) : null;

        const defaultStart = AppStateRef.PLAN_START_DATE || '2026-01-01';
        const defaultEnd = AppStateRef.PLAN_END_DATE || '2026-12-31';
        let chartStart = activeGoal && activeGoal.startDate ? (UtilsRef.parseDateSafe ? UtilsRef.parseDateSafe(activeGoal.startDate) : new Date(activeGoal.startDate)) : new Date(defaultStart);
        let chartEnd = activeGoal && activeGoal.deadline ? (UtilsRef.parseDateSafe ? UtilsRef.parseDateSafe(activeGoal.deadline) : new Date(activeGoal.deadline)) : new Date(defaultEnd);

        if (!chartStart || isNaN(chartStart.getTime())) chartStart = new Date(defaultStart);
        if (!chartEnd || isNaN(chartEnd.getTime())) chartEnd = new Date(defaultEnd);
        chartStart.setHours(0, 0, 0, 0);
        chartEnd.setHours(23, 59, 59, 999);

        const todayObj = (UtilsRef && typeof UtilsRef.getDailyActionDate === 'function')
            ? UtilsRef.getDailyActionDate()
            : new Date();

        if (global.trendTimeFilter === '1Y') {
            chartEnd = new Date(chartStart);
            chartEnd.setFullYear(chartEnd.getFullYear() + 1);
            chartEnd.setMonth(chartEnd.getMonth() - 1);
        } else if (global.trendTimeFilter === '2Y') {
            chartEnd = new Date(chartStart);
            chartEnd.setFullYear(chartEnd.getFullYear() + 2);
            chartEnd.setMonth(chartEnd.getMonth() - 1);
        } else if (global.trendTimeFilter === '3Y') {
            chartEnd = new Date(chartStart);
            chartEnd.setFullYear(chartEnd.getFullYear() + 3);
            chartEnd.setMonth(chartEnd.getMonth() - 1);
        } else {
            chartEnd = new Date(todayObj.getTime());
            if (chartEnd < chartStart) {
                chartEnd = new Date(chartStart.getTime());
                chartEnd.setMonth(chartEnd.getMonth() + 1);
            }
        }

        const sYear = chartStart.getFullYear();
        const sMonth = chartStart.getMonth();
        const eYear = chartEnd.getFullYear();
        const eMonth = chartEnd.getMonth();
        const totalMonths = Math.max(1, (eYear - sYear) * 12 + (eMonth - sMonth) + 1);

        const months = [];
        for (let i = 0; i < totalMonths; i++) {
            const d = new Date(sYear, sMonth + i, 1);
            months.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        }

        let progCum = {};
        tracksRef.map(t => t.id).forEach(track => {
            if (customProgramsRef[track]) {
                customProgramsRef[track].forEach(p => {
                    const pName = p.name || p;
                    progCum[pName] = Array(totalMonths).fill(0);
                    if (global.programVisibility && global.programVisibility[pName] !== undefined) {
                        global.chartVisibility.prog[pName] = global.programVisibility[pName];
                    } else if (global.chartVisibility.prog[pName] === undefined) {
                        global.chartVisibility.prog[pName] = true;
                    }
                });
            }
        });

        let subData = {};
        getAllSubsFn().forEach(s => {
            subData[s.subject] = Array(totalMonths).fill(0);
            if (global.chartVisibility.subjects[s.subject] === undefined) global.chartVisibility.subjects[s.subject] = true;
        });

        let actDaily = {};
        let actCum = {};
        customActionsRef.forEach(a => {
            actDaily[a.id] = Array(31).fill(0);
            actCum[a.id] = Array(totalMonths).fill(0);
            if (global.chartVisibility.monthly[a.id] === undefined) global.chartVisibility.monthly[a.id] = true;
            if (global.chartVisibility.yearly[a.id] === undefined) global.chartVisibility.yearly[a.id] = true;
        });

        const currentMonth = todayObj.getMonth();
        const currentDay = todayObj.getDate();
        const todayMidx = (todayObj.getFullYear() - sYear) * 12 + (todayObj.getMonth() - sMonth);
        const daysInMonth = new Date(todayObj.getFullYear(), currentMonth + 1, 0).getDate();
        let latestActiveMonth = -1;

        const completedChaptersMap = new Map();
        const getTaskDateFn = (t) => {
            if (!t) return new Date();
            if (t.date && UtilsRef && typeof UtilsRef.parseDateSafe === 'function') return UtilsRef.parseDateSafe(t.date);
            return new Date();
        };

        if (Array.isArray(AppStateRef.tasks)) {
            AppStateRef.tasks.forEach(t => {
                const taskDate = getTaskDateFn(t);
                tracksRef.forEach(track => {
                    const key = track.id + 'Tasks';
                    if (t.type === 'study' && Array.isArray(t[key])) {
                        t[key].forEach(b => {
                            if (b.completed) {
                                const compDate = b.completedAt ? (UtilsRef.parseDateSafe ? UtilsRef.parseDateSafe(b.completedAt) : new Date(b.completedAt)) : taskDate;
                                const uniqueKey = `${track.id}|${b.subject}|${b.chapter}`;
                                if (!completedChaptersMap.has(uniqueKey) || completedChaptersMap.get(uniqueKey) > compDate) {
                                    completedChaptersMap.set(uniqueKey, compDate);
                                }
                            }
                        });
                    }
                });
            });
        }

        const getTaskFn = global.getTaskForDate || (typeof window !== 'undefined' ? window.getTaskForDate : null);

        // Populate actDaily
        for (let d = 1; d <= daysInMonth; d++) {
            const cellDate = new Date(todayObj.getFullYear(), currentMonth, d);
            if (cellDate < chartStart) continue;
            const task = getTaskFn ? getTaskFn(cellDate) : null;
            if (task) {
                customActionsRef.forEach(a => {
                    if (task[a.id]) actDaily[a.id][d - 1] = 1;
                });
            }
        }

        // Populate actCum
        for (let mIdx = 0; mIdx < totalMonths; mIdx++) {
            const mYear = sYear + Math.floor((sMonth + mIdx) / 12);
            const mMonth = (sMonth + mIdx) % 12;
            const daysInThatMonth = new Date(mYear, mMonth + 1, 0).getDate();
            const maxDay = (mIdx === todayMidx) ? currentDay : daysInThatMonth;

            for (let d = 1; d <= maxDay; d++) {
                const cellDate = new Date(mYear, mMonth, d);
                if (cellDate < chartStart) continue;
                if (cellDate > todayObj) break;
                const task = getTaskFn ? getTaskFn(cellDate) : null;
                if (task) {
                    customActionsRef.forEach(a => {
                        if (task[a.id]) actCum[a.id][mIdx]++;
                    });
                }
            }
        }

        completedChaptersMap.forEach((compDate, uniqueKey) => {
            const [trackId, subject] = uniqueKey.split('|');
            const cYear = compDate.getFullYear();
            const cMonth = compDate.getMonth();
            const cMidx = (cYear - sYear) * 12 + (cMonth - sMonth);

            if (cMidx < totalMonths) {
                const mIdxStudy = cMidx < 0 ? 0 : cMidx;

                if (syllabusStructureRef[trackId]) {
                    const sObj = syllabusStructureRef[trackId].find(s => s.subject === subject);
                    if (sObj && sObj.program && progCum[sObj.program]) {
                        progCum[sObj.program][mIdxStudy]++;
                    }
                }
                if (subData[subject]) {
                    subData[subject][mIdxStudy]++;
                }
                latestActiveMonth = Math.max(latestActiveMonth, mIdxStudy);
            }
        });

        let boundedToday = todayMidx >= totalMonths ? totalMonths - 1 : (todayMidx < 0 ? 0 : todayMidx);
        let boundedLatest = latestActiveMonth >= totalMonths ? totalMonths - 1 : latestActiveMonth;
        const cutoff = Math.max(boundedToday, boundedLatest, 0);

        Object.keys(progCum).forEach(p => {
            for (let i = 1; i <= cutoff; i++) progCum[p][i] += progCum[p][i - 1];
            let pTotal = 0;
            let pEffectiveTotal = 0;

            tracksRef.map(t => t.id).forEach(track => {
                if (syllabusStructureRef[track]) {
                    syllabusStructureRef[track].forEach(s => {
                        if (s.program === p) {
                            pTotal += s.chapters;
                            if (global.lastSubjectStats && global.lastSubjectStats[s.subject]) {
                                pEffectiveTotal += global.lastSubjectStats[s.subject].effectiveChapters;
                            }
                        }
                    });
                }
            });

            for (let i = 0; i <= cutoff; i++) progCum[p][i] = pTotal > 0 ? Math.round((progCum[p][i] / pTotal) * 100) : 0;
            if (pTotal > 0) {
                progCum[p][cutoff] = Math.max(progCum[p][cutoff], Math.round((pEffectiveTotal / pTotal) * 100));
            } else {
                progCum[p][cutoff] = 0;
            }

            global.latestChartStats.prog[p] = progCum[p][cutoff] || 0;
            for (let i = cutoff + 1; i < totalMonths; i++) progCum[p][i] = null;
        });

        customActionsRef.forEach(a => {
            for (let i = 0; i <= cutoff; i++) {
                let divisor;
                const mDate = new Date(sYear, sMonth + i + 1, 0);
                const daysInM = mDate.getDate();

                if (i === 0 && sYear === chartStart.getFullYear() && sMonth === chartStart.getMonth()) {
                    if (i === todayMidx) {
                        divisor = Math.max(1, currentDay - chartStart.getDate() + 1);
                    } else {
                        divisor = Math.max(1, daysInM - chartStart.getDate() + 1);
                    }
                } else if (i === todayMidx) {
                    divisor = Math.max(1, currentDay);
                } else {
                    divisor = Math.max(1, daysInM);
                }
                actCum[a.id][i] = Math.round((actCum[a.id][i] / divisor) * 100);
            }

            let runningTotal = 0;
            let validDaysCountThisMonth = 0;
            for (let i = 0; i < currentDay; i++) {
                const dayDate = new Date(todayObj.getFullYear(), todayObj.getMonth(), i + 1);
                dayDate.setHours(0, 0, 0, 0);
                if (dayDate >= chartStart) {
                    validDaysCountThisMonth++;
                    runningTotal += actDaily[a.id][i] || 0;
                    actDaily[a.id][i] = Math.round((runningTotal / validDaysCountThisMonth) * 100);
                } else {
                    actDaily[a.id][i] = null;
                }
            }

            for (let i = currentDay; i < daysInMonth; i++) actDaily[a.id][i] = null;

            global.latestChartStats.monthly[a.id] = actDaily[a.id][currentDay - 1] || 0;
            global.latestChartStats.yearly[a.id] = actCum[a.id][cutoff] || 0;
        });

        Object.keys(subData).forEach(k => {
            let sTotal = 1;
            let match = null;
            for (const track of tracksRef) {
                if (syllabusStructureRef[track.id]) {
                    match = syllabusStructureRef[track.id].find(s => s.subject === k);
                    if (match) break;
                }
            }
            if (match) sTotal = match.chapters;
            sTotal = Math.max(1, sTotal);
            for (let i = 1; i <= cutoff; i++) subData[k][i] += subData[k][i - 1];
            for (let i = 0; i <= cutoff; i++) subData[k][i] = Math.round((subData[k][i] / sTotal) * 100);

            const progMatch = match ? match.program : null;
            if (global.lastSubjectStats && global.lastSubjectStats[k]) {
                const effPct = Math.round((global.lastSubjectStats[k].effectiveChapters / sTotal) * 100);
                subData[k][cutoff] = Math.max(subData[k][cutoff], effPct);
            }

            const isFrozen = passedItemsRef && (
                (passedItemsRef.subjects && passedItemsRef.subjects.includes(k)) ||
                (passedItemsRef.programs && progMatch && passedItemsRef.programs.includes(progMatch))
            );
            if (isFrozen) subData[k][cutoff] = 100;

            global.latestChartStats.subjects[k] = subData[k][cutoff] || 0;
            for (let i = cutoff + 1; i < totalMonths; i++) subData[k][i] = null;
        });

        global.lastSubjectTrendData = subData;
        global.lastTrendMonths = months;

        // Render Chart.js
        if (typeof Chart !== 'undefined') {
            if (!Chart.defaults) Chart.defaults = {};
            if (!Chart.defaults.font) Chart.defaults.font = {};
            Chart.defaults.color = '#94a3b8';
            Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui';
            const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        usePointStyle: true,
                        boxPadding: 6,
                        callbacks: { label: c => ' ' + c.dataset.label + ': ' + c.parsed.y + '%' }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        ticks: { font: { size: 9, weight: 'bold' }, callback: v => v + '%' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false }
                    },
                    x: {
                        ticks: { font: { size: 9, weight: 'bold' } },
                        grid: { display: false, drawBorder: false }
                    }
                }
            };

            const getProgColor = global.getProgramColor || (typeof window !== 'undefined' ? window.getProgramColor : () => '#6366f1');

            if (ctx1) {
                let pDatasets = [];
                Object.keys(progCum).forEach(p => {
                    const color = getProgColor(p);
                    pDatasets.push({
                        label: p,
                        data: progCum[p],
                        borderColor: color,
                        backgroundColor: color + '25',
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: color,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#fff',
                        fill: true,
                        hidden: !global.chartVisibility.prog[p]
                    });
                });

                if (global.mainChartPrograms && global.mainChartPrograms.canvas === ctx1) {
                    global.mainChartPrograms.data.labels = months;
                    global.mainChartPrograms.data.datasets = pDatasets;
                    global.mainChartPrograms.update('none');
                } else {
                    if (global.mainChartPrograms) global.mainChartPrograms.destroy();
                    global.mainChartPrograms = new Chart(ctx1, { type: 'line', data: { labels: months, datasets: pDatasets }, options: chartOptions });
                }
            }

            if (ctx2) {
                const twColors = AppStateRef.twColors || {};
                const sortedActions = [...customActionsRef].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999));
                let mDatasets = sortedActions.map(a => {
                    const hex = (twColors[a.color] && twColors[a.color].hex) || '#6366f1';
                    return {
                        label: a.title,
                        data: actDaily[a.id],
                        borderColor: hex,
                        backgroundColor: hex + '25',
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: hex,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#fff',
                        fill: true,
                        hidden: !global.chartVisibility.monthly[a.id]
                    };
                });

                if (global.monthlyChartActions && global.monthlyChartActions.canvas === ctx2) {
                    global.monthlyChartActions.data.labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                    global.monthlyChartActions.data.datasets = mDatasets;
                    global.monthlyChartActions.update('none');
                } else {
                    if (global.monthlyChartActions) global.monthlyChartActions.destroy();
                    global.monthlyChartActions = new Chart(ctx2, { type: 'line', data: { labels: Array.from({ length: daysInMonth }, (_, i) => i + 1), datasets: mDatasets }, options: chartOptions });
                }
            }

            const ctxYearly = document.getElementById('yearlyActionsChart');
            if (ctxYearly) {
                const twColors = AppStateRef.twColors || {};
                const sortedActions = [...customActionsRef].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999));
                let yDatasets = sortedActions.map(a => {
                    const hex = (twColors[a.color] && twColors[a.color].hex) || '#6366f1';
                    return {
                        label: a.title,
                        data: actCum[a.id],
                        borderColor: hex,
                        backgroundColor: hex + '15',
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: hex,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#fff',
                        fill: true,
                        hidden: !global.chartVisibility.yearly[a.id]
                    };
                });

                if (global.yearlyChartActions && global.yearlyChartActions.canvas === ctxYearly) {
                    global.yearlyChartActions.data.labels = months;
                    global.yearlyChartActions.data.datasets = yDatasets;
                    global.yearlyChartActions.update('none');
                } else {
                    if (global.yearlyChartActions) global.yearlyChartActions.destroy();
                    global.yearlyChartActions = new Chart(ctxYearly.getContext('2d'), { type: 'line', data: { labels: months, datasets: yDatasets }, options: chartOptions });
                }
            }
        }

        // Render Subject Circle Chart
        if (typeof global.renderSubjectTrendCircle === 'function') {
            global.renderSubjectTrendCircle();
        }

        // Summary Cards
        const avgCompEl = document.getElementById('analytics-avg-completion');
        const avgCompBar = document.getElementById('analytics-avg-completion-bar');
        if (avgCompEl) {
            let totalSubs = 0;
            let passedSubs = 0;
            tracksRef.map(t => t.id).forEach(track => {
                if (syllabusStructureRef[track]) {
                    syllabusStructureRef[track].forEach(s => {
                        totalSubs++;
                        if (passedItemsRef && (passedItemsRef.programs.includes(s.program) || passedItemsRef.subjects.includes(s.subject))) {
                            passedSubs++;
                        }
                    });
                }
            });
            const pct = totalSubs > 0 ? Math.round((passedSubs / totalSubs) * 100) : 0;
            avgCompEl.textContent = pct + '%';
            if (avgCompBar) avgCompBar.style.width = pct + '%';
        }

        const totalActEl = document.getElementById('analytics-total-actions');
        if (totalActEl && Array.isArray(AppStateRef.tasks)) {
            let totalLoggedActions = 0;
            AppStateRef.tasks.forEach(t => {
                customActionsRef.forEach(a => {
                    if (t[a.id]) totalLoggedActions++;
                });
            });
            totalActEl.textContent = totalLoggedActions;
        }

        const daysRemainEl = document.getElementById('analytics-days-remaining');
        if (daysRemainEl) {
            const pEndDate = AppStateRef.PLAN_END_DATE ? new Date(AppStateRef.PLAN_END_DATE) : new Date('2026-12-31');
            const diffRem = pEndDate.getTime() - todayObj.getTime();
            const daysRem = Math.max(0, Math.ceil(diffRem / (1000 * 60 * 60 * 24)));
            daysRemainEl.textContent = daysRem;
        }

        // Call Pace Visualizations
        renderPaceCharts();

        if (typeof global.renderSpectraCircleChart === 'function') {
            global.renderSpectraCircleChart();
        }

        updateLegends();

        if (typeof global.renderHeatmap === 'function') {
            global.renderHeatmap();
        }
    }

    function toggleDataset(chartKey, dsKey) {
        if (!global.chartVisibility || !global.chartVisibility[chartKey]) return;
        global.chartVisibility[chartKey][dsKey] = !global.chartVisibility[chartKey][dsKey];

        if (chartKey === 'prog') {
            if (!global.programVisibility) global.programVisibility = {};
            global.programVisibility[dsKey] = global.chartVisibility.prog[dsKey];
        }

        const chart = chartKey === 'prog' ? global.mainChartPrograms : (chartKey === 'monthly' ? global.monthlyChartActions : global.yearlyChartActions);
        if (chart) {
            const customActionsRef = global.customActions || (typeof window !== 'undefined' ? window.customActions : []) || [];
            const searchVal = chartKey === 'prog' ? dsKey : customActionsRef.find(a => a.id === dsKey)?.title;
            const ds = chart.data.datasets.find(d => d.label === searchVal);
            if (ds) ds.hidden = !global.chartVisibility[chartKey][dsKey];
            chart.update();
        }
        updateLegends();

        if (chartKey === 'prog') {
            const FirebaseRef = global.FirebaseService || (typeof window !== 'undefined' ? window.FirebaseService : null);
            if (FirebaseRef && typeof FirebaseRef.saveToCloud === 'function') {
                FirebaseRef.saveToCloud();
            }
            if (typeof global.renderUI === 'function') global.renderUI();
        }
    }

    function toggleSubDataset(k) {
        if (!global.chartVisibility || !global.chartVisibility.subjects) return;
        global.chartVisibility.subjects[k] = !global.chartVisibility.subjects[k];
        if (global.subjectTrendLineChartInstance) {
            const ds = global.subjectTrendLineChartInstance.data.datasets.find(d => d.subjectKey === k);
            if (ds) {
                ds.hidden = !global.chartVisibility.subjects[k];
                global.subjectTrendLineChartInstance.update();
            }
        }
        updateLegends();
    }

    function toggleRevSubDataset(k) {
        if (!global.chartVisibility || !global.chartVisibility.revSubjects) return;
        global.chartVisibility.revSubjects[k] = !global.chartVisibility.revSubjects[k];
        if (global.revisionTrendChartInstance) {
            const ds = global.revisionTrendChartInstance.data.datasets.find(d => d.subjectKey === k);
            if (ds) {
                ds.hidden = !global.chartVisibility.revSubjects[k];
                global.revisionTrendChartInstance.update();
            }
        }
        updateRevisionLegends();
    }

    function updateLegends() {
        if (typeof document === 'undefined') return;

        const getLegend = (key, idxKey, color, label, valKey) => {
            const val = (global.latestChartStats && global.latestChartStats[key]) ? global.latestChartStats[key][valKey] : 0;
            const active = (global.chartVisibility && global.chartVisibility[key]) ? global.chartVisibility[key][idxKey] : true;
            return `<div onclick="window.toggleDataset('${key}', '${idxKey}')" class="cursor-pointer flex items-center space-x-1.5 md:space-x-2 px-2.5 md:px-3 py-1.5 md:px-3.5 md:py-2 bg-slate-900 rounded-lg md:rounded-xl border border-slate-700 hover:bg-slate-800 active:scale-95 transition-all ${active ? 'opacity-100 scale-100 shadow-md' : 'opacity-40 grayscale scale-95 line-through'}"><div class="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0" style="background-color: ${color}; box-shadow: 0 0 8px ${color}"></div><span class="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">${label}: ${val}%</span></div>`;
        };

        const pLeg = document.getElementById('prog-legend');
        if (pLeg) {
            const getAllProgsFn = global.getAllPrograms || (typeof window !== 'undefined' ? window.getAllPrograms : null) || (() => []);
            const sortedAllProgs = getAllProgsFn();
            const getProgColor = global.getProgramColor || (typeof window !== 'undefined' ? window.getProgramColor : null) || (() => '#6366f1');
            pLeg.innerHTML = sortedAllProgs.map(pObj => {
                const p = pObj.name || pObj;
                return getLegend('prog', p, getProgColor(p), p, p);
            }).join('');
        }

        const customActionsRef = global.customActions || (typeof window !== 'undefined' ? window.customActions : []) || [];
        const AppStateRef = global.AppState || (typeof window !== 'undefined' ? window.AppState : {}) || {};
        const twColors = AppStateRef.twColors || {};

        const sortedActions = [...customActionsRef].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
        let actHtml = sortedActions.map(a => {
            const hex = (twColors[a.color] && twColors[a.color].hex) || '#6366f1';
            return getLegend('monthly', a.id, hex, a.title, a.id);
        }).join('');
        const aLeg = document.getElementById('act-legend');
        if (aLeg) aLeg.innerHTML = actHtml;

        let yearHtml = sortedActions.map(a => {
            const hex = (twColors[a.color] && twColors[a.color].hex) || '#6366f1';
            return getLegend('yearly', a.id, hex, a.title, a.id);
        }).join('');
        const yLeg = document.getElementById('yearly-legend');
        if (yLeg) yLeg.innerHTML = yearHtml;
    }

    function updateRevisionLegends() {
        if (typeof document === 'undefined') return;
        const sLeg = document.getElementById('revision-trend-legend');
        if (sLeg) {
            const getAllSubsFn = global.getAllSubjects || (typeof window !== 'undefined' ? window.getAllSubjects : null) || (() => []);
            const sortedSubs = getAllSubsFn().sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
            const getCleanLabel = global.getDynamicCleanLabel || (typeof window !== 'undefined' ? window.getDynamicCleanLabel : (s => s));
            const getSubColor = global.getSubjectColor || (typeof window !== 'undefined' ? window.getSubjectColor : null) || (() => '#3b82f6');

            sLeg.innerHTML = sortedSubs.map(s => {
                const k = s.subject;
                const val = (global.latestChartStats && global.latestChartStats.revSubjects) ? global.latestChartStats.revSubjects[k] : 0;
                const active = (global.chartVisibility && global.chartVisibility.revSubjects) ? global.chartVisibility.revSubjects[k] : true;
                const color = getSubColor(k);
                const label = getCleanLabel(k, 12);
                const activeStyle = active ? `border-color: ${color}40; background-color: rgba(15,23,42,0.8); box-shadow: 0 0 10px ${color}20; opacity: 1;` : `border-color: rgba(255,255,255,0.1); background-color: transparent; opacity: 0.4; filter: grayscale(100%);`;
                return `<div onclick="window.toggleRevSubDataset('${k}')" class="cursor-pointer flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border active:scale-95 transition-all duration-300 hover:scale-105 backdrop-blur-sm" style="${activeStyle}"><div class="w-2 h-2 rounded-full shrink-0 shadow-md" style="background-color: ${color}; box-shadow: 0 0 8px ${color}"></div><span class="text-[8px] md:text-[9px] font-black text-slate-200 uppercase whitespace-nowrap">${label}: ${val}%</span></div>`;
            }).join('');
        }
    }

    function renderRevisionTrendChart() {
        if (typeof document === 'undefined') return;
        const ctxSub = document.getElementById('revisionTrendChart');
        if (!ctxSub) return;

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        const planStart = (AppStateRef && AppStateRef.PLAN_START_DATE) ? AppStateRef.PLAN_START_DATE : new Date();
        const planEnd = (AppStateRef && AppStateRef.PLAN_END_DATE) ? AppStateRef.PLAN_END_DATE : new Date();

        let chartStart = new Date(planStart.getTime());
        let chartEnd = new Date(planEnd.getTime());
        const todayObj = new Date();

        const timeFilter = global.trendTimeFilter || 'ALL';
        if (timeFilter === '1Y') {
            chartEnd = new Date(chartStart);
            chartEnd.setFullYear(chartEnd.getFullYear() + 1);
            chartEnd.setMonth(chartEnd.getMonth() - 1);
        } else if (timeFilter === '2Y') {
            chartEnd = new Date(chartStart);
            chartEnd.setFullYear(chartEnd.getFullYear() + 2);
            chartEnd.setMonth(chartEnd.getMonth() - 1);
        } else if (timeFilter === '3Y') {
            chartEnd = new Date(chartStart);
            chartEnd.setFullYear(chartEnd.getFullYear() + 3);
            chartEnd.setMonth(chartEnd.getMonth() - 1);
        } else {
            chartStart = new Date(planStart.getTime());
            chartEnd = new Date(todayObj.getTime());
            if (chartEnd < chartStart) {
                chartEnd = new Date(chartStart.getTime());
                chartEnd.setMonth(chartEnd.getMonth() + 1);
            }
        }

        const sYear = chartStart.getFullYear();
        const sMonth = chartStart.getMonth();
        const eYear = chartEnd.getFullYear();
        const eMonth = chartEnd.getMonth();
        const totalMonths = Math.max(1, (eYear - sYear) * 12 + (eMonth - sMonth) + 1);

        const months = [];
        for (let i = 0; i < totalMonths; i++) {
            const d = new Date(sYear, sMonth + i, 1);
            months.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        }

        let revSubData = {};
        if (!global.chartVisibility) global.chartVisibility = { prog: {}, monthly: {}, yearly: {}, subjects: {}, revSubjects: {} };
        if (!global.chartVisibility.revSubjects) global.chartVisibility.revSubjects = {};
        if (!global.latestChartStats) global.latestChartStats = { revSubjects: {} };

        const getAllSubsFn = global.getAllSubjects || (typeof window !== 'undefined' ? window.getAllSubjects : null) || (() => []);
        getAllSubsFn().forEach(s => {
            revSubData[s.subject] = Array(totalMonths).fill(0);
            if (global.chartVisibility.revSubjects[s.subject] === undefined) global.chartVisibility.revSubjects[s.subject] = true;
        });

        let latestActiveMonth = -1;
        const todayMidx = (todayObj.getFullYear() - sYear) * 12 + (todayObj.getMonth() - sMonth);

        const revProgress = (global.revisionData && global.revisionData.progress) ? global.revisionData.progress : {};
        Object.keys(revProgress).forEach(sub => {
            if (!revSubData[sub]) return;
            Object.keys(revProgress[sub]).forEach(chNum => {
                const val = revProgress[sub][chNum];
                if (val) {
                    let d;
                    if (typeof val === 'string' || typeof val === 'number') {
                        d = new Date(val);
                    } else {
                        d = todayObj;
                    }
                    let mIdx = (d.getFullYear() - sYear) * 12 + (d.getMonth() - sMonth);
                    if (mIdx < 0) mIdx = 0;
                    if (mIdx < totalMonths) {
                        revSubData[sub][mIdx]++;
                        latestActiveMonth = Math.max(latestActiveMonth, mIdx);
                    }
                }
            });
        });

        let boundedToday = todayMidx >= totalMonths ? totalMonths - 1 : (todayMidx < 0 ? 0 : todayMidx);
        let boundedLatest = latestActiveMonth >= totalMonths ? totalMonths - 1 : latestActiveMonth;
        const cutoff = Math.max(boundedToday, boundedLatest, 0);

        Object.keys(revSubData).forEach(k => {
            let sTotal = 1;
            const sObj = getAllSubsFn().find(s => s.subject === k);
            if (sObj) sTotal = sObj.chapters;
            sTotal = Math.max(1, sTotal);

            for (let i = 1; i <= cutoff; i++) revSubData[k][i] += revSubData[k][i - 1];
            for (let i = 0; i <= cutoff; i++) revSubData[k][i] = Math.round((revSubData[k][i] / sTotal) * 100);

            if (!global.latestChartStats.revSubjects) global.latestChartStats.revSubjects = {};
            global.latestChartStats.revSubjects[k] = revSubData[k][cutoff] || 0;
            for (let i = cutoff + 1; i < totalMonths; i++) revSubData[k][i] = null;
        });

        if (typeof Chart === 'undefined') return;

        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui';
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    usePointStyle: true,
                    boxPadding: 6,
                    callbacks: { label: c => ' ' + c.dataset.label + ': ' + c.parsed.y + '%' }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: { font: { size: 9, weight: 'bold' }, callback: v => v + '%' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false }
                },
                x: {
                    ticks: { font: { size: 9, weight: 'bold' } },
                    grid: { display: false, drawBorder: false }
                }
            }
        };

        const getDynLabel = global.getDynamicChartLabel || (typeof window !== 'undefined' ? window.getDynamicChartLabel : (k => k));
        const getSubColor = global.getSubjectColor || (typeof window !== 'undefined' ? window.getSubjectColor : (() => '#3b82f6'));

        const subDatasets = Object.keys(revSubData).map(k => ({
            label: getDynLabel(k),
            data: revSubData[k],
            borderColor: getSubColor(k),
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#0f172a',
            pointBorderColor: getSubColor(k),
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: getSubColor(k),
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            hidden: !global.chartVisibility.revSubjects[k],
            subjectKey: k
        }));

        if (global.revisionTrendChartInstance) {
            global.revisionTrendChartInstance.data.labels = months;
            global.revisionTrendChartInstance.data.datasets = subDatasets;
            global.revisionTrendChartInstance.update('none');
        } else {
            global.revisionTrendChartInstance = new Chart(ctxSub.getContext('2d'), {
                type: 'line',
                data: { labels: months, datasets: subDatasets },
                options: { ...chartOptions, interaction: { mode: 'nearest', axis: 'x', intersect: false } }
            });
        }

        updateRevisionLegends();
    }

    function openRevisionTrendModal() {
        if (typeof global.openModal === 'function') {
            global.openModal('revision-trend-modal');
        }
    }

    function openYearlyActionsModal() {
        if (typeof renderTrendCharts === 'function') renderTrendCharts();
        if (typeof global.renderHeatmap === 'function') global.renderHeatmap();
        if (typeof global.openModal === 'function') global.openModal('yearly-actions-modal');
        setTimeout(() => {
            if (global.yearlyChartActions && typeof global.yearlyChartActions.resize === 'function') {
                global.yearlyChartActions.resize();
                global.yearlyChartActions.update('none');
            }
        }, 60);
    }

    function setTrendFilter(f) {
        global.trendTimeFilter = f;
        renderTrendCharts();
        if (global.revisionTrendChartInstance && typeof global.renderRevisionTrendChart === 'function') {
            global.renderRevisionTrendChart();
        }
        if (typeof document !== 'undefined') {
            ['1Y', '2Y', '3Y', 'ALL'].forEach(id => {
                const btn = document.getElementById('tf-' + id);
                if (btn) {
                    if (id === f) {
                        btn.classList.add('bg-blue-600', 'text-white', 'shadow');
                        btn.classList.remove('text-slate-500', 'hover:bg-slate-300', 'dark:text-slate-400', 'dark:hover:bg-slate-600');
                    } else {
                        btn.classList.remove('bg-blue-600', 'text-white', 'shadow');
                        btn.classList.add('text-slate-500', 'hover:bg-slate-300', 'dark:text-slate-400', 'dark:hover:bg-slate-600');
                    }
                }
            });
        }
    }


    /* ==========================================================================
       4. Canonical AnalyticsPage Lifecycle Object
       ========================================================================== */

    const AnalyticsPage = {
        isMounted: false,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;
            this.render();
        },

        render: function () {
            if (typeof document === 'undefined') return;
            const pageEl = document.getElementById('page-spectra-analytics');
            if (!pageEl) return;

            // 1. Chapters Breakdown circle chart
            renderSpectraCircleChart();

            // 2. Commitments Habit Radar chart
            renderSpectraCommitmentsChart();

            // 3. Program Completion & Daily Actions Trend charts and Stat cards
            renderTrendCharts();

            // 4. Pacing Trend charts (X Bar and Global Scope burn-up)
            renderPaceCharts();

            // 5. Focus Analytics line/bar/combo chart
            if (typeof global.updateTimerAnalyticsControls === 'function') {
                global.updateTimerAnalyticsControls();
            }
            if (typeof global.renderTimerAnalyticsChart === 'function') {
                global.renderTimerAnalyticsChart(true);
            }

            // 6. Focus Matrix GitHub Box Heatmap
            const setHmRangeUiFn = global.setSpectraHeatmapRangeUI || (typeof window !== 'undefined' ? window.setSpectraHeatmapRangeUI : null);
            const renderHmFn = global.renderSpectraFocusHeatmap || (typeof window !== 'undefined' ? window.renderSpectraFocusHeatmap : null);
            if (typeof setHmRangeUiFn === 'function') {
                setHmRangeUiFn(global.spectraHeatmapRange || 365);
            } else if (typeof renderHmFn === 'function') {
                renderHmFn();
            }

            // 7. Ensure charts are resized properly
            this.resizeCharts();
        },

        resizeCharts: function () {
            const resizeFn = () => {
                const charts = [
                    global.mainChartPrograms,
                    global.monthlyChartActions,
                    global.spectraPaceTrendChartInstance,
                    global.globalPaceTrendChartInstance,
                    global.spectraFocusAnalyticsChartInstance
                ];
                charts.forEach(chart => {
                    if (chart && typeof chart.resize === 'function') {
                        chart.resize();
                        if (typeof chart.update === 'function') {
                            chart.update('none');
                        }
                    }
                });
            };
            setTimeout(resizeFn, 50);
            setTimeout(resizeFn, 420);
        },

        destroy: function () {
            this.isMounted = false;
            if (typeof document === 'undefined') return;

            // Close filter dropdown if open
            const menu = document.getElementById('spectra-filter-dropdown-menu');
            const btn = document.getElementById('spectra-filter-dropdown-btn');
            if (menu && !menu.classList.contains('hidden')) {
                menu.classList.add('hidden');
                if (btn && btn.querySelector('svg')) {
                    btn.querySelector('svg').style.transform = '';
                }
            }

            // Hide tooltips
            const hideChapterTooltipFn = global.hideSpectraChapterTooltip || (typeof window !== 'undefined' ? window.hideSpectraChapterTooltip : null);
            if (typeof hideChapterTooltipFn === 'function') hideChapterTooltipFn();
            hideCommitmentTooltip();

            // Destroy local Chart.js instances if canvas is being detached to prevent canvas reuse error
            const charts = [
                'mainChartPrograms',
                'monthlyChartActions',
                'yearlyChartActions',
                'spectraPaceTrendChartInstance',
                'globalPaceTrendChartInstance'
            ];
            charts.forEach(cName => {
                if (global[cName] && typeof global[cName].destroy === 'function') {
                    try {
                        global[cName].destroy();
                    } catch (e) {}
                    global[cName] = null;
                }
            });
        }
    };

    const SpectraAnalytics = {
        populateSpectraFilterDropdown,
        updateSpectraFilterDropdownLabel,
        onSpectraFilterChange,
        renderSpectraCircleChart,
        getCommitmentLabels,
        saveCommitmentLabelsData,
        getCommitmentStorageKey,
        getCommitmentMonthData,
        saveCommitmentMonthData,
        toggleCommitmentCell,
        prevCommitmentMonth,
        nextCommitmentMonth,
        resetCommitmentMonth,
        openCommitmentsModal,
        closeCommitmentsModal,
        resetCommitmentLabelsDefault,
        saveCommitmentLabels,
        renderSpectraCommitmentsChart,
        showCommitmentTooltip,
        hideCommitmentTooltip,
        renderPaceCharts,
        renderTrendCharts,
        toggleDataset,
        toggleSubDataset,
        toggleRevSubDataset,
        updateLegends,
        updateRevisionLegends,
        setTrendFilter,
        renderRevisionTrendChart,
        openRevisionTrendModal,
        openYearlyActionsModal,
        initAnalyticsEventListeners,
        AnalyticsPage
    };

    function initAnalyticsEventListeners() {
        if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
        if (global._analyticsListenersInitialized) return;
        global._analyticsListenersInitialized = true;

        document.addEventListener('click', (e) => {
            const heatmapBtn = e.target.closest('[data-heatmap-range]');
            if (heatmapBtn) {
                e.preventDefault();
                const range = parseInt(heatmapBtn.getAttribute('data-heatmap-range'), 10);
                if (!isNaN(range) && typeof global.setSpectraHeatmapRange === 'function') {
                    global.setSpectraHeatmapRange(range);
                }
                return;
            }

            const trendBtn = e.target.closest('[data-trend-filter]');
            if (trendBtn) {
                e.preventDefault();
                const filter = trendBtn.getAttribute('data-trend-filter');
                if (filter && typeof global.setTrendFilter === 'function') {
                    global.setTrendFilter(filter);
                }
                return;
            }

            if (e.target.closest('#btn-open-yearly-actions, [data-yearly-actions-open]')) {
                e.preventDefault();
                openYearlyActionsModal();
                return;
            }

            if (e.target.closest('#btn-open-subject-trend, [data-subject-trend-open]')) {
                e.preventDefault();
                if (typeof global.openSubjectTrendModal === 'function') {
                    global.openSubjectTrendModal();
                }
                return;
            }

            const actionRangeBtn = e.target.closest('[data-action-analytics-range]');
            if (actionRangeBtn) {
                e.preventDefault();
                const r = parseInt(actionRangeBtn.getAttribute('data-action-analytics-range'), 10);
                if (!isNaN(r) && typeof global.setActionAnalyticsRange === 'function') {
                    global.setActionAnalyticsRange(r);
                }
                return;
            }

            if (e.target.closest('#btn-prev-commitment-month, [data-commitment-prev]')) {
                e.preventDefault();
                prevCommitmentMonth();
                return;
            }
            if (e.target.closest('#btn-next-commitment-month, [data-commitment-next]')) {
                e.preventDefault();
                nextCommitmentMonth();
                return;
            }

            const progViewBtn = e.target.closest('[data-prog-analytics-view]');
            if (progViewBtn) {
                e.preventDefault();
                const v = progViewBtn.getAttribute('data-prog-analytics-view');
                if (v && typeof global.switchProgramAnalyticsView === 'function') {
                    global.switchProgramAnalyticsView(v);
                }
                return;
            }

            const trendStyleBtn = e.target.closest('[data-subject-trend-style]');
            if (trendStyleBtn) {
                e.preventDefault();
                const s = trendStyleBtn.getAttribute('data-subject-trend-style');
                if (s && typeof global.setSubjectTrendChartStyle === 'function') {
                    global.setSubjectTrendChartStyle(s);
                }
                return;
            }

            if (e.target.closest('#btn-toggle-subject-trend-global, [data-subject-trend-toggle-global]')) {
                e.preventDefault();
                if (typeof global.toggleSubjectTrendGlobal === 'function') {
                    global.toggleSubjectTrendGlobal();
                }
                return;
            }

            const dadbTabBtn = e.target.closest('[data-dadb-tab]');
            if (dadbTabBtn) {
                e.preventDefault();
                const t = dadbTabBtn.getAttribute('data-dadb-tab');
                if (t && typeof global.switchDadbTab === 'function') {
                    global.switchDadbTab(t);
                }
                return;
            }

            const timerRangeBtn = e.target.closest('[data-timer-analytics-range]');
            if (timerRangeBtn) {
                e.preventDefault();
                const r = parseInt(timerRangeBtn.getAttribute('data-timer-analytics-range'), 10);
                if (!isNaN(r) && typeof global.setTimerAnalyticsRange === 'function') {
                    global.setTimerAnalyticsRange(r);
                }
                return;
            }

            const timerDayBtn = e.target.closest('[data-timer-analytics-day]');
            if (timerDayBtn) {
                e.preventDefault();
                const d = parseInt(timerDayBtn.getAttribute('data-timer-analytics-day'), 10);
                if (!isNaN(d) && typeof global.navigateTimerAnalyticsDay === 'function') {
                    global.navigateTimerAnalyticsDay(d);
                }
                return;
            }

            const timerDayResetBtn = e.target.closest('[data-timer-analytics-day-reset]');
            if (timerDayResetBtn) {
                e.preventDefault();
                if (typeof global.resetTimerAnalyticsDayOffset === 'function') {
                    global.resetTimerAnalyticsDayOffset();
                }
                return;
            }

            const timerGroupingBtn = e.target.closest('[data-timer-analytics-grouping]');
            if (timerGroupingBtn) {
                e.preventDefault();
                const g = timerGroupingBtn.getAttribute('data-timer-analytics-grouping');
                if (g && typeof global.setTimerAnalyticsGrouping === 'function') {
                    global.setTimerAnalyticsGrouping(g);
                }
                return;
            }

            const timerChartStyleBtn = e.target.closest('[data-timer-analytics-style]');
            if (timerChartStyleBtn) {
                e.preventDefault();
                const s = timerChartStyleBtn.getAttribute('data-timer-analytics-style');
                if (s && typeof global.setTimerAnalyticsChartStyle === 'function') {
                    global.setTimerAnalyticsChartStyle(s);
                }
                return;
            }
        });

        const handleDailyFocusTarget = (e) => {
            const targetInput = e.target.closest('[data-daily-focus-target]');
            if (targetInput && typeof global.updateDailyFocusHoursTarget === 'function') {
                global.updateDailyFocusHoursTarget(targetInput.value);
            }
        };
        document.addEventListener('input', handleDailyFocusTarget);
        document.addEventListener('change', handleDailyFocusTarget);
    }

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAnalyticsEventListeners);
        } else {
            initAnalyticsEventListeners();
        }
    }

    // Attach to global window scope
    global.SpectraAnalytics = SpectraAnalytics;
    global.AnalyticsPage = AnalyticsPage;
    global.populateSpectraFilterDropdown = populateSpectraFilterDropdown;
    global.updateSpectraFilterDropdownLabel = updateSpectraFilterDropdownLabel;
    global.onSpectraFilterChange = onSpectraFilterChange;
    global.renderSpectraCircleChart = renderSpectraCircleChart;
    global.getCommitmentLabels = getCommitmentLabels;
    global.saveCommitmentLabelsData = saveCommitmentLabelsData;
    global.getCommitmentStorageKey = getCommitmentStorageKey;
    global.getCommitmentMonthData = getCommitmentMonthData;
    global.saveCommitmentMonthData = saveCommitmentMonthData;
    global.toggleCommitmentCell = toggleCommitmentCell;
    global.prevCommitmentMonth = prevCommitmentMonth;
    global.nextCommitmentMonth = nextCommitmentMonth;
    global.resetCommitmentMonth = resetCommitmentMonth;
    global.openCommitmentsModal = openCommitmentsModal;
    global.closeCommitmentsModal = closeCommitmentsModal;
    global.resetCommitmentLabelsDefault = resetCommitmentLabelsDefault;
    global.saveCommitmentLabels = saveCommitmentLabels;
    global.renderSpectraCommitmentsChart = renderSpectraCommitmentsChart;
    global.showCommitmentTooltip = showCommitmentTooltip;
    global.hideCommitmentTooltip = hideCommitmentTooltip;
    global.renderPaceCharts = renderPaceCharts;
    global.renderTrendCharts = renderTrendCharts;
    global.toggleDataset = toggleDataset;
    global.toggleSubDataset = toggleSubDataset;
    global.toggleRevSubDataset = toggleRevSubDataset;
    global.updateLegends = updateLegends;
    global.updateRevisionLegends = updateRevisionLegends;
    global.setTrendFilter = setTrendFilter;
    global.renderRevisionTrendChart = renderRevisionTrendChart;
    global.openRevisionTrendModal = openRevisionTrendModal;
    global.openYearlyActionsModal = openYearlyActionsModal;
    global.initAnalyticsEventListeners = initAnalyticsEventListeners;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SpectraAnalytics;
    }
})(typeof window !== 'undefined' ? window : globalThis);
