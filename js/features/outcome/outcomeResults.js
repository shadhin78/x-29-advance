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
        const customPrograms = global.customPrograms || (typeof window !== 'undefined' ? window.customPrograms : {}) || {};
        const successResults = global.successResults || (typeof window !== 'undefined' ? window.successResults : []) || [];
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
        const rawResults = global.successResults || (typeof window !== 'undefined' ? window.successResults : []) || [];
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
        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.Utils.formatCgpaMin2Dec === 'function')
            ? global.Utils.formatCgpaMin2Dec
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
        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.Utils.formatCgpaMin2Dec === 'function')
            ? global.Utils.formatCgpaMin2Dec
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

        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.Utils.formatCgpaMin2Dec === 'function')
            ? global.Utils.formatCgpaMin2Dec
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

        const formatCgpa = (typeof global.Utils !== 'undefined' && typeof global.Utils.formatCgpaMin2Dec === 'function')
            ? global.Utils.formatCgpaMin2Dec
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
        if (typeof global.renderDashboardOutcomeCard === 'function') {
            global.renderDashboardOutcomeCard();
        }
        const container = document.getElementById('results-container');
        const trendContainer = document.getElementById('results-trend-container');
        if (!container) return;

        const sortOrder = global.outcomeDateSortOrder || 'desc';
        const isAsc = sortOrder === 'asc';

        const sortBtnText = document.getElementById('outcome-date-sort-text');
        const sortBtnIcon = document.getElementById('outcome-date-sort-icon');
        const countBadge = document.getElementById('outcome-results-count-badge');

        if (sortBtnText) sortBtnText.textContent = isAsc ? 'Date: Oldest First' : 'Date: Newest First';
        if (sortBtnIcon) sortBtnIcon.style.transform = isAsc ? 'rotate(180deg)' : 'rotate(0deg)';

        const activeResults = getProcessedResults();
        if (!activeResults || activeResults.length === 0) {
            container.innerHTML = '<div class="col-span-full py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl"><span class="text-3xl mb-3 grayscale opacity-50">🏆</span><p class="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest text-center">No results logged yet. Add your first achievement!</p></div>';
            if (trendContainer) trendContainer.classList.add('hidden');
            if (countBadge) countBadge.textContent = '0';
            return;
        }

        const programGroups = {};
        const achievements = [];
        const parseDate = (typeof global.Utils !== 'undefined' && typeof global.Utils.parseDateSafe === 'function')
            ? global.Utils.parseDateSafe
            : (d => new Date(d));

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
                if (parseDate(res.date) > parseDate(programGroups[progName].date)) {
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
            const timeA = parseDate(a.date).getTime();
            const timeB = parseDate(b.date).getTime();
            return isAsc ? (timeA - timeB) : (timeB - timeA);
        });

        if (countBadge) countBadge.textContent = mergedList.length;

        let html = '';
        mergedList.forEach(item => {
            const dateStr = parseDate(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            if (item.type === 'program_group') {
                const progName = item.title;
                if (global.programVisibility && global.programVisibility[progName] === false) {
                    return; // Filtered out
                }
                const subjects = item.subjects.sort((a, b) => a.subject.localeCompare(b.subject));
                const overall = item.overall;
                const evalType = (overall && overall.evaluationType) || (subjects.length > 0 && subjects[0].evaluationType) || 'cgpa';
                const isGradeMode = evalType === 'grade';

                const displayVal = isGradeMode ? (overall?.grade || '—') : (overall?.value || '—');
                const badgeLabel = isGradeMode ? 'Grade' : 'CGPA';
                const color = typeof global.getProgramColor === 'function' ? global.getProgramColor(progName) : '#eab308';

                html += `
                    <div class="bg-white dark:bg-slate-800 p-5 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:shadow-lg transition-all flex flex-col justify-between">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></span>
                                <h4 class="text-sm md:text-base font-black text-slate-800 dark:text-slate-100">${progName}</h4>
                            </div>
                            <div class="flex items-center gap-1">
                                <button onclick="window.showProgramAnalytics('${progName.replace(/'/g, "\\'")}')" class="text-slate-300 hover:text-amber-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all" title="View Trend Analytics"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1-1H5a1 1 0 01-1-1V4z"></path></svg></button>
                                <button onclick="window.openResultModal(null, '${progName.replace(/'/g, "\\'")}')" class="text-slate-300 hover:text-blue-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all" title="Edit Program Card"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                <button onclick="window.deleteProgramGroup('${progName.replace(/'/g, "\\'")}')" class="text-slate-300 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all" title="Delete Program Card"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                            </div>
                        </div>

                        <div class="mb-4 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
                            <div>
                                <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 block">${badgeLabel} Overall</span>
                                <span class="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">${displayVal}</span>
                            </div>
                            <span class="text-[9px] font-bold text-slate-400">${dateStr}</span>
                        </div>

                        <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            ${subjects.map(s => `
                                <div class="flex justify-between items-center text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                    <span class="font-bold text-slate-600 dark:text-slate-300 truncate max-w-[65%]">${s.subject}</span>
                                    <span class="font-black text-slate-800 dark:text-slate-200">${isGradeMode ? (s.grade || '—') : (s.value || '—')}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                // Generic achievement
                html += `
                    <div class="bg-white dark:bg-slate-800 p-5 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:shadow-lg transition-all flex flex-col justify-between">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50">Achievement</span>
                            <div class="flex items-center gap-1">
                                <button onclick="window.openResultModal('${item.id}')" class="text-slate-300 hover:text-blue-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                <button onclick="window.deleteResult('${item.id}')" class="text-slate-300 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                            </div>
                        </div>
                        <h4 class="text-sm font-black text-slate-800 dark:text-slate-100 mb-2">${item.title}</h4>
                        <div class="flex items-end justify-between">
                            <span class="text-base font-black text-amber-600 dark:text-amber-400">${item.value} ${item.grade ? `(${item.grade})` : ''}</span>
                            <span class="text-[9px] font-bold text-slate-400">${dateStr}</span>
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;
    }

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
        renderResults
    };

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

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = OutcomeResults;
    }
})(typeof window !== 'undefined' ? window : globalThis);
