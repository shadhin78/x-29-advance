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

// Task slot allocation engine extracted to js/features/tasks/taskEngine.js
window.ensureAvailableSlots = function (slotsNeeded, track, startIndex) {
    if (window.TaskEngine && typeof window.TaskEngine.ensureAvailableSlots === 'function') {
        return window.TaskEngine.ensureAvailableSlots(slotsNeeded, track, startIndex);
    }
};
function ensureAvailableSlots(slotsNeeded, track, startIndex) {
    return window.ensureAvailableSlots(slotsNeeded, track, startIndex);
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
    if (window.Metrics && typeof window.Metrics.recalculateTotals === 'function') {
        return window.Metrics.recalculateTotals();
    }
    let total = 0;
    window.tracks.forEach(trackObj => {
        const track = trackObj.id;
        if (Array.isArray(syllabusStructure[track])) {
            total += syllabusStructure[track].reduce((acc, s) => acc + s.chapters, 0);
        }
    });
    totalStaticChapters = total;
}
window.recalculateTotals = recalculateTotals;

window.openRevisionModal = function () {
    if (window.TaskEngine && typeof window.TaskEngine.openRevisionModal === 'function') {
        return window.TaskEngine.openRevisionModal();
    }
    window.renderRevisionModalContent();
    openModal('revision-manage-modal');
};

window.renderRevisionModalContent = function () {
    if (window.TaskEngine && typeof window.TaskEngine.renderRevisionModalContent === 'function') {
        return window.TaskEngine.renderRevisionModalContent();
    }
};

window.toggleRevisionMode = function (sub) {
    if (window.TaskEngine && typeof window.TaskEngine.toggleRevisionMode === 'function') {
        return window.TaskEngine.toggleRevisionMode(sub);
    }
};

window.toggleRevisionChapter = function (sub, chNum, isChecked) {
    if (window.TaskEngine && typeof window.TaskEngine.toggleRevisionChapter === 'function') {
        return window.TaskEngine.toggleRevisionChapter(sub, chNum, isChecked);
    }
};

function generateStudyPlan() {
    if (window.TaskEngine && typeof window.TaskEngine.generateStudyPlan === 'function') {
        return window.TaskEngine.generateStudyPlan();
    }
    return [];
}
window.generateStudyPlan = generateStudyPlan;

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
    if (window.TaskEngine && typeof window.TaskEngine.rebuildTaskDates === 'function') {
        return window.TaskEngine.rebuildTaskDates(shouldSave);
    }
}
window.rebuildTaskDates = rebuildTaskDates;

function updateGlobalDates() {
    if (window.Metrics && typeof window.Metrics.updateGlobalDates === 'function') {
        return window.Metrics.updateGlobalDates();
    }
}
window.updateGlobalDates = updateGlobalDates;

window.updateTrendsStartDate = function (newDateStr) {
    if (window.DashboardCore && typeof window.DashboardCore.updateTrendsStartDate === 'function') {
        return window.DashboardCore.updateTrendsStartDate(newDateStr);
    }
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
    if (window.DashboardCore && typeof window.DashboardCore.renderUI === 'function') {
        return window.DashboardCore.renderUI();
    }
}
window.renderUI = renderUI;

function setupFocusTodayButton() {
    if (window.DashboardCore && typeof window.DashboardCore.setupFocusTodayButton === 'function') {
        return window.DashboardCore.setupFocusTodayButton();
    }
}
window.setupFocusTodayButton = setupFocusTodayButton;

function updateCountdown() {
    if (window.Metrics && typeof window.Metrics.updateCountdown === 'function') {
        return window.Metrics.updateCountdown();
    }
}
window.updateCountdown = updateCountdown;

function updateSuccessScore() {
    if (window.Metrics && typeof window.Metrics.updateSuccessScore === 'function') {
        return window.Metrics.updateSuccessScore();
    }
}
window.updateSuccessScore = updateSuccessScore;

