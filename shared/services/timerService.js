/**
 * Timer & Focus Shared Service (shared/services/timerService.js)
 * Provides background timer engine, active timer state persistence,
 * cloud synchronization, global controls, and cross-page analytics/heatmaps.
 */

(function () {
    'use strict';

    // --- PRIVATE UTILITIES & HELPERS ---

    function formatHoursToHrMin(hoursDecimal) {
        if (isNaN(hoursDecimal) || hoursDecimal <= 0) return "0 min";
        const totalMinutes = Math.round(hoursDecimal * 60);
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hrs > 0) {
            if (mins > 0) {
                return `${hrs} hr ${mins} min`;
            }
            return `${hrs} hr`;
        }
        return `${mins} min`;
    }

    function parseStartTime(startTime) {
        if (!startTime) return 0;
        if (typeof startTime.toDate === 'function') {
            return startTime.toDate().getTime();
        }
        if (startTime instanceof Date) {
            return startTime.getTime();
        }
        if (typeof startTime === 'string') {
            return new Date(startTime).getTime();
        }
        return Number(startTime);
    }

    function isAnyTimerRunning() {
        if (!AppState.activeTimerState) return false;
        if (AppState.activeTimerState.isRunning) return true;
        if (AppState.activeTimerState.timerStates) {
            return Object.values(AppState.activeTimerState.timerStates).some(store => store && store.isRunning);
        }
        return false;
    }
    window.isAnyTimerRunning = isAnyTimerRunning;

    function playCompletionChime() {
        if (typeof window.playCompletionChime === 'function') {
            window.playCompletionChime();
        }
    }

    function recordAutoSavedSession(mode, subject, durationSeconds, sessionDateMs) {
        const elapsed = parseInt(durationSeconds, 10) || 0;
        if (elapsed <= 0) return null;

        const nowMs = sessionDateMs || ((typeof window.getServerTime === 'function') ? window.getServerTime() : Date.now());
        const cleanSubject = subject || (AppState.activeTimerState && AppState.activeTimerState.selectedSubject) || 'General Study';
        const cleanMode = mode || 'timer';

        const newLog = {
            id: 'timer-log-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
            subject: cleanSubject,
            duration: elapsed,
            date: new Date(nowMs).toISOString(),
            mode: cleanMode,
            createdAt: new Date(nowMs).toISOString(),
            updatedAt: nowMs
        };

        if (!AppState.timerLogs) AppState.timerLogs = [];
        AppState.timerLogs.unshift(newLog);
        AppState.timerLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Reset store for the specific mode
        if (AppState.activeTimerState && AppState.activeTimerState.timerStates && AppState.activeTimerState.timerStates[cleanMode]) {
            const store = AppState.activeTimerState.timerStates[cleanMode];
            store.isRunning = false;
            store.startTime = null;
            store.elapsedBeforeStart = 0;
            store.updatedAt = nowMs;
            if (cleanMode === 'alarm') {
                store.targetDuration = 0;
            }
        }

        // If this is currently the active mode
        if (AppState.activeTimerState && AppState.activeTimerState.mode === cleanMode) {
            AppState.activeTimerState.isRunning = false;
            AppState.activeTimerState.startTime = null;
            AppState.activeTimerState.elapsedBeforeStart = 0;
            AppState.activeTimerState.updatedAt = nowMs;
            if (cleanMode === 'alarm') {
                AppState.activeTimerState.targetDuration = 0;
            }
        }

        window.activeTimerState = AppState.activeTimerState;
        saveActiveStateToStore();

        if (window.FirebaseService) {
            window.FirebaseService.saveToCloud(true);
            if (typeof window.FirebaseService.saveTimerToCloud === 'function') {
                window.FirebaseService.saveTimerToCloud();
            }
        }

        if (typeof window.renderTimerPage === 'function') {
            window.renderTimerPage();
        }
        if (typeof window.updateSubjectTargetUI === 'function') {
            window.updateSubjectTargetUI();
        }
        if (typeof window.updateTimerAnalyticsControls === 'function') {
            window.updateTimerAnalyticsControls();
        }
        if (typeof window.renderTimerAnalyticsChart === 'function') {
            window.renderTimerAnalyticsChart(true);
        }

        return newLog;
    }
    window.recordAutoSavedSession = recordAutoSavedSession;

    function tickTimer() {
        if (!AppState.activeTimerState) return;

        // Run background timer check
        checkBackgroundTimers();

        let elapsedMs = AppState.activeTimerState.elapsedBeforeStart || 0;
        if (AppState.activeTimerState.isRunning && AppState.activeTimerState.startTime) {
            elapsedMs += (window.getServerTime() - parseStartTime(AppState.activeTimerState.startTime));
        }

        let displaySeconds = 0;
        if (AppState.activeTimerState.mode === 'stopwatch') {
            displaySeconds = Math.floor(elapsedMs / 1000);
            const targetMs = (AppState.activeTimerState.targetDuration || 0) * 1000;

            if (targetMs > 0 && elapsedMs >= targetMs && AppState.activeTimerState.isRunning) {
                const activeMode = 'stopwatch';
                const completedDuration = AppState.activeTimerState.targetDuration || Math.floor(targetMs / 1000);
                const subject = AppState.activeTimerState.selectedSubject || 'General Study';

                recordAutoSavedSession(activeMode, subject, completedDuration);
                playCompletionChime();

                const hrs = Math.floor(completedDuration / 3600);
                const mins = Math.floor((completedDuration % 3600) / 60);
                const secs = completedDuration % 60;
                let durText = "";
                if (hrs > 0) durText += `${hrs} hr `;
                if (mins > 0 || hrs > 0) durText += `${mins} min `;
                if (secs > 0 || durText === "") durText += `${secs} sec`;

                showToast(`Stopwatch target reached! Automatically saved ${durText.trim()} for ${subject} to session history.`, "success");

                const saveBtn = document.getElementById('timer-btn-save');
                if (saveBtn) {
                    saveBtn.disabled = true;
                }
            } else {
                const saveBtn = document.getElementById('timer-btn-save');
                if (saveBtn) {
                    saveBtn.disabled = (displaySeconds === 0);
                }
            }
        } else {
            const targetMs = (AppState.activeTimerState.targetDuration || 0) * 1000;
            const remainingMs = Math.max(0, targetMs - elapsedMs);
            displaySeconds = Math.ceil(remainingMs / 1000);

            if (remainingMs <= 0 && AppState.activeTimerState.isRunning && targetMs > 0) {
                const activeMode = AppState.activeTimerState.mode || 'timer';
                const completedDuration = AppState.activeTimerState.targetDuration || Math.floor(targetMs / 1000);
                const subject = AppState.activeTimerState.selectedSubject || 'General Study';

                recordAutoSavedSession(activeMode, subject, completedDuration);
                playCompletionChime();

                const modeName = activeMode === 'alarm' ? 'Alarm Range' : 'Timer';
                const hrs = Math.floor(completedDuration / 3600);
                const mins = Math.floor((completedDuration % 3600) / 60);
                const secs = completedDuration % 60;
                let durText = "";
                if (hrs > 0) durText += `${hrs} hr `;
                if (mins > 0 || hrs > 0) durText += `${mins} min `;
                if (secs > 0 || durText === "") durText += `${secs} sec`;

                showToast(`${modeName} complete! Automatically saved ${durText.trim()} for ${subject} to session history.`, "success");

                const saveBtn = document.getElementById('timer-btn-save');
                if (saveBtn) {
                    saveBtn.disabled = true;
                }
            } else {
                const saveBtn = document.getElementById('timer-btn-save');
                if (saveBtn) {
                    saveBtn.disabled = (elapsedMs < 1000);
                }
            }
        }

        updateTimerUI(displaySeconds, elapsedMs);

        if (!isAnyTimerRunning()) {
            if (AppState.timerInterval) {
                clearInterval(AppState.timerInterval);
                AppState.timerInterval = null;
            }
        }
    }

    function updateTimerUI(displaySeconds, elapsedMs) {
        if (typeof window.initChronographDial === 'function') { window.initChronographDial(); } else if (typeof initChronographDial === 'function') { initChronographDial(); }

        if (typeof elapsedMs !== 'number') {
            elapsedMs = displaySeconds * 1000;
        }

        const mode = AppState.activeTimerState.mode || 'stopwatch';

        // Main Sweep Hand Needle - ALWAYS rotates FORWARD / Clockwise
        const totalSecsWithFraction = elapsedMs / 1000;
        const mainHandDeg = (totalSecsWithFraction % 60) * 6;
        const mainHand = document.getElementById('chrono-main-hand');
        if (mainHand) {
            mainHand.style.transform = `rotate(${mainHandDeg}deg)`;
        }

        // Subdial Hand Needle - ALWAYS rotates FORWARD / Clockwise
        const subdialDeg = ((totalSecsWithFraction % 1800) / 1800) * 360;
        const subdialHand = document.getElementById('chrono-subdial-hand');
        if (subdialHand) {
            subdialHand.style.transform = `rotate(${subdialDeg}deg)`;
        }

        // Edge Tick Marks & Radial Numbers Countdown / Forward Color Updating
        if (mode === 'stopwatch') {
            const targetMs = (AppState.activeTimerState.targetDuration || 0) * 1000;
            if (targetMs > 0) {
                // Targeted Stopwatch: Fill FORWARD from 0 to 60 as elapsed time progresses towards target
                const progressRatio = Math.min(1, Math.max(0, elapsedMs / targetMs));
                const elapsedTicksCount = Math.floor(progressRatio * 60);

                for (let i = 0; i < 60; i++) {
                    const tickElem = document.getElementById(`chrono-tick-${i}`);
                    if (tickElem) {
                        const isMajor = (i % 5 === 0);
                        if (i <= elapsedTicksCount) {
                            // Elapsed forward time: HIGHLIGHTED in Electric Blue
                            tickElem.setAttribute('stroke', 'var(--chrono-main-hand)');
                            tickElem.setAttribute('stroke-opacity', '1');
                        } else {
                            // Remaining time until target: DIMMED
                            tickElem.setAttribute('stroke', isMajor ? 'var(--chrono-tick-major)' : 'var(--chrono-tick-minor)');
                            tickElem.setAttribute('stroke-opacity', '0.2');
                        }
                    }

                    if (i % 5 === 0) {
                        const numElem = document.getElementById(`chrono-num-${i}`);
                        if (numElem) {
                            if (i <= elapsedTicksCount) {
                                numElem.setAttribute('fill', 'var(--chrono-main-hand)');
                                numElem.setAttribute('fill-opacity', '1');
                            } else {
                                numElem.setAttribute('fill', 'var(--chrono-text-number)');
                                numElem.setAttribute('fill-opacity', '0.25');
                            }
                        }
                    }
                }
            } else {
                // Open-ended Stopwatch: Restore standard full opacity for all ticks & numbers
                for (let i = 0; i < 60; i++) {
                    const tickElem = document.getElementById(`chrono-tick-${i}`);
                    if (tickElem) {
                        const isMajor = (i % 5 === 0);
                        tickElem.setAttribute('stroke', isMajor ? 'var(--chrono-tick-major)' : 'var(--chrono-tick-minor)');
                        tickElem.setAttribute('stroke-opacity', isMajor ? '1' : '0.6');
                    }
                    if (i % 5 === 0) {
                        const numElem = document.getElementById(`chrono-num-${i}`);
                        if (numElem) {
                            numElem.setAttribute('fill', 'var(--chrono-text-number)');
                            numElem.setAttribute('fill-opacity', '1');
                        }
                    }
                }
            }
        } else {
            // Timer / Alarm Mode: Countdown backwards
            const targetMs = Math.max(1000, (AppState.activeTimerState.targetDuration || 1) * 1000);
            const progressRatio = Math.min(1, Math.max(0, elapsedMs / targetMs));
            const elapsedTicksCount = Math.floor(progressRatio * 60);

            for (let i = 0; i < 60; i++) {
                const tickElem = document.getElementById(`chrono-tick-${i}`);
                if (tickElem) {
                    const isMajor = (i % 5 === 0);
                    if (i >= elapsedTicksCount) {
                        // Remaining time: HIGHLIGHTED in Electric Blue
                        tickElem.setAttribute('stroke', 'var(--chrono-main-hand)');
                        tickElem.setAttribute('stroke-opacity', '1');
                    } else {
                        // Elapsed time: DECREASED / DIMMED
                        tickElem.setAttribute('stroke', isMajor ? 'var(--chrono-tick-major)' : 'var(--chrono-tick-minor)');
                        tickElem.setAttribute('stroke-opacity', '0.2');
                    }
                }

                if (i % 5 === 0) {
                    const numElem = document.getElementById(`chrono-num-${i}`);
                    if (numElem) {
                        if (i >= elapsedTicksCount) {
                            // Remaining time number: HIGHLIGHTED in Electric Blue
                            numElem.setAttribute('fill', 'var(--chrono-main-hand)');
                            numElem.setAttribute('fill-opacity', '1');
                        } else {
                            // Elapsed time number: DECREASED / DIMMED
                            numElem.setAttribute('fill', 'var(--chrono-text-number)');
                            numElem.setAttribute('fill-opacity', '0.25');
                        }
                    }
                }
            }
        }

        // Split-color digital readout calculation
        let renderMs = elapsedMs;
        if (mode !== 'stopwatch') {
            const targetMs = (AppState.activeTimerState.targetDuration || 0) * 1000;
            renderMs = Math.max(0, targetMs - elapsedMs);
        }

        const totalSecs = Math.floor(renderMs / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        const hundredths = Math.floor((renderMs % 1000) / 10);

        const hhmmText = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:`;
        const ssmsText = `${String(secs).padStart(2, '0')}`;

        safeSetText('timer-clock-hhmm', hhmmText);
        safeSetText('timer-clock-ssms', ssmsText);

        const clockText = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        safeSetText('timer-clock-text', clockText);

        // Status text update
        const statusText = document.getElementById('timer-status-text');
        if (statusText) {
            if (AppState.activeTimerState.isRunning) {
                statusText.textContent = 'FOCUSING';
                statusText.className = 'text-[9px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400 mt-1.5 sm:mt-2';
            } else {
                let activeElapsed = AppState.activeTimerState.elapsedBeforeStart || 0;
                if (activeElapsed > 0) {
                    statusText.textContent = 'PAUSED';
                    statusText.className = 'text-[9px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 mt-1.5 sm:mt-2';
                } else {
                    if (mode === 'stopwatch' && AppState.activeTimerState.targetDuration > 0) {
                        const targetMin = Math.round(AppState.activeTimerState.targetDuration / 60);
                        statusText.textContent = `TARGET: ${targetMin} MIN (FORWARD)`;
                    } else {
                        statusText.textContent = 'READY';
                    }
                    statusText.className = 'text-[9px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5 sm:mt-2';
                }
            }
        }

        const toggleBtn = document.getElementById('timer-btn-toggle');
        const fsToggleBtn = document.getElementById('timer-fs-btn-toggle');
        const isRunning = AppState.activeTimerState.isRunning;
        let activeElapsed = AppState.activeTimerState.elapsedBeforeStart || 0;

        let btnText = 'START';
        let btnBgClass = 'bg-blue-600 hover:bg-blue-700';

        if (isRunning) {
            btnText = 'PAUSE';
            btnBgClass = 'bg-amber-500 hover:bg-amber-600';
        } else if (activeElapsed > 0) {
            btnText = 'RESUME';
            btnBgClass = 'bg-blue-600 hover:bg-blue-700';
        }

        if (toggleBtn) {
            toggleBtn.textContent = btnText;
            toggleBtn.className = `flex-[1.4] py-3 sm:py-3.5 ${btnBgClass} text-white font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all touch-action-manipulation min-h-[44px]`;
        }

        if (fsToggleBtn) {
            fsToggleBtn.textContent = btnText;
            fsToggleBtn.className = `px-4 py-2 sm:px-5 sm:py-2.5 ${btnBgClass} text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all touch-action-manipulation flex items-center justify-center min-h-[40px]`;
        }

        // Update dashboard Focus Timer card in real-time if it exists
        if (document.getElementById('dash-timer-clock-text') || document.getElementById('dash-timer-progress-bar')) {
            let displayState = AppState.activeTimerState;
            let displayMode = AppState.activeTimerState.mode || 'stopwatch';

            if (AppState.activeTimerState.timerStates) {
                const runningMode = Object.keys(AppState.activeTimerState.timerStates).find(
                    m => AppState.activeTimerState.timerStates[m].isRunning
                );
                if (runningMode) {
                    displayMode = runningMode;
                    displayState = AppState.activeTimerState.timerStates[runningMode];
                }
            }

            const isTimerRunning = displayState.isRunning || false;
            let dashElapsedMs = displayState.elapsedBeforeStart || 0;
            if (displayState.isRunning && displayState.startTime) {
                dashElapsedMs += (window.getServerTime() - parseStartTime(displayState.startTime));
            }
            let dashSeconds = 0;
            let dashProgressPercent = 0;
            if (displayMode === 'stopwatch') {
                dashSeconds = Math.floor(dashElapsedMs / 1000);
                dashProgressPercent = Math.round(((dashSeconds % 60) / 60) * 100);
            } else {
                const targetMs = (displayState.targetDuration || 0) * 1000;
                const remainingMs = Math.max(0, targetMs - dashElapsedMs);
                dashSeconds = displayState.isRunning ? Math.ceil(remainingMs / 1000) : Math.floor(remainingMs / 1000);
                const target = displayState.targetDuration || 1;
                const elapsedSec = Math.floor(dashElapsedMs / 1000);
                dashProgressPercent = Math.min(100, Math.round((elapsedSec / target) * 100));
            }

            const dashHrs = Math.floor(dashSeconds / 3600);
            const dashMins = Math.floor((dashSeconds % 3600) / 60);
            const dashSecs = dashSeconds % 60;
            const dashClockText = `${String(dashHrs).padStart(2, '0')}:${String(dashMins).padStart(2, '0')}:${String(dashSecs).padStart(2, '0')}`;

            safeSetText('dash-timer-clock-text', dashClockText);

            const dashProgressBar = document.getElementById('dash-timer-progress-bar');
            if (dashProgressBar) {
                dashProgressBar.style.width = `${dashProgressPercent}%`;
            }

            const dashModeLabel = document.getElementById('dash-timer-mode-label');
            if (dashModeLabel) {
                dashModeLabel.textContent = displayMode.toUpperCase();
            }

            const dashStatusText = document.getElementById('dash-timer-status-text');
            if (dashStatusText) {
                dashStatusText.textContent = displayState.isRunning ? 'FOCUSING' : (dashElapsedMs > 0 ? 'PAUSED' : 'READY');
            }

            const dashSubjectText = document.getElementById('dash-timer-subject-text');
            if (dashSubjectText) {
                dashSubjectText.textContent = displayState.selectedSubject || 'General Study';
            }

            const dashCardBody = document.getElementById('dash-timer-card-body');
            if (dashCardBody) {
                const timerColor = window.getSubjectColor ? window.getSubjectColor(displayState.selectedSubject || 'General Study') : '#2563eb';
                dashCardBody.style.backgroundColor = `${timerColor}cc`;
            }

            const dashBtnToggle = document.getElementById('dash-timer-btn-toggle');
            if (dashBtnToggle) {
                dashBtnToggle.textContent = isTimerRunning ? 'PAUSE' : 'START';
            }
        }
        if (typeof window.updateSubjectTargetLive === 'function') { window.updateSubjectTargetLive(); } else if (typeof updateSubjectTargetLive === 'function') { updateSubjectTargetLive(); }
    }

    function saveActiveStateToStore() {
        if (!AppState.activeTimerState) return;
        const nowMs = (typeof window.getServerTime === 'function') ? window.getServerTime() : Date.now();
        AppState.activeTimerState.updatedAt = nowMs;

        if (!AppState.activeTimerState.timerStates) {
            AppState.activeTimerState.timerStates = {
                stopwatch: { isRunning: false, startTime: null, elapsedBeforeStart: 0, targetDuration: 0, selectedSubject: 'General Study', updatedAt: nowMs },
                timer: { isRunning: false, startTime: null, elapsedBeforeStart: 0, targetDuration: 25 * 60, selectedSubject: 'General Study', updatedAt: nowMs },
                alarm: { isRunning: false, startTime: null, elapsedBeforeStart: 0, targetDuration: 0, selectedSubject: 'General Study', alarmStart: '', alarmEnd: '', alarmUseCurrent: true, updatedAt: nowMs }
            };
        }
        const currentMode = AppState.activeTimerState.mode || 'stopwatch';
        if (!AppState.activeTimerState.timerStates[currentMode]) {
            AppState.activeTimerState.timerStates[currentMode] = {};
        }
        const store = AppState.activeTimerState.timerStates[currentMode];

        store.isRunning = AppState.activeTimerState.isRunning || false;
        store.startTime = AppState.activeTimerState.startTime || null;
        store.elapsedBeforeStart = AppState.activeTimerState.elapsedBeforeStart || 0;
        store.targetDuration = AppState.activeTimerState.targetDuration || 0;
        store.selectedSubject = AppState.activeTimerState.selectedSubject || 'General Study';
        store.updatedAt = nowMs;

        if (currentMode === 'alarm') {
            const startEl = document.getElementById('timer-alarm-start');
            const endEl = document.getElementById('timer-alarm-end');
            const useCurrentCb = document.getElementById('timer-alarm-use-current');

            store.alarmStart = startEl ? startEl.value : '';
            store.alarmEnd = endEl ? endEl.value : '';
            store.alarmUseCurrent = useCurrentCb ? useCurrentCb.checked : true;
        }

        window.activeTimerState = AppState.activeTimerState;
    }

    function loadActiveStateFromStore(mode) {
        if (!AppState.activeTimerState) return;
        const nowMs = (typeof window.getServerTime === 'function') ? window.getServerTime() : Date.now();
        AppState.activeTimerState.updatedAt = nowMs;

        if (!AppState.activeTimerState.timerStates) {
            AppState.activeTimerState.timerStates = {
                stopwatch: { isRunning: false, startTime: null, elapsedBeforeStart: 0, targetDuration: 0, selectedSubject: 'General Study', updatedAt: nowMs },
                timer: { isRunning: false, startTime: null, elapsedBeforeStart: 0, targetDuration: 25 * 60, selectedSubject: 'General Study', updatedAt: nowMs },
                alarm: { isRunning: false, startTime: null, elapsedBeforeStart: 0, targetDuration: 0, selectedSubject: 'General Study', alarmStart: '', alarmEnd: '', alarmUseCurrent: true, updatedAt: nowMs }
            };
        }
        if (!AppState.activeTimerState.timerStates[mode]) {
            AppState.activeTimerState.timerStates[mode] = {
                isRunning: false,
                startTime: null,
                elapsedBeforeStart: 0,
                targetDuration: mode === 'timer' ? 25 * 60 : 0,
                selectedSubject: 'General Study',
                updatedAt: nowMs
            };
        }
        const store = AppState.activeTimerState.timerStates[mode];

        AppState.activeTimerState.mode = mode;
        AppState.activeTimerState.isRunning = store.isRunning || false;
        AppState.activeTimerState.startTime = store.startTime || null;
        AppState.activeTimerState.elapsedBeforeStart = store.elapsedBeforeStart || 0;
        AppState.activeTimerState.targetDuration = store.targetDuration !== undefined ? store.targetDuration : (mode === 'timer' ? 25 * 60 : 0);
        AppState.activeTimerState.selectedSubject = store.selectedSubject || 'General Study';
        AppState.activeTimerState.updatedAt = nowMs;
        store.updatedAt = nowMs;

        // Restore DOM inputs for alarm mode
        if (mode === 'alarm') {
            setTimeout(() => {
                const startEl = document.getElementById('timer-alarm-start');
                const endEl = document.getElementById('timer-alarm-end');
                const useCurrentCb = document.getElementById('timer-alarm-use-current');

                if (startEl && store.alarmStart !== undefined) startEl.value = store.alarmStart;
                if (endEl && store.alarmEnd !== undefined) endEl.value = store.alarmEnd;
                if (useCurrentCb && store.alarmUseCurrent !== undefined) {
                    useCurrentCb.checked = store.alarmUseCurrent;
                    window.toggleAlarmUseCurrent();
                }
            }, 50);
        }

        const subjectSelect = document.getElementById('timer-subject-select');
        if (subjectSelect) {
            subjectSelect.value = AppState.activeTimerState.selectedSubject;
        }

        window.activeTimerState = AppState.activeTimerState;
    }

    function checkBackgroundTimers() {
        if (!AppState.activeTimerState || !AppState.activeTimerState.timerStates) return;

        let stateChanged = false;

        Object.entries(AppState.activeTimerState.timerStates).forEach(([mode, store]) => {
            if (mode === AppState.activeTimerState.mode) return; // skip currently active mode
            if (!store.isRunning) return;

            let elapsedMs = store.elapsedBeforeStart || 0;
            if (store.startTime) {
                elapsedMs += (window.getServerTime() - parseStartTime(store.startTime));
            }

            if (mode === 'timer' || mode === 'alarm' || (mode === 'stopwatch' && store.targetDuration > 0)) {
                const targetMs = (store.targetDuration || 0) * 1000;
                if (elapsedMs >= targetMs && targetMs > 0) {
                    const completedDuration = store.targetDuration || Math.floor(targetMs / 1000);
                    const subject = store.selectedSubject || AppState.activeTimerState.selectedSubject || 'General Study';

                    store.isRunning = false;
                    store.elapsedBeforeStart = 0;
                    store.startTime = null;

                    recordAutoSavedSession(mode, subject, completedDuration);

                    playCompletionChime();
                    stateChanged = true;

                    const modeName = mode === 'alarm' ? 'Alarm Range' : (mode === 'stopwatch' ? 'Stopwatch' : 'Timer');
                    const hrs = Math.floor(completedDuration / 3600);
                    const mins = Math.floor((completedDuration % 3600) / 60);
                    const secs = completedDuration % 60;
                    let durText = "";
                    if (hrs > 0) durText += `${hrs} hr `;
                    if (mins > 0 || hrs > 0) durText += `${mins} min `;
                    if (secs > 0 || durText === "") durText += `${secs} sec`;

                    showToast(`Background ${modeName} target reached! Automatically saved ${durText.trim()} for ${subject} to session history.`, "success");
                }
            }
        });

        if (stateChanged) {
            if (window.FirebaseService && typeof window.FirebaseService.saveTimerToCloud === 'function') {
                window.FirebaseService.saveTimerToCloud();
            }
            if (window.TimerService && typeof window.TimerService.updateDisplay === 'function') {
                window.TimerService.updateDisplay();
            }
        }
    }

    window.syncTimerStateFromCloud = function () {
        if (!AppState.activeTimerState) return;
        window.activeTimerState = AppState.activeTimerState;

        // Initialize state store if missing
        if (!AppState.activeTimerState.timerStates) {
            AppState.activeTimerState.timerStates = {
                stopwatch: { isRunning: false, startTime: null, elapsedBeforeStart: 0, targetDuration: 0, selectedSubject: 'General Study' },
                timer: { isRunning: false, startTime: null, elapsedBeforeStart: 0, targetDuration: 25 * 60, selectedSubject: 'General Study' },
                alarm: { isRunning: false, startTime: null, elapsedBeforeStart: 0, targetDuration: 0, selectedSubject: 'General Study', alarmStart: '', alarmEnd: '', alarmUseCurrent: true }
            };
            // Seed current mode values
            const currentMode = AppState.activeTimerState.mode || 'stopwatch';
            AppState.activeTimerState.timerStates[currentMode] = {
                isRunning: AppState.activeTimerState.isRunning || false,
                startTime: AppState.activeTimerState.startTime || null,
                elapsedBeforeStart: AppState.activeTimerState.elapsedBeforeStart || 0,
                targetDuration: AppState.activeTimerState.targetDuration || 0,
                selectedSubject: AppState.activeTimerState.selectedSubject || 'General Study',
                alarmStart: document.getElementById('timer-alarm-start')?.value || '',
                alarmEnd: document.getElementById('timer-alarm-end')?.value || '',
                alarmUseCurrent: document.getElementById('timer-alarm-use-current')?.checked !== false
            };
        }

        // Restore alarm inputs if active mode is alarm
        if (AppState.activeTimerState.mode === 'alarm') {
            const store = AppState.activeTimerState.timerStates.alarm;
            const startEl = document.getElementById('timer-alarm-start');
            const endEl = document.getElementById('timer-alarm-end');
            const useCurrentCb = document.getElementById('timer-alarm-use-current');

            if (startEl && store.alarmStart !== undefined) startEl.value = store.alarmStart;
            if (endEl && store.alarmEnd !== undefined) endEl.value = store.alarmEnd;
            if (useCurrentCb && store.alarmUseCurrent !== undefined) {
                useCurrentCb.checked = store.alarmUseCurrent;
                window.toggleAlarmUseCurrent();
            }
        }

        const subjectSelect = document.getElementById('timer-subject-select');
        if (subjectSelect && AppState.activeTimerState.selectedSubject) {
            subjectSelect.value = AppState.activeTimerState.selectedSubject;
        }

        const btnStopwatch = document.getElementById('tm-mode-stopwatch');
        const btnTimer = document.getElementById('tm-mode-timer');
        const btnAlarm = document.getElementById('tm-mode-alarm');
        const presetsContainer = document.getElementById('timer-presets-container');
        const alarmContainer = document.getElementById('timer-alarm-container');

        function updatePresetButtonsUI() {
            const presetsContainer = document.getElementById('timer-presets-container');
            if (!presetsContainer) return;

            const mode = (AppState.activeTimerState && AppState.activeTimerState.mode) || 'stopwatch';
            const targetSec = (AppState.activeTimerState && AppState.activeTimerState.targetDuration) || 0;
            const targetMin = Math.round(targetSec / 60);

            const btnFree = document.getElementById('timer-preset-btn-0');
            if (btnFree) {
                if (mode === 'stopwatch') {
                    btnFree.classList.remove('hidden');
                } else {
                    btnFree.classList.add('hidden');
                }
            }

            const activeClass = "flex-1 min-w-[70px] py-2.5 px-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase transition-all border border-blue-400 active:scale-95 touch-action-manipulation shadow-md";
            const inactiveClass = "flex-1 min-w-[70px] py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase transition-all border border-slate-700/60 active:scale-95 touch-action-manipulation shadow-sm";

            const presetValues = [0, 15, 25, 45, 60];
            let isStandardPreset = false;

            presetValues.forEach(val => {
                const btn = document.getElementById(`timer-preset-btn-${val}`);
                if (btn) {
                    if (val === 0 && mode === 'stopwatch' && targetSec === 0) {
                        btn.className = activeClass;
                        isStandardPreset = true;
                    } else if (val > 0 && targetSec === val * 60) {
                        btn.className = activeClass;
                        isStandardPreset = true;
                    } else {
                        btn.className = inactiveClass;
                    }
                }
            });

            const btnCustom = document.getElementById('timer-preset-btn-custom');
            if (btnCustom) {
                if (!isStandardPreset && targetSec > 0) {
                    btnCustom.className = activeClass;
                    btnCustom.textContent = `${targetMin} Min`;
                } else {
                    btnCustom.className = inactiveClass;
                    btnCustom.textContent = 'Custom';
                }
            }
        }
        window.updatePresetButtonsUI = updatePresetButtonsUI;

        if (btnStopwatch && btnTimer && btnAlarm) {
            const activeClass = "w-1/3 py-2.5 text-xs font-black rounded-xl transition-all bg-blue-600 text-white shadow";
            const inactiveClass = "w-1/3 py-2.5 text-xs font-black rounded-xl transition-all text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800/80";
            if (AppState.activeTimerState.mode === 'stopwatch') {
                btnStopwatch.className = activeClass;
                btnTimer.className = inactiveClass;
                btnAlarm.className = inactiveClass;
                if (presetsContainer) {
                    presetsContainer.classList.remove('hidden');
                    presetsContainer.classList.add('flex');
                }
                if (alarmContainer) alarmContainer.classList.add('hidden');
            } else if (AppState.activeTimerState.mode === 'timer') {
                btnStopwatch.className = inactiveClass;
                btnTimer.className = activeClass;
                btnAlarm.className = inactiveClass;
                if (presetsContainer) {
                    presetsContainer.classList.remove('hidden');
                    presetsContainer.classList.add('flex');
                }
                if (alarmContainer) alarmContainer.classList.add('hidden');
            } else if (AppState.activeTimerState.mode === 'alarm') {
                btnStopwatch.className = inactiveClass;
                btnTimer.className = inactiveClass;
                btnAlarm.className = activeClass;
                if (presetsContainer) presetsContainer.classList.add('hidden');
                if (alarmContainer) {
                    alarmContainer.classList.remove('hidden');
                    alarmContainer.classList.add('flex');
                }
            }
            updatePresetButtonsUI();
        }

        if (AppState.activeTimerState.mode === 'alarm') {
            window.updateAlarmStartText();
        }

        if (AppState.timerInterval) {
            clearInterval(AppState.timerInterval);
            AppState.timerInterval = null;
        }

        tickTimer();

        if (isAnyTimerRunning()) {
            AppState.timerInterval = setInterval(tickTimer, 40);
        }
    };

    window.toggleTimerClick = function () {
        if (!AppState.activeTimerState) return;

        const subjectSelect = document.getElementById('timer-subject-select');
        if (subjectSelect) {
            AppState.activeTimerState.selectedSubject = subjectSelect.value;
        }

        // Determine if any tracker is running
        let runningMode = null;
        if (AppState.activeTimerState.timerStates) {
            runningMode = Object.keys(AppState.activeTimerState.timerStates).find(
                m => AppState.activeTimerState.timerStates[m].isRunning
            );
        }

        if (AppState.activeTimerState.isRunning || runningMode) {
            window.TimerService.pause();
        } else {
            if (AppState.activeTimerState.mode === 'alarm') {
                const startEl = document.getElementById('timer-alarm-start');
                const endEl = document.getElementById('timer-alarm-end');
                if (!startEl || !endEl || !endEl.value) {
                    showToast("Please specify an End Time for the alarm range.", "error");
                    return;
                }

                const useCurrent = document.getElementById('timer-alarm-use-current')?.checked;
                if (useCurrent) {
                    const now = new Date();
                    const curTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    startEl.value = curTimeStr;
                }

                const startTimeVal = startEl.value;
                const endTimeVal = endEl.value;
                if (!startTimeVal) {
                    showToast("Please specify a Start Time.", "error");
                    return;
                }

                const timeStrToSeconds = (str) => {
                    const parts = str.split(':').map(Number);
                    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
                };

                let duration = timeStrToSeconds(endTimeVal) - timeStrToSeconds(startTimeVal);
                if (duration <= 0) {
                    duration += 24 * 3600; // cross-midnight
                }

                AppState.activeTimerState.targetDuration = duration;

                let elapsedMs = AppState.activeTimerState.elapsedBeforeStart || 0;
                const targetMs = (AppState.activeTimerState.targetDuration || 0) * 1000;
                if (elapsedMs >= targetMs) {
                    AppState.activeTimerState.elapsedBeforeStart = 0;
                }
            } else if (AppState.activeTimerState.mode === 'timer') {
                let elapsedMs = AppState.activeTimerState.elapsedBeforeStart || 0;
                const targetMs = (AppState.activeTimerState.targetDuration || 0) * 1000;
                if (elapsedMs >= targetMs) {
                    AppState.activeTimerState.elapsedBeforeStart = 0;
                }
            } else if (AppState.activeTimerState.mode === 'stopwatch') {
                let elapsedMs = AppState.activeTimerState.elapsedBeforeStart || 0;
                const targetMs = (AppState.activeTimerState.targetDuration || 0) * 1000;
                if (targetMs > 0 && elapsedMs >= targetMs) {
                    AppState.activeTimerState.elapsedBeforeStart = 0;
                }
            }
            window.TimerService.start();
        }
    };

    window.resetTimerClick = function () {
        if (!AppState.activeTimerState) return;
        window.openConfirmModal(
            "Reset Timer/Stopwatch?",
            "Are you sure you want to reset the current session? This will clear all accumulated time.",
            () => {
                window.TimerService.reset();
                showToast("Timer reset.", "success");
            }
        );
    };

    window.saveTimerSession = function () {
        if (!AppState.activeTimerState) return;

        let elapsedMs = AppState.activeTimerState.elapsedBeforeStart || 0;
        if (AppState.activeTimerState.isRunning && AppState.activeTimerState.startTime) {
            elapsedMs += (window.getServerTime() - parseStartTime(AppState.activeTimerState.startTime));
        }

        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        if (elapsedSeconds <= 0) {
            showToast("No focus duration accumulated to save.", "error");
            return;
        }

        const subject = AppState.activeTimerState.selectedSubject || 'General Study';
        const currentMode = AppState.activeTimerState.mode || 'stopwatch';
        const nowMs = (typeof window.getServerTime === 'function') ? window.getServerTime() : Date.now();
        const newLog = {
            id: 'timer-log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            subject: subject,
            duration: elapsedSeconds,
            date: new Date(nowMs).toISOString(),
            mode: currentMode,
            createdAt: new Date(nowMs).toISOString(),
            updatedAt: nowMs
        };

        if (!AppState.timerLogs) AppState.timerLogs = [];
        AppState.timerLogs.unshift(newLog);
        AppState.timerLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

        AppState.activeTimerState.isRunning = false;
        AppState.activeTimerState.startTime = null;
        AppState.activeTimerState.elapsedBeforeStart = 0;
        AppState.activeTimerState.updatedAt = nowMs;

        // Also reset stored state for active mode since we just saved it!
        if (AppState.activeTimerState.timerStates && AppState.activeTimerState.timerStates[currentMode]) {
            const store = AppState.activeTimerState.timerStates[currentMode];
            store.isRunning = false;
            store.startTime = null;
            store.elapsedBeforeStart = 0;
            store.updatedAt = nowMs;
            if (currentMode === 'alarm') {
                store.targetDuration = 0;
            }
        }

        window.activeTimerState = AppState.activeTimerState;
        saveActiveStateToStore();
        window.TimerService.restore();
        window.TimerService.updateDisplay();
        showToast(`Saved session: ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s for ${subject}.`, "success");
        if (window.FirebaseService) {
            window.FirebaseService.saveToCloud(true);
            if (typeof window.FirebaseService.saveTimerToCloud === 'function') {
                window.FirebaseService.saveTimerToCloud();
            }
        }
    };

    window.debouncedSaveTimerPreferences = function () {
        if (_timerPrefsSaveTimer) clearTimeout(_timerPrefsSaveTimer);
        _timerPrefsSaveTimer = setTimeout(() => {
            _timerPrefsSaveTimer = null;
            if (window.FirebaseService) {
                window.FirebaseService.saveToCloud();
            }
        }, 800);
    };

    window.navigateTimerAnalyticsDay = function (delta) {
        if (window.timerAnalyticsRange !== 1) {
            window.timerAnalyticsRange = 1;
            if (window.AppState) window.AppState.timerAnalyticsRange = 1;
            try { safeStorage.setItem('x29_timerAnalyticsRange', '1'); } catch (e) {}
        }
        const currentOffset = window.timerAnalyticsDayOffset || 0;
        const newOffset = currentOffset + delta;
        if (newOffset > 0) return; // Future days not permitted

        window.timerAnalyticsDayOffset = newOffset;
        window.updateTimerAnalyticsControls();
        window.renderTimerAnalyticsChart();
    };

    window.resetTimerAnalyticsDayOffset = function () {
        window.timerAnalyticsDayOffset = 0;
        window.updateTimerAnalyticsControls();
        window.renderTimerAnalyticsChart();
    };

    window.updateTimerAnalyticsControls = function () {
        const range = window.timerAnalyticsRange || 180;
        const style = window.timerAnalyticsChartStyle || 'combo';
        if (window.timerAnalyticsGrouping === 'hourly') window.timerAnalyticsGrouping = 'daily';
        const grouping = window.timerAnalyticsGrouping || 'daily';

        const activeClass = "shrink-0 px-2 sm:px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-lg transition-all bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/30 dark:border-slate-700/30";
        const inactiveClass = "shrink-0 px-2 sm:px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-lg transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200";
        const disabledClass = "shrink-0 px-2 sm:px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-lg transition-all text-slate-400 dark:text-slate-600 opacity-40 cursor-not-allowed";

        // 1. Sync timeframe buttons styling
        [1, 7, 30, 180].forEach(d => {
            const btn = document.getElementById(`tar-btn-${d}`);
            const spectraBtn = document.getElementById(`spectra-tar-btn-${d}`);
            if (btn) btn.className = d === range ? activeClass : inactiveClass;
            if (spectraBtn) spectraBtn.className = d === range ? activeClass : inactiveClass;
        });

        // 2. Manage Day Stepper for 1 Day Range vs Grouping selector for multi-day
        const dayOffset = window.timerAnalyticsDayOffset || 0;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);

        let dateLabel = "Today";
        if (dayOffset === -1) {
            dateLabel = "Yesterday";
        } else if (dayOffset < -1) {
            dateLabel = targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }

        ['spectra-day-label', 'day-label'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = dateLabel;
        });

        const isNextDisabled = dayOffset >= 0;

        ['spectra-day-next-btn', 'day-next-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                if (isNextDisabled || range !== 1) {
                    btn.setAttribute('disabled', 'true');
                    btn.classList.add('opacity-30', 'cursor-not-allowed');
                } else {
                    btn.removeAttribute('disabled');
                    btn.classList.remove('opacity-30', 'cursor-not-allowed');
                }
            }
        });

        ['spectra-day-prev-btn', 'day-prev-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                if (range !== 1) {
                    btn.setAttribute('disabled', 'true');
                    btn.classList.add('opacity-30', 'cursor-not-allowed');
                } else {
                    btn.removeAttribute('disabled');
                    btn.classList.remove('opacity-30', 'cursor-not-allowed');
                }
            }
        });

        // Toggle visibility between Day Stepper (range === 1) and Grouping Selector (range > 1)
        ['spectra-day-stepper', 'day-stepper'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = range === 1 ? 'flex' : 'none';
            }
        });

        const groupingContainers = [
            document.getElementById('spectra-tag-btn-daily')?.parentElement,
            document.getElementById('tag-btn-daily')?.parentElement
        ];
        groupingContainers.forEach(el => {
            if (el) {
                el.style.display = range === 1 ? 'none' : 'flex';
            }
        });

        // 3. Manage Grouping buttons based on selected Range
        if (range === 1) {
            window.timerAnalyticsGrouping = 'daily';
        } else if (range === 7) {
            window.timerAnalyticsGrouping = 'daily';
        } else if (range === 30) {
            if (window.timerAnalyticsGrouping === 'monthly') window.timerAnalyticsGrouping = 'daily';
        }

        const currentGrouping = window.timerAnalyticsGrouping || 'daily';

        ['daily', 'weekly', 'monthly'].forEach(g => {
            const btn = document.getElementById(`tag-btn-${g}`);
            const spectraBtn = document.getElementById(`spectra-tag-btn-${g}`);
            let isDisabled = false;

            if (range === 1) isDisabled = true;
            else if (range === 7 && g !== 'daily') isDisabled = true;
            else if (range === 30 && g === 'monthly') isDisabled = true;

            [btn, spectraBtn].forEach(b => {
                if (!b) return;
                if (isDisabled) {
                    b.setAttribute('disabled', 'true');
                    b.className = disabledClass;
                } else {
                    b.removeAttribute('disabled');
                    b.className = (g === currentGrouping && range !== 1) ? activeClass : inactiveClass;
                }
            });
        });

        // 4. Sync Chart Style buttons styling
        ['combo', 'bar', 'line'].forEach(s => {
            const btn = document.getElementById(`tas-btn-${s}`);
            const spectraBtn = document.getElementById(`spectra-tas-btn-${s}`);
            if (btn) btn.className = s === style ? activeClass : inactiveClass;
            if (spectraBtn) spectraBtn.className = s === style ? activeClass : inactiveClass;
        });

        // Sync Target Input values
        const targetVal = window.dailyFocusHoursTarget !== undefined ? window.dailyFocusHoursTarget : 0;
        ['timer-target-input', 'spectra-timer-target-input'].forEach(id => {
            const input = document.getElementById(id);
            if (input && parseFloat(input.value) !== targetVal) {
                input.value = targetVal;
            }
        });
    };

    window.openTimerAnalyticsModal = function () {
        const targetInput = document.getElementById('timer-target-input');
        if (targetInput) {
            targetInput.value = window.dailyFocusHoursTarget !== undefined ? window.dailyFocusHoursTarget : 0;
        }
        if (window.timerAnalyticsRange === undefined) {
            window.timerAnalyticsRange = 180;
        }
        if (window.timerAnalyticsChartStyle === undefined) {
            window.timerAnalyticsChartStyle = 'combo';
        }
        if (window.timerAnalyticsGrouping === undefined) {
            window.timerAnalyticsGrouping = 'daily';
        }
        window.updateTimerAnalyticsControls();
        window.renderTimerAnalyticsChart();
        window.openModal('timer-analytics-modal');
    };

    window.getDailyFocusHoursTargetForDate = function (dateObj) {
        if (!window.dailyFocusHoursTargetHistory || window.dailyFocusHoursTargetHistory.length === 0) {
            return window.dailyFocusHoursTarget !== undefined ? window.dailyFocusHoursTarget : 0;
        }

        const sorted = [...window.dailyFocusHoursTargetHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

        const queryDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        const queryTime = queryDate.getTime();

        const firstEntryDate = new Date(sorted[0].date);
        const firstEntryStartOfDay = new Date(firstEntryDate.getFullYear(), firstEntryDate.getMonth(), firstEntryDate.getDate()).getTime();

        if (queryTime < firstEntryStartOfDay) {
            return 0;
        }

        let activeTarget = sorted[0].target;
        for (let i = 0; i < sorted.length; i++) {
            const entryDate = new Date(sorted[i].date);
            const entryStartOfDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate()).getTime();
            if (queryTime >= entryStartOfDay) {
                activeTarget = sorted[i].target;
            }
        }
        return activeTarget;
    };

    window.updateDailyFocusHoursTarget = function (value) {
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed >= 0) {
            window.dailyFocusHoursTarget = parsed;
            window.dailyFocusHoursTargetDate = new Date().toISOString();

            if (!window.dailyFocusHoursTargetHistory) {
                window.dailyFocusHoursTargetHistory = [];
            }

            const todayStr = new Date().toDateString();
            const existingIdx = window.dailyFocusHoursTargetHistory.findIndex(entry =>
                new Date(entry.date).toDateString() === todayStr
            );

            if (existingIdx !== -1) {
                window.dailyFocusHoursTargetHistory[existingIdx].target = parsed;
                window.dailyFocusHoursTargetHistory[existingIdx].date = new Date().toISOString();
            } else {
                window.dailyFocusHoursTargetHistory.push({
                    date: new Date().toISOString(),
                    target: parsed
                });
            }

            if (window.FirebaseService) {
                window.FirebaseService.saveToCloud(true);
            }
            window.updateTimerAnalyticsControls();
            window.renderTimerAnalyticsChart();
        }
    };

    window.setTimerAnalyticsRange = function (days) {
        window.timerAnalyticsRange = days;
        if (days !== 1) {
            window.timerAnalyticsDayOffset = 0;
        }
        if (window.AppState) {
            window.AppState.timerAnalyticsRange = days;
            window.AppState._lastFilterChangeTime = Date.now();
        }
        try {
            safeStorage.setItem('x29_timerAnalyticsRange', String(days));
        } catch (e) {}
        window.updateTimerAnalyticsControls();
        window.renderTimerAnalyticsChart();
        if (typeof window.debouncedSaveTimerPreferences === 'function') {
            window.debouncedSaveTimerPreferences();
        }
    };

    window.setTimerAnalyticsGrouping = function (grouping) {
        const range = window.timerAnalyticsRange || 180;
        if (range === 1) return;
        if (range === 7 && grouping !== 'daily') return;
        if (range === 30 && grouping === 'monthly') return;

        window.timerAnalyticsGrouping = grouping;
        if (window.AppState) {
            window.AppState.timerAnalyticsGrouping = grouping;
            window.AppState._lastFilterChangeTime = Date.now();
        }
        try {
            safeStorage.setItem('x29_timerAnalyticsGrouping', String(grouping));
        } catch (e) {}
        window.updateTimerAnalyticsControls();
        window.renderTimerAnalyticsChart();
        if (typeof window.debouncedSaveTimerPreferences === 'function') {
            window.debouncedSaveTimerPreferences();
        }
    };

    window.setTimerAnalyticsChartStyle = function (style) {
        window.timerAnalyticsChartStyle = style;
        if (window.AppState) {
            window.AppState.timerAnalyticsChartStyle = style;
            window.AppState._lastFilterChangeTime = Date.now();
        }
        try {
            safeStorage.setItem('x29_timerAnalyticsChartStyle', String(style));
        } catch (e) {}
        window.updateTimerAnalyticsControls();
        window.renderTimerAnalyticsChart();
        if (typeof window.debouncedSaveTimerPreferences === 'function') {
            window.debouncedSaveTimerPreferences();
        }
    };

    function buildDatasetsForCanvas(canvasEl, style, grouping, range, chartActuals, chartTargets, actualLabelName, targetLabelName, isDark, sumActual = 0, dayTarget = 0) {
        const canvasCtx = canvasEl.getContext('2d');
        const width = canvasEl.clientWidth || 500;
        const height = canvasEl.clientHeight || 300;

        let datasets = [];

        if (range === 1) {
            // Hill Line for Today: Smooth bezier area curve
            let actualFillGradient = 'rgba(99, 102, 241, 0.35)';
            let actualLineGradient = '#6366f1';
            const isGoalMet = sumActual >= dayTarget && dayTarget > 0;
            const primaryColor = isGoalMet ? '#10b981' : '#6366f1';
            const secondaryColor = isGoalMet ? '#34d399' : '#818cf8';

            try {
                const gradFill = canvasCtx.createLinearGradient(0, 0, 0, height || 300);
                if (isGoalMet) {
                    gradFill.addColorStop(0, 'rgba(16, 185, 129, 0.55)');
                    gradFill.addColorStop(0.5, 'rgba(52, 211, 153, 0.25)');
                    gradFill.addColorStop(1, 'rgba(16, 185, 129, 0.00)');
                } else {
                    gradFill.addColorStop(0, 'rgba(99, 102, 241, 0.55)');
                    gradFill.addColorStop(0.5, 'rgba(129, 140, 248, 0.25)');
                    gradFill.addColorStop(1, 'rgba(99, 102, 241, 0.00)');
                }
                actualFillGradient = gradFill;

                const gradLine = canvasCtx.createLinearGradient(0, 0, width || 500, 0);
                gradLine.addColorStop(0, secondaryColor);
                gradLine.addColorStop(0.5, primaryColor);
                gradLine.addColorStop(1, isGoalMet ? '#059669' : '#4f46e5');
                actualLineGradient = gradLine;
            } catch (e) {
                console.error(e);
            }

            datasets = [
                {
                    type: 'line',
                    label: actualLabelName,
                    data: [...chartActuals],
                    borderColor: actualLineGradient,
                    borderWidth: 3.5,
                    backgroundColor: actualFillGradient,
                    fill: true,
                    tension: 0.45,
                    pointRadius: 0,
                    pointHoverRadius: 7,
                    pointBackgroundColor: isDark ? '#0f172a' : '#ffffff',
                    pointBorderColor: primaryColor,
                    pointBorderWidth: 2.5,
                    pointHoverBackgroundColor: primaryColor,
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3
                },
                {
                    type: 'line',
                    label: targetLabelName,
                    data: [...chartTargets],
                    borderColor: '#f43f5e',
                    borderWidth: 2.5,
                    borderDash: [6, 4],
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }
            ];
            return datasets;
        }

        if (style === 'combo') {
            let successBarGrad = 'rgba(16, 185, 129, 1.0)';
            let failBarGrad = 'rgba(99, 102, 241, 1.0)';
            try {
                const successGrad = canvasCtx.createLinearGradient(0, height, 0, 0);
                successGrad.addColorStop(0, 'rgba(16, 185, 129, 0.85)');
                successGrad.addColorStop(1, 'rgba(16, 185, 129, 1.0)');
                successBarGrad = successGrad;

                const failGrad = canvasCtx.createLinearGradient(0, height, 0, 0);
                failGrad.addColorStop(0, 'rgba(99, 102, 241, 0.85)');
                failGrad.addColorStop(1, 'rgba(99, 102, 241, 1.0)');
                failBarGrad = failGrad;
            } catch (e) {
                console.error(e);
            }

            const barColors = [];
            const barHoverColors = [];
            for (let i = 0; i < chartActuals.length; i++) {
                const met = chartActuals[i] >= chartTargets[i];
                if (met) {
                    barColors.push(successBarGrad);
                    barHoverColors.push('rgba(16, 185, 129, 1)');
                } else {
                    barColors.push(failBarGrad);
                    barHoverColors.push('rgba(99, 102, 241, 1)');
                }
            }

            datasets = [
                {
                    type: 'bar',
                    label: actualLabelName,
                    data: [...chartActuals],
                    backgroundColor: barColors,
                    hoverBackgroundColor: barHoverColors,
                    borderRadius: 8,
                    borderWidth: 0,
                    barPercentage: range > 30 && grouping === 'daily' ? 0.8 : 0.6
                },
                {
                    type: 'line',
                    label: targetLabelName,
                    data: [...chartTargets],
                    borderColor: '#f43f5e',
                    borderWidth: 3.5,
                    borderDash: [6, 4],
                    fill: false,
                    tension: 0.4,
                    pointRadius: chartActuals.length > 30 ? 0 : 3.5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: isDark ? '#0f172a' : '#ffffff',
                    pointBorderColor: '#f43f5e',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#f43f5e',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }
            ];
        } else if (style === 'bar') {
            let barActualGrad = 'rgba(99, 102, 241, 1.0)';
            let barTargetGrad = 'rgba(244, 63, 94, 1.0)';
            try {
                const g1 = canvasCtx.createLinearGradient(0, height, 0, 0);
                g1.addColorStop(0, 'rgba(99, 102, 241, 0.85)');
                g1.addColorStop(1, 'rgba(99, 102, 241, 1.0)');
                barActualGrad = g1;

                const g2 = canvasCtx.createLinearGradient(0, height, 0, 0);
                g2.addColorStop(0, 'rgba(244, 63, 94, 0.85)');
                g2.addColorStop(1, 'rgba(244, 63, 94, 1.0)');
                barTargetGrad = g2;
            } catch (e) {
                console.error(e);
            }

            datasets = [
                {
                    type: 'bar',
                    label: actualLabelName,
                    data: [...chartActuals],
                    backgroundColor: barActualGrad,
                    hoverBackgroundColor: 'rgba(99, 102, 241, 1)',
                    borderRadius: 6,
                    borderWidth: 0
                },
                {
                    type: 'bar',
                    label: targetLabelName,
                    data: [...chartTargets],
                    backgroundColor: barTargetGrad,
                    hoverBackgroundColor: 'rgba(244, 63, 94, 1.0)',
                    borderRadius: 6,
                    borderWidth: 0
                }
            ];
        } else {
            let actualLineGradient = '#6366f1';
            let actualFillGradient = 'rgba(99, 102, 241, 0.65)';
            try {
                const gradLine = canvasCtx.createLinearGradient(0, 0, width || 500, 0);
                gradLine.addColorStop(0, '#818cf8');
                gradLine.addColorStop(0.5, '#6366f1');
                gradLine.addColorStop(1, '#4f46e5');
                actualLineGradient = gradLine;

                const gradFill = canvasCtx.createLinearGradient(0, 0, 0, height || 300);
                gradFill.addColorStop(0, 'rgba(99, 102, 241, 0.85)');
                gradFill.addColorStop(0.5, 'rgba(129, 140, 248, 0.55)');
                gradFill.addColorStop(1, 'rgba(99, 102, 241, 0)');
                actualFillGradient = gradFill;
            } catch (e) {
                console.error(e);
            }

            datasets = [
                {
                    type: 'line',
                    label: actualLabelName,
                    data: [...chartActuals],
                    borderColor: actualLineGradient,
                    borderWidth: 4,
                    backgroundColor: actualFillGradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: chartActuals.length > 30 ? 0 : 3.5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: isDark ? '#0f172a' : '#ffffff',
                    pointBorderColor: '#6366f1',
                    pointBorderWidth: 2.5,
                    pointHoverBackgroundColor: '#4f46e5',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3
                },
                {
                    type: 'line',
                    label: targetLabelName,
                    data: [...chartTargets],
                    borderColor: '#f43f5e',
                    borderWidth: 3.5,
                    borderDash: [6, 4],
                    fill: false,
                    tension: 0.4,
                    pointRadius: chartActuals.length > 30 ? 0 : 3.5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: isDark ? '#0f172a' : '#ffffff',
                    pointBorderColor: '#f43f5e',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#f43f5e',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }
            ];
        }

        return datasets;
    }

    function updateOrCreateCanvasChart(canvasEl, instanceRefKey, style, chartLabels, datasets, yMax, isDark, isLiveUpdate = false, range = 180, sumActual = 0, dayTarget = 0) {
        if (!canvasEl) return;

        let chartInstance = window[instanceRefKey];

        const canUpdateInPlace = chartInstance &&
            chartInstance.ctx &&
            chartInstance.data &&
            chartInstance.data.datasets &&
            chartInstance.data.datasets.length === datasets.length &&
            chartInstance.data.datasets.every((ds, idx) => ds.type === datasets[idx].type) &&
            chartInstance._style === style &&
            chartInstance._range === range;

        if (canUpdateInPlace) {
            chartInstance.data.labels = chartLabels;
            chartInstance._sumActual = sumActual;
            chartInstance._dayTarget = dayTarget;
            datasets.forEach((newDs, idx) => {
                const targetDs = chartInstance.data.datasets[idx];
                targetDs.data = newDs.data;
                targetDs.label = newDs.label;
                targetDs.backgroundColor = newDs.backgroundColor;
                targetDs.borderColor = newDs.borderColor;
                targetDs.pointRadius = newDs.pointRadius;
                if (newDs.borderDash !== undefined) targetDs.borderDash = newDs.borderDash;
                if (newDs.barPercentage !== undefined) targetDs.barPercentage = newDs.barPercentage;
                if (newDs.tension !== undefined) targetDs.tension = newDs.tension;
                if (newDs.fill !== undefined) targetDs.fill = newDs.fill;
            });

            if (chartInstance.options.scales && chartInstance.options.scales.y) {
                chartInstance.options.scales.y.max = yMax;
                chartInstance.options.scales.y.ticks.color = isDark ? '#94a3b8' : '#64748b';
                chartInstance.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)';
            }
            if (chartInstance.options.scales && chartInstance.options.scales.x) {
                chartInstance.options.scales.x.ticks.color = isDark ? '#94a3b8' : '#64748b';
                chartInstance.options.scales.x.ticks.autoSkip = range === 1 ? false : true;
                chartInstance.options.scales.x.ticks.maxTicksLimit = range === 1 ? undefined : (chartLabels.length > 30 ? 6 : (chartLabels.length > 7 ? 10 : 7));
                chartInstance.options.scales.x.ticks.callback = function (val, index, ticks) {
                    if (range === 1) {
                        if (index === 0) return '12:00 AM';
                        if (index === ticks.length - 1) return '11:59 PM';
                        return '';
                    }
                    return this.getLabelForValue(val);
                };
            }

            chartInstance.update(isLiveUpdate ? 'none' : 'default');
            return;
        }

        if (chartInstance) {
            try {
                chartInstance.destroy();
            } catch (e) {
                console.error('Error destroying chart instance:', e);
            }
            window[instanceRefKey] = null;
        }

        const shadowPlugin = {
            id: 'timerAnalyticsShadow_' + instanceRefKey,
            beforeDatasetDraw: (chart, args) => {
                const { ctx: drawingCtx } = chart;
                const dataset = chart.data.datasets[args.index];
                if (dataset && dataset.type === 'line') {
                    drawingCtx.save();
                    drawingCtx.shadowColor = (args.index === 0)
                        ? (isDark ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.25)')
                        : (isDark ? 'rgba(244, 63, 94, 0.45)' : 'rgba(244, 63, 94, 0.25)');
                    drawingCtx.shadowBlur = 4;
                    drawingCtx.shadowOffsetX = 0;
                    drawingCtx.shadowOffsetY = 2;
                }
            },
            afterDatasetDraw: (chart, args) => {
                const { ctx: drawingCtx } = chart;
                const dataset = chart.data.datasets[args.index];
                if (dataset && dataset.type === 'line') {
                    drawingCtx.restore();
                }
            }
        };

        const crosshairPlugin = {
            id: 'timerAnalyticsCrosshair_' + instanceRefKey,
            afterDraw: (chart) => {
                const activeElements = chart.tooltip?.getActiveElements?.() || chart.tooltip?._active || [];
                if (activeElements.length) {
                    const activePoint = activeElements[0];
                    const { ctx: drawingCtx, chartArea: { top, bottom } } = chart;
                    if (!activePoint || !activePoint.element) return;
                    const x = activePoint.element.x;
                    drawingCtx.save();
                    drawingCtx.beginPath();
                    drawingCtx.moveTo(x, top);
                    drawingCtx.lineTo(x, bottom);
                    drawingCtx.lineWidth = 1.2;
                    drawingCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.08)';
                    drawingCtx.setLineDash([4, 4]);
                    drawingCtx.stroke();
                    drawingCtx.restore();
                }
            }
        };

        const targetLineLabelPlugin = {
            id: 'targetLineLabel_' + instanceRefKey,
            afterDraw: (chart) => {
                const { ctx: drawingCtx, chartArea: { right }, scales: { y: yScale } } = chart;
                const targetHours = window.dailyFocusHoursTarget !== undefined ? window.dailyFocusHoursTarget : 0;
                if (!yScale || !chart.chartArea) return;
                const yPos = yScale.getPixelForValue(targetHours);

                if (yPos >= chart.chartArea.top && yPos <= chart.chartArea.bottom) {
                    drawingCtx.save();
                    drawingCtx.fillStyle = '#f43f5e';
                    drawingCtx.font = 'bold 9px Inter, sans-serif';
                    drawingCtx.textAlign = 'right';
                    drawingCtx.textBaseline = 'bottom';
                    drawingCtx.fillText('CURRENT GOAL', right - 4, yPos - 10);
                    drawingCtx.restore();
                }
            }
        };

        const baseType = (range === 1 || style === 'line') ? 'line' : (style === 'bar' ? 'bar' : 'bar');

        const chartConfig = {
            type: baseType,
            data: {
                labels: chartLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: isLiveUpdate ? 0 : 300,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            boxWidth: 10,
                            boxHeight: 10,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                weight: 'bold',
                                size: 11,
                                family: 'Outfit, Inter, sans-serif'
                            },
                            color: isDark ? '#cbd5e1' : '#475569',
                            padding: 20
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                        borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.15)',
                        borderWidth: 1.5,
                        titleColor: isDark ? '#ffffff' : '#0f172a',
                        titleFont: {
                            family: 'Outfit, Inter, sans-serif',
                            weight: '800',
                            size: 12
                        },
                        bodyColor: isDark ? '#cbd5e1' : '#334155',
                        bodyFont: {
                            family: 'Inter, sans-serif',
                            weight: '600',
                            size: 11
                        },
                        footerColor: isDark ? '#818cf8' : '#6366f1',
                        footerFont: {
                            family: 'Inter, sans-serif',
                            weight: '800',
                            size: 10
                        },
                        cornerRadius: 12,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                            label: function (context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                if (range === 1 && context.datasetIndex === 0) {
                                    return ` Focus Level: ${value !== undefined ? value.toFixed(2) : 0} hrs`;
                                }
                                return ` ${label}: ${value !== undefined ? value.toFixed(2) : 0} hrs`;
                            },
                            footer: function (tooltipItems) {
                                if (range === 1) {
                                    const actual = (chartInstance && chartInstance._sumActual !== undefined) ? chartInstance._sumActual : sumActual;
                                    const target = (chartInstance && chartInstance._dayTarget !== undefined) ? chartInstance._dayTarget : dayTarget;
                                    const diff = actual - target;
                                    const percent = target > 0 ? Math.round((actual / target) * 100) : 0;
                                    if (diff >= 0) {
                                        return `Goal Met! (Total: ${actual.toFixed(2)}h / Target: ${target.toFixed(2)}h, ${percent}%)`;
                                    } else {
                                        return `In Progress (Total: ${actual.toFixed(2)}h / Target: ${target.toFixed(2)}h, ${percent}%)`;
                                    }
                                }
                                if (tooltipItems.length >= 2) {
                                    const actual = tooltipItems[0].parsed.y;
                                    const target = tooltipItems[1].parsed.y;
                                    const diff = actual - target;
                                    const percent = target > 0 ? Math.round((actual / target) * 100) : 0;
                                    if (diff >= 0) {
                                        return `Goal Met! (+${diff.toFixed(2)}h, ${percent}%)`;
                                    } else {
                                        return `Goal Missed (${diff.toFixed(2)}h, ${percent}%)`;
                                    }
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: yMax,
                        grid: {
                            color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
                            drawBorder: false,
                            borderDash: [5, 5]
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: isDark ? '#94a3b8' : '#64748b',
                            font: {
                                weight: 'bold',
                                family: 'Inter, sans-serif',
                                size: 10
                            },
                            padding: 8,
                            callback: v => `${v}h`
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: isDark ? '#94a3b8' : '#64748b',
                            font: {
                                weight: 'bold',
                                family: 'Inter, sans-serif',
                                size: 10
                            },
                            padding: 8,
                            autoSkip: range === 1 ? false : true,
                            maxTicksLimit: range === 1 ? undefined : (chartLabels.length > 30 ? 6 : (chartLabels.length > 7 ? 10 : 7)),
                            maxRotation: 0,
                            minRotation: 0,
                            callback: function (val, index, ticks) {
                                if (range === 1) {
                                    if (index === 0) return '12:00 AM';
                                    if (index === ticks.length - 1) return '11:59 PM';
                                    return '';
                                }
                                return this.getLabelForValue(val);
                            }
                        }
                    }
                }
            },
            plugins: [shadowPlugin, crosshairPlugin, targetLineLabelPlugin]
        };

        const newChart = new Chart(canvasEl.getContext('2d'), chartConfig);
        newChart._style = style;
        newChart._range = range;
        newChart._sumActual = sumActual;
        newChart._dayTarget = dayTarget;
        window[instanceRefKey] = newChart;
    }

    window.renderTimerAnalyticsChart = function (isLiveUpdate = false) {
        const ctx1 = document.getElementById('timerAnalyticsChart');
        const ctx2 = document.getElementById('spectraFocusAnalyticsChart');
        if (!ctx1 && !ctx2) return;

        const range = window.timerAnalyticsRange || 180;
        const style = window.timerAnalyticsChartStyle || 'combo';
        if (window.timerAnalyticsGrouping === 'hourly') window.timerAnalyticsGrouping = 'daily';
        let grouping = window.timerAnalyticsGrouping || 'daily';

        // Range constraints on grouping
        if (range === 1) {
            grouping = 'daily';
        } else if (range === 7) {
            grouping = 'daily';
        } else if (range === 30 && grouping === 'monthly') {
            grouping = 'daily';
        }

        let chartLabels = [];
        let chartActuals = [];
        let chartTargets = [];
        let sumActual = 0;
        let dayTarget = 0;

        if (range === 1) {
            const dayOffset = window.timerAnalyticsDayOffset || 0;
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + dayOffset);

            const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0).getTime();
            const targetEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999).getTime();

            // Gather selected day's sessions
            const todaySessions = [];
            let totalTodaySeconds = 0;

            if (AppState.timerLogs && Array.isArray(AppState.timerLogs)) {
                AppState.timerLogs.forEach(log => {
                    const logTime = new Date(log.date).getTime();
                    if (logTime >= targetStart && logTime <= targetEnd) {
                        const durSec = parseInt(log.duration || 0, 10);
                        if (durSec > 0) {
                            totalTodaySeconds += durSec;
                            const endHour = (logTime - targetStart) / 3600000;
                            const startHour = Math.max(0, endHour - (durSec / 3600));
                            todaySessions.push({
                                startHour,
                                endHour,
                                durSec,
                                durHours: durSec / 3600,
                                subject: log.subject || 'Focus',
                                time: new Date(log.date)
                            });
                        }
                    }
                });
            }

            // Real-time addition for active timer/stopwatch ONLY if viewing Today (dayOffset === 0) and currently running
            if (dayOffset === 0 && AppState.activeTimerState) {
                let activeMs = 0;
                let activeSubject = 'Focus';
                if (AppState.activeTimerState.timerStates) {
                    Object.values(AppState.activeTimerState.timerStates).forEach(store => {
                        if (store.isRunning) {
                            let ms = store.elapsedBeforeStart || 0;
                            if (store.startTime) {
                                ms += (window.getServerTime() - parseStartTime(store.startTime));
                            }
                            activeMs += ms;
                            if (store.subject) activeSubject = store.subject;
                        }
                    });
                } else if (AppState.activeTimerState.isRunning) {
                    activeMs = AppState.activeTimerState.elapsedBeforeStart || 0;
                    if (AppState.activeTimerState.startTime) {
                        activeMs += (window.getServerTime() - parseStartTime(AppState.activeTimerState.startTime));
                    }
                    if (AppState.activeTimerState.subject) activeSubject = AppState.activeTimerState.subject;
                }
                const activeSec = Math.floor(activeMs / 1000);
                if (activeSec > 0) {
                    totalTodaySeconds += activeSec;
                    const nowTime = (typeof window.getServerTime === 'function') ? window.getServerTime() : Date.now();
                    const endHour = Math.min(24, (nowTime - targetStart) / 3600000);
                    const startHour = Math.max(0, endHour - (activeSec / 3600));
                    todaySessions.push({
                        startHour,
                        endHour,
                        durSec: activeSec,
                        durHours: activeSec / 3600,
                        subject: activeSubject,
                        time: new Date(nowTime),
                        isActive: true
                    });
                }
            }

            dayTarget = window.getDailyFocusHoursTargetForDate(targetDate);
            sumActual = parseFloat((totalTodaySeconds / 3600).toFixed(2));
            const successRate = dayTarget > 0 ? Math.round((sumActual / dayTarget) * 100) : 0;

            // Generate timeline points across the selected day [00:00 to 24:00] (49 sample points, every 30m)
            const numPoints = 49;
            const rawHill = new Array(numPoints).fill(0);

            for (let i = 0; i < numPoints; i++) {
                const hourFloat = (i / (numPoints - 1)) * 24; // 0.0 to 24.0

                // Construct display time label for tooltip
                const hrInt = Math.floor(hourFloat) % 24;
                const minInt = Math.round((hourFloat - Math.floor(hourFloat)) * 60);
                const ampm = (hourFloat >= 12 && hourFloat < 24) ? 'PM' : 'AM';
                let displayHr = hrInt % 12;
                if (displayHr === 0) displayHr = 12;
                const minStr = minInt === 0 ? '00' : String(minInt).padStart(2, '0');

                let label = '';
                if (i === 0) {
                    label = '12:00 AM';
                } else if (i === numPoints - 1) {
                    label = '11:59 PM';
                } else {
                    label = `${displayHr}:${minStr} ${ampm}`;
                }
                chartLabels.push(label);

                if (sumActual > 0) {
                    // Compute contribution from sessions into smooth bell/hill curve
                    if (todaySessions.length > 0) {
                        let pointVal = 0;
                        todaySessions.forEach(s => {
                            const mid = (s.startHour + s.endHour) / 2;
                            const spread = Math.max(1.8, (s.endHour - s.startHour) * 1.5);
                            const dist = hourFloat - mid;
                            const bell = Math.exp(-Math.pow(dist / spread, 2) * 2.2);
                            pointVal += s.durHours * bell;
                        });
                        rawHill[i] = pointVal;
                    } else {
                        const mid = 14;
                        const spread = 5;
                        rawHill[i] = sumActual * Math.exp(-Math.pow((hourFloat - mid) / spread, 2) * 2);
                    }
                }
            }

            // Scale raw hill curve so its crest/height reflects sumActual
            if (sumActual > 0) {
                const maxRaw = Math.max(...rawHill);
                const scale = maxRaw > 0 ? (sumActual / maxRaw) : 1;
                for (let i = 0; i < numPoints; i++) {
                    if (i === 0 || i === numPoints - 1) {
                        chartActuals.push(0);
                    } else {
                        const val = parseFloat((rawHill[i] * scale).toFixed(2));
                        chartActuals.push(val);
                    }
                    chartTargets.push(dayTarget);
                }
            } else {
                for (let i = 0; i < numPoints; i++) {
                    chartActuals.push(0);
                    chartTargets.push(dayTarget);
                }
            }

            // Find peak session/period if any
            let peakSessionStr = "No Data";
            let peakSessionVal = 0;
            if (todaySessions.length > 0) {
                const sortedSessions = [...todaySessions].sort((a, b) => b.durSec - a.durSec);
                const best = sortedSessions[0];
                peakSessionVal = best.durHours;
                peakSessionStr = `${formatHoursToHrMin(best.durHours)} (${best.subject})`;
            }

            // Update Stats UI for 1 Day (both Modal and Analytics page)
            ['timer-average-focus', 'spectra-timer-average-focus'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = formatHoursToHrMin(sumActual);
            });

            ['timer-average-target', 'spectra-timer-average-target'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = formatHoursToHrMin(dayTarget);
            });

            ['timer-total-focus', 'spectra-timer-total-focus'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = formatHoursToHrMin(sumActual);
            });

            ['timer-success-rate', 'spectra-timer-success-rate'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.innerText = `${successRate}%`;
                    if (successRate >= 75) {
                        el.className = "text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400";
                    } else if (successRate >= 40) {
                        el.className = "text-base md:text-lg font-black text-amber-600 dark:text-amber-400";
                    } else {
                        el.className = "text-base md:text-lg font-black text-rose-600 dark:text-rose-400";
                    }
                }
            });

            let subtitleText = "Today";
            if (dayOffset === -1) {
                subtitleText = "Yesterday";
            } else if (dayOffset < -1) {
                subtitleText = targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: targetDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
            }

            ['timer-success-rate-subtitle', 'spectra-timer-success-rate-subtitle'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = subtitleText;
            });

            ['timer-peak-value', 'spectra-timer-peak-value'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = sumActual > 0 ? formatHoursToHrMin(peakSessionVal || sumActual) : "0 min";
            });

            ['timer-peak-date', 'spectra-timer-peak-date'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = sumActual > 0 ? (peakSessionStr !== "No Data" ? peakSessionStr : subtitleText) : "No Data";
            });
        } else {
            // 1. Gather daily data points
            const dailyPoints = [];
            for (let i = range - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);

                const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
                const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

                let totalSeconds = 0;
                if (AppState.timerLogs) {
                    AppState.timerLogs.forEach(log => {
                        const logTime = new Date(log.date).getTime();
                        if (logTime >= dayStart && logTime <= dayEnd) {
                            totalSeconds += parseInt(log.duration || 0, 10);
                        }
                    });
                }

                const actualHrs = parseFloat((totalSeconds / 3600).toFixed(2));
                const targetVal = window.getDailyFocusHoursTargetForDate(d);

                dailyPoints.push({
                    date: d,
                    actual: actualHrs,
                    target: targetVal
                });
            }

            // 2. Compute Analytics Statistics (overall for the selected range)
            sumActual = dailyPoints.reduce((acc, p) => acc + p.actual, 0);
            const avgActual = parseFloat((sumActual / range).toFixed(2));
            const sumTarget = dailyPoints.reduce((acc, p) => acc + p.target, 0);
            const avgTarget = parseFloat((sumTarget / range).toFixed(2));
            dayTarget = avgTarget;

            const successRate = avgTarget > 0 ? Math.round((avgActual / avgTarget) * 100) : 0;
            const successDays = dailyPoints.filter(p => p.actual >= p.target).length;

            let peakDay = { actual: 0, date: null };
            dailyPoints.forEach(p => {
                if (p.actual > peakDay.actual) {
                    peakDay = p;
                }
            });

            // Update Stats UI (both Modal and Analytics page)
            const avgVal = formatHoursToHrMin(avgActual);
            const avgTargetVal = formatHoursToHrMin(avgTarget);
            const totalVal = formatHoursToHrMin(sumActual);
            const rateStr = `${successRate}%`;
            const subtitleStr = `${successDays} of ${range} days`;
            const peakValStr = peakDay.actual > 0 && peakDay.date ? formatHoursToHrMin(peakDay.actual) : "0 min";
            const peakDateStr = peakDay.actual > 0 && peakDay.date ? peakDay.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "No Data";

            ['timer-average-focus', 'spectra-timer-average-focus'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = avgVal;
            });

            ['timer-average-target', 'spectra-timer-average-target'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = avgTargetVal;
            });

            ['timer-total-focus', 'spectra-timer-total-focus'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = totalVal;
            });

            ['timer-success-rate', 'spectra-timer-success-rate'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.innerText = rateStr;
                    if (successRate >= 75) {
                        el.className = "text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400";
                    } else if (successRate >= 40) {
                        el.className = "text-base md:text-lg font-black text-amber-600 dark:text-amber-400";
                    } else {
                        el.className = "text-base md:text-lg font-black text-rose-600 dark:text-rose-400";
                    }
                }
            });

            ['timer-success-rate-subtitle', 'spectra-timer-success-rate-subtitle'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = subtitleStr;
            });

            ['timer-peak-value', 'spectra-timer-peak-value'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = peakValStr;
            });

            ['timer-peak-date', 'spectra-timer-peak-date'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = peakDateStr;
            });

            // 3. Perform Data Aggregation for Chart
            if (grouping === 'weekly') {
                const weeklyGroups = {};
                dailyPoints.forEach(p => {
                    const d = new Date(p.date);
                    const dayOfWeek = d.getDay();
                    const diffToSat = (dayOfWeek + 1) % 7;

                    const satDate = new Date(d);
                    satDate.setDate(d.getDate() - diffToSat);
                    satDate.setHours(0, 0, 0, 0);

                    const key = `${satDate.getFullYear()}-${String(satDate.getMonth() + 1).padStart(2, '0')}-${String(satDate.getDate()).padStart(2, '0')}`;
                    if (!weeklyGroups[key]) {
                        weeklyGroups[key] = [];
                    }
                    weeklyGroups[key].push(p);
                });

                const sortedKeys = Object.keys(weeklyGroups).sort();

                sortedKeys.forEach(key => {
                    const group = weeklyGroups[key];
                    const weekActualSum = group.reduce((acc, p) => acc + p.actual, 0);
                    const weekTargetSum = group.reduce((acc, p) => acc + p.target, 0);
                    const weekActual = parseFloat((weekActualSum / group.length).toFixed(2));
                    const weekTarget = parseFloat((weekTargetSum / group.length).toFixed(2));

                    chartActuals.push(weekActual);
                    chartTargets.push(weekTarget);

                    const startD = new Date(key);
                    const endD = new Date(startD);
                    endD.setDate(startD.getDate() + 6);

                    const startStr = startD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    const endStr = endD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    chartLabels.push(`${startStr} - ${endStr}`);
                });
            } else if (grouping === 'monthly') {
                const monthlyGroups = {};
                dailyPoints.forEach(p => {
                    const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, '0')}`;
                    if (!monthlyGroups[key]) {
                        monthlyGroups[key] = [];
                    }
                    monthlyGroups[key].push(p);
                });

                const sortedKeys = Object.keys(monthlyGroups).sort();

                sortedKeys.forEach(key => {
                    const group = monthlyGroups[key];
                    const groupActualSum = group.reduce((acc, p) => acc + p.actual, 0);
                    const groupTargetSum = group.reduce((acc, p) => acc + p.target, 0);
                    const groupActual = parseFloat((groupActualSum / group.length).toFixed(2));
                    const groupTarget = parseFloat((groupTargetSum / group.length).toFixed(2));

                    chartActuals.push(groupActual);
                    chartTargets.push(groupTarget);

                    const firstD = group[0].date;
                    const labelStr = firstD.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                    chartLabels.push(labelStr);
                });
            } else {
                chartLabels = dailyPoints.map(p => window.Utils.formatDate(p.date));
                chartActuals = dailyPoints.map(p => p.actual);
                chartTargets = dailyPoints.map(p => p.target);
            }
        }

        const maxVal = Math.max(...chartActuals, ...chartTargets, range === 1 ? (window.dailyFocusHoursTarget || 0) : 0);
        const yMax = maxVal > 0 ? Math.ceil(maxVal * 1.25) : 5;
        const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
        const textColor = isDark ? '#94a3b8' : '#64748b';

        Chart.defaults.color = textColor;
        Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui';

        let actualLabelName = "1 Day Focus";
        let targetLabelName = "1 Day Target";
        if (range === 1) {
            const dayOffset = window.timerAnalyticsDayOffset || 0;
            if (dayOffset === 0) {
                actualLabelName = "Today's Focus";
                targetLabelName = "Today's Target";
            } else if (dayOffset === -1) {
                actualLabelName = "Yesterday's Focus";
                targetLabelName = "Yesterday's Target";
            } else {
                const d = new Date();
                d.setDate(d.getDate() + dayOffset);
                const dStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                actualLabelName = `${dStr} Focus`;
                targetLabelName = `${dStr} Target`;
            }
        } else {
            actualLabelName = grouping === 'daily'
                ? 'Actual Focus Hours'
                : (grouping === 'weekly'
                    ? 'Weekly Focus Hours (Avg/Day)'
                    : 'Monthly Focus Hours (Avg/Day)');
            targetLabelName = grouping === 'daily'
                ? 'Target Focus Hours'
                : (grouping === 'weekly'
                    ? 'Weekly Target Hours (Avg/Day)'
                    : 'Monthly Target Hours (Avg/Day)');
        }

        if (ctx1) {
            const datasets1 = buildDatasetsForCanvas(ctx1, style, grouping, range, chartActuals, chartTargets, actualLabelName, targetLabelName, isDark, sumActual, dayTarget);
            updateOrCreateCanvasChart(ctx1, 'timerAnalyticsChartInstance', style, chartLabels, datasets1, yMax, isDark, isLiveUpdate, range, sumActual, dayTarget);
        }

        if (ctx2) {
            const datasets2 = buildDatasetsForCanvas(ctx2, style, grouping, range, chartActuals, chartTargets, actualLabelName, targetLabelName, isDark, sumActual, dayTarget);
            updateOrCreateCanvasChart(ctx2, 'spectraFocusAnalyticsChartInstance', style, chartLabels, datasets2, yMax, isDark, isLiveUpdate, range, sumActual, dayTarget);
        }

        if (window.renderSpectraFocusHeatmap) {
            window.renderSpectraFocusHeatmap();
        }
    };

    /* ==========================================================================
       Focus Heatmap visualization has been extracted to:
       js/features/analytics/heatmap.js (HeatmapAnalytics)
       ========================================================================== */

    window.TimerService = {
        init: function () {
            // Setup DOM event listeners

            // 1. Subject change listener
            document.addEventListener('change', (e) => {
                if (e.target && e.target.id === 'timer-subject-select') {
                    if (AppState.activeTimerState) {
                        AppState.activeTimerState.selectedSubject = e.target.value;
                        FirebaseService.saveTimerToCloud();
                        updateSubjectTargetUI();
                    }
                }
            });

            // 2. Fullscreen change listeners
            document.addEventListener('fullscreenchange', () => {
                if (!document.fullscreenElement && window._timerFsActive) {
                    _exitTimerFsCleanup();
                }
            });
            document.addEventListener('webkitfullscreenchange', () => {
                if (!document.webkitFullscreenElement && window._timerFsActive) {
                    _exitTimerFsCleanup();
                }
            });

            // 3. Click listener for timer analytics and modal controls
            document.addEventListener('click', (e) => {
                const rangeBtn = e.target.closest('#tar-btn-1, #tar-btn-7, #tar-btn-30, #tar-btn-180, [data-timer-range]');
                if (rangeBtn) {
                    const days = rangeBtn.id === 'tar-btn-1' ? 1 : (rangeBtn.id === 'tar-btn-7' ? 7 : (rangeBtn.id === 'tar-btn-30' ? 30 : (rangeBtn.id === 'tar-btn-180' ? 180 : Number(rangeBtn.getAttribute('data-timer-range')))));
                    if (!isNaN(days)) window.setTimerAnalyticsRange(days);
                    return;
                }
                const groupBtn = e.target.closest('#tag-btn-daily, #tag-btn-weekly, #tag-btn-monthly, [data-timer-group]');
                if (groupBtn) {
                    const g = groupBtn.id === 'tag-btn-daily' ? 'daily' : (groupBtn.id === 'tag-btn-weekly' ? 'weekly' : (groupBtn.id === 'tag-btn-monthly' ? 'monthly' : groupBtn.getAttribute('data-timer-group')));
                    if (g) window.setTimerAnalyticsGrouping(g);
                    return;
                }
                const styleBtn = e.target.closest('#tas-btn-combo, #tas-btn-bar, #tas-btn-line, [data-timer-style]');
                if (styleBtn) {
                    const s = styleBtn.id === 'tas-btn-combo' ? 'combo' : (styleBtn.id === 'tas-btn-bar' ? 'bar' : (styleBtn.id === 'tas-btn-line' ? 'line' : styleBtn.getAttribute('data-timer-style')));
                    if (s) window.setTimerAnalyticsChartStyle(s);
                    return;
                }
                if (e.target.closest('#day-prev-btn')) {
                    window.navigateTimerAnalyticsDay(-1);
                    return;
                }
                if (e.target.closest('#day-next-btn')) {
                    window.navigateTimerAnalyticsDay(1);
                    return;
                }
                if (e.target.closest('#day-label')) {
                    window.resetTimerAnalyticsDayOffset();
                    return;
                }
                if (e.target.closest('#ctm-btn-submit, [data-custom-timer-submit]')) {
                    window.submitCustomTimer();
                    return;
                }
                if (e.target.closest('#atsm-tab-hours, [data-atsm-tab="hours"]')) {
                    window.switchAtsmTab('hours');
                    return;
                }
                if (e.target.closest('#atsm-tab-range, [data-atsm-tab="range"]')) {
                    window.switchAtsmTab('range');
                    return;
                }
                if (e.target.closest('#atsm-btn-submit, [data-atsm-submit]')) {
                    window.submitManualTimerSession();
                    return;
                }
                if (e.target.closest('#etsm-btn-submit, [data-etsm-submit]')) {
                    window.submitEditTimerSession();
                    return;
                }
            });

            // 4. Target input listener
            document.addEventListener('input', (e) => {
                if (e.target && e.target.id === 'timer-target-input') {
                    window.updateDailyFocusHoursTarget(e.target.value);
                }
            });
            document.addEventListener('change', (e) => {
                if (e.target && e.target.id === 'timer-target-input') {
                    window.updateDailyFocusHoursTarget(e.target.value);
                }
            });

            // Restore/synchronize state immediately
            window.TimerService.restore();
        },

        saveActiveStateToStore: function () {
            saveActiveStateToStore();
        },

        loadActiveStateFromStore: function (mode) {
            loadActiveStateFromStore(mode);
        },

        start: function () {
            if (AppState.activeTimerState && !AppState.activeTimerState.isRunning) {
                // Check if any other mode is running
                if (AppState.activeTimerState.timerStates) {
                    const runningMode = Object.keys(AppState.activeTimerState.timerStates).find(mode => {
                        return mode !== AppState.activeTimerState.mode && AppState.activeTimerState.timerStates[mode] && AppState.activeTimerState.timerStates[mode].isRunning;
                    });
                    if (runningMode) {
                        const friendlyName = runningMode === 'stopwatch' ? 'Stopwatch' : (runningMode === 'alarm' ? 'Alarm Range' : 'Timer');
                        window.openTimerWarningModal(`Another session (${friendlyName}) is already active. Please pause it first.`);
                        return;
                    }
                }

                const nowMs = (typeof window.getServerTime === 'function') ? window.getServerTime() : Date.now();
                AppState.activeTimerState.isRunning = true;
                AppState.activeTimerState.startTime = nowMs;
                AppState.activeTimerState.updatedAt = nowMs;
                window.activeTimerState = AppState.activeTimerState;
                saveActiveStateToStore();
                if (window.FirebaseService) {
                    window.FirebaseService.saveTimerToCloud();
                }
                window.TimerService.restore();
            }
        },

        pause: function () {
            if (AppState.activeTimerState) {
                const nowMs = (typeof window.getServerTime === 'function') ? window.getServerTime() : Date.now();
                AppState.activeTimerState.updatedAt = nowMs;

                if (AppState.activeTimerState.isRunning) {
                    AppState.activeTimerState.isRunning = false;
                    if (AppState.activeTimerState.startTime) {
                        AppState.activeTimerState.elapsedBeforeStart += (nowMs - parseStartTime(AppState.activeTimerState.startTime));
                    }
                    AppState.activeTimerState.startTime = null;
                }

                if (AppState.activeTimerState.timerStates) {
                    Object.keys(AppState.activeTimerState.timerStates).forEach(mode => {
                        const store = AppState.activeTimerState.timerStates[mode];
                        if (store && store.isRunning) {
                            store.isRunning = false;
                            if (store.startTime) {
                                store.elapsedBeforeStart += (nowMs - parseStartTime(store.startTime));
                            }
                            store.startTime = null;
                            store.updatedAt = nowMs;
                        }
                    });
                }

                window.activeTimerState = AppState.activeTimerState;
                saveActiveStateToStore();
                if (window.FirebaseService) {
                    window.FirebaseService.saveTimerToCloud();
                }
                window.TimerService.restore();
            }
        },

        resume: function () {
            window.TimerService.start();
        },

        stop: function () {
            window.TimerService.pause();
        },

        reset: function () {
            if (AppState.activeTimerState) {
                const nowMs = (typeof window.getServerTime === 'function') ? window.getServerTime() : Date.now();
                AppState.activeTimerState.updatedAt = nowMs;

                let targetMode = AppState.activeTimerState.mode || 'stopwatch';
                if (AppState.activeTimerState.timerStates) {
                    const runningMode = Object.keys(AppState.activeTimerState.timerStates).find(
                        m => AppState.activeTimerState.timerStates[m] && AppState.activeTimerState.timerStates[m].isRunning
                    );
                    if (runningMode) {
                        targetMode = runningMode;
                    }
                }

                if (targetMode === AppState.activeTimerState.mode) {
                    AppState.activeTimerState.isRunning = false;
                    AppState.activeTimerState.startTime = null;
                    AppState.activeTimerState.elapsedBeforeStart = 0;
                }

                if (AppState.activeTimerState.timerStates && AppState.activeTimerState.timerStates[targetMode]) {
                    const store = AppState.activeTimerState.timerStates[targetMode];
                    store.isRunning = false;
                    store.startTime = null;
                    store.elapsedBeforeStart = 0;
                    store.updatedAt = nowMs;
                    if (targetMode === 'timer') {
                        store.targetDuration = 25 * 60;
                        if (targetMode === AppState.activeTimerState.mode) {
                            AppState.activeTimerState.targetDuration = 25 * 60;
                        }
                    } else if (targetMode === 'alarm') {
                        store.targetDuration = 0;
                        store.alarmStart = '';
                        store.alarmEnd = '';
                        store.alarmUseCurrent = true;
                        if (targetMode === AppState.activeTimerState.mode) {
                            AppState.activeTimerState.targetDuration = 0;
                        }
                    } else {
                        store.targetDuration = 0;
                        if (targetMode === AppState.activeTimerState.mode) {
                            AppState.activeTimerState.targetDuration = 0;
                        }
                    }
                }

                window.activeTimerState = AppState.activeTimerState;
                saveActiveStateToStore();
                if (window.FirebaseService) {
                    window.FirebaseService.saveTimerToCloud();
                }
                window.TimerService.restore();
            }
        },

        skip: function () {
            console.warn("TimerService: skip not implemented (no break/skip sessions exist in current codebase).");
        },

        saveSession: function () {
            window.saveTimerSession();
        },

        restore: function () {
            window.syncTimerStateFromCloud();
        },

        updateDisplay: function () {
            tickTimer();
            if (typeof window.renderTimerPage === 'function') {
                window.renderTimerPage();
            }
            if (typeof window.updatePresetButtonsUI === 'function') {
                window.updatePresetButtonsUI();
            }
            if (typeof window.updateSubjectTargetUI === 'function') {
                window.updateSubjectTargetUI();
            }
            // Real-time synchronization for Focus Analytics (both Modal & Analytics page)
            if (typeof window.updateTimerAnalyticsControls === 'function') {
                window.updateTimerAnalyticsControls();
            }
            if (typeof window.renderTimerAnalyticsChart === 'function') {
                window.renderTimerAnalyticsChart(true);
            }

            const spectraPage = document.getElementById('page-spectra-analytics');
            if (spectraPage && !spectraPage.classList.contains('hidden')) {
                if (typeof window.renderSpectraFocusHeatmap === 'function') {
                    window.renderSpectraFocusHeatmap();
                }
                if (typeof window.renderSpectraCommitmentsChart === 'function') {
                    window.renderSpectraCommitmentsChart();
                }
            }
        },

        destroy: function () {
            if (AppState.timerInterval) {
                clearInterval(AppState.timerInterval);
                AppState.timerInterval = null;
            }
        }
    };
})();
