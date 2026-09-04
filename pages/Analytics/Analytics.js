/**
 * Analytics Page Module (pages/Analytics/Analytics.js)
 * Single Source of Truth for Analytics Page logic and lifecycle.
 */

(function () {
    'use strict';

    function safeEscapeHtml(str) {
        if (window.Utils && typeof window.Utils.escapeHtml === 'function') {
            return window.Utils.escapeHtml(str);
        }
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /* ==========================================================================
       1. Syllabus Chapters Analysis & Filter Dropdown Logic
       ========================================================================== */

    window.selectedSpectraFilters = window.selectedSpectraFilters || ['global'];

    window.populateSpectraFilterDropdown = function () {
        const menu = document.getElementById('spectra-filter-dropdown-menu');
        const btn = document.getElementById('spectra-filter-dropdown-btn');
        if (!menu || !btn) return;

        let html = '';

        // Global option
        const isGlobalChecked = window.selectedSpectraFilters.includes('global');
        html += `
            <label class="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 select-none shrink-0">
                <input type="checkbox" value="global" class="spectra-filter-checkbox rounded text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 h-3.5 w-3.5 transition-all" ${isGlobalChecked ? 'checked' : ''}>
                <span class="font-extrabold uppercase text-[10px] tracking-widest">🌍 Global View</span>
            </label>
            <div class="h-px bg-slate-100 dark:bg-slate-800/60 my-1.5 shrink-0"></div>
        `;

        // Tracks Group
        html += '<div class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1 shrink-0">Tracks</div>';
        if (Array.isArray(window.tracks)) {
            window.tracks.forEach(track => {
                const value = `track:${track.id}`;
                const isChecked = window.selectedSpectraFilters.includes(value);
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
        const allSubjectsList = (typeof window.getAllSubjects === 'function') ? window.getAllSubjects() : [];
        const uniquePrograms = Array.from(new Set(allSubjectsList.map(s => s.program).filter(Boolean)));
        uniquePrograms.forEach(prog => {
            const value = `program:${prog}`;
            const isChecked = window.selectedSpectraFilters.includes(value);
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
                const isChecked = window.selectedSpectraFilters.includes(value);
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
            const isChecked = window.selectedSpectraFilters.includes(value);
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
                btn.querySelector('svg').style.transform = 'rotate(180deg)';
            } else {
                menu.classList.add('hidden');
                btn.querySelector('svg').style.transform = '';
            }
        };

        // Close dropdown on click outside
        document.addEventListener('click', function (e) {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                menu.classList.add('hidden');
                if (btn.querySelector('svg')) {
                    btn.querySelector('svg').style.transform = '';
                }
            }
        });

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
                        cb.checked = true; // Always keep global checked if it was checked and unchecked
                    }
                } else {
                    if (isChecked) {
                        const globalCb = menu.querySelector('input[value="global"]');
                        if (globalCb) globalCb.checked = false;
                    }

                    const syllabusStructure = window.syllabusStructure || {};

                    // Cascade Down:
                    if (val.startsWith('track:')) {
                        const trackId = val.replace('track:', '');
                        const trackSubjects = syllabusStructure[trackId] || [];
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
                                for (const tid in syllabusStructure) {
                                    if (Array.isArray(syllabusStructure[tid]) && syllabusStructure[tid].some(s => s.subject === subName)) {
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
                            for (const tid in syllabusStructure) {
                                if (Array.isArray(syllabusStructure[tid]) && syllabusStructure[tid].some(s => s.program === progName)) {
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

                        if (Array.isArray(window.tracks)) {
                            window.tracks.forEach(track => {
                                const trackSubjects = (syllabusStructure[track.id] || []).map(s => s.subject);
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

                // Re-calculate window.selectedSpectraFilters
                window.selectedSpectraFilters = Array.from(checkboxes)
                    .filter(c => c.checked)
                    .map(c => c.value);

                // Update button label
                window.updateSpectraFilterDropdownLabel();

                // Trigger chart update
                window.renderSpectraCircleChart();
            };
        });

        window.updateSpectraFilterDropdownLabel();
    };

    window.updateSpectraFilterDropdownLabel = function () {
        const labelEl = document.getElementById('spectra-filter-dropdown-label');
        if (!labelEl) return;

        if (window.selectedSpectraFilters.includes('global')) {
            labelEl.textContent = '🌍 Global View';
            return;
        }

        // Collect display names for selected items
        const selectedLabels = window.selectedSpectraFilters.map(f => {
            const parts = f.split(':');
            const type = parts[0];
            const target = parts.slice(1).join(':');
            if (type === 'track') {
                const trackObj = (Array.isArray(window.tracks)) ? window.tracks.find(t => t.id === target) : null;
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
            labelEl.textContent = `${window.selectedSpectraFilters.length} Items Selected`;
        } else {
            labelEl.textContent = combinedText;
        }
    };

    window.onSpectraFilterChange = function (val) {
        window.renderSpectraCircleChart();
    };

    window.showSpectraChapterTooltip = function (event, subject, chapterNum, status) {
        const tooltip = document.getElementById('spectra-gcm-tooltip');
        if (!tooltip) return;

        let statusText = '';
        let statusColor = '';
        if (status === 'complete') {
            statusText = 'Completed';
            statusColor = 'text-emerald-400';
        } else if (status === 'skip') {
            statusText = 'Skipped';
            statusColor = 'text-slate-400';
        } else {
            statusText = 'Incomplete';
            statusColor = 'text-rose-400';
        }

        tooltip.innerHTML = `
            <div class="font-extrabold text-white text-[11px]">${subject}</div>
            <div class="text-[10px] text-slate-400 mt-0.5 font-bold">Chapter ${chapterNum}</div>
            <div class="text-[10px] font-black uppercase mt-1 ${statusColor}">${statusText}</div>
        `;

        tooltip.classList.remove('hidden');

        const pageContainer = document.getElementById('page-spectra-analytics');
        if (pageContainer) {
            const rect = pageContainer.getBoundingClientRect();
            const x = event.clientX - rect.left + 15;
            const y = event.clientY - rect.top + 15;

            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        }
    };

    window.hideSpectraChapterTooltip = function () {
        const tooltip = document.getElementById('spectra-gcm-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    };

    window.renderSpectraCircleChart = function () {
        const dropdownMenu = document.getElementById('spectra-filter-dropdown-menu');
        if (dropdownMenu) {
            const hasTrackOrSubjectElements = dropdownMenu.querySelector('input[value^="track:"], input[value^="subject:"]');
            const hasDataToPopulate = (window.tracks && window.tracks.length > 0) || (window.getAllSubjects && window.getAllSubjects().length > 0);
            if (dropdownMenu.children.length === 0 || (hasDataToPopulate && !hasTrackOrSubjectElements)) {
                window.populateSpectraFilterDropdown();
            }
        }

        const wrapper = document.getElementById('spectra-circle-chart-wrapper');
        if (!wrapper) return;

        const filters = window.selectedSpectraFilters || ['global'];
        if (typeof window.generateGlobalChaptersSVG !== 'function') return;

        const data = window.generateGlobalChaptersSVG(true, filters);
        wrapper.innerHTML = data.html;

        // Dynamic text detail updates
        let title = 'Syllabus Chapters Analysis';
        let desc = 'A visual distribution of all chapters in your study goals. Hover over segments to view subject names, chapter index, and completion statuses.';

        if (filters.length > 0 && !filters.includes('global')) {
            const labels = filters.map(f => {
                const parts = f.split(':');
                const type = parts[0];
                const target = parts.slice(1).join(':');
                if (type === 'track') {
                    const trackObj = (Array.isArray(window.tracks)) ? window.tracks.find(t => t.id === target) : null;
                    return trackObj ? trackObj.name : target.toUpperCase();
                }
                return target;
            });
            title = `Selected Chapters Analysis`;
            desc = `A visual distribution of all chapters matching the selected filters: ${labels.join(', ')}. Hover over segments to view details.`;
        }

        if (typeof safeSetText === 'function') {
            safeSetText('spectra-analysis-title', title);
            safeSetText('spectra-analysis-desc', desc);
        } else {
            const tEl = document.getElementById('spectra-analysis-title');
            if (tEl) tEl.textContent = title;
            const dEl = document.getElementById('spectra-analysis-desc');
            if (dEl) dEl.textContent = desc;
        }

        const legendComplete = document.getElementById('spectra-legend-complete');
        const legendIncomplete = document.getElementById('spectra-legend-incomplete');
        const legendSkipped = document.getElementById('spectra-legend-skipped');

        if (legendComplete) legendComplete.textContent = data.completedCount;
        if (legendIncomplete) legendIncomplete.textContent = data.incompleteCount;
        if (legendSkipped) legendSkipped.textContent = data.skippedCount;
    };


    /* ==========================================================================
       2. The 7 Officer Commitments Habit Radar Logic
       ========================================================================== */

    window.getCommitmentLabels = function () {
        if (Array.isArray(window.customActions) && window.customActions.length > 0) {
            const sorted = [...window.customActions].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999));
            return sorted.map(a => (a.title || a.name || '').toUpperCase());
        }
        return [];
    };

    window.saveCommitmentLabelsData = function (labels) {
        // Memory-only mode
    };

    window.getCommitmentStorageKey = function (dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        return `spectra_commitments_${y}-${m}`;
    };

    window.getCommitmentMonthData = function (dateObj) {
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const result = {};

        let sortedActions = Array.isArray(window.customActions) && window.customActions.length > 0
            ? [...window.customActions].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999))
            : [];

        for (let d = 1; d <= daysInMonth; d++) {
            const dayKey = String(d);
            const cellDate = new Date(y, m, d);
            const task = (typeof window.getTaskForDate === 'function') ? window.getTaskForDate(cellDate) : null;

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
    };

    window.saveCommitmentMonthData = function (dateObj, data) {
        // Memory-only mode
    };

    window.toggleCommitmentCell = function (dayNum, habitIndex) {
        const activeDate = window.spectraCommitmentActiveDate || new Date();
        const y = activeDate.getFullYear();
        const m = activeDate.getMonth();
        const cellDate = new Date(y, m, dayNum);

        if (!Array.isArray(window.customActions)) {
            window.customActions = [];
        }

        let sortedActions = [...window.customActions].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999));
        
        if (!sortedActions[habitIndex]) {
            return;
        }

        const targetAction = sortedActions[habitIndex];
        const today = new Date();
        const isToday = (today.getFullYear() === y && today.getMonth() === m && today.getDate() === dayNum);

        if (isToday) {
            // Delegate to setDailyState for 100% unified multi-interface synchronization:
            if (typeof window.setDailyState === 'function') {
                window.setDailyState(targetAction.id);
            }
            return;
        }

        // Historical / other day toggle
        let task = (typeof window.getTaskForDate === 'function') ? window.getTaskForDate(cellDate) : null;
        const dFormatted = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function')
            ? Utils.formatDate(cellDate)
            : null;
        const dISO = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

        if (!task) {
            task = {
                id: 'task_' + dISO + '_' + Date.now().toString(36),
                date: dFormatted || dISO,
                note: '',
                updatedAt: Date.now() + (window.serverTimeOffset || 0)
            };
            window.customActions.forEach(a => { task[a.id] = false; });
            if (typeof AppState !== 'undefined' && Array.isArray(AppState.tasks)) {
                AppState.tasks.push(task);
            }
        }

        const newState = !Boolean(task[targetAction.id]);
        task[targetAction.id] = newState;
        task.updatedAt = Date.now() + (window.serverTimeOffset || 0);

        if (typeof AppState !== 'undefined') {
            AppState.isLocalDirty = true;
            if (AppState._tasksDateMap) {
                if (task.date) AppState._tasksDateMap.set(task.date, task);
                AppState._tasksDateMap.set(dISO, task);
                if (dFormatted) AppState._tasksDateMap.set(dFormatted, task);
                if (task.id) AppState._tasksDateMap.set(String(task.id), task);
            }
        }

        // Fast synchronous targeted updates
        if (typeof window.renderSpectraCommitmentsChart === 'function') {
            window.renderSpectraCommitmentsChart();
        }
        if (typeof window.renderDailyLogs === 'function') {
            window.renderDailyLogs();
        }
        const dbModal = document.getElementById('daily-actions-db-modal');
        if (dbModal && !dbModal.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') {
            window.openDailyActionsDBModal();
        }

        // Broadcast to other open browser tabs
        if (window.X29SyncChannel) {
            try {
                window.X29SyncChannel.postMessage({
                    type: 'DAILY_ACTION_UPDATE',
                    actionId: targetAction.id,
                    dateStr: dFormatted || dISO,
                    newState: newState,
                    timestamp: Date.now()
                });
            } catch (e) {}
        }

        // Cloud Save
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud(false);
        }

        // Debounce non-critical heavy chart updates
        if (window.commitmentClickDebounce) clearTimeout(window.commitmentClickDebounce);
        window.commitmentClickDebounce = setTimeout(() => {
            if (typeof renderTrendCharts === 'function') requestAnimationFrame(renderTrendCharts);
            if (typeof updateMetrics === 'function') updateMetrics();
            const modal = document.getElementById('daily-actions-db-modal');
            if (modal && !modal.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') {
                window.openDailyActionsDBModal();
            }
        }, 200);
    };

    window.prevCommitmentMonth = function () {
        if (!window.spectraCommitmentActiveDate) window.spectraCommitmentActiveDate = new Date();
        window.spectraCommitmentActiveDate.setMonth(window.spectraCommitmentActiveDate.getMonth() - 1);
        window.renderSpectraCommitmentsChart();
    };

    window.nextCommitmentMonth = function () {
        if (!window.spectraCommitmentActiveDate) window.spectraCommitmentActiveDate = new Date();
        window.spectraCommitmentActiveDate.setMonth(window.spectraCommitmentActiveDate.getMonth() + 1);
        window.renderSpectraCommitmentsChart();
    };

    window.resetCommitmentMonth = function () {
        window.spectraCommitmentActiveDate = new Date();
        window.renderSpectraCommitmentsChart();
    };

    window.openCommitmentsModal = function () {
        const modal = document.getElementById('spectra-commitments-modal');
        const container = document.getElementById('spectra-commitments-inputs-container');
        if (!modal || !container) return;
        const labels = window.getCommitmentLabels();
        container.innerHTML = labels.map((label, idx) => `
            <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">${idx + 1}</span>
                <input type="text" id="spectra-commitment-input-${idx}" value="${safeEscapeHtml(label)}" class="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all shadow-inner" placeholder="Commitment ${idx + 1}" />
            </div>
        `).join('');
        modal.classList.remove('hidden');
    };

    window.closeCommitmentsModal = function () {
        const modal = document.getElementById('spectra-commitments-modal');
        if (modal) modal.classList.add('hidden');
    };

    window.resetCommitmentLabelsDefault = function () {
        const defaultLabels = window.DEFAULT_COMMITMENT_LABELS || ['Action 1', 'Action 2', 'Action 3', 'Action 4', 'Action 5', 'Action 6', 'Action 7'];
        defaultLabels.forEach((label, idx) => {
            const inp = document.getElementById(`spectra-commitment-input-${idx}`);
            if (inp) inp.value = label;
        });
    };

    window.saveCommitmentLabels = function () {
        if (!Array.isArray(window.customActions)) {
            window.customActions = [];
        }

        const sorted = [...window.customActions].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999));
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

        window.saveCommitmentLabelsData(newLabels);
        window.closeCommitmentsModal();

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        if (typeof renderUI === 'function') {
            renderUI();
        } else {
            window.renderSpectraCommitmentsChart();
        }
    };

    window.renderSpectraCommitmentsChart = function () {
        const wrapper = document.getElementById('spectra-commitments-chart-wrapper');
        if (!wrapper) return;

        const activeDate = window.spectraCommitmentActiveDate || new Date();
        const year = activeDate.getFullYear();
        const month = activeDate.getMonth();
        const monthName = activeDate.toLocaleString('default', { month: 'long' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Update month label header
        const monthLabel = document.getElementById('spectra-commitments-month-label');
        if (monthLabel) monthLabel.textContent = `${monthName} ${year}`;

        const labels = window.getCommitmentLabels();
        const numHabits = labels.length;

        const setVal = (id, txt) => {
            if (typeof safeSetText === 'function') safeSetText(id, txt);
            else {
                const el = document.getElementById(id);
                if (el) el.textContent = txt;
            }
        };

        if (numHabits === 0) {
            setVal('spectra-commitments-pct', `0%`);
            setVal('spectra-commitments-count', `0 / 0`);
            setVal('spectra-commitments-streak', `0 Days 🔥`);
            setVal('spectra-commitments-days-logged', `0 Days`);

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

        const monthData = window.getCommitmentMonthData(activeDate);

        // Stats calculations
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

        // Calculate streak
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

        // Update summary UI text elements safely
        setVal('spectra-commitments-pct', `${pct}%`);
        setVal('spectra-commitments-count', `${fulfilledCount} / ${totalCells}`);
        setVal('spectra-commitments-streak', `${currentStreak} Days 🔥`);
        setVal('spectra-commitments-days-logged', `${daysLoggedSet.size} Days`);

        // SVG Geometry Parameters
        const width = 580;
        const height = 450;
        const cx = 350;
        const cy = 225;

        const rOuter = 195;
        const rInner = 68;
        const ringStep = (rOuter - rInner) / numHabits;

        // 270 degree arc: From 12 o'clock (-90 deg) clockwise to 9 o'clock (180 deg)
        const startAngleDeg = -90;
        const totalAngleDeg = 270;
        const angleStepDeg = totalAngleDeg / daysInMonth;

        let svgPaths = '';

        // Theme-aware site colors
        const isDarkMode = (document.documentElement && document.documentElement.classList && document.documentElement.classList.contains('dark')) ||
            (document.body && document.body.classList && document.body.classList.contains('dark')) ||
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

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

        // Generate Polar Grid Cells
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

        // Generate Left-Side Horizontal Leader Lines & Label Text
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
                <g id="commitment-grid-cells">
                    ${svgPaths}
                </g>
                <g id="commitment-leader-lines">
                    ${leaderLinesSvg}
                </g>
                <g id="commitment-edge-days">
                    ${edgeDaysSvg}
                </g>
                <g id="commitment-center-hub">
                    ${centerHubSvg}
                </g>
            </svg>
        `;
    };

    window.showCommitmentTooltip = function (event, habitName, dayNum, formattedDate, isCompleted) {
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
    };

    window.hideCommitmentTooltip = function () {
        const tooltip = document.getElementById('spectra-commitments-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    };

    /* ==========================================================================
       3. Trend Time Filter (1Y / 2Y / 3Y / ALL) Helper
       ========================================================================== */

    window.setTrendFilter = function (f) {
        window.trendTimeFilter = f;
        if (typeof renderTrendCharts === 'function') renderTrendCharts();
        if (window.revisionTrendChartInstance && typeof window.renderRevisionTrendChart === 'function') {
            window.renderRevisionTrendChart();
        }
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
    };

    /* ==========================================================================
       4. Canonical AnalyticsPage Lifecycle Object
       ========================================================================== */

    window.AnalyticsPage = {
        isMounted: false,
        init: function () {
            this.mount();
        },
        mount: function () {
            this.isMounted = true;
            this.render();
        },
        render: function () {
            const pageEl = document.getElementById('page-spectra-analytics');
            if (!pageEl) return;

            // 1. Chapters Breakdown circle chart
            if (typeof window.renderSpectraCircleChart === 'function') {
                window.renderSpectraCircleChart();
            }

            // 2. Commitments Habit Radar chart
            if (typeof window.renderSpectraCommitmentsChart === 'function') {
                window.renderSpectraCommitmentsChart();
            }

            // 3. Program Completion & Daily Actions Trend charts and Stat cards
            if (typeof window.renderTrendCharts === 'function') {
                window.renderTrendCharts();
            }

            // 4. Pacing Trend charts (X Bar and Global Scope burn-up)
            if (typeof window.renderPaceCharts === 'function') {
                window.renderPaceCharts();
            }

            // 5. Focus Analytics line/bar/combo chart
            if (typeof window.updateTimerAnalyticsControls === 'function') {
                window.updateTimerAnalyticsControls();
            }
            if (typeof window.renderTimerAnalyticsChart === 'function') {
                window.renderTimerAnalyticsChart(true);
            }

            // 6. Focus Matrix GitHub Box Heatmap
            if (typeof window.setSpectraHeatmapRangeUI === 'function') {
                window.setSpectraHeatmapRangeUI(window.spectraHeatmapRange || 365);
            } else if (typeof window.renderSpectraFocusHeatmap === 'function') {
                window.renderSpectraFocusHeatmap();
            }

            // 7. Ensure charts are resized properly
            this.resizeCharts();
        },
        resizeCharts: function () {
            const resizeFn = () => {
                const charts = [
                    window.mainChartPrograms,
                    window.monthlyChartActions,
                    window.spectraPaceTrendChartInstance,
                    window.globalPaceTrendChartInstance,
                    window.spectraFocusAnalyticsChartInstance
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
            if (typeof window.hideSpectraChapterTooltip === 'function') window.hideSpectraChapterTooltip();
            if (typeof window.hideCommitmentTooltip === 'function') window.hideCommitmentTooltip();
        }
    };

    // Auto-init if DOM is already loaded and page container is present & visible
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-spectra-analytics');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.AnalyticsPage.init();
        }
    }
})();