window.setFilter = function (val) {
    if (window.TaskEngine && typeof window.TaskEngine.setFilter === 'function') {
        return window.TaskEngine.setFilter(val);
    }
    AppState.currentFilter = val;
    window.subjectDetailsState = {};
    renderSubjectNavigation();
    renderTaskList();
    updateMetrics();
    renderTrendCharts();
};

/* [Moved to pages/Analytics/Analytics.js] window.setTrendFilter */

function renderTaskList() {
    if (window.TaskEngine && typeof window.TaskEngine.renderTaskList === 'function') {
        return window.TaskEngine.renderTaskList();
    }
}
window.renderTaskList = renderTaskList;

function handleTaskToggle(e) {
    if (window.TaskEngine && typeof window.TaskEngine.handleTaskToggle === 'function') {
        return window.TaskEngine.handleTaskToggle(e);
    }
}
window.handleTaskToggle = handleTaskToggle;

function updateMetrics() {
    if (window.Metrics && typeof window.Metrics.updateMetrics === 'function') {
        return window.Metrics.updateMetrics();
    }
}
window.updateMetrics = updateMetrics;

function renderSubjectProgress(subjectStats) {
    if (window.SubjectGoals && typeof window.SubjectGoals.renderSubjectProgress === 'function') {
        return window.SubjectGoals.renderSubjectProgress(subjectStats);
    }
}
window.renderSubjectProgress = renderSubjectProgress;

function renderSubjectNavigation() {
    if (window.SubjectGoals && typeof window.SubjectGoals.renderSubjectNavigation === 'function') {
        return window.SubjectGoals.renderSubjectNavigation();
    }
}
window.renderSubjectNavigation = renderSubjectNavigation;

function renderCategoryProgress(subjectStats) {
    if (window.SubjectGoals && typeof window.SubjectGoals.renderCategoryProgress === 'function') {
        return window.SubjectGoals.renderCategoryProgress(subjectStats);
    }
}
window.renderCategoryProgress = renderCategoryProgress;

function renderTrackProgress(subjectStats) {
    if (window.SubjectGoals && typeof window.SubjectGoals.renderTrackProgress === 'function') {
        return window.SubjectGoals.renderTrackProgress(subjectStats);
    }
}
window.renderTrackProgress = renderTrackProgress;

window.openProgramCompletionsModal = function (track, programName) {
    if (window.SubjectGoals && typeof window.SubjectGoals.openProgramCompletionsModal === 'function') {
        return window.SubjectGoals.openProgramCompletionsModal(track, programName);
    }
};

window.getChapterStatus = function (subName, chNum, trackId = null) {
    if (window.TaskEngine && typeof window.TaskEngine.getChapterStatus === 'function') {
        return window.TaskEngine.getChapterStatus(subName, chNum, trackId);
    }
};

window.getSubjectSkippedCount = function (subName, trackId = null) {
    if (window.TaskEngine && typeof window.TaskEngine.getSubjectSkippedCount === 'function') {
        return window.TaskEngine.getSubjectSkippedCount(subName, trackId);
    }
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
    if (window.TaskEngine && typeof window.TaskEngine.reorderSubjectChapters === 'function') {
        return window.TaskEngine.reorderSubjectChapters(prog, subj);
    }
}
window.reorderSubjectChapters = reorderSubjectChapters;

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
    if (window.SubjectGoals && typeof window.SubjectGoals.openSubjectTimeModal === 'function') {
        return window.SubjectGoals.openSubjectTimeModal(subjectName);
    }
};

window.saveSubjectTimeGoal = function () {
    if (window.SubjectGoals && typeof window.SubjectGoals.saveSubjectTimeGoal === 'function') {
        return window.SubjectGoals.saveSubjectTimeGoal();
    }
};

window.clearSubjectTimeGoal = function () {
    if (window.SubjectGoals && typeof window.SubjectGoals.clearSubjectTimeGoal === 'function') {
        return window.SubjectGoals.clearSubjectTimeGoal();
    }
};

