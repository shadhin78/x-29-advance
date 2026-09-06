/**
 * X-29 Module: services/backup.js
 * JSON workspace backup, export, and import orchestration.
 */

/**
 * Prompts the user regarding local server backup availability.
 */
export async function restoreLocalBackup() {
    if (typeof window.showToast === 'function') {
        window.showToast("No local backup file stored on server. Use 'Import JSON' to restore from a local file.", "info");
    } else {
        alert("No local backup file stored on server. Use 'Import JSON' to restore from a local file.");
    }
}

/**
 * Handles importing workspace state from a local JSON backup file.
 * 
 * @param {Event} event - Input change event containing file selection
 */
function importJSONBackup(event) {
    const file = event.target && event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const success = (typeof window.applyFullAppState === 'function')
                ? window.applyFullAppState(data, true)
                : false;
            if (success) {
                if (typeof window.showToast === 'function') {
                    window.showToast("Workspace data imported successfully!", "success");
                } else {
                    alert("Workspace data imported successfully!");
                }
            }
        } catch(err) {
            console.error("Invalid JSON file:", err);
            if (typeof window.showToast === 'function') {
                window.showToast("Invalid JSON file: " + err.message, "error");
            } else {
                alert("Invalid JSON file: " + err.message);
            }
        }
    };
    reader.readAsText(file);
}

/**
 * Exports complete current workspace state as an indented JSON download file.
 */
function exportJSONBackup() {
    try {
        const appState = (typeof window !== 'undefined' && window.AppState) ? window.AppState : {};
        const currentPayload = {
            _metadata: {
                exportedAt: new Date().toISOString(),
                source: "X-29 Backup Export"
            },
            tasks: appState.tasks || (typeof window !== 'undefined' ? window.tasks : []),
            tracks: typeof window !== 'undefined' ? window.tracks : [],
            customSyllabus: typeof window !== 'undefined' ? window.syllabusStructure : {},
            customPrograms: typeof window !== 'undefined' ? window.customPrograms : {},
            customActions: typeof window !== 'undefined' ? window.customActions : [],
            paceGoals: typeof window !== 'undefined' ? window.paceGoals : [],
            passedItems: typeof window !== 'undefined' ? window.passedItems : {},
            celebrationTargets: (typeof window !== 'undefined' && window.celebrationTargets) || appState.celebrationTargets || { programs: [], subjects: [] },
            revisionData: typeof window !== 'undefined' ? window.revisionData : {},
            programVisibility: (typeof window !== 'undefined' && window.programVisibility) || {},
            subjectTimeLinks: typeof window !== 'undefined' ? window.subjectTimeLinks : {},
            successResults: typeof window !== 'undefined' ? window.successResults : [],
            timerLogs: (typeof window !== 'undefined' && window.timerLogs) || [],
            dailyFocusHoursTarget: (typeof window !== 'undefined' && window.dailyFocusHoursTarget !== undefined) ? window.dailyFocusHoursTarget : 0,
            dailyFocusHoursTargetDate: (typeof window !== 'undefined' && window.dailyFocusHoursTargetDate) || "",
            dailyFocusHoursTargetHistory: (typeof window !== 'undefined' && window.dailyFocusHoursTargetHistory) || [],
            timerAnalyticsRange: (typeof window !== 'undefined' && window.timerAnalyticsRange) || 180,
            timerAnalyticsGrouping: (typeof window !== 'undefined' && window.timerAnalyticsGrouping) || 'daily',
            timerAnalyticsChartStyle: (typeof window !== 'undefined' && window.timerAnalyticsChartStyle) || 'combo',
            spectraHeatmapRange: (typeof window !== 'undefined' && window.spectraHeatmapRange) || 365,
            sessionHistoryFilter: (typeof window !== 'undefined' && window.sessionHistoryFilter) || 'all',
            subjectFocusTargets: (appState && appState.subjectFocusTargets) || (typeof window !== 'undefined' && window.subjectFocusTargets) || {},
            dashboardConfig: typeof window !== 'undefined' ? window.dashboardConfig : {},
            weeklyTargetsDatabase: (typeof window !== 'undefined' && window.weeklyTargetsDatabase) || {},
            monthlyTargetsDatabase: (typeof window !== 'undefined' && window.monthlyTargetsDatabase) || {},
            dailyTargetsDatabase: (typeof window !== 'undefined' && window.dailyTargetsDatabase) || {},
            scheduleBlocks: (typeof window !== 'undefined' && window.scheduleBlocks) || [],
            scheduleBlocks2: (typeof window !== 'undefined' && window.scheduleBlocks2) || [],
            scheduleGroups: (typeof window !== 'undefined' && window.scheduleGroups) || [],
            fiscalLedger: (appState && appState.fiscalLedger) || { transactions: [], budgets: [], vaults: [] },
            examSessions: (appState && appState.examSessions) || [],
            examRoutine: (appState && appState.examRoutine) || [],
            selectedCountdownExamId: (appState && appState.selectedCountdownExamId) || 'auto'
        };

        const jsonStr = JSON.stringify(currentPayload, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `x-29_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (typeof window.showToast === 'function') {
            window.showToast("Backup exported successfully!", "success");
        }
    } catch(err) {
        console.error("Export backup failed:", err);
    }
}

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.restoreLocalBackup = restoreLocalBackup;
    window.importJSONBackup = importJSONBackup;
    window.exportJSONBackup = exportJSONBackup;
}
