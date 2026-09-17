/* ===== CONSOLIDATED JAVASCRIPT ===== */

/******************************************************************
 * UTILITIES
 ******************************************************************/
// js/utils.js (Left behind utilities depending on DOM/Global states)

// Delegated to js/utils/colors.js and js/utils.js
var getSubjectColor = (typeof window !== 'undefined' && typeof window.getSubjectColor === 'function')
    ? window.getSubjectColor
    : (typeof global !== 'undefined' && typeof global.getSubjectColor === 'function')
        ? global.getSubjectColor
        : function (subjName) {
            if (typeof Utils !== 'undefined' && typeof Utils.getSubjectColor === 'function') {
                return Utils.getSubjectColor(subjName);
            }
            const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
            let hash = 0;
            const str = String(subjName || '');
            for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            return colors[Math.abs(hash) % colors.length];
        };

var hexToRgba = (typeof window !== 'undefined' && typeof window.hexToRgba === 'function')
    ? window.hexToRgba
    : (typeof global !== 'undefined' && typeof global.hexToRgba === 'function')
        ? global.hexToRgba
        : function (hex, alpha) {
            if (typeof Utils !== 'undefined' && typeof Utils.hexToRgba === 'function') {
                return Utils.hexToRgba(hex, alpha);
            }
            if (!hex) return `rgba(16, 185, 129, ${alpha})`;
            const clean = String(hex).replace('#', '');
            let r = 0, g = 0, b = 0;
            if (clean.length === 3) {
                r = parseInt(clean[0] + clean[0], 16);
                g = parseInt(clean[1] + clean[1], 16);
                b = parseInt(clean[2] + clean[2], 16);
            } else if (clean.length === 6) {
                r = parseInt(clean.substring(0, 2), 16);
                g = parseInt(clean.substring(2, 4), 16);
                b = parseInt(clean.substring(4, 6), 16);
            }
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

if (typeof window !== 'undefined') {
    window.getSubjectColor = getSubjectColor;
    window.hexToRgba = hexToRgba;
}
if (typeof global !== 'undefined') {
    global.getSubjectColor = getSubjectColor;
    global.hexToRgba = hexToRgba;
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
// Master data migration and sanitization engine extracted to js/state.js & js/core/state.js
// Canonical implementations owned by js/state.js; backward-compatibility references on window maintained.

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

// Curriculum Taxonomy (getSortedPrograms, sortAllSubjects, getSortedTrackSubjects)
// Extracted to canonical service module: js/services/taxonomy.js
// Backward-compatibility references maintained by js/services/taxonomy.js


/******************************************************************
 * FIREBASE
 ******************************************************************/
// js/firebase.js (Firebase service delegation wrapper)

window.handleLogout = function () {
    const authProvider = (typeof window !== 'undefined' && window.AuthService) ? window.AuthService : FirebaseService;
    authProvider.logout().then(() => {
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

let defaultTasks = typeof generateStudyPlan === 'function' ? generateStudyPlan() : [];
if (typeof AppState !== 'undefined' && AppState) {
    AppState.tasks = defaultTasks;
} else if (typeof window !== 'undefined' && window.AppState) {
    window.AppState.tasks = defaultTasks;
}
if (typeof recalculateTotals === 'function') {
    recalculateTotals();
}





window.openAccountSettingsModal = function () {
    if (window.AuthService && typeof window.AuthService.openAccountSettingsModal === 'function') {
        return window.AuthService.openAccountSettingsModal();
    }
};

window.submitAccountUpdate = function () {
    if (window.AuthService && typeof window.AuthService.submitAccountUpdate === 'function') {
        return window.AuthService.submitAccountUpdate();
    }
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

// Dashboard Progress Doughnut Chart extracted to js/features/dashboard/dashboard.js
function renderChart() {
    if (window.DashboardCore && typeof window.DashboardCore.renderChart === 'function') {
        return window.DashboardCore.renderChart();
    }
}
window.renderChart = renderChart;

/* ==========================================================================
   Analytical Trend Charts, Legends & Heatmap extracted to:
   - js/features/analytics/spectra.js (SpectraAnalytics)
   - js/features/analytics/heatmap.js (HeatmapAnalytics)
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
    if (window.SpectraAnalytics && typeof window.SpectraAnalytics.toggleSubDataset === 'function') {
        return window.SpectraAnalytics.toggleSubDataset(k);
    }
};

window.toggleRevSubDataset = function (k) {
    if (window.SpectraAnalytics && typeof window.SpectraAnalytics.toggleRevSubDataset === 'function') {
        return window.SpectraAnalytics.toggleRevSubDataset(k);
    }
};

window.updateRevisionLegends = function () {
    if (window.SpectraAnalytics && typeof window.SpectraAnalytics.updateRevisionLegends === 'function') {
        return window.SpectraAnalytics.updateRevisionLegends();
    }
};

window.updateLegends = function () {
    if (window.SpectraAnalytics && typeof window.SpectraAnalytics.updateLegends === 'function') {
        return window.SpectraAnalytics.updateLegends();
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


// Universal modal visibility and transition subsystem extracted to: js/shared/modals.js
// Canonical implementation and backward-compatibility references maintained by window.openModal, window.closeModal

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
    if (window.ChapterMap && typeof window.ChapterMap.openSubjectTrendModal === 'function') {
        return window.ChapterMap.openSubjectTrendModal();
    }
};

window.openSingleSubjectTrendModal = function (subjectName) {
    if (window.ChapterMap && typeof window.ChapterMap.openSingleSubjectTrendModal === 'function') {
        return window.ChapterMap.openSingleSubjectTrendModal(subjectName);
    }
};

window.setSubjectTrendChartStyle = function (style) {
    if (window.ChapterMap && typeof window.ChapterMap.setSubjectTrendChartStyle === 'function') {
        return window.ChapterMap.setSubjectTrendChartStyle(style);
    }
};

// --- Multi-select dropdown helpers for Subject Trend modal ---
window.stmToggleDropdown = function () {
    if (window.ChapterMap && typeof window.ChapterMap.stmToggleDropdown === 'function') {
        return window.ChapterMap.stmToggleDropdown();
    }
};

window.stmSelectSubject = function (subjectName) {
    if (window.ChapterMap && typeof window.ChapterMap.stmSelectSubject === 'function') {
        return window.ChapterMap.stmSelectSubject(subjectName);
    }
};

window.stmToggleSubjectCheck = function (subjectName) {
    if (window.ChapterMap && typeof window.ChapterMap.stmToggleSubjectCheck === 'function') {
        return window.ChapterMap.stmToggleSubjectCheck(subjectName);
    }
};

window.stmSelectAll = function () {
    if (window.ChapterMap && typeof window.ChapterMap.stmSelectAll === 'function') {
        return window.ChapterMap.stmSelectAll();
    }
};

window.stmDeselectAll = function () {
    if (window.ChapterMap && typeof window.ChapterMap.stmDeselectAll === 'function') {
        return window.ChapterMap.stmDeselectAll();
    }
};

window.toggleSubjectTrendGlobal = function () {
    if (window.ChapterMap && typeof window.ChapterMap.toggleSubjectTrendGlobal === 'function') {
        return window.ChapterMap.toggleSubjectTrendGlobal();
    }
};

window.updateGlobalBtnStyle = function () {
    if (window.ChapterMap && typeof window.ChapterMap.updateGlobalBtnStyle === 'function') {
        return window.ChapterMap.updateGlobalBtnStyle();
    }
};

window.openRevisionTrendModal = function () {
    if (window.SpectraAnalytics && typeof window.SpectraAnalytics.openRevisionTrendModal === 'function') {
        return window.SpectraAnalytics.openRevisionTrendModal();
    } else if (typeof window.openModal === 'function') {
        window.openModal('revision-trend-modal');
    }
};

window.openYearlyActionsModal = function () {
    if (window.SpectraAnalytics && typeof window.SpectraAnalytics.openYearlyActionsModal === 'function') {
        return window.SpectraAnalytics.openYearlyActionsModal();
    }
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

// getTargetedSubjectsForGoal extracted to canonical module: js/features/pace/paceEstimator.js
// Backward-compatibility references: window.getTargetedSubjectsForGoal maintained by js/features/pace/paceEstimator.js

window.renderRevisionTrendChart = function () {
    if (window.SpectraAnalytics && typeof window.SpectraAnalytics.renderRevisionTrendChart === 'function') {
        return window.SpectraAnalytics.renderRevisionTrendChart();
    }
};
// Pace Modal Editing (openEditPaceModal, savePaceEdit)
// Extracted to canonical feature module: js/features/pace/paceManager.js
// Backward-compatibility references maintained by js/features/pace/paceManager.js


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

window.toggleMonthlyTargetCompletion = function (idx, isCompleted, monthKey = null) {
    if (window.MonthlyTargets && typeof window.MonthlyTargets.toggleMonthlyTargetCompletion === 'function') {
        return window.MonthlyTargets.toggleMonthlyTargetCompletion(idx, isCompleted, monthKey);
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

window.toggleDailyTargetCompletion = function (idx, isCompleted, dateKey = null) {
    if (window.DailyTargets && typeof window.DailyTargets.toggleDailyTargetCompletion === 'function') {
        return window.DailyTargets.toggleDailyTargetCompletion(idx, isCompleted, dateKey);
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
    if (window.OutcomePassConfig && typeof window.OutcomePassConfig.syncPassFreezeFromResults === 'function') {
        return window.OutcomePassConfig.syncPassFreezeFromResults();
    }
};

// Global Priority Ordering System (syncPriorityInputsFromDOM, moveTrack, moveProgramGlobal, moveSubjectGlobal, moveAction, onPriorityDropdownChange, renderPriorityConfig, savePriorities)
// extracted to js/features/config/priorityConfig.js


// Pace Management System Logic (togglePaceBundleType, updatePaceSubjects, addPaceGoal, requestDeletePaceGoal, deletePaceGoal)
// Extracted to canonical feature module: js/features/pace/paceManager.js
// Backward-compatibility references maintained by js/features/pace/paceManager.js

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
    if (window.Sidebar && typeof window.Sidebar.toggleMobileSidebar === 'function') {
        return window.Sidebar.toggleMobileSidebar();
    }
};

window.closeMobileSidebar = function () {
    if (window.Sidebar && typeof window.Sidebar.closeMobileSidebar === 'function') {
        return window.Sidebar.closeMobileSidebar();
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
        if (window.MasterConfigPage && typeof window.MasterConfigPage.mount === 'function') {
            window.MasterConfigPage.mount();
        } else {
            if (typeof window.populateTrackDropdowns === 'function') window.populateTrackDropdowns();
            const activeSysTab = document.querySelector('[id^="sys-tab-"].bg-blue-600');
            const currentTab = activeSysTab ? activeSysTab.id.replace('sys-tab-', '') : 'chapter';
            if (typeof window.switchSysTab === 'function') {
                window.switchSysTab(currentTab);
            }
            if (typeof window.renderPassConfig === 'function') window.renderPassConfig();
            if (typeof window.renderCelebrationConfig === 'function') window.renderCelebrationConfig();
            if (typeof window.renderPriorityConfig === 'function') window.renderPriorityConfig();
        }

    } else if (pageId === 'schedule') {
        window.renderSchedulePage();
    }

    if (pageId === 'dashboard') {
        if (typeof renderUI === 'function') {
            renderUI();
        }
    }
};

// Application bootstrapper and lifecycle orchestrator migrated to Native ES Module entry point: js/core/app.js

// Login Page Authentication Controller
// Extracted to page controller: js/pages/login/login.js



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

/* ===== MIDNIGHT DATE ROLLOVER & CROSS-TAB SYNCHRONIZATION ===== */
// Extracted to core module: js/core/rollover.js
// Canonical owner: js/core/rollover.js
// Backward-compatibility references: window.checkAndRefreshDateChange, window._lastActiveDateStr, window.X29SyncChannel maintained by js/core/rollover.js

