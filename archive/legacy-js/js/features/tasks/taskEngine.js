/**
 * X-29 Feature Module: Task Engine (taskEngine.js)
 *
 * Responsibilities:
 * 1. Study Plan & Slot Execution Engine:
 *    - generateStudyPlan: Generates default study plan with Friday holidays and track queues.
 *    - ensureAvailableSlots: Dynamically creates revision slots if needed for additions.
 *    - reorderSubjectChapters: Sorts uncompleted chapters numerically.
 *    - rebuildTaskDates: Recalculates task dates sequentially from AppState.PLAN_START_DATE.
 * 2. Chapter & Subject Status Helpers:
 *    - isSubjectPassed, isChapterCompleted, isChapterSkipped, findTaskChapter.
 *    - syncTaskChapterCompletion, getChaptersForSubject.
 *    - getChapterStatus: Unified status calculation (complete, skip, incomplete) across tasks,
 *      revision progress, passed items, and target databases (daily, weekly, monthly).
 *    - getSubjectSkippedCount, isSubjectCompleted.
 * 3. Task Toggle Engine:
 *    - handleTaskToggle: High-performance task completion toggle with optimistic zero-lag UI updates:
 *      * Immediate card state styling (border, background gradient, line-through, accent bar).
 *      * Immediate subject progress bar (CH count, percentage, progress bar width).
 *      * Immediate 4 analytics cards in subject view (req pace, actual pace, est finish, days left).
 *      * Cross-task synchronization across identical chapter instances in AppState.tasks.
 *      * Bi-directional cascade to monthlyTargetsDatabase, weeklyTargetsDatabase, dailyTargetsDatabase.
 *      * Firebase cloud save & updateMetrics invocation.
 * 4. Task Edit Modal & Deletion:
 *    - openEditModal: Opens modal for scheduled or unscheduled (unsched-) chapter tasks.
 *    - toggleSkipTask: Skips or unskips chapter, cleaning up targets database records with tombstone tracking.
 *    - saveTaskEdit: Updates subject, chapter, title, and handles chapter moves.
 *    - requestDeleteTask & deleteTask: Resets slot to Revision and shifts subsequent uncompleted chapters upward.
 * 5. Task List & Card Rendering:
 *    - renderTaskList: Renders task cards grouped by subject, filtered by AppState.currentFilter.
 *    - generateSingleTaskHtml: HTML renderer for single chapter study cards with weekly size progress.
 *    - generateRevisionTaskHtml: HTML renderer for revision practice cards.
 *    - setFilter: Switches current filter and triggers re-renders.
 * 6. Revision Mode & Modal:
 *    - openRevisionModal, renderRevisionModalContent, toggleRevisionMode, toggleRevisionChapter.
 *
 * State:
 * - Reads and mutates AppState.tasks, AppState.currentFilter, window.revisionData, window.editingTask.
 */