window.updateEsmProgramDropdown = function () {
    if (window.SubjectGoals && typeof window.SubjectGoals.updateEsmProgramDropdown === 'function') {
        return window.SubjectGoals.updateEsmProgramDropdown();
    }
};

window.openSubjectEditModal = function (subName) {
    if (window.SubjectGoals && typeof window.SubjectGoals.openSubjectEditModal === 'function') {
        return window.SubjectGoals.openSubjectEditModal(subName);
    }
};

window.saveSubjectEditModal = function () {
    if (window.SubjectGoals && typeof window.SubjectGoals.saveSubjectEditModal === 'function') {
        return window.SubjectGoals.saveSubjectEditModal();
    }
};

window.requestDeleteSubjectFromModal = function () {
    if (window.SubjectGoals && typeof window.SubjectGoals.requestDeleteSubjectFromModal === 'function') {
        return window.SubjectGoals.requestDeleteSubjectFromModal();
    }
};

window.executeDeleteSubjectFromModal = function (targetName) {
    if (window.SubjectGoals && typeof window.SubjectGoals.executeDeleteSubjectFromModal === 'function') {
        return window.SubjectGoals.executeDeleteSubjectFromModal(targetName);
    }
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
    if (window.TaskEngine && typeof window.TaskEngine.openEditModal === 'function') {
        return window.TaskEngine.openEditModal(taskId, type, subTaskId);
    }
};

window.toggleSkipTask = function () {
    if (window.TaskEngine && typeof window.TaskEngine.toggleSkipTask === 'function') {
        return window.TaskEngine.toggleSkipTask();
    }
};

window.saveTaskEdit = function () {
    if (window.TaskEngine && typeof window.TaskEngine.saveTaskEdit === 'function') {
        return window.TaskEngine.saveTaskEdit();
    }
};

window.requestDeleteTask = function () {
    if (window.TaskEngine && typeof window.TaskEngine.requestDeleteTask === 'function') {
        return window.TaskEngine.requestDeleteTask();
    }
};

window.deleteTask = function () {
    if (window.TaskEngine && typeof window.TaskEngine.deleteTask === 'function') {
        return window.TaskEngine.deleteTask();
    }
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
// Modularized: Core Monthly Targets calculations & sync logic are in js/features/targets/monthlyTargets.js
window.monthlyTargetsDatabase = window.monthlyTargetsDatabase || {};
window.currentMonthlyTargetsDate = window.currentMonthlyTargetsDate || new Date();
window.monthlyTargetDailyAllocations = window.monthlyTargetDailyAllocations || {};

window.isSubjectCompleted = function (track, subject) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.isSubjectCompleted === 'function') {
        return window.MonthlyTargets.isSubjectCompleted(track, subject);
    }
};

window.getMonthlyTargetRange = function (date = new Date()) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.getMonthlyTargetRange === 'function') {
        return window.MonthlyTargets.getMonthlyTargetRange(date);
    }
};

window.formatMonthRangeKey = function (start, end) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.formatMonthRangeKey === 'function') {
        return window.MonthlyTargets.formatMonthRangeKey(start, end);
    }
};

window.getCompletedSizeForMonthlyTarget = function (target, monthKey) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.getCompletedSizeForMonthlyTarget === 'function') {
        return window.MonthlyTargets.getCompletedSizeForMonthlyTarget(target, monthKey);
    }
};

window.getMonthlyTargetProgress = function (target, monthKey) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.getMonthlyTargetProgress === 'function') {
        return window.MonthlyTargets.getMonthlyTargetProgress(target, monthKey);
    }
};

window.getMonthlyTargetOccurrenceCount = function (track, subject, chapter, targetType = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.getMonthlyTargetOccurrenceCount === 'function') {
        return window.MonthlyTargets.getMonthlyTargetOccurrenceCount(track, subject, chapter, targetType);
    }
};

