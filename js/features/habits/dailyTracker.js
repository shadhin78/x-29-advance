/**
 * X-29 Module: features/habits/dailyTracker.js
 * Daily commitment habit tracker & action status manager:
 * - Action icon SVG generator
 * - Main Daily Actions cards, progress bar & dashboard compact view
 * - 180-day action log mini-heatmaps
 * - Fast optimistic daily status toggling (YES/NO) & individual day toggles
 * - Action Analytics modal (streaks, percentage, contribution heatmap, quick check-ins)
 * - Daily Action CRUD (create, edit, delete)
 */
(function (global) {
    'use strict';

    /**
     * Resolves SVG icon markup based on action keyword or custom icon setting.
     *
     * @param {string} idOrIcon
     * @param {string} [title=""]
     * @returns {string} SVG inner markup
     */
    function getActionSVG(idOrIcon, title = "") {
        const term = (idOrIcon || title || "").toLowerCase();
        if (term.includes('professional') || term.includes('briefcase') || term.includes('job')) {
            return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>`;
        }
        if (term.includes('academic') || term.includes('study') || term.includes('book') || term.includes('education') || term.includes('grad') || term.includes('school') || term.includes('class')) {
            return `<path d="M12 14l9-5-9-5-9 5 9 5z"></path><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6M12 20a11.95 11.95 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479M12 20a11.95 11.95 0 006.824-2.998 12.083 12.083 0 00-.665-6.479"></path>`;
        }
        if (term.includes('gym') || term.includes('health') || term.includes('workout') || term.includes('fitness') || term.includes('sport') || term.includes('run')) {
            return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"></path>`;
        }
        if (term.includes('freelance') || term.includes('work') || term.includes('code') || term.includes('dev') || term.includes('write')) {
            return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>`;
        }
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>`;
    }

    /**
     * Renders main Daily Action cards, today's completion progress bar,
     * and compact action grid for the Dashboard.
     */
    function renderDailyTracker() {
        const activeDate = (typeof Utils !== 'undefined' && typeof Utils.getDailyActionDate === 'function')
            ? Utils.getDailyActionDate()
            : new Date();
        const todayStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function')
            ? Utils.formatDate(activeDate)
            : '';
        const todayTask = (typeof window.getTaskForDate === 'function')
            ? window.getTaskForDate(activeDate)
            : (AppState.tasks || []).find(t => t.date === todayStr);

        let c = 0;
        const customActionsList = Array.isArray(window.customActions) ? window.customActions : [];
        customActionsList.forEach(a => { if (todayTask && todayTask[a.id]) c++; });
        const dailyPct = customActionsList.length > 0 ? Math.round((c / customActionsList.length) * 100) : 0;

        const bar = document.getElementById('daily-actions-progress');
        if (bar) {
            bar.style.width = dailyPct + '%';
            if (typeof safeSetText === 'function') {
                safeSetText('daily-actions-percent', dailyPct + '%');
            }
            let clr = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]';
            if (dailyPct >= 25) clr = 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]';
            if (dailyPct >= 50) clr = 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]';
            if (dailyPct >= 75) clr = 'bg-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.8)]';
            if (dailyPct === 100) clr = 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]';
            bar.className = `h-full rounded-full transition-all duration-500 ease-out ${clr}`;
        }

        const sortedActions = [...customActionsList].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3) || (a.order ?? 999) - (b.order ?? 999));
        const getSVG = window.getActionSVG || getActionSVG;
        const gridContainer = document.getElementById('daily-actions-grid');
        if (gridContainer) {
            gridContainer.innerHTML = '';

            sortedActions.forEach(cfg => {
                const state = todayTask ? todayTask[cfg.id] : false;
                const cMap = (AppState.twColors && AppState.twColors[cfg.color]) || (AppState.twColors && AppState.twColors['blue']) || { border: 'border-blue-500', iconBg: 'bg-blue-50', text: 'text-blue-500', borderLt: 'border-blue-200', iconColor: 'text-blue-500', hex: '#3b82f6', bgLt: 'bg-blue-50' };

                const cardHtml = `
                    <div id="daily-action-card-${cfg.id}" data-action-id="${cfg.id}" class="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm flex flex-col transition-all duration-300 min-h-[300px] border-2 ${state === true ? cMap.border + ' shadow-lg' : (state === false ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-slate-200 dark:border-slate-700')}">
                        <div class="flex justify-between items-start mb-3 sm:mb-4">
                            <div class="flex items-center space-x-2 sm:space-x-3">
                                <div class="p-2 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl border ${cMap.iconBg} ${cMap.text} ${cMap.borderLt}">
                                    <svg class="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${getSVG(cfg.icon, cfg.title)}</svg>
                                </div>
                                <div>
                                    <h3 class="font-black text-xs sm:text-sm md:text-base tracking-tight">${cfg.title}</h3>
                                    <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <p class="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider">${cfg.desc || cfg.question || ''}</p>
                                        ${cfg.startDate ? `
                                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                                                Start: ${cfg.startDate}
                                            </span>
                                        ` : ''}
                                        ${cfg.track ? `
                                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/30">
                                                ${((window.tracks || []).find(t => t.id === cfg.track)?.name || 'Track')}
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-1 shrink-0">
                                <button onclick="openModal('analytics-modal', '${cfg.id}')" class="group flex items-center justify-center p-2 md:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 shrink-0" title="Analytics"><svg class="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 group-hover:${cMap.iconColor} transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></button>
                                <button onclick="window.openEditDailyActionModal('${cfg.id}')" class="group flex items-center justify-center p-2 md:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 shrink-0" title="Edit Action"><svg class="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                            </div>
                        </div>
                        <div class="flex gap-2 mb-3 sm:mb-4 p-1 md:p-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                            <button id="btn-action-yes-${cfg.id}" class="flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 ${state === true ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.5)] scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}" onclick="setDailyState('${cfg.id}', true)">YES</button>
                            <button id="btn-action-no-${cfg.id}" class="flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 ${state === false ? 'bg-gradient-to-br from-red-400 to-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.4)] scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}" onclick="setDailyState('${cfg.id}', false)">NO</button>
                        </div>
                        <div id="dt-log-${cfg.id}"></div>
                    </div>`;
                gridContainer.innerHTML += cardHtml;
            });
        }

        // Render compact version for Dashboard (Max 4 items per row, auto-fit rows)
        const dashCompactContainer = document.getElementById('dashboard-daily-actions-compact');
        if (dashCompactContainer) {
            dashCompactContainer.innerHTML = '';
            const count = sortedActions.length;

            if (count === 0) {
                dashCompactContainer.className = 'flex flex-col items-center justify-center flex-1 min-h-0 text-center p-3 text-slate-400 dark:text-slate-500';
                dashCompactContainer.style.cssText = '';
                dashCompactContainer.innerHTML = `
                    <span class="text-xl mb-1">🎯</span>
                    <p class="text-[10px] font-bold">No daily actions configured</p>
                    <button onclick="window.switchPage('daily-actions')" class="mt-2 text-[9px] font-black text-blue-500 hover:underline">Add Daily Actions →</button>
                `;
            } else {
                const cols = Math.min(4, Math.max(1, count));
                dashCompactContainer.className = 'grid gap-2 flex-1 min-h-0 overflow-y-auto mt-2 pr-0.5 custom-scrollbar';
                dashCompactContainer.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

                if (count <= 4) {
                    dashCompactContainer.style.gridTemplateRows = 'repeat(1, 1fr)';
                    dashCompactContainer.style.gridAutoRows = 'unset';
                    dashCompactContainer.style.height = '100%';
                } else if (count <= 8) {
                    dashCompactContainer.style.gridTemplateRows = 'repeat(2, 1fr)';
                    dashCompactContainer.style.gridAutoRows = 'unset';
                    dashCompactContainer.style.height = '100%';
                } else {
                    dashCompactContainer.style.gridTemplateRows = 'repeat(2, 1fr)';
                    dashCompactContainer.style.gridAutoRows = 'minmax(58px, 1fr)';
                    dashCompactContainer.style.height = '100%';
                }

                sortedActions.forEach(cfg => {
                    const state = todayTask ? todayTask[cfg.id] : false;
                    const cMap = (AppState.twColors && AppState.twColors[cfg.color]) || (AppState.twColors && AppState.twColors['blue']) || { hex: '#3b82f6', iconBg: 'bg-blue-50', text: 'text-blue-500', borderLt: 'border-blue-200' };
                    const isActive = state === true;

                    const activeStyle = `background-color: ${cMap.hex}; border-color: ${cMap.hex}; color: white; box-shadow: 0 4px 12px ${cMap.hex}33;`;
                    const cardClass = isActive
                        ? `text-white border-transparent`
                        : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-900/60';

                    const compactHtml = `
                        <button id="dashboard-daily-action-btn-${cfg.id}" onclick="window.setDailyState('${cfg.id}')"
                                class="flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl border font-black transition-all duration-300 active:scale-95 text-left w-full h-full min-h-[58px] ${cardClass}"
                                style="${isActive ? activeStyle : ''}">
                            <div class="flex items-center justify-between w-full mb-1">
                                <div class="p-1 rounded-lg ${isActive ? 'bg-white/20 text-white' : cMap.iconBg + ' ' + cMap.text + ' ' + cMap.borderLt + ' border'} shrink-0">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${getSVG(cfg.icon, cfg.title)}</svg>
                                </div>
                                <div class="dashboard-action-badge shrink-0">
                                    ${isActive
                                        ? `<span class="flex h-4 w-4 rounded-full bg-white text-emerald-500 items-center justify-center shadow-sm text-[8px] font-black">✓</span>`
                                        : `<span class="flex h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 items-center justify-center text-[7px] font-black">✕</span>`
                                    }
                                </div>
                            </div>
                            <div class="min-w-0 w-full">
                                <span class="block text-[10px] sm:text-[11px] font-black truncate leading-tight">${cfg.title}</span>
                                <div class="flex items-center justify-between mt-0.5">
                                    <span class="dashboard-action-status-text text-[7px] uppercase tracking-wider font-extrabold opacity-80">${isActive ? 'YES' : 'NO'}</span>
                                    ${cfg.track ? `
                                        <span class="dashboard-action-track-badge inline-block px-1 rounded-[3px] text-[6px] font-black uppercase tracking-widest ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}">
                                            ${((window.tracks || []).find(t => t.id === cfg.track)?.name || 'Track')}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        </button>`;
                    dashCompactContainer.innerHTML += compactHtml;
                });
            }
        }

        const dashPercent = document.getElementById('dashboard-daily-actions-percent');
        const dashBar = document.getElementById('dashboard-daily-actions-progress');
        if (dashPercent && dashBar) {
            dashPercent.textContent = dailyPct + '%';
            dashBar.style.width = dailyPct + '%';
            let clr = 'bg-red-500';
            if (dailyPct >= 25) clr = 'bg-orange-500';
            if (dailyPct >= 50) clr = 'bg-yellow-400';
            if (dailyPct >= 75) clr = 'bg-lime-500';
            if (dailyPct === 100) clr = 'bg-green-500';
            dashBar.className = `h-full rounded-full transition-all duration-500 ease-out ${clr}`;
        }
    }

    /**
     * Renders 180-day mini-heatmap logs into each action card.
     */
    function renderDailyLogs() {
        const today = (typeof Utils !== 'undefined' && typeof Utils.getDailyActionDate === 'function')
            ? Utils.getDailyActionDate()
            : new Date();
        today.setHours(0, 0, 0, 0);

        const fill = (elId, actionObj) => {
            const el = document.getElementById(elId);
            if (!el) return;
            const scrollBox = el.querySelector('.overflow-y-auto');
            const prevScrollTop = scrollBox ? scrollBox.scrollTop : (el._lastScrollTop || 0);

            const key = typeof actionObj === 'object' ? actionObj.id : actionObj;
            const cfgAct = typeof actionObj === 'object' ? actionObj : (window.customActions || []).find(a => a.id === key);

            let actStartDate = (cfgAct && cfgAct.startDate && typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
                ? Utils.parseDateSafe(cfgAct.startDate)
                : null;
            if (actStartDate && isNaN(actStartDate.getTime())) actStartDate = null;
            if (actStartDate) actStartDate.setHours(0, 0, 0, 0);

            const minGridDate = new Date(today);
            minGridDate.setDate(minGridDate.getDate() - 179);
            minGridDate.setHours(0, 0, 0, 0);

            let gridStartDate = minGridDate;
            if (actStartDate && actStartDate > minGridDate) {
                gridStartDate = actStartDate;
            }

            let html = '<div class="grid grid-cols-4 gap-1.5 md:gap-2 overflow-y-auto custom-scrollbar flex-1 pr-1 pb-1 content-start mt-2" style="max-height: 180px; min-height: 150px;">';
            const currDate = new Date(today);
            while (currDate >= gridStartDate) {
                const dStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') ? Utils.formatDate(currDate) : '';
                const isoLocalDate = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}-${String(currDate.getDate()).padStart(2, '0')}`;
                const t = (typeof window.getTaskForDate === 'function') ? window.getTaskForDate(currDate) : null;
                const done = t ? Boolean(t[key]) : false;
                const taskIdOrDate = t ? t.id : isoLocalDate;
                const bgClass = done
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.4)] border-transparent'
                    : 'bg-gradient-to-br from-red-400 to-red-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.4)] border-transparent';
                html += `<button type="button" onclick="toggleModalDay('${taskIdOrDate}', '${key}', event)" title="${dStr}: ${done ? 'YES' : 'NO'}" data-date="${dStr}" data-key="${key}" class="flex flex-col items-center justify-center p-1.5 md:p-2 rounded-xl border active:scale-90 transition-all duration-200 hover:scale-105 ${bgClass} w-full aspect-square focus:outline-none"><span class="text-[7px] md:text-[8px] uppercase font-black opacity-90 mb-0.5 select-none pointer-events-none">${dStr.split(' ')[0]}</span><span class="text-xs md:text-sm font-black leading-none select-none pointer-events-none">${dStr.split(' ')[1]}</span></button>`;
                currDate.setDate(currDate.getDate() - 1);
            }
            html += '</div>';
            el.innerHTML = html;
            el.className = "flex flex-col flex-1 min-h-0 pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-2";

            const newScrollBox = el.querySelector('.overflow-y-auto');
            if (newScrollBox && prevScrollTop > 0) {
                newScrollBox.scrollTop = prevScrollTop;
                newScrollBox.addEventListener('scroll', () => { el._lastScrollTop = newScrollBox.scrollTop; }, { passive: true });
            } else if (newScrollBox) {
                newScrollBox.addEventListener('scroll', () => { el._lastScrollTop = newScrollBox.scrollTop; }, { passive: true });
            }
        };

        const sortedActions = [...(window.customActions || [])].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
        sortedActions.forEach(a => fill(`dt-log-${a.id}`, a));
    }

    /**
     * Sets action check-in status (YES/NO) for today (or selected active date).
     * Performs instant optimistic UI update, cloud persistence, and multi-tab broadcast.
     *
     * @param {string} type - Action ID
     * @param {boolean} [state] - Optional explicit boolean status
     */
    function setDailyState(type, state) {
        if (!type) return;
        const now = (typeof Utils !== 'undefined' && typeof Utils.getDailyActionDate === 'function')
            ? Utils.getDailyActionDate()
            : new Date();
        const todayStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') ? Utils.formatDate(now) : null;
        const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // 1. Locate today's task reliably via getTaskForDate or AppState lookup
        let task = (typeof window.getTaskForDate === 'function') ? window.getTaskForDate(now) : null;
        let idx = -1;
        if (task && AppState.tasks) {
            idx = AppState.tasks.indexOf(task);
        }
        if (idx === -1 && AppState.tasks) {
            idx = AppState.tasks.findIndex(t => t && (t.date === todayStr || t.date === todayISO));
            if (idx > -1) task = AppState.tasks[idx];
        }

        if (!task || idx === -1) {
            const newTask = {
                id: 'task_' + todayISO + '_' + Date.now().toString(36),
                date: todayStr || todayISO,
                note: '',
                updatedAt: Date.now() + (window.serverTimeOffset || 0)
            };
            if (Array.isArray(window.customActions)) {
                window.customActions.forEach(a => { newTask[a.id] = false; });
            }
            if (!AppState.tasks) AppState.tasks = [];
            AppState.tasks.push(newTask);
            idx = AppState.tasks.length - 1;
            task = newTask;
        }

        // Toggle state if not explicitly boolean
        if (typeof state !== 'boolean') {
            state = !Boolean(task[type]);
        }

        task[type] = state;
        task.updatedAt = Date.now() + (window.serverTimeOffset || 0);
        AppState.isLocalDirty = true;

        if (AppState._tasksDateMap) {
            if (task.id) AppState._tasksDateMap.set(String(task.id), task);
            if (task.date) AppState._tasksDateMap.set(task.date, task);
            if (todayStr) AppState._tasksDateMap.set(todayStr, task);
            AppState._tasksDateMap.set(todayISO, task);
        }

        // 1. Instant Optimistic DOM Update for Action Card YES/NO buttons
        const actionObj = (window.customActions || []).find(a => a.id === type);
        const cMap = actionObj ? (AppState.twColors[actionObj.color] || AppState.twColors['blue']) : (AppState.twColors ? AppState.twColors['blue'] : { border: 'border-blue-500', hex: '#3b82f6', iconBg: 'bg-blue-50', text: 'text-blue-500', borderLt: 'border-blue-200' });
        const cardEl = document.getElementById(`daily-action-card-${type}`);
        const btnYes = document.getElementById(`btn-action-yes-${type}`);
        const btnNo = document.getElementById(`btn-action-no-${type}`);

        if (cardEl) {
            cardEl.className = `bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm flex flex-col transition-all duration-300 min-h-[300px] border-2 ${state === true ? cMap.border + ' shadow-lg' : (state === false ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-slate-200 dark:border-slate-700')}`;
        }
        if (btnYes && btnNo) {
            if (state === true) {
                btnYes.className = 'flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.5)] scale-105';
                btnNo.className = 'flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600';
            } else if (state === false) {
                btnYes.className = 'flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600';
                btnNo.className = 'flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 bg-gradient-to-br from-red-400 to-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.4)] scale-105';
            }
        }

        // 2. Instant Optimistic DOM Update for Dashboard Compact Card
        const dashBtn = document.getElementById(`dashboard-daily-action-btn-${type}`);
        if (dashBtn) {
            const isActive = state === true;
            const activeStyle = `background-color: ${cMap.hex}; border-color: ${cMap.hex}; color: white; box-shadow: 0 4px 12px ${cMap.hex}33;`;
            const cardClass = isActive
                ? `flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl border font-black transition-all duration-300 active:scale-95 text-left w-full h-full min-h-[58px] text-white border-transparent`
                : 'flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl border font-black transition-all duration-300 active:scale-95 text-left w-full h-full min-h-[58px] bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-900/60';
            dashBtn.className = cardClass;
            dashBtn.style.cssText = isActive ? activeStyle : '';

            const statusText = dashBtn.querySelector('.dashboard-action-status-text');
            if (statusText) statusText.textContent = isActive ? 'YES' : 'NO';

            const badge = dashBtn.querySelector('.dashboard-action-badge');
            if (badge) {
                badge.innerHTML = isActive
                    ? `<span class="flex h-4 w-4 rounded-full bg-white text-emerald-500 items-center justify-center shadow-sm text-[8px] font-black">✓</span>`
                    : `<span class="flex h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 items-center justify-center text-[7px] font-black">✕</span>`;
            }

            const iconContainer = dashBtn.querySelector('.p-1.rounded-lg');
            if (iconContainer) {
                iconContainer.className = `p-1 rounded-lg ${isActive ? 'bg-white/20 text-white' : cMap.iconBg + ' ' + cMap.text + ' ' + cMap.borderLt + ' border'} shrink-0`;
            }

            const trackBadge = dashBtn.querySelector('.dashboard-action-track-badge');
            if (trackBadge) {
                trackBadge.className = `dashboard-action-track-badge inline-block px-1 rounded-[3px] text-[6px] font-black uppercase tracking-widest ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`;
            }
        }

        // 3. Instant Optimistic DOM Update for Today's Box in dt-log
        const logBox = document.getElementById(`dt-log-${type}`);
        if (logBox) {
            const todayLogBtn = (todayStr && logBox.querySelector(`button[data-date="${todayStr}"]`)) ||
                logBox.querySelector(`button[data-date="${todayISO}"]`) ||
                logBox.querySelector('button');
            if (todayLogBtn) {
                if (state === true) {
                    todayLogBtn.classList.remove('from-red-400', 'to-red-500', 'shadow-[0_2px_8px_rgba(239,68,68,0.4)]');
                    todayLogBtn.classList.add('from-green-400', 'to-emerald-500', 'shadow-[0_2px_8px_rgba(16,185,129,0.4)]');
                    todayLogBtn.title = `${todayStr || todayISO}: YES`;
                } else {
                    todayLogBtn.classList.remove('from-green-400', 'to-emerald-500', 'shadow-[0_2px_8px_rgba(16,185,129,0.4)]');
                    todayLogBtn.classList.add('from-red-400', 'to-red-500', 'shadow-[0_2px_8px_rgba(239,68,68,0.4)]');
                    todayLogBtn.title = `${todayStr || todayISO}: NO`;
                }
                todayLogBtn.classList.add('scale-110');
                setTimeout(() => todayLogBtn.classList.remove('scale-110'), 120);
            }
        }

        // 4. Instant Progress Bar & Percentage Updates
        let c = 0;
        (window.customActions || []).forEach(a => { if (task && task[a.id]) c++; });
        const dailyPct = (window.customActions && window.customActions.length > 0) ? Math.round((c / window.customActions.length) * 100) : 0;

        const bar = document.getElementById('daily-actions-progress');
        if (bar) {
            bar.style.width = dailyPct + '%';
            if (typeof safeSetText === 'function') safeSetText('daily-actions-percent', dailyPct + '%');
            let clr = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]';
            if (dailyPct >= 25) clr = 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]';
            if (dailyPct >= 50) clr = 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]';
            if (dailyPct >= 75) clr = 'bg-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.8)]';
            if (dailyPct === 100) clr = 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]';
            bar.className = `h-full rounded-full transition-all duration-500 ease-out ${clr}`;
        }
        const dashPercent = document.getElementById('dashboard-daily-actions-percent');
        const dashBar = document.getElementById('dashboard-daily-actions-progress');
        if (dashPercent && dashBar) {
            dashPercent.textContent = dailyPct + '%';
            dashBar.style.width = dailyPct + '%';
            let clr = 'bg-red-500';
            if (dailyPct >= 25) clr = 'bg-orange-500';
            if (dailyPct >= 50) clr = 'bg-yellow-400';
            if (dailyPct >= 75) clr = 'bg-lime-500';
            if (dailyPct === 100) clr = 'bg-green-500';
            dashBar.className = `h-full rounded-full transition-all duration-500 ease-out ${clr}`;
        }

        // 4b. Instant The X Commitments Habit Radar & Trend Line Charts sync
        if (typeof window.renderSpectraCommitmentsChart === 'function') {
            window.renderSpectraCommitmentsChart();
        }
        if (typeof renderTrendCharts === 'function') {
            renderTrendCharts();
        }
        const dbModalSync = document.getElementById('daily-actions-db-modal');
        if (dbModalSync && !dbModalSync.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') {
            window.openDailyActionsDBModal();
        }

        // 5. Broadcast to other open tabs for <2ms local synchronization
        if (window.X29SyncChannel) {
            try {
                window.X29SyncChannel.postMessage({
                    type: 'DAILY_ACTION_UPDATE',
                    actionId: type,
                    state: state,
                    dateStr: todayStr || todayISO,
                    timestamp: Date.now()
                });
            } catch (e) {}
        }

        // 6. Fast Cross-Device Cloud Save (auto-batched Firestore write)
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud(false);
        }

        // 7. Debounced background UI & charts refresh
        if (window._gridToggleDebounce) clearTimeout(window._gridToggleDebounce);
        window._gridToggleDebounce = setTimeout(() => {
            requestAnimationFrame(() => {
                if (typeof window.renderSpectraCommitmentsChart === 'function') window.renderSpectraCommitmentsChart();
                const dbModal = document.getElementById('daily-actions-db-modal');
                if (dbModal && !dbModal.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') {
                    window.openDailyActionsDBModal();
                }
                if (typeof renderTrendCharts === 'function') renderTrendCharts();
            });
        }, 120);
    }

    /**
     * Toggles an action's completion state for any specific day
     * (used in 180-day mini-heatmaps and analytics contribution heatmap).
     *
     * @param {string|number} taskIdOrDate
     * @param {string} typeKey - Action ID
     * @param {Event} [evt]
     */
    function toggleModalDay(taskIdOrDate, typeKey, evt) {
        if (!taskIdOrDate || !typeKey) return;

        let taskIndex = (AppState.tasks || []).findIndex(t => t && (String(t.id) === String(taskIdOrDate) || t.date === taskIdOrDate));
        let newState = true;
        let taskDateStr = '';

        if (taskIndex === -1 && typeof taskIdOrDate === 'string' && taskIdOrDate.trim()) {
            const dObj = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function') ? Utils.parseDateSafe(taskIdOrDate) : new Date(taskIdOrDate);
            if (dObj && !isNaN(dObj.getTime())) {
                const existingTask = (typeof window.getTaskForDate === 'function') ? window.getTaskForDate(dObj) : null;
                if (existingTask) {
                    taskIndex = AppState.tasks.indexOf(existingTask);
                    if (taskIndex > -1) {
                        newState = !Boolean(AppState.tasks[taskIndex][typeKey]);
                        AppState.tasks[taskIndex][typeKey] = newState;
                        taskDateStr = AppState.tasks[taskIndex].date || (typeof Utils !== 'undefined' ? Utils.formatDate(dObj) : '');
                    }
                } else {
                    const dateStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') ? Utils.formatDate(dObj) : '';
                    const isoDate = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
                    taskDateStr = dateStr;
                    const newTask = {
                        id: 'task_' + isoDate + '_' + Date.now().toString(36),
                        date: dateStr,
                        note: '',
                        updatedAt: Date.now() + (window.serverTimeOffset || 0)
                    };
                    if (Array.isArray(window.customActions)) {
                        window.customActions.forEach(a => { newTask[a.id] = false; });
                    }
                    newTask[typeKey] = true;
                    newState = true;
                    if (!AppState.tasks) AppState.tasks = [];
                    AppState.tasks.push(newTask);
                    taskIndex = AppState.tasks.length - 1;
                }
            }
        } else if (taskIndex > -1) {
            newState = !Boolean(AppState.tasks[taskIndex][typeKey]);
            AppState.tasks[taskIndex][typeKey] = newState;
            taskDateStr = AppState.tasks[taskIndex].date || '';
        }

        if (taskIndex > -1) {
            const updatedTask = AppState.tasks[taskIndex];
            updatedTask.updatedAt = Date.now() + (window.serverTimeOffset || 0);
            AppState.isLocalDirty = true;

            if (AppState._tasksDateMap) {
                if (updatedTask.id) AppState._tasksDateMap.set(String(updatedTask.id), updatedTask);
                if (updatedTask.date) {
                    AppState._tasksDateMap.set(updatedTask.date, updatedTask);
                    const d = (typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function') ? Utils.parseDateSafe(updatedTask.date) : new Date(updatedTask.date);
                    if (d && !isNaN(d.getTime())) {
                        const isoKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        AppState._tasksDateMap.set(isoKey, updatedTask);
                    }
                }
            }

            // 1. Instant Optimistic DOM Update — target ONLY the exact clicked button via event
            const evtTarget = (evt && evt.target) || (window.event && window.event.target) || null;
            const clickedBtn = evtTarget ? evtTarget.closest('button[onclick*="toggleModalDay"]') : null;
            if (clickedBtn) {
                const isHeatmapSquare = clickedBtn.hasAttribute('data-datekey');
                if (isHeatmapSquare) {
                    const actionObj = (window.customActions || []).find(a => a.id === typeKey);
                    const cMap = actionObj ? (AppState.twColors[actionObj.color] || AppState.twColors['blue']) : (AppState.twColors ? AppState.twColors['blue'] : { hex: '#10b981' });
                    const hexColor = (cMap && cMap.hex) || '#10b981';

                    if (newState) {
                        clickedBtn.style.backgroundColor = hexColor;
                        clickedBtn.style.borderColor = hexColor;
                        clickedBtn.style.boxShadow = `0 0 6px ${hexColor}55`;
                        clickedBtn.className = clickedBtn.className.replace(/bg-slate-[^\s]+/g, '').replace(/border-slate-[^\s]+/g, '');
                        clickedBtn.innerHTML = `<svg class="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white pointer-events-none drop-shadow-sm" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
                        clickedBtn.setAttribute('data-done', 'true');
                        clickedBtn.setAttribute('data-status', 'Completed (YES)');
                    } else {
                        clickedBtn.style.backgroundColor = '';
                        clickedBtn.style.borderColor = '';
                        clickedBtn.style.boxShadow = '';
                        clickedBtn.innerHTML = `<span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600/70 pointer-events-none"></span>`;
                        clickedBtn.setAttribute('data-done', 'false');
                        clickedBtn.setAttribute('data-status', 'Missed (NO)');
                    }
                } else {
                    if (newState) {
                        clickedBtn.classList.remove('from-red-400', 'to-red-500', 'shadow-[0_2px_8px_rgba(239,68,68,0.4)]');
                        clickedBtn.classList.add('from-green-400', 'to-emerald-500', 'shadow-[0_2px_8px_rgba(16,185,129,0.4)]');
                        if (clickedBtn.title) clickedBtn.title = clickedBtn.title.replace(': NO', ': YES');
                    } else {
                        clickedBtn.classList.remove('from-green-400', 'to-emerald-500', 'shadow-[0_2px_8px_rgba(16,185,129,0.4)]');
                        clickedBtn.classList.add('from-red-400', 'to-red-500', 'shadow-[0_2px_8px_rgba(239,68,68,0.4)]');
                        if (clickedBtn.title) clickedBtn.title = clickedBtn.title.replace(': YES', ': NO');
                    }
                }
                clickedBtn.classList.add('scale-110');
                setTimeout(() => clickedBtn.classList.remove('scale-110'), 120);
            }

            // If today was updated, also update today's buttons optimistically
            const today = new Date();
            const getTaskD = (typeof getTaskDate === 'function')
                ? getTaskDate(updatedTask)
                : ((typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function') ? Utils.parseDateSafe(updatedTask.date) : new Date(updatedTask.date));
            const taskD = getTaskD;
            const isToday = taskD && !isNaN(taskD.getTime()) &&
                taskD.getFullYear() === today.getFullYear() &&
                taskD.getMonth() === today.getMonth() &&
                taskD.getDate() === today.getDate();

            if (isToday) {
                const actionObj = (window.customActions || []).find(a => a.id === typeKey);
                const cMap = actionObj ? (AppState.twColors[actionObj.color] || AppState.twColors['blue']) : (AppState.twColors ? AppState.twColors['blue'] : { border: 'border-blue-500', hex: '#3b82f6', iconBg: 'bg-blue-50', text: 'text-blue-500', borderLt: 'border-blue-200' });
                const cardEl = document.getElementById(`daily-action-card-${typeKey}`);
                const btnYes = document.getElementById(`btn-action-yes-${typeKey}`);
                const btnNo = document.getElementById(`btn-action-no-${typeKey}`);

                if (cardEl) {
                    cardEl.className = `bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm flex flex-col transition-all duration-300 min-h-[300px] border-2 ${newState === true ? cMap.border + ' shadow-lg' : (newState === false ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-slate-200 dark:border-slate-700')}`;
                }
                if (btnYes && btnNo) {
                    if (newState === true) {
                        btnYes.className = 'flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.5)] scale-105';
                        btnNo.className = 'flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600';
                    } else if (newState === false) {
                        btnYes.className = 'flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600';
                        btnNo.className = 'flex-1 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-90 bg-gradient-to-br from-red-400 to-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.4)] scale-105';
                    }
                }

                const dashBtn = document.getElementById(`dashboard-daily-action-btn-${typeKey}`);
                if (dashBtn) {
                    const isActive = newState === true;
                    const activeStyle = `background-color: ${cMap.hex}; border-color: ${cMap.hex}; color: white; box-shadow: 0 4px 12px ${cMap.hex}33;`;
                    dashBtn.className = isActive
                        ? `flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl border font-black transition-all duration-300 active:scale-95 text-left w-full h-full min-h-[58px] text-white border-transparent`
                        : 'flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl border font-black transition-all duration-300 active:scale-95 text-left w-full h-full min-h-[58px] bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-900/60';
                    dashBtn.style.cssText = isActive ? activeStyle : '';

                    const statusText = dashBtn.querySelector('.dashboard-action-status-text');
                    if (statusText) statusText.textContent = isActive ? 'YES' : 'NO';

                    const badge = dashBtn.querySelector('.dashboard-action-badge');
                    if (badge) {
                        badge.innerHTML = isActive
                            ? `<span class="flex h-4 w-4 rounded-full bg-white text-emerald-500 items-center justify-center shadow-sm text-[8px] font-black">✓</span>`
                            : `<span class="flex h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 items-center justify-center text-[7px] font-black">✕</span>`;
                    }

                    const iconContainer = dashBtn.querySelector('.p-1.rounded-lg');
                    if (iconContainer) {
                        iconContainer.className = `p-1 rounded-lg ${isActive ? 'bg-white/20 text-white' : cMap.iconBg + ' ' + cMap.text + ' ' + cMap.borderLt + ' border'} shrink-0`;
                    }

                    const trackBadge = dashBtn.querySelector('.dashboard-action-track-badge');
                    if (trackBadge) {
                        trackBadge.className = `dashboard-action-track-badge inline-block px-1 rounded-[3px] text-[6px] font-black uppercase tracking-widest ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`;
                    }
                }

                // Update Progress Bar
                let c = 0;
                (window.customActions || []).forEach(a => { if (updatedTask[a.id]) c++; });
                const dailyPct = (window.customActions && window.customActions.length > 0) ? Math.round((c / window.customActions.length) * 100) : 0;
                const bar = document.getElementById('daily-actions-progress');
                if (bar) {
                    bar.style.width = dailyPct + '%';
                    if (typeof safeSetText === 'function') safeSetText('daily-actions-percent', dailyPct + '%');
                    let clr = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]';
                    if (dailyPct >= 25) clr = 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]';
                    if (dailyPct >= 50) clr = 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]';
                    if (dailyPct >= 75) clr = 'bg-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.8)]';
                    if (dailyPct === 100) clr = 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]';
                    bar.className = `h-full rounded-full transition-all duration-500 ease-out ${clr}`;
                }
                const dashPercent = document.getElementById('dashboard-daily-actions-percent');
                const dashBar = document.getElementById('dashboard-daily-actions-progress');
                if (dashPercent && dashBar) {
                    dashPercent.textContent = dailyPct + '%';
                    dashBar.style.width = dailyPct + '%';
                    let clr = 'bg-red-500';
                    if (dailyPct >= 25) clr = 'bg-orange-500';
                    if (dailyPct >= 50) clr = 'bg-yellow-400';
                    if (dailyPct >= 75) clr = 'bg-lime-500';
                    if (dailyPct === 100) clr = 'bg-green-500';
                    dashBar.className = `h-full rounded-full transition-all duration-500 ease-out ${clr}`;
                }
            }

            // Instant The X Commitments Habit Radar & Trend Line Charts sync
            if (typeof window.renderSpectraCommitmentsChart === 'function') {
                window.renderSpectraCommitmentsChart();
            }
            if (typeof renderTrendCharts === 'function') {
                renderTrendCharts();
            }
            const dbModalSync = document.getElementById('daily-actions-db-modal');
            if (dbModalSync && !dbModalSync.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') {
                window.openDailyActionsDBModal();
            }

            // 2. Broadcast to other open browser tabs for <2ms instant sync
            if (window.X29SyncChannel) {
                try {
                    window.X29SyncChannel.postMessage({
                        type: 'DAILY_ACTION_UPDATE',
                        actionId: typeKey,
                        taskIdOrDate: taskIdOrDate,
                        newState: newState,
                        timestamp: Date.now()
                    });
                } catch (e) {}
            }

            // 3. Realtime Cross-Device Cloud Synchronization (auto-batched Firestore write)
            if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
                window.FirebaseService.saveToCloud(false);
            }

            // 4. Schedule debounced full UI & chart updates for 60 FPS performance during fast clicks
            if (window._gridToggleDebounce) clearTimeout(window._gridToggleDebounce);
            window._gridToggleDebounce = setTimeout(() => {
                requestAnimationFrame(() => {
                    if (typeof renderTrendCharts === 'function') renderTrendCharts();
                    if (typeof window.renderSpectraCommitmentsChart === 'function') window.renderSpectraCommitmentsChart();
                    const modal = document.getElementById('analytics-modal');
                    if (modal && !modal.classList.contains('hidden') && typeof populateAnalyticsModal === 'function') populateAnalyticsModal(typeKey);
                    const dbModal = document.getElementById('daily-actions-db-modal');
                    if (dbModal && !dbModal.classList.contains('hidden') && typeof window.openDailyActionsDBModal === 'function') window.openDailyActionsDBModal();
                });
            }, 120);
        }
    }

    // ==========================================
    // ACTION ANALYTICS MODAL & HEATMAP ENGINE
    // ==========================================
    let actionAnalyticsHeatmapRange = window.actionAnalyticsHeatmapRange || 180;

    function setActionAnalyticsRange(days) {
        window.actionAnalyticsHeatmapRange = days;
        actionAnalyticsHeatmapRange = days;
        if (window.currentAnalyticsAction && typeof window.populateAnalyticsModal === 'function') {
            window.populateAnalyticsModal(window.currentAnalyticsAction);
        }
    }

    function showActionHeatmapTooltip(e, el) {
        const tooltip = document.getElementById('am-heatmap-tooltip');
        if (!tooltip) return;

        const date = el.getAttribute('data-date');
        const status = el.getAttribute('data-status');
        const isDone = el.getAttribute('data-done') === 'true';
        const badgeClass = isDone
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30';
        const action = el.getAttribute('data-action') || 'Daily Action';

        tooltip.innerHTML = `
            <div class="text-[9px] text-slate-400 uppercase tracking-widest font-black">${action}</div>
            <div class="text-[10px] text-slate-200 font-bold">${date}</div>
            <div class="flex items-center gap-2 mt-1">
                <span class="text-xs font-black text-white">${status}</span>
                <span class="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${badgeClass}">${isDone ? '✓ DONE' : '✕ MISSED'}</span>
            </div>
            <div class="text-[8px] text-slate-400 font-bold mt-1 pt-1 border-t border-white/10">Click square to toggle check-in</div>
        `;

        tooltip.classList.remove('hidden');
        moveActionHeatmapTooltip(e);
    }

    function moveActionHeatmapTooltip(e) {
        const tooltip = document.getElementById('am-heatmap-tooltip');
        if (!tooltip || tooltip.classList.contains('hidden')) return;

        const tooltipWidth = tooltip.offsetWidth || 180;
        const tooltipHeight = tooltip.offsetHeight || 60;
        let x = e.clientX + 12;
        let y = e.clientY - tooltipHeight - 10;

        if (x + tooltipWidth > window.innerWidth - 10) {
            x = e.clientX - tooltipWidth - 12;
        }
        if (y < 10) {
            y = e.clientY + 20;
        }

        tooltip.style.left = `${Math.max(10, x)}px`;
        tooltip.style.top = `${Math.max(10, y)}px`;
    }

    function hideActionHeatmapTooltip() {
        const tooltip = document.getElementById('am-heatmap-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    }

    /**
     * Populates the Action Analytics modal for a specific daily action:
     * Streak counter, total completed, completion percentage,
     * range-selectable GitHub-style contribution heatmap, and quick check-ins grid.
     *
     * @param {string} typeKey - Action ID
     */
    function populateAnalyticsModal(typeKey) {
        window.currentAnalyticsAction = typeKey;
        const cfgAct = (window.customActions || []).find(a => a.id === typeKey);
        if (!cfgAct) return;
        const cMap = (AppState.twColors && AppState.twColors[cfgAct.color]) || (AppState.twColors && AppState.twColors['blue']) || { bgLt: 'bg-blue-50', text: 'text-blue-500', borderLt: 'border-blue-200', hex: '#3b82f6', btn: 'bg-blue-500' };

        if (typeof safeSetText === 'function') safeSetText('am-title', cfgAct.title + " Analytics");
        if (typeof safeSetClass === 'function') {
            safeSetClass('am-icon-box', `p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl shadow-inner shrink-0 ${cMap.bgLt} ${cMap.text}`);

            const statBoxes = ['am-stat-box-1', 'am-stat-box-2', 'am-stat-box-3'];
            statBoxes.forEach(id => safeSetClass(id, `p-2.5 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-3xl border shadow-sm flex flex-col justify-center ${cMap.bgLt} ${cMap.borderLt}`));

            const statLabels = ['am-stat-label-1', 'am-stat-label-2', 'am-stat-label-3'];
            statLabels.forEach(id => safeSetClass(id, `block text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 sm:mb-1 md:mb-1.5 leading-tight ${cMap.text}`));
        }

        const today = (typeof Utils !== 'undefined' && typeof Utils.getDailyActionDate === 'function')
            ? Utils.getDailyActionDate()
            : new Date();
        today.setHours(0, 0, 0, 0);

        let actStartDate = (cfgAct.startDate && typeof Utils !== 'undefined' && typeof Utils.parseDateSafe === 'function')
            ? Utils.parseDateSafe(cfgAct.startDate)
            : null;
        if (actStartDate && isNaN(actStartDate.getTime())) actStartDate = null;
        if (actStartDate) actStartDate.setHours(0, 0, 0, 0);

        const minGridDate = new Date(today);
        minGridDate.setDate(minGridDate.getDate() - 179);
        minGridDate.setHours(0, 0, 0, 0);

        let gridStartDate = minGridDate;
        if (actStartDate && actStartDate > minGridDate) {
            gridStartDate = actStartDate;
        }

        let statsStartDate = actStartDate || gridStartDate;

        let total = 0;
        let possibleDays = 0;
        let streak = 0;
        let streakActive = true;
        let longestStreak = 0;
        let tempStreak = 0;

        // Calculate current streak and total backwards from today
        const checkDate = new Date(today);
        while (checkDate >= statsStartDate) {
            possibleDays++;
            const t = (typeof window.getTaskForDate === 'function') ? window.getTaskForDate(checkDate) : null;
            const done = t ? Boolean(t[typeKey]) : false;
            if (done) {
                total++;
                if (streakActive) streak++;
            } else {
                streakActive = false;
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Calculate longest historical streak forward from statsStartDate
        const streakIter = new Date(statsStartDate);
        while (streakIter <= today) {
            const t = (typeof window.getTaskForDate === 'function') ? window.getTaskForDate(streakIter) : null;
            const done = t ? Boolean(t[typeKey]) : false;
            if (done) {
                tempStreak++;
                if (tempStreak > longestStreak) longestStreak = tempStreak;
            } else {
                tempStreak = 0;
            }
            streakIter.setDate(streakIter.getDate() + 1);
        }

        if (typeof safeSetText === 'function') {
            safeSetText('am-total', total);
            safeSetText('am-streak', streak + ' Days');
            const pct = possibleDays > 0 ? Math.round((total / possibleDays) * 100) : 0;
            safeSetText('am-percent', pct + '%');
        }
        const valClass = `text-base sm:text-2xl md:text-5xl font-black drop-shadow-sm mt-0.5 sm:mt-1 ${cMap.text}`;
        if (typeof safeSetClass === 'function') {
            safeSetClass('am-total', valClass);
            safeSetClass('am-streak', valClass);
            safeSetClass('am-percent', valClass);
        }

        // CONTRIBUTION HEATMAP TREND
        const heatmapGridEl = document.getElementById('am-heatmap-grid');
        const pulseDot = document.getElementById('am-heatmap-pulse-dot');
        if (pulseDot) {
            pulseDot.style.backgroundColor = cMap.hex;
        }
        const legendActive = document.getElementById('am-legend-active');
        if (legendActive) {
            legendActive.style.backgroundColor = cMap.hex;
            legendActive.style.boxShadow = `0 0 6px ${cMap.hex}66`;
        }

        const rangeDays = window.actionAnalyticsHeatmapRange || 180;

        // Update range selector pill styling
        [90, 180, 365].forEach(r => {
            const btn = document.getElementById(`am-range-${r}`);
            if (btn) {
                if (r === rangeDays) {
                    btn.className = `px-2 sm:px-2.5 py-1 rounded-lg transition-all text-white shadow-sm font-black ${cMap.btn || 'bg-blue-500'}`;
                } else {
                    btn.className = 'px-2 sm:px-2.5 py-1 rounded-lg transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold';
                }
            }
        });

        if (heatmapGridEl) {
            const heatmapStartDate = new Date(today);
            heatmapStartDate.setDate(heatmapStartDate.getDate() - (rangeDays - 1));
            heatmapStartDate.setHours(0, 0, 0, 0);

            // Align heatmap start date to Sunday (day 0) for consistent 7-row grid alignment
            const startDayOfWeek = heatmapStartDate.getDay();
            if (startDayOfWeek !== 0) {
                heatmapStartDate.setDate(heatmapStartDate.getDate() - startDayOfWeek);
            }

            const weeks = [];
            let currentWeek = [];
            let curr = new Date(heatmapStartDate);

            let totalHitsInRange = 0;
            let totalDaysInRange = 0;

            while (curr <= today || currentWeek.length > 0) {
                const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
                const isFuture = curr > today;
                const isToday = curr.getTime() === today.getTime();
                const dStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') ? Utils.formatDate(curr) : '';

                let done = false;
                let taskIdOrDate = key;

                if (!isFuture) {
                    totalDaysInRange++;
                    const t = (typeof window.getTaskForDate === 'function') ? window.getTaskForDate(curr) : null;
                    done = t ? Boolean(t[typeKey]) : false;
                    if (t) taskIdOrDate = t.id;
                    if (done) totalHitsInRange++;
                }

                currentWeek.push({
                    date: new Date(curr),
                    dateKey: key,
                    dStr: dStr,
                    isoLocalDate: key,
                    taskIdOrDate: taskIdOrDate,
                    done: done,
                    isFuture: isFuture,
                    isToday: isToday,
                    dayOfWeek: curr.getDay(),
                    month: curr.getMonth(),
                    dayOfMonth: curr.getDate()
                });

                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }

                curr.setDate(curr.getDate() + 1);
                if (isFuture && currentWeek.length === 0) break;
            }

            // Summary text update
            const summaryEl = document.getElementById('am-heatmap-summary');
            if (summaryEl) {
                const rangePct = totalDaysInRange > 0 ? Math.round((totalHitsInRange / totalDaysInRange) * 100) : 0;
                summaryEl.innerHTML = `
                    <span><strong class="${cMap.text}">${totalHitsInRange}</strong> / ${totalDaysInRange} days completed (${rangePct}%)</span>
                    <span class="opacity-40">•</span>
                    <span>Best Streak: <strong class="${cMap.text}">${longestStreak}d 🔥</strong></span>
                `;
            }

            // Render Month Labels Row
            let monthLabelsHtml = `<div class="flex items-center text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-1 pl-7 gap-1">`;
            let prevMonth = -1;
            weeks.forEach((wk) => {
                const firstDayOfWeek = wk[0].date;
                const month = firstDayOfWeek.getMonth();
                if (month !== prevMonth) {
                    const monthName = firstDayOfWeek.toLocaleDateString(undefined, { month: 'short' });
                    monthLabelsHtml += `<span class="shrink-0 text-left text-[9px] font-black uppercase tracking-wider overflow-visible select-none" style="width: 15px;">${monthName}</span>`;
                    prevMonth = month;
                } else {
                    monthLabelsHtml += `<span class="shrink-0" style="width: 15px;"></span>`;
                }
            });
            monthLabelsHtml += `</div>`;

            // Render 7 Day Rows (Sunday to Saturday)
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            let gridRowsHtml = '';

            for (let d = 0; d < 7; d++) {
                const dayLabel = (d === 1 || d === 3 || d === 5) ? dayNames[d] : '';
                gridRowsHtml += `<div class="flex items-center gap-1 my-[1.5px]">`;
                gridRowsHtml += `<span class="w-6 text-[9px] font-bold text-slate-400 dark:text-slate-500 shrink-0 text-right pr-1 select-none leading-none">${dayLabel}</span>`;
                gridRowsHtml += `<div class="flex items-center gap-1">`;

                weeks.forEach((wk) => {
                    const dayObj = wk[d];
                    if (!dayObj) {
                        gridRowsHtml += `<div class="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-[15px] md:h-[15px] rounded-[3px] opacity-0 pointer-events-none shrink-0"></div>`;
                        return;
                    }

                    if (dayObj.isFuture) {
                        gridRowsHtml += `<div class="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-[15px] md:h-[15px] rounded-[3px] bg-slate-100/30 dark:bg-slate-800/20 border border-slate-200/20 dark:border-slate-800/20 opacity-25 shrink-0 pointer-events-none"></div>`;
                        return;
                    }

                    const done = dayObj.done;
                    let cellStyle = '';
                    let cellClass = '';
                    let innerIcon = '';

                    if (done) {
                        cellClass = `w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-[15px] md:h-[15px] cursor-pointer transition-all duration-150 hover:scale-125 hover:z-20 shrink-0 rounded-[3px] flex items-center justify-center shadow-sm`;
                        cellStyle = `background-color: ${cMap.hex}; border: 1px solid ${cMap.hex}; box-shadow: 0 0 6px ${cMap.hex}55;`;
                        innerIcon = `<svg class="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white pointer-events-none drop-shadow-sm" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
                    } else {
                        cellClass = `w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-[15px] md:h-[15px] cursor-pointer transition-all duration-150 hover:scale-125 hover:z-20 shrink-0 rounded-[3px] bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/50 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500 flex items-center justify-center`;
                        innerIcon = `<span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600/70 pointer-events-none"></span>`;
                    }

                    if (dayObj.isToday) {
                        cellClass += ` ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900`;
                    }

                    const formattedDate = dayObj.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    const statusText = done ? 'Completed (YES)' : 'Missed (NO)';

                    gridRowsHtml += `<button type="button" class="${cellClass}" style="${cellStyle}"
                        title="${formattedDate}: ${statusText}"
                        data-date="${formattedDate}"
                        data-datekey="${dayObj.dateKey}"
                        data-status="${statusText}"
                        data-done="${done}"
                        data-action="${cfgAct.title}"
                        onclick="window.toggleModalDay('${dayObj.taskIdOrDate}', '${typeKey}', event)"
                        onmouseenter="window.showActionHeatmapTooltip(event, this)"
                        onmousemove="window.moveActionHeatmapTooltip(event)"
                        onmouseleave="window.hideActionHeatmapTooltip()">${innerIcon}</button>`;
                });

                gridRowsHtml += `</div></div>`;
            }

            heatmapGridEl.innerHTML = monthLabelsHtml + gridRowsHtml;
        }

        // Clean up masterLineChart instance if present
        if (AppState.masterLineChart && typeof AppState.masterLineChart.destroy === 'function') {
            AppState.masterLineChart.destroy();
            AppState.masterLineChart = null;
        }

        // Render Quick Check-ins Grid
        const grid = document.getElementById('am-grid');
        if (grid) {
            let gHtml = '';
            const currDate = new Date(today);
            while (currDate >= gridStartDate) {
                const dStr = (typeof Utils !== 'undefined' && typeof Utils.formatDate === 'function') ? Utils.formatDate(currDate) : '';
                const isoLocalDate = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}-${String(currDate.getDate()).padStart(2, '0')}`;
                const t = (typeof window.getTaskForDate === 'function') ? window.getTaskForDate(currDate) : null;
                const done = t ? Boolean(t[typeKey]) : false;
                const taskIdOrDate = t ? t.id : isoLocalDate;
                const btnClass = done ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[0_2px_8px_rgba(34,197,94,0.4)] border-transparent' : 'bg-gradient-to-br from-red-400 to-red-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.4)] border-transparent';
                gHtml += `<button onclick="toggleModalDay('${taskIdOrDate}', '${typeKey}', event)" title="${dStr}: ${done ? 'YES' : 'NO'}" class="flex flex-col items-center justify-center p-1 sm:p-1.5 md:p-2 rounded-lg sm:rounded-xl ${btnClass} transition-all duration-300 w-full aspect-square shrink-0 hover:scale-105 active:scale-90 focus:outline-none snap-start"><span class="text-[6px] sm:text-[7px] md:text-[9px] uppercase font-black opacity-90 mb-0.5">${dStr.split(' ')[0]}</span><span class="text-[9px] sm:text-[11px] md:text-sm font-black leading-none">${dStr.split(' ')[1]}</span></button>`;
                currDate.setDate(currDate.getDate() - 1);
            }
            grid.innerHTML = gHtml;
        }
    }

    // ==========================================
    // DAILY ACTION CRUD OPERATIONS
    // ==========================================

    /**
     * Reads form fields from "Create Daily Action Tracker" accordion,
     * validates uniqueness, generates unique ID, and appends to window.customActions.
     */
    function appendNewAction() {
        const titleEl = document.getElementById('add-act-title');
        const descEl = document.getElementById('add-act-desc');
        const startDateEl = document.getElementById('add-act-start-date');
        const colorEl = document.getElementById('add-act-color');
        const iconEl = document.getElementById('add-act-icon');
        const trackEl = document.getElementById('add-act-track');

        const title = titleEl ? titleEl.value.trim() : '';
        const desc = descEl ? descEl.value.trim() : '';
        const startDate = startDateEl ? startDateEl.value : '';
        const color = colorEl ? colorEl.value : 'indigo';
        const icon = iconEl ? iconEl.value : 'generic';
        const track = trackEl ? trackEl.value : '';

        if (!title) {
            if (typeof showToast === 'function') showToast("Action title required.", "error");
            return;
        }

        if (!Array.isArray(window.customActions)) {
            window.customActions = [];
        }

        if (window.customActions.some(a => (a.title || '').toLowerCase() === title.toLowerCase())) {
            if (typeof showToast === 'function') showToast("Daily Action Tracker with this title already exists.", "error");
            return;
        }

        const slug = 'act_' + (title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '') || Date.now());
        const nextPriority = window.customActions.length + 1;

        const newAction = {
            id: slug,
            title: title,
            question: desc || `Did you complete ${title}?`,
            desc: desc,
            startDate: startDate,
            color: color,
            icon: icon,
            track: track,
            priority: nextPriority,
            order: nextPriority
        };

        window.customActions.push(newAction);

        if (Array.isArray(window.tasks)) {
            window.tasks.forEach(t => {
                if (t[newAction.id] === undefined) t[newAction.id] = false;
            });
        }

        if (titleEl) titleEl.value = '';
        if (descEl) descEl.value = '';
        if (startDateEl) startDateEl.value = '';
        if (trackEl) trackEl.value = '';

        if (typeof window.sortAllCustomData === 'function') {
            window.sortAllCustomData();
        }

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        if (typeof renderUI === 'function') {
            renderUI();
        } else {
            renderDailyTracker();
            renderDailyLogs();
        }
        if (typeof showToast === 'function') {
            showToast("Daily Action Tracker created & added to The X Commitments!", "success");
        }
    }

    /**
     * Opens modal to edit an existing action's title, description, start date, color, icon, track.
     *
     * @param {string} actionId
     */
    function openEditDailyActionModal(actionId) {
        const act = (window.customActions || []).find(a => a.id === actionId);
        if (!act) {
            if (typeof showToast === 'function') showToast("Action not found", "error");
            return;
        }

        const idEl = document.getElementById('edam-action-id');
        const titleEl = document.getElementById('edam-action-title');
        const descEl = document.getElementById('edam-action-desc');
        const startDateEl = document.getElementById('edam-action-start-date');
        const colorEl = document.getElementById('edam-action-color');
        const iconEl = document.getElementById('edam-action-icon');
        const trackEl = document.getElementById('edam-action-track');

        if (idEl) idEl.value = act.id;
        if (titleEl) titleEl.value = act.title || '';
        if (descEl) descEl.value = act.desc || act.question || '';
        if (startDateEl) startDateEl.value = act.startDate || '';
        if (colorEl) colorEl.value = act.color || 'indigo';
        if (iconEl) iconEl.value = act.icon || 'generic';

        if (typeof window.populateTrackDropdowns === 'function') {
            window.populateTrackDropdowns();
        }
        if (trackEl) trackEl.value = act.track || '';

        if (typeof window.openModal === 'function') {
            window.openModal('edit-daily-action-modal');
        }
    }

    /**
     * Saves changes from the edit daily action modal.
     */
    function saveDailyActionEditModal() {
        const idEl = document.getElementById('edam-action-id');
        const titleEl = document.getElementById('edam-action-title');
        const descEl = document.getElementById('edam-action-desc');
        const startDateEl = document.getElementById('edam-action-start-date');
        const colorEl = document.getElementById('edam-action-color');
        const iconEl = document.getElementById('edam-action-icon');
        const trackEl = document.getElementById('edam-action-track');

        const actionId = idEl ? idEl.value : '';
        const title = titleEl ? titleEl.value.trim() : '';
        const desc = descEl ? descEl.value.trim() : '';
        const startDate = startDateEl ? startDateEl.value : '';
        const color = colorEl ? colorEl.value : 'indigo';
        const icon = iconEl ? iconEl.value : 'generic';
        const track = trackEl ? trackEl.value : '';

        if (!title) {
            if (typeof showToast === 'function') showToast("Action title is required.", "error");
            return;
        }

        const actIndex = (window.customActions || []).findIndex(a => a.id === actionId);
        if (actIndex === -1) {
            if (typeof showToast === 'function') showToast("Action not found.", "error");
            return;
        }

        if (window.customActions.some((a, idx) => idx !== actIndex && (a.title || '').toLowerCase() === title.toLowerCase())) {
            if (typeof showToast === 'function') showToast("Daily Action Tracker with this title already exists.", "error");
            return;
        }

        const act = window.customActions[actIndex];
        act.title = title;
        act.desc = desc;
        act.question = desc || `Did you complete ${title}?`;
        act.startDate = startDate;
        act.color = color;
        act.icon = icon;
        act.track = track;

        if (typeof window.sortAllCustomData === 'function') {
            window.sortAllCustomData();
        }

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        if (typeof window.closeModal === 'function') {
            window.closeModal('edit-daily-action-modal');
        }
        if (typeof renderUI === 'function') {
            renderUI();
        } else {
            renderDailyTracker();
            renderDailyLogs();
        }
        if (typeof showToast === 'function') {
            showToast("Daily Action updated successfully!", "success");
        }
    }

    /**
     * Prompts for confirmation and deletes an action tracker.
     */
    function requestDeleteDailyActionFromModal() {
        const idEl = document.getElementById('edam-action-id');
        const actionId = idEl ? idEl.value : '';
        const actIndex = (window.customActions || []).findIndex(a => a.id === actionId);
        if (actIndex === -1) {
            if (typeof showToast === 'function') showToast("Action not found.", "error");
            return;
        }

        const act = window.customActions[actIndex];
        if (!confirm(`Are you sure you want to delete the Daily Action "${act.title}"? This action cannot be undone.`)) {
            return;
        }

        window.customActions.splice(actIndex, 1);

        if (typeof window.sortAllCustomData === 'function') {
            window.sortAllCustomData();
        }

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }

        if (typeof window.closeModal === 'function') {
            window.closeModal('edit-daily-action-modal');
        }
        if (typeof renderUI === 'function') {
            renderUI();
        } else {
            renderDailyTracker();
            renderDailyLogs();
        }
        if (typeof showToast === 'function') {
            showToast("Daily Action deleted successfully!", "success");
        }
    }

    // Global attachments for window scope & cross-module integration
    global.getActionSVG = getActionSVG;
    global.renderDailyTracker = renderDailyTracker;
    global.renderDailyLogs = renderDailyLogs;
    global.setDailyState = setDailyState;
    global.toggleModalDay = toggleModalDay;
    global.actionAnalyticsHeatmapRange = actionAnalyticsHeatmapRange;
    global.setActionAnalyticsRange = setActionAnalyticsRange;
    global.showActionHeatmapTooltip = showActionHeatmapTooltip;
    global.moveActionHeatmapTooltip = moveActionHeatmapTooltip;
    global.hideActionHeatmapTooltip = hideActionHeatmapTooltip;
    global.populateAnalyticsModal = populateAnalyticsModal;
    global.appendNewAction = appendNewAction;
    global.openEditDailyActionModal = openEditDailyActionModal;
    global.saveDailyActionEditModal = saveDailyActionEditModal;
    global.requestDeleteDailyActionFromModal = requestDeleteDailyActionFromModal;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            getActionSVG,
            renderDailyTracker,
            renderDailyLogs,
            setDailyState,
            toggleModalDay,
            populateAnalyticsModal,
            appendNewAction,
            openEditDailyActionModal,
            saveDailyActionEditModal,
            requestDeleteDailyActionFromModal
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);
