/**
 * X-29 Core Module: Midnight Date Rollover & Cross-Tab Synchronization (rollover.js)
 *
 * Responsibilities:
 * 1. Automatic Midnight & New Day Rollover Monitor:
 *    - Tracks active date string via Utils.getDailyActionDate() & Utils.formatDate().
 *    - Detects calendar date transitions (midnight or system clock changes).
 *    - Orchestrates full UI/data refresh pipeline across tasks, habits, metrics, checklists, and countdowns.
 * 2. Cross-Tab Fast Synchronization (BroadcastChannel):
 *    - Maintains 'x29_action_sync' channel across open tabs.
 *    - Listens for 'DAILY_ACTION_UPDATE' and refreshes daily tracker, logs, charts, and modals.
 * 3. Browser Lifecycle Integration:
 *    - Visibilitychange listener: checks for date changes when tab becomes visible.
 *    - Focus listener: checks for date changes when application window gains focus.
 *    - 5000ms heartbeat interval: periodic background date transition verification.
 * 4. Idempotency & Lifecycle Management:
 *    - Enforces exactly-once registration of listeners and interval.
 *    - Provides initRollover() and cleanupRollover() for runtime and testing isolation.
 *
 * State & Backward Compatibility:
 * - Owns window._lastActiveDateStr, window.X29SyncChannel, window.checkAndRefreshDateChange.
 */