window.getMonthlyTargetInstanceOccurrence = function (targetMonthKey, target, targetIdx = -1) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.getMonthlyTargetInstanceOccurrence === 'function') {
        return window.MonthlyTargets.getMonthlyTargetInstanceOccurrence(targetMonthKey, target, targetIdx);
    }
};

window.isMatchMonthlyTargetWithChild = function (mt, child) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.isMatchMonthlyTargetWithChild === 'function') {
        return window.MonthlyTargets.isMatchMonthlyTargetWithChild(mt, child);
    }
};

window.cascadeDeleteMonthlyTarget = function (target, monthKey = null, targetId = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.cascadeDeleteMonthlyTarget === 'function') {
        return window.MonthlyTargets.cascadeDeleteMonthlyTarget(target, monthKey, targetId);
    }
};

window.cleanOrphanedWeeklyAndDailyTargets = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.cleanOrphanedWeeklyAndDailyTargets === 'function') {
        return window.MonthlyTargets.cleanOrphanedWeeklyAndDailyTargets();
    }
};

window.updateMonthlyTargetColorSync = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.updateMonthlyTargetColorSync === 'function') {
        return window.MonthlyTargets.updateMonthlyTargetColorSync();
    }
};

window.populateMonthlyProgramsList = function (preselectedProgram = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.populateMonthlyProgramsList === 'function') {
        return window.MonthlyTargets.populateMonthlyProgramsList(preselectedProgram);
    }
};

window.toggleMonthlyProgramsDropdown = function (forceState = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleMonthlyProgramsDropdown === 'function') {
        return window.MonthlyTargets.toggleMonthlyProgramsDropdown(forceState);
    }
};

window.toggleMonthlyProgramCard = function (trackId, progName, event) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleMonthlyProgramCard === 'function') {
        return window.MonthlyTargets.toggleMonthlyProgramCard(trackId, progName, event);
    }
};

window.toggleAllMonthlyPrograms = function (select) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleAllMonthlyPrograms === 'function') {
        return window.MonthlyTargets.toggleAllMonthlyPrograms(select);
    }
};

window.handleMonthlyProgramToggle = function (preselectSubject = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.handleMonthlyProgramToggle === 'function') {
        return window.MonthlyTargets.handleMonthlyProgramToggle(preselectSubject);
    }
};

window.updateMonthlyTargetSubjectDropdown = function (preselectSubject = null, preselectChapter = null, preselectSize = null, preselectWeek = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.updateMonthlyTargetSubjectDropdown === 'function') {
        return window.MonthlyTargets.updateMonthlyTargetSubjectDropdown(preselectSubject, preselectChapter, preselectSize, preselectWeek);
    }
};

window.toggleMonthlySubjectsDropdown = function (forceState = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleMonthlySubjectsDropdown === 'function') {
        return window.MonthlyTargets.toggleMonthlySubjectsDropdown(forceState);
    }
};

window.toggleMonthlySubjectCard = function (trackId, progName, subjectName, event) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleMonthlySubjectCard === 'function') {
        return window.MonthlyTargets.toggleMonthlySubjectCard(trackId, progName, subjectName, event);
    }
};

window.toggleAllMonthlySubjects = function (select) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleAllMonthlySubjects === 'function') {
        return window.MonthlyTargets.toggleAllMonthlySubjects(select);
    }
};

window.handleMonthlySubjectToggle = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.handleMonthlySubjectToggle === 'function') {
        return window.MonthlyTargets.handleMonthlySubjectToggle();
    }
};

window.updateMonthlyTargetChapterDropdown = function (preselectChapter = null, preselectSize = null, targetSubject = null, preselectWeek = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.updateMonthlyTargetChapterDropdown === 'function') {
        return window.MonthlyTargets.updateMonthlyTargetChapterDropdown(preselectChapter, preselectSize, targetSubject, preselectWeek);
    }
};

