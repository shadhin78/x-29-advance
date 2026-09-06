/**
 * X-29 Module: features/schedule/scheduleSlot.js
 * Live active schedule routine slot engine & live header clock display.
 */
(function (global) {
    'use strict';

let _scheduleIntervalId = null;

/**
 * Updates the desktop and mobile header clock widgets with live seconds.
 */
function updateHeaderLiveClock() {
    const now = new Date();
    let hrs = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const secs = now.getSeconds().toString().padStart(2, '0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;
    const timeString = `${hrs}:${mins}:${secs} ${ampm}`;

    const clockEl = document.getElementById('header-clock-stats');
    if (clockEl) {
        clockEl.innerHTML = `
            <div class="flex items-center space-x-2 md:space-x-3">
                <div class="p-2 md:p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg md:rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm text-blue-600 dark:text-blue-450 flex items-center justify-center">
                    <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div class="text-left">
                    <span class="block text-[9px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">Current Time</span>
                    <span class="text-blue-600 dark:text-blue-450 font-black text-sm md:text-base tracking-tight font-mono">${timeString}</span>
                </div>
            </div>
        `;
    }

    const mobileClockEl = document.getElementById('mobile-header-clock');
    if (mobileClockEl) {
        mobileClockEl.innerHTML = `
            <div class="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 shadow-sm text-blue-600 dark:text-blue-450">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span class="font-black text-[11px] tracking-tight font-mono">${timeString}</span>
            </div>
        `;
    }
}

/**
 * Updates the active routine slot display on Daily Schedule page and Dashboard.
 * Accurately reads Set 1 / Set 2 blocks based on activeRoutineSet.
 */
function updateActiveScheduleSlot() {
    const activeContainer = document.getElementById('schedule-active-now-container');
    const mobileContainer = document.getElementById('schedule-active-now-mobile');
    const dashContainer = document.getElementById('dashboard-active-now-container');
    const dashTimerContainer = document.getElementById('dashboard-focus-timer-container');

    // Check active routine set for active block
    const currentSet = (typeof window !== 'undefined' && window.activeRoutineSet) ? window.activeRoutineSet : 1;
    const blocksSource = (typeof window !== 'undefined')
        ? (currentSet === 2 ? (window.scheduleBlocks2 || (window.AppState && window.AppState.scheduleBlocks2) || []) : (window.scheduleBlocks || (window.AppState && window.AppState.scheduleBlocks) || []))
        : [];
    const dailyBlocks = blocksSource.filter(b => b && b.day === 'Daily');

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const currentSec = now.getSeconds();

    const timeToMin = (t) => {
        if (typeof window !== 'undefined' && window.Utils && typeof window.Utils.timeToMinutes === 'function') {
            return window.Utils.timeToMinutes(t);
        }
        if (!t || typeof t !== 'string') return 0;
        const [h, m] = t.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    };

    const format12h = (t) => {
        if (typeof window !== 'undefined' && window.Utils && typeof window.Utils.formatTime12h === 'function') {
            return window.Utils.formatTime12h(t);
        }
        if (!t) return '';
        const [hStr, mStr] = t.split(':');
        let h = parseInt(hStr, 10);
        const m = mStr || '00';
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}:${m} ${ampm}`;
    };

    let activeBlock = null;
    dailyBlocks.forEach(b => {
        const startMin = timeToMin(b.startTime);
        const endMin = timeToMin(b.endTime);
        if (startMin <= currentMin && currentMin < endMin) {
            activeBlock = b;
        }
    });

    // Build desktop Active Now HTML (sidebar - compact)
    let desktopHtml = '';
    // Build mobile Active Now HTML (top of page - larger, more prominent)
    let mobileHtml = '';
    // Build dashboard Active Now HTML (compact, clickable navigation)
    let dashHtml = '';
    // Build dashboard Focus Timer HTML
    let dashTimerHtml = '';

    let timerElapsedMs = 0;
    let isTimerActive = false;
    let isTimerRunning = false;
    let timerSeconds = 0;
    let timerProgressPercent = 0;
    let timerSubject = 'General Study';
    let timerModeLabel = 'TIMER';
    let timerStatusText = 'READY';
    let timerColor = '#2563eb';

    if (typeof window !== 'undefined' && window.activeTimerState) {
        let displayState = window.activeTimerState;
        let displayMode = window.activeTimerState.mode || 'stopwatch';

        if (window.activeTimerState.timerStates) {
            const runningMode = Object.keys(window.activeTimerState.timerStates).find(
                m => window.activeTimerState.timerStates[m].isRunning
            );
            if (runningMode) {
                displayMode = runningMode;
                displayState = window.activeTimerState.timerStates[runningMode];
            }
        }

        isTimerRunning = displayState.isRunning || false;

        let elapsedMs = displayState.elapsedBeforeStart || 0;
        if (displayState.isRunning && displayState.startTime) {
            let startTimeMs = displayState.startTime;
            if (startTimeMs && typeof startTimeMs.toDate === 'function') {
                startTimeMs = startTimeMs.toDate().getTime();
            } else if (startTimeMs instanceof Date) {
                startTimeMs = startTimeMs.getTime();
            } else if (typeof startTimeMs === 'string') {
                startTimeMs = new Date(startTimeMs).getTime();
            } else {
                startTimeMs = Number(startTimeMs);
            }
            const serverTime = (typeof window.getServerTime === 'function') ? window.getServerTime() : Date.now();
            elapsedMs += (serverTime - startTimeMs);
        }
        timerElapsedMs = elapsedMs;
        isTimerActive = displayState.isRunning || elapsedMs > 0;

        timerSubject = displayState.selectedSubject || 'General Study';
        timerModeLabel = displayMode.toUpperCase();
        timerColor = window.getSubjectColor ? window.getSubjectColor(timerSubject) : '#2563eb';
        timerStatusText = displayState.isRunning ? 'FOCUSING' : (elapsedMs > 0 ? 'PAUSED' : 'READY');

        if (displayMode === 'stopwatch') {
            timerSeconds = Math.floor(elapsedMs / 1000);
            timerProgressPercent = Math.round(((timerSeconds % 60) / 60) * 100);
        } else {
            const targetMs = (displayState.targetDuration || 0) * 1000;
            const remainingMs = Math.max(0, targetMs - elapsedMs);
            timerSeconds = displayState.isRunning ? Math.ceil(remainingMs / 1000) : Math.floor(remainingMs / 1000);
            const target = displayState.targetDuration || 1;
            const elapsedSec = Math.floor(elapsedMs / 1000);
            timerProgressPercent = Math.min(100, Math.round((elapsedSec / target) * 100));
        }
    }

    if (activeBlock) {
        const startMin = timeToMin(activeBlock.startTime);
        const endMin = timeToMin(activeBlock.endTime);
        const durationMins = endMin - startMin;
        const elapsedMins = currentMin - startMin;
        const progressPercent = durationMins > 0 ? Math.round((elapsedMins / durationMins) * 100) : 0;

        // Calculate remaining time in HH:MM:SS
        const totalRemainingSeconds = (endMin - currentMin) * 60 - currentSec;
        const remHrs = Math.floor(totalRemainingSeconds / 3600);
        const remMins = Math.floor((totalRemainingSeconds % 3600) / 60);
        const remSecs = totalRemainingSeconds % 60;
        const countdownStr = `${String(remHrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(remSecs < 0 ? 0 : remSecs).padStart(2, '0')}`;

        const timeRangeStr = `${format12h(activeBlock.startTime)} - ${format12h(activeBlock.endTime)}`;
        const category = activeBlock.track || activeBlock.program || 'Routine';
        const blockColor = activeBlock.color || '#6366f1';

        // Desktop version (sidebar)
        desktopHtml = `
            <div class="flex items-center justify-between mb-1.5 select-none">
                <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Active Now</h3>
                <span class="flex h-2 w-2 relative">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
            </div>
            
            <div class="rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all hover:shadow-md"
                 style="min-height: 180px; background-color: ${blockColor}cc; border: 1.5px solid ${blockColor};"
                 onclick="window.openEditScheduleModal('${activeBlock.id}')">
                
                <div class="flex flex-col gap-1.5 min-w-0">
                    <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded inline-block self-start leading-none max-w-full truncate"
                          style="border: 1px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.12);">${category}</span>
                    <h4 class="text-base font-bold text-white leading-snug tracking-tight truncate mt-0.5" title="${activeBlock.task}">${activeBlock.task}</h4>
                </div>
                
                <div class="mt-2 space-y-2">
                    <div class="text-center">
                        <span class="text-xl font-black font-mono tracking-wider text-white tabular-nums" style="text-shadow: 0 1px 4px rgba(0,0,0,0.2);">${countdownStr}</span>
                    </div>
                    <div class="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
                        <div class="h-full rounded-full bg-white/60 transition-all duration-500" style="width: ${progressPercent}%;"></div>
                    </div>
                    <div class="flex items-center justify-between gap-2 shrink-0">
                        <span class="text-[10px] font-bold font-mono tracking-tight" style="color: rgba(255,255,255,0.75);">${timeRangeStr}</span>
                    </div>
                </div>
            </div>
        `;

        // Mobile version (top of page - bigger, horizontal)
        mobileHtml = `
            <div class="rounded-2xl overflow-hidden border shadow-lg" style="border-color: ${blockColor}55; background: linear-gradient(135deg, ${blockColor}dd, ${blockColor}bb);">
                <div class="p-4 pb-3">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="flex h-2.5 w-2.5 relative">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <h3 class="text-xs font-black uppercase tracking-widest text-white/90">Active Now</h3>
                        </div>
                        <span class="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
                              style="border: 1px solid rgba(255,255,255,0.25); color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.1);">${category}</span>
                    </div>
                    
                    <h4 class="text-lg font-bold text-white leading-snug tracking-tight mb-2 truncate" 
                        title="${activeBlock.task}"
                        onclick="window.openEditScheduleModal('${activeBlock.id}')"
                        style="cursor: pointer;">${activeBlock.task}</h4>
                    
                    <div class="flex items-center justify-between mb-2.5">
                        <span class="text-2xl font-black font-mono tracking-wider text-white tabular-nums" style="text-shadow: 0 1px 6px rgba(0,0,0,0.25);">${countdownStr}</span>
                        <span class="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">remaining</span>
                    </div>
                    
                    <div class="w-full bg-white/15 rounded-full h-2 mb-2.5 overflow-hidden">
                        <div class="h-full rounded-full bg-white/60 transition-all duration-500" style="width: ${progressPercent}%;"></div>
                    </div>
                    
                    <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-bold font-mono tracking-tight" style="color: rgba(255,255,255,0.8);">${timeRangeStr}</span>
                    </div>
                </div>
            </div>
        `;

        // Dashboard version (clickable shortcut to Daily Schedule)
        dashHtml = `
            <div class="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-sm flex flex-col overflow-hidden h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]">
                <div class="p-4 pb-2 border-b border-slate-100 dark:border-slate-700 select-none flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Active Now</h3>
                    </div>
                    <div class="flex items-center space-x-2 shrink-0">
                        <span class="flex h-2 w-2 relative">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <button onclick="event.stopPropagation(); window.switchPage('schedule')"
                            class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
                            title="Go to Daily Schedule" aria-label="Go to Daily Schedule">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="flex-1 p-4 relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all active:scale-98 rounded-b-[22px] rounded-t-none"
                     style="background-color: ${blockColor}cc;"
                     onclick="window.switchPage('schedule')">
                    
                    <div class="flex flex-col gap-1.5 min-w-0">
                        <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded inline-block self-start leading-none max-w-full truncate"
                              style="border: 1px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.12);">${category}</span>
                        <h4 class="text-sm font-black text-white leading-snug tracking-tight truncate mt-1" title="${activeBlock.task}">${activeBlock.task}</h4>
                    </div>
                    
                    <div class="mt-2 space-y-2">
                        <div class="text-center">
                            <span class="text-2xl font-black font-mono tracking-widest text-white tabular-nums" style="text-shadow: 0 2px 8px rgba(0,0,0,0.35);">${countdownStr}</span>
                        </div>
                        <div class="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                            <div class="h-full rounded-full bg-white/70 transition-all duration-500" style="width: ${progressPercent}%;"></div>
                        </div>
                        <div class="flex items-center justify-between gap-2 shrink-0 font-sans mt-1">
                            <span class="text-[11px] font-bold font-mono tracking-tight text-white/85">${timeRangeStr}</span>
                            <span class="text-[9px] font-black uppercase text-white/95 tracking-wider bg-white/15 px-2 py-0.5 rounded flex items-center gap-0.5">Go to Schedule &rarr;</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Desktop idle
        desktopHtml = `
            <div class="flex items-center justify-between mb-1.5 select-none">
                <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Active Now</h3>
                <span class="flex h-2 w-2 relative">
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-slate-350 dark:bg-slate-650"></span>
                </span>
            </div>
            
            <div class="bg-slate-50/40 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all select-none"
                 style="min-height: 180px;">
                <div class="flex items-center gap-2">
                    <span class="text-base">☀️</span>
                    <h4 class="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Free Time</h4>
                </div>
                <p class="text-[9px] opacity-75 text-slate-440 dark:text-slate-500 mt-2">No active routine slot right now.</p>
            </div>
        `;

        // Mobile idle
        mobileHtml = `
            <div class="bg-slate-50 dark:bg-slate-800/80 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between transition-all select-none">
                <div class="flex items-center gap-2.5">
                    <span class="flex h-2.5 w-2.5 relative">
                        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-350 dark:bg-slate-650"></span>
                    </span>
                    <h3 class="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Active Now</h3>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-base">☀️</span>
                    <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Free Time</span>
                </div>
            </div>
        `;

        // Dashboard idle
        dashHtml = `
            <div class="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-sm flex flex-col overflow-hidden h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]">
                <div class="p-4 pb-2 border-b border-slate-100 dark:border-slate-700 select-none flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Active Now</h3>
                    </div>
                    <div class="flex items-center space-x-2 shrink-0">
                        <span class="flex h-2 w-2 relative">
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-slate-350 dark:bg-slate-650"></span>
                        </span>
                        <button onclick="event.stopPropagation(); window.switchPage('schedule')"
                            class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
                            title="Go to Daily Schedule" aria-label="Go to Daily Schedule">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="bg-slate-50/40 dark:bg-slate-900/20 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/40 select-none active:scale-98 flex-1 rounded-b-[22px] rounded-t-none p-5"
                     onclick="window.switchPage('schedule')">
                    <div class="flex items-center gap-2.5">
                        <span class="text-2xl">☀️</span>
                        <h4 class="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Free Time</h4>
                    </div>
                    <p class="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2.5">No active routine slot right now.<br>Go to Schedule &rarr;</p>
                </div>
            </div>
        `;
    }

    // Build Focus Timer HTML independently
    if (isTimerActive) {
        const hrs = Math.floor(timerSeconds / 3600);
        const mins = Math.floor((timerSeconds % 3600) / 60);
        const secs = timerSeconds % 60;
        const clockText = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const statusDot = isTimerRunning ? `
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        ` : `
            <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        `;

        dashTimerHtml = `
            <div class="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-sm flex flex-col overflow-hidden h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]">
                <div class="p-4 pb-2 border-b border-slate-100 dark:border-slate-700 select-none flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Focus Timer</h3>
                    </div>
                    <div class="flex items-center space-x-2 shrink-0">
                        <span class="flex h-2 w-2 relative">
                            ${statusDot}
                        </span>
                        <button onclick="event.stopPropagation(); window.switchPage('timer')"
                            class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
                            title="Go to Focus Timer" aria-label="Go to Focus Timer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div id="dash-timer-card-body" class="flex-1 p-4 relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all active:scale-98 rounded-b-[22px] rounded-t-none"
                     style="background-color: ${timerColor}cc;"
                     onclick="window.switchPage('timer')">
                    
                    <div class="flex flex-col gap-1.5 min-w-0">
                        <div class="flex justify-between items-center gap-2">
                            <span id="dash-timer-mode-label" class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded inline-block self-start leading-none max-w-full truncate"
                                  style="border: 1px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.12);">${timerModeLabel}</span>
                            <span id="dash-timer-status-text" class="text-[9px] font-black uppercase text-white/95 tracking-wider bg-white/15 px-2 py-0.5 rounded flex items-center gap-0.5">${timerStatusText}</span>
                        </div>
                        <h4 id="dash-timer-subject-text" class="text-sm font-black text-white leading-snug tracking-tight truncate mt-1" title="${timerSubject}">${timerSubject}</h4>
                    </div>
                    
                    <div class="mt-2 space-y-2">
                        <div class="text-center">
                            <span id="dash-timer-clock-text" class="text-2xl font-black font-mono tracking-widest text-white tabular-nums" style="text-shadow: 0 2px 8px rgba(0,0,0,0.35);">${clockText}</span>
                        </div>
                        <div class="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                            <div id="dash-timer-progress-bar" class="h-full rounded-full bg-white/70 transition-all duration-500" style="width: ${timerProgressPercent}%;"></div>
                        </div>
                        <div class="flex items-center justify-between gap-2 shrink-0 mt-1">
                            <div class="flex items-center gap-1.5">
                                <button id="dash-timer-btn-toggle" onclick="event.stopPropagation(); window.toggleTimerClick();" 
                                        class="px-2.5 py-1 bg-white/20 hover:bg-white/35 text-white font-black text-[9px] uppercase tracking-widest rounded border border-white/25 active:scale-95 transition-all">
                                    ${isTimerRunning ? 'PAUSE' : 'START'}
                                </button>
                                <button onclick="event.stopPropagation(); window.resetTimerClick();" 
                                        class="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white/90 font-black text-[9px] uppercase tracking-widest rounded border border-white/10 active:scale-95 transition-all">
                                    RESET
                                </button>
                            </div>
                            <span class="text-[8px] font-black uppercase text-white/95 tracking-wider bg-white/15 px-2 py-0.5 rounded flex items-center gap-0.5">Open &rarr;</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Calculate Today's Focus duration from timer logs
        const timerLogsList = (typeof window !== 'undefined' && window.AppState && window.AppState.timerLogs) 
            ? window.AppState.timerLogs 
            : ((typeof window !== 'undefined' && window.timerLogs) ? window.timerLogs : []);
        const todayDateObj = new Date();
        todayDateObj.setHours(0, 0, 0, 0);
        const todayStartTimestamp = todayDateObj.getTime();

        let todayFocusSeconds = 0;
        if (Array.isArray(timerLogsList)) {
            timerLogsList.forEach(log => {
                if (!log || !log.date) return;
                const logDateMs = new Date(log.date).getTime();
                const dur = parseInt(log.duration || 0, 10);
                if (!isNaN(logDateMs) && logDateMs >= todayStartTimestamp && !isNaN(dur)) {
                    todayFocusSeconds += dur;
                }
            });
        }

        const tHrs = Math.floor(todayFocusSeconds / 3600);
        const tMins = Math.floor((todayFocusSeconds % 3600) / 60);
        const tSecs = todayFocusSeconds % 60;
        const todayFocusClockText = `${String(tHrs).padStart(2, '0')}:${String(tMins).padStart(2, '0')}:${String(tSecs).padStart(2, '0')}`;

        // Empty Focus Timer card displaying Today's Focus (clickable navigation to timer page)
        dashTimerHtml = `
            <div class="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-sm flex flex-col overflow-hidden h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]">
                <div class="p-4 pb-2 border-b border-slate-100 dark:border-slate-700 select-none flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Focus Timer</h3>
                    </div>
                    <div class="flex items-center space-x-2 shrink-0">
                        <span class="flex h-2 w-2 relative">
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-slate-350 dark:bg-slate-650"></span>
                        </span>
                        <button onclick="event.stopPropagation(); window.switchPage('timer')"
                            class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
                            title="Go to Focus Timer" aria-label="Go to Focus Timer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="bg-slate-50/40 dark:bg-slate-900/20 flex flex-col items-center justify-between text-center transition-all cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/40 select-none active:scale-98 flex-1 rounded-b-[22px] rounded-t-none p-4"
                     onclick="window.switchPage('timer')">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">⏱️</span>
                        <h4 class="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Focus Timer</h4>
                    </div>
                    
                    <div class="w-full bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl py-2 px-3 shadow-xs flex flex-col items-center justify-center">
                        <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Today's Focus</span>
                        <span id="dash-timer-today-focus" class="text-xl font-black font-mono tracking-wider text-slate-800 dark:text-white tabular-nums mt-0.5">${todayFocusClockText}</span>
                    </div>

                    <p class="text-[11px] font-bold text-slate-400 dark:text-slate-500">No active timer session.<br>Tap to start focusing &rarr;</p>
                </div>
            </div>
        `;
    }

    if (activeContainer) activeContainer.innerHTML = desktopHtml;
    if (mobileContainer) mobileContainer.innerHTML = mobileHtml;
    if (dashContainer) dashContainer.innerHTML = dashHtml;
    if (dashTimerContainer) dashTimerContainer.innerHTML = dashTimerHtml;
}

/**
 * Starts the live 1-second ticker for header clock and active schedule slot.
 *
 * @param {number} [intervalMs=1000]
 */
function startScheduleSlotInterval(intervalMs = 1000) {
    if (_scheduleIntervalId) {
        clearInterval(_scheduleIntervalId);
    }
    _scheduleIntervalId = setInterval(() => {
        updateHeaderLiveClock();
        updateActiveScheduleSlot();
        if (typeof window !== 'undefined' && typeof window.updateAlarmStartText === 'function') {
            window.updateAlarmStartText();
        }
    }, intervalMs);

    // Run once immediately
    updateHeaderLiveClock();
    updateActiveScheduleSlot();
}

/**
 * Stops the live ticker.
 */
function stopScheduleSlotInterval() {
    if (_scheduleIntervalId) {
        clearInterval(_scheduleIntervalId);
        _scheduleIntervalId = null;
    }
}

// Window attachments for backward compatibility

    // Attach to global scope
    global.updateActiveScheduleSlot = updateActiveScheduleSlot;
    global.updateHeaderLiveClock = updateHeaderLiveClock;
    global.startScheduleSlotInterval = startScheduleSlotInterval;
    global.stopScheduleSlotInterval = stopScheduleSlotInterval;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { updateActiveScheduleSlot, updateHeaderLiveClock, startScheduleSlotInterval, stopScheduleSlotInterval };
    }

    // Start live clock and slot ticker immediately
    startScheduleSlotInterval(1000);
})(typeof window !== 'undefined' ? window : globalThis);
