/**
 * X-29 Feature Module: Global Timeline History (history.js)
 * Comprehensive log of curriculum completions, revision history, and retroactive timeline edits.
 *
 * Responsibilities:
 * 1. Historical timeline aggregation (completed study chapters + completed revisions).
 * 2. Multi-view tabs: Chronological Timeline Entry, Subject Folder group view, and Trend Chart.
 * 3. Fast keyword timeline search filter (filter by subject, chapter, or type).
 * 4. Chart.js safety: Guaranteed destruction of previous instances to prevent canvas collisions.
 * 5. Retroactive timeline entry editing modal (#edit-timeline-entry-modal) with ISO timestamp synchronization.
 *
 * Strict Read-Only state consumer: Reads AppState.tasks, window.revisionData, window.tracks.
 */

(function (global) {
    'use strict';

    global.currentGhmTab = global.currentGhmTab || 'timeline';
    global.currentTimelineEditEntry = null;
    global.ghmSearchQuery = '';

    function toast(msg, type = 'info') {
        if (typeof global.showToast === 'function') {
            global.showToast(msg, type);
        } else if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
            window.showToast(msg, type);
        }
    }

    function getTaskDate(task) {
        if (!task) return new Date();
        const UtilsRef = global.Utils || (typeof window !== 'undefined' ? window.Utils : null);
        if (task.date) {
            return (UtilsRef && typeof UtilsRef.parseDateSafe === 'function')
                ? UtilsRef.parseDateSafe(task.date)
                : new Date(task.date);
        }
        return new Date();
    }

    function getSubjectColor(subject) {
        if (typeof global !== 'undefined' && typeof global.getSubjectColor === 'function') {
            return global.getSubjectColor(subject);
        }
        if (typeof window !== 'undefined' && typeof window.getSubjectColor === 'function') {
            return window.getSubjectColor(subject);
        }
        if (typeof Utils !== 'undefined' && typeof Utils.getSubjectColor === 'function') {
            return Utils.getSubjectColor(subject);
        }
        if (typeof require === 'function') {
            try { return require('../../utils/colors.js').getSubjectColor(subject); } catch (e) {}
        }
        return '#3b82f6';
    }

    /**
     * Opens the Global History modal dialog.
     */
    function openGlobalHistoryModal() {
        renderGlobalHistoryContent(global.ghmSearchQuery || '');
        if (typeof global.openModal === 'function') {
            global.openModal('global-history-modal');
        }
    }

    /**
     * Filters timeline history by user query.
     *
     * @param {string} query
     */
    function filterGlobalHistory(query) {
        global.ghmSearchQuery = (query || '').trim();
        renderGlobalHistoryContent(global.ghmSearchQuery);
    }

    /**
     * Renders historical data table items for actions logged in the past.
     *
     * @param {string} searchFilter - Optional keyword search term
     */
    function renderGlobalHistoryContent(searchFilter = '') {
        if (typeof document === 'undefined') return;
        const container = document.getElementById('ghm-list');
        if (!container) return;

        global.currentGhmTab = global.currentGhmTab || 'timeline';

        const scrollViews = {
            timeline: document.getElementById('ghm-view-timeline')?.scrollTop || 0,
            subject: document.getElementById('ghm-view-subject')?.scrollTop || 0,
            trend: document.getElementById('ghm-view-trend')?.scrollTop || 0
        };

        const getAllSubsFn = global.getAllSubjects || (typeof window !== 'undefined' ? window.getAllSubjects : null) || (() => []);
        const passedItemsRef = global.passedItems || (typeof window !== 'undefined' ? window.passedItems : { subjects: [], programs: [] }) || { subjects: [], programs: [] };
        const tracksRef = global.tracks || (typeof window !== 'undefined' ? window.tracks : []) || [];
        const AppStateRef = global.AppState || (typeof window !== 'undefined' ? window.AppState : {}) || {};
        const revisionDataRef = global.revisionData || (typeof window !== 'undefined' ? window.revisionData : { progress: {} }) || { progress: {} };

        let subjectLogs = {};
        let allEvents = [];

        getAllSubsFn().forEach(s => {
            subjectLogs[s.subject] = {
                program: s.program,
                total: s.chapters,
                passed: (passedItemsRef.subjects && passedItemsRef.subjects.includes(s.subject)) ||
                    (passedItemsRef.programs && passedItemsRef.programs.includes(s.program)),
                chapters: [],
                revisions: []
            };
        });

        if (Array.isArray(AppStateRef.tasks)) {
            AppStateRef.tasks.forEach(t => {
                if (t.type === 'study') {
                    const fallbackDate = getTaskDate(t);
                    tracksRef.forEach(track => {
                        const key = track.id + 'Tasks';
                        if (Array.isArray(t[key])) {
                            t[key].forEach(b => {
                                if (b.completed && subjectLogs[b.subject]) {
                                    let actualDate = b.completedAt ? new Date(b.completedAt) : fallbackDate;
                                    if (isNaN(actualDate.getTime())) actualDate = fallbackDate;
                                    let displayDate = actualDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    let ts = actualDate.getTime();
                                    subjectLogs[b.subject].chapters.push({ ch: b.chapter, date: displayDate, ts: ts, track: track.id });
                                    allEvents.push({ type: 'Chapter', subject: b.subject, item: b.chapter, date: displayDate, ts: ts, track: track.id });
                                }
                            });
                        }
                    });
                }
            });
        }

        Object.values(subjectLogs).forEach(log => {
            log.chapters.sort((a, b) => a.ts - b.ts);
        });

        Object.keys(revisionDataRef.progress || {}).forEach(sub => {
            if (subjectLogs[sub]) {
                Object.keys(revisionDataRef.progress[sub]).forEach(chNum => {
                    const val = revisionDataRef.progress[sub][chNum];
                    if (val) {
                        let actualDate = (typeof val === 'string' && val.includes('T')) ? new Date(val) : new Date();
                        if (isNaN(actualDate.getTime())) actualDate = new Date();
                        let ts = actualDate.getTime();
                        let dStr = actualDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                        subjectLogs[sub].revisions.push({ ch: 'Ch. ' + chNum, date: dStr, ts: ts, chNum: chNum });
                        allEvents.push({ type: 'Revision', subject: sub, item: 'Ch. ' + chNum, date: dStr, ts: ts, chNum: chNum });
                    }
                });
                subjectLogs[sub].revisions.sort((a, b) => a.ts - b.ts);
            }
        });

        allEvents.sort((a, b) => b.ts - a.ts);

        // Filter events and subjects if search query provided
        const q = (searchFilter || global.ghmSearchQuery || '').toLowerCase().trim();
        const filteredEvents = q
            ? allEvents.filter(e => e.subject.toLowerCase().includes(q) || e.item.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || (e.track && e.track.toLowerCase().includes(q)))
            : allEvents;

        let subjectHtml = '';
        Object.keys(subjectLogs).forEach(sub => {
            const log = subjectLogs[sub];
            if (log.chapters.length === 0 && log.revisions.length === 0 && !log.passed) return;

            // Search filter match for subject group
            if (q) {
                const subMatches = sub.toLowerCase().includes(q) || (log.program && log.program.toLowerCase().includes(q));
                const chapterMatches = log.chapters.some(c => c.ch.toLowerCase().includes(q));
                const revMatches = log.revisions.some(r => r.ch.toLowerCase().includes(q));
                if (!subMatches && !chapterMatches && !revMatches) return;
            }

            const isSubjectComplete = log.chapters.length >= log.total && log.total > 0;
            const completionDate = isSubjectComplete ? log.chapters[log.chapters.length - 1].date : null;

            const color = getSubjectColor(sub);
            let subDisplay = sub.replace(log.program + ' - ', '').replace(log.program + ' ', '');

            let statusBadges = '';
            if (log.passed) statusBadges += `<span class="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm">Frozen/Passed</span>`;
            else if (isSubjectComplete) statusBadges += `<span class="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm">Completed: ${completionDate.split(',')[0]}</span>`;
            else statusBadges += `<span class="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm">In Progress (${log.chapters.length}/${log.total})</span>`;

            subjectHtml += `
                <details class="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group mb-3">
                    <summary class="cursor-pointer p-4 outline-none select-none list-none flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-800/50 active:scale-[0.99] rounded-xl transition-all [&::-webkit-details-marker]:hidden">
                        <div class="flex flex-col gap-1.5">
                            <div class="flex items-center space-x-2">
                                <div class="w-2.5 h-2.5 rounded-full shadow-sm" style="background-color: ${color}"></div>
                                <span class="font-black text-xs md:text-sm text-slate-800 dark:text-slate-200">${subDisplay}</span>
                            </div>
                            <div class="flex gap-2 items-center pl-4.5">${statusBadges}</div>
                        </div>
                        <svg class="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </summary>
                    <div class="p-4 pt-0 border-t border-slate-200 dark:border-slate-700/60 pl-8">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <h5 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">First Pass Database</h5>
                                <div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                    ${log.chapters.length > 0 ? log.chapters.map(c => `
                                        <div class="flex justify-between items-center text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                            <span class="font-bold text-slate-700 dark:text-slate-300">${c.ch}</span>
                                            <div class="flex items-center space-x-1.5">
                                                <span class="text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-inner whitespace-nowrap">${c.date}</span>
                                                <button onclick="window.openEditTimelineEntryModal('Chapter', '${encodeURIComponent(sub)}', '${encodeURIComponent(c.ch)}', ${c.ts}, '${c.track || ''}')" class="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors" title="Edit Date & Time">
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('') : '<span class="text-[10px] text-slate-500 italic">No chapters completed yet.</span>'}
                                </div>
                            </div>
                            <div>
                                <h5 class="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">Revision Database</h5>
                                <div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                    ${log.revisions.length > 0 ? log.revisions.map(r => `
                                        <div class="flex justify-between items-center text-xs bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                            <span class="font-bold text-blue-700 dark:text-blue-400">${r.ch}</span>
                                            <div class="flex items-center space-x-1.5">
                                                <span class="text-[9px] font-black text-blue-500/70 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded shadow-inner whitespace-nowrap">${r.date}</span>
                                                <button onclick="window.openEditTimelineEntryModal('Revision', '${encodeURIComponent(sub)}', '${encodeURIComponent(r.ch)}', ${r.ts}, '', '${r.chNum || ''}')" class="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors" title="Edit Date & Time">
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('') : '<span class="text-[10px] text-slate-500 italic">No revisions completed yet.</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </details>
            `;
        });

        let timelineHtml = filteredEvents.map(e => `
            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div class="flex items-center space-x-3">
                    <div class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style="background-color: ${getSubjectColor(e.subject)}"></div>
                    <div class="flex flex-col">
                        <span class="text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 leading-tight">${e.subject}</span>
                        <span class="text-[10px] font-bold text-slate-500 mt-0.5">${e.item}</span>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="flex flex-col items-end shrink-0">
                        <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${e.type === 'Revision' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}">${e.type}</span>
                        <span class="text-[10px] font-bold text-slate-400 mt-1 whitespace-nowrap">${e.date}</span>
                    </div>
                    <button onclick="window.openEditTimelineEntryModal('${e.type}', '${encodeURIComponent(e.subject)}', '${encodeURIComponent(e.item)}', ${e.ts}, '${e.track || ''}', '${e.chNum || ''}')"
                        class="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all active:scale-95" title="Edit Date & Time">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Data mapping for Trend Chart
        const sStartDate = AppStateRef.globalStartDate || AppStateRef.PLAN_START_DATE || new Date('2026-01-01');
        const sEndDate = AppStateRef.globalEndDate || AppStateRef.PLAN_END_DATE || new Date('2026-12-31');

        let chartStart = new Date(sStartDate instanceof Date ? sStartDate.getTime() : new Date(sStartDate).getTime());
        let chartEnd = new Date(sEndDate instanceof Date ? sEndDate.getTime() : new Date(sEndDate).getTime());
        const todayObj = new Date();
        if (todayObj > chartEnd) chartEnd = new Date(todayObj);

        chartStart.setHours(0, 0, 0, 0);
        chartEnd.setHours(0, 0, 0, 0);
        todayObj.setHours(0, 0, 0, 0);

        const days = [];
        let curr = new Date(chartStart.getTime());

        const studyCounts = {};
        const revCounts = {};

        allEvents.forEach(e => {
            let d = new Date(e.ts);
            d.setHours(0, 0, 0, 0);
            let key = d.toDateString();
            if (e.type === 'Chapter') studyCounts[key] = (studyCounts[key] || 0) + 1;
            if (e.type === 'Revision') revCounts[key] = (revCounts[key] || 0) + 1;
        });

        let studyData = [];
        let revData = [];

        while (curr <= chartEnd) {
            let key = curr.toDateString();
            days.push(curr.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));

            if (curr > todayObj) {
                studyData.push(null);
                revData.push(null);
            } else {
                studyData.push(studyCounts[key] || 0);
                revData.push(revCounts[key] || 0);
            }

            curr.setDate(curr.getDate() + 1);
        }

        container.innerHTML = `
            <div class="sticky top-0 z-10 bg-white dark:bg-slate-800 flex flex-col gap-3 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 pt-1 shrink-0">
                <div class="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
                    <div class="flex space-x-2 md:space-x-4">
                        <button id="ghm-tab-btn-timeline" onclick="window.switchGhmTab('timeline')" class="px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${global.currentGhmTab === 'timeline' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'} whitespace-nowrap">Timeline Entry</button>
                        <button id="ghm-tab-btn-subject" onclick="window.switchGhmTab('subject')" class="px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${global.currentGhmTab === 'subject' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'} whitespace-nowrap">Subject Folder</button>
                        <button id="ghm-tab-btn-trend" onclick="window.switchGhmTab('trend')" class="px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${global.currentGhmTab === 'trend' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'} whitespace-nowrap">Trend Chart</button>
                    </div>
                </div>

                <!-- Timeline Search Filter Input -->
                <div class="relative w-full">
                    <input type="text" id="ghm-search-input" value="${(global.ghmSearchQuery || '').replace(/"/g, '&quot;')}"
                        oninput="window.filterGlobalHistory(this.value)"
                        placeholder="Search timeline history by subject, chapter, or type..."
                        class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 pl-9 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400" />
                    <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    ${global.ghmSearchQuery ? `
                        <button onclick="window.filterGlobalHistory('')" class="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div id="ghm-view-timeline" class="flex-1 flex flex-col gap-2 relative ${global.currentGhmTab !== 'timeline' ? 'hidden' : ''}">
                ${timelineHtml || '<div class="p-8 text-center text-slate-400 font-bold text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl mt-2">No timeline data matches your criteria.</div>'}
            </div>
            <div id="ghm-view-subject" class="flex-1 flex flex-col relative ${global.currentGhmTab !== 'subject' ? 'hidden' : ''}">
                ${subjectHtml || '<div class="p-8 text-center text-slate-400 font-bold text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl mt-2">No subject data generated yet.</div>'}
            </div>
            <div id="ghm-view-trend" class="flex-1 flex flex-col relative min-h-[300px] ${global.currentGhmTab !== 'trend' ? 'hidden' : ''}">
                <div class="relative w-full h-[300px] sm:h-[400px] mt-2"><canvas id="globalDatabaseChart"></canvas></div>
            </div>
        `;

        // Render Chart only when the trend tab is active and visible
        if (global.currentGhmTab === 'trend') {
            const ctxChart = document.getElementById('globalDatabaseChart');
            if (ctxChart && typeof Chart !== 'undefined') {
                if (global.globalHistoryChartInstance) {
                    global.globalHistoryChartInstance.destroy();
                    global.globalHistoryChartInstance = null;
                }

                Chart.defaults.color = '#94a3b8';
                Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui';
                global.globalHistoryChartInstance = new Chart(ctxChart.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: days,
                        datasets: [
                            {
                                label: 'Study Chapters',
                                data: studyData,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                tension: 0.4, borderWidth: 3, fill: true,
                                pointBackgroundColor: '#3b82f6', pointRadius: 2, pointHoverRadius: 6, pointHoverBackgroundColor: '#fff'
                            },
                            {
                                label: 'Revision Chapters',
                                data: revData,
                                borderColor: '#8b5cf6',
                                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                tension: 0.4, borderWidth: 3, fill: true,
                                pointBackgroundColor: '#8b5cf6', pointRadius: 2, pointHoverRadius: 6, pointHoverBackgroundColor: '#fff'
                            }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { display: true, position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { weight: 'bold' } } },
                            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#fff', bodyColor: '#cbd5e1', cornerRadius: 8, padding: 12, callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y}` } }
                        },
                        scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false }, ticks: { font: { weight: 'bold' }, stepSize: 1 } },
                            x: { grid: { display: false, drawBorder: false }, ticks: { font: { weight: 'bold' }, maxTicksLimit: (typeof window !== 'undefined' && window.innerWidth < 640) ? 6 : 12 } }
                        }
                    }
                });
            }
        }

        if (global.currentGhmTab === 'trend' && global.globalHistoryChartInstance) {
            setTimeout(() => {
                if (global.globalHistoryChartInstance && typeof global.globalHistoryChartInstance.resize === 'function') {
                    global.globalHistoryChartInstance.resize();
                }
            }, 50);
        }

        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => {
                const tlView = document.getElementById('ghm-view-timeline');
                const subView = document.getElementById('ghm-view-subject');
                const trendView = document.getElementById('ghm-view-trend');
                if (tlView) tlView.scrollTop = scrollViews.timeline;
                if (subView) subView.scrollTop = scrollViews.subject;
                if (trendView) trendView.scrollTop = scrollViews.trend;
            });
        }
    }

    /**
     * Switches active tab in Global History modal.
     *
     * @param {string} tab - 'timeline' | 'subject' | 'trend'
     */
    function switchGhmTab(tab) {
        global.currentGhmTab = tab;
        ['timeline', 'subject', 'trend'].forEach(t => {
            const view = document.getElementById('ghm-view-' + t);
            const btn = document.getElementById('ghm-tab-btn-' + t);
            if (!view || !btn) return;

            if (t === tab) {
                view.classList.remove('hidden');
                btn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-blue-600 text-white shadow-md whitespace-nowrap";
            } else {
                view.classList.add('hidden');
                btn.className = "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 whitespace-nowrap";
            }
        });

        if (tab === 'trend') {
            renderGlobalHistoryContent(global.ghmSearchQuery);
        }
    }

    /**
     * Opens modal to edit timestamp of a historical chapter or revision completion.
     */
    function openEditTimelineEntryModal(type, encSubject, encItem, ts, track = '', chNum = '') {
        const subject = decodeURIComponent(encSubject);
        const item = decodeURIComponent(encItem);
        global.currentTimelineEditEntry = { type, subject, item, ts, track, chNum };

        if (typeof document === 'undefined') return;

        const subEl = document.getElementById('etem-subtitle');
        if (subEl) subEl.textContent = `${subject} • ${item} (${type})`;

        const dateObj = new Date(ts);
        const pad = n => String(n).padStart(2, '0');
        const dtStr = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;

        const dtInput = document.getElementById('etem-datetime');
        if (dtInput) dtInput.value = dtStr;

        if (typeof global.openModal === 'function') {
            global.openModal('edit-timeline-entry-modal');
        }
    }

    /**
     * Saves updated timestamp to AppState tasks or revision data and saves to cloud.
     */
    function saveTimelineEntryDate() {
        if (!global.currentTimelineEditEntry || typeof document === 'undefined') return;
        const dtInput = document.getElementById('etem-datetime');
        if (!dtInput || !dtInput.value) {
            toast("Please select a valid date and time.", "error");
            return;
        }

        const newDate = new Date(dtInput.value);
        if (isNaN(newDate.getTime())) {
            toast("Invalid date/time selected.", "error");
            return;
        }

        const newIsoStr = newDate.toISOString();
        const { type, subject, item, track, chNum } = global.currentTimelineEditEntry;
        const AppStateRef = global.AppState || (typeof window !== 'undefined' ? window.AppState : {}) || {};
        const tracksRef = global.tracks || (typeof window !== 'undefined' ? window.tracks : []) || [];

        if (type === 'Chapter') {
            const targetTrack = track || 'academic';
            if (typeof global.syncTaskChapterCompletion === 'function') {
                global.syncTaskChapterCompletion(targetTrack, subject, item, true, newIsoStr);
            }

            if (Array.isArray(AppStateRef.tasks)) {
                AppStateRef.tasks.forEach(t => {
                    if (t.type === 'study') {
                        tracksRef.forEach(tr => {
                            const key = tr.id + 'Tasks';
                            if (Array.isArray(t[key])) {
                                t[key].forEach(b => {
                                    if (b.subject === subject && (b.chapter === item || b.chapter === `Ch. ${item}` || b.chapter === item.replace(/^Ch\.\s*/, ''))) {
                                        b.completed = true;
                                        b.completedAt = newIsoStr;
                                    }
                                });
                            }
                        });
                    }
                });
            }
        } else if (type === 'Revision') {
            if (!global.revisionData) global.revisionData = { active: [], progress: {} };
            if (!global.revisionData.progress) global.revisionData.progress = {};
            if (!global.revisionData.progress[subject]) global.revisionData.progress[subject] = {};

            let cNum = chNum;
            if (!cNum && item) {
                cNum = item.replace(/^Ch\.\s*/, '').replace(/^Chapter\s*/, '').trim();
            }
            if (cNum) {
                global.revisionData.progress[subject][cNum] = newIsoStr;
            }
        }

        const FirebaseRef = global.FirebaseService || (typeof window !== 'undefined' ? window.FirebaseService : null);
        if (FirebaseRef && typeof FirebaseRef.saveToCloud === 'function') {
            FirebaseRef.saveToCloud();
        } else if (typeof global.saveState === 'function') {
            global.saveState();
        }

        if (typeof global.renderUI === 'function') global.renderUI();
        renderGlobalHistoryContent(global.ghmSearchQuery);

        if (typeof global.closeModal === 'function') {
            global.closeModal('edit-timeline-entry-modal');
        }
        toast("Entry time and date updated!", "success");
    }

    const HistoryAnalytics = {
        openGlobalHistoryModal,
        filterGlobalHistory,
        renderGlobalHistoryContent,
        switchGhmTab,
        openEditTimelineEntryModal,
        saveTimelineEntryDate
    };

    // Attach to global window scope
    global.HistoryAnalytics = HistoryAnalytics;
    global.openGlobalHistoryModal = openGlobalHistoryModal;
    global.filterGlobalHistory = filterGlobalHistory;
    global.renderGlobalHistoryContent = renderGlobalHistoryContent;
    global.switchGhmTab = switchGhmTab;
    global.openEditTimelineEntryModal = openEditTimelineEntryModal;
    global.saveTimelineEntryDate = saveTimelineEntryDate;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = HistoryAnalytics;
    }
})(typeof window !== 'undefined' ? window : globalThis);