window.toggleAllMonthlyChaptersForSubject = function (subjectName, select, trackId = null, progName = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleAllMonthlyChaptersForSubject === 'function') {
        return window.MonthlyTargets.toggleAllMonthlyChaptersForSubject(subjectName, select, trackId, progName);
    }
};

window.toggleAllMonthlyChapters = function (select) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleAllMonthlyChapters === 'function') {
        return window.MonthlyTargets.toggleAllMonthlyChapters(select);
    }
};

window.handleMonthlyWholeSubjectToggle = function (subjectName, isChecked, trackId = null, progName = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.handleMonthlyWholeSubjectToggle === 'function') {
        return window.MonthlyTargets.handleMonthlyWholeSubjectToggle(subjectName, isChecked, trackId, progName);
    }
};

window.handleMonthlyChapterCheckChange = function (checkboxEl, subjectName) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.handleMonthlyChapterCheckChange === 'function') {
        return window.MonthlyTargets.handleMonthlyChapterCheckChange(checkboxEl, subjectName);
    }
};

window.filterMonthlyTargetChapters = function (query) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.filterMonthlyTargetChapters === 'function') {
        return window.MonthlyTargets.filterMonthlyTargetChapters(query);
    }
};

window.setBulkSizePreset = function (val) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.setBulkSizePreset === 'function') {
        return window.MonthlyTargets.setBulkSizePreset(val);
    }
};

window.findWeekForDayInMonth = function (dayKey, targetMonthDate = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.findWeekForDayInMonth === 'function') {
        return window.MonthlyTargets.findWeekForDayInMonth(dayKey, targetMonthDate);
    }
};

window.bindTargetToWeek = function (subject, chapter, weekKey, track = null, program = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.bindTargetToWeek === 'function') {
        return window.MonthlyTargets.bindTargetToWeek(subject, chapter, weekKey, track, program);
    }
};

window.updateChapterMultiWeekBadges = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.updateChapterMultiWeekBadges === 'function') {
        return window.MonthlyTargets.updateChapterMultiWeekBadges();
    }
};

window.adjustDailyAllocationsForTargetWeek = function (subject, chapter, weekKey) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.adjustDailyAllocationsForTargetWeek === 'function') {
        return window.MonthlyTargets.adjustDailyAllocationsForTargetWeek(subject, chapter, weekKey);
    }
};

window.handleMonthlyChapterWeekSelectChange = function (subject, chapter, weekKey, trackId = null, progName = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.handleMonthlyChapterWeekSelectChange === 'function') {
        return window.MonthlyTargets.handleMonthlyChapterWeekSelectChange(subject, chapter, weekKey, trackId, progName);
    }
};

window.applyBulkWeekToMonthlyChapters = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.applyBulkWeekToMonthlyChapters === 'function') {
        return window.MonthlyTargets.applyBulkWeekToMonthlyChapters();
    }
};

window.distributeChaptersAcrossWeeks = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.distributeChaptersAcrossWeeks === 'function') {
        return window.MonthlyTargets.distributeChaptersAcrossWeeks();
    }
};

window.recalculateDailyAllocationsForChapter = function (subject, chapter, totalSize) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.recalculateDailyAllocationsForChapter === 'function') {
        return window.MonthlyTargets.recalculateDailyAllocationsForChapter(subject, chapter, totalSize);
    }
};

window.handleMonthlyChapterSizeInputChange = function (inputEl) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.handleMonthlyChapterSizeInputChange === 'function') {
        return window.MonthlyTargets.handleMonthlyChapterSizeInputChange(inputEl);
    }
};

window.getAssignedWeekKeyForTarget = function (subject, chapter, track = null, program = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.getAssignedWeekKeyForTarget === 'function') {
        return window.MonthlyTargets.getAssignedWeekKeyForTarget(subject, chapter, track, program);
    }
};

