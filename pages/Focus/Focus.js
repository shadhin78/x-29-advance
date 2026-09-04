/**
 * Focus Page Module (pages/Focus/Focus.js)
 * Canonical single source of truth for the Focus page UI, Chronograph dial,
 * subject target tracker, fullscreen modes, and session history management.
 */

(function () {
    'use strict';

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
        if (typeof startTime.toDate === "function") {
            return startTime.toDate().getTime();
        }
        if (startTime instanceof Date) {
            return startTime.getTime();
        }
        if (typeof startTime === "string") {
            return new Date(startTime).getTime();
        }
        return Number(startTime);
    }

    function initChronographDial() {
        const ticksContainer = document.getElementById('chrono-ticks-container');
        const numbersContainer = document.getElementById('chrono-numbers-container');
        const subdialTicksContainer = document.getElementById('chrono-subdial-ticks');
        const subdialNumbersContainer = document.getElementById('chrono-subdial-numbers');

        if (!ticksContainer || !numbersContainer || !subdialTicksContainer || !subdialNumbersContainer) return;
        if (ticksContainer.childElementCount > 0) return; // Already initialized

        // 1. Generate 60 Main Dial Ticks
        let ticksHTML = '';
        for (let i = 0; i < 60; i++) {
            const angle = i * 6;
            const isMajor = (i % 5 === 0);
            if (isMajor) {
                ticksHTML += `<line id="chrono-tick-${i}" x1="150" y1="12" x2="150" y2="24" stroke="var(--chrono-tick-major)" stroke-width="2.5" stroke-linecap="round" style="transform-origin: 150px 150px; transform: rotate(${angle}deg);" />`;
            } else {
                ticksHTML += `<line id="chrono-tick-${i}" x1="150" y1="12" x2="150" y2="18" stroke="var(--chrono-tick-minor)" stroke-width="1.2" stroke-opacity="0.6" stroke-linecap="round" style="transform-origin: 150px 150px; transform: rotate(${angle}deg);" />`;
            }
        }
        ticksContainer.innerHTML = ticksHTML;

        // 2. Generate 12 Main Dial Numbers (60, 5, 10, ..., 55)
        let numbersHTML = '';
        const mainRadius = 118;
        for (let i = 0; i < 12; i++) {
            const angleRad = (i * 30) * (Math.PI / 180);
            const nx = (150 + mainRadius * Math.sin(angleRad)).toFixed(2);
            const ny = (150 - mainRadius * Math.cos(angleRad)).toFixed(2);
            const tickIndex = i * 5;
            const numText = (i === 0) ? '60' : (i * 5).toString();
            numbersHTML += `<text id="chrono-num-${tickIndex}" x="${nx}" y="${ny}" fill="var(--chrono-text-number)" font-size="13" font-weight="800" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central">${numText}</text>`;
        }
        numbersContainer.innerHTML = numbersHTML;

        // 3. Generate 30 Subdial Ticks (Center: 150, 205, R: 38)
        let subTicksHTML = '';
        for (let j = 0; j < 30; j++) {
            const subAngle = j * 12;
            const isMajor = (j % 5 === 0);
            if (isMajor) {
                subTicksHTML += `<line x1="150" y1="170" x2="150" y2="176" stroke="var(--chrono-subdial-tick-major)" stroke-width="1.8" stroke-linecap="round" style="transform-origin: 150px 205px; transform: rotate(${subAngle}deg);" />`;
            } else {
                subTicksHTML += `<line x1="150" y1="170" x2="150" y2="173" stroke="var(--chrono-subdial-tick-minor)" stroke-width="1" stroke-linecap="round" style="transform-origin: 150px 205px; transform: rotate(${subAngle}deg);" />`;
            }
        }
        subdialTicksContainer.innerHTML = subTicksHTML;

        // 4. Generate 6 Subdial Numbers (30, 5, 10, 15, 20, 25)
        let subNumbersHTML = '';
        const subRadius = 26;
        for (let k = 0; k < 6; k++) {
            const subRad = (k * 60) * (Math.PI / 180);
            const snx = (150 + subRadius * Math.sin(subRad)).toFixed(2);
            const sny = (205 - subRadius * Math.cos(subRad)).toFixed(2);
            const subNumText = (k === 0) ? '30' : (k * 5).toString();
            subNumbersHTML += `<text x="${snx}" y="${sny}" fill="var(--chrono-subdial-text)" font-size="8" font-weight="700" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central">${subNumText}</text>`;
        }
        subdialNumbersContainer.innerHTML = subNumbersHTML;
    }

    window.initChronographDial = initChronographDial;
    function getSubjectTargetDomId(subject) {
        return 'stt-' + String(subject).replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    let _lastLiveTargetUpdateSecond = -1;
    let currentSubjectTargetFilter = 'uncompleted';

    window.setSubjectTargetFilter = function (filter) {
        currentSubjectTargetFilter = (filter === 'done') ? 'done' : 'uncompleted';
        updateSubjectTargetFilterButtons();
        updateSubjectTargetUI();
    };

    function updateSubjectTargetFilterButtons() {
        const btnUncompleted = document.getElementById('st-filter-uncompleted');
        const btnDone = document.getElementById('st-filter-done');
        const dotUncompleted = document.getElementById('st-dot-uncompleted');
        const dotDone = document.getElementById('st-dot-done');
        const badgeUncompleted = document.getElementById('st-count-uncompleted');
        const badgeDone = document.getElementById('st-count-done');

        if (currentSubjectTargetFilter === 'uncompleted') {
            if (btnUncompleted) {
                btnUncompleted.className = 'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all bg-rose-600 text-white shadow shadow-rose-500/20 active:scale-95';
            }
            if (dotUncompleted) {
                dotUncompleted.className = 'w-2 h-2 rounded-full bg-rose-200 animate-pulse';
            }
            if (badgeUncompleted) {
                badgeUncompleted.className = 'px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-mono leading-none';
            }
            if (btnDone) {
                btnDone.className = 'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800 active:scale-95';
            }
            if (dotDone) {
                dotDone.className = 'w-2 h-2 rounded-full bg-emerald-500';
            }
            if (badgeDone) {
                badgeDone.className = 'px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-mono leading-none';
            }
        } else {
            if (btnDone) {
                btnDone.className = 'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all bg-emerald-600 text-white shadow shadow-emerald-500/20 active:scale-95';
            }
            if (dotDone) {
                dotDone.className = 'w-2 h-2 rounded-full bg-emerald-200 animate-pulse';
            }
            if (badgeDone) {
                badgeDone.className = 'px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-mono leading-none';
            }
            if (btnUncompleted) {
                btnUncompleted.className = 'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800 active:scale-95';
            }
            if (dotUncompleted) {
                dotUncompleted.className = 'w-2 h-2 rounded-full bg-rose-500';
            }
            if (badgeUncompleted) {
                badgeUncompleted.className = 'px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-mono leading-none';
            }
        }
    }

    function updateSubjectTargetLive() {
        const listContainer = document.getElementById('subject-targets-list');
        if (!listContainer) return;

        const activeState = AppState.activeTimerState;
        if (!activeState || !activeState.isRunning) return;

        const currentSubject = activeState.selectedSubject || 'General Study';
        const targets = AppState.subjectFocusTargets || window.subjectFocusTargets || {};
        const target = targets[currentSubject];
        if (!target) return;

        let activeElapsedMs = activeState.elapsedBeforeStart || 0;
        if (activeState.startTime) {
            activeElapsedMs += (window.getServerTime() - parseStartTime(activeState.startTime));
        }
        const currentSecond = Math.floor(activeElapsedMs / 1000);
        if (currentSecond === _lastLiveTargetUpdateSecond) return;
        _lastLiveTargetUpdateSecond = currentSecond;

        const targetHours = parseInt(target.hours, 10) || 0;
        const targetMinutes = parseInt(target.minutes, 10) || 0;
        const targetSeconds = (targetHours * 3600) + (targetMinutes * 60);

        let doneSeconds = 0;
        const targetCreatedAt = target.createdAt ? new Date(target.createdAt) : null;
        if (targetCreatedAt) {
            targetCreatedAt.setHours(0, 0, 0, 0);
        }
        if (AppState.timerLogs) {
            AppState.timerLogs.forEach(log => {
                if ((log.subject || 'General Study') === currentSubject) {
                    const logDate = new Date(log.date);
                    if (!targetCreatedAt || logDate >= targetCreatedAt) {
                        doneSeconds += parseInt(log.duration || 0, 10);
                    }
                }
            });
        }
        doneSeconds += currentSecond;

        const isCompleted = targetSeconds > 0 && doneSeconds >= targetSeconds;
        const domId = getSubjectTargetDomId(currentSubject);
        const cardElem = document.getElementById(`${domId}-card`);

        // If target just completed while in 'uncompleted' view, re-render so it automatically moves to Done section!
        if (isCompleted && currentSubjectTargetFilter === 'uncompleted' && cardElem) {
            updateSubjectTargetUI();
            return;
        }

        const doneElem = document.getElementById(`${domId}-done`);
        const remainElem = document.getElementById(`${domId}-remain`);
        const badgeElem = document.getElementById(`${domId}-badge`);
        const barElem = document.getElementById(`${domId}-bar`);

        if (!doneElem || !remainElem || !badgeElem || !barElem) {
            return;
        }

        const doneHrs = Math.floor(doneSeconds / 3600);
        const doneMins = Math.floor((doneSeconds % 3600) / 60);
        const doneText = `${String(doneHrs).padStart(2, '0')}h ${String(doneMins).padStart(2, '0')}m`;

        const remainSeconds = Math.max(0, targetSeconds - doneSeconds);
        const remainHrs = Math.floor(remainSeconds / 3600);
        const remainMins = Math.floor((remainSeconds % 3600) / 60);
        const remainText = `${String(remainHrs).padStart(2, '0')}h ${String(remainMins).padStart(2, '0')}m`;

        const progressPercent = targetSeconds > 0 ? Math.min(100, Math.round((doneSeconds / targetSeconds) * 100)) : 0;
        const subjColor = (typeof window.getSubjectColor === 'function') ? window.getSubjectColor(currentSubject) : '#6366f1';

        doneElem.textContent = doneText;
        remainElem.textContent = remainText;
        if (targetSeconds > 0 && remainSeconds === 0) {
            remainElem.className = 'text-[9.5px] font-black text-emerald-500 font-mono whitespace-nowrap';
        } else {
            remainElem.className = 'text-[9.5px] font-black text-indigo-500 dark:text-indigo-400 font-mono whitespace-nowrap';
        }

        badgeElem.textContent = `${progressPercent}%`;
        badgeElem.className = `text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full transition-colors duration-300 ${progressPercent >= 100 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`;

        barElem.style.width = `${progressPercent}%`;
        barElem.style.backgroundColor = progressPercent >= 100 ? '#10b981' : subjColor;
    }

    function updateSubjectTargetUI() {
        const listContainer = document.getElementById('subject-targets-list');
        if (!listContainer) return;

        const targets = AppState.subjectFocusTargets || window.subjectFocusTargets || {};
        const entries = Object.entries(targets);

        const badgeUncompleted = document.getElementById('st-count-uncompleted');
        const badgeDone = document.getElementById('st-count-done');

        updateSubjectTargetFilterButtons();

        if (entries.length === 0) {
            if (badgeUncompleted) badgeUncompleted.textContent = '0';
            if (badgeDone) badgeDone.textContent = '0';
            listContainer.innerHTML = `<p class="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider py-8 text-center col-span-full">No subject targets set. Click Add Target to create one.</p>`;
            return;
        }

        // Stable deterministic sort by creation date ascending, fallback to alphabetical subject name
        const sortedEntries = entries.sort((a, b) => {
            const timeA = a[1].createdAt ? new Date(a[1].createdAt).getTime() : (a[1].updatedAt || 0);
            const timeB = b[1].createdAt ? new Date(b[1].createdAt).getTime() : (b[1].updatedAt || 0);
            if (timeA !== timeB) return timeA - timeB;
            return a[0].localeCompare(b[0]);
        });

        // Compute progress and completion status for all targets
        const processedTargets = sortedEntries.map(([subject, target]) => {
            const targetHours = parseInt(target.hours, 10) || 0;
            const targetMinutes = parseInt(target.minutes, 10) || 0;

            let doneSeconds = 0;
            const targetCreatedAt = target.createdAt ? new Date(target.createdAt) : null;
            if (targetCreatedAt) {
                targetCreatedAt.setHours(0, 0, 0, 0);
            }
            if (AppState.timerLogs) {
                AppState.timerLogs.forEach(log => {
                    if ((log.subject || 'General Study') === subject) {
                        const logDate = new Date(log.date);
                        if (!targetCreatedAt || logDate >= targetCreatedAt) {
                            doneSeconds += parseInt(log.duration || 0, 10);
                        }
                    }
                });
            }

            // Include current active running timer/stopwatch if its subject matches AND it is currently running
            if (AppState.activeTimerState && AppState.activeTimerState.isRunning && (AppState.activeTimerState.selectedSubject || 'General Study') === subject) {
                let activeElapsedMs = AppState.activeTimerState.elapsedBeforeStart || 0;
                if (AppState.activeTimerState.startTime) {
                    activeElapsedMs += (window.getServerTime() - parseStartTime(AppState.activeTimerState.startTime));
                }
                doneSeconds += Math.floor(activeElapsedMs / 1000);
            }

            const targetSeconds = (targetHours * 3600) + (targetMinutes * 60);
            const remainSeconds = Math.max(0, targetSeconds - doneSeconds);
            const isCompleted = targetSeconds > 0 ? (doneSeconds >= targetSeconds) : false;
            const progressPercent = targetSeconds > 0 ? Math.min(100, Math.round((doneSeconds / targetSeconds) * 100)) : 0;

            const doneHrs = Math.floor(doneSeconds / 3600);
            const doneMins = Math.floor((doneSeconds % 3600) / 60);
            const doneText = `${String(doneHrs).padStart(2, '0')}h ${String(doneMins).padStart(2, '0')}m`;

            const remainHrs = Math.floor(remainSeconds / 3600);
            const remainMins = Math.floor((remainSeconds % 3600) / 60);
            const remainText = `${String(remainHrs).padStart(2, '0')}h ${String(remainMins).padStart(2, '0')}m`;

            const targetText = `${String(targetHours).padStart(2, '0')}h ${String(targetMinutes).padStart(2, '0')}m`;
            const subjColor = (typeof window.getSubjectColor === 'function') ? window.getSubjectColor(subject) : '#6366f1';

            let startDateText = '';
            if (target.createdAt) {
                const sDate = new Date(target.createdAt);
                startDateText = sDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            } else {
                startDateText = 'All-time';
            }

            return {
                subject,
                target,
                targetHours,
                targetMinutes,
                targetSeconds,
                doneSeconds,
                remainSeconds,
                isCompleted,
                progressPercent,
                doneText,
                remainText,
                targetText,
                subjColor,
                startDateText,
                domId: getSubjectTargetDomId(subject)
            };
        });

        const uncompletedTargets = processedTargets.filter(t => !t.isCompleted);
        const completedTargets = processedTargets.filter(t => t.isCompleted);

        if (badgeUncompleted) badgeUncompleted.textContent = String(uncompletedTargets.length);
        if (badgeDone) badgeDone.textContent = String(completedTargets.length);

        const currentFilter = currentSubjectTargetFilter || 'uncompleted';
        const displayList = (currentFilter === 'done') ? completedTargets : uncompletedTargets;

        if (displayList.length === 0) {
            if (currentFilter === 'uncompleted') {
                listContainer.innerHTML = `
                    <div class="col-span-full py-8 text-center flex flex-col items-center justify-center gap-2">
                        <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <p class="text-xs text-slate-700 dark:text-slate-200 font-black uppercase tracking-wider">All subject targets completed!</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            View finished targets in the <button onclick="window.setSubjectTargetFilter('done')" class="text-emerald-500 underline font-black hover:text-emerald-400">Done (${completedTargets.length})</button> section.
                        </p>
                    </div>
                `;
            } else {
                listContainer.innerHTML = `
                    <div class="col-span-full py-8 text-center flex flex-col items-center justify-center gap-2">
                        <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-200/60 dark:border-slate-700">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <p class="text-xs text-slate-700 dark:text-slate-200 font-black uppercase tracking-wider">No completed targets yet</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Keep focusing! Completed subject targets will appear here automatically.
                        </p>
                    </div>
                `;
            }
            return;
        }

        let html = '';
        displayList.forEach(item => {
            const remainColorClass = item.isCompleted ? 'text-emerald-500' : 'text-indigo-500 dark:text-indigo-400';
            const badgeClass = item.isCompleted 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
            const statusTag = item.isCompleted
                ? `<span class="text-[8px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/20"><svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>Done</span>`
                : '';

            html += `
                <div id="${item.domId}-card" class="p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col gap-2.5 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md ${item.isCompleted ? 'ring-1 ring-emerald-500/30' : ''}" style="border-left: 4px solid ${item.subjColor};">
                    <div class="flex justify-between items-center gap-2">
                        <div class="flex flex-col min-w-0">
                            <div class="flex items-center gap-1.5">
                                <span class="font-black text-xs text-slate-800 dark:text-white truncate" title="${item.subject}">${item.subject}</span>
                                ${statusTag}
                            </div>
                            <span class="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">Start: ${item.startDateText}</span>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <!-- Progress Badge -->
                            <span id="${item.domId}-badge" class="text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full transition-colors duration-300 ${badgeClass}">${item.progressPercent}%</span>
                            
                            <!-- Edit Button -->
                            <button onclick="window.openSubjectTargetModal('${item.subject.replace(/'/g, "\\'")}')" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all" title="Edit Target">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Premium Progress Bar -->
                    <div class="w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                        <div id="${item.domId}-bar" class="h-full rounded-full transition-all duration-500 ease-out" style="width: ${item.progressPercent}%; background-color: ${item.isCompleted ? '#10b981' : item.subjColor};"></div>
                    </div>

                    <!-- Details Grid -->
                    <div class="grid grid-cols-3 gap-1.5 text-center mt-0.5">
                        <div class="flex flex-col bg-white dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/80 rounded-xl py-1 px-0.5">
                            <span class="text-[7.5px] font-bold uppercase tracking-wider text-slate-400">Done</span>
                            <span id="${item.domId}-done" class="text-[9.5px] font-black text-emerald-500 font-mono whitespace-nowrap">${item.doneText}</span>
                        </div>
                        <div class="flex flex-col bg-white dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/80 rounded-xl py-1 px-0.5">
                            <span class="text-[7.5px] font-bold uppercase tracking-wider text-slate-400">Remain</span>
                            <span id="${item.domId}-remain" class="text-[9.5px] font-black ${remainColorClass} font-mono whitespace-nowrap">${item.remainText}</span>
                        </div>
                        <div class="flex flex-col bg-white dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/80 rounded-xl py-1 px-0.5">
                            <span class="text-[7.5px] font-bold uppercase tracking-wider text-slate-400">Target</span>
                            <span id="${item.domId}-target" class="text-[9.5px] font-black text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">${item.targetText}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        listContainer.innerHTML = html;
    }
    window.updateSubjectTargetUI = updateSubjectTargetUI;

    window.openSubjectTargetModal = function (prefilledSubject = '') {
        const modal = document.getElementById('subject-target-modal');
        const backdrop = document.getElementById('stm-target-backdrop');
        const content = document.getElementById('stm-target-content');
        if (!modal || !backdrop || !content) return;

        // Populate modal subject selector first
        const select = document.getElementById('modal-target-subject');
        const hrsInput = document.getElementById('modal-target-hours');
        const minsInput = document.getElementById('modal-target-minutes');
        const dateInput = document.getElementById('modal-target-start-date');

        if (select) {
            select.innerHTML = buildProgramWiseSubjectOptionsHtml();

            if (prefilledSubject) {
                select.value = prefilledSubject;
                select.disabled = true; // when editing, disable changing subject to avoid confusion
                document.getElementById('subject-target-modal-title').textContent = 'Edit Subject Target';
            } else {
                select.disabled = false;
                document.getElementById('subject-target-modal-title').textContent = 'Add Subject Target';
            }
        }

        // Set inputs: Default to neutral values for Add mode (1 hour, 0 minutes, Today)
        let hours = 1;
        let minutes = 0;
        let initialDate = new Date();

        // Only prefill target data if in explicit EDIT mode (prefilledSubject provided)
        if (prefilledSubject && window.subjectFocusTargets && window.subjectFocusTargets[prefilledSubject]) {
            const tgt = window.subjectFocusTargets[prefilledSubject];
            hours = tgt.hours !== undefined ? tgt.hours : 1;
            minutes = tgt.minutes !== undefined ? tgt.minutes : 0;
            if (tgt.createdAt) {
                initialDate = new Date(tgt.createdAt);
            }
        }

        if (hrsInput) hrsInput.value = hours;
        if (minsInput) minsInput.value = minutes;

        if (dateInput) {
            const yyyy = initialDate.getFullYear();
            const mm = String(initialDate.getMonth() + 1).padStart(2, '0');
            const dd = String(initialDate.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;
        }

        // In Add mode, update inputs dynamically if user selects a different subject
        if (select) {
            select.onchange = function () {
                if (!prefilledSubject) {
                    const chosen = select.value;
                    if (window.subjectFocusTargets && window.subjectFocusTargets[chosen]) {
                        const tgt = window.subjectFocusTargets[chosen];
                        if (hrsInput) hrsInput.value = tgt.hours !== undefined ? tgt.hours : 1;
                        if (minsInput) minsInput.value = tgt.minutes !== undefined ? tgt.minutes : 0;
                        if (dateInput && tgt.createdAt) {
                            const d = new Date(tgt.createdAt);
                            const yyyy = d.getFullYear();
                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                            const dd = String(d.getDate()).padStart(2, '0');
                            dateInput.value = `${yyyy}-${mm}-${dd}`;
                        }
                    } else {
                        if (hrsInput) hrsInput.value = 1;
                        if (minsInput) minsInput.value = 0;
                        if (dateInput) {
                            const today = new Date();
                            const yyyy = today.getFullYear();
                            const mm = String(today.getMonth() + 1).padStart(2, '0');
                            const dd = String(today.getDate()).padStart(2, '0');
                            dateInput.value = `${yyyy}-${mm}-${dd}`;
                        }
                    }
                }
            };
        }

        // Toggle Delete button based on Edit/Add mode
        const deleteBtn = document.getElementById('modal-target-delete-btn');
        if (deleteBtn) {
            if (prefilledSubject) {
                deleteBtn.classList.remove('hidden');
                deleteBtn.onclick = function () {
                    window.deleteSubjectTarget(prefilledSubject);
                };
            } else {
                deleteBtn.classList.add('hidden');
                deleteBtn.onclick = null;
            }
        }

        // Animate open
        modal.classList.remove('hidden'); void modal.offsetWidth;
        backdrop.classList.remove('opacity-0'); backdrop.classList.add('opacity-100');
        content.classList.remove('scale-95', 'opacity-0', 'translate-y-4'); content.classList.add('scale-100', 'opacity-100', 'translate-y-0');
        document.body.classList.add('overflow-hidden');
    };

    window.closeSubjectTargetModal = function () {
        const modal = document.getElementById('subject-target-modal');
        const backdrop = document.getElementById('stm-target-backdrop');
        const content = document.getElementById('stm-target-content');
        if (!modal || !backdrop || !content) return;

        backdrop.classList.remove('opacity-100'); backdrop.classList.add('opacity-0');
        content.classList.remove('scale-100', 'opacity-100', 'translate-y-0'); content.classList.add('scale-95', 'opacity-0', 'translate-y-4');
        setTimeout(() => { modal.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); }, 300);
    };

    window.submitSubjectTarget = function () {
        const select = document.getElementById('modal-target-subject');
        if (!select) return;
        const subject = select.value || 'General Study';

        const hrsInput = document.getElementById('modal-target-hours');
        const minsInput = document.getElementById('modal-target-minutes');
        if (!hrsInput || !minsInput) return;

        let hours = parseInt(hrsInput.value, 10);
        let minutes = parseInt(minsInput.value, 10);

        if (isNaN(hours) || hours < 0) hours = 0;
        if (isNaN(minutes) || minutes < 0) minutes = 0;
        if (minutes > 59) minutes = 59;

        if (!AppState.subjectFocusTargets) {
            AppState.subjectFocusTargets = {};
        }

        if (AppState._tombstones) {
            delete AppState._tombstones[subject];
            delete AppState._tombstones[`subjectFocusTargets_${subject}`];
        }

        const dateInput = document.getElementById('modal-target-start-date');
        let createdAt;
        if (dateInput && dateInput.value) {
            const parts = dateInput.value.split('-');
            const selectedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
            createdAt = selectedDate.toISOString();
        } else {
            const existingTarget = (AppState.subjectFocusTargets && AppState.subjectFocusTargets[subject]) || (window.subjectFocusTargets && window.subjectFocusTargets[subject]);
            createdAt = (existingTarget && existingTarget.createdAt) ? existingTarget.createdAt : new Date().toISOString();
        }

        const nowMs = Date.now() + (window.serverTimeOffset || 0);
        AppState.subjectFocusTargets[subject] = { hours, minutes, createdAt, updatedAt: nowMs };
        window.subjectFocusTargets = AppState.subjectFocusTargets;

        window.closeSubjectTargetModal();
        updateSubjectTargetUI();

        if (window.FirebaseService) {
            window.FirebaseService.saveToCloud(false);
        }
    };

    window.deleteSubjectTarget = function (subject) {
        if (!subject) return;
        const executeDelete = () => {
            const currentTargets = AppState.subjectFocusTargets || window.subjectFocusTargets;
            if (currentTargets && currentTargets[subject]) {
                if (typeof window.recordItemDeletion === 'function') {
                    window.recordItemDeletion(`subjectFocusTargets_${subject}`);
                }
                if (AppState.subjectFocusTargets) {
                    delete AppState.subjectFocusTargets[subject];
                }
                if (window.subjectFocusTargets) {
                    delete window.subjectFocusTargets[subject];
                }
                window.subjectFocusTargets = AppState.subjectFocusTargets || {};
                updateSubjectTargetUI();
                if (typeof showToast === 'function') {
                    showToast(`Target for ${subject} deleted.`, "success");
                }
                if (typeof window.closeSubjectTargetModal === 'function') {
                    window.closeSubjectTargetModal();
                }
                if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
                    window.FirebaseService.saveToCloud(true);
                }
            }
        };

        if (typeof window.openConfirmModal === 'function') {
            window.openConfirmModal(
                "Delete Subject Target?",
                `Are you sure you want to remove the focus target for "${subject}"?`,
                executeDelete
            );
        } else {
            executeDelete();
        }
    };

    window.updateSubjectTargetLive = updateSubjectTargetLive;
    function buildProgramWiseSubjectOptionsHtml() {
        let optionsHtml = `<option value="General Study">General Study</option>`;
        const subjects = window.getAllSubjects ? window.getAllSubjects() : [];

        // Group subjects program-wise
        const programMap = {};
        subjects.forEach(s => {
            if (!s || !s.subject) return;
            const prog = s.program || 'General';
            if (!programMap[prog]) {
                programMap[prog] = new Set();
            }
            programMap[prog].add(s.subject);
        });

        const programNames = Object.keys(programMap).sort();

        programNames.forEach(prog => {
            const subList = Array.from(programMap[prog]).sort();
            if (subList.length > 0) {
                optionsHtml += `<optgroup label="🎓 ${prog}">`;
                subList.forEach(sub => {
                    optionsHtml += `<option value="${sub}">${sub}</option>`;
                });
                optionsHtml += `</optgroup>`;
            }
        });

        return optionsHtml;
    }

    function populateTimerSubjects() {
        const optionsHtml = buildProgramWiseSubjectOptionsHtml();

        ['timer-subject-select', 'modal-target-subject', 'atsm-subject', 'etsm-subject'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = optionsHtml;
                if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
                    select.value = currentValue;
                } else if (id === 'timer-subject-select' && AppState.activeTimerState && AppState.activeTimerState.selectedSubject) {
                    select.value = AppState.activeTimerState.selectedSubject;
                }
            }
        });
    }
    window.populateTimerSubjects = populateTimerSubjects;

    function getDurationString(totalSeconds) {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const _updateTimerFsBtn = (active) => {
        const btn = document.getElementById('timer-btn-fullscreen');
        if (!btn) return;
        if (active) {
            btn.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 14h6m0 0v6m0-6L4 20m16-6h-6m0 0v6m0-6l6 6M4 10h6m0 0V4m0 6L4 4m16 6h-6m0 0V4m0 6l6-6"></path>
                </svg>
            `;
            btn.title = "Exit Fullscreen";
        } else {
            btn.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4"></path>
                </svg>
            `;
            btn.title = "Toggle Fullscreen";
        }
    };

    const _exitTimerFsCleanup = () => {
        const panel = document.getElementById('timer-active-panel');
        if (!panel) return;
        if (panel.classList.contains('timer-fs-exiting')) return;

        panel.classList.add('timer-fs-exiting');
        _updateTimerFsBtn(false);

        setTimeout(() => {
            panel.classList.remove('timer-fullscreen', 'timer-fs-exiting', 'dark');
            document.body.classList.remove('timer-fullscreen-active');
            window._timerFsActive = false;
            if (window._timerFsOriginalParent) {
                if (window._timerFsOriginalNext && window._timerFsOriginalNext.parentNode === window._timerFsOriginalParent) {
                    window._timerFsOriginalParent.insertBefore(panel, window._timerFsOriginalNext);
                } else {
                    window._timerFsOriginalParent.appendChild(panel);
                }
                window._timerFsOriginalParent = null;
                window._timerFsOriginalNext = null;
            }
        }, 200);
    };

    // --- MULTI-MODE STATE PERSISTENCE HELPERS ---

    window.updateAlarmStartText = function () {
        const useCurrentCb = document.getElementById('timer-alarm-use-current');
        const startInput = document.getElementById('timer-alarm-start');
        if (useCurrentCb && useCurrentCb.checked && startInput && (!AppState.activeTimerState || !AppState.activeTimerState.isRunning)) {
            const now = new Date();
            const curTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            startInput.value = curTimeStr;
        }
    };

    window.toggleAlarmUseCurrent = function () {
        const useCurrentCb = document.getElementById('timer-alarm-use-current');
        const startInput = document.getElementById('timer-alarm-start');
        if (useCurrentCb && startInput) {
            if (useCurrentCb.checked) {
                startInput.disabled = true;
                window.updateAlarmStartText();
            } else {
                startInput.disabled = false;
            }
        }
    };

    window.openTimerWarningModal = function (message) {
        if (message) {
            const msgEl = document.getElementById('tw-message');
            if (msgEl) msgEl.textContent = message;
        }
        const modal = document.getElementById('timer-warning-modal');
        const backdrop = document.getElementById('tw-backdrop');
        const content = document.getElementById('tw-content');
        if (!modal || !backdrop || !content) return;
        modal.classList.remove('hidden'); void modal.offsetWidth;
        backdrop.classList.remove('opacity-0'); backdrop.classList.add('opacity-100');
        content.classList.remove('scale-95', 'opacity-0', 'translate-y-4'); content.classList.add('scale-100', 'opacity-100', 'translate-y-0');
        document.body.classList.add('overflow-hidden');
    };

    window.closeTimerWarningModal = function () {
        const modal = document.getElementById('timer-warning-modal');
        const backdrop = document.getElementById('tw-backdrop');
        const content = document.getElementById('tw-content');
        if (!modal || !backdrop || !content) return;
        backdrop.classList.remove('opacity-100'); backdrop.classList.add('opacity-0');
        content.classList.remove('scale-100', 'opacity-100', 'translate-y-0'); content.classList.add('scale-95', 'opacity-0', 'translate-y-4');
        setTimeout(() => { modal.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); }, 300);
    };

    window.setTimerMode = function (mode) {
        if (AppState.activeTimerState.mode === mode) return;

        // Save the current active mode state (do NOT pause it automatically)
        saveActiveStateToStore();

        loadActiveStateFromStore(mode);
        FirebaseService.saveTimerToCloud();
        window.TimerService.restore();
    };

    window.setTimerPreset = function (minutes) {
        if (AppState.activeTimerState.isRunning) {
            showToast("Please pause before changing presets.", "error");
            return;
        }
        const currentMode = AppState.activeTimerState.mode || 'stopwatch';
        if (currentMode === 'stopwatch' && (!minutes || minutes <= 0)) {
            AppState.activeTimerState.targetDuration = 0;
            AppState.activeTimerState.elapsedBeforeStart = 0;
            AppState.activeTimerState.startTime = null;
            saveActiveStateToStore();
            if (window.FirebaseService) window.FirebaseService.saveTimerToCloud();
            window.TimerService.restore();
            showToast("Stopwatch set to Free (open-ended forward count).", "success");
            return;
        }
        const minVal = parseInt(minutes, 10);
        if (isNaN(minVal) || minVal <= 0) return;

        AppState.activeTimerState.targetDuration = minVal * 60;
        AppState.activeTimerState.elapsedBeforeStart = 0;
        AppState.activeTimerState.startTime = null;
        saveActiveStateToStore();
        if (window.FirebaseService) window.FirebaseService.saveTimerToCloud();
        window.TimerService.restore();
        if (currentMode === 'stopwatch') {
            showToast(`Stopwatch target set to ${minVal} minutes (counts forward 0 to ${minVal}m).`, "success");
        } else {
            showToast(`Timer set to ${minVal} minutes (${minVal}m countdown).`, "success");
        }
    };

    window.promptCustomTimer = function () {
        if (AppState.activeTimerState.isRunning) {
            showToast("Please pause before changing presets.", "error");
            return;
        }
        const mode = (AppState.activeTimerState && AppState.activeTimerState.mode) || 'stopwatch';
        const titleEl = document.getElementById('ctm-title');
        const subtitleEl = document.getElementById('ctm-subtitle');
        const btnSubmit = document.getElementById('ctm-btn-submit');
        const input = document.getElementById('custom-timer-input-minutes');

        if (titleEl) {
            titleEl.textContent = mode === 'stopwatch' ? 'Custom Stopwatch Target' : 'Custom Timer';
        }
        if (subtitleEl) {
            subtitleEl.textContent = mode === 'stopwatch' ? 'Set forward count target duration' : 'Set countdown duration';
        }
        if (btnSubmit) {
            btnSubmit.textContent = mode === 'stopwatch' ? 'Set Target' : 'Set Timer';
        }
        if (input) {
            const curMin = Math.round(((AppState.activeTimerState && AppState.activeTimerState.targetDuration) || (25 * 60)) / 60);
            input.value = curMin > 0 ? String(curMin) : "25";
        }
        openModal('custom-timer-modal');
    };

    window.submitCustomTimer = function () {
        const input = document.getElementById('custom-timer-input-minutes');
        if (!input) return;
        const minutes = parseInt(input.value, 10);
        if (isNaN(minutes) || minutes <= 0) {
            showToast("Please enter a valid positive number of minutes.", "error");
            return;
        }
        const currentMode = (AppState.activeTimerState && AppState.activeTimerState.mode) || 'stopwatch';
        AppState.activeTimerState.targetDuration = minutes * 60;
        AppState.activeTimerState.elapsedBeforeStart = 0;
        AppState.activeTimerState.startTime = null;
        saveActiveStateToStore();
        if (window.FirebaseService) window.FirebaseService.saveTimerToCloud();
        window.TimerService.restore();
        closeModal('custom-timer-modal');
        if (currentMode === 'stopwatch') {
            showToast(`Stopwatch target set to ${minutes} minutes (counts forward 0 to ${minutes}m).`, "success");
        } else {
            showToast(`Timer set to ${minutes} minutes (${minutes}m countdown).`, "success");
        }
    };

    window.deleteTimerLog = function (logId) {
        window.openConfirmModal(
            "Delete Study Record?",
            "Are you sure you want to delete this study record? This action cannot be undone.",
            () => {
                if (!AppState.timerLogs) AppState.timerLogs = [];
                if (typeof window.recordItemDeletion === 'function') {
                    window.recordItemDeletion(logId);
                }
                AppState.timerLogs = AppState.timerLogs.filter(log => log.id !== logId);
                window.TimerService.updateDisplay();
                showToast("Study session deleted.", "success");
                if (window.FirebaseService) {
                    window.FirebaseService.saveToCloud(true);
                }
            }
        );
    };

    if (window.timerAnalyticsRange === undefined) {
        let stored = null;
        try { stored = safeStorage.getItem('x29_timerAnalyticsRange'); } catch (e) {}
        window.timerAnalyticsRange = (stored !== null && !isNaN(parseInt(stored, 10))) ? parseInt(stored, 10) : ((window.AppState && window.AppState.timerAnalyticsRange) || 180);
    }
    if (window.timerAnalyticsChartStyle === undefined) {
        let stored = null;
        try { stored = safeStorage.getItem('x29_timerAnalyticsChartStyle'); } catch (e) {}
        window.timerAnalyticsChartStyle = stored || ((window.AppState && window.AppState.timerAnalyticsChartStyle) || 'combo');
    }
    if (window.timerAnalyticsGrouping === undefined) {
        let stored = null;
        try { stored = safeStorage.getItem('x29_timerAnalyticsGrouping'); } catch (e) {}
        window.timerAnalyticsGrouping = (stored && stored !== 'hourly') ? stored : ((window.AppState && window.AppState.timerAnalyticsGrouping) || 'daily');
    }
    if (window.timerAnalyticsDayOffset === undefined) window.timerAnalyticsDayOffset = 0;

    let _timerPrefsSaveTimer = null;
    window.renderTimerPage = function () {
        if (!AppState.timerLogs) AppState.timerLogs = [];

        initChronographDial();
        populateTimerSubjects();

        const now = new Date();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date(now);
        const daysSinceSat = (weekStart.getDay() + 1) % 7;
        weekStart.setDate(weekStart.getDate() - daysSinceSat);
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        let secondsToday = 0;
        let secondsWeek = 0;
        let secondsMonth = 0;

        const subjectSeconds = {};

        AppState.timerLogs.forEach(log => {
            const logDate = new Date(log.date);
            const duration = parseInt(log.duration || 0, 10);

            if (logDate >= todayStart) {
                secondsToday += duration;
            }
            if (logDate >= weekStart) {
                secondsWeek += duration;
            }
            if (logDate >= monthStart) {
                secondsMonth += duration;
            }

            const sub = log.subject || 'General Study';
            subjectSeconds[sub] = (subjectSeconds[sub] || 0) + duration;
        });

        safeSetText('timer-stat-today', getDurationString(secondsToday));
        safeSetText('dash-timer-today-focus', getDurationString(secondsToday));
        safeSetText('timer-stat-week', getDurationString(secondsWeek));
        safeSetText('timer-stat-month', getDurationString(secondsMonth));

        const breakdownContainer = document.getElementById('timer-subject-breakdown-container');
        if (breakdownContainer) {
            let breakdownHtml = '';
            const sortedSubjects = Object.entries(subjectSeconds).sort((a, b) => b[1] - a[1]);
            const maxSeconds = sortedSubjects.length > 0 ? sortedSubjects[0][1] : 1;

            if (sortedSubjects.length === 0) {
                breakdownHtml = `<p class="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider py-4 text-center">No study records yet</p>`;
            } else {
                sortedSubjects.forEach(([subj, sec]) => {
                    const pct = Math.max(5, Math.round((sec / maxSeconds) * 100));
                    const formattedDuration = formatHoursToHrMin(sec / 3600);
                    const color = getSubjectColor(subj);

                    breakdownHtml += `
                        <div class="space-y-1">
                            <div class="flex justify-between items-center text-xs">
                                <span class="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70%]" title="${subj}">${subj}</span>
                                <span class="font-black text-slate-900 dark:text-white">${formattedDuration}</span>
                            </div>
                            <div class="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background-color: ${color};"></div>
                            </div>
                        </div>
                    `;
                });
            }
            breakdownContainer.innerHTML = breakdownHtml;
        }

        // ── Session History Filter & Scrollable Container Logic ──
        if (typeof window.sessionHistoryFilter === 'undefined') {
            window.sessionHistoryFilter = 'all';
        }

        const historyTableBody = document.getElementById('timer-history-table-body');
        const historyContainer = document.getElementById('timer-history-container');
        const countBadge = document.getElementById('timer-history-count-badge');
        const totalTimeText = document.getElementById('timer-history-total-time-text');
        const totalTimeBadge = document.getElementById('timer-history-total-time-badge');
        const historyTableFoot = document.getElementById('timer-history-table-foot');

        if (historyTableBody) {
            let historyHtml = '';
            const now = new Date();
            const filter = window.sessionHistoryFilter || 'all';

            const filteredLogs = (AppState.timerLogs || []).filter(log => {
                if (!log || !log.date) return false;
                const logDate = new Date(log.date);
                if (isNaN(logDate.getTime())) return false;

                if (filter === 'day') {
                    return logDate.toDateString() === now.toDateString();
                } else if (filter === 'week') {
                    const diffTime = now.getTime() - logDate.getTime();
                    const diffDays = diffTime / (1000 * 3600 * 24);
                    return diffDays >= 0 && diffDays <= 7;
                } else if (filter === 'month') {
                    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                } else if (filter === 'year') {
                    return logDate.getFullYear() === now.getFullYear();
                }
                return true; // 'all'
            });

            // Calculate filter-wise total focus time in seconds
            const totalFilterSeconds = filteredLogs.reduce((acc, log) => acc + (parseInt(log.duration, 10) || 0), 0);
            const totalFilterMinutes = Math.floor(totalFilterSeconds / 60);
            const filterHrs = Math.floor(totalFilterMinutes / 60);
            const filterMins = totalFilterMinutes % 60;
            const filterSecs = totalFilterSeconds % 60;

            let formattedTotalTime = "0 min";
            if (filterHrs > 0) {
                formattedTotalTime = `${filterHrs} hr ${filterMins > 0 ? filterMins + ' min' : ''}`.trim();
            } else if (filterMins > 0) {
                formattedTotalTime = `${filterMins} min`;
            } else if (filterSecs > 0) {
                formattedTotalTime = `${filterSecs}s`;
            }

            // Update badge text
            if (countBadge) {
                countBadge.textContent = filteredLogs.length > 20 ?
                    `${filteredLogs.length} Sessions (Scrollable)` :
                    `${filteredLogs.length} Sessions`;
            }

            // Update filter-wise total focus time badge
            if (totalTimeText) {
                totalTimeText.textContent = `Total: ${formattedTotalTime}`;
            }
            if (totalTimeBadge) {
                totalTimeBadge.title = `Total focus time for ${filter.toUpperCase()} filter: ${formattedTotalTime}`;
            }

            // After 20 sessions, container becomes scrollable (15 sessions visible at once)
            if (historyContainer) {
                if (filteredLogs.length > 20) {
                    historyContainer.classList.add('max-h-[670px]', 'overflow-y-auto', 'pr-1');
                } else {
                    historyContainer.classList.remove('max-h-[670px]', 'overflow-y-auto', 'pr-1');
                }
            }

            if (filteredLogs.length === 0) {
                const labelMap = { all: 'recorded yet', day: 'recorded today', week: 'recorded this week', month: 'recorded this month', year: 'recorded this year' };
                historyHtml = `
                    <tr>
                        <td colspan="5" class="py-8 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                            No focus sessions ${labelMap[filter] || 'found'}
                        </td>
                    </tr>
                `;
                if (historyTableFoot) {
                    historyTableFoot.innerHTML = '';
                    historyTableFoot.classList.add('hidden');
                }
            } else {
                filteredLogs.forEach(log => {
                    const dateObj = new Date(log.date);
                    const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                    const dayStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    const dateStr = `${dayStr}, ${timeStr}`;

                    const rowTotalMins = Math.floor(log.duration / 60);
                    const hrs = Math.floor(rowTotalMins / 60);
                    const mins = rowTotalMins % 60;
                    const durStr = `${String(hrs).padStart(2, '0')} hr : ${String(mins).padStart(2, '0')} min`;

                    const modeBadge = log.mode === 'timer' ?
                        `<span class="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black text-[9px] uppercase tracking-wider rounded border border-blue-100 dark:border-blue-900/30">Timer</span>` :
                        log.mode === 'alarm' ?
                            `<span class="px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-black text-[9px] uppercase tracking-wider rounded border border-purple-100 dark:border-purple-900/30">Alarm</span>` :
                            log.mode === 'addx' ?
                                `<span class="px-2 py-0.5 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-black text-[9px] uppercase tracking-wider rounded border border-orange-100 dark:border-orange-900/30">Added</span>` :
                                `<span class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-wider rounded border border-emerald-100 dark:border-emerald-900/30">Stopwatch</span>`;

                    historyHtml += `
                        <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td class="py-3 font-bold text-slate-500 dark:text-slate-400">${dateStr}</td>
                            <td class="py-3 font-black text-slate-800 dark:text-white">${log.subject}</td>
                            <td class="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">${durStr}</td>
                            <td class="py-3 text-center">${modeBadge}</td>
                            <td class="py-3 text-right">
                                <div class="flex items-center justify-end gap-1">
                                    <button onclick="window.openEditTimerSessionModal('${log.id}')" class="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-95 transition-all" title="Edit session">
                                        <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button onclick="window.deleteTimerLog('${log.id}')" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95 transition-all" title="Delete session">
                                        <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });

                if (historyTableFoot) {
                    historyTableFoot.classList.remove('hidden');
                    const durSumStr = `${String(filterHrs).padStart(2, '0')} hr : ${String(filterMins).padStart(2, '0')} min`;
                    historyTableFoot.innerHTML = `
                        <tr class="border-t-2 border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 font-bold">
                            <td class="py-3 font-black uppercase tracking-wider text-[10px]" colspan="2">Filtered Total Focus Time</td>
                            <td class="py-3 font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">${durSumStr}</td>
                            <td colspan="2" class="py-3 text-right text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">${filteredLogs.length} session${filteredLogs.length === 1 ? '' : 's'}</td>
                        </tr>
                    `;
                }
            }
            historyTableBody.innerHTML = historyHtml;
        }
    };

    if (window.sessionHistoryFilter === undefined) window.sessionHistoryFilter = 'all';

    window.setSessionHistoryFilterUI = function (filter) {
        window.sessionHistoryFilter = filter;
        if (window.AppState) window.AppState.sessionHistoryFilter = filter;
        ['all', 'day', 'week', 'month', 'year'].forEach(f => {
            const btn = document.getElementById(`sh-filter-${f}`);
            if (btn) {
                if (f === filter) {
                    btn.className = "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all bg-blue-600 text-white shadow shadow-blue-500/20";
                } else {
                    btn.className = "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-slate-500 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:bg-slate-800";
                }
            }
        });
        if (window.TimerService && window.TimerService.updateDisplay) {
            window.TimerService.updateDisplay();
        }
    };

    window.setSessionHistoryFilter = function (filter) {
        window.sessionHistoryFilter = filter;
        if (window.AppState) {
            window.AppState.sessionHistoryFilter = filter;
            window.AppState._lastFilterChangeTime = Date.now();
        }
        try {
            safeStorage.setItem('x29_sessionHistoryFilter', String(filter));
        } catch (e) {}
        window.setSessionHistoryFilterUI(filter);
        if (typeof window.debouncedSaveTimerPreferences === 'function') {
            window.debouncedSaveTimerPreferences();
        }
    };

    window.switchAtsmTab = function (tab) {
        window._atsmActiveTab = tab;
        const tabHours = document.getElementById('atsm-tab-hours');
        const tabRange = document.getElementById('atsm-tab-range');
        const panelHours = document.getElementById('atsm-panel-hours');
        const panelRange = document.getElementById('atsm-panel-range');

        const activeClass = 'flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all bg-emerald-600 text-white shadow';
        const inactiveClass = 'flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800/80';

        if (tab === 'hours') {
            if (tabHours) tabHours.className = activeClass;
            if (tabRange) tabRange.className = inactiveClass;
            if (panelHours) { panelHours.classList.remove('hidden'); panelHours.classList.add('flex'); }
            if (panelRange) { panelRange.classList.add('hidden'); panelRange.classList.remove('flex'); }
        } else {
            if (tabHours) tabHours.className = inactiveClass;
            if (tabRange) tabRange.className = activeClass;
            if (panelHours) { panelHours.classList.add('hidden'); panelHours.classList.remove('flex'); }
            if (panelRange) { panelRange.classList.remove('hidden'); panelRange.classList.add('flex'); }
        }
    };

    window.updateAtsmRangePreview = function () {
        const startInput = document.getElementById('atsm-range-start');
        const endInput = document.getElementById('atsm-range-end');
        const preview = document.getElementById('atsm-range-preview');
        if (!startInput || !endInput || !preview) return;

        if (startInput.value && endInput.value) {
            let diff = Utils.toMinutes(endInput.value) - Utils.toMinutes(startInput.value);
            if (diff <= 0) diff += 24 * 60; // cross-midnight
            const hrs = Math.floor(diff / 60);
            const mins = diff % 60;
            let durStr = '';
            if (hrs > 0) durStr += `${hrs}h `;
            durStr += `${mins}m`;
            preview.textContent = `Duration: ${durStr}`;
            preview.classList.remove('hidden');
        } else {
            preview.classList.add('hidden');
        }
    };

    window.openAddTimerSessionModal = function () {
        const now = new Date();
        const dateInput = document.getElementById('atsm-date');
        if (dateInput) {
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;
        }

        const hoursInput = document.getElementById('atsm-hours');
        const minutesInput = document.getElementById('atsm-minutes');
        if (hoursInput) hoursInput.value = '0';
        if (minutesInput) minutesInput.value = '25';

        const rangeStart = document.getElementById('atsm-range-start');
        const rangeEnd = document.getElementById('atsm-range-end');
        if (rangeStart) rangeStart.value = '';
        if (rangeEnd) rangeEnd.value = '';
        const preview = document.getElementById('atsm-range-preview');
        if (preview) preview.classList.add('hidden');

        window.switchAtsmTab('hours');

        const subjectSelect = document.getElementById('atsm-subject');
        if (subjectSelect) {
            subjectSelect.innerHTML = buildProgramWiseSubjectOptionsHtml();
        }

        openModal('add-timer-session-modal');
    };

    window.submitManualTimerSession = function () {
        const dateInput = document.getElementById('atsm-date');
        const subjectSelect = document.getElementById('atsm-subject');

        if (!dateInput || !dateInput.value) {
            showToast("Please select a date.", "error");
            return;
        }

        let totalSeconds = 0;
        let sessionTimeStr = '12:00';

        if (window._atsmActiveTab === 'hours') {
            const hoursInput = document.getElementById('atsm-hours');
            const minutesInput = document.getElementById('atsm-minutes');
            const hours = parseInt(hoursInput?.value || '0', 10);
            const minutes = parseInt(minutesInput?.value || '0', 10);

            if (isNaN(hours) || isNaN(minutes)) {
                showToast("Please enter valid duration numbers.", "error");
                return;
            }
            totalSeconds = (hours * 3600) + (minutes * 60);
            if (totalSeconds <= 0) {
                showToast("Duration must be greater than zero.", "error");
                return;
            }
        } else {
            const startInput = document.getElementById('atsm-range-start');
            const endInput = document.getElementById('atsm-range-end');

            if (!startInput?.value || !endInput?.value) {
                showToast("Please enter both start and end times.", "error");
                return;
            }

            let diffMinutes = Utils.toMinutes(endInput.value) - Utils.toMinutes(startInput.value);
            if (diffMinutes <= 0) diffMinutes += 24 * 60; // cross-midnight

            totalSeconds = diffMinutes * 60;
            sessionTimeStr = startInput.value;
        }

        let sessionDate;
        if (window._atsmActiveTab === 'hours') {
            const now = new Date();
            const dateParts = dateInput.value.split('-');
            sessionDate = new Date(
                parseInt(dateParts[0], 10),
                parseInt(dateParts[1], 10) - 1,
                parseInt(dateParts[2], 10),
                now.getHours(),
                now.getMinutes(),
                now.getSeconds()
            );
        } else {
            const timeParts = sessionTimeStr.split(':').map(Number);
            sessionDate = new Date(dateInput.value + 'T' + String(timeParts[0] || 0).padStart(2, '0') + ':' + String(timeParts[1] || 0).padStart(2, '0') + ':00');
        }

        if (isNaN(sessionDate.getTime())) {
            showToast("Invalid date entered.", "error");
            return;
        }

        const subject = subjectSelect?.value || 'General Study';

        const newLog = {
            id: 'timer-log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            subject: subject,
            duration: totalSeconds,
            date: sessionDate.toISOString(),
            mode: 'addx'
        };

        if (!AppState.timerLogs) AppState.timerLogs = [];
        AppState.timerLogs.unshift(newLog);

        AppState.timerLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

        FirebaseService.saveToCloud(true);
        window.TimerService.updateDisplay();
        closeModal('add-timer-session-modal');

        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const durationStr = (hrs > 0 ? `${hrs}h ` : '') + `${mins}m`;
        showToast(`Session added: ${durationStr} for ${subject}.`, "success");
    };

    // ── Edit Timer Session Modal ──
    window._editingTimerLogId = null;

    window.openEditTimerSessionModal = function (logId) {
        const log = (AppState.timerLogs || []).find(l => l.id === logId);
        if (!log) {
            showToast('Session not found.', 'error');
            return;
        }

        window._editingTimerLogId = logId;

        const dateInput = document.getElementById('etsm-date');
        if (dateInput) {
            const d = new Date(log.date);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;
        }

        const timeInput = document.getElementById('etsm-time');
        if (timeInput) {
            const d = new Date(log.date);
            const hh = String(d.getHours()).padStart(2, '0');
            const mi = String(d.getMinutes()).padStart(2, '0');
            timeInput.value = `${hh}:${mi}`;
        }

        const totalMins = Math.floor((log.duration || 0) / 60);
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;

        const hoursInput = document.getElementById('etsm-hours');
        const minutesInput = document.getElementById('etsm-minutes');
        if (hoursInput) hoursInput.value = String(hrs);
        if (minutesInput) minutesInput.value = String(mins);

        const subjectSelect = document.getElementById('etsm-subject');
        if (subjectSelect) {
            subjectSelect.innerHTML = buildProgramWiseSubjectOptionsHtml();
            subjectSelect.value = log.subject || 'General Study';
        }

        openModal('edit-timer-session-modal');
    };

    window.submitEditTimerSession = function () {
        const logId = window._editingTimerLogId;
        if (!logId) {
            showToast('No session selected for editing.', 'error');
            return;
        }

        const logIndex = (AppState.timerLogs || []).findIndex(l => l.id === logId);
        if (logIndex === -1) {
            showToast('Session not found.', 'error');
            return;
        }

        const dateInput = document.getElementById('etsm-date');
        const timeInput = document.getElementById('etsm-time');
        const hoursInput = document.getElementById('etsm-hours');
        const minutesInput = document.getElementById('etsm-minutes');
        const subjectSelect = document.getElementById('etsm-subject');

        if (!dateInput || !dateInput.value) {
            showToast('Please select a date.', 'error');
            return;
        }

        const hours = parseInt(hoursInput?.value || '0', 10);
        const minutes = parseInt(minutesInput?.value || '0', 10);

        if (isNaN(hours) || isNaN(minutes)) {
            showToast('Please enter valid duration numbers.', 'error');
            return;
        }

        const totalSeconds = (hours * 3600) + (minutes * 60);
        if (totalSeconds <= 0) {
            showToast('Duration must be greater than zero.', 'error');
            return;
        }

        const timeValue = timeInput?.value || '12:00';
        const timeParts = timeValue.split(':').map(Number);
        const dateParts = dateInput.value.split('-');
        const sessionDate = new Date(
            parseInt(dateParts[0], 10),
            parseInt(dateParts[1], 10) - 1,
            parseInt(dateParts[2], 10),
            timeParts[0] || 0,
            timeParts[1] || 0,
            0
        );

        if (isNaN(sessionDate.getTime())) {
            showToast('Invalid date entered.', 'error');
            return;
        }

        const subject = subjectSelect?.value || 'General Study';

        AppState.timerLogs[logIndex].subject = subject;
        AppState.timerLogs[logIndex].duration = totalSeconds;
        AppState.timerLogs[logIndex].date = sessionDate.toISOString();

        AppState.timerLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

        FirebaseService.saveToCloud(true);
        window.TimerService.updateDisplay();
        closeModal('edit-timer-session-modal');

        const durationStr = (hours > 0 ? `${hours}h ` : '') + `${minutes}m`;
        showToast(`Session updated: ${durationStr} for ${subject}.`, 'success');
        window._editingTimerLogId = null;
    };

    window._timerFsOriginalParent = null;
    window._timerFsOriginalNext = null;
    window._timerFsActive = false;

    window.toggleTimerFullscreen = function () {
        const panel = document.getElementById('timer-active-panel');
        if (!panel) return;

        const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (window._timerFsActive) {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            return;
        }

        window._timerFsActive = true;

        window._timerFsOriginalParent = panel.parentNode;
        window._timerFsOriginalNext = panel.nextSibling;

        document.body.appendChild(panel);

        panel.classList.add('timer-fullscreen');
        panel.classList.toggle('dark', isDark);
        document.body.classList.add('timer-fullscreen-active');
        _updateTimerFsBtn(true);

        const docEl = document.documentElement;
        const requestFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
        if (requestFs) {
            requestFs.call(docEl).catch(() => {
            });
        }
    };


    /* ==========================================================================
       Focus Page Lifecycle Management (Router Integration)
       ========================================================================== */
    window.FocusPage = {
        isMounted: false,
        init: function () {
            this.mount();
        },
        mount: function () {
            this.isMounted = true;
            populateTimerSubjects();
            initChronographDial();
            if (typeof window.renderTimerPage === "function") {
                window.renderTimerPage();
            }
            if (typeof window.updatePresetButtonsUI === "function") {
                window.updatePresetButtonsUI();
            }
            if (typeof window.updateSubjectTargetUI === "function") {
                window.updateSubjectTargetUI();
            }
            if (typeof window.setSessionHistoryFilterUI === "function") {
                window.setSessionHistoryFilterUI(window.sessionHistoryFilter || "all");
            }
            if (window.TimerService && typeof window.TimerService.updateDisplay === "function") {
                window.TimerService.updateDisplay();
            }
        },
        destroy: function () {
            this.isMounted = false;
            if (window._timerFsActive && typeof _exitTimerFsCleanup === "function") {
                _exitTimerFsCleanup();
            }
            if (typeof window.closeModal === "function") {
                window.closeModal("custom-timer-modal");
                window.closeModal("subject-target-modal");
                window.closeModal("add-timer-session-modal");
                window.closeModal("edit-timer-session-modal");
            }
            if (typeof window.closeTimerWarningModal === "function") {
                window.closeTimerWarningModal();
            }
        }
    };

    // Auto-init if DOM is ready and Focus container is visible
    if (document.readyState === "complete" || document.readyState === "interactive") {
        const pageEl = document.getElementById("page-timer");
        if (pageEl && !pageEl.classList.contains("hidden")) {
            window.FocusPage.init();
        }
    }
})();
