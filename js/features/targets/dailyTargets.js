/**
 * X-29 Feature Module: Daily Targets & DTDB System (dailyTargets.js)
 *
 * Responsibilities:
 * 1. Daily Targets Management:
 *    - Add, edit, delete daily target chapters.
 *    - Active day checklist renderer (renderDailyTargets) with subject colors & badge styling.
 *    - Cascading dropdowns (Program -> Subject -> Chapter) & weekly target preselection.
 *    - Day navigation (past, present, future) with active indicators.
 * 2. Custom Todos:
 *    - Tab switching (Custom Task vs Study Target).
 *    - Add, edit, delete, and toggle custom to-dos in daily targets list.
 * 3. Daily Targets Database (DTDB):
 *    - Open DTDB modal and populate multi-criteria filters.
 *    - Filterable table view of all daily targets across past, present, and future dates.
 *    - Inline target size adjustment and live weekly progress cascading.
 *    - DTDB item deletion and edit modal routing.
 * 4. Completion Controls & Synchronization:
 *    - Toggle completion on daily targets and DTDB rows.
 *    - Bi-directional sync with Weekly Targets (including page/question size progress).
 *    - Synchronization with Daily Study Tasks (syncTaskChapterCompletion).
 *    - Weekly -> Daily automatic synchronization (autoSyncWeeklyToDailyTargets).
 *
 * State:
 * - Strictly preserves `dailyTargetsDatabase` data model and state structure.
 */

