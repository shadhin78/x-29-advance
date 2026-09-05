/**
 * Outcome Page Module (pages/Outcome/Outcome.js)
 * Canonical single source of truth for Outcome, Success & Results logic:
 * - Scorecards, CGPAs, Grades, and General Achievements
 * - Results Performance Trend and Progression Analytics Charts
 * - Pass / Freeze Configuration management
 * - Milestone Celebration Criteria selection & live progress tracking
 * - Result Modal entry, bulk editing, and deletion
 */

(function () {
    'use strict';

    /**
     * Page Lifecycle & Manager
     */
    const OutcomePage = {
        isMounted: false,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            // 1. Render Program Filter Toggles Bar
            if (typeof window.renderOutcomeProgramToggles === 'function') {
                window.renderOutcomeProgramToggles();
            }

            // 2. Render Results Cards & Performance Trend Chart
            if (typeof window.renderResults === 'function') {
                window.renderResults();
            }

            // 3. Render Pass / Freeze Configuration
            if (typeof window.renderPassConfig === 'function') {
                window.renderPassConfig();
            }

            // 4. Render Milestone Celebration Criteria
            if (typeof window.renderCelebrationConfig === 'function') {
                window.renderCelebrationConfig();
            }

            // 5. Trigger chart resize after layout settle
            setTimeout(() => {
                if (window.resultsTrendChartInstance && typeof window.resultsTrendChartInstance.resize === 'function') {
                    window.resultsTrendChartInstance.resize();
                }
            }, 50);
        },

        destroy: function () {
            this.isMounted = false;

            // Safely destroy Chart.js instances to avoid memory leaks
            if (window.resultsTrendChartInstance) {
                try {
                    window.resultsTrendChartInstance.destroy();
                } catch (e) {}
                window.resultsTrendChartInstance = null;
            }
            if (window.programTrendChartInstance) {
                try {
                    window.programTrendChartInstance.destroy();
                } catch (e) {}
                window.programTrendChartInstance = null;
            }
            if (window.subjectWiseChartInstance) {
                try {
                    window.subjectWiseChartInstance.destroy();
                } catch (e) {}
                window.subjectWiseChartInstance = null;
            }

            // Safely close outcome-related modals if open when navigating away
            if (typeof window.closeModal === 'function') {
                const modals = ['result-modal', 'program-trend-modal', 'celebration-setup-modal'];
                modals.forEach(m => {
                    const el = document.getElementById(m);
                    if (el && !el.classList.contains('hidden')) {
                        window.closeModal(m);
                    }
                });
            }
        },

        openResultModal: function (id = null, editProgramName = null) {
            window.openResultModal(id, editProgramName);
        }
    };

    window.OutcomePage = OutcomePage;

    /* ==========================================================================
       Modal Input Helpers & Auto-Badges (CGPA, Grade, Real-time Estimation)
       ========================================================================== */

    window.onCgpaBlur = function (inputEl) {
        const formatted = Utils.validateAndFormatCgpa(inputEl.value);
        inputEl.value = formatted;
        window.onCgpaInput(inputEl);
    };

    // Called when a CGPA input changes → update sibling auto-grade badge
    window.onCgpaInput = function (inputEl) {
        let valStr = inputEl.value;
        // Remove negative signs and invalid characters
        valStr = valStr.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        const parts = valStr.split('.');
        if (parts.length > 2) {
            valStr = parts[0] + '.' + parts.slice(1).join('');
        }
        // Real-time clamp (prevent value > 4)
        let val = parseFloat(valStr);
        if (!isNaN(val)) {
            if (val < 0) valStr = '0.00';
            if (val > 4.0) valStr = '4.00';
        }
        if (inputEl.value !== valStr) {
            inputEl.value = valStr;
        }

        const badge = inputEl.parentElement.querySelector('.auto-grade-badge');
        if (badge) {
            const g = Utils.mapCgpaToGrade(inputEl.value);
            badge.textContent = g || '—';
            badge.classList.toggle('opacity-40', !g);
        }
    };

    // Helper to update auto-cgpa badge based on grade selection
    window.updateCgpaBadge = function (gradeVal, badge) {
        if (badge) {
            const evalType = document.getElementById('res-evaluation-type')?.value || 'cgpa';
            const c = Utils.mapGradeToNumeric(gradeVal, evalType);
            badge.textContent = gradeVal ? Utils.formatCgpaMin2Dec(c) : '—';
            badge.classList.toggle('opacity-40', !gradeVal);
        }
    };

    // Called when a grade select changes → update sibling auto-cgpa badge
    window.onGradeSelect = function (selectEl) {
        const badge = selectEl.parentElement.querySelector('.auto-cgpa-badge');
        window.updateCgpaBadge(selectEl.value, badge);
    };

    // Update all subject target badges from the overall program target
    window.updateSubjectTargets = function () {
        const evalType = document.getElementById('res-evaluation-type')?.value || 'cgpa';
        const isGrade = evalType === 'grade';
        let targetCgpa = '';
        let targetGrade = '';
        if (isGrade) {
            targetGrade = (document.getElementById('res-overall-target-grade')?.value || '').trim();
            if (targetGrade.toLowerCase() === 'none' || targetGrade === '0') {
                targetGrade = 'none';
                targetCgpa = 'none';
            } else {
                targetCgpa = targetGrade ? Utils.formatCgpaMin2Dec(Utils.mapGradeToNumeric(targetGrade, evalType)) : '';
            }
        } else {
            targetCgpa = (document.getElementById('res-overall-target-cgpa')?.value || '').trim();
            if (targetCgpa.toLowerCase() === 'none' || targetCgpa === '0') {
                targetCgpa = 'none';
                targetGrade = 'none';
            } else {
                targetGrade = targetCgpa ? Utils.mapCgpaToGrade(targetCgpa) : '';
            }
        }

        document.querySelectorAll('.res-sub-target-badge').forEach(badge => {
            if (targetCgpa && targetCgpa !== 'none' && targetGrade && targetGrade !== 'none') {
                badge.textContent = isGrade ? `Target: ${targetGrade} (${targetCgpa})` : `Target: ${targetCgpa} (${targetGrade})`;
                badge.classList.remove('opacity-30');
            } else if (targetCgpa === 'none') {
                badge.textContent = 'Target: None';
                badge.classList.add('opacity-30');
            } else {
                badge.textContent = 'Target: —';
                badge.classList.add('opacity-30');
            }
        });
    };

    // Real-time overall score estimation from subject inputs in modal
    window.updateModalEstScore = function () {
        const evalTypeEl = document.getElementById('res-evaluation-type');
        if (!evalTypeEl) return;
        const evalType = evalTypeEl.value;
        const isGrade = evalType === 'grade';

        const estCgpaEl = document.getElementById('res-overall-est-cgpa');
        const estGradeEl = document.getElementById('res-overall-est-grade');

        if (isGrade) {
            const gradeInputs = document.querySelectorAll('.res-sub-grade-input');
            const grades = [];
            gradeInputs.forEach(input => {
                const val = input.value.trim();
                if (val) grades.push(val);
            });

            if (grades.length > 0) {
                const sumCgpa = grades.reduce((sum, g) => sum + Utils.mapGradeToNumeric(g, 'grade'), 0);
                const avgCgpa = sumCgpa / grades.length;
                const estGrade = Utils.mapCgpaToGrade(avgCgpa, 'grade');

                if (estGradeEl) estGradeEl.value = estGrade;
                const badge = estGradeEl ? estGradeEl.parentElement.querySelector('.auto-cgpa-badge') : null;
                if (badge) {
                    badge.textContent = Utils.formatCgpaMin2Dec(avgCgpa);
                    badge.classList.remove('opacity-40');
                }
            } else {
                if (estGradeEl) estGradeEl.value = '';
                const badge = estGradeEl ? estGradeEl.parentElement.querySelector('.auto-cgpa-badge') : null;
                if (badge) {
                    badge.textContent = '—';
                    badge.classList.add('opacity-40');
                }
            }
        } else {
            const cgpaInputs = document.querySelectorAll('.res-sub-cgpa-input');
            const cgpas = [];
            cgpaInputs.forEach(input => {
                const val = parseFloat(input.value.trim());
                if (!isNaN(val)) cgpas.push(val);
            });

            if (cgpas.length > 0) {
                const avgCgpa = cgpas.reduce((sum, c) => sum + c, 0) / cgpas.length;
                const estGrade = Utils.mapCgpaToGrade(avgCgpa, 'cgpa');

                if (estCgpaEl) estCgpaEl.value = Utils.formatCgpaMin2Dec(avgCgpa);
                const badge = estCgpaEl ? estCgpaEl.parentElement.querySelector('.auto-grade-badge') : null;
                if (badge) {
                    badge.textContent = estGrade || '—';
                    badge.classList.remove('opacity-40');
                }
            } else {
                if (estCgpaEl) estCgpaEl.value = '';
                const badge = estCgpaEl ? estCgpaEl.parentElement.querySelector('.auto-grade-badge') : null;
                if (badge) {
                    badge.textContent = '—';
                    badge.classList.add('opacity-40');
                }
            }
        }
    };

    /* ==========================================================================
       Trend Datasets & Progression Analytics Modal
       ========================================================================== */

    window.trendDatasetVisibility = window.trendDatasetVisibility || { actual: true, target: true };

    window.toggleTrendDataset = function (type) {
        window.trendDatasetVisibility[type] = !window.trendDatasetVisibility[type];
        window.renderResults();
    };

    window.programTrendChartInstance = null;
    window.programTrendDatasetVisibility = { actual: true, target: true };

    window.toggleProgramTrendDataset = function (type) {
        window.programTrendDatasetVisibility[type] = !window.programTrendDatasetVisibility[type];
        if (window.currentAnalyticsProgram) {
            window.renderProgramTrendModal(window.currentAnalyticsProgram);
        }
    };

    window.showProgramAnalytics = function (progName) {
        window.currentAnalyticsProgram = progName;
        window.currentProgramAnalyticsView = 'overall';
        const titleEl = document.getElementById('ptm-results-title');
        if (titleEl) titleEl.textContent = `${progName} Progression`;
        window.switchProgramAnalyticsView('overall');
        openModal('program-trend-modal');
    };

    window.switchProgramAnalyticsView = function (view) {
        window.currentProgramAnalyticsView = view;
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
            window.renderProgramTrendModal(window.currentAnalyticsProgram);
        } else {
            if (overallPanel) overallPanel.classList.add('hidden');
            if (subjectPanel) subjectPanel.classList.remove('hidden');
            if (btnOverall) btnOverall.className = `flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${inactiveTab}`;
            if (btnSubject) btnSubject.className = `flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab}`;
            window.renderSubjectWiseTrend(window.currentAnalyticsProgram);
        }
    };

    window.renderProgramTrendModal = function (progName) {
        const canvas = document.getElementById('programTrendCanvas');
        const legendEl = document.getElementById('program-trend-legend');
        if (!canvas) return;

        // Filter CGPAs for this specific program (overall only, no subjects)
        const getResultsFn = typeof window.getProcessedResults === 'function' ? window.getProcessedResults : () => (window.successResults || []);
        let cgpaResults = getResultsFn()
            .filter(r => r.type === 'cgpa' && !r.subject && r.title === progName);

        cgpaResults.sort((a, b) => Utils.parseDateSafe(a.date) - Utils.parseDateSafe(b.date));

        // Calculate overall stats for legend
        let latestActual = '0.00';
        let latestTarget = '0.00';
        if (cgpaResults.length > 0) {
            latestActual = Utils.formatCgpaMin2Dec(parseFloat(cgpaResults[cgpaResults.length - 1].value) || 0);
            latestTarget = Utils.formatCgpaMin2Dec(parseFloat(cgpaResults[cgpaResults.length - 1].targetCGPA) || 0);
        }

        // Legend rendering
        if (legendEl) {
            const getLegendHtml = (idxKey, color, label, val) => {
                const active = window.programTrendDatasetVisibility[idxKey];
                return `<div onclick="window.toggleProgramTrendDataset('${idxKey}')" class="cursor-pointer flex items-center space-x-1.5 md:space-x-2 px-2.5 md:px-3 py-1.5 md:px-3.5 md:py-2 bg-slate-900 rounded-lg md:rounded-xl border border-slate-700 hover:bg-slate-800 active:scale-95 transition-all ${active ? 'opacity-100 scale-100 shadow-md' : 'opacity-40 grayscale scale-95 line-through'}"><div class="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0" style="background-color: ${color}; box-shadow: 0 0 8px ${color}"></div><span class="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">${label}: ${val}</span></div>`;
            };
            legendEl.innerHTML =
                getLegendHtml('actual', '#06b6d4', 'Actual CGPA', latestActual) +
                getLegendHtml('target', '#f59e0b', 'Target CGPA', latestTarget);
        }

        if (cgpaResults.length === 0) {
            if (window.programTrendChartInstance) window.programTrendChartInstance.destroy();
            return;
        }

        const labels = cgpaResults.map(r => {
            const d = Utils.parseDateSafe(r.date);
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

        if (window.programTrendChartInstance) window.programTrendChartInstance.destroy();

        const canvasCtx = canvas.getContext('2d');

        window.programTrendChartInstance = new Chart(canvasCtx, {
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
                        hidden: !window.programTrendDatasetVisibility.actual
                    },
                    {
                        label: 'Target CGPA',
                        data: targetData,
                        backgroundColor: '#f59e0b',
                        borderColor: '#f59e0b',
                        borderWidth: 0,
                        borderRadius: 6,
                        borderSkipped: false,
                        hidden: !window.programTrendDatasetVisibility.target
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
                                const actVal = item.value ? Utils.formatCgpaMin2Dec(item.value) : 'N/A';
                                const tgtVal = item.targetCGPA ? Utils.formatCgpaMin2Dec(item.targetCGPA) : 'N/A';
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
    };

    window.renderSubjectWiseTrend = function (progName) {
        var container = document.getElementById('ptm-subject-panel');
        if (!container) return;

        const getResultsFn = typeof window.getProcessedResults === 'function' ? window.getProcessedResults : () => (window.successResults || []);
        var activeResults = getResultsFn();
        var overallRecords = activeResults
            .filter(function (r) { return r.type === 'cgpa' && !r.subject && r.title === progName; })
            .sort(function (a, b) { return Utils.parseDateSafe(b.date) - Utils.parseDateSafe(a.date); });

        var latestOverall = overallRecords[0] || null;
        var isGradeMode = latestOverall && latestOverall.evaluationType === 'grade';
        var mainTarget = typeof window.getProgramMainTarget === 'function' ? window.getProgramMainTarget(progName) : { targetCGPA: '', targetGrade: '' };
        var programTargetCgpa = mainTarget.targetCGPA ? parseFloat(mainTarget.targetCGPA) : null;
        var programTargetGrade = mainTarget.targetGrade || null;

        var subjectMap = {};
        activeResults
            .filter(function (r) { return r.type === 'cgpa' && r.subject && r.title === progName; })
            .forEach(function (r) {
                if (!subjectMap[r.subject] || Utils.parseDateSafe(r.date) > Utils.parseDateSafe(subjectMap[r.subject].date)) {
                    subjectMap[r.subject] = r;
                }
            });

        var subjects = Object.values(subjectMap).sort(function (a, b) { return a.subject.localeCompare(b.subject); });

        if (subjects.length === 0) {
            container.innerHTML =
                '<div class="flex flex-col items-center justify-center py-10 gap-3">' +
                '<span class="text-4xl grayscale opacity-40">📚</span>' +
                '<p class="text-slate-400 text-xs font-black uppercase tracking-widest text-center">No subject-level data recorded for this program yet.</p>' +
                '<p class="text-slate-400 text-[10px] font-bold text-center">Add subject scores using the Edit Program Card button.</p>' +
                '</div>';
            return;
        }

        var labels = subjects.map(function (s) {
            return s.subject.length > 18 ? s.subject.substring(0, 16) + '…' : s.subject;
        });

        var actualData = subjects.map(function (s) { return parseFloat(s.value) || 0; });

        var targetData = subjects.map(function (s) {
            var val = s.targetCGPA ? s.targetCGPA : programTargetCgpa;
            if (val === 'none' || val === null || val === undefined || val === '') return null;
            var parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed;
        });

        var gradeLabels = subjects.map(function (s) { return s.grade || Utils.mapCgpaToGrade(s.value, isGradeMode ? 'grade' : 'cgpa') || ''; });
        var targetGradeLabel = programTargetGrade || (programTargetCgpa ? Utils.mapCgpaToGrade(programTargetCgpa, isGradeMode ? 'grade' : 'cgpa') : 'N/A');

        var allVals = actualData.concat(targetData.filter(function (v) { return v !== null; }));
        var maxVal = allVals.length > 0 ? Math.max.apply(null, allVals) : 4.0;
        var yMax = maxVal > 4.0 ? 5.0 : 4.0;

        var barColors = subjects.map(function (s) {
            var actual = parseFloat(s.value) || 0;
            var subTargetVal = s.targetCGPA ? s.targetCGPA : programTargetCgpa;
            if (subTargetVal === 'none' || subTargetVal === null || subTargetVal === undefined || subTargetVal === '') {
                return '#06b6d4';
            }
            var subTarget = parseFloat(subTargetVal);
            if (isNaN(subTarget)) return '#06b6d4';
            if (actual >= subTarget) return '#10b981';
            if (actual >= subTarget * 0.85) return '#f59e0b';
            return '#ef4444';
        });

        var legendHtml =
            '<div class="flex flex-wrap justify-center gap-1.5 sm:gap-2 shrink-0">' +
            '<div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-700">' +
            '<div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>' +
            '<span class="text-[9px] font-black text-white uppercase tracking-widest">Actual (Met Target)</span>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-700">' +
            '<div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>' +
            '<span class="text-[9px] font-black text-white uppercase tracking-widest">Actual (Near Target)</span>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-700">' +
            '<div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>' +
            '<span class="text-[9px] font-black text-white uppercase tracking-widest">Actual (Below Target)</span>' +
            '</div>';

        var hasTarget = targetData.some(function (v) { return v !== null; });
        if (hasTarget) {
            legendHtml +=
                '<div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-700">' +
                '<div class="w-2.5 h-2.5 rounded bg-slate-400/80 border border-slate-300"></div>' +
                '<span class="text-[9px] font-black text-white uppercase tracking-widest">Subject Target Bar</span>' +
                '</div>';
        }
        legendHtml += '</div>';

        var tableRowsHtml = subjects.map(function (s, i) {
            var actual = parseFloat(s.value) || 0;
            var subTargetVal = s.targetCGPA ? s.targetCGPA : programTargetCgpa;
            var isTgtNone = subTargetVal === 'none' || subTargetVal === null || subTargetVal === undefined || subTargetVal === '';
            var subTarget = isTgtNone ? null : parseFloat(subTargetVal);
            var subTargetGrade = isTgtNone ? 'None' : (s.targetGrade || (s.targetCGPA ? Utils.mapCgpaToGrade(s.targetCGPA, isGradeMode ? 'grade' : 'cgpa') : targetGradeLabel));

            var met = subTarget !== null && !isNaN(subTarget) && actual >= subTarget;
            var near = subTarget !== null && !isNaN(subTarget) && !met && actual >= subTarget * 0.85;
            var statusDot = isTgtNone ? '⚪' : (met ? '🟢' : (near ? '🟡' : '🔴'));
            var statusText = isTgtNone ? 'N/A' : (met ? 'Met' : (near ? 'Near' : 'Below'));
            var targetDisp = isTgtNone ? 'None' : Utils.formatCgpaMin2Dec(subTargetVal);

            var gradeVal = gradeLabels[i] || '';
            var isFailed = isGradeMode
                ? (gradeVal && ['C', 'D', 'E', 'F'].includes(gradeVal.trim().toUpperCase()))
                : (s.value && parseFloat(s.value) < 2.0);

            var cgpaColorClass = isFailed ? 'text-red-500 dark:text-red-400 font-black' : 'text-cyan-600 dark:text-cyan-400 font-bold';
            var gradeColorClass = isFailed ? 'text-red-500 dark:text-red-400 font-black' : 'text-yellow-500 font-bold';

            var tgtGradeSpan = isTgtNone ? '' : ' <span class="text-[9px]">(' + (subTargetGrade || 'N/A') + ')</span>';

            return '<tr class="border-b border-slate-100 dark:border-slate-700/60 last:border-0">' +
                '<td class="py-1.5 pr-2 font-bold text-slate-700 dark:text-slate-300 max-w-[120px] truncate">' + s.subject + '</td>' +
                '<td class="py-1.5 px-2 text-center ' + cgpaColorClass + '">' + Utils.formatCgpaMin2Dec(actual) + '</td>' +
                '<td class="py-1.5 px-2 text-center ' + gradeColorClass + '">' + (gradeVal || '—') + '</td>' +
                '<td class="py-1.5 px-2 text-center font-bold text-slate-400">' + targetDisp + tgtGradeSpan + '</td>' +
                '<td class="py-1.5 pl-2 text-center text-[10px] font-black">' + statusDot + ' ' + statusText + '</td>' +
                '</tr>';
        }).join('');

        container.innerHTML =
            '<div class="h-[260px] sm:h-[330px] md:h-[400px] min-h-[240px] w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-4 shadow-inner flex flex-col relative">' +
            '<div class="relative flex-1 w-full h-full"><canvas id="subjectWiseCanvas"></canvas></div>' +
            '</div>' +
            legendHtml +
            '<div class="overflow-y-auto max-h-[160px] custom-scrollbar">' +
            '<table class="w-full text-xs">' +
            '<thead><tr class="border-b border-slate-200 dark:border-slate-700">' +
            '<th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 py-1.5 pr-2">Subject</th>' +
            '<th class="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 py-1.5 px-2">Actual</th>' +
            '<th class="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 py-1.5 px-2">Grade</th>' +
            '<th class="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 py-1.5 px-2">Target</th>' +
            '<th class="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 py-1.5 pl-2">Status</th>' +
            '</tr></thead>' +
            '<tbody>' +
            tableRowsHtml +
            '</tbody>' +
            '</table>' +
            '</div>';

        var subCanvas = document.getElementById('subjectWiseCanvas');
        if (!subCanvas) return;
        if (window.subjectWiseChartInstance) window.subjectWiseChartInstance.destroy();

        var subCtx = subCanvas.getContext('2d');
        window.subjectWiseChartInstance = new Chart(subCtx, {
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
                            title: function (items) {
                                return subjects[items[0].dataIndex] ? subjects[items[0].dataIndex].subject : '';
                            },
                            label: function (item) {
                                if (item.datasetIndex === 0) {
                                    var s = subjects[item.dataIndex];
                                    var g = gradeLabels[item.dataIndex];
                                    return ' Actual: ' + Utils.formatCgpaMin2Dec(s.value) + (g ? ' (' + g + ')' : '');
                                }
                                var s = subjects[item.dataIndex];
                                var subTargetVal = s.targetCGPA ? s.targetCGPA : programTargetCgpa;
                                var isNone = subTargetVal === 'none' || !subTargetVal;
                                var subTarget = isNone ? null : parseFloat(subTargetVal);
                                var subTargetGrade = isNone ? 'None' : (s.targetGrade || (s.targetCGPA ? Utils.mapCgpaToGrade(s.targetCGPA, isGradeMode ? 'grade' : 'cgpa') : targetGradeLabel));
                                return ' Target: ' + (subTarget !== null && !isNaN(subTarget) ? Utils.formatCgpaMin2Dec(subTargetVal) : 'None') + ' (' + (subTargetGrade || 'N/A') + ')';
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
    };

    /* ==========================================================================
       Outcome Programs Visibility Toggle Bar
       ========================================================================== */

    window.renderOutcomeProgramToggles = function () {
        const bar = document.getElementById('outcome-programs-toggle-bar');
        if (!bar) return;

        if (!window.programVisibility) {
            window.programVisibility = {};
            if (typeof window.getAllPrograms === 'function') {
                window.getAllPrograms().forEach(pObj => {
                    const pName = pObj.name || pObj;
                    window.programVisibility[pName] = true;
                });
            }
        }

        let html = '';
        const allProgs = typeof window.getAllPrograms === 'function' ? window.getAllPrograms() : [];
        allProgs.forEach(pObj => {
            const pName = pObj.name || pObj;
            const active = window.programVisibility[pName] !== false;
            const color = typeof window.getProgramColor === 'function' ? window.getProgramColor(pName) : '#eab308';

            const activeStyle = active
                ? `background-color: ${color}; color: white; border-color: ${color};`
                : `background-color: transparent; border-color: #cbd5e1; color: #64748b; opacity: 0.6;`;

            html += `
                    <button onclick="window.toggleOutcomeProgram('${pName.replace(/'/g, "\\'")}')" 
                        class="px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95 flex items-center gap-1.5 shadow-sm" 
                        style="${activeStyle}">
                        <span class="w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-slate-400'}"></span>
                        <span>${pName}</span>
                    </button>`;
        });

        bar.innerHTML = html;
    };

    window.toggleOutcomeProgram = function (pName) {
        if (!window.programVisibility) window.programVisibility = {};
        window.programVisibility[pName] = !window.programVisibility[pName];

        // Sync with chart visibility as well
        if (window.chartVisibility && window.chartVisibility.prog) {
            window.chartVisibility.prog[pName] = window.programVisibility[pName];
            if (window.mainChartPrograms) {
                const ds = window.mainChartPrograms.data.datasets.find(d => d.label === pName);
                if (ds) ds.hidden = !window.programVisibility[pName];
                window.mainChartPrograms.update();
            }
        }

        // Save and re-render
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') {
            renderUI();
        }
    };

    /* ==========================================================================
       Outcome Scorecards & Main Trend Chart Rendering
       ========================================================================== */

    window.outcomeDateSortOrder = (typeof safeStorage !== 'undefined' ? safeStorage.getItem('outcome_date_sort_order') : null) || 'desc';

    window.toggleOutcomeDateSort = function () {
        window.outcomeDateSortOrder = (window.outcomeDateSortOrder === 'asc') ? 'desc' : 'asc';
        try {
            if (typeof safeStorage !== 'undefined') {
                safeStorage.setItem('outcome_date_sort_order', window.outcomeDateSortOrder);
            }
        } catch (e) {}
        window.renderResults();
        if (typeof window.renderDashboardOutcomeCard === 'function') {
            window.renderDashboardOutcomeCard();
        }
    };

    window.renderSuccessResults = function () {
        window.renderResults();
    };

    window.renderResults = function () {
        if (typeof window.renderDashboardOutcomeCard === 'function') {
            window.renderDashboardOutcomeCard();
        }
        const container = document.getElementById('results-container');
        const trendContainer = document.getElementById('results-trend-container');
        if (!container) return;

        const sortOrder = window.outcomeDateSortOrder || 'desc';
        const isAsc = sortOrder === 'asc';

        // Update sort button and badge in UI
        const sortBtnText = document.getElementById('outcome-date-sort-text');
        const sortBtnIcon = document.getElementById('outcome-date-sort-icon');
        const countBadge = document.getElementById('outcome-results-count-badge');

        if (sortBtnText) {
            sortBtnText.textContent = isAsc ? 'Date: Oldest First' : 'Date: Newest First';
        }
        if (sortBtnIcon) {
            sortBtnIcon.style.transform = isAsc ? 'rotate(180deg)' : 'rotate(0deg)';
        }

        const getResultsFn = typeof window.getProcessedResults === 'function' ? window.getProcessedResults : () => (window.successResults || []);
        const activeResults = getResultsFn();

        if (!activeResults || activeResults.length === 0) {
            container.innerHTML = '<div class="col-span-full py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl"><span class="text-3xl mb-3 grayscale opacity-50">🏆</span><p class="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest text-center">No results logged yet. Add your first achievement!</p></div>';
            if (trendContainer) trendContainer.classList.add('hidden');
            if (countBadge) countBadge.textContent = '0';
            return;
        }

        const programGroups = {};
        const achievements = [];

        activeResults.forEach(res => {
            if (res.type === 'cgpa') {
                const progName = res.title;
                if (!programGroups[progName]) {
                    programGroups[progName] = {
                        type: 'program_group',
                        title: progName,
                        overall: null,
                        subjects: [],
                        date: res.date
                    };
                }
                if (Utils.parseDateSafe(res.date) > Utils.parseDateSafe(programGroups[progName].date)) {
                    programGroups[progName].date = res.date;
                }
                if (!res.subject) {
                    programGroups[progName].overall = res;
                } else {
                    programGroups[progName].subjects.push(res);
                }
            } else {
                achievements.push(res);
            }
        });

        const mergedList = [
            ...Object.values(programGroups),
            ...achievements
        ].sort((a, b) => {
            const timeA = Utils.parseDateSafe(a.date).getTime();
            const timeB = Utils.parseDateSafe(b.date).getTime();
            return isAsc ? (timeA - timeB) : (timeB - timeA);
        });

        if (countBadge) {
            countBadge.textContent = mergedList.length;
        }

        let html = '';
        mergedList.forEach(item => {
            const dateStr = Utils.parseDateSafe(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            if (item.type === 'program_group') {
                const progName = item.title;
                const subjects = item.subjects.sort((a, b) => a.subject.localeCompare(b.subject));

                // Estimate overall from subjects
                let estCgpa = null;
                let estGrade = null;
                const evalType = (item.overall && item.overall.evaluationType) || (subjects.length > 0 && subjects[0].evaluationType) || 'cgpa';
                const isGrade = evalType === 'grade';
                const subjectsWithScores = subjects.filter(s => s.value && !isNaN(parseFloat(s.value)));
                if (subjectsWithScores.length > 0) {
                    const sum = subjectsWithScores.reduce((acc, s) => acc + parseFloat(s.value), 0);
                    const avg = sum / subjectsWithScores.length;
                    estCgpa = Utils.formatCgpaMin2Dec(avg);
                    estGrade = Utils.mapCgpaToGrade(avg, evalType);
                }

                // Dynamically calculate and fill overall if empty/missing
                let currentOverall = item.overall;
                if (!currentOverall) {
                    currentOverall = {
                        id: 'dynamic_overall_' + progName,
                        type: 'cgpa',
                        evaluationType: (subjects.length > 0 && subjects[0].evaluationType) || 'cgpa',
                        title: progName,
                        subject: '',
                        value: estCgpa || '',
                        grade: estGrade || '',
                        targetGrade: '',
                        targetCGPA: '',
                        date: item.date,
                        isEstimated: true
                    };
                } else {
                    const isGradeType = currentOverall.evaluationType === 'grade';
                    if (isGradeType && !currentOverall.grade && estGrade) {
                        currentOverall.grade = estGrade;
                        currentOverall.value = estCgpa || '';
                        currentOverall.isEstimated = true;
                    } else if (!isGradeType && !currentOverall.value && estCgpa) {
                        currentOverall.value = estCgpa;
                        currentOverall.grade = estGrade || '';
                        currentOverall.isEstimated = true;
                    }
                }

                // Check if inputted overall result matches estimated result
                let matchStatusHtml = '';
                if (currentOverall && !currentOverall.isEstimated && estCgpa) {
                    const isGrade = currentOverall.evaluationType === 'grade';
                    let isMatch = false;
                    if (isGrade) {
                        isMatch = (currentOverall.grade || '').trim().toUpperCase() === (estGrade || '').trim().toUpperCase();
                    } else {
                        isMatch = Utils.formatCgpaMin2Dec(currentOverall.value || 0) === Utils.formatCgpaMin2Dec(estCgpa);
                    }

                    if (isMatch) {
                        matchStatusHtml = `
                                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black shrink-0 shadow-sm shadow-emerald-500/20" title="Matches subject-wise estimate (CGPA: ${estCgpa}, Grade: ${estGrade})">✓</span>`;
                    } else {
                        matchStatusHtml = `
                                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black shrink-0 shadow-sm shadow-rose-500/20" title="Differs from subject-wise estimate (CGPA: ${estCgpa}, Grade: ${estGrade})">✗</span>`;
                    }
                }

                // Check if Goal is Met
                const mainTarget = typeof window.getProgramMainTarget === 'function' ? window.getProgramMainTarget(progName) : { targetCGPA: '', targetGrade: '' };
                const targetCGPA = (currentOverall && currentOverall.targetCGPA) || mainTarget.targetCGPA;
                const targetGrade = (currentOverall && currentOverall.targetGrade) || mainTarget.targetGrade;
                const hasTgt = targetCGPA && targetCGPA !== 'none' && targetCGPA !== '';

                const trackId = window.tracks.find(t => window.customPrograms[t.id] && window.customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
                const progSubsList = trackId ? (syllabusStructure[trackId] || []).filter(s => s.program === progName) : [];

                let allSubjectsAttempted = (progSubsList.length > 0);
                progSubsList.forEach(s => {
                    const subRes = subjects.find(r => r.subject === s.subject);
                    let attempted = false;
                    if (subRes) {
                        const evalType = subRes.evaluationType || 'cgpa';
                        if (evalType === 'grade') {
                            if (subRes.grade && subRes.grade.trim() !== '' && subRes.grade.trim().toUpperCase() !== 'F') {
                                attempted = true;
                            }
                        } else {
                            const val = parseFloat(subRes.value);
                            if (subRes.value && !isNaN(val) && val > 0) {
                                attempted = true;
                            }
                        }
                    }
                    if (!attempted) {
                        allSubjectsAttempted = false;
                    }
                });

                let goalMetLabel = '';
                if (hasTgt) {
                    let isGoalMet = false;
                    if (allSubjectsAttempted) {
                        if (evalType === 'grade') {
                            const currentGradeVal = Utils.mapGradeToNumeric(currentOverall.grade, 'grade');
                            const targetGradeVal = Utils.mapGradeToNumeric(targetGrade, 'grade');
                            isGoalMet = currentGradeVal >= targetGradeVal;
                        } else {
                            const currentCgpaVal = parseFloat(currentOverall.value) || 0;
                            const targetCgpaVal = parseFloat(targetCGPA) || 0;
                            isGoalMet = currentCgpaVal >= targetCgpaVal;
                        }
                    }

                    if (isGoalMet) {
                        goalMetLabel = ` <span class="text-xs font-black text-emerald-500 ml-1.5 whitespace-nowrap uppercase tracking-wider">[Goal Met]</span>`;
                    } else {
                        goalMetLabel = ` <span class="text-xs font-black text-rose-500 ml-1.5 whitespace-nowrap uppercase tracking-wider">[Not Met]</span>`;
                    }
                }

                // Check compression
                const isProgramVisible = !window.programVisibility || window.programVisibility[progName] !== false;
                if (!isProgramVisible) {
                    const dispScore = currentOverall.evaluationType === 'grade'
                        ? (currentOverall.grade || '—')
                        : (Utils.formatCgpaMin2Dec(currentOverall.value) || '—');
                    html += `
                            <div class="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between opacity-60">
                                <div class="flex items-center space-x-2.5 min-w-0">
                                    <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${typeof window.getProgramColor === 'function' ? window.getProgramColor(progName) : '#eab308'}"></div>
                                    <h4 class="text-xs font-black text-slate-650 dark:text-slate-400 truncate">${progName} <span class="text-[9px] font-bold text-slate-400 uppercase">- Program Card (Compressed)</span>${goalMetLabel}</h4>
                                </div>
                                <div class="flex items-center space-x-2 shrink-0">
                                    <span class="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">${dispScore}</span>
                                    <button onclick="window.toggleOutcomeProgram('${progName.replace(/'/g, "\\'")}')" class="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded transition-colors" title="Spread Program Everywhere">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>`;
                    return;
                }

                html += `
                        <div class="bg-white dark:bg-slate-800 p-5 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between">
                            <div class="absolute top-3.5 right-3.5 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="window.showProgramAnalytics('${progName.replace(/'/g, "\\'")}')" class="text-slate-300 hover:text-cyan-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all" title="View Progression Trend"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></button>
                                <button onclick="window.openResultModal(null, '${progName}')" class="text-slate-300 hover:text-blue-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all" title="Edit Program Card"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                <button onclick="window.deleteProgramGroup('${progName}')" class="text-slate-300 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all" title="Delete Program Card"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                            </div>
                            <div>
                                <div class="flex items-center space-x-1.5 mb-2.5">
                                    <span class="text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800/50">Program Card</span>
                                    <span class="text-[8px] font-bold text-slate-400 ml-auto mr-8">${dateStr}</span>
                                </div>
                                <h4 class="font-black text-base text-slate-800 dark:text-slate-100 leading-tight mb-3 pr-12 flex items-center flex-wrap">${progName}${goalMetLabel}</h4>
                                <!-- Overall Program Score Banner -->
                                ${(() => {
                        if (!currentOverall || (!currentOverall.value && !currentOverall.grade)) return '';

                        const hasTgt = currentOverall.targetCGPA && currentOverall.targetCGPA !== 'none';
                        const tgtCgpaDisp = hasTgt ? Utils.formatCgpaMin2Dec(currentOverall.targetCGPA) : 'None';
                        const tgtGradeDisp = hasTgt ? (currentOverall.targetGrade || Utils.mapCgpaToGrade(currentOverall.targetCGPA, currentOverall.evaluationType) || '—') : 'None';

                        const isOverallFailed = currentOverall.evaluationType === 'grade'
                            ? (currentOverall.grade && ['C', 'D', 'E', 'F'].includes(currentOverall.grade.trim().toUpperCase()))
                            : (currentOverall.value && parseFloat(currentOverall.value) < 2.0);

                        const statusText = isOverallFailed ? 'FAIL' : 'PASS';
                        const scoreColorClass = isOverallFailed ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400';
                        const statusBadgeColor = isOverallFailed
                            ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';

                        const indicatorText = currentOverall.isEstimated ? 'Estimated' : 'Manual';
                        const indicatorBadgeColor = currentOverall.isEstimated
                            ? 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                            : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800';

                        const systemText = currentOverall.evaluationType === 'grade' ? 'Grade-Based' : 'CGPA-Based';
                        const systemBadgeColor = 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';

                        return `
                                    <div class="mb-4 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                                        <div class="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                            <span class="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.25 rounded border ${systemBadgeColor}">${systemText}</span>
                                            <span class="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.25 rounded border ${indicatorBadgeColor}">${indicatorText}</span>
                                            <span class="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.25 rounded border ${statusBadgeColor} ml-auto">${statusText}</span>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <div class="flex flex-col">
                                                <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Target</span>
                                                <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">${tgtGradeDisp} (${tgtCgpaDisp})</span>
                                            </div>
                                            <div class="text-right flex items-center gap-2">
                                                <div class="flex flex-col items-end">
                                                    ${currentOverall.evaluationType === 'grade'
                                ? `
                                                        <span class="text-sm font-black ${scoreColorClass}">Grade: ${currentOverall.grade || 'N/A'}</span>
                                                        <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">CGPA: ${Utils.formatCgpaMin2Dec(currentOverall.value) || 'N/A'}</span>
                                                        `
                                : `
                                                        <span class="text-sm font-black ${scoreColorClass}">CGPA: ${Utils.formatCgpaMin2Dec(currentOverall.value) || 'N/A'}</span>
                                                        <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Grade: ${currentOverall.grade || 'N/A'}</span>
                                                        `
                            }
                                                </div>
                                                ${matchStatusHtml}
                                            </div>
                                        </div>
                                    </div>
                                    `;
                    })()}
                                
                                <!-- Subject Listing -->
                                ${subjects.length > 0 ? `
                                <div class="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-700/60 pt-3">
                                    <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Subject Grades</span>
                                    <div class="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                        ${(() => {
                            const mainTarget = typeof window.getProgramMainTarget === 'function' ? window.getProgramMainTarget(progName) : { targetCGPA: '', targetGrade: '' };
                            return subjects.map(s => {
                                const subTargetCgpa = s.targetCGPA || mainTarget.targetCGPA;
                                const subTargetGrade = s.targetGrade || mainTarget.targetGrade;
                                const hasSubTgt = subTargetCgpa && subTargetCgpa !== 'none';
                                const targetDisp = hasSubTgt ? (s.evaluationType === 'grade' ? `${subTargetGrade} (${Utils.formatCgpaMin2Dec(subTargetCgpa)})` : `${Utils.formatCgpaMin2Dec(subTargetCgpa)} (${subTargetGrade})`) : 'None';

                                const isSubFailed = s.evaluationType === 'grade'
                                    ? (s.grade && ['C', 'D', 'E', 'F'].includes(s.grade.trim().toUpperCase()))
                                    : (s.value && parseFloat(s.value) < 2.0);
                                const subScoreColor = isSubFailed ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';

                                const subStatusBadge = isSubFailed
                                    ? `<span class="inline-block text-[8px] font-black px-1.5 py-0.25 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800/50 scale-90 origin-right">FAIL</span>`
                                    : `<span class="inline-block text-[8px] font-black px-1.5 py-0.25 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-800/50 scale-90 origin-right">PASS</span>`;

                                return `
                                                <div class="flex justify-between items-center text-xs py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                                                    <div class="flex flex-col truncate mr-2">
                                                        <span class="font-bold text-slate-600 dark:text-slate-300 truncate">${s.subject}</span>
                                                        <span class="text-[9px] font-bold text-slate-400">Target: ${targetDisp}</span>
                                                    </div>
                                                    <div class="text-right shrink-0 flex items-center gap-2">
                                                        <div class="flex flex-col items-end">
                                                            <span class="font-black ${subScoreColor}">
                                                                ${s.evaluationType === 'grade' ? (s.grade || 'N/A') : (Utils.formatCgpaMin2Dec(s.value) || 'N/A')}
                                                            </span>
                                                            ${s.evaluationType === 'grade' ? `<span class="text-[10px] font-bold text-slate-400 block -mt-0.5">(CGPA: ${Utils.formatCgpaMin2Dec(s.value)})</span>` : (s.grade ? `<span class="text-[10px] font-bold text-slate-400 block -mt-0.5">(${s.grade})</span>` : '')}
                                                        </div>
                                                        ${subStatusBadge}
                                                    </div>
                                                </div>
                                                `;
                            }).join('');
                        })()}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>`;

            } else {
                html += `
                        <div class="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between">
                            <div class="absolute top-3.5 right-3.5 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="window.openResultModal('${item.id}')" class="text-slate-300 hover:text-blue-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                <button onclick="window.deleteResult('${item.id}')" class="text-slate-300 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                            </div>
                            <div>
                                <div class="flex items-center space-x-1.5 mb-2">
                                    <span class="text-[8px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded border border-yellow-100 dark:border-yellow-800/50">Achievement</span>
                                    <span class="text-[8px] font-bold text-slate-400 ml-auto mr-8">${dateStr}</span>
                                </div>
                                <h4 class="font-black text-sm md:text-base text-slate-800 dark:text-slate-100 leading-tight mb-2 pr-12">${item.title}</h4>
                            </div>
                            <div class="mt-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center items-center h-full min-h-[60px]">
                                <span class="text-xl md:text-2xl font-black text-yellow-600 dark:text-yellow-400 break-words text-center w-full leading-none">${item.value || 'N/A'}</span>
                                ${item.grade ? `<span class="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Grade: ${item.grade}</span>` : ''}
                            </div>
                        </div>`;
            }
        });
        container.innerHTML = html;

        // Populate trend filter dynamically
        const uniquePrograms = [];
        activeResults.forEach(r => {
            if (r.type === 'cgpa' && r.title && !uniquePrograms.includes(r.title)) {
                uniquePrograms.push(r.title);
            }
        });

        const filterSelect = document.getElementById('trend-program-filter');
        if (filterSelect) {
            const currentFilterVal = filterSelect.value || 'ALL';
            let filterHtml = '<option value="ALL">All Programs</option>';
            uniquePrograms.forEach(prog => {
                filterHtml += `<option value="${prog}" ${currentFilterVal === prog ? 'selected' : ''}>${prog}</option>`;
            });
            filterSelect.innerHTML = filterHtml;
        }

        const selectedProgFilter = filterSelect ? filterSelect.value : 'ALL';

        // Filter CGPAs for the Progression Trend Chart (Overall Program CGPAs only, no subject CGPAs)
        let cgpaResults = activeResults
            .filter(r => r.type === 'cgpa' && !r.subject)
            .sort((a, b) => {
                const timeA = Utils.parseDateSafe(a.date).getTime();
                const timeB = Utils.parseDateSafe(b.date).getTime();
                return isAsc ? (timeA - timeB) : (timeB - timeA);
            });

        if (selectedProgFilter !== 'ALL') {
            cgpaResults = cgpaResults.filter(r => r.title === selectedProgFilter);
        }

        // Calculate & render stats indicators
        let latestProgramCgpa = '0.00';
        let overallTargetCgpaVal = '0.00';
        const programResults = activeResults
            .filter(r => r.type === 'cgpa' && !r.subject)
            .filter(r => selectedProgFilter === 'ALL' || r.title === selectedProgFilter)
            .sort((a, b) => Utils.parseDateSafe(b.date) - Utils.parseDateSafe(a.date));
        if (programResults.length > 0) {
            latestProgramCgpa = (parseFloat(programResults[0].value) || 0).toFixed(2);
            overallTargetCgpaVal = (parseFloat(programResults[0].targetCGPA) || 0).toFixed(2);
        }

        // Render interactive results legend
        const rLeg = document.getElementById('results-legend');
        if (rLeg) {
            const getResultsLegend = (idxKey, color, label, val) => {
                const active = window.trendDatasetVisibility[idxKey];
                return `<div onclick="window.toggleTrendDataset('${idxKey}')" class="cursor-pointer flex items-center space-x-1.5 md:space-x-2 px-2.5 md:px-3 py-1.5 md:px-3.5 md:py-2 bg-slate-900 rounded-lg md:rounded-xl border border-slate-700 hover:bg-slate-800 active:scale-95 transition-all ${active ? 'opacity-100 scale-100 shadow-md' : 'opacity-40 grayscale scale-95 line-through'}"><div class="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0" style="background-color: ${color}; box-shadow: 0 0 8px ${color}"></div><span class="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">${label}: ${val}</span></div>`;
            };
            rLeg.innerHTML =
                getResultsLegend('actual', '#06b6d4', 'Actual CGPA', latestProgramCgpa) +
                getResultsLegend('target', '#f59e0b', 'Target CGPA', overallTargetCgpaVal);
        }

        // Calculate and render track average results
        const trackAveragesContainer = document.getElementById('track-averages-container');
        if (trackAveragesContainer) {
            let trackHtml = '';
            const trackColors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#a855f7', '#f97316'];

            window.tracks.forEach((t, idx) => {
                const tc = trackColors[idx % trackColors.length];
                const trackProgs = window.customPrograms[t.id] || [];
                const N = trackProgs.length;

                let sumCgpa = 0.00;
                trackProgs.forEach(pObj => {
                    const pName = pObj.name || pObj;
                    const progOveralls = activeResults.filter(r => r.type === 'cgpa' && !r.subject && r.title === pName);
                    if (progOveralls.length > 0) {
                        progOveralls.sort((a, b) => Utils.parseDateSafe(b.date) - Utils.parseDateSafe(a.date));
                        sumCgpa += parseFloat(progOveralls[0].value) || 0.00;
                    }
                });

                const avgCgpa = N > 0 ? sumCgpa / N : 0.00;
                const avgCgpaStr = avgCgpa.toFixed(2);
                const avgGrade = Utils.mapCgpaToGrade(avgCgpa, 'cgpa') || 'F';
                const gradeColor = avgGrade === 'F' ? 'text-rose-400' : 'text-emerald-400';

                trackHtml += `
                        <div class="flex items-center space-x-1.5 md:space-x-2 px-2.5 md:px-3 py-1.5 md:px-3.5 md:py-2 bg-slate-900/60 dark:bg-slate-900/90 rounded-lg md:rounded-xl border border-slate-700/60 dark:border-slate-700/80 shadow-sm select-none">
                            <div class="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0 shadow-md" style="background-color: ${tc}; box-shadow: 0 0 8px ${tc}"></div>
                            <span class="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">${t.name || t.id} Avg:</span>
                            <span class="text-[9px] md:text-[11px] font-black text-white whitespace-nowrap">${avgCgpaStr} <span class="${gradeColor}">(${avgGrade})</span></span>
                        </div>`;
            });

            trackAveragesContainer.innerHTML = trackHtml;
        }

        // Trend Chart Rendering
        if (cgpaResults.length > 0 && trendContainer) {
            trendContainer.classList.remove('hidden');
            const ctx = document.getElementById('resultsTrendChart');
            if (ctx) {
                const labels = cgpaResults.map(r => {
                    const d = Utils.parseDateSafe(r.date);
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

                if (window.resultsTrendChartInstance) window.resultsTrendChartInstance.destroy();

                const canvasCtx = ctx.getContext('2d');

                Chart.defaults.color = '#94a3b8';
                Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui';
                window.resultsTrendChartInstance = new Chart(canvasCtx, {
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
                                hidden: !window.trendDatasetVisibility.actual
                            },
                            {
                                label: 'Target CGPA',
                                data: targetData,
                                backgroundColor: '#f59e0b',
                                borderColor: '#f59e0b',
                                borderWidth: 0,
                                borderRadius: 6,
                                borderSkipped: false,
                                hidden: !window.trendDatasetVisibility.target
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
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
                                        const actVal = item.value ? Utils.formatCgpaMin2Dec(item.value) : 'N/A';
                                        const tgtVal = item.targetCGPA ? Utils.formatCgpaMin2Dec(item.targetCGPA) : 'N/A';
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
        } else if (trendContainer) {
            trendContainer.classList.add('hidden');
        }
    };

    /* ==========================================================================
       Result Modal: Open, Edit, Toggle, Save, and Delete Handlers
       ========================================================================== */

    window.updateResultSubjectsGrid = function (clearOverall = false) {
        const progSelect = document.getElementById('res-prog-select');
        const listContainer = document.getElementById('res-subjects-list');
        if (!progSelect || !listContainer) return;

        const selectedProg = progSelect.value;
        listContainer.innerHTML = '';

        if (clearOverall) {
            if (document.getElementById('res-overall-grade')) document.getElementById('res-overall-grade').value = '';
            if (document.getElementById('res-overall-target-grade')) document.getElementById('res-overall-target-grade').value = '';
            if (document.getElementById('res-overall-cgpa')) document.getElementById('res-overall-cgpa').value = '';
            if (document.getElementById('res-overall-target-cgpa')) document.getElementById('res-overall-target-cgpa').value = '';
        }

        const evalType = document.getElementById('res-evaluation-type')?.value || 'cgpa';
        const isGrade = evalType === 'grade';

        // Update Overall label text
        const overallLabel = document.getElementById('res-overall-label');
        if (overallLabel) {
            overallLabel.textContent = isGrade ? "Overall Program Grade" : "Overall Program CGPA";
        }

        if (selectedProg) {
            let html = '';
            window.tracks.forEach(track => {
                if (syllabusStructure[track.id]) {
                    syllabusStructure[track.id].forEach(s => {
                        if (s.program === selectedProg) {
                            html += `
                                    <div class="flex flex-col gap-1 py-1.5 border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs font-black text-slate-700 dark:text-slate-200 flex-1 truncate">${s.subject}</span>
                                            <span class="res-sub-target-badge text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/50 whitespace-nowrap opacity-30">Target: —</span>
                                        </div>
                                        <div class="flex gap-2 items-center justify-end">
                                            <!-- Grade mode: select A-F + auto CGPA badge -->
                                            <div class="${isGrade ? 'flex' : 'hidden'} items-center gap-1">
                                                <select data-subject="${s.subject}" data-field="grade"
                                                    class="res-sub-grade-input w-16 sm:w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs font-bold text-center uppercase focus:ring-2 focus:ring-yellow-500 outline-none"
                                                    onchange="window.onGradeSelect(this); window.updateModalEstScore();">
                                                    <option value="">Grade</option>
                                                    <option value="A">A</option>
                                                    <option value="B">B</option>
                                                    <option value="C">C</option>
                                                    <option value="D">D</option>
                                                    <option value="E">E</option>
                                                    <option value="F">F</option>
                                                </select>
                                                <span class="auto-cgpa-badge text-[10px] font-black text-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 min-w-[32px] text-center opacity-40">—</span>
                                            </div>
                                            <!-- CGPA mode: text input + auto grade badge -->
                                            <div class="${isGrade ? 'hidden' : 'flex'} items-center gap-1">
                                                <input type="text" data-subject="${s.subject}" data-field="cgpa"
                                                    class="res-sub-cgpa-input w-20 sm:w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs font-bold text-center focus:ring-2 focus:ring-yellow-500 outline-none"
                                                    placeholder="CGPA" oninput="window.onCgpaInput(this); window.updateModalEstScore();"
                                                    onblur="window.onCgpaBlur(this); window.updateModalEstScore();">
                                                <span class="auto-grade-badge text-[10px] font-black text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-800 min-w-[24px] text-center opacity-40">—</span>
                                            </div>
                                        </div>
                                    </div>`;
                        }
                    });
                }
            });
            if (!html) {
                listContainer.innerHTML = '<p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">No subjects found in this program</p>';
            } else {
                listContainer.innerHTML = html;
                window.updateSubjectTargets();
                window.updateModalEstScore();
            }
        }
    };

    window.openResultModal = function (id = null, editProgramName = null) {
        window.editingResultId = id;
        window.editingProgramName = editProgramName;

        let titleStr = 'Add New Result';
        if (id) titleStr = 'Edit Result';
        else if (editProgramName) titleStr = `Edit ${editProgramName}`;
        const modalTitle = document.getElementById('res-modal-title');
        if (modalTitle) modalTitle.textContent = titleStr;

        // Populate program dropdown
        const progSelect = document.getElementById('res-prog-select');
        if (progSelect) {
            progSelect.innerHTML = '';
            window.tracks.forEach(track => {
                if (window.customPrograms[track.id]) {
                    window.customPrograms[track.id].forEach(p => {
                        const pName = p.name || p;
                        progSelect.innerHTML += `<option value="${pName}">${pName}</option>`;
                    });
                }
            });
        }

        const typeSelector = document.getElementById('res-type');
        const evalSelector = document.getElementById('res-evaluation-type');

        if (editProgramName) {
            // BULK PROGRAM EDIT MODE
            if (typeSelector) {
                typeSelector.value = 'cgpa';
                typeSelector.disabled = true;
            }
            if (progSelect) {
                progSelect.value = editProgramName;
                progSelect.disabled = true;
            }

            // Prefill evaluation option
            const progRecords = (window.successResults || []).filter(r => r.type === 'cgpa' && r.title === editProgramName);
            let evalType = 'cgpa';
            const firstRecordWithEval = progRecords.find(r => r.evaluationType);
            if (firstRecordWithEval) {
                evalType = firstRecordWithEval.evaluationType;
            } else if (progRecords.some(r => r.grade && !r.value)) {
                evalType = 'grade';
            }
            if (evalSelector) {
                evalSelector.value = evalType;
                evalSelector.disabled = true;
            }

            // Store prefill data to apply AFTER toggleResultType() re-renders the grid
            window._pendingResultPrefill = { progRecords, evalType };

            let recordDate = progRecords.find(r => r.date)?.date || '';
            if (recordDate) {
                const dateEl = document.getElementById('res-date');
                if (dateEl) dateEl.value = recordDate;
            }
        } else if (id) {
            // SINGLE ACHIEVEMENT EDIT MODE
            const res = (window.successResults || []).find(r => r.id === id);
            if (res) {
                if (typeSelector) {
                    typeSelector.value = res.type;
                    typeSelector.disabled = true;
                }
                if (progSelect) progSelect.disabled = true;
                if (evalSelector) evalSelector.disabled = true;

                const titleDisp = document.getElementById('res-single-title-display');
                if (titleDisp) titleDisp.textContent = res.title;
                const valEl = document.getElementById('res-value');
                if (valEl) valEl.value = res.value || '';
                const gradeEl = document.getElementById('res-grade');
                if (gradeEl) gradeEl.value = res.grade || '';
                const dateEl = document.getElementById('res-date');
                if (dateEl) dateEl.value = res.date;
            }
        } else {
            // ADD MODE
            if (typeSelector) {
                typeSelector.value = 'cgpa';
                typeSelector.disabled = false;
            }
            if (progSelect) progSelect.disabled = false;
            if (evalSelector) {
                evalSelector.disabled = false;
                evalSelector.value = 'cgpa';
            }
            if (document.getElementById('res-title-input')) document.getElementById('res-title-input').value = '';
            if (document.getElementById('res-value')) document.getElementById('res-value').value = '';
            if (document.getElementById('res-grade')) document.getElementById('res-grade').value = '';
            if (document.getElementById('res-overall-grade')) document.getElementById('res-overall-grade').value = '';
            if (document.getElementById('res-overall-target-grade')) document.getElementById('res-overall-target-grade').value = '';
            if (document.getElementById('res-overall-cgpa')) document.getElementById('res-overall-cgpa').value = '';
            if (document.getElementById('res-overall-target-cgpa')) document.getElementById('res-overall-target-cgpa').value = '';

            // Reset all auto-badges
            document.querySelectorAll('#resm-content .auto-grade-badge, #resm-content .auto-cgpa-badge').forEach(b => {
                b.textContent = '—';
                b.classList.add('opacity-40');
            });

            const d = new Date();
            const pad = (n) => n < 10 ? '0' + n : n;
            const dateEl = document.getElementById('res-date');
            if (dateEl) dateEl.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

            window._pendingResultPrefill = null;
        }

        // toggleResultType renders the grid via updateResultSubjectsGrid; do this FIRST
        window.toggleResultType();

        // Now apply prefill AFTER the grid has been rendered
        if (window._pendingResultPrefill) {
            const { progRecords, evalType } = window._pendingResultPrefill;
            window._pendingResultPrefill = null;

            const mainTarget = typeof window.getProgramMainTarget === 'function' ? window.getProgramMainTarget(editProgramName) : { targetCGPA: '', targetGrade: '' };
            let overallPrefilled = false;

            progRecords.forEach(r => {
                if (!r.subject) {
                    overallPrefilled = true;
                    if (evalType === 'grade') {
                        const overallGrade = document.getElementById('res-overall-grade');
                        if (overallGrade) overallGrade.value = r.grade || '';
                        const tgtGrade = r.targetGrade || mainTarget.targetGrade;
                        const overallTgtGrade = document.getElementById('res-overall-target-grade');
                        if (overallTgtGrade) overallTgtGrade.value = tgtGrade;
                        if (overallGrade) window.updateCgpaBadge(r.grade || '', overallGrade.parentElement.querySelector('.auto-cgpa-badge'));
                        if (tgtGrade && overallTgtGrade) window.updateCgpaBadge(tgtGrade, overallTgtGrade.parentElement.querySelector('.auto-cgpa-badge'));
                    } else {
                        const overallCgpa = document.getElementById('res-overall-cgpa');
                        if (overallCgpa) overallCgpa.value = r.value || '';
                        const tgtCgpa = r.targetCGPA || mainTarget.targetCGPA;
                        const overallTgtCgpa = document.getElementById('res-overall-target-cgpa');
                        if (overallTgtCgpa) overallTgtCgpa.value = tgtCgpa;
                        if (overallCgpa) window.onCgpaInput(overallCgpa);
                        if (tgtCgpa && overallTgtCgpa) window.onCgpaInput(overallTgtCgpa);
                    }
                } else {
                    if (evalType === 'grade') {
                        const gradeInput = Array.from(document.querySelectorAll('.res-sub-grade-input')).find(input => input.getAttribute('data-subject') === r.subject);
                        if (gradeInput) {
                            gradeInput.value = r.grade || '';
                            window.updateCgpaBadge(r.grade || '', gradeInput.parentElement.querySelector('.auto-cgpa-badge'));
                        }
                    } else {
                        const cgpaInput = Array.from(document.querySelectorAll('.res-sub-cgpa-input')).find(input => input.getAttribute('data-subject') === r.subject);
                        if (cgpaInput) {
                            cgpaInput.value = r.value || '';
                            window.onCgpaInput(cgpaInput);
                        }
                    }
                }
            });

            if (!overallPrefilled && mainTarget.targetCGPA) {
                if (evalType === 'grade') {
                    const gradeTargetInput = document.getElementById('res-overall-target-grade');
                    if (gradeTargetInput) {
                        gradeTargetInput.value = mainTarget.targetGrade;
                        window.updateCgpaBadge(mainTarget.targetGrade, gradeTargetInput.parentElement.querySelector('.auto-cgpa-badge'));
                    }
                } else {
                    const cgpaTargetInput = document.getElementById('res-overall-target-cgpa');
                    if (cgpaTargetInput) {
                        cgpaTargetInput.value = mainTarget.targetCGPA;
                        window.onCgpaInput(cgpaTargetInput);
                    }
                }
            }
        }

        window.updateModalEstScore();
        if (typeof openModal === 'function') {
            openModal('result-modal');
        }
    };

    window.toggleResultEvaluationType = function () {
        const evalType = document.getElementById('res-evaluation-type')?.value || 'cgpa';
        const cgpaFields = document.querySelectorAll('#res-subjects-grid-container .res-cgpa-field, #resm-content .res-cgpa-field');
        const gradeFields = document.querySelectorAll('#res-subjects-grid-container .res-grade-field, #resm-content .res-grade-field');

        if (evalType === 'grade') {
            cgpaFields.forEach(f => { f.classList.add('hidden'); f.classList.remove('flex'); });
            gradeFields.forEach(f => { f.classList.remove('hidden'); f.classList.add('flex'); });
        } else {
            cgpaFields.forEach(f => { f.classList.remove('hidden'); f.classList.add('flex'); });
            gradeFields.forEach(f => { f.classList.add('hidden'); f.classList.remove('flex'); });
        }

        // Reset all auto-badges
        document.querySelectorAll('#resm-content .auto-grade-badge, #resm-content .auto-cgpa-badge').forEach(b => {
            b.textContent = '—';
            b.classList.add('opacity-40');
        });

        const overallLabel = document.getElementById('res-overall-label');
        if (overallLabel) overallLabel.textContent = evalType === 'grade' ? 'Overall Program Grade' : 'Overall Program CGPA';

        window.updateResultSubjectsGrid(false);
    };

    window.toggleResultType = function () {
        const typeEl = document.getElementById('res-type');
        if (!typeEl) return;
        const type = typeEl.value;
        const isEdit = !!window.editingResultId;
        const isBulkEdit = !!window.editingProgramName;

        const evalTypeContainer = document.getElementById('res-evaluation-type-container');
        if (type === 'cgpa') {
            if (evalTypeContainer) evalTypeContainer.classList.remove('hidden');
            const evalSelect = document.getElementById('res-evaluation-type');
            if (evalSelect) evalSelect.disabled = isBulkEdit;
        } else {
            if (evalTypeContainer) evalTypeContainer.classList.add('hidden');
        }

        const progCont = document.getElementById('res-prog-container');
        const gridCont = document.getElementById('res-subjects-grid-container');
        const titleCont = document.getElementById('res-title-container');
        const singleTitleCont = document.getElementById('res-single-title-container');
        const singleValCont = document.getElementById('res-single-value-container');

        if (isBulkEdit) {
            if (progCont) progCont.classList.remove('hidden');
            if (gridCont) gridCont.classList.remove('hidden');
            if (titleCont) titleCont.classList.add('hidden');
            if (singleTitleCont) singleTitleCont.classList.add('hidden');
            if (singleValCont) singleValCont.classList.add('hidden');
            window.toggleResultEvaluationType();
        } else if (isEdit) {
            if (progCont) progCont.classList.add('hidden');
            if (gridCont) gridCont.classList.add('hidden');
            if (titleCont) titleCont.classList.add('hidden');
            if (singleTitleCont) singleTitleCont.classList.remove('hidden');
            if (singleValCont) singleValCont.classList.remove('hidden');
        } else {
            if (singleTitleCont) singleTitleCont.classList.add('hidden');
            if (type === 'cgpa') {
                if (progCont) progCont.classList.remove('hidden');
                if (gridCont) gridCont.classList.remove('hidden');
                if (titleCont) titleCont.classList.add('hidden');
                if (singleValCont) singleValCont.classList.add('hidden');
                window.toggleResultEvaluationType();
            } else {
                if (progCont) progCont.classList.add('hidden');
                if (gridCont) gridCont.classList.add('hidden');
                if (titleCont) titleCont.classList.remove('hidden');
                if (singleValCont) singleValCont.classList.remove('hidden');
            }
        }
    };

    window.saveResult = function () {
        const typeEl = document.getElementById('res-type');
        const dateEl = document.getElementById('res-date');
        const type = typeEl ? typeEl.value : 'cgpa';
        const date = dateEl ? dateEl.value : '';
        if (!date) return showToast("Date is required", "error");

        if (!window.successResults) window.successResults = [];

        if (window.editingProgramName) {
            const fallbackMainTarget = typeof window.getProgramMainTarget === 'function' ? window.getProgramMainTarget(window.editingProgramName) : { targetCGPA: '', targetGrade: '' };

            // 1. BULK PROGRAM EDIT MODE
            window.successResults = window.successResults.filter(r => !(r.type === 'cgpa' && r.title === window.editingProgramName));

            const evalType = document.getElementById('res-evaluation-type')?.value || 'cgpa';

            let gradeInputs = [];
            let cgpaInputs = [];
            if (evalType === 'grade') {
                gradeInputs = document.querySelectorAll('.res-sub-grade-input');
            } else {
                cgpaInputs = document.querySelectorAll('.res-sub-cgpa-input');
            }

            const subjectsData = {};
            if (evalType === 'grade') {
                gradeInputs.forEach(input => {
                    const sub = input.getAttribute('data-subject');
                    const gVal = input.value.trim();
                    if (gVal) {
                        subjectsData[sub] = {
                            grade: gVal,
                            cgpa: Utils.mapGradeToNumeric(gVal, evalType).toFixed(2)
                        };
                    }
                });
            } else {
                cgpaInputs.forEach(input => {
                    const sub = input.getAttribute('data-subject');
                    const cVal = input.value.trim();
                    if (cVal) {
                        const formattedCgpa = Utils.validateAndFormatCgpa(cVal);
                        if (formattedCgpa) {
                            subjectsData[sub] = {
                                grade: Utils.mapCgpaToGrade(formattedCgpa, evalType),
                                cgpa: formattedCgpa
                            };
                        }
                    }
                });
            }

            let overallVal = '';
            let overallGradeVal = '';
            let overallTargetCgpaVal = '';
            let overallTargetGradeVal = '';
            let isEstimatedOverall = false;
            let isExplicitNone = false;

            if (evalType === 'grade') {
                overallGradeVal = (document.getElementById('res-overall-grade')?.value || '').trim();
                overallTargetGradeVal = (document.getElementById('res-overall-target-grade')?.value || '').trim();

                if (overallTargetGradeVal.toLowerCase() === 'none' || overallTargetGradeVal === '0') {
                    overallTargetGradeVal = 'none';
                    overallTargetCgpaVal = 'none';
                    isExplicitNone = true;
                }

                if (!overallGradeVal) {
                    overallGradeVal = '';
                    overallVal = '';
                    isEstimatedOverall = true;
                } else {
                    overallVal = overallGradeVal ? Utils.mapGradeToNumeric(overallGradeVal, evalType).toFixed(2) : '';
                    isEstimatedOverall = false;
                }
                if (!isExplicitNone) {
                    overallTargetCgpaVal = overallTargetGradeVal ? Utils.mapGradeToNumeric(overallTargetGradeVal, evalType).toFixed(2) : '';
                }
            } else {
                overallVal = (document.getElementById('res-overall-cgpa')?.value || '').trim();
                overallTargetCgpaVal = (document.getElementById('res-overall-target-cgpa')?.value || '').trim();

                if (overallTargetCgpaVal.toLowerCase() === 'none' || overallTargetCgpaVal === '0') {
                    overallTargetGradeVal = 'none';
                    overallTargetCgpaVal = 'none';
                    isExplicitNone = true;
                } else {
                    overallTargetCgpaVal = Utils.validateAndFormatCgpa(overallTargetCgpaVal);
                }

                if (!overallVal) {
                    overallVal = '';
                    overallGradeVal = '';
                    isEstimatedOverall = true;
                } else {
                    overallVal = Utils.validateAndFormatCgpa(overallVal);
                    overallGradeVal = overallVal ? Utils.mapCgpaToGrade(overallVal, evalType) : '';
                    isEstimatedOverall = false;
                }
                if (!isExplicitNone) {
                    overallTargetGradeVal = overallTargetCgpaVal ? Utils.mapCgpaToGrade(overallTargetCgpaVal, evalType) : '';
                }
            }

            if (overallVal || overallGradeVal || overallTargetCgpaVal || overallTargetGradeVal) {
                window.successResults.push({
                    id: 'res_' + Date.now() + '_overall',
                    type: 'cgpa',
                    evaluationType: evalType,
                    title: window.editingProgramName,
                    subject: '',
                    value: overallVal,
                    grade: overallGradeVal,
                    targetGrade: overallTargetGradeVal,
                    targetCGPA: overallTargetCgpaVal,
                    date: date,
                    isEstimated: isEstimatedOverall
                });
            }

            let timeOffset = 1;
            for (const [subName, subScores] of Object.entries(subjectsData)) {
                window.successResults.push({
                    id: 'res_' + (Date.now() + timeOffset),
                    type: 'cgpa',
                    evaluationType: evalType,
                    title: window.editingProgramName,
                    subject: subName,
                    value: subScores.cgpa,
                    grade: subScores.grade,
                    targetCGPA: overallTargetCgpaVal,
                    targetGrade: overallTargetGradeVal,
                    date: date
                });
                timeOffset++;
            }

        } else if (window.editingResultId) {
            // 2. SINGLE EDIT MODE (ACHIEVEMENT)
            const res = window.successResults.find(r => r.id === window.editingResultId);
            if (!res) return showToast("Result not found", "error");

            const value = (document.getElementById('res-value')?.value || '').trim();
            const grade = (document.getElementById('res-grade')?.value || '').trim();
            if (!value) return showToast("Result/Value is required", "error");

            res.value = value;
            res.grade = grade;
            res.date = date;

        } else {
            // 3. ADD MODE
            if (type === 'cgpa') {
                const program = document.getElementById('res-prog-select')?.value;
                if (!program) return showToast("Target program is required", "error");

                let loggedCount = 0;
                const evalType = document.getElementById('res-evaluation-type')?.value || 'cgpa';

                let gradeInputs = [];
                let cgpaInputs = [];
                if (evalType === 'grade') {
                    gradeInputs = document.querySelectorAll('.res-sub-grade-input');
                } else {
                    cgpaInputs = document.querySelectorAll('.res-sub-cgpa-input');
                }

                const subjectsData = {};
                if (evalType === 'grade') {
                    gradeInputs.forEach(input => {
                        const sub = input.getAttribute('data-subject');
                        const gVal = input.value.trim();
                        if (gVal) {
                            subjectsData[sub] = {
                                grade: gVal,
                                cgpa: Utils.mapGradeToNumeric(gVal, evalType).toFixed(2)
                            };
                        }
                    });
                } else {
                    cgpaInputs.forEach(input => {
                        const sub = input.getAttribute('data-subject');
                        const cVal = input.value.trim();
                        if (cVal) {
                            const formattedCgpa = Utils.validateAndFormatCgpa(cVal);
                            if (formattedCgpa) {
                                subjectsData[sub] = {
                                    grade: Utils.mapCgpaToGrade(formattedCgpa, evalType),
                                    cgpa: formattedCgpa
                                };
                            }
                        }
                    });
                }

                let overallVal = '';
                let overallGradeVal = '';
                let overallTargetCgpaVal = '';
                let overallTargetGradeVal = '';
                let isEstimatedOverall = false;
                let isExplicitNone = false;

                if (evalType === 'grade') {
                    overallGradeVal = (document.getElementById('res-overall-grade')?.value || '').trim();
                    overallTargetGradeVal = (document.getElementById('res-overall-target-grade')?.value || '').trim();

                    if (overallTargetGradeVal.toLowerCase() === 'none' || overallTargetGradeVal === '0') {
                        overallTargetGradeVal = 'none';
                        overallTargetCgpaVal = 'none';
                        isExplicitNone = true;
                    }

                    if (!overallGradeVal) {
                        overallGradeVal = '';
                        overallVal = '';
                        isEstimatedOverall = true;
                    } else {
                        overallVal = overallGradeVal ? Utils.mapGradeToNumeric(overallGradeVal, evalType).toFixed(2) : '';
                        isEstimatedOverall = false;
                    }
                    if (!isExplicitNone) {
                        overallTargetCgpaVal = overallTargetGradeVal ? Utils.mapGradeToNumeric(overallTargetGradeVal, evalType).toFixed(2) : '';
                    }
                } else {
                    overallVal = (document.getElementById('res-overall-cgpa')?.value || '').trim();
                    overallTargetCgpaVal = (document.getElementById('res-overall-target-cgpa')?.value || '').trim();

                    if (overallTargetCgpaVal.toLowerCase() === 'none' || overallTargetCgpaVal === '0') {
                        overallTargetGradeVal = 'none';
                        overallTargetCgpaVal = 'none';
                        isExplicitNone = true;
                    } else {
                        overallTargetCgpaVal = Utils.validateAndFormatCgpa(overallTargetCgpaVal);
                    }

                    if (!overallVal) {
                        overallVal = '';
                        overallGradeVal = '';
                        isEstimatedOverall = true;
                    } else {
                        overallVal = Utils.validateAndFormatCgpa(overallVal);
                        overallGradeVal = overallVal ? Utils.mapCgpaToGrade(overallVal, evalType) : '';
                        isEstimatedOverall = false;
                    }
                    if (!isExplicitNone) {
                        overallTargetGradeVal = overallTargetCgpaVal ? Utils.mapCgpaToGrade(overallTargetCgpaVal, evalType) : '';
                    }
                }

                if (overallVal || overallGradeVal || overallTargetCgpaVal || overallTargetGradeVal) {
                    window.successResults.push({
                        id: 'res_' + Date.now() + '_overall',
                        type: 'cgpa',
                        evaluationType: evalType,
                        title: program,
                        subject: '',
                        value: overallVal,
                        grade: overallGradeVal,
                        targetGrade: overallTargetGradeVal,
                        targetCGPA: overallTargetCgpaVal,
                        date: date,
                        isEstimated: isEstimatedOverall
                    });
                    loggedCount++;
                }

                let timeOffset = 1;
                for (const [subName, subScores] of Object.entries(subjectsData)) {
                    window.successResults.push({
                        id: 'res_' + (Date.now() + timeOffset),
                        type: 'cgpa',
                        evaluationType: evalType,
                        title: program,
                        subject: subName,
                        value: subScores.cgpa,
                        grade: subScores.grade,
                        targetCGPA: overallTargetCgpaVal,
                        targetGrade: overallTargetGradeVal,
                        date: date
                    });
                    timeOffset++;
                    loggedCount++;
                }

                if (loggedCount === 0) {
                    return showToast("Please enter at least one score to save.", "error");
                }

            } else {
                const title = (document.getElementById('res-title-input')?.value || '').trim();
                const value = (document.getElementById('res-value')?.value || '').trim();
                const grade = (document.getElementById('res-grade')?.value || '').trim();

                if (!title) return showToast("Achievement title is required", "error");
                if (!value) return showToast("Result/Value is required", "error");

                window.successResults.push({
                    id: 'res_' + Date.now(),
                    type: 'achievement',
                    title: title,
                    value: value,
                    grade: grade,
                    date: date
                });
            }
        }

        if (typeof window.syncPassFreezeFromResults === 'function') {
            window.syncPassFreezeFromResults();
        }
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud();
        }
        if (typeof renderUI === 'function') {
            renderUI();
        }
        if (typeof closeModal === 'function') {
            closeModal('result-modal');
        }
        showToast("Result saved successfully!", "success");
    };

    window.deleteResult = function (id) {
        if (typeof window.openConfirmModal === 'function') {
            window.openConfirmModal("Delete Result", "Are you sure you want to delete this result?", () => {
                if (typeof window.recordItemDeletion === 'function') {
                    window.recordItemDeletion(id);
                }
                window.successResults = (window.successResults || []).filter(r => r.id !== id);
                if (typeof window.syncPassFreezeFromResults === 'function') window.syncPassFreezeFromResults();
                if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();
                if (typeof renderUI === 'function') renderUI();
                showToast("Result deleted", "success");
            });
        }
    };

    window.deleteProgramGroup = function (programName) {
        if (typeof window.openConfirmModal === 'function') {
            window.openConfirmModal("Delete Program Card", `Are you sure you want to delete this program card and all its subject results?`, () => {
                if (typeof window.recordItemDeletion === 'function' && Array.isArray(window.successResults)) {
                    window.successResults.filter(r => r.type === 'cgpa' && r.title === programName).forEach(r => window.recordItemDeletion(r.id));
                }
                window.successResults = (window.successResults || []).filter(r => !(r.type === 'cgpa' && r.title === programName));
                if (typeof window.syncPassFreezeFromResults === 'function') window.syncPassFreezeFromResults();
                if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') window.FirebaseService.saveToCloud();
                if (typeof renderUI === 'function') renderUI();
                showToast("Program card deleted", "success");
            });
        }
    };

    /* ==========================================================================
       Pass & Freeze System Logic
       ========================================================================== */

    window.renderPassConfig = function (forceRebuild = false) {
        const container = document.getElementById('outcome-pass-container');
        if (!container) return;
        if (!window.passedItems) window.passedItems = { programs: [], subjects: [] };

        // In-place update if DOM is already constructed and full rebuild isn't requested
        const existingProgInputs = container.querySelectorAll('input[data-pass-type="program"]');
        const existingSubInputs = container.querySelectorAll('input[data-pass-type="subject"]');

        if (!forceRebuild && existingProgInputs.length > 0 && existingSubInputs.length > 0) {
            existingProgInputs.forEach(input => {
                const pName = input.getAttribute('data-pass-prog');
                const shouldBeChecked = Boolean(window.passedItems.programs && window.passedItems.programs.includes(pName));
                if (input.checked !== shouldBeChecked) input.checked = shouldBeChecked;
            });
            existingSubInputs.forEach(input => {
                const sName = input.getAttribute('data-pass-subject');
                const pName = input.getAttribute('data-pass-parent-prog');
                const isProgPassed = Boolean(window.passedItems.programs && window.passedItems.programs.includes(pName));
                const shouldBeChecked = Boolean(isProgPassed || (window.passedItems.subjects && window.passedItems.subjects.includes(sName)));
                if (input.checked !== shouldBeChecked) input.checked = shouldBeChecked;
            });
            return;
        }

        // Preserve open states of existing accordions before rebuilding
        const openAccordions = new Set();
        const existingDetails = container.querySelectorAll('details[data-details-prog]');
        existingDetails.forEach(d => {
            if (d.open) {
                const p = d.getAttribute('data-details-prog');
                if (p) openAccordions.add(p);
            }
        });

        let html = `
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">Mark entire programs or specific subjects as "Passed". This freezes them, compressing their UI in the Task List and instantly satisfying their pacing requirements.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        `;

        // Programs Column (Pass)
        html += '<div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"><h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">Programs (Freeze All Subs)</h4><div class="flex flex-col gap-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-2">';
        window.tracks.forEach(track => {
            if (window.customPrograms[track.id] && window.customPrograms[track.id].length > 0) {
                html += `<div class="mt-2 text-[9px] font-black uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1">${track.name.toUpperCase()}</div>`;
                window.customPrograms[track.id].forEach(p => {
                    const pName = p.name || p;
                    const isChecked = window.passedItems.programs.includes(pName) ? 'checked' : '';
                    const safePName = pName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    html += `
                            <label class="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800/80 active:translate-y-[0.5px] transition-colors duration-75">
                                <input type="checkbox" data-pass-type="program" data-pass-prog="${pName.replace(/"/g, '&quot;')}" onchange="window.togglePassStatus('program', '${safePName}', this.checked)" class="form-checkbox h-4 w-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer active:scale-95 transition-transform duration-75" ${isChecked}>
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${pName}</span>
                            </label>`;
                });
            }
        });
        html += '</div></div>';

        // Subjects Column (Pass)
        html += '<div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"><h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">Individual Subjects</h4><div class="flex flex-col gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-2">';
        window.tracks.forEach(track => {
            if (window.customPrograms[track.id]) {
                window.customPrograms[track.id].forEach(prog => {
                    const progName = prog.name || prog;
                    const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                    if (subs.length > 0) {
                        const isOpen = openAccordions.has(progName) ? 'open' : '';
                        const safeProgName = progName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                        html += `
                                <details data-details-prog="${progName.replace(/"/g, '&quot;')}" ${isOpen} class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                                    <summary class="cursor-pointer font-black text-[10px] md:text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300 p-3 outline-none select-none list-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors duration-75 [&::-webkit-details-marker]:hidden">
                                        <div class="flex items-center space-x-2">
                                            <span>${progName}</span>
                                            <span class="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[8px]">${subs.length} Subs</span>
                                        </div>
                                        <svg class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </summary>
                                    <div class="p-3 pt-0 border-t border-slate-100 dark:border-slate-700">
                                        <div class="flex flex-col gap-1 mt-2.5">
                                `;
                        subs.forEach(s => {
                            const isProgPassed = window.passedItems.programs.includes(progName);
                            const isChecked = window.passedItems.subjects.includes(s.subject) || isProgPassed ? 'checked' : '';
                            let displaySub = s.subject.replace(s.program + ' - ', '').replace(s.program + ' ', '');
                            const safeSub = s.subject.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                            html += `
                                            <label class="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 active:translate-y-[0.5px] transition-colors duration-75">
                                                <input type="checkbox" data-pass-type="subject" data-pass-subject="${s.subject.replace(/"/g, '&quot;')}" data-pass-parent-prog="${progName.replace(/"/g, '&quot;')}" onchange="window.togglePassStatus('subject', '${safeSub}', this.checked)" class="form-checkbox h-4 w-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer active:scale-95 transition-transform duration-75" ${isChecked}>
                                                <span class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">${displaySub}</span>
                                            </label>`;
                        });
                        html += `
                                        </div>
                                    </div>
                                </details>`;
                    }
                });
            }
        });
        html += '</div></div></div>';

        container.innerHTML = html;
    };

    window.togglePassStatus = function (type, name, isChecked) {
        if (!window.passedItems) window.passedItems = { programs: [], subjects: [] };
        if (!AppState.passedItems) AppState.passedItems = window.passedItems;

        if (type === 'program') {
            if (isChecked) {
                if (!window.passedItems.programs.includes(name)) window.passedItems.programs.push(name);

                let programSubs = [];
                window.tracks.forEach(track => {
                    if (syllabusStructure[track.id]) {
                        syllabusStructure[track.id].forEach(s => {
                            if (s.program === name) programSubs.push(s.subject);
                        });
                    }
                });
                programSubs.forEach(sub => {
                    if (!window.passedItems.subjects.includes(sub)) window.passedItems.subjects.push(sub);
                });

            } else {
                window.passedItems.programs = window.passedItems.programs.filter(p => p !== name);

                let programSubs = [];
                window.tracks.forEach(track => {
                    if (syllabusStructure[track.id]) {
                        syllabusStructure[track.id].forEach(s => {
                            if (s.program === name) programSubs.push(s.subject);
                        });
                    }
                });
                window.passedItems.subjects = window.passedItems.subjects.filter(s => !programSubs.includes(s));
            }
        } else if (type === 'subject') {
            if (isChecked) {
                if (!window.passedItems.subjects.includes(name)) window.passedItems.subjects.push(name);

                const sObj = typeof window.getAllSubjects === 'function' ? window.getAllSubjects().find(s => s.subject === name) : null;
                if (sObj) {
                    const progName = sObj.program;
                    let allSubsInProg = [];
                    window.tracks.forEach(track => {
                        if (syllabusStructure[track.id]) {
                            syllabusStructure[track.id].forEach(s => {
                                if (s.program === progName) allSubsInProg.push(s.subject);
                            });
                        }
                    });
                    const allPassed = allSubsInProg.length > 0 && allSubsInProg.every(sub => window.passedItems.subjects.includes(sub));
                    if (allPassed && !window.passedItems.programs.includes(progName)) {
                        window.passedItems.programs.push(progName);
                    }
                }

            } else {
                window.passedItems.subjects = window.passedItems.subjects.filter(s => s !== name);

                const sObj = typeof window.getAllSubjects === 'function' ? window.getAllSubjects().find(s => s.subject === name) : null;
                if (sObj) {
                    const progName = sObj.program;
                    window.passedItems.programs = window.passedItems.programs.filter(p => p !== progName);
                }
            }
        }

        // Direct synchronous in-place DOM sync
        const container = document.getElementById('outcome-pass-container');
        if (container) {
            const escapeSelectorVal = (val) => (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(val) : val.replace(/["\\]/g, '\\$&');
            if (type === 'program') {
                const pInput = container.querySelector(`input[data-pass-type="program"][data-pass-prog="${escapeSelectorVal(name)}"]`);
                if (pInput && pInput.checked !== isChecked) pInput.checked = isChecked;
                const subInputs = container.querySelectorAll(`input[data-pass-type="subject"][data-pass-parent-prog="${escapeSelectorVal(name)}"]`);
                subInputs.forEach(si => {
                    if (si.checked !== isChecked) si.checked = isChecked;
                });
            } else if (type === 'subject') {
                const sInput = container.querySelector(`input[data-pass-type="subject"][data-pass-subject="${escapeSelectorVal(name)}"]`);
                if (sInput && sInput.checked !== isChecked) sInput.checked = isChecked;
                const sObj = typeof window.getAllSubjects === 'function' ? window.getAllSubjects().find(s => s.subject === name) : null;
                if (sObj) {
                    const progName = sObj.program;
                    const isParentChecked = window.passedItems.programs.includes(progName);
                    const pInput = container.querySelector(`input[data-pass-type="program"][data-pass-prog="${escapeSelectorVal(progName)}"]`);
                    if (pInput && pInput.checked !== isParentChecked) pInput.checked = isParentChecked;
                }
            }
        }

        // Persist to local state & schedule debounced cloud save
        if (typeof window.markLocalMutation === 'function') {
            window.markLocalMutation('passedItems');
        } else if (AppState) {
            AppState.isLocalDirty = true;
        }
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud(false);
        }

        // Debounce background full-app re-renders
        if (window._passConfigDebounceTimer) clearTimeout(window._passConfigDebounceTimer);
        window._passConfigDebounceTimer = setTimeout(() => {
            window._passConfigDebounceTimer = null;
            if (typeof updateSuccessScore === 'function') updateSuccessScore();
            if (typeof renderUI === 'function') renderUI();
        }, 80);

        // Debounce toast notifications
        if (window._passToastTimer) clearTimeout(window._passToastTimer);
        window._passToastTimer = setTimeout(() => {
            window._passToastTimer = null;
            showToast("Pass / Freeze configuration updated!", "success");
        }, 250);
    };

    /* ==========================================================================
       Milestone Celebration Criteria System Logic
       ========================================================================== */

    window.renderCelebrationConfig = function (forceRebuild = false) {
        const container = document.getElementById('outcome-celebration-container');
        if (!container) return;
        if (!window.celebrationTargets) window.celebrationTargets = { programs: [], subjects: [] };
        if (!window.passedItems) window.passedItems = { programs: [], subjects: [] };

        const hasCustomCeleb = Boolean(
            (window.celebrationTargets.programs && window.celebrationTargets.programs.length > 0) ||
            (window.celebrationTargets.subjects && window.celebrationTargets.subjects.length > 0)
        );

        let html = `
            <div class="space-y-5">
                <!-- Header description & Action buttons -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 font-bold">
                            Define which essential programs and subjects must be passed to unlock your completion celebration. Non-selected electives or extra courses won't block your celebration.
                        </p>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap shrink-0">
                        <button onclick="window.openCelebrationSetupModal()" class="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-amber-400/30">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span>Setup Criteria</span>
                        </button>
                        <button onclick="window.showCongratsModal(true, 1, 1)" class="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-emerald-400/30">
                            <span>🎉</span>
                            <span>Preview Celebration</span>
                        </button>
                        ${hasCustomCeleb ? `
                        <button onclick="window.selectAllCelebrationTargets('clear')" class="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 border border-rose-200/60 dark:border-rose-800/50 shadow-sm" title="Reset celebration criteria to default (all courses)">
                            Reset to Default
                        </button>` : ''}
                    </div>
                </div>

                <!-- Live Status Progress Card -->
                <div id="celeb-live-status-card" class="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-amber-200/60 dark:border-amber-700/40 shadow-sm transition-all">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span id="celeb-live-badge" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm">
                                <span>⚙️</span>
                                <span>Default: 100% All</span>
                            </span>
                            <span id="celeb-live-text" class="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">0 of 0 Core Courses Passed (0%)</span>
                        </div>
                    </div>
                    <div class="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-2.5 overflow-hidden mb-2">
                        <div id="celeb-live-bar" class="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 shadow-sm" style="width: 0%;"></div>
                    </div>
                    <p id="celeb-live-subtext" class="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Currently set to default. Click "Setup Criteria" to select specific core courses.</p>
                </div>

                <!-- Configured Core Celebration Targets Section -->
                <div class="bg-slate-50/70 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-inner">
                    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 mb-3.5">
                        <div class="flex items-center space-x-2">
                            <span class="text-amber-500 dark:text-amber-400 text-sm">🎯</span>
                            <h4 class="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Configured Celebration Criteria</h4>
                        </div>
                        <button onclick="window.openCelebrationSetupModal()" class="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline flex items-center gap-1">
                            <span>Configure / Edit</span>
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>

                    <div id="celeb-targets-summary-list" class="flex flex-wrap gap-2">
        `;

        if (!hasCustomCeleb) {
            html += `
                <div class="w-full py-4 px-4 text-center rounded-xl bg-white/60 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700">
                    <p class="text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span class="text-amber-500 font-black">Default Mode:</span> All subjects across all programs are currently required for the celebration.
                    </p>
                    <button onclick="window.openCelebrationSetupModal()" class="mt-2 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline">
                        + Select Essential Core Courses
                    </button>
                </div>
            `;
        } else {
            (window.celebrationTargets.programs || []).forEach(pName => {
                const isPassed = Boolean(window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(pName));
                html += `
                    <div class="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border ${isPassed ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-amber-200/80 dark:border-amber-700/50'} shadow-sm text-xs font-bold">
                        <span class="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${isPassed ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}">Program</span>
                        <span class="text-slate-800 dark:text-slate-200">${pName}</span>
                        <span class="text-[9px] font-black uppercase tracking-wider ${isPassed ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400'}">${isPassed ? '✓ Passed' : 'Pending'}</span>
                    </div>
                `;
            });

            (window.celebrationTargets.subjects || []).forEach(subName => {
                const sObj = typeof window.getAllSubjects === 'function' ? window.getAllSubjects().find(s => s.subject === subName) : null;
                const progName = sObj ? sObj.program : '';
                if (window.celebrationTargets.programs && window.celebrationTargets.programs.includes(progName)) {
                    return;
                }
                const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(subName)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));
                let displaySub = progName ? subName.replace(progName + ' - ', '').replace(progName + ' ', '') : subName;

                html += `
                    <div class="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border ${isPassed ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700'} shadow-sm text-xs font-bold">
                        <span class="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${isPassed ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">Subject</span>
                        <span class="text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-xs" title="${subName}">${displaySub}</span>
                        <span class="text-[9px] font-black uppercase tracking-wider ${isPassed ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400'}">${isPassed ? '✓ Passed' : 'Pending'}</span>
                    </div>
                `;
            });
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        if (typeof updateSuccessScore === 'function') updateSuccessScore();
    };

    window.openCelebrationSetupModal = function () {
        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        if (!window.celebrationTargets) window.celebrationTargets = { programs: [], subjects: [] };
        if (!window.passedItems) window.passedItems = { programs: [], subjects: [] };

        const searchInput = document.getElementById('csm-search-input');
        if (searchInput) searchInput.value = '';

        const container = document.getElementById('csm-checklist-container');
        if (!container) return;

        let html = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        `;

        // 1. Programs Column
        html += `
            <div class="bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col csm-column-programs">
                <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5 mb-3">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <span>Entire Programs</span>
                    </h4>
                    <span class="text-[9px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold">Includes All Subs</span>
                </div>
                <div class="flex flex-col gap-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1" id="csm-programs-list">
        `;

        window.tracks.forEach(track => {
            if (window.customPrograms[track.id] && window.customPrograms[track.id].length > 0) {
                html += `<div class="mt-2 text-[9px] font-black uppercase text-slate-400 border-b border-slate-200/60 dark:border-slate-700/60 pb-1">${track.name.toUpperCase()}</div>`;
                window.customPrograms[track.id].forEach(p => {
                    const pName = p.name || p;
                    const isChecked = Boolean(window.celebrationTargets.programs && window.celebrationTargets.programs.includes(pName)) ? 'checked' : '';
                    const safePName = pName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const isPassed = Boolean(window.passedItems && window.passedItems.programs && window.passedItems.programs.includes(pName));

                    html += `
                        <label class="csm-program-item flex items-center justify-between space-x-2 cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/80 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 active:scale-[0.99] transition-all" data-csm-name="${pName.toLowerCase()}">
                            <div class="flex items-center space-x-2.5 min-w-0 flex-1">
                                <input type="checkbox" data-modal-celeb-type="program" data-modal-celeb-prog="${pName.replace(/"/g, '&quot;')}" onchange="window.onModalToggleProgram('${safePName}', this.checked)" class="modal-celeb-prog-cb form-checkbox h-4 w-4 text-amber-500 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-500 cursor-pointer active:scale-95 transition-transform" ${isChecked}>
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">${pName}</span>
                            </div>
                            ${isPassed ? `<span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>` : ''}
                        </label>
                    `;
                });
            }
        });

        html += `</div></div>`;

        // 2. Individual Subjects Column
        html += `
            <div class="bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col csm-column-subjects">
                <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5 mb-3">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <span>Individual Subjects</span>
                    </h4>
                    <span class="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">Grouped by Program</span>
                </div>
                <div class="flex flex-col gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-1" id="csm-subjects-list">
        `;

        window.tracks.forEach(track => {
            if (window.customPrograms[track.id]) {
                window.customPrograms[track.id].forEach(prog => {
                    const progName = prog.name || prog;
                    const subs = (syllabusStructure[track.id] || []).filter(s => s.program === progName);
                    if (subs.length > 0) {
                        const isProgCeleb = Boolean(window.celebrationTargets.programs && window.celebrationTargets.programs.includes(progName));
                        const safeProgName = progName.replace(/'/g, "\\'").replace(/"/g, '&quot;');

                        html += `
                            <details data-csm-details-prog="${progName.replace(/"/g, '&quot;')}" class="csm-subject-group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                                <summary class="cursor-pointer font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300 p-2.5 outline-none select-none list-none flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors [&::-webkit-details-marker]:hidden">
                                    <div class="flex items-center space-x-2 min-w-0">
                                        <span class="truncate">${progName}</span>
                                        <span class="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-[8px] shrink-0">${subs.length} Subs</span>
                                    </div>
                                    <svg class="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </summary>
                                <div class="p-2.5 pt-0 border-t border-slate-100 dark:border-slate-700">
                                    <div class="flex flex-col gap-1 mt-2">
                        `;

                        subs.forEach(s => {
                            const isSubChecked = Boolean(isProgCeleb || (window.celebrationTargets.subjects && window.celebrationTargets.subjects.includes(s.subject)));
                            const isCheckedStr = isSubChecked ? 'checked' : '';
                            let displaySub = s.subject.replace(s.program + ' - ', '').replace(s.program + ' ', '');
                            const safeSub = s.subject.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                            const isPassed = Boolean(window.passedItems && ((window.passedItems.subjects && window.passedItems.subjects.includes(s.subject)) || (window.passedItems.programs && window.passedItems.programs.includes(progName))));

                            html += `
                                <label class="csm-sub-item flex items-center justify-between space-x-2 cursor-pointer p-1.5 rounded-lg hover:bg-amber-50/50 dark:hover:bg-slate-900/50 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 active:scale-[0.99] transition-all" data-csm-subname="${s.subject.toLowerCase()}">
                                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                                        <input type="checkbox" data-modal-celeb-type="subject" data-modal-celeb-subject="${s.subject.replace(/"/g, '&quot;')}" data-modal-celeb-parent-prog="${progName.replace(/"/g, '&quot;')}" onchange="window.onModalToggleSubject('${safeSub}', '${safeProgName}', this.checked)" class="modal-celeb-sub-cb form-checkbox h-3.5 w-3.5 text-amber-500 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-500 cursor-pointer active:scale-95 transition-transform" ${isCheckedStr}>
                                        <span class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${s.subject}">${displaySub}</span>
                                    </div>
                                    ${isPassed ? `<span class="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">Passed</span>` : ''}
                                </label>
                            `;
                        });

                        html += `</div></div></details>`;
                    }
                });
            }
        });

        html += `</div></div></div>`;

        container.innerHTML = html;

        window.updateModalSelectedCount();
        if (typeof openModal === 'function') {
            openModal('celebration-setup-modal');
        }
    };

    window.onModalToggleProgram = function (progName, isChecked) {
        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        const escapeVal = (val) => (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(val) : val.replace(/["\\]/g, '\\$&');
        const subInputs = modal.querySelectorAll(`input.modal-celeb-sub-cb[data-modal-celeb-parent-prog="${escapeVal(progName)}"]`);
        subInputs.forEach(input => {
            input.checked = isChecked;
        });

        window.updateModalSelectedCount();
    };

    window.onModalToggleSubject = function (subName, progName, isChecked) {
        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        const escapeVal = (val) => (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(val) : val.replace(/["\\]/g, '\\$&');
        const pInput = modal.querySelector(`input.modal-celeb-prog-cb[data-modal-celeb-prog="${escapeVal(progName)}"]`);
        const siblingSubInputs = modal.querySelectorAll(`input.modal-celeb-sub-cb[data-modal-celeb-parent-prog="${escapeVal(progName)}"]`);

        if (pInput && siblingSubInputs.length > 0) {
            const allChecked = Array.from(siblingSubInputs).every(si => si.checked);
            pInput.checked = allChecked;
        }

        window.updateModalSelectedCount();
    };

    window.selectCelebrationModalTargets = function (mode) {
        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        if (!window.passedItems) window.passedItems = { programs: [], subjects: [] };

        const progInputs = modal.querySelectorAll('input.modal-celeb-prog-cb');
        const subInputs = modal.querySelectorAll('input.modal-celeb-sub-cb');

        if (mode === 'all-passed') {
            progInputs.forEach(input => {
                const pName = input.getAttribute('data-modal-celeb-prog');
                input.checked = Boolean(window.passedItems.programs && window.passedItems.programs.includes(pName));
            });
            subInputs.forEach(input => {
                const sName = input.getAttribute('data-modal-celeb-subject');
                const pName = input.getAttribute('data-modal-celeb-parent-prog');
                const isProgPassed = Boolean(window.passedItems.programs && window.passedItems.programs.includes(pName));
                input.checked = Boolean(isProgPassed || (window.passedItems.subjects && window.passedItems.subjects.includes(sName)));
            });
            showToast("Checked passed courses as celebration targets!", "info");
        } else if (mode === 'all') {
            progInputs.forEach(input => { input.checked = true; });
            subInputs.forEach(input => { input.checked = true; });
            showToast("Checked all courses!", "info");
        } else if (mode === 'clear') {
            progInputs.forEach(input => { input.checked = false; });
            subInputs.forEach(input => { input.checked = false; });
            showToast("Cleared selection!", "info");
        }

        window.updateModalSelectedCount();
    };

    window.filterCelebrationSetupItems = function (query) {
        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        const q = (query || '').toLowerCase().trim();
        const progItems = modal.querySelectorAll('.csm-program-item');
        const subGroups = modal.querySelectorAll('.csm-subject-group');

        progItems.forEach(item => {
            const name = item.getAttribute('data-csm-name') || '';
            item.style.display = (!q || name.includes(q)) ? 'flex' : 'none';
        });

        subGroups.forEach(group => {
            const progName = (group.getAttribute('data-csm-details-prog') || '').toLowerCase();
            const subItems = group.querySelectorAll('.csm-sub-item');
            let groupHasMatch = !q || progName.includes(q);

            subItems.forEach(si => {
                const subName = (si.getAttribute('data-csm-subname') || '');
                const match = !q || progName.includes(q) || subName.includes(q);
                si.style.display = match ? 'flex' : 'none';
                if (match) groupHasMatch = true;
            });

            group.style.display = groupHasMatch ? 'block' : 'none';
            if (q && groupHasMatch) {
                group.open = true;
            }
        });
    };

    window.updateModalSelectedCount = function () {
        const countEl = document.getElementById('csm-selected-count');
        if (!countEl) return;

        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        const checkedProgs = modal.querySelectorAll('input.modal-celeb-prog-cb:checked').length;
        const checkedSubs = modal.querySelectorAll('input.modal-celeb-sub-cb:checked').length;

        if (checkedProgs === 0 && checkedSubs === 0) {
            countEl.innerHTML = `<span class="text-amber-600 dark:text-amber-400 font-black">Default Mode</span> (All courses required)`;
        } else {
            countEl.innerHTML = `<span class="font-black text-amber-600 dark:text-amber-400">${checkedProgs}</span> Program${checkedProgs === 1 ? '' : 's'} & <span class="font-black text-amber-600 dark:text-amber-400">${checkedSubs}</span> Subject${checkedSubs === 1 ? '' : 's'} selected`;
        }
    };

    window.saveCelebrationSetup = function () {
        const modal = document.getElementById('celebration-setup-modal');
        if (!modal) return;

        const progInputs = modal.querySelectorAll('input.modal-celeb-prog-cb:checked');
        const subInputs = modal.querySelectorAll('input.modal-celeb-sub-cb:checked');

        const selectedProgs = Array.from(progInputs).map(i => i.getAttribute('data-modal-celeb-prog')).filter(Boolean);
        const selectedSubs = Array.from(subInputs).map(i => i.getAttribute('data-modal-celeb-subject')).filter(Boolean);

        window.celebrationTargets = {
            programs: selectedProgs,
            subjects: selectedSubs
        };

        if (AppState) {
            AppState.celebrationTargets = window.celebrationTargets;
            AppState.isLocalDirty = true;
        }

        // Persist & sync
        if (typeof window.markLocalMutation === 'function') {
            window.markLocalMutation('celebrationTargets');
        }
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud(false);
        }

        if (typeof closeModal === 'function') {
            closeModal('celebration-setup-modal');
        }
        window.renderCelebrationConfig(true);
        if (typeof updateSuccessScore === 'function') updateSuccessScore();

        showToast("Milestone celebration criteria saved!", "success");
    };

    window.selectAllCelebrationTargets = function (mode) {
        if (!window.celebrationTargets) window.celebrationTargets = { programs: [], subjects: [] };
        if (!window.passedItems) window.passedItems = { programs: [], subjects: [] };

        if (mode === 'all-passed') {
            window.celebrationTargets.programs = [...(window.passedItems.programs || [])];
            window.celebrationTargets.subjects = [...(window.passedItems.subjects || [])];
            showToast("Set all currently passed courses as celebration criteria!", "success");
        } else if (mode === 'all') {
            const allProgs = [];
            const allSubs = [];
            window.tracks.forEach(track => {
                if (window.customPrograms[track.id]) {
                    window.customPrograms[track.id].forEach(p => {
                        const pName = p.name || p;
                        if (!allProgs.includes(pName)) allProgs.push(pName);
                    });
                }
                if (syllabusStructure[track.id]) {
                    syllabusStructure[track.id].forEach(s => {
                        if (!allSubs.includes(s.subject)) allSubs.push(s.subject);
                    });
                }
            });
            window.celebrationTargets.programs = allProgs;
            window.celebrationTargets.subjects = allSubs;
            showToast("All courses selected for celebration criteria!", "success");
        } else if (mode === 'clear') {
            window.celebrationTargets.programs = [];
            window.celebrationTargets.subjects = [];
            showToast("Celebration criteria reset to default!", "info");
        }

        if (AppState) AppState.celebrationTargets = window.celebrationTargets;

        // Persist & sync
        if (typeof window.markLocalMutation === 'function') {
            window.markLocalMutation('celebrationTargets');
        }
        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud(false);
        }

        // Re-render celebration config overview
        window.renderCelebrationConfig(true);
        if (typeof updateSuccessScore === 'function') updateSuccessScore();
    };

    window.updateCelebrationLiveStatus = function (corePassed, coreTotal, hasCustomCeleb, celebrationMet) {
        const card = document.getElementById('celeb-live-status-card');
        if (!card) return;

        const pct = coreTotal > 0 ? Math.round((corePassed / coreTotal) * 100) : 0;
        const badgeEl = document.getElementById('celeb-live-badge');
        const textEl = document.getElementById('celeb-live-text');
        const barEl = document.getElementById('celeb-live-bar');
        const subTextEl = document.getElementById('celeb-live-subtext');

        if (badgeEl) {
            if (celebrationMet) {
                badgeEl.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg animate-pulse flex items-center gap-1.5";
                badgeEl.innerHTML = "<span>🎉</span><span>Celebration Unlocked!</span>";
            } else if (hasCustomCeleb) {
                badgeEl.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5";
                badgeEl.innerHTML = "<span>🎯</span><span>Core Target Active</span>";
            } else {
                badgeEl.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5";
                badgeEl.innerHTML = "<span>⚙️</span><span>Default: 100% All</span>";
            }
        }

        if (textEl) {
            if (hasCustomCeleb) {
                textEl.textContent = `${corePassed} of ${coreTotal} Core Courses Passed (${pct}%)`;
            } else {
                textEl.textContent = `${corePassed} of ${coreTotal} Total Courses Passed (${pct}%)`;
            }
        }

        if (subTextEl) {
            if (celebrationMet) {
                subTextEl.textContent = "All required core milestone courses have been conquered! Celebration modal active.";
            } else if (hasCustomCeleb) {
                const remaining = Math.max(0, coreTotal - corePassed);
                subTextEl.textContent = `${remaining} core course${remaining === 1 ? '' : 's'} remaining until celebration.`;
            } else {
                subTextEl.textContent = "Currently set to default (all courses required). Select core items below to customize your celebration criteria.";
            }
        }

        if (barEl) {
            barEl.style.width = `${pct}%`;
            if (celebrationMet) {
                barEl.className = "h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500 shadow-sm";
            } else {
                barEl.className = "h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 shadow-sm";
            }
        }
    };

})();
