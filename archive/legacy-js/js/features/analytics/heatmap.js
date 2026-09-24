/**
 * X-29 Feature Module: Focus Heatmap & Day Drill-down (heatmap.js)
 * Activity matrix rendering, color-tier visualization, and day session drill-downs.
 *
 * Responsibilities:
 * 1. Timeframe selection (30, 90, 180, 365 days).
 * 2. Full-scale GitHub box focus heatmap (#spectra-focus-heatmap-grid).
 * 3. Compact 2-month dashboard activity card (#dashboard-focus-heatmap-grid).
 * 4. Heatmap Tooltips with real-time cursor tracking (#spectra-focus-heatmap-tooltip).
 * 5. Day drill-down side note panel and detailed session modal (#spectra-heatmap-day-modal).
 * 6. Yearly daily action consistency heatmap (#yearly-daily-grid).
 *
 * Strict Read-Only state consumer: Reads AppState.timerLogs, AppState.activeTimerState, AppState.tasks.
 */

(function (global) {
    'use strict';

    if (global.spectraHeatmapRange === undefined) {
        global.spectraHeatmapRange = 365;
    }

    /**
     * Helper to format decimal hours into "Xh Ym" or "Xh" or "Ym".
     */
    function formatHoursToHrMin(hoursDecimal) {
        const totalMin = Math.round((hoursDecimal || 0) * 60);
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    }

    /**
     * Helper to safely parse timer start timestamps.
     */
    function parseStartTime(startTime) {
        if (!startTime) return 0;
        if (typeof startTime === 'number') return startTime;
        const parsed = new Date(startTime).getTime();
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Updates range selector UI button states and triggers heatmap redraw.
     *
     * @param {number} days
     */
    function setSpectraHeatmapRangeUI(days) {
        const range = days || global.spectraHeatmapRange || 365;
        global.spectraHeatmapRange = range;
        if (typeof document === 'undefined') return;

        const btn30 = document.getElementById('spectra-hm-btn-30');
        const btn90 = document.getElementById('spectra-hm-btn-90');
        const btn180 = document.getElementById('spectra-hm-btn-180');
        const btn365 = document.getElementById('spectra-hm-btn-365');

        const activeClass = "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all bg-indigo-600 text-white shadow shadow-indigo-500/20";
        const inactiveClass = "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200";

        if (btn30) btn30.className = range === 30 ? activeClass : inactiveClass;
        if (btn90) btn90.className = range === 90 ? activeClass : inactiveClass;
        if (btn180) btn180.className = range === 180 ? activeClass : inactiveClass;
        if (btn365) btn365.className = range === 365 ? activeClass : inactiveClass;

        renderSpectraFocusHeatmap();
    }

    /**
     * Sets heatmap timeframe range and persists preference.
     *
     * @param {number} days
     */
    function setSpectraHeatmapRange(days) {
        global.spectraHeatmapRange = days;
        const AppStateRef = global.AppState || (typeof window !== 'undefined' ? window.AppState : null);
        if (AppStateRef) {
            AppStateRef.spectraHeatmapRange = days;
            AppStateRef._lastFilterChangeTime = Date.now();
        }

        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('x29_spectraHeatmapRange', String(days));
            }
        } catch (e) {}

        setSpectraHeatmapRangeUI(days);

        if (typeof global.debouncedSaveTimerPreferences === 'function') {
            global.debouncedSaveTimerPreferences();
        }
    }

    /**
     * Renders Focus Heatmap (both Analytics full matrix and Dashboard compact card).
     */
    function renderSpectraFocusHeatmap() {
        if (typeof document === 'undefined') return;
        const gridEl = document.getElementById('spectra-focus-heatmap-grid');
        const dashGridEl = document.getElementById('dashboard-focus-heatmap-grid');
        if (!gridEl && !dashGridEl) return;

        const AppStateRef = global.AppState || (typeof window !== 'undefined' ? window.AppState : {}) || {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Build date map of focus seconds
        const dailySecondsMap = {};

        if (AppStateRef.timerLogs && Array.isArray(AppStateRef.timerLogs)) {
            AppStateRef.timerLogs.forEach(log => {
                if (!log.date) return;
                const d = new Date(log.date);
                if (isNaN(d.getTime())) return;
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const dur = parseInt(log.duration || 0, 10);
                dailySecondsMap[key] = (dailySecondsMap[key] || 0) + dur;
            });
        }

        // Include current active running timer ONLY if currently running
        if (AppStateRef.activeTimerState) {
            let activeMs = 0;
            const nowTime = (typeof global.getServerTime === 'function') ? global.getServerTime() : Date.now();

            if (AppStateRef.activeTimerState.timerStates) {
                Object.values(AppStateRef.activeTimerState.timerStates).forEach(store => {
                    if (store.isRunning) {
                        let ms = store.elapsedBeforeStart || 0;
                        if (store.startTime) {
                            ms += (nowTime - parseStartTime(store.startTime));
                        }
                        activeMs += ms;
                    }
                });
            } else if (AppStateRef.activeTimerState.isRunning) {
                activeMs = AppStateRef.activeTimerState.elapsedBeforeStart || 0;
                if (AppStateRef.activeTimerState.startTime) {
                    activeMs += (nowTime - parseStartTime(AppStateRef.activeTimerState.startTime));
                }
            }
            const activeSec = Math.floor(activeMs / 1000);
            if (activeSec > 0) {
                const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                dailySecondsMap[todayKey] = (dailySecondsMap[todayKey] || 0) + activeSec;
            }
        }

        // 2. Render main page heatmap if present
        if (gridEl) {
            const rangeDays = global.spectraHeatmapRange || 365;
            const endDate = new Date(today);
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() - (rangeDays - 1));

            // Align start date to Sunday (day 0)
            const dayOfWeek = startDate.getDay();
            if (dayOfWeek !== 0) {
                startDate.setDate(startDate.getDate() - dayOfWeek);
            }

            const weeks = [];
            let currentWeek = [];
            let curr = new Date(startDate);

            let activeDaysCount = 0;
            let zeroCount = 0;
            let redCount = 0;
            let blueCount = 0;
            let greenCount = 0;
            let goldCount = 0;
            let gemCount = 0;

            while (curr <= endDate || currentWeek.length > 0) {
                const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
                const isFuture = curr > endDate;
                const sec = !isFuture ? (dailySecondsMap[key] || 0) : 0;
                const hours = parseFloat((sec / 3600).toFixed(2));

                if (!isFuture) {
                    if (hours > 0) activeDaysCount++;
                    if (hours === 0) zeroCount++;
                    else if (hours > 0 && hours <= 2.0) redCount++;
                    else if (hours > 2.0 && hours <= 4.0) blueCount++;
                    else if (hours > 4.0 && hours < 6.0) greenCount++;
                    else if (hours >= 6.0 && hours < 8.0) goldCount++;
                    else if (hours >= 8.0) gemCount++;
                }

                currentWeek.push({
                    date: new Date(curr),
                    dateKey: key,
                    hours: hours,
                    seconds: sec,
                    isFuture: isFuture
                });

                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }

                curr.setDate(curr.getDate() + 1);
                if (isFuture && currentWeek.length === 0) break;
            }

            // Calculate Current Streak
            let streak = 0;
            let checkDate = new Date(today);
            while (true) {
                const k = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                const s = dailySecondsMap[k] || 0;
                if (s > 0) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    if (checkDate.getTime() === today.getTime()) {
                        checkDate.setDate(checkDate.getDate() - 1);
                        continue;
                    }
                    break;
                }
            }

            // Update Stat Counters in UI
            const elActive = document.getElementById('spectra-hm-stat-active-days');
            const elStreak = document.getElementById('spectra-hm-stat-streak');
            const elZero = document.getElementById('spectra-hm-stat-zero');
            const elRed = document.getElementById('spectra-hm-stat-red');
            const elBlue = document.getElementById('spectra-hm-stat-blue');
            const elGreen = document.getElementById('spectra-hm-stat-green');
            const elGold = document.getElementById('spectra-hm-stat-gold');
            const elGem = document.getElementById('spectra-hm-stat-gem');

            if (elActive) elActive.innerText = activeDaysCount;
            if (elStreak) elStreak.innerText = `${streak} days 🔥`;
            if (elZero) elZero.innerText = zeroCount;
            if (elRed) elRed.innerText = redCount;
            if (elBlue) elBlue.innerText = blueCount;
            if (elGreen) elGreen.innerText = greenCount;
            if (elGold) elGold.innerText = goldCount;
            if (elGem) elGem.innerText = gemCount;

            // Render GitHub Grid (Month Labels + Day Rows)
            let monthLabelsHtml = '<div class="flex items-center text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-1 pl-7 gap-1">';
            let prevMonth = -1;

            weeks.forEach((wk) => {
                const firstDayOfWeek = wk[0].date;
                const month = firstDayOfWeek.getMonth();
                if (month !== prevMonth) {
                    const monthName = firstDayOfWeek.toLocaleDateString(undefined, { month: 'short' });
                    monthLabelsHtml += `<span class="shrink-0 text-center" style="width: 14px;">${monthName}</span>`;
                    prevMonth = month;
                } else {
                    monthLabelsHtml += `<span class="shrink-0" style="width: 14px;"></span>`;
                }
            });
            monthLabelsHtml += '</div>';

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            let gridRowsHtml = '';

            for (let d = 0; d < 7; d++) {
                const dayLabel = (d === 1 || d === 3 || d === 5) ? dayNames[d] : '';
                gridRowsHtml += `<div class="flex items-center gap-1">`;
                gridRowsHtml += `<span class="w-6 text-[9px] font-bold text-slate-400 dark:text-slate-500 shrink-0 text-right pr-1">${dayLabel}</span>`;
                gridRowsHtml += `<div class="flex items-center gap-1">`;

                weeks.forEach((wk) => {
                    const dayObj = wk[d];
                    if (!dayObj) {
                        gridRowsHtml += `<div class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] opacity-0 pointer-events-none shrink-0"></div>`;
                        return;
                    }

                    if (dayObj.isFuture) {
                        gridRowsHtml += `<div class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 opacity-40 shrink-0"></div>`;
                        return;
                    }

                    const hrs = dayObj.hours;
                    let bgClass = "";
                    let tierText = "";
                    let badgeClass = "";
                    let boxInner = "";

                    if (hrs === 0) {
                        bgClass = "bg-rose-500/20 text-rose-500 border border-rose-300/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50 spectra-heatmap-box";
                        tierText = "❌ No Focus (0h)";
                        badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                        boxInner = `<svg class="w-2 h-2 sm:w-2.5 sm:h-2.5 text-rose-500/90 dark:text-rose-400/90 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
                    } else if (hrs > 0 && hrs <= 2.0) {
                        bgClass = "bg-rose-600 text-white border border-rose-500 dark:bg-rose-700 dark:border-rose-600 shadow-[0_0_6px_rgba(225,29,72,0.45)] spectra-heatmap-box";
                        tierText = "⭕ Low Focus (0-2h)";
                        badgeClass = "bg-rose-600/20 text-rose-400 border border-rose-600/40";
                        boxInner = `<svg class="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white/90 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/></svg>`;
                    } else if (hrs > 2.0 && hrs <= 4.0) {
                        bgClass = "bg-blue-500 text-white border border-blue-400 dark:bg-blue-600 dark:border-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.45)] spectra-heatmap-box";
                        tierText = "🔵 Moderate Focus (2-4h)";
                        badgeClass = "bg-blue-500/20 text-blue-400 border border-blue-500/40";
                    } else if (hrs > 4.0 && hrs < 6.0) {
                        bgClass = "bg-emerald-500 text-white border border-emerald-400 dark:bg-emerald-600 dark:border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)] spectra-heatmap-box";
                        tierText = "🟢 Target Met (> 4h)";
                        badgeClass = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
                    } else if (hrs >= 6.0 && hrs < 8.0) {
                        bgClass = "bg-amber-400 text-amber-950 border border-amber-300 dark:bg-amber-500 dark:border-amber-400 animate-gold-pulse spectra-heatmap-box";
                        tierText = "🟡 Glowing Golden Focus (≥ 6h)";
                        badgeClass = "bg-amber-500/20 text-amber-400 border border-amber-500/40";
                    } else if (hrs >= 8.0) {
                        bgClass = "bg-gradient-to-tr from-cyan-400 via-sky-300 via-fuchsia-400 to-indigo-500 text-white border border-cyan-300 dark:border-cyan-400 animate-diamond-shimmer spectra-heatmap-box";
                        tierText = "💎 Valuable Diamond Focus (≥ 8h)";
                        badgeClass = "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40";
                    }

                    const formattedDate = dayObj.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    const formattedTime = formatHoursToHrMin(hrs);

                    gridRowsHtml += `<div class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] ${bgClass} shrink-0 cursor-pointer flex items-center justify-center overflow-hidden"
                        data-date="${formattedDate}"
                        data-datekey="${dayObj.dateKey}"
                        data-time="${formattedTime}"
                        data-tier="${tierText}"
                        data-badge="${badgeClass}"
                        onclick="window.showSpectraHeatmapDayDetail('${dayObj.dateKey}')"
                        onmouseenter="window.showSpectraHeatmapTooltip(event, this)"
                        onmousemove="window.moveSpectraHeatmapTooltip(event)"
                        onmouseleave="window.hideSpectraHeatmapTooltip()">${boxInner}</div>`;
                });

                gridRowsHtml += `</div></div>`;
            }

            gridEl.innerHTML = monthLabelsHtml + gridRowsHtml;
        }

        // 3. Render compact 2-month dashboard card heatmap if present
        if (dashGridEl) {
            const dashRangeDays = 60; // 2 months fixed
            const dashEndDate = new Date(today);
            const dashStartDate = new Date(today);
            dashStartDate.setDate(dashStartDate.getDate() - (dashRangeDays - 1));

            const dashDayOfWeek = dashStartDate.getDay();
            if (dashDayOfWeek !== 0) {
                dashStartDate.setDate(dashStartDate.getDate() - dashDayOfWeek);
            }

            const dashWeeks = [];
            let currentDashWeek = [];
            let currDash = new Date(dashStartDate);

            while (currDash <= dashEndDate || currentDashWeek.length > 0) {
                const key = `${currDash.getFullYear()}-${String(currDash.getMonth() + 1).padStart(2, '0')}-${String(currDash.getDate()).padStart(2, '0')}`;
                const isFuture = currDash > dashEndDate;
                const sec = !isFuture ? (dailySecondsMap[key] || 0) : 0;
                const hours = parseFloat((sec / 3600).toFixed(2));

                currentDashWeek.push({
                    date: new Date(currDash),
                    dateKey: key,
                    hours: hours,
                    seconds: sec,
                    isFuture: isFuture
                });

                if (currentDashWeek.length === 7) {
                    dashWeeks.push(currentDashWeek);
                    currentDashWeek = [];
                }

                currDash.setDate(currDash.getDate() + 1);
                if (isFuture && currentDashWeek.length === 0) break;
            }

            let dashMonthLabelsHtml = '<div class="flex items-center justify-between w-full text-[9px] font-extrabold text-slate-400 dark:text-slate-500 mb-1.5 pl-5 sm:pl-6 pr-0.5 gap-1.5 shrink-0">';
            let prevDashMonth = -1;

            dashWeeks.forEach((wk) => {
                const firstDayOfWeek = wk[0].date;
                const month = firstDayOfWeek.getMonth();
                if (month !== prevDashMonth) {
                    const monthName = firstDayOfWeek.toLocaleDateString(undefined, { month: 'short' });
                    dashMonthLabelsHtml += `<span class="flex-1 text-center truncate min-w-0">${monthName}</span>`;
                    prevDashMonth = month;
                } else {
                    dashMonthLabelsHtml += `<span class="flex-1 min-w-0"></span>`;
                }
            });
            dashMonthLabelsHtml += '</div>';

            const dashDayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            let dashGridRowsHtml = '<div class="flex-1 flex flex-col justify-between w-full gap-1 min-h-0">';

            for (let d = 0; d < 7; d++) {
                const dayLabel = (d === 1 || d === 3 || d === 5) ? dashDayNames[d] : '';
                dashGridRowsHtml += `<div class="flex items-center gap-1.5 w-full flex-1 min-h-0">`;
                dashGridRowsHtml += `<span class="w-4 sm:w-5 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 shrink-0 text-right pr-0.5">${dayLabel}</span>`;
                dashGridRowsHtml += `<div class="flex items-center justify-between gap-1 sm:gap-1.5 flex-1 h-full min-w-0">`;

                dashWeeks.forEach((wk) => {
                    const dayObj = wk[d];
                    if (!dayObj) {
                        dashGridRowsHtml += `<div class="flex-1 h-full max-h-[22px] min-h-[14px] aspect-square rounded-[4px] opacity-0 pointer-events-none shrink-0"></div>`;
                        return;
                    }

                    if (dayObj.isFuture) {
                        dashGridRowsHtml += `<div class="flex-1 h-full max-h-[22px] min-h-[14px] aspect-square rounded-[4px] bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 opacity-40 shrink-0"></div>`;
                        return;
                    }

                    const hrs = dayObj.hours;
                    let bgClass = "";
                    let tierText = "";
                    let badgeClass = "";
                    let boxInner = "";

                    if (hrs === 0) {
                        bgClass = "bg-rose-500/20 text-rose-500 border border-rose-300/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50 spectra-heatmap-box";
                        tierText = "❌ No Focus (0h)";
                        badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                        boxInner = `<svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-500/90 dark:text-rose-400/90 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
                    } else if (hrs > 0 && hrs <= 2.0) {
                        bgClass = "bg-rose-600 text-white border border-rose-500 dark:bg-rose-700 dark:border-rose-600 shadow-[0_0_6px_rgba(225,29,72,0.45)] spectra-heatmap-box";
                        tierText = "⭕ Low Focus (0-2h)";
                        badgeClass = "bg-rose-600/20 text-rose-400 border border-rose-600/40";
                        boxInner = `<svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/90 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/></svg>`;
                    } else if (hrs > 2.0 && hrs <= 4.0) {
                        bgClass = "bg-blue-500 text-white border border-blue-400 dark:bg-blue-600 dark:border-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.45)] spectra-heatmap-box";
                        tierText = "🔵 Moderate Focus (2-4h)";
                        badgeClass = "bg-blue-500/20 text-blue-400 border border-blue-500/40";
                    } else if (hrs > 4.0 && hrs < 6.0) {
                        bgClass = "bg-emerald-500 text-white border border-emerald-400 dark:bg-emerald-600 dark:border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)] spectra-heatmap-box";
                        tierText = "🟢 Target Met (> 4h)";
                        badgeClass = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
                    } else if (hrs >= 6.0 && hrs < 8.0) {
                        bgClass = "bg-amber-400 text-amber-950 border border-amber-300 dark:bg-amber-500 dark:border-amber-400 animate-gold-pulse spectra-heatmap-box";
                        tierText = "🟡 Glowing Golden Focus (≥ 6h)";
                        badgeClass = "bg-amber-500/20 text-amber-400 border border-amber-500/40";
                    } else if (hrs >= 8.0) {
                        bgClass = "bg-gradient-to-tr from-cyan-400 via-sky-300 via-fuchsia-400 to-indigo-500 text-white border border-cyan-300 dark:border-cyan-400 animate-diamond-shimmer spectra-heatmap-box";
                        tierText = "💎 Valuable Diamond Focus (≥ 8h)";
                        badgeClass = "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40";
                    }

                    const formattedDate = dayObj.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    const formattedTime = formatHoursToHrMin(hrs);

                    dashGridRowsHtml += `<div class="flex-1 h-full max-h-[22px] min-h-[14px] aspect-square rounded-[4px] ${bgClass} cursor-pointer flex items-center justify-center overflow-hidden transition-transform hover:scale-125 z-10"
                        data-date="${formattedDate}"
                        data-datekey="${dayObj.dateKey}"
                        data-time="${formattedTime}"
                        data-tier="${tierText}"
                        data-badge="${badgeClass}"
                        onclick="window.showSpectraHeatmapDayDetail('${dayObj.dateKey}', false)"
                        onmouseenter="window.showSpectraHeatmapTooltip(event, this)"
                        onmousemove="window.moveSpectraHeatmapTooltip(event)"
                        onmouseleave="window.hideSpectraHeatmapTooltip()">${boxInner}</div>`;
                });

                dashGridRowsHtml += `</div></div>`;
            }
            dashGridRowsHtml += '</div>';

            dashGridEl.innerHTML = dashMonthLabelsHtml + dashGridRowsHtml;
        }

        // Auto-populate Side Note panel & Dashboard Card Header with Today's details
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        showSpectraHeatmapDayDetail(todayKey, false);
    }

    /**
     * Shows day detail in side note panel and/or modal drill-down.
     *
     * @param {string} dateKey - 'YYYY-MM-DD'
     * @param {boolean} openModal - Whether to open modal dialog
     */
    function showSpectraHeatmapDayDetail(dateKey, openModal = false) {
        if (!dateKey || typeof document === 'undefined') return;

        // Update selected box purple stroke glow across all grids
        const allBoxes = document.querySelectorAll('#spectra-focus-heatmap-grid [data-datekey], #dashboard-focus-heatmap-grid [data-datekey]');
        allBoxes.forEach(b => b.classList.remove('spectra-heatmap-selected'));

        const targetBoxes = document.querySelectorAll(`[data-datekey="${dateKey}"]`);
        targetBoxes.forEach(b => b.classList.add('spectra-heatmap-selected'));

        const [y, m, d] = dateKey.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const dayOfWeekStr = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
        const shortDateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        const AppStateRef = global.AppState || (typeof window !== 'undefined' ? window.AppState : {}) || {};

        // Filter timer logs for this dateKey
        const dayLogs = [];
        let totalSec = 0;
        if (AppStateRef.timerLogs && Array.isArray(AppStateRef.timerLogs)) {
            AppStateRef.timerLogs.forEach(log => {
                if (!log.date) return;
                const logD = new Date(log.date);
                if (isNaN(logD.getTime())) return;
                const k = `${logD.getFullYear()}-${String(logD.getMonth() + 1).padStart(2, '0')}-${String(logD.getDate()).padStart(2, '0')}`;
                if (k === dateKey) {
                    dayLogs.push(log);
                    totalSec += parseInt(log.duration || 0, 10);
                }
            });
        }

        // Active timer addition if today AND currently running
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (dateKey === todayKey && AppStateRef.activeTimerState) {
            let activeMs = 0;
            const nowTime = (typeof global.getServerTime === 'function') ? global.getServerTime() : Date.now();

            if (AppStateRef.activeTimerState.timerStates) {
                Object.values(AppStateRef.activeTimerState.timerStates).forEach(store => {
                    if (store.isRunning) {
                        let ms = store.elapsedBeforeStart || 0;
                        if (store.startTime) {
                            ms += (nowTime - parseStartTime(store.startTime));
                        }
                        activeMs += ms;
                    }
                });
            } else if (AppStateRef.activeTimerState.isRunning) {
                activeMs = AppStateRef.activeTimerState.elapsedBeforeStart || 0;
                if (AppStateRef.activeTimerState.startTime) {
                    activeMs += (nowTime - parseStartTime(AppStateRef.activeTimerState.startTime));
                }
            }
            const activeSec = Math.floor(activeMs / 1000);
            if (activeSec > 0) {
                totalSec += activeSec;
                dayLogs.push({
                    subjectName: AppStateRef.activeTimerState.subjectName || "Active Session",
                    duration: activeSec,
                    date: new Date().toISOString(),
                    active: true
                });
            }
        }

        const hrs = parseFloat((totalSec / 3600).toFixed(2));
        const formattedTime = formatHoursToHrMin(hrs);

        // Update Header Detail in Dashboard Compact Heatmap Card (DD/MM/YY • Xh Ym)
        const dayFormatted = String(d).padStart(2, '0');
        const monthFormatted = String(m).padStart(2, '0');
        const yearFormatted = String(y).slice(-2);
        const compactDateFormatted = `${dayFormatted}/${monthFormatted}/${yearFormatted}`;

        const totalMin = Math.floor(totalSec / 60);
        const hDur = Math.floor(totalMin / 60);
        const mDur = totalMin % 60;
        const compactDurFormatted = `${hDur}h ${mDur}m`;

        const elDashDetail = document.getElementById('dash-hm-selected-detail');
        if (elDashDetail) {
            elDashDetail.innerHTML = `<span class="text-slate-600 dark:text-slate-300 font-extrabold">${compactDateFormatted}</span><span class="text-fuchsia-400 font-black">•</span><span class="font-black text-fuchsia-600 dark:text-fuchsia-400">${compactDurFormatted}</span>`;
        }

        const targetFn = global.getDailyFocusHoursTargetForDate || (typeof window !== 'undefined' ? window.getDailyFocusHoursTargetForDate : null);
        const target = targetFn ? targetFn(dateObj) : (global.dailyFocusHoursTarget !== undefined ? global.dailyFocusHoursTarget : 0);
        const targetPct = target > 0 ? Math.round((hrs / target) * 100) : 0;

        let tierText = "❌ No Focus (0h)";
        let badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";

        if (hrs > 0 && hrs <= 2.0) {
            tierText = "⭕ Low Focus (0-2h)";
            badgeClass = "bg-rose-600/20 text-rose-400 border border-rose-600/40";
        } else if (hrs > 2.0 && hrs <= 4.0) {
            tierText = "🔵 Moderate Focus (2-4h)";
            badgeClass = "bg-blue-500/20 text-blue-400 border border-blue-500/40";
        } else if (hrs > 4.0 && hrs < 6.0) {
            tierText = "🟢 Target Met (> 4h)";
            badgeClass = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
        } else if (hrs >= 6.0 && hrs < 8.0) {
            tierText = "🟡 Glowing Golden Focus (≥ 6h)";
            badgeClass = "bg-amber-500/20 text-amber-400 border border-amber-500/40";
        } else if (hrs >= 8.0) {
            tierText = "💎 Valuable Diamond Focus (≥ 8h)";
            badgeClass = "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40";
        }

        // 1. Populate Right Side Note Card Panel
        const elSnDay = document.getElementById('spectra-sn-day-name');
        const elSnDate = document.getElementById('spectra-sn-date');
        const elSnBadge = document.getElementById('spectra-sn-tier-badge');
        const elSnTime = document.getElementById('spectra-sn-focus-time');
        const elSnTarget = document.getElementById('spectra-sn-target-pct');
        const elSnSubjects = document.getElementById('spectra-sn-subjects-list');

        if (elSnDay) elSnDay.innerText = dayOfWeekStr;
        if (elSnDate) elSnDate.innerText = shortDateStr;
        if (elSnBadge) {
            elSnBadge.innerText = tierText;
            elSnBadge.className = `px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${badgeClass}`;
            elSnBadge.classList.remove('hidden');
        }
        if (elSnTime) elSnTime.innerText = formattedTime;
        if (elSnTarget) elSnTarget.innerText = `${targetPct}%`;

        // Group subjects
        const subjectMap = {};
        dayLogs.forEach(log => {
            const subj = log.subjectName || log.subject || "General Focus";
            const dur = parseInt(log.duration || 0, 10);
            subjectMap[subj] = (subjectMap[subj] || 0) + dur;
        });

        if (elSnSubjects) {
            const subjectEntries = Object.entries(subjectMap);
            if (subjectEntries.length === 0) {
                elSnSubjects.innerHTML = `<span class="text-[10px] text-slate-400 italic">No focus sessions recorded for this day.</span>`;
            } else {
                let subjHtml = '';
                subjectEntries.forEach(([subjName, sec]) => {
                    const durStr = formatHoursToHrMin(sec / 3600);
                    subjHtml += `<span class="px-2 py-0.5 text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-lg border border-indigo-500/20 flex items-center gap-1">${subjName}: <span class="font-bold text-indigo-700 dark:text-indigo-200">${durStr}</span></span>`;
                });
                elSnSubjects.innerHTML = subjHtml;
            }
        }

        // 2. Populate Optional Modal (if requested)
        const modal = document.getElementById('spectra-heatmap-day-modal');
        if (modal) {
            const elDate = document.getElementById('spectra-hm-modal-date');
            const elBadge = document.getElementById('spectra-hm-modal-tier-badge');
            const elTime = document.getElementById('spectra-hm-modal-time');
            const elPct = document.getElementById('spectra-hm-modal-target-pct');
            const elCount = document.getElementById('spectra-hm-modal-session-count');
            const elList = document.getElementById('spectra-hm-modal-sessions-list');

            if (elDate) elDate.innerText = dateStr;
            if (elBadge) {
                elBadge.innerText = tierText;
                elBadge.className = `inline-block mt-0.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${badgeClass}`;
            }
            if (elTime) elTime.innerText = formattedTime;
            if (elPct) {
                elPct.innerText = `${targetPct}%`;
                elPct.className = `text-lg font-black ${targetPct >= 100 ? 'text-emerald-500 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`;
            }
            if (elCount) elCount.innerText = `${dayLogs.length} session${dayLogs.length === 1 ? '' : 's'}`;

            if (elList) {
                if (dayLogs.length === 0) {
                    elList.innerHTML = `<div class="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">No focus sessions recorded on this day.</div>`;
                } else {
                    let html = '';
                    dayLogs.forEach(log => {
                        const durSec = parseInt(log.duration || 0, 10);
                        const durStr = formatHoursToHrMin(durSec / 3600);
                        const subj = log.subjectName || log.subject || "General Focus";
                        const isNow = log.active ? true : false;
                        const logTimeStr = isNow ? "Active Now" : new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        html += `
                            <div class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
                                <div class="flex items-center space-x-2.5">
                                    <div class="w-2 h-2 rounded-full ${isNow ? 'bg-emerald-500 animate-ping' : 'bg-indigo-500'}"></div>
                                    <span class="text-xs font-black text-slate-700 dark:text-slate-200">${subj}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="text-[10px] font-bold text-slate-400">${logTimeStr}</span>
                                    <span class="px-2 py-0.5 text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-500/20">${durStr}</span>
                                </div>
                            </div>
                        `;
                    });
                    elList.innerHTML = html;
                }
            }

            if (openModal) {
                modal.classList.remove('hidden');
            }
        }
    }

    /**
     * Closes spectra heatmap day modal.
     */
    function closeSpectraHeatmapDayModal() {
        if (typeof document === 'undefined') return;
        const modal = document.getElementById('spectra-heatmap-day-modal');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Tooltip handler for heatmap boxes.
     */
    function showSpectraHeatmapTooltip(e, el) {
        if (typeof document === 'undefined') return;
        const tooltip = document.getElementById('spectra-focus-heatmap-tooltip');
        if (!tooltip || !el) return;

        let date = '', time = '', tier = '', badgeClass = '';
        if (typeof el.getAttribute === 'function') {
            date = el.getAttribute('data-date') || '';
            time = el.getAttribute('data-time') || '';
            tier = el.getAttribute('data-tier') || '';
            badgeClass = el.getAttribute('data-badge') || '';
        } else if (typeof el === 'object') {
            date = el.date || String(el);
            time = el.time || (arguments[2] ? `${arguments[2]}s` : '');
            tier = el.tier || (arguments[3] ? `${arguments[3]} sessions` : '');
            badgeClass = el.badge || 'bg-indigo-500';
        } else {
            date = String(el);
            time = arguments[2] ? `${arguments[2]}s` : '';
            tier = arguments[3] ? `${arguments[3]} sessions` : '';
            badgeClass = 'bg-indigo-500';
        }

        tooltip.innerHTML = `
            <div class="text-[10px] text-slate-400 uppercase tracking-widest font-black">${date}</div>
            <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs sm:text-sm font-black text-white">${time}</span>
                <span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${badgeClass}">${tier}</span>
            </div>
        `;

        tooltip.classList.remove('hidden');
        moveSpectraHeatmapTooltip(e);
    }

    function moveSpectraHeatmapTooltip(e) {
        if (typeof document === 'undefined') return;
        const tooltip = document.getElementById('spectra-focus-heatmap-tooltip');
        if (!tooltip || tooltip.classList.contains('hidden') || !e) return;

        const x = e.clientX + 12;
        const y = e.clientY - 40;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    function hideSpectraHeatmapTooltip() {
        if (typeof document === 'undefined') return;
        const tooltip = document.getElementById('spectra-focus-heatmap-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    }

    /**
     * Renders daily actions consistency heatmap for #yearly-daily-grid.
     */
    function renderHeatmap() {
        if (typeof document === 'undefined') return;
        const container = document.getElementById('yearly-daily-grid');
        if (!container) return;

        const AppStateRef = global.AppState || (typeof window !== 'undefined' ? window.AppState : {}) || {};
        const UtilsRef = global.Utils || (typeof window !== 'undefined' ? window.Utils : {}) || {};
        const paceGoalsRef = global.paceGoals || (typeof window !== 'undefined' ? window.paceGoals : []) || [];
        const dashboardConfigRef = global.dashboardConfig || (typeof window !== 'undefined' ? window.dashboardConfig : {}) || {};
        const customActionsRef = global.customActions || (typeof window !== 'undefined' ? window.customActions : []) || [];

        let activeGoalId = dashboardConfigRef.activePaceGoalId;
        if (!activeGoalId && paceGoalsRef.length > 0) {
            activeGoalId = paceGoalsRef[0].id;
        }
        const activeGoal = activeGoalId ? paceGoalsRef.find(g => g.id === activeGoalId) : null;
        let chartStart = activeGoal && activeGoal.startDate
            ? (UtilsRef.parseDateSafe ? UtilsRef.parseDateSafe(activeGoal.startDate) : new Date(activeGoal.startDate))
            : new Date(AppStateRef.PLAN_START_DATE || '2026-01-01');

        if (!chartStart || isNaN(chartStart.getTime())) {
            chartStart = new Date(AppStateRef.PLAN_START_DATE || '2026-01-01');
        }
        chartStart.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        let html = '';
        let cur = new Date(today);
        cur.setHours(0, 0, 0, 0);

        const getTaskFn = global.getTaskForDate || (typeof window !== 'undefined' ? window.getTaskForDate : null);
        const formatDateFn = (UtilsRef && UtilsRef.formatDate) ? UtilsRef.formatDate : (d => d.toLocaleDateString());

        while (cur >= chartStart) {
            const t = getTaskFn ? getTaskFn(cur) : null;
            const dFormatted = formatDateFn(cur);
            const parts = dFormatted.split(' ');
            const dayPart = parts[0] || '';
            const monthPart = parts[1] || '';

            let c = 0;
            if (t) {
                customActionsRef.forEach(a => { if (t[a.id]) c++; });
            }
            const pct = customActionsRef.length > 0 ? Math.round((c / customActionsRef.length) * 100) : 0;

            let bg = 'bg-white dark:bg-slate-800/60 text-slate-400 border border-slate-200 dark:border-slate-700/60 opacity-70';
            if (pct > 0 && pct <= 25) bg = 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] border-transparent opacity-100';
            if (pct > 25 && pct <= 50) bg = 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-[0_2px_8px_rgba(249,115,22,0.3)] border-transparent opacity-100';
            if (pct > 50 && pct <= 75) bg = 'bg-gradient-to-br from-lime-400 to-lime-500 text-white shadow-[0_2px_8px_rgba(132,204,22,0.3)] border-transparent opacity-100';
            if (pct > 75) bg = 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-[0_2px_8px_rgba(34,197,94,0.4)] border-transparent opacity-100';

            html += `<div class="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${bg} w-[42px] sm:w-[50px] md:w-[55px] h-[52px] sm:h-[60px] md:h-[65px] shrink-0 font-black hover:-translate-y-1 transition-all cursor-default"><span class="text-[7px] sm:text-[8px] uppercase opacity-90 mb-0.5">${dayPart}</span><span class="text-[10px] sm:text-xs md:text-sm">${monthPart}</span></div>`;

            cur.setDate(cur.getDate() - 1);
        }
        container.innerHTML = html;
    }

    const HeatmapAnalytics = {
        formatHoursToHrMin,
        parseStartTime,
        setSpectraHeatmapRangeUI,
        setSpectraHeatmapRange,
        renderSpectraFocusHeatmap,
        showSpectraHeatmapDayDetail,
        closeSpectraHeatmapDayModal,
        showSpectraHeatmapTooltip,
        moveSpectraHeatmapTooltip,
        hideSpectraHeatmapTooltip,
        renderHeatmap
    };

    // Attach to global window scope
    global.HeatmapAnalytics = HeatmapAnalytics;
    global.setSpectraHeatmapRangeUI = setSpectraHeatmapRangeUI;
    global.setSpectraHeatmapRange = setSpectraHeatmapRange;
    global.renderSpectraFocusHeatmap = renderSpectraFocusHeatmap;
    global.showSpectraHeatmapDayDetail = showSpectraHeatmapDayDetail;
    global.closeSpectraHeatmapDayModal = closeSpectraHeatmapDayModal;
    global.showSpectraHeatmapTooltip = showSpectraHeatmapTooltip;
    global.moveSpectraHeatmapTooltip = moveSpectraHeatmapTooltip;
    global.hideSpectraHeatmapTooltip = hideSpectraHeatmapTooltip;
    global.renderHeatmap = renderHeatmap;

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        const bindHeatmapEvents = () => {
            const btn = document.getElementById('spectra-hm-modal-close-btn');
            if (btn) {
                btn.addEventListener('click', closeSpectraHeatmapDayModal);
            }
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindHeatmapEvents);
        } else {
            bindHeatmapEvents();
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = HeatmapAnalytics;
    }
})(typeof window !== 'undefined' ? window : globalThis);