window.renderMonthlyTargetDailyAllocations = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.renderMonthlyTargetDailyAllocations === 'function') {
        return window.MonthlyTargets.renderMonthlyTargetDailyAllocations();
    }
};

window.updateDailyAllocationBadgesInPlace = function (subject, chapter) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.updateDailyAllocationBadgesInPlace === 'function') {
        return window.MonthlyTargets.updateDailyAllocationBadgesInPlace(subject, chapter);
    }
};

window.addDailyAllocationRow = function (subject, chapter, defaultDay = '', defaultSize = null, track = null, program = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.addDailyAllocationRow === 'function') {
        return window.MonthlyTargets.addDailyAllocationRow(subject, chapter, defaultDay, defaultSize, track, program);
    }
};

window.removeDailyAllocationRow = function (subject, chapter, rowIdx) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.removeDailyAllocationRow === 'function') {
        return window.MonthlyTargets.removeDailyAllocationRow(subject, chapter, rowIdx);
    }
};

window.splitChapterAcrossDays = function (subject, chapter, numDays, track = null, program = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.splitChapterAcrossDays === 'function') {
        return window.MonthlyTargets.splitChapterAcrossDays(subject, chapter, numDays, track, program);
    }
};

window.splitAllChaptersAcrossDays = function (numDays) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.splitAllChaptersAcrossDays === 'function') {
        return window.MonthlyTargets.splitAllChaptersAcrossDays(numDays);
    }
};

window.updateDailyAllocationDay = function (subject, chapter, rowIdx, dayKey, track = null, program = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.updateDailyAllocationDay === 'function') {
        return window.MonthlyTargets.updateDailyAllocationDay(subject, chapter, rowIdx, dayKey, track, program);
    }
};

window.updateDailyAllocationSize = function (subject, chapter, rowIdx, sizeVal, inputEl) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.updateDailyAllocationSize === 'function') {
        return window.MonthlyTargets.updateDailyAllocationSize(subject, chapter, rowIdx, sizeVal, inputEl);
    }
};

window.applyFractionToDailyAllocation = function (subject, chapter, rowIdx, fractionVal, fractionLabel) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.applyFractionToDailyAllocation === 'function') {
        return window.MonthlyTargets.applyFractionToDailyAllocation(subject, chapter, rowIdx, fractionVal, fractionLabel);
    }
};

window.autoSpreadAllChaptersAcrossDays = function (mode = 'month') {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.autoSpreadAllChaptersAcrossDays === 'function') {
        return window.MonthlyTargets.autoSpreadAllChaptersAcrossDays(mode);
    }
};

window.spreadAllChaptersFromStartDate = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.spreadAllChaptersFromStartDate === 'function') {
        return window.MonthlyTargets.spreadAllChaptersFromStartDate();
    }
};

window.applyBulkDayToAllChapters = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.applyBulkDayToAllChapters === 'function') {
        return window.MonthlyTargets.applyBulkDayToAllChapters();
    }
};

window.clearAllDailyAllocations = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.clearAllDailyAllocations === 'function') {
        return window.MonthlyTargets.clearAllDailyAllocations();
    }
};

window.updateMonthlyTargetPageSummary = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.updateMonthlyTargetPageSummary === 'function') {
        return window.MonthlyTargets.updateMonthlyTargetPageSummary();
    }
};

window.applyBulkSizeToMonthlyChapters = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.applyBulkSizeToMonthlyChapters === 'function') {
        return window.MonthlyTargets.applyBulkSizeToMonthlyChapters();
    }
};

window.getWeeksForMonth = function (date = new Date()) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.getWeeksForMonth === 'function') {
        return window.MonthlyTargets.getWeeksForMonth(date);
    }
};

window.getDaysForMonthOrWeek = function (monthDate = new Date(), weekKey = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.getDaysForMonthOrWeek === 'function') {
        return window.MonthlyTargets.getDaysForMonthOrWeek(monthDate, weekKey);
    }
};

