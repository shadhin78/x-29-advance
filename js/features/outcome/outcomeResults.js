/**
 * X-29 Module: features/outcome/outcomeResults.js
 * Exam results logging, dynamic estimation, CGPA calculation, and result card rendering:
 * - Program CGPA & letter grade dynamic estimation (getProcessedResults)
 * - Main target resolution from customPrograms and historical records (getProgramMainTarget)
 * - Exam results CRUD (create, edit, delete single result, delete program group)
 * - Interactive score input validation, auto-grade / auto-cgpa badges, and modal score estimation
 * - Outcome program visibility toggles and date sort controls
 * - Outcome Page lifecycle coordinator
 */
(function (global) {
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

            // 1. Render Program Visibility Toggles
            if (typeof global.renderOutcomeProgramToggles === 'function') {
                global.renderOutcomeProgramToggles();
            }

            // 2. Render Scorecards & Overall Metrics
            if (typeof global.renderResults === 'function') {
                global.renderResults();
            }

            // 3. Render Pass / Freeze Configuration Checklist
            if (typeof global.renderPassConfig === 'function') {
                global.renderPassConfig();
            }

            // 4. Render Milestone Celebration Criteria
            if (typeof global.renderCelebrationConfig === 'function') {
                global.renderCelebrationConfig();
            }

            // 5. Trigger resize on active trend chart if mounted
            setTimeout(() => {
                if (global.resultsTrendChartInstance && typeof global.resultsTrendChartInstance.resize === 'function') {
                    global.resultsTrendChartInstance.resize();
                }
            }, 300);
        },

        destroy: function () {
            this.isMounted = false;

            if (global.resultsTrendChartInstance && typeof global.resultsTrendChartInstance.destroy === 'function') {
                global.resultsTrendChartInstance.destroy();
                global.resultsTrendChartInstance = null;
            }
            if (global.programTrendChartInstance && typeof global.programTrendChartInstance.destroy === 'function') {
                global.programTrendChartInstance.destroy();
                global.programTrendChartInstance = null;
            }
            if (global.subjectWiseChartInstance && typeof global.subjectWiseChartInstance.destroy === 'function') {
                global.subjectWiseChartInstance.destroy();
                global.subjectWiseChartInstance = null;
            }

            // Close outcome modals if open
            if (typeof global.closeModal === 'function') {
                const modals = ['result-modal', 'program-trend-modal', 'celebration-setup-modal', 'congrats-modal'];
                modals.forEach(m => {
                    const el = document.getElementById(m);
                    if (el && !el.classList.contains('hidden')) {
                        global.closeModal(m);
                    }
                });
            }
        },

        openResultModal: function (id = null, editProgramName = null) {
            openResultModal(id, editProgramName);
        },

        renderResults: function () {
            renderResults();
        },

        toggleOutcomeDateSort: function () {
            toggleOutcomeDateSort();
        },

        deleteResult: function (id) {
            deleteResult(id);
        },

        deleteProgramGroup: function (programName) {
            deleteProgramGroup(programName);
        },

        renderPassConfig: function (forceRebuild = false) {
            if (typeof global.renderPassConfig === 'function') {
                global.renderPassConfig(forceRebuild);
            }
        },

        renderCelebrationConfig: function () {
            if (typeof global.renderCelebrationConfig === 'function') {
                global.renderCelebrationConfig();
            }
        },

        renderOutcomeProgramToggles: function () {
            renderOutcomeProgramToggles();
        }
    };

    /**
     * Resolves target CGPA and letter grade from custom programs or historical outcome records.
     *
     * @param {string} progName
     * @returns {{ targetCGPA: string, targetGrade: string }}
     */
    function getProgramMainTarget(progName) {
        let targetCGPA = '';
        const AppStateRef = (typeof global.AppState !== 'undefined' && global.AppState) || (typeof window !== 'undefined' && window.AppState) || {};
        const customPrograms = global.customPrograms || (AppStateRef && AppStateRef.customPrograms) || (typeof window !== 'undefined' ? window.customPrograms : {}) || {};
        const successResults = global.successResults || (AppStateRef && AppStateRef.successResults) || (typeof window !== 'undefined' ? window.successResults : []) || [];
        const parseDate = (typeof global.Utils !== 'undefined' && typeof global.Utils.parseDateSafe === 'function')
            ? global.Utils.parseDateSafe
            : (d => new Date(d));

        for (const trackId in customPrograms) {
            const progList = customPrograms[trackId];
            if (Array.isArray(progList)) {
                const prog = progList.find(p => (p.name || p) === progName);
                if (prog && typeof prog === 'object' && prog.targetCGPA !== undefined && prog.targetCGPA !== null) {
                    targetCGPA = prog.targetCGPA.toString().trim();
                    if (targetCGPA) break;
                }
            }
        }

        if (!targetCGPA && Array.isArray(successResults)) {
            const overallRecords = successResults
                .filter(r => r.type === 'cgpa' && !r.subject && r.title === progName)
                .sort((a, b) => parseDate(b.date) - parseDate(a.date));
            if (overallRecords.length > 0 && overallRecords[0].targetCGPA) {
                targetCGPA = overallRecords[0].targetCGPA.toString().trim();
            }
        }

        if (!targetCGPA && Array.isArray(successResults)) {
            const anyRecords = successResults
                .filter(r => r.type === 'cgpa' && r.title === progName && r.targetCGPA)
                .sort((a, b) => parseDate(b.date) - parseDate(a.date));
            if (anyRecords.length > 0) {
                targetCGPA = anyRecords[0].targetCGPA.toString().trim();
            }
        }

        let targetGrade = '';
        if (targetCGPA) {
            if (targetCGPA.toLowerCase() === 'none' || targetCGPA === '0') {
                targetCGPA = 'none';
                targetGrade = 'none';
            } else if (typeof global.Utils !== 'undefined' && typeof global.Utils.mapCgpaToGrade === 'function') {
                targetGrade = global.Utils.mapCgpaToGrade(targetCGPA);
            }
        }
        return { targetCGPA, targetGrade };
    }

    /**
     * Processes raw successResults: groups by program & date, dynamically computes program average CGPA/grade
     * if overall score is omitted, and injects target metadata.
     *
     * @returns {Array<Object>} Processed result items
     */
    function getProcessedResults() {
        const AppStateRef = (typeof global.AppState !== 'undefined' && global.AppState) || (typeof window !== 'undefined' && window.AppState) || {};
        const rawResults = global.successResults || (AppStateRef && AppStateRef.successResults) || (typeof window !== 'undefined' ? window.successResults : []) || [];
        if (!Array.isArray(rawResults)) return [];

        const groups = {};
        rawResults.forEach(res => {
            if (res.type !== 'cgpa') return;
            const progName = res.title || '';
            const dateStr = res.date || '';
            const key = progName + '|||' + dateStr;
            if (!groups[key]) {
                groups[key] = {
                    program: progName,
                    date: dateStr,
                    overall: null,
                    subjects: []
                };
            }
            if (!res.subject) {
                groups[key].overall = { ...res };
            } else {
                groups[key].subjects.push({ ...res });
            }
        });

        const processedOveralls = [];
        const processedSubjects = [];

        const allSubs = typeof global.getAllSubjects === 'function' ? global.getAllSubjects() : [];
        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.formatCgpa === 'function')
            ? global.formatCgpa
            : (val => Number(val).toFixed(2));
        const mapCgpaToGrade = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapCgpaToGrade === 'function')
            ? global.Utils.mapCgpaToGrade
            : (() => 'A');
        const mapGradeToNum = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapGradeToNumeric === 'function')
            ? global.Utils.mapGradeToNumeric
            : (() => 4.0);

        for (const key in groups) {
            const group = groups[key];
            const subjects = group.subjects;
            let overall = group.overall;

            let estCgpa = '';
            let estGrade = '';
            const evalType = (overall && overall.evaluationType) || (subjects.length > 0 && subjects[0].evaluationType) || 'cgpa';
            const isGrade = evalType === 'grade';

            const allProgramSubjects = allSubs.filter(s => s.program === group.program);
            const totalProgramSubjectsCount = allProgramSubjects.length;

            let sumCgpa = 0;
            allProgramSubjects.forEach(ps => {
                const res = subjects.find(s => s.subject === ps.subject);
                if (res) {
                    if (isGrade) {
                        if (res.grade && res.grade.trim() !== '' && res.grade !== 'F') {
                            sumCgpa += mapGradeToNum(res.grade, 'grade');
                        }
                    } else {
                        const val = parseFloat(res.value);
                        if (res.value && !isNaN(val) && val > 0) {
                            sumCgpa += val;
                        }
                    }
                }
            });

            if (totalProgramSubjectsCount > 0) {
                const avgCgpa = sumCgpa / totalProgramSubjectsCount;
                estCgpa = formatCgpa(avgCgpa);
                estGrade = mapCgpaToGrade(avgCgpa, isGrade ? 'grade' : 'cgpa');
            }

            const fallbackMainTarget = getProgramMainTarget(group.program);

            if (!overall) {
                overall = {
                    id: 'dynamic_overall_' + group.program + '_' + group.date,
                    type: 'cgpa',
                    evaluationType: evalType,
                    title: group.program,
                    subject: '',
                    value: estCgpa,
                    grade: estGrade,
                    targetGrade: fallbackMainTarget.targetGrade || '',
                    targetCGPA: fallbackMainTarget.targetCGPA || '',
                    date: group.date,
                    isEstimated: true
                };
            } else {
                if (isGrade) {
                    if (!overall.grade && estGrade) {
                        overall.grade = estGrade;
                        overall.value = estCgpa;
                        overall.isEstimated = true;
                    }
                } else {
                    if (!overall.value && estCgpa) {
                        overall.value = estCgpa;
                        overall.grade = estGrade;
                        overall.isEstimated = true;
                    }
                }
                if (!overall.targetCGPA && fallbackMainTarget.targetCGPA) {
                    overall.targetCGPA = fallbackMainTarget.targetCGPA;
                    overall.targetGrade = fallbackMainTarget.targetGrade;
                }
            }

            processedOveralls.push(overall);
            subjects.forEach(s => {
                if (!s.targetCGPA && overall.targetCGPA) {
                    s.targetCGPA = overall.targetCGPA;
                    s.targetGrade = overall.targetGrade;
                }
                processedSubjects.push(s);
            });
        }

        const nonCgpaRecords = rawResults.filter(r => r.type !== 'cgpa').map(r => ({ ...r }));
        return [...processedOveralls, ...processedSubjects, ...nonCgpaRecords];
    }

    /**
     * Input formatting and auto-grade badge updater on blur.
     */
    function onCgpaBlur(inputEl) {
        if (!inputEl) return;
        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.Utils.validateAndFormatCgpa === 'function')
            ? global.Utils.validateAndFormatCgpa
            : (v => v);
        inputEl.value = formatCgpa(inputEl.value);
        onCgpaInput(inputEl);
    }

    /**
     * Input sanitization and auto-grade badge updater on keystroke.
     */
    function onCgpaInput(inputEl) {
        if (!inputEl) return;
        let valStr = inputEl.value;
        valStr = valStr.replace(/[^0-9.]/g, '');
        const parts = valStr.split('.');
        if (parts.length > 2) {
            valStr = parts[0] + '.' + parts.slice(1).join('');
        }
        let val = parseFloat(valStr);
        if (!isNaN(val)) {
            if (val < 0) valStr = '0.00';
            if (val > 4.0) valStr = '4.00';
        }
        if (inputEl.value !== valStr) {
            inputEl.value = valStr;
        }

        const badge = inputEl.parentElement ? inputEl.parentElement.querySelector('.auto-grade-badge') : null;
        if (badge) {
            const mapCgpaToGrade = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapCgpaToGrade === 'function')
                ? global.Utils.mapCgpaToGrade
                : (() => '');
            const g = mapCgpaToGrade(inputEl.value);
            badge.textContent = g || '—';
            badge.classList.toggle('opacity-40', !g);
        }
    }

    /**
     * Updates numeric CGPA equivalent badge for a grade dropdown selection.
     */
    function updateCgpaBadge(gradeVal, badge) {
        if (!badge) return;
        const evalType = document.getElementById('res-evaluation-type')?.value || 'cgpa';
        const mapGradeToNum = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapGradeToNumeric === 'function')
            ? global.Utils.mapGradeToNumeric
            : (() => 0);
        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.formatCgpa === 'function')
            ? global.formatCgpa
            : (v => Number(v).toFixed(2));

        const c = mapGradeToNum(gradeVal, evalType);
        badge.textContent = gradeVal ? formatCgpa(c) : '—';
        badge.classList.toggle('opacity-40', !gradeVal);
    }

    /**
     * Event listener when a subject grade dropdown is changed.
     */
    function onGradeSelect(selectEl) {
        if (!selectEl) return;
        const badge = selectEl.parentElement ? selectEl.parentElement.querySelector('.auto-cgpa-badge') : null;
        updateCgpaBadge(selectEl.value, badge);
    }

    /**
     * Propagates overall target from modal header to individual subject rows.
     */
    function updateSubjectTargets() {
        const evalType = document.getElementById('res-evaluation-type')?.value || 'cgpa';
        const isGrade = evalType === 'grade';
        let targetCgpa = '';
        let targetGrade = '';

        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.formatCgpa === 'function')
            ? global.formatCgpa
            : (v => Number(v).toFixed(2));
        const mapCgpaToGrade = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapCgpaToGrade === 'function')
            ? global.Utils.mapCgpaToGrade
            : (() => '');
        const mapGradeToNum = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapGradeToNumeric === 'function')
            ? global.Utils.mapGradeToNumeric
            : (() => 0);

        if (isGrade) {
            targetGrade = (document.getElementById('res-overall-target-grade')?.value || '').trim();
            if (targetGrade.toLowerCase() === 'none' || targetGrade === '0') {
                targetGrade = 'none';
                targetCgpa = 'none';
            } else {
                targetCgpa = targetGrade ? formatCgpa(mapGradeToNum(targetGrade, evalType)) : '';
            }
        } else {
            targetCgpa = (document.getElementById('res-overall-target-cgpa')?.value || '').trim();
            if (targetCgpa.toLowerCase() === 'none' || targetCgpa === '0') {
                targetCgpa = 'none';
                targetGrade = 'none';
            } else {
                targetGrade = targetCgpa ? mapCgpaToGrade(targetCgpa) : '';
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
    }

    /**
     * Computes real-time estimated overall CGPA/grade from subject inputs in modal.
     */
    function updateModalEstScore() {
        const evalTypeEl = document.getElementById('res-evaluation-type');
        if (!evalTypeEl) return;
        const evalType = evalTypeEl.value;
        const isGrade = evalType === 'grade';

        const estCgpaEl = document.getElementById('res-overall-est-cgpa');
        const estGradeEl = document.getElementById('res-overall-est-grade');

        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.formatCgpa === 'function')
            ? global.formatCgpa
            : (v => Number(v).toFixed(2));
        const mapCgpaToGrade = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapCgpaToGrade === 'function')
            ? global.Utils.mapCgpaToGrade
            : (() => '');
        const mapGradeToNum = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapGradeToNumeric === 'function')
            ? global.Utils.mapGradeToNumeric
            : (() => 0);

        if (isGrade) {
            const gradeInputs = document.querySelectorAll('.res-sub-grade-input');
            const grades = [];
            gradeInputs.forEach(input => {
                const val = input.value.trim();
                if (val) grades.push(val);
            });

            if (grades.length > 0) {
                const sumCgpa = grades.reduce((sum, g) => sum + mapGradeToNum(g, 'grade'), 0);
                const avgCgpa = sumCgpa / grades.length;
                const estGrade = mapCgpaToGrade(avgCgpa, 'grade');

                if (estGradeEl) estGradeEl.value = estGrade;
                const badge = estGradeEl?.parentElement ? estGradeEl.parentElement.querySelector('.auto-cgpa-badge') : null;
                if (badge) {
                    badge.textContent = formatCgpa(avgCgpa);
                    badge.classList.remove('opacity-40');
                }
            } else {
                if (estGradeEl) estGradeEl.value = '';
                const badge = estGradeEl?.parentElement ? estGradeEl.parentElement.querySelector('.auto-cgpa-badge') : null;
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
                const estGrade = mapCgpaToGrade(avgCgpa, 'cgpa');

                if (estCgpaEl) estCgpaEl.value = formatCgpa(avgCgpa);
                const badge = estCgpaEl?.parentElement ? estCgpaEl.parentElement.querySelector('.auto-grade-badge') : null;
                if (badge) {
                    badge.textContent = estGrade || '—';
                    badge.classList.remove('opacity-40');
                }
            } else {
                if (estCgpaEl) estCgpaEl.value = '';
                const badge = estCgpaEl?.parentElement ? estCgpaEl.parentElement.querySelector('.auto-grade-badge') : null;
                if (badge) {
                    badge.textContent = '—';
                    badge.classList.add('opacity-40');
                }
            }
        }
    }

    /**
     * Builds and populates the subject list for the currently selected program in the modal.
     */
    function updateResultSubjectsGrid(clearOverall = false) {
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

        const overallLabel = document.getElementById('res-overall-label');
        if (overallLabel) {
            overallLabel.textContent = isGrade ? "Overall Program Grade" : "Overall Program CGPA";
        }

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        const tracksList = global.tracks || (AppStateRef && AppStateRef.tracks) || [];
        const syllabusStructure = global.syllabusStructure || (AppStateRef && AppStateRef.syllabusStructure) || {};

        if (selectedProg) {
            let html = '';
            tracksList.forEach(track => {
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
                updateSubjectTargets();
                updateModalEstScore();
            }
        }
    }

    /**
     * Toggles between CGPA mode and Letter Grade mode in modal.
     */
    function toggleResultEvaluationType() {
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

        document.querySelectorAll('#resm-content .auto-grade-badge, #resm-content .auto-cgpa-badge').forEach(b => {
            b.textContent = '—';
            b.classList.add('opacity-40');
        });

        const overallLabel = document.getElementById('res-overall-label');
        if (overallLabel) overallLabel.textContent = evalType === 'grade' ? 'Overall Program Grade' : 'Overall Program CGPA';

        updateResultSubjectsGrid(false);
    }

    /**
     * Toggles modal between CGPA / Program mode and generic Achievement mode.
     */
    function toggleResultType() {
        const typeEl = document.getElementById('res-type');
        if (!typeEl) return;
        const type = typeEl.value;
        const isEdit = !!global.editingResultId;
        const isBulkEdit = !!global.editingProgramName;

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
            toggleResultEvaluationType();
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
                toggleResultEvaluationType();
            } else {
                if (progCont) progCont.classList.add('hidden');
                if (gridCont) gridCont.classList.add('hidden');
                if (titleCont) titleCont.classList.remove('hidden');
                if (singleValCont) singleValCont.classList.remove('hidden');
            }
        }
    }

    /**
     * Opens modal for adding a new result or editing an existing one/program card.
     */
    function openResultModal(id = null, editProgramName = null) {
        global.editingResultId = id;
        global.editingProgramName = editProgramName;

        let titleStr = 'Add New Result';
        if (id) titleStr = 'Edit Result';
        else if (editProgramName) titleStr = `Edit ${editProgramName}`;
        const modalTitle = document.getElementById('res-modal-title');
        if (modalTitle) modalTitle.textContent = titleStr;

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        const tracksList = global.tracks || (AppStateRef && AppStateRef.tracks) || [];
        const customPrograms = global.customPrograms || (AppStateRef && AppStateRef.customPrograms) || {};
        const successResults = global.successResults || (AppStateRef && AppStateRef.successResults) || [];

        const progSelect = document.getElementById('res-prog-select');
        if (progSelect) {
            progSelect.innerHTML = '';
            tracksList.forEach(track => {
                if (customPrograms[track.id]) {
                    customPrograms[track.id].forEach(p => {
                        const pName = p.name || p;
                        progSelect.innerHTML += `<option value="${pName}">${pName}</option>`;
                    });
                }
            });
        }

        const typeSelector = document.getElementById('res-type');
        const evalSelector = document.getElementById('res-evaluation-type');

        if (editProgramName) {
            if (typeSelector) {
                typeSelector.value = 'cgpa';
                typeSelector.disabled = true;
            }
            if (progSelect) {
                progSelect.value = editProgramName;
                progSelect.disabled = true;
            }

            const progRecords = successResults.filter(r => r.type === 'cgpa' && r.title === editProgramName);
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

            global._pendingResultPrefill = { progRecords, evalType };

            let recordDate = progRecords.find(r => r.date)?.date || '';
            if (recordDate) {
                const dateEl = document.getElementById('res-date');
                if (dateEl) dateEl.value = recordDate;
            }
        } else if (id) {
            const res = successResults.find(r => r.id === id);
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

            document.querySelectorAll('#resm-content .auto-grade-badge, #resm-content .auto-cgpa-badge').forEach(b => {
                b.textContent = '—';
                b.classList.add('opacity-40');
            });

            const d = new Date();
            const pad = (n) => n < 10 ? '0' + n : n;
            const dateEl = document.getElementById('res-date');
            if (dateEl) dateEl.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

            global._pendingResultPrefill = null;
        }

        toggleResultType();

        if (global._pendingResultPrefill) {
            const { progRecords, evalType } = global._pendingResultPrefill;
            global._pendingResultPrefill = null;

            const mainTarget = getProgramMainTarget(editProgramName);
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
                        if (overallGrade && overallGrade.parentElement) updateCgpaBadge(r.grade || '', overallGrade.parentElement.querySelector('.auto-cgpa-badge'));
                        if (tgtGrade && overallTgtGrade && overallTgtGrade.parentElement) updateCgpaBadge(tgtGrade, overallTgtGrade.parentElement.querySelector('.auto-cgpa-badge'));
                    } else {
                        const overallCgpa = document.getElementById('res-overall-cgpa');
                        if (overallCgpa) overallCgpa.value = r.value || '';
                        const tgtCgpa = r.targetCGPA || mainTarget.targetCGPA;
                        const overallTgtCgpa = document.getElementById('res-overall-target-cgpa');
                        if (overallTgtCgpa) overallTgtCgpa.value = tgtCgpa;
                        if (overallCgpa) onCgpaInput(overallCgpa);
                        if (tgtCgpa && overallTgtCgpa) onCgpaInput(overallTgtCgpa);
                    }
                } else {
                    if (evalType === 'grade') {
                        const gradeInput = Array.from(document.querySelectorAll('.res-sub-grade-input')).find(input => input.getAttribute('data-subject') === r.subject);
                        if (gradeInput) {
                            gradeInput.value = r.grade || '';
                            if (gradeInput.parentElement) updateCgpaBadge(r.grade || '', gradeInput.parentElement.querySelector('.auto-cgpa-badge'));
                        }
                    } else {
                        const cgpaInput = Array.from(document.querySelectorAll('.res-sub-cgpa-input')).find(input => input.getAttribute('data-subject') === r.subject);
                        if (cgpaInput) {
                            cgpaInput.value = r.value || '';
                            onCgpaInput(cgpaInput);
                        }
                    }
                }
            });

            if (!overallPrefilled && mainTarget.targetCGPA) {
                if (evalType === 'grade') {
                    const gradeTargetInput = document.getElementById('res-overall-target-grade');
                    if (gradeTargetInput) {
                        gradeTargetInput.value = mainTarget.targetGrade;
                        if (gradeTargetInput.parentElement) updateCgpaBadge(mainTarget.targetGrade, gradeTargetInput.parentElement.querySelector('.auto-cgpa-badge'));
                    }
                } else {
                    const cgpaTargetInput = document.getElementById('res-overall-target-cgpa');
                    if (cgpaTargetInput) {
                        cgpaTargetInput.value = mainTarget.targetCGPA;
                        onCgpaInput(cgpaTargetInput);
                    }
                }
            }
        }

        updateModalEstScore();
        if (typeof global.openModal === 'function') {
            global.openModal('result-modal');
        }
    }

    /**
     * Saves result from modal (single achievement or bulk program scorecard).
     */
    function saveResult() {
        const typeEl = document.getElementById('res-type');
        const dateEl = document.getElementById('res-date');
        const type = typeEl ? typeEl.value : 'cgpa';
        const date = dateEl ? dateEl.value : '';
        const toast = typeof global.showToast === 'function' ? global.showToast : console.log;

        if (!date) return toast("Date is required", "error");

        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        if (!global.successResults) global.successResults = [];

        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.Utils.validateAndFormatCgpa === 'function')
            ? global.Utils.validateAndFormatCgpa
            : (v => v);
        const mapCgpaToGrade = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapCgpaToGrade === 'function')
            ? global.Utils.mapCgpaToGrade
            : (() => '');
        const mapGradeToNum = (typeof global.Utils !== 'undefined' && typeof global.Utils.mapGradeToNumeric === 'function')
            ? global.Utils.mapGradeToNumeric
            : (() => 0);

        if (global.editingProgramName) {
            // Bulk Program Edit Mode
            global.successResults = global.successResults.filter(r => !(r.type === 'cgpa' && r.title === global.editingProgramName));
            const evalType = document.getElementById('res-evaluation-type')?.value || 'cgpa';

            let gradeInputs = evalType === 'grade' ? document.querySelectorAll('.res-sub-grade-input') : [];
            let cgpaInputs = evalType !== 'grade' ? document.querySelectorAll('.res-sub-cgpa-input') : [];

            const subjectsData = {};
            if (evalType === 'grade') {
                gradeInputs.forEach(input => {
                    const sub = input.getAttribute('data-subject');
                    const gVal = input.value.trim();
                    if (gVal) {
                        subjectsData[sub] = {
                            grade: gVal,
                            cgpa: mapGradeToNum(gVal, evalType).toFixed(2)
                        };
                    }
                });
            } else {
                cgpaInputs.forEach(input => {
                    const sub = input.getAttribute('data-subject');
                    const cVal = input.value.trim();
                    if (cVal) {
                        const formatted = formatCgpa(cVal);
                        if (formatted) {
                            subjectsData[sub] = {
                                grade: mapCgpaToGrade(formatted, evalType),
                                cgpa: formatted
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
                    overallVal = overallGradeVal ? mapGradeToNum(overallGradeVal, evalType).toFixed(2) : '';
                    isEstimatedOverall = false;
                }
                if (!isExplicitNone) {
                    overallTargetCgpaVal = overallTargetGradeVal ? mapGradeToNum(overallTargetGradeVal, evalType).toFixed(2) : '';
                }
            } else {
                overallVal = (document.getElementById('res-overall-cgpa')?.value || '').trim();
                overallTargetCgpaVal = (document.getElementById('res-overall-target-cgpa')?.value || '').trim();

                if (overallTargetCgpaVal.toLowerCase() === 'none' || overallTargetCgpaVal === '0') {
                    overallTargetGradeVal = 'none';
                    overallTargetCgpaVal = 'none';
                    isExplicitNone = true;
                } else {
                    overallTargetCgpaVal = formatCgpa(overallTargetCgpaVal);
                }

                if (!overallVal) {
                    overallVal = '';
                    overallGradeVal = '';
                    isEstimatedOverall = true;
                } else {
                    overallVal = formatCgpa(overallVal);
                    overallGradeVal = overallVal ? mapCgpaToGrade(overallVal, evalType) : '';
                    isEstimatedOverall = false;
                }
                if (!isExplicitNone) {
                    overallTargetGradeVal = overallTargetCgpaVal ? mapCgpaToGrade(overallTargetCgpaVal, evalType) : '';
                }
            }

            if (overallVal || overallGradeVal || overallTargetCgpaVal || overallTargetGradeVal) {
                global.successResults.push({
                    id: 'res_' + Date.now() + '_overall',
                    type: 'cgpa',
                    evaluationType: evalType,
                    title: global.editingProgramName,
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
                global.successResults.push({
                    id: 'res_' + (Date.now() + timeOffset),
                    type: 'cgpa',
                    evaluationType: evalType,
                    title: global.editingProgramName,
                    subject: subName,
                    value: subScores.cgpa,
                    grade: subScores.grade,
                    targetCGPA: overallTargetCgpaVal,
                    targetGrade: overallTargetGradeVal,
                    date: date
                });
                timeOffset++;
            }
        } else if (global.editingResultId) {
            // Single Edit Mode (Achievement)
            const res = global.successResults.find(r => r.id === global.editingResultId);
            if (!res) return toast("Result not found", "error");

            const value = (document.getElementById('res-value')?.value || '').trim();
            const grade = (document.getElementById('res-grade')?.value || '').trim();
            if (!value) return toast("Result/Value is required", "error");

            res.value = value;
            res.grade = grade;
            res.date = date;
        } else {
            // Add Mode
            if (type === 'cgpa') {
                const program = document.getElementById('res-prog-select')?.value;
                if (!program) return toast("Target program is required", "error");

                let loggedCount = 0;
                const evalType = document.getElementById('res-evaluation-type')?.value || 'cgpa';

                let gradeInputs = evalType === 'grade' ? document.querySelectorAll('.res-sub-grade-input') : [];
                let cgpaInputs = evalType !== 'grade' ? document.querySelectorAll('.res-sub-cgpa-input') : [];

                const subjectsData = {};
                if (evalType === 'grade') {
                    gradeInputs.forEach(input => {
                        const sub = input.getAttribute('data-subject');
                        const gVal = input.value.trim();
                        if (gVal) {
                            subjectsData[sub] = {
                                grade: gVal,
                                cgpa: mapGradeToNum(gVal, evalType).toFixed(2)
                            };
                        }
                    });
                } else {
                    cgpaInputs.forEach(input => {
                        const sub = input.getAttribute('data-subject');
                        const cVal = input.value.trim();
                        if (cVal) {
                            const formatted = formatCgpa(cVal);
                            if (formatted) {
                                subjectsData[sub] = {
                                    grade: mapCgpaToGrade(formatted, evalType),
                                    cgpa: formatted
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
                        overallVal = overallGradeVal ? mapGradeToNum(overallGradeVal, evalType).toFixed(2) : '';
                        isEstimatedOverall = false;
                    }
                    if (!isExplicitNone) {
                        overallTargetCgpaVal = overallTargetGradeVal ? mapGradeToNum(overallTargetGradeVal, evalType).toFixed(2) : '';
                    }
                } else {
                    overallVal = (document.getElementById('res-overall-cgpa')?.value || '').trim();
                    overallTargetCgpaVal = (document.getElementById('res-overall-target-cgpa')?.value || '').trim();

                    if (overallTargetCgpaVal.toLowerCase() === 'none' || overallTargetCgpaVal === '0') {
                        overallTargetGradeVal = 'none';
                        overallTargetCgpaVal = 'none';
                        isExplicitNone = true;
                    } else {
                        overallTargetCgpaVal = formatCgpa(overallTargetCgpaVal);
                    }

                    if (!overallVal) {
                        overallVal = '';
                        overallGradeVal = '';
                        isEstimatedOverall = true;
                    } else {
                        overallVal = formatCgpa(overallVal);
                        overallGradeVal = overallVal ? mapCgpaToGrade(overallVal, evalType) : '';
                        isEstimatedOverall = false;
                    }
                    if (!isExplicitNone) {
                        overallTargetGradeVal = overallTargetCgpaVal ? mapCgpaToGrade(overallTargetCgpaVal, evalType) : '';
                    }
                }

                if (overallVal || overallGradeVal || overallTargetCgpaVal || overallTargetGradeVal) {
                    global.successResults.push({
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
                    global.successResults.push({
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
                    return toast("Please enter at least one score to save.", "error");
                }
            } else {
                const title = (document.getElementById('res-title-input')?.value || '').trim();
                const value = (document.getElementById('res-value')?.value || '').trim();
                const grade = (document.getElementById('res-grade')?.value || '').trim();

                if (!title) return toast("Achievement title is required", "error");
                if (!value) return toast("Result/Value is required", "error");

                global.successResults.push({
                    id: 'res_' + Date.now(),
                    type: 'achievement',
                    title: title,
                    value: value,
                    grade: grade,
                    date: date
                });
            }
        }

        if (AppStateRef) AppStateRef.successResults = global.successResults;

        if (typeof global.syncPassFreezeFromResults === 'function') {
            global.syncPassFreezeFromResults();
        }
        if (global.FirebaseService && typeof global.FirebaseService.saveToCloud === 'function') {
            global.FirebaseService.saveToCloud();
        }
        if (typeof global.renderUI === 'function') {
            global.renderUI();
        }
        renderResults();
        if (typeof global.closeModal === 'function') {
            global.closeModal('result-modal');
        }
        toast("Result saved successfully!", "success");
    }

    /**
     * Deletes a single result record by ID.
     */
    function deleteResult(id) {
        const doDelete = () => {
            if (typeof global.recordItemDeletion === 'function') {
                global.recordItemDeletion('successResult', id);
            }
            if (Array.isArray(global.successResults)) {
                global.successResults = global.successResults.filter(r => r.id !== id);
            }
            const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
            if (AppStateRef) AppStateRef.successResults = global.successResults;

            if (typeof global.syncPassFreezeFromResults === 'function') global.syncPassFreezeFromResults();
            if (global.FirebaseService && typeof global.FirebaseService.saveToCloud === 'function') global.FirebaseService.saveToCloud();
            if (typeof global.renderUI === 'function') global.renderUI();
            renderResults();

            const toast = typeof global.showToast === 'function' ? global.showToast : console.log;
            toast("Result deleted", "success");
        };

        if (typeof global.openConfirmModal === 'function') {
            global.openConfirmModal("Delete Result", "Are you sure you want to delete this result?", doDelete);
        } else {
            const confirmFn = typeof global.confirm === 'function' ? global.confirm : () => true;
            if (confirmFn("Are you sure you want to delete this result?")) doDelete();
        }
    }

    /**
     * Deletes an entire program card and its associated subject results.
     */
    function deleteProgramGroup(programName) {
        const doDelete = () => {
            if (typeof global.recordItemDeletion === 'function' && Array.isArray(global.successResults)) {
                global.successResults.filter(r => r.type === 'cgpa' && r.title === programName).forEach(r => global.recordItemDeletion('successResult', r.id));
            }
            if (Array.isArray(global.successResults)) {
                global.successResults = global.successResults.filter(r => !(r.type === 'cgpa' && r.title === programName));
            }
            const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
            if (AppStateRef) AppStateRef.successResults = global.successResults;

            if (typeof global.syncPassFreezeFromResults === 'function') global.syncPassFreezeFromResults();
            if (global.FirebaseService && typeof global.FirebaseService.saveToCloud === 'function') global.FirebaseService.saveToCloud();
            if (typeof global.renderUI === 'function') global.renderUI();
            renderResults();

            const toast = typeof global.showToast === 'function' ? global.showToast : console.log;
            toast("Program card deleted", "success");
        };

        if (typeof global.openConfirmModal === 'function') {
            global.openConfirmModal("Delete Program Card", `Are you sure you want to delete this program card and all its subject results?`, doDelete);
        } else {
            const confirmFn = typeof global.confirm === 'function' ? global.confirm : () => true;
            if (confirmFn(`Are you sure you want to delete this program card and all its subject results?`)) doDelete();
        }
    }

    /**
     * Renders program toggle chips in the filter bar.
     */
    function renderOutcomeProgramToggles() {
        const bar = document.getElementById('outcome-programs-toggle-bar');
        if (!bar) return;

        if (!global.programVisibility) {
            global.programVisibility = {};
            const allProgs = typeof global.getAllPrograms === 'function' ? global.getAllPrograms() : [];
            allProgs.forEach(pObj => {
                const pName = pObj.name || pObj;
                global.programVisibility[pName] = true;
            });
        }

        let html = '';
        const allProgs = typeof global.getAllPrograms === 'function' ? global.getAllPrograms() : [];
        allProgs.forEach(pObj => {
            const pName = pObj.name || pObj;
            const active = global.programVisibility[pName] !== false;
            const color = typeof global.getProgramColor === 'function' ? global.getProgramColor(pName) : '#eab308';

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
    }

    /**
     * Toggles visibility for a specific program in the outcome list.
     */
    function toggleOutcomeProgram(pName) {
        if (!global.programVisibility) global.programVisibility = {};
        global.programVisibility[pName] = !global.programVisibility[pName];

        if (global.FirebaseService && typeof global.FirebaseService.saveToCloud === 'function') {
            global.FirebaseService.saveToCloud();
        }
        renderResults();
    }

    /**
     * Toggles sort order (newest first vs oldest first).
     */
    function toggleOutcomeDateSort() {
        global.outcomeDateSortOrder = (global.outcomeDateSortOrder === 'asc') ? 'desc' : 'asc';
        renderResults();
        if (typeof global.renderDashboardOutcomeCard === 'function') {
            global.renderDashboardOutcomeCard();
        }
    }

    /**
     * Main results view renderer.
     */
    function renderResults() {
        const AppStateRef = typeof global.AppState !== 'undefined' ? global.AppState : (typeof window !== 'undefined' ? window.AppState : {});
        const syllabusStructure = global.syllabusStructure || (AppStateRef && AppStateRef.syllabusStructure) || {};
        const tracksList = global.tracks || (AppStateRef && AppStateRef.tracks) || [];
        const customPrograms = global.customPrograms || (AppStateRef && AppStateRef.customPrograms) || {};
        const Utils = (typeof global.Utils !== 'undefined') ? global.Utils : (typeof window !== 'undefined' && window.Utils ? window.Utils : {
            parseDateSafe: (d) => new Date(d),
            formatCgpaMin2Dec: (v) => parseFloat(v || 0).toFixed(2),
            mapCgpaToGrade: () => 'F',
            mapGradeToNumeric: () => 0.0
        });
        const Chart = typeof global.Chart !== 'undefined' ? global.Chart : (typeof window !== 'undefined' ? window.Chart : null);
        const formatCgpa = (typeof global.formatCgpa === 'function')
            ? global.formatCgpa
            : (typeof window !== 'undefined' && typeof window.formatCgpa === 'function')
                ? window.formatCgpa
                : (Utils && typeof Utils.formatCgpaMin2Dec === 'function')
                    ? (v) => Utils.formatCgpaMin2Dec(v)
                    : (v) => {
                        const num = parseFloat(v);
                        return isNaN(num) ? '0.00' : num.toFixed(2);
                    };
        if (typeof global.renderDashboardOutcomeCard === 'function') {
            global.renderDashboardOutcomeCard();
        }
        const container = document.getElementById('results-container');
        const trendContainer = document.getElementById('results-trend-container');
        if (!container) return;

        const sortOrder = global.outcomeDateSortOrder || 'desc';
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

        const getResultsFn = typeof global.getProcessedResults === 'function' ? global.getProcessedResults : () => (global.successResults || []);
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
                    estCgpa = formatCgpa(avg);
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
                        isMatch = formatCgpa(currentOverall.value || 0) === formatCgpa(estCgpa);
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
                const mainTarget = typeof global.getProgramMainTarget === 'function' ? global.getProgramMainTarget(progName) : { targetCGPA: '', targetGrade: '' };
                const targetCGPA = (currentOverall && currentOverall.targetCGPA) || mainTarget.targetCGPA;
                const targetGrade = (currentOverall && currentOverall.targetGrade) || mainTarget.targetGrade;
                const hasTgt = targetCGPA && targetCGPA !== 'none' && targetCGPA !== '';

                const trackId = tracksList.find(t => customPrograms[t.id] && customPrograms[t.id].some(p => (p.name || p) === progName))?.id;
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
                const isProgramVisible = !global.programVisibility || global.programVisibility[progName] !== false;
                if (!isProgramVisible) {
                    const dispScore = currentOverall.evaluationType === 'grade'
                        ? (currentOverall.grade || '—')
                        : (formatCgpa(currentOverall.value) || '—');
                    html += `
                            <div class="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between opacity-60">
                                <div class="flex items-center space-x-2.5 min-w-0">
                                    <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${typeof global.getProgramColor === 'function' ? global.getProgramColor(progName) : '#eab308'}"></div>
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
                        const tgtCgpaDisp = hasTgt ? formatCgpa(currentOverall.targetCGPA) : 'None';
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
                                                        <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">CGPA: ${formatCgpa(currentOverall.value) || 'N/A'}</span>
                                                        `
                                : `
                                                        <span class="text-sm font-black ${scoreColorClass}">CGPA: ${formatCgpa(currentOverall.value) || 'N/A'}</span>
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
                            const mainTarget = typeof global.getProgramMainTarget === 'function' ? global.getProgramMainTarget(progName) : { targetCGPA: '', targetGrade: '' };
                            return subjects.map(s => {
                                const subTargetCgpa = s.targetCGPA || mainTarget.targetCGPA;
                                const subTargetGrade = s.targetGrade || mainTarget.targetGrade;
                                const hasSubTgt = subTargetCgpa && subTargetCgpa !== 'none';
                                const targetDisp = hasSubTgt ? (s.evaluationType === 'grade' ? `${subTargetGrade} (${formatCgpa(subTargetCgpa)})` : `${formatCgpa(subTargetCgpa)} (${subTargetGrade})`) : 'None';

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
                                                                ${s.evaluationType === 'grade' ? (s.grade || 'N/A') : (formatCgpa(s.value) || 'N/A')}
                                                            </span>
                                                            ${s.evaluationType === 'grade' ? `<span class="text-[10px] font-bold text-slate-400 block -mt-0.5">(CGPA: ${formatCgpa(s.value)})</span>` : (s.grade ? `<span class="text-[10px] font-bold text-slate-400 block -mt-0.5">(${s.grade})</span>` : '')}
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
                const active = global.trendDatasetVisibility[idxKey];
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

            tracksList.forEach((t, idx) => {
                const tc = trackColors[idx % trackColors.length];
                const trackProgs = customPrograms[t.id] || [];
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

                if (global.resultsTrendChartInstance) global.resultsTrendChartInstance.destroy();

                const canvasCtx = ctx.getContext('2d');

                Chart.defaults.color = '#94a3b8';
                Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui';
                global.resultsTrendChartInstance = new Chart(canvasCtx, {
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
                                hidden: !global.trendDatasetVisibility.actual
                            },
                            {
                                label: 'Target CGPA',
                                data: targetData,
                                backgroundColor: '#f59e0b',
                                borderColor: '#f59e0b',
                                borderWidth: 0,
                                borderRadius: 6,
                                borderSkipped: false,
                                hidden: !global.trendDatasetVisibility.target
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
        } else if (trendContainer) {
            trendContainer.classList.add('hidden');
        }
    };

    /* ==========================================================================
       Result Modal: Open, Edit, Toggle, Save, and Delete Handlers
       ========================================================================== */


    // Attach to global scope
    const OutcomeResults = {
        OutcomePage,
        getProgramMainTarget,
        getProcessedResults,
        onCgpaBlur,
        onCgpaInput,
        updateCgpaBadge,
        onGradeSelect,

        updateSubjectTargets,
        updateModalEstScore,
        updateResultSubjectsGrid,
        toggleResultEvaluationType,
        toggleResultType,
        openResultModal,
        saveResult,
        deleteResult,
        deleteProgramGroup,
        renderOutcomeProgramToggles,
        toggleOutcomeProgram,
        toggleOutcomeDateSort,
        renderResults,
        initOutcomeEventListeners
    };

    function initOutcomeEventListeners() {
        if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
        if (global._outcomeListenersInitialized) return;
        global._outcomeListenersInitialized = true;

        document.addEventListener('click', (e) => {
            if (e.target.closest('#btn-open-result-modal, [data-result-open]')) {
                e.preventDefault();
                openResultModal();
            } else if (e.target.closest('#resm-type-exam, [data-result-type-toggle]')) {
                e.preventDefault();
                toggleResultType();
            } else if (e.target.closest('#resm-eval-standard, [data-result-eval-toggle]')) {
                e.preventDefault();
                toggleResultEvaluationType();
            } else if (e.target.closest('#btn-save-result, [data-result-save]')) {
                e.preventDefault();
                saveResult();
            } else if (e.target.closest('#outcome-date-sort-btn, [data-outcome-sort]')) {
                e.preventDefault();
                toggleOutcomeDateSort();
            } else if (e.target.closest('[data-save-celebration-setup], #btn-save-celebration-setup')) {
                e.preventDefault();
                if (typeof global.saveCelebrationSetup === 'function') global.saveCelebrationSetup();
            } else if (e.target.closest('[data-congrats-page]')) {
                e.preventDefault();
                const page = parseInt(e.target.closest('[data-congrats-page]').getAttribute('data-congrats-page'), 10);
                if (!isNaN(page) && typeof global.switchCongratsPage === 'function') global.switchCongratsPage(page);
            } else if (e.target.closest('[data-close-congrats]')) {
                e.preventDefault();
                if (typeof global.closeCongratsModal === 'function') global.closeCongratsModal();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'trend-program-filter') {
                renderResults();
            } else if (e.target && (e.target.id === 'res-prog-select' || e.target.id === 'resm-program')) {
                updateResultSubjectsGrid(true);
            } else if (e.target && (e.target.id === 'res-type' || e.target.id === 'resm-type')) {
                toggleResultType();
            } else if (e.target && (e.target.id === 'res-evaluation-type' || e.target.id === 'resm-evaluation-type')) {
                toggleResultEvaluationType();
            } else if (e.target && (e.target.id === 'res-overall-grade' || e.target.id === 'res-overall-target-grade' || e.target.matches('[data-grade-select]'))) {
                onGradeSelect(e.target);
                if (e.target.hasAttribute('data-update-targets')) {
                    updateSubjectTargets();
                }
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target && (e.target.id === 'csm-search-input' || e.target.matches('[data-filter-celebration-items]'))) {
                if (typeof global.filterCelebrationSetupItems === 'function') global.filterCelebrationSetupItems(e.target.value);
            } else if (e.target && (e.target.id === 'resm-cgpa-input' || e.target.matches('[data-cgpa-input]'))) {
                onCgpaInput(e.target);
                if (e.target.hasAttribute('data-update-targets')) {
                    updateSubjectTargets();
                }
            }
        });

        document.addEventListener('blur', (e) => {
            if (e.target && (e.target.id === 'resm-cgpa-input' || e.target.matches('[data-cgpa-input]'))) {
                onCgpaBlur(e.target);
                if (e.target.hasAttribute('data-update-targets')) {
                    updateSubjectTargets();
                }
            }
        }, true);
    }

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initOutcomeEventListeners);
        } else {
            initOutcomeEventListeners();
        }
    }

    global.OutcomeResults = OutcomeResults;
    global.OutcomePage = OutcomePage;
    global.getProgramMainTarget = getProgramMainTarget;
    global.getProcessedResults = getProcessedResults;
    global.onCgpaBlur = onCgpaBlur;
    global.onCgpaInput = onCgpaInput;
    global.updateCgpaBadge = updateCgpaBadge;
    global.onGradeSelect = onGradeSelect;
    global.updateSubjectTargets = updateSubjectTargets;
    global.updateModalEstScore = updateModalEstScore;
    global.updateResultSubjectsGrid = updateResultSubjectsGrid;
    global.toggleResultEvaluationType = toggleResultEvaluationType;
    global.toggleResultType = toggleResultType;
    global.openResultModal = openResultModal;
    global.saveResult = saveResult;
    global.deleteResult = deleteResult;
    global.deleteProgramGroup = deleteProgramGroup;
    global.renderOutcomeProgramToggles = renderOutcomeProgramToggles;
    global.toggleOutcomeProgram = toggleOutcomeProgram;
    global.toggleOutcomeDateSort = toggleOutcomeDateSort;
    global.renderResults = renderResults;
    global.renderSuccessResults = renderResults;
    global.initOutcomeEventListeners = initOutcomeEventListeners;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = OutcomeResults;
    }
})(typeof window !== 'undefined' ? window : globalThis);