(function (global) {
    'use strict';

    const window = global;

    // Non-browser fallbacks
    if (typeof global.CSS === 'undefined' || typeof global.CSS.escape !== 'function') {
        global.CSS = global.CSS || {};
        global.CSS.escape = function (str) {
            return String(str).replace(/([!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
        };
    }

    const safeGetEl = (typeof window !== 'undefined' && typeof window.safeGetEl === 'function')
        ? window.safeGetEl
        : (typeof global !== 'undefined' && typeof global.safeGetEl === 'function')
            ? global.safeGetEl
            : (typeof require === 'function' ? require('../../utils/dom.js').safeGetEl : null);

    function safeSetText(id, text) {
        if (typeof window.safeSetText === 'function') {
            window.safeSetText(id, text);
        } else {
            const el = safeGetEl(id);
            if (el) el.textContent = text !== undefined && text !== null ? text : '';
        }
    }

    function safeSetHtml(id, html) {
        if (typeof window.safeSetHtml === 'function') {
            window.safeSetHtml(id, html);
        } else {
            const el = safeGetEl(id);
            if (el) el.innerHTML = html !== undefined && html !== null ? html : '';
        }
    }

    function getTaskDateSafe(task) {
        if (!task) return new Date(NaN);
        if (task.date && !String(task.date).includes('Invalid') && !String(task.date).includes('NaN')) {
            const d = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                ? Utils.parseDateSafe(task.date)
                : new Date(task.date);
            if (d && !isNaN(d.getTime())) return d;
        }
        return new Date(NaN);
    }

    function hexToRgbaSafe(hex, alpha) {
        if (typeof window !== 'undefined' && typeof window.hexToRgba === 'function') {
            return window.hexToRgba(hex, alpha);
        }
        if (typeof global !== 'undefined' && typeof global.hexToRgba === 'function') {
            return global.hexToRgba(hex, alpha);
        }
        if (typeof Utils !== 'undefined' && typeof Utils.hexToRgba === 'function') {
            return Utils.hexToRgba(hex, alpha);
        }
        if (typeof require === 'function') {
            try { return require('../../utils/colors.js').hexToRgba(hex, alpha); } catch (e) {}
        }
        return `rgba(16, 185, 129, ${alpha})`;
    }

    // =========================================================================
    // 1. STUDY PLAN & SLOT EXECUTION ENGINE
    // =========================================================================

    function ensureAvailableSlots(slotsNeeded, track, startIndex) {
        if (!AppState.tasks || !Array.isArray(AppState.tasks)) return;
        let availableSlots = 0;
        const key = track + 'Tasks';
        for (let i = startIndex; i < AppState.tasks.length; i++) {
            if (AppState.tasks[i].type !== 'study') continue;
            if (AppState.tasks[i][key] && AppState.tasks[i][key].some(b => b.subject === 'Revision')) availableSlots++;
        }

        let slotsToCreate = slotsNeeded - availableSlots;
        if (slotsToCreate <= 0) return;

        let lastTaskId = AppState.tasks.length > 0 ? AppState.tasks[AppState.tasks.length - 1].id : 0;
        let lastStudyDay = 0;
        for (let i = AppState.tasks.length - 1; i >= 0; i--) {
            if (AppState.tasks[i].type === 'study') { lastStudyDay = AppState.tasks[i].studyDay; break; }
        }

        let createdSlots = 0;
        while (createdSlots < slotsToCreate) {
            lastTaskId++;
            const baseDate = new Date(AppState.PLAN_START_DATE.getTime());
            baseDate.setDate(baseDate.getDate() + (lastTaskId - 1));

            const dayName = baseDate.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function')
                ? Utils.formatDate(baseDate)
                : baseDate.toISOString().split('T')[0];

            if (dayName === 'Fri') {
                const task = { id: lastTaskId, date: dateStr, day: dayName, type: 'holiday' };
                if (Array.isArray(window.tracks)) {
                    window.tracks.forEach(t => {
                        task[t.id + 'Study'] = false;
                    });
                }
                if (Array.isArray(window.customActions)) {
                    window.customActions.forEach(act => { task[act.id] = false; });
                }
                AppState.tasks.push(task);
            } else {
                lastStudyDay++;
                const task = {
                    id: lastTaskId, date: dateStr, day: dayName, type: 'study', studyDay: lastStudyDay
                };
                if (Array.isArray(window.tracks)) {
                    window.tracks.forEach(t => {
                        task[t.id + 'Study'] = false;
                        task[t.id + 'Tasks'] = [{ subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: `${t.id}-${lastTaskId}` }];
                    });
                }
                if (Array.isArray(window.customActions)) {
                    window.customActions.forEach(act => { task[act.id] = false; });
                }
                AppState.tasks.push(task);
                createdSlots++;
            }
        }

        const newEndDate = new Date(AppState.PLAN_START_DATE.getTime());
        newEndDate.setDate(newEndDate.getDate() + (lastTaskId - 1));
        AppState.PLAN_END_DATE = newEndDate;
    }

    function reorderSubjectChapters(prog, subj) {
        if (subj === 'Revision' || !AppState.tasks) return;
        let subjectSlots = [];
        let chapters = [];
        const key = prog + 'Tasks';
        for (let i = 0; i < AppState.tasks.length; i++) {
            if (AppState.tasks[i].type !== 'study') continue;
            if (Array.isArray(AppState.tasks[i][key])) {
                for (let j = 0; j < AppState.tasks[i][key].length; j++) {
                    if (AppState.tasks[i][key][j].subject === subj && !AppState.tasks[i][key][j].completed) {
                        subjectSlots.push({ tIdx: i, bIdx: j });
                        chapters.push({ ...AppState.tasks[i][key][j] });
                    }
                }
            }
        }
        if (chapters.length === 0) return;
        // Target the last number in the chapter string to support prefixes correctly (e.g., "R1 Ch. 15" extracts 15)
        chapters.sort((a, b) => {
            const ma = a.chapter ? a.chapter.match(/(\d+)(?!.*\d)/) : null;
            const mb = b.chapter ? b.chapter.match(/(\d+)(?!.*\d)/) : null;
            return (ma ? parseInt(ma[0]) : 999) - (mb ? parseInt(mb[0]) : 999);
        });
        for (let k = 0; k < subjectSlots.length; k++) {
            const slot = subjectSlots[k];
            const chObj = chapters[k];
            AppState.tasks[slot.tIdx][key][slot.bIdx] = { ...chObj, id: AppState.tasks[slot.tIdx][key][slot.bIdx].id };
        }
    }

    function rebuildTaskDates(shouldSave = true) {
        if (!AppState.tasks || AppState.tasks.length === 0) return;
        const baseDate = new Date(AppState.PLAN_START_DATE.getTime());
        AppState.tasks.forEach(t => {
            if (typeof t.id === 'number') {
                const curDate = new Date(baseDate.getTime());
                curDate.setDate(curDate.getDate() + (t.id - 1));
                t.date = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function')
                    ? Utils.formatDate(curDate)
                    : curDate.toISOString().split('T')[0];
                t.day = curDate.toLocaleDateString('en-US', { weekday: 'short' });
            }
        });
        const lastNumTask = [...AppState.tasks].reverse().find(t => typeof t.id === 'number');
        if (lastNumTask) {
            const newEndDate = new Date(baseDate.getTime());
            newEndDate.setDate(newEndDate.getDate() + (lastNumTask.id - 1));
            AppState.PLAN_END_DATE = newEndDate;
        }
        if (typeof window.rebuildTaskDateMap === 'function') window.rebuildTaskDateMap();
        if (shouldSave && window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
    }

    function getTaskDate(task) {
        if (!task) return new Date(NaN);
        if (task.date && !String(task.date).includes('Invalid') && !String(task.date).includes('NaN')) {
            const d = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                ? Utils.parseDateSafe(task.date)
                : new Date(task.date);
            if (d && !isNaN(d.getTime())) return d;
        }
        return new Date(NaN);
    }

    function getTaskForDate(d) {
        if (!d || isNaN(d.getTime())) return null;

        if (!AppState._tasksDateMap || AppState._tasksDateMap.size === 0) {
            if (typeof window.rebuildTaskDateMap === 'function') window.rebuildTaskDateMap();
        }

        const dStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') ? Utils.formatDate(d) : null;
        const isoKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const ymdKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

        if (AppState._tasksDateMap) {
            let task = (dStr && AppState._tasksDateMap.get(dStr)) || AppState._tasksDateMap.get(isoKey) || AppState._tasksDateMap.get(ymdKey);
            if (task) return task;
        }

        // Fast fallback scan if not found in cache map
        const targetY = d.getFullYear();
        const targetM = d.getMonth();
        const targetD = d.getDate();

        const tasks = AppState.tasks || [];
        for (let i = 0; i < tasks.length; i++) {
            const t = tasks[i];
            if (!t) continue;
            if (t.date === dStr) {
                if (AppState._tasksDateMap) {
                    AppState._tasksDateMap.set(dStr, t);
                    AppState._tasksDateMap.set(isoKey, t);
                }
                return t;
            }
            const taskD = getTaskDate(t);
            if (taskD && !isNaN(taskD.getTime())) {
                if (taskD.getFullYear() === targetY && taskD.getMonth() === targetM && taskD.getDate() === targetD) {
                    if (AppState._tasksDateMap) {
                        if (dStr) AppState._tasksDateMap.set(dStr, t);
                        AppState._tasksDateMap.set(isoKey, t);
                    }
                    return t;
                }
            }
        }
        return null;
    }

    function generateStudyPlan() {
        if (!window.tracks || !Array.isArray(window.tracks) || window.tracks.length === 0) {
            return [];
        }
        const startDate = new Date(AppState.PLAN_START_DATE);
        const endDate = new Date(AppState.PLAN_END_DATE);

        const queues = {};
        window.tracks.forEach(track => {
            queues[track.id] = [];
            const subs = typeof window.getSortedTrackSubjects === 'function'
                ? window.getSortedTrackSubjects(track.id)
                : (window.syllabusStructure && window.syllabusStructure[track.id] ? [...window.syllabusStructure[track.id]] : []);
            subs.forEach(s => {
                for (let i = 1; i <= s.chapters; i++) {
                    queues[track.id].push({ subject: s.subject, chapter: `Ch. ${i}`, title: `Topic ${i}` });
                }
            });
        });

        let generated = [];
        let current = new Date(startDate);
        let dayId = 1;
        let studyIdx = 1;

        while (current <= endDate) {
            const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function')
                ? Utils.formatDate(current)
                : current.toISOString().split('T')[0];

            if (dayName === 'Fri') {
                const task = { id: dayId, date: dateStr, day: dayName, type: 'holiday' };
                window.tracks.forEach(t => {
                    task[t.id + 'Study'] = false;
                });
                if (Array.isArray(window.customActions)) {
                    window.customActions.forEach(act => { task[act.id] = false; });
                }
                generated.push(task);
            } else {
                const task = {
                    id: dayId, date: dateStr, day: dayName, type: 'study', studyDay: studyIdx
                };
                window.tracks.forEach(t => {
                    const trackId = t.id;
                    task[trackId + 'Study'] = false;
                    const queueItem = queues[trackId].shift() || { subject: "Revision", chapter: "Rev", title: "Practice" };
                    task[trackId + 'Tasks'] = [{ ...queueItem, id: `${trackId}-${dayId}`, completed: false }];
                });
                if (Array.isArray(window.customActions)) {
                    window.customActions.forEach(act => { task[act.id] = false; });
                }
                generated.push(task);
                studyIdx++;
            }
            current.setDate(current.getDate() + 1);
            dayId++;
        }
        return generated;
    }

    // =========================================================================
    // 2. CHAPTER & SUBJECT QUERY & STATUS HELPERS
    // =========================================================================

    function isSubjectPassed(track, subject, progName = null) {
        if (!window.passedItems) return false;
        if (window.passedItems.subjects && window.passedItems.subjects.includes(subject)) {
            return true;
        }
        let targetProg = progName;
        if (!targetProg && window.syllabusStructure && window.syllabusStructure[track]) {
            const sObj = window.syllabusStructure[track].find(s => s.subject === subject);
            if (sObj) targetProg = sObj.program;
        }
        if (targetProg && window.passedItems.programs && window.passedItems.programs.includes(targetProg)) {
            return true;
        }
        return false;
    }

    function isChapterCompleted(track, subject, chapter) {
        const found = findTaskChapter(track, subject, chapter);
        if (!found) return false;
        return !!found.subTask.completed;
    }

    function isChapterSkipped(track, subject, chapter) {
        const found = findTaskChapter(track, subject, chapter);
        if (!found) return false;
        return !!found.subTask.skipped;
    }

    function findTaskChapter(track, subject, chapter) {
        if (!AppState.tasks || !Array.isArray(AppState.tasks)) return null;
        const key = track + 'Tasks';
        for (let i = 0; i < AppState.tasks.length; i++) {
            const task = AppState.tasks[i];
            if (task.type === 'study' && Array.isArray(task[key])) {
                const subTask = task[key].find(b => b.subject === subject && (b.chapter === chapter || b.chapter === `Ch. ${chapter}` || b.chapter === String(chapter)));
                if (subTask) {
                    return { task, subTask, taskIndex: i };
                }
            }
        }
        return null;
    }

    function syncTaskChapterCompletion(track, subject, chapter, isCompleted, completedAt = null) {
        if (!AppState.tasks || !Array.isArray(AppState.tasks)) return;
        const key = track + 'Tasks';
        const nowIso = completedAt || (isCompleted ? new Date().toISOString() : null);

        AppState.tasks.forEach(t => {
            if (t.type === 'study' && Array.isArray(t[key])) {
                t[key].forEach(b => {
                    if (b.subject === subject && (b.chapter === chapter || b.chapter === `Ch. ${chapter}` || b.chapter === String(chapter))) {
                        b.completed = isCompleted;
                        b.completedAt = nowIso;
                    }
                });
            }
        });
    }

    function getChaptersForSubject(track, subject) {
        const chapters = [];
        if (!AppState.tasks || !Array.isArray(AppState.tasks)) return chapters;
        const key = track + 'Tasks';
        AppState.tasks.forEach(t => {
            if (t.type === 'study' && Array.isArray(t[key])) {
                t[key].forEach(b => {
                    if (b.subject === subject && b.chapter !== 'Rev' && !chapters.includes(b.chapter)) {
                        chapters.push(b.chapter);
                    }
                });
            }
        });

        chapters.sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });

        return chapters;
    }

    function isSubjectCompleted(track, subject) {
        const sObj = (window.syllabusStructure && window.syllabusStructure[track])
            ? window.syllabusStructure[track].find(s => s.subject === subject)
            : (typeof window.getAllSubjects === 'function' ? window.getAllSubjects().find(s => s.subject === subject) : null);

        if (!sObj || sObj.chapters <= 0) return false;

        for (let chNum = 1; chNum <= sObj.chapters; chNum++) {
            const status = getChapterStatus(subject, chNum, track);
            if (status !== 'complete' && status !== 'skip') {
                return false;
            }
        }
        return true;
    }

    function getChapterStatus(subName, chNum, trackId = null) {
        const sObj = typeof window.getAllSubjects === 'function'
            ? window.getAllSubjects().find(s => s.subject === subName)
            : null;

        // 1. Search in tasks
        let foundTaskObj = null;
        let taskType = trackId;

        if (!taskType && sObj) {
            for (const tid in window.syllabusStructure) {
                if (Array.isArray(window.syllabusStructure[tid]) && window.syllabusStructure[tid].some(s => s.subject === subName)) {
                    taskType = tid;
                    break;
                }
            }
        }

        if (taskType && AppState.tasks) {
            const key = taskType + 'Tasks';
            for (const task of AppState.tasks) {
                if (task.type === 'study' && Array.isArray(task[key])) {
                    const match = task[key].find(b => b.subject === subName && (b.chapter === `Ch. ${chNum}` || b.chapter === String(chNum) || b.chapter === `Ch.${chNum}`));
                    if (match) {
                        foundTaskObj = match;
                        break;
                    }
                }
            }
        } else if (AppState.tasks && Array.isArray(window.tracks)) {
            for (const task of AppState.tasks) {
                if (task.type === 'study') {
                    for (const track of window.tracks) {
                        const key = track.id + 'Tasks';
                        if (Array.isArray(task[key])) {
                            const match = task[key].find(b => b.subject === subName && (b.chapter === `Ch. ${chNum}` || b.chapter === String(chNum) || b.chapter === `Ch.${chNum}`));
                            if (match) {
                                foundTaskObj = match;
                                taskType = track.id;
                                break;
                            }
                        }
                    }
                }
                if (foundTaskObj) break;
            }
        }

        // 2. If chapter was explicitly skipped in tasks, return 'skip'
        if (foundTaskObj && foundTaskObj.skipped) {
            return 'skip';
        }

        // 3. Check if frozen / passed
        const isFrozen = window.passedItems && (
            (window.passedItems.subjects && window.passedItems.subjects.includes(subName)) ||
            (window.passedItems.programs && sObj && window.passedItems.programs.includes(sObj.program))
        );
        if (isFrozen) return 'complete';

        // 4. Check completion or size-based completion
        if (foundTaskObj) {
            let isSizeBased = false;
            let progressPercent = 0;
            const prog = window.getChapterWeeklyTargetProgress ? window.getChapterWeeklyTargetProgress(taskType, subName, `Ch. ${chNum}`) : null;
            if (prog && prog.isSizeBased && prog.total > 0) {
                isSizeBased = true;
                progressPercent = prog.percent;
            }

            if (foundTaskObj.completed || (isSizeBased && progressPercent >= 100)) {
                return 'complete';
            }
        }

        // 5. Cross-check Target Databases & Revision Progress
        const formattedCh = `Ch. ${chNum}`;
        const rawCh = String(chNum);

        if (window.dailyTargetsDatabase) {
            for (const dKey in window.dailyTargetsDatabase) {
                const list = window.dailyTargetsDatabase[dKey];
                if (Array.isArray(list)) {
                    const match = list.find(t => t.subject === subName && (t.chapter === formattedCh || t.chapter === rawCh) && !t.isDeleted);
                    if (match && match.completed) return 'complete';
                }
            }
        }

        if (window.weeklyTargetsDatabase) {
            for (const wKey in window.weeklyTargetsDatabase) {
                const list = window.weeklyTargetsDatabase[wKey];
                if (Array.isArray(list)) {
                    const match = list.find(t => t.subject === subName && (t.chapter === formattedCh || t.chapter === rawCh));
                    if (match && match.completed) return 'complete';
                }
            }
        }

        if (window.monthlyTargetsDatabase) {
            for (const mKey in window.monthlyTargetsDatabase) {
                const list = window.monthlyTargetsDatabase[mKey];
                if (Array.isArray(list)) {
                    const match = list.find(t => t.subject === subName && (t.chapter === formattedCh || t.chapter === rawCh));
                    if (match && match.completed) return 'complete';
                }
            }
        }

        if (window.revisionData && window.revisionData.progress && window.revisionData.progress[subName] && window.revisionData.progress[subName][chNum]) {
            return 'complete';
        }

        return 'incomplete';
    }

    function getSubjectSkippedCount(subName, trackId = null) {
        const sObj = typeof window.getAllSubjects === 'function' ? window.getAllSubjects().find(s => s.subject === subName) : null;
        if (!sObj) return 0;

        let taskType = trackId;
        if (!taskType && window.syllabusStructure) {
            for (const tid in window.syllabusStructure) {
                if (Array.isArray(window.syllabusStructure[tid]) && window.syllabusStructure[tid].some(s => s.subject === subName)) {
                    taskType = tid;
                    break;
                }
            }
        }

        let skipped = 0;
        for (let i = 1; i <= sObj.chapters; i++) {
            if (getChapterStatus(subName, i, taskType) === 'skip') {
                skipped++;
            }
        }
        return skipped;
    }

    // =========================================================================
    // 3. TASK TOGGLE ENGINE
    // =========================================================================

    function handleTaskToggle(e) {
        if (!e || !e.target) return;
        const studyDayId = parseInt(e.target.dataset.studId, 10);
        const type = e.target.dataset.type;
        const subTaskId = e.target.dataset.subtaskId;
        const subj = e.target.dataset.subject;
        const chapter = e.target.dataset.chapter;

        if (!AppState.tasks) return;

        let taskIndex = !isNaN(studyDayId) ? AppState.tasks.findIndex(t => t.studyDay === studyDayId && t.type === 'study') : -1;
        const isCompleted = e.target.checked;
        const nowIso = new Date().toISOString();
        let taskObj = null;
        const key = type + 'Tasks';

        if (taskIndex !== -1 && AppState.tasks[taskIndex][key]) {
            AppState.tasks[taskIndex][key] = AppState.tasks[taskIndex][key].map(b => b.id === subTaskId ? { ...b, completed: isCompleted, completedAt: isCompleted ? nowIso : null } : b);
            taskObj = AppState.tasks[taskIndex][key].find(b => b.id === subTaskId);
        }

        if (!taskObj && subj && chapter) {
            // Find existing task by subject & chapter in AppState.tasks
            for (let i = 0; i < AppState.tasks.length; i++) {
                if (AppState.tasks[i].type === 'study' && Array.isArray(AppState.tasks[i][key])) {
                    const b = AppState.tasks[i][key].find(b => b.subject === subj && b.chapter === chapter);
                    if (b) {
                        b.completed = isCompleted;
                        b.completedAt = isCompleted ? nowIso : null;
                        taskObj = b;
                        taskIndex = i;
                        break;
                    }
                }
            }

            // If not in AppState.tasks yet, slot it into the first available Revision slot
            if (!taskObj) {
                for (let i = 0; i < AppState.tasks.length; i++) {
                    if (AppState.tasks[i].type === 'study' && Array.isArray(AppState.tasks[i][key])) {
                        const bIdx = AppState.tasks[i][key].findIndex(b => b.subject === 'Revision');
                        if (bIdx > -1) {
                            AppState.tasks[i][key][bIdx] = {
                                subject: subj,
                                chapter: chapter,
                                title: `Topic ${chapter.replace(/\D/g, '') || ''}`,
                                completed: isCompleted,
                                completedAt: isCompleted ? nowIso : null,
                                id: AppState.tasks[i][key][bIdx].id
                            };
                            taskObj = AppState.tasks[i][key][bIdx];
                            taskIndex = i;
                            break;
                        }
                    }
                }
            }

            // If still not slotted, append a slot and assign it
            if (!taskObj) {
                ensureAvailableSlots(1, type, 0);
                for (let i = 0; i < AppState.tasks.length; i++) {
                    if (AppState.tasks[i].type === 'study' && Array.isArray(AppState.tasks[i][key])) {
                        const bIdx = AppState.tasks[i][key].findIndex(b => b.subject === 'Revision');
                        if (bIdx > -1) {
                            AppState.tasks[i][key][bIdx] = {
                                subject: subj,
                                chapter: chapter,
                                title: `Topic ${chapter.replace(/\D/g, '') || ''}`,
                                completed: isCompleted,
                                completedAt: isCompleted ? nowIso : null,
                                id: AppState.tasks[i][key][bIdx].id
                            };
                            taskObj = AppState.tasks[i][key][bIdx];
                            taskIndex = i;
                            break;
                        }
                    }
                }
            }
        }

        if (!taskObj) return;

        // Synchronize across all study tasks in AppState.tasks matching this track, subject, and chapter
        AppState.tasks.forEach(t => {
            if (t.type === 'study' && Array.isArray(t[key])) {
                t[key].forEach(b => {
                    if (b.subject === taskObj.subject && b.chapter === taskObj.chapter) {
                        b.completed = isCompleted;
                        b.completedAt = isCompleted ? nowIso : null;
                    }
                });
            }
        });

        // Synchronize to monthlyTargetsDatabase
        if (window.monthlyTargetsDatabase) {
            Object.keys(window.monthlyTargetsDatabase).forEach(monthKey => {
                const targets = window.monthlyTargetsDatabase[monthKey] || [];
                targets.forEach(t => {
                    if (t.track === type && t.subject === taskObj.subject) {
                        if (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters') {
                            const isAllDone = typeof window.isSubjectCompleted === 'function' ? window.isSubjectCompleted(type, t.subject) : isCompleted;
                            t.completed = isAllDone;
                            t.completedAt = isAllDone ? nowIso : null;
                        } else if (t.chapter === taskObj.chapter) {
                            t.completed = isCompleted;
                            t.completedAt = isCompleted ? nowIso : null;
                        }
                    }
                });
            });
        }

        // Synchronize to weeklyTargetsDatabase
        if (window.weeklyTargetsDatabase) {
            Object.keys(window.weeklyTargetsDatabase).forEach(weekKey => {
                const targets = window.weeklyTargetsDatabase[weekKey] || [];
                targets.forEach(t => {
                    if (t.track === type && t.subject === taskObj.subject && t.chapter === taskObj.chapter) {
                        t.completed = isCompleted;
                        t.completedAt = isCompleted ? nowIso : null;
                    }
                });
            });
        }

        // Synchronize to dailyTargetsDatabase
        if (window.dailyTargetsDatabase) {
            Object.keys(window.dailyTargetsDatabase).forEach(dateKey => {
                const targets = window.dailyTargetsDatabase[dateKey] || [];
                targets.forEach(t => {
                    if (t.track === type && t.subject === taskObj.subject && t.chapter === taskObj.chapter) {
                        t.completed = isCompleted;
                        t.completedAt = isCompleted ? nowIso : null;
                    }
                });
            });
        }

        // 1. Optimistic UI update: Immediate Card State styling (zero-lag)
        const cardEl = safeGetEl(`single-task-${taskObj.id}-${studyDayId}`);
        if (cardEl) {
            const titleEl = cardEl.querySelector('.tracking-tight');
            const descEl = cardEl.querySelector('.line-clamp-2');
            const accentBar = cardEl.querySelector('.absolute.top-0.left-0');

            if (titleEl) {
                if (isCompleted) titleEl.classList.add('line-through', 'text-emerald-700', 'dark:text-emerald-400', 'opacity-70');
                else titleEl.classList.remove('line-through', 'text-emerald-700', 'dark:text-emerald-400', 'opacity-70');
            }
            if (descEl) {
                if (isCompleted) descEl.classList.add('line-through', 'opacity-60');
                else descEl.classList.remove('line-through', 'opacity-60');
            }

            const subjectColor = typeof window.getSubjectColor === 'function' ? window.getSubjectColor(taskObj.subject) : '#3b82f6';
            const isDarkMode = typeof document !== 'undefined' && document.documentElement && document.documentElement.classList && document.documentElement.classList.contains('dark');

            if (isCompleted) {
                cardEl.style.borderColor = subjectColor;
                cardEl.style.background = '';
                cardEl.style.backgroundColor = isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)';
                if (accentBar) {
                    accentBar.style.backgroundColor = subjectColor;
                }
            } else {
                let progressPercent = 0;
                let isSizeBased = false;
                const progress = window.getChapterWeeklyTargetProgress
                    ? window.getChapterWeeklyTargetProgress(type, taskObj.subject, taskObj.chapter)
                    : null;
                if (progress && progress.isSizeBased && progress.total > 0) {
                    isSizeBased = true;
                    progressPercent = progress.percent;
                }

                if (isSizeBased && progressPercent > 0) {
                    const fillRgba = hexToRgbaSafe(subjectColor, isDarkMode ? 0.25 : 0.15);
                    cardEl.style.background = `linear-gradient(to right, ${fillRgba} ${progressPercent}%, transparent ${progressPercent}%)`;
                    cardEl.style.borderColor = isDarkMode ? '#334155' : '#e2e8f0';
                    cardEl.style.backgroundColor = '';
                } else {
                    cardEl.style.background = '';
                    cardEl.style.borderColor = '';
                    cardEl.style.backgroundColor = '';
                }
                if (accentBar) {
                    accentBar.style.backgroundColor = subjectColor;
                }
            }
        }

        // 2. Optimistic UI update: Specific Subject Progress Bar
        const safeSubId = taskObj.subject.replace(/[^a-zA-Z0-9]/g, '-');
        const subName = taskObj.subject;
        const groupTasks = AppState.tasks.flatMap(t => t.type === 'study' ? (t[key] || []) : []).filter(x => x.subject === subName);
        const sObj = window.syllabusStructure && window.syllabusStructure[type] ? window.syllabusStructure[type].find(s => s.subject === subName) : null;
        const isFrozenSub = (window.passedItems && window.passedItems.subjects && window.passedItems.subjects.includes(subName)) ||
            (window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(sObj ? sObj.program : ''));

        let skippedCount = 0;
        let completedCount = 0;
        if (sObj && sObj.chapters > 0) {
            for (let chNum = 1; chNum <= sObj.chapters; chNum++) {
                const matched = groupTasks.find(x => {
                    const chStr = x.chapter;
                    if (chStr === `Ch. ${chNum}` || chStr === `Ch.${chNum}` || chStr === String(chNum)) return true;
                    const match = chStr ? chStr.match(/(\d+)(?!.*\d)/) : null;
                    return match && parseInt(match[0], 10) === chNum;
                });
                if (matched && matched.skipped) {
                    skippedCount++;
                } else if (matched && matched.completed) {
                    completedCount += 1;
                } else {
                    const prog = window.getChapterWeeklyTargetProgress ? window.getChapterWeeklyTargetProgress(type, subName, `Ch. ${chNum}`) : null;
                    if (prog && prog.isSizeBased && prog.total > 0 && prog.completed > 0) {
                        completedCount += Math.min(1, prog.completed / prog.total);
                    }
                }
            }
        } else {
            groupTasks.forEach(x => {
                if (x.skipped) {
                    skippedCount++;
                } else if (x.completed) {
                    completedCount += 1;
                } else {
                    const prog = window.getChapterWeeklyTargetProgress ? window.getChapterWeeklyTargetProgress(type, subName, x.chapter) : null;
                    if (prog && prog.isSizeBased && prog.total > 0 && prog.completed > 0) {
                        completedCount += Math.min(1, prog.completed / prog.total);
                    }
                }
            });
        }

        const totalChapters = sObj ? Math.max(0, sObj.chapters - skippedCount) : 1;
        const progressPct = isFrozenSub ? 100 : (totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 100);
        const displayCompleted = isFrozenSub ? totalChapters : ((completedCount % 1 === 0) ? completedCount : (Math.round(completedCount * 10) / 10));

        const textEl = safeGetEl(`group-text-${safeSubId}`);
        if (textEl) textEl.innerHTML = `${displayCompleted} <span class="opacity-60 text-[9px] mx-0.5">/</span> ${totalChapters} <span class="opacity-60">CH</span>`;

        const pctEl = safeGetEl(`group-pct-${safeSubId}`);
        if (pctEl) pctEl.textContent = `${progressPct}%`;

        const barEl = safeGetEl(`group-bar-${safeSubId}`);
        if (barEl) barEl.style.width = `${progressPct}%`;

        // 3. Optimistic UI update: Recalculate 4 specific analytics cards inside subject view
        const allSubTasks = AppState.tasks.filter(t => t.type === 'study' && t[key] && t[key].some(b => b.subject === subName));

        let targetDate = null;
        let startDate = null;
        let hasTimeGoal = false;

        if (window.subjectTimeLinks && window.subjectTimeLinks[subName]) {
            const link = window.subjectTimeLinks[subName];
            if (link.type === 'date') {
                hasTimeGoal = true;
                if (link.startDate && typeof Utils !== 'undefined') startDate = Utils.parseDateSafe(link.startDate);
                if (link.date && typeof Utils !== 'undefined') targetDate = Utils.parseDateSafe(link.date);
            } else if (link.type === 'goal' && Array.isArray(window.paceGoals)) {
                const pg = window.paceGoals.find(g => g.id === link.id);
                if (pg) {
                    hasTimeGoal = true;
                    if (pg.startDate && typeof Utils !== 'undefined') startDate = Utils.parseDateSafe(pg.startDate);
                    if (pg.deadline && typeof Utils !== 'undefined') targetDate = Utils.parseDateSafe(pg.deadline);
                }
            }
        }

        if (!hasTimeGoal) {
            let firstCompletedDay = allSubTasks.find(t => t[key] && t[key].some(b => b.subject === subName && b.completed));
            if (firstCompletedDay) {
                let taskO = firstCompletedDay[key].find(b => b.subject === subName && b.completed);
                if (taskO && taskO.completedAt) {
                    startDate = new Date(taskO.completedAt);
                } else {
                    startDate = getTaskDateSafe(firstCompletedDay);
                }
            }
        }

        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (targetDate) targetDate.setHours(23, 59, 59, 999);

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const msPerDay = 1000 * 60 * 60 * 24;

        let remainingCh = Math.max(0, totalChapters - completedCount);
        let actPaceRaw = 0;
        let reqPaceRaw = 0;

        let actualStartDateForPace = null;
        let firstCompletedDayForPace = allSubTasks.find(t => t[key] && t[key].some(b => b.subject === subName && b.completed));
        if (firstCompletedDayForPace) {
            let taskO = firstCompletedDayForPace[key].find(b => b.subject === subName && b.completed);
            actualStartDateForPace = taskO && taskO.completedAt ? new Date(taskO.completedAt) : getTaskDateSafe(firstCompletedDayForPace);
            if (actualStartDateForPace && !isNaN(actualStartDateForPace.getTime())) {
                actualStartDateForPace.setHours(0, 0, 0, 0);
            }
        }

        let daysElapsed = 0;
        if (totalChapters > 0) {
            if (completedCount > 0 && actualStartDateForPace && actualStartDateForPace <= today) {
                daysElapsed = Math.floor((today - actualStartDateForPace) / msPerDay) + 1;
                actPaceRaw = completedCount / daysElapsed;
            } else if (startDate && startDate <= today) {
                daysElapsed = Math.floor((today - startDate) / msPerDay) + 1;
                actPaceRaw = completedCount / daysElapsed;
            }

            if (hasTimeGoal && targetDate) {
                if (today > targetDate) {
                    reqPaceRaw = remainingCh > 0 ? remainingCh : 0;
                } else {
                    let baselineDateForReq = (startDate && startDate > today) ? startDate : today;
                    const daysRemaining = Math.max(1, Math.ceil((targetDate - baselineDateForReq) / msPerDay));
                    reqPaceRaw = remainingCh / daysRemaining;
                }
            }
        }

        const actPaceStr = actPaceRaw.toFixed(2);
        const reqPaceStr = hasTimeGoal ? reqPaceRaw.toFixed(2) : '--';

        let estFinishStr = '--';
        let estDaysNeededStr = '<span class="opacity-60">Unknown</span>';
        if (isFrozenSub || completedCount >= totalChapters) {
            estFinishStr = '<span class="text-emerald-500 font-black">Finished</span>';
            estDaysNeededStr = '<span class="text-emerald-500 font-bold">0 Days</span>';
        } else if (completedCount === 0) {
            estFinishStr = '<span class="text-slate-400 text-[10px]">No Data</span>';
        } else if (actPaceRaw > 0) {
            const daysLeft = remainingCh / actPaceRaw;
            const estDate = new Date(today.getTime() + (daysLeft * msPerDay));
            estFinishStr = estDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            estDaysNeededStr = `${Math.ceil(daysLeft)} Days Needed`;
        }

        let timeGoalCountdownStr = '';
        if (isFrozenSub || completedCount >= totalChapters) {
            timeGoalCountdownStr = '<span class="text-emerald-500 font-bold">Done</span>';
        } else if (!hasTimeGoal) {
            timeGoalCountdownStr = '<span class="text-slate-400 font-bold">No Goal</span>';
        } else {
            let diffDaysTG = Math.ceil((targetDate - today) / msPerDay);
            if (diffDaysTG > 0) timeGoalCountdownStr = `${diffDaysTG} Days Left`;
            else if (diffDaysTG === 0) timeGoalCountdownStr = `<span class="text-orange-500 font-bold">Due Today</span>`;
            else timeGoalCountdownStr = `<span class="text-red-500 font-bold">${Math.abs(diffDaysTG)} Days Overdue</span>`;
        }

        const reqEl = safeGetEl(`tg-req-${safeSubId}`);
        if (reqEl) reqEl.textContent = reqPaceStr;

        const actEl = safeGetEl(`tg-act-${safeSubId}`);
        if (actEl) actEl.textContent = actPaceStr;

        let subjectDaysPassedStr = '<span class="opacity-60">0 Days Passed</span>';
        if (completedCount > 0 && daysElapsed > 0 && typeof Utils !== 'undefined' && typeof Utils.formatDaysPassed === 'function') {
            subjectDaysPassedStr = `${Utils.formatDaysPassed(daysElapsed)} Passed`;
        }
        const actDaysEl = safeGetEl(`tg-act-days-${safeSubId}`);
        if (actDaysEl) actDaysEl.innerHTML = subjectDaysPassedStr;

        const estEl1 = safeGetEl(`tg-est-${safeSubId}`);
        if (estEl1) estEl1.innerHTML = estFinishStr;

        const estEl2 = safeGetEl(`header-est-${safeSubId}`);
        if (estEl2) estEl2.innerHTML = estFinishStr;

        const tgDaysEl = safeGetEl(`tg-tg-days-${safeSubId}`);
        if (tgDaysEl) tgDaysEl.innerHTML = timeGoalCountdownStr;

        const estDaysEl = safeGetEl(`tg-est-days-${safeSubId}`);
        if (estDaysEl) estDaysEl.innerHTML = estDaysNeededStr;

        // Core global metrics update and cloud sync
        if (typeof window.updateMetrics === 'function') {
            window.updateMetrics();
        }
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        // Smart background debounce for heavy trend chart updates
        if (window.chartDebounce) clearTimeout(window.chartDebounce);
        window.chartDebounce = setTimeout(() => {
            if (typeof window.renderTrendCharts === 'function') {
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(window.renderTrendCharts);
                } else {
                    window.renderTrendCharts();
                }
            }
        }, 600);
    }

    // =========================================================================
    // 4. TASK EDIT MODAL & DELETION
    // =========================================================================

    function openEditModal(taskId, type, subTaskId = null) {
        if (!AppState.tasks) return;
        let taskIndex = typeof taskId === 'number' ? AppState.tasks.findIndex(t => t.id === taskId) : -1;
        const key = type + 'Tasks';

        // If it was an unscheduled task (unsched-...), slot it first or locate it
        if (taskIndex === -1 && subTaskId && typeof subTaskId === 'string' && subTaskId.startsWith('unsched-')) {
            const parts = subTaskId.split('-');
            const chNum = parts[parts.length - 1];
            const subId = parts.slice(2, parts.length - 1).join('-');
            const allSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
            const sObj = allSubs.find(s => s.subject.replace(/[^a-zA-Z0-9]/g, '-') === subId);
            const subj = sObj ? sObj.subject : subId;
            const formattedCh = `Ch. ${chNum}`;

            ensureAvailableSlots(1, type, 0);
            for (let i = 0; i < AppState.tasks.length; i++) {
                if (AppState.tasks[i].type === 'study' && Array.isArray(AppState.tasks[i][key])) {
                    const bIdx = AppState.tasks[i][key].findIndex(b => b.subject === 'Revision');
                    if (bIdx > -1) {
                        AppState.tasks[i][key][bIdx] = {
                            subject: subj,
                            chapter: formattedCh,
                            title: `Topic ${chNum}`,
                            completed: false,
                            id: AppState.tasks[i][key][bIdx].id
                        };
                        taskIndex = i;
                        taskId = AppState.tasks[i].id;
                        subTaskId = AppState.tasks[i][key][bIdx].id;
                        break;
                    }
                }
            }
        }

        if (taskIndex === -1) return;
        const dayTask = AppState.tasks[taskIndex];
        let taskObj = (dayTask[key] || []).find(b => b.id === subTaskId);
        if (!taskObj) return;

        window.editingTask = { taskId, type, subTaskId, oldSubject: taskObj.subject };
        const prog = type;
        const subjSelect = safeGetEl('edit-task-subject');
        if (subjSelect) {
            subjSelect.innerHTML = '<option value="Revision">Revision (Empty Slot)</option>';

            if (window.customPrograms && window.customPrograms[prog]) {
                window.customPrograms[prog].forEach(p => {
                    const pName = p.name || p;
                    const subs = (window.syllabusStructure && window.syllabusStructure[prog] ? window.syllabusStructure[prog] : []).filter(s => s.program === pName);
                    if (subs.length > 0) {
                        let groupHtml = `<optgroup label="${pName}">`;
                        subs.forEach(s => { groupHtml += `<option value="${s.subject}" ${s.subject === taskObj.subject ? 'selected' : ''}>${s.subject}</option>`; });
                        groupHtml += `</optgroup>`;
                        subjSelect.innerHTML += groupHtml;
                    }
                });
            }
        }

        let chNum = taskObj.chapter ? taskObj.chapter.replace('Ch. ', '') : '';
        if (taskObj.subject === 'Revision') chNum = '';
        const numEl = safeGetEl('edit-task-num');
        if (numEl) numEl.value = chNum;
        const titleEl = safeGetEl('edit-task-title');
        if (titleEl) titleEl.value = taskObj.title === 'Practice' ? '' : (taskObj.title || '');

        const skipBtn = safeGetEl('etm-skip-btn');
        const skipText = safeGetEl('etm-skip-btn-text');
        if (skipBtn && skipText) {
            if (taskObj.subject === 'Revision') {
                skipBtn.classList.add('hidden');
            } else {
                skipBtn.classList.remove('hidden');
                if (taskObj.skipped) {
                    skipText.textContent = "Unskip Chapter";
                    skipBtn.className = "text-slate-650 dark:text-slate-350 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 hover:dark:bg-slate-700 border border-slate-200 dark:border-slate-700/80 font-black text-[10px] uppercase tracking-widest py-2 px-4 rounded-lg transition-colors flex items-center space-x-1.5 active:scale-95 shadow-sm";
                } else {
                    skipText.textContent = "Skip Chapter";
                    skipBtn.className = "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-black text-[10px] uppercase tracking-widest py-2 px-4 rounded-lg transition-colors flex items-center space-x-1.5 active:scale-95";
                }
            }
        }

        if (typeof window.openModal === 'function') {
            window.openModal('edit-task-modal');
        }
    }

    function toggleSkipTask() {
        if (!window.editingTask || !AppState.tasks) return;
        const { taskId, type, subTaskId } = window.editingTask;
        const taskIndex = AppState.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const key = type + 'Tasks';
        if (Array.isArray(AppState.tasks[taskIndex][key])) {
            const bIdx = AppState.tasks[taskIndex][key].findIndex(b => b.id === subTaskId);
            if (bIdx > -1) {
                const isSkipped = !!AppState.tasks[taskIndex][key][bIdx].skipped;
                AppState.tasks[taskIndex][key][bIdx].skipped = !isSkipped;
                if (!isSkipped) {
                    AppState.tasks[taskIndex][key][bIdx].completed = false;
                    AppState.tasks[taskIndex][key][bIdx].completedAt = null;

                    const skippedSub = AppState.tasks[taskIndex][key][bIdx].subject;
                    const skippedCh = AppState.tasks[taskIndex][key][bIdx].chapter;

                    // 1. Clean up from monthlyTargetsDatabase
                    if (window.monthlyTargetsDatabase) {
                        Object.keys(window.monthlyTargetsDatabase).forEach(mKey => {
                            const mList = window.monthlyTargetsDatabase[mKey] || [];
                            for (let i = mList.length - 1; i >= 0; i--) {
                                const mt = mList[i];
                                if (mt.track === type && mt.subject === skippedSub && (mt.chapter === skippedCh || mt.chapter === `Ch. ${skippedCh}`)) {
                                    const mtTid = mt.id || (typeof window.generateItemId === 'function' ? window.generateItemId(mt, `monthlyTargetsDatabase_${mKey}`) : null);
                                    if (mtTid && typeof window.recordItemDeletion === 'function') window.recordItemDeletion(mtTid);
                                    mList.splice(i, 1);
                                }
                            }
                        });
                    }

                    // 2. Clean up from weeklyTargetsDatabase
                    if (window.weeklyTargetsDatabase) {
                        Object.keys(window.weeklyTargetsDatabase).forEach(wKey => {
                            const wList = window.weeklyTargetsDatabase[wKey] || [];
                            for (let i = wList.length - 1; i >= 0; i--) {
                                const wt = wList[i];
                                if (wt.track === type && wt.subject === skippedSub && (wt.chapter === skippedCh || wt.chapter === `Ch. ${skippedCh}`)) {
                                    const wtTid = wt.id || (typeof window.generateItemId === 'function' ? window.generateItemId(wt, `weeklyTargetsDatabase_${wKey}`) : null);
                                    if (wtTid && typeof window.recordItemDeletion === 'function') window.recordItemDeletion(wtTid);
                                    wList.splice(i, 1);
                                }
                            }
                        });
                    }

                    // 3. Clean up from dailyTargetsDatabase
                    if (window.dailyTargetsDatabase) {
                        Object.keys(window.dailyTargetsDatabase).forEach(dKey => {
                            const dList = window.dailyTargetsDatabase[dKey] || [];
                            dList.forEach(dt => {
                                if (dt.track === type && dt.subject === skippedSub && (dt.chapter === skippedCh || dt.chapter === `Ch. ${skippedCh}`)) {
                                    dt.isDeleted = true;
                                    const dtTid = dt.id || (typeof window.generateItemId === 'function' ? window.generateItemId(dt, `dailyTargetsDatabase_${dKey}`) : null);
                                    if (dtTid && typeof window.recordItemDeletion === 'function') window.recordItemDeletion(dtTid);
                                }
                            });
                        });
                    }
                }
            }
        }

        if (typeof window.recalculateTotals === 'function') window.recalculateTotals();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();
        if (typeof window.renderUI === 'function') window.renderUI();
        if (typeof window.closeModal === 'function') window.closeModal('edit-task-modal');
        if (typeof window.showToast === 'function') window.showToast("Chapter status updated!", "success");
    }

    function saveTaskEdit() {
        if (!window.editingTask || !AppState.tasks) return;
        const { taskId, type, subTaskId, oldSubject } = window.editingTask;
        const taskIndex = AppState.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const prog = type;
        const subjEl = safeGetEl('edit-task-subject');
        const numEl = safeGetEl('edit-task-num');
        const titleEl = safeGetEl('edit-task-title');

        const newSubject = subjEl ? subjEl.value : oldSubject;
        let newNum = numEl ? numEl.value : '';
        let newTitle = titleEl ? titleEl.value : '';

        if (newSubject === 'Revision') {
            requestDeleteTask();
            return;
        }

        newNum = newNum ? `Ch. ${newNum}` : 'Ch. ?';
        newTitle = newTitle || 'Topic';

        const key = type + 'Tasks';
        if (oldSubject === newSubject) {
            const bIdx = (AppState.tasks[taskIndex][key] || []).findIndex(b => b.id === subTaskId);
            if (bIdx > -1) {
                AppState.tasks[taskIndex][key][bIdx] = { ...AppState.tasks[taskIndex][key][bIdx], chapter: newNum, title: newTitle };
            }
            reorderSubjectChapters(prog, newSubject);
        } else {
            if (oldSubject !== 'Revision' && window.syllabusStructure && window.syllabusStructure[prog]) {
                const oldS = window.syllabusStructure[prog].find(s => s.subject === oldSubject);
                if (oldS && oldS.chapters > 0) oldS.chapters--;
            }
            const bIdx = (AppState.tasks[taskIndex][key] || []).findIndex(b => b.id === subTaskId);
            if (bIdx > -1) {
                AppState.tasks[taskIndex][key][bIdx] = { subject: newSubject, chapter: newNum, title: newTitle, completed: false, id: subTaskId };
            }
            if (window.syllabusStructure && window.syllabusStructure[prog]) {
                const newS = window.syllabusStructure[prog].find(s => s.subject === newSubject);
                if (newS) newS.chapters++;
            }
            reorderSubjectChapters(prog, oldSubject);
            reorderSubjectChapters(prog, newSubject);
        }

        if (typeof window.recalculateTotals === 'function') window.recalculateTotals();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();
        if (typeof window.renderUI === 'function') window.renderUI();
        if (typeof window.closeModal === 'function') window.closeModal('edit-task-modal');
        if (typeof window.showToast === 'function') window.showToast("Task updated successfully!", "success");
    }

    function requestDeleteTask() {
        if (typeof window.openConfirmModal === 'function') {
            window.openConfirmModal("Clear Task Slot", "Are you sure you want to clear this task? The subsequent schedule will automatically shift up.", deleteTask);
        } else {
            deleteTask();
        }
    }

    function deleteTask() {
        if (!window.editingTask || !AppState.tasks) return;
        const { taskId, type, subTaskId, oldSubject } = window.editingTask;
        const taskIndex = AppState.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const prog = type;
        const key = type + 'Tasks';

        if (oldSubject !== 'Revision' && window.syllabusStructure && window.syllabusStructure[prog]) {
            const oldS = window.syllabusStructure[prog].find(s => s.subject === oldSubject);
            if (oldS && oldS.chapters > 0) oldS.chapters--;
        }

        if (Array.isArray(AppState.tasks[taskIndex][key])) {
            AppState.tasks[taskIndex][key] = AppState.tasks[taskIndex][key].map(b => b.id === subTaskId ? { subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: b.id } : b);
        }

        if (oldSubject !== 'Revision') {
            let targetSlots = [];
            let gatheredTasks = [];
            for (let i = 0; i < AppState.tasks.length; i++) {
                if (AppState.tasks[i].type !== 'study') continue;
                if (Array.isArray(AppState.tasks[i][key])) {
                    for (let j = 0; j < AppState.tasks[i][key].length; j++) {
                        const bTask = AppState.tasks[i][key][j];
                        if (!bTask.completed && (bTask.subject === oldSubject || (i === taskIndex && bTask.id === subTaskId))) {
                            targetSlots.push({ tIdx: i, bIdx: j });
                            gatheredTasks.push({ ...bTask });
                        }
                    }
                }
            }

            gatheredTasks.sort((a, b) => {
                if (a.subject === 'Revision') return 1;
                if (b.subject === 'Revision') return -1;
                const extractNum = (typeof Utils !== 'undefined' && typeof Utils.extractNum === 'function')
                    ? Utils.extractNum
                    : (str => { const m = String(str).match(/\d+/); return m ? parseInt(m[0], 10) : 0; });
                return extractNum(a.chapter) - extractNum(b.chapter);
            });

            for (let k = 0; k < targetSlots.length; k++) {
                const slot = targetSlots[k];
                const chObj = gatheredTasks[k];
                AppState.tasks[slot.tIdx][key][slot.bIdx] = { ...chObj, id: AppState.tasks[slot.tIdx][key][slot.bIdx].id };
            }
        }

        if (typeof window.recalculateTotals === 'function') window.recalculateTotals();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();
        if (typeof window.renderUI === 'function') window.renderUI();
        if (typeof window.closeModal === 'function') window.closeModal('edit-task-modal');
        if (typeof window.showToast === 'function') window.showToast("Task deleted and schedule shifted up.", "success");
    }

    // =========================================================================
    // 5. TASK LIST & CARD RENDERING
    // =========================================================================

    function setFilter(val) {
        AppState.currentFilter = val;
        window.subjectDetailsState = {};
        if (typeof window.renderSubjectNavigation === 'function') window.renderSubjectNavigation();
        renderTaskList();
        if (typeof window.updateMetrics === 'function') window.updateMetrics();
        if (typeof window.renderTrendCharts === 'function') window.renderTrendCharts();
    }

    /**
     * Initializes delegated event listeners for the Tasks feature.
     * Uses container delegation on #task-list to eliminate repeated per-element listener registration.
     * Includes idempotency guards to prevent duplicate listener accumulation.
     */
    function initTaskEventListeners() {
        const list = safeGetEl('task-list');
        if (list && !list._taskListenersBound) {
            list._taskListenersBound = true;
            list.addEventListener('change', (e) => {
                if (e.target && e.target.classList && e.target.classList.contains('task-checkbox')) {
                    handleTaskToggle(e);
                }
            });
        }

        const editModal = safeGetEl('edit-task-modal');
        if (editModal && !editModal._taskListenersBound) {
            editModal._taskListenersBound = true;
            editModal.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target && (e.target.id === 'edit-task-num' || e.target.id === 'edit-task-title')) {
                    e.preventDefault();
                    if (typeof window !== 'undefined' && typeof window.saveTaskEdit === 'function') {
                        window.saveTaskEdit();
                    } else if (typeof saveTaskEdit === 'function') {
                        saveTaskEdit();
                    }
                }
            });
        }

        const modalContainer = typeof document !== 'undefined' ? (document.body || document) : null;
        if (modalContainer && typeof modalContainer.addEventListener === 'function' && !modalContainer._taskModalsBound) {
            modalContainer._taskModalsBound = true;
            modalContainer.addEventListener('click', (e) => {
                if (e.target.closest('#etm-delete-btn, [data-task-delete]')) {
                    e.preventDefault();
                    requestDeleteTask();
                } else if (e.target.closest('#etm-skip-btn, [data-task-skip]')) {
                    e.preventDefault();
                    toggleSkipTask();
                } else if (e.target.closest('#etm-save-btn, [data-task-save]')) {
                    e.preventDefault();
                    saveTaskEdit();
                } else if (e.target.closest('#etem-save-btn, [data-timeline-save]')) {
                    e.preventDefault();
                    if (typeof window !== 'undefined' && typeof window.saveTimelineEntryDate === 'function') {
                        window.saveTimelineEntryDate();
                    }
                } else if (e.target.closest('#stm-clear-btn, [data-time-clear]')) {
                    e.preventDefault();
                    clearSubjectTimeGoal();
                } else if (e.target.closest('#stm-save-btn, [data-time-save]')) {
                    e.preventDefault();
                    saveSubjectTimeGoal();
                }
            });
        }
    }

    function renderTaskList() {
        const list = safeGetEl('task-list');
        if (!list) return;
        initTaskEventListeners();
        list.className = 'flex flex-col space-y-6 md:space-y-8 w-full pb-4';

        let subjectsToRender = [];
        const allSubjects = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
        const allPrograms = typeof window.getAllPrograms === 'function' ? window.getAllPrograms() : [];

        if (AppState.currentFilter === 'All') {
            subjectsToRender = allSubjects.map(s => s.subject);
        } else {
            const isProgram = allPrograms.some(p => (p.name || p) === AppState.currentFilter);
            if (isProgram) {
                subjectsToRender = allSubjects.filter(s => s.program === AppState.currentFilter).map(s => s.subject);
            } else {
                subjectsToRender = [AppState.currentFilter];
            }
        }

        const grouped = {};
        subjectsToRender.forEach(sub => {
            let track = null;
            let sObj = null;
            if (Array.isArray(window.tracks) && window.syllabusStructure) {
                for (const t of window.tracks) {
                    if (window.syllabusStructure[t.id]) {
                        sObj = window.syllabusStructure[t.id].find(s => s.subject === sub);
                        if (sObj) { track = t.id; break; }
                    }
                }
            }
            if (sObj) {
                grouped[sub] = {
                    type: track,
                    program: sObj.program,
                    totalChapters: sObj.chapters,
                    tasks: []
                };
            }
        });

        if (AppState.tasks && Array.isArray(AppState.tasks)) {
            AppState.tasks.forEach(t => {
                if (t.type === 'study') {
                    if (Array.isArray(window.tracks)) {
                        window.tracks.forEach(trackObj => {
                            const trackId = trackObj.id;
                            const key = trackId + 'Tasks';
                            if (t[key]) {
                                t[key].forEach(b => {
                                    if (grouped[b.subject]) {
                                        grouped[b.subject].tasks.push({ dayObj: t, taskObj: b, type: trackId });
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }

        let html = '';
        for (const sub in grouped) {
            const group = grouped[sub];
            const sObj = allSubjects.find(s => s.subject === sub);
            const safeSubId = sub.replace(/[^a-zA-Z0-9]/g, '-');
            const isFrozen = (window.passedItems && window.passedItems.subjects && window.passedItems.subjects.includes(sub)) ||
                (window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(group.program));

            let allChapterTasks = [];
            if (sObj && sObj.chapters > 0) {
                for (let chNum = 1; chNum <= sObj.chapters; chNum++) {
                    const existingTask = group.tasks.find(x => {
                        const chStr = x.taskObj.chapter;
                        if (chStr === `Ch. ${chNum}` || chStr === `Ch.${chNum}` || chStr === String(chNum)) return true;
                        const match = chStr ? chStr.match(/(\d+)(?!.*\d)/) : null;
                        return match && parseInt(match[0], 10) === chNum;
                    });

                    if (existingTask) {
                        allChapterTasks.push(existingTask);
                    } else {
                        allChapterTasks.push({
                            dayObj: { studyDay: chNum, id: `unsched-${safeSubId}-${chNum}` },
                            taskObj: {
                                subject: sub,
                                chapter: `Ch. ${chNum}`,
                                title: `Topic ${chNum}`,
                                completed: false,
                                id: `unsched-${safeSubId}-${chNum}`
                            },
                            type: group.type
                        });
                    }
                }
            } else {
                allChapterTasks = group.tasks;
            }

            const skippedCount = getSubjectSkippedCount(sub, group.type);
            const completedCount = allChapterTasks.filter(x => !x.taskObj.skipped && x.taskObj.completed).length;
            const totalChapters = sObj ? Math.max(0, sObj.chapters - skippedCount) : allChapterTasks.length;
            const progressPct = isFrozen ? 100 : (totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 100);

            const subjectColor = typeof window.getSubjectColor === 'function' ? window.getSubjectColor(sub) : '#3b82f6';
            const cleanSubName = sub;

            let blockHtml = `
                <div class="bg-slate-50/70 dark:bg-slate-900/40 rounded-3xl p-4 sm:p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
                        <div class="flex items-center gap-3">
                            <span class="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style="background-color: ${subjectColor}"></span>
                            <div class="flex flex-col">
                                <span class="font-black text-slate-800 dark:text-slate-100 text-base md:text-lg tracking-tight">${cleanSubName}</span>
                                <span class="text-[9px] uppercase font-bold tracking-widest text-slate-400">${group.program} Program</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 self-end sm:self-auto">
                            <span id="group-text-${safeSubId}" class="text-xs font-black text-slate-600 dark:text-slate-300">${completedCount} <span class="opacity-60 text-[9px] mx-0.5">/</span> ${totalChapters} <span class="opacity-60">CH</span></span>
                            <span id="group-pct-${safeSubId}" class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">${progressPct}%</span>
                        </div>
                    </div>
                    <div class="w-full bg-slate-200/60 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-5">
                        <div id="group-bar-${safeSubId}" class="h-full rounded-full transition-all duration-500 ease-out" style="width: ${progressPct}%; background-color: ${subjectColor};"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            `;

            allChapterTasks.forEach(item => {
                blockHtml += generateSingleTaskHtml(item.dayObj, item.taskObj, item.type);
            });

            blockHtml += `
                    </div>
                </div>
            `;

            html += blockHtml;
        }

        if (html === '') {
            html = `<div class="flex flex-col items-center py-12 text-slate-400"><span class="text-4xl mb-4">📭</span><p class="font-black uppercase tracking-widest text-sm">No tasks scheduled for this selection</p></div>`;
        }

        list.innerHTML = html;
        // Event delegation on #task-list handles all dynamic .task-checkbox changes without per-element listener binding
    }

    function generateSingleTaskHtml(dayObj, taskObj, type) {
        let subjectColor = '#3b82f6';
        if (typeof window.getSubjectColor === 'function') {
            subjectColor = window.getSubjectColor(taskObj.subject);
        }

        const isSkipped = !!taskObj.skipped;

        let progressPercent = 0;
        let progressTextHtml = '';
        let isSizeBased = false;

        const progress = window.getChapterWeeklyTargetProgress
            ? window.getChapterWeeklyTargetProgress(type, taskObj.subject, taskObj.chapter)
            : null;

        if (progress && progress.isSizeBased && progress.total > 0) {
            isSizeBased = true;
            progressPercent = progress.percent;
            progressTextHtml = `<span class="text-[9px] text-blue-500 font-bold ml-1.5">(${progress.completed}/${progress.total} p)</span>`;
        }

        const isCompleted = !isSkipped && (!!taskObj.completed || (isSizeBased && progressPercent >= 100));

        let cardClass = 'relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[110px] overflow-hidden group';
        let barBgStyle = `background-color: ${subjectColor};`;
        let cardStyle = '';

        const isDarkMode = typeof document !== 'undefined' && document.documentElement && document.documentElement.classList && document.documentElement.classList.contains('dark');

        if (isSkipped) {
            cardClass += ' border border-slate-350 bg-slate-50/50 dark:bg-slate-900/20 !border-slate-300 dark:!border-slate-800 opacity-60';
            barBgStyle = `background-color: ${isDarkMode ? '#475569' : '#94a3b8'};`;
        } else if (isCompleted) {
            cardClass += ' border';
            cardStyle = `border-color: ${subjectColor}; background-color: ${isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'};`;
            barBgStyle = `background-color: ${subjectColor};`;
        } else {
            cardClass += ' border border-slate-100 dark:border-slate-700';
            if (isSizeBased && progressPercent > 0) {
                const fillRgba = hexToRgbaSafe(subjectColor, isDarkMode ? 0.25 : 0.15);
                cardStyle = `background: linear-gradient(to right, ${fillRgba} ${progressPercent}%, transparent ${progressPercent}%); border-color: ${isDarkMode ? '#334155' : '#e2e8f0'};`;
            }
        }

        return `
            <div id="single-task-${taskObj.id}-${dayObj.studyDay}" class="${cardClass}" style="${cardStyle}">
                <div class="absolute top-0 left-0 w-full h-1" style="${barBgStyle} transition: background-color 0.3s;"></div>
                <div class="flex justify-between items-start mb-3 mt-1">
                    <span class="text-[9px] px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded-md font-black tracking-widest uppercase">${typeof dayObj.studyDay === 'number' ? `DAY ${dayObj.studyDay}` : 'CH ' + (taskObj.chapter ? taskObj.chapter.replace(/\D/g, '') : dayObj.studyDay)} ${isSkipped ? '<span class="text-amber-600 dark:text-amber-400 font-extrabold ml-1">(SKIPPED)</span>' : ''}</span>
                    <button onclick="openEditModal(${typeof dayObj.id === 'number' ? dayObj.id : `'${dayObj.id}'`}, '${type}', '${taskObj.id}')" class="text-slate-400 hover:text-blue-500 active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700" title="Edit/Delete Task">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                </div>
                <div class="flex items-end justify-between mt-auto gap-3">
                    <div class="flex flex-col pr-1">
                        <span class="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base tracking-tight leading-tight mb-0.5 ${isCompleted ? 'line-through text-emerald-700 dark:text-emerald-400 opacity-70' : ''} ${isSkipped ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-400' : ''}">${taskObj.chapter || ''}</span>
                        <span class="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 ${isCompleted ? 'line-through opacity-60' : ''} ${isSkipped ? 'opacity-55' : ''}">${taskObj.title || ''}${progressTextHtml}</span>
                    </div>
                    <div class="shrink-0 mb-0.5">
                        <div class="relative flex items-center justify-center">
                            <input type="checkbox" data-stud-id="${dayObj.studyDay}" data-subtask-id="${taskObj.id}" data-type="${type}" data-subject="${taskObj.subject}" data-chapter="${taskObj.chapter}" class="task-checkbox peer relative appearance-none w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 checked:bg-emerald-500 checked:border-emerald-500 focus:outline-none cursor-pointer transition-all shadow-sm hover:border-emerald-400" ${isCompleted ? 'checked' : ''} ${isSkipped ? 'disabled bg-slate-100 dark:bg-slate-800 border-slate-200 cursor-not-allowed' : ''}>
                            <svg class="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    function generateRevisionTaskHtml(sub, chNum, isCompleted) {
        const safeSub = sub.replace(/[^a-zA-Z0-9]/g, '-');
        const safeSubQuotes = sub.replace(/'/g, "\\'");
        return `
            <div id="rev-task-${safeSub}-${chNum}" class="relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-700 flex flex-col justify-between min-h-[110px] overflow-hidden group select-none ${isCompleted ? 'ring-1 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20 !border-blue-200 dark:!border-blue-800' : ''}">
                <div class="absolute top-0 left-0 w-full h-1 ${isCompleted ? 'bg-blue-500' : 'bg-blue-300 dark:bg-blue-700'} transition-colors"></div>
                <div class="flex justify-start items-center mb-3 mt-1">
                    <span class="text-[9px] px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md font-black tracking-widest uppercase border border-blue-100 dark:border-blue-800/50">REVISION</span>
                </div>
                <div class="flex items-end justify-between mt-auto gap-3">
                    <div class="flex flex-col pr-1">
                        <span class="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base tracking-tight leading-tight mb-0.5 ${isCompleted ? 'line-through text-blue-700 dark:text-blue-400 opacity-70' : ''}">Ch. ${chNum}</span>
                        <span class="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug ${isCompleted ? 'line-through opacity-60' : ''}">Revision Practice</span>
                    </div>
                    <div class="shrink-0 mb-0.5">
                        <div class="relative flex items-center justify-center">
                            <input type="checkbox" onchange="window.toggleRevisionChapter('${safeSubQuotes}', ${chNum}, this.checked)" class="peer relative appearance-none w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 checked:bg-blue-500 checked:border-blue-500 focus:outline-none cursor-pointer transition-all shadow-sm hover:border-blue-400" ${isCompleted ? 'checked' : ''}>
                            <svg class="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    // =========================================================================
    // 6. REVISION MODE & MODAL
    // =========================================================================

    function openRevisionModal() {
        renderRevisionModalContent();
        if (typeof window.openModal === 'function') {
            window.openModal('revision-manage-modal');
        }
    }

    function renderRevisionModalContent() {
        const container = safeGetEl('rmm-subjects-container');
        if (!container) return;
        let html = '';

        if (Array.isArray(window.tracks) && window.customPrograms && window.syllabusStructure) {
            window.tracks.map(t => t.id).forEach(track => {
                if (Array.isArray(window.customPrograms[track])) {
                    window.customPrograms[track].forEach(prog => {
                        const progName = prog.name || prog;
                        const subs = (window.syllabusStructure[track] || []).filter(s => s.program === progName);
                        if (subs.length > 0) {
                            html += `<div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"><h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">${progName}</h4><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
                            subs.forEach(s => {
                                const isRevising = window.revisionData && window.revisionData.active && window.revisionData.active.includes(s.subject);
                                let displaySub = s.subject.replace(progName + ' - ', '').replace(progName + ' ', '');
                                html += `
                                    <label class="flex items-center space-x-3 cursor-pointer p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 active:scale-95 transition-all shadow-sm">
                                        <input type="checkbox" onchange="window.toggleRevisionMode('${s.subject.replace(/'/g, "\\'")}')" class="form-checkbox h-4 w-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500 transition-all" ${isRevising ? 'checked' : ''}>
                                        <span class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${s.subject}">${displaySub}</span>
                                    </label>`;
                            });
                            html += `</div></div>`;
                        }
                    });
                }
            });
        }
        container.innerHTML = html;
    }

    function toggleRevisionMode(sub) {
        if (!window.revisionData) window.revisionData = { active: [], progress: {} };
        if (!window.revisionData.active) window.revisionData.active = [];

        if (window.revisionData.active.includes(sub)) {
            window.revisionData.active = window.revisionData.active.filter(s => s !== sub);
        } else {
            window.revisionData.active.push(sub);
            if (!window.revisionData.progress[sub]) window.revisionData.progress[sub] = {};
        }

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();
        if (typeof window.renderUI === 'function') window.renderUI();
        renderRevisionModalContent();

        const actionText = window.revisionData.active.includes(sub) ? "started" : "closed";
        if (typeof window.showToast === 'function') window.showToast(`Revision mode ${actionText} for ${sub}!`, "success");
    }

    function toggleRevisionChapter(sub, chNum, isChecked) {
        if (!window.revisionData) window.revisionData = { active: [], progress: {} };
        if (!window.revisionData.progress[sub]) window.revisionData.progress[sub] = {};
        window.revisionData.progress[sub][chNum] = isChecked ? new Date().toISOString() : false;

        const cardEl = safeGetEl(`rev-task-${sub.replace(/[^a-zA-Z0-9]/g, '-')}-${chNum}`);
        if (cardEl) {
            const titleEl = cardEl.querySelector('.tracking-tight');
            const descEl = cardEl.querySelector('.line-clamp-2');
            const accentBar = cardEl.querySelector('.absolute.top-0.left-0');

            if (titleEl) {
                if (isChecked) titleEl.classList.add('line-through', 'text-blue-700', 'dark:text-blue-400', 'opacity-70');
                else titleEl.classList.remove('line-through', 'text-blue-700', 'dark:text-blue-400', 'opacity-70');
            }
            if (descEl) {
                if (isChecked) descEl.classList.add('line-through', 'opacity-60');
                else descEl.classList.remove('line-through', 'opacity-60');
            }

            if (isChecked) {
                cardEl.classList.add('ring-1', 'ring-blue-500', 'bg-blue-50/50', 'dark:bg-blue-900/20');
                cardEl.classList.remove('bg-white', 'dark:bg-slate-800');
                if (accentBar) accentBar.className = 'absolute top-0 left-0 w-full h-1 bg-blue-500 transition-colors';
            } else {
                cardEl.classList.remove('ring-1', 'ring-blue-500', 'bg-blue-50/50', 'dark:bg-blue-900/20');
                cardEl.classList.add('bg-white', 'dark:bg-slate-800');
                if (accentBar) accentBar.className = 'absolute top-0 left-0 w-full h-1 bg-blue-300 dark:bg-blue-700 transition-colors';
            }
        }

        const safeSubId = sub.replace(/[^a-zA-Z0-9]/g, '-');
        const allSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
        const sObj = allSubs.find(s => s.subject === sub);
        const skippedCount = getSubjectSkippedCount(sub);
        const totalChapters = sObj ? Math.max(0, sObj.chapters - skippedCount) : 1;
        const completedCount = Object.values(window.revisionData.progress[sub]).filter(Boolean).length;
        const progressPct = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 100;

        const textEl = safeGetEl(`rev-group-text-${safeSubId}`);
        if (textEl) textEl.innerHTML = `${completedCount} <span class="opacity-60 text-[9px] mx-0.5">/</span> ${totalChapters} <span class="opacity-60">CH</span>`;
        const pctEl = safeGetEl(`rev-group-pct-${safeSubId}`);
        if (pctEl) pctEl.textContent = `${progressPct}%`;
        const barEl = safeGetEl(`rev-group-bar-${safeSubId}`);
        if (barEl) barEl.style.width = `${progressPct}%`;

        if (typeof window.updateMetrics === 'function') window.updateMetrics();
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();

        if (window.chartDebounce) clearTimeout(window.chartDebounce);
        window.chartDebounce = setTimeout(() => {
            if (typeof window.renderTrendCharts === 'function') {
                if (typeof requestAnimationFrame === 'function') requestAnimationFrame(window.renderTrendCharts);
                else window.renderTrendCharts();
            }
        }, 600);
    }

    // =========================================================================
    // EXPORTS & GLOBAL ASSIGNMENTS
    // =========================================================================

    const TaskEngine = {
        generateStudyPlan,
        ensureAvailableSlots,
        reorderSubjectChapters,
        rebuildTaskDates,
        getTaskDate,
        getTaskForDate,
        isSubjectPassed,
        isChapterCompleted,
        isChapterSkipped,
        findTaskChapter,
        syncTaskChapterCompletion,
        getChaptersForSubject,
        isSubjectCompleted,
        getChapterStatus,
        getSubjectSkippedCount,
        handleTaskToggle,
        openEditModal,
        toggleSkipTask,
        saveTaskEdit,
        requestDeleteTask,
        deleteTask,
        setFilter,
        renderTaskList,
        initTaskEventListeners,
        generateSingleTaskHtml,
        generateRevisionTaskHtml,
        openRevisionModal,
        renderRevisionModalContent,
        toggleRevisionMode,
        toggleRevisionChapter
    };

    // Assign onto global/window
    window.TaskEngine = TaskEngine;

    window.generateStudyPlan = generateStudyPlan;
    window.ensureAvailableSlots = ensureAvailableSlots;
    window.reorderSubjectChapters = reorderSubjectChapters;
    window.rebuildTaskDates = rebuildTaskDates;
    window.getTaskDate = getTaskDate;
    window.getTaskForDate = getTaskForDate;

    window.isSubjectPassed = isSubjectPassed;
    window.isChapterCompleted = isChapterCompleted;
    window.isChapterSkipped = isChapterSkipped;
    window.findTaskChapter = findTaskChapter;
    window.syncTaskChapterCompletion = syncTaskChapterCompletion;
    window.getChaptersForSubject = getChaptersForSubject;
    window.isSubjectCompleted = isSubjectCompleted;
    window.getChapterStatus = getChapterStatus;
    window.getSubjectSkippedCount = getSubjectSkippedCount;

    window.handleTaskToggle = handleTaskToggle;
    window.openEditModal = openEditModal;
    window.toggleSkipTask = toggleSkipTask;
    window.saveTaskEdit = saveTaskEdit;
    window.requestDeleteTask = requestDeleteTask;
    window.deleteTask = deleteTask;

    window.setFilter = setFilter;
    window.renderTaskList = renderTaskList;
    window.initTaskEventListeners = initTaskEventListeners;
    window.generateSingleTaskHtml = generateSingleTaskHtml;
    window.generateRevisionTaskHtml = generateRevisionTaskHtml;

    window.openRevisionModal = openRevisionModal;
    window.renderRevisionModalContent = renderRevisionModalContent;
    window.toggleRevisionMode = toggleRevisionMode;
    window.toggleRevisionChapter = toggleRevisionChapter;
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initTaskEventListeners);
        } else {
            initTaskEventListeners();
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TaskEngine;
    }

})(typeof window !== 'undefined' ? window : global);
