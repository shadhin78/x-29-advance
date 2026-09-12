/* ===== CONSOLIDATED JAVASCRIPT ===== */

/******************************************************************
 * UTILITIES
 ******************************************************************/
// js/utils.js (Left behind utilities depending on DOM/Global states)

function getSubjectColor(subjName) {
    if (AppState.subjectColors[subjName]) return AppState.subjectColors[subjName];
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
    let hash = 0;
    for (let i = 0; i < subjName.length; i++) hash = subjName.charCodeAt(i) + ((hash << 5) - hash);
    const color = colors[Math.abs(hash) % colors.length];
    AppState.subjectColors[subjName] = color;
    return color;
}

function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(16, 185, 129, ${alpha})`;
    hex = hex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

window.parseDailyTargetDateKey = function (dateKey) {
    if (!dateKey) return new Date();
    if (dateKey.includes(',') || dateKey.split(' ').length > 2) {
        return new Date(dateKey);
    }
    const currentYear = new Date().getFullYear();
    const d = new Date(dateKey + ' ' + currentYear + ' 12:00:00');
    if (isNaN(d.getTime())) {
        return new Date();
    }
    return d;
};

window.getProgramColor = function (pName) {
    const allProgs = window.getAllPrograms().map(p => p.name || p);
    const idx = allProgs.indexOf(pName);
    if (idx !== -1) {
        return AppState.dynamicLineColors[idx % AppState.dynamicLineColors.length];
    }
    return '#6366f1';
};

// Generic DOM helpers extracted to ES module: js/utils/dom.js
// Backward-compatibility references maintained by window.safeSetText, window.safeSetHtml, window.safeSetClass


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

window.getTaskForDate = function(d) {
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
};

// Outcome CGPA & Grade modal input helpers (onCgpaBlur, onCgpaInput, updateCgpaBadge, onGradeSelect)
// have been modularized to pages/Outcome/Outcome.js


/******************************************************************
 * STATE
 ******************************************************************/
// js/state.js
// Verbatim extraction of state and global definitions from index.html

window.setLoadingProgress = function (pct, statusText) {
    const bar = document.getElementById('auth-loading-bar');
    const text = document.getElementById('auth-loading-text');
    if (bar) bar.style.width = pct + '%';
    if (text) text.textContent = statusText || 'Loading Application...';
};

// HTML and data sanitization extracted to ES module: js/utils/sanitize.js
// Backward-compatibility references maintained by window.sanitizeAllData


/**
 * Master application configuration and user state model.
 */
// State variables isolated in js/state.js



/**
 * Sanitizes and migrates old AppState.appState values to keep data structure parity.
 *
 * TODO(R2):
 * Split during module extraction.
 * No logic changes in this phase.
 */
window.migrateLegacyData = function () {
    let dataPurged = false;

    if (!window.tracks) {
        window.tracks = [];
    }
    if (Array.isArray(window.tracks)) {
        window.tracks = window.tracks.map(t => {
            if (typeof t === 'string') {
                return { id: t, name: t.toUpperCase(), priority: 3 };
            }
            if (t && typeof t === 'object' && t.priority === undefined) {
                t.priority = 3;
            }
            return t;
        });
    }
    if (!window.customPrograms) {
        window.customPrograms = {};
    }

    window.tracks.forEach(trackObj => {
        const track = trackObj.id;
        if (!Array.isArray(window.customPrograms[track])) {
            window.customPrograms[track] = [];
        }

        window.customPrograms[track] = window.customPrograms[track].map((p, idx) => {
            if (typeof p === 'string') {
                const id = p.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return {
                    id: id || 'prog-' + idx,
                    name: p,
                    priority: 3,
                    order: idx
                };
            } else if (p && typeof p === 'object') {
                if (!p.id) {
                    p.id = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'prog-' + idx;
                }
                if (p.priority === undefined) p.priority = 3;
                if (p.order === undefined) p.order = idx;
                return p;
            }
            return null;
        }).filter(Boolean);

        const origLength = window.customPrograms[track].length;
        window.customPrograms[track] = window.customPrograms[track].filter(p => {
            const name = (p.name || '').trim();
            const id = (p.id || '').trim().toLowerCase();
            if (!name) return false;
            if (id.includes('onerror') || id.includes('onload') || id.includes('json') || id.includes('document-body') || id.includes('img-src')) return false;
            return true;
        });

        if (window.customPrograms[track].length !== origLength) {
            dataPurged = true;
        }
    });

    if (syllabusStructure) {
        window.tracks.forEach(trackObj => {
            const track = trackObj.id;
            if (!syllabusStructure[track]) {
                syllabusStructure[track] = [];
            }
            if (Array.isArray(syllabusStructure[track])) {
                const origLength = syllabusStructure[track].length;
                syllabusStructure[track] = syllabusStructure[track].filter(s => {
                    const prog = (s.program || '').trim();
                    if (!prog) return false;
                    const id = prog.toLowerCase();
                    if (id.includes('onerror') || id.includes('onload') || id.includes('json') || id.includes('document-body') || id.includes('img-src')) return false;
                    return true;
                });

                if (syllabusStructure[track].length !== origLength) {
                    dataPurged = true;
                }

                syllabusStructure[track].forEach((s, idx) => {
                    if (s.priority === undefined) s.priority = 3;
                    if (s.order === undefined) s.order = idx;
                    if (!s.program) {
                        s.program = trackObj.name + " Prog";
                    }
                });
            }
        });
    }

    if (window.successResults) {
        const origLength = window.successResults.length;
        window.successResults = window.successResults.filter(r => {
            const title = (r.title || '').trim();
            if (!title) return false;
            const id = title.toLowerCase();
            if (id.includes('onerror') || id.includes('onload') || id.includes('json') || id.includes('document-body') || id.includes('img-src')) return false;
            return true;
        });
        if (window.successResults.length !== origLength) {
            dataPurged = true;
        }
    }

    if (window.passedItems) {
        if (window.passedItems.programs) {
            const origLength = window.passedItems.programs.length;
            window.passedItems.programs = window.passedItems.programs.filter(p => {
                const id = p.trim().toLowerCase();
                if (!id) return false;
                if (id.includes('onerror') || id.includes('onload') || id.includes('json') || id.includes('document-body') || id.includes('img-src')) return false;
                return true;
            });
            if (window.passedItems.programs.length !== origLength) {
                dataPurged = true;
            }
        }
    }

    if (window.paceGoals) {
        const origLength = window.paceGoals.length;
        window.paceGoals = window.paceGoals.filter(g => {
            const tgt = (g.target || '').trim();
            if (!tgt) return false;
            const id = tgt.toLowerCase();
            if (id.includes('onerror') || id.includes('onload') || id.includes('json') || id.includes('document-body') || id.includes('img-src')) return false;
            return true;
        });
        if (window.paceGoals.length !== origLength) {
            dataPurged = true;
        }
    }

    // Purge legacy preset sample exams & sessions
    if (Array.isArray(AppState.examSessions)) {
        const origLength = AppState.examSessions.length;
        AppState.examSessions = AppState.examSessions.filter(s => {
            if (!s) return false;
            if (s.id && s.id.startsWith('session_sample_')) return false;
            return true;
        });
        if (AppState.examSessions.length !== origLength) {
            dataPurged = true;
        }
    }
    if (Array.isArray(AppState.examRoutine)) {
        const origLength = AppState.examRoutine.length;
        AppState.examRoutine = AppState.examRoutine.filter(e => {
            if (!e) return false;
            if (e.id && e.id.startsWith('exam_sample_')) return false;
            if (e.subject === 'Software Engineering' || e.subject === 'Database Systems') return false;
            return true;
        });
        if (AppState.examRoutine.length !== origLength) {
            dataPurged = true;
        }
    }

    // And AppState.customActions
    if (Array.isArray(window.customActions)) {
        window.customActions.forEach((a, idx) => {
            if (a.priority === undefined) a.priority = 3;
            if (a.order === undefined) a.order = idx;
        });
    }

    window.ensureConfigDefaults();
    window.normalizePriorities();
    window.syncPassFreezeFromResults();

    if (!window.timerLogs) {
        window.timerLogs = [];
    }
    if (window.dailyFocusHoursTarget === undefined || window.dailyFocusHoursTarget === null) {
        window.dailyFocusHoursTarget = 0;
    }
    if (!window.dailyFocusHoursTargetHistory) {
        window.dailyFocusHoursTargetHistory = [];
    }
    if (!window.activeTimerState || typeof window.activeTimerState !== 'object') {
        window.activeTimerState = {
            isRunning: false,
            mode: 'stopwatch',
            startTime: null,
            elapsedBeforeStart: 0,
            targetDuration: 0,
            selectedSubject: 'General Study'
        };
    }
    if (!window.scheduleBlocks) {
        window.scheduleBlocks = [];
    }
    if (!window.scheduleBlocks2) {
        window.scheduleBlocks2 = [];
    }
    if (!window.scheduleGroups) {
        window.scheduleGroups = [];
    }
    if (window.scheduleShowGrouped === undefined) {
        window.scheduleShowGrouped = false;
    }
};

window.getAllSubjects = function () {
    let all = [];
    window.tracks.forEach(t => {
        if (syllabusStructure[t.id]) {
            all = all.concat(syllabusStructure[t.id]);
        }
    });
    return all.sort((a, b) => {
        const pA = a.priority !== undefined ? a.priority : 3;
        const pB = b.priority !== undefined ? b.priority : 3;
        if (pA !== pB) return pA - pB;
        const oA = a.order !== undefined ? a.order : 999;
        const oB = b.order !== undefined ? b.order : 999;
        return oA - oB;
    });
};

window.getAllPrograms = function () {
    let all = [];
    window.tracks.forEach(t => {
        if (window.customPrograms[t.id]) {
            window.customPrograms[t.id].forEach(p => {
                all.push({ ...p, _trackId: t.id, _trackName: t.name });
            });
        }
    });
    return all.sort((a, b) => {
        const pA = a.priority !== undefined ? a.priority : 999;
        const pB = b.priority !== undefined ? b.priority : 999;
        if (pA !== pB) return pA - pB;
        const oA = a.order !== undefined ? a.order : 999;
        const oB = b.order !== undefined ? b.order : 999;
        return oA - oB;
    });
};

window.ensureConfigDefaults = function () {
    if (!window.dashboardConfig) {
        window.dashboardConfig = {};
    }
    if (window.dashboardConfig.activePaceGoalId === undefined) {
        const defaultGoal = (window.paceGoals && window.paceGoals.find(g => g.id === 'global-timeline')) || (window.paceGoals && window.paceGoals[0]);
        window.dashboardConfig.activePaceGoalId = defaultGoal ? defaultGoal.id : null;
    }
    if (!window.dashboardConfig.trendStartDate) {
        window.dashboardConfig.trendStartDate = AppState.PLAN_START_DATE.toISOString().split('T')[0];
    }
    if (window.dashboardConfig.trendEndDate === undefined) {
        window.dashboardConfig.trendEndDate = "";
    }
    if (window.dashboardConfig.showDaysRemaining === undefined) {
        window.dashboardConfig.showDaysRemaining = false;
    }
    if (!window.dashboardConfig.independentPaces) {
        window.dashboardConfig.independentPaces = { tracks: {}, programs: {}, subjects: {} };
    }
    if (!window.dashboardConfig.independentPaces.tracks) {
        window.dashboardConfig.independentPaces.tracks = {};
    }
    if (!window.dashboardConfig.independentPaces.programs) {
        window.dashboardConfig.independentPaces.programs = {};
    }
    if (!window.dashboardConfig.independentPaces.subjects) {
        window.dashboardConfig.independentPaces.subjects = {};
    }
};

// Dynamic Tracks & Priority Configuration Systems
// (normalizePriorities, populateTrackDropdowns, sortAllCustomData)
// Extracted to js/features/config/tracksConfig.js and js/features/config/priorityConfig.js
if (typeof window.normalizePriorities !== 'function') {
    window.normalizePriorities = function () {};
}
if (typeof window.populateTrackDropdowns !== 'function') {
    window.populateTrackDropdowns = function () {};
}
if (typeof window.sortAllCustomData !== 'function') {
    window.sortAllCustomData = function () {};
}

// Deprecated
// Currently unused
// Retained for compatibility
window.getSortedPrograms = function (track) {
    if (!window.customPrograms || !window.customPrograms[track]) return [];
    return [...window.customPrograms[track]];
};

// Deprecated
// Currently unused
// Retained for compatibility
window.sortAllSubjects = function (subjects, track) {
    if (!Array.isArray(subjects)) return [];
    return [...subjects].sort((a, b) => {
        const pA = a.priority !== undefined ? a.priority : 3;
        const pB = b.priority !== undefined ? b.priority : 3;
        if (pA !== pB) return pA - pB;
        const oA = a.order !== undefined ? a.order : 999;
        const oB = b.order !== undefined ? b.order : 999;
        return oA - oB;
    });
};

window.getSortedTrackSubjects = function (track) {
    if (!syllabusStructure || !syllabusStructure[track]) return [];
    return [...syllabusStructure[track]];
};


/******************************************************************
 * FIREBASE
 ******************************************************************/
// js/firebase.js (Firebase service delegation wrapper)

window.handleLogout = function () {
    FirebaseService.logout().then(() => {
        window.location.href = 'login.html';
    }).catch(err => {
        console.error("Logout error:", err);
        window.location.href = 'login.html';
    });
};



/******************************************************************
 * TIMER (DELEGATED TO TIMER MODULE)
 ******************************************************************/
// Refer to shared/services/timerService.js and pages/Focus/Focus.js

/******************************************************************
 * SCHEDULE (DELEGATED TO DAILY SCHEDULE MODULE)
 ******************************************************************/
// Refer to pages/Daily Schedule/Daily Schedule.js

// Outcome Target & Result Helpers extracted to js/features/outcome/outcomeResults.js
window.getProgramMainTarget = function (progName) {
    if (window.OutcomeResults && typeof window.OutcomeResults.getProgramMainTarget === 'function') {
        return window.OutcomeResults.getProgramMainTarget(progName);
    }
    let targetCGPA = '';
    for (const trackId in window.customPrograms) {
        const progList = window.customPrograms[trackId];
        if (Array.isArray(progList)) {
            const prog = progList.find(p => (p.name || p) === progName);
            if (prog && typeof prog === 'object' && prog.targetCGPA !== undefined && prog.targetCGPA !== null) {
                targetCGPA = prog.targetCGPA.toString().trim();
                if (targetCGPA) break;
            }
        }
    }
    let targetGrade = '';
    if (targetCGPA && typeof Utils !== 'undefined' && typeof Utils.mapCgpaToGrade === 'function') {
        targetGrade = (targetCGPA.toLowerCase() === 'none' || targetCGPA === '0') ? 'none' : Utils.mapCgpaToGrade(targetCGPA);
    }
    return { targetCGPA, targetGrade };
};

// Outcome Result Modal target and score calculation helpers (updateSubjectTargets, updateModalEstScore)
// have been modularized to pages/Outcome/Outcome.js

function ensureAvailableSlots(slotsNeeded, track, startIndex) {
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
        const dateStr = Utils.formatDate(baseDate);

        if (dayName === 'Fri') {
            const task = { id: lastTaskId, date: dateStr, day: dayName, type: 'holiday' };
            window.tracks.forEach(t => {
                task[t.id + 'Study'] = false;
            });
            if (Array.isArray(window.customActions)) {
                window.customActions.forEach(act => { task[act.id] = false; });
            }
            AppState.tasks.push(task);
        } else {
            lastStudyDay++;
            const task = {
                id: lastTaskId, date: dateStr, day: dayName, type: 'study', studyDay: lastStudyDay
            };
            window.tracks.forEach(t => {
                task[t.id + 'Study'] = false;
                task[t.id + 'Tasks'] = [{ subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: `${t.id}-${lastTaskId}` }];
            });
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

window.customPrograms = window.customPrograms || {};

window.syllabusStructure = window.syllabusStructure || {};

function getDynamicChartLabel(subjName) {
    let programName = "";
    for (const trackId in syllabusStructure) {
        if (Array.isArray(syllabusStructure[trackId])) {
            const sObj = syllabusStructure[trackId].find(s => s.subject === subjName);
            if (sObj) {
                programName = sObj.program;
                break;
            }
        }
    }
    if (!programName) return subjName;
    if (subjName.startsWith(programName + ' - ')) {
        const shortProg = programName.replace(/\s+/g, '');
        return subjName.replace(programName + ' - ', shortProg + ': ');
    }
    if (subjName.startsWith(programName + ' ')) {
        const shortProg = programName.replace(/\s+/g, '');
        return subjName.replace(programName + ' ', shortProg + ': ');
    }
    return subjName;
}

function getDynamicCleanLabel(subjName, lengthLimit = 12) {
    let cleanLabel = subjName;
    let programName = "";
    for (const trackId in syllabusStructure) {
        if (Array.isArray(syllabusStructure[trackId])) {
            const sObj = syllabusStructure[trackId].find(s => s.subject === subjName);
            if (sObj) {
                programName = sObj.program;
                break;
            }
        }
    }
    if (programName) {
        if (cleanLabel.startsWith(programName + ' - ')) {
            cleanLabel = cleanLabel.replace(programName + ' - ', '');
        } else if (cleanLabel.startsWith(programName + ' ')) {
            cleanLabel = cleanLabel.replace(programName + ' ', '');
        }
    }
    if (cleanLabel.length > lengthLimit) {
        return cleanLabel.substring(0, lengthLimit) + '..';
    }
    return cleanLabel;
}


let totalStaticChapters = 0;

function recalculateTotals() {
    let total = 0;
    window.tracks.forEach(trackObj => {
        const track = trackObj.id;
        if (Array.isArray(syllabusStructure[track])) {
            total += syllabusStructure[track].reduce((acc, s) => acc + s.chapters, 0);
        }
    });
    totalStaticChapters = total;
}

window.openRevisionModal = function () {
    window.renderRevisionModalContent();
    openModal('revision-manage-modal');
};

window.renderRevisionModalContent = function () {
    const container = document.getElementById('rmm-subjects-container');
    if (!container) return;
    let html = '';

    window.tracks.map(t => t.id).forEach(track => {
        window.customPrograms[track].forEach(prog => {
            const progName = prog.name || prog;
            const subs = (syllabusStructure[track] || []).filter(s => s.program === progName);
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
    });
    container.innerHTML = html;
};

window.toggleRevisionMode = function (sub) {
    if (!window.revisionData) window.revisionData = { active: [], progress: {} };
    if (!window.revisionData.active) window.revisionData.active = [];

    if (window.revisionData.active.includes(sub)) {
        window.revisionData.active = window.revisionData.active.filter(s => s !== sub);
    } else {
        window.revisionData.active.push(sub);
        if (!window.revisionData.progress[sub]) window.revisionData.progress[sub] = {};
    }
    FirebaseService.saveToCloud();
    renderUI();
    window.renderRevisionModalContent();

    const actionText = window.revisionData.active.includes(sub) ? "started" : "closed";
    showToast(`Revision mode ${actionText} for ${sub}!`, "success");
};

window.toggleRevisionChapter = function (sub, chNum, isChecked) {
    if (!window.revisionData) window.revisionData = { active: [], progress: {} };
    if (!window.revisionData.progress[sub]) window.revisionData.progress[sub] = {};
    window.revisionData.progress[sub][chNum] = isChecked ? new Date().toISOString() : false;

    // Optimistic UI for smooth clicking
    const cardEl = document.getElementById(`rev-task-${sub.replace(/[^a-zA-Z0-9]/g, '-')}-${chNum}`);
    if (cardEl) {
        const titleEl = cardEl.querySelector('.tracking-tight');
        const descEl = cardEl.querySelector('.line-clamp-2');
        const accentBar = cardEl.querySelector('.absolute.top-0.left-0');

        if (titleEl) {
            if (isChecked) titleEl.classList.add('line-through', 'text-blue-700', 'dark:text-blue-400', 'opacity-70');
            else titleEl.classList.remove('line-through', 'text-blue-700', 'dark:text-blue-400', 'opacity-70');
        }
        if (descEl) isChecked ? descEl.classList.add('line-through', 'opacity-60') : descEl.classList.remove('line-through', 'opacity-60');

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

    // Update local progress bar
    const safeSubId = sub.replace(/[^a-zA-Z0-9]/g, '-');
    const sObj = window.getAllSubjects().find(s => s.subject === sub);
    const skippedCount = window.getSubjectSkippedCount(sub);
    const totalChapters = sObj ? Math.max(0, sObj.chapters - skippedCount) : 1;
    const completedCount = Object.values(window.revisionData.progress[sub]).filter(Boolean).length;
    const progressPct = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 100;

    const textEl = document.getElementById(`rev-group-text-${safeSubId}`);
    if (textEl) textEl.innerHTML = `${completedCount} <span class="opacity-60 text-[9px] mx-0.5">/</span> ${totalChapters} <span class="opacity-60">CH</span>`;
    const pctEl = document.getElementById(`rev-group-pct-${safeSubId}`);
    if (pctEl) pctEl.textContent = `${progressPct}%`;
    const barEl = document.getElementById(`rev-group-bar-${safeSubId}`);
    if (barEl) barEl.style.width = `${progressPct}%`;

    updateMetrics();
    FirebaseService.saveToCloud();

    if (window.chartDebounce) clearTimeout(window.chartDebounce);
    window.chartDebounce = setTimeout(() => requestAnimationFrame(renderTrendCharts), 600);
};



function generateStudyPlan() {
    if (!window.tracks || !Array.isArray(window.tracks) || window.tracks.length === 0) {
        return [];
    }
    const startDate = new Date(AppState.PLAN_START_DATE);
    const endDate = new Date(AppState.PLAN_END_DATE);

    const queues = {};
    window.tracks.forEach(track => {
        queues[track.id] = [];
        window.getSortedTrackSubjects(track.id).forEach(s => {
            for (let i = 1; i <= s.chapters; i++) {
                queues[track.id].push({ subject: s.subject, chapter: `Ch. ${i}`, title: `Topic ${i}` });
            }
        });
    });

    let generated = [];
    let current = new Date(startDate);
    let dayId = 1; let studyIdx = 1;

    while (current <= endDate) {
        const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = Utils.formatDate(current);

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
        current.setDate(current.getDate() + 1); dayId++;
    }
    return generated;
}

let defaultTasks = generateStudyPlan();
AppState.tasks = defaultTasks;
recalculateTotals();





window.openAccountSettingsModal = function () {
    const user = window.currentUser || { displayName: 'ris2k29', email: 'ris2k29@gmail.com' };
    const nameInput = document.getElementById('account-input-name');
    const emailInput = document.getElementById('account-input-email');

    if (nameInput) nameInput.value = user.displayName || '';
    if (emailInput) emailInput.value = user.email || '';

    openModal('account-settings-modal');
};

window.submitAccountUpdate = function () {
    const nameInput = document.getElementById('account-input-name');
    const emailInput = document.getElementById('account-input-email');
    if (!nameInput || !emailInput) return;

    const newName = nameInput.value.trim();
    const newEmail = emailInput.value.trim();

    if (!newName) {
        showToast("Display Name cannot be empty.", "error");
        return;
    }
    if (!newEmail || !newEmail.includes('@')) {
        showToast("Please enter a valid email address.", "error");
        return;
    }

    if (window.currentUser) {
        window.currentUser.displayName = newName;
        window.currentUser.email = newEmail;
    } else {
        window.currentUser = { displayName: newName, email: newEmail };
    }

    const profileNameEl = document.getElementById('profile-name');
    const profileEmailEl = document.getElementById('profile-email');
    const profileAvatarEl = document.getElementById('profile-avatar');
    if (profileNameEl) profileNameEl.textContent = newName;
    if (profileEmailEl) profileEmailEl.textContent = newEmail;
    if (profileAvatarEl) {
        profileAvatarEl.textContent = newName.charAt(0).toUpperCase();
    }

    if (typeof FirebaseService !== 'undefined') {
        const fbUser = FirebaseService.getCurrentUser();
        if (fbUser) {
            fbUser.updateProfile({
                displayName: newName
            }).catch(err => console.warn("Firebase updateProfile failed:", err));
        }
    }

    closeModal('account-settings-modal');
    showToast("Account settings updated successfully.", "success");
};

/* ===== SCHEDULE SLOT ENGINE & LIVE HEADER CLOCK ===== */
// Extracted to ES Module: js/features/schedule/scheduleSlot.js
// Backward-compatibility references and live timer ticker maintained by js/features/schedule/scheduleSlot.js
// Daily Schedule routine logic maintained by js/features/schedule/scheduleRoutine.js








/******************************************************************
 * MAIN APPLICATION CORE
 ******************************************************************/

// Offline DB, Sync Manager, and Diagnostics removed

// Dashboard Header Config function (saveHeaderConfigFromForm) extracted to js/features/config/masterConfig.js


function rebuildTaskDates(shouldSave = true) {
    if (!AppState.tasks || AppState.tasks.length === 0) return;
    const baseDate = new Date(AppState.PLAN_START_DATE.getTime());
    AppState.tasks.forEach(t => {
        if (typeof t.id === 'number') {
            const curDate = new Date(baseDate.getTime());
            curDate.setDate(curDate.getDate() + (t.id - 1));
            t.date = Utils.formatDate(curDate);
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

function updateGlobalDates() {
    const globalGoal = window.paceGoals.find(g => g.type === 'global');

    if (window.dashboardConfig && window.dashboardConfig.trendStartDate) {
        const trendStart = Utils.parseDateSafe(window.dashboardConfig.trendStartDate);
        if (!isNaN(trendStart.getTime())) {
            trendStart.setHours(0, 0, 0, 0);
            AppState.PLAN_START_DATE = new Date(trendStart.getTime());
        }
    } else if (AppState.tasks && AppState.tasks.length > 0 && AppState.tasks[0].date) {
        const firstD = Utils.parseDateSafe(AppState.tasks[0].date);
        if (firstD && !isNaN(firstD.getTime())) {
            firstD.setHours(0, 0, 0, 0);
            AppState.PLAN_START_DATE = new Date(firstD.getTime());
            if (window.dashboardConfig) {
                window.dashboardConfig.trendStartDate = firstD.toISOString().split('T')[0];
            }
        }
    }

    if (globalGoal) {
        if (globalGoal.startDate) {
            const newStart = Utils.parseDateSafe(globalGoal.startDate);
            if (!isNaN(newStart.getTime())) {
                newStart.setHours(0, 0, 0, 0);
                AppState.globalStartDate = new Date(newStart.getTime());
            }
        }
        if (globalGoal.deadline) {
            const newEnd = Utils.parseDateSafe(globalGoal.deadline);
            if (!isNaN(newEnd.getTime())) {
                AppState.globalEndDate = new Date(newEnd.getTime());
            }
        }
    } else {
        AppState.globalStartDate = null;
        AppState.globalEndDate = null;
    }

    if (AppState.globalStartDate) AppState.globalStartDate.setHours(0, 0, 0, 0);
    if (AppState.globalEndDate) AppState.globalEndDate.setHours(23, 59, 59, 999);
}

// Deprecated
// Currently unused
// Retained for compatibility
window.updateTrendsStartDate = function (newDateStr) {
    if (!newDateStr) return;
    const parsed = new Date(newDateStr);
    if (isNaN(parsed.getTime())) return showToast("Invalid Date selected.", "error");

    parsed.setHours(0, 0, 0, 0);
    AppState.PLAN_START_DATE = new Date(parsed.getTime());
    if (window.dashboardConfig) {
        window.dashboardConfig.trendStartDate = newDateStr;
    }
    rebuildTaskDates(true);
    renderUI();
    showToast("Start date updated!", "success");
};

// Pace toggles and trends settings extracted to js/features/pace/paceManager.js
window.setPaceToggleState = function (btn, handle, isChecked) {
    if (window.PaceManager && typeof window.PaceManager.setPaceToggleState === 'function') {
        return window.PaceManager.setPaceToggleState(btn, handle, isChecked);
    }
};

window.togglePaceSwitch = function (type, rawId) {
    if (window.PaceManager && typeof window.PaceManager.togglePaceSwitch === 'function') {
        return window.PaceManager.togglePaceSwitch(type, rawId);
    }
};

window.openTrendsSettingsModal = function () {
    if (window.PaceManager && typeof window.PaceManager.openTrendsSettingsModal === 'function') {
        return window.PaceManager.openTrendsSettingsModal();
    }
};

window.selectActivePaceGoal = function (goalId) {
    if (window.PaceManager && typeof window.PaceManager.selectActivePaceGoal === 'function') {
        return window.PaceManager.selectActivePaceGoal(goalId);
    }
};

window.saveTrendsSettings = function () {
    if (window.PaceManager && typeof window.PaceManager.saveTrendsSettings === 'function') {
        return window.PaceManager.saveTrendsSettings();
    }
};


/**
 * Pace Estimation and Velocity Calculation extracted to js/features/pace/paceEstimator.js
 */
window.getTargetedSubjectsForGoal = function (goal) {
    if (window.PaceEstimator && typeof window.PaceEstimator.getTargetedSubjectsForGoal === 'function') {
        return window.PaceEstimator.getTargetedSubjectsForGoal(goal);
    }
    return new Set();
};

window.calculatePaceGoalStats = function (goal, subjectStats) {
    if (window.PaceEstimator && typeof window.PaceEstimator.calculatePaceGoalStats === 'function') {
        return window.PaceEstimator.calculatePaceGoalStats(goal, subjectStats);
    }
    return null;
};

function calculateIndependentEstFinish() {
    if (window.PaceEstimator && typeof window.PaceEstimator.calculateIndependentEstFinish === 'function') {
        return window.PaceEstimator.calculateIndependentEstFinish();
    }
    return '--';
}
window.calculateIndependentEstFinish = calculateIndependentEstFinish;


/**
* Updates estimated timelines indicators, pacing, and days remaining bars.
*
* TODO(R2):
* Split during module extraction.
* No logic changes in this phase.
*/
// Modularized: window.updateTrendsBar is in pages/Dashboard/Dashboard.js
window.updateTrendsBar = function () {
    if (window.DashboardPage && typeof window.DashboardPage.render === "function") {
        window.DashboardPage.render();
    }
};

function renderUI() {
    const loader = document.getElementById('loading-message');
    if (loader) loader.classList.add('hidden');
    const dashContent = document.getElementById('dashboard-content');
    if (dashContent) dashContent.classList.remove('hidden');

    safeSetText('dash-top-tag', window.dashboardConfig.topTag);
    safeSetText('dash-top-tag-mobile', window.dashboardConfig.topTag);
    safeSetText('dash-main-title', window.dashboardConfig.mainTitle);
    safeSetText('dash-main-title-mobile', window.dashboardConfig.mainTitle);
    safeSetText('dash-sub-title', window.dashboardConfig.subTitle);
    safeSetText('dash-sub-title-mobile', window.dashboardConfig.subTitle);

    const trendsStartDateInput = document.getElementById('trends-start-date');
    if (trendsStartDateInput && window.dashboardConfig && window.dashboardConfig.trendStartDate) {
        trendsStartDateInput.value = window.dashboardConfig.trendStartDate;
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

    const tagInput = document.getElementById('edit-header-tag');
    if (tagInput) tagInput.value = window.dashboardConfig.topTag || '';
    const titleInput = document.getElementById('edit-header-title');
    if (titleInput) titleInput.value = window.dashboardConfig.mainTitle || '';
    const subInput = document.getElementById('edit-header-sub');
    if (subInput) subInput.value = window.dashboardConfig.subTitle || '';

    // Validate AppState.currentFilter to prevent cross-device deletion crashes
    if (AppState.currentFilter !== 'All') {
        const isValidProg = window.tracks.some(t => window.customPrograms[t.id] && window.customPrograms[t.id].some(p => (p.name || p) === AppState.currentFilter));
        const isValidSub = window.getAllSubjects().some(s => s.subject === AppState.currentFilter);
        if (!isValidProg && !isValidSub) AppState.currentFilter = 'All';
    }

    updateGlobalDates();
    setupFocusTodayButton();
    updateCountdown();
    if (window.updateExamCountdown) window.updateExamCountdown();
    updateSuccessScore();
    renderSubjectNavigation();
    renderTaskList();
    updateMetrics();

    // Defer heavy chart & analytics rendering to prevent main-thread blocking on mobile boot
    const deferRender = (fn, delay = 20) => {
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => setTimeout(fn, delay));
        } else {
            setTimeout(fn, delay);
        }
    };

    deferRender(() => {
        if (typeof renderChart === 'function') renderChart();
        if (typeof window.updateTrendsBar === 'function') window.updateTrendsBar();
        if (typeof renderDailyTracker === 'function') renderDailyTracker();
        if (typeof renderDailyLogs === 'function') renderDailyLogs();
        if (typeof window.renderSpectraCommitmentsChart === 'function') window.renderSpectraCommitmentsChart();
        if (typeof renderTrendCharts === 'function') renderTrendCharts();
        if (typeof window.renderResults === 'function') window.renderResults();
        if (typeof window.renderDashboardOutcomeCard === 'function') window.renderDashboardOutcomeCard();
        if (typeof window.renderDashboardUpcomingExamCard === 'function') window.renderDashboardUpcomingExamCard();
        if (typeof window.renderDashboardPassedSubjectsCard === 'function') window.renderDashboardPassedSubjectsCard();
        if (typeof window.renderMonthlyTargets === 'function') window.renderMonthlyTargets();
        if (typeof window.renderDashboardMonthlyChecklist === 'function') window.renderDashboardMonthlyChecklist();
        if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets();
        if (typeof window.autoSyncWeeklyToDailyTargets === 'function') window.autoSyncWeeklyToDailyTargets();
        if (typeof window.renderDashboardWeeklyChecklist === 'function') window.renderDashboardWeeklyChecklist();
        if (typeof window.renderDailyTargets === 'function') window.renderDailyTargets();
        if (typeof window.renderDashboardDailyChecklist === 'function') window.renderDashboardDailyChecklist();
        if (typeof window.renderOutcomeProgramToggles === 'function') window.renderOutcomeProgramToggles();
        if (typeof window.renderSchedulePage === 'function') window.renderSchedulePage();
        if (typeof window.renderExamPage === 'function') window.renderExamPage();
    }, 20);


    // Dynamic Form & Manage UI Syncs
    window.populateTrackDropdowns();
    window.updateManageDropdown();
    if (typeof window.renderPassConfig === 'function') window.renderPassConfig();
    if (typeof window.renderCelebrationConfig === 'function') window.renderCelebrationConfig();
    window.togglePaceBundleType();
    const activeSysTab = document.querySelector('[id^="sys-tab-"].bg-blue-600');
    if (activeSysTab) {
        const tabName = activeSysTab.id.replace('sys-tab-', '');
        if (tabName === 'chapter') window.updateChProgDropdown();
        if (tabName === 'subject') window.updateSubProgDropdown();
        if (tabName === 'priority') {
            const activeEl = document.activeElement;
            const isFocusInPriority = activeEl && document.getElementById('sys-content-priority')?.contains(activeEl);
            if (!isFocusInPriority) {
                window.renderPriorityConfig();
            }
        }
    }
    if (document.getElementById('revision-manage-modal') && !document.getElementById('revision-manage-modal').classList.contains('hidden')) {
        window.renderRevisionModalContent();
    }
    if (document.getElementById('analytics-modal') && !document.getElementById('analytics-modal').classList.contains('hidden') && window.currentAnalyticsAction) {
        window.populateAnalyticsModal(window.currentAnalyticsAction);
    }
    if (document.getElementById('global-history-modal') && !document.getElementById('global-history-modal').classList.contains('hidden')) {
        window.renderGlobalHistoryContent();
    }
    if (document.getElementById('daily-actions-db-modal') && !document.getElementById('daily-actions-db-modal').classList.contains('hidden')) {
        window.openDailyActionsDBModal();
    }
    if (window.TimerService) {
        window.TimerService.updateDisplay();
        window.TimerService.restore();
    }

    // Real-time sync: Refresh Focus Analytics & Heatmap on cross-device data updates
    if (typeof window.updateTimerAnalyticsControls === 'function') {
        setTimeout(window.updateTimerAnalyticsControls, 50);
    }
    if (typeof window.renderTimerAnalyticsChart === 'function') {
        setTimeout(() => window.renderTimerAnalyticsChart(true), 60);
    }
    if (typeof window.renderSpectraFocusHeatmap === 'function') {
        setTimeout(window.renderSpectraFocusHeatmap, 80);
    }
    if (typeof window.setSessionHistoryFilterUI === 'function') {
        setTimeout(() => window.setSessionHistoryFilterUI(window.sessionHistoryFilter || 'all'), 50);
    }

    const spectraPage = document.getElementById('page-spectra-analytics');
    if (spectraPage && !spectraPage.classList.contains('hidden')) {
        if (typeof window.renderSpectraCircleChart === 'function') {
            setTimeout(window.renderSpectraCircleChart, 60);
        }
        if (typeof window.renderSpectraCommitmentsChart === 'function') {
            setTimeout(window.renderSpectraCommitmentsChart, 70);
        }
    }
}

function setupFocusTodayButton() {
    const btn = document.getElementById('focus-today-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (AppState.currentFilter !== 'All') { AppState.currentFilter = 'All'; renderSubjectNavigation(); renderTaskList(); updateMetrics(); }
        const todayString = Utils.formatDate(new Date());
        const todayTask = AppState.tasks.find(t => t.date === todayString);
        if (todayTask && todayTask.type === 'study') {
            setTimeout(() => {
                const firstTaskCard = document.querySelector(`[id^="single-task-"][id$="-${todayTask.studyDay}"]`);
                if (firstTaskCard) {
                    firstTaskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstTaskCard.classList.add('ring-4', 'ring-blue-500', 'ring-offset-4', 'dark:ring-offset-gray-900', 'scale-[1.02]');
                    setTimeout(() => firstTaskCard.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-4', 'dark:ring-offset-gray-900', 'scale-[1.02]'), 2500);
                }
            }, 100);
        }
    });
}

function updateCountdown() {
    if (!AppState.globalStartDate || !AppState.globalEndDate) {
        safeSetHtml('countdown-timer', `<div class="text-center md:text-right"><span class="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Final Deadline</span><span class="text-slate-400 font-black text-sm sm:text-base md:text-base drop-shadow-sm">Not Set</span></div>`);
        safeSetHtml('time-gone-stats', `<div class="flex items-center space-x-2 md:space-x-3 justify-center md:justify-start"><div class="hidden md:flex p-2 md:p-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700/50"><svg class="w-4 h-4 md:w-5 md:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="text-center md:text-left"><span class="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Time Elapsed</span><span class="text-slate-400 font-black text-sm sm:text-base md:text-base">Not Set</span></div></div>`);
        return;
    }

    const today = new Date();
    const start = new Date(AppState.globalStartDate);
    const target = new Date(AppState.globalEndDate);

    const diffLeft = target - today;
    if (diffLeft > 0) {
        const daysLeft = Math.ceil(diffLeft / (1000 * 60 * 60 * 24));
        safeSetHtml('countdown-timer', `<div class="text-center md:text-right"><span class="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Final Deadline</span><span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 font-black text-sm sm:text-base md:text-2xl drop-shadow-sm">${daysLeft} Days</span></div>`);
    } else { safeSetHtml('countdown-timer', `<div class="text-center md:text-right"><span class="text-green-500 font-black text-sm sm:text-base md:text-lg drop-shadow-sm">Goal Reached!</span></div>`); }

    const diffGone = today - start;
    const daysGone = Math.max(0, Math.floor(diffGone / (1000 * 60 * 60 * 24)));
    safeSetHtml('time-gone-stats', `<div class="flex items-center space-x-2 md:space-x-3 justify-center md:justify-start"><div class="hidden md:flex p-2 md:p-2.5 bg-red-100 dark:bg-red-500/20 rounded-lg md:rounded-xl border border-red-200 dark:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]"><svg class="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="text-center md:text-left"><span class="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Time Elapsed</span><span class="text-red-600 dark:text-red-400 font-black text-sm sm:text-base md:text-2xl drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)]">${daysGone} Days</span></div></div>`);
}

function updateSuccessScore() {
    if (!window.passedItems) window.passedItems = { programs: [], subjects: [] };
    if (!window.celebrationTargets) window.celebrationTargets = { programs: [], subjects: [] };

    let totalSubs = 0;
    let passedSubs = 0;

    window.tracks.map(t => t.id).forEach(track => {
        if (syllabusStructure[track]) {
            syllabusStructure[track].forEach(s => {
                totalSubs++;
                if (window.passedItems.programs.includes(s.program) || window.passedItems.subjects.includes(s.subject)) {
                    passedSubs++;
                }
            });
        }
    });

    const pct = totalSubs > 0 ? Math.round((passedSubs / totalSubs) * 100) : 0;

    safeSetHtml('success-score-stats', `
                <div class="flex items-center space-x-2 md:space-x-3 justify-center md:justify-start">
                    <div class="hidden md:flex p-2 md:p-2.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg md:rounded-xl border border-emerald-200 dark:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        <svg class="w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div class="text-center md:text-left">
                        <span class="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Success Score</span>
                        <span class="text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-base md:text-2xl drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]">${pct}%</span>
                    </div>
                </div>
            `);

    // Calculate Milestone Celebration Completion
    const hasCustomCeleb = Boolean(
        (window.celebrationTargets.programs && window.celebrationTargets.programs.length > 0) ||
        (window.celebrationTargets.subjects && window.celebrationTargets.subjects.length > 0)
    );

    let coreTotal = 0;
    let corePassed = 0;
    let celebrationMet = false;

    if (hasCustomCeleb) {
        const requiredSubjectSet = new Set();
        window.tracks.map(t => t.id).forEach(track => {
            if (syllabusStructure[track]) {
                syllabusStructure[track].forEach(s => {
                    if (
                        (window.celebrationTargets.programs && window.celebrationTargets.programs.includes(s.program)) ||
                        (window.celebrationTargets.subjects && window.celebrationTargets.subjects.includes(s.subject))
                    ) {
                        requiredSubjectSet.add(s.subject);
                    }
                });
            }
        });

        coreTotal = requiredSubjectSet.size;
        requiredSubjectSet.forEach(subName => {
            const sObj = window.getAllSubjects().find(s => s.subject === subName);
            const isPassed = (window.passedItems.subjects && window.passedItems.subjects.includes(subName)) ||
                             (sObj && window.passedItems.programs && window.passedItems.programs.includes(sObj.program));
            if (isPassed) corePassed++;
        });

        celebrationMet = (coreTotal > 0 && corePassed === coreTotal);
    } else {
        coreTotal = totalSubs;
        corePassed = passedSubs;
        celebrationMet = (pct === 100 && totalSubs > 0);
    }

    if (celebrationMet && !window.hasShownCongrats) {
        window.hasShownCongrats = true;
        setTimeout(() => window.showCongratsModal(hasCustomCeleb, corePassed, coreTotal), 800);
    } else if (!celebrationMet) {
        window.hasShownCongrats = false;
    }

    // Update live celebration status card in Pass Config
    if (typeof window.updateCelebrationLiveStatus === 'function') {
        window.updateCelebrationLiveStatus(corePassed, coreTotal, hasCustomCeleb, celebrationMet);
    }
    if (typeof window.renderDashboardPassedSubjectsCard === 'function') {
        window.renderDashboardPassedSubjectsCard();
    }
}

window.setFilter = function (val) { AppState.currentFilter = val; window.subjectDetailsState = {}; renderSubjectNavigation(); renderTaskList(); updateMetrics(); renderTrendCharts(); };

/* [Moved to pages/Analytics/Analytics.js] window.setTrendFilter */

/**
* Renders the main dashboard task card items and checklist rows.
*
* TODO(R2):
* Split during module extraction.
* No logic changes in this phase.
*/
function renderTaskList() {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.className = 'flex flex-col space-y-6 md:space-y-8 w-full pb-4';

    let subjectsToRender = [];
    if (AppState.currentFilter === 'All') {
        subjectsToRender = window.getAllSubjects().map(s => s.subject);
    } else {
        const isProgram = window.getAllPrograms().some(p => (p.name || p) === AppState.currentFilter);
        if (isProgram) {
            subjectsToRender = window.getAllSubjects().filter(s => s.program === AppState.currentFilter).map(s => s.subject);
        } else {
            subjectsToRender = [AppState.currentFilter];
        }
    }

    const grouped = {};
    subjectsToRender.forEach(sub => {
        let track = null;
        let sObj = null;
        for (const t of window.tracks) {
            if (syllabusStructure[t.id]) {
                sObj = syllabusStructure[t.id].find(s => s.subject === sub);
                if (sObj) { track = t.id; break; }
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

    AppState.tasks.forEach(t => {
        if (t.type === 'study') {
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
    });

    for (const sub in grouped) {
        const group = grouped[sub];
        const sObj = window.getAllSubjects().find(s => s.subject === sub);
        const safeSubId = sub.replace(/[^a-zA-Z0-9]/g, '-');
        const isFrozen = (window.passedItems && window.passedItems.subjects && window.passedItems.subjects.includes(sub)) ||
            (window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(group.program));

        if (sObj && sObj.chapters > 0) {
            const allChapterTasks = [];
            for (let chNum = 1; chNum <= sObj.chapters; chNum++) {
                const existingTask = group.tasks.find(x => {
                    const chStr = x.taskObj.chapter;
                    if (chStr === `Ch. ${chNum}` || chStr === `Ch.${chNum}` || chStr === String(chNum)) return true;
                    const match = chStr.match(/(\d+)(?!.*\d)/);
                    return match && parseInt(match[0]) === chNum;
                });

                if (existingTask) {
                    allChapterTasks.push(existingTask);
                } else {
                    allChapterTasks.push({
                        dayObj: { studyDay: '—', id: `unsched-${safeSubId}-${chNum}`, date: '' },
                        taskObj: {
                            id: `unsched-${group.type || 'ca'}-${safeSubId}-${chNum}`,
                            subject: sub,
                            chapter: `Ch. ${chNum}`,
                            title: `Topic ${chNum}`,
                            completed: false,
                            skipped: false
                        },
                        type: group.type || 'ca'
                    });
                }
            }
            group.tasks = allChapterTasks;
        }

        const skippedCount = group.tasks.filter(x => x.taskObj.skipped).length;
        group.totalChapters = Math.max(0, (sObj ? sObj.chapters : group.totalChapters) - skippedCount);
    }

    let html = '';
    const shadowMap = { indigo: 'shadow-[0_0_10px_rgba(99,102,241,0.6)]', emerald: 'shadow-[0_0_10px_rgba(16,185,129,0.6)]', violet: 'shadow-[0_0_10px_rgba(139,92,246,0.6)]' };

    subjectsToRender.forEach(sub => {
        const group = grouped[sub];
        if (!group) return;

        const isFrozen = (window.passedItems && window.passedItems.subjects && window.passedItems.subjects.includes(sub)) ||
            (window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(group.program));

        const isRevising = window.revisionData && window.revisionData.active && window.revisionData.active.includes(sub);
        const sObj = window.getAllSubjects().find(s => s.subject === sub);

        // If subject has 0 scheduled study tasks and is not frozen, not revising, and has no chapters in syllabus, skip
        if (group.tasks.length === 0 && !isFrozen && !isRevising && (!sObj || sObj.chapters === 0)) return;

        const trackIdx = window.tracks.findIndex(t => t.id === group.type);
        const colorMap = ['indigo', 'emerald', 'violet', 'rose', 'amber', 'cyan'];
        const colorClass = trackIdx !== -1 ? colorMap[trackIdx % colorMap.length] : 'blue';

        const trackObj = window.tracks.find(t => t.id === group.type);
        const trackName = trackObj ? trackObj.name : group.type.toUpperCase();

        let displaySubName = sub;
        if (displaySubName.startsWith(group.program + ' - ')) displaySubName = displaySubName.replace(group.program + ' - ', '');
        else if (displaySubName.startsWith(group.program + ' ')) displaySubName = displaySubName.replace(group.program + ' ', '');
        const finalTitle = `<span class="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white mr-2">${displaySubName}</span><span class="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider mr-1.5">- ${group.program}</span><span class="text-[10px] md:text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">- ${trackName}</span>`;

        const shadowClass = shadowMap[colorClass];
        const safeSubId = sub.replace(/[^a-zA-Z0-9]/g, '-');
        const safeSubQuotes = sub.replace(/'/g, "\\'");

        const analyticsBtnHtml = `
                    <button onclick="event.preventDefault(); event.stopPropagation(); window.openSingleSubjectTrendModal('${safeSubQuotes}');" class="p-2 md:p-2.5 shrink-0 text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl shadow-sm transition-all border border-slate-200 dark:border-slate-600/50 active:scale-95" title="View Subject Trend">
                        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    </button>
                `;

        const editBtnHtml = `
                    <button onclick="event.preventDefault(); event.stopPropagation(); window.openSubjectEditModal('${safeSubQuotes}');" class="p-2 md:p-2.5 shrink-0 text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl shadow-sm transition-all border border-slate-200 dark:border-slate-600/50 active:scale-95" title="Edit Subject Details">
                        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                `;

        const formatDateStr = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        let targetDate = null;
        let startDate = null;
        let linkLabel = '';
        let hasTimeGoal = false;

        if (window.subjectTimeLinks && window.subjectTimeLinks[sub]) {
            const link = window.subjectTimeLinks[sub];
            if (link.type === 'date') {
                hasTimeGoal = true;
                if (link.startDate) startDate = Utils.parseDateSafe(link.startDate);
                targetDate = Utils.parseDateSafe(link.date);
                targetDate.setHours(23, 59, 59, 999);
                if (startDate) startDate.setHours(0, 0, 0, 0);
                linkLabel = '<span class="block text-[8px] text-orange-500 dark:text-orange-400 mt-1 uppercase tracking-widest font-black bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded border border-orange-100 dark:border-orange-800/50 inline-block">Custom Timeline</span>';
            } else if (link.type === 'goal') {
                const pg = window.paceGoals.find(g => g.id === link.id);
                if (pg) {
                    hasTimeGoal = true;
                    if (pg.startDate) startDate = Utils.parseDateSafe(pg.startDate);
                    targetDate = Utils.parseDateSafe(pg.deadline);
                    targetDate.setHours(23, 59, 59, 999);
                    if (startDate) startDate.setHours(0, 0, 0, 0);
                    linkLabel = `<span class="block text-[8px] text-indigo-500 dark:text-indigo-400 mt-1 truncate max-w-[120px] mx-auto uppercase tracking-widest font-black bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50 inline-block" title="${pg.target}">Link: ${pg.target}</span>`;
                }
            }
        }

        if (!hasTimeGoal) {
            let firstCompletedTask = group.tasks.find(x => x.taskObj.completed);
            if (firstCompletedTask) {
                if (firstCompletedTask.taskObj.completedAt) {
                    startDate = new Date(firstCompletedTask.taskObj.completedAt);
                } else {
                    startDate = getTaskDate(firstCompletedTask.dayObj);
                }
            }
        }

        const startDateStr = startDate ? formatDateStr(startDate) : '--';
        const endDateStr = targetDate ? formatDateStr(targetDate) : '--';
        const headerDatesStr = (hasTimeGoal || startDate) ? `${startDateStr} <span class="mx-1 opacity-50">&rarr;</span> ${endDateStr}` : "No Timeline Set";

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const msPerDay = 1000 * 60 * 60 * 24;

        let completedCount = 0;
        group.tasks.forEach(x => {
            if (x.taskObj.skipped) return;
            if (x.taskObj.completed) {
                completedCount += 1;
            } else {
                const prog = window.getChapterWeeklyTargetProgress ? window.getChapterWeeklyTargetProgress(x.type, x.taskObj.subject, x.taskObj.chapter) : null;
                if (prog && prog.isSizeBased && prog.total > 0 && prog.completed > 0) {
                    completedCount += Math.min(1, prog.completed / prog.total);
                }
            }
        });
        const progressPct = isFrozen ? 100 : (group.totalChapters > 0 ? Math.min(100, Math.round((completedCount / group.totalChapters) * 100)) : 100);
        const displayCompleted = isFrozen ? group.totalChapters : ((completedCount % 1 === 0) ? completedCount : (Math.round(completedCount * 10) / 10));

        let remainingCh = Math.max(0, group.totalChapters - completedCount);
        let actPaceRaw = 0;
        let reqPaceRaw = 0;

        let actualStartDateForPace = null;
        let firstCompletedTaskForPace = group.tasks.find(x => x.taskObj.completed);
        if (firstCompletedTaskForPace) {
            actualStartDateForPace = firstCompletedTaskForPace.taskObj.completedAt ? new Date(firstCompletedTaskForPace.taskObj.completedAt) : getTaskDate(firstCompletedTaskForPace.dayObj);
            actualStartDateForPace.setHours(0, 0, 0, 0);
        }

        let daysElapsed = 0;
        if (group.totalChapters > 0) {
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

        const actPace = actPaceRaw.toFixed(2);
        const reqPace = hasTimeGoal ? reqPaceRaw.toFixed(2) : '--';

        let subjectDaysPassedStr = '<span class="opacity-60">0 Days Passed</span>';
        if (completedCount > 0 && daysElapsed > 0) {
            subjectDaysPassedStr = `${Utils.formatDaysPassed(daysElapsed)} Passed`;
        }

        let estFinishStr = '--';
        let estDaysNeededStr = '<span class="opacity-60">Unknown</span>';
        if (isFrozen || completedCount >= group.totalChapters) {
            estFinishStr = '<span class="text-emerald-500 font-black">Finished</span>';
            estDaysNeededStr = '<span class="text-emerald-500 font-bold">0 Days</span>';
        } else if (completedCount === 0) {
            estFinishStr = '<span class="text-slate-400 text-[10px]">No Data</span>';
        } else if (actPaceRaw > 0) {
            const daysLeft = remainingCh / actPaceRaw;
            const estDate = new Date(today.getTime() + (daysLeft * msPerDay));
            estFinishStr = formatDateStr(estDate);
            estDaysNeededStr = `${Math.ceil(daysLeft)} Days Needed`;
        }

        let timeGoalCountdownStr = '';
        if (isFrozen || completedCount >= group.totalChapters) {
            timeGoalCountdownStr = '<span class="text-emerald-500 font-bold">Done</span>';
        } else if (!hasTimeGoal) {
            timeGoalCountdownStr = '<span class="text-slate-400 font-bold">No Goal</span>';
        } else {
            let diffDaysTG = Math.ceil((targetDate - today) / msPerDay);
            if (diffDaysTG > 0) timeGoalCountdownStr = `${diffDaysTG} Days Left`;
            else if (diffDaysTG === 0) timeGoalCountdownStr = `<span class="text-orange-500 font-bold">Due Today</span>`;
            else timeGoalCountdownStr = `<span class="text-red-500 font-bold">${Math.abs(diffDaysTG)} Days Overdue</span>`;
        }

        let headerIcon = `<div class="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-${colorClass}-50 dark:bg-${colorClass}-500/10 border border-${colorClass}-100 dark:border-${colorClass}-500/20 shadow-sm shrink-0"><div class="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-${colorClass}-500 ${shadowClass}"></div></div>`;
        if (isFrozen) headerIcon = `<div class="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm shrink-0 text-base md:text-lg drop-shadow-md">🏆</div>`;

        let isDetailsOpen = window.subjectDetailsState[safeSubId] !== undefined ? window.subjectDetailsState[safeSubId] : (subjectsToRender.length === 1);
        let openAttr = isDetailsOpen ? 'open' : '';

        const isProgramVisible = !window.programVisibility || window.programVisibility[group.program] !== false;
        let blockHtml = '';

        if (!isProgramVisible) {
            blockHtml = `
                        <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm mb-3 opacity-60">
                            <div class="flex items-center space-x-2.5 min-w-0">
                                <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${window.getProgramColor(group.program)}"></div>
                                <h4 class="text-xs font-black text-slate-650 dark:text-slate-400 truncate">${displaySubName} <span class="text-[9px] font-bold text-slate-400 uppercase">- ${group.program} (Compressed)</span></h4>
                            </div>
                            <div class="flex items-center space-x-2 shrink-0">
                                <span class="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">${progressPct}%</span>
                                <button onclick="window.toggleOutcomeProgram('${group.program.replace(/'/g, "\\'")}')" class="p-1 text-slate-400 hover:text-slate-600 rounded" title="Spread Program Everywhere">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>`;
        } else if (isFrozen) {
            blockHtml = `
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4 md:p-5 rounded-[1.25rem] shadow-sm mb-4">
                            <div class="flex items-center space-x-3 md:space-x-4 w-full">
                                <div class="text-3xl drop-shadow-md">🏆</div>
                                <div class="flex flex-wrap items-center flex-1">
                                    <div class="flex items-center w-full">
                                        <h2 class="tracking-tight truncate flex-1"><span class="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white mr-2">${displaySubName}</span><span class="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mr-1.5">- ${group.program}</span><span class="text-[10px] md:text-xs font-medium text-emerald-500/80 dark:text-emerald-500/60 uppercase tracking-widest whitespace-nowrap">- ${trackName}</span></h2>
                                    </div>
                                    <span class="w-full text-[9px] font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-500 mt-0.5">Status: Passed & Frozen</span>
                                </div>
                                ${editBtnHtml}
                            </div>
                        </div>`;
        } else {
            blockHtml = `
                        <details id="details-${safeSubId}" ontoggle="window.subjectDetailsState['${safeSubId}'] = this.open;" class="bg-white dark:bg-slate-800 rounded-[1.25rem] md:rounded-[2rem] shadow-sm border border-slate-200/80 dark:border-slate-700/60 mb-5 group overflow-hidden transition-all duration-300 hover:shadow-md" ${openAttr}>
                            <summary class="cursor-pointer p-4 md:p-6 outline-none select-none list-none flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/80 [&::-webkit-details-marker]:hidden relative z-10">
                                
                                <!-- Left side: Subject, Program, Time Period -->
                                <div class="flex flex-col gap-2.5 w-full lg:w-[40%] shrink-0">
                                    <div class="flex items-center gap-3">
                                        ${headerIcon}
                                        <div class="flex flex-col overflow-hidden w-full pr-2">
                                            <div class="flex items-center w-full">
                                                <h2 class="tracking-tight truncate flex-1" title="${displaySubName}">${finalTitle}</h2>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 lg:ml-[3.25rem] uppercase tracking-widest bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md w-fit border border-slate-200 dark:border-slate-700/50">
                                        <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <span>${headerDatesStr}</span>
                                    </div>
                                </div>

                                <!-- Middle: Progress Bar & Status -->
                                <div class="flex flex-col gap-2 w-full lg:w-[35%] lg:px-4">
                                    <div class="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                                        <span id="group-text-${safeSubId}" class="text-slate-500 dark:text-slate-400">${displayCompleted} <span class="opacity-60 text-[9px] mx-0.5">/</span> ${group.totalChapters} <span class="opacity-60">CH</span></span>
                                        <span id="group-pct-${safeSubId}" class="text-${colorClass}-600 dark:text-${colorClass}-400 bg-${colorClass}-50 dark:bg-${colorClass}-900/30 px-1.5 py-0.5 rounded border border-${colorClass}-100 dark:border-${colorClass}-800/50 shadow-sm">${progressPct}%</span>
                                    </div>
                                    <div class="w-full bg-slate-100 dark:bg-slate-700/50 h-2.5 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-600/30 relative">
                                        <div id="group-bar-${safeSubId}" class="h-full bg-gradient-to-r from-${colorClass}-400 to-${colorClass}-600 transition-all duration-700 ease-out relative" style="width: ${progressPct}%">
                                            <div class="absolute right-0 top-0 bottom-0 w-2 bg-white/40 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Right: EST Finish & Dropdown Arrow -->
                                <div class="flex items-center justify-between lg:justify-end gap-4 lg:gap-6 w-full lg:w-[25%] lg:pl-0">
                                    <div class="flex flex-col text-left lg:text-right flex-1 lg:flex-none">
                                        <span class="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-0.5">EST. Finish</span>
                                        <span id="header-est-${safeSubId}" class="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">${estFinishStr}</span>
                                    </div>
                                    <div class="flex items-center gap-2 shrink-0">
                                        ${analyticsBtnHtml}
                                        ${editBtnHtml}
                                        <div class="p-2 md:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 group-open:rotate-180 group-open:bg-${colorClass}-50 group-open:text-${colorClass}-600 dark:group-open:bg-${colorClass}-900/30 dark:group-open:text-${colorClass}-400 transition-all duration-300 shrink-0 shadow-sm border border-slate-200/50 dark:border-slate-600/30">
                                            <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </summary>

                            <div class="p-4 md:p-6 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/10">
                                
                                <!-- Inside Expanded View: 4 Action Analytics Cards -->
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                                    <div onclick="window.openSubjectTimeModal('${safeSubQuotes}')" class="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 transition-all cursor-pointer group/tg scale-100 active:scale-[0.98]">
                                        <div class="absolute top-2 right-2 opacity-0 group-hover/tg:opacity-100 transition-opacity"><svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></div>
                                        <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Time Goal</span>
                                        <span class="text-sm md:text-[1.05rem] font-black text-slate-800 dark:text-slate-100 leading-tight">${endDateStr}</span>
                                        <span id="tg-tg-days-${safeSubId}" class="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">${timeGoalCountdownStr}</span>
                                        ${linkLabel}
                                    </div>
                                    <div class="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm flex flex-col justify-center text-center">
                                        <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-500/90 dark:text-blue-400/90 mb-1">Req Pace</span>
                                        <span class="text-sm md:text-[1.1rem] font-black text-blue-700 dark:text-blue-400"><span id="tg-req-${safeSubId}">${reqPace}</span> <span class="text-[9px] opacity-70 font-bold uppercase tracking-widest">ch/d</span></span>
                                    </div>
                                    <div class="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-${colorClass}-50/80 to-${colorClass}-100/50 dark:from-${colorClass}-900/20 dark:to-${colorClass}-900/30 rounded-2xl border border-${colorClass}-100 dark:border-${colorClass}-800/50 shadow-sm flex flex-col justify-center text-center">
                                        <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-${colorClass}-500/90 dark:text-${colorClass}-400/90 mb-1">Actual Pace</span>
                                        <span class="text-sm md:text-[1.1rem] font-black text-${colorClass}-700 dark:text-${colorClass}-400"><span id="tg-act-${safeSubId}">${actPace}</span> <span class="text-[9px] opacity-70 font-bold uppercase tracking-widest">ch/d</span></span>
                                        <span id="tg-act-days-${safeSubId}" class="text-[9px] text-${colorClass}-500/80 font-bold mt-0.5">${subjectDaysPassedStr}</span>
                                    </div>
                                    <div class="relative overflow-hidden p-3.5 md:p-5 bg-gradient-to-br from-orange-50/80 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/30 rounded-2xl border border-orange-100 dark:border-orange-800/50 shadow-sm flex flex-col justify-center text-center">
                                        <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-orange-500/90 dark:text-orange-400/90 mb-1">Est. Finish</span>
                                        <span id="tg-est-${safeSubId}" class="text-sm md:text-[1.05rem] font-black text-orange-600 dark:text-orange-400">${estFinishStr}</span>
                                        <span id="tg-est-days-${safeSubId}" class="text-[9px] text-orange-500/80 font-bold mt-0.5">${estDaysNeededStr}</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                                    ${group.tasks.length > 0
                                        ? group.tasks.map(x => generateSingleTaskHtml(x.dayObj, x.taskObj, x.type)).join('')
                                        : `<div class="col-span-full py-8 text-center text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 p-4">
                                            <span class="text-2xl block mb-2 opacity-60">📅</span>
                                            <p class="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">No active timeline dates assigned</p>
                                            <p class="text-[10px] font-bold text-slate-400 mt-1">All ${group.totalChapters} chapters exist in syllabus. Mark Passed & Frozen or configure revisions as needed.</p>
                                        </div>`
                                    }
                                </div>
                    `;
            if (isRevising) {
                if (isFrozen) {
                    blockHtml += `
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 p-4 md:p-5 rounded-[1.25rem] shadow-sm mb-4">
                            <div class="flex items-center space-x-3 md:space-x-4 w-full">
                                <div class="text-3xl drop-shadow-md">🏅</div>
                                <div class="flex flex-wrap items-center flex-1">
                                    <h2 class="tracking-tight flex-1"><span class="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white mr-2">${displaySubName}</span><span class="text-xs md:text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mr-1.5">- ${group.program}</span><span class="text-[10px] md:text-xs font-medium text-blue-500/80 dark:text-blue-500/60 uppercase tracking-widest whitespace-nowrap">- ${trackName} - Revision</span></h2>
                                    <span class="w-full text-[9px] font-black tracking-widest uppercase text-blue-600 dark:text-blue-500 mt-0.5">Status: Revision Passed & Frozen</span>
                                </div>
                            </div>
                        </div>`;
                } else {
                    const sObj = window.getAllSubjects().find(s => s.subject === sub);
                    const staticChapters = sObj ? sObj.chapters : 0;

                    let revCompletedCount = 0;
                    if (window.revisionData.progress[sub]) {
                        for (let i = 1; i <= staticChapters; i++) {
                            let isChapterSkipped = AppState.tasks.some(t => t.type === 'study' && window.tracks.some(trackObj => Array.isArray(t[trackObj.id + 'Tasks']) && t[trackObj.id + 'Tasks'].some(b => b.subject === sub && b.chapter === `Ch. ${i}` && b.skipped)));
                            if (!isChapterSkipped && window.revisionData.progress[sub][i]) {
                                revCompletedCount++;
                            }
                        }
                    }
                    let revPct = group.totalChapters > 0 ? Math.round((revCompletedCount / group.totalChapters) * 100) : 0;

                    let revGridHtml = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mt-4">`;
                    for (let i = 1; i <= staticChapters; i++) {
                        let isChapterSkipped = AppState.tasks.some(t => t.type === 'study' && window.tracks.some(trackObj => Array.isArray(t[trackObj.id + 'Tasks']) && t[trackObj.id + 'Tasks'].some(b => b.subject === sub && b.chapter === `Ch. ${i}` && b.skipped)));
                        if (isChapterSkipped) continue;
                        let isCompleted = window.revisionData.progress[sub] && window.revisionData.progress[sub][i];
                        revGridHtml += generateRevisionTaskHtml(sub, i, isCompleted);
                    }
                    revGridHtml += `</div>`;

                    let revisionHeaderHtml = `
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-blue-200 dark:border-blue-800/50 pb-3 gap-3">
                                <div class="flex flex-wrap items-center gap-y-2 space-x-3 w-full">
                                    <div class="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse"></div>
                                    <h2 class="tracking-tight"><span class="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white mr-2">${displaySubName}</span><span class="text-sm md:text-base font-bold text-blue-500 dark:text-blue-300 uppercase tracking-wider mr-1.5">- ${group.program}</span><span class="text-xs md:text-sm font-medium text-blue-400 dark:text-blue-400 uppercase tracking-widest whitespace-nowrap">- ${trackName} - Revision</span></h2>
                                    <button onclick="window.openRevisionTrendModal()" class="ml-auto text-[9px] md:text-[10px] font-black text-white bg-blue-600 px-2.5 md:px-4 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg> Analytics</button>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800/50 w-fit mb-4">
                                <span id="rev-group-text-${safeSubId}" class="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">${revCompletedCount} <span class="opacity-60 text-[9px] mx-0.5">/</span> ${group.totalChapters} <span class="opacity-60">CH</span></span>
                                <span id="rev-group-pct-${safeSubId}" class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-[10px] font-black border border-blue-100 dark:border-blue-800/50 shadow-sm">${revPct}%</span>
                                <div class="w-24 md:w-32 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-600/30">
                                    <div id="rev-group-bar-${safeSubId}" class="h-full bg-blue-500 transition-all duration-500 ease-out relative" style="width: ${revPct}%"><div class="absolute right-0 top-0 bottom-0 w-2 bg-white/40 rounded-full"></div></div>
                                </div>
                            </div>
                        `;

                    blockHtml += `<div class="mt-8 w-full bg-blue-50/40 dark:bg-blue-900/10 p-4 md:p-6 rounded-[2rem] border-2 border-blue-200 dark:border-blue-800/50 shadow-sm relative overflow-hidden"><div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>${revisionHeaderHtml}${revGridHtml}</div>`;
                }
            }
        }

        if (isProgramVisible && !isFrozen) {
            blockHtml += `
                            </div>
                        </details>
                    `;
        }

        html += blockHtml;
    });

    if (html === '') html = `<div class="flex flex-col items-center py-12 text-slate-400"><span class="text-4xl mb-4">📭</span><p class="font-black uppercase tracking-widest text-sm">No tasks scheduled for this selection</p></div>`;

    list.innerHTML = html;
    document.querySelectorAll('.task-checkbox').forEach(cb => cb.onchange = handleTaskToggle);
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

function generateSingleTaskHtml(dayObj, taskObj, type) {
    let subjectColor = '#3b82f6';
    if (window.getSubjectColor) {
        subjectColor = window.getSubjectColor(taskObj.subject);
    }

    const isSkipped = !!taskObj.skipped;

    // Look up matching weekly target to get size-based progress
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

    const isDarkMode = document.documentElement.classList.contains('dark');

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
            const fillRgba = hexToRgba(subjectColor, isDarkMode ? 0.25 : 0.15);
            cardStyle = `background: linear-gradient(to right, ${fillRgba} ${progressPercent}%, transparent ${progressPercent}%); border-color: ${isDarkMode ? '#334155' : '#e2e8f0'};`;
        }
    }

    return `
                <div id="single-task-${taskObj.id}-${dayObj.studyDay}" class="${cardClass}" style="${cardStyle}">
                    
                    <!-- Color Accent Bar -->
                    <div class="absolute top-0 left-0 w-full h-1" style="${barBgStyle} transition: background-color 0.3s;"></div>
                    
                    <div class="flex justify-between items-start mb-3 mt-1">
                        <span class="text-[9px] px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded-md font-black tracking-widest uppercase">${typeof dayObj.studyDay === 'number' ? `DAY ${dayObj.studyDay}` : 'CH ' + (taskObj.chapter.replace(/\D/g, '') || dayObj.studyDay)} ${isSkipped ? '<span class="text-amber-600 dark:text-amber-400 font-extrabold ml-1">(SKIPPED)</span>' : ''}</span>
                        <button onclick="openEditModal(${typeof dayObj.id === 'number' ? dayObj.id : `'${dayObj.id}'`}, '${type}', '${taskObj.id}')" class="text-slate-400 hover:text-blue-500 active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700" title="Edit/Delete Task">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                    </div>

                    <div class="flex items-end justify-between mt-auto gap-3">
                        <div class="flex flex-col pr-1">
                            <span class="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base tracking-tight leading-tight mb-0.5 ${isCompleted ? 'line-through text-emerald-700 dark:text-emerald-400 opacity-70' : ''} ${isSkipped ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-400' : ''}">${taskObj.chapter}</span>
                            <span class="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 ${isCompleted ? 'line-through opacity-60' : ''} ${isSkipped ? 'opacity-55' : ''}">${taskObj.title}${progressTextHtml}</span>
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

function handleTaskToggle(e) {
    const studyDayId = parseInt(e.target.dataset.studId);
    const type = e.target.dataset.type;
    const subTaskId = e.target.dataset.subtaskId;
    const subj = e.target.dataset.subject;
    const chapter = e.target.dataset.chapter;
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

    // Synchronize to monthlyTargetsDatabase if this subtask is a monthly target!
    if (window.monthlyTargetsDatabase) {
        Object.keys(window.monthlyTargetsDatabase).forEach(monthKey => {
            const targets = window.monthlyTargetsDatabase[monthKey] || [];
            targets.forEach(t => {
                if (t.track === type && t.subject === taskObj.subject) {
                    if (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters') {
                        const isAllDone = window.isSubjectCompleted ? window.isSubjectCompleted(type, t.subject) : isCompleted;
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

    // Synchronize to weeklyTargetsDatabase if this subtask is a weekly target!
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

    // Synchronize to dailyTargetsDatabase if this subtask is a daily target!
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
    const cardEl = document.getElementById(`single-task-${taskObj.id}-${studyDayId}`);
    if (cardEl) {
        const titleEl = cardEl.querySelector('.tracking-tight');
        const descEl = cardEl.querySelector('.line-clamp-2');
        const accentBar = cardEl.querySelector('.absolute.top-0.left-0');

        if (titleEl) {
            if (isCompleted) titleEl.classList.add('line-through', 'text-emerald-700', 'dark:text-emerald-400', 'opacity-70');
            else titleEl.classList.remove('line-through', 'text-emerald-700', 'dark:text-emerald-400', 'opacity-70');
        }
        if (descEl) isCompleted ? descEl.classList.add('line-through', 'opacity-60') : descEl.classList.remove('line-through', 'opacity-60');

        const subjectColor = window.getSubjectColor ? window.getSubjectColor(taskObj.subject) : '#3b82f6';
        const isDarkMode = document.documentElement.classList.contains('dark');

        if (isCompleted) {
            cardEl.style.borderColor = subjectColor;
            cardEl.style.background = '';
            cardEl.style.backgroundColor = isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)';
            if (accentBar) {
                accentBar.style.backgroundColor = subjectColor;
            }
        } else {
            // Check if size-based progress should fill
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
                const fillRgba = hexToRgba(subjectColor, isDarkMode ? 0.25 : 0.15);
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

    // 2. Optimistic UI update: Specific Subject Progress Bar (Prevents full DOM recreation)
    const safeSubId = taskObj.subject.replace(/[^a-zA-Z0-9]/g, '-');
    const subName = taskObj.subject;
    const groupTasks = AppState.tasks.flatMap(t => t.type === 'study' ? (t[key] || []) : []).filter(x => x.subject === subName);
    const sObj = syllabusStructure[type] ? syllabusStructure[type].find(s => s.subject === subName) : null;
    const isFrozenSub = (window.passedItems && window.passedItems.subjects && window.passedItems.subjects.includes(subName)) ||
        (window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(sObj ? sObj.program : ''));

    let skippedCount = 0;
    let completedCount = 0;
    if (sObj && sObj.chapters > 0) {
        for (let chNum = 1; chNum <= sObj.chapters; chNum++) {
            const matched = groupTasks.find(x => {
                const chStr = x.chapter;
                if (chStr === `Ch. ${chNum}` || chStr === `Ch.${chNum}` || chStr === String(chNum)) return true;
                const match = chStr.match(/(\d+)(?!.*\d)/);
                return match && parseInt(match[0]) === chNum;
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

    const textEl = document.getElementById(`group-text-${safeSubId}`);
    if (textEl) textEl.innerHTML = `${displayCompleted} <span class="opacity-60 text-[9px] mx-0.5">/</span> ${totalChapters} <span class="opacity-60">CH</span>`;

    const pctEl = document.getElementById(`group-pct-${safeSubId}`);
    if (pctEl) pctEl.textContent = `${progressPct}%`;

    const barEl = document.getElementById(`group-bar-${safeSubId}`);
    if (barEl) barEl.style.width = `${progressPct}%`;

    // 3. Optimistic UI update: Recalculate and update the 4 specific analytics cards inside the subject view
    const allSubTasks = AppState.tasks.filter(t => t.type === 'study' && t[key] && t[key].some(b => b.subject === subName));

    let targetDate = null;
    let startDate = null;

    let hasTimeGoal = false;
    if (window.subjectTimeLinks && window.subjectTimeLinks[subName]) {
        const link = window.subjectTimeLinks[subName];
        if (link.type === 'date') {
            hasTimeGoal = true;
            if (link.startDate) startDate = Utils.parseDateSafe(link.startDate);
            targetDate = Utils.parseDateSafe(link.date);
        } else if (link.type === 'goal') {
            const pg = window.paceGoals.find(g => g.id === link.id);
            if (pg) {
                hasTimeGoal = true;
                if (pg.startDate) startDate = Utils.parseDateSafe(pg.startDate);
                targetDate = Utils.parseDateSafe(pg.deadline);
            }
        }
    }

    if (!hasTimeGoal) {
        let firstCompletedDay = allSubTasks.find(t => t[key] && t[key].some(b => b.subject === subName && b.completed));
        if (firstCompletedDay) {
            let taskO = firstCompletedDay[key].find(b => b.subject === subName && b.completed);
            if (taskO.completedAt) {
                startDate = new Date(taskO.completedAt);
            } else {
                startDate = getTaskDate(firstCompletedDay);
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
        actualStartDateForPace = taskO.completedAt ? new Date(taskO.completedAt) : getTaskDate(firstCompletedDayForPace);
        actualStartDateForPace.setHours(0, 0, 0, 0);
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

    const reqEl = document.getElementById(`tg-req-${safeSubId}`);
    if (reqEl) reqEl.textContent = reqPaceStr;

    const actEl = document.getElementById(`tg-act-${safeSubId}`);
    if (actEl) actEl.textContent = actPaceStr;

    let subjectDaysPassedStr = '<span class="opacity-60">0 Days Passed</span>';
    if (completedCount > 0 && daysElapsed > 0) {
        subjectDaysPassedStr = `${Utils.formatDaysPassed(daysElapsed)} Passed`;
    }
    const actDaysEl = document.getElementById(`tg-act-days-${safeSubId}`);
    if (actDaysEl) actDaysEl.innerHTML = subjectDaysPassedStr;

    const estEl1 = document.getElementById(`tg-est-${safeSubId}`);
    if (estEl1) estEl1.innerHTML = estFinishStr;

    const estEl2 = document.getElementById(`header-est-${safeSubId}`);
    if (estEl2) estEl2.innerHTML = estFinishStr;

    const tgDaysEl = document.getElementById(`tg-tg-days-${safeSubId}`);
    if (tgDaysEl) tgDaysEl.innerHTML = timeGoalCountdownStr;

    const estDaysEl = document.getElementById(`tg-est-days-${safeSubId}`);
    if (estDaysEl) estDaysEl.innerHTML = estDaysNeededStr;

    // Core Global updates & Saves
    updateMetrics();
    FirebaseService.saveToCloud();

    // Smart background debounce for heavy canvas operations
    if (window.chartDebounce) clearTimeout(window.chartDebounce);
    window.chartDebounce = setTimeout(() => {
        requestAnimationFrame(renderTrendCharts);
    }, 600);
}

/**
* Calculates current progress statistics across all subjects and programs.
*
* TODO(R2):
* Split during module extraction.
* No logic changes in this phase.
*/
function updateMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;

    const subjectStats = {};
    const allSubjects = window.getAllSubjects();

    allSubjects.forEach(sObj => {
        const sub = sObj.subject;
        const totalSyllabusChapters = sObj.chapters || 0;
        let trackId = sObj.track;
        if (!trackId) {
            for (const tid in syllabusStructure) {
                if (Array.isArray(syllabusStructure[tid]) && syllabusStructure[tid].some(s => s.subject === sub)) {
                    trackId = tid;
                    break;
                }
            }
        }
        trackId = trackId || 'ca';

        const isFrozen = window.passedItems && (
            (window.passedItems.subjects && window.passedItems.subjects.includes(sub)) ||
            (window.passedItems.programs && window.passedItems.programs.includes(sObj.program))
        );

        let skippedChapters = 0;
        let completedChapters = 0;
        let earliestCompletedDate = null;
        let tasksAssigned = 0;

        // Collect all study tasks matching this subject
        const subTasks = [];
        AppState.tasks.filter(t => t.type === 'study').forEach(t => {
            window.tracks.forEach(track => {
                const key = track.id + 'Tasks';
                if (Array.isArray(t[key])) {
                    t[key].forEach(b => {
                        if (b.subject === sub) {
                            subTasks.push({ dayObj: t, taskObj: b, trackId: track.id });
                        }
                    });
                }
            });
        });

        tasksAssigned = subTasks.filter(x => !x.taskObj.skipped).length;

        if (totalSyllabusChapters > 0) {
            for (let chNum = 1; chNum <= totalSyllabusChapters; chNum++) {
                const matchedTaskItem = subTasks.find(x => {
                    const chStr = x.taskObj.chapter;
                    if (chStr === `Ch. ${chNum}` || chStr === `Ch.${chNum}` || chStr === String(chNum)) return true;
                    const match = chStr.match(/(\d+)(?!.*\d)/);
                    return match && parseInt(match[0]) === chNum;
                });

                if (matchedTaskItem && matchedTaskItem.taskObj.skipped) {
                    skippedChapters++;
                } else if (matchedTaskItem && matchedTaskItem.taskObj.completed) {
                    completedChapters += 1;
                    let d = matchedTaskItem.taskObj.completedAt ? new Date(matchedTaskItem.taskObj.completedAt) : getTaskDate(matchedTaskItem.dayObj);
                    if (isNaN(d.getTime())) d = getTaskDate(matchedTaskItem.dayObj);
                    if (!earliestCompletedDate || d < earliestCompletedDate) {
                        earliestCompletedDate = d;
                    }
                } else {
                    const prog = window.getChapterWeeklyTargetProgress ? window.getChapterWeeklyTargetProgress(trackId, sub, `Ch. ${chNum}`) : null;
                    if (prog && prog.isSizeBased && prog.total > 0 && prog.completed > 0) {
                        completedChapters += Math.min(1, prog.completed / prog.total);
                    }
                }
            }
        } else {
            subTasks.forEach(x => {
                if (x.taskObj.skipped) {
                    skippedChapters++;
                } else if (x.taskObj.completed) {
                    completedChapters += 1;
                    let d = x.taskObj.completedAt ? new Date(x.taskObj.completedAt) : getTaskDate(x.dayObj);
                    if (isNaN(d.getTime())) d = getTaskDate(x.dayObj);
                    if (!earliestCompletedDate || d < earliestCompletedDate) {
                        earliestCompletedDate = d;
                    }
                }
            });
        }

        const totalActiveChapters = Math.max(0, totalSyllabusChapters - skippedChapters);
        const effectiveChapters = isFrozen ? totalActiveChapters : Math.min(totalActiveChapters, completedChapters);

        // Calculate subject actual pace
        let actualPace = 0;
        if (earliestCompletedDate) {
            const start = new Date(earliestCompletedDate);
            start.setHours(0, 0, 0, 0);
            if (start <= today) {
                const daysElapsed = Math.floor((today - start) / msPerDay) + 1;
                actualPace = effectiveChapters / daysElapsed;
            }
        }

        subjectStats[sub] = {
            totalChapters: totalActiveChapters,
            tasksAssigned: tasksAssigned,
            tasksCompleted: completedChapters,
            effectiveChapters: effectiveChapters,
            earliestCompletedDate: earliestCompletedDate,
            actualPace: actualPace
        };
    });

    window.lastSubjectStats = subjectStats; // Cache for the details modal

    // 1. Calculate Absolute Completion Progress (Top UI Bar - ALL SUBJECTS)
    let scopeTotalChapters = 0;
    let scopeCompleted = 0;
    const allSubs = window.getAllSubjects().map(s => s.subject);
    allSubs.forEach(sub => {
        if (subjectStats[sub]) {
            scopeTotalChapters += subjectStats[sub].totalChapters;
            scopeCompleted += subjectStats[sub].effectiveChapters;
        }
    });

    const percentage = scopeTotalChapters > 0 ? Math.round((scopeCompleted / scopeTotalChapters) * 100) : 0;
    const displayCompleted = Math.round(scopeCompleted);

    safeSetText('progress-title', "Global Overall Completion");
    safeSetText('progress-text', `${percentage}%`);
    safeSetText('progress-detail', `${displayCompleted} / ${scopeTotalChapters} Chapters`);

    const pBar = document.getElementById('progress-bar');
    if (pBar) pBar.style.width = `${percentage}%`;

    // 2. Accurate Aggregated Pace Engine (Top Boxes)
    if (!AppState.globalStartDate || !AppState.globalEndDate) {
        // FALLBACK: Use actual pace based on 1st completed chapter across the entire system
        let earliestDate = null;
        AppState.tasks.forEach(t => {
            if (t.type === 'study') {
                window.tracks.forEach(track => {
                    const key = track.id + 'Tasks';
                    if (Array.isArray(t[key])) {
                        t[key].forEach(b => {
                            if (b.completed) {
                                let d = b.completedAt ? new Date(b.completedAt) : getTaskDate(t);
                                if (!earliestDate || d < earliestDate) earliestDate = d;
                            }
                        });
                    }
                });
            }
        });

        let paceTotalChapters = scopeTotalChapters;
        let paceCompleted = scopeCompleted;
        let remaining = Math.max(0, paceTotalChapters - paceCompleted);

        let globalCurPace = 0;
        let start = earliestDate ? new Date(earliestDate) : new Date(today);
        start.setHours(0, 0, 0, 0);

        if (earliestDate && start <= today) {
            const daysElapsed = Math.floor((today - start) / msPerDay) + 1;
            globalCurPace = paceCompleted / daysElapsed;
        }

        window.latestPaceData = {
            total: paceTotalChapters,
            completed: paceCompleted,
            start: new Date(start),
            end: globalCurPace > 0 ? new Date(today.getTime() + (remaining / globalCurPace) * msPerDay) : new Date(today),
            today: new Date(today),
            reqPace: 0,
            curPace: globalCurPace,
            projectedDate: paceTotalChapters === 0 || globalCurPace <= 0 ? new Date(0) : new Date(today.getTime() + (remaining / globalCurPace) * msPerDay),
            subjects: allSubs
        };

        const currentPaceDisplay = globalCurPace.toFixed(2);
        safeSetText('target-req-pace', `--`);
        safeSetText('current-pace-stat', `${currentPaceDisplay} Ch/Day`);
        safeSetText('global-pace-req', `--`);
        safeSetText('global-pace-act', `${currentPaceDisplay} Ch/Day`);
        safeSetText('db-target-req-pace', `--`);
        safeSetText('db-current-pace-stat', `${currentPaceDisplay} Ch/Day`);

        let finishDisplay = '';
        let globalDaysLeftStr = '<span class="opacity-50">--</span>';
        let globalDaysNeededStr = '<span class="opacity-50">--</span>';
        let globalDaysPassedStr = '<span class="opacity-50">--</span>';

        if (paceTotalChapters === 0) {
            finishDisplay = '<span class="text-sm opacity-50 uppercase tracking-widest">No Targets</span>';
        } else if (remaining <= 0) {
            finishDisplay = '<span class="text-emerald-500">Finished!</span>';
            globalDaysLeftStr = '<span class="text-emerald-500 font-bold">Done</span>';
            globalDaysNeededStr = '<span class="text-emerald-500 font-bold">0 Days</span>';
            if (earliestDate) {
                const daysElapsed = Math.max(0, Math.floor((today - start) / msPerDay) + 1);
                globalDaysPassedStr = `${Utils.formatDaysPassed(daysElapsed)} Passed`;
            }
        } else if (globalCurPace <= 0) {
            finishDisplay = '<span class="text-sm opacity-50 uppercase tracking-widest">No Data</span>';
            globalDaysLeftStr = '<span class="opacity-50">--</span>';
        } else {
            let projDate = window.latestPaceData.projectedDate;
            finishDisplay = Utils.formatDateResponsive(projDate);
            const globalDaysLeftNeed = remaining / globalCurPace;
            globalDaysNeededStr = `${Math.ceil(globalDaysLeftNeed)} Days Needed`;
            globalDaysLeftStr = '<span class="text-slate-400 font-bold">No Goal</span>';
            if (earliestDate) {
                const daysElapsed = Math.max(0, Math.floor((today - start) / msPerDay) + 1);
                globalDaysPassedStr = `${Utils.formatDaysPassed(daysElapsed)} Passed`;
            }
        }

        safeSetHtml('projected-finish', finishDisplay);
        safeSetHtml('db-projected-finish', finishDisplay);

        const globalLeftEl = document.getElementById('global-days-left');
        if (globalLeftEl) globalLeftEl.innerHTML = globalDaysLeftStr;

        const globalNeedEl = document.getElementById('global-days-needed');
        if (globalNeedEl) globalNeedEl.innerHTML = globalDaysNeededStr;

        const globalPassedEl = document.getElementById('global-days-passed');
        if (globalPassedEl) globalPassedEl.innerHTML = globalDaysPassedStr;

        const dbLeftEl = document.getElementById('db-global-days-left');
        if (dbLeftEl) dbLeftEl.innerHTML = globalDaysLeftStr;

        const dbNeedEl = document.getElementById('db-global-days-needed');
        if (dbNeedEl) dbNeedEl.innerHTML = globalDaysNeededStr;

        const dbPassedEl = document.getElementById('db-global-days-passed');
        if (dbPassedEl) dbPassedEl.innerHTML = globalDaysPassedStr;

        let timelineText = earliestDate ? `Started: ${Utils.formatDateResponsive(start)}` : `Not Started`;
        let dbTimelineText = earliestDate ? Utils.formatDateResponsive(start) : `Not Started`;
        safeSetHtml('pace-timeline-info', `<span class="text-slate-500 font-bold">Global Baseline</span> <span class="mx-1 opacity-50">|</span> <span class="tracking-widest text-[9px] uppercase">${timelineText}</span>`);
        safeSetHtml('db-pace-timeline-info', dbTimelineText);

        const statusLabel = document.getElementById('target-status-label');
        if (statusLabel) {
            statusLabel.className = "text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest drop-shadow-sm";
            statusLabel.textContent = "NO TARGETS SET";
        }

        const dbStatusLabel = document.getElementById('db-target-status-label');
        if (dbStatusLabel) {
            dbStatusLabel.className = "text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 truncate";
            dbStatusLabel.textContent = "NO GOAL";
        }

        let progComment = { text: "No global pace goal is set. Actual pace is calculating dynamically from your first completed chapter.", icon: "📊", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800/50" };
        safeSetHtml('prog-comment', `<div class="flex items-start space-x-3 p-3.5 rounded-xl border ${progComment.bg} ${progComment.border} shadow-sm transition-all duration-300 hover:shadow-md"><span class="text-lg md:text-xl drop-shadow-sm">${progComment.icon}</span><p class="text-[10px] md:text-xs font-bold leading-relaxed mt-0.5 ${progComment.color}">${progComment.text}</p></div>`);
    } else {
        // Find all subjects explicitly targeted by ANY goal
        let targetedSubjects = new Set();
        const globalGoal = window.paceGoals.find(g => g.type === 'global');

        if (globalGoal) {
            const isManualGlobal = globalGoal.subjects || globalGoal.secondaryPaces;
            if (isManualGlobal) {
                if (globalGoal.subjects) globalGoal.subjects.forEach(s => targetedSubjects.add(s));
                if (globalGoal.secondaryPaces) {
                    globalGoal.secondaryPaces.forEach(pid => {
                        const g = window.paceGoals.find(x => x.id === pid);
                        if (g) {
                            if (g.type === 'bundle') {
                                if (g.subjects) g.subjects.forEach(s => targetedSubjects.add(s));
                                if (g.programs) {
                                    window.tracks.map(t => t.id).forEach(track => {
                                        if (syllabusStructure[track]) {
                                            syllabusStructure[track].forEach(s => { if (g.programs.includes(s.program)) targetedSubjects.add(s.subject); });
                                        }
                                    });
                                }
                            } else if (g.type === 'subject') {
                                targetedSubjects.add(g.target);
                            } else if (g.type === 'program') {
                                window.tracks.map(t => t.id).forEach(track => {
                                    if (syllabusStructure[track]) {
                                        syllabusStructure[track].forEach(s => { if (g.target === s.program) targetedSubjects.add(s.subject); });
                                    }
                                });
                            }
                        }
                    });
                }
            } else {
                window.paceGoals.forEach(g => {
                    if (g.type === 'global') return;

                    // Strict Time Period Constraint: Only aggregate if this goal intersects with the global timeline
                    const gStart = g.startDate ? Utils.parseDateSafe(g.startDate) : new Date(AppState.globalStartDate);
                    const gEnd = g.deadline ? Utils.parseDateSafe(g.deadline) : new Date(AppState.globalEndDate);
                    gStart.setHours(0, 0, 0, 0);
                    gEnd.setHours(23, 59, 59, 999);

                    if (gEnd < AppState.globalStartDate || gStart > AppState.globalEndDate) return; // Ignore if completely outside global period

                    if (g.type === 'bundle') {
                        if (g.subjects) g.subjects.forEach(s => targetedSubjects.add(s));
                        if (g.programs) {
                            window.tracks.map(t => t.id).forEach(track => {
                                if (syllabusStructure[track]) {
                                    syllabusStructure[track].forEach(s => { if (g.programs.includes(s.program)) targetedSubjects.add(s.subject); });
                                }
                            });
                        }
                    } else if (g.type === 'subject') {
                        targetedSubjects.add(g.target);
                    } else if (g.type === 'program') {
                        window.tracks.map(t => t.id).forEach(track => {
                            if (syllabusStructure[track]) {
                                syllabusStructure[track].forEach(s => { if (g.target === s.program) targetedSubjects.add(s.subject); });
                            }
                        });
                    }
                });
            }
        }

        let paceTotalChapters = 0;
        let paceCompleted = 0;
        targetedSubjects.forEach(sub => {
            if (subjectStats[sub]) {
                paceTotalChapters += subjectStats[sub].totalChapters;
                paceCompleted += subjectStats[sub].effectiveChapters;
            }
        });

        const start = new Date(AppState.globalStartDate); start.setHours(0, 0, 0, 0);
        const end = new Date(AppState.globalEndDate); end.setHours(23, 59, 59, 999);

        const remaining = Math.max(0, paceTotalChapters - paceCompleted);
        const totalDays = Math.max(1, Math.ceil((end - start) / msPerDay));
        const daysElapsed = Math.floor((today - start) / msPerDay) + 1;
        const daysRemaining = Math.max(0, Math.ceil((end - today) / msPerDay));

        let globalReqPace = 0;
        let globalCurPace = 0;

        if (paceTotalChapters > 0) {
            if (today < start) {
                globalReqPace = paceTotalChapters / totalDays;
                globalCurPace = 0;
            } else if (today > end) {
                globalReqPace = remaining > 0 ? remaining : 0;
                globalCurPace = paceCompleted / daysElapsed;
            } else {
                globalReqPace = remaining > 0 ? remaining / Math.max(1, daysRemaining) : 0;
                globalCurPace = paceCompleted / daysElapsed;
            }
        }

        // Save Pace Data for the Chart specifically
        window.latestPaceData = {
            total: paceTotalChapters,
            completed: paceCompleted,
            start: new Date(start),
            end: new Date(end),
            today: new Date(today),
            reqPace: globalReqPace,
            curPace: globalCurPace,
            projectedDate: paceTotalChapters === 0 || globalCurPace <= 0 ? new Date(0) : new Date(today.getTime() + (remaining / globalCurPace) * msPerDay),
            subjects: Array.from(targetedSubjects)
        };

        // UI Formatting for Pace Section
        const currentPaceDisplay = globalCurPace.toFixed(2);
        const reqPaceDisplay = globalReqPace.toFixed(2);

        let maxProjectedDate = window.latestPaceData.projectedDate;
        let finishDisplay = '';

        let globalDaysLeftStr = '<span class="opacity-50">--</span>';
        let globalDaysNeededStr = '<span class="opacity-50">--</span>';
        let globalDaysPassedStr = '<span class="opacity-50">--</span>';
        let diffGlobalDaysTG = Math.ceil((end - today) / msPerDay);

        if (paceTotalChapters === 0) {
            finishDisplay = '<span class="text-sm opacity-50 uppercase tracking-widest">No Targets</span>';
        } else if (remaining <= 0) {
            finishDisplay = '<span class="text-emerald-500">Finished!</span>';
            globalDaysLeftStr = '<span class="text-emerald-500 font-bold">Done</span>';
            globalDaysNeededStr = '<span class="text-emerald-500 font-bold">0 Days</span>';
            globalDaysPassedStr = `${Utils.formatDaysPassed(Math.max(0, daysElapsed))} Passed`;
        } else if (globalCurPace <= 0) {
            if (today < start) finishDisplay = '<span class="text-sm font-black text-blue-400 uppercase tracking-widest">Future Timeline</span>';
            else if (today > end) finishDisplay = '<span class="text-sm font-black text-red-500 uppercase tracking-widest">Overdue</span>';
            else finishDisplay = '<span class="text-sm opacity-50 uppercase tracking-widest">No Data</span>';

            if (diffGlobalDaysTG > 0) globalDaysLeftStr = `${diffGlobalDaysTG} Days Left`;
            else if (diffGlobalDaysTG === 0) globalDaysLeftStr = `<span class="text-orange-400">Due Today</span>`;
            else globalDaysLeftStr = `<span class="text-red-400">${Math.abs(diffGlobalDaysTG)} Days Overdue</span>`;
            globalDaysPassedStr = `${Utils.formatDaysPassed(Math.max(0, daysElapsed))} Passed`;
        } else {
            finishDisplay = Utils.formatDateResponsive(maxProjectedDate);

            if (diffGlobalDaysTG > 0) globalDaysLeftStr = `${diffGlobalDaysTG} Days Left`;
            else if (diffGlobalDaysTG === 0) globalDaysLeftStr = `<span class="text-orange-400">Due Today</span>`;
            else globalDaysLeftStr = `<span class="text-red-400">${Math.abs(diffGlobalDaysTG)} Days Overdue</span>`;

            const globalDaysLeftNeed = remaining / globalCurPace;
            globalDaysNeededStr = `${Math.ceil(globalDaysLeftNeed)} Days Needed`;
            globalDaysPassedStr = `${Utils.formatDaysPassed(Math.max(0, daysElapsed))} Passed`;
        }

        safeSetText('target-req-pace', `${reqPaceDisplay} Ch/Day`);
        safeSetText('current-pace-stat', `${currentPaceDisplay} Ch/Day`);
        safeSetHtml('projected-finish', finishDisplay);

        safeSetText('global-pace-req', `${reqPaceDisplay} Ch/Day`);
        safeSetText('global-pace-act', `${currentPaceDisplay} Ch/Day`);
        safeSetHtml('global-pace-finish', finishDisplay);

        safeSetText('db-target-req-pace', `${reqPaceDisplay} Ch/Day`);
        safeSetText('db-current-pace-stat', `${currentPaceDisplay} Ch/Day`);
        safeSetHtml('db-projected-finish', finishDisplay);

        const globalLeftEl = document.getElementById('global-days-left');
        if (globalLeftEl) globalLeftEl.innerHTML = globalDaysLeftStr;

        const globalNeedEl = document.getElementById('global-days-needed');
        if (globalNeedEl) globalNeedEl.innerHTML = globalDaysNeededStr;

        const globalPassedEl = document.getElementById('global-days-passed');
        if (globalPassedEl) globalPassedEl.innerHTML = globalDaysPassedStr;

        const dbLeftEl = document.getElementById('db-global-days-left');
        if (dbLeftEl) dbLeftEl.innerHTML = globalDaysLeftStr;

        const dbNeedEl = document.getElementById('db-global-days-needed');
        if (dbNeedEl) dbNeedEl.innerHTML = globalDaysNeededStr;

        const dbPassedEl = document.getElementById('db-global-days-passed');
        if (dbPassedEl) dbPassedEl.innerHTML = globalDaysPassedStr;

        let timelineText = Utils.formatDateRangeResponsive(start, end, ' &rarr; ');
        let dbTimelineText = Utils.formatDateRangeResponsive(start, end, ' &rarr; ');
        safeSetHtml('pace-timeline-info', `<span class="text-blue-500 font-bold">Global Baseline</span> <span class="mx-1 opacity-50">|</span> <span class="tracking-widest text-[9px] uppercase">${timelineText}</span>`);
        safeSetHtml('db-pace-timeline-info', dbTimelineText);

        const statusLabel = document.getElementById('target-status-label');
        if (statusLabel) {
            if (paceTotalChapters === 0) {
                statusLabel.className = "text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest drop-shadow-sm";
                statusLabel.textContent = "NO TARGETS SET";
            } else if (today < start) {
                statusLabel.className = "text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest drop-shadow-sm";
                statusLabel.textContent = "TIMELINES START IN FUTURE";
            } else if (today > end && remaining > 0) {
                statusLabel.className = "text-[9px] md:text-[10px] font-black text-red-500 uppercase tracking-widest drop-shadow-sm";
                statusLabel.textContent = "TIMELINE OVERDUE";
            } else if (globalCurPace >= globalReqPace && globalReqPace > 0) {
                statusLabel.className = "text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest drop-shadow-sm";
                statusLabel.innerHTML = `TARGET: ${Utils.formatDateResponsive(end)}`;
            } else {
                statusLabel.className = "text-[9px] md:text-[10px] font-black text-red-500 uppercase tracking-widest drop-shadow-sm";
                statusLabel.innerHTML = `TARGET: ${Utils.formatDateResponsive(end)}`;
            }
        }

        const dbStatusLabel = document.getElementById('db-target-status-label');
        if (dbStatusLabel) {
            if (paceTotalChapters === 0) {
                dbStatusLabel.className = "text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 truncate";
                dbStatusLabel.textContent = "NO TARGETS";
            } else if (today < start) {
                dbStatusLabel.className = "text-[9px] md:text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mt-0.5 truncate";
                dbStatusLabel.textContent = "FUTURE";
            } else if (today > end && remaining > 0) {
                dbStatusLabel.className = "text-[9px] md:text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mt-0.5 truncate";
                dbStatusLabel.textContent = "OVERDUE";
            } else if (remaining <= 0) {
                dbStatusLabel.className = "text-[9px] md:text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mt-0.5 truncate";
                dbStatusLabel.textContent = "DONE";
            } else {
                dbStatusLabel.className = "text-[9px] md:text-[10px] font-bold text-blue-400 dark:text-blue-400 uppercase tracking-wider mt-0.5 truncate";
                dbStatusLabel.innerHTML = `Target: ${Utils.formatDateResponsive(end)}`;
            }
        }

        // Dynamic Contextual Comments
        let progComment = {};
        if (paceTotalChapters === 0) {
            progComment = { text: "No pace goals are mapped. Add a goal in Master Configuration to track speed.", icon: "📭", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" };
        } else if (today < start) {
            progComment = { text: "Your assigned timelines haven't started yet. Get ready to begin when the time comes!", icon: "⏳", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800/50" };
        } else if (today > end && remaining > 0) {
            progComment = { text: "The target timeline has expired but AppState.tasks remain. You are currently overdue!", icon: "⏰", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800/50" };
        } else if (remaining <= 0 && paceTotalChapters > 0) {
            progComment = { text: "Target timelines completely finished! Outstanding achievement.", icon: "🏆", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/50" };
        } else if (globalCurPace >= globalReqPace && globalCurPace > 0) {
            progComment = { text: "Excellent pace! You are on track to beat your aggregated deadlines.", icon: "🚀", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/50" };
        } else if (globalCurPace >= globalReqPace * 0.75 && globalCurPace > 0) {
            progComment = { text: "Good steady progress, but slightly behind the required timeline. Push a bit harder!", icon: "👍", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800/50" };
        } else if (globalCurPace > 0) {
            progComment = { text: "You're falling behind the required pace. Time to double down on studies!", icon: "⚠️", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800/50" };
        } else {
            progComment = { text: "No chapters completed in this active timeline yet! Start ticking off AppState.tasks to build momentum.", icon: "🚨", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800/50" };
        }

        safeSetHtml('prog-comment', `<div class="flex items-start space-x-3 p-3.5 rounded-xl border ${progComment.bg} ${progComment.border} shadow-sm transition-all duration-300 hover:shadow-md"><span class="text-lg md:text-xl drop-shadow-sm">${progComment.icon}</span><p class="text-[10px] md:text-xs font-bold leading-relaxed mt-0.5 ${progComment.color}">${progComment.text}</p></div>`);
    }

    renderSubjectProgress(subjectStats);
    renderSubjectNavigation();
    renderCategoryProgress(subjectStats);
    renderTrackProgress(subjectStats);
    window.renderPaceGoals(subjectStats);
    if (window.renderGlobalPaceTrendChart) {
        window.renderGlobalPaceTrendChart();
    }

    const pChartCanvas = document.getElementById('progressChart');
    if (pChartCanvas) {
        const pChartData = [displayCompleted, Math.max(0, scopeTotalChapters - displayCompleted)];
        if (AppState.progressChart && typeof AppState.progressChart.update === 'function') {
            AppState.progressChart.data.datasets[0].data = pChartData;
            AppState.progressChart.update();
        } else {
            AppState.progressChart = new Chart(pChartCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: pChartData,
                        backgroundColor: ['#3b82f6', 'rgba(148, 163, 184, 0.15)'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '82%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                }
            });
        }
    }

    // Compact Global Completion for Dashboard
    safeSetText('db-progress-text', `${percentage}%`);
    safeSetText('db-progress-detail', `${displayCompleted} / ${scopeTotalChapters} Chapters`);
    const dbBar = document.getElementById('db-progress-bar');
    if (dbBar) dbBar.style.width = `${percentage}%`;

    const dbCanvas = document.getElementById('dbProgressChart');
    if (dbCanvas) {
        if (window.dbProgressChartInstance) {
            window.dbProgressChartInstance.data.datasets[0].data = [displayCompleted, scopeTotalChapters - displayCompleted];
            window.dbProgressChartInstance.update();
        } else {
            window.dbProgressChartInstance = new Chart(dbCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [displayCompleted, scopeTotalChapters - displayCompleted],
                        backgroundColor: ['#3b82f6', 'rgba(148, 163, 184, 0.1)'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '80%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                }
            });
        }
    }

    // Live Sync for Modals
    if (document.getElementById('pace-trend-modal') && !document.getElementById('pace-trend-modal').classList.contains('hidden')) {
        window.renderPaceTrendChart(window.activeTrendGoalId);
    }
    if (document.getElementById('revision-trend-modal') && !document.getElementById('revision-trend-modal').classList.contains('hidden')) {
        window.renderRevisionTrendChart();
    }
}

// Pace Goals rendering extracted to js/features/pace/paceManager.js
window.renderPaceGoals = function (subjectStats) {
    if (window.PaceManager && typeof window.PaceManager.renderPaceGoals === 'function') {
        return window.PaceManager.renderPaceGoals(subjectStats);
    }
};


function renderSubjectProgress(subjectStats) {
    const container = document.getElementById('subject-progress-container');
    if (!container) return;
    if (!subjectStats || Object.keys(subjectStats).length === 0 || typeof Object.values(subjectStats)[0] !== 'object' || !('totalChapters' in (Object.values(subjectStats)[0] || {}))) {
        subjectStats = window.lastSubjectStats || {};
    }

    const colorPairs = [
        { bg: "bg-gradient-to-r from-indigo-400 to-indigo-600", text: "text-indigo-500" }, { bg: "bg-gradient-to-r from-emerald-400 to-emerald-600", text: "text-emerald-500" },
        { bg: "bg-gradient-to-r from-violet-400 to-violet-600", text: "text-violet-500" }, { bg: "bg-gradient-to-r from-rose-400 to-rose-600", text: "text-rose-500" },
        { bg: "bg-gradient-to-r from-amber-400 to-amber-600", text: "text-amber-500" }, { bg: "bg-gradient-to-r from-cyan-400 to-cyan-600", text: "text-cyan-500" }
    ];

    let pIdx = 0;
    let html = '';
    window.tracks.forEach(trackObj => {
        const track = trackObj.id;
        const trackName = trackObj.name || track;
        if (window.customPrograms[track]) {
            const trackSubs = syllabusStructure[track] || [];
            if (trackSubs.length === 0) return;

            let trackTotalChapters = 0;
            let trackEffectiveChapters = 0;
            trackSubs.forEach(s => {
                const stats = subjectStats[s.subject] || { totalChapters: s.chapters || 0, effectiveChapters: 0 };
                trackTotalChapters += (stats.totalChapters || 0);
                trackEffectiveChapters += (stats.effectiveChapters || 0);
            });
            const trackPerc = trackTotalChapters > 0 ? Math.min(100, (trackEffectiveChapters / trackTotalChapters) * 100) : 0;

            html += `
                    <div class="mb-8 p-4 sm:p-5 md:p-6 bg-slate-50/50 dark:bg-slate-900/10 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
                        <div class="mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">${trackName}</span>
                                    <span class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">(Track Progress)</span>
                                </div>
                                <div class="flex items-center gap-1 text-xs md:text-sm font-black text-indigo-600 dark:text-indigo-400">
                                    <span>${Math.round(trackEffectiveChapters)}/${trackTotalChapters} Ch</span>
                                    <span class="ml-1">(${Math.round(trackPerc)}%)</span>
                                </div>
                            </div>
                            <div class="w-full bg-slate-100 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden shadow-inner border border-slate-200/40 dark:border-slate-600/30">
                                <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out shadow-sm" style="width: ${trackPerc}%"></div>
                            </div>
                        </div>
                        <div class="space-y-5">
                    `;

            window.customPrograms[track].forEach(prog => {
                const progName = prog.name || prog;
                const subs = syllabusStructure[track] ? syllabusStructure[track].filter(s => s.program === progName) : [];
                if (subs.length === 0) return;

                const cp = colorPairs[pIdx % colorPairs.length];

                html += `
                        <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
                            <h3 class="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3.5 tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-1.5">${progName} Program</h3>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        `;

                subs.forEach(sub => {
                    const stats = subjectStats[sub.subject] || { totalChapters: sub.chapters || 0, effectiveChapters: 0 };
                    const perc = stats.totalChapters > 0 ? Math.min(100, (stats.effectiveChapters / stats.totalChapters) * 100) : 0;

                    let cleanSubName = sub.subject;
                    if (cleanSubName.startsWith(progName + ' - ')) cleanSubName = cleanSubName.replace(progName + ' - ', '');
                    else if (cleanSubName.startsWith(progName + ' ')) cleanSubName = cleanSubName.replace(progName + ' ', '');

                    html += `
                            <div class="group flex flex-col justify-center">
                                <div class="flex justify-between items-center text-[10px] md:text-[11px] font-black mb-1.5 transition-all group-hover:translate-x-1">
                                    <div class="flex items-center truncate pr-2">
                                        <span class="truncate text-slate-700 dark:text-slate-200" title="${sub.subject}">${cleanSubName}</span>
                                    </div>
                                    <div class="flex items-center shrink-0">
                                        <span class="ml-1">${Math.round(stats.effectiveChapters)}/${stats.totalChapters} <span class="${cp.text} ml-0.5">(${Math.round(perc)}%)</span></span>
                                    </div>
                                </div>
                                <div class="w-full bg-slate-100 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden shadow-inner border border-slate-200/40 dark:border-slate-600/30">
                                    <div class="${cp.bg} h-full rounded-full transition-all duration-700 ease-out shadow-sm" style="width: ${perc}%"></div>
                                </div>
                            </div>
                            `;
                });
                html += `
                            </div>
                        </div>
                        `;
                pIdx++;
            });

            html += `
                        </div>
                    </div>
                    `;
        }
    });
    container.innerHTML = html;
}

function renderSubjectNavigation() {
    const container = document.getElementById('subject-navigation-container');
    if (!container) return;
    let html = '';

    const btnClass = (val) => {
        const isActive = AppState.currentFilter === val;
        return `active:scale-95 whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-transparent scale-105' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-md'}`;
    };

    // ALL button and Revise Setup
    html += `<div class="mb-3 flex gap-2"><button class="${btnClass('All')}" onclick="window.setFilter('All')">All Tasks</button><button class="active:scale-95 whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all duration-300 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/60 shadow-sm flex items-center gap-1.5" onclick="window.openRevisionModal()"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Revise Subject</button></div>`;

    window.tracks.forEach(trackObj => {
        const track = trackObj.id;
        if (window.customPrograms[track]) {
            window.customPrograms[track].forEach(prog => {
                const progName = prog.name || prog;
                const subs = (syllabusStructure[track] || []).filter(s => s.program === progName).sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
                if (subs.length > 0) {
                    html += `
                            <div class="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="text-[9px] md:text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1 w-full">${progName} PROGRAM</span>
                                </div>
                                <div class="flex flex-wrap gap-2 md:gap-3">
                                    <button class="${btnClass(progName)}" onclick="window.setFilter('${progName.replace(/'/g, "\\'")}');">[ ENTIRE ${progName} ]</button>
                                    ${subs.map(s => {
                        let displaySub = s.subject;
                        if (displaySub.startsWith(s.program + ' - ')) displaySub = displaySub.replace(s.program + ' - ', '');
                        else if (displaySub.startsWith(s.program + ' ')) displaySub = displaySub.replace(s.program + ' ', '');
                        return `<button class="${btnClass(s.subject)}" onclick="window.setFilter('${s.subject.replace(/'/g, "\\'")}');">${displaySub}</button>`;
                    }).join('')}
                                </div>
                            </div>`;
                }
            });
        }
    });
    container.innerHTML = html;
}

function renderCategoryProgress(subjectStats) {
    const container = document.getElementById('category-progress-container');
    if (!container) return;
    if (!subjectStats || Object.keys(subjectStats).length === 0 || typeof Object.values(subjectStats)[0] !== 'object' || !('totalChapters' in (Object.values(subjectStats)[0] || {}))) {
        subjectStats = window.lastSubjectStats || {};
    }

    const colors = ['text-indigo-500', 'text-emerald-500', 'text-violet-500', 'text-rose-500', 'text-amber-500', 'text-cyan-500'];
    const shadows = ['shadow-[0_0_15px_rgba(99,102,241,0.3)]', 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', 'shadow-[0_0_15px_rgba(139,92,246,0.3)]', 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', 'shadow-[0_0_15px_rgba(6,182,212,0.3)]'];

    let html = ''; let catIdx = 0;

    window.tracks.map(t => t.id).forEach(track => {
        if (window.customPrograms[track]) {
            window.customPrograms[track].forEach(prog => {
                const progName = prog.name || prog;
                if (window.programVisibility && window.programVisibility[progName] === false) return;
                const subs = syllabusStructure[track] ? syllabusStructure[track].filter(s => s.program === progName) : [];
                if (subs.length === 0) return;

                let totalChap = 0; let doneChap = 0;
                subs.forEach(sub => {
                    const s = subjectStats[sub.subject];
                    totalChap += (s ? s.totalChapters : sub.chapters) || 0;
                    doneChap += (s ? s.effectiveChapters : 0) || 0;
                });
                const perc = totalChap > 0 ? Math.round((doneChap / totalChap) * 100) : 0;
                const color = colors[catIdx % colors.length]; const shadow = shadows[catIdx % shadows.length];

                html += `<div class="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between group">
                    <div>
                        <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform">${progName}</h3>
                        <p class="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">${Math.round(doneChap)} / ${totalChap} Chapters</p>
                    </div>
                    <button onclick="window.openProgramCompletionsModal('${track}', '${progName.replace(/'/g, "\\'")}')" class="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 ${shadow} rounded-full bg-white dark:bg-slate-800 shrink-0 hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer border-0 p-0" title="View Subject Completions">
                        <svg class="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36"><path class="text-slate-100 dark:text-slate-700/50" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path class="${color}" stroke-width="3.5" stroke-dasharray="${perc}, 100" stroke="currentColor" fill="none" stroke-linecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
                        <span class="absolute text-[9px] md:text-[10px] font-black ${color}">${perc}%</span>
                    </button>
                </div>`;
                catIdx++;
            });
        }
    });
    container.innerHTML = html;
}

function renderTrackProgress(subjectStats) {
    const container = document.getElementById('track-progress-container');
    if (!container) return;
    if (!subjectStats || Object.keys(subjectStats).length === 0 || typeof Object.values(subjectStats)[0] !== 'object' || !('totalChapters' in (Object.values(subjectStats)[0] || {}))) {
        subjectStats = window.lastSubjectStats || {};
    }

    const colors = ['text-blue-500', 'text-purple-500', 'text-teal-500', 'text-rose-500', 'text-orange-500', 'text-emerald-500'];
    const shadows = ['shadow-[0_0_15px_rgba(59,130,246,0.3)]', 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', 'shadow-[0_0_15px_rgba(20,184,166,0.3)]', 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', 'shadow-[0_0_15px_rgba(249,115,22,0.3)]', 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'];

    let html = ''; let trackIdx = 0;

    window.tracks.forEach(trackObj => {
        const trackId = trackObj.id;
        const trackName = trackObj.name || trackId;
        const subs = syllabusStructure[trackId] || [];
        if (subs.length === 0) return;

        let totalChap = 0; let doneChap = 0;
        subs.forEach(sub => {
            const s = subjectStats[sub.subject];
            totalChap += (s ? s.totalChapters : sub.chapters) || 0;
            doneChap += (s ? s.effectiveChapters : 0) || 0;
        });
        const perc = totalChap > 0 ? Math.round((doneChap / totalChap) * 100) : 0;
        const color = colors[trackIdx % colors.length]; const shadow = shadows[trackIdx % shadows.length];

        html += `<div class="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between group">
            <div>
                <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform">${trackName}</h3>
                <p class="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">${Math.round(doneChap)} / ${totalChap} Chapters</p>
            </div>
            <button onclick="window.openProgramCompletionsModal('${trackId}', 'EntireTrack')" class="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 ${shadow} rounded-full bg-white dark:bg-slate-800 shrink-0 hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer border-0 p-0" title="View Track Completions">
                <svg class="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
                    <path class="text-slate-100 dark:text-slate-700/50" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="${color}" stroke-width="3.5" stroke-dasharray="${perc}, 100" stroke="currentColor" fill="none" stroke-linecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span class="absolute text-[9px] md:text-[10px] font-black ${color}">${perc}%</span>
            </button>
        </div>`;
        trackIdx++;
    });
    container.innerHTML = html;
}

window.openProgramCompletionsModal = function (track, programName) {
    const subjectStats = window.lastSubjectStats || {};
    let subs = [];
    let title = '';
    let subtitle = '';

    if (track === 'Global' || !track) {
        subs = window.getAllSubjects();
        title = 'Global Completion Status';
        subtitle = 'Subject completions across the entire syllabus';
    } else if (programName === 'EntireTrack' || !programName) {
        subs = syllabusStructure[track] || [];
        title = track + ' Track Completion Status';
        subtitle = `Subject completions inside the ${track} track`;
    } else if (programName === 'Global') {
        subs = window.getAllSubjects();
        title = 'Global Completion Status';
        subtitle = 'Subject completions across the entire syllabus';
    } else {
        subs = syllabusStructure[track] ? syllabusStructure[track].filter(s => s.program === programName) : [];
        title = programName + ' Completion Status';
        subtitle = `Subject completions inside the ${programName} program`;
    }

    document.getElementById('pcm-completions-title').textContent = title;
    document.getElementById('pcm-completions-subtitle').textContent = subtitle;

    const container = document.getElementById('pcm-completions-container');
    if (!container) return;

    let html = '';
    if (subs.length === 0) {
        html = '<div class="text-center text-xs text-slate-500 font-bold py-6">No subjects found in this program.</div>';
    } else {
        html = '<div class="flex flex-col gap-4 py-2">';

        const colorPairs = [
            { bg: "bg-gradient-to-r from-indigo-400 to-indigo-600", text: "text-indigo-500" }, { bg: "bg-gradient-to-r from-emerald-400 to-emerald-600", text: "text-emerald-500" },
            { bg: "bg-gradient-to-r from-violet-400 to-violet-600", text: "text-violet-500" }, { bg: "bg-gradient-to-r from-rose-400 to-rose-600", text: "text-rose-500" },
            { bg: "bg-gradient-to-r from-amber-400 to-amber-600", text: "text-amber-500" }, { bg: "bg-gradient-to-r from-cyan-400 to-cyan-600", text: "text-cyan-500" }
        ];

        subs.forEach((sub, idx) => {
            const stats = subjectStats[sub.subject] || { totalChapters: 0, effectiveChapters: 0 };
            const perc = stats.totalChapters > 0 ? Math.min(100, (stats.effectiveChapters / stats.totalChapters) * 100) : 0;

            let cleanSubName = sub.subject;
            const pName = sub.program || programName;
            if (pName && cleanSubName.startsWith(pName + ' - ')) cleanSubName = cleanSubName.replace(pName + ' - ', '');
            else if (pName && cleanSubName.startsWith(pName + ' ')) cleanSubName = cleanSubName.replace(pName + ' ', '');

            const cp = colorPairs[idx % colorPairs.length];

            html += `
                    <div class="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm flex flex-col gap-2.5">
                        <div class="flex justify-between items-center text-xs font-black">
                            <span class="text-slate-800 dark:text-slate-200">${cleanSubName}</span>
                            <span class="text-slate-500 font-bold">${Math.round(stats.effectiveChapters)} / ${stats.totalChapters} Ch <span class="${cp.text}">(${Math.round(perc)}%)</span></span>
                        </div>
                        <div class="w-full bg-slate-100 dark:bg-slate-700/50 h-2.5 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-600/30 shadow-inner">
                            <div class="${cp.bg} h-full rounded-full transition-all duration-500 ease-out" style="width: ${perc}%"></div>
                        </div>
                    </div>
                    `;
        });
        html += '</div>';
    }

    container.innerHTML = html;
    openModal('program-completions-modal');
};

window.getChapterStatus = function (subName, chNum, trackId = null) {
    const sObj = window.getAllSubjects().find(s => s.subject === subName);

    // 1. Search in tasks
    let foundTaskObj = null;
    let taskType = trackId;

    // Find trackId from syllabusStructure if not provided
    if (!taskType && sObj) {
        for (const tid in syllabusStructure) {
            if (Array.isArray(syllabusStructure[tid]) && syllabusStructure[tid].some(s => s.subject === subName)) {
                taskType = tid;
                break;
            }
        }
    }

    if (taskType) {
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
    } else {
        // fallback search all tracks
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

    // 2. If chapter was explicitly skipped in tasks, return 'skip' regardless of pass status
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
        // Check size-based weekly targets
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

    // 5. Cross-check Target Databases (Daily, Weekly, Monthly) & Revision Progress
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
};

window.getSubjectSkippedCount = function (subName, trackId = null) {
    const sObj = window.getAllSubjects().find(s => s.subject === subName);
    if (!sObj) return 0;

    let taskType = trackId;
    if (!taskType) {
        for (const tid in syllabusStructure) {
            if (Array.isArray(syllabusStructure[tid]) && syllabusStructure[tid].some(s => s.subject === subName)) {
                taskType = tid;
                break;
            }
        }
    }

    let skipped = 0;
    for (let i = 1; i <= sObj.chapters; i++) {
        if (window.getChapterStatus(subName, i, taskType) === 'skip') {
            skipped++;
        }
    }
    return skipped;
};

/* ==========================================================================
   Chapter Interactive SVG Map & Tooltips extracted to:
   js/features/analytics/chapterMap.js (ChapterMap)
   ========================================================================== */
window.showChapterTooltip = function (event, subject, chapterNum, status) {
    if (window.ChapterMap && typeof window.ChapterMap.showChapterTooltip === 'function') {
        return window.ChapterMap.showChapterTooltip(event, subject, chapterNum, status);
    }
};

window.hideChapterTooltip = function () {
    if (window.ChapterMap && typeof window.ChapterMap.hideChapterTooltip === 'function') {
        return window.ChapterMap.hideChapterTooltip();
    }
};

window.generateGlobalChaptersSVG = function (isSpectra = false, spectraFilter = 'global', isSubjectModal = false) {
    if (window.ChapterMap && typeof window.ChapterMap.generateGlobalChaptersSVG === 'function') {
        return window.ChapterMap.generateGlobalChaptersSVG(isSpectra, spectraFilter, isSubjectModal);
    }
    return { html: '', totalChapters: 0, completedCount: 0, skippedCount: 0, incompleteCount: 0, completionPercent: '0%', allChapters: [] };
};

window.openGlobalChaptersModal = function () {
    if (window.ChapterMap && typeof window.ChapterMap.openGlobalChaptersModal === 'function') {
        return window.ChapterMap.openGlobalChaptersModal();
    }
};

window.showSubjectChapterTooltip = function (event, chapterNum, status) {
    if (window.ChapterMap && typeof window.ChapterMap.showSubjectChapterTooltip === 'function') {
        return window.ChapterMap.showSubjectChapterTooltip(event, chapterNum, status);
    }
};

window.hideSubjectChapterTooltip = function () {
    if (window.ChapterMap && typeof window.ChapterMap.hideSubjectChapterTooltip === 'function') {
        return window.ChapterMap.hideSubjectChapterTooltip();
    }
};

window.renderSubjectTrendCircle = function () {
    if (window.ChapterMap && typeof window.ChapterMap.renderSubjectTrendCircle === 'function') {
        return window.ChapterMap.renderSubjectTrendCircle();
    }
};

function renderChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;

    let displayCompleted = 0;
    let remaining = totalStaticChapters || 1;
    if (window.lastSubjectStats) {
        let eff = 0;
        let total = 0;
        const allSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects().map(s => s.subject) : [];
        allSubs.forEach(sub => {
            if (window.lastSubjectStats[sub]) {
                total += window.lastSubjectStats[sub].totalChapters || 0;
                eff += window.lastSubjectStats[sub].effectiveChapters || 0;
            }
        });
        if (total > 0) {
            displayCompleted = Math.round(eff);
            remaining = Math.max(0, total - displayCompleted);
        }
    }

    if (AppState.progressChart && typeof AppState.progressChart.update === 'function') {
        AppState.progressChart.data.datasets[0].data = [displayCompleted, remaining];
        AppState.progressChart.update();
        return;
    }

    if (AppState.progressChart && typeof AppState.progressChart.destroy === 'function') {
        AppState.progressChart.destroy();
    }

    AppState.progressChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [displayCompleted, remaining],
                backgroundColor: ['#3b82f6', 'rgba(148, 163, 184, 0.15)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '82%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

/* ==========================================================================
   Analytical Trend Charts & Heatmap extracted to:
   - js/features/analytics/spectra.js (SpectraAnalytics.renderTrendCharts)
   - js/features/analytics/heatmap.js (HeatmapAnalytics.renderHeatmap)
   ========================================================================== */
function renderTrendCharts() {
    if (window.SpectraAnalytics && typeof window.SpectraAnalytics.renderTrendCharts === 'function') {
        return window.SpectraAnalytics.renderTrendCharts();
    }
}
window.renderTrendCharts = renderTrendCharts;

function renderHeatmap() {
    if (window.HeatmapAnalytics && typeof window.HeatmapAnalytics.renderHeatmap === 'function') {
        return window.HeatmapAnalytics.renderHeatmap();
    }
}
window.renderHeatmap = renderHeatmap;

function reorderSubjectChapters(prog, subj) {
    if (subj === 'Revision') return;
    let subjectSlots = []; let chapters = [];
    const key = prog + 'Tasks';
    for (let i = 0; i < AppState.tasks.length; i++) {
        if (AppState.tasks[i].type !== 'study') continue;
        if (Array.isArray(AppState.tasks[i][key])) {
            for (let j = 0; j < AppState.tasks[i][key].length; j++) {
                if (AppState.tasks[i][key][j].subject === subj && !AppState.tasks[i][key][j].completed) {
                    subjectSlots.push({ tIdx: i, bIdx: j }); chapters.push({ ...tasks[i][key][j] });
                }
            }
        }
    }
    if (chapters.length === 0) return;
    // Target the last number in the chapter string to support prefixes correctly (e.g., "R1 Ch. 15" extracts 15)
    chapters.sort((a, b) => {
        const ma = a.chapter.match(/(\d+)(?!.*\d)/);
        const mb = b.chapter.match(/(\d+)(?!.*\d)/);
        return (ma ? parseInt(ma[0]) : 999) - (mb ? parseInt(mb[0]) : 999);
    });
    for (let k = 0; k < subjectSlots.length; k++) {
        const slot = subjectSlots[k]; const chObj = chapters[k];
        AppState.tasks[slot.tIdx][key][slot.bIdx] = { ...chObj, id: AppState.tasks[slot.tIdx][key][slot.bIdx].id };
    }
}

window.toggleDataset = function (chartKey, dsKey) {
    window.chartVisibility[chartKey][dsKey] = !window.chartVisibility[chartKey][dsKey];
    if (chartKey === 'prog') {
        if (!window.programVisibility) window.programVisibility = {};
        window.programVisibility[dsKey] = window.chartVisibility.prog[dsKey];
    }
    const chart = chartKey === 'prog' ? window.mainChartPrograms : (chartKey === 'monthly' ? window.monthlyChartActions : window.yearlyChartActions);
    if (chart) {
        const searchVal = chartKey === 'prog' ? dsKey : window.customActions.find(a => a.id === dsKey)?.title;
        const ds = chart.data.datasets.find(d => d.label === searchVal);
        if (ds) ds.hidden = !window.chartVisibility[chartKey][dsKey];
        chart.update();
    }
    window.updateLegends();
    if (chartKey === 'prog') {
        FirebaseService.saveToCloud();
        renderUI();
    }
};

window.toggleSubDataset = function (k) {
    window.chartVisibility.subjects[k] = !window.chartVisibility.subjects[k];
    if (window.subjectTrendLineChartInstance) {
        const ds = window.subjectTrendLineChartInstance.data.datasets.find(d => d.subjectKey === k);
        if (ds) { ds.hidden = !window.chartVisibility.subjects[k]; window.subjectTrendLineChartInstance.update(); }
    }
    window.updateLegends();
};

window.toggleRevSubDataset = function (k) {
    window.chartVisibility.revSubjects[k] = !window.chartVisibility.revSubjects[k];
    if (window.revisionTrendChartInstance) {
        const ds = window.revisionTrendChartInstance.data.datasets.find(d => d.subjectKey === k);
        if (ds) { ds.hidden = !window.chartVisibility.revSubjects[k]; window.revisionTrendChartInstance.update(); }
    }
    window.updateRevisionLegends();
};

window.updateRevisionLegends = function () {
    const sLeg = document.getElementById('revision-trend-legend');
    if (sLeg) {
        const sortedSubs = window.getAllSubjects().sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
        sLeg.innerHTML = sortedSubs.map(s => {
            const k = s.subject;
            const val = window.latestChartStats.revSubjects ? window.latestChartStats.revSubjects[k] : 0;
            const active = window.chartVisibility.revSubjects[k];
            const color = getSubjectColor(k);
            const label = getDynamicCleanLabel(k, 12);
            const activeStyle = active ? `border-color: ${color}40; background-color: rgba(15,23,42,0.8); box-shadow: 0 0 10px ${color}20; opacity: 1;` : `border-color: rgba(255,255,255,0.1); background-color: transparent; opacity: 0.4; filter: grayscale(100%);`;
            return `<div onclick="toggleRevSubDataset('${k}')" class="cursor-pointer flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border active:scale-95 transition-all duration-300 hover:scale-105 backdrop-blur-sm" style="${activeStyle}"><div class="w-2 h-2 rounded-full shrink-0 shadow-md" style="background-color: ${color}; box-shadow: 0 0 8px ${color}"></div><span class="text-[8px] md:text-[9px] font-black text-slate-200 uppercase whitespace-nowrap">${label}: ${val}%</span></div>`;
        }).join('');
    }
};

window.updateLegends = function () {
    const getLegend = (key, idxKey, color, label, valKey) => {
        const val = window.latestChartStats[key] ? window.latestChartStats[key][valKey] : 0;
        const active = window.chartVisibility[key][idxKey];
        return `<div onclick="toggleDataset('${key}', '${idxKey}')" class="cursor-pointer flex items-center space-x-1.5 md:space-x-2 px-2.5 md:px-3 py-1.5 md:px-3.5 md:py-2 bg-slate-900 rounded-lg md:rounded-xl border border-slate-700 hover:bg-slate-800 active:scale-95 transition-all ${active ? 'opacity-100 scale-100 shadow-md' : 'opacity-40 grayscale scale-95 line-through'}"><div class="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0" style="background-color: ${color}; box-shadow: 0 0 8px ${color}"></div><span class="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">${label}: ${val}%</span></div>`;
    };
    const pLeg = document.getElementById('prog-legend');
    if (pLeg) {
        let pIdx = 0;
        const sortedAllProgs = window.getAllPrograms();
        pLeg.innerHTML = sortedAllProgs.map(pObj => {
            const p = pObj.name || pObj;
            const html = getLegend('prog', p, window.getProgramColor(p), p, p);
            return html;
        }).join('');
    }

    const sortedActions = [...window.customActions].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    let actHtml = sortedActions.map(a => getLegend('monthly', a.id, AppState.twColors[a.color].hex, a.title, a.id)).join('');
    const aLeg = document.getElementById('act-legend'); if (aLeg) aLeg.innerHTML = actHtml;

    let yearHtml = sortedActions.map(a => getLegend('yearly', a.id, AppState.twColors[a.color].hex, a.title, a.id)).join('');
    const yLeg = document.getElementById('yearly-legend'); if (yLeg) yLeg.innerHTML = yearHtml;

    const sLeg = document.getElementById('subject-trend-legend');
    if (sLeg) {
        const sortedSubs = window.getAllSubjects().sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
        const isGlobal = window.subjectTrendGlobalMode !== false;
        const filteredSubs = isGlobal
            ? sortedSubs
            : sortedSubs.filter(s => window.selectedSubjectsTrend && window.selectedSubjectsTrend.includes(s.subject));
        sLeg.innerHTML = filteredSubs.map(s => {
            const k = s.subject; const val = window.latestChartStats.subjects ? window.latestChartStats.subjects[k] : 0; const active = window.chartVisibility.subjects[k]; const color = getSubjectColor(k);
            const label = getDynamicCleanLabel(k, 12);
            const isProgVisible = !window.programVisibility || window.programVisibility[s.program] !== false;
            const isSubjectActive = isGlobal ? (active && isProgVisible) : true;
            const activeStyle = isSubjectActive ? `border-color: ${color}40; background-color: rgba(15,23,42,0.8); box-shadow: 0 0 10px ${color}20; opacity: 1;` : `border-color: rgba(255,255,255,0.1); background-color: transparent; opacity: 0.4; filter: grayscale(100%); line-through;`;
            const onClickStr = isGlobal && isProgVisible ? `toggleSubDataset('${k}')` : '';
            const cursorClass = isGlobal && isProgVisible ? 'cursor-pointer' : '';
            return `<div onclick="${onClickStr}" class="${cursorClass} flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border active:scale-95 transition-all duration-300 hover:scale-105 backdrop-blur-sm" style="${activeStyle}"><div class="w-2 h-2 rounded-full shrink-0 shadow-md" style="background-color: ${color}; box-shadow: 0 0 8px ${color}"></div><span class="text-[8px] md:text-[9px] font-black text-slate-200 uppercase whitespace-nowrap">${label}: ${val}%</span></div>`;
        }).join('');
    }
};
/* ===== DAILY ACTIONS & HABIT TRACKER ENGINE ===== */
// Extracted to feature module: js/features/habits/dailyTracker.js
// Provides: getActionSVG, renderDailyTracker, renderDailyLogs, setDailyState,
// Action Analytics Modal (populateAnalyticsModal, setActionAnalyticsRange, heatmaps)


// Goal details modal extracted to js/features/pace/paceManager.js
window.openGoalDetailsModal = function (goalId) {
    if (window.PaceManager && typeof window.PaceManager.openGoalDetailsModal === 'function') {
        return window.PaceManager.openGoalDetailsModal(goalId);
    }
};


/* ==========================================================================
   Global History, Timeline & Modal extracted to:
   js/features/analytics/history.js (GlobalHistoryAnalytics)
   ========================================================================== */
window.openGlobalHistoryModal = function () {
    if (window.GlobalHistoryAnalytics && typeof window.GlobalHistoryAnalytics.openGlobalHistoryModal === 'function') {
        return window.GlobalHistoryAnalytics.openGlobalHistoryModal();
    }
};

window.renderGlobalHistoryContent = function (searchFilter) {
    if (window.GlobalHistoryAnalytics && typeof window.GlobalHistoryAnalytics.renderGlobalHistoryContent === 'function') {
        return window.GlobalHistoryAnalytics.renderGlobalHistoryContent(searchFilter);
    }
};

window.openEditTimelineEntryModal = function (type, encSubject, encItem, ts, track = '', chNum = '') {
    if (window.GlobalHistoryAnalytics && typeof window.GlobalHistoryAnalytics.openEditTimelineEntryModal === 'function') {
        return window.GlobalHistoryAnalytics.openEditTimelineEntryModal(type, encSubject, encItem, ts, track, chNum);
    }
};

window.saveTimelineEntryDate = function () {
    if (window.GlobalHistoryAnalytics && typeof window.GlobalHistoryAnalytics.saveTimelineEntryDate === 'function') {
        return window.GlobalHistoryAnalytics.saveTimelineEntryDate();
    }
};

window.switchGhmTab = function (tab) {
    if (window.GlobalHistoryAnalytics && typeof window.GlobalHistoryAnalytics.switchGhmTab === 'function') {
        return window.GlobalHistoryAnalytics.switchGhmTab(tab);
    }
};

window.currentSubjectForTimeGoal = null;

window.openSubjectTimeModal = function (subjectName) {
    window.currentSubjectForTimeGoal = subjectName;
    document.getElementById('stm-time-title').textContent = subjectName;

    const select = document.getElementById('stm-time-goal-select');
    select.innerHTML = '<option value="">-- None Selected --</option>';
    window.paceGoals.forEach(g => {
        select.innerHTML += `<option value="${g.id}">${g.target} (${Utils.formatDate(Utils.parseDateSafe(g.deadline))})</option>`;
    });

    document.getElementById('stm-time-start').value = '';
    document.getElementById('stm-time-date').value = '';
    select.value = '';

    if (window.subjectTimeLinks && window.subjectTimeLinks[subjectName]) {
        const link = window.subjectTimeLinks[subjectName];
        if (link.type === 'goal') select.value = link.id;
        if (link.type === 'date') {
            document.getElementById('stm-time-start').value = link.startDate || '';
            document.getElementById('stm-time-date').value = link.date;
        }
    }

    openModal('subject-time-modal');
};

window.saveSubjectTimeGoal = function () {
    if (!window.currentSubjectForTimeGoal) return;
    const sub = window.currentSubjectForTimeGoal;
    const goalId = document.getElementById('stm-time-goal-select').value;
    const startDateVal = document.getElementById('stm-time-start').value;
    const dateVal = document.getElementById('stm-time-date').value;

    if (!window.subjectTimeLinks) window.subjectTimeLinks = {};

    if (dateVal) {
        window.subjectTimeLinks[sub] = { type: 'date', startDate: startDateVal, date: dateVal };
    } else if (goalId) {
        window.subjectTimeLinks[sub] = { type: 'goal', id: goalId };
    } else {
        if (typeof window.recordItemDeletion === 'function') {
            window.recordItemDeletion(sub);
        }
        delete window.subjectTimeLinks[sub];
    }

    FirebaseService.saveToCloud();
    renderUI();
    closeModal('subject-time-modal');
    showToast("Subject Time Goal updated!", "success");
};

window.clearSubjectTimeGoal = function () {
    if (!window.currentSubjectForTimeGoal) return;
    const sub = window.currentSubjectForTimeGoal;
    if (window.subjectTimeLinks && window.subjectTimeLinks[sub]) {
        if (typeof window.recordItemDeletion === 'function') {
            window.recordItemDeletion(sub);
        }
        delete window.subjectTimeLinks[sub];
    }
    FirebaseService.saveToCloud();
    renderUI();
    closeModal('subject-time-modal');
    showToast("Time Goal reset to default timeline.", "success");
};

window.updateEsmProgramDropdown = function () {
    const track = document.getElementById('esm-track').value;
    const progSelect = document.getElementById('esm-program');
    progSelect.innerHTML = '';
    window.customPrograms[track].forEach(p => {
        const pName = p.name || p;
        progSelect.innerHTML += `<option value="${pName}">${pName}</option>`;
    });
};

window.openSubjectEditModal = function (subName) {
    let track = null;
    let sObj = null;
    for (const t of window.tracks) {
        if (syllabusStructure[t.id]) {
            sObj = syllabusStructure[t.id].find(s => s.subject === subName);
            if (sObj) {
                track = t.id;
                break;
            }
        }
    }
    if (!sObj) return;

    document.getElementById('esm-old-name').value = subName;
    document.getElementById('esm-old-track').value = track;
    document.getElementById('esm-track').value = track;
    document.getElementById('esm-name').value = subName;

    window.updateEsmProgramDropdown();
    document.getElementById('esm-program').value = sObj.program;

    openModal('edit-subject-modal');
};

window.saveSubjectEditModal = function () {
    const oldName = document.getElementById('esm-old-name').value;
    const oldTrack = document.getElementById('esm-old-track').value;
    const newTrack = document.getElementById('esm-track').value;
    const newName = document.getElementById('esm-name').value.trim();
    const newProg = document.getElementById('esm-program').value;

    if (!newName) return showToast("Subject name cannot be empty.", "error");

    const sObj = syllabusStructure[oldTrack].find(s => s.subject === oldName);
    if (!sObj) return;

    if (oldName.toLowerCase() !== newName.toLowerCase()) {
        const isGlobalDuplicate = window.getAllSubjects().some(s => s.subject.toLowerCase() === newName.toLowerCase());
        if (isGlobalDuplicate) return showToast("Subject name must be unique globally.", "error");
    }

    let changed = false;

    // Handle Track Migration Safely
    if (oldTrack !== newTrack) {
        // Update structures
        syllabusStructure[oldTrack] = syllabusStructure[oldTrack].filter(s => s.subject !== oldName);
        sObj.program = newProg;
        sObj.subject = newName;
        syllabusStructure[newTrack] = syllabusStructure[newTrack] || [];
        syllabusStructure[newTrack].push(sObj);

        // Reallocate historical/future study AppState.tasks
        for (let i = 0; i < AppState.tasks.length; i++) {
            if (AppState.tasks[i].type !== 'study') continue;

            // Unified program-track movement (always plural-to-plural)
            const oldKey = oldTrack + 'Tasks';
            const newKey = newTrack + 'Tasks';
            if (Array.isArray(AppState.tasks[i][oldKey])) {
                const bIdx = AppState.tasks[i][oldKey].findIndex(b => b.subject === oldName);
                if (bIdx > -1) {
                    const taskToMove = { ...tasks[i][oldKey][bIdx], subject: newName, id: `${newTrack}-${AppState.tasks[i].id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
                    AppState.tasks[i][oldKey].splice(bIdx, 1);
                    AppState.tasks[i][newKey] = AppState.tasks[i][newKey] || [];
                    AppState.tasks[i][newKey].push(taskToMove);
                }
            }
        }
        changed = true;
    }

    // Standard Program or Name Changes
    if (oldTrack === newTrack) {
        if (sObj.program !== newProg) {
            sObj.program = newProg;
            changed = true;
        }

        if (oldName !== newName) {
            sObj.subject = newName;
            for (let i = 0; i < AppState.tasks.length; i++) {
                if (AppState.tasks[i].type !== 'study') continue;
                const key = newTrack + 'Tasks';
                if (Array.isArray(AppState.tasks[i][key])) {
                    AppState.tasks[i][key].forEach(b => { if (b.subject === oldName) b.subject = newName; });
                }
            }
            changed = true;
        }
    }

    if (changed) {
        // Bulk rename references explicitly
        if (oldName !== newName) {
            if (AppState.subjectColors[oldName]) AppState.subjectColors[newName] = AppState.subjectColors[oldName];
            if (AppState.currentFilter === oldName) AppState.currentFilter = newName;

            if (window.chartVisibility.subjects[oldName] !== undefined) {
                window.chartVisibility.subjects[newName] = window.chartVisibility.subjects[oldName];
                delete window.chartVisibility.subjects[oldName];
            }
            if (window.chartVisibility.revSubjects[oldName] !== undefined) {
                window.chartVisibility.revSubjects[newName] = window.chartVisibility.revSubjects[oldName];
                delete window.chartVisibility.revSubjects[oldName];
            }

            window.paceGoals.forEach(g => {
                if (g.type === 'subject' && g.target === oldName) g.target = newName;
                if (g.type === 'bundle' && g.subjects) {
                    const idx = g.subjects.indexOf(oldName);
                    if (idx > -1) g.subjects[idx] = newName;
                }
            });
            if (window.passedItems.subjects.includes(oldName)) {
                window.passedItems.subjects = window.passedItems.subjects.filter(s => s !== oldName);
                window.passedItems.subjects.push(newName);
            }
            if (window.revisionData.active && window.revisionData.active.includes(oldName)) {
                window.revisionData.active = window.revisionData.active.filter(s => s !== oldName);
                window.revisionData.active.push(newName);
            }
            if (window.revisionData.progress && window.revisionData.progress[oldName]) {
                window.revisionData.progress[newName] = window.revisionData.progress[oldName];
                delete window.revisionData.progress[oldName];
            }
            if (window.subjectTimeLinks && window.subjectTimeLinks[oldName]) {
                window.subjectTimeLinks[newName] = window.subjectTimeLinks[oldName];
                delete window.subjectTimeLinks[oldName];
            }
        }

        FirebaseService.saveToCloud();
        renderUI();
        if (window.chartDebounce) clearTimeout(window.chartDebounce);
        window.chartDebounce = setTimeout(() => requestAnimationFrame(renderTrendCharts), 600);
        showToast("Subject updated successfully!", "success");
    }
    closeModal('edit-subject-modal');
};

window.requestDeleteSubjectFromModal = function () {
    const subName = document.getElementById('esm-old-name').value;
    window.openConfirmModal("Delete Subject", `Are you sure you want to completely delete "${subName}"? This action cannot be undone.`, () => {
        window.executeDeleteSubjectFromModal(subName);
    });
};

window.executeDeleteSubjectFromModal = function (targetName) {
    const track = document.getElementById('esm-old-track').value;

    if (typeof window.recordItemDeletion === 'function') {
        window.recordItemDeletion(targetName);
        (window.paceGoals || []).filter(g => g.type === 'subject' && g.target === targetName).forEach(g => window.recordItemDeletion(g.id));
    }

    if (syllabusStructure[track]) {
        syllabusStructure[track] = syllabusStructure[track].filter(s => s.subject !== targetName);
    }
    delete window.chartVisibility.subjects[targetName];
    delete window.chartVisibility.revSubjects[targetName];

    for (let i = 0; i < AppState.tasks.length; i++) {
        if (AppState.tasks[i].type !== 'study') continue;
        const key = track + 'Tasks';
        if (Array.isArray(AppState.tasks[i][key])) {
            AppState.tasks[i][key] = AppState.tasks[i][key].map(b => b.subject === targetName ? { subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: b.id } : b);
        }
    }
    if (AppState.currentFilter === targetName) AppState.currentFilter = 'All';
    window.paceGoals = window.paceGoals.filter(g => !(g.type === 'subject' && g.target === targetName));
    window.paceGoals.forEach(g => {
        if (g.type === 'bundle' && g.subjects) g.subjects = g.subjects.filter(s => s !== targetName);
    });
    window.passedItems.subjects = window.passedItems.subjects.filter(s => s !== targetName);
    if (window.revisionData.active) window.revisionData.active = window.revisionData.active.filter(s => s !== targetName);
    if (window.revisionData.progress && window.revisionData.progress[targetName]) delete window.revisionData.progress[targetName];

    if (window.subjectTimeLinks && window.subjectTimeLinks[targetName]) delete window.subjectTimeLinks[targetName];

    recalculateTotals();
    FirebaseService.saveToCloud();
    renderUI();
    closeModal('edit-subject-modal');
    showToast(`Subject "${targetName}" deleted.`, "success");
};

/* ===== DAILY ACTIONS DATABASE (DADB) STATE & FILTERS ===== */
// Extracted to feature module: js/features/habits/dadbModal.js
// Provides: dadbSortOrder, dadbActionFilter, toggleDadbSort, setDadbFilter

// Outcome Performance Trend Chart and Program Analytics logic (toggleTrendDataset, showProgramAnalytics, renderProgramTrendModal, renderSubjectWiseTrend)
// have been modularized to pages/Outcome/Outcome.js
// Outcome Performance, Results and Analytics extracted to js/features/outcome/
window.showProgramAnalytics = function (progName) {
    if (window.OutcomeAnalytics && typeof window.OutcomeAnalytics.showProgramAnalytics === 'function') {
        return window.OutcomeAnalytics.showProgramAnalytics(progName);
    }
    if (window.OutcomePage && typeof window.OutcomePage.showProgramAnalytics === 'function') {
        return window.OutcomePage.showProgramAnalytics(progName);
    }
};

window.toggleTrendDataset = function (type) {
    if (window.OutcomeAnalytics && typeof window.OutcomeAnalytics.toggleTrendDataset === 'function') {
        return window.OutcomeAnalytics.toggleTrendDataset(type);
    }
    if (window.OutcomePage && typeof window.OutcomePage.toggleTrendDataset === 'function') {
        return window.OutcomePage.toggleTrendDataset(type);
    }
};

window.getProcessedResults = function () {
    if (window.OutcomeResults && typeof window.OutcomeResults.getProcessedResults === 'function') {
        return window.OutcomeResults.getProcessedResults();
    }
    return [];
};

window.openResultModal = function (id = null, editProgramName = null) {
    if (window.OutcomeResults && typeof window.OutcomeResults.openResultModal === 'function') {
        return window.OutcomeResults.openResultModal(id, editProgramName);
    } else if (window.OutcomePage && typeof window.OutcomePage.openResultModal === 'function') {
        return window.OutcomePage.openResultModal(id, editProgramName);
    } else if (window.Router) {
        window.Router.loadPage('outcome').then(() => {
            if (window.OutcomeResults && typeof window.OutcomeResults.openResultModal === 'function') {
                window.OutcomeResults.openResultModal(id, editProgramName);
            }
        });
    }
};

window.renderResults = function () {
    if (window.OutcomeResults && typeof window.OutcomeResults.renderResults === 'function') {
        window.OutcomeResults.renderResults();
    } else if (window.OutcomePage && typeof window.OutcomePage.renderResults === 'function') {
        window.OutcomePage.renderResults();
    }
    if (typeof window.renderDashboardOutcomeCard === 'function') {
        window.renderDashboardOutcomeCard();
    }
};

window.toggleOutcomeDateSort = function () {
    if (window.OutcomeResults && typeof window.OutcomeResults.toggleOutcomeDateSort === 'function') {
        return window.OutcomeResults.toggleOutcomeDateSort();
    } else if (window.OutcomePage && typeof window.OutcomePage.toggleOutcomeDateSort === 'function') {
        return window.OutcomePage.toggleOutcomeDateSort();
    }
};

window.deleteResult = function (id) {
    if (window.OutcomeResults && typeof window.OutcomeResults.deleteResult === 'function') {
        return window.OutcomeResults.deleteResult(id);
    } else if (window.OutcomePage && typeof window.OutcomePage.deleteResult === 'function') {
        return window.OutcomePage.deleteResult(id);
    }
};

window.deleteProgramGroup = function (programName) {
    if (window.OutcomeResults && typeof window.OutcomeResults.deleteProgramGroup === 'function') {
        return window.OutcomeResults.deleteProgramGroup(programName);
    } else if (window.OutcomePage && typeof window.OutcomePage.deleteProgramGroup === 'function') {
        return window.OutcomePage.deleteProgramGroup(programName);
    }
};
/* ===== DAILY ACTIONS DATABASE (DADB) MODAL & TREND ENGINE ===== */
// Extracted to feature module: js/features/habits/dadbModal.js
// Provides: openDailyActionsDBModal, switchDadbTab, dadbTrendChartInstance lifecycle


window.openModal = function (modalId, typeKey = null) {
    if (modalId === 'analytics-modal' && typeKey) populateAnalyticsModal(typeKey);
    const backdrops = { 'celebration-setup-modal': 'csm-backdrop', 'edit-timeline-entry-modal': 'etem-backdrop', 'global-chapters-modal': 'gcm-backdrop', 'program-completions-modal': 'pcm-completions-backdrop', 'create-schedule-group-modal': 'csgm-backdrop', 'pace-candle-modal': 'pcm-backdrop', 'program-trend-modal': 'ptm-results-backdrop', 'analytics-modal': 'am-backdrop', 'yearly-actions-modal': 'ym-backdrop', 'subject-trend-modal': 'stm-backdrop', 'edit-task-modal': 'etm-backdrop', 'edit-pace-modal': 'epm-backdrop', 'edit-trends-pace-modal': 'etpm-backdrop', 'pace-trend-modal': 'ptm-backdrop', 'goal-details-modal': 'gdm-backdrop', 'revision-manage-modal': 'rmm-backdrop', 'revision-trend-modal': 'rvm-backdrop', 'global-history-modal': 'ghm-backdrop', 'subject-time-modal': 'stm-time-backdrop', 'daily-actions-db-modal': 'dadb-backdrop', 'daily-targets-db-modal': 'dtdb-backdrop', 'weekly-targets-db-modal': 'wtdb-backdrop', 'monthly-targets-db-modal': 'mtdb-backdrop', 'result-modal': 'resm-backdrop', 'edit-subject-modal': 'esm-backdrop', 'edit-track-modal': 'etm-track-backdrop', 'edit-daily-action-modal': 'edam-backdrop', 'custom-timer-modal': 'ctm-backdrop', 'account-settings-modal': 'asm-account-backdrop', 'add-schedule-modal': 'asm-schedule-backdrop', 'add-timer-session-modal': 'atsm-backdrop', 'edit-timer-session-modal': 'etsm-backdrop', 'timer-analytics-modal': 'tam-backdrop', 'add-daily-target-modal': 'adtm-backdrop', 'add-weekly-target-modal': 'wtm-backdrop' };
    const contents = { 'celebration-setup-modal': 'csm-content', 'edit-timeline-entry-modal': 'etem-content', 'global-chapters-modal': 'gcm-content', 'program-completions-modal': 'pcm-completions-content', 'create-schedule-group-modal': 'csgm-content', 'pace-candle-modal': 'pcm-content', 'program-trend-modal': 'ptm-results-content', 'analytics-modal': 'am-content', 'yearly-actions-modal': 'ym-content', 'subject-trend-modal': 'stm-content', 'edit-task-modal': 'etm-content', 'edit-pace-modal': 'epm-content', 'edit-trends-pace-modal': 'etpm-content', 'pace-trend-modal': 'ptm-content', 'goal-details-modal': 'gdm-content', 'revision-manage-modal': 'rmm-content', 'revision-trend-modal': 'rvm-content', 'global-history-modal': 'ghm-content', 'subject-time-modal': 'stm-time-content', 'daily-actions-db-modal': 'dadb-content', 'daily-targets-db-modal': 'dtdb-content', 'weekly-targets-db-modal': 'wtdb-content', 'monthly-targets-db-modal': 'mtdb-content', 'result-modal': 'resm-content', 'edit-subject-modal': 'esm-content', 'edit-track-modal': 'etm-track-content', 'edit-daily-action-modal': 'edam-content', 'custom-timer-modal': 'ctm-content', 'account-settings-modal': 'asm-account-content', 'add-schedule-modal': 'asm-schedule-content', 'add-timer-session-modal': 'atsm-content', 'edit-timer-session-modal': 'etsm-content', 'timer-analytics-modal': 'tam-content', 'add-daily-target-modal': 'adtm-content', 'add-weekly-target-modal': 'wtm-content' };
    const modal = document.getElementById(modalId);
    const backdrop = (backdrops[modalId] && document.getElementById(backdrops[modalId])) || (modal ? modal.children[0] : null);
    const content = (contents[modalId] && document.getElementById(contents[modalId])) || (modal ? modal.children[1] : null);
    if (!modal || !backdrop || !content) return;

    modal.classList.remove('hidden'); void modal.offsetWidth;
    backdrop.classList.remove('opacity-0'); backdrop.classList.add('opacity-100');
    content.classList.remove('scale-95', 'opacity-0', 'translate-y-4'); content.classList.add('scale-100', 'opacity-100', 'translate-y-0');
    document.body.classList.add('overflow-hidden');

    if (modalId === 'revision-trend-modal') {
        window.renderRevisionTrendChart();
    }
    if (modalId === 'timer-analytics-modal') {
        window.renderTimerAnalyticsChart();
    }

    // Critical Fix: Sync all charts properly by giving the CSS transform transition time (300ms) to complete
    // before recalculating canvas dimensions. This applies to Analytics, Yearly, Pace, and Subject modals perfectly.
    setTimeout(() => {
        const resizeAndUpdate = (chart) => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
                if (typeof chart.update === 'function') {
                    chart.update('none');
                }
            }
        };
        if (modalId === 'yearly-actions-modal') resizeAndUpdate(window.yearlyChartActions);
        if (modalId === 'timer-analytics-modal') resizeAndUpdate(window.timerAnalyticsChartInstance);

        if (modalId === 'revision-trend-modal') resizeAndUpdate(window.revisionTrendChartInstance);
        if (modalId === 'pace-trend-modal') resizeAndUpdate(window.paceTrendChartInstance);
        if (modalId === 'analytics-modal') resizeAndUpdate(AppState.masterLineChart);
        if (modalId === 'global-history-modal') resizeAndUpdate(window.globalHistoryChartInstance);
        if (modalId === 'daily-actions-db-modal') resizeAndUpdate(window.dadbTrendChartInstance);
        if (modalId === 'weekly-targets-db-modal') resizeAndUpdate(window.wtdbMixedChartInstance);
        if (modalId === 'monthly-targets-db-modal') resizeAndUpdate(window.mtdbMixedChartInstance);
        if (modalId === 'program-trend-modal') {
            resizeAndUpdate(window.programTrendChartInstance);
            resizeAndUpdate(window.subjectWiseChartInstance);
        }
        if (modalId === 'pace-candle-modal') resizeAndUpdate(window.paceCandleChartInstance);
        if (modalId === 'subject-trend-modal') resizeAndUpdate(window.subjectTrendLineChartInstance);
    }, 320);
};

window.closeModal = function (modalId) {
    const backdrops = { 'celebration-setup-modal': 'csm-backdrop', 'edit-timeline-entry-modal': 'etem-backdrop', 'global-chapters-modal': 'gcm-backdrop', 'program-completions-modal': 'pcm-completions-backdrop', 'create-schedule-group-modal': 'csgm-backdrop', 'pace-candle-modal': 'pcm-backdrop', 'program-trend-modal': 'ptm-results-backdrop', 'analytics-modal': 'am-backdrop', 'yearly-actions-modal': 'ym-backdrop', 'subject-trend-modal': 'stm-backdrop', 'edit-task-modal': 'etm-backdrop', 'edit-pace-modal': 'epm-backdrop', 'edit-trends-pace-modal': 'etpm-backdrop', 'pace-trend-modal': 'ptm-backdrop', 'goal-details-modal': 'gdm-backdrop', 'revision-manage-modal': 'rmm-backdrop', 'revision-trend-modal': 'rvm-backdrop', 'global-history-modal': 'ghm-backdrop', 'subject-time-modal': 'stm-time-backdrop', 'daily-actions-db-modal': 'dadb-backdrop', 'daily-targets-db-modal': 'dtdb-backdrop', 'weekly-targets-db-modal': 'wtdb-backdrop', 'monthly-targets-db-modal': 'mtdb-backdrop', 'result-modal': 'resm-backdrop', 'edit-subject-modal': 'esm-backdrop', 'edit-track-modal': 'etm-track-backdrop', 'edit-daily-action-modal': 'edam-backdrop', 'custom-timer-modal': 'ctm-backdrop', 'account-settings-modal': 'asm-account-backdrop', 'add-schedule-modal': 'asm-schedule-backdrop', 'add-timer-session-modal': 'atsm-backdrop', 'edit-timer-session-modal': 'etsm-backdrop', 'timer-analytics-modal': 'tam-backdrop', 'add-daily-target-modal': 'adtm-backdrop', 'add-weekly-target-modal': 'wtm-backdrop' };
    const contents = { 'celebration-setup-modal': 'csm-content', 'edit-timeline-entry-modal': 'etem-content', 'global-chapters-modal': 'gcm-content', 'program-completions-modal': 'pcm-completions-content', 'create-schedule-group-modal': 'csgm-content', 'pace-candle-modal': 'pcm-content', 'program-trend-modal': 'ptm-results-content', 'analytics-modal': 'am-content', 'yearly-actions-modal': 'ym-content', 'subject-trend-modal': 'stm-content', 'edit-task-modal': 'etm-content', 'edit-pace-modal': 'epm-content', 'edit-trends-pace-modal': 'etpm-content', 'pace-trend-modal': 'ptm-content', 'goal-details-modal': 'gdm-content', 'revision-manage-modal': 'rmm-content', 'revision-trend-modal': 'rvm-content', 'global-history-modal': 'ghm-content', 'subject-time-modal': 'stm-time-content', 'daily-actions-db-modal': 'dadb-content', 'daily-targets-db-modal': 'dtdb-content', 'weekly-targets-db-modal': 'wtdb-content', 'monthly-targets-db-modal': 'mtdb-content', 'result-modal': 'resm-content', 'edit-subject-modal': 'esm-content', 'edit-track-modal': 'etm-track-content', 'edit-daily-action-modal': 'edam-content', 'custom-timer-modal': 'ctm-content', 'account-settings-modal': 'asm-account-content', 'add-schedule-modal': 'asm-schedule-content', 'add-timer-session-modal': 'atsm-content', 'edit-timer-session-modal': 'etsm-content', 'timer-analytics-modal': 'tam-content', 'add-daily-target-modal': 'adtm-content', 'add-weekly-target-modal': 'wtm-content' };
    const modal = document.getElementById(modalId);
    const backdrop = (backdrops[modalId] && document.getElementById(backdrops[modalId])) || (modal ? modal.children[0] : null);
    const content = (contents[modalId] && document.getElementById(contents[modalId])) || (modal ? modal.children[1] : null);
    if (!modal || !backdrop || !content) return;

    if (modalId === 'analytics-modal' && typeof window.hideActionHeatmapTooltip === 'function') {
        window.hideActionHeatmapTooltip();
    }
    backdrop.classList.remove('opacity-100'); backdrop.classList.add('opacity-0');
    content.classList.remove('scale-100', 'opacity-100', 'translate-y-0'); content.classList.add('scale-95', 'opacity-0', 'translate-y-4');
    setTimeout(() => { modal.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); }, 300);
};

// Deletion and confirmation modal helpers extracted to ES module: js/shared/deletion.js
// Backward-compatibility references maintained by window.openConfirmModal, window.closeConfirmModal, window.executeConfirmedDelete


// Outcome Celebration & Congrats modal extracted to js/features/outcome/outcomeCelebration.js
window.showCongratsModal = function (isCustom = false, corePassed = 0, coreTotal = 0) {
    if (window.OutcomeCelebration && typeof window.OutcomeCelebration.showCongratsModal === 'function') {
        return window.OutcomeCelebration.showCongratsModal(isCustom, corePassed, coreTotal);
    }
};

window.switchCongratsPage = function (pageNum) {
    if (window.OutcomeCelebration && typeof window.OutcomeCelebration.switchCongratsPage === 'function') {
        return window.OutcomeCelebration.switchCongratsPage(pageNum);
    }
};

window.renderCongratsSummary = function () {
    if (window.OutcomeCelebration && typeof window.OutcomeCelebration.renderCongratsSummary === 'function') {
        return window.OutcomeCelebration.renderCongratsSummary();
    }
};

window.closeCongratsModal = function () {
    if (window.OutcomeCelebration && typeof window.OutcomeCelebration.closeCongratsModal === 'function') {
        return window.OutcomeCelebration.closeCongratsModal();
    }
};


// Confetti visual effects extracted to ES module: js/shared/confetti.js
// Backward-compatibility references maintained by window.fireConfetti


window.openSubjectTrendModal = function () {
    window.activeSingleSubjectTrend = null;
    window.subjectTrendChartStyle = window.subjectTrendChartStyle || 'circle';
    if (!window.lastSubjectTrendData || !window.lastTrendMonths) {
        if (typeof renderTrendCharts === 'function') renderTrendCharts();
    }
    openModal('subject-trend-modal');
    window.renderSubjectTrendCircle();
    window.setSubjectTrendChartStyle(window.subjectTrendChartStyle);
};
window.openSingleSubjectTrendModal = function (subjectName) {
    window.activeSingleSubjectTrend = subjectName;
    window.subjectTrendChartStyle = window.subjectTrendChartStyle || 'circle';
    if (!window.lastSubjectTrendData || !window.lastTrendMonths) {
        if (typeof renderTrendCharts === 'function') renderTrendCharts();
    }
    openModal('subject-trend-modal');
    window.renderSubjectTrendCircle();
    window.setSubjectTrendChartStyle(window.subjectTrendChartStyle);
};
window.setSubjectTrendChartStyle = function (style) {
    window.subjectTrendChartStyle = style;
    const circleContainer = document.getElementById('subject-trend-circle-container');
    const lineContainer = document.getElementById('subject-trend-line-container');
    const circleBtn = document.getElementById('stm-circle-btn');
    const lineBtn = document.getElementById('stm-line-btn');

    const activeClass = 'flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all bg-indigo-600 text-white shadow';
    const inactiveClass = 'flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all text-slate-400 hover:text-white hover:bg-slate-700';

    if (style === 'line') {
        safeSetText('stm-title', 'Subject Completion Trends');
        safeSetText('stm-desc', 'Detailed month-by-month progression for all subjects');
        if (circleContainer) circleContainer.classList.add('hidden');
        if (lineContainer) lineContainer.classList.remove('hidden');
        if (circleBtn) circleBtn.className = inactiveClass;
        if (lineBtn) lineBtn.className = activeClass;
        // Re-render the line chart since the container was hidden and may need a resize
        if (window.subjectTrendLineChartInstance) {
            window.subjectTrendLineChartInstance.resize();
            window.subjectTrendLineChartInstance.update();
        }
        // Sync global button state
        if (window.updateGlobalBtnStyle) window.updateGlobalBtnStyle();
    } else {
        const activeSub = window.activeSingleSubjectTrend || 'Subject';
        safeSetText('stm-title', `${activeSub}`);
        safeSetText('stm-desc', 'Chapter completion analysis');
        if (circleContainer) circleContainer.classList.remove('hidden');
        if (lineContainer) lineContainer.classList.add('hidden');
        if (circleBtn) circleBtn.className = activeClass;
        if (lineBtn) lineBtn.className = inactiveClass;
    }
};

// --- Multi-select dropdown helpers for Subject Trend modal ---

// Toggle dropdown open/close
window.stmToggleDropdown = function () {
    const panel = document.getElementById('stm-dropdown-panel');
    const arrow = document.getElementById('stm-dropdown-arrow');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
        panel.classList.remove('hidden');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    } else {
        panel.classList.add('hidden');
        if (arrow) arrow.style.transform = '';
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
    const wrapper = document.getElementById('stm-subject-dropdown-wrapper');
    const panel = document.getElementById('stm-dropdown-panel');
    if (wrapper && panel && !wrapper.contains(e.target)) {
        panel.classList.add('hidden');
        const arrow = document.getElementById('stm-dropdown-arrow');
        if (arrow) arrow.style.transform = '';
    }
});

// Click a subject row → set as active circle subject AND check it
window.stmSelectSubject = function (subjectName) {
    window.activeSingleSubjectTrend = subjectName;
    if (!window.selectedSubjectsTrend) window.selectedSubjectsTrend = [];
    if (!window.selectedSubjectsTrend.includes(subjectName)) {
        window.selectedSubjectsTrend.push(subjectName);
    }
    window.renderSubjectTrendCircle();
    // Restore view mode after re-render
    window.setSubjectTrendChartStyle(window.subjectTrendChartStyle || 'circle');
};

// Toggle checkbox only (doesn't change active circle subject)
window.stmToggleSubjectCheck = function (subjectName) {
    if (!window.selectedSubjectsTrend) window.selectedSubjectsTrend = [];
    const idx = window.selectedSubjectsTrend.indexOf(subjectName);
    if (idx !== -1) {
        // Don't allow unchecking the active circle subject
        if (subjectName === window.activeSingleSubjectTrend && window.selectedSubjectsTrend.length <= 1) return;
        window.selectedSubjectsTrend.splice(idx, 1);
    } else {
        window.selectedSubjectsTrend.push(subjectName);
    }
    window.renderSubjectTrendCircle();
    window.setSubjectTrendChartStyle(window.subjectTrendChartStyle || 'circle');
};

// Select all subjects
window.stmSelectAll = function () {
    window.selectedSubjectsTrend = window.getAllSubjects().map(s => s.subject);
    window.renderSubjectTrendCircle();
    window.setSubjectTrendChartStyle(window.subjectTrendChartStyle || 'circle');
};

// Deselect all (keep only the active circle subject)
window.stmDeselectAll = function () {
    window.selectedSubjectsTrend = window.activeSingleSubjectTrend ? [window.activeSingleSubjectTrend] : [];
    window.renderSubjectTrendCircle();
    window.setSubjectTrendChartStyle(window.subjectTrendChartStyle || 'circle');
};

// Toggle Global mode for the line chart
window.toggleSubjectTrendGlobal = function () {
    window.subjectTrendGlobalMode = !window.subjectTrendGlobalMode;
    window.updateGlobalBtnStyle();
    // Re-render the line chart with new filtering
    window.renderSubjectTrendCircle();
    window.setSubjectTrendChartStyle(window.subjectTrendChartStyle || 'circle');
};

// Update global button visual state
window.updateGlobalBtnStyle = function () {
    const btn = document.getElementById('stm-global-btn');
    if (!btn) return;
    if (window.subjectTrendGlobalMode) {
        btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all bg-indigo-600 text-white shadow border border-indigo-500/50 hover:bg-indigo-700 active:scale-95';
    } else {
        btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white active:scale-95';
    }
};

window.openRevisionTrendModal = function () { openModal('revision-trend-modal'); };
window.openYearlyActionsModal = function () {
    if (typeof renderTrendCharts === 'function') renderTrendCharts();
    if (typeof renderHeatmap === 'function') renderHeatmap();
    openModal('yearly-actions-modal');
    setTimeout(() => {
        if (window.yearlyChartActions && typeof window.yearlyChartActions.resize === 'function') {
            window.yearlyChartActions.resize();
            window.yearlyChartActions.update('none');
        }
    }, 60);
};

// Pace Charts and Visualizations extracted to js/features/pace/paceManager.js
window.openPaceCandleChartModal = function (goalId) {
    if (window.PaceManager && typeof window.PaceManager.openPaceCandleChartModal === 'function') {
        return window.PaceManager.openPaceCandleChartModal(goalId);
    }
};

window.openPaceTrendModal = function (goalId) {
    if (window.PaceManager && typeof window.PaceManager.openPaceTrendModal === 'function') {
        return window.PaceManager.openPaceTrendModal(goalId);
    }
};

window.buildPaceChartDatasets = function (paceData) {
    if (window.PaceManager && typeof window.PaceManager.buildPaceChartDatasets === 'function') {
        return window.PaceManager.buildPaceChartDatasets(paceData);
    }
    return null;
};

window.createOrUpdatePaceChart = function (canvas, chartData) {
    if (window.PaceManager && typeof window.PaceManager.createOrUpdatePaceChart === 'function') {
        return window.PaceManager.createOrUpdatePaceChart(canvas, chartData);
    }
    return null;
};

window.renderPaceTrendChart = function (goalId) {
    if (window.PaceManager && typeof window.PaceManager.renderPaceTrendChart === 'function') {
        return window.PaceManager.renderPaceTrendChart(goalId);
    }
};

window.renderSpectraPaceTrendChart = function (goalId) {
    if (window.PaceManager && typeof window.PaceManager.renderSpectraPaceTrendChart === 'function') {
        return window.PaceManager.renderSpectraPaceTrendChart(goalId);
    }
};

window.renderGlobalPaceTrendChart = function () {
    if (window.PaceManager && typeof window.PaceManager.renderGlobalPaceTrendChart === 'function') {
        return window.PaceManager.renderGlobalPaceTrendChart();
    }
};

window.getTargetedSubjectsForGoal = function (goal) {
    let targetedSubjects = new Set();
    if (!goal) return targetedSubjects;
    if (goal.type === 'global') {
        const isManual = goal.subjects || goal.secondaryPaces;
        if (isManual) {
            if (goal.subjects) goal.subjects.forEach(s => targetedSubjects.add(s));
            if (goal.secondaryPaces) {
                goal.secondaryPaces.forEach(pid => {
                    const g = window.paceGoals.find(x => x.id === pid);
                    if (g) {
                        if (g.type === 'bundle') {
                            if (g.subjects) g.subjects.forEach(s => targetedSubjects.add(s));
                            if (g.programs) {
                                window.tracks.map(t => t.id).forEach(track => {
                                    if (syllabusStructure[track]) {
                                        syllabusStructure[track].forEach(s => { if (g.programs.includes(s.program)) targetedSubjects.add(s.subject); });
                                    }
                                });
                            }
                        } else if (g.type === 'subject') {
                            targetedSubjects.add(g.target);
                        } else if (g.type === 'program') {
                            window.tracks.map(t => t.id).forEach(track => {
                                if (syllabusStructure[track]) {
                                    syllabusStructure[track].forEach(s => { if (g.target === s.program) targetedSubjects.add(s.subject); });
                                }
                            });
                        }
                    }
                });
            }
        } else {
            window.paceGoals.forEach(g => {
                if (g.id === goal.id) return;
                if (!AppState.globalStartDate || !AppState.globalEndDate) return;
                const gStart = g.startDate ? Utils.parseDateSafe(g.startDate) : new Date(AppState.globalStartDate);
                const gEnd = g.deadline ? Utils.parseDateSafe(g.deadline) : new Date(AppState.globalEndDate);
                gStart.setHours(0, 0, 0, 0); gEnd.setHours(23, 59, 59, 999);
                if (gEnd < AppState.globalStartDate || gStart > AppState.globalEndDate) return;
                if (g.type === 'bundle') {
                    if (g.subjects) g.subjects.forEach(s => targetedSubjects.add(s));
                    if (g.programs) {
                        window.tracks.map(t => t.id).forEach(track => {
                            if (syllabusStructure[track]) {
                                syllabusStructure[track].forEach(s => { if (g.programs.includes(s.program)) targetedSubjects.add(s.subject); });
                            }
                        });
                    }
                } else if (g.type === 'subject') {
                    targetedSubjects.add(g.target);
                } else if (g.type === 'program') {
                    window.tracks.map(t => t.id).forEach(track => {
                        if (syllabusStructure[track]) {
                            syllabusStructure[track].forEach(s => { if (g.target === s.program) targetedSubjects.add(s.subject); });
                        }
                    });
                }
            });
        }
    } else if (goal.type === 'bundle') {
        if (goal.subjects) {
            goal.subjects.forEach(sub => targetedSubjects.add(sub));
        } else if (goal.programs) {
            window.tracks.map(t => t.id).forEach(track => {
                if (syllabusStructure[track]) {
                    syllabusStructure[track].forEach(s => {
                        if (goal.programs.includes(s.program)) targetedSubjects.add(s.subject);
                    });
                }
            });
        }
    } else if (goal.type === 'subject') {
        targetedSubjects.add(goal.target);
    } else if (goal.type === 'program') {
        window.tracks.map(t => t.id).forEach(track => {
            if (syllabusStructure[track]) {
                syllabusStructure[track].forEach(s => { if (s.program === goal.target) targetedSubjects.add(s.subject); });
            }
        });
    }
    return targetedSubjects;
};

window.renderRevisionTrendChart = function () {
    const ctxSub = document.getElementById('revisionTrendChart');
    if (!ctxSub) return;

    let chartStart = new Date(AppState.PLAN_START_DATE.getTime());
    let chartEnd = new Date(AppState.PLAN_END_DATE.getTime());
    const todayObj = new Date();

    if (window.trendTimeFilter === '1Y') {
        chartEnd = new Date(chartStart);
        chartEnd.setFullYear(chartEnd.getFullYear() + 1);
        chartEnd.setMonth(chartEnd.getMonth() - 1);
    } else if (window.trendTimeFilter === '2Y') {
        chartEnd = new Date(chartStart);
        chartEnd.setFullYear(chartEnd.getFullYear() + 2);
        chartEnd.setMonth(chartEnd.getMonth() - 1);
    } else if (window.trendTimeFilter === '3Y') {
        chartEnd = new Date(chartStart);
        chartEnd.setFullYear(chartEnd.getFullYear() + 3);
        chartEnd.setMonth(chartEnd.getMonth() - 1);
    } else {
        chartStart = new Date(AppState.PLAN_START_DATE.getTime());
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
    window.getAllSubjects().forEach(s => {
        revSubData[s.subject] = Array(totalMonths).fill(0);
        if (window.chartVisibility.revSubjects[s.subject] === undefined) window.chartVisibility.revSubjects[s.subject] = true;
    });

    let latestActiveMonth = -1;
    const todayMidx = (todayObj.getFullYear() - sYear) * 12 + (todayObj.getMonth() - sMonth);

    Object.keys(window.revisionData.progress || {}).forEach(sub => {
        if (!revSubData[sub]) return;
        Object.keys(window.revisionData.progress[sub]).forEach(chNum => {
            const val = window.revisionData.progress[sub][chNum];
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
        const sObj = window.getAllSubjects().find(s => s.subject === k);
        if (sObj) sTotal = sObj.chapters;
        sTotal = Math.max(1, sTotal);

        for (let i = 1; i <= cutoff; i++) revSubData[k][i] += revSubData[k][i - 1];
        for (let i = 0; i <= cutoff; i++) revSubData[k][i] = Math.round((revSubData[k][i] / sTotal) * 100);

        window.latestChartStats.revSubjects[k] = revSubData[k][cutoff] || 0;
        for (let i = cutoff + 1; i < totalMonths; i++) revSubData[k][i] = null;
    });

    Chart.defaults.color = '#94a3b8'; Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui';
    const chartOptions = { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#fff', bodyColor: '#cbd5e1', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12, cornerRadius: 8, usePointStyle: true, boxPadding: 6, callbacks: { label: c => ' ' + c.dataset.label + ': ' + c.parsed.y + '%' } } }, scales: { y: { min: 0, max: 100, ticks: { font: { size: 9, weight: 'bold' }, callback: v => v + '%' }, grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false } }, x: { ticks: { font: { size: 9, weight: 'bold' } }, grid: { display: false, drawBorder: false } } } };

    const subDatasets = Object.keys(revSubData).map(k => ({
        label: getDynamicChartLabel(k), data: revSubData[k], borderColor: getSubjectColor(k), backgroundColor: 'transparent', tension: 0.4, borderWidth: 3, pointBackgroundColor: '#0f172a', pointBorderColor: getSubjectColor(k), pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6, pointHoverBackgroundColor: getSubjectColor(k), pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, hidden: !window.chartVisibility.revSubjects[k], subjectKey: k
    }));

    if (window.revisionTrendChartInstance) {
        window.revisionTrendChartInstance.data.labels = months;
        window.revisionTrendChartInstance.data.datasets = subDatasets;
        window.revisionTrendChartInstance.update('none');
    } else {
        window.revisionTrendChartInstance = new Chart(ctxSub.getContext('2d'), { type: 'line', data: { labels: months, datasets: subDatasets }, options: { ...chartOptions, interaction: { mode: 'nearest', axis: 'x', intersect: false } } });
    }

    window.updateRevisionLegends();
};

window.openEditPaceModal = function (goalId) {
    const goal = window.paceGoals.find(g => g.id === goalId);
    if (!goal) return;
    window.editingPaceId = goalId;

    const nameContainer = document.getElementById('epm-name-container');
    const checklistSection = document.getElementById('epm-checklist-section');
    const nameInput = document.getElementById('edit-pace-name');
    const subjectsContainer = document.getElementById('edit-pace-subjects-container');

    if (goal.type === 'global') {
        nameContainer.classList.add('hidden');
        checklistSection.classList.remove('hidden');
        nameInput.value = goal.target;

        let html = '';
        html += `<div class="mb-4"><h5 class="text-[10px] font-black uppercase text-slate-400 mb-2">Subjects</h5>`;
        window.tracks.forEach(track => {
            if (window.customPrograms[track.id]) {
                window.customPrograms[track.id].forEach(prog => {
                    const progName = prog.name || prog;
                    const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                    if (subs.length > 0) {
                        html += `<div class="mb-2"><div class="text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-1">${progName}</div><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
                        subs.forEach(s => {
                            const isChecked = (goal.subjects && goal.subjects.includes(s.subject)) ? 'checked' : '';
                            let displaySub = s.subject.replace(progName + ' - ', '').replace(progName + ' ', '');
                            const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(s.subject)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                            const isAlreadyInGoal = Boolean(goal.subjects && goal.subjects.includes(s.subject));

                            if (isPassed && !isAlreadyInGoal) {
                                html += `
                                        <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${s.subject} (Passed - cannot be added to pace)">
                                            <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                <input type="checkbox" value="${s.subject}" disabled class="edit-pace-subject-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                                <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through" title="${s.subject}">${displaySub}</del>
                                            </div>
                                            <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                        </label>`;
                            } else if (isPassed && isAlreadyInGoal) {
                                html += `
                                        <label class="flex items-center justify-between space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 active:scale-95 transition-all shadow-sm pace-passed-included-item" title="${s.subject} (Passed - currently included in this pace)">
                                            <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                <input type="checkbox" value="${s.subject}" class="edit-pace-subject-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all" checked>
                                                <del class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate line-through" title="${s.subject}">${displaySub}</del>
                                            </div>
                                            <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                        </label>`;
                            } else {
                                html += `
                                        <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-sm">
                                            <input type="checkbox" value="${s.subject}" class="edit-pace-subject-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all" ${isChecked}>
                                            <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${s.subject}">${displaySub}</span>
                                        </label>`;
                            }
                        });
                        html += `</div></div>`;
                    }
                });
            }
        });
        html += `</div>`;

        html += `<div><h5 class="text-[10px] font-black uppercase text-slate-400 mb-2">Secondary Paces</h5>`;
        const otherGoals = window.paceGoals.filter(g => g.type !== 'global');
        if (otherGoals.length > 0) {
            html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
            otherGoals.forEach(g => {
                const isChecked = (goal.secondaryPaces && goal.secondaryPaces.includes(g.id)) ? 'checked' : '';
                html += `
                        <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-sm">
                            <input type="checkbox" value="${g.id}" class="edit-pace-sec-cb form-checkbox h-4 w-4 text-indigo-500 rounded border-slate-300 focus:ring-indigo-500 accent-indigo-500 transition-all" ${isChecked}>
                            <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${g.target}">${g.target}</span>
                        </label>`;
            });
            html += `</div>`;
        } else {
            html += `<span class="text-[10px] text-slate-500">No other pace goals available.</span>`;
        }
        html += `</div>`;

        subjectsContainer.innerHTML = html;
    } else {
        nameContainer.classList.remove('hidden');
        checklistSection.classList.remove('hidden');
        nameInput.value = goal.target;

        let html = '';
        const isProgramTarget = goal.type === 'program' || (goal.type === 'bundle' && goal.programs);

        if (isProgramTarget) {
            html += `<div class="grid grid-cols-2 gap-2 w-full">`;
            const selectedProgs = goal.programs || (goal.type === 'program' ? [goal.target] : []);
            window.tracks.forEach(track => {
                if (window.customPrograms[track.id]) {
                    window.customPrograms[track.id].forEach(p => {
                        const pName = p.name || p;
                        const isChecked = selectedProgs.some(sp => (sp.name || sp) === pName) ? 'checked' : '';
                        const isProgPassed = Boolean(window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(pName));
                        const isAlreadyInGoal = Boolean(selectedProgs.some(sp => (sp.name || sp) === pName));

                        if (isProgPassed && !isAlreadyInGoal) {
                            html += `
                                    <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${pName} (Passed - cannot be added to pace)">
                                        <div class="flex items-center space-x-2 min-w-0 flex-1">
                                            <input type="checkbox" value="${pName}" disabled class="edit-pace-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                            <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through">${pName}</del>
                                        </div>
                                        <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                    </label>`;
                        } else if (isProgPassed && isAlreadyInGoal) {
                            html += `
                                    <label class="flex items-center justify-between space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 active:scale-95 transition-all shadow-sm pace-passed-included-item" title="${pName} (Passed - currently included in this pace)">
                                        <div class="flex items-center space-x-2 min-w-0 flex-1">
                                            <input type="checkbox" value="${pName}" class="edit-pace-cb form-checkbox h-4 w-4 text-violet-500 rounded border-slate-300 focus:ring-violet-500 accent-violet-500 transition-all" checked>
                                            <del class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate line-through">${pName}</del>
                                        </div>
                                        <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                    </label>`;
                        } else {
                            html += `
                                    <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-sm">
                                        <input type="checkbox" value="${pName}" class="edit-pace-cb form-checkbox h-4 w-4 text-violet-500 rounded border-slate-300 focus:ring-violet-500 accent-violet-500 transition-all" ${isChecked}>
                                        <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate">${pName}</span>
                                    </label>`;
                        }
                    });
                }
            });
            html += `</div>`;
        } else {
            const selectedSubs = goal.subjects || (goal.type === 'subject' ? [goal.target] : []);
            window.tracks.forEach(track => {
                if (window.customPrograms[track.id]) {
                    window.customPrograms[track.id].forEach(prog => {
                        const progName = prog.name || prog;
                        const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                        if (subs.length > 0) {
                            html += `<div class="mb-2"><div class="text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-1">${progName}</div><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
                            subs.forEach(s => {
                                const isChecked = selectedSubs.includes(s.subject) ? 'checked' : '';
                                let displaySub = s.subject.replace(progName + ' - ', '').replace(progName + ' ', '');
                                const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(s.subject)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                                const isAlreadyInGoal = Boolean(selectedSubs.includes(s.subject));

                                if (isPassed && !isAlreadyInGoal) {
                                    html += `
                                            <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${s.subject} (Passed - cannot be added to pace)">
                                                <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                    <input type="checkbox" value="${s.subject}" disabled class="edit-pace-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                                    <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through" title="${s.subject}">${displaySub}</del>
                                                </div>
                                                <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                            </label>`;
                                } else if (isPassed && isAlreadyInGoal) {
                                    html += `
                                            <label class="flex items-center justify-between space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 active:scale-95 transition-all shadow-sm pace-passed-included-item" title="${s.subject} (Passed - currently included in this pace)">
                                                <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                    <input type="checkbox" value="${s.subject}" class="edit-pace-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all" checked>
                                                    <del class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate line-through" title="${s.subject}">${displaySub}</del>
                                                </div>
                                                <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                            </label>`;
                                } else {
                                    html += `
                                            <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-sm">
                                                <input type="checkbox" value="${s.subject}" class="edit-pace-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all" ${isChecked}>
                                                <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${s.subject}">${displaySub}</span>
                                            </label>`;
                                }
                            });
                            html += `</div></div>`;
                        }
                    });
                }
            });
        }
        subjectsContainer.innerHTML = html || '<span class="text-[10px] text-slate-500">No items available.</span>';
    }

    document.getElementById('edit-pace-start').value = goal.startDate || '';
    document.getElementById('edit-pace-date').value = goal.deadline || '';
    openModal('edit-pace-modal');
};

window.savePaceEdit = function () {
    if (!window.editingPaceId) return;
    const goal = window.paceGoals.find(g => g.id === window.editingPaceId);
    if (!goal) return;

    const startStr = document.getElementById('edit-pace-start').value;
    const deadStr = document.getElementById('edit-pace-date').value;
    if (!startStr || !deadStr) return showToast("Both dates are required", "error");
    if (new Date(deadStr) <= new Date(startStr)) return showToast("Deadline must be after start date", "error");

    if (goal.type === 'global') {
        const subjCheckboxes = document.querySelectorAll('.edit-pace-subject-cb:checked');
        const secCheckboxes = document.querySelectorAll('.edit-pace-sec-cb:checked');

        const selectedSubjects = Array.from(subjCheckboxes).map(cb => cb.value).filter(sub => {
            const wasAlreadyInGoal = goal.subjects && goal.subjects.includes(sub);
            if (wasAlreadyInGoal) return true;
            const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
            const progName = sObj ? sObj.program : '';
            const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(sub)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
            return !isPassed;
        });
        const selectedSec = Array.from(secCheckboxes).map(cb => cb.value);

        goal.subjects = selectedSubjects;
        goal.secondaryPaces = selectedSec;
    } else if (goal.type !== 'global') {
        const name = document.getElementById('edit-pace-name').value.trim();
        if (!name) return showToast("Goal name is required.", "error");

        const checkboxes = document.querySelectorAll('.edit-pace-cb:checked');
        const selectedItems = Array.from(checkboxes).map(cb => cb.value);

        if (selectedItems.length === 0) return showToast("Please select at least one item.", "error");

        goal.target = name;
        const previousSubjects = goal.subjects || (goal.type === 'subject' ? [goal.target] : []);
        const previousPrograms = goal.programs || (goal.type === 'program' ? [goal.target] : []);

        goal.type = 'bundle';
        delete goal.subjects;
        delete goal.programs;

        const firstItem = selectedItems[0];
        let isProg = false;
        window.tracks.forEach(track => {
            if (window.customPrograms[track.id] && window.customPrograms[track.id].some(p => (p.name || p) === firstItem)) {
                isProg = true;
            }
        });

        if (isProg) {
            goal.programs = selectedItems.filter(pName => {
                const wasAlreadyInGoal = previousPrograms.some(sp => (sp.name || sp) === pName);
                if (wasAlreadyInGoal) return true;
                const isPassed = Boolean(window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(pName));
                return !isPassed;
            });
        } else {
            goal.subjects = selectedItems.filter(sub => {
                const wasAlreadyInGoal = previousSubjects.includes(sub);
                if (wasAlreadyInGoal) return true;
                const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
                const progName = sObj ? sObj.program : '';
                const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(sub)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                return !isPassed;
            });
        }
    }

    goal.startDate = startStr;
    goal.deadline = deadStr;
    FirebaseService.saveToCloud(); renderUI(); closeModal('edit-pace-modal'); showToast("Pace Goal timeline updated!", "success");
};

// Daily Action Day Toggle function extracted to js/features/habits/dailyTracker.js


window.openEditModal = function (taskId, type, subTaskId = null) {
    let taskIndex = typeof taskId === 'number' ? AppState.tasks.findIndex(t => t.id === taskId) : -1;
    const key = type + 'Tasks';

    // If it was an unscheduled task (e.g. unsched-...), slot it first or locate it
    if (taskIndex === -1 && subTaskId && typeof subTaskId === 'string' && subTaskId.startsWith('unsched-')) {
        const parts = subTaskId.split('-');
        const chNum = parts[parts.length - 1];
        const subId = parts.slice(2, parts.length - 1).join('-');
        const sObj = window.getAllSubjects().find(s => s.subject.replace(/[^a-zA-Z0-9]/g, '-') === subId);
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
    const subjSelect = document.getElementById('edit-task-subject');
    subjSelect.innerHTML = '<option value="Revision">Revision (Empty Slot)</option>';

    if (window.customPrograms[prog]) {
        window.customPrograms[prog].forEach(p => {
            const pName = p.name || p;
            const subs = (syllabusStructure[prog] || []).filter(s => s.program === pName);
            if (subs.length > 0) {
                let groupHtml = `<optgroup label="${pName}">`;
                subs.forEach(s => { groupHtml += `<option value="${s.subject}" ${s.subject === taskObj.subject ? 'selected' : ''}>${s.subject}</option>`; });
                groupHtml += `</optgroup>`; subjSelect.innerHTML += groupHtml;
            }
        });
    }

    let chNum = taskObj.chapter.replace('Ch. ', ''); if (taskObj.subject === 'Revision') chNum = '';
    document.getElementById('edit-task-num').value = chNum;
    document.getElementById('edit-task-title').value = taskObj.title === 'Practice' ? '' : taskObj.title;

    const skipBtn = document.getElementById('etm-skip-btn');
    const skipText = document.getElementById('etm-skip-btn-text');
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

    openModal('edit-task-modal');
};

window.toggleSkipTask = function () {
    if (!window.editingTask) return;
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
                                const mtTid = mt.id || window.generateItemId(mt, `monthlyTargetsDatabase_${mKey}`);
                                if (mtTid) window.recordItemDeletion(mtTid);
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
                                const wtTid = wt.id || window.generateItemId(wt, `weeklyTargetsDatabase_${wKey}`);
                                if (wtTid) window.recordItemDeletion(wtTid);
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
                                const dtTid = dt.id || window.generateItemId(dt, `dailyTargetsDatabase_${dKey}`);
                                if (dtTid) window.recordItemDeletion(dtTid);
                            }
                        });
                    });
                }
            }
        }
    }
    recalculateTotals();
    FirebaseService.saveToCloud();
    renderUI();
    closeModal('edit-task-modal');
    showToast("Chapter status updated!", "success");
};

window.saveTaskEdit = function () {
    if (!window.editingTask) return;
    const { taskId, type, subTaskId, oldSubject } = window.editingTask;
    const taskIndex = AppState.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const prog = type;
    const newSubject = document.getElementById('edit-task-subject').value;
    let newNum = document.getElementById('edit-task-num').value;
    let newTitle = document.getElementById('edit-task-title').value;

    if (newSubject === 'Revision') { window.requestDeleteTask(); return; }

    newNum = newNum ? `Ch. ${newNum}` : 'Ch. ?';
    newTitle = newTitle || 'Topic';

    const key = type + 'Tasks';
    if (oldSubject === newSubject) {
        const bIdx = (AppState.tasks[taskIndex][key] || []).findIndex(b => b.id === subTaskId);
        if (bIdx > -1) AppState.tasks[taskIndex][key][bIdx] = { ...tasks[taskIndex][key][bIdx], chapter: newNum, title: newTitle };
        reorderSubjectChapters(prog, newSubject);
    } else {
        if (oldSubject !== 'Revision') { const oldS = (syllabusStructure[prog] || []).find(s => s.subject === oldSubject); if (oldS && oldS.chapters > 0) oldS.chapters--; }
        const bIdx = (AppState.tasks[taskIndex][key] || []).findIndex(b => b.id === subTaskId);
        if (bIdx > -1) AppState.tasks[taskIndex][key][bIdx] = { subject: newSubject, chapter: newNum, title: newTitle, completed: false, id: subTaskId };
        const newS = (syllabusStructure[prog] || []).find(s => s.subject === newSubject); if (newS) newS.chapters++;
        reorderSubjectChapters(prog, oldSubject); reorderSubjectChapters(prog, newSubject);
    }
    recalculateTotals(); FirebaseService.saveToCloud(); renderUI(); closeModal('edit-task-modal'); showToast("Task updated successfully!", "success");
};

window.requestDeleteTask = function () {
    window.openConfirmModal("Clear Task Slot", "Are you sure you want to clear this task? The subsequent schedule will automatically shift up.", window.deleteTask);
};

window.deleteTask = function () {
    if (!window.editingTask) return;
    const { taskId, type, subTaskId, oldSubject } = window.editingTask;
    const taskIndex = AppState.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const prog = type;
    const key = type + 'Tasks';

    if (oldSubject !== 'Revision') { const oldS = (syllabusStructure[prog] || []).find(s => s.subject === oldSubject); if (oldS && oldS.chapters > 0) oldS.chapters--; }
    if (Array.isArray(AppState.tasks[taskIndex][key])) {
        AppState.tasks[taskIndex][key] = AppState.tasks[taskIndex][key].map(b => b.id === subTaskId ? { subject: "Revision", chapter: "Rev", title: "Practice", completed: false, id: b.id } : b);
    }

    if (oldSubject !== 'Revision') {
        let targetSlots = []; let gatheredTasks = [];
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
        // local Utils.extractNum consolidated globally
        gatheredTasks.sort((a, b) => { if (a.subject === 'Revision') return 1; if (b.subject === 'Revision') return -1; return Utils.extractNum(a.chapter) - Utils.extractNum(b.chapter); });
        for (let k = 0; k < targetSlots.length; k++) {
            const slot = targetSlots[k]; const chObj = gatheredTasks[k];
            AppState.tasks[slot.tIdx][key][slot.bIdx] = { ...chObj, id: AppState.tasks[slot.tIdx][key][slot.bIdx].id };
        }
    }
    recalculateTotals(); FirebaseService.saveToCloud(); renderUI(); closeModal('edit-task-modal'); showToast("Task deleted and schedule shifted up.", "success");
};

// Configuration & Curriculum Taxonomy System (switchSysTab, updateChProgDropdown, updateChSubjDropdown, updateSubProgDropdown,
// appendNewProgram, appendNewSubject, appendNewChapter, updateManageDropdown, updateManageSubjects, executeManageEdit,
// requestManageDelete, executeManageDelete, resetToCleanSlate)
// extracted to js/features/config/masterConfig.js


// Outcome program toggles, pass/freeze configuration, and milestone celebration criteria
// have been modularized to pages/Outcome/Outcome.js
window.renderOutcomeProgramToggles = function () {
    if (window.OutcomeResults && typeof window.OutcomeResults.renderOutcomeProgramToggles === 'function') {
        window.OutcomeResults.renderOutcomeProgramToggles();
    } else if (window.OutcomePage && typeof window.OutcomePage.renderOutcomeProgramToggles === 'function') {
        window.OutcomePage.renderOutcomeProgramToggles();
    }
};

window.renderPassConfig = function (forceRebuild = false) {
    if (window.OutcomePassConfig && typeof window.OutcomePassConfig.renderPassConfig === 'function') {
        window.OutcomePassConfig.renderPassConfig(forceRebuild);
    } else if (window.OutcomePage && typeof window.OutcomePage.renderPassConfig === 'function') {
        window.OutcomePage.renderPassConfig(forceRebuild);
    }
};

window.renderCelebrationConfig = function () {
    if (window.OutcomeCelebration && typeof window.OutcomeCelebration.renderCelebrationConfig === 'function') {
        window.OutcomeCelebration.renderCelebrationConfig();
    } else if (window.OutcomePage && typeof window.OutcomePage.renderCelebrationConfig === 'function') {
        window.OutcomePage.renderCelebrationConfig();
    }
};

// --- Monthly Targets System Logic ---
window.monthlyTargetsDatabase = window.monthlyTargetsDatabase || {};
window.currentMonthlyTargetsDate = new Date();

window.isSubjectCompleted = function (track, subject) {
    if (!AppState.tasks || !Array.isArray(AppState.tasks)) return false;
    const passedItems = window.passedItems || (AppState && AppState.passedItems) || { programs: [], subjects: [] };
    if (Array.isArray(passedItems.subjects) && passedItems.subjects.includes(subject)) return true;

    const key = track + 'Tasks';
    let totalChapters = 0;
    let completedChapters = 0;

    AppState.tasks.forEach(t => {
        if (t.type === 'study' && Array.isArray(t[key])) {
            t[key].forEach(b => {
                if (b.subject === subject && !b.skipped) {
                    totalChapters++;
                    if (b.completed) completedChapters++;
                }
            });
        }
    });

    return totalChapters > 0 && completedChapters === totalChapters;
};

window.getMonthlyTargetRange = function (date = new Date()) {
    const d = new Date(date);
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const daysInMonth = endOfMonth.getDate();
    return { start: startOfMonth, end: endOfMonth, daysInMonth: daysInMonth, currentDay: d.getDate() };
};

window.formatMonthRangeKey = function (start, end) {
    const opt = { day: '2-digit', month: 'short', year: 'numeric' };
    const startStr = start.toLocaleDateString('en-GB', opt);
    const endStr = end.toLocaleDateString('en-GB', opt);
    return `${startStr} - ${endStr}`;
};

window.getCompletedSizeForMonthlyTarget = function (target, monthKey) {
    let completedSize = 0;
    if (!window.dailyTargetsDatabase) return 0;

    if (!monthKey) {
        const currentRange = window.getMonthlyTargetRange();
        monthKey = window.formatMonthRangeKey(currentRange.start, currentRange.end);
    }

    const matchFn = window.isChapterMatch || (window.Utils && window.Utils.isChapterMatch);
    const isSubjectTarget = (target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters');

    Object.keys(window.dailyTargetsDatabase).forEach(dateKey => {
        const d = window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(dateKey) : Utils.parseDateSafe(dateKey);
        if (!d || isNaN(d.getTime())) return;
        const range = window.getMonthlyTargetRange(d);
        const dateMonthKey = window.formatMonthRangeKey(range.start, range.end);
        if (dateMonthKey !== monthKey) return;

        const dailyTargets = window.dailyTargetsDatabase[dateKey] || [];
        dailyTargets.forEach(dt => {
            if (!dt.isDeleted && dt.completed && dt.track === target.track && dt.subject === target.subject) {
                if (isSubjectTarget) {
                    if (dt.totalChapterSize) {
                        completedSize += parseFloat(dt.totalChapterSize);
                    }
                } else {
                    const isMatching = matchFn ? matchFn(dt.chapter, target.chapter) : (dt.chapter === target.chapter);
                    if (isMatching && dt.totalChapterSize) {
                        completedSize += parseFloat(dt.totalChapterSize);
                    }
                }
            }
        });
    });
    return completedSize;
};

window.getMonthlyTargetProgress = function (target, monthKey) {
    const isSubjectTarget = (target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters');
    const total = target.totalChapterSize ? parseFloat(target.totalChapterSize) : 0;

    if (total > 0) {
        const completed = window.getCompletedSizeForMonthlyTarget(target, monthKey);
        const percent = Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
        return { completed: completed, total: total, percent: percent, type: 'size', label: `(${completed}/${total} p)` };
    }

    if (isSubjectTarget) {
        const allChs = window.getChaptersForSubject ? window.getChaptersForSubject(target.track, target.subject) : [];
        let doneCount = 0;
        allChs.forEach(ch => {
            const found = window.findTaskChapter(target.track, target.subject, ch);
            if (found && found.subTask && found.subTask.completed) doneCount++;
        });
        const totalChs = allChs.length;
        const isDone = target.completed || (window.isSubjectCompleted ? window.isSubjectCompleted(target.track, target.subject) : false);
        const percent = totalChs > 0 ? Math.min(100, Math.round((doneCount / totalChs) * 100)) : (isDone ? 100 : 0);
        return { completed: doneCount, total: totalChs, percent: percent, type: 'chapters', label: totalChs > 0 ? `(${doneCount}/${totalChs} Ch)` : '' };
    }

    return { completed: target.completed ? 1 : 0, total: 1, percent: target.completed ? 100 : 0, type: 'single', label: '' };
};

window.getMonthlyTargetOccurrenceCount = function (track, subject, chapter, targetType = null) {
    let count = 0;
    if (!window.monthlyTargetsDatabase) return 0;
    const matchFn = window.isChapterMatch || (window.Utils && window.Utils.isChapterMatch);
    const isSubjectTarget = targetType === 'subject' || chapter === 'Whole Subject' || chapter === 'All Chapters';
    const cleanSubject = String(subject || '').trim().toLowerCase();

    Object.keys(window.monthlyTargetsDatabase).forEach(monthKey => {
        const list = window.monthlyTargetsDatabase[monthKey] || [];
        list.forEach(t => {
            if (!t) return;
            const tSub = String(t.subject || '').trim().toLowerCase();
            const subMatch = (tSub === cleanSubject) || (cleanSubject.includes(tSub) && tSub.length > 2) || (tSub.includes(cleanSubject) && cleanSubject.length > 2);
            if (!subMatch) return;
            if (track && t.track && t.track !== track) return;

            const tIsSubject = t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters';
            if (isSubjectTarget) {
                if (tIsSubject) count++;
            } else {
                if (!tIsSubject && (matchFn ? matchFn(t.chapter, chapter) : (String(t.chapter).trim().toLowerCase() === String(chapter).trim().toLowerCase()))) {
                    count++;
                }
            }
        });
    });
    return count;
};

/**
 * Returns 1-based chronological occurrence index of a specific monthly target instance.
 * Instance 1 = 1st target (0 stars)
 * Instance 2 = 2nd target (1 star)
 * Instance 3 = 3rd target (2 stars)
 */
window.getMonthlyTargetInstanceOccurrence = function (targetMonthKey, target, targetIdx = -1) {
    if (!window.monthlyTargetsDatabase || !target) return 1;
    const matchFn = window.isChapterMatch || (window.Utils && window.Utils.isChapterMatch);
    const isSubjectTarget = target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters';
    const cleanSubject = String(target.subject || '').trim().toLowerCase();

    // Sort all months chronologically
    const allMonths = Object.keys(window.monthlyTargetsDatabase).sort((a, b) => {
        const da = (window.Utils && Utils.parseStart) ? Utils.parseStart(a) : new Date(a);
        const db = (window.Utils && Utils.parseStart) ? Utils.parseStart(b) : new Date(b);
        return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
    });

    let currentOrder = 0;
    for (const mKey of allMonths) {
        const list = window.monthlyTargetsDatabase[mKey] || [];
        for (let i = 0; i < list.length; i++) {
            const t = list[i];
            if (!t) continue;
            const tSub = String(t.subject || '').trim().toLowerCase();
            const subMatch = (tSub === cleanSubject) || (cleanSubject.includes(tSub) && tSub.length > 2) || (tSub.includes(cleanSubject) && cleanSubject.length > 2);
            if (!subMatch) continue;
            if (target.track && t.track && t.track !== target.track) continue;

            const tIsSubject = t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters';
            const chMatch = isSubjectTarget
                ? tIsSubject
                : (!tIsSubject && (matchFn ? matchFn(t.chapter, target.chapter) : (String(t.chapter).trim().toLowerCase() === String(target.chapter).trim().toLowerCase())));

            if (chMatch) {
                currentOrder++;
                if (mKey === targetMonthKey && (t.id && target.id ? t.id === target.id : (targetIdx >= 0 && i === targetIdx))) {
                    return currentOrder;
                }
            }
        }
    }
    return currentOrder > 0 ? currentOrder : 1;
};

window.isMatchMonthlyTargetWithChild = function (mt, child) {
    if (!mt || !child) return false;
    if (child.monthlyTargetId && mt.id && child.monthlyTargetId === mt.id) return true;
    if (child.monthlyTargetId && mt.id && child.monthlyTargetId !== mt.id) return false;
    if (child.track && mt.track && child.track !== mt.track) return false;

    const cSub = String(child.subject || '').trim().toLowerCase();
    const mSub = String(mt.subject || '').trim().toLowerCase();
    const cProg = String(child.program || '').trim().toLowerCase();
    const mProg = String(mt.program || '').trim().toLowerCase();
    const cCh = String(child.chapter || '').trim().toLowerCase();
    const mCh = String(mt.chapter || '').trim().toLowerCase();

    // Program check if both are explicitly provided
    if (cProg && mProg && cProg !== mProg) return false;

    // Subject check: Subject MUST match
    const subMatch = (cSub && mSub && cSub === mSub) ||
        (cSub && mSub && (cSub.includes(mSub) || mSub.includes(cSub)) && (cSub.length > 2 && mSub.length > 2)) ||
        (!cSub && cProg === mSub) || (!mSub && mProg === cSub) ||
        (cCh.includes(mSub) && mSub.length > 2) || (mCh.includes(cSub) && cSub.length > 2);

    if (!subMatch) return false;

    const cIsSubject = child.targetType === 'subject' || child.chapter === 'Whole Subject' || child.chapter === 'All Chapters';
    const mIsSubject = mt.targetType === 'subject' || mt.chapter === 'Whole Subject' || mt.chapter === 'All Chapters';

    if (cIsSubject !== mIsSubject) return false;
    if (cIsSubject && mIsSubject) return true;

    const matchFn = window.isChapterMatch || (window.Utils && window.Utils.isChapterMatch);
    if (cCh === mCh) return true;
    if (matchFn && matchFn(child.chapter, mt.chapter)) return true;
    if (matchFn && matchFn(child.chapter, `${mt.chapter}: ${mt.subject}`)) return true;
    if (matchFn && matchFn(child.chapter, `${mt.subject} ${mt.chapter}`)) return true;
    if (matchFn && matchFn(mt.chapter, `${child.chapter}: ${child.subject}`)) return true;

    if (window.Utils && typeof window.Utils.extractNum === 'function') {
        const n1 = window.Utils.extractNum(child.chapter);
        const n2 = window.Utils.extractNum(mt.chapter);
        if (n1 !== null && n2 !== null && n1 !== 999 && n2 !== 999 && n1 === n2) {
            return true;
        }
    }

    return false;
};

/**
 * Cascade deletes all associated weekly and daily targets linked to a monthly target.
 */
window.cascadeDeleteMonthlyTarget = function (target, monthKey = null, targetId = null) {
    if (!target) return;
    const mtId = target.id || targetId;

    // Determine month bounds if monthKey is provided
    let monthStart = null;
    let monthEnd = null;
    if (monthKey) {
        const parts = monthKey.split(' - ');
        if (parts.length === 2) {
            monthStart = (window.Utils && Utils.parseDateSafe) ? Utils.parseDateSafe(parts[0]) : new Date(parts[0]);
            monthEnd = (window.Utils && Utils.parseDateSafe) ? Utils.parseDateSafe(parts[1]) : new Date(parts[1]);
        }
    }

    // 1. Cascade delete associated Weekly Targets
    if (window.weeklyTargetsDatabase) {
        Object.keys(window.weeklyTargetsDatabase).forEach(weekKey => {
            const wList = window.weeklyTargetsDatabase[weekKey] || [];
            for (let i = wList.length - 1; i >= 0; i--) {
                const wt = wList[i];
                if (!wt) continue;

                let isMatch = window.isMatchMonthlyTargetWithChild(target, wt);
                if (isMatch) {
                    if (monthStart && monthEnd && !isNaN(monthStart.getTime()) && !isNaN(monthEnd.getTime())) {
                        const wDates = weekKey.split(' - ');
                        const wStart = (window.Utils && Utils.parseDateSafe) ? Utils.parseDateSafe(wDates[0]) : new Date(wDates[0]);
                        if (wStart && !isNaN(wStart.getTime())) {
                            if (wt.targetMonth && wt.targetMonth !== monthKey && (!mtId || wt.monthlyTargetId !== mtId)) {
                                continue;
                            }
                        }
                    }

                    const wtTid = wt.id || window.generateItemId(wt, `weeklyTargetsDatabase_${weekKey}`);
                    if (wtTid) window.recordItemDeletion(wtTid);
                    if (wt.id) window.recordItemDeletion(wt.id);
                    wList.splice(i, 1);
                }
            }
        });
    }

    // 2. Cascade delete associated Daily Targets
    if (window.dailyTargetsDatabase) {
        Object.keys(window.dailyTargetsDatabase).forEach(dateKey => {
            const dList = window.dailyTargetsDatabase[dateKey] || [];
            for (let i = dList.length - 1; i >= 0; i--) {
                const dt = dList[i];
                if (!dt || dt.isTodo) continue;

                let isMatch = window.isMatchMonthlyTargetWithChild(target, dt);
                if (isMatch) {
                    if (monthStart && monthEnd && !isNaN(monthStart.getTime()) && !isNaN(monthEnd.getTime())) {
                        const dDate = window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(dateKey) : ((window.Utils && Utils.parseDateSafe) ? Utils.parseDateSafe(dateKey) : new Date(dateKey));
                        if (dDate && !isNaN(dDate.getTime())) {
                            if (dt.targetMonth && dt.targetMonth !== monthKey && (!mtId || dt.monthlyTargetId !== mtId)) {
                                continue;
                            }
                        }
                    }

                    dt.isDeleted = true;
                    const dtTid = dt.id || window.generateItemId(dt, `dailyTargetsDatabase_${dateKey}`);
                    if (dtTid) window.recordItemDeletion(dtTid);
                    if (dt.id) window.recordItemDeletion(dt.id);
                    dList.splice(i, 1);
                }
            }
        });
    }
};

/**
 * Reconciles weekly and daily databases, automatically purging orphaned records
 * that have no corresponding monthly target or whose monthly target is unassigned (No Week).
 */
window.cleanOrphanedWeeklyAndDailyTargets = function () {
    if (!window.monthlyTargetsDatabase) return;
    let cleaned = false;

    // Collect all monthly targets across all months
    const allMonthlyTargets = [];
    Object.keys(window.monthlyTargetsDatabase).forEach(mKey => {
        const list = window.monthlyTargetsDatabase[mKey] || [];
        list.forEach(mt => {
            if (mt) {
                allMonthlyTargets.push({ target: mt, monthKey: mKey });
            }
        });
    });

    // 1. Clean weekly targets with no parent monthly target, or whose monthly target is unassigned (No Week)
    if (window.weeklyTargetsDatabase) {
        Object.keys(window.weeklyTargetsDatabase).forEach(wKey => {
            const wList = window.weeklyTargetsDatabase[wKey] || [];
            for (let i = wList.length - 1; i >= 0; i--) {
                const wt = wList[i];
                if (!wt) continue;

                // Find matching monthly target
                const matchingParent = allMonthlyTargets.find(({ target: mt }) => window.isMatchMonthlyTargetWithChild(mt, wt));

                let shouldKeep = false;
                if (matchingParent) {
                    const mt = matchingParent.target;
                    // If wt was created from monthly target setup (has monthlyTargetId or source: 'monthly') or matches mt
                    if (wt.monthlyTargetId || wt.source === 'monthly') {
                        const validWeeksSet = new Set();
                        if (mt.targetWeek && mt.targetWeek !== 'none' && mt.targetWeek !== '') {
                            validWeeksSet.add(mt.targetWeek);
                            const cKey = window.getCanonicalWeeklyRangeKey ? window.getCanonicalWeeklyRangeKey(mt.targetWeek) : null;
                            if (cKey) validWeeksSet.add(cKey);
                        }

                        // Check daily allocations for this MT
                        const allocKey = mt.subject + '|||' + mt.chapter;
                        const dailyAllocs = (window.monthlyTargetDailyAllocations && (window.monthlyTargetDailyAllocations[allocKey] || window.monthlyTargetDailyAllocations[mt.subject + '|||' + mt.chapter + '|||' + (mt.program || '')])) || [];
                        if (dailyAllocs.length > 0) {
                            dailyAllocs.forEach(a => {
                                if (a.dayKey) {
                                    const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey) : '';
                                    if (wk) {
                                        validWeeksSet.add(wk);
                                        const cKey = window.getCanonicalWeeklyRangeKey ? window.getCanonicalWeeklyRangeKey(wk) : null;
                                        if (cKey) validWeeksSet.add(cKey);
                                    }
                                }
                            });
                        }

                        // Also check dailyTargetsDatabase for any active daily targets of this MT
                        if (window.dailyTargetsDatabase) {
                            Object.keys(window.dailyTargetsDatabase).forEach(dKey => {
                                const dList = window.dailyTargetsDatabase[dKey] || [];
                                const hasMatch = dList.some(dt => dt && window.isMatchMonthlyTargetWithChild(mt, dt));
                                if (hasMatch) {
                                    const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(dKey) : '';
                                    if (wk) {
                                        validWeeksSet.add(wk);
                                        const cKey = window.getCanonicalWeeklyRangeKey ? window.getCanonicalWeeklyRangeKey(wk) : null;
                                        if (cKey) validWeeksSet.add(cKey);
                                    }
                                }
                            });
                        }

                        const canonicalWKey = window.getCanonicalWeeklyRangeKey ? window.getCanonicalWeeklyRangeKey(wKey) : wKey;
                        if (validWeeksSet.has(wKey) || (canonicalWKey && validWeeksSet.has(canonicalWKey))) {
                            shouldKeep = true;
                        }
                    } else {
                        // Independent manually added weekly target
                        shouldKeep = true;
                    }
                }

                if (!shouldKeep) {
                    const wtTid = wt.id || window.generateItemId(wt, `weeklyTargetsDatabase_${wKey}`);
                    if (wtTid) window.recordItemDeletion(wtTid);
                    if (wt.id) window.recordItemDeletion(wt.id);
                    wList.splice(i, 1);
                    cleaned = true;
                }
            }
        });
    }

    // 2. Clean daily targets (excluding isTodo) with no parent monthly target, or whose monthly target has no daily allocation
    if (window.dailyTargetsDatabase) {
        Object.keys(window.dailyTargetsDatabase).forEach(dKey => {
            const dList = window.dailyTargetsDatabase[dKey] || [];
            for (let i = dList.length - 1; i >= 0; i--) {
                const dt = dList[i];
                if (!dt || dt.isTodo) continue;

                const matchingParent = allMonthlyTargets.find(({ target: mt }) => window.isMatchMonthlyTargetWithChild(mt, dt));

                let shouldKeep = false;
                if (matchingParent) {
                    const mt = matchingParent.target;
                    if (dt.monthlyTargetId || dt.source === 'monthly') {
                        // If parent mt has NO week assigned, only keep dt if it is still actively allocated in monthlyTargetDailyAllocations
                        if (!mt.targetWeek || mt.targetWeek === 'none' || mt.targetWeek === '') {
                            const allocKey = mt.subject + '|||' + mt.chapter;
                            const currentAllocations = (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[allocKey]) || [];
                            const hasAlloc = currentAllocations.some(a => a.dayKey === dKey);
                            if (hasAlloc) {
                                shouldKeep = true;
                            }
                        } else {
                            shouldKeep = true;
                        }
                    } else {
                        shouldKeep = true;
                    }
                }

                if (!shouldKeep) {
                    dt.isDeleted = true;
                    const dtTid = dt.id || window.generateItemId(dt, `dailyTargetsDatabase_${dKey}`);
                    if (dtTid) window.recordItemDeletion(dtTid);
                    if (dt.id) window.recordItemDeletion(dt.id);
                    dList.splice(i, 1);
                    cleaned = true;
                }
            }
        });
    }

    if (cleaned) {
        if (typeof window.recalculateTotals === 'function') window.recalculateTotals();
        FirebaseService.saveToCloud(true);
    }
};

window.updateMonthlyTargetColorSync = function () {
    const subSelect = document.getElementById('mt-select-sub');
    const chSelect = document.getElementById('mt-select-ch');
    const dot = document.getElementById('mt-sub-color-dot');
    if (!subSelect) return;
    const subject = subSelect.value;
    if (subject && subject !== "No Subjects") {
        const color = window.getSubjectColor ? window.getSubjectColor(subject) : '#6366f1';
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
};

/* --- Multi-Program & Multi-Subject Selection Engine --- */
window.populateMonthlyProgramsList = function (preselectedProgram = null) {
    const container = document.getElementById('mt-progs-container');
    if (!container) return;
    container.innerHTML = '';

    const allPrograms = [];
    (window.tracks || []).forEach(track => {
        if (window.customPrograms[track.id]) {
            window.customPrograms[track.id].forEach(p => {
                const progName = p.name || p;
                const subsCount = (syllabusStructure[track.id] || []).filter(s => s.program === progName).length;
                allPrograms.push({
                    trackId: track.id,
                    trackName: track.name || track.id,
                    progName: progName,
                    subsCount: subsCount
                });
            });
        }
    });

    if (allPrograms.length === 0) {
        container.innerHTML = `
            <div class="py-6 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                No Programs Configured
            </div>`;
        return;
    }

    allPrograms.forEach(prog => {
        const isSelected = Boolean(preselectedProgram && (prog.progName === preselectedProgram));
        const isProgPassed = Boolean(
            (window.passedItems && Array.isArray(window.passedItems.programs) && window.passedItems.programs.includes(prog.progName)) ||
            (prog.subsCount > 0 && (syllabusStructure[prog.trackId] || [])
                .filter(s => s.program === prog.progName)
                .every(s => window.isSubjectPassed && window.isSubjectPassed(prog.trackId, s.subject, prog.progName)))
        );

        const trackBadgeColor = prog.trackId === 'academic'
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50'
            : (prog.trackId === 'admission' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50');

        const cardHtml = `
            <div class="mt-prog-card flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 transition-all hover:border-purple-400/80 dark:hover:border-purple-500/80 cursor-pointer shadow-xs hover:shadow-sm min-h-[46px] active:scale-[0.99]"
                data-track="${prog.trackId}" data-program="${prog.progName}"
                onclick="window.toggleMonthlyProgramCard('${CSS.escape(prog.trackId)}', '${CSS.escape(prog.progName)}', event)">
                <label class="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pointer-events-none">
                    <input type="checkbox" data-track="${prog.trackId}" data-program="${prog.progName}"
                        class="mt-prog-checkbox form-checkbox h-5 w-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer pointer-events-auto shrink-0"
                        onchange="window.handleMonthlyProgramToggle(); event.stopPropagation();"
                        ${isSelected ? 'checked' : ''}>
                    <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                        <span class="text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${trackBadgeColor} shrink-0">${prog.trackName}</span>
                        <span class="text-xs font-black text-slate-800 dark:text-slate-100 truncate">${isProgPassed ? `🏆 ${prog.progName} (Passed)` : prog.progName}</span>
                    </div>
                </label>
                <div class="flex items-center gap-1.5 shrink-0 ml-1.5">
                    ${isProgPassed ? `
                        <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                            Passed
                        </span>
                    ` : ''}
                    <span class="text-[8.5px] sm:text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-300">
                        ${prog.subsCount} Sub
                    </span>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });

    window.handleMonthlyProgramToggle();
};

window.toggleMonthlyProgramsDropdown = function (forceState = null) {
    const menu = document.getElementById('mt-progs-dropdown-menu');
    const chevron = document.getElementById('mt-progs-dropdown-chevron');
    if (!menu) return;

    const shouldOpen = forceState !== null ? forceState : menu.classList.contains('hidden');
    if (shouldOpen) {
        menu.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
    } else {
        menu.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
    }
};

window.toggleMonthlyProgramCard = function (trackId, progName, event) {
    if (event && event.target && (event.target.tagName === 'INPUT' || event.target.closest('input'))) {
        return;
    }
    const cb = document.querySelector(`.mt-prog-checkbox[data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
    if (cb) {
        cb.checked = !cb.checked;
        window.handleMonthlyProgramToggle();
    }
};

window.toggleAllMonthlyPrograms = function (select) {
    const checkboxes = document.querySelectorAll('.mt-prog-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = select;
    });
    window.handleMonthlyProgramToggle();
};

window.handleMonthlyProgramToggle = function (preselectSubject = null) {
    const checkedProgs = Array.from(document.querySelectorAll('.mt-prog-checkbox:checked'));
    const badgeCount = document.getElementById('mt-progs-count-badge');
    if (badgeCount) {
        badgeCount.textContent = `${checkedProgs.length} Selected`;
    }

    const dropdownLabel = document.getElementById('mt-progs-dropdown-label');
    if (dropdownLabel) {
        if (checkedProgs.length === 0) {
            dropdownLabel.textContent = 'Select Programs...';
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 truncate block';
        } else if (checkedProgs.length === 1) {
            dropdownLabel.textContent = `${checkedProgs[0].getAttribute('data-program')}`;
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate block';
        } else {
            const names = checkedProgs.map(cb => cb.getAttribute('data-program')).join(', ');
            dropdownLabel.textContent = `${checkedProgs.length} Selected: ${names}`;
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate block';
        }
    }

    window.updateMonthlyTargetSubjectDropdown(preselectSubject);
};

window.updateMonthlyTargetSubjectDropdown = function (preselectSubject = null, preselectChapter = null, preselectSize = null, preselectWeek = null) {
    const container = document.getElementById('mt-subjects-container');
    if (!container) return;

    // Keep track of currently checked subjects before re-rendering
    const previouslyCheckedSet = preselectSubject
        ? new Set()
        : new Set(
            Array.from(document.querySelectorAll('.mt-subject-checkbox:checked')).map(cb => 
                cb.getAttribute('data-track') + '|||' + cb.getAttribute('data-program') + '|||' + cb.getAttribute('data-subject')
            )
        );

    container.innerHTML = '';

    const checkedProgs = Array.from(document.querySelectorAll('.mt-prog-checkbox:checked'));
    if (checkedProgs.length === 0) {
        container.innerHTML = `
            <div class="py-6 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                No Program Selected. Please choose at least one program above.
            </div>`;
        window.updateMonthlyTargetChapterDropdown();
        window.updateMonthlyTargetPageSummary();
        return;
    }

    const isMultiProg = checkedProgs.length > 1;
    const passedItems = window.passedItems || (window.AppState && window.AppState.passedItems) || { programs: [], subjects: [] };
    let totalSubsRendered = 0;

    checkedProgs.forEach(progCb => {
        const trackId = progCb.getAttribute('data-track');
        const progName = progCb.getAttribute('data-program');
        const subs = (syllabusStructure[trackId] || []).filter(s => s.program === progName);

        subs.forEach(s => {
            totalSubsRendered++;
            const isPassed = window.isSubjectPassed ? window.isSubjectPassed(trackId, s.subject, progName) : Boolean(
                (Array.isArray(passedItems.subjects) && passedItems.subjects.includes(s.subject)) ||
                (Array.isArray(passedItems.programs) && passedItems.programs.includes(s.program || progName))
            );
            const label = isPassed ? `🏆 ${s.subject} (Passed)` : s.subject;
            const color = window.getSubjectColor ? window.getSubjectColor(s.subject) : '#6366f1';
            const chs = window.getChaptersForSubject(trackId, s.subject) || [];
            
            const subKey = trackId + '|||' + progName + '|||' + s.subject;
            let isSelected = !isPassed && (
                preselectSubject
                    ? (s.subject === preselectSubject)
                    : previouslyCheckedSet.has(subKey)
            );

            const cardClasses = isPassed
                ? "mt-subject-card flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40 bg-slate-50/70 dark:bg-slate-900/40 opacity-60 cursor-not-allowed min-h-[46px]"
                : "mt-subject-card flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 transition-all hover:border-indigo-400/80 dark:hover:border-indigo-500/80 cursor-pointer shadow-xs hover:shadow-sm min-h-[46px] active:scale-[0.99]";

            const cardHtml = `
                <div class="${cardClasses}"
                    data-track="${trackId}" data-program="${progName}" data-subject="${s.subject}" data-passed="${isPassed ? 'true' : 'false'}"
                    onclick="window.toggleMonthlySubjectCard('${CSS.escape(trackId)}', '${CSS.escape(progName)}', '${CSS.escape(s.subject)}', event)">
                    <label class="flex items-center gap-2.5 ${isPassed ? 'cursor-not-allowed' : 'cursor-pointer'} flex-1 min-w-0 pointer-events-none">
                        <input type="checkbox" data-track="${trackId}" data-program="${progName}" data-subject="${s.subject}"
                            class="mt-subject-checkbox form-checkbox h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer pointer-events-auto shrink-0 ${isPassed ? 'opacity-30 cursor-not-allowed' : ''}"
                            onchange="window.handleMonthlySubjectToggle(); event.stopPropagation();"
                            ${isSelected ? 'checked' : ''}
                            ${isPassed ? 'disabled title="Subject is passed and cannot be selected"' : ''}>
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style="background-color: ${color}"></span>
                            <span class="text-xs font-black text-slate-800 dark:text-slate-100 truncate">${label}</span>
                            ${isMultiProg ? `<span class="text-[8px] font-bold text-purple-600 dark:text-purple-400 px-1 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200/40 dark:border-purple-800/40 shrink-0">${progName}</span>` : ''}
                        </div>
                    </label>
                    <div class="flex items-center gap-1.5 shrink-0 ml-1.5">
                        ${isPassed ? `
                            <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                Passed
                            </span>
                        ` : ''}
                        <span class="text-[8.5px] sm:text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-300">
                            ${chs.length} Ch
                        </span>
                    </div>
                </div>
            `;
            container.innerHTML += cardHtml;
        });
    });

    if (totalSubsRendered === 0) {
        container.innerHTML = `
            <div class="py-6 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                No Subjects Available for the Selected Programs
            </div>`;
    }

    window.updateMonthlyTargetChapterDropdown(preselectChapter, preselectSize, preselectSubject, preselectWeek);
    window.updateMonthlyTargetPageSummary();
};

window.toggleMonthlySubjectsDropdown = function (forceState = null) {
    const menu = document.getElementById('mt-subjects-dropdown-menu');
    const chevron = document.getElementById('mt-subjects-dropdown-chevron');
    if (!menu) return;

    const shouldOpen = forceState !== null ? forceState : menu.classList.contains('hidden');
    if (shouldOpen) {
        menu.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
    } else {
        menu.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
    }
};

window.toggleMonthlySubjectCard = function (trackId, progName, subjectName, event) {
    if (event && event.target && (event.target.tagName === 'INPUT' || event.target.closest('input'))) {
        return;
    }
    const card = event && event.currentTarget ? event.currentTarget : document.querySelector(`.mt-subject-card[data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"][data-subject="${CSS.escape(subjectName)}"]`);
    if (card && card.getAttribute('data-passed') === 'true') {
        showToast(`"${subjectName}" is marked as Passed and cannot be selected.`, "info");
        return;
    }
    const cb = document.querySelector(`.mt-subject-checkbox[data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"][data-subject="${CSS.escape(subjectName)}"]`);
    if (cb && !cb.disabled) {
        cb.checked = !cb.checked;
        window.handleMonthlySubjectToggle();
    }
};

window.toggleAllMonthlySubjects = function (select) {
    const checkboxes = document.querySelectorAll('.mt-subject-checkbox:not(:disabled)');
    checkboxes.forEach(cb => {
        cb.checked = select;
    });
    window.handleMonthlySubjectToggle();
};

window.handleMonthlySubjectToggle = function () {
    window.updateMonthlyTargetChapterDropdown();
    window.updateMonthlyTargetPageSummary();
};

window.updateMonthlyTargetChapterDropdown = function (preselectChapter = null, preselectSize = null, targetSubject = null, preselectWeek = null) {
    const container = document.getElementById('mt-chapters-container');
    if (!container) return;

    // 1. Snapshot and remember all current chapter and whole subject selections / values before re-rendering
    const rememberedState = {};
    const existingChapterCbs = document.querySelectorAll('.mt-chapter-checkbox');
    existingChapterCbs.forEach(cb => {
        const track = cb.getAttribute('data-track') || '';
        const prog = cb.getAttribute('data-program') || '';
        const sub = cb.getAttribute('data-subject') || '';
        const ch = cb.getAttribute('data-chapter') || '';
        const key = `${track}|||${prog}|||${sub}|||${ch}`;
        const keySubCh = `${sub}|||${ch}`;
        
        const row = cb.closest('.mt-chapter-row');
        const weekSelect = row ? row.querySelector('.mt-chapter-week-select') : document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        const sizeInput = row ? row.querySelector('.mt-chapter-size-input') : document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);

        const entry = {
            checked: cb.checked,
            week: weekSelect ? weekSelect.value : '',
            size: sizeInput ? sizeInput.value : ''
        };
        rememberedState[key] = entry;
        rememberedState[keySubCh] = entry;
    });

    const existingWholeSubs = document.querySelectorAll('.mt-ch-whole-subject');
    existingWholeSubs.forEach(ws => {
        const track = ws.getAttribute('data-track') || '';
        const prog = ws.getAttribute('data-program') || '';
        const sub = ws.getAttribute('data-subject') || '';
        const key = `${track}|||${prog}|||${sub}|||Whole Subject`;
        const keySubCh = `${sub}|||Whole Subject`;

        const row = ws.closest('.mt-chapter-row');
        const weekSelect = row ? row.querySelector('.mt-size-whole-subject-week') : document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(sub)}"]`);
        const sizeInput = row ? row.querySelector('.mt-size-whole-subject') : document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);

        const entry = {
            checked: ws.checked,
            week: weekSelect ? weekSelect.value : '',
            size: sizeInput ? sizeInput.value : ''
        };
        rememberedState[key] = entry;
        rememberedState[keySubCh] = entry;
    });

    container.innerHTML = '';

    const checkedSubjectCbs = Array.from(document.querySelectorAll('.mt-subject-checkbox:checked'));
    if (checkedSubjectCbs.length === 0) {
        container.innerHTML = `
            <div class="py-12 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2">
                <svg class="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <span>No subjects selected. Check one or more subjects on the left to configure chapters.</span>
            </div>`;
        window.updateMonthlyTargetPageSummary();
        return;
    }

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];

    let baseWeeksOptions = '';
    weeks.forEach((w, wIdx) => {
        const opt = { day: '2-digit', month: 'short' };
        const shortLabel = `Week ${wIdx + 1} (${w.start.toLocaleDateString('en-GB', opt)} - ${w.end.toLocaleDateString('en-GB', opt)})`;
        baseWeeksOptions += `<option value="${w.key}">${shortLabel}</option>`;
    });

    const bulkWeekSelect = document.getElementById('mt-bulk-week-select');
    if (bulkWeekSelect) {
        const prevVal = bulkWeekSelect.value;
        bulkWeekSelect.innerHTML = '<option value="">-- No Week --</option>' + baseWeeksOptions;
        if (prevVal && weeks.some(w => w.key === prevVal)) {
            bulkWeekSelect.value = prevVal;
        }
    }

    checkedSubjectCbs.forEach(cb => {
        const trackId = cb.getAttribute('data-track');
        const progName = cb.getAttribute('data-program');
        const subject = cb.getAttribute('data-subject');

        const color = window.getSubjectColor ? window.getSubjectColor(subject) : '#6366f1';
        const chapters = window.getChaptersForSubject(trackId, subject) || [];
        const isTargetSub = !targetSubject || targetSubject === subject;
        const isWholeSubPreselected = isTargetSub && (preselectChapter === 'Whole Subject' || preselectChapter === '-- 📚 Whole Subject (All Chapters) --');

        const wsKeyFull = `${trackId}|||${progName}|||${subject}|||Whole Subject`;
        const wsKeySubCh = `${subject}|||Whole Subject`;
        const savedWholeSub = rememberedState[wsKeyFull] || rememberedState[wsKeySubCh];

        const isWholeSubChecked = preselectChapter
            ? isWholeSubPreselected
            : (savedWholeSub ? savedWholeSub.checked : isWholeSubPreselected);
        const wholeSubWeekVal = preselectChapter
            ? (isWholeSubPreselected ? (preselectWeek || '') : '')
            : (savedWholeSub ? savedWholeSub.week : (isWholeSubPreselected ? (preselectWeek || '') : ''));
        const wholeSubSizeVal = preselectChapter
            ? (isWholeSubPreselected && preselectSize ? preselectSize : '')
            : (savedWholeSub ? savedWholeSub.size : (isWholeSubPreselected && preselectSize ? preselectSize : ''));

        let wholeSubWeeksOptionsHtml = '';
        weeks.forEach((w, wIdx) => {
            const opt = { day: '2-digit', month: 'short' };
            const shortLabel = `Week ${wIdx + 1} (${w.start.toLocaleDateString('en-GB', opt)} - ${w.end.toLocaleDateString('en-GB', opt)})`;
            const isWeekSelected = Boolean(wholeSubWeekVal && wholeSubWeekVal === w.key);
            wholeSubWeeksOptionsHtml += `<option value="${w.key}" ${isWeekSelected ? 'selected' : ''}>${shortLabel}</option>`;
        });

        let chaptersHtml = '';
        if (chapters.length > 0) {
            chapters.forEach(ch => {
                const count = window.getMonthlyTargetOccurrenceCount ? window.getMonthlyTargetOccurrenceCount(trackId, subject, ch, 'chapter') : 0;
                const starsHtml = count > 0 ? `<span class="inline-flex text-amber-500 dark:text-amber-400 text-xs ml-1 font-bold select-none" title="Targeted ${count} time(s) before. Setting now will be Target #${count + 1}">${'★'.repeat(count)}</span>` : '';

                const isCompleted = window.isChapterCompleted ? window.isChapterCompleted(trackId, subject, ch) : false;
                const completedTickHtml = isCompleted ? `
                    <span class="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 align-middle shrink-0 shadow-xs" title="Completed">
                        <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </span>` : '';

                const chKeyFull = `${trackId}|||${progName}|||${subject}|||${ch}`;
                const chKeySubCh = `${subject}|||${ch}`;
                const savedCh = rememberedState[chKeyFull] || rememberedState[chKeySubCh];
                const isChTargetPreselected = isTargetSub && preselectChapter === ch;

                const isChChecked = preselectChapter
                    ? isChTargetPreselected
                    : (savedCh ? savedCh.checked : isChTargetPreselected);
                const chWeekVal = preselectChapter
                    ? (isChTargetPreselected ? (preselectWeek || '') : '')
                    : (savedCh ? savedCh.week : (isChTargetPreselected ? (preselectWeek || '') : ''));
                const chSizeVal = preselectChapter
                    ? (isChTargetPreselected && preselectSize ? preselectSize : '')
                    : (savedCh ? savedCh.size : (isChTargetPreselected && preselectSize ? preselectSize : ''));

                let chWeeksOptionsHtml = '';
                weeks.forEach((w, wIdx) => {
                    const opt = { day: '2-digit', month: 'short' };
                    const shortLabel = `Week ${wIdx + 1} (${w.start.toLocaleDateString('en-GB', opt)} - ${w.end.toLocaleDateString('en-GB', opt)})`;
                    const isWeekSelected = Boolean(chWeekVal && chWeekVal === w.key);
                    chWeeksOptionsHtml += `<option value="${w.key}" ${isWeekSelected ? 'selected' : ''}>${shortLabel}</option>`;
                });

                chaptersHtml += `
                    <div class="mt-chapter-row flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800/90 transition-all hover:border-indigo-400/60 dark:hover:border-indigo-500/60 hover:shadow-xs gap-2 overflow-hidden"
                         data-track="${trackId}" data-program="${progName}" data-chapter-name="${subject} ${ch}" data-subject="${subject}">
                        <label class="flex items-center gap-2.5 sm:gap-3 cursor-pointer flex-1 min-w-0">
                            <input type="checkbox" data-track="${trackId}" data-program="${progName}" data-subject="${subject}" data-chapter="${ch}" class="mt-chapter-checkbox form-checkbox h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer transition-all shrink-0"
                                 onchange="window.handleMonthlyChapterCheckChange(this, '${CSS.escape(subject)}');"
                                 ${isChChecked ? 'checked' : ''}>
                            <div class="min-w-0 flex-1 flex items-center gap-1">
                                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${ch}</span>
                                ${starsHtml}
                                ${completedTickHtml}
                            </div>
                        </label>
                        <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/40">
                            <!-- Multi-Week Indicator (shown left of the week dropdown when multi-week) -->
                            <span class="mt-chapter-multiweek-badge hidden px-2 py-1 rounded-xl text-[9px] sm:text-[10px] font-black tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 shadow-xs shrink-0 select-none"
                                  data-subject="${subject}" data-chapter="${ch}">
                            </span>
                            <!-- Week Picker per chapter -->
                            <select data-track="${trackId}" data-program="${progName}" data-subject="${subject}" data-chapter="${ch}"
                                class="mt-chapter-week-select bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 font-bold outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-0 sm:flex-none sm:w-[135px] truncate shadow-xs h-9"
                                onchange="window.handleMonthlyChapterWeekSelectChange('${CSS.escape(subject)}', '${CSS.escape(ch)}', this.value, '${CSS.escape(trackId)}', '${CSS.escape(progName)}');">
                                <option value="">-- No Week --</option>
                                ${chWeeksOptionsHtml}
                            </select>
                            <!-- Size Input per chapter -->
                            <input type="number" data-track="${trackId}" data-program="${progName}" data-subject="${subject}" data-chapter="${ch}" class="mt-chapter-size-input w-16 sm:w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold outline-none shadow-inner focus:ring-2 focus:ring-indigo-500 transition-all text-center h-9 shrink-0"
                                placeholder="Size" min="1"
                                oninput="window.handleMonthlyChapterSizeInputChange(this);"
                                value="${chSizeVal || ''}">
                        </div>
                    </div>
                `;
            });
        } else {
            chaptersHtml = `
                <div class="py-4 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                    No individual chapters listed for ${subject}.
                </div>
            `;
        }

        const wholeSubCount = window.getMonthlyTargetOccurrenceCount ? window.getMonthlyTargetOccurrenceCount(trackId, subject, 'Whole Subject', 'subject') : 0;
        const wholeSubStarsHtml = wholeSubCount > 0 ? `<span class="inline-flex text-amber-500 dark:text-amber-400 text-xs ml-1 font-bold select-none" title="Targeted ${wholeSubCount} time(s) before. Setting now will be Target #${wholeSubCount + 1}">${'★'.repeat(wholeSubCount)}</span>` : '';

        const groupHtml = `
            <div class="mt-subject-chapter-group rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/95 p-3 sm:p-4 shadow-sm space-y-3" data-track="${trackId}" data-program="${progName}" data-subject="${subject}">
                <!-- Subject Header -->
                <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
                    <div class="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-wrap">
                        <span class="w-3 h-3 rounded-full shrink-0 shadow-xs" style="background-color: ${color}"></span>
                        <h4 class="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">${subject}</h4>
                        <span class="text-[8.5px] sm:text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50 shrink-0">
                            ${progName}
                        </span>
                        <span class="text-[8.5px] sm:text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-300 shrink-0">
                            ${chapters.length} Ch
                        </span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button type="button" onclick="window.toggleAllMonthlyChaptersForSubject('${CSS.escape(subject)}', true, '${CSS.escape(trackId)}', '${CSS.escape(progName)}')"
                            class="text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-2.5 py-1 rounded border border-indigo-200/50 dark:border-indigo-800/50 transition-all active:scale-95 min-h-[28px]">Select All</button>
                        <button type="button" onclick="window.toggleAllMonthlyChaptersForSubject('${CSS.escape(subject)}', false, '${CSS.escape(trackId)}', '${CSS.escape(progName)}')"
                            class="text-[9px] font-black text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 transition-all active:scale-95 min-h-[28px]">Clear</button>
                    </div>
                </div>

                <!-- Whole Subject Checkbox Row -->
                <div class="mt-chapter-row flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl border border-purple-200/80 dark:border-purple-800/60 bg-purple-50/60 dark:bg-purple-950/30 transition-all hover:bg-purple-50 dark:hover:bg-purple-950/50 shadow-xs gap-2 overflow-hidden"
                     data-track="${trackId}" data-program="${progName}" data-chapter-name="${subject} Whole Subject All Chapters" data-subject="${subject}">
                    <label class="flex items-center gap-2.5 sm:gap-3 cursor-pointer flex-1 min-w-0">
                        <input type="checkbox" data-track="${trackId}" data-program="${progName}" data-subject="${subject}" class="mt-ch-whole-subject form-checkbox h-5 w-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer transition-all shrink-0"
                            onchange="window.handleMonthlyWholeSubjectToggle('${CSS.escape(subject)}', this.checked, '${CSS.escape(trackId)}', '${CSS.escape(progName)}')"
                            ${isWholeSubChecked ? 'checked' : ''}>
                        <div class="min-w-0 flex-1">
                            <span class="text-xs font-black text-purple-900 dark:text-purple-200 truncate block">📚 Whole Subject (All Chapters)${wholeSubStarsHtml}</span>
                            <span class="text-[8.5px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider block">Target entirety of ${subject} (${progName})</span>
                        </div>
                    </label>
                    <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-purple-200/40 dark:border-purple-800/40">
                        <!-- Multi-Week Indicator for Whole Subject -->
                        <span class="mt-chapter-multiweek-badge hidden px-2 py-1 rounded-xl text-[9px] sm:text-[10px] font-black tracking-wider bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-xs shrink-0 select-none"
                              data-subject="${subject}" data-chapter="Whole Subject">
                        </span>
                        <!-- Week Picker for Whole Subject -->
                        <select data-track="${trackId}" data-program="${progName}" data-subject="${subject}"
                            class="mt-size-whole-subject-week bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/60 rounded-xl px-2 py-1.5 text-[11px] text-purple-700 dark:text-purple-300 font-bold outline-none focus:ring-2 focus:ring-purple-500 flex-1 min-w-0 sm:flex-none sm:w-[135px] truncate shadow-xs h-9"
                            onchange="window.handleMonthlyChapterWeekSelectChange('${CSS.escape(subject)}', 'Whole Subject', this.value, '${CSS.escape(trackId)}', '${CSS.escape(progName)}');">
                            <option value="">-- No Week --</option>
                            ${wholeSubWeeksOptionsHtml}
                        </select>
                        <!-- Size Input for Whole Subject -->
                        <input type="number" data-track="${trackId}" data-program="${progName}" data-subject="${subject}" placeholder="Size" min="1"
                            oninput="window.handleMonthlyChapterSizeInputChange(this);"
                            value="${wholeSubSizeVal || ''}"
                            class="mt-size-whole-subject w-16 sm:w-20 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/60 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-purple-500 transition-all text-center h-9 shrink-0">
                    </div>
                </div>

                <!-- Individual Chapters List -->
                <div class="space-y-1.5">
                    ${chaptersHtml}
                </div>
            </div>
        `;
        container.innerHTML += groupHtml;
    });

    if (typeof window.updateChapterMultiWeekBadges === 'function') {
        window.updateChapterMultiWeekBadges();
    }
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();

    const searchInput = document.getElementById('mt-chapter-search-input');
    if (searchInput && searchInput.value) {
        window.filterMonthlyTargetChapters(searchInput.value);
    }
};

window.toggleAllMonthlyChaptersForSubject = function (subjectName, select, trackId = null, progName = null) {
    const trackSelector = trackId ? `[data-track="${CSS.escape(trackId)}"]` : '';
    const progSelector = progName ? `[data-program="${CSS.escape(progName)}"]` : '';
    const wholeSub = document.querySelector(`.mt-ch-whole-subject[data-subject="${CSS.escape(subjectName)}"]${trackSelector}${progSelector}`);
    if (wholeSub && select) wholeSub.checked = false;

    const checkboxes = document.querySelectorAll(`.mt-chapter-checkbox[data-subject="${CSS.escape(subjectName)}"]${trackSelector}${progSelector}`);
    checkboxes.forEach(cb => {
        const parentRow = cb.closest('.mt-chapter-row');
        if (!parentRow || !parentRow.classList.contains('hidden')) {
            cb.checked = select;
        }
    });
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
};

window.toggleAllMonthlyChapters = function (select) {
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject');
    if (select) {
        wholeSubs.forEach(ws => ws.checked = false);
    }

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox');
    checkboxes.forEach(cb => {
        const parentRow = cb.closest('.mt-chapter-row');
        if (!parentRow || !parentRow.classList.contains('hidden')) {
            cb.checked = select;
        }
    });
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
};

window.handleMonthlyWholeSubjectToggle = function (subjectName, isChecked, trackId = null, progName = null) {
    const trackSelector = trackId ? `[data-track="${CSS.escape(trackId)}"]` : '';
    const progSelector = progName ? `[data-program="${CSS.escape(progName)}"]` : '';
    if (isChecked) {
        const checkboxes = document.querySelectorAll(`.mt-chapter-checkbox[data-subject="${CSS.escape(subjectName)}"]${trackSelector}${progSelector}`);
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
    }
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
};

window.handleMonthlyChapterCheckChange = function (checkboxEl, subjectName) {
    if (checkboxEl && checkboxEl.checked) {
        const wholeSub = document.querySelector(`.mt-ch-whole-subject[data-subject="${CSS.escape(subjectName)}"]`);
        if (wholeSub) wholeSub.checked = false;
    }
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
};

window.filterMonthlyTargetChapters = function (query) {
    const q = (query || '').toLowerCase().trim();
    const groups = document.querySelectorAll('.mt-subject-chapter-group');
    groups.forEach(group => {
        const subjectName = (group.getAttribute('data-subject') || '').toLowerCase();
        const rows = group.querySelectorAll('.mt-chapter-row');
        let visibleRowCount = 0;
        rows.forEach(row => {
            const name = (row.getAttribute('data-chapter-name') || '').toLowerCase();
            if (!q || name.includes(q) || subjectName.includes(q)) {
                row.classList.remove('hidden');
                visibleRowCount++;
            } else {
                row.classList.add('hidden');
            }
        });
        if (!q || visibleRowCount > 0 || subjectName.includes(q)) {
            group.classList.remove('hidden');
        } else {
            group.classList.add('hidden');
        }
    });
};

window.setBulkSizePreset = function (val) {
    const bulkInput = document.getElementById('mt-bulk-size-input');
    if (bulkInput) {
        bulkInput.value = val;
        window.applyBulkSizeToMonthlyChapters();
    }
};

window.findWeekForDayInMonth = function (dayKey, targetMonthDate = null) {
    if (!dayKey) return '';
    const activeMonth = targetMonthDate || window.currentMonthlyTargetsDate || new Date();
    const targetYear = activeMonth.getFullYear();

    let d = null;
    if (typeof dayKey === 'string') {
        const trimmed = dayKey.trim();
        // Case 1: YYYY-MM-DD
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
            const [y, m, day] = trimmed.split('-').map(Number);
            d = new Date(y, m - 1, day, 12, 0, 0);
        }
        // Case 2: DD-MM-YYYY
        else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
            const [day, m, y] = trimmed.split('-').map(Number);
            d = new Date(y, m - 1, day, 12, 0, 0);
        }
        // Case 3: "Sep 15" or "15 Sep" or "15 Sep 2026"
        else {
            const withYear = (trimmed.includes(String(targetYear)) || trimmed.includes(String(targetYear - 1)) || trimmed.includes(String(targetYear + 1)))
                ? trimmed
                : `${trimmed} ${targetYear}`;
            d = new Date(withYear + ' 12:00:00');
            if (isNaN(d.getTime()) && window.Utils && typeof window.Utils.parseDateSafe === 'function') {
                d = window.Utils.parseDateSafe(withYear);
            }
        }
    } else if (dayKey instanceof Date) {
        d = dayKey;
    }

    if (!d || isNaN(d.getTime())) {
        d = (window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(dayKey) : new Date(dayKey));
    }
    if (!d || isNaN(d.getTime())) return '';

    const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(activeMonth) : [];
    if (!weeks || weeks.length === 0) return '';

    const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
    for (const w of weeks) {
        const startTime = new Date(w.start).setHours(0, 0, 0, 0);
        const endTime = new Date(w.end).setHours(23, 59, 59, 999);
        if (dTime >= startTime && dTime <= endTime) {
            return w.key;
        }
    }
    return '';
};

window.bindTargetToWeek = function (subject, chapter, weekKey, track = null, program = null) {
    if (!weekKey) return;
    const trackSelector = track ? `[data-track="${CSS.escape(track)}"]` : '';
    const progSelector = program ? `[data-program="${CSS.escape(program)}"]` : '';
    if (chapter === 'Whole Subject') {
        const weekSelect = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(subject)}"]${trackSelector}${progSelector}`) ||
                           document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(subject)}"]`);
        if (weekSelect) {
            weekSelect.value = weekKey;
        }
    } else {
        const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]${trackSelector}${progSelector}`) ||
                           document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
        if (weekSelect) {
            weekSelect.value = weekKey;
        }
    }
};

window.updateChapterMultiWeekBadges = function () {
    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const monthWeeks = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];

    const badges = document.querySelectorAll('.mt-chapter-multiweek-badge');
    badges.forEach(badge => {
        const sub = badge.getAttribute('data-subject');
        const ch = badge.getAttribute('data-chapter');
        if (!sub || !ch) return;
        const key = sub + '|||' + ch;
        const allocations = (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key]) || [];

        const weeksSpanned = new Set();
        allocations.forEach(a => {
            if (a.dayKey) {
                const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey, targetMonthDate) : '';
                if (wk) weeksSpanned.add(wk);
            }
        });

        if (weeksSpanned.size > 1) {
            const weekNums = [];
            monthWeeks.forEach((mw, idx) => {
                if (weeksSpanned.has(mw.key)) {
                    weekNums.push(`W${idx + 1}`);
                }
            });

            const label = weekNums.length > 0 ? `[ ${weekNums.join(' ')} ]` : `[ ${weeksSpanned.size}W ]`;
            badge.textContent = label;
            badge.title = `Chapter is spread into multiple weeks: ${Array.from(weeksSpanned).join(', ')}`;
            badge.classList.remove('hidden');
        } else {
            badge.textContent = '';
            badge.classList.add('hidden');
        }
    });
};

window.adjustDailyAllocationsForTargetWeek = function (subject, chapter, weekKey) {
    if (!weekKey || weekKey === 'none') return;
    const key = subject + '|||' + chapter;
    if (!window.monthlyTargetDailyAllocations || !window.monthlyTargetDailyAllocations[key]) return;
    const allocations = window.monthlyTargetDailyAllocations[key];
    if (!Array.isArray(allocations) || allocations.length === 0) return;

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const weekDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate, weekKey) : [];
    if (weekDays.length === 0) return;

    allocations.forEach((alloc, idx) => {
        const dayObj = weekDays[Math.min(idx, weekDays.length - 1)];
        if (dayObj) {
            alloc.dayKey = dayObj.key;
        }
    });
};

window.handleMonthlyChapterWeekSelectChange = function (subject, chapter, weekKey, trackId = null, progName = null) {
    if (weekKey && weekKey !== 'none') {
        window.adjustDailyAllocationsForTargetWeek(subject, chapter, weekKey);
    }
    window.renderMonthlyTargetDailyAllocations();
    if (typeof window.updateChapterMultiWeekBadges === 'function') {
        window.updateChapterMultiWeekBadges();
    }
    window.updateMonthlyTargetPageSummary();
};

window.applyBulkWeekToMonthlyChapters = function () {
    const bulkWeekSelect = document.getElementById('mt-bulk-week-select');
    const selectedWeek = bulkWeekSelect ? bulkWeekSelect.value : '';

    let appliedCount = 0;
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const sub = ws.getAttribute('data-subject');
        const weekSelect = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(sub)}"]`);
        if (weekSelect) {
            weekSelect.value = selectedWeek;
            appliedCount++;
            if (!selectedWeek || selectedWeek === 'none') {
                if (window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations[sub + '|||Whole Subject'] = [];
            } else {
                window.adjustDailyAllocationsForTargetWeek(sub, 'Whole Subject', selectedWeek);
            }
        }
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        if (weekSelect) {
            weekSelect.value = selectedWeek;
            appliedCount++;
            if (!selectedWeek || selectedWeek === 'none') {
                if (window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations[sub + '|||' + ch] = [];
            } else {
                window.adjustDailyAllocationsForTargetWeek(sub, ch, selectedWeek);
            }
        }
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();

    if (appliedCount === 0) {
        showToast("No chapters or whole subjects currently selected. Check the targets you want to assign week to.", "error");
    } else {
        const weekLabel = selectedWeek ? "assigned" : "cleared";
        showToast(`Weekly target ${weekLabel} for ${appliedCount} selected target(s)!`, "success");
    }
};

window.distributeChaptersAcrossWeeks = function () {
    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];
    if (!weeks || weeks.length === 0) {
        return showToast("No weeks available for the active month.", "error");
    }

    const selectedTargets = [];
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const sub = ws.getAttribute('data-subject');
        const weekSelect = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(sub)}"]`);
        if (weekSelect) selectedTargets.push({ subject: sub, chapter: 'Whole Subject', weekSelect: weekSelect });
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        if (weekSelect) selectedTargets.push({ subject: sub, chapter: ch, weekSelect: weekSelect });
    });

    if (selectedTargets.length === 0) {
        return showToast("Please check at least one chapter or whole subject to distribute across weeks.", "error");
    }

    selectedTargets.forEach((targetInfo, idx) => {
        const assignedWeek = weeks[idx % weeks.length];
        targetInfo.weekSelect.value = assignedWeek.key;
        window.adjustDailyAllocationsForTargetWeek(targetInfo.subject, targetInfo.chapter, assignedWeek.key);
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    showToast(`⚡ ${selectedTargets.length} target(s) distributed across ${weeks.length} weeks!`, "success");
};

/* --- Daily Target Allocator & Multi-Day Fraction Management --- */
window.monthlyTargetDailyAllocations = window.monthlyTargetDailyAllocations || {};

window.recalculateDailyAllocationsForChapter = function (subject, chapter, totalSize) {
    const key = subject + '|||' + chapter;
    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};
    const allocations = window.monthlyTargetDailyAllocations[key];
    if (!Array.isArray(allocations) || allocations.length === 0) return;

    const numSize = (totalSize !== null && totalSize !== undefined && totalSize !== '') ? parseInt(totalSize, 10) : null;
    if (isNaN(numSize) || numSize === null || numSize <= 0) {
        allocations.forEach(a => {
            if (a.fraction || a.portionLabel) {
                a.portionSize = null;
            }
        });
        return;
    }

    const n = allocations.length;
    const isUniformSplit = allocations.every((a, idx) => {
        return a.fraction === `1/${n}` || (a.portionLabel && a.portionLabel.startsWith('Part ')) || (!a.fraction && !a.portionSize);
    });

    if (isUniformSplit && n > 0) {
        const base = Math.floor(numSize / n);
        const rem = numSize % n;
        allocations.forEach((a, idx) => {
            a.portionSize = base + (idx < rem ? 1 : 0);
            if (!a.fraction) a.fraction = `1/${n}`;
            if (!a.portionLabel) a.portionLabel = `Part ${idx + 1}/${n}`;
        });
    } else {
        let runningAllocated = 0;
        allocations.forEach((a, idx) => {
            if (a.fraction === '1/2') {
                a.portionSize = Math.round(numSize * 0.5);
            } else if (a.fraction === '1/3') {
                a.portionSize = Math.round(numSize * (1 / 3));
            } else if (a.fraction === '1/4') {
                a.portionSize = Math.round(numSize * 0.25);
            } else if (a.fraction === '1/5') {
                a.portionSize = Math.round(numSize * 0.2);
            } else if (a.fraction === '1/7') {
                a.portionSize = Math.round(numSize * (1 / 7));
            } else if (a.fraction === '1/10') {
                a.portionSize = Math.round(numSize * 0.1);
            } else if (a.fraction === 'All') {
                const remaining = numSize - runningAllocated;
                a.portionSize = Math.max(0, remaining > 0 ? remaining : (runningAllocated === 0 ? numSize : 0));
            } else if (n === 1) {
                a.portionSize = numSize;
                a.fraction = 'All';
                a.portionLabel = 'Full Chapter';
            }
            if (a.portionSize) runningAllocated += parseInt(a.portionSize, 10) || 0;
        });
    }
};

window.handleMonthlyChapterSizeInputChange = function (inputEl) {
    if (!inputEl) return;
    const subject = inputEl.getAttribute('data-subject');
    const chapter = inputEl.getAttribute('data-chapter') || 'Whole Subject';
    const totalSize = inputEl.value ? parseInt(inputEl.value, 10) : null;
    const key = subject + '|||' + chapter;

    if (window.recalculateDailyAllocationsForChapter) {
        window.recalculateDailyAllocationsForChapter(subject, chapter, totalSize);
    }

    const card = document.querySelector(`.mt-daily-target-card[data-daily-target-key="${CSS.escape(key)}"]`);
    if (card && window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key]) {
        const sizeInputs = card.querySelectorAll('.mt-daily-size-input');
        const allocations = window.monthlyTargetDailyAllocations[key];
        allocations.forEach((alloc, idx) => {
            if (sizeInputs[idx]) {
                sizeInputs[idx].value = (alloc.portionSize !== null && alloc.portionSize !== undefined) ? alloc.portionSize : '';
            }
        });
        if (window.updateDailyAllocationBadgesInPlace) {
            window.updateDailyAllocationBadgesInPlace(subject, chapter);
        }
    } else {
        if (window.renderMonthlyTargetDailyAllocations) {
            window.renderMonthlyTargetDailyAllocations();
        }
    }

    if (window.updateMonthlyTargetPageSummary) {
        window.updateMonthlyTargetPageSummary();
    }
};

window.getAssignedWeekKeyForTarget = function (subject, chapter, track = null, program = null) {
    const trackSelector = track ? `[data-track="${CSS.escape(track)}"]` : '';
    const progSelector = program ? `[data-program="${CSS.escape(program)}"]` : '';
    if (chapter === 'Whole Subject') {
        const weekSelect = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(subject)}"]${trackSelector}${progSelector}`) ||
                           document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(subject)}"]`);
        return weekSelect ? weekSelect.value : '';
    } else {
        const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]${trackSelector}${progSelector}`) ||
                           document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
        return weekSelect ? weekSelect.value : '';
    }
};

window.renderMonthlyTargetDailyAllocations = function () {
    const container = document.getElementById('mt-daily-allocations-container');
    const countBadge = document.getElementById('mt-daily-allocation-count-badge');
    if (!container) return;

    const savedScrollTop = container.scrollTop;
    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();

    const checkedTargets = [];
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const track = ws.getAttribute('data-track');
        const prog = ws.getAttribute('data-program');
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({
            track: track,
            program: prog,
            subject: sub,
            chapter: 'Whole Subject',
            displayTitle: `📚 ${sub} (${prog || 'Whole Subject'})`,
            isSubjectTarget: true,
            totalSize: totalSize
        });
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const track = cb.getAttribute('data-track');
        const prog = cb.getAttribute('data-program');
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({
            track: track,
            program: prog,
            subject: sub,
            chapter: ch,
            displayTitle: `${ch}: ${sub}${prog ? ` (${prog})` : ''}`,
            isSubjectTarget: false,
            totalSize: totalSize
        });
    });

    if (checkedTargets.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-8 px-4 text-center text-slate-400 flex flex-col items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <div class="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 shadow-inner">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <span class="text-xs font-black text-slate-600 dark:text-slate-300">No Chapters Selected</span>
                <span class="text-[10px] text-slate-400 max-w-[280px]">Check chapters or whole subjects above to configure daily target dates and fractional allocations.</span>
            </div>
        `;
        if (countBadge) countBadge.textContent = "0 Scheduled";
        return;
    }

    let totalAllocationsCount = 0;
    const scheduledDaysSet = new Set();
    let html = '';

    checkedTargets.forEach((target) => {
        const key = target.subject + '|||' + target.chapter;
        const color = window.getSubjectColor ? window.getSubjectColor(target.subject) : '#6366f1';

        // Recalculate daily allocations if totalSize is present
        if (target.totalSize && target.totalSize > 0 && window.recalculateDailyAllocationsForChapter) {
            window.recalculateDailyAllocationsForChapter(target.subject, target.chapter, target.totalSize);
        }

        const allocations = window.monthlyTargetDailyAllocations[key] || [];

        // Check weeks spanned by this target's daily allocations
        const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(target.subject, target.chapter, target.track, target.program) : '';
        const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];

        let sumAllocated = 0;
        const weeksSpanned = new Set();
        allocations.forEach(a => {
            if (a.portionSize) sumAllocated += parseInt(a.portionSize, 10) || 0;
            if (a.dayKey) {
                scheduledDaysSet.add(a.dayKey);
                const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey, targetMonthDate) : '';
                if (wk) weeksSpanned.add(wk);
            }
            totalAllocationsCount++;
        });

        // Week badge: Multi-week or specific week
        let weekBadgeHtml = '';
        if (weeksSpanned.size > 1) {
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Spanning multiple weeks: ${Array.from(weeksSpanned).join(', ')}">📅 Multi-Week (${weeksSpanned.size}W)</span>`;
        } else if (weeksSpanned.size === 1) {
            const singleWk = Array.from(weeksSpanned)[0];
            const weekRangeDates = singleWk.split(' - ');
            const weekShort = weekRangeDates.length === 2 ? `${weekRangeDates[0]} - ${weekRangeDates[1]}` : singleWk;
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Bound to week ${singleWk}">📅 ${weekShort}</span>`;
        } else if (targetWeekKey) {
            const weekRangeDates = targetWeekKey.split(' - ');
            const weekShort = weekRangeDates.length === 2 ? `${weekRangeDates[0]} - ${weekRangeDates[1]}` : targetWeekKey;
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Bound to week ${targetWeekKey}">📅 ${weekShort}</span>`;
        } else {
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50 flex items-center gap-1" title="No week bound (Monthly only target)">📅 No Week (Month)</span>`;
        }

        // Allocation status badge
        let allocationBadgeHtml = '';
        if (target.totalSize) {
            if (allocations.length === 0) {
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">Size: ${target.totalSize}</span>`;
            } else if (sumAllocated === target.totalSize) {
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">✓ ${sumAllocated}/${target.totalSize} (100%)</span>`;
            } else if (sumAllocated < target.totalSize) {
                const left = target.totalSize - sumAllocated;
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">⏳ ${sumAllocated}/${target.totalSize} (${left} left)</span>`;
            } else {
                const over = sumAllocated - target.totalSize;
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-0.5" title="100% completed + Extra/Repeat target">⭐ ${sumAllocated}/${target.totalSize} (+${over} Extra)</span>`;
            }
        } else {
            allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">${allocations.length} Day(s)</span>`;
        }

        // Generate rows HTML using allDays of the month
        let rowsHtml = '';
        if (allocations.length === 0) {
            rowsHtml = `
                <div class="py-2.5 text-center text-[10px] text-slate-400 italic bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    No days assigned yet. Click "⚡ Split" or "+ Add Day" below.
                </div>
            `;
        } else {
            let runningSum = 0;
            allocations.forEach((alloc, rowIdx) => {
                const prevSum = runningSum;
                const portionVal = parseInt(alloc.portionSize, 10) || 0;
                runningSum += portionVal;

                // Star condition: chapter has totalSize and previous allocations already reached/exceeded 100%
                const isStar = Boolean(target.totalSize && target.totalSize > 0 && prevSum >= target.totalSize);

                let dayOptions = '<option value="">-- Day --</option>';
                if (targetWeekKey) {
                    const weekDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate, targetWeekKey) : [];
                    const weekKeysSet = new Set(weekDays.map(d => d.key));
                    const otherDays = allDays.filter(d => !weekKeysSet.has(d.key));

                    const weekRangeDates = targetWeekKey.split(' - ');
                    const weekShort = weekRangeDates.length === 2 ? `${weekRangeDates[0]} - ${weekRangeDates[1]}` : targetWeekKey;

                    dayOptions += `<optgroup label="📅 Bound Week (${weekShort})">`;
                    weekDays.forEach(d => {
                        const isSel = alloc.dayKey === d.key;
                        dayOptions += `<option value="${d.key}" ${isSel ? 'selected' : ''}>${d.label}</option>`;
                    });
                    dayOptions += `</optgroup>`;

                    if (otherDays.length > 0) {
                        dayOptions += `<optgroup label="📅 Other Month Days (Multi-Week)">`;
                        otherDays.forEach(d => {
                            const isSel = alloc.dayKey === d.key;
                            dayOptions += `<option value="${d.key}" ${isSel ? 'selected' : ''}>${d.label}</option>`;
                        });
                        dayOptions += `</optgroup>`;
                    }
                } else {
                    allDays.forEach(d => {
                        const isSel = alloc.dayKey === d.key;
                        dayOptions += `<option value="${d.key}" ${isSel ? 'selected' : ''}>${d.label}</option>`;
                    });
                }

                const rowBgClass = isStar
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-600/60 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-700/60 shadow-xs';

                const dayBadge = isStar
                    ? `<span class="text-[9.5px] sm:text-[10px] font-black text-amber-500 shrink-0 w-6 sm:w-7 text-center" title="Extra/Repeat Target (Already done 100%)">⭐D${rowIdx + 1}</span>`
                    : `<span class="text-[9.5px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 shrink-0 w-6 sm:w-7 text-center">D${rowIdx + 1}</span>`;

                rowsHtml += `
                    <div class="mt-daily-alloc-row flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl ${rowBgClass} border transition-all w-full min-w-0">
                        <!-- Day Badge -->
                        <div class="order-1 sm:order-1 shrink-0 flex items-center justify-center">
                            ${dayBadge}
                        </div>

                        <!-- Day Select Dropdown -->
                        <select onchange="window.updateDailyAllocationDay('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, this.value, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="mt-daily-day-select order-2 sm:order-2 flex-1 min-w-[85px] sm:min-w-[115px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs truncate cursor-pointer h-8"
                            title="Select Target Day">
                            ${dayOptions}
                        </select>

                        <!-- Portion/Page Size Input -->
                        <div class="relative w-14 sm:w-16 shrink-0 order-3 sm:order-4">
                            <input type="number" min="1" placeholder="Size" value="${(alloc.portionSize !== null && alloc.portionSize !== undefined) ? alloc.portionSize : ''}"
                                oninput="window.updateDailyAllocationSize('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, this.value, this)"
                                onchange="window.renderMonthlyTargetDailyAllocations()"
                                class="mt-daily-size-input w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-1 sm:px-1.5 py-1 text-xs sm:text-sm text-slate-900 dark:text-white font-black outline-none text-center shadow-xs focus:ring-2 focus:ring-emerald-500 h-8"
                                title="Daily Target Pages/Units" />
                        </div>

                        <!-- Remove button -->
                        <button type="button" onclick="window.removeDailyAllocationRow('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx})"
                            class="order-4 sm:order-5 w-7.5 h-7.5 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg sm:rounded-xl transition-all active:scale-90"
                            title="Remove day allocation">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <!-- Fraction Quick Pills: 1/2, 1/3, 1/4, 1/5, 1/10, All (Order 5 on mobile = Full width Line 2; Order 3 on desktop = inline) -->
                        <div class="mt-fraction-pills-group order-5 sm:order-3 w-full basis-full sm:basis-auto sm:w-auto flex items-center gap-0.5 shrink-0 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 mt-1 sm:mt-0">
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 0.5, '1/2')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === '1/2' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate 1/2 of chapter size">1/2</button>
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 0.33333, '1/3')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === '1/3' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate 1/3 of chapter size">1/3</button>
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 0.25, '1/4')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === '1/4' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate 1/4 of chapter size">1/4</button>
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 0.2, '1/5')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === '1/5' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate 1/5 of chapter size">1/5</button>
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 0.1, '1/10')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === '1/10' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate 1/10 of chapter size">1/10</button>
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 1.0, 'All')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === 'All' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate all remaining chapter size">All</button>
                        </div>
                    </div>
                `;
            });
        }

        html += `
            <div class="mt-daily-target-card p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-800 shadow-xs space-y-2 transition-all" data-daily-target-key="${CSS.escape(key)}">
                <!-- Header -->
                <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2 flex-wrap sm:flex-nowrap">
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                        <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style="background-color: ${color}"></span>
                        <h5 class="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">${target.displayTitle}</h5>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0 flex-wrap" data-alloc-badge-key="${CSS.escape(key)}">
                        ${weekBadgeHtml}
                        ${allocationBadgeHtml}
                    </div>
                </div>

                <!-- Action Bar & Split buttons -->
                <div class="flex items-center justify-between gap-1.5 flex-wrap">
                    <div class="grid grid-cols-5 sm:flex items-center gap-1 w-full sm:w-auto flex-1 sm:flex-none">
                        <button type="button" onclick="window.splitChapterAcrossDays('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', 2, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-[9px] font-black transition-all active:scale-95 min-h-[30px] flex items-center justify-center text-center">
                            ⚡ 2<span class="hidden sm:inline"> Days</span><span class="sm:hidden">D</span>
                        </button>
                        <button type="button" onclick="window.splitChapterAcrossDays('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', 3, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-[9px] font-black transition-all active:scale-95 min-h-[30px] flex items-center justify-center text-center">
                            ⚡ 3<span class="hidden sm:inline"> Days</span><span class="sm:hidden">D</span>
                        </button>
                        <button type="button" onclick="window.splitChapterAcrossDays('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', 4, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-[9px] font-black transition-all active:scale-95 min-h-[30px] flex items-center justify-center text-center">
                            ⚡ 4<span class="hidden sm:inline"> Days</span><span class="sm:hidden">D</span>
                        </button>
                        <button type="button" onclick="window.splitChapterAcrossDays('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', 5, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-[9px] font-black transition-all active:scale-95 min-h-[30px] flex items-center justify-center text-center">
                            ⚡ 5<span class="hidden sm:inline"> Days</span><span class="sm:hidden">D</span>
                        </button>
                        <button type="button" onclick="window.splitChapterAcrossDays('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', 7, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-[9px] font-black transition-all active:scale-95 min-h-[30px] flex items-center justify-center text-center">
                            ⚡ 7<span class="hidden sm:inline"> Days</span><span class="sm:hidden">D</span>
                        </button>
                    </div>
                    <button type="button" onclick="window.addDailyAllocationRow('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', '', null, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                        class="w-full sm:w-auto px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/50 text-[9.5px] font-black transition-all active:scale-95 flex items-center justify-center gap-1 min-h-[30px]">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                        <span>Add Day</span>
                    </button>
                </div>

                <!-- Daily Allocation Rows -->
                <div class="space-y-2">
                    ${rowsHtml}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    container.scrollTop = savedScrollTop;
    requestAnimationFrame(() => {
        if (container) container.scrollTop = savedScrollTop;
    });

    if (countBadge) {
        const dayCount = scheduledDaysSet.size;
        countBadge.textContent = totalAllocationsCount > 0
            ? `${totalAllocationsCount} Targets (${dayCount} Days)`
            : "0 Scheduled";
    }

    if (typeof window.updateChapterMultiWeekBadges === 'function') {
        window.updateChapterMultiWeekBadges();
    }
};

window.updateDailyAllocationBadgesInPlace = function (subject, chapter) {
    const key = subject + '|||' + chapter;
    const badgeContainer = document.querySelector(`[data-alloc-badge-key="${CSS.escape(key)}"]`);
    const countBadge = document.getElementById('mt-daily-allocation-count-badge');

    const allocations = (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key]) || [];
    let sumAllocated = 0;
    allocations.forEach(a => {
        if (a.portionSize) sumAllocated += parseInt(a.portionSize, 10) || 0;
    });

    let totalSize = null;
    if (chapter === 'Whole Subject') {
        const wholeSubSizeEl = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]`);
        totalSize = wholeSubSizeEl && wholeSubSizeEl.value ? parseInt(wholeSubSizeEl.value, 10) : null;
    } else {
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
        totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
    }

    if (badgeContainer) {
        const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
        const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(subject, chapter) : '';

        const weeksSpanned = new Set();
        allocations.forEach(a => {
            if (a.dayKey) {
                const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey, targetMonthDate) : '';
                if (wk) weeksSpanned.add(wk);
            }
        });

        let weekBadgeHtml = '';
        if (weeksSpanned.size > 1) {
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Spanning multiple weeks: ${Array.from(weeksSpanned).join(', ')}">📅 Multi-Week (${weeksSpanned.size}W)</span>`;
        } else if (weeksSpanned.size === 1) {
            const singleWk = Array.from(weeksSpanned)[0];
            const weekRangeDates = singleWk.split(' - ');
            const weekShort = weekRangeDates.length === 2 ? `${weekRangeDates[0]} - ${weekRangeDates[1]}` : singleWk;
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Bound to week ${singleWk}">📅 ${weekShort}</span>`;
        } else if (targetWeekKey) {
            const weekRangeDates = targetWeekKey.split(' - ');
            const weekShort = weekRangeDates.length === 2 ? `${weekRangeDates[0]} - ${weekRangeDates[1]}` : targetWeekKey;
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Bound to week ${targetWeekKey}">📅 ${weekShort}</span>`;
        } else {
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50 flex items-center gap-1" title="No week bound (Monthly only target)">📅 No Week (Month)</span>`;
        }

        let allocationBadgeHtml = '';
        if (totalSize) {
            if (allocations.length === 0) {
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">Size: ${totalSize}</span>`;
            } else if (sumAllocated === totalSize) {
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">✓ ${sumAllocated}/${totalSize} (100%)</span>`;
            } else if (sumAllocated < totalSize) {
                const left = totalSize - sumAllocated;
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">⏳ ${sumAllocated}/${totalSize} (${left} left)</span>`;
            } else {
                const over = sumAllocated - totalSize;
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-0.5" title="100% completed + Extra/Repeat target">⭐ ${sumAllocated}/${totalSize} (+${over} Extra)</span>`;
            }
        } else {
            allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">${allocations.length} Day(s)</span>`;
        }

        badgeContainer.innerHTML = weekBadgeHtml + allocationBadgeHtml;
    }

    if (countBadge && window.monthlyTargetDailyAllocations) {
        let totalAllocationsCount = 0;
        const scheduledDaysSet = new Set();
        Object.values(window.monthlyTargetDailyAllocations).forEach(arr => {
            if (Array.isArray(arr)) {
                arr.forEach(a => {
                    if (a.dayKey) scheduledDaysSet.add(a.dayKey);
                    totalAllocationsCount++;
                });
            }
        });
        countBadge.textContent = totalAllocationsCount > 0
            ? `${totalAllocationsCount} Targets (${scheduledDaysSet.size} Days)`
            : "0 Scheduled";
    }

    if (typeof window.updateChapterMultiWeekBadges === 'function') {
        window.updateChapterMultiWeekBadges();
    }
};

window.addDailyAllocationRow = function (subject, chapter, defaultDay = '', defaultSize = null, track = null, program = null) {
    const key = subject + '|||' + chapter;
    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};
    if (!window.monthlyTargetDailyAllocations[key]) window.monthlyTargetDailyAllocations[key] = [];

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(subject, chapter, track, program) : '';
    const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];

    let dayKeyToUse = defaultDay;

    if (targetWeekKey) {
        const weekDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate, targetWeekKey) : [];
        if (weekDays.length > 0) {
            if (dayKeyToUse && weekDays.some(d => d.key === dayKeyToUse)) {
                // keep dayKeyToUse
            } else {
                const currentAllocs = window.monthlyTargetDailyAllocations[key];
                if (currentAllocs.length > 0) {
                    const lastAlloc = currentAllocs[currentAllocs.length - 1];
                    if (lastAlloc && lastAlloc.dayKey) {
                        const lastIdxInWeek = weekDays.findIndex(d => d.key === lastAlloc.dayKey);
                        if (lastIdxInWeek !== -1 && lastIdxInWeek + 1 < weekDays.length) {
                            dayKeyToUse = weekDays[lastIdxInWeek + 1].key;
                        } else {
                            dayKeyToUse = weekDays[0].key;
                        }
                    } else {
                        dayKeyToUse = weekDays[0].key;
                    }
                } else {
                    dayKeyToUse = weekDays[0].key;
                }
            }
        }
    }

    if (!dayKeyToUse && allDays.length > 0) {
        // 1. If this chapter already has allocated rows, pick the next day after the last allocated row
        const currentAllocs = window.monthlyTargetDailyAllocations[key];
        if (currentAllocs.length > 0) {
            const lastAlloc = currentAllocs[currentAllocs.length - 1];
            if (lastAlloc && lastAlloc.dayKey) {
                const lastIdx = allDays.findIndex(d => d.key === lastAlloc.dayKey);
                if (lastIdx !== -1 && lastIdx + 1 < allDays.length) {
                    dayKeyToUse = allDays[lastIdx + 1].key;
                }
            }
        }

        // 2. If this chapter has no rows yet, check the last allocated day of preceding chapters
        if (!dayKeyToUse) {
            const allCheckedKeys = [];
            document.querySelectorAll('.mt-ch-whole-subject:checked').forEach(ws => {
                allCheckedKeys.push(ws.getAttribute('data-subject') + '|||Whole Subject');
            });
            document.querySelectorAll('.mt-chapter-checkbox:checked').forEach(cb => {
                allCheckedKeys.push(cb.getAttribute('data-subject') + '|||' + cb.getAttribute('data-chapter'));
            });

            const currentKeyIdx = allCheckedKeys.indexOf(key);
            if (currentKeyIdx > 0) {
                for (let i = currentKeyIdx - 1; i >= 0; i--) {
                    const prevKey = allCheckedKeys[i];
                    const prevAllocs = window.monthlyTargetDailyAllocations[prevKey];
                    if (Array.isArray(prevAllocs) && prevAllocs.length > 0) {
                        const lastPrev = prevAllocs[prevAllocs.length - 1];
                        if (lastPrev && lastPrev.dayKey) {
                            const lastIdx = allDays.findIndex(d => d.key === lastPrev.dayKey);
                            if (lastIdx !== -1 && lastIdx + 1 < allDays.length) {
                                dayKeyToUse = allDays[lastIdx + 1].key;
                                break;
                            }
                        }
                    }
                }
            }
        }

        // 3. If still not determined, use bulk start date dropdown or first day
        if (!dayKeyToUse) {
            const bulkSelect = document.getElementById('mt-bulk-assign-day-select');
            dayKeyToUse = (bulkSelect && bulkSelect.value) ? bulkSelect.value : (allDays[0] ? allDays[0].key : '');
        }
    } else if (dayKeyToUse && allDays.length > 0 && !allDays.some(d => d.key === dayKeyToUse)) {
        dayKeyToUse = allDays[0].key;
    }

    if (dayKeyToUse && !targetWeekKey) {
        const matchingWeekKey = window.findWeekForDayInMonth(dayKeyToUse, targetMonthDate);
        if (matchingWeekKey) {
            window.bindTargetToWeek(subject, chapter, matchingWeekKey, track, program);
        }
    }

    let sizeToUse = defaultSize;
    if (sizeToUse === null) {
        let totalSize = null;
        if (chapter === 'Whole Subject') {
            const wholeSubSizeEl = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${program ? `[data-program="${CSS.escape(program)}"]` : ''}`) ||
                                   document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]`);
            totalSize = wholeSubSizeEl && wholeSubSizeEl.value ? parseInt(wholeSubSizeEl.value, 10) : null;
        } else {
            const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${program ? `[data-program="${CSS.escape(program)}"]` : ''}`) ||
                              document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
            totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        }
        if (totalSize) {
            const allocatedSum = window.monthlyTargetDailyAllocations[key].reduce((sum, a) => sum + (parseInt(a.portionSize, 10) || 0), 0);
            sizeToUse = Math.max(0, totalSize - allocatedSum) || totalSize;
        }
    }

    window.monthlyTargetDailyAllocations[key].push({
        dayKey: dayKeyToUse,
        portionSize: sizeToUse,
        fraction: '',
        portionLabel: ''
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
};

window.removeDailyAllocationRow = function (subject, chapter, rowIdx) {
    const key = subject + '|||' + chapter;
    if (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key]) {
        window.monthlyTargetDailyAllocations[key].splice(rowIdx, 1);
        window.renderMonthlyTargetDailyAllocations();
        window.updateMonthlyTargetPageSummary();
    }
};

window.splitChapterAcrossDays = function (subject, chapter, numDays, track = null, program = null) {
    const key = subject + '|||' + chapter;
    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};

    let totalSize = null;
    if (chapter === 'Whole Subject') {
        const wholeSubSizeEl = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${program ? `[data-program="${CSS.escape(program)}"]` : ''}`) ||
                               document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]`);
        totalSize = wholeSubSizeEl && wholeSubSizeEl.value ? parseInt(wholeSubSizeEl.value, 10) : null;
    } else {
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${program ? `[data-program="${CSS.escape(program)}"]` : ''}`) ||
                          document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
        totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
    }

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(subject, chapter, track, program) : '';

    if (targetWeekKey) {
        // Chapter is bound to a specific week - allocate strictly within week dates
        const weekDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate, targetWeekKey) : [];
        if (weekDays.length === 0) return;

        const effectiveDays = Math.max(1, Math.min(numDays, weekDays.length));

        // Find starting index within this week by checking preceding chapters in the same week
        let startIdx = 0;
        const allCheckedTargets = [];
        document.querySelectorAll('.mt-ch-whole-subject:checked').forEach(ws => {
            allCheckedTargets.push({
                key: ws.getAttribute('data-subject') + '|||Whole Subject',
                subject: ws.getAttribute('data-subject'),
                chapter: 'Whole Subject',
                track: ws.getAttribute('data-track'),
                program: ws.getAttribute('data-program')
            });
        });
        document.querySelectorAll('.mt-chapter-checkbox:checked').forEach(cb => {
            allCheckedTargets.push({
                key: cb.getAttribute('data-subject') + '|||' + cb.getAttribute('data-chapter'),
                subject: cb.getAttribute('data-subject'),
                chapter: cb.getAttribute('data-chapter'),
                track: cb.getAttribute('data-track'),
                program: cb.getAttribute('data-program')
            });
        });

        const currentIdxInChecked = allCheckedTargets.findIndex(t => t.key === key);
        if (currentIdxInChecked > 0) {
            for (let i = currentIdxInChecked - 1; i >= 0; i--) {
                const prevT = allCheckedTargets[i];
                const prevWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(prevT.subject, prevT.chapter, prevT.track, prevT.program) : '';
                if (prevWeekKey === targetWeekKey) {
                    const prevAllocs = window.monthlyTargetDailyAllocations[prevT.key];
                    if (Array.isArray(prevAllocs) && prevAllocs.length > 0) {
                        const lastPrevAlloc = prevAllocs[prevAllocs.length - 1];
                        if (lastPrevAlloc && lastPrevAlloc.dayKey) {
                            const lastDayIdxInWeek = weekDays.findIndex(d => d.key === lastPrevAlloc.dayKey);
                            if (lastDayIdxInWeek !== -1 && lastDayIdxInWeek + 1 < weekDays.length) {
                                startIdx = lastDayIdxInWeek + 1;
                                break;
                            }
                        }
                    }
                }
            }
        }

        const basePortion = totalSize ? Math.floor(totalSize / effectiveDays) : null;
        const remainder = totalSize ? (totalSize % effectiveDays) : 0;

        const newAllocations = [];
        for (let i = 0; i < effectiveDays; i++) {
            const dayObj = weekDays[Math.min(startIdx + i, weekDays.length - 1)];
            const daySize = basePortion !== null ? (basePortion + (i === 0 ? remainder : 0)) : null;
            newAllocations.push({
                dayKey: dayObj ? dayObj.key : '',
                portionSize: daySize,
                fraction: `1/${effectiveDays}`,
                portionLabel: `Part ${i + 1}/${effectiveDays}`
            });
        }

        window.monthlyTargetDailyAllocations[key] = newAllocations;
        window.renderMonthlyTargetDailyAllocations();
        window.updateMonthlyTargetPageSummary();
        showToast(`⚡ Split across ${effectiveDays} days in bound week successfully!`, "success");
        return;
    }

    // No week bound assigned - divide across month days
    const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];
    if (allDays.length === 0) return;

    const effectiveDays = Math.max(1, Math.min(numDays, allDays.length));

    const bulkSelect = document.getElementById('mt-bulk-assign-day-select');
    const selectedDay = bulkSelect ? bulkSelect.value : '';

    let startIdx = -1;

    // Check if preceding chapters in the DOM list already have allocated days
    const allCheckedKeys = [];
    document.querySelectorAll('.mt-ch-whole-subject:checked').forEach(ws => {
        allCheckedKeys.push(ws.getAttribute('data-subject') + '|||Whole Subject');
    });
    document.querySelectorAll('.mt-chapter-checkbox:checked').forEach(cb => {
        allCheckedKeys.push(cb.getAttribute('data-subject') + '|||' + cb.getAttribute('data-chapter'));
    });

    const currentKeyIdx = allCheckedKeys.indexOf(key);
    if (currentKeyIdx > 0) {
        for (let i = currentKeyIdx - 1; i >= 0; i--) {
            const prevKey = allCheckedKeys[i];
            const prevAllocs = window.monthlyTargetDailyAllocations[prevKey];
            if (Array.isArray(prevAllocs) && prevAllocs.length > 0) {
                const lastAlloc = prevAllocs[prevAllocs.length - 1];
                if (lastAlloc && lastAlloc.dayKey) {
                    const lastDayIdx = allDays.findIndex(d => d.key === lastAlloc.dayKey);
                    if (lastDayIdx !== -1 && lastDayIdx + 1 < allDays.length) {
                        startIdx = lastDayIdx + 1;
                        break;
                    }
                }
            }
        }
    }

    if (startIdx === -1 && selectedDay) {
        startIdx = allDays.findIndex(d => d.key === selectedDay);
    }

    if (startIdx === -1) {
        const todayStr = (window.Utils && Utils.formatDate) ? Utils.formatDate(new Date()) : new Date().toISOString().split('T')[0];
        startIdx = allDays.findIndex(d => d.key === todayStr);
        if (startIdx === -1 || startIdx + effectiveDays > allDays.length) startIdx = 0;
    }

    const basePortion = totalSize ? Math.floor(totalSize / effectiveDays) : null;
    const remainder = totalSize ? (totalSize % effectiveDays) : 0;

    const newAllocations = [];
    for (let i = 0; i < effectiveDays; i++) {
        const dayObj = allDays[Math.min(startIdx + i, allDays.length - 1)];
        const daySize = basePortion !== null ? (basePortion + (i === 0 ? remainder : 0)) : null;
        newAllocations.push({
            dayKey: dayObj ? dayObj.key : '',
            portionSize: daySize,
            fraction: `1/${effectiveDays}`,
            portionLabel: `Part ${i + 1}/${effectiveDays}`
        });
    }

    window.monthlyTargetDailyAllocations[key] = newAllocations;
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    showToast(`⚡ Split across ${effectiveDays} days successfully!`, "success");
};

window.splitAllChaptersAcrossDays = function (numDays) {
    const checkedTargets = [];
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const track = ws.getAttribute('data-track');
        const prog = ws.getAttribute('data-program');
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: 'Whole Subject', totalSize: totalSize });
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const track = cb.getAttribute('data-track');
        const prog = cb.getAttribute('data-program');
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: ch, totalSize: totalSize });
    });

    if (checkedTargets.length === 0) {
        return showToast("Please check at least one chapter or whole subject first.", "error");
    }

    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];
    if (allDays.length === 0) return showToast("No days available in the active month.", "error");

    const todayStr = (window.Utils && Utils.formatDate) ? Utils.formatDate(new Date()) : new Date().toISOString().split('T')[0];
    const bulkSelect = document.getElementById('mt-bulk-assign-day-select');
    const selectedDay = bulkSelect ? bulkSelect.value : '';

    let currentMonthDayIdx = selectedDay ? allDays.findIndex(d => d.key === selectedDay) : -1;
    if (currentMonthDayIdx === -1) {
        currentMonthDayIdx = allDays.findIndex(d => d.key === todayStr);
        if (currentMonthDayIdx === -1) currentMonthDayIdx = 0;
    }

    const weekCurrentIndices = {};
    let totalAllocationsCount = 0;

    checkedTargets.forEach(target => {
        const key = target.subject + '|||' + target.chapter;
        const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(target.subject, target.chapter, target.track, target.program) : '';

        if (targetWeekKey) {
            const weekDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate, targetWeekKey) : [];
            if (weekDays.length > 0) {
                const effectiveDays = Math.max(1, Math.min(numDays, weekDays.length));
                const totalSize = target.totalSize;
                const basePortion = totalSize ? Math.floor(totalSize / effectiveDays) : null;
                const remainder = totalSize ? (totalSize % effectiveDays) : 0;

                let startIdx = weekCurrentIndices[targetWeekKey] || 0;
                if (startIdx >= weekDays.length) startIdx = 0;

                const newAllocations = [];
                for (let i = 0; i < effectiveDays; i++) {
                    const dayObj = weekDays[Math.min(startIdx + i, weekDays.length - 1)];
                    const daySize = basePortion !== null ? (basePortion + (i === 0 ? remainder : 0)) : null;
                    newAllocations.push({
                        dayKey: dayObj ? dayObj.key : '',
                        portionSize: daySize,
                        fraction: `1/${effectiveDays}`,
                        portionLabel: `Part ${i + 1}/${effectiveDays}`
                    });
                    totalAllocationsCount++;
                }
                weekCurrentIndices[targetWeekKey] = (startIdx + effectiveDays) % weekDays.length;
                window.monthlyTargetDailyAllocations[key] = newAllocations;
                return;
            }
        }

        // Unassigned to week - divide across month
        const effectiveDays = Math.max(1, Math.min(numDays, allDays.length));
        const totalSize = target.totalSize;
        const basePortion = totalSize ? Math.floor(totalSize / effectiveDays) : null;
        const remainder = totalSize ? (totalSize % effectiveDays) : 0;

        const newAllocations = [];
        for (let i = 0; i < effectiveDays; i++) {
            const dayObj = allDays[Math.min(currentMonthDayIdx, allDays.length - 1)];
            const daySize = basePortion !== null ? (basePortion + (i === 0 ? remainder : 0)) : null;
            newAllocations.push({
                dayKey: dayObj ? dayObj.key : '',
                portionSize: daySize,
                fraction: `1/${effectiveDays}`,
                portionLabel: `Part ${i + 1}/${effectiveDays}`
            });
            currentMonthDayIdx++;
            totalAllocationsCount++;
        }

        window.monthlyTargetDailyAllocations[key] = newAllocations;
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    showToast(`⚡ Distributed ${checkedTargets.length} target(s) across ${totalAllocationsCount} total days!`, "success");
};

window.updateDailyAllocationDay = function (subject, chapter, rowIdx, dayKey, track = null, program = null) {
    const key = subject + '|||' + chapter;
    if (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key] && window.monthlyTargetDailyAllocations[key][rowIdx]) {
        window.monthlyTargetDailyAllocations[key][rowIdx].dayKey = dayKey;

        if (dayKey && rowIdx === 0) {
            const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
            const matchingWeekKey = window.findWeekForDayInMonth(dayKey, targetMonthDate);
            if (matchingWeekKey) {
                window.bindTargetToWeek(subject, chapter, matchingWeekKey, track, program);
            }
        }

        window.renderMonthlyTargetDailyAllocations();
        window.updateMonthlyTargetPageSummary();
    }
};

window.updateDailyAllocationSize = function (subject, chapter, rowIdx, sizeVal, inputEl) {
    const key = subject + '|||' + chapter;
    if (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key] && window.monthlyTargetDailyAllocations[key][rowIdx]) {
        window.monthlyTargetDailyAllocations[key][rowIdx].portionSize = sizeVal ? parseInt(sizeVal, 10) : null;
        window.monthlyTargetDailyAllocations[key][rowIdx].fraction = '';
        window.monthlyTargetDailyAllocations[key][rowIdx].portionLabel = '';

        // Deselect fraction pills in this row without destroying DOM or losing focus
        if (inputEl) {
            const rowEl = inputEl.closest('.mt-daily-alloc-row');
            if (rowEl) {
                rowEl.querySelectorAll('button[onclick*="applyFractionToDailyAllocation"]').forEach(btn => {
                    btn.className = btn.className.replace(/bg-emerald-600\s+text-white\s+shadow-xs/g, 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400');
                });
            }
        }

        window.updateDailyAllocationBadgesInPlace(subject, chapter);
        window.updateMonthlyTargetPageSummary();
    }
};

window.applyFractionToDailyAllocation = function (subject, chapter, rowIdx, fractionVal, fractionLabel) {
    const key = subject + '|||' + chapter;
    if (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key] && window.monthlyTargetDailyAllocations[key][rowIdx]) {
        let totalSize = null;
        if (chapter === 'Whole Subject') {
            const wholeSubSizeEl = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]`);
            totalSize = wholeSubSizeEl && wholeSubSizeEl.value ? parseInt(wholeSubSizeEl.value, 10) : null;
        } else {
            const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
            totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        }

        let calculatedSize = null;
        if (fractionLabel === 'All') {
            if (totalSize !== null) {
                // Calculate remaining size: totalSize minus sum of other day rows
                const otherRowsSum = window.monthlyTargetDailyAllocations[key].reduce((sum, a, idx) => {
                    if (idx === rowIdx) return sum;
                    return sum + (parseInt(a.portionSize, 10) || 0);
                }, 0);
                const remaining = totalSize - otherRowsSum;
                calculatedSize = remaining > 0 ? remaining : (otherRowsSum === 0 ? totalSize : 0);
            }
        } else {
            calculatedSize = totalSize ? Math.round(totalSize * fractionVal) : null;
        }

        window.monthlyTargetDailyAllocations[key][rowIdx].portionSize = calculatedSize;
        window.monthlyTargetDailyAllocations[key][rowIdx].fraction = fractionLabel;
        window.monthlyTargetDailyAllocations[key][rowIdx].portionLabel = fractionLabel === 'All' ? 'All Remaining' : `Fraction ${fractionLabel}`;
        window.renderMonthlyTargetDailyAllocations();
        window.updateMonthlyTargetPageSummary();
    }
};

window.autoSpreadAllChaptersAcrossDays = function (mode = 'month') {
    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];
    if (allDays.length === 0) return showToast("No days available in the active month.", "error");

    const bulkSelect = document.getElementById('mt-bulk-assign-day-select');
    const selectedStartDay = bulkSelect ? bulkSelect.value : '';
    let startIdx = selectedStartDay ? allDays.findIndex(d => d.key === selectedStartDay) : 0;
    if (startIdx === -1) startIdx = 0;

    const checkedTargets = [];
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const track = ws.getAttribute('data-track');
        const prog = ws.getAttribute('data-program');
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: 'Whole Subject', totalSize: totalSize });
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const track = cb.getAttribute('data-track');
        const prog = cb.getAttribute('data-program');
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: ch, totalSize: totalSize });
    });

    if (checkedTargets.length === 0) {
        return showToast("Please check at least one chapter or whole subject first.", "error");
    }

    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};

    let currentDayIdx = startIdx;
    let totalAllocationsSpread = 0;

    checkedTargets.forEach(target => {
        const key = target.subject + '|||' + target.chapter;
        let existingAllocs = window.monthlyTargetDailyAllocations[key];

        if (!Array.isArray(existingAllocs) || existingAllocs.length === 0) {
            const assignedDay = allDays[Math.min(currentDayIdx, allDays.length - 1)];
            const assignedDayKey = assignedDay ? assignedDay.key : '';

            window.monthlyTargetDailyAllocations[key] = [{
                dayKey: assignedDayKey,
                portionSize: target.totalSize,
                fraction: 'All',
                portionLabel: 'Full Chapter'
            }];

            currentDayIdx++;
            totalAllocationsSpread++;
        } else {
            existingAllocs.forEach((row) => {
                const assignedDay = allDays[Math.min(currentDayIdx, allDays.length - 1)];
                const assignedDayKey = assignedDay ? assignedDay.key : '';

                row.dayKey = assignedDayKey;

                currentDayIdx++;
                totalAllocationsSpread++;
            });
        }
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    showToast(`⚡ Auto-spread ${totalAllocationsSpread} allocation(s) across days!`, "success");
};

window.spreadAllChaptersFromStartDate = function () {
    const bulkSelect = document.getElementById('mt-bulk-assign-day-select');
    const selectedDay = bulkSelect ? bulkSelect.value : '';
    if (!selectedDay) {
        return showToast("Please select a start date from the dropdown first.", "error");
    }

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];
    if (allDays.length === 0) {
        return showToast("No days available in the active month.", "error");
    }

    let startIdx = allDays.findIndex(d => d.key === selectedDay);
    if (startIdx === -1) startIdx = 0;

    const checkedTargets = [];
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const track = ws.getAttribute('data-track');
        const prog = ws.getAttribute('data-program');
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: 'Whole Subject', totalSize: totalSize });
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const track = cb.getAttribute('data-track');
        const prog = cb.getAttribute('data-program');
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: ch, totalSize: totalSize });
    });

    if (checkedTargets.length === 0) {
        return showToast("Please check at least one chapter or whole subject first.", "error");
    }

    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};

    let currentDayIdx = startIdx;
    let totalAllocationsSpread = 0;

    checkedTargets.forEach(target => {
        const key = target.subject + '|||' + target.chapter;
        let existingAllocs = window.monthlyTargetDailyAllocations[key];

        if (!Array.isArray(existingAllocs) || existingAllocs.length === 0) {
            const assignedDay = allDays[Math.min(currentDayIdx, allDays.length - 1)];
            const assignedDayKey = assignedDay ? assignedDay.key : '';

            window.monthlyTargetDailyAllocations[key] = [{
                dayKey: assignedDayKey,
                portionSize: target.totalSize,
                fraction: 'All',
                portionLabel: 'Full Chapter'
            }];

            currentDayIdx++;
            totalAllocationsSpread++;
        } else {
            existingAllocs.forEach((row) => {
                const assignedDay = allDays[Math.min(currentDayIdx, allDays.length - 1)];
                const assignedDayKey = assignedDay ? assignedDay.key : '';

                row.dayKey = assignedDayKey;

                currentDayIdx++;
                totalAllocationsSpread++;
            });
        }
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();

    const startDayObj = allDays[startIdx];
    const startLabel = startDayObj ? startDayObj.label : selectedDay;
    showToast(`⚡ Spread ${totalAllocationsSpread} allocation(s) across days starting from ${startLabel}!`, "success");
};

// Backward compatibility alias
window.applyBulkDayToAllChapters = function () {
    if (typeof window.spreadAllChaptersFromStartDate === 'function') {
        window.spreadAllChaptersFromStartDate();
    }
};

window.clearAllDailyAllocations = function () {
    window.monthlyTargetDailyAllocations = {};
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    showToast("All daily target allocations cleared.", "success");
};

window.updateMonthlyTargetPageSummary = function () {
    const checkedSubjects = Array.from(document.querySelectorAll('.mt-subject-checkbox:checked')).map(cb => cb.getAttribute('data-subject'));
    const badgeCount = document.getElementById('mt-subjects-count-badge');
    if (badgeCount) {
        badgeCount.textContent = `${checkedSubjects.length} Selected`;
    }

    const dropdownLabel = document.getElementById('mt-subjects-dropdown-label');
    if (dropdownLabel) {
        if (checkedSubjects.length === 0) {
            dropdownLabel.textContent = 'Select Subjects...';
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 truncate block';
        } else if (checkedSubjects.length === 1) {
            dropdownLabel.textContent = `${checkedSubjects[0]}`;
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate block';
        } else {
            dropdownLabel.textContent = `${checkedSubjects.length} Selected: ${checkedSubjects.join(', ')}`;
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate block';
        }
    }

    const summarySubject = document.getElementById('mt-summary-subject-display');
    const summaryTargetCount = document.getElementById('mt-summary-target-count');
    const summaryTotalSize = document.getElementById('mt-summary-total-size');
    const bottomSummary = document.getElementById('mt-bottom-summary-text');

    if (summarySubject) {
        if (checkedSubjects.length === 0) {
            summarySubject.textContent = 'None Selected';
        } else if (checkedSubjects.length === 1) {
            summarySubject.textContent = `${checkedSubjects[0]}`;
        } else {
            summarySubject.textContent = `${checkedSubjects.length} Subjects (${checkedSubjects.join(', ')})`;
        }
    }

    let checkedCount = 0;
    let totalSizeSum = 0;
    const weekCountMap = {};

    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        checkedCount++;
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        const weekSelect = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(sub)}"]`);
        if (sizeInput && sizeInput.value) {
            totalSizeSum += parseInt(sizeInput.value, 10) || 0;
        }
        if (weekSelect && weekSelect.value) {
            weekCountMap[weekSelect.value] = (weekCountMap[weekSelect.value] || 0) + 1;
        }
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        checkedCount++;
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        if (sizeInput && sizeInput.value) {
            totalSizeSum += parseInt(sizeInput.value, 10) || 0;
        }
        if (weekSelect && weekSelect.value) {
            weekCountMap[weekSelect.value] = (weekCountMap[weekSelect.value] || 0) + 1;
        }
    });

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];
    const weekBreakdown = [];
    weeks.forEach((w, idx) => {
        if (weekCountMap[w.key]) {
            weekBreakdown.push(`W${idx + 1}: ${weekCountMap[w.key]}`);
        }
    });

    // Daily breakdown count
    let scheduledDaysCount = 0;
    let scheduledTargetsCount = 0;
    const daysSet = new Set();
    if (window.monthlyTargetDailyAllocations) {
        Object.values(window.monthlyTargetDailyAllocations).forEach(arr => {
            if (Array.isArray(arr)) {
                arr.forEach(a => {
                    if (a.dayKey) {
                        daysSet.add(a.dayKey);
                        scheduledTargetsCount++;
                    }
                });
            }
        });
    }
    scheduledDaysCount = daysSet.size;

    if (summaryTargetCount) {
        const weekInfo = weekBreakdown.length > 0 ? ` (${weekBreakdown.join(', ')})` : '';
        const dayInfo = scheduledTargetsCount > 0 ? ` • ${scheduledTargetsCount} Day Target(s)` : '';
        summaryTargetCount.textContent = checkedCount === 1 ? `1 Target Selected${weekInfo}${dayInfo}` : `${checkedCount} Targets Selected${weekInfo}${dayInfo}`;
    }
    if (summaryTotalSize) {
        summaryTotalSize.textContent = totalSizeSum > 0 ? `${totalSizeSum} Pages / Units` : 'No Size Specified';
    }
    if (bottomSummary) {
        if (checkedCount === 0) {
            bottomSummary.textContent = 'Select at least 1 chapter or whole subject across your chosen subjects to create targets.';
        } else {
            const subLabel = checkedSubjects.length === 1 ? '1 subject' : `${checkedSubjects.length} subjects`;
            const weekStr = weekBreakdown.length > 0 ? ` • Weekly: ${weekBreakdown.join(', ')}` : '';
            const dayStr = scheduledDaysCount > 0 ? ` • ${scheduledTargetsCount} Daily Target(s) across ${scheduledDaysCount} day(s)` : '';
            bottomSummary.innerHTML = `<strong>${checkedCount} target(s) selected</strong> across ${subLabel} • ${totalSizeSum > 0 ? totalSizeSum + ' total pages/units' : 'Custom scope'}${weekStr}${dayStr}`;
        }
    }
};

window.applyBulkSizeToMonthlyChapters = function () {
    const bulkInput = document.getElementById('mt-bulk-size-input');
    const bulkVal = bulkInput && bulkInput.value ? bulkInput.value : '';
    if (!bulkVal) {
        return showToast("Please enter a bulk size number first.", "error");
    }

    let appliedCount = 0;
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        if (sizeInput) {
            sizeInput.value = bulkVal;
            appliedCount++;
            if (window.recalculateDailyAllocationsForChapter) {
                window.recalculateDailyAllocationsForChapter(sub, 'Whole Subject', bulkVal);
            }
        }
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        if (sizeInput) {
            sizeInput.value = bulkVal;
            appliedCount++;
            if (window.recalculateDailyAllocationsForChapter) {
                window.recalculateDailyAllocationsForChapter(sub, ch, bulkVal);
            }
        }
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();

    if (appliedCount === 0) {
        showToast("No chapters or whole subjects currently selected. Check the targets you want to apply size to.", "error");
    } else {
        showToast(`Bulk size (${bulkVal}) applied to ${appliedCount} selected target(s)!`, "success");
    }
};

window.getWeeksForMonth = function (date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let curDay = 1;

    while (curDay <= totalDays) {
        const start = new Date(year, month, curDay, 0, 1, 0, 0);
        let endDay = curDay;

        while (endDay < totalDays) {
            const checkDate = new Date(year, month, endDay);
            if (checkDate.getDay() === 5) { // Friday
                break;
            }
            endDay++;
        }

        const end = new Date(year, month, endDay, 23, 59, 59, 999);
        const weekKey = window.formatDateRangeKey(start, end);
        const opt = { day: '2-digit', month: 'short' };
        const label = `Week ${weeks.length + 1}: ${start.toLocaleDateString('en-GB', opt)} - ${end.toLocaleDateString('en-GB', opt)}`;

        weeks.push({
            key: weekKey,
            start: start,
            end: end,
            label: label
        });

        curDay = endDay + 1;
    }

    return weeks;
};

window.getDaysForMonthOrWeek = function (monthDate = new Date(), weekKey = null) {
    const days = [];
    if (weekKey && weekKey !== 'none' && weekKey !== '') {
        const dates = weekKey.split(' - ');
        if (dates.length === 2) {
            const start = Utils.parseDateSafe ? Utils.parseDateSafe(dates[0]) : new Date(dates[0]);
            const end = Utils.parseDateSafe ? Utils.parseDateSafe(dates[1]) : new Date(dates[1]);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const targetMonth = monthDate ? new Date(monthDate).getMonth() : start.getMonth();
                const targetYear = monthDate ? new Date(monthDate).getFullYear() : start.getFullYear();

                let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

                while (cur <= endDay) {
                    if (monthDate && (cur.getMonth() !== targetMonth || cur.getFullYear() !== targetYear)) {
                        cur.setDate(cur.getDate() + 1);
                        continue;
                    }
                    const dayDate = new Date(cur);
                    const dateKey = Utils.formatDate(dayDate);
                    const dayStr = dayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    const wkStr = dayDate.toLocaleDateString('en-GB', { weekday: 'short' });
                    const label = `${dayStr} (${wkStr})`;
                    days.push({ key: dateKey, rawDate: dayDate, label: label });

                    cur.setDate(cur.getDate() + 1);
                }
                return days;
            }
        }
    }

    const d = new Date(monthDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= totalDays; day++) {
        const dayDate = new Date(year, month, day);
        const dateKey = Utils.formatDate(dayDate);
        const dayStr = dayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const wkStr = dayDate.toLocaleDateString('en-GB', { weekday: 'short' });
        const label = `${dayStr} (${wkStr})`;
        days.push({ key: dateKey, rawDate: dayDate, label: label });
    }
    return days;
};

window.populateMonthlyTargetWeeksAndDays = function (monthDate = new Date(), selectedWeekKey = null, selectedDayKey = null) {
    const weekSelect = document.getElementById('mt-select-week-range');
    const daySelect = document.getElementById('mt-select-day');
    const bulkDaySelect = document.getElementById('mt-bulk-assign-day-select');

    const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(monthDate) : [];
    if (weekSelect) {
        weekSelect.innerHTML = '<option value="">-- None (Only Monthly Target) --</option>';
        weeks.forEach(w => {
            weekSelect.innerHTML += `<option value="${w.key}">${w.label}</option>`;
        });
        if (selectedWeekKey && weeks.some(w => w.key === selectedWeekKey)) {
            weekSelect.value = selectedWeekKey;
        } else {
            weekSelect.value = '';
        }
    }

    const days = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(monthDate) : [];
    if (bulkDaySelect) {
        const prevBulkVal = bulkDaySelect.value;
        bulkDaySelect.innerHTML = '<option value="">-- Choose Start Date --</option>';
        days.forEach(d => {
            bulkDaySelect.innerHTML += `<option value="${d.key}">${d.label}</option>`;
        });
        if (prevBulkVal && days.some(d => d.key === prevBulkVal)) {
            bulkDaySelect.value = prevBulkVal;
        }
    }

    if (daySelect) {
        daySelect.innerHTML = '<option value="">-- None (Not Assigned to Day) --</option>';
        days.forEach(d => {
            daySelect.innerHTML += `<option value="${d.key}">${d.label}</option>`;
        });
        if (selectedDayKey && days.some(d => d.key === selectedDayKey)) {
            daySelect.value = selectedDayKey;
        } else {
            daySelect.value = '';
        }
    }

    window.renderMonthlyTargetDailyAllocations();
};

window.updateMonthlyTargetDaysDropdown = function (monthDate = new Date(), weekKey = null, selectedDayKey = null) {
    const daySelect = document.getElementById('mt-select-day');
    if (!daySelect) return;

    const days = window.getDaysForMonthOrWeek(monthDate, weekKey);
    daySelect.innerHTML = '<option value="">-- None (Not Assigned to Day) --</option>';
    days.forEach(d => {
        daySelect.innerHTML += `<option value="${d.key}">${d.label}</option>`;
    });

    if (selectedDayKey && days.some(d => d.key === selectedDayKey)) {
        daySelect.value = selectedDayKey;
    } else {
        daySelect.value = '';
    }
};

window.handleMonthlyTargetWeekChange = function () {
    const weekSelect = document.getElementById('mt-select-week-range');
    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const weekKey = weekSelect ? weekSelect.value : null;
    window.updateMonthlyTargetDaysDropdown(targetMonthDate, weekKey, null);
};

window.handleMonthlyTargetDayChange = function () {
    const daySelect = document.getElementById('mt-select-day');
    const weekSelect = document.getElementById('mt-select-week-range');
    if (!daySelect || !weekSelect) return;

    const dayKey = daySelect.value;
    if (dayKey && (!weekSelect.value || weekSelect.value === '')) {
        const d = window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(dayKey) : Utils.parseDateSafe(dayKey);
        if (d && !isNaN(d.getTime())) {
            const range = window.getWeeklyTargetRange(d);
            const weekKey = window.formatDateRangeKey(range.start, range.end);
            if (Array.from(weekSelect.options).some(o => o.value === weekKey)) {
                weekSelect.value = weekKey;
            }
        }
    }
};

window.addMonthlyTarget = function () {
    const range = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate || new Date());
    const targetMonthKey = window.formatMonthRangeKey(range.start, range.end);

    const checkedSubjectCbs = Array.from(document.querySelectorAll('.mt-subject-checkbox:checked'));
    if (checkedSubjectCbs.length === 0) {
        return showToast("Please select at least one program and subject on the left.", "error");
    }

    if (!window.monthlyTargetsDatabase) window.monthlyTargetsDatabase = {};
    if (!window.monthlyTargetsDatabase[targetMonthKey]) window.monthlyTargetsDatabase[targetMonthKey] = [];

    const weekSelectEl = document.getElementById('mt-select-week-range');
    const selectedWeekKey = weekSelectEl ? weekSelectEl.value : '';
    const daySelectEl = document.getElementById('mt-select-day');
    const selectedDayKey = daySelectEl ? daySelectEl.value : '';

    // Collect targets to add across all checked subjects
    const targetsToAdd = [];

    checkedSubjectCbs.forEach(subCb => {
        const trackId = subCb.getAttribute('data-track');
        const progName = subCb.getAttribute('data-program');
        const subject = subCb.getAttribute('data-subject');

        // 1. Whole Subject for this subject
        const wholeSubCheckbox = document.querySelector(`.mt-ch-whole-subject[data-subject="${CSS.escape(subject)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
        const wholeSubSizeEl = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
        const wholeSubWeekEl = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(subject)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
        if (wholeSubCheckbox && wholeSubCheckbox.checked) {
            const totalSize = wholeSubSizeEl && wholeSubSizeEl.value ? parseInt(wholeSubSizeEl.value, 10) : null;
            const weekKey = (wholeSubWeekEl ? wholeSubWeekEl.value : selectedWeekKey) || null;
            targetsToAdd.push({
                track: trackId,
                program: progName,
                subject: subject,
                chapter: 'Whole Subject',
                targetType: 'subject',
                scope: 'Whole Subject',
                totalChapterSize: totalSize,
                targetWeek: weekKey
            });
        }

        // 2. Individual Chapters for this subject
        const checkedBoxes = document.querySelectorAll(`.mt-chapter-checkbox:checked[data-subject="${CSS.escape(subject)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
        checkedBoxes.forEach(cb => {
            const ch = cb.getAttribute('data-chapter');
            const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(ch)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
            const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(ch)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
            const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
            const weekKey = (weekSelect ? weekSelect.value : selectedWeekKey) || null;
            targetsToAdd.push({
                track: trackId,
                program: progName,
                subject: subject,
                chapter: ch,
                targetType: 'chapter',
                scope: 'Whole Chapter',
                totalChapterSize: totalSize,
                targetWeek: weekKey
            });
        });
    });

    if (targetsToAdd.length === 0) {
        return showToast("Please select at least one chapter or whole subject target (minimum 1 is required).", "error");
    }

    let addedCount = 0;
    let skippedDuplicateCount = 0;
    let connectedToWeek = false;
    let connectedToDay = false;
    const addedSubjectsSet = new Set();
    const connectedWeeksSet = new Set();
    const connectedDaysSet = new Set();
    let totalDailyAllocationsAdded = 0;

    targetsToAdd.forEach(item => {
        const trackId = item.track;
        const progName = item.program;
        const isSubjectTarget = item.targetType === 'subject';
        const subject = item.subject;
        const finalChapter = item.chapter;

        if (window.isSubjectPassed && window.isSubjectPassed(trackId, subject, progName)) {
            return;
        }

        if (!isSubjectTarget && window.isChapterSkipped && window.isChapterSkipped(trackId, subject, finalChapter)) {
            return;
        }

        // Duplicate check
        if (isSubjectTarget) {
            const exists = window.monthlyTargetsDatabase[targetMonthKey].some(t =>
                t.track === trackId && t.program === progName && t.subject === subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters')
            );
            if (exists) {
                skippedDuplicateCount++;
                return;
            }
        } else {
            const exists = window.monthlyTargetsDatabase[targetMonthKey].some(t =>
                t.track === trackId && t.program === progName && t.subject === subject && t.chapter === finalChapter && t.targetType !== 'subject'
            );
            if (exists) {
                skippedDuplicateCount++;
                return;
            }
        }

        // Baseline completion status
        let isCompletedBefore = false;
        let completedAtBefore = null;

        if (isSubjectTarget) {
            isCompletedBefore = window.isSubjectCompleted ? window.isSubjectCompleted(trackId, subject) : false;
            completedAtBefore = isCompletedBefore ? new Date().toISOString() : null;
        } else {
            const foundTask = window.findTaskChapter(trackId, subject, finalChapter);
            isCompletedBefore = foundTask ? (foundTask.subTask.completed || false) : false;
            completedAtBefore = foundTask ? (foundTask.subTask.completedAt || null) : null;
        }

        const mtId = item.id || `mt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        window.monthlyTargetsDatabase[targetMonthKey].push({
            id: mtId,
            track: trackId,
            program: progName,
            subject: subject,
            chapter: finalChapter,
            targetType: item.targetType,
            completed: isCompletedBefore,
            completedAt: completedAtBefore,
            scope: item.scope,
            totalChapterSize: item.totalChapterSize,
            targetWeek: item.targetWeek || null,
            updatedAt: Date.now()
        });
        addedCount++;
        addedSubjectsSet.add(subject);

        // Auto-connect to Weekly Targets (derived from daily allocations if present, otherwise item's selected targetWeek)
        const allocKey = subject + '|||' + finalChapter;
        const dailyAllocs = (window.monthlyTargetDailyAllocations && (window.monthlyTargetDailyAllocations[allocKey] || window.monthlyTargetDailyAllocations[subject + '|||' + finalChapter + '|||' + progName])) || [];

        const targetWeeksSet = new Set();
        if (dailyAllocs.length > 0) {
            dailyAllocs.forEach(a => {
                if (a.dayKey) {
                    const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey, range.start) : '';
                    if (wk) targetWeeksSet.add(wk);
                }
            });
        }
        if (targetWeeksSet.size === 0 && item.targetWeek) {
            targetWeeksSet.add(item.targetWeek);
        }

        const monthWeeksList = window.getWeeksForMonth ? window.getWeeksForMonth(range.start) : [];
        const spannedWeekNums = [];
        monthWeeksList.forEach((mw, idx) => {
            if (targetWeeksSet.has(mw.key)) {
                spannedWeekNums.push(`W${idx + 1}`);
            }
        });

        targetWeeksSet.forEach(targetWeekKey => {
            const canonicalWeekKey = window.getCanonicalWeeklyRangeKey ? (window.getCanonicalWeeklyRangeKey(targetWeekKey) || targetWeekKey) : targetWeekKey;
            if (!window.weeklyTargetsDatabase) window.weeklyTargetsDatabase = {};
            if (!window.weeklyTargetsDatabase[canonicalWeekKey]) window.weeklyTargetsDatabase[canonicalWeekKey] = [];

            const wtList = window.weeklyTargetsDatabase[canonicalWeekKey];
            const wtExists = isSubjectTarget
                ? wtList.some(t => t.track === trackId && t.program === progName && t.subject === subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters'))
                : wtList.some(t => t.track === trackId && t.program === progName && t.subject === subject && t.chapter === finalChapter && t.targetType !== 'subject');

            if (!wtExists) {
                wtList.push({
                    id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    monthlyTargetId: mtId,
                    source: 'monthly',
                    targetMonth: targetMonthKey,
                    track: trackId,
                    program: progName,
                    subject: subject,
                    chapter: finalChapter,
                    targetType: item.targetType,
                    completed: isCompletedBefore,
                    completedAt: completedAtBefore,
                    scope: item.scope,
                    totalChapterSize: item.totalChapterSize,
                    targetWeek: targetWeekKey,
                    dividedWeekKey: targetWeekKey,
                    spannedWeekNums: spannedWeekNums,
                    isMultiWeek: spannedWeekNums.length > 1,
                    updatedAt: Date.now()
                });
                connectedToWeek = true;
                connectedWeeksSet.add(canonicalWeekKey);
            }
        });

        if (dailyAllocs.length > 0) {
            let runningSum = 0;
            dailyAllocs.forEach(alloc => {
                if (alloc.dayKey) {
                    if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};
                    if (!window.dailyTargetsDatabase[alloc.dayKey]) window.dailyTargetsDatabase[alloc.dayKey] = [];

                    const prevSum = runningSum;
                    const portionSize = alloc.portionSize || item.totalChapterSize;
                    runningSum += (parseInt(portionSize, 10) || 0);

                    const isStar = Boolean(item.totalChapterSize && item.totalChapterSize > 0 && prevSum >= item.totalChapterSize);
                    const portionLabel = alloc.portionLabel || (isStar ? '⭐ Extra Setup' : (alloc.fraction ? `Fraction ${alloc.fraction}` : ''));

                    const dtList = window.dailyTargetsDatabase[alloc.dayKey];
                    const dtExists = isSubjectTarget
                        ? dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters') && (t.portionLabel === portionLabel || t.totalChapterSize === portionSize))
                        : dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === subject && t.chapter === finalChapter && t.targetType !== 'subject' && (t.portionLabel === portionLabel || t.totalChapterSize === portionSize));

                    if (!dtExists) {
                        dtList.push({
                            id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            monthlyTargetId: mtId,
                            source: 'monthly',
                            targetMonth: targetMonthKey,
                            track: trackId,
                            program: progName,
                            subject: subject,
                            chapter: finalChapter,
                            targetType: item.targetType,
                            completed: isCompletedBefore,
                            completedAt: completedAtBefore,
                            scope: item.scope,
                            totalChapterSize: portionSize,
                            portionSize: portionSize,
                            portionLabel: portionLabel,
                            fraction: alloc.fraction || '',
                            isStarTarget: isStar,
                            updatedAt: Date.now()
                        });
                        connectedToDay = true;
                        connectedDaysSet.add(alloc.dayKey);
                        totalDailyAllocationsAdded++;
                    }
                }
            });
        } else if (selectedDayKey) {
            // Fallback if single day selected
            if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};
            if (!window.dailyTargetsDatabase[selectedDayKey]) window.dailyTargetsDatabase[selectedDayKey] = [];

            const dtList = window.dailyTargetsDatabase[selectedDayKey];
            const dtExists = isSubjectTarget
                ? dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters'))
                : dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === subject && t.chapter === finalChapter && t.targetType !== 'subject');

            if (!dtExists) {
                dtList.push({
                    id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    monthlyTargetId: mtId,
                    source: 'monthly',
                    targetMonth: targetMonthKey,
                    track: trackId,
                    program: progName,
                    subject: subject,
                    chapter: finalChapter,
                    targetType: item.targetType,
                    completed: isCompletedBefore,
                    completedAt: completedAtBefore,
                    scope: item.scope,
                    totalChapterSize: item.totalChapterSize,
                    updatedAt: Date.now()
                });
                connectedToDay = true;
                connectedDaysSet.add(selectedDayKey);
                totalDailyAllocationsAdded++;
            }
        }
    });

    if (addedCount === 0) {
        if (skippedDuplicateCount > 0) {
            return showToast("Selected target(s) are already in your monthly targets list.", "error");
        }
        return showToast("No targets added.", "error");
    }

    window.markLocalMutation(`add_monthly_targets_${addedCount}`);

    // Update active month to the month where target was added
    window.currentMonthlyTargetsDate = range.start;
    const monthSelectEl = document.getElementById('mt-select-month');
    if (monthSelectEl) monthSelectEl.value = targetMonthKey;

    if (connectedToWeek) {
        if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets();
        if (typeof window.autoSyncWeeklyToDailyTargets === 'function') window.autoSyncWeeklyToDailyTargets();
    }
    if (connectedToDay) {
        if (typeof window.renderDailyTargets === 'function') window.renderDailyTargets();
    }

    FirebaseService.saveToCloud();
    renderUI();

    // Smoothly return to Daily Actions page and focus monthly targets section
    window.switchPage('daily-actions');
    setTimeout(() => {
        const targetSection = document.getElementById('monthly-targets-section');
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 80);

    const subCountStr = addedSubjectsSet.size > 1 ? ` across ${addedSubjectsSet.size} subjects` : '';
    let toastMsg = addedCount === 1 ? "1 Monthly target added!" : `${addedCount} Monthly targets added${subCountStr}!`;
    if (connectedToWeek && connectedToDay) {
        const weekCountLabel = connectedWeeksSet.size > 1 ? `${connectedWeeksSet.size} Weeks` : 'Weekly';
        const dayCountLabel = connectedDaysSet.size > 1 ? `${totalDailyAllocationsAdded} Daily targets across ${connectedDaysSet.size} days` : 'Daily target';
        toastMsg += ` (Connected to ${weekCountLabel} & ${dayCountLabel})`;
    } else if (connectedToWeek) {
        const weekCountLabel = connectedWeeksSet.size > 1 ? `${connectedWeeksSet.size} Weeks` : 'Weekly target';
        toastMsg += ` (Connected to ${weekCountLabel})`;
    } else if (connectedToDay) {
        const dayCountLabel = connectedDaysSet.size > 1 ? `${totalDailyAllocationsAdded} Daily targets across ${connectedDaysSet.size} days` : 'Daily target';
        toastMsg += ` (Connected to ${dayCountLabel})`;
    }
    showToast(toastMsg, "success");
};

window.deleteMonthlyTarget = function (idx, targetId = null) {
    const monthSelectEl = document.getElementById('mt-select-month');
    if (!monthSelectEl) return;
    const selectedMonthKey = monthSelectEl.value;

    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[selectedMonthKey]) return;
    const list = window.monthlyTargetsDatabase[selectedMonthKey];

    let targetIdx = idx;
    if (targetId) {
        const foundIndex = list.findIndex(t => t && (t.id === targetId || t._id === targetId));
        if (foundIndex !== -1) targetIdx = foundIndex;
    }

    if (list && list[targetIdx]) {
        const target = list[targetIdx];
        const mtId = target.id || targetId;
        const tid = mtId || window.generateItemId(target, `monthlyTargetsDatabase_${selectedMonthKey}`);
        if (tid) {
            window.recordItemDeletion(tid);
            if (target.id) window.recordItemDeletion(target.id);
        }
        window.markLocalMutation(`delete_monthly_target`);

        // Cascade delete associated weekly and daily targets
        window.cascadeDeleteMonthlyTarget(target, selectedMonthKey, mtId);

        list.splice(targetIdx, 1);
        if (typeof window.recalculateTotals === 'function') window.recalculateTotals();
        renderUI();
        showToast("Monthly target and its weekly/daily schedules removed.", "success");
        FirebaseService.saveToCloud(true);
    }
};

window.toggleMonthlyTargetCompletion = function (idx, isCompleted) {
    const monthSelectEl = document.getElementById('mt-select-month');
    if (!monthSelectEl) return;
    const selectedMonthKey = monthSelectEl.value;

    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[selectedMonthKey] || !window.monthlyTargetsDatabase[selectedMonthKey][idx]) return;

    const target = window.monthlyTargetsDatabase[selectedMonthKey][idx];
    target.completed = isCompleted;
    target.completedAt = isCompleted ? new Date().toISOString() : null;

    if (target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters') {
        const key = target.track + 'Tasks';
        if (Array.isArray(AppState.tasks)) {
            AppState.tasks.forEach(t => {
                if (t.type === 'study' && Array.isArray(t[key])) {
                    t[key].forEach(b => {
                        if (b.subject === target.subject) {
                            b.completed = isCompleted;
                            b.completedAt = target.completedAt;
                        }
                    });
                }
            });
        }
    } else {
        window.syncTaskChapterCompletion(target.track, target.subject, target.chapter, isCompleted, target.completedAt);
    }

    recalculateTotals();
    renderUI();
    showToast("Completion state synchronized!", "success");
    FirebaseService.saveToCloud(false);
};

window.navigateMonth = function (mode) {
    const monthSelectEl = document.getElementById('mt-select-month');
    if (!window.currentMonthlyTargetsDate) {
        const selectedMonthKey = monthSelectEl ? monthSelectEl.value : null;
        window.currentMonthlyTargetsDate = (selectedMonthKey && Utils.parseStart && !isNaN(Utils.parseStart(selectedMonthKey).getTime()))
            ? Utils.parseStart(selectedMonthKey)
            : new Date();
    }

    if (mode === 'past') {
        window.currentMonthlyTargetsDate = new Date(window.currentMonthlyTargetsDate.getFullYear(), window.currentMonthlyTargetsDate.getMonth() - 1, 1);
    } else if (mode === 'future') {
        window.currentMonthlyTargetsDate = new Date(window.currentMonthlyTargetsDate.getFullYear(), window.currentMonthlyTargetsDate.getMonth() + 1, 1);
    } else {
        window.currentMonthlyTargetsDate = new Date();
    }

    window.renderMonthlyTargets();
};

window.renderMonthlyTargets = function () {
    const listContainer = document.getElementById('monthly-targets-list');
    const progDropdown = document.getElementById('mt-select-prog');
    const monthSelectEl = document.getElementById('mt-select-month');
    if (!listContainer || !monthSelectEl) return;

    if (typeof window.cleanOrphanedWeeklyAndDailyTargets === 'function') {
        window.cleanOrphanedWeeklyAndDailyTargets();
    }

    if (!window.currentMonthlyTargetsDate) {
        const currentSelectedMonth = monthSelectEl.value;
        window.currentMonthlyTargetsDate = (currentSelectedMonth && Utils.parseStart && !isNaN(Utils.parseStart(currentSelectedMonth).getTime()))
            ? Utils.parseStart(currentSelectedMonth)
            : new Date();
    }

    const activeRange = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate);
    const activeMonthKey = window.formatMonthRangeKey(activeRange.start, activeRange.end);

    const currentRange = window.getMonthlyTargetRange(new Date());
    const currentMonthKey = window.formatMonthRangeKey(currentRange.start, currentRange.end);

    if (!window.monthlyTargetsDatabase) window.monthlyTargetsDatabase = {};

    const allMonthsSet = new Set(Object.keys(window.monthlyTargetsDatabase));
    allMonthsSet.add(currentMonthKey);
    allMonthsSet.add(activeMonthKey);

    const allMonths = Array.from(allMonthsSet).sort((a, b) => {
        return Utils.parseStart(b) - Utils.parseStart(a);
    });

    monthSelectEl.innerHTML = '';
    allMonths.forEach(mk => {
        monthSelectEl.innerHTML += `<option value="${mk}">${mk}</option>`;
    });
    monthSelectEl.value = activeMonthKey;

    const monthName = activeRange.start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const selectedBadge = document.getElementById('mt-selected-month-range');
    if (selectedBadge) {
        selectedBadge.textContent = `[ ${monthName} : ${activeMonthKey} ]`;
    }

    const todayDate = new Date();
    const weekday = todayDate.toLocaleDateString('en-GB', { weekday: 'long' });
    const formattedToday = todayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const todayDisplay = document.getElementById('mt-today-display');
    if (todayDisplay) {
        todayDisplay.textContent = `Today: ${weekday}, ${formattedToday}`;
    }

    const btnPast = document.getElementById('mt-btn-past');
    const btnPresent = document.getElementById('mt-btn-present');
    const btnFuture = document.getElementById('mt-btn-future');

    const activeClass = "bg-indigo-600 text-white shadow";
    const inactiveClass = "text-slate-650 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-600/50";

    if (btnPast && btnPresent && btnFuture) {
        const startDiff = activeRange.start.getTime() - currentRange.start.getTime();
        btnPresent.className = `px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all ${activeMonthKey === currentMonthKey ? activeClass : inactiveClass}`;
        btnPast.className = `px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all ${startDiff < 0 ? activeClass : inactiveClass} flex items-center space-x-1`;
        btnFuture.className = `px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all ${startDiff > 0 ? activeClass : inactiveClass} flex items-center space-x-1`;
    }

    if (progDropdown) {
        const activeProgs = [];
        window.tracks.forEach(track => {
            if (window.customPrograms[track.id]) {
                window.customPrograms[track.id].forEach(p => {
                    activeProgs.push(p.name || p);
                });
            }
        });

        const currentSelectedProg = progDropdown.value;
        if (progDropdown.options.length !== activeProgs.length) {
            progDropdown.innerHTML = '';
            activeProgs.forEach(p => {
                progDropdown.innerHTML += `<option value="${p}">${p}</option>`;
            });
            if (activeProgs.length > 0) {
                if (activeProgs.includes(currentSelectedProg)) {
                    progDropdown.value = currentSelectedProg;
                }
                window.updateMonthlyTargetSubjectDropdown();
            }
        }
    }

    listContainer.innerHTML = '';
    const targetsList = window.monthlyTargetsDatabase[activeMonthKey] || [];

    let totalTargets = targetsList.length;
    let completedTargets = 0;

    targetsList.forEach((target, idx) => {
        const isSubjectTarget = (target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters');
        const progress = window.getMonthlyTargetProgress(target, activeMonthKey);

        let isCompleted = false;
        if (isSubjectTarget) {
            isCompleted = target.completed || (window.isSubjectCompleted ? window.isSubjectCompleted(target.track, target.subject) : false) || (progress.percent >= 100);
        } else {
            const foundTask = window.findTaskChapter(target.track, target.subject, target.chapter);
            isCompleted = target.completed || (foundTask ? foundTask.subTask.completed : false) || (target.totalChapterSize && progress.percent >= 100);
        }

        if (isCompleted) completedTargets++;

        const subjectColor = window.getSubjectColor ? window.getSubjectColor(target.subject) : '#6366f1';
        const isDarkMode = document.documentElement.classList.contains('dark');

        const statusColor = isCompleted
            ? 'bg-emerald-50/20 dark:bg-emerald-950/20'
            : 'bg-slate-50/50 dark:bg-slate-900/30';

        const cardBorderColorClass = isCompleted ? '' : 'border-slate-200 dark:border-slate-700';

        let bgStyle = `border-color: ${isCompleted ? subjectColor : (isDarkMode ? '#334155' : '#e2e8f0')};`;
        if (!isCompleted && progress.percent > 0) {
            const fillRgba = hexToRgba(subjectColor, isDarkMode ? 0.25 : 0.15);
            bgStyle += `background: linear-gradient(to right, ${fillRgba} ${progress.percent}%, transparent ${progress.percent}%);`;
        }

        let displaySub = target.subject.replace(target.program + ' - ', '').replace(target.program + ' ', '');

        const instanceIndex = (window.getMonthlyTargetInstanceOccurrence)
            ? window.getMonthlyTargetInstanceOccurrence(activeMonthKey, target, idx)
            : (window.getMonthlyTargetOccurrenceCount ? window.getMonthlyTargetOccurrenceCount(target.track, target.subject, target.chapter, target.targetType) : 1);
        const starCount = Math.max(0, instanceIndex - 1);
        let starsHtml = '';
        if (starCount > 0) {
            starsHtml = `<span class="inline-flex text-amber-500 text-[10px] ml-1.5 font-bold select-none" title="Target #${instanceIndex} (${starCount} star${starCount > 1 ? 's' : ''})">${'★'.repeat(starCount)}</span>`;
        }

        const progressTextHtml = progress.label ? `<span class="text-[9px] text-indigo-500 font-bold ml-1.5">${progress.label}</span>` : '';
        const targetScope = target.scope || (isSubjectTarget ? 'Whole Subject' : 'Whole Chapter');

        const titleText = isSubjectTarget
            ? `📚 ${displaySub} (Whole Subject)`
            : `${target.chapter}: ${displaySub}`;

        const itemHtml = `
                <div class="flex items-center justify-between p-3 rounded-2xl border ${statusColor} ${cardBorderColorClass} transition-all duration-300" style="${bgStyle}">
                    <div class="flex items-center space-x-3 min-w-0">
                        <input type="checkbox" 
                            onchange="window.toggleMonthlyTargetCompletion(${idx}, this.checked)" 
                            class="form-checkbox h-4.5 w-4.5 text-emerald-500 dark:text-emerald-500 rounded border-slate-350 focus:ring-emerald-500 transition-all cursor-pointer" 
                            ${isCompleted ? 'checked' : ''}>
                        <div class="min-w-0">
                            <span class="block text-xs font-black text-slate-800 dark:text-slate-100 truncate">${titleText}${starsHtml}${progressTextHtml}</span>
                            <div class="flex items-center space-x-1.5 flex-wrap">
                                <span class="block text-[8px] font-black uppercase text-slate-400 tracking-wider">${target.program}</span>
                                ${isSubjectTarget ? `
                                    <span class="inline-block px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                        📚 Subject Target
                                    </span>
                                ` : (targetScope !== 'Whole Chapter' && targetScope !== 'Whole' ? `
                                    <span class="inline-block px-1 py-0.5 rounded-[3px] text-[7px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                                        ${targetScope}
                                    </span>
                                ` : '')}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1 shrink-0">
                        <button onclick="window.openEditMonthlyTargetPage(${idx}, '${activeMonthKey}')" class="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-300 hover:text-indigo-550 dark:hover:text-indigo-400 rounded-lg transition-all active:scale-90 shadow-sm" title="Edit Monthly Target">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                        </button>
                        <button onclick="window.deleteMonthlyTarget(${idx}, '${target.id || ''}')" class="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-300 hover:text-red-500 rounded-lg transition-all active:scale-90 shadow-sm" title="Delete Monthly Target">
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
                    No monthly targets set for this month.
                </div>`;
    }

    const remainingTargets = totalTargets - completedTargets;
    const estFinishEl = document.getElementById('mt-est-finish');
    const reqPaceEl = document.getElementById('mt-req-pace');
    const actPaceEl = document.getElementById('mt-act-pace');

    if (activeMonthKey === currentMonthKey) {
        const daysInMonth = currentRange.daysInMonth;
        const currentDay = todayDate.getDate();
        const daysLeft = daysInMonth - currentDay + 1;

        const reqPace = daysLeft > 0 ? (remainingTargets / daysLeft) : 0;
        const actPace = completedTargets / currentDay;

        if (reqPaceEl) reqPaceEl.textContent = `${reqPace.toFixed(2)} /Day`;
        if (actPaceEl) actPaceEl.textContent = `${actPace.toFixed(2)} /Day`;

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
        const daysInMonth = activeRange.daysInMonth;
        const startDiff = activeRange.start.getTime() - currentRange.start.getTime();

        if (startDiff < 0) {
            if (reqPaceEl) reqPaceEl.textContent = `0.00 /Day`;
            const actPace = completedTargets / daysInMonth;
            if (actPaceEl) actPaceEl.textContent = `${actPace.toFixed(2)} /Day`;

            if (estFinishEl) {
                if (remainingTargets === 0) {
                    estFinishEl.textContent = 'Goal Met';
                    estFinishEl.className = 'text-xs font-black text-emerald-600 dark:text-emerald-400';
                } else {
                    estFinishEl.textContent = 'Not Met';
                    estFinishEl.className = 'text-xs font-black text-rose-600 dark:text-rose-400';
                }
            }
        } else {
            const reqPace = remainingTargets / daysInMonth;
            if (reqPaceEl) reqPaceEl.textContent = `${reqPace.toFixed(2)} /Day`;
            if (actPaceEl) actPaceEl.textContent = `0.00 /Day`;

            if (estFinishEl) {
                estFinishEl.textContent = 'Upcoming';
                estFinishEl.className = 'text-xs font-black text-indigo-600 dark:text-indigo-400';
            }
        }
    }
};

window.openAddMonthlyTargetPage = function (targetDate = null) {
    window.editingMonthlyTargetIndex = null;
    window.editingMonthlyTargetMonthKey = null;

    if (targetDate) {
        if (typeof targetDate === 'string') {
            const parsed = (window.Utils && Utils.parseStart) ? Utils.parseStart(targetDate) : new Date(targetDate);
            if (parsed && !isNaN(parsed.getTime())) {
                window.currentMonthlyTargetsDate = parsed;
            }
        } else if (targetDate instanceof Date && !isNaN(targetDate.getTime())) {
            window.currentMonthlyTargetsDate = targetDate;
        }
    } else if (!window.currentMonthlyTargetsDate) {
        window.currentMonthlyTargetsDate = new Date();
    }

    window.switchPage('monthly-target-setup');

    const pageTitle = document.getElementById('mt-page-title');
    if (pageTitle) pageTitle.textContent = "Add Monthly Target";

    const pageSubtitle = document.getElementById('mt-page-subtitle');
    if (pageSubtitle) pageSubtitle.textContent = "Configure program, subject, chapter breakdown, sizes, and weekly/daily target synchronization";

    const modeBadge = document.getElementById('mt-page-mode-badge');
    if (modeBadge) modeBadge.textContent = "Target Setup";

    const btnBottom = document.getElementById('mt-btn-save-bottom');
    if (btnBottom) {
        btnBottom.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg><span>Add Target</span>`;
        btnBottom.setAttribute('onclick', 'window.addMonthlyTarget()');
    }

    const btnDeleteBottom = document.getElementById('mt-btn-delete-bottom');
    if (btnDeleteBottom) {
        btnDeleteBottom.classList.add('hidden');
    }

    const searchInput = document.getElementById('mt-chapter-search-input');
    if (searchInput) searchInput.value = '';

    const bulkSizeInput = document.getElementById('mt-bulk-size-input');
    if (bulkSizeInput) bulkSizeInput.value = '';

    const activeRange = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate || new Date());
    const activeMonthKey = window.formatMonthRangeKey(activeRange.start, activeRange.end);
    const monthName = activeRange.start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const monthBadge = document.getElementById('mt-page-month-badge');
    if (monthBadge) monthBadge.textContent = `${monthName}`;

    const summaryMonth = document.getElementById('mt-summary-month-display');
    if (summaryMonth) summaryMonth.textContent = `${monthName} (${activeMonthKey})`;

    const monthInput = document.getElementById('mt-setup-month-input');
    if (monthInput) {
        const y = activeRange.start.getFullYear();
        const m = String(activeRange.start.getMonth() + 1).padStart(2, '0');
        monthInput.value = `${y}-${m}`;
    }

    window.populateMonthlyProgramsList();
    if (typeof window.toggleMonthlyProgramsDropdown === 'function') window.toggleMonthlyProgramsDropdown(false);
    if (typeof window.toggleMonthlySubjectsDropdown === 'function') window.toggleMonthlySubjectsDropdown(false);

    window.monthlyTargetDailyAllocations = {};
    const activeMonthDate = window.currentMonthlyTargetsDate || new Date();
    window.populateMonthlyTargetWeeksAndDays(activeMonthDate);
    window.updateMonthlyTargetPageSummary();
    window.updateMonthlyTargetSetupNavButtons();
};

window.setMonthlyTargetSetupMonthDate = function (monthVal) {
    if (!monthVal) return;
    const parts = monthVal.split('-');
    if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        if (!isNaN(year) && !isNaN(month)) {
            window.currentMonthlyTargetsDate = new Date(year, month, 1);
            window.navigateMonthlyTargetSetupMonth(null);
        }
    }
};

window.updateMonthlyTargetSetupNavButtons = function () {
    const today = new Date();
    const activeDate = window.currentMonthlyTargetsDate || today;
    const isCurrent = Boolean(
        activeDate.getMonth() === today.getMonth() &&
        activeDate.getFullYear() === today.getFullYear()
    );

    const currentBtn = document.getElementById('mt-setup-btn-current');
    const prevBtn = document.getElementById('mt-setup-btn-prev');
    const nextBtn = document.getElementById('mt-setup-btn-next');

    const activeRange = window.getMonthlyTargetRange(activeDate);
    const currentRange = window.getMonthlyTargetRange(today);
    const startDiff = activeRange.start.getTime() - currentRange.start.getTime();

    const activeClass = "px-3 py-1.5 text-[10px] font-black rounded-xl transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95 flex items-center gap-1 min-h-[34px]";
    const inactiveClass = "px-2.5 py-1.5 text-[10px] font-black rounded-xl transition-all text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 flex items-center gap-1 min-h-[34px]";

    if (currentBtn) currentBtn.className = isCurrent ? activeClass : inactiveClass;
    if (prevBtn) prevBtn.className = startDiff < 0 ? activeClass : inactiveClass;
    if (nextBtn) nextBtn.className = startDiff > 0 ? activeClass : inactiveClass;

    const monthInput = document.getElementById('mt-setup-month-input');
    if (monthInput) {
        const y = activeDate.getFullYear();
        const m = String(activeDate.getMonth() + 1).padStart(2, '0');
        monthInput.value = `${y}-${m}`;
    }
};

window.navigateMonthlyTargetSetupMonth = function (mode) {
    if (!window.currentMonthlyTargetsDate) {
        window.currentMonthlyTargetsDate = new Date();
    }

    if (mode === 'past') {
        window.currentMonthlyTargetsDate = new Date(window.currentMonthlyTargetsDate.getFullYear(), window.currentMonthlyTargetsDate.getMonth() - 1, 1);
    } else if (mode === 'future') {
        window.currentMonthlyTargetsDate = new Date(window.currentMonthlyTargetsDate.getFullYear(), window.currentMonthlyTargetsDate.getMonth() + 1, 1);
    } else if (mode === 'present') {
        window.currentMonthlyTargetsDate = new Date();
    }

    const activeRange = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate);
    const activeMonthKey = window.formatMonthRangeKey(activeRange.start, activeRange.end);
    const monthName = activeRange.start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const monthBadge = document.getElementById('mt-page-month-badge');
    if (monthBadge) monthBadge.textContent = `${monthName}`;

    const summaryMonth = document.getElementById('mt-summary-month-display');
    if (summaryMonth) summaryMonth.textContent = `${monthName} (${activeMonthKey})`;

    // Preserve checked state and sizes
    const checkedChaptersMap = {};
    document.querySelectorAll('.mt-chapter-checkbox:checked').forEach(cb => {
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        checkedChaptersMap[sub + '|||' + ch] = true;
    });

    const checkedWholeSubsMap = {};
    document.querySelectorAll('.mt-ch-whole-subject:checked').forEach(ws => {
        const sub = ws.getAttribute('data-subject');
        checkedWholeSubsMap[sub] = true;
    });

    const sizesMap = {};
    document.querySelectorAll('.mt-chapter-size-input').forEach(inp => {
        if (inp.value) {
            const sub = inp.getAttribute('data-subject');
            const ch = inp.getAttribute('data-chapter');
            sizesMap[sub + '|||' + ch] = inp.value;
        }
    });
    document.querySelectorAll('.mt-size-whole-subject').forEach(inp => {
        if (inp.value) {
            const sub = inp.getAttribute('data-subject');
            sizesMap[sub + '|||Whole Subject'] = inp.value;
        }
    });

    // Populate weeks and days for this new month
    window.populateMonthlyTargetWeeksAndDays(window.currentMonthlyTargetsDate);

    // Refresh chapter list with new month's weeks
    window.updateMonthlyTargetSubjectDropdown();

    // Restore checked states & sizes
    Object.keys(checkedChaptersMap).forEach(key => {
        const [sub, ch] = key.split('|||');
        const cb = document.querySelector(`.mt-chapter-checkbox[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        if (cb) cb.checked = true;
    });

    Object.keys(checkedWholeSubsMap).forEach(sub => {
        const ws = document.querySelector(`.mt-ch-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        if (ws) ws.checked = true;
    });

    Object.keys(sizesMap).forEach(key => {
        const [sub, ch] = key.split('|||');
        if (ch === 'Whole Subject') {
            const inp = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
            if (inp) inp.value = sizesMap[key];
        } else {
            const inp = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
            if (inp) inp.value = sizesMap[key];
        }
    });

    // Adjust any daily allocation days to match the new month
    if (window.monthlyTargetDailyAllocations) {
        Object.keys(window.monthlyTargetDailyAllocations).forEach(key => {
            const [sub, ch] = key.split('|||');
            const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(sub, ch) : '';
            window.adjustDailyAllocationsForTargetWeek(sub, ch, targetWeekKey);
        });
    }

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    window.updateMonthlyTargetSetupNavButtons();
};

window.openAddMonthlyTargetModal = function (targetDate = null) {
    window.openAddMonthlyTargetPage(targetDate);
};

window.openEditMonthlyTargetPage = function (idx, monthKey = null) {
    if (!monthKey) {
        const range = window.getMonthlyTargetRange();
        monthKey = window.formatMonthRangeKey(range.start, range.end);
    }
    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[monthKey] || !window.monthlyTargetsDatabase[monthKey][idx]) return;

    const target = window.monthlyTargetsDatabase[monthKey][idx];
    window.editingMonthlyTargetIndex = idx;
    window.editingMonthlyTargetMonthKey = monthKey;

    window.switchPage('monthly-target-setup');

    const pageTitle = document.getElementById('mt-page-title');
    if (pageTitle) pageTitle.textContent = "Edit Monthly Target";

    const pageSubtitle = document.getElementById('mt-page-subtitle');
    if (pageSubtitle) pageSubtitle.textContent = "Update target details, scope, chapter size, and weekly/daily connections";

    const modeBadge = document.getElementById('mt-page-mode-badge');
    if (modeBadge) modeBadge.textContent = "Edit Mode";

    const btnBottom = document.getElementById('mt-btn-save-bottom');
    if (btnBottom) {
        btnBottom.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg><span>Save Changes</span>`;
        btnBottom.setAttribute('onclick', `window.saveMonthlyTarget(${idx}, '${monthKey}')`);
    }

    const btnDeleteBottom = document.getElementById('mt-btn-delete-bottom');
    if (btnDeleteBottom) {
        btnDeleteBottom.classList.remove('hidden');
        btnDeleteBottom.setAttribute('onclick', `window.deleteMonthlyTargetFromEditPage(${idx}, '${monthKey}')`);
    }

    const searchInput = document.getElementById('mt-chapter-search-input');
    if (searchInput) searchInput.value = '';

    const bulkSizeInput = document.getElementById('mt-bulk-size-input');
    if (bulkSizeInput) bulkSizeInput.value = '';

    const targetMonthDate = (monthKey && Utils.parseStart && !isNaN(Utils.parseStart(monthKey).getTime()))
        ? Utils.parseStart(monthKey)
        : (window.currentMonthlyTargetsDate || new Date());

    window.currentMonthlyTargetsDate = targetMonthDate;

    const activeRange = window.getMonthlyTargetRange(targetMonthDate);
    const monthName = activeRange.start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const monthBadge = document.getElementById('mt-page-month-badge');
    if (monthBadge) monthBadge.textContent = `${monthName}`;

    const summaryMonth = document.getElementById('mt-summary-month-display');
    if (summaryMonth) summaryMonth.textContent = `${monthName} (${monthKey})`;

    const monthInput = document.getElementById('mt-setup-month-input');
    if (monthInput) {
        const y = activeRange.start.getFullYear();
        const m = String(activeRange.start.getMonth() + 1).padStart(2, '0');
        monthInput.value = `${y}-${m}`;
    }

    window.populateMonthlyProgramsList(target.program);
    if (typeof window.toggleMonthlyProgramsDropdown === 'function') window.toggleMonthlyProgramsDropdown(false);
    if (typeof window.toggleMonthlySubjectsDropdown === 'function') window.toggleMonthlySubjectsDropdown(false);

    // Find if this target is in any weekly target list of the target month
    let preselectedWeek = (target.targetWeek !== undefined) ? (target.targetWeek || null) : null;
    if (preselectedWeek === null && target.targetWeek === undefined && window.weeklyTargetsDatabase) {
        const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];
        for (const w of weeks) {
            const canonicalKey = window.getCanonicalWeeklyRangeKey ? window.getCanonicalWeeklyRangeKey(w.key) : w.key;
            const wtList = (window.weeklyTargetsDatabase[w.key] || []).concat(
                (canonicalKey && canonicalKey !== w.key && window.weeklyTargetsDatabase[canonicalKey]) ? window.weeklyTargetsDatabase[canonicalKey] : []
            );
            const match = wtList.some(t => window.isMatchMonthlyTargetWithChild(target, t));
            if (match) {
                preselectedWeek = w.key;
                break;
            }
        }
    }

    // Load existing daily targets for this chapter across the database into daily allocations
    window.monthlyTargetDailyAllocations = {};
    if (window.dailyTargetsDatabase) {
        const key = target.subject + '|||' + target.chapter;
        const existingAllocs = [];
        Object.keys(window.dailyTargetsDatabase).forEach(dateKey => {
            const list = window.dailyTargetsDatabase[dateKey] || [];
            list.forEach(dt => {
                if (dt.isDeleted) return;
                const match = window.isMatchMonthlyTargetWithChild(target, dt);
                if (match) {
                    existingAllocs.push({
                        dayKey: dateKey,
                        portionSize: dt.totalChapterSize || dt.portionSize || target.totalChapterSize,
                        fraction: dt.fraction || '',
                        portionLabel: dt.portionLabel || ''
                    });
                }
            });
        });
        if (existingAllocs.length > 0) {
            window.monthlyTargetDailyAllocations[key] = existingAllocs;
        }
    }

    window.updateMonthlyTargetSubjectDropdown(target.subject, target.chapter, target.totalChapterSize, preselectedWeek);
    window.populateMonthlyTargetWeeksAndDays(targetMonthDate, preselectedWeek);
    window.updateMonthlyTargetPageSummary();
    window.updateMonthlyTargetSetupNavButtons();
};

window.openEditMonthlyTargetModal = function (idx, monthKey = null) {
    window.openEditMonthlyTargetPage(idx, monthKey);
};

window.closeMonthlyTargetPage = function () {
    window.switchPage('daily-actions');
    setTimeout(() => {
        const targetSection = document.getElementById('monthly-targets-section');
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 80);
};

window.deleteMonthlyTargetFromEditPage = function (idx, monthKey = null) {
    if (!monthKey) {
        const range = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate || new Date());
        monthKey = window.formatMonthRangeKey(range.start, range.end);
    }
    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[monthKey] || !window.monthlyTargetsDatabase[monthKey][idx]) return;

    const target = window.monthlyTargetsDatabase[monthKey][idx];
    const mtId = target.id;
    const tid = mtId || window.generateItemId(target, `monthlyTargetsDatabase_${monthKey}`);
    if (tid) {
        window.recordItemDeletion(tid);
        if (target.id) window.recordItemDeletion(target.id);
    }
    window.markLocalMutation('delete_monthly_target_from_edit');

    // Cascade delete associated weekly and daily targets
    window.cascadeDeleteMonthlyTarget(target, monthKey, mtId);

    // Remove from monthlyTargetsDatabase
    window.monthlyTargetsDatabase[monthKey].splice(idx, 1);

    if (typeof window.recalculateTotals === 'function') window.recalculateTotals();
    renderUI();
    FirebaseService.saveToCloud(true);

    showToast("Monthly target and its weekly/daily schedules removed.", "success");
    window.closeMonthlyTargetPage();
};

window.saveMonthlyTarget = function (idx, originalMonthKey = null) {
    idx = (idx !== undefined && idx !== null) ? parseInt(idx, 10) : (window.editingMonthlyTargetIndex !== null ? parseInt(window.editingMonthlyTargetIndex, 10) : null);
    if (!originalMonthKey) {
        const range = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate || new Date());
        originalMonthKey = window.editingMonthlyTargetMonthKey || window.formatMonthRangeKey(range.start, range.end);
    }
    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[originalMonthKey] || !window.monthlyTargetsDatabase[originalMonthKey][idx]) return;

    const target = window.monthlyTargetsDatabase[originalMonthKey][idx];

    const activeRange = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate || new Date());
    const targetMonthKey = window.formatMonthRangeKey(activeRange.start, activeRange.end);
    const targetMonthDate = (originalMonthKey && window.Utils && Utils.parseStart && !isNaN(Utils.parseStart(originalMonthKey).getTime()))
        ? Utils.parseStart(originalMonthKey)
        : (activeRange && activeRange.start ? activeRange.start : (window.currentMonthlyTargetsDate || new Date()));

    // Find the first checked target in the studio
    let selectedTrack = '';
    let selectedProg = '';
    let selectedSubject = '';
    let selectedChapter = '';
    let selectedType = 'chapter';
    let selectedSize = null;
    let selectedWeek = '';

    const wholeSub = document.querySelector('.mt-ch-whole-subject:checked');
    if (wholeSub) {
        selectedTrack = wholeSub.getAttribute('data-track');
        selectedProg = wholeSub.getAttribute('data-program');
        selectedSubject = wholeSub.getAttribute('data-subject');
        selectedChapter = 'Whole Subject';
        selectedType = 'subject';
        const wholeSubSize = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(selectedSubject)}"]`);
        const wholeSubWeek = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(selectedSubject)}"]`);
        selectedSize = wholeSubSize && wholeSubSize.value ? parseInt(wholeSubSize.value, 10) : null;
        selectedWeek = wholeSubWeek ? wholeSubWeek.value : '';
    } else {
        const firstChecked = document.querySelector('.mt-chapter-checkbox:checked');
        if (firstChecked) {
            selectedTrack = firstChecked.getAttribute('data-track');
            selectedProg = firstChecked.getAttribute('data-program');
            selectedSubject = firstChecked.getAttribute('data-subject');
            selectedChapter = firstChecked.getAttribute('data-chapter');
            selectedType = 'chapter';
            const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(selectedSubject)}"][data-chapter="${CSS.escape(selectedChapter)}"]`);
            const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(selectedSubject)}"][data-chapter="${CSS.escape(selectedChapter)}"]`);
            selectedSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
            selectedWeek = weekSelect ? weekSelect.value : '';
        }
    }

    const progName = selectedProg || (document.getElementById('mt-select-prog') ? document.getElementById('mt-select-prog').value : '') || target.program;
    const trackId = selectedTrack || target.track || window.tracks.find(t => window.customPrograms[t.id] && window.customPrograms[t.id].some(p => (p.name || p) === progName))?.id;

    if (!selectedSubject || !selectedChapter) {
        return showToast("Please select at least one chapter or whole subject.", "error");
    }

    const isSubjectTarget = selectedType === 'subject';
    const finalChapter = selectedChapter;

    if (window.isSubjectPassed && window.isSubjectPassed(trackId, selectedSubject, progName)) {
        return showToast(`"${selectedSubject}" is marked as Passed and cannot be set as a monthly target.`, "error");
    }

    // Duplicate check in targetMonthKey
    if (!window.monthlyTargetsDatabase[targetMonthKey]) window.monthlyTargetsDatabase[targetMonthKey] = [];

    const isSameMonth = targetMonthKey === originalMonthKey;
    if (isSubjectTarget) {
        const exists = window.monthlyTargetsDatabase[targetMonthKey].some((t, i) =>
            (isSameMonth ? Number(i) !== Number(idx) : true) && t.track === trackId && t.subject === selectedSubject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters')
        );
        if (exists) {
            return showToast("This subject target already exists in the target month.", "error");
        }
    } else {
        const exists = window.monthlyTargetsDatabase[targetMonthKey].some((t, i) =>
            (isSameMonth ? Number(i) !== Number(idx) : true) && t.track === trackId && t.subject === selectedSubject && t.chapter === finalChapter && t.targetType !== 'subject'
        );
        if (exists) {
            return showToast("This chapter target already exists in the target month.", "error");
        }
        if (window.isChapterSkipped && window.isChapterSkipped(trackId, selectedSubject, finalChapter)) {
            return showToast(`"${finalChapter}" is skipped in ${selectedSubject} and cannot be set as a monthly target.`, "error");
        }
    }

    const mtId = target.id || `mt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    target.id = mtId;

    const oldTrack = target.track;
    const oldProg = target.program;
    const oldSubject = target.subject;
    const oldChapter = target.chapter;
    const oldIsSubject = target.targetType === 'subject' || oldChapter === 'Whole Subject';

    // Clean up previous Weekly & Daily Targets linked to this monthly target before applying changes
    window.cascadeDeleteMonthlyTarget({
        id: mtId,
        track: oldTrack,
        program: oldProg,
        subject: oldSubject,
        chapter: oldChapter,
        targetType: oldIsSubject ? 'subject' : 'chapter'
    }, originalMonthKey, mtId);

    const weekSelectEl = document.getElementById('mt-select-week-range');
    const targetWeekKey = (selectedWeek !== undefined && selectedWeek !== null) ? selectedWeek : (weekSelectEl ? weekSelectEl.value : '');
    const isNoWeek = !targetWeekKey || targetWeekKey === 'none';

    target.track = trackId;
    target.program = progName;
    target.subject = selectedSubject;
    target.chapter = finalChapter;
    target.targetType = selectedType;
    target.scope = isSubjectTarget ? 'Whole Subject' : (target.scope || 'Whole Chapter');
    target.totalChapterSize = selectedSize;
    target.targetWeek = isNoWeek ? null : (targetWeekKey || null);
    target.updatedAt = Date.now();

    // If month was changed during edit, move target to new month
    if (!isSameMonth) {
        window.monthlyTargetsDatabase[originalMonthKey].splice(idx, 1);
        window.monthlyTargetsDatabase[targetMonthKey].push(target);
    }

    let connectedToWeek = false;

    // Collect all unique weeks spanned by daily allocations (or fallback to targetWeekKey)
    const targetWeeksSet = new Set();
    const allocKey = selectedSubject + '|||' + finalChapter;
    if (isNoWeek && window.monthlyTargetDailyAllocations) {
        window.monthlyTargetDailyAllocations[allocKey] = [];
        if (progName) {
            window.monthlyTargetDailyAllocations[allocKey + '|||' + progName] = [];
        }
    }
    const dailyAllocs = isNoWeek ? [] : ((window.monthlyTargetDailyAllocations && (window.monthlyTargetDailyAllocations[allocKey] || (progName ? window.monthlyTargetDailyAllocations[allocKey + '|||' + progName] : null))) || []);

    if (dailyAllocs.length > 0) {
        dailyAllocs.forEach(a => {
            if (a.dayKey) {
                const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey, targetMonthDate) : '';
                if (wk) targetWeeksSet.add(wk);
            }
        });
    }
    if (targetWeeksSet.size === 0 && targetWeekKey && !isNoWeek) {
        targetWeeksSet.add(targetWeekKey);
    }

    const monthWeeksList = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];
    const spannedWeekNums = [];
    monthWeeksList.forEach((mw, idx) => {
        if (targetWeeksSet.has(mw.key)) {
            spannedWeekNums.push(`W${idx + 1}`);
        }
    });

    targetWeeksSet.forEach(tWeekKey => {
        const canonicalWeekKey = window.getCanonicalWeeklyRangeKey ? (window.getCanonicalWeeklyRangeKey(tWeekKey) || tWeekKey) : tWeekKey;
        if (!window.weeklyTargetsDatabase) window.weeklyTargetsDatabase = {};
        if (!window.weeklyTargetsDatabase[canonicalWeekKey]) window.weeklyTargetsDatabase[canonicalWeekKey] = [];

        window.weeklyTargetsDatabase[canonicalWeekKey].push({
            id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            monthlyTargetId: mtId,
            source: 'monthly',
            targetMonth: targetMonthKey,
            track: trackId,
            program: progName,
            subject: selectedSubject,
            chapter: finalChapter,
            targetType: selectedType,
            completed: target.completed,
            completedAt: target.completedAt,
            scope: target.scope,
            totalChapterSize: selectedSize,
            targetWeek: tWeekKey,
            dividedWeekKey: tWeekKey,
            spannedWeekNums: spannedWeekNums,
            isMultiWeek: spannedWeekNums.length > 1,
            updatedAt: Date.now()
        });
        connectedToWeek = true;
    });

    if (connectedToWeek) {
        if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets();
        if (typeof window.autoSyncWeeklyToDailyTargets === 'function') window.autoSyncWeeklyToDailyTargets();
    }

    const daySelectEl = document.getElementById('mt-select-day');
    const selectedDayKey = isNoWeek ? '' : (daySelectEl ? daySelectEl.value : '');
    let connectedToDay = false;
    let totalDailyAllocationsAdded = 0;
    const connectedDaysSet = new Set();

    // Auto-connect to Daily Targets from Daily Target Allocator Studio
    if (dailyAllocs.length > 0) {
        let runningSum = 0;
        dailyAllocs.forEach(alloc => {
            if (alloc.dayKey) {
                if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};
                if (!window.dailyTargetsDatabase[alloc.dayKey]) window.dailyTargetsDatabase[alloc.dayKey] = [];

                const prevSum = runningSum;
                const portionSize = alloc.portionSize || selectedSize;
                runningSum += (parseInt(portionSize, 10) || 0);

                const isStar = Boolean(selectedSize && selectedSize > 0 && prevSum >= selectedSize);
                const portionLabel = alloc.portionLabel || (isStar ? '⭐ Extra Setup' : (alloc.fraction ? `Fraction ${alloc.fraction}` : ''));

                const dtList = window.dailyTargetsDatabase[alloc.dayKey];
                const dtExists = isSubjectTarget
                    ? dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === selectedSubject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters') && (t.portionLabel === portionLabel || t.totalChapterSize === portionSize))
                    : dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === selectedSubject && t.chapter === finalChapter && t.targetType !== 'subject' && (t.portionLabel === portionLabel || t.totalChapterSize === portionSize));

                if (!dtExists) {
                    dtList.push({
                        id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        monthlyTargetId: mtId,
                        source: 'monthly',
                        targetMonth: targetMonthKey,
                        track: trackId,
                        program: progName,
                        subject: selectedSubject,
                        chapter: finalChapter,
                        targetType: selectedType,
                        completed: target.completed,
                        completedAt: target.completedAt,
                        scope: target.scope,
                        totalChapterSize: portionSize,
                        portionSize: portionSize,
                        portionLabel: portionLabel,
                        fraction: alloc.fraction || '',
                        isStarTarget: isStar,
                        updatedAt: Date.now()
                    });
                    connectedToDay = true;
                    connectedDaysSet.add(alloc.dayKey);
                    totalDailyAllocationsAdded++;
                }
            }
        });
    } else if (selectedDayKey) {
        if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};
        if (!window.dailyTargetsDatabase[selectedDayKey]) window.dailyTargetsDatabase[selectedDayKey] = [];

        const dtList = window.dailyTargetsDatabase[selectedDayKey];
        const dtExists = isSubjectTarget
            ? dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === selectedSubject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters'))
            : dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === selectedSubject && t.chapter === finalChapter && t.targetType !== 'subject');

        if (!dtExists) {
            dtList.push({
                id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                monthlyTargetId: mtId,
                source: 'monthly',
                targetMonth: targetMonthKey,
                track: trackId,
                program: progName,
                subject: selectedSubject,
                chapter: finalChapter,
                targetType: selectedType,
                completed: target.completed,
                completedAt: target.completedAt,
                scope: target.scope,
                totalChapterSize: selectedSize,
                updatedAt: Date.now()
            });
            connectedToDay = true;
            connectedDaysSet.add(selectedDayKey);
            totalDailyAllocationsAdded++;
        }
    }

    window.markLocalMutation('edit_monthly_target');

    // Update active month to the edited target's month
    window.currentMonthlyTargetsDate = activeRange.start;
    const monthSelectEl = document.getElementById('mt-select-month');
    if (monthSelectEl) monthSelectEl.value = targetMonthKey;

    if (typeof window.cleanOrphanedWeeklyAndDailyTargets === 'function') {
        window.cleanOrphanedWeeklyAndDailyTargets();
    }
    if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets();
    if (typeof window.renderDailyTargets === 'function') window.renderDailyTargets();
    if (typeof window.renderMonthlyTargets === 'function') window.renderMonthlyTargets();
    if (typeof window.recalculateTotals === 'function') window.recalculateTotals();

    FirebaseService.saveToCloud(true);
    renderUI();

    // Smoothly return to Daily Actions page and focus monthly targets section
    window.switchPage('daily-actions');
    setTimeout(() => {
        const targetSection = document.getElementById('monthly-targets-section');
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 80);

    let toastMsg = isSubjectTarget ? "Monthly subject target updated!" : "Monthly chapter target updated!";
    if (connectedToWeek && connectedToDay) {
        const dayCountLabel = connectedDaysSet.size > 1 ? `${totalDailyAllocationsAdded} Daily targets across ${connectedDaysSet.size} days` : 'Daily target';
        toastMsg += ` (Connected to Weekly & ${dayCountLabel})`;
    } else if (connectedToWeek) {
        toastMsg += " (Connected to Weekly target)";
    } else if (connectedToDay) {
        const dayCountLabel = connectedDaysSet.size > 1 ? `${totalDailyAllocationsAdded} Daily targets across ${connectedDaysSet.size} days` : 'Daily target';
        toastMsg += ` (Connected to ${dayCountLabel})`;
    }
    showToast(toastMsg, "success");
};

// --- Monthly Targets Database Modal Controls & Logic ---
window.openMonthlyTargetsDatabase = function () {
    const modal = document.getElementById('monthly-targets-db-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    setTimeout(() => {
        const backdrop = document.getElementById('mtdb-backdrop');
        const content = document.getElementById('mtdb-content');
        if (backdrop) backdrop.classList.replace('opacity-0', 'opacity-100');
        if (content) {
            content.classList.replace('scale-95', 'scale-100');
            content.classList.replace('opacity-0', 'opacity-100');
            content.classList.replace('translate-y-4', 'translate-y-0');
        }
    }, 10);

    window.switchMtdbTab('list');
    window.populateMtdbFilters();
    window.renderMtdbList();
};

window.switchMtdbTab = function (tab) {
    const listBtn = document.getElementById('mtdb-tab-btn-list');
    const monthBtn = document.getElementById('mtdb-tab-btn-month');
    const listContent = document.getElementById('mtdb-tab-content-list');
    const monthContent = document.getElementById('mtdb-tab-content-month');

    if (!listBtn || !monthBtn || !listContent || !monthContent) return;

    if (tab === 'list') {
        listBtn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-indigo-600 text-white shadow-md whitespace-nowrap";
        monthBtn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 whitespace-nowrap";
        listContent.classList.remove('hidden');
        monthContent.classList.add('hidden');
        window.renderMtdbList();
    } else {
        monthBtn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-indigo-600 text-white shadow-md whitespace-nowrap";
        listBtn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 whitespace-nowrap";
        listContent.classList.add('hidden');
        monthContent.classList.remove('hidden');
        window.renderMtdbMonthView();
    }
};

window.populateMtdbFilters = function () {
    const monthFilter = document.getElementById('mtdb-filter-month');
    const progFilter = document.getElementById('mtdb-filter-prog');
    const subFilter = document.getElementById('mtdb-filter-sub');

    if (!monthFilter || !progFilter || !subFilter) return;

    const currentRange = window.getMonthlyTargetRange();
    const currentMonthKey = window.formatMonthRangeKey(currentRange.start, currentRange.end);

    if (!window.monthlyTargetsDatabase) window.monthlyTargetsDatabase = {};
    const allMonthsSet = new Set(Object.keys(window.monthlyTargetsDatabase));
    allMonthsSet.add(currentMonthKey);
    const allMonths = Array.from(allMonthsSet).sort((a, b) => {
        return Utils.parseStart(b) - Utils.parseStart(a);
    });

    const prevMonthVal = monthFilter.value;
    monthFilter.innerHTML = '<option value="all">All Months</option>';
    allMonths.forEach(mk => {
        monthFilter.innerHTML += `<option value="${mk}">${mk}</option>`;
    });
    if (prevMonthVal) monthFilter.value = prevMonthVal;
    else monthFilter.value = currentMonthKey;

    const activeProgs = [];
    window.tracks.forEach(track => {
        if (window.customPrograms[track.id]) {
            window.customPrograms[track.id].forEach(p => {
                activeProgs.push(p.name || p);
            });
        }
    });

    const prevProgVal = progFilter.value;
    progFilter.innerHTML = '<option value="all">All Programs</option>';
    activeProgs.forEach(p => {
        progFilter.innerHTML += `<option value="${p}">${p}</option>`;
    });
    if (prevProgVal) progFilter.value = prevProgVal;

    const prevSubVal = subFilter.value;
    subFilter.innerHTML = '<option value="all">All Subjects</option>';
    window.getAllSubjects().forEach(s => {
        subFilter.innerHTML += `<option value="${s.subject}">${s.subject}</option>`;
    });
    if (prevSubVal) subFilter.value = prevSubVal;
};

window.renderMtdbList = function () {
    const tbody = document.getElementById('mtdb-targets-tbody');
    if (!tbody) return;

    if (typeof window.cleanOrphanedWeeklyAndDailyTargets === 'function') {
        window.cleanOrphanedWeeklyAndDailyTargets();
    }

    const mFilter = document.getElementById('mtdb-filter-month') ? document.getElementById('mtdb-filter-month').value : 'all';
    const pFilter = document.getElementById('mtdb-filter-prog') ? document.getElementById('mtdb-filter-prog').value : 'all';
    const sFilter = document.getElementById('mtdb-filter-sub') ? document.getElementById('mtdb-filter-sub').value : 'all';
    const statFilter = document.getElementById('mtdb-filter-status') ? document.getElementById('mtdb-filter-status').value : 'all';

    tbody.innerHTML = '';
    let matchedCount = 0;

    if (!window.monthlyTargetsDatabase) window.monthlyTargetsDatabase = {};

    Object.keys(window.monthlyTargetsDatabase).forEach(monthKey => {
        if (mFilter !== 'all' && monthKey !== mFilter) return;

        const list = window.monthlyTargetsDatabase[monthKey] || [];
        list.forEach((target, idx) => {
            if (pFilter !== 'all' && target.program !== pFilter) return;
            if (sFilter !== 'all' && target.subject !== sFilter) return;

            const isSubjectTarget = (target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters');
            let isCompleted = false;

            if (isSubjectTarget) {
                isCompleted = target.completed || (window.isSubjectCompleted ? window.isSubjectCompleted(target.track, target.subject) : false);
            } else {
                const foundTask = window.findTaskChapter(target.track, target.subject, target.chapter);
                isCompleted = target.completed || (foundTask ? foundTask.subTask.completed : false);
            }

            if (statFilter === 'completed' && !isCompleted) return;
            if (statFilter === 'non-completed' && isCompleted) return;

            matchedCount++;

            let displaySub = target.subject.replace(target.program + ' - ', '').replace(target.program + ' ', '');

            const instanceIndex = (window.getMonthlyTargetInstanceOccurrence)
                ? window.getMonthlyTargetInstanceOccurrence(monthKey, target, idx)
                : (window.getMonthlyTargetOccurrenceCount ? window.getMonthlyTargetOccurrenceCount(target.track, target.subject, target.chapter, target.targetType) : 1);
            const starCount = Math.max(0, instanceIndex - 1);
            let starsHtml = '';
            if (starCount > 0) {
                starsHtml = `<span class="inline-flex text-amber-500 text-[9px] ml-1.5 font-bold select-none" title="Target #${instanceIndex} (${starCount} star${starCount > 1 ? 's' : ''})">${'★'.repeat(starCount)}</span>`;
            }

            const chapterCell = isSubjectTarget
                ? `<span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">📚 Whole Subject${starsHtml}</span>`
                : `<span class="text-indigo-600 dark:text-indigo-400 font-bold">${target.chapter}${starsHtml}</span>`;

            const row = `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td class="py-3 px-4 text-center">
                            <input type="checkbox" onchange="window.toggleMtdbTargetCompletion('${monthKey}', ${idx}, this.checked)" class="form-checkbox h-4 w-4 text-emerald-500 rounded cursor-pointer" ${isCompleted ? 'checked' : ''}>
                        </td>
                        <td class="py-3 px-4 font-bold text-slate-500 dark:text-slate-400 text-[10px]">${monthKey}</td>
                        <td class="py-3 px-4 uppercase text-[10px] text-slate-400">${target.program}</td>
                        <td class="py-3 px-4 truncate max-w-[120px]" title="${target.subject}">${displaySub}</td>
                        <td class="py-3 px-4">${chapterCell}</td>
                        <td class="py-3 px-4 text-center">
                            <div class="flex items-center justify-center space-x-1">
                                <button onclick="window.openEditMonthlyTargetPage(${idx}, '${monthKey}')" class="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-500 rounded transition-all active:scale-90 shadow-sm" title="Edit Monthly Target">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                    </svg>
                                </button>
                                <button onclick="window.deleteMtdbTarget('${monthKey}', ${idx}, '${target.id || ''}')" class="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded transition-all active:scale-90 shadow-sm" title="Delete Monthly Target">
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
};

window.deleteMtdbTarget = function (monthKey, idx, targetId = null) {
    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[monthKey]) return;
    const list = window.monthlyTargetsDatabase[monthKey];

    let targetIdx = idx;
    if (targetId) {
        const foundIndex = list.findIndex(t => t && (t.id === targetId || t._id === targetId));
        if (foundIndex !== -1) targetIdx = foundIndex;
    }

    if (list && list[targetIdx]) {
        const target = list[targetIdx];
        const mtId = target.id || targetId;
        const tid = mtId || window.generateItemId(target, `monthlyTargetsDatabase_${monthKey}`);
        if (tid) {
            window.recordItemDeletion(tid);
            if (target.id) window.recordItemDeletion(target.id);
        }
        window.markLocalMutation(`delete_mtdb_target`);

        // Cascade delete associated weekly and daily targets
        window.cascadeDeleteMonthlyTarget(target, monthKey, mtId);

        list.splice(targetIdx, 1);
        if (typeof window.recalculateTotals === 'function') window.recalculateTotals();
        FirebaseService.saveToCloud(true);
        renderUI();
        window.renderMtdbList();
        showToast("Monthly target and its weekly/daily schedules removed.", "success");
    }
};

window.toggleMtdbTargetCompletion = function (monthKey, idx, isCompleted) {
    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[monthKey] || !window.monthlyTargetsDatabase[monthKey][idx]) return;

    const target = window.monthlyTargetsDatabase[monthKey][idx];
    target.completed = isCompleted;
    target.completedAt = isCompleted ? new Date().toISOString() : null;

    if (target.targetType === 'subject' || target.chapter === 'Whole Subject' || target.chapter === 'All Chapters') {
        const key = target.track + 'Tasks';
        if (Array.isArray(AppState.tasks)) {
            AppState.tasks.forEach(t => {
                if (t.type === 'study' && Array.isArray(t[key])) {
                    t[key].forEach(b => {
                        if (b.subject === target.subject) {
                            b.completed = isCompleted;
                            b.completedAt = target.completedAt;
                        }
                    });
                }
            });
        }
        recalculateTotals();
    } else {
        const found = window.findTaskChapter(target.track, target.subject, target.chapter);
        if (found) {
            found.subTask.completed = isCompleted;
            found.subTask.completedAt = target.completedAt;
            recalculateTotals();
        }
    }

    FirebaseService.saveToCloud();
    renderUI();
    window.renderMtdbList();
    showToast("Target completion state updated!", "success");
};

window.calculateMonthWiseMonthlyTargets = function () {
    const monthsData = {};

    const getMonthKey = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    if (!window.monthlyTargetsDatabase) window.monthlyTargetsDatabase = {};

    Object.keys(window.monthlyTargetsDatabase).forEach(monthKey => {
        const targets = window.monthlyTargetsDatabase[monthKey] || [];
        if (targets.length === 0) return;

        const dates = monthKey.split(' - ');
        if (dates.length !== 2) return;

        const start = Utils.parseDateSafe(dates[0]);
        if (isNaN(start.getTime())) return;

        const mKey = getMonthKey(start);
        if (!monthsData[mKey]) {
            monthsData[mKey] = { set: 0, completed: 0, rawMonth: start };
        }

        targets.forEach(t => {
            monthsData[mKey].set += 1;
            const isSubjectTarget = (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters');
            const isCompleted = isSubjectTarget
                ? (t.completed || (window.isSubjectCompleted ? window.isSubjectCompleted(t.track, t.subject) : false))
                : t.completed;
            if (isCompleted) {
                monthsData[mKey].completed += 1;
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
};

window.renderMtdbMonthChart = function (monthsList) {
    const ctx = document.getElementById('monthlyMonthMixedChart');
    if (!ctx) return;

    const labels = monthsList.map(m => m.month);
    const setDataset = {
        type: 'bar',
        label: 'Targets Set',
        data: monthsList.map(m => m.set),
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderColor: '#6366f1',
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

    if (window.mtdbMixedChartInstance) {
        window.mtdbMixedChartInstance.data.labels = labels;
        window.mtdbMixedChartInstance.data.datasets = [completedDataset, setDataset];
        window.mtdbMixedChartInstance.update();
    } else {
        window.mtdbMixedChartInstance = new Chart(ctx.getContext('2d'), {
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
};

window.renderMtdbMonthView = function () {
    const tbody = document.getElementById('mtdb-months-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const monthsList = window.calculateMonthWiseMonthlyTargets();

    const tableList = [...monthsList].reverse();

    tableList.forEach(m => {
        const rate = m.set > 0 ? Math.round((m.completed / m.set) * 100) : 0;
        let rateColor = 'text-rose-600 dark:text-rose-400';
        if (rate >= 50) rateColor = 'text-orange-500';
        if (rate >= 80) rateColor = 'text-emerald-600 dark:text-emerald-400';

        const row = `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td class="py-3 px-4 font-black text-slate-800 dark:text-slate-100">${m.month}</td>
                    <td class="py-3 px-4 text-center text-indigo-600 dark:text-indigo-400 font-black">${m.set}</td>
                    <td class="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-black">${m.completed}</td>
                    <td class="py-3 px-4 text-center font-black ${rateColor}">${rate}%</td>
                </tr>`;
        tbody.innerHTML += row;
    });

    if (monthsList.length === 0) {
        tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-8 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                        No monthly target data available. Set and complete targets in months to build trends.
                    </td>
                </tr>`;
    }

    window.renderMtdbMonthChart(monthsList);
};

// --- Weekly Targets System Logic ---
// Modularized: Core Weekly Targets calculations & sync logic are in js/features/targets/weeklyTargets.js
window.weeklyTargetsDatabase = window.weeklyTargetsDatabase || {};
window.dailyTargetsDatabase = window.dailyTargetsDatabase || {};
window.currentDailyTargetsDate = window.currentDailyTargetsDate || new Date();

window.getWeeklyTargetRange = function (date = new Date()) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.getWeeklyTargetRange === 'function') {
        return window.WeeklyTargets.getWeeklyTargetRange(date);
    }
};

window.formatDateRangeKey = function (start, end) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.formatDateRangeKey === 'function') {
        return window.WeeklyTargets.formatDateRangeKey(start, end);
    }
};

window.getCanonicalWeeklyRangeKey = function (input) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.getCanonicalWeeklyRangeKey === 'function') {
        return window.WeeklyTargets.getCanonicalWeeklyRangeKey(input);
    }
};

window.getWeeklyTargetOccurrenceCount = function (track, subject, chapter) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.getWeeklyTargetOccurrenceCount === 'function') {
        return window.WeeklyTargets.getWeeklyTargetOccurrenceCount(track, subject, chapter);
    }
    return 0;
};

window.getCompletedSizeForWeeklyTarget = function (target, weekKey) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.getCompletedSizeForWeeklyTarget === 'function') {
        return window.WeeklyTargets.getCompletedSizeForWeeklyTarget(target, weekKey);
    }
    return 0;
};

window.getAllocatedSizeForWeeklyTarget = function (target, weekKey) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.getAllocatedSizeForWeeklyTarget === 'function') {
        return window.WeeklyTargets.getAllocatedSizeForWeeklyTarget(target, weekKey);
    }
    return 0;
};

window.getWeeklyTargetProgress = function (target, weekKey) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.getWeeklyTargetProgress === 'function') {
        return window.WeeklyTargets.getWeeklyTargetProgress(target, weekKey);
    }
    return { completed: 0, total: 0, percent: 0 };
};

window.getChapterWeeklyTargetProgress = function (track, subject, chapter, weekKey = null) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.getChapterWeeklyTargetProgress === 'function') {
        return window.WeeklyTargets.getChapterWeeklyTargetProgress(track, subject, chapter, weekKey);
    }
    return { completed: 0, total: 0, percent: 0, isSizeBased: false, target: null, weekKey: null };
};

window.consolidateWeeklyTargetsDatabase = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.consolidateWeeklyTargetsDatabase === 'function') {
        return window.WeeklyTargets.consolidateWeeklyTargetsDatabase();
    }
};

window.syncMultiWeekTargetsToWeeklyDatabase = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.syncMultiWeekTargetsToWeeklyDatabase === 'function') {
        return window.WeeklyTargets.syncMultiWeekTargetsToWeeklyDatabase();
    }
};

window.isSubjectPassed = function (track, subject, progName = null) {
    const passedItems = window.passedItems || (window.AppState && window.AppState.passedItems) || { programs: [], subjects: [] };
    if (Array.isArray(passedItems.subjects) && passedItems.subjects.includes(subject)) {
        return true;
    }
    if (progName && Array.isArray(passedItems.programs) && passedItems.programs.includes(progName)) {
        return true;
    }
    if (track && syllabusStructure && syllabusStructure[track]) {
        const sObj = syllabusStructure[track].find(s => s.subject === subject);
        if (sObj && sObj.program && Array.isArray(passedItems.programs) && passedItems.programs.includes(sObj.program)) {
            return true;
        }
    }
    return false;
};

window.isChapterCompleted = function (track, subject, chapter) {
    if (window.passedItems) {
        if (window.passedItems.subjects && window.passedItems.subjects.includes(subject)) return true;
        const prog = (window.syllabusStructure && window.syllabusStructure[track]) ? (window.syllabusStructure[track].find(s => s.subject === subject)?.program) : null;
        if (prog && window.passedItems.programs && window.passedItems.programs.includes(prog)) return true;
    }

    const foundTask = window.findTaskChapter ? window.findTaskChapter(track, subject, chapter) : null;
    if (foundTask && foundTask.subTask) {
        if (foundTask.subTask.skipped) return false;
        if (foundTask.subTask.completed) return true;
        const prog = window.getChapterWeeklyTargetProgress ? window.getChapterWeeklyTargetProgress(track, subject, chapter) : null;
        if (prog && prog.isSizeBased && prog.total > 0 && prog.percent >= 100) return true;
    }

    const chNum = (window.Utils && window.Utils.extractNum) ? window.Utils.extractNum(chapter) : (parseInt(String(chapter).replace(/\D/g, ''), 10) || null);
    if (chNum && window.getChapterStatus) {
        const st = window.getChapterStatus(subject, chNum, track);
        if (st === 'complete') return true;
    }

    return false;
};

window.isChapterSkipped = function (track, subject, chapter) {
    if (!window.AppState || !Array.isArray(AppState.tasks)) return false;
    const matchFn = window.isChapterMatch || (window.Utils && window.Utils.isChapterMatch);
    for (let i = 0; i < AppState.tasks.length; i++) {
        const t = AppState.tasks[i];
        if (t.type === 'study') {
            const taskLists = (track && t[track + 'Tasks']) ? [t[track + 'Tasks']] : (window.tracks || []).map(tr => t[tr.id + 'Tasks']).filter(Boolean);
            for (const list of taskLists) {
                if (Array.isArray(list)) {
                    for (const b of list) {
                        if (b && b.subject === subject) {
                            const isMatch = matchFn ? matchFn(b.chapter, chapter) : (b.chapter === chapter || b.chapter === `Ch. ${chapter}` || b.chapter === String(chapter));
                            if (isMatch && b.skipped) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
};

window.findTaskChapter = function (track, subject, chapter) {
    const key = track + 'Tasks';
    for (let i = 0; i < AppState.tasks.length; i++) {
        const t = AppState.tasks[i];
        if (t.type === 'study' && Array.isArray(t[key])) {
            const found = t[key].find(b => b.subject === subject && b.chapter === chapter);
            if (found) {
                return { taskIndex: i, subTask: found };
            }
        }
    }
    return null;
};

window.syncTaskChapterCompletion = function (track, subject, chapter, isCompleted, completedAt = null) {
    const key = track + 'Tasks';
    let updated = false;
    AppState.tasks.forEach(t => {
        if (t.type === 'study' && Array.isArray(t[key])) {
            t[key].forEach(b => {
                if (b.subject === subject && (b.chapter === chapter || b.chapter === `Ch. ${chapter}` || b.chapter === String(chapter))) {
                    b.completed = isCompleted;
                    b.completedAt = isCompleted ? (completedAt || new Date().toISOString()) : null;
                    updated = true;
                }
            });
        }
    });
    return updated;
};

window.getChaptersForSubject = function (track, subject) {
    const chapters = new Set();
    
    // 1. Gather all chapters defined in syllabusStructure
    let sObj = null;
    if (track && syllabusStructure && syllabusStructure[track]) {
        sObj = syllabusStructure[track].find(s => s.subject === subject);
    }
    if (!sObj && syllabusStructure) {
        for (const t of (window.tracks || [])) {
            if (syllabusStructure[t.id]) {
                sObj = syllabusStructure[t.id].find(s => s.subject === subject);
                if (sObj) {
                    if (!track) track = t.id;
                    break;
                }
            }
        }
    }

    if (sObj) {
        if (Array.isArray(sObj.topics) && sObj.topics.length > 0) {
            sObj.topics.forEach((t, i) => {
                const name = typeof t === 'string' ? t : (t.name || `Ch. ${i + 1}`);
                if (name && !window.isChapterSkipped(track, subject, name)) chapters.add(name);
            });
        }
        if (typeof sObj.chapters === 'number' && sObj.chapters > 0) {
            for (let i = 1; i <= sObj.chapters; i++) {
                const chName = `Ch. ${i}`;
                if (!window.isChapterSkipped(track, subject, chName)) {
                    chapters.add(chName);
                }
            }
        }
    }

    // 2. Gather any custom / active chapters in AppState.tasks
    const key = track ? track + 'Tasks' : null;
    if (Array.isArray(AppState.tasks)) {
        AppState.tasks.forEach(t => {
            if (t.type === 'study') {
                const taskLists = key && t[key] ? [t[key]] : (window.tracks || []).map(tr => t[tr.id + 'Tasks']).filter(Boolean);
                taskLists.forEach(list => {
                    if (Array.isArray(list)) {
                        list.forEach(b => {
                            if (b && b.subject === subject && b.chapter && !b.skipped && !window.isChapterSkipped(track, subject, b.chapter)) {
                                chapters.add(b.chapter);
                            }
                        });
                    }
                });
            }
        });
    }

    return Array.from(chapters).sort((a, b) => {
        return Utils.extractNum(a) - Utils.extractNum(b);
    });
};

window.updateWeeklyTargetColorSync = function () {
    const subSelect = document.getElementById('wt-select-sub');
    const chSelect = document.getElementById('wt-select-ch');
    const dot = document.getElementById('wt-sub-color-dot');
    if (!subSelect) return;
    const subject = subSelect.value;
    if (subject && subject !== "No Subjects") {
        const color = window.getSubjectColor ? window.getSubjectColor(subject) : '#3b82f6';
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
};

// Modularized: Daily Target color sync logic is in js/features/targets/dailyTargets.js
window.updateDailyTargetColorSync = function () {
    if (window.DailyTargets && typeof window.DailyTargets.updateDailyTargetColorSync === 'function') {
        return window.DailyTargets.updateDailyTargetColorSync();
    }
};

window.updateWeeklyTargetSubjectDropdown = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.updateWeeklyTargetSubjectDropdown === 'function') {
        return window.WeeklyTargets.updateWeeklyTargetSubjectDropdown();
    }
};

window.updateWeeklyTargetChapterDropdown = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.updateWeeklyTargetChapterDropdown === 'function') {
        return window.WeeklyTargets.updateWeeklyTargetChapterDropdown();
    }
};

// Modularized: Weekly Target CRUD, navigation & checklist render are in js/features/targets/weeklyTargets.js
window.addWeeklyTarget = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.addWeeklyTarget === 'function') {
        return window.WeeklyTargets.addWeeklyTarget();
    }
};

window.deleteWeeklyTarget = function (idx, targetId = null) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.deleteWeeklyTarget === 'function') {
        return window.WeeklyTargets.deleteWeeklyTarget(idx, targetId);
    }
};

window.toggleWeeklyTargetCompletion = function (idx, isCompleted) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.toggleWeeklyTargetCompletion === 'function') {
        return window.WeeklyTargets.toggleWeeklyTargetCompletion(idx, isCompleted);
    }
};

window.navigateWeek = function (mode) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.navigateWeek === 'function') {
        return window.WeeklyTargets.navigateWeek(mode);
    }
};

window.renderWeeklyTargets = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.renderWeeklyTargets === 'function') {
        return window.WeeklyTargets.renderWeeklyTargets();
    }
};

// --- Daily Targets Logic ---
// Modularized: Daily Targets Management is in js/features/targets/dailyTargets.js
window.updateDailyTargetSubjectDropdown = function () {
    if (window.DailyTargets && typeof window.DailyTargets.updateDailyTargetSubjectDropdown === 'function') {
        return window.DailyTargets.updateDailyTargetSubjectDropdown();
    }
};

window.updateDailyTargetChapterDropdown = function () {
    if (window.DailyTargets && typeof window.DailyTargets.updateDailyTargetChapterDropdown === 'function') {
        return window.DailyTargets.updateDailyTargetChapterDropdown();
    }
};

window.handleDailyTargetChapterChange = function () {
    if (window.DailyTargets && typeof window.DailyTargets.handleDailyTargetChapterChange === 'function') {
        return window.DailyTargets.handleDailyTargetChapterChange();
    }
};

window.handleSelectFromWeeklyTargetChange = function () {
    if (window.DailyTargets && typeof window.DailyTargets.handleSelectFromWeeklyTargetChange === 'function') {
        return window.DailyTargets.handleSelectFromWeeklyTargetChange();
    }
};

window.addDailyTarget = function () {
    if (window.DailyTargets && typeof window.DailyTargets.addDailyTarget === 'function') {
        return window.DailyTargets.addDailyTarget();
    }
};

window.openAddDailyTargetModal = function () {
    if (window.DailyTargets && typeof window.DailyTargets.openAddDailyTargetModal === 'function') {
        return window.DailyTargets.openAddDailyTargetModal();
    }
    showToast('Weekly and Daily targets are set and managed from Add Monthly Target page.', 'info');
    window.switchPage('monthly-target-setup');
};

window.openAddWeeklyTargetModal = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.openAddWeeklyTargetModal === 'function') {
        return window.WeeklyTargets.openAddWeeklyTargetModal();
    }
    showToast("Weekly and Daily targets are set and managed from Add Monthly Target page.", "info");
    window.switchPage('monthly-target-setup');
};

window.openEditWeeklyTargetModal = function (idx, weekKey = null) {
    if (!weekKey) {
        const range = window.getWeeklyTargetRange();
        weekKey = window.formatDateRangeKey(range.start, range.end);
    }
    if (window.WeeklyTargets && typeof window.WeeklyTargets.openEditWeeklyTargetModal === 'function') {
        return window.WeeklyTargets.openEditWeeklyTargetModal(idx, weekKey);
    }
};

window.openEditWeeklyTargetModalFromWtdb = function (weekKey, idx) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.openEditWeeklyTargetModalFromWtdb === 'function') {
        return window.WeeklyTargets.openEditWeeklyTargetModalFromWtdb(weekKey, idx);
    }
};

window.saveWeeklyTarget = function (idx, weekKey = null) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.saveWeeklyTarget === 'function') {
        return window.WeeklyTargets.saveWeeklyTarget(idx, weekKey);
    }
};

// Modularized: Daily Targets CRUD, completion sync & navigation are in js/features/targets/dailyTargets.js
window.openEditDailyTargetModal = function (idx, dateKey = null) {
    if (window.DailyTargets && typeof window.DailyTargets.openEditDailyTargetModal === 'function') {
        return window.DailyTargets.openEditDailyTargetModal(idx, dateKey);
    }
};

window.openEditDailyTargetModalFromDtdb = function (dateKey, idx) {
    if (window.DailyTargets && typeof window.DailyTargets.openEditDailyTargetModalFromDtdb === 'function') {
        return window.DailyTargets.openEditDailyTargetModalFromDtdb(dateKey, idx);
    }
};

window.saveDailyTarget = function (idx, dateKey = null) {
    if (window.DailyTargets && typeof window.DailyTargets.saveDailyTarget === 'function') {
        return window.DailyTargets.saveDailyTarget(idx, dateKey);
    }
};

window.autoSyncWeeklyToDailyTargets = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.autoSyncWeeklyToDailyTargets === 'function') {
        return window.WeeklyTargets.autoSyncWeeklyToDailyTargets();
    }
    if (window.DailyTargets && typeof window.DailyTargets.autoSyncWeeklyToDailyTargets === 'function') {
        return window.DailyTargets.autoSyncWeeklyToDailyTargets();
    }
};

window.switchAdtTab = function (tab) {
    if (window.DailyTargets && typeof window.DailyTargets.switchAdtTab === 'function') {
        return window.DailyTargets.switchAdtTab(tab);
    }
};

window.addCustomTodoTarget = function () {
    if (window.DailyTargets && typeof window.DailyTargets.addCustomTodoTarget === 'function') {
        return window.DailyTargets.addCustomTodoTarget();
    }
};

window.deleteDailyTarget = function (idx, targetId = null) {
    if (window.DailyTargets && typeof window.DailyTargets.deleteDailyTarget === 'function') {
        return window.DailyTargets.deleteDailyTarget(idx, targetId);
    }
};

window.toggleDailyTargetCompletion = function (idx, isCompleted) {
    if (window.DailyTargets && typeof window.DailyTargets.toggleDailyTargetCompletion === 'function') {
        return window.DailyTargets.toggleDailyTargetCompletion(idx, isCompleted);
    }
};

window.navigateDay = function (mode) {
    if (window.DailyTargets && typeof window.DailyTargets.navigateDay === 'function') {
        return window.DailyTargets.navigateDay(mode);
    }
};

window.renderDailyTargets = function () {
    if (window.DailyTargets && typeof window.DailyTargets.renderDailyTargets === 'function') {
        return window.DailyTargets.renderDailyTargets();
    }
};

// Modularized: Dashboard card renderers and target handlers are in pages/Dashboard/Dashboard.js

// --- Weekly Targets Database Modal Controls & Logic ---
// Modularized: WTDB controls, table renderer & trend charts are in js/features/targets/weeklyTargets.js
window.openWeeklyTargetsDatabase = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.openWeeklyTargetsDatabase === 'function') {
        return window.WeeklyTargets.openWeeklyTargetsDatabase();
    }
};

window.switchWtdbTab = function (tab) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.switchWtdbTab === 'function') {
        return window.WeeklyTargets.switchWtdbTab(tab);
    }
};

window.populateWtdbFilters = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.populateWtdbFilters === 'function') {
        return window.WeeklyTargets.populateWtdbFilters();
    }
};

window.updateWtdbAddSubjectDropdown = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.updateWtdbAddSubjectDropdown === 'function') {
        return window.WeeklyTargets.updateWtdbAddSubjectDropdown();
    }
};

window.updateWtdbAddChapterDropdown = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.updateWtdbAddChapterDropdown === 'function') {
        return window.WeeklyTargets.updateWtdbAddChapterDropdown();
    }
};

window.addWtdbTarget = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.addWtdbTarget === 'function') {
        return window.WeeklyTargets.addWtdbTarget();
    }
};

window.deleteWtdbTarget = function (weekKey, idx) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.deleteWtdbTarget === 'function') {
        return window.WeeklyTargets.deleteWtdbTarget(weekKey, idx);
    }
};

window.toggleWtdbTargetCompletion = function (weekKey, idx, isCompleted) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.toggleWtdbTargetCompletion === 'function') {
        return window.WeeklyTargets.toggleWtdbTargetCompletion(weekKey, idx, isCompleted);
    }
};

window.renderWtdbList = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.renderWtdbList === 'function') {
        return window.WeeklyTargets.renderWtdbList();
    }
};

window.calculateMonthWiseTargets = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.calculateMonthWiseTargets === 'function') {
        return window.WeeklyTargets.calculateMonthWiseTargets();
    }
};

window.renderWtdbMonthChart = function (monthsList) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.renderWtdbMonthChart === 'function') {
        return window.WeeklyTargets.renderWtdbMonthChart(monthsList);
    }
};

window.renderWtdbMonthView = function () {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.renderWtdbMonthView === 'function') {
        return window.WeeklyTargets.renderWtdbMonthView();
    }
};

// --- Daily Targets Database Modal Controls & Logic ---
// Modularized: DTDB controls & table renderer are in js/features/targets/dailyTargets.js
window.openDailyTargetsDatabase = function () {
    if (window.DailyTargets && typeof window.DailyTargets.openDailyTargetsDatabase === 'function') {
        return window.DailyTargets.openDailyTargetsDatabase();
    }
};

window.populateDtdbFilters = function () {
    if (window.DailyTargets && typeof window.DailyTargets.populateDtdbFilters === 'function') {
        return window.DailyTargets.populateDtdbFilters();
    }
};

window.renderDtdbList = function () {
    if (window.DailyTargets && typeof window.DailyTargets.renderDtdbList === 'function') {
        return window.DailyTargets.renderDtdbList();
    }
};

window.toggleDtdbTargetCompletion = function (dateKey, idx, isCompleted) {
    if (window.DailyTargets && typeof window.DailyTargets.toggleDtdbTargetCompletion === 'function') {
        return window.DailyTargets.toggleDtdbTargetCompletion(dateKey, idx, isCompleted);
    }
};

window.deleteDtdbTarget = function (dateKey, idx) {
    if (window.DailyTargets && typeof window.DailyTargets.deleteDtdbTarget === 'function') {
        return window.DailyTargets.deleteDtdbTarget(dateKey, idx);
    }
};

window.updateDtdbTargetSize = function (dateKey, idx, size) {
    if (window.DailyTargets && typeof window.DailyTargets.updateDtdbTargetSize === 'function') {
        return window.DailyTargets.updateDtdbTargetSize(dateKey, idx, size);
    }
};

// Outcome pass status toggle (togglePassStatus) has been modularized to pages/Outcome/Outcome.js
window.togglePassStatus = function (type, name, isChecked) {
    if (window.OutcomePassConfig && typeof window.OutcomePassConfig.togglePassStatus === 'function') {
        window.OutcomePassConfig.togglePassStatus(type, name, isChecked);
    } else if (window.OutcomePage && typeof window.OutcomePage.togglePassStatus === 'function') {
        window.OutcomePage.togglePassStatus(type, name, isChecked);
    }
};

window.syncPassFreezeFromResults = function () {
    if (!window.passedItems) window.passedItems = { programs: [], subjects: [] };

    const processedResults = window.getProcessedResults();
    const programGroups = {};
    processedResults.forEach(res => {
        if (res.type === 'cgpa') {
            const progName = res.title;
            if (!programGroups[progName]) {
                programGroups[progName] = {
                    overall: null,
                    subjects: {}
                };
            }
            if (!res.subject) {
                programGroups[progName].overall = res;
            } else {
                programGroups[progName].subjects[res.subject] = res;
            }
        }
    });

    // For each track and its custom programs
    window.tracks.forEach(track => {
        if (window.customPrograms[track.id]) {
            window.customPrograms[track.id].forEach(prog => {
                const progName = prog.name || prog;
                const group = programGroups[progName];
                const mainTarget = window.getProgramMainTarget(progName);
                const targetCGPA = (group && group.overall && group.overall.targetCGPA) || mainTarget.targetCGPA;
                const targetGrade = (group && group.overall && group.overall.targetGrade) || mainTarget.targetGrade;
                const hasTgt = targetCGPA && targetCGPA !== 'none' && targetCGPA !== '';

                const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);

                // Check if all subjects in this program have been attempted
                let allSubjectsAttempted = (subs.length > 0);
                subs.forEach(s => {
                    const subRes = group && group.subjects && group.subjects[s.subject];
                    let attempted = false;
                    if (subRes) {
                        const evalType = subRes.evaluationType || 'cgpa';
                        if (evalType === 'grade') {
                            if (subRes.grade && subRes.grade.trim() !== '' && subRes.grade.trim().toUpperCase() !== 'F') {
                                attempted = true;
                            }
                        } else {
                            const val = parseFloat(subRes.value);
                            if (subRes.value && !isNaN(val) && val > 0) {
                                attempted = true;
                            }
                        }
                    }
                    if (!attempted) {
                        allSubjectsAttempted = false;
                    }
                });

                // 1. Program Level Goal
                let isProgramGoalMet = false;
                if (allSubjectsAttempted && hasTgt && group && group.overall) {
                    const evalType = group.overall.evaluationType;
                    if (evalType === 'grade') {
                        const currentGradeVal = Utils.mapGradeToNumeric(group.overall.grade, 'grade');
                        const targetGradeVal = Utils.mapGradeToNumeric(targetGrade, 'grade');
                        isProgramGoalMet = currentGradeVal >= targetGradeVal;
                    } else {
                        const currentCgpaVal = parseFloat(group.overall.value) || 0;
                        const targetCgpaVal = parseFloat(targetCGPA) || 0;
                        isProgramGoalMet = currentCgpaVal >= targetCgpaVal;
                    }
                }

                if (isProgramGoalMet) {
                    if (!window.passedItems.programs.includes(progName)) {
                        window.passedItems.programs.push(progName);
                    }
                }

                // 2. Subject Level Goal
                subs.forEach(s => {
                    const subRes = group && group.subjects && group.subjects[s.subject];
                    const subTargetCgpa = (subRes && subRes.targetCGPA) || targetCGPA;
                    const subTargetGrade = (subRes && subRes.targetGrade) || targetGrade;
                    const hasSubTgt = subTargetCgpa && subTargetCgpa !== 'none' && subTargetCgpa !== '';

                    let isSubjectGoalMet = false;
                    if (isProgramGoalMet) {
                        // If program goal is met, all its subjects are automatically passed/frozen
                        isSubjectGoalMet = true;
                    } else if (hasSubTgt && subRes) {
                        const evalType = subRes.evaluationType || 'cgpa';
                        if (evalType === 'grade') {
                            const currentGradeVal = Utils.mapGradeToNumeric(subRes.grade, 'grade');
                            const targetGradeVal = Utils.mapGradeToNumeric(subTargetGrade, 'grade');
                            isSubjectGoalMet = currentGradeVal >= targetGradeVal;
                        } else {
                            const currentCgpaVal = parseFloat(subRes.value) || 0;
                            const targetCgpaVal = parseFloat(subTargetCgpa) || 0;
                            isSubjectGoalMet = currentCgpaVal >= targetCgpaVal;
                        }
                    }

                    if (isSubjectGoalMet) {
                        if (!window.passedItems.subjects.includes(s.subject)) {
                            window.passedItems.subjects.push(s.subject);
                        }
                    }
                });
            });
        }
    });
};

// Global Priority Ordering System (syncPriorityInputsFromDOM, moveTrack, moveProgramGlobal, moveSubjectGlobal, moveAction, onPriorityDropdownChange, renderPriorityConfig, savePriorities)
// extracted to js/features/config/priorityConfig.js


// --- Pace Management System Logic ---
window.togglePaceBundleType = function () {
    const bTypeEl = document.getElementById('add-pace-bundle-type');
    if (!bTypeEl) return;
    const bType = bTypeEl.value;
    const nameContainer = document.getElementById('add-pace-name-container');
    const checklistSection = document.getElementById('add-pace-checklist-section');
    const checklistLabel = document.getElementById('add-pace-checklist-label');
    if (!nameContainer || !checklistSection || !checklistLabel) return;

    if (bType === 'global') {
        nameContainer.classList.add('hidden');
        checklistSection.classList.remove('hidden');
        checklistLabel.textContent = "Select Subjects & Secondary Paces";
        window.updatePaceSubjects();
    } else {
        nameContainer.classList.remove('hidden');
        checklistSection.classList.remove('hidden');

        if (bType === 'subjects') {
            checklistLabel.textContent = "Select Subjects to Include (Organized by Program)";
        } else {
            checklistLabel.textContent = "Select Entire Programs to Include";
        }
        window.updatePaceSubjects();
    }
};

window.updatePaceSubjects = function () {
    const bType = document.getElementById('add-pace-bundle-type').value;
    const container = document.getElementById('add-pace-subjects-container');
    if (!container) return;

    let html = '';

    if (bType === 'subjects') {
        window.tracks.forEach(track => {
            if (window.customPrograms[track.id]) {
                window.customPrograms[track.id].forEach(prog => {
                    const progName = prog.name || prog;
                    const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                    if (subs.length > 0) {
                        html += `
                                <details class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                                    <summary class="cursor-pointer font-black text-[10px] md:text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300 p-3 outline-none select-none list-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-95 rounded-xl transition-all [&::-webkit-details-marker]:hidden">
                                        <div class="flex items-center space-x-2">
                                            <span>${progName}</span>
                                            <span class="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md text-[8px]">${subs.length} Subjects</span>
                                        </div>
                                        <svg class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </summary>
                                    <div class="p-3 pt-0 border-t border-slate-100 dark:border-slate-700">
                                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                                `;
                        subs.forEach(s => {
                            let displaySub = s.subject.replace(progName + ' - ', '').replace(progName + ' ', '');
                            const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(s.subject)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                            if (isPassed) {
                                html += `
                                            <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${s.subject} (Passed - cannot be added to new pace)">
                                                <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                    <input type="checkbox" value="${s.subject}" disabled class="pace-subject-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                                    <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through" title="${s.subject}">${displaySub}</del>
                                                </div>
                                                <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                            </label>`;
                            } else {
                                html += `
                                            <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-400 active:scale-95 transition-all shadow-sm group/label">
                                                <input type="checkbox" value="${s.subject}" class="pace-subject-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all">
                                                <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate group-hover/label:text-orange-600 dark:group-hover/label:text-orange-400 transition-colors" title="${s.subject}">${displaySub}</span>
                                            </label>`;
                            }
                        });
                        html += `
                                        </div>
                                    </div>
                                </details>`;
                    }
                });
            }
        });
    } else if (bType === 'programs') {
        html += `<div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 w-full">`;
        window.tracks.forEach(track => {
            if (window.customPrograms[track.id] && window.customPrograms[track.id].length > 0) {
                window.customPrograms[track.id].forEach(p => {
                    const pName = p.name || p;
                    const isProgPassed = Boolean(window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(pName));
                    if (isProgPassed) {
                        html += `
                                <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${pName} (Passed - cannot be added to new pace)">
                                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                                        <input type="checkbox" value="${pName}" disabled class="pace-subject-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                        <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through">${pName}</del>
                                    </div>
                                    <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                </label>`;
                    } else {
                        html += `
                                <label class="flex items-center space-x-2 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-400 active:scale-95 transition-all shadow-sm">
                                    <input type="checkbox" value="${pName}" class="pace-subject-cb form-checkbox h-4 w-4 text-violet-500 rounded border-slate-300 focus:ring-violet-500 accent-violet-500 transition-all">
                                    <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate">${pName}</span>
                                </label>`;
                    }
                });
            }
        });
        html += `</div>`;
    } else if (bType === 'global') {
        html += `<div class="mb-4"><h5 class="text-[10px] font-black uppercase text-slate-400 mb-2">Subjects</h5>`;
        window.tracks.forEach(track => {
            if (window.customPrograms[track.id]) {
                window.customPrograms[track.id].forEach(prog => {
                    const progName = prog.name || prog;
                    const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                    if (subs.length > 0) {
                        html += `
                                <details class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group mb-2">
                                    <summary class="cursor-pointer font-black text-[10px] md:text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300 p-3 outline-none select-none list-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-95 rounded-xl transition-all [&::-webkit-details-marker]:hidden">
                                        <div class="flex items-center space-x-2">
                                            <span>${progName}</span>
                                            <span class="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md text-[8px]">${subs.length} Subjects</span>
                                        </div>
                                        <svg class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </summary>
                                    <div class="p-3 pt-0 border-t border-slate-100 dark:border-slate-700">
                                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                                `;
                        subs.forEach(s => {
                            let displaySub = s.subject.replace(progName + ' - ', '').replace(progName + ' ', '');
                            const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(s.subject)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                            if (isPassed) {
                                html += `
                                            <label class="flex items-center justify-between space-x-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-100/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed shadow-none pace-passed-item" title="${s.subject} (Passed - cannot be added to new pace)">
                                                <div class="flex items-center space-x-2 min-w-0 flex-1">
                                                    <input type="checkbox" value="${s.subject}" disabled class="global-subject-cb form-checkbox h-4 w-4 text-slate-400 rounded border-slate-300 dark:border-slate-600 cursor-not-allowed">
                                                    <del class="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate line-through" title="${s.subject}">${displaySub}</del>
                                                </div>
                                                <span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>
                                            </label>`;
                            } else {
                                html += `
                                            <label class="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-400 active:scale-95 transition-all shadow-sm group/label">
                                                <input type="checkbox" value="${s.subject}" class="global-subject-cb form-checkbox h-4 w-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 transition-all">
                                                <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate group-hover/label:text-orange-600 dark:group-hover/label:text-orange-400 transition-colors" title="${s.subject}">${displaySub}</span>
                                            </label>`;
                            }
                        });
                        html += `
                                        </div>
                                    </div>
                                </details>`;
                    }
                });
            }
        });
        html += `</div>`;

        html += `<div><h5 class="text-[10px] font-black uppercase text-slate-400 mb-2">Secondary Paces</h5>`;
        const otherGoals = window.paceGoals.filter(g => g.type !== 'global');
        if (otherGoals.length > 0) {
            html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
            otherGoals.forEach(g => {
                html += `
                        <label class="flex items-center space-x-2 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 active:scale-95 transition-all shadow-sm">
                            <input type="checkbox" value="${g.id}" class="global-pace-cb form-checkbox h-4 w-4 text-indigo-500 rounded border-slate-300 focus:ring-indigo-500 accent-indigo-500 transition-all">
                            <span class="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${g.target}">${g.target}</span>
                        </label>`;
            });
            html += `</div>`;
        } else {
            html += `<span class="text-[10px] text-slate-500">No other pace goals available to link.</span>`;
        }
        html += `</div>`;
    }

    container.innerHTML = html || '<span class="text-[10px] text-slate-500 col-span-full">No items found.</span>';
};

window.addPaceGoal = function () {
    const bType = document.getElementById('add-pace-bundle-type').value;
    const name = bType === 'global' ? 'Global Overall' : document.getElementById('add-pace-name').value.trim();
    const startStr = document.getElementById('add-pace-start').value;
    const dateStr = document.getElementById('add-pace-date').value;

    if (bType !== 'global' && !name) return showToast("Please provide a Goal Name.", "error");
    if (!startStr) return showToast("Please select a target start date.", "error");
    if (!dateStr) return showToast("Please select a target deadline date.", "error");

    const startDate = Utils.parseDateSafe(startStr);
    const targetDate = Utils.parseDateSafe(dateStr);
    if (targetDate <= startDate) return showToast("Target deadline must be after the start date.", "error");

    if (bType === 'global') {
        if (window.paceGoals.some(g => g.type === 'global')) return showToast("A Global Pace Goal already exists.", "error");

        const subjCheckboxes = document.querySelectorAll('.global-subject-cb:checked');
        const secCheckboxes = document.querySelectorAll('.global-pace-cb:checked');

        const selectedSubjects = Array.from(subjCheckboxes).map(cb => cb.value).filter(sub => {
            const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
            const progName = sObj ? sObj.program : '';
            const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(sub)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
            return !isPassed;
        });
        const selectedSec = Array.from(secCheckboxes).map(cb => cb.value);

        window.paceGoals.push({
            id: 'pg_' + Date.now(),
            type: 'global',
            target: name,
            startDate: startStr,
            deadline: dateStr,
            subjects: selectedSubjects,
            secondaryPaces: selectedSec
        });
    } else {
        const checkboxes = document.querySelectorAll('.pace-subject-cb:checked');
        const selectedItems = Array.from(checkboxes).map(cb => cb.value);

        if (selectedItems.length === 0) return showToast("Please select at least one item.", "error");
        if (window.paceGoals.some(g => g.target === name)) return showToast("A custom goal with this name already exists.", "error");

        let filteredItems = [];
        if (bType === 'subjects') {
            filteredItems = selectedItems.filter(sub => {
                const sObj = window.getAllSubjects ? window.getAllSubjects().find(s => s.subject === sub) : null;
                const progName = sObj ? sObj.program : '';
                const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(sub)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                return !isPassed;
            });
            if (filteredItems.length === 0) return showToast("Selected subjects are already passed and cannot be added to a new pace.", "error");
        } else {
            filteredItems = selectedItems.filter(pName => {
                const isPassed = Boolean(window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(pName));
                return !isPassed;
            });
            if (filteredItems.length === 0) return showToast("Selected programs are already passed and cannot be added to a new pace.", "error");
        }

        let newGoal = {
            id: 'pg_' + Date.now(),
            type: 'bundle',
            target: name,
            startDate: startStr,
            deadline: dateStr
        };

        if (bType === 'subjects') {
            newGoal.subjects = filteredItems;
        } else {
            newGoal.programs = filteredItems;
        }

        window.paceGoals.push(newGoal);
    }

    document.getElementById('add-pace-name').value = '';
    document.getElementById('add-pace-start').value = '';
    document.getElementById('add-pace-date').value = '';
    FirebaseService.saveToCloud(); renderUI(); showToast("Custom Pace Goal added!", "success");
};

window.requestDeletePaceGoal = function (id) {
    window.openConfirmModal("Delete Pace Goal", "Are you sure you want to remove this target timeline?", () => window.deletePaceGoal(id));
};

window.deletePaceGoal = function (id) {
    if (typeof window.recordItemDeletion === 'function') {
        window.recordItemDeletion(id);
    }
    window.paceGoals = window.paceGoals.filter(g => g.id !== id);
    if (window.dashboardConfig && window.dashboardConfig.activePaceGoalId === id) {
        const defaultGoal = window.paceGoals.find(g => g.id === 'global-timeline') || window.paceGoals[0];
        window.dashboardConfig.activePaceGoalId = defaultGoal ? defaultGoal.id : null;
    }
    FirebaseService.saveToCloud(); renderUI(); showToast("Pace Goal deleted.", "success");
};

// Toast notification UI system extracted to ES module: js/shared/toast.js
// Backward-compatibility references maintained by window.showToast


// Fast global resize listener to ensure all canvas charts remain perfectly responsive across device orientations
let resizeDebounceTimer = null;
window.addEventListener('resize', () => {
    if (!document.getElementById('app-wrapper')) return;
    if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
        const charts = [
            AppState.progressChart, window.mainChartPrograms, window.monthlyChartActions,
            window.yearlyChartActions, window.paceTrendChartInstance,
            window.spectraPaceTrendChartInstance, window.globalPaceTrendChartInstance, window.dbProgressChartInstance,
            window.revisionTrendChartInstance, window.globalHistoryChartInstance, AppState.masterLineChart,
            window.dadbTrendChartInstance, window.resultsTrendChartInstance, window.programTrendChartInstance
        ];
        charts.forEach(c => {
            if (c && typeof c.resize === 'function') {
                c.resize();
                if (typeof c.update === 'function') {
                    c.update('none');
                }
            }
        });
    }, 50);
});

// Dynamic Tracks Configuration System (renderTrackList, appendNewTrack, editTrackName, saveTrackEditModal, requestDeleteTrack, executeDeleteTrack)
// extracted to js/features/config/tracksConfig.js


window.toggleMobileSidebar = function () {
    const sidebar = document.getElementById('sidebar-container');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) {
        const isOpen = sidebar.classList.contains('translate-x-0');
        if (isOpen) {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            if (backdrop) {
                backdrop.classList.add('opacity-0', 'pointer-events-none');
                backdrop.classList.remove('opacity-100');
            }
        } else {
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            if (backdrop) {
                backdrop.classList.remove('opacity-0', 'pointer-events-none');
                backdrop.classList.add('opacity-100');
            }
        }
    }
};

window.closeMobileSidebar = function () {
    const sidebar = document.getElementById('sidebar-container');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
    }
    if (backdrop) {
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        backdrop.classList.remove('opacity-100');
    }
};

window.switchPage = function (pageId, sectionId) {
    if (window.Router && typeof window.Router.loadPage === 'function') {
        return window.Router.loadPage(pageId, sectionId);
    }
    const activePage = document.querySelector('[id^="page-"]:not(.hidden)');
    const currentActiveId = activePage ? activePage.id.replace('page-', '') : null;
    const isSamePage = currentActiveId === pageId;

    const pages = ['dashboard', 'spectra-analytics', 'timer', 'daily-actions', 'schedule', 'subjects', 'paces-management', 'master-config', 'outcome', 'exam', 'monthly-target-setup'];
    pages.forEach(p => {
        const el = document.getElementById(`page-${p}`);
        if (el) {
            if (p === pageId) {
                el.classList.remove('hidden');
                if (!isSamePage) {
                    el.classList.add('animate-page-enter');
                }
            } else {
                el.classList.add('hidden');
                el.classList.remove('animate-page-enter');
            }
        }
    });

    const buttons = {
        'dashboard': { active: 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-lg', hover: 'hover:border-blue-400' },
        'spectra-analytics': { active: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-transparent shadow-lg shadow-fuchsia-500/20', hover: 'hover:border-fuchsia-400' },
        'daily-actions': { active: 'bg-orange-500 text-white border-orange-500 shadow-lg', hover: 'hover:border-orange-400' },
        'subjects': { active: 'bg-violet-600 text-white border-violet-600 shadow-lg', hover: 'hover:border-violet-400' },
        'paces-management': { active: 'bg-red-600 text-white border-red-600 shadow-lg', hover: 'hover:border-red-400' },
        'master-config': { active: 'bg-indigo-600 text-white border-indigo-600 shadow-lg', hover: 'hover:border-indigo-400' },
        'outcome': { active: 'bg-yellow-500 text-white border-yellow-500 shadow-lg', hover: 'hover:border-yellow-400' },
        'timer': { active: 'bg-emerald-600 text-white border-emerald-600 shadow-lg', hover: 'hover:border-emerald-400' },
        'schedule': { active: 'bg-cyan-600 text-white border-cyan-600 shadow-lg', hover: 'hover:border-cyan-400' },
        'exam': { active: 'bg-rose-600 text-white border-rose-600 shadow-lg', hover: 'hover:border-rose-400' }
    };

    pages.forEach(p => {
        const btn = document.getElementById(`btn-nav-${p}`);
        if (btn) {
            const baseClass = "w-full border-2 px-4 py-3 rounded-2xl font-black text-xs transition-all duration-300 hover:translate-x-1.5 hover:shadow-md active:scale-98 flex items-center gap-3";
            const isActive = (p === pageId) || (pageId === 'monthly-target-setup' && p === 'daily-actions');
            if (isActive) {
                btn.className = `${baseClass} ${buttons[p].active}`;
            } else {
                btn.className = `${baseClass} bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 ${buttons[p].hover}`;
            }
        }
    });

    if (pageId === 'exam' && typeof window.renderExamPage === 'function') {
        window.renderExamPage();
    }

    if (sectionId) {
        setTimeout(() => {
            const target = document.getElementById(sectionId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 120);
    } else if (!isSamePage) {
        const contentPanel = document.getElementById('main-content-panel');
        if (contentPanel) {
            contentPanel.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Handle chart resizing or rendering when visible
    if (pageId === 'dashboard' || pageId === 'spectra-analytics' || pageId === 'timer') {
        const resizeAndUpdateAll = () => {
            const charts = [
                window.mainChartPrograms,
                window.monthlyChartActions,
                window.yearlyChartActions,
                window.spectraPaceTrendChartInstance,
                window.globalPaceTrendChartInstance,
                window.dbProgressChartInstance,
                window.spectraFocusAnalyticsChartInstance,
                window.timerAnalyticsChartInstance
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
        // Resize early during transition
        setTimeout(resizeAndUpdateAll, 50);
        // Resize and repaint again after entry transition completes (400ms animation) to prevent GPU caching/blank canvas bugs
        setTimeout(resizeAndUpdateAll, 420);

        if (window.setSpectraHeatmapRangeUI) setTimeout(() => window.setSpectraHeatmapRangeUI(window.spectraHeatmapRange), 50);
        else if (window.renderSpectraFocusHeatmap) setTimeout(window.renderSpectraFocusHeatmap, 50);

        if (pageId === 'spectra-analytics' || pageId === 'timer') {
            if (window.updateTimerAnalyticsControls) setTimeout(window.updateTimerAnalyticsControls, 50);
            if (window.renderTimerAnalyticsChart) setTimeout(window.renderTimerAnalyticsChart, 50);
            if (window.setSessionHistoryFilterUI) setTimeout(() => window.setSessionHistoryFilterUI(window.sessionHistoryFilter || 'all'), 50);
            if (pageId === 'timer') {
                if (window.renderTimerPage) setTimeout(window.renderTimerPage, 50);
                if (window.updateSubjectTargetUI) setTimeout(window.updateSubjectTargetUI, 50);
            }
            if (pageId === 'spectra-analytics') {
                if (window.renderSpectraCircleChart) setTimeout(window.renderSpectraCircleChart, 50);
                if (window.renderSpectraCommitmentsChart) setTimeout(window.renderSpectraCommitmentsChart, 50);
            }
        }
        } else if (pageId === 'subjects') {
        if (typeof renderSubjectNavigation === 'function') renderSubjectNavigation();
        if (typeof renderCategoryProgress === 'function') renderCategoryProgress(window.lastSubjectStats || (typeof updateMetrics === 'function' ? (updateMetrics(), window.lastSubjectStats) : {}));
        if (typeof updateMetrics === 'function') updateMetrics();
        const refreshSubjectProgressChart = () => {
            const canvas = document.getElementById('progressChart');
            if (canvas) {
                if (AppState.progressChart && typeof AppState.progressChart.resize === 'function') {
                    AppState.progressChart.resize();
                    if (typeof AppState.progressChart.update === 'function') {
                        AppState.progressChart.update('none');
                    }
                } else if (typeof renderChart === 'function') {
                    renderChart();
                }
            }
        };
        setTimeout(refreshSubjectProgressChart, 50);
        setTimeout(refreshSubjectProgressChart, 420);
    } else if (pageId === 'daily-actions') {
        if (typeof renderDailyTracker === 'function') renderDailyTracker();
        if (typeof renderDailyLogs === 'function') renderDailyLogs();
    } else if (pageId === 'paces-management') {
        if (typeof window.renderPaceGoals === 'function') window.renderPaceGoals(window.lastSubjectStats || (typeof updateMetrics === 'function' ? (updateMetrics(), window.lastSubjectStats) : {}));
    } else if (pageId === 'outcome') {
        if (typeof window.renderResults === 'function') window.renderResults();
        if (typeof window.renderPassConfig === 'function') window.renderPassConfig();
        if (typeof window.renderCelebrationConfig === 'function') window.renderCelebrationConfig();
        setTimeout(() => {
            if (window.resultsTrendChartInstance) window.resultsTrendChartInstance.resize();
        }, 50);
    } else if (pageId === 'master-config') {
        if (typeof window.populateTrackDropdowns === 'function') window.populateTrackDropdowns();
        if (typeof window.updateManageDropdown === 'function') window.updateManageDropdown();
        if (typeof window.renderPassConfig === 'function') window.renderPassConfig();
        if (typeof window.renderCelebrationConfig === 'function') window.renderCelebrationConfig();
        if (typeof window.renderPriorityConfig === 'function') window.renderPriorityConfig();

    } else if (pageId === 'schedule') {
        window.renderSchedulePage();
    }

    if (pageId === 'dashboard') {
        if (typeof renderUI === 'function') {
            renderUI();
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('app-wrapper')) return;
    if (AppState.isAppInitialized) return;
    // Loading screen safety fallback timer (3s max)
    setTimeout(() => {
        if (typeof window.dismissLoadingScreen === 'function') {
            window.dismissLoadingScreen();
        } else {
            const loadingEl = document.getElementById('auth-loading');
            const wrapperEl = document.getElementById('app-wrapper');
            if (loadingEl) loadingEl.remove();
            if (wrapperEl) wrapperEl.classList.remove('hidden');
        }
    }, 3000);

    // Dismiss tooltips on document click
    document.addEventListener('click', () => {
        if (window.hideChapterTooltip) window.hideChapterTooltip();
        if (window.hideSubjectChapterTooltip) window.hideSubjectChapterTooltip();
        if (window.hideSpectraChapterTooltip) window.hideSpectraChapterTooltip();
    });

    // Initialize Focus Timer Service
    if (window.TimerService) {
        window.TimerService.init();
    }

    // Start progress
    if (window.setLoadingProgress) window.setLoadingProgress(15, 'Initializing workspace...');

    // Load configurations & Initialize Firebase Service
    try {
        const config = await FirebaseService.fetchConfig();
        if (window.setLoadingProgress) window.setLoadingProgress(40, 'Connecting to server...');
        FirebaseService.init(config);
        if (window.setLoadingProgress) window.setLoadingProgress(55, 'Authenticating session...');
    } catch (e) {
        console.error("Firebase init failed:", e);
    }

    // Route guard
    FirebaseService.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const userEmail = (user.email || '').trim().toLowerCase();
        if (userEmail !== 'ris2k29@gmail.com') {
            FirebaseService.logout().then(() => {
                window.location.href = 'login.html?error=denied';
            });
            return;
        }

        // Authorized
        console.log("Admin authorized:", user.email);
        window.currentUser = user;
        if (window.setLoadingProgress) window.setLoadingProgress(70, 'Loading cloud workspace...');

        // Update profile section
        const displayName = user.displayName || 'ris2k29';
        const displayEmail = user.email;

        const profileNameEl = document.getElementById('profile-name');
        const profileEmailEl = document.getElementById('profile-email');
        const profileAvatarEl = document.getElementById('profile-avatar');
        if (profileNameEl) profileNameEl.textContent = displayName;
        if (profileEmailEl) profileEmailEl.textContent = displayEmail;
        if (profileAvatarEl) {
            profileAvatarEl.textContent = displayName.charAt(0).toUpperCase();
        }

        // Subscribe and sync from cloud
        FirebaseService.loadFromCloud();
        window.switchPage('dashboard');
    });

    // --- Progressive Web App (PWA) Logic ---
    let deferredPrompt = null;
    const installBtn = document.getElementById('pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) {
            installBtn.classList.remove('hidden');
            installBtn.classList.add('flex');
        }
        console.log("[PWA] beforeinstallprompt event fired.");
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`[PWA] User response to install prompt: ${outcome}`);
            if (outcome === 'accepted') {
                installBtn.classList.add('hidden');
                installBtn.classList.remove('flex');
            }
            deferredPrompt = null;
        });
    }

    window.addEventListener('appinstalled', (evt) => {
        console.log('[PWA] X-29 was installed successfully!');
        if (installBtn) {
            installBtn.classList.add('hidden');
            installBtn.classList.remove('flex');
        }
        if (typeof showToast === 'function') {
            showToast('X-29 Installed Successfully!', 'success');
        }
    });
});

/******************************************************************
 * LOGIN AUTH
 ******************************************************************/
document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('login-form')) return;
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const btnSubmit = document.getElementById('btn-submit');
    const spinner = document.getElementById('spinner');
    const errorBanner = document.getElementById('error-banner');
    const errorMessage = document.getElementById('error-message');

    // Show error banner if redirected with error
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'denied') {
        showError("Access denied. X-29 is private.");
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorBanner.classList.remove('hidden');
    }

    function hideError() {
        errorBanner.classList.add('hidden');
    }

    // Load configurations & Initialize Firebase
    let config;
    try {
        config = await FirebaseService.fetchConfig();
        FirebaseService.init(config);
        console.log("Firebase initialized for login.");
    } catch (e) {
        console.error("Firebase init error:", e);
        showError("Firebase initialization failed.");
        return;
    }

    // Route guard checking if user is already logged in as admin
    FirebaseService.onAuthStateChanged((user) => {
        if (user && (user.email || '').trim().toLowerCase() === 'ris2k29@gmail.com') {
            window.location.href = 'index.html';
        }
    });

    // Handle Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        btnSubmit.disabled = true;
        spinner.classList.remove('hidden');

        try {
            const userCredential = await FirebaseService.login(email, password);
            const user = userCredential.user;

            if ((user.email || '').trim().toLowerCase() !== 'ris2k29@gmail.com') {
                await FirebaseService.logout();
                showError("Access denied. X-29 is private.");
                btnSubmit.disabled = false;
                spinner.classList.add('hidden');
            } else {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error("Auth error:", error);
            let friendlyMsg = "Authentication failed. Please check your credentials.";
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                friendlyMsg = "Invalid email or password.";
            } else if (error.code === 'auth/invalid-email') {
                friendlyMsg = "Invalid email address format.";
            } else if (error.code === 'auth/user-disabled') {
                friendlyMsg = "This user account has been disabled.";
            }
            showError(friendlyMsg);
            btnSubmit.disabled = false;
            spinner.classList.add('hidden');
        }
    });
});



document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof window.renderSpectraCommitmentsChart === 'function') {
            window.renderSpectraCommitmentsChart();
        }
    }, 200);
});


// JSON backup, export, and import orchestration extracted to ES module: js/services/backup.js
// Backward-compatibility references maintained by window.restoreLocalBackup, window.importJSONBackup, window.exportJSONBackup


/* ===== SHARED EXAM COUNTDOWN UTILITIES ===== */
// Extracted to ES Module: js/features/exam/countdown.js
// Backward-compatibility references and live timer ticker maintained by js/features/exam/countdown.js

// Multi-Tab Fast Synchronization Listener for Daily Actions & Heat Maps
if (typeof window.BroadcastChannel !== 'undefined') {
    try {
        window.X29SyncChannel = new BroadcastChannel('x29_action_sync');
        window.X29SyncChannel.onmessage = function (ev) {
            if (!ev || !ev.data) return;
            if (ev.data.type === 'DAILY_ACTION_UPDATE') {
                if (typeof window.rebuildTaskDateMap === 'function') window.rebuildTaskDateMap();
                if (typeof renderDailyTracker === 'function') renderDailyTracker();
                if (typeof renderDailyLogs === 'function') renderDailyLogs();
                if (typeof window.renderSpectraCommitmentsChart === 'function') window.renderSpectraCommitmentsChart();
                if (typeof renderTrendCharts === 'function') renderTrendCharts();
                const modal = document.getElementById('analytics-modal');
                if (modal && !modal.classList.contains('hidden') && typeof populateAnalyticsModal === 'function') {
                    populateAnalyticsModal(window.currentAnalyticsAction || ev.data.actionId);
                }
                const dbModal = document.getElementById('daily-actions-db-modal');
                if (dbModal && !dbModal.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') {
                    window.openDailyActionsDBModal();
                }
            }
        };
    } catch (e) {
        console.warn("BroadcastChannel error:", e);
    }
}

// --- Automatic Midnight & New Day Rollover Monitor ---
window._lastActiveDateStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function')
    ? Utils.formatDate(typeof Utils.getDailyActionDate === 'function' ? Utils.getDailyActionDate() : new Date())
    : '';

window.checkAndRefreshDateChange = function () {
    if (typeof Utils === 'undefined' || typeof Utils.formatDate !== 'function') return;
    const activeDate = typeof Utils.getDailyActionDate === 'function' ? Utils.getDailyActionDate() : new Date();
    const currentDateStr = Utils.formatDate(activeDate);
    if (!window._lastActiveDateStr) {
        window._lastActiveDateStr = currentDateStr;
        return;
    }
    if (window._lastActiveDateStr !== currentDateStr) {
        console.log(`[X-29 Date Monitor] New day detected (${window._lastActiveDateStr} -> ${currentDateStr}). Refreshing daily actions and trackers.`);
        window._lastActiveDateStr = currentDateStr;

        if (typeof window.rebuildTaskDateMap === 'function') {
            window.rebuildTaskDateMap();
        }
        if (typeof renderDailyTracker === 'function') {
            renderDailyTracker();
        }
        if (typeof renderDailyLogs === 'function') {
            renderDailyLogs();
        }
        if (typeof window.renderDashboardDailyChecklist === 'function') {
            window.renderDashboardDailyChecklist();
        }
        if (typeof window.renderSpectraCommitmentsChart === 'function') {
            window.renderSpectraCommitmentsChart();
        }
        if (typeof renderTrendCharts === 'function') {
            renderTrendCharts();
        }
        if (typeof updateCountdown === 'function') {
            updateCountdown();
        }
        if (typeof window.updateExamCountdown === 'function') {
            window.updateExamCountdown();
        }
        if (typeof window.renderDashboardUpcomingExamCard === 'function') {
            window.renderDashboardUpcomingExamCard();
        }
        if (typeof window.renderDashboardPassedSubjectsCard === 'function') {
            window.renderDashboardPassedSubjectsCard();
        }
        const dbModal = document.getElementById('daily-actions-db-modal');
        if (dbModal && !dbModal.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') {
            window.openDailyActionsDBModal();
        }
    }
};

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        window.checkAndRefreshDateChange();
    }
});
window.addEventListener('focus', () => {
    window.checkAndRefreshDateChange();
});
setInterval(() => {
    window.checkAndRefreshDateChange();
}, 5000);

