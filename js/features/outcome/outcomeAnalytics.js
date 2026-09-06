/**
 * X-29 Module: features/outcome/outcomeAnalytics.js
 * Program & Subject analytics, progression trend modals, and subject-wise bar breakdowns:
 * - Program-level progression charts (renderProgramTrendModal)
 * - Subject-by-subject target comparison bars and status tables (renderSubjectWiseTrend)
 * - Analytics modal view switching (overall vs subject-wise)
 * - Dataset visibility toggling
 */
(function (global) {
    'use strict';

    global.trendDatasetVisibility = global.trendDatasetVisibility || { actual: true, target: true };
    global.programTrendDatasetVisibility = global.programTrendDatasetVisibility || { actual: true, target: true };
    global.programTrendChartInstance = null;
    global.subjectWiseChartInstance = null;
    global.currentAnalyticsProgram = null;
    global.currentProgramAnalyticsView = 'overall';

    /**
     * Toggles dataset visibility on main results cards/charts.
     */
    function toggleTrendDataset(type) {
        if (!global.trendDatasetVisibility) global.trendDatasetVisibility = { actual: true, target: true };
        global.trendDatasetVisibility[type] = !global.trendDatasetVisibility[type];
        if (typeof global.renderResults === 'function') {
            global.renderResults();
        }
    }

    /**
     * Toggles dataset visibility on program trend progression modal.
     */
    function toggleProgramTrendDataset(type) {
        if (!global.programTrendDatasetVisibility) global.programTrendDatasetVisibility = { actual: true, target: true };
        global.programTrendDatasetVisibility[type] = !global.programTrendDatasetVisibility[type];
        if (global.currentAnalyticsProgram) {
            renderProgramTrendModal(global.currentAnalyticsProgram);
        }
    }

    /**
     * Opens Program Analytics modal and initializes view.
     */
    function showProgramAnalytics(progName) {
        global.currentAnalyticsProgram = progName;
        global.currentProgramAnalyticsView = 'overall';
        const titleEl = document.getElementById('ptm-results-title');
        if (titleEl) titleEl.textContent = `${progName} Progression`;
        switchProgramAnalyticsView('overall');
        if (typeof global.openModal === 'function') {
            global.openModal('program-trend-modal');
        }
    }

    /**
     * Switches between overall program progression and subject-wise breakdown view in modal.
     */
    function switchProgramAnalyticsView(view) {
        global.currentProgramAnalyticsView = view;
        const overallPanel = document.getElementById('ptm-overall-panel');
        const subjectPanel = document.getElementById('ptm-subject-panel');
        const btnOverall = document.getElementById('ptm-tab-overall');
        const btnSubject = document.getElementById('ptm-tab-subject');

        const activeTab = 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-105';
        const inactiveTab = 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400';

        if (view === 'overall') {
            if (overallPanel) overallPanel.classList.remove('hidden');
            if (subjectPanel) subjectPanel.classList.add('hidden');
            if (btnOverall) btnOverall.className = `flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab}`;
            if (btnSubject) btnSubject.className = `flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${inactiveTab}`;
            renderProgramTrendModal(global.currentAnalyticsProgram);
        } else {
            if (overallPanel) overallPanel.classList.add('hidden');
            if (subjectPanel) subjectPanel.classList.remove('hidden');
            if (btnOverall) btnOverall.className = `flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${inactiveTab}`;
            if (btnSubject) btnSubject.className = `flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab}`;
            renderSubjectWiseTrend(global.currentAnalyticsProgram);
        }
    }

    /**
     * Renders overall program trend bar chart comparing actual vs target CGPA.
     */
    function renderProgramTrendModal(progName) {
        const canvas = document.getElementById('programTrendCanvas');
        const legendEl = document.getElementById('program-trend-legend');
        if (!canvas) return;

        const getResultsFn = typeof global.getProcessedResults === 'function'
            ? global.getProcessedResults
            : () => (global.successResults || []);
        let cgpaResults = getResultsFn()
            .filter(r => r.type === 'cgpa' && !r.subject && r.title === progName);

        const parseDate = (typeof global.Utils !== 'undefined' && typeof global.Utils.parseDateSafe === 'function')
            ? global.Utils.parseDateSafe
            : (d => new Date(d));
        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.Utils.formatCgpaMin2Dec === 'function')
            ? global.Utils.formatCgpaMin2Dec
            : (v => Number(v).toFixed(2));

        cgpaResults.sort((a, b) => parseDate(a.date) - parseDate(b.date));

        let latestActual = '0.00';
        let latestTarget = '0.00';
        if (cgpaResults.length > 0) {
            latestActual = formatCgpa(parseFloat(cgpaResults[cgpaResults.length - 1].value) || 0);
            latestTarget = formatCgpa(parseFloat(cgpaResults[cgpaResults.length - 1].targetCGPA) || 0);
        }

        if (legendEl) {
            const getLegendHtml = (idxKey, color, label, val) => {
                const active = global.programTrendDatasetVisibility[idxKey];
                return `<div onclick="window.toggleProgramTrendDataset('${idxKey}')" class="cursor-pointer flex items-center space-x-1.5 md:space-x-2 px-2.5 md:px-3 py-1.5 md:px-3.5 md:py-2 bg-slate-900 rounded-lg md:rounded-xl border border-slate-700 hover:bg-slate-800 active:scale-95 transition-all ${active ? 'opacity-100 scale-100 shadow-md' : 'opacity-40 grayscale scale-95 line-through'}"><div class="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0" style="background-color: ${color}; box-shadow: 0 0 8px ${color}"></div><span class="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">${label}: ${val}</span></div>`;
            };
            legendEl.innerHTML =
                getLegendHtml('actual', '#06b6d4', 'Actual CGPA', latestActual) +
                getLegendHtml('target', '#f59e0b', 'Target CGPA', latestTarget);
        }

        if (cgpaResults.length === 0) {
            if (global.programTrendChartInstance) global.programTrendChartInstance.destroy();
            return;
        }

        const labels = cgpaResults.map(r => {
            const d = parseDate(r.date);
            const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            return `${r.title} (${dateStr})`;
        });
        const actualData = cgpaResults.map(r => parseFloat(r.value) || null);
        const targetData = cgpaResults.map(r => parseFloat(r.targetCGPA) || null);

        const allNumericValues = [];
        cgpaResults.forEach(r => {
            const act = parseFloat(r.value);
            const tgt = parseFloat(r.targetCGPA);
            if (!isNaN(act)) allNumericValues.push(act);
            if (!isNaN(tgt)) allNumericValues.push(tgt);
        });
        const yMin = 0;
        const maxVal = allNumericValues.length > 0 ? Math.max(...allNumericValues) : 4.0;
        const yMax = maxVal > 4.0 ? 5.0 : 4.0;

        if (global.programTrendChartInstance && typeof global.programTrendChartInstance.destroy === 'function') {
            global.programTrendChartInstance.destroy();
        }

        if (typeof Chart === 'undefined') return;
        const canvasCtx = canvas.getContext('2d');

        global.programTrendChartInstance = new Chart(canvasCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Actual CGPA',
                        data: actualData,
                        backgroundColor: '#06b6d4',
                        borderColor: '#06b6d4',
                        borderWidth: 0,
                        borderRadius: 6,
                        borderSkipped: false,
                        hidden: !global.programTrendDatasetVisibility.actual
                    },
                    {
                        label: 'Target CGPA',
                        data: targetData,
                        backgroundColor: '#f59e0b',
                        borderColor: '#f59e0b',
                        borderWidth: 0,
                        borderRadius: 6,
                        borderSkipped: false,
                        hidden: !global.programTrendDatasetVisibility.target
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        usePointStyle: true,
                        boxPadding: 6,
                        callbacks: {
                            title: (tooltipItems) => {
                                const item = cgpaResults[tooltipItems[0].dataIndex];
                                return `${item.title} (Overall Program)`;
                            },
                            label: (tooltipItem) => {
                                const item = cgpaResults[tooltipItem.dataIndex];
                                const isGrade = item.evaluationType === 'grade';
                                const actVal = item.value ? formatCgpa(item.value) : 'N/A';
                                const tgtVal = item.targetCGPA ? formatCgpa(item.targetCGPA) : 'N/A';
                                if (tooltipItem.datasetIndex === 0) {
                                    const labelPrefix = isGrade ? 'Actual Grade: ' + (item.grade || 'N/A') : 'Actual CGPA: ' + actVal;
                                    const labelSuffix = isGrade ? ` (Numeric: ${actVal})` : (item.grade ? ` [Grade: ${item.grade}]` : '');
                                    return ` ${labelPrefix}${labelSuffix}`;
                                } else {
                                    const labelPrefix = isGrade ? 'Target Grade: ' + (item.targetGrade || 'N/A') : 'Target CGPA: ' + tgtVal;
                                    const labelSuffix = isGrade ? ` (Numeric: ${tgtVal})` : '';
                                    return ` ${labelPrefix}${labelSuffix}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: yMin,
                        max: yMax,
                        ticks: { font: { size: 9, weight: 'bold' } },
                        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false }
                    },
                    x: {
                        ticks: { font: { size: 9, weight: 'bold' } },
                        grid: { display: false, drawBorder: false }
                    }
                }
            }
        });
    }

    /**
     * Renders subject-wise bar comparison and status breakdown for a program.
     */
    function renderSubjectWiseTrend(progName) {
        const container = document.getElementById('ptm-subject-panel');
        if (!container) return;

        const getResultsFn = typeof global.getProcessedResults === 'function'
            ? global.getProcessedResults
            : () => (global.successResults || []);
        const activeResults = getResultsFn();
        const parseDate = (typeof global.Utils !== 'undefined' && typeof global.Utils.parseDateSafe === 'function')
            ? global.Utils.parseDateSafe
            : (d => new Date(d));
        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.Utils.formatCgpaMin2Dec === 'function')
            ? global.Utils.formatCgpaMin2Dec
            : (v => Number(v).toFixed(2));
        const mapCgpaToGrade = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapCgpaToGrade === 'function')
            ? global.Utils.mapCgpaToGrade
            : (() => '');

        const overallRecords = activeResults
            .filter(r => r.type === 'cgpa' && !r.subject && r.title === progName)
            .sort((a, b) => parseDate(b.date) - parseDate(a.date));

        const latestOverall = overallRecords[0] || null;
        const isGradeMode = latestOverall && latestOverall.evaluationType === 'grade';
        const mainTarget = typeof global.getProgramMainTarget === 'function'
            ? global.getProgramMainTarget(progName)
            : { targetCGPA: '', targetGrade: '' };
        const programTargetCgpa = mainTarget.targetCGPA ? parseFloat(mainTarget.targetCGPA) : null;
        const programTargetGrade = mainTarget.targetGrade || null;

        const subjectMap = {};
        activeResults
            .filter(r => r.type === 'cgpa' && r.subject && r.title === progName)
            .forEach(r => {
                if (!subjectMap[r.subject] || parseDate(r.date) > parseDate(subjectMap[r.subject].date)) {
                    subjectMap[r.subject] = r;
                }
            });

        const subjects = Object.values(subjectMap).sort((a, b) => a.subject.localeCompare(b.subject));

        if (subjects.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 gap-3">
                    <span class="text-4xl grayscale opacity-40">📚</span>
                    <p class="text-slate-400 text-xs font-black uppercase tracking-widest text-center">No subject-level data recorded for this program yet.</p>
                    <p class="text-slate-400 text-[10px] font-bold text-center">Add subject scores using the Edit Program Card button.</p>
                </div>`;
            return;
        }

        const labels = subjects.map(s => s.subject.length > 18 ? s.subject.substring(0, 16) + '…' : s.subject);
        const actualData = subjects.map(s => parseFloat(s.value) || 0);
        const targetData = subjects.map(s => {
            const val = s.targetCGPA ? s.targetCGPA : programTargetCgpa;
            if (val === 'none' || val === null || val === undefined || val === '') return null;
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed;
        });

        const gradeLabels = subjects.map(s => s.grade || mapCgpaToGrade(s.value, isGradeMode ? 'grade' : 'cgpa') || '');
        const targetGradeLabel = programTargetGrade || (programTargetCgpa ? mapCgpaToGrade(programTargetCgpa, isGradeMode ? 'grade' : 'cgpa') : 'N/A');

        const allVals = actualData.concat(targetData.filter(v => v !== null));
        const maxVal = allVals.length > 0 ? Math.max.apply(null, allVals) : 4.0;
        const yMax = maxVal > 4.0 ? 5.0 : 4.0;

        const barColors = subjects.map(s => {
            const actual = parseFloat(s.value) || 0;
            const subTargetVal = s.targetCGPA ? s.targetCGPA : programTargetCgpa;
            if (subTargetVal === 'none' || subTargetVal === null || subTargetVal === undefined || subTargetVal === '') {
                return '#06b6d4';
            }
            const subTarget = parseFloat(subTargetVal);
            if (isNaN(subTarget)) return '#06b6d4';
            if (actual >= subTarget) return '#10b981';
            if (actual >= subTarget * 0.85) return '#f59e0b';
            return '#ef4444';
        });

        let legendHtml = `
            <div class="flex flex-wrap justify-center gap-1.5 sm:gap-2 shrink-0">
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-700">
                    <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span class="text-[9px] font-black text-white uppercase tracking-widest">Actual (Met Target)</span>
                </div>
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-700">
                    <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <span class="text-[9px] font-black text-white uppercase tracking-widest">Actual (Near Target)</span>
                </div>
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-700">
                    <div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span class="text-[9px] font-black text-white uppercase tracking-widest">Actual (Below Target)</span>
                </div>
        `;

        const hasTarget = targetData.some(v => v !== null);
        if (hasTarget) {
            legendHtml += `
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-700">
                    <div class="w-2.5 h-2.5 rounded bg-slate-400/80 border border-slate-300"></div>
                    <span class="text-[9px] font-black text-white uppercase tracking-widest">Subject Target Bar</span>
                </div>`;
        }
        legendHtml += '</div>';

        const tableRowsHtml = subjects.map((s, i) => {
            const actual = parseFloat(s.value) || 0;
            const subTargetVal = s.targetCGPA ? s.targetCGPA : programTargetCgpa;
            const isTgtNone = subTargetVal === 'none' || subTargetVal === null || subTargetVal === undefined || subTargetVal === '';
            const subTarget = isTgtNone ? null : parseFloat(subTargetVal);
            const subTargetGrade = isTgtNone ? 'None' : (s.targetGrade || (s.targetCGPA ? mapCgpaToGrade(s.targetCGPA, isGradeMode ? 'grade' : 'cgpa') : targetGradeLabel));

            const met = subTarget !== null && !isNaN(subTarget) && actual >= subTarget;
            const near = subTarget !== null && !isNaN(subTarget) && !met && actual >= subTarget * 0.85;
            const statusDot = isTgtNone ? '⚪' : (met ? '🟢' : (near ? '🟡' : '🔴'));
            const statusText = isTgtNone ? 'N/A' : (met ? 'Met' : (near ? 'Near' : 'Below'));
            const targetDisp = isTgtNone ? 'None' : formatCgpa(subTargetVal);

            const gradeVal = gradeLabels[i] || '';
            const isFailed = isGradeMode
                ? (gradeVal && ['C', 'D', 'E', 'F'].includes(gradeVal.trim().toUpperCase()))
                : (s.value && parseFloat(s.value) < 2.0);

            const cgpaColorClass = isFailed ? 'text-red-500 dark:text-red-400 font-black' : 'text-cyan-600 dark:text-cyan-400 font-bold';
            const gradeColorClass = isFailed ? 'text-red-500 dark:text-red-400 font-black' : 'text-yellow-500 font-bold';
            const tgtGradeSpan = isTgtNone ? '' : ` <span class="text-[9px]">(${subTargetGrade || 'N/A'})</span>`;

            return `
                <tr class="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                    <td class="py-1.5 pr-2 font-bold text-slate-700 dark:text-slate-300 max-w-[120px] truncate">${s.subject}</td>
                    <td class="py-1.5 px-2 text-center ${cgpaColorClass}">${formatCgpa(actual)}</td>
                    <td class="py-1.5 px-2 text-center ${gradeColorClass}">${gradeVal || '—'}</td>
                    <td class="py-1.5 px-2 text-center font-bold text-slate-400">${targetDisp}${tgtGradeSpan}</td>
                    <td class="py-1.5 pl-2 text-center text-[10px] font-black">${statusDot} ${statusText}</td>
                </tr>`;
        }).join('');

        container.innerHTML = `
            <div class="h-[260px] sm:h-[330px] md:h-[400px] min-h-[240px] w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-4 shadow-inner flex flex-col relative">
                <div class="relative flex-1 w-full h-full"><canvas id="subjectWiseCanvas"></canvas></div>
            </div>
            ${legendHtml}
            <div class="overflow-y-auto max-h-[160px] custom-scrollbar">
                <table class="w-full text-xs">
                    <thead>
                        <tr class="border-b border-slate-200 dark:border-slate-700">
                            <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 py-1.5 pr-2">Subject</th>
                            <th class="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 py-1.5 px-2">Actual</th>
                            <th class="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 py-1.5 px-2">Grade</th>
                            <th class="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 py-1.5 px-2">Target</th>
                            <th class="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 py-1.5 pl-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>${tableRowsHtml}</tbody>
                </table>
            </div>`;

        const subCanvas = document.getElementById('subjectWiseCanvas');
        if (!subCanvas || typeof Chart === 'undefined') return;
        if (global.subjectWiseChartInstance && typeof global.subjectWiseChartInstance.destroy === 'function') {
            global.subjectWiseChartInstance.destroy();
        }

        const subCtx = subCanvas.getContext('2d');
        global.subjectWiseChartInstance = new Chart(subCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Actual CGPA',
                        data: actualData,
                        backgroundColor: barColors,
                        borderWidth: 0,
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ].concat(hasTarget ? [{
                    label: 'Subject Target',
                    data: targetData,
                    type: 'bar',
                    backgroundColor: 'rgba(148, 163, 184, 0.4)',
                    borderColor: '#94a3b8',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false
                }] : [])
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
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            title: (items) => subjects[items[0].dataIndex] ? subjects[items[0].dataIndex].subject : '',
                            label: (item) => {
                                const s = subjects[item.dataIndex];
                                if (item.datasetIndex === 0) {
                                    const g = gradeLabels[item.dataIndex];
                                    return ' Actual: ' + formatCgpa(s.value) + (g ? ' (' + g + ')' : '');
                                }
                                const subTargetVal = s.targetCGPA ? s.targetCGPA : programTargetCgpa;
                                const isNone = subTargetVal === 'none' || !subTargetVal;
                                const subTarget = isNone ? null : parseFloat(subTargetVal);
                                const subTargetGrade = isNone ? 'None' : (s.targetGrade || (s.targetCGPA ? mapCgpaToGrade(s.targetCGPA, isGradeMode ? 'grade' : 'cgpa') : targetGradeLabel));
                                return ' Target: ' + (subTarget !== null && !isNaN(subTarget) ? formatCgpa(subTargetVal) : 'None') + ' (' + (subTargetGrade || 'N/A') + ')';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: yMax,
                        ticks: { font: { size: 9, weight: 'bold' } },
                        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false }
                    },
                    x: {
                        ticks: { font: { size: 8, weight: 'bold' }, maxRotation: 35, minRotation: 0 },
                        grid: { display: false, drawBorder: false }
                    }
                }
            }
        });
    }

    // Attach to global scope
    const OutcomeAnalytics = {
        toggleTrendDataset,
        toggleProgramTrendDataset,
        showProgramAnalytics,
        switchProgramAnalyticsView,
        renderProgramTrendModal,
        renderSubjectWiseTrend
    };

    global.OutcomeAnalytics = OutcomeAnalytics;
    global.toggleTrendDataset = toggleTrendDataset;
    global.toggleProgramTrendDataset = toggleProgramTrendDataset;
    global.showProgramAnalytics = showProgramAnalytics;
    global.switchProgramAnalyticsView = switchProgramAnalyticsView;
    global.renderProgramTrendModal = renderProgramTrendModal;
    global.renderSubjectWiseTrend = renderSubjectWiseTrend;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = OutcomeAnalytics;
    }
})(typeof window !== 'undefined' ? window : globalThis);
