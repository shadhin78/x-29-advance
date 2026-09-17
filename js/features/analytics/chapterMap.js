/**
 * X-29 Feature Module: Chapter Interactive SVG Map (chapterMap.js)
 * High-performance SVG polar segment visualization for curriculum progress.
 *
 * Responsibilities:
 * 1. Polar arc and concentric ring generation for syllabus chapters (1-5 dynamic rings).
 * 2. Multi-level filtering (Global, Track, Program, Subject).
 * 3. Interactive tooltips across Global Chapters modal, Subject Trend modal, and Analytics page.
 * 4. Full syllabus SVG modal view and Subject Trend circle progress component.
 *
 * Strict Read-Only state consumer: Reads AppState, syllabusStructure, tracks, passedItems.
 */

(function (global) {
    'use strict';

    /**
     * Helper to safely format text inside elements without crashing.
     */
    function safeText(id, text) {
        if (typeof global.safeSetText === 'function') {
            global.safeSetText(id, text);
        } else if (typeof document !== 'undefined') {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        }
    }

    /**
     * Tooltip handler for the Global Chapters Modal (#gcm-tooltip).
     */
    function showChapterTooltip(event, subject, chapterNum, status) {
        if (typeof document === 'undefined') return;
        const tooltip = document.getElementById('gcm-tooltip');
        if (!tooltip) return;

        let statusText = '';
        let statusColor = '';
        if (status === 'complete') {
            statusText = 'Completed';
            statusColor = 'text-emerald-400';
        } else if (status === 'skip') {
            statusText = 'Skipped';
            statusColor = 'text-slate-400';
        } else {
            statusText = 'Incomplete';
            statusColor = 'text-rose-400';
        }

        tooltip.innerHTML = `
            <div class="font-extrabold text-white text-[11px]">${subject}</div>
            <div class="text-[10px] text-slate-400 mt-0.5 font-bold">Chapter ${chapterNum}</div>
            <div class="text-[10px] font-black uppercase mt-1 ${statusColor}">${statusText}</div>
        `;

        tooltip.classList.remove('hidden');

        const modalContent = document.getElementById('gcm-content');
        if (modalContent && event) {
            const rect = modalContent.getBoundingClientRect();
            const x = event.clientX - rect.left + 15;
            const y = event.clientY - rect.top + 15;

            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        }
    }

    function hideChapterTooltip() {
        if (typeof document === 'undefined') return;
        const tooltip = document.getElementById('gcm-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    }

    /**
     * Tooltip handler for the Subject Trend Modal (#stm-tooltip).
     */
    function showSubjectChapterTooltip(event, subject, chapterNum, status) {
        if (typeof document === 'undefined') return;
        const tooltip = document.getElementById('stm-tooltip');
        if (!tooltip) return;

        let statusText = '';
        let statusColor = '';
        if (status === 'complete') {
            statusText = 'Completed';
            statusColor = 'text-emerald-400';
        } else if (status === 'skip') {
            statusText = 'Skipped';
            statusColor = 'text-slate-400';
        } else {
            statusText = 'Incomplete';
            statusColor = 'text-rose-400';
        }

        tooltip.innerHTML = `
            <div class="font-extrabold text-white text-[11px]">${subject}</div>
            <div class="text-[10px] text-slate-400 mt-0.5 font-bold">Chapter ${chapterNum}</div>
            <div class="text-[10px] font-black uppercase mt-1 ${statusColor}">${statusText}</div>
        `;

        tooltip.classList.remove('hidden');

        const modalContent = document.getElementById('stm-content');
        if (modalContent && event) {
            const rect = modalContent.getBoundingClientRect();
            const x = event.clientX - rect.left + 15;
            const y = event.clientY - rect.top + 15;

            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        }
    }

    function hideSubjectChapterTooltip() {
        if (typeof document === 'undefined') return;
        const tooltip = document.getElementById('stm-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    }

    /**
     * Tooltip handler for the Spectra Analytics page (#spectra-gcm-tooltip).
     */
    function showSpectraChapterTooltip(event, subject, chapterNum, status) {
        if (typeof document === 'undefined') return;
        const tooltip = document.getElementById('spectra-gcm-tooltip');
        if (!tooltip) return;

        let statusText = '';
        let statusColor = '';
        if (status === 'complete') {
            statusText = 'Completed';
            statusColor = 'text-emerald-400';
        } else if (status === 'skip') {
            statusText = 'Skipped';
            statusColor = 'text-slate-400';
        } else {
            statusText = 'Incomplete';
            statusColor = 'text-rose-400';
        }

        tooltip.innerHTML = `
            <div class="font-extrabold text-white text-[11px]">${subject}</div>
            <div class="text-[10px] text-slate-400 mt-0.5 font-bold">Chapter ${chapterNum}</div>
            <div class="text-[10px] font-black uppercase mt-1 ${statusColor}">${statusText}</div>
        `;

        tooltip.classList.remove('hidden');

        const pageContainer = document.getElementById('page-spectra-analytics');
        if (pageContainer && event) {
            const rect = pageContainer.getBoundingClientRect();
            const x = event.clientX - rect.left + 15;
            const y = event.clientY - rect.top + 15;

            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        }
    }

    function hideSpectraChapterTooltip() {
        if (typeof document === 'undefined') return;
        const tooltip = document.getElementById('spectra-gcm-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    }

    /**
     * Generates polar SVG chapter blocks ring visualization.
     *
     * @param {boolean} isSpectra - Flag indicating if called from the Spectra Analytics page
     * @param {string|Array<string>} spectraFilter - Filter string or array ('global', 'track:X', 'program:Y', 'subject:Z')
     * @param {boolean} isSubjectModal - Flag indicating if rendering single-subject 1-ring layout
     * @returns {Object} SVG HTML and completion counters
     */
    function generateGlobalChaptersSVG(isSpectra = false, spectraFilter = 'global', isSubjectModal = false) {
        let allChapters = [];
        let completedCount = 0;
        let skippedCount = 0;
        let incompleteCount = 0;

        let filters = [];
        if (isSpectra) {
            if (Array.isArray(spectraFilter)) {
                filters = spectraFilter;
            } else if (typeof spectraFilter === 'string') {
                filters = [spectraFilter];
            }
        } else if (spectraFilter) {
            filters = Array.isArray(spectraFilter) ? spectraFilter : [spectraFilter];
        }

        const syllabusStructureRef = global.syllabusStructure || (typeof window !== 'undefined' ? window.syllabusStructure : {}) || {};
        const getAllSubsFn = global.getAllSubjects || (typeof window !== 'undefined' ? window.getAllSubjects : null) || (() => []);
        const getStatusFn = global.getChapterStatus || (typeof window !== 'undefined' ? window.getChapterStatus : null) || (() => 'incomplete');

        const sortedSubjects = getAllSubsFn();
        sortedSubjects.forEach(sub => {
            let trackId = null;
            for (const tid in syllabusStructureRef) {
                if (Array.isArray(syllabusStructureRef[tid]) && syllabusStructureRef[tid].some(s => s.subject === sub.subject)) {
                    trackId = tid;
                    break;
                }
            }

            // Filter out based on selection
            if (filters.length > 0 && !filters.includes('global')) {
                const matches = filters.some(f => {
                    const parts = f.split(':');
                    const type = parts[0];
                    const target = parts.slice(1).join(':');

                    if (type === 'track') return trackId === target;
                    if (type === 'program') return sub.program === target;
                    if (type === 'subject') return sub.subject === target;
                    return false;
                });
                if (!matches) return;
            }

            for (let i = 1; i <= sub.chapters; i++) {
                const status = getStatusFn(sub.subject, i, trackId);
                if (status === 'complete') completedCount++;
                else if (status === 'skip') skippedCount++;
                else incompleteCount++;

                allChapters.push({
                    subject: sub.subject,
                    chapterNum: i,
                    status: status
                });
            }
        });

        const totalChapters = allChapters.length;
        const effectiveTotalChapters = Math.max(0, totalChapters - skippedCount);
        const completionPercent = effectiveTotalChapters > 0 ? ((completedCount / effectiveTotalChapters) * 100).toFixed(1) : "0.0";
        const remainingCount = Math.max(0, effectiveTotalChapters - completedCount);

        let svgPathsHtml = '';

        const getArcPath = (cx, cy, r1, r2, theta1, theta2) => {
            const x1_inner = cx + r1 * Math.cos(theta1);
            const y1_inner = cy + r1 * Math.sin(theta1);
            const x2_inner = cx + r1 * Math.cos(theta2);
            const y2_inner = cy + r1 * Math.sin(theta2);

            const x1_outer = cx + r2 * Math.cos(theta1);
            const y1_outer = cy + r2 * Math.sin(theta1);
            const x2_outer = cx + r2 * Math.cos(theta2);
            const y2_outer = cy + r2 * Math.sin(theta2);

            const largeArc = (theta2 - theta1) > Math.PI ? 1 : 0;

            return `M ${x1_outer} ${y1_outer} A ${r2} ${r2} 0 ${largeArc} 1 ${x2_outer} ${y2_outer} L ${x2_inner} ${y2_inner} A ${r1} ${r1} 0 ${largeArc} 0 ${x1_inner} ${y1_inner} Z`;
        };

        if (isSubjectModal) {
            // Simple segmented circular progress ring: 1 box = 1 chapter in a single ring
            const innerRadius = 130;
            const outerRadius = 165;

            const anglePerSegment = totalChapters > 0 ? (2 * Math.PI) / totalChapters : 0;
            const angularGap = totalChapters > 0 ? Math.min(0.04, anglePerSegment * 0.15) : 0;

            for (let i = 0; i < totalChapters; i++) {
                const chap = allChapters[i];
                const thetaStart = -Math.PI / 2 + i * anglePerSegment + angularGap;
                const thetaEnd = -Math.PI / 2 + (i + 1) * anglePerSegment - angularGap;

                let colorClass = '';
                if (chap.status === 'complete') {
                    colorClass = 'fill-emerald-500 hover:fill-emerald-400 text-emerald-500';
                } else if (chap.status === 'skip') {
                    colorClass = 'fill-slate-300 hover:fill-slate-400 dark:fill-slate-600 dark:hover:fill-slate-500 text-slate-400';
                } else {
                    colorClass = 'fill-rose-500 hover:fill-rose-400 dark:fill-rose-500 dark:hover:fill-rose-400 text-rose-500';
                }

                const pathData = getArcPath(0, 0, innerRadius, outerRadius, thetaStart, thetaEnd);
                const safeSubject = chap.subject.replace(/'/g, "\\'");

                const mouseOverHandler = `window.showSubjectChapterTooltip(event, '${safeSubject}', ${chap.chapterNum}, '${chap.status}')`;
                const mouseOutHandler = `window.hideSubjectChapterTooltip()`;
                const onClickHandler = `window.showSubjectChapterTooltip(event, '${safeSubject}', ${chap.chapterNum}, '${chap.status}'); event.stopPropagation();`;

                svgPathsHtml += `<path d="${pathData}" class="gcm-chapter-block ${colorClass}" onmouseover="${mouseOverHandler}" onmouseout="${mouseOutHandler}" onclick="${onClickHandler}" />\n`;
            }
        } else {
            let numRings = 4;
            if (totalChapters <= 45) numRings = 1;
            else if (totalChapters <= 90) numRings = 2;
            else if (totalChapters <= 180) numRings = 3;
            else if (totalChapters <= 280) numRings = 4;
            else numRings = 5;

            let radii = [];
            if (numRings === 1) {
                radii.push(130);
            } else {
                for (let i = 0; i < numRings; i++) {
                    radii.push(96 + i * 30);
                }
            }

            const totalRadiusSum = radii.reduce((a, b) => a + b, 0);
            const distribution = [];
            let allocated = 0;
            for (let i = 0; i < numRings; i++) {
                let count = Math.round((radii[i] / totalRadiusSum) * totalChapters);
                if (i === numRings - 1) {
                    count = totalChapters - allocated;
                }
                distribution.push(count);
                allocated += count;
            }

            let currentChapterIdx = 0;

            for (let ringIdx = 0; ringIdx < numRings; ringIdx++) {
                const numSegments = distribution[ringIdx];
                if (numSegments <= 0) continue;

                const innerRadius = numRings === 1 ? 130 : (96 + ringIdx * 30);
                const outerRadius = numRings === 1 ? 165 : (innerRadius + 24);

                const anglePerSegment = (2 * Math.PI) / numSegments;
                const angularGap = Math.min(0.04, anglePerSegment * 0.15);

                for (let segIdx = 0; segIdx < numSegments; segIdx++) {
                    if (currentChapterIdx >= allChapters.length) break;
                    const chap = allChapters[currentChapterIdx];

                    const thetaStart = -Math.PI / 2 + segIdx * anglePerSegment + angularGap;
                    const thetaEnd = -Math.PI / 2 + (segIdx + 1) * anglePerSegment - angularGap;

                    let colorClass = '';
                    if (chap.status === 'complete') {
                        colorClass = 'fill-emerald-500 hover:fill-emerald-400 dark:fill-emerald-500 dark:hover:fill-emerald-400 text-emerald-500';
                    } else if (chap.status === 'skip') {
                        colorClass = 'fill-slate-300 hover:fill-slate-400 dark:fill-slate-600 dark:hover:fill-slate-500 text-slate-400';
                    } else {
                        colorClass = 'fill-rose-500 hover:fill-rose-400 dark:fill-rose-500 dark:hover:fill-rose-400 text-rose-500';
                    }

                    const pathData = getArcPath(0, 0, innerRadius, outerRadius, thetaStart, thetaEnd);
                    const safeSubject = chap.subject.replace(/'/g, "\\'");

                    const mouseOverHandler = isSpectra
                        ? `window.showSpectraChapterTooltip(event, '${safeSubject}', ${chap.chapterNum}, '${chap.status}')`
                        : (isSubjectModal
                            ? `window.showSubjectChapterTooltip(event, '${safeSubject}', ${chap.chapterNum}, '${chap.status}')`
                            : `window.showChapterTooltip(event, '${safeSubject}', ${chap.chapterNum}, '${chap.status}')`);

                    const mouseOutHandler = isSpectra
                        ? `window.hideSpectraChapterTooltip()`
                        : (isSubjectModal
                            ? `window.hideSubjectChapterTooltip()`
                            : `window.hideChapterTooltip()`);

                    const onClickHandler = isSpectra
                        ? `window.showSpectraChapterTooltip(event, '${safeSubject}', ${chap.chapterNum}, '${chap.status}'); event.stopPropagation();`
                        : (isSubjectModal
                            ? `window.showSubjectChapterTooltip(event, '${safeSubject}', ${chap.chapterNum}, '${chap.status}'); event.stopPropagation();`
                            : `window.showChapterTooltip(event, '${safeSubject}', ${chap.chapterNum}, '${chap.status}'); event.stopPropagation();`);

                    svgPathsHtml += `<path d="${pathData}" class="gcm-chapter-block ${colorClass}" onmouseover="${mouseOverHandler}" onmouseout="${mouseOutHandler}" onclick="${onClickHandler}" />\n`;
                    currentChapterIdx++;
                }
            }
        }

        // Sizes
        let containerSizeClass = "w-[240px] h-[240px] min-[375px]:w-[280px] min-[375px]:h-[280px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px]";
        let centerCircleSizeClass = "w-20 h-20 min-[375px]:w-28 min-[375px]:h-28 sm:w-36 sm:h-36 bg-white dark:bg-slate-800 rounded-full shadow-inner border border-slate-100 dark:border-slate-700/80";

        let progressLabelClass = "text-slate-400 dark:text-slate-500";
        let countsClass = "text-slate-800 dark:text-white";
        let pctClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-indigo-900/50";
        let remainClass = "text-slate-500 dark:text-slate-400";

        let progressTextSize = "text-[7px] min-[375px]:text-[8px] md:text-[9px] leading-none";
        let countsTextSize = "text-base min-[375px]:text-lg md:text-xl font-black leading-none mt-1.5";
        let pctTextSize = "text-[8px] min-[375px]:text-[10px] font-black px-1.5 min-[375px]:px-2 py-0.5 rounded-lg border mt-1.5 shadow-sm leading-none";
        let remainTextSize = "text-[7px] min-[375px]:text-[8px] md:text-[9px] italic font-bold leading-none mt-1.5";
        let remainingLabel = `${remainingCount} remaining`;

        if (isSubjectModal) {
            containerSizeClass = "w-[220px] h-[220px] min-[375px]:w-[250px] min-[375px]:h-[250px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px]";
            centerCircleSizeClass = "w-20 h-20 min-[375px]:w-24 min-[375px]:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-[#0f172a] rounded-full shadow-inner border border-slate-700/80";
            progressLabelClass = "text-slate-400";
            countsClass = "text-white";
            pctClass = "text-emerald-400 bg-emerald-950/40 border-emerald-900/50";
            remainClass = "text-slate-400";

            progressTextSize = "text-[6px] min-[375px]:text-[7px] sm:text-[8px] md:text-[9px] leading-none";
            countsTextSize = "text-xs min-[375px]:text-sm sm:text-base md:text-lg font-black leading-none mt-1";
            pctTextSize = "text-[7px] min-[375px]:text-[8px] sm:text-[9px] font-black px-1 min-[375px]:px-1.5 py-0.5 rounded-md border mt-1 shadow-sm leading-none";
            remainTextSize = "text-[6px] min-[375px]:text-[7px] sm:text-[8px] md:text-[9px] italic font-bold leading-none mt-1 whitespace-nowrap";
            remainingLabel = `${remainingCount} left`;
        }

        const svgHtml = `
            <div class="relative ${containerSizeClass} flex items-center justify-center shrink-0">
                <svg class="w-full h-full transform" viewBox="-250 -250 500 500">
                    ${svgPathsHtml}
                </svg>
                
                <div class="absolute flex flex-col items-center justify-center text-center pointer-events-none ${centerCircleSizeClass}">
                    <span class="${progressTextSize} uppercase tracking-widest ${progressLabelClass}">Progress</span>
                    <span class="${countsTextSize} ${countsClass}">${completedCount}/${effectiveTotalChapters}</span>
                    <span class="${pctTextSize} ${pctClass}">${completionPercent}%</span>
                    <span class="${remainTextSize} ${remainClass}">${remainingLabel}</span>
                </div>
            </div>
        `;

        return {
            html: svgHtml,
            completedCount,
            skippedCount,
            incompleteCount,
            totalChapters,
            effectiveTotalChapters,
            completionPercent,
            allChapters
        };
    }

    /**
     * Opens Global Chapters Modal and populates syllabus distribution SVG.
     */
    function openGlobalChaptersModal() {
        if (typeof document === 'undefined') return;
        const container = document.getElementById('gcm-chart-container');
        if (!container) return;

        const data = generateGlobalChaptersSVG(false);

        const getAllSubsFn = global.getAllSubjects || (typeof window !== 'undefined' ? window.getAllSubjects : null) || (() => []);
        const totalSubjects = getAllSubsFn().length;

        const html = `
            ${data.html}
            
            <!-- Legend & Quick Stats -->
            <div class="w-full flex flex-col gap-5 border-t border-slate-100 dark:border-slate-700 pt-5">
                <!-- Color Legend -->
                <div class="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-[10px] font-black uppercase tracking-wider">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded bg-emerald-500"></div>
                        <span class="text-slate-600 dark:text-slate-300">Complete (${data.completedCount})</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded bg-rose-500"></div>
                        <span class="text-slate-600 dark:text-slate-300">Incomplete (${data.incompleteCount})</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600"></div>
                        <span class="text-slate-600 dark:text-slate-300">Skipped (${data.skippedCount})</span>
                    </div>
                </div>
                
                <!-- Quick subject list completions inside modal -->
                <div class="grid grid-cols-2 gap-3 text-xs">
                    <div class="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/40 flex flex-col justify-center shadow-sm">
                        <span class="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Syllabus Size</span>
                        <span class="text-sm font-black text-slate-800 dark:text-white mt-1">${totalSubjects} Subjects</span>
                    </div>
                    <div class="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/40 flex flex-col justify-center shadow-sm">
                        <span class="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completed Chapters</span>
                        <span class="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">${data.completedCount} / ${data.totalChapters} CH</span>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        if (typeof global.openModal === 'function') {
            global.openModal('global-chapters-modal');
        }
    }

    /**
     * Renders a subject-specific donut/ring circle chart in the subject trend modal.
     */
    function renderSubjectTrendCircle() {
        if (typeof document === 'undefined') return;
        const container = document.getElementById('subject-trend-circle-container');
        if (!container) return;

        const syllabusStructureRef = global.syllabusStructure || (typeof window !== 'undefined' ? window.syllabusStructure : {}) || {};
        const tracksRef = global.tracks || (typeof window !== 'undefined' ? window.tracks : []) || [];
        const getAllSubsFn = global.getAllSubjects || (typeof window !== 'undefined' ? window.getAllSubjects : null) || (() => []);
        const passedItemsRef = global.passedItems || (typeof window !== 'undefined' ? window.passedItems : { subjects: [], programs: [] }) || { subjects: [], programs: [] };

        let subjectName = global.activeSingleSubjectTrend || (typeof window !== 'undefined' ? window.activeSingleSubjectTrend : null);

        // Pick first subject as default if none selected
        if (!subjectName) {
            if (Array.isArray(tracksRef)) {
                for (const track of tracksRef) {
                    if (syllabusStructureRef[track.id] && syllabusStructureRef[track.id].length > 0) {
                        subjectName = syllabusStructureRef[track.id][0].subject;
                        global.activeSingleSubjectTrend = subjectName;
                        if (typeof window !== 'undefined') window.activeSingleSubjectTrend = subjectName;
                        break;
                    }
                }
            }
            if (!subjectName) {
                const allSubs = getAllSubsFn();
                if (allSubs.length > 0) {
                    subjectName = allSubs[0].subject;
                    global.activeSingleSubjectTrend = subjectName;
                    if (typeof window !== 'undefined') window.activeSingleSubjectTrend = subjectName;
                }
            }
        }

        if (!subjectName) {
            container.innerHTML = '<p class="text-slate-400 text-sm font-bold py-10">No subject selected.</p>';
            return;
        }

        // Update modal title & description
        safeText('stm-title', `${subjectName}`);
        safeText('stm-desc', 'Chapter completion analysis');

        // Find subject info
        let subjectObj = null;
        if (Array.isArray(tracksRef)) {
            for (const track of tracksRef) {
                if (syllabusStructureRef[track.id]) {
                    const found = syllabusStructureRef[track.id].find(s => s.subject === subjectName);
                    if (found) { subjectObj = found; break; }
                }
            }
        }
        if (!subjectObj) {
            const allSubs = getAllSubsFn();
            subjectObj = allSubs.find(s => s.subject === subjectName);
        }

        if (!subjectObj) {
            container.innerHTML = '<p class="text-slate-400 text-sm font-bold py-10">Subject not found.</p>';
            return;
        }

        const data = generateGlobalChaptersSVG(false, 'subject:' + subjectName, true);
        const completionPct = parseFloat(data.completionPercent);
        const totalChapters = data.totalChapters || 0;
        const completedCount = data.completedCount || 0;
        const skippedCount = data.skippedCount || 0;
        const incompleteCount = data.incompleteCount || 0;
        const effectiveTotal = totalChapters - skippedCount;

        // Frozen / Passed check
        const isFrozen = passedItemsRef && (
            (passedItemsRef.subjects && passedItemsRef.subjects.includes(subjectName)) ||
            (passedItemsRef.programs && subjectObj.program && passedItemsRef.programs.includes(subjectObj.program))
        );

        const effectivePct = isFrozen ? 100 : Math.round(completionPct);

        let statusColor = 'text-indigo-400';
        let statusText = 'In Progress';
        let statusEmoji = '📊';
        if (isFrozen) { statusColor = 'text-emerald-400'; statusText = 'Passed'; statusEmoji = '🏆'; }
        else if (effectivePct >= 100) { statusColor = 'text-emerald-400'; statusText = 'Complete'; statusEmoji = '✅'; }
        else if (effectivePct >= 75) { statusColor = 'text-blue-400'; statusText = 'Almost There'; statusEmoji = '🔥'; }
        else if (effectivePct >= 50) { statusColor = 'text-yellow-400'; statusText = 'Halfway'; statusEmoji = '⚡'; }
        else if (effectivePct > 0) { statusColor = 'text-orange-400'; statusText = 'Getting Started'; statusEmoji = '🚀'; }
        else { statusColor = 'text-slate-400'; statusText = 'Not Started'; statusEmoji = '📋'; }

        // Initialize selectedSubjectsTrend with current subject if not set
        if (!global.selectedSubjectsTrend || global.selectedSubjectsTrend.length === 0) {
            global.selectedSubjectsTrend = subjectName ? [subjectName] : [];
        }
        if (subjectName && !global.selectedSubjectsTrend.includes(subjectName)) {
            global.selectedSubjectsTrend.push(subjectName);
        }

        // Generate subject checkbox items for custom dropdown (program-wise sorting)
        let subjectCheckboxItemsHtml = '';
        const allProgs = (typeof global.getAllPrograms === 'function') ? global.getAllPrograms() : [];
        const allSubs = getAllSubsFn();

        const programMap = new Map();
        allProgs.forEach(p => {
            const pName = p.name || p;
            if (!programMap.has(pName)) {
                programMap.set(pName, { name: pName, trackName: p._trackName || '', subjects: [] });
            }
        });

        const unassignedSubs = [];
        allSubs.forEach(s => {
            const progName = s.program;
            if (progName && programMap.has(progName)) {
                programMap.get(progName).subjects.push(s);
            } else if (progName) {
                if (!programMap.has(progName)) {
                    programMap.set(progName, { name: progName, trackName: '', subjects: [] });
                }
                programMap.get(progName).subjects.push(s);
            } else {
                unassignedSubs.push(s);
            }
        });

        programMap.forEach(progGroup => {
            if (progGroup.subjects.length > 0) {
                subjectCheckboxItemsHtml += `
                    <div class="px-2.5 py-1 mt-2 mb-1 text-[8.5px] font-black uppercase tracking-widest text-indigo-400 bg-slate-800/90 rounded-lg flex items-center justify-between border border-slate-700/60 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                        <span class="truncate">${progGroup.name}</span>
                        <span class="text-[7.5px] text-slate-400 font-bold bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/40 shrink-0">${progGroup.subjects.length} Subs</span>
                    </div>`;
                progGroup.subjects.forEach(s => {
                    const isChecked = global.selectedSubjectsTrend.includes(s.subject);
                    const isActive = s.subject === subjectName;
                    const checkedAttr = isChecked ? 'checked' : '';
                    const activeBg = isActive ? 'bg-indigo-500/20 border-indigo-500/40 text-white shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-800/80 text-slate-200';
                    const activeIndicator = isActive ? '<div class="w-1.5 h-4 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>' : '';
                    subjectCheckboxItemsHtml += `
                        <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${activeBg} transition-all cursor-pointer group"
                             onclick="window.stmSelectSubject && window.stmSelectSubject('${s.subject.replace(/'/g, "\\'")}')">
                            ${activeIndicator}
                            <input type="checkbox" ${checkedAttr}
                                class="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer shrink-0"
                                onclick="event.stopPropagation(); window.stmToggleSubjectCheck && window.stmToggleSubjectCheck('${s.subject.replace(/'/g, "\\'")}')" />
                            <span class="text-[10px] font-bold uppercase tracking-wider truncate group-hover:text-white transition-colors flex-1" title="${s.subject}">${s.subject}</span>
                        </div>`;
                });
            }
        });

        if (unassignedSubs.length > 0) {
            subjectCheckboxItemsHtml += `
                <div class="px-2.5 py-1 mt-2 mb-1 text-[8.5px] font-black uppercase tracking-widest text-slate-400 bg-slate-800/90 rounded-lg flex items-center justify-between border border-slate-700/60 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                    <span class="truncate">Other Subjects</span>
                    <span class="text-[7.5px] text-slate-400 font-bold bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/40 shrink-0">${unassignedSubs.length} Subs</span>
                </div>`;
            unassignedSubs.forEach(s => {
                const isChecked = global.selectedSubjectsTrend.includes(s.subject);
                const isActive = s.subject === subjectName;
                const checkedAttr = isChecked ? 'checked' : '';
                const activeBg = isActive ? 'bg-indigo-500/20 border-indigo-500/40 text-white shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-800/80 text-slate-200';
                const activeIndicator = isActive ? '<div class="w-1.5 h-4 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>' : '';
                subjectCheckboxItemsHtml += `
                    <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${activeBg} transition-all cursor-pointer group"
                         onclick="window.stmSelectSubject && window.stmSelectSubject('${s.subject.replace(/'/g, "\\'")}')">
                        ${activeIndicator}
                        <input type="checkbox" ${checkedAttr}
                            class="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer shrink-0"
                            onclick="event.stopPropagation(); window.stmToggleSubjectCheck && window.stmToggleSubjectCheck('${s.subject.replace(/'/g, "\\'")}')" />
                        <span class="text-[10px] font-bold uppercase tracking-wider truncate group-hover:text-white transition-colors flex-1" title="${s.subject}">${s.subject}</span>
                    </div>`;
            });
        }

        const selectedCount = global.selectedSubjectsTrend ? global.selectedSubjectsTrend.length : 0;
        const totalSubjects = allSubs.length;

        const html = `
            <div class="flex flex-col-reverse lg:flex-row gap-6 md:gap-8 items-center lg:items-start w-full max-w-5xl">
                <!-- Left Side: Controls, Legend, Stats, and Chapter Breakdown Grid -->
                <div class="flex flex-col flex-1 w-full lg:max-w-[60%]">
                    <!-- Subject Selector Multi-Select Dropdown -->
                    <div class="w-full mb-4 flex flex-col gap-1.5 shrink-0">
                        <div class="flex items-center justify-between">
                            <label class="text-[9px] font-black uppercase tracking-widest text-slate-500">Select Subject</label>
                            <span class="text-[8px] font-bold text-slate-500">${selectedCount}/${totalSubjects} selected</span>
                        </div>
                        <div class="relative" id="stm-subject-dropdown-wrapper">
                            <button onclick="window.stmToggleDropdown && window.stmToggleDropdown()" id="stm-dropdown-btn"
                                class="w-full bg-slate-900 border border-slate-700 text-white text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl outline-none focus:border-indigo-500 transition-colors cursor-pointer flex items-center justify-between">
                                <span class="truncate">${subjectName || 'Select...'}</span>
                                <svg class="w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform" id="stm-dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                            <div id="stm-dropdown-panel" class="hidden absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[260px] overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-0.5">
                                <div class="flex items-center justify-between px-2 py-1 mb-0.5 border-b border-slate-800">
                                    <button onclick="event.stopPropagation(); window.stmSelectAll && window.stmSelectAll()" class="text-[8px] font-black text-indigo-400 uppercase tracking-wider hover:text-indigo-300 transition-colors">Select All</button>
                                    <button onclick="event.stopPropagation(); window.stmDeselectAll && window.stmDeselectAll()" class="text-[8px] font-black text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors">Deselect All</button>
                                </div>
                                ${subjectCheckboxItemsHtml}
                            </div>
                        </div>
                    </div>

                    <!-- Stats Cards -->
                    <div class="grid grid-cols-3 gap-2.5 w-full mb-4 shrink-0">
                        <div class="flex flex-col items-center p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span class="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-emerald-400/80 mb-0.5">Complete</span>
                            <span class="text-sm md:text-base font-black text-emerald-400">${completedCount}</span>
                            <span class="text-[8px] font-bold text-emerald-500/60 mt-0.5">${effectiveTotal > 0 ? Math.round((completedCount / effectiveTotal) * 100) : 0}%</span>
                        </div>
                        <div class="flex flex-col items-center p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <span class="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-rose-400/80 mb-0.5">Remaining</span>
                            <span class="text-sm md:text-base font-black text-rose-400">${incompleteCount}</span>
                            <span class="text-[8px] font-bold text-rose-500/60 mt-0.5">${effectiveTotal > 0 ? Math.round((incompleteCount / effectiveTotal) * 100) : 0}%</span>
                        </div>
                        <div class="flex flex-col items-center p-2.5 rounded-xl bg-slate-500/10 border border-slate-600/30">
                            <span class="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400/80 mb-0.5">Skipped</span>
                            <span class="text-sm md:text-base font-black text-slate-400">${skippedCount}</span>
                            <span class="text-[8px] font-bold text-slate-500/60 mt-0.5">${totalChapters > 0 ? Math.round((skippedCount / totalChapters) * 100) : 0}%</span>
                        </div>
                    </div>

                    <!-- Legend -->
                    <div class="flex flex-wrap items-center gap-3 text-[9px] font-black uppercase tracking-wider bg-slate-900/50 p-2 rounded-xl border border-slate-800 backdrop-blur-md w-full mb-5 justify-center">
                        <div class="flex items-center gap-1.5">
                            <div class="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm"></div>
                            <span class="text-slate-300">Complete</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <div class="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-sm"></div>
                            <span class="text-slate-300">Remaining</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <div class="w-2.5 h-2.5 rounded-sm bg-slate-600 shadow-sm"></div>
                            <span class="text-slate-300">Skipped</span>
                        </div>
                    </div>

                    <!-- Chapter Details Grid -->
                    <div class="w-full">
                        <h3 class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-left">Chapter Breakdown</h3>
                        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 md:gap-2">
                            ${data.allChapters.map(ch => {
                                let bgClass = '', textClass = '', icon = '';
                                if (ch.status === 'complete') {
                                    bgClass = 'bg-emerald-500/20 border-emerald-500/30'; textClass = 'text-emerald-400'; icon = '✓';
                                } else if (ch.status === 'skip') {
                                    bgClass = 'bg-slate-600/20 border-slate-600/30'; textClass = 'text-slate-500'; icon = '—';
                                } else {
                                    bgClass = 'bg-rose-500/10 border-rose-500/20'; textClass = 'text-rose-400'; icon = '';
                                }
                                return `<div class="flex flex-col items-center justify-center p-1.5 md:p-2 rounded-xl border ${bgClass} transition-all hover:scale-105">
                                    <span class="text-[10px] md:text-xs font-black ${textClass}">${ch.chapterNum}</span>
                                    ${icon ? `<span class="text-[9px] ${textClass} mt-0.5">${icon}</span>` : ''}
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Right Side: Circle Chart -->
                <div class="flex flex-col items-center justify-center shrink-0 w-full lg:w-[40%] min-w-0">
                    ${data.html}
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Render subject completion trend line chart if present
        const lineCanvas = document.getElementById('subjectTrendLineChart');
        if (lineCanvas && global.lastSubjectTrendData && global.lastTrendMonths && typeof Chart !== 'undefined') {
            const subData = global.lastSubjectTrendData;
            const months = global.lastTrendMonths;

            if (global.subjectTrendGlobalMode === undefined) global.subjectTrendGlobalMode = true;

            const allSubjects = allSubs.slice().sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
            const filteredSubs = global.subjectTrendGlobalMode
                ? allSubjects
                : allSubjects.filter(s => global.selectedSubjectsTrend && global.selectedSubjectsTrend.includes(s.subject));

            const getSubColor = global.getSubjectColor || (() => '#6366f1');
            const getDynLabel = global.getDynamicChartLabel || (k => k);
            const chartVis = global.chartVisibility || { subjects: {} };

            let datasets = filteredSubs.map(s => {
                const k = s.subject;
                const color = getSubColor(k);
                const isVisible = global.subjectTrendGlobalMode ? (chartVis.subjects && chartVis.subjects[k] !== false) : true;
                return {
                    label: getDynLabel(k),
                    data: subData[k] || [],
                    borderColor: color,
                    backgroundColor: color + '20',
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: color,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#fff',
                    fill: true,
                    hidden: !isVisible,
                    subjectKey: k
                };
            });

            const stlChartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
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
                        callbacks: { label: c => ' ' + c.dataset.label + ': ' + c.parsed.y + '%' }
                    }
                },
                scales: {
                    y: {
                        min: 0, max: 100,
                        ticks: { font: { size: 9, weight: 'bold' }, callback: v => v + '%' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false }
                    },
                    x: {
                        ticks: { font: { size: 9, weight: 'bold' } },
                        grid: { display: false, drawBorder: false }
                    }
                }
            };

            if (global.subjectTrendLineChartInstance) {
                try {
                    global.subjectTrendLineChartInstance.destroy();
                } catch (e) {}
                global.subjectTrendLineChartInstance = null;
            }

            try {
                global.subjectTrendLineChartInstance = new Chart(lineCanvas, {
                    type: 'line',
                    data: { labels: months, datasets: datasets },
                    options: stlChartOptions
                });
            } catch (e) {}
        }

        if (typeof global.updateLegends === 'function') {
            global.updateLegends();
        }
    }

    function openSubjectTrendModal() {
        global.activeSingleSubjectTrend = null;
        global.subjectTrendChartStyle = global.subjectTrendChartStyle || 'circle';
        if (!global.lastSubjectTrendData || !global.lastTrendMonths) {
            if (typeof global.renderTrendCharts === 'function') global.renderTrendCharts();
        }
        if (typeof global.openModal === 'function') global.openModal('subject-trend-modal');
        renderSubjectTrendCircle();
        setSubjectTrendChartStyle(global.subjectTrendChartStyle);
    }

    function openSingleSubjectTrendModal(subjectName) {
        global.activeSingleSubjectTrend = subjectName;
        global.subjectTrendChartStyle = global.subjectTrendChartStyle || 'circle';
        if (!global.lastSubjectTrendData || !global.lastTrendMonths) {
            if (typeof global.renderTrendCharts === 'function') global.renderTrendCharts();
        }
        if (typeof global.openModal === 'function') global.openModal('subject-trend-modal');
        renderSubjectTrendCircle();
        setSubjectTrendChartStyle(global.subjectTrendChartStyle);
    }

    function setSubjectTrendChartStyle(style) {
        global.subjectTrendChartStyle = style;
        if (typeof document === 'undefined') return;
        const circleContainer = document.getElementById('subject-trend-circle-container');
        const lineContainer = document.getElementById('subject-trend-line-container');
        const circleBtn = document.getElementById('stm-circle-btn');
        const lineBtn = document.getElementById('stm-line-btn');

        const activeClass = 'flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all bg-indigo-600 text-white shadow';
        const inactiveClass = 'flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all text-slate-400 hover:text-white hover:bg-slate-700';

        if (style === 'line') {
            safeText('stm-title', 'Subject Completion Trends');
            safeText('stm-desc', 'Detailed month-by-month progression for all subjects');
            if (circleContainer) circleContainer.classList.add('hidden');
            if (lineContainer) lineContainer.classList.remove('hidden');
            if (circleBtn) circleBtn.className = inactiveClass;
            if (lineBtn) lineBtn.className = activeClass;
            if (global.subjectTrendLineChartInstance) {
                global.subjectTrendLineChartInstance.resize();
                global.subjectTrendLineChartInstance.update();
            }
            updateGlobalBtnStyle();
        } else {
            const activeSub = global.activeSingleSubjectTrend || 'Subject';
            safeText('stm-title', `${activeSub}`);
            safeText('stm-desc', 'Chapter completion analysis');
            if (circleContainer) circleContainer.classList.remove('hidden');
            if (lineContainer) lineContainer.classList.add('hidden');
            if (circleBtn) circleBtn.className = activeClass;
            if (lineBtn) lineBtn.className = inactiveClass;
        }
    }

    function stmToggleDropdown() {
        if (typeof document === 'undefined') return;
        const panel = document.getElementById('stm-dropdown-panel');
        const arrow = document.getElementById('stm-dropdown-arrow');
        if (!panel) return;
        const isHidden = panel.classList.contains('hidden');
        if (isHidden) {
            panel.classList.remove('hidden');
            if (arrow) arrow.style.transform = 'rotate(180deg)';
        } else {
            panel.classList.add('hidden');
            if (arrow) arrow.style.transform = '';
        }
    }

    function stmSelectSubject(subjectName) {
        global.activeSingleSubjectTrend = subjectName;
        if (!global.selectedSubjectsTrend) global.selectedSubjectsTrend = [];
        if (!global.selectedSubjectsTrend.includes(subjectName)) {
            global.selectedSubjectsTrend.push(subjectName);
        }
        renderSubjectTrendCircle();
        setSubjectTrendChartStyle(global.subjectTrendChartStyle || 'circle');
    }

    function stmToggleSubjectCheck(subjectName) {
        if (!global.selectedSubjectsTrend) global.selectedSubjectsTrend = [];
        const idx = global.selectedSubjectsTrend.indexOf(subjectName);
        if (idx !== -1) {
            if (subjectName === global.activeSingleSubjectTrend && global.selectedSubjectsTrend.length <= 1) return;
            global.selectedSubjectsTrend.splice(idx, 1);
        } else {
            global.selectedSubjectsTrend.push(subjectName);
        }
        renderSubjectTrendCircle();
        setSubjectTrendChartStyle(global.subjectTrendChartStyle || 'circle');
    }

    function stmSelectAll() {
        const getAllSubsFn = global.getAllSubjects || (typeof window !== 'undefined' ? window.getAllSubjects : null) || (() => []);
        global.selectedSubjectsTrend = getAllSubsFn().map(s => s.subject);
        renderSubjectTrendCircle();
        setSubjectTrendChartStyle(global.subjectTrendChartStyle || 'circle');
    }

    function stmDeselectAll() {
        global.selectedSubjectsTrend = global.activeSingleSubjectTrend ? [global.activeSingleSubjectTrend] : [];
        renderSubjectTrendCircle();
        setSubjectTrendChartStyle(global.subjectTrendChartStyle || 'circle');
    }

    function toggleSubjectTrendGlobal() {
        global.subjectTrendGlobalMode = !global.subjectTrendGlobalMode;
        updateGlobalBtnStyle();
        renderSubjectTrendCircle();
        setSubjectTrendChartStyle(global.subjectTrendChartStyle || 'circle');
    }

    function updateGlobalBtnStyle() {
        if (typeof document === 'undefined') return;
        const btn = document.getElementById('stm-global-btn');
        if (!btn) return;
        if (global.subjectTrendGlobalMode) {
            btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all bg-indigo-600 text-white shadow border border-indigo-500/50 hover:bg-indigo-700 active:scale-95';
        } else {
            btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white active:scale-95';
        }
    }

    if (typeof document !== 'undefined') {
        document.addEventListener('click', function (e) {
            if (e.target.closest('#stm-circle-btn')) {
                setSubjectTrendChartStyle('circle');
                return;
            }
            if (e.target.closest('#stm-line-btn')) {
                setSubjectTrendChartStyle('line');
                return;
            }
            if (e.target.closest('#stm-global-btn')) {
                toggleSubjectTrendGlobal();
                return;
            }
            const wrapper = document.getElementById('stm-subject-dropdown-wrapper');
            const panel = document.getElementById('stm-dropdown-panel');
            if (wrapper && panel && !wrapper.contains(e.target)) {
                panel.classList.add('hidden');
                const arrow = document.getElementById('stm-dropdown-arrow');
                if (arrow) arrow.style.transform = '';
            }
        });
    }

    const ChapterMap = {
        generateGlobalChaptersSVG,
        openGlobalChaptersModal,
        showChapterTooltip,
        hideChapterTooltip,
        showSubjectChapterTooltip,
        hideSubjectChapterTooltip,
        showSpectraChapterTooltip,
        hideSpectraChapterTooltip,
        renderSubjectTrendCircle,
        openSubjectTrendModal,
        openSingleSubjectTrendModal,
        setSubjectTrendChartStyle,
        stmToggleDropdown,
        stmSelectSubject,
        stmToggleSubjectCheck,
        stmSelectAll,
        stmDeselectAll,
        toggleSubjectTrendGlobal,
        updateGlobalBtnStyle
    };

    // Attach to global window scope
    global.ChapterMap = ChapterMap;
    global.generateGlobalChaptersSVG = generateGlobalChaptersSVG;
    global.openGlobalChaptersModal = openGlobalChaptersModal;
    global.showChapterTooltip = showChapterTooltip;
    global.hideChapterTooltip = hideChapterTooltip;
    global.showSubjectChapterTooltip = showSubjectChapterTooltip;
    global.hideSubjectChapterTooltip = hideSubjectChapterTooltip;
    global.showSpectraChapterTooltip = showSpectraChapterTooltip;
    global.hideSpectraChapterTooltip = hideSpectraChapterTooltip;
    global.renderSubjectTrendCircle = renderSubjectTrendCircle;
    global.openSubjectTrendModal = openSubjectTrendModal;
    global.openSingleSubjectTrendModal = openSingleSubjectTrendModal;
    global.setSubjectTrendChartStyle = setSubjectTrendChartStyle;
    global.stmToggleDropdown = stmToggleDropdown;
    global.stmSelectSubject = stmSelectSubject;
    global.stmToggleSubjectCheck = stmToggleSubjectCheck;
    global.stmSelectAll = stmSelectAll;
    global.stmDeselectAll = stmDeselectAll;
    global.toggleSubjectTrendGlobal = toggleSubjectTrendGlobal;
    global.updateGlobalBtnStyle = updateGlobalBtnStyle;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChapterMap;
    }
})(typeof window !== 'undefined' ? window : globalThis);