window.populateMonthlyTargetWeeksAndDays = function (monthDate = new Date(), selectedWeekKey = null, selectedDayKey = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.populateMonthlyTargetWeeksAndDays === 'function') {
        return window.MonthlyTargets.populateMonthlyTargetWeeksAndDays(monthDate, selectedWeekKey, selectedDayKey);
    }
};

window.updateMonthlyTargetDaysDropdown = function (monthDate = new Date(), weekKey = null, selectedDayKey = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.updateMonthlyTargetDaysDropdown === 'function') {
        return window.MonthlyTargets.updateMonthlyTargetDaysDropdown(monthDate, weekKey, selectedDayKey);
    }
};

window.handleMonthlyTargetWeekChange = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.handleMonthlyTargetWeekChange === 'function') {
        return window.MonthlyTargets.handleMonthlyTargetWeekChange();
    }
};

window.handleMonthlyTargetDayChange = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.handleMonthlyTargetDayChange === 'function') {
        return window.MonthlyTargets.handleMonthlyTargetDayChange();
    }
};

window.addMonthlyTarget = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.addMonthlyTarget === 'function') {
        return window.MonthlyTargets.addMonthlyTarget();
    }
};

window.deleteMonthlyTarget = function (idx, targetId = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.deleteMonthlyTarget === 'function') {
        return window.MonthlyTargets.deleteMonthlyTarget(idx, targetId);
    }
};

window.toggleMonthlyTargetCompletion = function (idx, isCompleted) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleMonthlyTargetCompletion === 'function') {
        return window.MonthlyTargets.toggleMonthlyTargetCompletion(idx, isCompleted);
    }
};

window.navigateMonth = function (mode) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.navigateMonth === 'function') {
        return window.MonthlyTargets.navigateMonth(mode);
    }
};

window.renderMonthlyTargets = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.renderMonthlyTargets === 'function') {
        return window.MonthlyTargets.renderMonthlyTargets();
    }
};

window.openAddMonthlyTargetPage = function (targetDate = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.openAddMonthlyTargetPage === 'function') {
        return window.MonthlyTargets.openAddMonthlyTargetPage(targetDate);
    }
};

window.setMonthlyTargetSetupMonthDate = function (monthVal) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.setMonthlyTargetSetupMonthDate === 'function') {
        return window.MonthlyTargets.setMonthlyTargetSetupMonthDate(monthVal);
    }
};

window.updateMonthlyTargetSetupNavButtons = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.updateMonthlyTargetSetupNavButtons === 'function') {
        return window.MonthlyTargets.updateMonthlyTargetSetupNavButtons();
    }
};

window.navigateMonthlyTargetSetupMonth = function (mode) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.navigateMonthlyTargetSetupMonth === 'function') {
        return window.MonthlyTargets.navigateMonthlyTargetSetupMonth(mode);
    }
};

window.openAddMonthlyTargetModal = function (targetDate = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.openAddMonthlyTargetModal === 'function') {
        return window.MonthlyTargets.openAddMonthlyTargetModal(targetDate);
    }
};

window.openEditMonthlyTargetPage = function (idx, monthKey = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.openEditMonthlyTargetPage === 'function') {
        return window.MonthlyTargets.openEditMonthlyTargetPage(idx, monthKey);
    }
};

window.openEditMonthlyTargetModal = function (idx, monthKey = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.openEditMonthlyTargetModal === 'function') {
        return window.MonthlyTargets.openEditMonthlyTargetModal(idx, monthKey);
    }
};

window.closeMonthlyTargetPage = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.closeMonthlyTargetPage === 'function') {
        return window.MonthlyTargets.closeMonthlyTargetPage();
    }
};

window.deleteMonthlyTargetFromEditPage = function (idx, monthKey = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.deleteMonthlyTargetFromEditPage === 'function') {
        return window.MonthlyTargets.deleteMonthlyTargetFromEditPage(idx, monthKey);
    }
};