(function (global) {
    'use strict';

    // Safe helper fallbacks
    function safeShowToast(msg, type) {
        if (typeof global.showToast === 'function') {
            global.showToast(msg, type);
        } else if (typeof console !== 'undefined') {
            console.log(`[Toast ${type || 'info'}]: ${msg}`);
        }
    }

    function safeRenderUI() {
        if (typeof global.renderUI === 'function') {
            global.renderUI();
        }
    }

    function safeCloseModal(id) {
        if (typeof global.closeModal === 'function') {
            global.closeModal(id);
        }
    }

    function safeOpenModal(id) {
        if (typeof global.openModal === 'function') {
            global.openModal(id);
        }
    }

    function safeRecalculateTotals() {
        if (typeof global.recalculateTotals === 'function') {
            global.recalculateTotals();
        }
    }

    function safeSaveToCloud(immediate = false) {
        if (global.FirebaseService && typeof global.FirebaseService.saveToCloud === 'function') {
            global.FirebaseService.saveToCloud(immediate);
        }
    }

    function safeFormatDate(d) {
        if (global.Utils && typeof global.Utils.formatDate === 'function') {
            return global.Utils.formatDate(d);
        }
        if (!d) d = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    }

    function safeParseDailyTargetDateKey(dateKey) {
        if (typeof global.parseDailyTargetDateKey === 'function') {
            return global.parseDailyTargetDateKey(dateKey);
        }
        if (!dateKey) return new Date();
        if (dateKey.includes(',') || dateKey.split(' ').length > 2) {
            return new Date(dateKey);
        }
        const currentYear = new Date().getFullYear();
        const d = new Date(dateKey + ' ' + currentYear + ' 12:00:00');
        if (isNaN(d.getTime())) return new Date();
        return d;
    }

    /* ==========================================================================
       1. Daily Targets Dropdown & Color Sync Helpers
       ========================================================================== */

    function updateDailyTargetColorSync() {
        if (typeof document === 'undefined') return;
        const subSelect = document.getElementById('dt-select-sub');
        const chSelect = document.getElementById('dt-select-ch');
        const dot = document.getElementById('dt-sub-color-dot');
        if (!subSelect) return;
        const subject = subSelect.value;
        if (subject && subject !== "No Subjects") {
            const color = global.getSubjectColor ? global.getSubjectColor(subject) : '#3b82f6';
            if (dot) {
                dot.style.backgroundColor = color;
                dot.classList.remove('hidden');
            }
            subSelect.style.borderColor = color;
            if (chSelect) chSelect.style.borderColor = color;
        } else {
            if (dot) dot.classList.add('hidden');
            subSelect.style.borderColor = '';
            if (chSelect) chSelect.style.borderColor = '';
        }
    }

    function updateDailyTargetSubjectDropdown() {
        if (typeof document === 'undefined') return;
        const progSelectEl = document.getElementById('dt-select-prog');
        const progName = progSelectEl ? progSelectEl.value : '';
        const subSelect = document.getElementById('dt-select-sub');
        if (!subSelect) return;
        subSelect.innerHTML = '';

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId) {
            subSelect.innerHTML = '<option value="">No Subjects</option>';
            updateDailyTargetChapterDropdown();
            return;
        }

        const syllabus = global.syllabusStructure || {};
        const subs = (syllabus[trackId] || []).filter(s => s.program === progName);
        if (subs.length === 0) {
            subSelect.innerHTML = '<option value="">No Subjects</option>';
        } else {
            const passedItems = global.passedItems || (global.AppState && global.AppState.passedItems) || { programs: [], subjects: [] };
            subs.forEach(s => {
                const isPassed = Boolean(
                    (Array.isArray(passedItems.subjects) && passedItems.subjects.includes(s.subject)) ||
                    (Array.isArray(passedItems.programs) && passedItems.programs.includes(s.program || progName))
                );
                const label = isPassed ? `🏆 ${s.subject} (Passed)` : s.subject;
                subSelect.innerHTML += `<option value="${s.subject}">${label}</option>`;
            });
        }
        updateDailyTargetChapterDropdown();
        updateDailyTargetColorSync();
    }

    function updateDailyTargetChapterDropdown() {
        if (typeof document === 'undefined') return;
        const progSelectEl = document.getElementById('dt-select-prog');
        const progName = progSelectEl ? progSelectEl.value : '';
        const subSelectEl = document.getElementById('dt-select-sub');
        const subject = subSelectEl ? subSelectEl.value : '';
        const chSelect = document.getElementById('dt-select-ch');
        if (!chSelect) return;
        chSelect.innerHTML = '';

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId || !subject) {
            chSelect.innerHTML = '<option value="">No Chapters</option>';
            handleDailyTargetChapterChange();
            updateDailyTargetColorSync();
            return;
        }

        const chapters = typeof global.getChaptersForSubject === 'function'
            ? global.getChaptersForSubject(trackId, subject)
            : [];
        if (chapters.length === 0) {
            chSelect.innerHTML = '<option value="">No Chapters</option>';
        } else {
            chapters.forEach(ch => {
                chSelect.innerHTML += `<option value="${ch}">${ch}</option>`;
            });
        }
        handleDailyTargetChapterChange();
        updateDailyTargetColorSync();
    }

    function handleDailyTargetChapterChange() {
        if (typeof document === 'undefined') return;
        const progSelectEl = document.getElementById('dt-select-prog');
        const progName = progSelectEl ? progSelectEl.value : '';
        const subSelectEl = document.getElementById('dt-select-sub');
        const subject = subSelectEl ? subSelectEl.value : '';
        const chSelect = document.getElementById('dt-select-ch');
        const chapter = chSelect ? chSelect.value : '';

        if (!progName || !subject || !chapter) return;

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId) return;

        let currentWeekKey = null;
        if (typeof global.getWeeklyTargetRange === 'function' && typeof global.formatDateRangeKey === 'function') {
            const currentRange = global.getWeeklyTargetRange(global.currentDailyTargetsDate || new Date());
            currentWeekKey = global.formatDateRangeKey(currentRange.start, currentRange.end);
        }

        const wtList = (global.weeklyTargetsDatabase && currentWeekKey && global.weeklyTargetsDatabase[currentWeekKey]) || [];
        const matchingWt = wtList.find(t => t.track === trackId && t.subject === subject && t.chapter === chapter);

        const sizeInput = document.getElementById('dt-input-size');
        const totalSizeInput = document.getElementById('dt-input-total-size');

        if (matchingWt && matchingWt.totalChapterSize !== undefined && matchingWt.totalChapterSize !== null) {
            if (totalSizeInput) {
                totalSizeInput.value = matchingWt.totalChapterSize;
                totalSizeInput.disabled = true;
                totalSizeInput.classList.add('bg-slate-100', 'dark:bg-slate-800/80', 'cursor-not-allowed', 'opacity-70');
            }
            if (sizeInput) {
                const allocatedSize = typeof global.getAllocatedSizeForWeeklyTarget === 'function'
                    ? global.getAllocatedSizeForWeeklyTarget(matchingWt, currentWeekKey)
                    : 0;
                const remainingSize = Math.max(0, matchingWt.totalChapterSize - allocatedSize);
                sizeInput.value = remainingSize;
            }
        } else {
            if (totalSizeInput) {
                totalSizeInput.value = '';
                totalSizeInput.disabled = false;
                totalSizeInput.classList.remove('bg-slate-100', 'dark:bg-slate-800/80', 'cursor-not-allowed', 'opacity-70');
            }
            if (sizeInput) {
                sizeInput.value = '';
            }
        }
    }

    function handleSelectFromWeeklyTargetChange() {
        if (typeof document === 'undefined') return;
        const selectEl = document.getElementById('dt-select-from-wt');
        if (!selectEl || !selectEl.value) return;

        const [trackId, progName, subject, chapter] = selectEl.value.split('|');

        // Select program
        const progSelect = document.getElementById('dt-select-prog');
        if (progSelect) {
            progSelect.value = progName;
            updateDailyTargetSubjectDropdown();
        }

        // Select subject
        const subSelect = document.getElementById('dt-select-sub');
        if (subSelect) {
            subSelect.value = subject;
            updateDailyTargetChapterDropdown();
        }

        // Select chapter
        const chSelect = document.getElementById('dt-select-ch');
        if (chSelect) {
            chSelect.value = chapter;
        }

        handleDailyTargetChapterChange();
        updateDailyTargetColorSync();
    }

    /* ==========================================================================
       2. Custom Todos
       ========================================================================= */

    function switchAdtTab(tab) {
        if (typeof document === 'undefined') return;
        const btnTodo = document.getElementById('adt-tab-btn-todo');
        const btnStudy = document.getElementById('adt-tab-btn-study');
        const viewTodo = document.getElementById('adt-view-todo');
        const viewStudy = document.getElementById('adt-view-study');

        if (!btnTodo || !btnStudy || !viewTodo || !viewStudy) return;

        if (tab === 'todo') {
            btnTodo.className = "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all bg-blue-600 text-white shadow";
            btnStudy.className = "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all text-slate-500 dark:text-slate-400";
            viewTodo.classList.remove('hidden');
            viewStudy.classList.add('hidden');
        } else {
            btnStudy.className = "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all bg-blue-600 text-white shadow";
            btnTodo.className = "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all text-slate-500 dark:text-slate-400";
            viewStudy.classList.remove('hidden');
            viewTodo.classList.add('hidden');
        }
    }

    function addCustomTodoTarget() {
        if (typeof document === 'undefined') return;
        const titleInput = document.getElementById('adt-todo-title');
        const trackInput = document.getElementById('adt-todo-track');
        const title = titleInput ? titleInput.value.trim() : '';
        const track = trackInput ? trackInput.value : '';

        if (!title) return safeShowToast("Please enter a task title.", "error");

        if (!global.currentDailyTargetsDate) global.currentDailyTargetsDate = new Date();
        const targetDateKey = safeFormatDate(global.currentDailyTargetsDate);

        if (!global.dailyTargetsDatabase) global.dailyTargetsDatabase = {};
        if (!global.dailyTargetsDatabase[targetDateKey]) global.dailyTargetsDatabase[targetDateKey] = [];

        global.dailyTargetsDatabase[targetDateKey].push({
            id: `dt_todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isTodo: true,
            title: title,
            track: track || null,
            completed: false,
            completedAt: null,
            updatedAt: Date.now()
        });

        if (titleInput) titleInput.value = '';
        if (trackInput) trackInput.value = '';

        if (typeof global.markLocalMutation === 'function') {
            global.markLocalMutation('add_custom_todo_target');
        }

        safeSaveToCloud(false);
        safeRenderUI();
        safeCloseModal('add-daily-target-modal');
        safeShowToast("Custom to-do task added!", "success");
    }

    /* ==========================================================================
       3. Daily Targets Management (Add, Edit, Delete, Save)
       ========================================================================== */

    function openAddDailyTargetModal() {
        safeShowToast("Weekly and Daily targets are set and managed from Add Monthly Target page.", "info");
        if (typeof global.switchPage === 'function') {
            global.switchPage('monthly-target-setup');
        }
    }

    function addDailyTarget() {
        if (typeof document === 'undefined') return;
        if (!global.currentDailyTargetsDate) global.currentDailyTargetsDate = new Date();
        const targetDateKey = safeFormatDate(global.currentDailyTargetsDate);

        const progSelectEl = document.getElementById('dt-select-prog');
        const subSelectEl = document.getElementById('dt-select-sub');
        const chSelectEl = document.getElementById('dt-select-ch');
        const sizeEl = document.getElementById('dt-input-size');
        const totalSizeEl = document.getElementById('dt-input-total-size');

        const progName = progSelectEl ? progSelectEl.value : '';
        const subject = subSelectEl ? subSelectEl.value : '';
        const chapter = chSelectEl ? chSelectEl.value : '';
        const dailySize = sizeEl && sizeEl.value ? parseInt(sizeEl.value, 10) : null;
        const newTotalSize = totalSizeEl && totalSizeEl.value ? parseInt(totalSizeEl.value, 10) : null;

        if (!progName || !subject || !chapter) {
            return safeShowToast("Please select a Program, Subject, and Chapter.", "error");
        }

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId) return;

        if (!global.dailyTargetsDatabase) global.dailyTargetsDatabase = {};
        if (!global.dailyTargetsDatabase[targetDateKey]) global.dailyTargetsDatabase[targetDateKey] = [];

        // Sync baseline completion status
        let isCompletedBefore = false;
        let completedAtBefore = null;

        let currentWeekKey = null;
        if (typeof global.getWeeklyTargetRange === 'function' && typeof global.formatDateRangeKey === 'function') {
            const currentRange = global.getWeeklyTargetRange(global.currentDailyTargetsDate);
            currentWeekKey = global.formatDateRangeKey(currentRange.start, currentRange.end);
        }

        const wtList = (global.weeklyTargetsDatabase && currentWeekKey && global.weeklyTargetsDatabase[currentWeekKey]) || [];
        const matchingWt = wtList.find(t => t.track === trackId && t.subject === subject && t.chapter === chapter);
        if (matchingWt) {
            isCompletedBefore = matchingWt.completed || false;
            completedAtBefore = matchingWt.completedAt || null;
        } else if (typeof global.findTaskChapter === 'function') {
            const foundTask = global.findTaskChapter(trackId, subject, chapter);
            if (foundTask && foundTask.subTask) {
                isCompletedBefore = foundTask.subTask.completed || false;
                completedAtBefore = foundTask.subTask.completedAt || null;
            }
        }

        // Check if already exists in daily targets database for selected date
        if (!matchingWt || !matchingWt.totalChapterSize) {
            const exists = global.dailyTargetsDatabase[targetDateKey].some(t => !t.isDeleted && t.track === trackId && t.subject === subject && t.chapter === chapter);
            if (exists) {
                return safeShowToast("This target is already in your daily target list.", "error");
            }
        } else {
            // If it is size-based, check if the weekly target is already fully allocated.
            const allocatedSize = typeof global.getAllocatedSizeForWeeklyTarget === 'function'
                ? global.getAllocatedSizeForWeeklyTarget(matchingWt, currentWeekKey)
                : 0;
            const remainingSize = Math.max(0, matchingWt.totalChapterSize - allocatedSize);
            if (remainingSize <= 0) {
                return safeShowToast("This chapter is already fully allocated across daily targets.", "error");
            }
            if (dailySize !== null && dailySize > remainingSize) {
                return safeShowToast(`Daily target size (${dailySize} p) exceeds the remaining unallocated size (${remainingSize} p).`, "error");
            }
        }

        // Auto-create / sync with Weekly Target
        if (currentWeekKey) {
            if (!global.weeklyTargetsDatabase) global.weeklyTargetsDatabase = {};
            if (!global.weeklyTargetsDatabase[currentWeekKey]) global.weeklyTargetsDatabase[currentWeekKey] = [];

            let matchingWtObj = matchingWt;
            if (matchingWtObj) {
                if (newTotalSize !== null) {
                    matchingWtObj.totalChapterSize = newTotalSize;
                }
            } else if (newTotalSize !== null) {
                matchingWtObj = {
                    track: trackId,
                    program: progName,
                    subject: subject,
                    chapter: chapter,
                    completed: isCompletedBefore,
                    completedAt: completedAtBefore,
                    dayName: null,
                    scope: 'Whole Chapter',
                    totalChapterSize: newTotalSize
                };
                global.weeklyTargetsDatabase[currentWeekKey].push(matchingWtObj);
            }
        }

        const existingDeleted = global.dailyTargetsDatabase[targetDateKey].find(t => t.isDeleted && t.track === trackId && t.subject === subject && t.chapter === chapter);
        if (existingDeleted) {
            delete existingDeleted.isDeleted;
            existingDeleted.completed = isCompletedBefore;
            existingDeleted.completedAt = completedAtBefore;
            existingDeleted.totalChapterSize = dailySize;
            existingDeleted.scope = 'Whole Chapter';
            existingDeleted.updatedAt = Date.now();
            if (!existingDeleted.id) existingDeleted.id = `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        } else {
            global.dailyTargetsDatabase[targetDateKey].push({
                id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                track: trackId,
                program: progName,
                subject: subject,
                chapter: chapter,
                completed: isCompletedBefore,
                completedAt: completedAtBefore,
                totalChapterSize: dailySize,
                scope: 'Whole Chapter',
                updatedAt: Date.now()
            });
        }

        if (sizeEl) sizeEl.value = '';
        if (totalSizeEl) totalSizeEl.value = '';

        if (typeof global.markLocalMutation === 'function') {
            global.markLocalMutation('add_daily_target');
        }

        safeSaveToCloud(false);
        safeRenderUI();
        safeCloseModal('add-daily-target-modal');
        safeShowToast("Daily target chapter added!", "success");
    }

    function openEditDailyTargetModal(idx, dateKey = null) {
        if (!dateKey) {
            if (!global.currentDailyTargetsDate) global.currentDailyTargetsDate = new Date();
            dateKey = safeFormatDate(global.currentDailyTargetsDate);
        }
        if (!global.dailyTargetsDatabase || !global.dailyTargetsDatabase[dateKey] || !global.dailyTargetsDatabase[dateKey][idx]) {
            if (typeof global.switchPage === 'function') global.switchPage('monthly-target-setup');
            return;
        }

        const target = global.dailyTargetsDatabase[dateKey][idx];
        if (target.isTodo) {
            if (typeof global.openEditDailyActionModal === 'function') {
                global.openEditDailyActionModal(idx);
            }
            return;
        }

        let foundMonth = null;
        let foundIdx = -1;
        const matchFn = global.isChapterMatch || (global.Utils && global.Utils.isChapterMatch);
        if (global.monthlyTargetsDatabase) {
            for (const mKey of Object.keys(global.monthlyTargetsDatabase)) {
                const mList = global.monthlyTargetsDatabase[mKey] || [];
                const idxInM = mList.findIndex(mt => {
                    if (target.monthlyTargetId && mt.id === target.monthlyTargetId) return true;
                    const subMatch = String(mt.subject || '').trim().toLowerCase() === String(target.subject || '').trim().toLowerCase();
                    if (!subMatch) return false;
                    if (target.track && mt.track && target.track !== mt.track) return false;
                    const mtIsSubject = mt.targetType === 'subject' || mt.chapter === 'Whole Subject' || mt.chapter === 'All Chapters';
                    const isSubject = target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters';
                    return isSubject ? mtIsSubject : (!mtIsSubject && (matchFn ? matchFn(mt.chapter, target.chapter) : String(mt.chapter).trim().toLowerCase() === String(target.chapter).trim().toLowerCase()));
                });
                if (idxInM !== -1) {
                    foundMonth = mKey;
                    foundIdx = idxInM;
                    break;
                }
            }
        }
        if (foundMonth && foundIdx !== -1) {
            safeShowToast("Opening Monthly Target Setup to edit this target...", "info");
            if (typeof global.openEditMonthlyTargetPage === 'function') {
                global.openEditMonthlyTargetPage(foundIdx, foundMonth);
            }
        } else {
            safeShowToast("Weekly and Daily targets are set and managed from Add Monthly Target page.", "info");
            if (typeof global.switchPage === 'function') {
                global.switchPage('monthly-target-setup');
            }
        }
    }

    function openEditDailyTargetModalFromDtdb(dateKey, idx) {
        safeCloseModal('daily-targets-db-modal');
        setTimeout(() => {
            openEditDailyTargetModal(idx, dateKey);
        }, 350);
    }

    function saveDailyTarget(idx, dateKey = null) {
        if (!dateKey) {
            if (!global.currentDailyTargetsDate) global.currentDailyTargetsDate = new Date();
            dateKey = safeFormatDate(global.currentDailyTargetsDate);
        }
        if (!global.dailyTargetsDatabase || !global.dailyTargetsDatabase[dateKey] || !global.dailyTargetsDatabase[dateKey][idx]) return;

        const target = global.dailyTargetsDatabase[dateKey][idx];
        const btnTodo = typeof document !== 'undefined' ? document.getElementById('adt-tab-btn-todo') : null;
        const isTodoTab = btnTodo && btnTodo.classList.contains('bg-blue-600');

        if (isTodoTab) {
            const titleInput = document.getElementById('adt-todo-title');
            const trackSelect = document.getElementById('adt-todo-track');
            const title = titleInput ? titleInput.value.trim() : '';
            const trackVal = trackSelect ? trackSelect.value : '';

            if (!title) {
                return safeShowToast("Please enter a task title.", "error");
            }

            target.isTodo = true;
            target.title = title;
            target.track = trackVal || null;
        } else {
            const progSelectEl = document.getElementById('dt-select-prog');
            const subSelectEl = document.getElementById('dt-select-sub');
            const chSelectEl = document.getElementById('dt-select-ch');
            const sizeEl = document.getElementById('dt-input-size');

            const progName = progSelectEl ? progSelectEl.value : '';
            const subject = subSelectEl ? subSelectEl.value : '';
            const chapter = chSelectEl ? chSelectEl.value : '';
            const dailySize = sizeEl && sizeEl.value ? parseInt(sizeEl.value, 10) : null;

            if (!progName || !subject || !chapter) {
                return safeShowToast("Please select a Program, Subject, and Chapter.", "error");
            }

            const tracks = global.tracks || [];
            const customPrograms = global.customPrograms || {};
            const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
            if (!trackId) return;

            const exists = global.dailyTargetsDatabase[dateKey].some((t, i) => i !== idx && !t.isDeleted && t.track === trackId && t.subject === subject && t.chapter === chapter);
            if (exists) {
                return safeShowToast("This target is already in your daily target list.", "error");
            }

            target.isTodo = false;
            target.track = trackId;
            target.program = progName;
            target.subject = subject;
            target.chapter = chapter;
            target.totalChapterSize = dailySize;
        }

        safeSaveToCloud(false);
        safeRenderUI();
        safeCloseModal('add-daily-target-modal');
        safeShowToast("Daily target updated!", "success");
    }

    function deleteDailyTarget(idx, targetId = null) {
        if (!global.currentDailyTargetsDate) global.currentDailyTargetsDate = new Date();
        const selectedDateKey = safeFormatDate(global.currentDailyTargetsDate);

        let target = null;
        let actualDateKey = selectedDateKey;
        let actualIdx = idx;

        if (global.dailyTargetsDatabase && global.dailyTargetsDatabase[selectedDateKey] && global.dailyTargetsDatabase[selectedDateKey][idx]) {
            target = global.dailyTargetsDatabase[selectedDateKey][idx];
        } else if (targetId && global.dailyTargetsDatabase) {
            for (const dk of Object.keys(global.dailyTargetsDatabase)) {
                const foundIdx = (global.dailyTargetsDatabase[dk] || []).findIndex(t => t && (t.id === targetId || t._id === targetId));
                if (foundIdx !== -1) {
                    target = global.dailyTargetsDatabase[dk][foundIdx];
                    actualDateKey = dk;
                    actualIdx = foundIdx;
                    break;
                }
            }
        }

        if (!target) {
            safeShowToast("Opening Monthly Target Setup...", "info");
            if (typeof global.switchPage === 'function') global.switchPage('monthly-target-setup');
            return;
        }

        if (target.isTodo) {
            target.isDeleted = true;
            const tid = target.id || targetId || (typeof global.generateItemId === 'function' ? global.generateItemId(target, `dailyTargetsDatabase_${actualDateKey}`) : null);
            if (tid && typeof global.recordItemDeletion === 'function') {
                global.recordItemDeletion(tid);
                if (target.id) global.recordItemDeletion(target.id);
            }
            if (typeof global.markLocalMutation === 'function') {
                global.markLocalMutation('delete_daily_target');
            }
            if (global.dailyTargetsDatabase[actualDateKey]) {
                global.dailyTargetsDatabase[actualDateKey].splice(actualIdx, 1);
            }
            safeRenderUI();
            safeShowToast("To-Do task removed.", "success");
            safeSaveToCloud(true);
            return;
        }

        let foundMonth = null;
        let foundIdx = -1;
        const matchFn = global.isChapterMatch || (global.Utils && global.Utils.isChapterMatch);
        if (global.monthlyTargetsDatabase) {
            for (const mKey of Object.keys(global.monthlyTargetsDatabase)) {
                const mList = global.monthlyTargetsDatabase[mKey] || [];
                const idxInM = mList.findIndex(mt => {
                    if (target.monthlyTargetId && mt.id === target.monthlyTargetId) return true;
                    const subMatch = String(mt.subject || '').trim().toLowerCase() === String(target.subject || '').trim().toLowerCase();
                    if (!subMatch) return false;
                    if (target.track && mt.track && target.track !== mt.track) return false;
                    const mtIsSubject = mt.targetType === 'subject' || mt.chapter === 'Whole Subject' || mt.chapter === 'All Chapters';
                    const isSubject = target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters';
                    return isSubject ? mtIsSubject : (!mtIsSubject && (matchFn ? matchFn(mt.chapter, target.chapter) : String(mt.chapter).trim().toLowerCase() === String(target.chapter).trim().toLowerCase()));
                });
                if (idxInM !== -1) {
                    foundMonth = mKey;
                    foundIdx = idxInM;
                    break;
                }
            }
        }

        if (foundMonth && foundIdx !== -1) {
            safeShowToast("Opening Monthly Target Setup to edit/delete this target...", "info");
            if (typeof global.openEditMonthlyTargetPage === 'function') {
                global.openEditMonthlyTargetPage(foundIdx, foundMonth);
            }
        } else {
            // Orphaned daily target - directly purge
            if (actualDateKey && global.dailyTargetsDatabase && global.dailyTargetsDatabase[actualDateKey]) {
                target.isDeleted = true;
                const tid = target.id || targetId || (typeof global.generateItemId === 'function' ? global.generateItemId(target, `dailyTargetsDatabase_${actualDateKey}`) : null);
                if (tid && typeof global.recordItemDeletion === 'function') {
                    global.recordItemDeletion(tid);
                    if (target.id) global.recordItemDeletion(target.id);
                }
                if (typeof global.markLocalMutation === 'function') {
                    global.markLocalMutation('delete_daily_target');
                }
                global.dailyTargetsDatabase[actualDateKey].splice(actualIdx, 1);
                safeRecalculateTotals();
                safeSaveToCloud(true);
                safeRenderUI();
                safeShowToast("Orphaned daily target removed.", "success");
            } else {
                safeShowToast("Weekly and Daily targets are set and managed from Add Monthly Target page.", "info");
                if (typeof global.switchPage === 'function') global.switchPage('monthly-target-setup');
            }
        }
    }

    /* ==========================================================================
       4. Completion Controls & Bi-directional Synchronization
       ========================================================================== */

    function toggleDailyTargetCompletion(idx, isCompleted, targetDateKey = null) {
        let selectedDateKey = targetDateKey;
        if (!selectedDateKey) {
            if (!global.currentDailyTargetsDate) global.currentDailyTargetsDate = new Date();
            selectedDateKey = safeFormatDate(global.currentDailyTargetsDate);
        }

        if (!global.dailyTargetsDatabase) return;

        // If direct key match not found, attempt finding key with matching parsed date
        if (!global.dailyTargetsDatabase[selectedDateKey]) {
            const targetParsed = safeParseDailyTargetDateKey(selectedDateKey);
            if (!isNaN(targetParsed.getTime())) {
                const targetY = targetParsed.getFullYear();
                const targetM = targetParsed.getMonth();
                const targetD = targetParsed.getDate();
                const matchingKey = Object.keys(global.dailyTargetsDatabase).find(k => {
                    const parsed = safeParseDailyTargetDateKey(k);
                    return !isNaN(parsed.getTime()) &&
                           parsed.getFullYear() === targetY &&
                           parsed.getMonth() === targetM &&
                           parsed.getDate() === targetD;
                });
                if (matchingKey) selectedDateKey = matchingKey;
            }
        }

        if (!global.dailyTargetsDatabase[selectedDateKey] || !global.dailyTargetsDatabase[selectedDateKey][idx]) return;

        const target = global.dailyTargetsDatabase[selectedDateKey][idx];
        target.completed = isCompleted;
        target.completedAt = isCompleted ? new Date().toISOString() : null;

        if (target.isTodo) {
            safeRenderUI();
            safeShowToast("To-Do task updated!", "success");
            safeSaveToCloud(false);
            return;
        }

        const targetDateObj = safeParseDailyTargetDateKey(selectedDateKey);

        // Sync with Weekly Target (if exists)
        let wtCompleted = isCompleted;
        let wtCompletedAt = target.completedAt;
        let hasWtSize = false;

        if (typeof global.getWeeklyTargetRange === 'function' && typeof global.formatDateRangeKey === 'function') {
            const currentRange = global.getWeeklyTargetRange(targetDateObj || global.currentDailyTargetsDate || new Date());
            const currentWeekKey = global.formatDateRangeKey(currentRange.start, currentRange.end);
            const canonicalWeekKey = (typeof global.getCanonicalWeeklyRangeKey === 'function') ? global.getCanonicalWeeklyRangeKey(currentWeekKey) : currentWeekKey;

            const weekKeysToCheck = [currentWeekKey];
            if (canonicalWeekKey && !weekKeysToCheck.includes(canonicalWeekKey)) weekKeysToCheck.push(canonicalWeekKey);

            if (global.weeklyTargetsDatabase) {
                const wKeys = Object.keys(global.weeklyTargetsDatabase);
                wKeys.forEach(wKey => {
                    const isTargetWeek = weekKeysToCheck.includes(wKey);
                    const list = global.weeklyTargetsDatabase[wKey] || [];
                    list.forEach(matchingWt => {
                        const isMatch = (target.monthlyTargetId && matchingWt.monthlyTargetId === target.monthlyTargetId) ||
                            (isTargetWeek && matchingWt.track === target.track && matchingWt.subject === target.subject && matchingWt.chapter === target.chapter);
                        if (isMatch) {
                            if (matchingWt.totalChapterSize && typeof global.getWeeklyTargetProgress === 'function') {
                                hasWtSize = true;
                                const progress = global.getWeeklyTargetProgress(matchingWt, wKey);
                                matchingWt.completed = (progress.percent >= 100);
                                matchingWt.completedAt = matchingWt.completed ? new Date().toISOString() : null;
                                wtCompleted = matchingWt.completed;
                                wtCompletedAt = matchingWt.completedAt;
                            } else {
                                matchingWt.completed = isCompleted;
                                matchingWt.completedAt = target.completedAt;
                            }
                        }
                    });
                });
            }
        }

        // Sync with Monthly Targets (if exists)
        if (global.monthlyTargetsDatabase) {
            const matchFn = global.isChapterMatch || (global.Utils && global.Utils.isChapterMatch);
            Object.keys(global.monthlyTargetsDatabase).forEach(mKey => {
                const mList = global.monthlyTargetsDatabase[mKey] || [];
                mList.forEach(mt => {
                    const isMatch = (target.monthlyTargetId && mt.id === target.monthlyTargetId) ||
                        (mt.track === target.track && mt.subject === target.subject && (matchFn ? matchFn(mt.chapter, target.chapter) : (mt.chapter === target.chapter || mt.chapter === 'Whole Subject' || mt.targetType === 'subject')));
                    if (isMatch) {
                        if (mt.totalChapterSize && typeof global.getMonthlyTargetProgress === 'function') {
                            const prog = global.getMonthlyTargetProgress(mt, mKey);
                            mt.completed = (prog.percent >= 100);
                            mt.completedAt = mt.completed ? new Date().toISOString() : null;
                        } else {
                            mt.completed = isCompleted;
                            mt.completedAt = target.completedAt;
                        }
                    }
                });
            });
        }

        // Sync with daily study task (with size-based awareness)
        if (typeof global.syncTaskChapterCompletion === 'function') {
            if (hasWtSize) {
                global.syncTaskChapterCompletion(target.track, target.subject, target.chapter, wtCompleted, wtCompletedAt);
            } else {
                global.syncTaskChapterCompletion(target.track, target.subject, target.chapter, isCompleted, target.completedAt);
            }
        }
        safeRecalculateTotals();

        safeRenderUI();
        safeShowToast("Daily target completion state synchronized!", "success");
        safeSaveToCloud(false);
    }

    function autoSyncWeeklyToDailyTargets() {
        if (!global.weeklyTargetsDatabase) return;
        if (!global.dailyTargetsDatabase) global.dailyTargetsDatabase = {};

        let updated = false;
        const weekKeys = Object.keys(global.weeklyTargetsDatabase);

        weekKeys.forEach(weekKey => {
            const weeklyTargets = global.weeklyTargetsDatabase[weekKey] || [];
            if (weeklyTargets.length === 0) return;

            const weekDates = weekKey ? weekKey.split(' - ') : [];
            const utils = global.Utils || {};
            const startDate = utils.parseDateSafe ? utils.parseDateSafe(weekDates[0]) : (utils.parseStart ? utils.parseStart(weekKey) : new Date(weekDates[0]));
            const endDate = (weekDates.length === 2 && utils.parseDateSafe) ? utils.parseDateSafe(weekDates[1]) : (startDate ? new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000) : null);
            if (!startDate || isNaN(startDate.getTime())) return;

            let cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const endDay = endDate && !isNaN(endDate.getTime()) ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : new Date(cur.getTime() + 6 * 24 * 60 * 60 * 1000);

            while (cur <= endDay) {
                const d = new Date(cur);
                const dayOfWeekName = d.toLocaleDateString('en-US', { weekday: 'long' });
                const dateKey = safeFormatDate(d);

                const dayTargets = weeklyTargets.filter(t => t.dayName && t.dayName.toLowerCase() === dayOfWeekName.toLowerCase());

                if (dayTargets.length > 0) {
                    if (!global.dailyTargetsDatabase[dateKey]) {
                        global.dailyTargetsDatabase[dateKey] = [];
                    }

                    dayTargets.forEach(wt => {
                        const existingTarget = global.dailyTargetsDatabase[dateKey].find(dt =>
                            dt.track === wt.track &&
                            dt.subject === wt.subject &&
                            dt.chapter === wt.chapter
                        );

                        if (!existingTarget) {
                            const foundTask = typeof global.findTaskChapter === 'function' ? global.findTaskChapter(wt.track, wt.subject, wt.chapter) : null;
                            const isCompleted = wt.completed || (foundTask && foundTask.subTask ? foundTask.subTask.completed : false);
                            const completedAt = wt.completedAt || (foundTask && foundTask.subTask ? foundTask.subTask.completedAt : null);

                            global.dailyTargetsDatabase[dateKey].push({
                                track: wt.track,
                                program: wt.program,
                                subject: wt.subject,
                                chapter: wt.chapter,
                                completed: isCompleted,
                                completedAt: completedAt,
                                totalChapterSize: wt.totalChapterSize,
                                scope: wt.scope || 'Whole Chapter',
                                isAutoSynced: true
                            });
                            updated = true;
                        } else if (existingTarget.isDeleted) {
                            delete existingTarget.isDeleted;
                            const foundTask = typeof global.findTaskChapter === 'function' ? global.findTaskChapter(wt.track, wt.subject, wt.chapter) : null;
                            existingTarget.completed = wt.completed || (foundTask && foundTask.subTask ? foundTask.subTask.completed : false);
                            existingTarget.completedAt = wt.completedAt || (foundTask && foundTask.subTask ? foundTask.subTask.completedAt : null);
                            existingTarget.totalChapterSize = wt.totalChapterSize;
                            existingTarget.scope = wt.scope || 'Whole Chapter';
                            existingTarget.isAutoSynced = true;
                            updated = true;
                        }
                    });
                }
                cur.setDate(cur.getDate() + 1);
            }
        });

        if (updated) {
            safeSaveToCloud(false);
        }
    }

    /* ==========================================================================
       5. Day Navigation & Active Daily Checklist Renderer
       ========================================================================== */

    function navigateDay(mode) {
        if (!global.currentDailyTargetsDate) global.currentDailyTargetsDate = new Date();

        if (mode === 'past') {
            global.currentDailyTargetsDate.setDate(global.currentDailyTargetsDate.getDate() - 1);
        } else if (mode === 'future') {
            global.currentDailyTargetsDate.setDate(global.currentDailyTargetsDate.getDate() + 1);
        } else {
            global.currentDailyTargetsDate = new Date();
        }

        renderDailyTargets();
    }

    function renderDailyTargets() {
        if (typeof document === 'undefined') return;
        const listContainer = document.getElementById('daily-targets-list');
        const wtDropdown = document.getElementById('dt-select-from-wt');
        const progDropdown = document.getElementById('dt-select-prog');
        if (!listContainer) return;

        if (typeof global.cleanOrphanedWeeklyAndDailyTargets === 'function') {
            global.cleanOrphanedWeeklyAndDailyTargets();
        }

        if (!global.currentDailyTargetsDate) global.currentDailyTargetsDate = new Date();
        const targetDateKey = safeFormatDate(global.currentDailyTargetsDate);

        const dateDisplay = document.getElementById('dt-selected-date');
        if (dateDisplay) {
            const weekday = global.currentDailyTargetsDate.toLocaleDateString('en-GB', { weekday: 'long' });
            dateDisplay.textContent = `[ ${weekday}, ${targetDateKey} ]`;
        }

        // Update Day Navigation Buttons active states
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        const selectedTargetDate = new Date(global.currentDailyTargetsDate);
        selectedTargetDate.setHours(0, 0, 0, 0);

        const diffTime = selectedTargetDate.getTime() - todayDate.getTime();

        const dtBtnPast = document.getElementById('dt-btn-past');
        const dtBtnPresent = document.getElementById('dt-btn-present');
        const dtBtnFuture = document.getElementById('dt-btn-future');

        const dtActiveClass = "bg-blue-600 text-white shadow";
        const dtInactiveClass = "text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50";

        if (dtBtnPast && dtBtnPresent && dtBtnFuture) {
            dtBtnPast.className = `px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all ${diffTime < 0 ? dtActiveClass : dtInactiveClass}`;
            dtBtnPresent.className = `px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all ${diffTime === 0 ? dtActiveClass : dtInactiveClass}`;
            dtBtnFuture.className = `px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all ${diffTime > 0 ? dtActiveClass : dtInactiveClass}`;
        }

        // Populate Weekly Targets dropdown for this date's week
        if (wtDropdown) {
            const prevVal = wtDropdown.value;
            wtDropdown.innerHTML = '<option value="">-- Choose a Weekly Target --</option>';

            const targetDate = global.currentDailyTargetsDate || new Date();
            let wtList = [];
            if (global.weeklyTargetsDatabase) {
                const canonicalKey = typeof global.getCanonicalWeeklyRangeKey === 'function' ? global.getCanonicalWeeklyRangeKey(targetDate) : null;
                if (canonicalKey && global.weeklyTargetsDatabase[canonicalKey]) {
                    wtList = global.weeklyTargetsDatabase[canonicalKey];
                } else if (typeof global.getWeeklyTargetRange === 'function' && typeof global.formatDateRangeKey === 'function') {
                    const range = global.getWeeklyTargetRange(targetDate);
                    const weekKey = global.formatDateRangeKey(range.start, range.end);
                    wtList = global.weeklyTargetsDatabase[weekKey] || [];
                }
            }

            const passedItems = global.passedItems || (global.AppState && global.AppState.passedItems) || { programs: [], subjects: [] };
            wtList.forEach(wt => {
                let displaySub = (wt.subject || '').replace((wt.program || '') + ' - ', '').replace((wt.program || '') + ' ', '');
                const isPassed = Boolean(
                    (Array.isArray(passedItems.subjects) && passedItems.subjects.includes(wt.subject)) ||
                    (Array.isArray(passedItems.programs) && passedItems.programs.includes(wt.program))
                );
                const passedTag = isPassed ? ' 🏆 (Passed)' : '';
                wtDropdown.innerHTML += `<option value="${wt.track}|${wt.program}|${wt.subject}|${wt.chapter}">${wt.chapter}: ${displaySub} (${wt.program})${passedTag}</option>`;
            });
            wtDropdown.value = prevVal;
        }

        // Populate programs if empty
        if (progDropdown && progDropdown.options.length === 0) {
            const activeProgs = [];
            const tracks = global.tracks || [];
            const customPrograms = global.customPrograms || {};
            tracks.forEach(track => {
                if (customPrograms[track.id]) {
                    customPrograms[track.id].forEach(p => {
                        activeProgs.push(p.name || p);
                    });
                }
            });
            progDropdown.innerHTML = '';
            activeProgs.forEach(p => {
                progDropdown.innerHTML += `<option value="${p}">${p}</option>`;
            });
            if (activeProgs.length > 0) {
                updateDailyTargetSubjectDropdown();
            }
        }

        listContainer.innerHTML = '';
        if (!global.dailyTargetsDatabase) global.dailyTargetsDatabase = {};
        const targetsList = global.dailyTargetsDatabase[targetDateKey] || [];

        let renderedCount = 0;
        targetsList.forEach((target, idx) => {
            if (target.isDeleted) return;
            renderedCount++;
            const isTodo = target.isTodo === true;
            let isCompleted = false;
            if (isTodo) {
                isCompleted = target.completed || false;
            } else {
                const foundTask = typeof global.findTaskChapter === 'function' ? global.findTaskChapter(target.track, target.subject, target.chapter) : null;
                isCompleted = target.completed || (foundTask && foundTask.subTask ? foundTask.subTask.completed : false);
            }

            let subjectColor = '#3b82f6';
            if (!isTodo) {
                subjectColor = typeof global.getSubjectColor === 'function' ? global.getSubjectColor(target.subject) : '#3b82f6';
            }
            const isDarkMode = document.documentElement ? document.documentElement.classList.contains('dark') : false;

            const statusColor = isCompleted
                ? 'bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'bg-slate-50/50 dark:bg-slate-900/30';

            const cardBorderColorClass = isCompleted ? '' : 'border-slate-200 dark:border-slate-700';
            const cardStyle = `border-color: ${isCompleted ? subjectColor : (isDarkMode ? '#334155' : '#e2e8f0')};`;

            let displayTitle = '';
            let displaySubtitle = '';
            if (isTodo) {
                displayTitle = target.title || 'Untitled';
                const tracks = global.tracks || [];
                const trackName = target.track ? (tracks.find(t => t.id === target.track)?.name || '') : '';
                displaySubtitle = trackName ? `Custom Task • ${trackName}` : 'Custom Task';
            } else {
                let displaySub = (target.subject || '').replace((target.program || '') + ' - ', '').replace((target.program || '') + ' ', '');
                displayTitle = `${target.chapter}: ${displaySub}`;
                displaySubtitle = target.program || '';
            }

            const itemHtml = `
                <div class="flex items-center justify-between p-3 rounded-2xl border ${statusColor} ${cardBorderColorClass} transition-all duration-300" style="${cardStyle}">
                    <div class="flex items-center space-x-3 min-w-0">
                        <input type="checkbox" 
                            onchange="window.toggleDailyTargetCompletion(${idx}, this.checked)" 
                            class="form-checkbox h-4.5 w-4.5 text-emerald-500 dark:text-emerald-500 rounded border-slate-350 focus:ring-emerald-500 transition-all cursor-pointer" 
                            ${isCompleted ? 'checked' : ''}>
                        <div class="min-w-0">
                            <span class="block text-xs font-black text-slate-800 dark:text-slate-100 truncate ${isCompleted ? 'line-through opacity-60' : ''}">
                                ${displayTitle}
                                ${target.totalChapterSize ? `<span class="text-[9px] text-blue-500 font-bold ml-1">(${target.totalChapterSize} p)</span>` : ''}
                                ${(target.isStarTarget || (target.portionLabel && target.portionLabel.includes('⭐'))) ? `<span class="inline-block px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 ml-1" title="Extra/Repeat Target">⭐ Extra</span>` : ''}
                                ${target.scope && target.scope !== 'Whole Chapter' && target.scope !== 'Whole' ? `<span class="inline-block px-1 py-0.5 rounded-[3px] text-[7px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 ml-1">${target.scope}</span>` : ''}
                            </span>
                            <div class="flex items-center space-x-1.5 flex-wrap mt-0.5">
                                <span class="block text-[8px] font-black uppercase text-slate-400 tracking-wider">${displaySubtitle}</span>
                                ${(target.monthlyTargetId || target.source === 'monthly') ? `
                                    <span class="inline-block px-1 py-0.5 rounded-[3px] text-[7px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50" title="Created from Monthly Target Setup">
                                        Monthly
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1 shrink-0">
                        <button onclick="window.openEditDailyTargetModal(${idx}, '${targetDateKey}')" class="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-300 hover:text-blue-550 dark:hover:text-blue-400 rounded-lg transition-all active:scale-90 shadow-sm" title="Edit in Monthly Target Setup">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                        </button>
                        <button onclick="window.deleteDailyTarget(${idx}, '${target.id || ''}')" class="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-300 hover:text-red-500 rounded-lg transition-all active:scale-90 shadow-sm" title="Edit / Delete in Monthly Target Setup">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>`;
            listContainer.innerHTML += itemHtml;
        });

        if (renderedCount === 0) {
            listContainer.innerHTML = `
                <div class="col-span-full py-8 text-center text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    No daily targets set for this day.
                </div>`;
        }
    }

    /* ==========================================================================
       6. Daily Targets Database (DTDB) Modal Controls & Table
       ========================================================================== */

    function openDailyTargetsDatabase() {
        safeOpenModal('daily-targets-db-modal');
        populateDtdbFilters();
        renderDtdbList();
    }

    function populateDtdbFilters() {
        if (typeof document === 'undefined') return;
        const dateFilter = document.getElementById('dtdb-filter-date');
        const progFilter = document.getElementById('dtdb-filter-prog');
        const subFilter = document.getElementById('dtdb-filter-sub');

        if (!dateFilter || !progFilter || !subFilter) return;

        if (!global.dailyTargetsDatabase) global.dailyTargetsDatabase = {};
        const allDates = Object.keys(global.dailyTargetsDatabase).sort((a, b) => new Date(b) - new Date(a));

        const prevDateVal = dateFilter.value;
        dateFilter.innerHTML = '<option value="all">All Dates</option>';
        allDates.forEach(dt => {
            dateFilter.innerHTML += `<option value="${dt}">${dt}</option>`;
        });
        dateFilter.value = prevDateVal || 'all';

        const activeProgs = [];
        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        tracks.forEach(track => {
            if (customPrograms[track.id]) {
                customPrograms[track.id].forEach(p => {
                    activeProgs.push(p.name || p);
                });
            }
        });

        const prevProgVal = progFilter.value;
        progFilter.innerHTML = '<option value="all">All Programs</option>';
        activeProgs.forEach(p => {
            progFilter.innerHTML += `<option value="${p}">${p}</option>`;
        });
        progFilter.value = prevProgVal || 'all';

        const prevSubVal = subFilter.value;
        subFilter.innerHTML = '<option value="all">All Subjects</option>';
        const allSubjects = typeof global.getAllSubjects === 'function' ? global.getAllSubjects() : [];
        allSubjects.forEach(s => {
            subFilter.innerHTML += `<option value="${s.subject}">${s.subject}</option>`;
        });
        subFilter.value = prevSubVal || 'all';
    }

    function renderDtdbList() {
        if (typeof document === 'undefined') return;
        const tbody = document.getElementById('dtdb-targets-tbody');
        if (!tbody) return;

        if (typeof global.cleanOrphanedWeeklyAndDailyTargets === 'function') {
            global.cleanOrphanedWeeklyAndDailyTargets();
        }

        const dFilterEl = document.getElementById('dtdb-filter-date');
        const pFilterEl = document.getElementById('dtdb-filter-prog');
        const sFilterEl = document.getElementById('dtdb-filter-sub');
        const statFilterEl = document.getElementById('dtdb-filter-status');

        const dFilter = dFilterEl ? dFilterEl.value : 'all';
        const pFilter = pFilterEl ? pFilterEl.value : 'all';
        const sFilter = sFilterEl ? sFilterEl.value : 'all';
        const statFilter = statFilterEl ? statFilterEl.value : 'all';

        tbody.innerHTML = '';
        let matchedCount = 0;

        if (!global.dailyTargetsDatabase) global.dailyTargetsDatabase = {};

        const sortedDates = Object.keys(global.dailyTargetsDatabase).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(dateKey => {
            if (dFilter !== 'all' && dateKey !== dFilter) return;

            const list = global.dailyTargetsDatabase[dateKey] || [];
            list.forEach((target, idx) => {
                if (target.isDeleted) return;
                if (pFilter !== 'all' && target.program !== pFilter) return;
                if (sFilter !== 'all' && target.subject !== sFilter) return;

                const isTodo = target.isTodo || false;
                let isCompleted = false;
                if (isTodo) {
                    isCompleted = target.completed || false;
                } else {
                    const foundTask = typeof global.findTaskChapter === 'function' ? global.findTaskChapter(target.track, target.subject, target.chapter) : null;
                    isCompleted = target.completed || (foundTask && foundTask.subTask ? foundTask.subTask.completed : false);
                }

                if (statFilter === 'completed' && !isCompleted) return;
                if (statFilter === 'non-completed' && isCompleted) return;

                matchedCount++;

                let displaySub = target.subject ? target.subject.replace((target.program || '') + ' - ', '').replace((target.program || '') + ' ', '') : '';
                let chapterVal = target.chapter || '';
                let sizeVal = (target.totalChapterSize !== undefined && target.totalChapterSize !== null) ? target.totalChapterSize : '';
                let displayTitle = isTodo ? (target.title || 'Untitled') : `${chapterVal}: ${displaySub}`;

                const row = `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td class="py-3 px-4 text-center">
                            <input type="checkbox" onchange="window.toggleDtdbTargetCompletion('${dateKey}', ${idx}, this.checked)" class="form-checkbox h-4 w-4 text-emerald-500 rounded cursor-pointer" ${isCompleted ? 'checked' : ''}>
                        </td>
                        <td class="py-3 px-4 font-bold text-slate-500 dark:text-slate-400 text-[10px]">${dateKey}</td>
                        <td class="py-3 px-4 uppercase text-[10px] text-slate-400">${target.program || 'Custom'}</td>
                        <td class="py-3 px-4 truncate max-w-[150px]" title="${isTodo ? 'To-Do Task' : target.subject}">${isTodo ? 'Custom Task' : displaySub}</td>
                        <td class="py-3 px-4 text-blue-600 dark:text-blue-400 font-bold max-w-[150px] truncate" title="${displayTitle}">${displayTitle}${target.scope && target.scope !== 'Whole Chapter' && target.scope !== 'Whole' ? ` <span class="inline-block px-1 py-0.5 rounded-[3px] text-[7px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 ml-1">${target.scope}</span>` : ''}</td>
                        <td class="py-3 px-4 text-center">
                            ${isTodo ? '<span class="text-slate-400 font-normal">-</span>' : `
                            <input type="number" value="${sizeVal}" min="0" placeholder="-" 
                                onchange="window.updateDtdbTargetSize('${dateKey}', ${idx}, this.value)" 
                                class="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs font-bold text-center focus:ring-1 focus:ring-blue-500 outline-none">
                            `}
                        </td>
                        <td class="py-3 px-4 text-center">
                            <div class="flex items-center justify-center space-x-1">
                                <button onclick="window.openEditDailyTargetModalFromDtdb('${dateKey}', ${idx})" class="p-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500 rounded transition-all active:scale-90 shadow-sm" title="Edit in Monthly Target Setup">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                    </svg>
                                </button>
                                <button onclick="window.deleteDtdbTarget('${dateKey}', ${idx})" class="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded transition-all active:scale-90 shadow-sm" title="Delete Target">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>`;
                tbody.innerHTML += row;
            });
        });

        if (matchedCount === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-8 text-center text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/30">
                        No daily targets found.
                    </td>
                </tr>`;
        }
    }

    function toggleDtdbTargetCompletion(dateKey, idx, isCompleted) {
        if (!global.dailyTargetsDatabase || !global.dailyTargetsDatabase[dateKey] || !global.dailyTargetsDatabase[dateKey][idx]) return;

        const target = global.dailyTargetsDatabase[dateKey][idx];
        target.completed = isCompleted;
        target.completedAt = isCompleted ? new Date().toISOString() : null;

        if (target.isTodo) {
            safeSaveToCloud(false);
            safeRenderUI();
            renderDtdbList();
            safeShowToast("To-Do task updated!", "success");
            return;
        }

        // Sync with Weekly Target (if exists)
        let wtCompleted = isCompleted;
        let wtCompletedAt = target.completedAt;
        let hasWtSize = false;

        if (typeof global.getWeeklyTargetRange === 'function' && typeof global.formatDateRangeKey === 'function') {
            const parsedDate = safeParseDailyTargetDateKey(dateKey);
            const currentRange = global.getWeeklyTargetRange(parsedDate);
            const currentWeekKey = global.formatDateRangeKey(currentRange.start, currentRange.end);

            if (global.weeklyTargetsDatabase && global.weeklyTargetsDatabase[currentWeekKey]) {
                const matchingWt = global.weeklyTargetsDatabase[currentWeekKey].find(t => t.track === target.track && t.subject === target.subject && t.chapter === target.chapter);
                if (matchingWt) {
                    if (matchingWt.totalChapterSize && typeof global.getWeeklyTargetProgress === 'function') {
                        hasWtSize = true;
                        const progress = global.getWeeklyTargetProgress(matchingWt, currentWeekKey);
                        matchingWt.completed = (progress.percent >= 100);
                        matchingWt.completedAt = matchingWt.completed ? new Date().toISOString() : null;
                        wtCompleted = matchingWt.completed;
                        wtCompletedAt = matchingWt.completedAt;
                    } else {
                        matchingWt.completed = isCompleted;
                        matchingWt.completedAt = target.completedAt;
                    }
                }
            }
        }

        // Sync with daily study task (with size-based awareness)
        if (typeof global.findTaskChapter === 'function') {
            const found = global.findTaskChapter(target.track, target.subject, target.chapter);
            if (found && found.subTask) {
                if (hasWtSize) {
                    found.subTask.completed = wtCompleted;
                    found.subTask.completedAt = wtCompletedAt;
                } else {
                    found.subTask.completed = isCompleted;
                    found.subTask.completedAt = target.completedAt;
                }
                safeRecalculateTotals();
            }
        }

        safeSaveToCloud(false);
        safeRenderUI();
        renderDtdbList();
        safeShowToast("Daily target completion state synchronized!", "success");
    }

    function deleteDtdbTarget(dateKey, idx) {
        if (global.dailyTargetsDatabase && global.dailyTargetsDatabase[dateKey] && global.dailyTargetsDatabase[dateKey][idx]) {
            const target = global.dailyTargetsDatabase[dateKey][idx];
            if (target.isTodo) {
                target.isDeleted = true;
                const tid = target.id || (typeof global.generateItemId === 'function' ? global.generateItemId(target, `dailyTargetsDatabase_${dateKey}`) : null);
                if (tid && typeof global.recordItemDeletion === 'function') {
                    global.recordItemDeletion(tid);
                    if (target.id) global.recordItemDeletion(target.id);
                }
                if (typeof global.markLocalMutation === 'function') {
                    global.markLocalMutation('delete_dtdb_target');
                }
                global.dailyTargetsDatabase[dateKey].splice(idx, 1);
                safeSaveToCloud(true);
                safeRenderUI();
                renderDtdbList();
                safeShowToast("To-Do task removed.", "success");
                return;
            }

            let foundMonth = null;
            let foundIdx = -1;
            const matchFn = global.isChapterMatch || (global.Utils && global.Utils.isChapterMatch);
            if (global.monthlyTargetsDatabase) {
                for (const mKey of Object.keys(global.monthlyTargetsDatabase)) {
                    const mList = global.monthlyTargetsDatabase[mKey] || [];
                    const idxInM = mList.findIndex(mt => {
                        if (target.monthlyTargetId && mt.id === target.monthlyTargetId) return true;
                        const subMatch = String(mt.subject || '').trim().toLowerCase() === String(target.subject || '').trim().toLowerCase();
                        if (!subMatch) return false;
                        if (target.track && mt.track && target.track !== mt.track) return false;
                        const mtIsSubject = mt.targetType === 'subject' || mt.chapter === 'Whole Subject' || mt.chapter === 'All Chapters';
                        const isSubject = target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters';
                        return isSubject ? mtIsSubject : (!mtIsSubject && (matchFn ? matchFn(mt.chapter, target.chapter) : String(mt.chapter).trim().toLowerCase() === String(target.chapter).trim().toLowerCase()));
                    });
                    if (idxInM !== -1) {
                        foundMonth = mKey;
                        foundIdx = idxInM;
                        break;
                    }
                }
            }
            if (foundMonth && foundIdx !== -1) {
                safeCloseModal('daily-targets-db-modal');
                safeShowToast("Opening Monthly Target Setup to edit/delete this target...", "info");
                if (typeof global.openEditMonthlyTargetPage === 'function') {
                    global.openEditMonthlyTargetPage(foundIdx, foundMonth);
                }
            } else {
                // Orphaned daily target - directly purge
                target.isDeleted = true;
                const tid = target.id || (typeof global.generateItemId === 'function' ? global.generateItemId(target, `dailyTargetsDatabase_${dateKey}`) : null);
                if (tid && typeof global.recordItemDeletion === 'function') {
                    global.recordItemDeletion(tid);
                    if (target.id) global.recordItemDeletion(target.id);
                }
                if (typeof global.markLocalMutation === 'function') {
                    global.markLocalMutation('delete_dtdb_target');
                }
                global.dailyTargetsDatabase[dateKey].splice(idx, 1);
                safeRecalculateTotals();
                safeSaveToCloud(true);
                safeRenderUI();
                renderDtdbList();
                safeShowToast("Orphaned daily target removed.", "success");
            }
        }
    }

    function updateDtdbTargetSize(dateKey, idx, size) {
        if (global.dailyTargetsDatabase && global.dailyTargetsDatabase[dateKey] && global.dailyTargetsDatabase[dateKey][idx]) {
            const target = global.dailyTargetsDatabase[dateKey][idx];
            const numericSize = size ? parseFloat(size) : null;
            target.totalChapterSize = numericSize;

            // Sync with Weekly Target & Daily Study Task
            if (typeof global.getWeeklyTargetRange === 'function' && typeof global.formatDateRangeKey === 'function') {
                const parsedDate = safeParseDailyTargetDateKey(dateKey);
                const currentRange = global.getWeeklyTargetRange(parsedDate);
                const currentWeekKey = global.formatDateRangeKey(currentRange.start, currentRange.end);

                if (global.weeklyTargetsDatabase && global.weeklyTargetsDatabase[currentWeekKey]) {
                    const matchingWt = global.weeklyTargetsDatabase[currentWeekKey].find(t => t.track === target.track && t.subject === target.subject && t.chapter === target.chapter);
                    if (matchingWt && matchingWt.totalChapterSize && typeof global.getWeeklyTargetProgress === 'function') {
                        const progress = global.getWeeklyTargetProgress(matchingWt, currentWeekKey);
                        matchingWt.completed = (progress.percent >= 100);
                        matchingWt.completedAt = matchingWt.completed ? new Date().toISOString() : null;

                        if (typeof global.findTaskChapter === 'function') {
                            const found = global.findTaskChapter(target.track, target.subject, target.chapter);
                            if (found && found.subTask) {
                                found.subTask.completed = matchingWt.completed;
                                found.subTask.completedAt = matchingWt.completedAt;
                                safeRecalculateTotals();
                            }
                        }
                    }
                }
            }

            safeSaveToCloud(false);
            safeRenderUI();
            renderDtdbList();
            safeShowToast("Target size updated!", "success");
        }
    }

    /* ==========================================================================
       7. Module Namespace & Global Exports
       ========================================================================== */

    const DailyTargets = {
        // Dropdown & Color Sync
        updateDailyTargetColorSync,
        updateDailyTargetSubjectDropdown,
        updateDailyTargetChapterDropdown,
        handleDailyTargetChapterChange,
        handleSelectFromWeeklyTargetChange,

        // Custom Todos
        switchAdtTab,
        addCustomTodoTarget,

        // Daily Targets Management
        openAddDailyTargetModal,
        addDailyTarget,
        openEditDailyTargetModal,
        openEditDailyTargetModalFromDtdb,
        saveDailyTarget,
        deleteDailyTarget,

        // Completion & Weekly Sync
        toggleDailyTargetCompletion,
        autoSyncWeeklyToDailyTargets,

        // Day Navigation & Active List
        navigateDay,
        renderDailyTargets,

        // DTDB
        openDailyTargetsDatabase,
        populateDtdbFilters,
        renderDtdbList,
        toggleDtdbTargetCompletion,
        deleteDtdbTarget,
        updateDtdbTargetSize
    };

    // Attach to global window scope for backwards compatibility
    global.DailyTargets = DailyTargets;
    global.updateDailyTargetColorSync = updateDailyTargetColorSync;
    global.updateDailyTargetSubjectDropdown = updateDailyTargetSubjectDropdown;
    global.updateDailyTargetChapterDropdown = updateDailyTargetChapterDropdown;
    global.handleDailyTargetChapterChange = handleDailyTargetChapterChange;
    global.handleSelectFromWeeklyTargetChange = handleSelectFromWeeklyTargetChange;
    global.switchAdtTab = switchAdtTab;
    global.addCustomTodoTarget = addCustomTodoTarget;
    global.openAddDailyTargetModal = openAddDailyTargetModal;
    global.addDailyTarget = addDailyTarget;
    global.openEditDailyTargetModal = openEditDailyTargetModal;
    global.openEditDailyTargetModalFromDtdb = openEditDailyTargetModalFromDtdb;
    global.saveDailyTarget = saveDailyTarget;
    global.deleteDailyTarget = deleteDailyTarget;
    global.toggleDailyTargetCompletion = toggleDailyTargetCompletion;
    global.autoSyncWeeklyToDailyTargets = autoSyncWeeklyToDailyTargets;
    global.navigateDay = navigateDay;
    global.renderDailyTargets = renderDailyTargets;
    global.openDailyTargetsDatabase = openDailyTargetsDatabase;
    global.populateDtdbFilters = populateDtdbFilters;
    global.renderDtdbList = renderDtdbList;
    global.toggleDtdbTargetCompletion = toggleDtdbTargetCompletion;
    global.deleteDtdbTarget = deleteDtdbTarget;
    global.updateDtdbTargetSize = updateDtdbTargetSize;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DailyTargets;
    }
})(typeof window !== 'undefined' ? window : globalThis);
