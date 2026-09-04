/**
 * X-29 State Module
 * Established in window.AppState namespace as the single source of truth.
 */

// Initialize Date variables for PLAN_START_DATE and PLAN_END_DATE
var initPlanStartDate = new Date();
initPlanStartDate.setHours(0, 0, 0, 0);

var initPlanEndDate = new Date();
initPlanEndDate.setMonth(initPlanEndDate.getMonth() + 10);
initPlanEndDate.setHours(23, 59, 59, 999);


window.AppState = {
    appState: {},
    tracks: [],
    timerLogs: [],
    dailyFocusHoursTarget: 0,
    dailyFocusHoursTargetDate: "",
    dailyFocusHoursTargetHistory: [],
    timerAnalyticsRange: 180,
    timerAnalyticsGrouping: 'daily',
    timerAnalyticsChartStyle: 'combo',
    spectraHeatmapRange: 365,
    sessionHistoryFilter: 'all',
    activeTimerState: {
        isRunning: false,
        mode: 'stopwatch',
        startTime: null,
        elapsedBeforeStart: 0,
        targetDuration: 0,
        selectedSubject: 'General Study'
    },
    timerInterval: null,
    db: undefined,
    isSyncing: false,
    isAppInitialized: false,
    tasks: [],
    progressChart: undefined,
    masterLineChart: undefined,
    localDataJSON: "",
    saveTimeout: null,
    isSaving: false,
    needsSave: false,
    activeRoutineSet: 1,
    subjectFocusTargets: {},

    mainChartPrograms: null,
    monthlyChartActions: null,
    yearlyChartActions: null,
    paceTrendChartInstance: null,
    spectraPaceTrendChartInstance: null,
    globalPaceTrendChartInstance: null,
    dbProgressChartInstance: null,
    revisionTrendChartInstance: null,
    globalHistoryChartInstance: null,
    dadbTrendChartInstance: null,
    resultsTrendChartInstance: null,
    latestPaceData: null,
    activeTrendGoalId: null,
    activeSingleSubjectTrend: null,

    chartVisibility: { prog: {}, monthly: {}, yearly: {}, subjects: {}, revSubjects: {} },
    latestChartStats: { prog: {}, monthly: {}, yearly: {}, subjects: {}, revSubjects: {} },
    editingTask: null,
    editingPaceId: null,
    trendTimeFilter: 'ALL',
    subjectTimeLinks: {},
    subjectDetailsState: {},
    currentDadbTab: 'date',
    hasShownCongrats: false,
    successResults: [],
    editingResultId: null,
    trendDatasetVisibility: { actual: true, target: true },

    dashboardConfig: {
        topTag: "X-29",
        mainTitle: "X-29 Dashboard",
        subTitle: "",
        trendStartDate: "",
        trendEndDate: "",
        showDaysRemaining: false,
        independentPaces: { tracks: {}, programs: {}, subjects: {} }
    },

    passedItems: { programs: [], subjects: [] },
    celebrationTargets: { programs: [], subjects: [] },
    revisionData: { active: [], progress: {} },


    subjectColors: {},
    twColors: {
        indigo: { hex: '#6366f1', border: 'border-indigo-500', btn: 'bg-indigo-500', bgLt: 'bg-indigo-50 dark:bg-indigo-900/20', borderLt: 'border-indigo-100 dark:border-indigo-800/50', text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-100 dark:bg-indigo-500/10', iconColor: 'text-indigo-500' },
        violet: { hex: '#8b5cf6', border: 'border-violet-500', btn: 'bg-violet-500', bgLt: 'bg-violet-50 dark:bg-violet-900/20', borderLt: 'border-violet-100 dark:border-violet-800/50', text: 'text-violet-600 dark:text-violet-400', iconBg: 'bg-violet-100 dark:bg-violet-500/10', iconColor: 'text-indigo-500' },
        orange: { hex: '#f97316', border: 'border-orange-500', btn: 'bg-orange-500', bgLt: 'bg-orange-50 dark:bg-orange-900/20', borderLt: 'border-orange-100 dark:border-orange-800/50', text: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-500/10', iconColor: 'text-orange-500' },
        purple: { hex: '#a855f7', border: 'border-purple-500', btn: 'bg-purple-500', bgLt: 'bg-purple-50 dark:bg-purple-900/20', borderLt: 'border-purple-100 dark:border-purple-800/50', text: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-500/10', iconColor: 'text-purple-500' },
        emerald: { hex: '#10b981', border: 'border-emerald-500', btn: 'bg-emerald-500', bgLt: 'bg-emerald-50 dark:bg-emerald-900/20', borderLt: 'border-emerald-100 dark:border-emerald-800/50', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-500' },
        rose: { hex: '#f43f5e', border: 'border-rose-500', btn: 'bg-rose-500', bgLt: 'bg-rose-50 dark:bg-rose-900/20', borderLt: 'border-rose-100 dark:border-rose-800/50', text: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-100 dark:bg-rose-500/10', iconColor: 'text-rose-500' },
        cyan: { hex: '#06b6d4', border: 'border-cyan-500', btn: 'bg-cyan-500', bgLt: 'bg-cyan-50 dark:bg-cyan-900/20', borderLt: 'border-cyan-100 dark:border-cyan-800/50', text: 'text-cyan-600 dark:text-cyan-400', iconBg: 'bg-cyan-100 dark:bg-cyan-500/10', iconColor: 'text-cyan-500' },
        amber: { hex: '#f59e0b', border: 'border-amber-500', btn: 'bg-amber-500', bgLt: 'bg-amber-50 dark:bg-amber-900/20', borderLt: 'border-amber-100 dark:border-amber-800/50', text: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-500/10', iconColor: 'text-amber-505' }
    },
    customActions: [],
    paceGoals: [],
    globalStartDate: null,
    globalEndDate: null,
    dynamicLineColors: ['#6366f1', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b', '#0ea5e9', '#ec4899', '#14b8a6'],
    isInitialLoad: true,
    currentFilter: 'All',
    PLAN_START_DATE: initPlanStartDate,
    PLAN_END_DATE: initPlanEndDate,
    showSync: false,
    serverTimeOffset: 0,
    fiscalLedger: { transactions: [], budgets: [], vaults: [] },
    examSessions: [],
    examRoutine: [],
    selectedCountdownExamId: 'auto',
    syllabusStructure: {},
    customSyllabus: {},
    customPrograms: {},
    programVisibility: {},
    weeklyTargetsDatabase: {},
    monthlyTargetsDatabase: {},
    dailyTargetsDatabase: {},
    scheduleGroups: [],
    hasLoadedFromCloud: false,
    cloudDocumentExists: null,
    syncGeneration: 0,
    lastAppliedCloudTimestamp: 0,
    isLocalDirty: false,
    localRevision: 0,
    lastCommittedRevision: 0,
    lastLocalEditTime: 0,
    lastLocalPersistTime: 0,
    _lastWriteId: "",
    lastCommittedWriteId: "",
    saveStatus: 'saved',
    syncSessionId: "",
    _tombstones: {},
    _tasksDateMap: new Map()
};

// Define transparent properties on window to alias AppState keys
const stateKeys = [
    'appState', 'tracks', 'timerLogs', 'dailyFocusHoursTarget', 'dailyFocusHoursTargetDate', 'dailyFocusHoursTargetHistory', 'timerAnalyticsRange', 'timerAnalyticsGrouping', 'timerAnalyticsChartStyle', 'spectraHeatmapRange', 'sessionHistoryFilter', 'activeTimerState', 'timerInterval', 'db',
    'subjectFocusTargets',
    'isSyncing', 'isAppInitialized', 'tasks', 'progressChart', 'masterLineChart',
    'localDataJSON', 'saveTimeout', 'isSaving', 'needsSave', 'activeRoutineSet',
    'mainChartPrograms', 'monthlyChartActions', 'yearlyChartActions',
    'paceTrendChartInstance', 'spectraPaceTrendChartInstance', 'globalPaceTrendChartInstance',
    'dbProgressChartInstance', 'revisionTrendChartInstance', 'globalHistoryChartInstance',
    'dadbTrendChartInstance', 'resultsTrendChartInstance', 'latestPaceData', 'activeTrendGoalId',
    'activeSingleSubjectTrend', 'chartVisibility', 'latestChartStats', 'editingTask',
    'editingPaceId', 'trendTimeFilter', 'subjectTimeLinks', 'subjectDetailsState',
    'currentDadbTab', 'hasShownCongrats', 'successResults', 'editingResultId',
    'trendDatasetVisibility', 'dashboardConfig', 'passedItems', 'celebrationTargets', 'revisionData',
    'currentGhmTab', 'subjectColors', 'twColors', 'customActions', 'paceGoals',
    'globalStartDate', 'globalEndDate', 'dynamicLineColors', 'isInitialLoad',
    'currentFilter', 'PLAN_START_DATE', 'PLAN_END_DATE', 'showSync', 'serverTimeOffset',
    'fiscalLedger', 'examSessions', 'examRoutine', 'selectedCountdownExamId',
    'syllabusStructure', 'customSyllabus', 'customPrograms', 'programVisibility', 'weeklyTargetsDatabase',
    'monthlyTargetsDatabase', 'dailyTargetsDatabase', 'scheduleBlocks', 'scheduleBlocks2', 'scheduleGroups',
    'hasLoadedFromCloud', 'cloudDocumentExists',
    'syncGeneration', 'lastAppliedCloudTimestamp', 'isLocalDirty',
    'localRevision', 'lastCommittedRevision', 'lastLocalEditTime', 'lastLocalPersistTime', 'saveStatus',
    'syncSessionId', '_lastWriteId', 'lastCommittedWriteId', '_tombstones'
];

stateKeys.forEach(key => {
    Object.defineProperty(window, key, {
        get: () => window.AppState[key],
        set: (val) => {
            window.AppState[key] = val;
        },
        configurable: true
    });
});

/**
 * Generates a stable unique ID for an array item across multi-device sync sessions.
 */
window.generateItemId = function(item, arrayKey = 'items') {
    if (!item || (typeof item !== 'object' && typeof item !== 'string' && typeof item !== 'number')) return null;
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    if (arrayKey === 'tasks') {
        if (item.date && !String(item.date).includes('Invalid') && !String(item.date).includes('NaN')) {
            const d = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                ? Utils.parseDateSafe(item.date)
                : null;
            if (d && !isNaN(d.getTime())) {
                return `task_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
            return `task_${String(item.date).trim()}`;
        }
        if (item.id !== undefined && item.id !== null) return `task_${item.id}`;
    }
    if (item.id !== undefined && item.id !== null) return String(item.id);
    if (item._id !== undefined && item._id !== null) return String(item._id);
    if (item.uid !== undefined && item.uid !== null) return String(item.uid);
    if (item.transactionId !== undefined && item.transactionId !== null) return String(item.transactionId);
    if (item.taskId !== undefined && item.taskId !== null) return String(item.taskId);
    if (item.trackId !== undefined && item.trackId !== null) return String(item.trackId);
    if (item.actionId !== undefined && item.actionId !== null) return String(item.actionId);
    if (item.goalId !== undefined && item.goalId !== null) return String(item.goalId);
    if (item.sessionId !== undefined && item.sessionId !== null) return String(item.sessionId);
    if (item.blockId !== undefined && item.blockId !== null) return String(item.blockId);
    if (item.groupId !== undefined && item.groupId !== null) return String(item.groupId);
    if (item.key !== undefined && item.key !== null) return String(item.key);
    if (item.track !== undefined && item.subject !== undefined && item.chapter !== undefined) {
        const pLabel = item.portionLabel ? `_${item.portionLabel}` : '';
        const frac = item.fraction ? `_${item.fraction}` : '';
        const tType = item.targetType ? `_${item.targetType}` : '';
        return `${arrayKey}_${item.track}_${item.subject}_${item.chapter}${tType}${pLabel}${frac}`;
    }
    if (item.title && item.date) return `${arrayKey}_${item.title}_${item.date}`;
    if (item.name) return `${arrayKey}_${item.name}`;
    if (item.title) return `${arrayKey}_${item.title}`;
    if (item.subject) return `${arrayKey}_${item.subject}`;
    return null;
};

/**
 * Rebuilds the O(1) in-memory task date lookup map for ultra-fast instant rendering.
 */
window.rebuildTaskDateMap = function() {
    if (!AppState._tasksDateMap) AppState._tasksDateMap = new Map();
    AppState._tasksDateMap.clear();

    const taskList = AppState.tasks || [];
    for (let i = 0; i < taskList.length; i++) {
        const t = taskList[i];
        if (!t) continue;

        // Auto-heal invalid task dates if neighbor dates are valid
        if ((!t.date || String(t.date).includes('Invalid') || String(t.date).includes('NaN'))) {
            const prevT = taskList[i - 1];
            const nextT = taskList[i + 1];
            if (prevT && prevT.date && !String(prevT.date).includes('Invalid') && !String(prevT.date).includes('NaN')) {
                const prevD = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                    ? Utils.parseDateSafe(prevT.date) : new Date(prevT.date);
                if (prevD && !isNaN(prevD.getTime())) {
                    prevD.setDate(prevD.getDate() + 1);
                    t.date = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') ? Utils.formatDate(prevD) : null;
                    t.day = prevD.toLocaleDateString('en-US', { weekday: 'short' });
                }
            } else if (nextT && nextT.date && !String(nextT.date).includes('Invalid') && !String(nextT.date).includes('NaN')) {
                const nextD = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                    ? Utils.parseDateSafe(nextT.date) : new Date(nextT.date);
                if (nextD && !isNaN(nextD.getTime())) {
                    nextD.setDate(nextD.getDate() - 1);
                    t.date = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') ? Utils.formatDate(nextD) : null;
                    t.day = nextD.toLocaleDateString('en-US', { weekday: 'short' });
                }
            }
        }

        if (t.id !== undefined && t.id !== null) {
            AppState._tasksDateMap.set(String(t.id), t);
        }

        let taskD = null;
        if (t.date && typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function') {
            taskD = Utils.parseDateSafe(t.date);
        } else if (typeof getTaskDate === 'function') {
            taskD = getTaskDate(t);
        }

        if (t.date && !String(t.date).includes('Invalid') && !String(t.date).includes('NaN')) {
            const rawDate = String(t.date);
            AppState._tasksDateMap.set(rawDate, t);
            const trimmedDate = rawDate.trim();
            AppState._tasksDateMap.set(trimmedDate, t);
        }

        if (taskD && !isNaN(taskD.getTime())) {
            const isoKey = `${taskD.getFullYear()}-${String(taskD.getMonth() + 1).padStart(2, '0')}-${String(taskD.getDate()).padStart(2, '0')}`;
            const ymdKey = `${taskD.getFullYear()}-${taskD.getMonth() + 1}-${taskD.getDate()}`;
            AppState._tasksDateMap.set(isoKey, t);
            AppState._tasksDateMap.set(ymdKey, t);
            if (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') {
                const formatted = Utils.formatDate(taskD);
                if (formatted) AppState._tasksDateMap.set(formatted, t);
            }
        }
    }
};

/**
 * Invalidates the task date lookup cache.
 */
window.invalidateTaskDateMap = function() {
    if (AppState._tasksDateMap) {
        AppState._tasksDateMap.clear();
    }
};

/**
 * Deterministic 3-Way Array Reconciliation Algorithm.
 * Merges local and cloud arrays by stable ID, respecting tombstones and timestamps.
 */
window.reconcileArrays = function(localArr = [], cloudArr = [], tombstones = {}, arrayKey = 'items') {
    if (!Array.isArray(localArr)) localArr = [];
    if (!Array.isArray(cloudArr)) cloudArr = [];
    if (!tombstones || typeof tombstones !== 'object') tombstones = {};

    const localMap = new Map();
    const cloudMap = new Map();

    localArr.forEach(item => {
        const id = window.generateItemId(item, arrayKey);
        if (id) localMap.set(id, item);
    });

    cloudArr.forEach(item => {
        const id = window.generateItemId(item, arrayKey);
        if (id) cloudMap.set(id, item);
    });

    const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);
    const result = [];

    allIds.forEach(id => {
        const tombstoneTs = tombstones[id] || 0;
        const localItem = localMap.get(id);
        const cloudItem = cloudMap.get(id);

        const localTs = (localItem && localItem.updatedAt) ? Number(localItem.updatedAt) : 0;
        const cloudTs = (cloudItem && cloudItem.updatedAt) ? Number(cloudItem.updatedAt) : 0;
        const latestTs = Math.max(localTs, cloudTs);

        if (tombstoneTs > 0) {
            if (latestTs <= tombstoneTs || cloudTs <= tombstoneTs || !cloudItem) {
                console.log(`[RECONCILE] rejected stale cloud item ${id} for key '${arrayKey}' (tombstoneTs: ${tombstoneTs})`);
                return;
            }
        }

        if (localItem && cloudItem) {
            if (arrayKey === 'tasks') {
                // Smart Field-level merge for tasks across devices
                const merged = Object.assign({}, cloudItem, localItem);
                const knownActionIds = new Set((window.customActions || []).map(a => a && a.id).filter(Boolean));
                if (localTs > cloudTs) {
                    // Local task is newer, preserve local fields and attach any missing cloud action fields
                    Object.keys(cloudItem).forEach(k => {
                        if (merged[k] === undefined) merged[k] = cloudItem[k];
                    });
                    merged.updatedAt = localTs;
                } else if (cloudTs > localTs) {
                    // Cloud task is newer, but preserve local action toggle if dirty
                    if (AppState.isLocalDirty) {
                        Object.keys(localItem).forEach(k => {
                            if (localItem[k] !== undefined && (knownActionIds.has(k) || k.startsWith('action_') || k.startsWith('act_') || k.includes('Action'))) {
                                merged[k] = localItem[k];
                            }
                        });
                    }
                    merged.updatedAt = cloudTs;
                }
                result.push(merged);
            } else if (localTs > cloudTs) {
                result.push(localItem);
            } else {
                result.push(cloudItem);
            }
        } else if (localItem) {
            result.push(localItem);
        } else if (cloudItem) {
            console.log(`[RECONCILE] accepted cloud item ${id} for key '${arrayKey}'`);
            result.push(cloudItem);
        }
    });

    const nonIdLocal = localArr.filter(item => !window.generateItemId(item, arrayKey));
    const nonIdCloud = cloudArr.filter(item => !window.generateItemId(item, arrayKey));
    const mergedNonId = [...nonIdCloud];
    nonIdLocal.forEach(localItem => {
        const isDuplicate = mergedNonId.some(cItem => JSON.stringify(cItem) === JSON.stringify(localItem));
        if (!isDuplicate) mergedNonId.push(localItem);
    });

    return [...result, ...mergedNonId];
};

/**
 * Registers an item deletion tombstone to prevent cross-device resurrection.
 */
window.recordItemDeletion = function(itemId) {
    if (itemId === undefined || itemId === null || itemId === '') return;
    const cleanId = String(itemId);
    if (!AppState._tombstones) AppState._tombstones = {};
    AppState._tombstones[cleanId] = Date.now() + (window.serverTimeOffset || 0);
    if (typeof window.markLocalMutation === 'function') {
        window.markLocalMutation(`delete_${cleanId}`);
    }
    console.log(`[TOMBSTONE] registered ${cleanId}`);
};

/**
 * Tracks a local user mutation, increments the monotonic revision counter, and marks local state dirty.
 */
window.markLocalMutation = function(reason = "") {
    if (!AppState.localRevision) AppState.localRevision = 0;
    AppState.localRevision++;
    AppState.lastLocalEditTime = Date.now() + (window.serverTimeOffset || 0);
    AppState.isLocalDirty = true;
    if (window.FirebaseService && typeof window.FirebaseService.notifyLocalMutation === 'function') {
        window.FirebaseService.notifyLocalMutation(reason);
    }
    return AppState.localRevision;
};

/**
 * Safe Hydration Guard
 * Ensures authoritative Firestore cloud payloads are applied cleanly to AppState
 * without reviving deleted items or discarding populated state during uninitialized boots.
 */
window.shouldHydrateField = function(key, cloudValue, currentLocalValue, isExplicitWipe = false, isCloudAuthoritative = false) {
    if (isExplicitWipe || isCloudAuthoritative) return true;
    
    const hasTombstones = AppState._tombstones && Object.keys(AppState._tombstones).length > 0;
    const isDirty = AppState.isLocalDirty === true;

    if (Array.isArray(currentLocalValue) && currentLocalValue.length > 0) {
        if (!Array.isArray(cloudValue) || cloudValue.length === 0) {
            if (isDirty || hasTombstones || AppState.hasLoadedFromCloud) {
                return true;
            }
            console.warn(`HYDRATION_GUARD: Retaining local cached array for '${key}' during initial boot.`);
            return false;
        }
    }
    if (currentLocalValue && typeof currentLocalValue === 'object' && !Array.isArray(currentLocalValue) && Object.keys(currentLocalValue).length > 0) {
        if (!cloudValue || typeof cloudValue !== 'object' || Object.keys(cloudValue).length === 0) {
            if (isDirty || hasTombstones || AppState.hasLoadedFromCloud) {
                return true;
            }
            console.warn(`HYDRATION_GUARD: Retaining local cached object for '${key}' during initial boot.`);
            return false;
        }
    }
    return true;
};

window.applyFullAppState = function(data, saveCloud = true, isExplicitWipe = false, isSilent = false) {
    if (!data || typeof data !== 'object') return false;
    delete data._metadata;

    if (data._tombstones) {
        AppState._tombstones = Object.assign({}, AppState._tombstones || {}, data._tombstones);
    }

    let isCloudAuthoritative = false;
    if (data.updatedAt) {
        let t = 0;
        if (typeof data.updatedAt === 'number') {
            t = data.updatedAt;
        } else if (typeof data.updatedAt.toMillis === 'function') {
            t = data.updatedAt.toMillis();
        } else if (typeof data.updatedAt.seconds === 'number') {
            t = data.updatedAt.seconds * 1000;
        }
        if (t > 0) {
            AppState.lastAppliedCloudTimestamp = Math.max(AppState.lastAppliedCloudTimestamp || 0, t);
            isCloudAuthoritative = true;
        }
    }
    if (!AppState.isLocalDirty) {
        AppState.isLocalDirty = false;
    }

    let rejectedAnyField = false;

    if (data.tasks !== undefined) {
        if (window.shouldHydrateField('tasks', data.tasks, AppState.tasks, isExplicitWipe, isCloudAuthoritative)) {
            AppState.tasks = data.tasks;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.tracks !== undefined) {
        if (window.shouldHydrateField('tracks', data.tracks, AppState.tracks, isExplicitWipe, isCloudAuthoritative)) {
            AppState.tracks = data.tracks;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.customSyllabus !== undefined || data.syllabusStructure !== undefined) {
        const syl = data.syllabusStructure || data.customSyllabus;
        if (window.shouldHydrateField('syllabusStructure', syl, AppState.syllabusStructure, isExplicitWipe, isCloudAuthoritative)) {
            AppState.syllabusStructure = syl;
            AppState.customSyllabus = syl;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.customPrograms !== undefined) {
        if (window.shouldHydrateField('customPrograms', data.customPrograms, AppState.customPrograms, isExplicitWipe, isCloudAuthoritative)) {
            AppState.customPrograms = data.customPrograms;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.customActions !== undefined) {
        if (window.shouldHydrateField('customActions', data.customActions, AppState.customActions, isExplicitWipe, isCloudAuthoritative)) {
            AppState.customActions = data.customActions;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.paceGoals !== undefined) {
        if (window.shouldHydrateField('paceGoals', data.paceGoals, AppState.paceGoals, isExplicitWipe, isCloudAuthoritative)) {
            AppState.paceGoals = data.paceGoals;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.passedItems !== undefined) {
        if (AppState.isLocalDirty && !isExplicitWipe && AppState.passedItems) {
            // Retain newer dirty local passedItems during in-flight cloud sync
            window.passedItems = AppState.passedItems;
        } else if (window.shouldHydrateField('passedItems', data.passedItems, AppState.passedItems, isExplicitWipe, isCloudAuthoritative)) {
            AppState.passedItems = {
                programs: Array.isArray(data.passedItems.programs) ? data.passedItems.programs : [],
                subjects: Array.isArray(data.passedItems.subjects) ? data.passedItems.subjects : []
            };
            window.passedItems = AppState.passedItems;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.celebrationTargets !== undefined) {
        if (AppState.isLocalDirty && !isExplicitWipe && AppState.celebrationTargets) {
            // Retain newer dirty local celebrationTargets during in-flight cloud sync
            window.celebrationTargets = AppState.celebrationTargets;
        } else if (window.shouldHydrateField('celebrationTargets', data.celebrationTargets, AppState.celebrationTargets, isExplicitWipe, isCloudAuthoritative)) {
            AppState.celebrationTargets = {
                programs: Array.isArray(data.celebrationTargets.programs) ? data.celebrationTargets.programs : [],
                subjects: Array.isArray(data.celebrationTargets.subjects) ? data.celebrationTargets.subjects : []
            };
            window.celebrationTargets = AppState.celebrationTargets;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.revisionData !== undefined) {
        if (window.shouldHydrateField('revisionData', data.revisionData, AppState.revisionData, isExplicitWipe, isCloudAuthoritative)) {
            AppState.revisionData = data.revisionData;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.programVisibility !== undefined) AppState.programVisibility = data.programVisibility;
    if (data.subjectTimeLinks !== undefined) {
        let stl = data.subjectTimeLinks || {};
        const tombstones = AppState._tombstones || {};
        Object.keys(stl).forEach(k => {
            if (tombstones[k] || tombstones[`subjectTimeLinks_${k}`]) delete stl[k];
        });
        AppState.subjectTimeLinks = stl;
    }

    if (data.successResults !== undefined) {
        if (window.shouldHydrateField('successResults', data.successResults, AppState.successResults, isExplicitWipe, isCloudAuthoritative)) {
            AppState.successResults = data.successResults;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.timerLogs !== undefined) {
        if (window.shouldHydrateField('timerLogs', data.timerLogs, AppState.timerLogs, isExplicitWipe, isCloudAuthoritative)) {
            AppState.timerLogs = data.timerLogs;
        } else {
            rejectedAnyField = true;
        }
    }

    const hasRecentFilterChange = (Date.now() - (AppState._lastFilterChangeTime || 0)) < 6000;

    if (data.dailyFocusHoursTarget !== undefined) AppState.dailyFocusHoursTarget = data.dailyFocusHoursTarget;
    if (data.dailyFocusHoursTargetDate !== undefined) AppState.dailyFocusHoursTargetDate = data.dailyFocusHoursTargetDate;
    if (data.dailyFocusHoursTargetHistory !== undefined) AppState.dailyFocusHoursTargetHistory = data.dailyFocusHoursTargetHistory;

    if (!hasRecentFilterChange) {
        if (data.timerAnalyticsRange !== undefined) {
            AppState.timerAnalyticsRange = data.timerAnalyticsRange;
            window.timerAnalyticsRange = data.timerAnalyticsRange;
        }
        if (data.timerAnalyticsGrouping !== undefined) {
            const g = data.timerAnalyticsGrouping === 'hourly' ? 'daily' : data.timerAnalyticsGrouping;
            AppState.timerAnalyticsGrouping = g;
            window.timerAnalyticsGrouping = g;
        }
        if (data.timerAnalyticsChartStyle !== undefined) {
            AppState.timerAnalyticsChartStyle = data.timerAnalyticsChartStyle;
            window.timerAnalyticsChartStyle = data.timerAnalyticsChartStyle;
        }
        if (data.spectraHeatmapRange !== undefined) {
            AppState.spectraHeatmapRange = data.spectraHeatmapRange;
            window.spectraHeatmapRange = data.spectraHeatmapRange;
        }
        if (data.sessionHistoryFilter !== undefined) {
            AppState.sessionHistoryFilter = data.sessionHistoryFilter;
            window.sessionHistoryFilter = data.sessionHistoryFilter;
        }
    } else {
        console.log("HYDRATION_GUARD: Preserving recent local UI filter preferences during cloud sync");
    }
    if (data.subjectFocusTargets !== undefined) {
        if (window.shouldHydrateField('subjectFocusTargets', data.subjectFocusTargets, AppState.subjectFocusTargets, isExplicitWipe, isCloudAuthoritative)) {
            let sft = Object.assign({}, data.subjectFocusTargets || {});
            const tombstones = AppState._tombstones || {};
            const localTargets = AppState.subjectFocusTargets || {};

            const allSubjects = new Set([...Object.keys(sft), ...Object.keys(localTargets)]);
            const finalSft = {};

            allSubjects.forEach(k => {
                const tombstoneVal = tombstones[`subjectFocusTargets_${k}`] || tombstones[k];
                const tombstoneTime = (typeof tombstoneVal === 'number') ? tombstoneVal : (tombstoneVal === true ? Number.MAX_SAFE_INTEGER : 0);

                const incomingTarget = sft[k];
                const incomingTime = incomingTarget ? (incomingTarget.updatedAt || (incomingTarget.createdAt ? new Date(incomingTarget.createdAt).getTime() : 0)) : 0;

                const localTarget = localTargets[k];
                const localTime = localTarget ? (localTarget.updatedAt || (localTarget.createdAt ? new Date(localTarget.createdAt).getTime() : 0)) : 0;

                let chosenTarget = null;
                let chosenTime = 0;

                if (localTarget && (localTime > incomingTime) && AppState.isLocalDirty) {
                    chosenTarget = localTarget;
                    chosenTime = localTime;
                } else if (incomingTarget) {
                    chosenTarget = incomingTarget;
                    chosenTime = incomingTime;
                } else if (localTarget) {
                    chosenTarget = localTarget;
                    chosenTime = localTime;
                }

                if (chosenTarget && chosenTime > tombstoneTime) {
                    finalSft[k] = chosenTarget;
                    delete tombstones[`subjectFocusTargets_${k}`];
                    delete tombstones[k];
                }
            });

            AppState.subjectFocusTargets = finalSft;
            window.subjectFocusTargets = AppState.subjectFocusTargets;
        } else {
            rejectedAnyField = true;
        }
    }
    if (data.dashboardConfig !== undefined) AppState.dashboardConfig = data.dashboardConfig;
    if (data.weeklyTargetsDatabase !== undefined) {
        if (window.shouldHydrateField('weeklyTargetsDatabase', data.weeklyTargetsDatabase, AppState.weeklyTargetsDatabase, isExplicitWipe, isCloudAuthoritative)) {
            if (AppState.isLocalDirty && !isCloudAuthoritative && !isExplicitWipe && AppState.weeklyTargetsDatabase) {
                const tombstones = AppState._tombstones || {};
                const merged = {};
                const allKeys = new Set([...Object.keys(AppState.weeklyTargetsDatabase || {}), ...Object.keys(data.weeklyTargetsDatabase || {})]);
                allKeys.forEach(k => {
                    const localList = (AppState.weeklyTargetsDatabase && AppState.weeklyTargetsDatabase[k]) || [];
                    const cloudList = (data.weeklyTargetsDatabase && data.weeklyTargetsDatabase[k]) || [];
                    merged[k] = window.reconcileArrays(localList, cloudList, tombstones, `weeklyTargetsDatabase_${k}`);
                });
                AppState.weeklyTargetsDatabase = merged;
            } else {
                AppState.weeklyTargetsDatabase = data.weeklyTargetsDatabase;
            }
            window.weeklyTargetsDatabase = AppState.weeklyTargetsDatabase;
            if (typeof window.consolidateWeeklyTargetsDatabase === 'function') {
                window.consolidateWeeklyTargetsDatabase();
            }
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.monthlyTargetsDatabase !== undefined) {
        if (window.shouldHydrateField('monthlyTargetsDatabase', data.monthlyTargetsDatabase, AppState.monthlyTargetsDatabase, isExplicitWipe, isCloudAuthoritative)) {
            if (AppState.isLocalDirty && !isCloudAuthoritative && !isExplicitWipe && AppState.monthlyTargetsDatabase) {
                const tombstones = AppState._tombstones || {};
                const merged = {};
                const allKeys = new Set([...Object.keys(AppState.monthlyTargetsDatabase || {}), ...Object.keys(data.monthlyTargetsDatabase || {})]);
                allKeys.forEach(k => {
                    const localList = (AppState.monthlyTargetsDatabase && AppState.monthlyTargetsDatabase[k]) || [];
                    const cloudList = (data.monthlyTargetsDatabase && data.monthlyTargetsDatabase[k]) || [];
                    merged[k] = window.reconcileArrays(localList, cloudList, tombstones, `monthlyTargetsDatabase_${k}`);
                });
                AppState.monthlyTargetsDatabase = merged;
            } else {
                AppState.monthlyTargetsDatabase = data.monthlyTargetsDatabase;
            }
            window.monthlyTargetsDatabase = AppState.monthlyTargetsDatabase;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.dailyTargetsDatabase !== undefined) {
        if (window.shouldHydrateField('dailyTargetsDatabase', data.dailyTargetsDatabase, AppState.dailyTargetsDatabase, isExplicitWipe, isCloudAuthoritative)) {
            if (AppState.isLocalDirty && !isCloudAuthoritative && !isExplicitWipe && AppState.dailyTargetsDatabase) {
                const tombstones = AppState._tombstones || {};
                const merged = {};
                const allKeys = new Set([...Object.keys(AppState.dailyTargetsDatabase || {}), ...Object.keys(data.dailyTargetsDatabase || {})]);
                allKeys.forEach(k => {
                    const localList = (AppState.dailyTargetsDatabase && AppState.dailyTargetsDatabase[k]) || [];
                    const cloudList = (data.dailyTargetsDatabase && data.dailyTargetsDatabase[k]) || [];
                    merged[k] = window.reconcileArrays(localList, cloudList, tombstones, `dailyTargetsDatabase_${k}`);
                });
                AppState.dailyTargetsDatabase = merged;
            } else {
                AppState.dailyTargetsDatabase = data.dailyTargetsDatabase;
            }
            window.dailyTargetsDatabase = AppState.dailyTargetsDatabase;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.scheduleBlocks !== undefined) {
        if (window.shouldHydrateField('scheduleBlocks', data.scheduleBlocks, AppState.scheduleBlocks, isExplicitWipe, isCloudAuthoritative)) {
            AppState.scheduleBlocks = data.scheduleBlocks;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.scheduleBlocks2 !== undefined) {
        if (window.shouldHydrateField('scheduleBlocks2', data.scheduleBlocks2, AppState.scheduleBlocks2, isExplicitWipe, isCloudAuthoritative)) {
            AppState.scheduleBlocks2 = data.scheduleBlocks2;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.scheduleGroups !== undefined) {
        if (window.shouldHydrateField('scheduleGroups', data.scheduleGroups, AppState.scheduleGroups, isExplicitWipe, isCloudAuthoritative)) {
            AppState.scheduleGroups = data.scheduleGroups;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.fiscalLedger !== undefined) {
        if (window.shouldHydrateField('fiscalLedger', data.fiscalLedger, AppState.fiscalLedger, isExplicitWipe, isCloudAuthoritative)) {
            AppState.fiscalLedger = data.fiscalLedger;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.examSessions !== undefined) {
        if (window.shouldHydrateField('examSessions', data.examSessions, AppState.examSessions, isExplicitWipe, isCloudAuthoritative)) {
            AppState.examSessions = data.examSessions;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.examRoutine !== undefined) {
        if (window.shouldHydrateField('examRoutine', data.examRoutine, AppState.examRoutine, isExplicitWipe, isCloudAuthoritative)) {
            AppState.examRoutine = data.examRoutine;
        } else {
            rejectedAnyField = true;
        }
    }

    if (data.selectedCountdownExamId !== undefined) AppState.selectedCountdownExamId = data.selectedCountdownExamId;
    if (data.activeTimerState !== undefined) {
        const localTimer = AppState.activeTimerState;
        const incomingTimer = data.activeTimerState;
        const localTime = (localTimer && (localTimer.updatedAt || localTimer._localTimestamp)) || 0;
        const incomingTime = (incomingTimer && (incomingTimer.updatedAt || incomingTimer._localTimestamp)) || 0;
        const isRunning = (typeof window.isAnyTimerRunning === 'function') ? window.isAnyTimerRunning() : (localTimer && localTimer.isRunning);

        if (isExplicitWipe) {
            AppState.activeTimerState = incomingTimer;
            window.activeTimerState = AppState.activeTimerState;
            if (window.TimerService && typeof window.TimerService.restore === 'function') {
                window.TimerService.restore();
            }
        } else if (localTimer && localTime > incomingTime && (AppState.isLocalDirty || isRunning)) {
            console.log(`HYDRATION_GUARD: Preserving newer local activeTimerState (localTime: ${localTime} > incomingTime: ${incomingTime})`);
        } else if (incomingTimer) {
            AppState.activeTimerState = incomingTimer;
            window.activeTimerState = AppState.activeTimerState;
            if (window.TimerService && typeof window.TimerService.restore === 'function') {
                window.TimerService.restore();
            }
        }
    }
    if (data.activeRoutineSet !== undefined) AppState.activeRoutineSet = data.activeRoutineSet;
    if (data.subjectColors !== undefined) AppState.subjectColors = data.subjectColors;

    if (typeof window.updateTimerAnalyticsControls === 'function') window.updateTimerAnalyticsControls();
    if (typeof window.renderTimerAnalyticsChart === 'function') window.renderTimerAnalyticsChart();
    if (typeof window.setSpectraHeatmapRangeUI === 'function') window.setSpectraHeatmapRangeUI(AppState.spectraHeatmapRange);
    else if (typeof window.renderSpectraFocusHeatmap === 'function') window.renderSpectraFocusHeatmap();
    if (typeof window.setSessionHistoryFilterUI === 'function') window.setSessionHistoryFilterUI(AppState.sessionHistoryFilter);

    if (typeof window.rebuildTaskDateMap === 'function') window.rebuildTaskDateMap();
    if (typeof window.updateSubjectTargetUI === 'function') window.updateSubjectTargetUI();
    if (typeof window.recalculateTotals === 'function') window.recalculateTotals();
    if (!isSilent && typeof window.renderUI === 'function') window.renderUI();
    return !rejectedAnyField;
};

window.DEFAULT_COMMITMENT_LABELS = ['Action 1', 'Action 2', 'Action 3', 'Action 4', 'Action 5', 'Action 6', 'Action 7'];

window.getServerTime = function() {
    return Date.now() + (window.serverTimeOffset || 0);
};

/**
 * Returns a clean initial AppState payload representing a fresh, empty workspace.
 */
window.getDefaultAppState = function() {
    return {
        tasks: [],
        tracks: [],
        customSyllabus: {},
        syllabusStructure: {},
        customPrograms: {},
        customActions: [],
        paceGoals: [],
        passedItems: { programs: [], subjects: [] },
        celebrationTargets: { programs: [], subjects: [] },
        revisionData: { active: [], progress: {} },
        programVisibility: {},
        subjectTimeLinks: {},
        successResults: [],
        timerLogs: [],
        dailyFocusHoursTarget: 0,
        dailyFocusHoursTargetDate: "",
        dailyFocusHoursTargetHistory: [],
        timerAnalyticsRange: 180,
        timerAnalyticsGrouping: 'daily',
        timerAnalyticsChartStyle: 'combo',
        spectraHeatmapRange: 365,
        sessionHistoryFilter: 'all',
        subjectFocusTargets: {},
        dashboardConfig: {
            topTag: "X-29",
            mainTitle: "X-29 Dashboard",
            subTitle: "",
            trendStartDate: new Date().toISOString().split('T')[0],
            trendEndDate: "",
            showDaysRemaining: false,
            independentPaces: { tracks: {}, programs: {}, subjects: {} }
        },
        weeklyTargetsDatabase: {},
        monthlyTargetsDatabase: {},
        dailyTargetsDatabase: {},
        scheduleBlocks: [],
        scheduleBlocks2: [],
        scheduleGroups: [],
        fiscalLedger: { transactions: [], budgets: [], vaults: [] },
        examSessions: [],
        examRoutine: [],
        selectedCountdownExamId: 'auto',
        activeTimerState: {
            isRunning: false,
            mode: 'stopwatch',
            startTime: null,
            elapsedBeforeStart: 0,
            targetDuration: 0,
            selectedSubject: 'General Study'
        },
        activeRoutineSet: 1,
        subjectColors: {}
    };
};


