/**
 * X-29 Module: features/habits/dadbModal.js
 * Daily Actions Database (DADB) modal & historical analytics engine:
 * - 180-Day historical completion records across all daily actions
 * - Date View with multi-factor sorting (Date, Completion %) and per-action filtering
 * - Action View with aggregate completion metrics and progress bars
 * - Chart.js 180-Day daily completion percentage trend chart
 * - Dynamic tab navigation & responsive canvas resizing
 */
(function (global) {
    'use strict';

    // Filter & Sort State
    let dadbSortOrder = window.dadbSortOrder || 'desc';
    let dadbActionFilter = window.dadbActionFilter || 'ALL';

    /**
     * Cycles through sort modes for DADB Date View:
     * Latest First ('desc') -> Oldest First ('asc') -> Highest Completion ('pct-desc') -> Lowest Completion ('pct-asc')
     */
    function toggleDadbSort() {
        const states = ['desc', 'asc', 'pct-desc', 'pct-asc'];
        let idx = states.indexOf(window.dadbSortOrder || dadbSortOrder);
        const nextOrder = states[(idx + 1) % states.length];
        window.dadbSortOrder = nextOrder;
        dadbSortOrder = nextOrder;
        openDailyActionsDBModal();
    }

    /**
     * Filters DADB Date View by a specific action ID or 'ALL'.
     *
     * @param {string} val - Action ID or 'ALL'
     */
    function setDadbFilter(val) {
        window.dadbActionFilter = val;
        dadbActionFilter = val;
        openDailyActionsDBModal();
    }

    /**
     * Computes 180-day history metrics, renders Date & Action views,
     * initializes/updates Chart.js trend instance, and displays the DADB modal.
     */
    function openDailyActionsDBModal() {
        const containerDate = document.getElementById('dadb-view-date');
        const containerAction = document.getElementById('dadb-view-action');
        const ctxTrend = document.getElementById('dadbTrendChart');
        if (!containerDate || !containerAction || !ctxTrend) return;

        let htmlDate = '';
        let htmlAction = '';

        const today = (typeof Utils !== 'undefined' && typeof Utils.getDailyActionDate === 'function')
            ? Utils.getDailyActionDate()
            : new Date();
        today.setHours(0, 0, 0, 0);

        const totalDays = 180;
        const cutoffDate = new Date(today);
        cutoffDate.setDate(cutoffDate.getDate() - (totalDays - 1));
        cutoffDate.setHours(0, 0, 0, 0);

        let hasData = false;

        const customActionsList = Array.isArray(window.customActions) && window.customActions.length > 0
            ? [...window.customActions].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999))
            : [];

        let actionStats = {};
        customActionsList.forEach(a => {
            let actStart = (a.startDate && typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                ? Utils.parseDateSafe(a.startDate)
                : cutoffDate;
            if (!actStart || isNaN(actStart.getTime()) || actStart < cutoffDate) actStart = cutoffDate;
            actStart.setHours(0, 0, 0, 0);

            let validDays = 0;
            const scanDate = new Date(today);
            while (scanDate >= actStart) {
                validDays++;
                scanDate.setDate(scanDate.getDate() - 1);
            }
            actionStats[a.id] = {
                name: a.title,
                color: a.color,
                icon: a.icon,
                track: a.track,
                startDate: a.startDate,
                count: 0,
                validDays: Math.max(1, validDays)
            };
        });

        let trendLabels = [];
        let trendData = [];
        let trendColors = [];

        let dateEntries = [];

        // Scan all 180 days from today backwards to cutoffDate
        const curr = new Date(today);
        while (curr >= cutoffDate) {
            const dStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') ? Utils.formatDate(curr) : '';
            const isoDate = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
            const dayOfWeek = curr.toLocaleDateString('en-US', { weekday: 'short' });
            const fullDateDisplay = `${dayOfWeek}, ${dStr} ${curr.getFullYear()}`;
            const isToday = (curr.getTime() === today.getTime());

            const t = (typeof window.getTaskForDate === 'function') ? window.getTaskForDate(curr) : null;

            let doneActions = [];
            let completedActionObjs = [];
            customActionsList.forEach(a => {
                if (t && t[a.id]) {
                    doneActions.push(a.title);
                    completedActionObjs.push(a);
                    if (actionStats[a.id]) {
                        actionStats[a.id].count++;
                    }
                }
            });

            const pct = customActionsList.length > 0 ? Math.round((doneActions.length / customActionsList.length) * 100) : 0;

            // Trend data: chronological order (oldest on left, latest on right) -> unshift
            trendLabels.unshift(dStr);
            trendData.unshift(pct);

            let bgClass = 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700';
            let pctColor = 'text-slate-500 dark:text-slate-400';
            let barColor = '#64748b';

            if (pct > 0 && pct <= 25) { pctColor = 'text-red-500'; bgClass = 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50'; barColor = '#ef4444'; }
            else if (pct > 25 && pct <= 50) { pctColor = 'text-orange-500'; bgClass = 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/50'; barColor = '#f97316'; }
            else if (pct > 50 && pct <= 75) { pctColor = 'text-lime-500'; bgClass = 'bg-lime-50/50 dark:bg-lime-900/10 border-lime-100 dark:border-lime-800/50'; barColor = '#84cc16'; }
            else if (pct > 75) { pctColor = 'text-emerald-500'; bgClass = 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50'; barColor = '#10b981'; }

            trendColors.unshift(barColor);

            const hasAnyAction = doneActions.length > 0;
            const currentFilter = window.dadbActionFilter || dadbActionFilter;
            const matchesFilter = (currentFilter === 'ALL')
                ? (hasAnyAction || isToday)
                : (t && Boolean(t[currentFilter]));

            if (matchesFilter) {
                hasData = true;
                dateEntries.push({
                    dateObj: new Date(curr),
                    dateStr: fullDateDisplay,
                    shortDate: dStr,
                    isoDate: isoDate,
                    doneActions,
                    completedActionObjs,
                    pct,
                    pctColor,
                    bgClass,
                    isToday
                });
            }

            curr.setDate(curr.getDate() - 1);
        }

        const currentSort = window.dadbSortOrder || dadbSortOrder;
        if (currentSort === 'asc') {
            dateEntries.sort((a, b) => a.dateObj - b.dateObj);
        } else if (currentSort === 'pct-desc') {
            dateEntries.sort((a, b) => b.pct - a.pct || b.dateObj - a.dateObj);
        } else if (currentSort === 'pct-asc') {
            dateEntries.sort((a, b) => a.pct - b.pct || b.dateObj - a.dateObj);
        } else {
            // default 'desc': latest date first
            dateEntries.sort((a, b) => b.dateObj - a.dateObj);
        }

        let sortLabel = 'Latest First';
        if (currentSort === 'asc') sortLabel = 'Oldest First';
        if (currentSort === 'pct-desc') sortLabel = 'Highest Completion';
        if (currentSort === 'pct-asc') sortLabel = 'Lowest Completion';

        const currentFilter = window.dadbActionFilter || dadbActionFilter;
        let filterOptions = `<option value="ALL">Filter: All Actions</option>`;
        customActionsList.forEach(a => {
            filterOptions += `<option value="${a.id}" ${currentFilter === a.id ? 'selected' : ''}>Filter: ${a.title}</option>`;
        });

        htmlDate = `
            <div class="flex justify-between items-center mb-3">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:block">Date Log (Last 180 Days)</span>
                <div class="flex gap-2 items-center w-full sm:w-auto justify-between sm:justify-end">
                    <div class="relative flex-1 sm:flex-none">
                        <select onchange="window.setDadbFilter(this.value)" class="w-full flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[9px] font-black uppercase tracking-widest transition-colors text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 outline-none cursor-pointer sm:max-w-[160px] md:max-w-[200px] truncate appearance-none pr-6">
                            ${filterOptions}
                        </select>
                        <svg class="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    <button onclick="window.toggleDadbSort()" class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[9px] font-black uppercase tracking-widest transition-colors text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 whitespace-nowrap">
                        <svg class="w-3.5 h-3.5 fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
                        Sort: ${sortLabel}
                    </button>
                </div>
            </div>
        `;

        if (hasData && dateEntries.length > 0) {
            dateEntries.forEach(entry => {
                const pillsHtml = entry.completedActionObjs.length > 0
                    ? entry.completedActionObjs.map(act => {
                        const cMap = (AppState.twColors && AppState.twColors[act.color]) || (AppState.twColors && AppState.twColors['blue']) || { iconBg: 'bg-blue-50', text: 'text-blue-500', borderLt: 'border-blue-200', btn: 'bg-blue-500' };
                        return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold ${cMap.iconBg} ${cMap.text} border ${cMap.borderLt}"><span class="w-1.5 h-1.5 rounded-full ${cMap.btn}"></span>${act.title}</span>`;
                    }).join('')
                    : '<span class="text-[10px] font-bold text-slate-400 italic">No completed actions recorded</span>';

                htmlDate += `
                    <div class="flex items-center justify-between p-3.5 rounded-2xl border ${entry.bgClass} shadow-sm mb-2 transition-all">
                        <div class="flex flex-col pr-3 flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span class="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">${entry.dateStr}</span>
                                ${entry.isToday ? '<span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-blue-500 text-white shadow-sm">Today</span>' : ''}
                            </div>
                            <div class="flex items-center gap-1.5 flex-wrap">
                                ${pillsHtml}
                            </div>
                        </div>
                        <div class="flex flex-col items-center justify-center shrink-0 ml-3 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 min-w-[3.5rem]">
                            <span class="text-xs md:text-sm font-black ${entry.pctColor}">${entry.pct}%</span>
                            <span class="text-[7px] uppercase font-bold text-slate-400 tracking-wider">${entry.doneActions.length}/${customActionsList.length}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            htmlDate += '<div class="p-8 text-center text-slate-400 font-bold text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl mt-2">No actions matching your filter recorded yet in the last 180 days.</div>';
        }

        htmlAction = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">`;
        if (customActionsList.length === 0) {
            htmlAction += `<div class="col-span-full p-8 text-center text-slate-400 font-bold text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">No daily actions configured yet.</div>`;
        } else {
            customActionsList.forEach(a => {
                const stat = actionStats[a.id] || { count: 0, validDays: 180 };
                const actPct = stat.validDays > 0 ? Math.round((stat.count / stat.validDays) * 100) : 0;
                const cMap = (AppState.twColors && AppState.twColors[a.color]) || (AppState.twColors && AppState.twColors['blue']) || { borderLt: 'border-blue-200', bgLt: 'bg-blue-50', text: 'text-blue-500', iconBg: 'bg-blue-50', btn: 'bg-blue-500' };
                const trackObj = a.track ? ((window.tracks || []).find(t => t.id === a.track)) : null;
                const svgIcon = (typeof window.getActionSVG === 'function') ? window.getActionSVG(a.icon, a.title) : '';

                htmlAction += `
                    <div class="p-4 rounded-2xl border ${cMap.borderLt} ${cMap.bgLt} shadow-sm flex flex-col gap-2.5 transition-all">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2 min-w-0">
                                <div class="p-2 rounded-xl ${cMap.iconBg} ${cMap.text} shrink-0 border ${cMap.borderLt}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgIcon}</svg>
                                </div>
                                <div class="min-w-0">
                                    <span class="text-xs md:text-sm font-black ${cMap.text} truncate block">${a.title}</span>
                                    <div class="flex items-center gap-1.5 mt-0.5">
                                        ${a.startDate ? `<span class="text-[8px] font-bold text-slate-400">Since ${a.startDate}</span>` : ''}
                                        ${trackObj ? `<span class="text-[7px] font-black uppercase px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${trackObj.name}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <span class="text-[10px] font-black px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm ${cMap.text} border border-slate-100 dark:border-slate-700/60">${stat.count} / ${stat.validDays} Days</span>
                                <span class="text-xs font-black ${cMap.text}">${actPct}%</span>
                            </div>
                        </div>
                        <div class="w-full bg-slate-200/60 dark:bg-slate-800/60 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                            <div class="h-full rounded-full ${cMap.btn} transition-all duration-700 shadow-sm" style="width: ${actPct}%"></div>
                        </div>
                    </div>
                `;
            });
        }
        htmlAction += `</div>`;

        containerDate.innerHTML = htmlDate;
        containerAction.innerHTML = htmlAction;

        if (window.dadbTrendChartInstance) {
            window.dadbTrendChartInstance.destroy();
            window.dadbTrendChartInstance = null;
        }
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = '#94a3b8';
            Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui';
            window.dadbTrendChartInstance = new Chart(ctxTrend.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: trendLabels,
                    datasets: [{
                        label: 'Daily Completion %',
                        data: trendData,
                        backgroundColor: trendColors,
                        borderRadius: 4,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#cbd5e1',
                            cornerRadius: 8,
                            padding: 10,
                            callbacks: {
                                title: items => items[0] ? `Date: ${items[0].label}` : '',
                                label: c => ` ${c.parsed.y}% completed`
                            }
                        }
                    },
                    scales: {
                        y: { min: 0, max: 100, grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false }, ticks: { font: { weight: 'bold' } } },
                        x: { grid: { display: false, drawBorder: false }, ticks: { font: { weight: 'bold', size: 9 }, maxTicksLimit: 18 } }
                    }
                }
            });
        }

        const activeTab = window.currentDadbTab || 'date';
        switchDadbTab(activeTab);

        const dbModal = document.getElementById('daily-actions-db-modal');
        if (dbModal && dbModal.classList.contains('hidden')) {
            if (typeof window.openModal === 'function') {
                window.openModal('daily-actions-db-modal');
            }
        }
    }

    /**
     * Switches between Date View, Action View, and Trend Chart tabs.
     *
     * @param {string} tab - 'date' | 'action' | 'trend'
     */
    function switchDadbTab(tab) {
        window.currentDadbTab = tab;
        ['date', 'action', 'trend'].forEach(t => {
            const view = document.getElementById('dadb-view-' + t);
            const btn = document.getElementById('dadb-tab-btn-' + t);
            if (!view || !btn) return;

            if (t === tab) {
                view.classList.remove('hidden');
                btn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-blue-600 text-white shadow-md whitespace-nowrap";
            } else {
                view.classList.add('hidden');
                btn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 whitespace-nowrap";
            }
        });

        if (tab === 'trend' && window.dadbTrendChartInstance) {
            setTimeout(() => {
                if (window.dadbTrendChartInstance) {
                    window.dadbTrendChartInstance.resize();
                    window.dadbTrendChartInstance.update('none');
                }
            }, 50);
        }
    }

    // Global attachments
    global.dadbSortOrder = dadbSortOrder;
    global.dadbActionFilter = dadbActionFilter;
    global.toggleDadbSort = toggleDadbSort;
    global.setDadbFilter = setDadbFilter;
    global.openDailyActionsDBModal = openDailyActionsDBModal;
    global.switchDadbTab = switchDadbTab;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            toggleDadbSort,
            setDadbFilter,
            openDailyActionsDBModal,
            switchDadbTab
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);
