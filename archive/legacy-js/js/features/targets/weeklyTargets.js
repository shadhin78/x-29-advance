/**
 * X-29 Feature Module: Weekly Targets & WTDB System (weeklyTargets.js)
 *
 * Responsibilities:
 * 1. Weekly Targets Management:
 *    - Saturday-to-Friday 7-day range calculation and canonical week key resolution.
 *    - Dropdown population (Program -> Subject -> Chapter) with passed and occurrence indicators.
 *    - Subject color sync (subSelect and color dot).
 *    - Add, edit, delete, and completion toggling for weekly targets.
 *    - Week navigation (Past, Present, Future) with active tab styling.
 *    - Weekly checklist renderer with size-based progress bar, pacing calculations, and multi-week badges.
 * 2. Multi-Week Target Synchronization:
 *    - syncMultiWeekTargetsToWeeklyDatabase (reconciles across weekly targets and monthly targets).
 *    - consolidateWeeklyTargetsDatabase (maps divided month weeks to canonical 7-day week ranges).
 * 3. Weekly Targets Database (WTDB):
 *    - WTDB modal controls (open, tab switching, backdrop/card animations).
 *    - Multi-criteria filter population (weeks, programs, subjects, status).
 *    - Filterable table view of all weekly targets with completion toggling and deletion.
 *    - Inline addition of weekly targets via WTDB modal.
 * 4. Weekly Trend Visualization:
 *    - Month-wise target distribution calculation (proportional 1/7 allocation per day).
 *    - Bar chart trend rendering (Targets Set vs Targets Completed) via Chart.js.
 *    - Month-wise summary table with completion percentages and dynamic color coding.
 * 5. Weekly -> Daily Synchronization Logic:
 *    - autoSyncWeeklyToDailyTargets (propagates weekly targets by dayName into dailyTargetsDatabase).
 *    - Bi-directional completion synchronization with daily targets, multi-week instances, and study tasks.
 *
 * State:
 * - Strictly preserves `weeklyTargetsDatabase`, `monthlyTargetsDatabase`, and `dailyTargetsDatabase`.
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
        } else if (typeof global.saveToCloud === 'function') {
            global.saveToCloud(immediate);
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

    function safeParseDate(val) {
        if (!val) return new Date();
        if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
        if (typeof val === 'number') return isNaN(val) ? new Date() : new Date(val);
        const utils = global.Utils || {};
        if (typeof utils.parseStart === 'function') {
            const parsed = utils.parseStart(val);
            if (parsed instanceof Date) return isNaN(parsed.getTime()) ? new Date() : parsed;
            if (typeof parsed === 'number' && !isNaN(parsed) && parsed > 0) return new Date(parsed);
        }
        if (typeof utils.parseDateSafe === 'function') {
            const parsed = utils.parseDateSafe(val);
            if (parsed instanceof Date && !isNaN(parsed.getTime())) return parsed;
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? new Date() : d;
    }

    function safeHexToRgba(hex, alpha) {
        if (typeof global !== 'undefined' && typeof global.hexToRgba === 'function') {
            return global.hexToRgba(hex, alpha);
        }
        if (typeof window !== 'undefined' && typeof window.hexToRgba === 'function') {
            return window.hexToRgba(hex, alpha);
        }
        if (typeof Utils !== 'undefined' && typeof Utils.hexToRgba === 'function') {
            return Utils.hexToRgba(hex, alpha);
        }
        if (typeof require === 'function') {
            try { return require('../../utils/colors.js').hexToRgba(hex, alpha); } catch (e) {}
        }
        return `rgba(59, 130, 246, ${alpha})`;
    }

    // Initialize databases on global if missing
    global.weeklyTargetsDatabase = global.weeklyTargetsDatabase || {};
    global.dailyTargetsDatabase = global.dailyTargetsDatabase || {};
    global.currentWeeklyTargetsDate = global.currentWeeklyTargetsDate || null;

    /* ==========================================================================
       1. Core Date Range & Formatting Helpers
       ========================================================================== */

    function getWeeklyTargetRange(date = new Date()) {
        const today = new Date(date);
        today.setHours(0, 0, 0, 0);
        const day = today.getDay(); // 0 is Sun, 6 is Sat
        const daysSinceSat = (day === 6) ? 0 : (day + 1);

        const startOfWeek = new Date(today.getTime() - (daysSinceSat * 24 * 60 * 60 * 1000));
        startOfWeek.setHours(0, 1, 0, 0); // Sat 00:01 AM

        const endOfWeek = new Date(startOfWeek.getTime() + (6 * 24 * 60 * 60 * 1000));
        endOfWeek.setHours(23, 59, 59, 999); // Fri 11:59 PM

        return { start: startOfWeek, end: endOfWeek, daysSinceSat: daysSinceSat };
    }

    function formatDateRangeKey(start, end) {
        const opt = { day: '2-digit', month: 'short', year: 'numeric' };
        const startStr = start.toLocaleDateString('en-GB', opt);
        const endStr = end.toLocaleDateString('en-GB', opt);
        return `${startStr} - ${endStr}`;
    }

    function getCanonicalWeeklyRangeKey(input) {
        if (!input) return null;
        let targetDate = null;
        if (input instanceof Date) {
            targetDate = input;
        } else if (typeof input === 'string') {
            const parts = input.split(' - ');
            const startStr = parts[0];
            targetDate = (global.Utils && typeof global.Utils.parseDateSafe === 'function')
                ? global.Utils.parseDateSafe(startStr)
                : new Date(startStr);
        }
        if (!targetDate || isNaN(targetDate.getTime())) return null;
        const range = getWeeklyTargetRange(targetDate);
        return formatDateRangeKey(range.start, range.end);
    }

    /* ==========================================================================
       2. Occurrence, Sizing & Progress Calculations
       ========================================================================== */

    function getWeeklyTargetOccurrenceCount(track, subject, chapter) {
        let count = 0;
        if (!global.weeklyTargetsDatabase) return 0;
        const matchFn = global.isChapterMatch || (global.Utils && global.Utils.isChapterMatch);
        Object.keys(global.weeklyTargetsDatabase).forEach(weekKey => {
            const list = global.weeklyTargetsDatabase[weekKey] || [];
            const match = list.some(t => t && t.track === track && t.subject === subject && (matchFn ? matchFn(t.chapter, chapter) : t.chapter === chapter));
            if (match) count++;
        });
        return count;
    }

    function getCompletedSizeForWeeklyTarget(target, weekKey) {
        let completedSize = 0;
        if (!global.dailyTargetsDatabase || !target) return 0;

        if (!weekKey) {
            const currentRange = getWeeklyTargetRange();
            weekKey = formatDateRangeKey(currentRange.start, currentRange.end);
        }

        const matchFn = global.isChapterMatch || (global.Utils && global.Utils.isChapterMatch);

        Object.keys(global.dailyTargetsDatabase).forEach(dateKey => {
            const d = safeParseDailyTargetDateKey(dateKey);
            const isInWeek = global.isDateInWeekRange
                ? global.isDateInWeekRange(d, weekKey)
                : (global.Utils && global.Utils.isDateInWeekRange ? global.Utils.isDateInWeekRange(d, weekKey) : false);
            if (!isInWeek) return;

            const dailyTargets = global.dailyTargetsDatabase[dateKey] || [];
            dailyTargets.forEach(dt => {
                if (!dt.isDeleted && dt.completed && dt.track === target.track && dt.subject === target.subject) {
                    const isMatching = matchFn ? matchFn(dt.chapter, target.chapter) : (dt.chapter === target.chapter);
                    if (isMatching && dt.totalChapterSize) {
                        completedSize += parseFloat(dt.totalChapterSize);
                    }
                }
            });
        });
        return completedSize;
    }

    function getAllocatedSizeForWeeklyTarget(target, weekKey) {
        let allocatedSize = 0;
        if (!global.dailyTargetsDatabase || !target) return 0;

        if (!weekKey) {
            const currentRange = getWeeklyTargetRange();
            weekKey = formatDateRangeKey(currentRange.start, currentRange.end);
        }

        const matchFn = global.isChapterMatch || (global.Utils && global.Utils.isChapterMatch);

        Object.keys(global.dailyTargetsDatabase).forEach(dateKey => {
            const d = safeParseDailyTargetDateKey(dateKey);
            const isInWeek = global.isDateInWeekRange
                ? global.isDateInWeekRange(d, weekKey)
                : (global.Utils && global.Utils.isDateInWeekRange ? global.Utils.isDateInWeekRange(d, weekKey) : false);
            if (!isInWeek) return;

            const dailyTargets = global.dailyTargetsDatabase[dateKey] || [];
            dailyTargets.forEach(dt => {
                if (!dt.isDeleted && dt.track === target.track && dt.subject === target.subject) {
                    const isMatching = matchFn ? matchFn(dt.chapter, target.chapter) : (dt.chapter === target.chapter);
                    if (isMatching && dt.totalChapterSize) {
                        allocatedSize += parseFloat(dt.totalChapterSize);
                    }
                }
            });
        });
        return allocatedSize;
    }

    function getWeeklyTargetProgress(target, weekKey) {
        if (!target) return { completed: 0, total: 0, percent: 0 };
        const total = target.totalChapterSize ? parseFloat(target.totalChapterSize) : 0;
        if (total <= 0) {
            return { completed: 0, total: 0, percent: 0 };
        }
        const completed = getCompletedSizeForWeeklyTarget(target, weekKey);
        const percent = Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
        return { completed: completed, total: total, percent: percent };
    }

    function getChapterWeeklyTargetProgress(track, subject, chapter, weekKey = null) {
        if (!global.weeklyTargetsDatabase) return { completed: 0, total: 0, percent: 0, isSizeBased: false, target: null, weekKey: null };

        const matchFn = global.isChapterMatch || (global.Utils && global.Utils.isChapterMatch);
        const isMatch = (t) => {
            if (!t) return false;
            if (track && t.track && t.track !== track) return false;
            if (t.subject !== subject) return false;
            return matchFn ? matchFn(t.chapter, chapter) : (t.chapter === chapter);
        };

        // 1. If explicit weekKey provided, check that week first
        if (weekKey && global.weeklyTargetsDatabase[weekKey]) {
            const target = global.weeklyTargetsDatabase[weekKey].find(t => isMatch(t) && t.totalChapterSize);
            if (target) {
                const progress = getWeeklyTargetProgress(target, weekKey);
                return { completed: progress.completed, total: progress.total, percent: progress.percent, isSizeBased: true, target: target, weekKey: weekKey };
            }
        }

        // 2. Check current week
        const currentRange = getWeeklyTargetRange(global.currentDailyTargetsDate || new Date());
        const currentWeekKey = formatDateRangeKey(currentRange.start, currentRange.end);
        if (global.weeklyTargetsDatabase[currentWeekKey]) {
            const target = global.weeklyTargetsDatabase[currentWeekKey].find(t => isMatch(t) && t.totalChapterSize);
            if (target) {
                const progress = getWeeklyTargetProgress(target, currentWeekKey);
                return { completed: progress.completed, total: progress.total, percent: progress.percent, isSizeBased: true, target: target, weekKey: currentWeekKey };
            }
        }

        // 3. Search across all weeks in weeklyTargetsDatabase (sorted by latest week start)
        const allWeekKeys = Object.keys(global.weeklyTargetsDatabase).sort((a, b) => {
            const d1 = (global.Utils && global.Utils.parseStart) ? global.Utils.parseStart(a) : new Date(0);
            const d2 = (global.Utils && global.Utils.parseStart) ? global.Utils.parseStart(b) : new Date(0);
            return d2 - d1;
        });

        for (const wk of allWeekKeys) {
            const list = global.weeklyTargetsDatabase[wk] || [];
            const target = list.find(t => isMatch(t) && t.totalChapterSize);
            if (target) {
                const progress = getWeeklyTargetProgress(target, wk);
                return { completed: progress.completed, total: progress.total, percent: progress.percent, isSizeBased: true, target: target, weekKey: wk };
            }
        }

        return { completed: 0, total: 0, percent: 0, isSizeBased: false, target: null, weekKey: null };
    }

    /* ==========================================================================
       3. Multi-Week Target Synchronization
       ========================================================================== */

    function consolidateWeeklyTargetsDatabase() {
        if (!global.weeklyTargetsDatabase || typeof global.weeklyTargetsDatabase !== 'object') return;

        let modified = false;
        const allKeys = Object.keys(global.weeklyTargetsDatabase);

        allKeys.forEach(wkKey => {
            const canonicalKey = getCanonicalWeeklyRangeKey(wkKey);
            if (canonicalKey && canonicalKey !== wkKey) {
                const list = global.weeklyTargetsDatabase[wkKey] || [];
                if (list.length > 0) {
                    if (!global.weeklyTargetsDatabase[canonicalKey]) {
                        global.weeklyTargetsDatabase[canonicalKey] = [];
                    }
                    const canonList = global.weeklyTargetsDatabase[canonicalKey];
                    list.forEach(item => {
                        const matchFn = global.isChapterMatch || (global.Utils && global.Utils.isChapterMatch);
                        const isSubject = item.targetType === 'subject' || item.chapter === 'Whole Subject';
                        const exists = isSubject
                            ? canonList.some(t => t.track === item.track && t.subject === item.subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject'))
                            : canonList.some(t => t.track === item.track && t.subject === item.subject && (matchFn ? matchFn(t.chapter, item.chapter) : t.chapter === item.chapter));
                        if (!exists) {
                            canonList.push({
                                ...item,
                                dividedWeekKey: item.dividedWeekKey || item.targetWeek || wkKey
                            });
                            modified = true;
                        }
                    });
                }
                delete global.weeklyTargetsDatabase[wkKey];
                modified = true;
            }
        });

        if (modified && global.AppState) {
            global.AppState.weeklyTargetsDatabase = global.weeklyTargetsDatabase;
        }
    }

    function syncMultiWeekTargetsToWeeklyDatabase() {
        if (!global.weeklyTargetsDatabase || typeof global.weeklyTargetsDatabase !== 'object') {
            global.weeklyTargetsDatabase = {};
        }

        let modified = false;
        const utils = global.Utils || {};

        // 1. Reconcile from existing multi-week entries across weeklyTargetsDatabase
        const allWKeys = Object.keys(global.weeklyTargetsDatabase);
        allWKeys.forEach(wKey => {
            const list = global.weeklyTargetsDatabase[wKey] || [];
            list.forEach(wt => {
                if (!wt) return;
                if (Array.isArray(wt.spannedWeekNums) && wt.spannedWeekNums.length > 1) {
                    const targetMonthDate = safeParseDate(wt.targetMonth || wKey || global.currentWeeklyTargetsDate || new Date());
                    const mWeeks = global.getWeeksForMonth ? global.getWeeksForMonth(targetMonthDate) : [];

                    wt.spannedWeekNums.forEach(wNumStr => {
                        const matchNum = parseInt(String(wNumStr).replace(/\D/g, ''), 10);
                        if (matchNum >= 1 && matchNum <= mWeeks.length) {
                            const targetMWeek = mWeeks[matchNum - 1];
                            if (targetMWeek && targetMWeek.key) {
                                const targetCanonicalKey = getCanonicalWeeklyRangeKey(targetMWeek.key) || targetMWeek.key;
                                if (!global.weeklyTargetsDatabase[targetCanonicalKey]) {
                                    global.weeklyTargetsDatabase[targetCanonicalKey] = [];
                                }
                                const destList = global.weeklyTargetsDatabase[targetCanonicalKey];
                                const matchFn = global.isChapterMatch || (utils.isChapterMatch);
                                const isSub = wt.targetType === 'subject' || wt.chapter === 'Whole Subject';
                                const alreadyExists = isSub
                                    ? destList.some(t => t.track === wt.track && t.subject === wt.subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject'))
                                    : destList.some(t => t.track === wt.track && t.subject === wt.subject && (matchFn ? matchFn(t.chapter, wt.chapter) : t.chapter === wt.chapter));

                                if (!alreadyExists) {
                                    destList.push({
                                        ...wt,
                                        id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                        targetWeek: targetMWeek.key,
                                        dividedWeekKey: targetMWeek.key,
                                        updatedAt: Date.now()
                                    });
                                    modified = true;
                                }
                            }
                        }
                    });
                }
            });
        });

        // 2. Synchronize from monthlyTargetsDatabase for any multi-week chapters
        if (global.monthlyTargetsDatabase) {
            Object.keys(global.monthlyTargetsDatabase).forEach(mKey => {
                const mList = global.monthlyTargetsDatabase[mKey] || [];
                const targetMonthDate = safeParseDate(mKey);
                const mWeeks = global.getWeeksForMonth ? global.getWeeksForMonth(targetMonthDate) : [];

                mList.forEach(mt => {
                    if (!mt) return;
                    const spannedWeeks = new Set();
                    if (mt.targetWeek && mt.targetWeek !== 'none') spannedWeeks.add(mt.targetWeek);
                    if (Array.isArray(mt.spannedWeeks)) mt.spannedWeeks.forEach(w => spannedWeeks.add(w));
                    if (Array.isArray(mt.spannedWeekKeys)) mt.spannedWeekKeys.forEach(w => spannedWeeks.add(w));
                    if (Array.isArray(mt.allocatedWeeks)) mt.allocatedWeeks.forEach(w => spannedWeeks.add(w));

                    // Check daily allocations
                    const allocKey = mt.subject + '|||' + mt.chapter;
                    const dailyAllocs = (global.monthlyTargetDailyAllocations && (global.monthlyTargetDailyAllocations[allocKey] || global.monthlyTargetDailyAllocations[mt.subject + '|||' + mt.chapter + '|||' + (mt.program || '')])) || [];
                    if (dailyAllocs.length > 0) {
                        dailyAllocs.forEach(a => {
                            if (a.dayKey) {
                                const wk = global.findWeekForDayInMonth ? global.findWeekForDayInMonth(a.dayKey, targetMonthDate) : '';
                                if (wk) spannedWeeks.add(wk);
                            }
                        });
                    }

                    // Check dailyTargetsDatabase
                    if (global.dailyTargetsDatabase) {
                        Object.keys(global.dailyTargetsDatabase).forEach(dKey => {
                            const dList = global.dailyTargetsDatabase[dKey] || [];
                            const hasMatch = dList.some(dt => dt && (global.isMatchMonthlyTargetWithChild ? global.isMatchMonthlyTargetWithChild(mt, dt) : (dt.subject === mt.subject && dt.chapter === mt.chapter)));
                            if (hasMatch) {
                                const wk = global.findWeekForDayInMonth ? global.findWeekForDayInMonth(dKey, targetMonthDate) : '';
                                if (wk) spannedWeeks.add(wk);
                            }
                        });
                    }

                    if (spannedWeeks.size > 1) {
                        const spannedWeekNums = [];
                        mWeeks.forEach((mw, idx) => {
                            if (spannedWeeks.has(mw.key)) {
                                spannedWeekNums.push(`W${idx + 1}`);
                            }
                        });
                        if (spannedWeekNums.length === 0) {
                            let idxCounter = 1;
                            spannedWeeks.forEach(() => {
                                spannedWeekNums.push(`W${idxCounter++}`);
                            });
                        }

                        spannedWeeks.forEach(wKey => {
                            const canonicalKey = getCanonicalWeeklyRangeKey(wKey) || wKey;
                            if (!global.weeklyTargetsDatabase[canonicalKey]) {
                                global.weeklyTargetsDatabase[canonicalKey] = [];
                            }
                            const destList = global.weeklyTargetsDatabase[canonicalKey];
                            const matchFn = global.isChapterMatch || (utils.isChapterMatch);
                            const isSub = mt.targetType === 'subject' || mt.chapter === 'Whole Subject';
                            const alreadyExists = isSub
                                ? destList.some(t => t.track === mt.track && t.subject === mt.subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject'))
                                : destList.some(t => t.track === mt.track && t.subject === mt.subject && (matchFn ? matchFn(t.chapter, mt.chapter) : t.chapter === mt.chapter));

                            if (!alreadyExists) {
                                destList.push({
                                    id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                    monthlyTargetId: mt.id,
                                    source: 'monthly',
                                    targetMonth: mKey,
                                    track: mt.track,
                                    program: mt.program,
                                    subject: mt.subject,
                                    chapter: mt.chapter,
                                    targetType: mt.targetType,
                                    completed: mt.completed || false,
                                    completedAt: mt.completedAt || null,
                                    scope: mt.scope || 'Whole Chapter',
                                    totalChapterSize: mt.totalChapterSize,
                                    targetWeek: wKey,
                                    dividedWeekKey: wKey,
                                    spannedWeekNums: spannedWeekNums,
                                    isMultiWeek: spannedWeekNums.length > 1,
                                    updatedAt: Date.now()
                                });
                                modified = true;
                            }
                        });
                    }
                });
            });
        }

        if (modified && global.AppState) {
            global.AppState.weeklyTargetsDatabase = global.weeklyTargetsDatabase;
        }
    }

    /* ==========================================================================
       4. Weekly -> Daily Synchronization Logic
       ========================================================================== */

    function autoSyncWeeklyToDailyTargets() {
        if (!global.weeklyTargetsDatabase) return;
        if (!global.dailyTargetsDatabase) global.dailyTargetsDatabase = {};

        let updated = false;
        const weekKeys = Object.keys(global.weeklyTargetsDatabase);
        const utils = global.Utils || {};

        weekKeys.forEach(weekKey => {
            const weeklyTargets = global.weeklyTargetsDatabase[weekKey] || [];
            if (weeklyTargets.length === 0) return;

            const weekDates = weekKey ? weekKey.split(' - ') : [];
            const startDate = utils.parseDateSafe ? utils.parseDateSafe(weekDates[0]) : (utils.parseStart ? utils.parseStart(weekKey) : new Date(weekDates[0]));
            const endDate = (weekDates.length === 2 && utils.parseDateSafe) ? utils.parseDateSafe(weekDates[1]) : (startDate ? new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000) : null);
            if (!startDate || isNaN(startDate.getTime())) return;

            let cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const endDay = endDate && !isNaN(endDate.getTime()) ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : new Date(cur.getTime() + 6 * 24 * 60 * 60 * 1000);

            while (cur <= endDay) {
                const d = new Date(cur);
                const dayOfWeekName = d.toLocaleDateString('en-US', { weekday: 'long' });
                const dateKey = safeFormatDate(d);

                const dayTargets = weeklyTargets.filter(t => t && t.dayName && t.dayName.toLowerCase() === dayOfWeekName.toLowerCase());

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
                            updated = true;
                        }
                    });
                }
                cur.setDate(cur.getDate() + 1);
            }
        });

        if (updated) {
            safeSaveToCloud(false);
            if (typeof global.recalculateTotals === 'function') safeRecalculateTotals();
        }
    }

    /* ==========================================================================
       5. Weekly Target Dropdown & Color Sync Helpers
       ========================================================================== */

    function updateWeeklyTargetColorSync() {
        const subSelect = document.getElementById('wt-select-sub');
        const chSelect = document.getElementById('wt-select-ch');
        const dot = document.getElementById('wt-sub-color-dot');
        if (!subSelect) return;
        const subject = subSelect.value;
        if (subject && subject !== "No Subjects") {
            const color = typeof global.getSubjectColor === 'function' ? global.getSubjectColor(subject) : '#3b82f6';
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

    function updateWeeklyTargetSubjectDropdown() {
        const progSelectEl = document.getElementById('wt-select-prog');
        const progName = progSelectEl ? progSelectEl.value : '';
        const subSelect = document.getElementById('wt-select-sub');
        if (!subSelect) return;
        subSelect.innerHTML = '';

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId) {
            subSelect.innerHTML = '<option value="">No Subjects</option>';
            updateWeeklyTargetChapterDropdown();
            return;
        }

        const syllabusStructure = global.syllabusStructure || {};
        const subs = (syllabusStructure[trackId] || []).filter(s => s.program === progName);
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
        updateWeeklyTargetChapterDropdown();
        updateWeeklyTargetColorSync();
    }

    function updateWeeklyTargetChapterDropdown() {
        const progSelectEl = document.getElementById('wt-select-prog');
        const progName = progSelectEl ? progSelectEl.value : '';
        const subSelectEl = document.getElementById('wt-select-sub');
        const subject = subSelectEl ? subSelectEl.value : '';
        const chSelect = document.getElementById('wt-select-ch');
        if (!chSelect) return;
        chSelect.innerHTML = '';

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId || !subject) {
            chSelect.innerHTML = '<option value="">No Chapters</option>';
            updateWeeklyTargetColorSync();
            return;
        }

        const getChaptersFn = global.getChaptersForSubject || (function () { return []; });
        const chapters = getChaptersFn(trackId, subject);
        if (chapters.length === 0) {
            chSelect.innerHTML = '<option value="">No Chapters</option>';
        } else {
            chapters.forEach(ch => {
                const count = getWeeklyTargetOccurrenceCount(trackId, subject, ch);
                const starCount = Math.max(0, count - 1);
                const stars = starCount > 0 ? ' ' + '★'.repeat(starCount) : '';
                chSelect.innerHTML += `<option value="${ch}">${ch}${stars}</option>`;
            });
        }
        updateWeeklyTargetColorSync();
    }

    /* ==========================================================================
       6. Weekly Target CRUD & Interaction
       ========================================================================== */

    function addWeeklyTarget() {
        const range = getWeeklyTargetRange();
        const currentWeekKey = formatDateRangeKey(range.start, range.end);

        const weekSelectEl = document.getElementById('wt-select-week');
        const targetWeekKey = weekSelectEl ? (weekSelectEl.value || currentWeekKey) : currentWeekKey;

        const progSelectEl = document.getElementById('wt-select-prog');
        const subSelectEl = document.getElementById('wt-select-sub');
        const chSelectEl = document.getElementById('wt-select-ch');
        const daySelectEl = document.getElementById('wt-select-day');
        const scopeEl = document.getElementById('wt-target-scope');
        const sizeEl = document.getElementById('wt-input-size');

        const progName = progSelectEl ? progSelectEl.value : '';
        const subject = subSelectEl ? subSelectEl.value : '';
        const chapter = chSelectEl ? chSelectEl.value : '';
        const dayName = daySelectEl ? daySelectEl.value : '';
        const scopeVal = scopeEl ? (scopeEl.value.trim() || 'Whole Chapter') : 'Whole Chapter';
        const totalSize = sizeEl && sizeEl.value ? parseInt(sizeEl.value, 10) : null;

        if (!progName || !subject || !chapter) {
            return safeShowToast("Please select a Program, Subject, and Chapter.", "error");
        }

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId) return;

        if (!global.weeklyTargetsDatabase) global.weeklyTargetsDatabase = {};
        if (!global.weeklyTargetsDatabase[targetWeekKey]) global.weeklyTargetsDatabase[targetWeekKey] = [];

        // Check if already exists in weekly targets database for selected week
        const exists = global.weeklyTargetsDatabase[targetWeekKey].some(t => t && t.track === trackId && t.subject === subject && t.chapter === chapter);
        if (exists) {
            return safeShowToast("This target is already in your weekly target list.", "error");
        }

        // Sync baseline completion status from daily AppState.tasks
        const foundTask = typeof global.findTaskChapter === 'function' ? global.findTaskChapter(trackId, subject, chapter) : null;
        const isCompletedBefore = foundTask ? (foundTask.subTask.completed || false) : false;
        const completedAtBefore = foundTask ? (foundTask.subTask.completedAt || null) : null;

        global.weeklyTargetsDatabase[targetWeekKey].push({
            id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            track: trackId,
            program: progName,
            subject: subject,
            chapter: chapter,
            completed: isCompletedBefore,
            completedAt: completedAtBefore,
            dayName: dayName || null,
            scope: scopeVal,
            totalChapterSize: totalSize,
            updatedAt: Date.now()
        });

        if (daySelectEl) daySelectEl.value = '';
        if (scopeEl) scopeEl.value = '';
        if (sizeEl) sizeEl.value = '';

        if (typeof global.markLocalMutation === 'function') global.markLocalMutation('add_weekly_target');

        autoSyncWeeklyToDailyTargets();

        safeSaveToCloud();
        safeRenderUI();
        safeCloseModal('add-weekly-target-modal');
        safeShowToast("Weekly target chapter added!", "success");
    }

    function deleteWeeklyTarget(idx, targetId = null) {
        const weekSelectEl = document.getElementById('wt-select-week');
        const selectedWeekKey = weekSelectEl ? weekSelectEl.value : null;

        let target = null;
        let actualWeekKey = selectedWeekKey;
        let actualIdx = idx;
        if (selectedWeekKey && global.weeklyTargetsDatabase && global.weeklyTargetsDatabase[selectedWeekKey]) {
            target = global.weeklyTargetsDatabase[selectedWeekKey][idx];
        } else if (targetId && global.weeklyTargetsDatabase) {
            for (const wk of Object.keys(global.weeklyTargetsDatabase)) {
                const foundIdx = (global.weeklyTargetsDatabase[wk] || []).findIndex(t => t && (t.id === targetId || t._id === targetId));
                if (foundIdx !== -1) {
                    target = global.weeklyTargetsDatabase[wk][foundIdx];
                    actualWeekKey = wk;
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
            // Orphaned target - directly purge
            if (actualWeekKey && global.weeklyTargetsDatabase && global.weeklyTargetsDatabase[actualWeekKey]) {
                const tid = target.id || (global.generateItemId ? global.generateItemId(target, `weeklyTargetsDatabase_${actualWeekKey}`) : null);
                if (tid && typeof global.recordItemDeletion === 'function') {
                    global.recordItemDeletion(tid);
                    if (target.id) global.recordItemDeletion(target.id);
                }
                if (typeof global.markLocalMutation === 'function') global.markLocalMutation('delete_weekly_target');
                global.weeklyTargetsDatabase[actualWeekKey].splice(actualIdx, 1);
                safeRecalculateTotals();
                safeSaveToCloud(true);
                safeRenderUI();
                safeShowToast("Orphaned weekly target removed.", "success");
            } else {
                safeShowToast("Weekly and Daily targets are set and managed from Add Monthly Target page.", "info");
                if (typeof global.switchPage === 'function') global.switchPage('monthly-target-setup');
            }
        }
    }

    function saveWeeklyTarget(idx, weekKey = null) {
        if (!weekKey) {
            const range = getWeeklyTargetRange();
            weekKey = formatDateRangeKey(range.start, range.end);
        }
        if (!global.weeklyTargetsDatabase || !global.weeklyTargetsDatabase[weekKey] || !global.weeklyTargetsDatabase[weekKey][idx]) return;

        const target = global.weeklyTargetsDatabase[weekKey][idx];

        const progSelectEl = document.getElementById('wt-select-prog');
        const subSelectEl = document.getElementById('wt-select-sub');
        const chSelectEl = document.getElementById('wt-select-ch');
        const daySelectEl = document.getElementById('wt-select-day');
        const sizeEl = document.getElementById('wt-input-size');

        const progName = progSelectEl ? progSelectEl.value : '';
        const subject = subSelectEl ? subSelectEl.value : '';
        const chapter = chSelectEl ? chSelectEl.value : '';
        const dayName = daySelectEl ? daySelectEl.value : '';
        const totalSize = sizeEl && sizeEl.value ? parseInt(sizeEl.value, 10) : null;

        if (!progName || !subject || !chapter) {
            return safeShowToast("Please select a Program, Subject, and Chapter.", "error");
        }

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId) return;

        const exists = global.weeklyTargetsDatabase[weekKey].some((t, i) => i !== idx && t.track === trackId && t.subject === subject && t.chapter === chapter);
        if (exists) {
            return safeShowToast("This target already exists in your weekly targets list.", "error");
        }

        const oldDayName = target.dayName;

        target.track = trackId;
        target.program = progName;
        target.subject = subject;
        target.chapter = chapter;
        target.dayName = dayName || null;
        target.totalChapterSize = totalSize;
        target.updatedAt = Date.now();

        if (oldDayName && oldDayName !== target.dayName && global.dailyTargetsDatabase) {
            const utils = global.Utils || {};
            const range = utils.parseStart ? { start: utils.parseStart(weekKey) } : getWeeklyTargetRange(safeParseDailyTargetDateKey(weekKey.split(' - ')[0]));
            for (let i = 0; i < 7; i++) {
                const startVal = typeof range.start === 'number' ? range.start : (range.start && typeof range.start.getTime === 'function' ? range.start.getTime() : new Date().getTime());
                const d = new Date(startVal + i * 24 * 60 * 60 * 1000);
                const dayOfWeekName = d.toLocaleDateString('en-US', { weekday: 'long' });
                if (dayOfWeekName === oldDayName) {
                    const oldDateKey = safeFormatDate(d);
                    const list = global.dailyTargetsDatabase[oldDateKey] || [];
                    const oldDtIdx = list.findIndex(dt => dt.track === trackId && dt.subject === subject && dt.chapter === chapter);
                    if (oldDtIdx !== -1) {
                        list[oldDtIdx].isDeleted = true;
                    }
                }
            }
        }

        autoSyncWeeklyToDailyTargets();

        safeSaveToCloud();
        safeRenderUI();
        safeCloseModal('add-weekly-target-modal');
        safeShowToast("Weekly target updated!", "success");
    }

    function syncWeeklyTargetCompletionState(weekKey, target, isCompleted) {
        if (!target) return;

        target.completed = isCompleted;
        target.completedAt = isCompleted ? (target.completedAt || new Date().toISOString()) : null;
        target.updatedAt = Date.now();

        const matchFn = global.isChapterMatch || (global.Utils && global.Utils.isChapterMatch) || (typeof window !== 'undefined' && window.isChapterMatch);

        function matchesTarget(other, checkTrack = true) {
            if (!other) return false;
            if (target.monthlyTargetId && other.monthlyTargetId && target.monthlyTargetId === other.monthlyTargetId) return true;
            if (other.id && target.id && other.id === target.id) return true;
            if (checkTrack && target.track && other.track && target.track !== other.track) return false;
            const subMatch = String(other.subject || '').trim().toLowerCase() === String(target.subject || '').trim().toLowerCase();
            if (!subMatch) return false;
            const otherIsSubject = other.targetType === 'subject' || other.chapter === 'Whole Subject' || other.chapter === 'All Chapters';
            const targetIsSubject = target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters';
            return targetIsSubject ? otherIsSubject : (!otherIsSubject && (matchFn ? matchFn(other.chapter, target.chapter) : String(other.chapter).trim().toLowerCase() === String(target.chapter).trim().toLowerCase()));
        }

        // 1. Sync with Daily Targets across the week, today, and by target ID / chapter match
        const weekDates = weekKey ? weekKey.split(' - ') : [];
        const utils = global.Utils || {};
        const startDate = utils.parseDateSafe ? utils.parseDateSafe(weekDates[0]) : (utils.parseStart ? utils.parseStart(weekKey) : new Date());
        const endDate = (weekDates.length === 2 && utils.parseDateSafe) ? utils.parseDateSafe(weekDates[1]) : new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);

        const dDb = global.dailyTargetsDatabase || (typeof window !== 'undefined' ? window.dailyTargetsDatabase : null);
        if (dDb) {
            const todayD = new Date();
            const todayMid = new Date(todayD.getFullYear(), todayD.getMonth(), todayD.getDate()).getTime();

            Object.keys(dDb).forEach(dateKey => {
                const list = dDb[dateKey] || [];
                if (!Array.isArray(list) || list.length === 0) return;

                let isInRange = false;
                let isToday = false;

                const parsedD = (typeof global.parseDailyTargetDateKey === 'function')
                    ? global.parseDailyTargetDateKey(dateKey)
                    : (utils.parseDateSafe ? utils.parseDateSafe(dateKey) : new Date(dateKey));

                if (parsedD && !isNaN(parsedD.getTime())) {
                    const dMid = new Date(parsedD.getFullYear(), parsedD.getMonth(), parsedD.getDate()).getTime();
                    if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
                        const sMid = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
                        const eMid = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
                        if (dMid >= sMid && dMid <= eMid) isInRange = true;
                    }
                    if (dMid === todayMid) isToday = true;
                }

                list.forEach(dt => {
                    if (!dt) return;
                    const isIdMatch = target.monthlyTargetId && dt.monthlyTargetId && target.monthlyTargetId === dt.monthlyTargetId;
                    const isContentMatch = matchesTarget(dt, true);
                    if (isIdMatch || (isInRange && isContentMatch) || (isToday && isContentMatch)) {
                        dt.completed = isCompleted;
                        dt.completedAt = target.completedAt;
                        dt.updatedAt = Date.now();
                    }
                });
            });

            // Fallback for sequential formatted dates within range
            if (startDate && !isNaN(startDate.getTime())) {
                let cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                while (cur <= endDay) {
                    const dateKey = safeFormatDate(cur);
                    const list = dDb[dateKey] || [];
                    list.forEach(matchingDt => {
                        if (matchingDt && matchesTarget(matchingDt, true)) {
                            matchingDt.completed = isCompleted;
                            matchingDt.completedAt = target.completedAt;
                            matchingDt.updatedAt = Date.now();
                        }
                    });
                    cur.setDate(cur.getDate() + 1);
                }
            }
        }

        // 2. Also sync completion across any other weeks for this multi-week target
        const wDb = global.weeklyTargetsDatabase || (typeof window !== 'undefined' ? window.weeklyTargetsDatabase : null);
        if (wDb) {
            Object.keys(wDb).forEach(wKey => {
                if (wKey === weekKey) return;
                const list = wDb[wKey] || [];
                list.forEach(otherWt => {
                    if (otherWt && matchesTarget(otherWt, true)) {
                        otherWt.completed = isCompleted;
                        otherWt.completedAt = target.completedAt;
                        otherWt.updatedAt = Date.now();
                    }
                });
            });
        }

        // 3. Sync with Monthly Targets database
        const mDb = global.monthlyTargetsDatabase || (typeof window !== 'undefined' ? window.monthlyTargetsDatabase : null);
        if (mDb) {
            Object.keys(mDb).forEach(mKey => {
                const mList = mDb[mKey] || [];
                mList.forEach(mt => {
                    if (mt && matchesTarget(mt, true)) {
                        mt.completed = isCompleted;
                        mt.completedAt = target.completedAt;
                        mt.updatedAt = Date.now();
                    }
                });
            });
        }

        // 4. Sync with daily study tasks (AppState.tasks)
        const syncFn = (typeof global.syncTaskChapterCompletion === 'function')
            ? global.syncTaskChapterCompletion
            : (typeof window !== 'undefined' && typeof window.syncTaskChapterCompletion === 'function' ? window.syncTaskChapterCompletion : null);
        if (syncFn) {
            syncFn(target.track, target.subject, target.chapter, isCompleted, target.completedAt);
        }

        const findFn = (typeof global.findTaskChapter === 'function')
            ? global.findTaskChapter
            : (typeof window !== 'undefined' && typeof window.findTaskChapter === 'function' ? window.findTaskChapter : null);
        const found = findFn ? findFn(target.track, target.subject, target.chapter) : null;
        if (found && found.subTask) {
            found.subTask.completed = isCompleted;
            found.subTask.completedAt = target.completedAt;
        }

        // 5. Recalculate totals and persist
        safeRecalculateTotals();
        safeSaveToCloud(false);
        safeRenderUI();

        // 6. Refresh UI components across tabs and modals
        if (typeof renderWeeklyTargets === 'function') {
            try { renderWeeklyTargets(); } catch (e) {}
        }
        if (typeof renderWtdbList === 'function') {
            try { renderWtdbList(); } catch (e) {}
        }
        const renderMonthlyFn = (typeof global.renderMonthlyTargets === 'function')
            ? global.renderMonthlyTargets
            : (typeof window !== 'undefined' && typeof window.renderMonthlyTargets === 'function' ? window.renderMonthlyTargets : null);
        if (renderMonthlyFn) {
            try { renderMonthlyFn(); } catch (e) {}
        }
        const renderDailyFn = (typeof global.renderDailyTargets === 'function')
            ? global.renderDailyTargets
            : (typeof window !== 'undefined' && typeof window.renderDailyTargets === 'function' ? window.renderDailyTargets : null);
        if (renderDailyFn) {
            try { renderDailyFn(); } catch (e) {}
        }
    }

    function toggleWeeklyTargetCompletion(idx, isCompleted, weekKey = null) {
        const weekSelectEl = document.getElementById('wt-select-week');
        let selectedWeekKey = weekKey || (weekSelectEl ? weekSelectEl.value : null) || (function () {
            if (global.currentWeeklyTargetsDate) {
                const range = getWeeklyTargetRange(global.currentWeeklyTargetsDate);
                return formatDateRangeKey(range.start, range.end);
            }
            const range = getWeeklyTargetRange();
            return formatDateRangeKey(range.start, range.end);
        })();

        if (selectedWeekKey && global.weeklyTargetsDatabase && !global.weeklyTargetsDatabase[selectedWeekKey]) {
            const canonical = getCanonicalWeeklyRangeKey(selectedWeekKey);
            if (canonical && global.weeklyTargetsDatabase[canonical]) {
                selectedWeekKey = canonical;
            }
        }

        if (!selectedWeekKey || !global.weeklyTargetsDatabase || !global.weeklyTargetsDatabase[selectedWeekKey] || !global.weeklyTargetsDatabase[selectedWeekKey][idx]) return;

        const target = global.weeklyTargetsDatabase[selectedWeekKey][idx];
        syncWeeklyTargetCompletionState(selectedWeekKey, target, isCompleted);
        safeShowToast("Chapter completion state synchronized!", "success");
    }

    function navigateWeek(mode) {
        const weekSelectEl = document.getElementById('wt-select-week');
        const utils = global.Utils || {};
        if (!global.currentWeeklyTargetsDate) {
            const selectedWeekKey = weekSelectEl ? weekSelectEl.value : null;
            global.currentWeeklyTargetsDate = selectedWeekKey ? safeParseDate(selectedWeekKey) : new Date();
        }

        if (mode === 'past') {
            global.currentWeeklyTargetsDate.setDate(global.currentWeeklyTargetsDate.getDate() - 7);
        } else if (mode === 'future') {
            global.currentWeeklyTargetsDate.setDate(global.currentWeeklyTargetsDate.getDate() + 7);
        } else {
            global.currentWeeklyTargetsDate = new Date();
        }

        renderWeeklyTargets();
    }

    function openAddWeeklyTargetModal() {
        safeShowToast("Weekly and Daily targets are set and managed from Add Monthly Target page.", "info");
        if (typeof global.switchPage === 'function') global.switchPage('monthly-target-setup');
    }

    function openEditWeeklyTargetModal(idx, weekKey = null) {
        if (!weekKey) {
            const range = getWeeklyTargetRange();
            weekKey = formatDateRangeKey(range.start, range.end);
        }
        if (!global.weeklyTargetsDatabase || !global.weeklyTargetsDatabase[weekKey] || !global.weeklyTargetsDatabase[weekKey][idx]) {
            if (typeof global.switchPage === 'function') global.switchPage('monthly-target-setup');
            return;
        }

        const target = global.weeklyTargetsDatabase[weekKey][idx];
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
            if (typeof global.switchPage === 'function') global.switchPage('monthly-target-setup');
        }
    }

    function openEditWeeklyTargetModalFromWtdb(weekKey, idx) {
        safeCloseModal('weekly-targets-db-modal');
        setTimeout(() => {
            openEditWeeklyTargetModal(idx, weekKey);
        }, 350);
    }

    /* ==========================================================================
       7. Weekly Target Checklist Renderer
       ========================================================================== */

    function renderWeeklyTargets() {
        syncMultiWeekTargetsToWeeklyDatabase();
        if (typeof global.cleanOrphanedWeeklyAndDailyTargets === 'function') {
            global.cleanOrphanedWeeklyAndDailyTargets();
        }
        consolidateWeeklyTargetsDatabase();
        syncMultiWeekTargetsToWeeklyDatabase();

        const listContainer = document.getElementById('weekly-targets-list');
        const progDropdown = document.getElementById('wt-select-prog');
        const weekSelectEl = document.getElementById('wt-select-week');
        if (!listContainer || !progDropdown || !weekSelectEl) return;

        const utils = global.Utils || {};
        if (!global.currentWeeklyTargetsDate) {
            const currentSelectedWeek = weekSelectEl.value;
            global.currentWeeklyTargetsDate = currentSelectedWeek ? safeParseDate(currentSelectedWeek) : new Date();
        }

        // 1. Calculate active week range & current present week range
        const activeRange = getWeeklyTargetRange(global.currentWeeklyTargetsDate);
        const activeWeekKey = formatDateRangeKey(activeRange.start, activeRange.end);

        const currentRange = getWeeklyTargetRange(new Date());
        const currentWeekKey = formatDateRangeKey(currentRange.start, currentRange.end);

        // 2. Collect all weeks in database + current week + active week
        if (!global.weeklyTargetsDatabase) global.weeklyTargetsDatabase = {};

        const allWeeksSet = new Set(Object.keys(global.weeklyTargetsDatabase));
        allWeeksSet.add(currentWeekKey);
        allWeeksSet.add(activeWeekKey);

        const allWeeks = Array.from(allWeeksSet).sort((a, b) => {
            return safeParseDate(b).getTime() - safeParseDate(a).getTime();
        });

        // 3. Update week selector options
        weekSelectEl.innerHTML = '';
        allWeeks.forEach(wk => {
            weekSelectEl.innerHTML += `<option value="${wk}">${wk}</option>`;
        });
        weekSelectEl.value = activeWeekKey;

        // 4. Update Header displays
        const rangeDisplayEl = document.getElementById('wt-selected-week-range');
        if (rangeDisplayEl) rangeDisplayEl.textContent = `[ ${activeWeekKey} ]`;

        const todayDate = new Date();
        const weekday = todayDate.toLocaleDateString('en-GB', { weekday: 'long' });
        const formattedToday = todayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const todayDisplayEl = document.getElementById('wt-today-display');
        if (todayDisplayEl) todayDisplayEl.textContent = `Today: ${weekday}, ${formattedToday}`;

        const btnPast = document.getElementById('wt-btn-past');
        const btnPresent = document.getElementById('wt-btn-present');
        const btnFuture = document.getElementById('wt-btn-future');

        const activeClass = "bg-blue-600 text-white shadow";
        const inactiveClass = "text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50";

        if (btnPast && btnPresent && btnFuture) {
            const startDiff = activeRange.start.getTime() - currentRange.start.getTime();
            btnPresent.className = `px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all ${activeWeekKey === currentWeekKey ? activeClass : inactiveClass}`;
            btnPast.className = `px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all ${startDiff < 0 ? activeClass : inactiveClass} flex items-center space-x-1`;
            btnFuture.className = `px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all ${startDiff > 0 ? activeClass : inactiveClass} flex items-center space-x-1`;
        }

        // 5. Keep add form container visible for all weeks
        const addFormContainer = document.getElementById('wt-add-form-container');
        if (addFormContainer) {
            addFormContainer.classList.remove('hidden');
        }

        // 6. Update Programs / Subjects / Chapters selectors
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

        const currentSelectedProg = progDropdown.value;
        if (progDropdown.options && progDropdown.options.length !== activeProgs.length) {
            progDropdown.innerHTML = '';
            activeProgs.forEach(p => {
                progDropdown.innerHTML += `<option value="${p}">${p}</option>`;
            });
            if (activeProgs.length > 0) {
                if (activeProgs.includes(currentSelectedProg)) {
                    progDropdown.value = currentSelectedProg;
                }
                updateWeeklyTargetSubjectDropdown();
            }
        }

        // 7. Render targets list
        listContainer.innerHTML = '';
        const targetsList = global.weeklyTargetsDatabase[activeWeekKey] || [];

        let totalTargets = targetsList.length;
        let completedTargets = 0;

        targetsList.forEach((target, idx) => {
            const foundTask = typeof global.findTaskChapter === 'function' ? global.findTaskChapter(target.track, target.subject, target.chapter) : null;
            const progress = getWeeklyTargetProgress(target, activeWeekKey);
            const isCompleted = target.completed || (foundTask && foundTask.subTask ? foundTask.subTask.completed : false) || (target.totalChapterSize && progress.percent >= 100);
            if (isCompleted) completedTargets++;

            const subjectColor = typeof global.getSubjectColor === 'function' ? global.getSubjectColor(target.subject) : '#10b981';
            const isDarkMode = document.documentElement && document.documentElement.classList ? document.documentElement.classList.contains('dark') : false;

            const statusColor = isCompleted
                ? 'bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'bg-slate-50/50 dark:bg-slate-900/30';

            const cardBorderColorClass = isCompleted ? '' : 'border-slate-200 dark:border-slate-700';

            let bgStyle = `border-color: ${isCompleted ? subjectColor : (isDarkMode ? '#334155' : '#e2e8f0')};`;
            if (!isCompleted && target.totalChapterSize && progress.percent > 0) {
                const fillRgba = safeHexToRgba(subjectColor, isDarkMode ? 0.25 : 0.15);
                bgStyle += `background: linear-gradient(to right, ${fillRgba} ${progress.percent}%, transparent ${progress.percent}%);`;
            }

            let displaySub = target.subject ? target.subject.replace(target.program + ' - ', '').replace(target.program + ' ', '') : '';

            const occurrenceCount = getWeeklyTargetOccurrenceCount(target.track, target.subject, target.chapter);
            let starsHtml = '';
            if (occurrenceCount > 1) {
                starsHtml = `<span class="inline-flex text-amber-500 text-[10px] ml-1.5" title="Added as target ${occurrenceCount} times">${'★'.repeat(occurrenceCount - 1)}</span>`;
            }

            const progressTextHtml = target.totalChapterSize ? `<span class="text-[9px] text-blue-500 font-bold ml-1.5">(${progress.completed}/${progress.total} p)</span>` : '';
            const targetScope = target.scope || 'Whole Chapter';

            // Check if this target spans multiple weeks
            let multiWeekBadgeHtml = '';
            let targetSpannedWeekNums = [];
            if (Array.isArray(target.spannedWeekNums) && target.spannedWeekNums.length > 1) {
                targetSpannedWeekNums = target.spannedWeekNums;
            } else if (global.weeklyTargetsDatabase) {
                const weeksWithThisTarget = [];
                Object.keys(global.weeklyTargetsDatabase).forEach(wKey => {
                    const list = global.weeklyTargetsDatabase[wKey] || [];
                    const found = list.some(t => t && t.subject === target.subject && t.chapter === target.chapter && (target.monthlyTargetId ? t.monthlyTargetId === target.monthlyTargetId : true));
                    if (found) weeksWithThisTarget.push(wKey);
                });
                if (weeksWithThisTarget.length > 1) {
                    const targetMonthDate = safeParseDate(target.targetMonth || global.currentWeeklyTargetsDate || new Date());
                    const mWeeks = global.getWeeksForMonth ? global.getWeeksForMonth(targetMonthDate) : [];
                    mWeeks.forEach((mw, wIdx) => {
                        if (weeksWithThisTarget.includes(mw.key)) {
                            targetSpannedWeekNums.push(`W${wIdx + 1}`);
                        }
                    });
                    if (targetSpannedWeekNums.length === 0) {
                        targetSpannedWeekNums = weeksWithThisTarget.map((_, i) => `W${i + 1}`);
                    }
                }
            }

            if (targetSpannedWeekNums.length > 1) {
                multiWeekBadgeHtml = `
                    <span class="inline-block px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60" title="Target spans multiple weeks: ${targetSpannedWeekNums.join(', ')}">
                        [ ${targetSpannedWeekNums.join(' ')} ]
                    </span>
                `;
            }

            const itemHtml = `
                    <div class="flex items-center justify-between p-3 rounded-2xl border ${statusColor} ${cardBorderColorClass} transition-all duration-300" style="${bgStyle}">
                        <div class="flex items-center space-x-3 min-w-0">
                            <input type="checkbox" 
                                onchange="window.toggleWeeklyTargetCompletion(${idx}, this.checked)" 
                                class="form-checkbox h-4.5 w-4.5 text-emerald-500 dark:text-emerald-500 rounded border-slate-350 focus:ring-emerald-500 transition-all cursor-pointer" 
                                ${isCompleted ? 'checked' : ''}>
                            <div class="min-w-0">
                                <span class="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">${target.chapter}: ${displaySub}${starsHtml}${progressTextHtml}</span>
                                <div class="flex items-center space-x-1.5 flex-wrap">
                                    <span class="block text-[8px] font-black uppercase text-slate-400 tracking-wider">${target.program}${target.dayName ? ` • ${target.dayName}` : ''}</span>
                                    ${(target.monthlyTargetId || target.source === 'monthly') ? `
                                        <span class="inline-block px-1 py-0.5 rounded-[3px] text-[7px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50" title="Created from Monthly Target Setup">
                                            Monthly
                                        </span>
                                    ` : ''}
                                    ${multiWeekBadgeHtml}
                                    ${targetScope !== 'Whole Chapter' && targetScope !== 'Whole' ? `
                                        <span class="inline-block px-1 py-0.5 rounded-[3px] text-[7px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                                            ${targetScope}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-1 shrink-0">
                            <button onclick="window.openEditWeeklyTargetModal(${idx}, '${activeWeekKey}')" class="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-300 hover:text-blue-550 dark:hover:text-blue-400 rounded-lg transition-all active:scale-90 shadow-sm" title="Edit in Monthly Target Setup">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                </svg>
                            </button>
                            <button onclick="window.deleteWeeklyTarget(${idx}, '${target.id || ''}')" class="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-300 hover:text-red-500 rounded-lg transition-all active:scale-90 shadow-sm" title="Edit / Delete in Monthly Target Setup">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>`;
            listContainer.innerHTML += itemHtml;
        });

        if (totalTargets === 0) {
            listContainer.innerHTML = `
                    <div class="col-span-full py-8 text-center text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        No weekly targets set for this week.
                    </div>`;
        }

        // 8. Pacing metrics calculations
        const remainingTargets = totalTargets - completedTargets;
        const estFinishEl = document.getElementById('wt-est-finish');
        const reqPaceEl = document.getElementById('wt-req-pace');
        const actPaceEl = document.getElementById('wt-act-pace');

        if (activeWeekKey === currentWeekKey) {
            const daysSinceSat = currentRange.daysSinceSat;
            const daysLeft = 7 - daysSinceSat;

            const reqPace = daysLeft > 0 ? (remainingTargets / daysLeft) : 0;
            const actPace = completedTargets / (daysSinceSat + 1);

            if (reqPaceEl) reqPaceEl.textContent = `${reqPace.toFixed(2)} Ch/Day`;
            if (actPaceEl) actPaceEl.textContent = `${actPace.toFixed(2)} Ch/Day`;

            if (estFinishEl) {
                if (remainingTargets === 0) {
                    estFinishEl.textContent = 'Goal Met';
                    estFinishEl.className = 'text-xs font-black text-emerald-600 dark:text-emerald-400';
                } else if (actPace === 0) {
                    estFinishEl.textContent = 'Infinite';
                    estFinishEl.className = 'text-xs font-black text-red-600 dark:text-red-400';
                } else {
                    const daysNeeded = remainingTargets / actPace;
                    const estDate = new Date();
                    estDate.setDate(estDate.getDate() + Math.ceil(daysNeeded));

                    const opt = { day: 'numeric', month: 'short', year: 'numeric' };
                    estFinishEl.textContent = estDate.toLocaleDateString('en-GB', opt);
                    estFinishEl.className = 'text-xs font-black text-purple-600 dark:text-purple-400';
                }
            }
        } else {
            if (reqPaceEl) reqPaceEl.textContent = `0.00 Ch/Day`;
            const actPace = completedTargets / 7;
            if (actPaceEl) actPaceEl.textContent = `${actPace.toFixed(2)} Ch/Day`;

            if (estFinishEl) {
                if (remainingTargets === 0) {
                    estFinishEl.textContent = 'Goal Met';
                    estFinishEl.className = 'text-xs font-black text-emerald-600 dark:text-emerald-400';
                } else {
                    estFinishEl.textContent = 'Not Met';
                    estFinishEl.className = 'text-xs font-black text-rose-600 dark:text-rose-400';
                }
            }
        }
    }

    /* ==========================================================================
       8. Weekly Targets Database Modal Controls & Logic
       ========================================================================== */

    function openWeeklyTargetsDatabase() {
        consolidateWeeklyTargetsDatabase();
        const modal = document.getElementById('weekly-targets-db-modal');
        if (!modal) return;

        modal.classList.remove('hidden');
        setTimeout(() => {
            const backdrop = document.getElementById('wtdb-backdrop');
            const content = document.getElementById('wtdb-content');
            if (backdrop) backdrop.classList.replace('opacity-0', 'opacity-100');
            if (content) {
                content.classList.replace('scale-95', 'scale-100');
                content.classList.replace('opacity-0', 'opacity-100');
                content.classList.replace('translate-y-4', 'translate-y-0');
            }
        }, 10);

        switchWtdbTab('list');
        populateWtdbFilters();
        renderWtdbList();
    }

    function switchWtdbTab(tab) {
        const listBtn = document.getElementById('wtdb-tab-btn-list');
        const monthBtn = document.getElementById('wtdb-tab-btn-month');
        const listContent = document.getElementById('wtdb-tab-content-list');
        const monthContent = document.getElementById('wtdb-tab-content-month');

        if (tab === 'list') {
            if (listBtn) listBtn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-blue-600 text-white shadow-md whitespace-nowrap";
            if (monthBtn) monthBtn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 whitespace-nowrap";
            if (listContent) listContent.classList.remove('hidden');
            if (monthContent) monthContent.classList.add('hidden');
            renderWtdbList();
        } else {
            if (monthBtn) monthBtn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-blue-600 text-white shadow-md whitespace-nowrap";
            if (listBtn) listBtn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 whitespace-nowrap";
            if (listContent) listContent.classList.add('hidden');
            if (monthContent) monthContent.classList.remove('hidden');
            renderWtdbMonthView();
        }
    }

    function populateWtdbFilters() {
        const weekFilter = document.getElementById('wtdb-filter-week');
        const progFilter = document.getElementById('wtdb-filter-prog');
        const subFilter = document.getElementById('wtdb-filter-sub');
        const addProgSelect = document.getElementById('wtdb-add-prog');

        if (!weekFilter || !progFilter || !subFilter) return;

        const currentRange = getWeeklyTargetRange();
        const currentWeekKey = formatDateRangeKey(currentRange.start, currentRange.end);

        if (!global.weeklyTargetsDatabase) global.weeklyTargetsDatabase = {};
        const allWeeksSet = new Set(Object.keys(global.weeklyTargetsDatabase));
        allWeeksSet.add(currentWeekKey);
        const utils = global.Utils || {};
        const allWeeks = Array.from(allWeeksSet).sort((a, b) => {
            return safeParseDate(b).getTime() - safeParseDate(a).getTime();
        });

        const prevWeekVal = weekFilter.value;
        weekFilter.innerHTML = '<option value="all">All Weeks</option>';
        allWeeks.forEach(wk => {
            weekFilter.innerHTML += `<option value="${wk}">${wk}</option>`;
        });
        if (prevWeekVal) weekFilter.value = prevWeekVal;
        else weekFilter.value = currentWeekKey;

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
        if (addProgSelect) addProgSelect.innerHTML = '';
        activeProgs.forEach(p => {
            progFilter.innerHTML += `<option value="${p}">${p}</option>`;
            if (addProgSelect) addProgSelect.innerHTML += `<option value="${p}">${p}</option>`;
        });
        if (prevProgVal) progFilter.value = prevProgVal;

        if (addProgSelect) updateWtdbAddSubjectDropdown();

        const prevSubVal = subFilter.value;
        subFilter.innerHTML = '<option value="all">All Subjects</option>';
        const getAllSubsFn = global.getAllSubjects || (function () { return []; });
        getAllSubsFn().forEach(s => {
            subFilter.innerHTML += `<option value="${s.subject}">${s.subject}</option>`;
        });
        if (prevSubVal) subFilter.value = prevSubVal;
    }

    function updateWtdbAddSubjectDropdown() {
        const addProgEl = document.getElementById('wtdb-add-prog');
        if (!addProgEl) return;
        const progName = addProgEl.value;
        const subSelect = document.getElementById('wtdb-add-sub');
        if (!subSelect) return;
        subSelect.innerHTML = '';

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId) {
            subSelect.innerHTML = '<option value="">No Subjects</option>';
            updateWtdbAddChapterDropdown();
            return;
        }

        const syllabusStructure = global.syllabusStructure || {};
        const subs = (syllabusStructure[trackId] || []).filter(s => s.program === progName);
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
        updateWtdbAddChapterDropdown();
    }

    function updateWtdbAddChapterDropdown() {
        const addProgEl = document.getElementById('wtdb-add-prog');
        if (!addProgEl) return;
        const progName = addProgEl.value;
        const subSelect = document.getElementById('wtdb-add-sub');
        if (!subSelect) return;
        const subject = subSelect.value;
        const chSelect = document.getElementById('wtdb-add-ch');
        if (!chSelect) return;
        chSelect.innerHTML = '';

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId || !subject) {
            chSelect.innerHTML = '<option value="">No Chapters</option>';
            return;
        }

        const getChaptersFn = global.getChaptersForSubject || (function () { return []; });
        const chapters = getChaptersFn(trackId, subject);
        if (chapters.length === 0) {
            chSelect.innerHTML = '<option value="">No Chapters</option>';
        } else {
            chapters.forEach(ch => {
                const count = getWeeklyTargetOccurrenceCount(trackId, subject, ch);
                const starCount = Math.max(0, count - 1);
                const stars = starCount > 0 ? ' ' + '★'.repeat(starCount) : '';
                chSelect.innerHTML += `<option value="${ch}">${ch}${stars}</option>`;
            });
        }
    }

    function addWtdbTarget() {
        const weekFilter = document.getElementById('wtdb-filter-week');
        let targetWeek = weekFilter ? weekFilter.value : '';
        if (!targetWeek || targetWeek === 'all') {
            const range = getWeeklyTargetRange();
            targetWeek = formatDateRangeKey(range.start, range.end);
        }

        const progEl = document.getElementById('wtdb-add-prog');
        const subEl = document.getElementById('wtdb-add-sub');
        const chEl = document.getElementById('wtdb-add-ch');

        const progName = progEl ? progEl.value : '';
        const subject = subEl ? subEl.value : '';
        const chapter = chEl ? chEl.value : '';

        if (!progName || !subject || !chapter) {
            return safeShowToast("Please select a Program, Subject, and Chapter.", "error");
        }

        const tracks = global.tracks || [];
        const customPrograms = global.customPrograms || {};
        const trackId = tracks.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
        if (!trackId) return;

        if (!global.weeklyTargetsDatabase) global.weeklyTargetsDatabase = {};
        if (!global.weeklyTargetsDatabase[targetWeek]) global.weeklyTargetsDatabase[targetWeek] = [];

        const exists = global.weeklyTargetsDatabase[targetWeek].some(t => t && t.track === trackId && t.subject === subject && t.chapter === chapter);
        if (exists) {
            return safeShowToast("This target is already in the list for the selected week.", "error");
        }

        // Sync baseline completion status from daily AppState.tasks
        const foundTask = typeof global.findTaskChapter === 'function' ? global.findTaskChapter(trackId, subject, chapter) : null;
        const isCompletedBefore = foundTask ? (foundTask.subTask.completed || false) : false;
        const completedAtBefore = foundTask ? (foundTask.subTask.completedAt || null) : null;

        global.weeklyTargetsDatabase[targetWeek].push({
            id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            track: trackId,
            program: progName,
            subject: subject,
            chapter: chapter,
            completed: isCompletedBefore,
            completedAt: completedAtBefore,
            updatedAt: Date.now()
        });

        if (typeof global.markLocalMutation === 'function') global.markLocalMutation('add_wtdb_target');

        safeSaveToCloud();
        safeRenderUI();
        renderWtdbList();
        safeShowToast("Target added to week: " + targetWeek, "success");
    }

    function deleteWtdbTarget(weekKey, idx, targetId = null) {
        if (!global.weeklyTargetsDatabase || !global.weeklyTargetsDatabase[weekKey]) return;
        const list = global.weeklyTargetsDatabase[weekKey];

        let targetIdx = idx;
        if (targetId) {
            const foundIndex = list.findIndex(t => t && (t.id === targetId || t._id === targetId));
            if (foundIndex !== -1) targetIdx = foundIndex;
        }

        if (list && list[targetIdx]) {
            const target = list[targetIdx];
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
                safeCloseModal('weekly-targets-db-modal');
                safeShowToast("Opening Monthly Target Setup to edit/delete this target...", "info");
                if (typeof global.openEditMonthlyTargetPage === 'function') {
                    global.openEditMonthlyTargetPage(foundIdx, foundMonth);
                }
            } else {
                // Orphaned target - directly purge
                const tid = target.id || (global.generateItemId ? global.generateItemId(target, `weeklyTargetsDatabase_${weekKey}`) : null);
                if (tid && typeof global.recordItemDeletion === 'function') {
                    global.recordItemDeletion(tid);
                    if (target.id) global.recordItemDeletion(target.id);
                }
                if (typeof global.markLocalMutation === 'function') global.markLocalMutation('delete_wtdb_target');
                list.splice(targetIdx, 1);
                safeRecalculateTotals();
                safeSaveToCloud(true);
                safeRenderUI();
                renderWtdbList();
                safeShowToast("Orphaned weekly target removed.", "success");
            }
        }
    }

    function toggleWtdbTargetCompletion(weekKey, idx, isCompleted) {
        if (!global.weeklyTargetsDatabase || !global.weeklyTargetsDatabase[weekKey] || !global.weeklyTargetsDatabase[weekKey][idx]) return;

        const target = global.weeklyTargetsDatabase[weekKey][idx];
        syncWeeklyTargetCompletionState(weekKey, target, isCompleted);
        safeShowToast("Target completion state updated!", "success");
    }

    function renderWtdbList() {
        const tbody = document.getElementById('wtdb-targets-tbody');
        if (!tbody) return;

        if (typeof global.cleanOrphanedWeeklyAndDailyTargets === 'function') {
            global.cleanOrphanedWeeklyAndDailyTargets();
        }

        const wFilter = document.getElementById('wtdb-filter-week')?.value || 'all';
        const pFilter = document.getElementById('wtdb-filter-prog')?.value || 'all';
        const sFilter = document.getElementById('wtdb-filter-sub')?.value || 'all';
        const statFilter = document.getElementById('wtdb-filter-status')?.value || 'all';

        tbody.innerHTML = '';
        let matchedCount = 0;

        if (!global.weeklyTargetsDatabase) global.weeklyTargetsDatabase = {};

        Object.keys(global.weeklyTargetsDatabase).forEach(weekKey => {
            if (wFilter !== 'all' && weekKey !== wFilter) return;

            const list = global.weeklyTargetsDatabase[weekKey] || [];
            list.forEach((target, idx) => {
                if (!target) return;
                if (pFilter !== 'all' && target.program !== pFilter) return;
                if (sFilter !== 'all' && target.subject !== sFilter) return;

                const foundTask = typeof global.findTaskChapter === 'function' ? global.findTaskChapter(target.track, target.subject, target.chapter) : null;
                const isCompleted = target.completed || (foundTask && foundTask.subTask ? foundTask.subTask.completed : false);
                if (statFilter === 'completed' && !isCompleted) return;
                if (statFilter === 'non-completed' && isCompleted) return;

                matchedCount++;

                let displaySub = target.subject ? target.subject.replace(target.program + ' - ', '').replace(target.program + ' ', '') : '';

                const occurrenceCount = getWeeklyTargetOccurrenceCount(target.track, target.subject, target.chapter);
                let starsHtml = '';
                if (occurrenceCount > 1) {
                    starsHtml = `<span class="inline-flex text-amber-500 text-[9px] ml-1.5" title="Added as target ${occurrenceCount} times">${'★'.repeat(occurrenceCount - 1)}</span>`;
                }

                const row = `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <td class="py-3 px-4 text-center">
                                <input type="checkbox" onchange="window.toggleWtdbTargetCompletion('${weekKey}', ${idx}, this.checked)" class="form-checkbox h-4 w-4 text-emerald-500 rounded cursor-pointer" ${isCompleted ? 'checked' : ''}>
                            </td>
                            <td class="py-3 px-4 font-bold text-slate-500 dark:text-slate-400 text-[10px]">${weekKey}</td>
                            <td class="py-3 px-4 uppercase text-[10px] text-slate-400">${target.program}</td>
                            <td class="py-3 px-4 truncate max-w-[120px]" title="${target.subject}">${displaySub}</td>
                            <td class="py-3 px-4 text-blue-600 dark:text-blue-400 font-bold">${target.chapter}${starsHtml}</td>
                            <td class="py-3 px-4 text-center">
                                <div class="flex items-center justify-center space-x-1">
                                    <button onclick="window.openEditWeeklyTargetModalFromWtdb('${weekKey}', ${idx})" class="p-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500 rounded transition-all active:scale-90 shadow-sm" title="Edit in Monthly Target Setup">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                        </svg>
                                    </button>
                                    <button onclick="window.deleteWtdbTarget('${weekKey}', ${idx}, '${target.id || ''}')" class="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded transition-all active:scale-90 shadow-sm" title="Delete Target">
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
                        <td colspan="6" class="py-8 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                            No matching targets found in database.
                        </td>
                    </tr>`;
        }
    }

    /* ==========================================================================
       9. Weekly Trend Visualization (Month-wise)
       ========================================================================== */

    function calculateMonthWiseTargets() {
        const monthsData = {};
        const utils = global.Utils || {};

        const getMonthKey = (date) => {
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        };

        if (!global.weeklyTargetsDatabase) global.weeklyTargetsDatabase = {};

        Object.keys(global.weeklyTargetsDatabase).forEach(weekKey => {
            const targets = global.weeklyTargetsDatabase[weekKey] || [];
            if (targets.length === 0) return;

            const dates = weekKey.split(' - ');
            if (dates.length !== 2) return;

            const start = utils.parseDateSafe ? utils.parseDateSafe(dates[0]) : new Date(dates[0]);
            const end = utils.parseDateSafe ? utils.parseDateSafe(dates[1]) : new Date(dates[1]);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

            const weekDays = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(start.getTime());
                d.setDate(start.getDate() + i);
                weekDays.push(d);
            }

            targets.forEach(t => {
                if (!t) return;
                // 1. Distribute set count (proportional by day)
                weekDays.forEach(d => {
                    const mKey = getMonthKey(d);
                    if (!monthsData[mKey]) {
                        monthsData[mKey] = { set: 0, completed: 0, rawMonth: d };
                    }
                    monthsData[mKey].set += 1 / 7;
                });

                // 2. Distribute completed count
                if (t.completed) {
                    const compDateDirect = t.completedAt ? (utils.parseDateSafe ? utils.parseDateSafe(t.completedAt) : new Date(t.completedAt)) : null;
                    if (compDateDirect && !isNaN(compDateDirect.getTime())) {
                        const compMonthKey = getMonthKey(compDateDirect);
                        if (!monthsData[compMonthKey]) {
                            monthsData[compMonthKey] = { set: 0, completed: 0, rawMonth: compDateDirect };
                        }
                        monthsData[compMonthKey].completed += 1;
                        return;
                    }

                    const found = typeof global.findTaskChapter === 'function' ? global.findTaskChapter(t.track, t.subject, t.chapter) : null;
                    if (found && found.subTask && found.subTask.completed) {
                        const compDate = found.subTask.completedAt ? (utils.parseDateSafe ? utils.parseDateSafe(found.subTask.completedAt) : new Date(found.subTask.completedAt)) : null;
                        if (compDate && !isNaN(compDate.getTime())) {
                            const compMonthKey = getMonthKey(compDate);
                            if (!monthsData[compMonthKey]) {
                                monthsData[compMonthKey] = { set: 0, completed: 0, rawMonth: compDate };
                            }
                            monthsData[compMonthKey].completed += 1;
                            return;
                        }

                        const appTasks = global.AppState ? global.AppState.tasks : [];
                        const taskObj = appTasks ? appTasks[found.taskIndex] : null;
                        if (taskObj && taskObj.date) {
                            const foundDate = weekDays.find(d => safeFormatDate(d) === taskObj.date);
                            const compDateFallback = foundDate || start;
                            const compMonthKey = getMonthKey(compDateFallback);
                            if (!monthsData[compMonthKey]) {
                                monthsData[compMonthKey] = { set: 0, completed: 0, rawMonth: compDateFallback };
                            }
                            monthsData[compMonthKey].completed += 1;
                            return;
                        }
                    }

                    // Proportional fallback
                    weekDays.forEach(d => {
                        const mKey = getMonthKey(d);
                        if (!monthsData[mKey]) {
                            monthsData[mKey] = { set: 0, completed: 0, rawMonth: d };
                        }
                        monthsData[mKey].completed += 1 / 7;
                    });
                }
            });
        });

        return Object.keys(monthsData).map(k => {
            return {
                month: k,
                set: Math.round(monthsData[k].set * 100) / 100,
                completed: Math.round(monthsData[k].completed * 100) / 100,
                rawMonth: monthsData[k].rawMonth
            };
        }).sort((a, b) => a.rawMonth - b.rawMonth);
    }

    function renderWtdbMonthChart(monthsList) {
        const ctx = document.getElementById('weeklyMonthMixedChart');
        if (!ctx) return;

        const labels = monthsList.map(m => m.month);
        const setDataset = {
            type: 'bar',
            label: 'Targets Set',
            data: monthsList.map(m => m.set),
            backgroundColor: 'rgba(59, 130, 246, 0.65)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            borderRadius: 6,
            order: 2
        };
        const completedDataset = {
            type: 'bar',
            label: 'Targets Completed',
            data: monthsList.map(m => m.completed),
            backgroundColor: 'rgba(16, 185, 129, 0.65)',
            borderColor: '#10b981',
            borderWidth: 2,
            borderRadius: 6,
            order: 1
        };

        if (global.wtdbMixedChartInstance) {
            global.wtdbMixedChartInstance.data.labels = labels;
            global.wtdbMixedChartInstance.data.datasets = [completedDataset, setDataset];
            global.wtdbMixedChartInstance.update();
        } else if (typeof global.Chart !== 'undefined') {
            global.wtdbMixedChartInstance = new global.Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [completedDataset, setDataset]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                font: { size: 10, weight: 'bold' },
                                color: '#94a3b8'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#cbd5e1',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { font: { size: 9, weight: 'bold' }, color: '#94a3b8' },
                            grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false }
                        },
                        x: {
                            ticks: { font: { size: 9, weight: 'bold' }, color: '#94a3b8' },
                            grid: { display: false, drawBorder: false }
                        }
                    }
                }
            });
        }
    }

    function renderWtdbMonthView() {
        const tbody = document.getElementById('wtdb-months-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        const monthsList = calculateMonthWiseTargets();
        const tableList = [...monthsList].reverse();

        tableList.forEach(m => {
            const rate = m.set > 0 ? Math.round((m.completed / m.set) * 100) : 0;
            let rateColor = 'text-rose-600 dark:text-rose-400';
            if (rate >= 50) rateColor = 'text-orange-500';
            if (rate >= 80) rateColor = 'text-emerald-600 dark:text-emerald-400';

            const row = `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td class="py-3 px-4 font-black text-slate-800 dark:text-slate-100">${m.month}</td>
                        <td class="py-3 px-4 text-center text-blue-600 dark:text-blue-400 font-black">${m.set.toFixed(2)}</td>
                        <td class="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-black">${m.completed.toFixed(2)}</td>
                        <td class="py-3 px-4 text-center font-black ${rateColor}">${rate}%</td>
                    </tr>`;
            tbody.innerHTML += row;
        });

        if (monthsList.length === 0) {
            tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="py-8 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                            No monthly target data available. Set and complete targets in weeks to build trends.
                        </td>
                    </tr>`;
        }

        renderWtdbMonthChart(monthsList);
    }

    /* ==========================================================================
       10. Module Export & Global Exposure
       ========================================================================== */

    const WeeklyTargets = {
        // Date range & key helpers
        getWeeklyTargetRange,
        formatDateRangeKey,
        getCanonicalWeeklyRangeKey,

        // Sizing & occurrence
        getWeeklyTargetOccurrenceCount,
        getCompletedSizeForWeeklyTarget,
        getAllocatedSizeForWeeklyTarget,
        getWeeklyTargetProgress,
        getChapterWeeklyTargetProgress,

        // Sync helpers
        consolidateWeeklyTargetsDatabase,
        syncMultiWeekTargetsToWeeklyDatabase,
        autoSyncWeeklyToDailyTargets,

        // Dropdowns & color sync
        updateWeeklyTargetColorSync,
        updateWeeklyTargetSubjectDropdown,
        updateWeeklyTargetChapterDropdown,

        // CRUD & checklist
        addWeeklyTarget,
        deleteWeeklyTarget,
        saveWeeklyTarget,
        toggleWeeklyTargetCompletion,
        navigateWeek,
        renderWeeklyTargets,
        openAddWeeklyTargetModal,
        openEditWeeklyTargetModal,
        openEditWeeklyTargetModalFromWtdb,

        // WTDB
        openWeeklyTargetsDatabase,
        switchWtdbTab,
        populateWtdbFilters,
        updateWtdbAddSubjectDropdown,
        updateWtdbAddChapterDropdown,
        addWtdbTarget,
        deleteWtdbTarget,
        toggleWtdbTargetCompletion,
        renderWtdbList,

        // Trend visualization
        calculateMonthWiseTargets,
        renderWtdbMonthChart,
        renderWtdbMonthView
    };

    // Attach to global window
    global.WeeklyTargets = WeeklyTargets;

    // Attach individual methods to global for backward compatibility
    global.getWeeklyTargetRange = getWeeklyTargetRange;
    global.formatDateRangeKey = formatDateRangeKey;
    global.getCanonicalWeeklyRangeKey = getCanonicalWeeklyRangeKey;
    global.getWeeklyTargetOccurrenceCount = getWeeklyTargetOccurrenceCount;
    global.getCompletedSizeForWeeklyTarget = getCompletedSizeForWeeklyTarget;
    global.getAllocatedSizeForWeeklyTarget = getAllocatedSizeForWeeklyTarget;
    global.getWeeklyTargetProgress = getWeeklyTargetProgress;
    global.getChapterWeeklyTargetProgress = getChapterWeeklyTargetProgress;
    global.consolidateWeeklyTargetsDatabase = consolidateWeeklyTargetsDatabase;
    global.syncMultiWeekTargetsToWeeklyDatabase = syncMultiWeekTargetsToWeeklyDatabase;
    global.autoSyncWeeklyToDailyTargets = autoSyncWeeklyToDailyTargets;
    global.updateWeeklyTargetColorSync = updateWeeklyTargetColorSync;
    global.updateWeeklyTargetSubjectDropdown = updateWeeklyTargetSubjectDropdown;
    global.updateWeeklyTargetChapterDropdown = updateWeeklyTargetChapterDropdown;
    global.addWeeklyTarget = addWeeklyTarget;
    global.deleteWeeklyTarget = deleteWeeklyTarget;
    global.saveWeeklyTarget = saveWeeklyTarget;
    global.toggleWeeklyTargetCompletion = toggleWeeklyTargetCompletion;
    global.navigateWeek = navigateWeek;
    global.renderWeeklyTargets = renderWeeklyTargets;
    global.openAddWeeklyTargetModal = openAddWeeklyTargetModal;
    global.openEditWeeklyTargetModal = openEditWeeklyTargetModal;
    global.openEditWeeklyTargetModalFromWtdb = openEditWeeklyTargetModalFromWtdb;
    global.openWeeklyTargetsDatabase = openWeeklyTargetsDatabase;
    global.switchWtdbTab = switchWtdbTab;
    global.populateWtdbFilters = populateWtdbFilters;
    global.updateWtdbAddSubjectDropdown = updateWtdbAddSubjectDropdown;
    global.updateWtdbAddChapterDropdown = updateWtdbAddChapterDropdown;
    global.addWtdbTarget = addWtdbTarget;
    global.deleteWtdbTarget = deleteWtdbTarget;
    global.toggleWtdbTargetCompletion = toggleWtdbTargetCompletion;
    global.renderWtdbList = renderWtdbList;
    global.calculateMonthWiseTargets = calculateMonthWiseTargets;
    global.renderWtdbMonthChart = renderWtdbMonthChart;
    global.renderWtdbMonthView = renderWtdbMonthView;

    // CommonJS support for unit tests
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WeeklyTargets;
    }

})(typeof window !== 'undefined' ? window : globalThis);