(function (global) {
    'use strict';

    const window = global;

    // Internal state
    let isRolloverInitialized = false;
    let heartbeatIntervalId = null;
    let syncChannel = null;

    /**
     * Resolves current daily action date string via Utils
     */
    function getActiveDateStr() {
        if (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') {
            const activeDate = typeof Utils.getDailyActionDate === 'function'
                ? Utils.getDailyActionDate()
                : new Date();
            return Utils.formatDate(activeDate);
        }
        return '';
    }

    // Initialize or preserve window._lastActiveDateStr
    if (typeof window._lastActiveDateStr === 'undefined' || !window._lastActiveDateStr) {
        window._lastActiveDateStr = getActiveDateStr();
    }
    if (typeof global !== 'undefined' && (typeof global._lastActiveDateStr === 'undefined' || !global._lastActiveDateStr)) {
        global._lastActiveDateStr = window._lastActiveDateStr;
    }

    /**
     * Core date-change verification and refresh orchestrator
     */
    function checkAndRefreshDateChange() {
        if (typeof Utils === 'undefined' || typeof Utils.formatDate !== 'function') return;

        const activeDate = typeof Utils.getDailyActionDate === 'function'
            ? Utils.getDailyActionDate()
            : new Date();
        const currentDateStr = Utils.formatDate(activeDate);

        const lastDate = (typeof window !== 'undefined' && window._lastActiveDateStr)
            || (typeof global !== 'undefined' && global._lastActiveDateStr)
            || '';

        if (!lastDate) {
            if (typeof window !== 'undefined') window._lastActiveDateStr = currentDateStr;
            if (typeof global !== 'undefined') global._lastActiveDateStr = currentDateStr;
            return;
        }

        if (lastDate !== currentDateStr) {
            console.log(`[X-29 Date Monitor] New day detected (${lastDate} -> ${currentDateStr}). Refreshing daily actions and trackers.`);
            if (typeof window !== 'undefined') window._lastActiveDateStr = currentDateStr;
            if (typeof global !== 'undefined') global._lastActiveDateStr = currentDateStr;

            // 1. Rebuild task-date map
            if (typeof window.rebuildTaskDateMap === 'function') {
                window.rebuildTaskDateMap();
            }

            // 2. Render daily tracker
            if (typeof renderDailyTracker === 'function') {
                renderDailyTracker();
            } else if (typeof window.renderDailyTracker === 'function') {
                window.renderDailyTracker();
            }

            // 3. Render daily logs
            if (typeof renderDailyLogs === 'function') {
                renderDailyLogs();
            } else if (typeof window.renderDailyLogs === 'function') {
                window.renderDailyLogs();
            }

            // 4. Render dashboard daily checklist
            if (typeof window.renderDashboardDailyChecklist === 'function') {
                window.renderDashboardDailyChecklist();
            }

            // 5. Render spectra commitments chart
            if (typeof window.renderSpectraCommitmentsChart === 'function') {
                window.renderSpectraCommitmentsChart();
            }

            // 6. Render trend charts
            if (typeof renderTrendCharts === 'function') {
                renderTrendCharts();
            } else if (typeof window.renderTrendCharts === 'function') {
                window.renderTrendCharts();
            }

            // 7. Update main countdown
            if (typeof updateCountdown === 'function') {
                updateCountdown();
            } else if (typeof window.updateCountdown === 'function') {
                window.updateCountdown();
            }

            // 8. Update exam countdown
            if (typeof window.updateExamCountdown === 'function') {
                window.updateExamCountdown();
            }

            // 9. Render upcoming exam card
            if (typeof window.renderDashboardUpcomingExamCard === 'function') {
                window.renderDashboardUpcomingExamCard();
            }

            // 10. Render passed subjects card
            if (typeof window.renderDashboardPassedSubjectsCard === 'function') {
                window.renderDashboardPassedSubjectsCard();
            }

            // 11. Refresh Daily Actions Database Modal if open
            if (typeof document !== 'undefined') {
                const dbModal = document.getElementById('daily-actions-db-modal');
                if (dbModal && !dbModal.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') {
                    window.openDailyActionsDBModal();
                }
            }
        }
    }

    /**
     * Cross-tab message handler for BroadcastChannel('x29_action_sync')
     */
    function handleSyncMessage(ev) {
        if (!ev || !ev.data) return;
        if (ev.data.type === 'DAILY_ACTION_UPDATE') {
            if (typeof window.rebuildTaskDateMap === 'function') {
                window.rebuildTaskDateMap();
            }
            if (typeof renderDailyTracker === 'function') {
                renderDailyTracker();
            } else if (typeof window.renderDailyTracker === 'function') {
                window.renderDailyTracker();
            }
            if (typeof renderDailyLogs === 'function') {
                renderDailyLogs();
            } else if (typeof window.renderDailyLogs === 'function') {
                window.renderDailyLogs();
            }
            if (typeof window.renderSpectraCommitmentsChart === 'function') {
                window.renderSpectraCommitmentsChart();
            }
            if (typeof renderTrendCharts === 'function') {
                renderTrendCharts();
            } else if (typeof window.renderTrendCharts === 'function') {
                window.renderTrendCharts();
            }

            if (typeof document !== 'undefined') {
                const modal = document.getElementById('analytics-modal');
                if (modal && !modal.classList.contains('hidden')) {
                    const actionId = (typeof window !== 'undefined' && window.currentAnalyticsAction) || ev.data.actionId;
                    if (typeof window.populateAnalyticsModal === 'function') {
                        window.populateAnalyticsModal(actionId);
                    } else if (typeof populateAnalyticsModal === 'function') {
                        populateAnalyticsModal(actionId);
                    }
                }

                const dbModal = document.getElementById('daily-actions-db-modal');
                if (dbModal && !dbModal.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') {
                    window.openDailyActionsDBModal();
                }
            }
        }
    }

    /**
     * Lifecycle event handlers
     */
    function onVisibilityChange() {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
            checkAndRefreshDateChange();
        }
    }

    function onWindowFocus() {
        checkAndRefreshDateChange();
    }

    function onIntervalTick() {
        checkAndRefreshDateChange();
    }

    /**
     * Idempotent initialization of rollover and sync subsystem
     */
    function initRollover() {
        if (isRolloverInitialized) return;
        isRolloverInitialized = true;

        // Initialize cross-tab BroadcastChannel
        const ChannelConstructor = (typeof window !== 'undefined' && window.BroadcastChannel)
            || (typeof global !== 'undefined' && global.BroadcastChannel);

        if (typeof ChannelConstructor !== 'undefined') {
            try {
                if (!syncChannel) {
                    syncChannel = new ChannelConstructor('x29_action_sync');
                    syncChannel.onmessage = handleSyncMessage;
                    if (typeof syncChannel.unref === 'function') {
                        syncChannel.unref();
                    }
                    if (typeof window !== 'undefined') {
                        window.X29SyncChannel = syncChannel;
                    }
                    if (typeof global !== 'undefined') {
                        global.X29SyncChannel = syncChannel;
                    }
                }
            } catch (e) {
                console.warn("[Rollover] BroadcastChannel error:", e);
            }
        }

        // Register lifecycle event listeners
        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('visibilitychange', onVisibilityChange);
        }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('focus', onWindowFocus);
        }

        // Start 5000ms heartbeat interval
        if (typeof setInterval === 'function' && heartbeatIntervalId === null) {
            heartbeatIntervalId = setInterval(onIntervalTick, 5000);
            if (typeof heartbeatIntervalId?.unref === 'function') {
                heartbeatIntervalId.unref();
            }
        }
    }

    /**
     * Clean teardown of listeners and intervals (useful for test isolation)
     */
    function cleanupRollover() {
        if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        }
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
            window.removeEventListener('focus', onWindowFocus);
        }
        if (heartbeatIntervalId !== null) {
            clearInterval(heartbeatIntervalId);
            heartbeatIntervalId = null;
        }
        if (syncChannel) {
            try {
                syncChannel.close();
            } catch (e) {}
            syncChannel = null;
        }
        isRolloverInitialized = false;
    }

    // Public module interface
    const Rollover = {
        checkAndRefreshDateChange,
        initRollover,
        cleanupRollover,
        handleSyncMessage,
        onVisibilityChange,
        onWindowFocus,
        onIntervalTick,
        get lastActiveDateStr() {
            return (typeof window !== 'undefined' ? window._lastActiveDateStr : global._lastActiveDateStr) || '';
        },
        set lastActiveDateStr(val) {
            if (typeof window !== 'undefined') window._lastActiveDateStr = val;
            if (typeof global !== 'undefined') global._lastActiveDateStr = val;
        },
        get syncChannel() {
            return syncChannel;
        },
        isInitialized: () => isRolloverInitialized
    };

    // Global environment attachment for backward compatibility
    if (typeof window !== 'undefined') {
        window.Rollover = Rollover;
        window.checkAndRefreshDateChange = checkAndRefreshDateChange;
        window.initRollover = initRollover;
        window.cleanupRollover = cleanupRollover;
    }
    if (typeof global !== 'undefined') {
        global.Rollover = Rollover;
        global.checkAndRefreshDateChange = checkAndRefreshDateChange;
        global.initRollover = initRollover;
        global.cleanupRollover = cleanupRollover;
    }

    // Auto-initialize when running in browser environment
    if (typeof window !== 'undefined') {
        initRollover();
    }

    // CommonJS compatibility for test runners
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Rollover;
    }

})(typeof window !== 'undefined' ? window : global);