window.saveMonthlyTarget = function (idx, originalMonthKey = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.saveMonthlyTarget === 'function') {
        return window.MonthlyTargets.saveMonthlyTarget(idx, originalMonthKey);
    }
};

// --- Monthly Targets Database Modal Controls & Logic ---
// Modularized: MTDB controls, table renderer & trend charts are in js/features/targets/monthlyTargets.js
window.openMonthlyTargetsDatabase = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.openMonthlyTargetsDatabase === 'function') {
        return window.MonthlyTargets.openMonthlyTargetsDatabase();
    }
};

window.switchMtdbTab = function (tab) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.switchMtdbTab === 'function') {
        return window.MonthlyTargets.switchMtdbTab(tab);
    }
};

window.populateMtdbFilters = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.populateMtdbFilters === 'function') {
        return window.MonthlyTargets.populateMtdbFilters();
    }
};

window.renderMtdbList = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.renderMtdbList === 'function') {
        return window.MonthlyTargets.renderMtdbList();
    }
};

window.deleteMtdbTarget = function (monthKey, idx, targetId = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.deleteMtdbTarget === 'function') {
        return window.MonthlyTargets.deleteMtdbTarget(monthKey, idx, targetId);
    }
};

window.toggleMtdbTargetCompletion = function (monthKey, idx, isCompleted) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleMtdbTargetCompletion === 'function') {
        return window.MonthlyTargets.toggleMtdbTargetCompletion(monthKey, idx, isCompleted);
    }
};

window.calculateMonthWiseMonthlyTargets = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.calculateMonthWiseMonthlyTargets === 'function') {
        return window.MonthlyTargets.calculateMonthWiseMonthlyTargets();
    }
};

window.renderMtdbMonthChart = function (monthsList) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.renderMtdbMonthChart === 'function') {
        return window.MonthlyTargets.renderMtdbMonthChart(monthsList);
    }
};

window.renderMtdbMonthView = function () {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.renderMtdbMonthView === 'function') {
        return window.MonthlyTargets.renderMtdbMonthView();
    }
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
    if (window.TaskEngine && typeof window.TaskEngine.isSubjectPassed === 'function') {
        return window.TaskEngine.isSubjectPassed(track, subject, progName);
    }
};

window.isChapterCompleted = function (track, subject, chapter) {
    if (window.TaskEngine && typeof window.TaskEngine.isChapterCompleted === 'function') {
        return window.TaskEngine.isChapterCompleted(track, subject, chapter);
    }
};

window.isChapterSkipped = function (track, subject, chapter) {
    if (window.TaskEngine && typeof window.TaskEngine.isChapterSkipped === 'function') {
        return window.TaskEngine.isChapterSkipped(track, subject, chapter);
    }
};

window.findTaskChapter = function (track, subject, chapter) {
    if (window.TaskEngine && typeof window.TaskEngine.findTaskChapter === 'function') {
        return window.TaskEngine.findTaskChapter(track, subject, chapter);
    }
};

window.syncTaskChapterCompletion = function (track, subject, chapter, isCompleted, completedAt = null) {
    if (window.TaskEngine && typeof window.TaskEngine.syncTaskChapterCompletion === 'function') {
        return window.TaskEngine.syncTaskChapterCompletion(track, subject, chapter, isCompleted, completedAt);
    }
};

window.getChaptersForSubject = function (track, subject) {
    if (window.TaskEngine && typeof window.TaskEngine.getChaptersForSubject === 'function') {
        return window.TaskEngine.getChaptersForSubject(track, subject);
    }
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

window.toggleWeeklyTargetCompletion = function (idx, isCompleted, weekKey = null) {
    if (window.WeeklyTargets && typeof window.WeeklyTargets.toggleWeeklyTargetCompletion === 'function') {
        return window.WeeklyTargets.toggleWeeklyTargetCompletion(idx, isCompleted, weekKey);
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

