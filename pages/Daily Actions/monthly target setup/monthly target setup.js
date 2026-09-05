/**
 * Monthly Target Page Module (pages/Daily Actions/monthly target setup/monthly target setup.js)
 * Single Source of Truth for Add & Edit Monthly Target Studio page logic and lifecycle.
 */

(function () {
    'use strict';

    window.editingMonthlyTargetIndex = null;
    window.editingMonthlyTargetMonthKey = null;

    /**
     * Monthly Target Page Lifecycle Controller
     */
    window.MonthlyTargetPage = {
        isMounted: false,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            // Check if there was a deferred action requested from outside
            if (window._pendingMonthlyTargetAction) {
                const action = window._pendingMonthlyTargetAction;
                window._pendingMonthlyTargetAction = null;
                if (action.type === 'edit') {
                    this.openEdit(action.idx, action.monthKey);
                    return;
                } else if (action.type === 'add') {
                    this.openAdd(action.targetDate);
                    return;
                }
            }

            // If already in edit mode, preserve edit mode
            if (window.editingMonthlyTargetIndex !== null && window.editingMonthlyTargetMonthKey !== null) {
                this.openEdit(window.editingMonthlyTargetIndex, window.editingMonthlyTargetMonthKey);
            } else {
                this.openAdd(window.currentMonthlyTargetsDate || new Date());
            }
        },

        destroy: function () {
            this.isMounted = false;
        },

        openAdd: function (targetDate = null) {
            if (typeof window.openAddMonthlyTargetPage === 'function') {
                window.openAddMonthlyTargetPage(targetDate);
            }
        },

        openEdit: function (idx, monthKey = null) {
            if (typeof window.openEditMonthlyTargetPage === 'function') {
                window.openEditMonthlyTargetPage(idx, monthKey);
            }
        }
    };

window.updateMonthlyTargetColorSync = function () {
    const subSelect = document.getElementById('mt-select-sub');
    const chSelect = document.getElementById('mt-select-ch');
    const dot = document.getElementById('mt-sub-color-dot');
    if (!subSelect) return;
    const subject = subSelect.value;
    if (subject && subject !== "No Subjects") {
        const color = window.getSubjectColor ? window.getSubjectColor(subject) : '#6366f1';
        if (dot) {
            dot.style.backgroundColor = color;
            dot.classList.remove('hidden');
        }
        subSelect.style.borderColor = color;
        if (chSelect) chSelect.style.borderColor = color;
    } else {
        if (dot) dot.classList.add('hidden');
        subSelect.style.borderColor = '';
        if (chSelect) chSelect.style.borderColor = '';
    }
};

/* --- Multi-Program & Multi-Subject Selection Engine --- */
window.populateMonthlyProgramsList = function (preselectedProgram = null) {
    const container = document.getElementById('mt-progs-container');
    if (!container) return;
    container.innerHTML = '';

    const allPrograms = [];
    (window.tracks || []).forEach(track => {
        if (window.customPrograms[track.id]) {
            window.customPrograms[track.id].forEach(p => {
                const progName = p.name || p;
                const subsCount = (syllabusStructure[track.id] || []).filter(s => s.program === progName).length;
                allPrograms.push({
                    trackId: track.id,
                    trackName: track.name || track.id,
                    progName: progName,
                    subsCount: subsCount
                });
            });
        }
    });

    if (allPrograms.length === 0) {
        container.innerHTML = `
            <div class="py-6 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                No Programs Configured
            </div>`;
        return;
    }

    allPrograms.forEach(prog => {
        const isSelected = Boolean(preselectedProgram && (prog.progName === preselectedProgram));
        const isProgPassed = Boolean(
            (window.passedItems && Array.isArray(window.passedItems.programs) && window.passedItems.programs.includes(prog.progName)) ||
            (prog.subsCount > 0 && (syllabusStructure[prog.trackId] || [])
                .filter(s => s.program === prog.progName)
                .every(s => window.isSubjectPassed && window.isSubjectPassed(prog.trackId, s.subject, prog.progName)))
        );

        const trackBadgeColor = prog.trackId === 'academic'
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50'
            : (prog.trackId === 'admission' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50');

        const cardHtml = `
            <div class="mt-prog-card flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 transition-all hover:border-purple-400/80 dark:hover:border-purple-500/80 cursor-pointer shadow-xs hover:shadow-sm min-h-[46px] active:scale-[0.99]"
                data-track="${prog.trackId}" data-program="${prog.progName}"
                onclick="window.toggleMonthlyProgramCard('${CSS.escape(prog.trackId)}', '${CSS.escape(prog.progName)}', event)">
                <label class="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pointer-events-none">
                    <input type="checkbox" data-track="${prog.trackId}" data-program="${prog.progName}"
                        class="mt-prog-checkbox form-checkbox h-5 w-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer pointer-events-auto shrink-0"
                        onchange="window.handleMonthlyProgramToggle(); event.stopPropagation();"
                        ${isSelected ? 'checked' : ''}>
                    <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                        <span class="text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${trackBadgeColor} shrink-0">${prog.trackName}</span>
                        <span class="text-xs font-black text-slate-800 dark:text-slate-100 truncate">${isProgPassed ? `ðŸ† ${prog.progName} (Passed)` : prog.progName}</span>
                    </div>
                </label>
                <div class="flex items-center gap-1.5 shrink-0 ml-1.5">
                    ${isProgPassed ? `
                        <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                            Passed
                        </span>
                    ` : ''}
                    <span class="text-[8.5px] sm:text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-300">
                        ${prog.subsCount} Sub
                    </span>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });

    window.handleMonthlyProgramToggle();
};

window.toggleMonthlyProgramsDropdown = function (forceState = null) {
    const menu = document.getElementById('mt-progs-dropdown-menu');
    const chevron = document.getElementById('mt-progs-dropdown-chevron');
    if (!menu) return;

    const shouldOpen = forceState !== null ? forceState : menu.classList.contains('hidden');
    if (shouldOpen) {
        menu.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
    } else {
        menu.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
    }
};

window.toggleMonthlyProgramCard = function (trackId, progName, event) {
    if (event && event.target && (event.target.tagName === 'INPUT' || event.target.closest('input'))) {
        return;
    }
    const cb = document.querySelector(`.mt-prog-checkbox[data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
    if (cb) {
        cb.checked = !cb.checked;
        window.handleMonthlyProgramToggle();
    }
};

window.toggleAllMonthlyPrograms = function (select) {
    const checkboxes = document.querySelectorAll('.mt-prog-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = select;
    });
    window.handleMonthlyProgramToggle();
};

window.handleMonthlyProgramToggle = function (preselectSubject = null) {
    const checkedProgs = Array.from(document.querySelectorAll('.mt-prog-checkbox:checked'));
    const badgeCount = document.getElementById('mt-progs-count-badge');
    if (badgeCount) {
        badgeCount.textContent = `${checkedProgs.length} Selected`;
    }

    const dropdownLabel = document.getElementById('mt-progs-dropdown-label');
    if (dropdownLabel) {
        if (checkedProgs.length === 0) {
            dropdownLabel.textContent = 'Select Programs...';
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 truncate block';
        } else if (checkedProgs.length === 1) {
            dropdownLabel.textContent = `${checkedProgs[0].getAttribute('data-program')}`;
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate block';
        } else {
            const names = checkedProgs.map(cb => cb.getAttribute('data-program')).join(', ');
            dropdownLabel.textContent = `${checkedProgs.length} Selected: ${names}`;
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate block';
        }
    }

    window.updateMonthlyTargetSubjectDropdown(preselectSubject);
};

window.updateMonthlyTargetSubjectDropdown = function (preselectSubject = null, preselectChapter = null, preselectSize = null, preselectWeek = null) {
    const container = document.getElementById('mt-subjects-container');
    if (!container) return;

    // Keep track of currently checked subjects before re-rendering
    const previouslyCheckedSet = preselectSubject
        ? new Set()
        : new Set(
            Array.from(document.querySelectorAll('.mt-subject-checkbox:checked')).map(cb => 
                cb.getAttribute('data-track') + '|||' + cb.getAttribute('data-program') + '|||' + cb.getAttribute('data-subject')
            )
        );

    container.innerHTML = '';

    const checkedProgs = Array.from(document.querySelectorAll('.mt-prog-checkbox:checked'));
    if (checkedProgs.length === 0) {
        container.innerHTML = `
            <div class="py-6 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                No Program Selected. Please choose at least one program above.
            </div>`;
        window.updateMonthlyTargetChapterDropdown();
        window.updateMonthlyTargetPageSummary();
        return;
    }

    const isMultiProg = checkedProgs.length > 1;
    const passedItems = window.passedItems || (window.AppState && window.AppState.passedItems) || { programs: [], subjects: [] };
    let totalSubsRendered = 0;

    checkedProgs.forEach(progCb => {
        const trackId = progCb.getAttribute('data-track');
        const progName = progCb.getAttribute('data-program');
        const subs = (syllabusStructure[trackId] || []).filter(s => s.program === progName);

        subs.forEach(s => {
            totalSubsRendered++;
            const isPassed = window.isSubjectPassed ? window.isSubjectPassed(trackId, s.subject, progName) : Boolean(
                (Array.isArray(passedItems.subjects) && passedItems.subjects.includes(s.subject)) ||
                (Array.isArray(passedItems.programs) && passedItems.programs.includes(s.program || progName))
            );
            const label = isPassed ? `ðŸ† ${s.subject} (Passed)` : s.subject;
            const color = window.getSubjectColor ? window.getSubjectColor(s.subject) : '#6366f1';
            const chs = window.getChaptersForSubject(trackId, s.subject) || [];
            
            const subKey = trackId + '|||' + progName + '|||' + s.subject;
            let isSelected = !isPassed && (
                preselectSubject
                    ? (s.subject === preselectSubject)
                    : previouslyCheckedSet.has(subKey)
            );

            const cardClasses = isPassed
                ? "mt-subject-card flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40 bg-slate-50/70 dark:bg-slate-900/40 opacity-60 cursor-not-allowed min-h-[46px]"
                : "mt-subject-card flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 transition-all hover:border-indigo-400/80 dark:hover:border-indigo-500/80 cursor-pointer shadow-xs hover:shadow-sm min-h-[46px] active:scale-[0.99]";

            const cardHtml = `
                <div class="${cardClasses}"
                    data-track="${trackId}" data-program="${progName}" data-subject="${s.subject}" data-passed="${isPassed ? 'true' : 'false'}"
                    onclick="window.toggleMonthlySubjectCard('${CSS.escape(trackId)}', '${CSS.escape(progName)}', '${CSS.escape(s.subject)}', event)">
                    <label class="flex items-center gap-2.5 ${isPassed ? 'cursor-not-allowed' : 'cursor-pointer'} flex-1 min-w-0 pointer-events-none">
                        <input type="checkbox" data-track="${trackId}" data-program="${progName}" data-subject="${s.subject}"
                            class="mt-subject-checkbox form-checkbox h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer pointer-events-auto shrink-0 ${isPassed ? 'opacity-30 cursor-not-allowed' : ''}"
                            onchange="window.handleMonthlySubjectToggle(); event.stopPropagation();"
                            ${isSelected ? 'checked' : ''}
                            ${isPassed ? 'disabled title="Subject is passed and cannot be selected"' : ''}>
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style="background-color: ${color}"></span>
                            <span class="text-xs font-black text-slate-800 dark:text-slate-100 truncate">${label}</span>
                            ${isMultiProg ? `<span class="text-[8px] font-bold text-purple-600 dark:text-purple-400 px-1 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200/40 dark:border-purple-800/40 shrink-0">${progName}</span>` : ''}
                        </div>
                    </label>
                    <div class="flex items-center gap-1.5 shrink-0 ml-1.5">
                        ${isPassed ? `
                            <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                Passed
                            </span>
                        ` : ''}
                        <span class="text-[8.5px] sm:text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-300">
                            ${chs.length} Ch
                        </span>
                    </div>
                </div>
            `;
            container.innerHTML += cardHtml;
        });
    });

    if (totalSubsRendered === 0) {
        container.innerHTML = `
            <div class="py-6 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                No Subjects Available for the Selected Programs
            </div>`;
    }

    window.updateMonthlyTargetChapterDropdown(preselectChapter, preselectSize, preselectSubject, preselectWeek);
    window.updateMonthlyTargetPageSummary();
};

window.toggleMonthlySubjectsDropdown = function (forceState = null) {
    const menu = document.getElementById('mt-subjects-dropdown-menu');
    const chevron = document.getElementById('mt-subjects-dropdown-chevron');
    if (!menu) return;

    const shouldOpen = forceState !== null ? forceState : menu.classList.contains('hidden');
    if (shouldOpen) {
        menu.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
    } else {
        menu.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
    }
};

window.toggleMonthlySubjectCard = function (trackId, progName, subjectName, event) {
    if (event && event.target && (event.target.tagName === 'INPUT' || event.target.closest('input'))) {
        return;
    }
    const card = event && event.currentTarget ? event.currentTarget : document.querySelector(`.mt-subject-card[data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"][data-subject="${CSS.escape(subjectName)}"]`);
    if (card && card.getAttribute('data-passed') === 'true') {
        showToast(`"${subjectName}" is marked as Passed and cannot be selected.`, "info");
        return;
    }
    const cb = document.querySelector(`.mt-subject-checkbox[data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"][data-subject="${CSS.escape(subjectName)}"]`);
    if (cb && !cb.disabled) {
        cb.checked = !cb.checked;
        window.handleMonthlySubjectToggle();
    }
};

window.toggleAllMonthlySubjects = function (select) {
    const checkboxes = document.querySelectorAll('.mt-subject-checkbox:not(:disabled)');
    checkboxes.forEach(cb => {
        cb.checked = select;
    });
    window.handleMonthlySubjectToggle();
};

window.handleMonthlySubjectToggle = function () {
    window.updateMonthlyTargetChapterDropdown();
    window.updateMonthlyTargetPageSummary();
};

window.updateMonthlyTargetChapterDropdown = function (preselectChapter = null, preselectSize = null, targetSubject = null, preselectWeek = null) {
    const container = document.getElementById('mt-chapters-container');
    if (!container) return;

    // 1. Snapshot and remember all current chapter and whole subject selections / values before re-rendering
    const rememberedState = {};
    const existingChapterCbs = document.querySelectorAll('.mt-chapter-checkbox');
    existingChapterCbs.forEach(cb => {
        const track = cb.getAttribute('data-track') || '';
        const prog = cb.getAttribute('data-program') || '';
        const sub = cb.getAttribute('data-subject') || '';
        const ch = cb.getAttribute('data-chapter') || '';
        const key = `${track}|||${prog}|||${sub}|||${ch}`;
        const keySubCh = `${sub}|||${ch}`;
        
        const row = cb.closest('.mt-chapter-row');
        const weekSelect = row ? row.querySelector('.mt-chapter-week-select') : document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        const sizeInput = row ? row.querySelector('.mt-chapter-size-input') : document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);

        const entry = {
            checked: cb.checked,
            week: weekSelect ? weekSelect.value : '',
            size: sizeInput ? sizeInput.value : ''
        };
        rememberedState[key] = entry;
        rememberedState[keySubCh] = entry;
    });

    const existingWholeSubs = document.querySelectorAll('.mt-ch-whole-subject');
    existingWholeSubs.forEach(ws => {
        const track = ws.getAttribute('data-track') || '';
        const prog = ws.getAttribute('data-program') || '';
        const sub = ws.getAttribute('data-subject') || '';
        const key = `${track}|||${prog}|||${sub}|||Whole Subject`;
        const keySubCh = `${sub}|||Whole Subject`;

        const row = ws.closest('.mt-chapter-row');
        const weekSelect = row ? row.querySelector('.mt-size-whole-subject-week') : document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(sub)}"]`);
        const sizeInput = row ? row.querySelector('.mt-size-whole-subject') : document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);

        const entry = {
            checked: ws.checked,
            week: weekSelect ? weekSelect.value : '',
            size: sizeInput ? sizeInput.value : ''
        };
        rememberedState[key] = entry;
        rememberedState[keySubCh] = entry;
    });

    container.innerHTML = '';

    const checkedSubjectCbs = Array.from(document.querySelectorAll('.mt-subject-checkbox:checked'));
    if (checkedSubjectCbs.length === 0) {
        container.innerHTML = `
            <div class="py-12 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2">
                <svg class="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <span>No subjects selected. Check one or more subjects on the left to configure chapters.</span>
            </div>`;
        window.updateMonthlyTargetPageSummary();
        return;
    }

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];

    let baseWeeksOptions = '';
    weeks.forEach((w, wIdx) => {
        const opt = { day: '2-digit', month: 'short' };
        const shortLabel = `Week ${wIdx + 1} (${w.start.toLocaleDateString('en-GB', opt)} - ${w.end.toLocaleDateString('en-GB', opt)})`;
        baseWeeksOptions += `<option value="${w.key}">${shortLabel}</option>`;
    });

    const bulkWeekSelect = document.getElementById('mt-bulk-week-select');
    if (bulkWeekSelect) {
        const prevVal = bulkWeekSelect.value;
        bulkWeekSelect.innerHTML = '<option value="">-- No Week --</option>' + baseWeeksOptions;
        if (prevVal && weeks.some(w => w.key === prevVal)) {
            bulkWeekSelect.value = prevVal;
        }
    }

    checkedSubjectCbs.forEach(cb => {
        const trackId = cb.getAttribute('data-track');
        const progName = cb.getAttribute('data-program');
        const subject = cb.getAttribute('data-subject');

        const color = window.getSubjectColor ? window.getSubjectColor(subject) : '#6366f1';
        const chapters = window.getChaptersForSubject(trackId, subject) || [];
        const isTargetSub = !targetSubject || targetSubject === subject;
        const isWholeSubPreselected = isTargetSub && (preselectChapter === 'Whole Subject' || preselectChapter === '-- ðŸ“š Whole Subject (All Chapters) --');

        const wsKeyFull = `${trackId}|||${progName}|||${subject}|||Whole Subject`;
        const wsKeySubCh = `${subject}|||Whole Subject`;
        const savedWholeSub = rememberedState[wsKeyFull] || rememberedState[wsKeySubCh];

        const isWholeSubChecked = preselectChapter
            ? isWholeSubPreselected
            : (savedWholeSub ? savedWholeSub.checked : isWholeSubPreselected);
        const wholeSubWeekVal = preselectChapter
            ? (isWholeSubPreselected ? (preselectWeek || '') : '')
            : (savedWholeSub ? savedWholeSub.week : (isWholeSubPreselected ? (preselectWeek || '') : ''));
        const wholeSubSizeVal = preselectChapter
            ? (isWholeSubPreselected && preselectSize ? preselectSize : '')
            : (savedWholeSub ? savedWholeSub.size : (isWholeSubPreselected && preselectSize ? preselectSize : ''));

        let wholeSubWeeksOptionsHtml = '';
        weeks.forEach((w, wIdx) => {
            const opt = { day: '2-digit', month: 'short' };
            const shortLabel = `Week ${wIdx + 1} (${w.start.toLocaleDateString('en-GB', opt)} - ${w.end.toLocaleDateString('en-GB', opt)})`;
            const isWeekSelected = Boolean(wholeSubWeekVal && wholeSubWeekVal === w.key);
            wholeSubWeeksOptionsHtml += `<option value="${w.key}" ${isWeekSelected ? 'selected' : ''}>${shortLabel}</option>`;
        });

        let chaptersHtml = '';
        if (chapters.length > 0) {
            chapters.forEach(ch => {
                const count = window.getMonthlyTargetOccurrenceCount ? window.getMonthlyTargetOccurrenceCount(trackId, subject, ch, 'chapter') : 0;
                const starsHtml = count > 0 ? `<span class="inline-flex text-amber-500 dark:text-amber-400 text-xs ml-1 font-bold select-none" title="Targeted ${count} time(s) before. Setting now will be Target #${count + 1}">${'â˜…'.repeat(count)}</span>` : '';

                const isCompleted = window.isChapterCompleted ? window.isChapterCompleted(trackId, subject, ch) : false;
                const completedTickHtml = isCompleted ? `
                    <span class="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 align-middle shrink-0 shadow-xs" title="Completed">
                        <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </span>` : '';

                const chKeyFull = `${trackId}|||${progName}|||${subject}|||${ch}`;
                const chKeySubCh = `${subject}|||${ch}`;
                const savedCh = rememberedState[chKeyFull] || rememberedState[chKeySubCh];
                const isChTargetPreselected = isTargetSub && preselectChapter === ch;

                const isChChecked = preselectChapter
                    ? isChTargetPreselected
                    : (savedCh ? savedCh.checked : isChTargetPreselected);
                const chWeekVal = preselectChapter
                    ? (isChTargetPreselected ? (preselectWeek || '') : '')
                    : (savedCh ? savedCh.week : (isChTargetPreselected ? (preselectWeek || '') : ''));
                const chSizeVal = preselectChapter
                    ? (isChTargetPreselected && preselectSize ? preselectSize : '')
                    : (savedCh ? savedCh.size : (isChTargetPreselected && preselectSize ? preselectSize : ''));

                let chWeeksOptionsHtml = '';
                weeks.forEach((w, wIdx) => {
                    const opt = { day: '2-digit', month: 'short' };
                    const shortLabel = `Week ${wIdx + 1} (${w.start.toLocaleDateString('en-GB', opt)} - ${w.end.toLocaleDateString('en-GB', opt)})`;
                    const isWeekSelected = Boolean(chWeekVal && chWeekVal === w.key);
                    chWeeksOptionsHtml += `<option value="${w.key}" ${isWeekSelected ? 'selected' : ''}>${shortLabel}</option>`;
                });

                chaptersHtml += `
                    <div class="mt-chapter-row flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800/90 transition-all hover:border-indigo-400/60 dark:hover:border-indigo-500/60 hover:shadow-xs gap-2 overflow-hidden"
                         data-track="${trackId}" data-program="${progName}" data-chapter-name="${subject} ${ch}" data-subject="${subject}">
                        <label class="flex items-center gap-2.5 sm:gap-3 cursor-pointer flex-1 min-w-0">
                            <input type="checkbox" data-track="${trackId}" data-program="${progName}" data-subject="${subject}" data-chapter="${ch}" class="mt-chapter-checkbox form-checkbox h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer transition-all shrink-0"
                                 onchange="window.handleMonthlyChapterCheckChange(this, '${CSS.escape(subject)}');"
                                 ${isChChecked ? 'checked' : ''}>
                            <div class="min-w-0 flex-1 flex items-center gap-1">
                                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${ch}</span>
                                ${starsHtml}
                                ${completedTickHtml}
                            </div>
                        </label>
                        <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/40">
                            <!-- Multi-Week Indicator (shown left of the week dropdown when multi-week) -->
                            <span class="mt-chapter-multiweek-badge hidden px-2 py-1 rounded-xl text-[9px] sm:text-[10px] font-black tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 shadow-xs shrink-0 select-none"
                                  data-subject="${subject}" data-chapter="${ch}">
                            </span>
                            <!-- Week Picker per chapter -->
                            <select data-track="${trackId}" data-program="${progName}" data-subject="${subject}" data-chapter="${ch}"
                                class="mt-chapter-week-select bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 font-bold outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-0 sm:flex-none sm:w-[135px] truncate shadow-xs h-9"
                                onchange="window.handleMonthlyChapterWeekSelectChange('${CSS.escape(subject)}', '${CSS.escape(ch)}', this.value, '${CSS.escape(trackId)}', '${CSS.escape(progName)}');">
                                <option value="">-- No Week --</option>
                                ${chWeeksOptionsHtml}
                            </select>
                            <!-- Size Input per chapter -->
                            <input type="number" data-track="${trackId}" data-program="${progName}" data-subject="${subject}" data-chapter="${ch}" class="mt-chapter-size-input w-16 sm:w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold outline-none shadow-inner focus:ring-2 focus:ring-indigo-500 transition-all text-center h-9 shrink-0"
                                placeholder="Size" min="1"
                                oninput="window.handleMonthlyChapterSizeInputChange(this);"
                                value="${chSizeVal || ''}">
                        </div>
                    </div>
                `;
            });
        } else {
            chaptersHtml = `
                <div class="py-4 text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                    No individual chapters listed for ${subject}.
                </div>
            `;
        }

        const wholeSubCount = window.getMonthlyTargetOccurrenceCount ? window.getMonthlyTargetOccurrenceCount(trackId, subject, 'Whole Subject', 'subject') : 0;
        const wholeSubStarsHtml = wholeSubCount > 0 ? `<span class="inline-flex text-amber-500 dark:text-amber-400 text-xs ml-1 font-bold select-none" title="Targeted ${wholeSubCount} time(s) before. Setting now will be Target #${wholeSubCount + 1}">${'â˜…'.repeat(wholeSubCount)}</span>` : '';

        const groupHtml = `
            <div class="mt-subject-chapter-group rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/95 p-3 sm:p-4 shadow-sm space-y-3" data-track="${trackId}" data-program="${progName}" data-subject="${subject}">
                <!-- Subject Header -->
                <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
                    <div class="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-wrap">
                        <span class="w-3 h-3 rounded-full shrink-0 shadow-xs" style="background-color: ${color}"></span>
                        <h4 class="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">${subject}</h4>
                        <span class="text-[8.5px] sm:text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50 shrink-0">
                            ${progName}
                        </span>
                        <span class="text-[8.5px] sm:text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-300 shrink-0">
                            ${chapters.length} Ch
                        </span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button type="button" onclick="window.toggleAllMonthlyChaptersForSubject('${CSS.escape(subject)}', true, '${CSS.escape(trackId)}', '${CSS.escape(progName)}')"
                            class="text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-2.5 py-1 rounded border border-indigo-200/50 dark:border-indigo-800/50 transition-all active:scale-95 min-h-[28px]">Select All</button>
                        <button type="button" onclick="window.toggleAllMonthlyChaptersForSubject('${CSS.escape(subject)}', false, '${CSS.escape(trackId)}', '${CSS.escape(progName)}')"
                            class="text-[9px] font-black text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 transition-all active:scale-95 min-h-[28px]">Clear</button>
                    </div>
                </div>

                <!-- Whole Subject Checkbox Row -->
                <div class="mt-chapter-row flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl border border-purple-200/80 dark:border-purple-800/60 bg-purple-50/60 dark:bg-purple-950/30 transition-all hover:bg-purple-50 dark:hover:bg-purple-950/50 shadow-xs gap-2 overflow-hidden"
                     data-track="${trackId}" data-program="${progName}" data-chapter-name="${subject} Whole Subject All Chapters" data-subject="${subject}">
                    <label class="flex items-center gap-2.5 sm:gap-3 cursor-pointer flex-1 min-w-0">
                        <input type="checkbox" data-track="${trackId}" data-program="${progName}" data-subject="${subject}" class="mt-ch-whole-subject form-checkbox h-5 w-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer transition-all shrink-0"
                            onchange="window.handleMonthlyWholeSubjectToggle('${CSS.escape(subject)}', this.checked, '${CSS.escape(trackId)}', '${CSS.escape(progName)}')"
                            ${isWholeSubChecked ? 'checked' : ''}>
                        <div class="min-w-0 flex-1">
                            <span class="text-xs font-black text-purple-900 dark:text-purple-200 truncate block">ðŸ“š Whole Subject (All Chapters)${wholeSubStarsHtml}</span>
                            <span class="text-[8.5px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider block">Target entirety of ${subject} (${progName})</span>
                        </div>
                    </label>
                    <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-purple-200/40 dark:border-purple-800/40">
                        <!-- Multi-Week Indicator for Whole Subject -->
                        <span class="mt-chapter-multiweek-badge hidden px-2 py-1 rounded-xl text-[9px] sm:text-[10px] font-black tracking-wider bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-xs shrink-0 select-none"
                              data-subject="${subject}" data-chapter="Whole Subject">
                        </span>
                        <!-- Week Picker for Whole Subject -->
                        <select data-track="${trackId}" data-program="${progName}" data-subject="${subject}"
                            class="mt-size-whole-subject-week bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/60 rounded-xl px-2 py-1.5 text-[11px] text-purple-700 dark:text-purple-300 font-bold outline-none focus:ring-2 focus:ring-purple-500 flex-1 min-w-0 sm:flex-none sm:w-[135px] truncate shadow-xs h-9"
                            onchange="window.handleMonthlyChapterWeekSelectChange('${CSS.escape(subject)}', 'Whole Subject', this.value, '${CSS.escape(trackId)}', '${CSS.escape(progName)}');">
                            <option value="">-- No Week --</option>
                            ${wholeSubWeeksOptionsHtml}
                        </select>
                        <!-- Size Input for Whole Subject -->
                        <input type="number" data-track="${trackId}" data-program="${progName}" data-subject="${subject}" placeholder="Size" min="1"
                            oninput="window.handleMonthlyChapterSizeInputChange(this);"
                            value="${wholeSubSizeVal || ''}"
                            class="mt-size-whole-subject w-16 sm:w-20 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/60 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-purple-500 transition-all text-center h-9 shrink-0">
                    </div>
                </div>

                <!-- Individual Chapters List -->
                <div class="space-y-1.5">
                    ${chaptersHtml}
                </div>
            </div>
        `;
        container.innerHTML += groupHtml;
    });

    if (typeof window.updateChapterMultiWeekBadges === 'function') {
        window.updateChapterMultiWeekBadges();
    }
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();

    const searchInput = document.getElementById('mt-chapter-search-input');
    if (searchInput && searchInput.value) {
        window.filterMonthlyTargetChapters(searchInput.value);
    }
};

window.toggleAllMonthlyChaptersForSubject = function (subjectName, select, trackId = null, progName = null) {
    const trackSelector = trackId ? `[data-track="${CSS.escape(trackId)}"]` : '';
    const progSelector = progName ? `[data-program="${CSS.escape(progName)}"]` : '';
    const wholeSub = document.querySelector(`.mt-ch-whole-subject[data-subject="${CSS.escape(subjectName)}"]${trackSelector}${progSelector}`);
    if (wholeSub && select) wholeSub.checked = false;

    const checkboxes = document.querySelectorAll(`.mt-chapter-checkbox[data-subject="${CSS.escape(subjectName)}"]${trackSelector}${progSelector}`);
    checkboxes.forEach(cb => {
        const parentRow = cb.closest('.mt-chapter-row');
        if (!parentRow || !parentRow.classList.contains('hidden')) {
            cb.checked = select;
        }
    });
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
};

window.toggleAllMonthlyChapters = function (select) {
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject');
    if (select) {
        wholeSubs.forEach(ws => ws.checked = false);
    }

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox');
    checkboxes.forEach(cb => {
        const parentRow = cb.closest('.mt-chapter-row');
        if (!parentRow || !parentRow.classList.contains('hidden')) {
            cb.checked = select;
        }
    });
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
};

window.handleMonthlyWholeSubjectToggle = function (subjectName, isChecked, trackId = null, progName = null) {
    const trackSelector = trackId ? `[data-track="${CSS.escape(trackId)}"]` : '';
    const progSelector = progName ? `[data-program="${CSS.escape(progName)}"]` : '';
    if (isChecked) {
        const checkboxes = document.querySelectorAll(`.mt-chapter-checkbox[data-subject="${CSS.escape(subjectName)}"]${trackSelector}${progSelector}`);
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
    }
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
};

window.handleMonthlyChapterCheckChange = function (checkboxEl, subjectName) {
    if (checkboxEl && checkboxEl.checked) {
        const wholeSub = document.querySelector(`.mt-ch-whole-subject[data-subject="${CSS.escape(subjectName)}"]`);
        if (wholeSub) wholeSub.checked = false;
    }
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
};

window.filterMonthlyTargetChapters = function (query) {
    const q = (query || '').toLowerCase().trim();
    const groups = document.querySelectorAll('.mt-subject-chapter-group');
    groups.forEach(group => {
        const subjectName = (group.getAttribute('data-subject') || '').toLowerCase();
        const rows = group.querySelectorAll('.mt-chapter-row');
        let visibleRowCount = 0;
        rows.forEach(row => {
            const name = (row.getAttribute('data-chapter-name') || '').toLowerCase();
            if (!q || name.includes(q) || subjectName.includes(q)) {
                row.classList.remove('hidden');
                visibleRowCount++;
            } else {
                row.classList.add('hidden');
            }
        });
        if (!q || visibleRowCount > 0 || subjectName.includes(q)) {
            group.classList.remove('hidden');
        } else {
            group.classList.add('hidden');
        }
    });
};

window.setBulkSizePreset = function (val) {
    const bulkInput = document.getElementById('mt-bulk-size-input');
    if (bulkInput) {
        bulkInput.value = val;
        window.applyBulkSizeToMonthlyChapters();
    }
};

window.findWeekForDayInMonth = function (dayKey, targetMonthDate = null) {
    if (!dayKey) return '';
    const activeMonth = targetMonthDate || window.currentMonthlyTargetsDate || new Date();
    const targetYear = activeMonth.getFullYear();

    let d = null;
    if (typeof dayKey === 'string') {
        const trimmed = dayKey.trim();
        // Case 1: YYYY-MM-DD
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
            const [y, m, day] = trimmed.split('-').map(Number);
            d = new Date(y, m - 1, day, 12, 0, 0);
        }
        // Case 2: DD-MM-YYYY
        else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
            const [day, m, y] = trimmed.split('-').map(Number);
            d = new Date(y, m - 1, day, 12, 0, 0);
        }
        // Case 3: "Sep 15" or "15 Sep" or "15 Sep 2026"
        else {
            const withYear = (trimmed.includes(String(targetYear)) || trimmed.includes(String(targetYear - 1)) || trimmed.includes(String(targetYear + 1)))
                ? trimmed
                : `${trimmed} ${targetYear}`;
            d = new Date(withYear + ' 12:00:00');
            if (isNaN(d.getTime()) && window.Utils && typeof window.Utils.parseDateSafe === 'function') {
                d = window.Utils.parseDateSafe(withYear);
            }
        }
    } else if (dayKey instanceof Date) {
        d = dayKey;
    }

    if (!d || isNaN(d.getTime())) {
        d = (window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(dayKey) : new Date(dayKey));
    }
    if (!d || isNaN(d.getTime())) return '';

    const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(activeMonth) : [];
    if (!weeks || weeks.length === 0) return '';

    const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
    for (const w of weeks) {
        const startTime = new Date(w.start).setHours(0, 0, 0, 0);
        const endTime = new Date(w.end).setHours(23, 59, 59, 999);
        if (dTime >= startTime && dTime <= endTime) {
            return w.key;
        }
    }
    return '';
};

window.bindTargetToWeek = function (subject, chapter, weekKey, track = null, program = null) {
    if (!weekKey) return;
    const trackSelector = track ? `[data-track="${CSS.escape(track)}"]` : '';
    const progSelector = program ? `[data-program="${CSS.escape(program)}"]` : '';
    if (chapter === 'Whole Subject') {
        const weekSelect = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(subject)}"]${trackSelector}${progSelector}`) ||
                           document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(subject)}"]`);
        if (weekSelect) {
            weekSelect.value = weekKey;
        }
    } else {
        const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]${trackSelector}${progSelector}`) ||
                           document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
        if (weekSelect) {
            weekSelect.value = weekKey;
        }
    }
};

window.updateChapterMultiWeekBadges = function () {
    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const monthWeeks = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];

    const badges = document.querySelectorAll('.mt-chapter-multiweek-badge');
    badges.forEach(badge => {
        const sub = badge.getAttribute('data-subject');
        const ch = badge.getAttribute('data-chapter');
        if (!sub || !ch) return;
        const key = sub + '|||' + ch;
        const allocations = (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key]) || [];

        const weeksSpanned = new Set();
        allocations.forEach(a => {
            if (a.dayKey) {
                const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey, targetMonthDate) : '';
                if (wk) weeksSpanned.add(wk);
            }
        });

        if (weeksSpanned.size > 1) {
            const weekNums = [];
            monthWeeks.forEach((mw, idx) => {
                if (weeksSpanned.has(mw.key)) {
                    weekNums.push(`W${idx + 1}`);
                }
            });

            const label = weekNums.length > 0 ? `[ ${weekNums.join(' ')} ]` : `[ ${weeksSpanned.size}W ]`;
            badge.textContent = label;
            badge.title = `Chapter is spread into multiple weeks: ${Array.from(weeksSpanned).join(', ')}`;
            badge.classList.remove('hidden');
        } else {
            badge.textContent = '';
            badge.classList.add('hidden');
        }
    });
};

window.adjustDailyAllocationsForTargetWeek = function (subject, chapter, weekKey) {
    if (!weekKey || weekKey === 'none') return;
    const key = subject + '|||' + chapter;
    if (!window.monthlyTargetDailyAllocations || !window.monthlyTargetDailyAllocations[key]) return;
    const allocations = window.monthlyTargetDailyAllocations[key];
    if (!Array.isArray(allocations) || allocations.length === 0) return;

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const weekDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate, weekKey) : [];
    if (weekDays.length === 0) return;

    allocations.forEach((alloc, idx) => {
        const dayObj = weekDays[Math.min(idx, weekDays.length - 1)];
        if (dayObj) {
            alloc.dayKey = dayObj.key;
        }
    });
};

window.handleMonthlyChapterWeekSelectChange = function (subject, chapter, weekKey, trackId = null, progName = null) {
    if (weekKey && weekKey !== 'none') {
        window.adjustDailyAllocationsForTargetWeek(subject, chapter, weekKey);
    }
    window.renderMonthlyTargetDailyAllocations();
    if (typeof window.updateChapterMultiWeekBadges === 'function') {
        window.updateChapterMultiWeekBadges();
    }
    window.updateMonthlyTargetPageSummary();
};

window.applyBulkWeekToMonthlyChapters = function () {
    const bulkWeekSelect = document.getElementById('mt-bulk-week-select');
    const selectedWeek = bulkWeekSelect ? bulkWeekSelect.value : '';

    let appliedCount = 0;
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const sub = ws.getAttribute('data-subject');
        const weekSelect = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(sub)}"]`);
        if (weekSelect) {
            weekSelect.value = selectedWeek;
            appliedCount++;
            if (!selectedWeek || selectedWeek === 'none') {
                if (window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations[sub + '|||Whole Subject'] = [];
            } else {
                window.adjustDailyAllocationsForTargetWeek(sub, 'Whole Subject', selectedWeek);
            }
        }
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        if (weekSelect) {
            weekSelect.value = selectedWeek;
            appliedCount++;
            if (!selectedWeek || selectedWeek === 'none') {
                if (window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations[sub + '|||' + ch] = [];
            } else {
                window.adjustDailyAllocationsForTargetWeek(sub, ch, selectedWeek);
            }
        }
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();

    if (appliedCount === 0) {
        showToast("No chapters or whole subjects currently selected. Check the targets you want to assign week to.", "error");
    } else {
        const weekLabel = selectedWeek ? "assigned" : "cleared";
        showToast(`Weekly target ${weekLabel} for ${appliedCount} selected target(s)!`, "success");
    }
};

window.distributeChaptersAcrossWeeks = function () {
    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];
    if (!weeks || weeks.length === 0) {
        return showToast("No weeks available for the active month.", "error");
    }

    const selectedTargets = [];
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const sub = ws.getAttribute('data-subject');
        const weekSelect = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(sub)}"]`);
        if (weekSelect) selectedTargets.push({ subject: sub, chapter: 'Whole Subject', weekSelect: weekSelect });
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        if (weekSelect) selectedTargets.push({ subject: sub, chapter: ch, weekSelect: weekSelect });
    });

    if (selectedTargets.length === 0) {
        return showToast("Please check at least one chapter or whole subject to distribute across weeks.", "error");
    }

    selectedTargets.forEach((targetInfo, idx) => {
        const assignedWeek = weeks[idx % weeks.length];
        targetInfo.weekSelect.value = assignedWeek.key;
        window.adjustDailyAllocationsForTargetWeek(targetInfo.subject, targetInfo.chapter, assignedWeek.key);
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    showToast(`âš¡ ${selectedTargets.length} target(s) distributed across ${weeks.length} weeks!`, "success");
};

/* --- Daily Target Allocator & Multi-Day Fraction Management --- */
window.monthlyTargetDailyAllocations = window.monthlyTargetDailyAllocations || {};

window.recalculateDailyAllocationsForChapter = function (subject, chapter, totalSize) {
    const key = subject + '|||' + chapter;
    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};
    const allocations = window.monthlyTargetDailyAllocations[key];
    if (!Array.isArray(allocations) || allocations.length === 0) return;

    const numSize = (totalSize !== null && totalSize !== undefined && totalSize !== '') ? parseInt(totalSize, 10) : null;
    if (isNaN(numSize) || numSize === null || numSize <= 0) {
        allocations.forEach(a => {
            if (a.fraction || a.portionLabel) {
                a.portionSize = null;
            }
        });
        return;
    }

    const n = allocations.length;
    const isUniformSplit = allocations.every((a, idx) => {
        return a.fraction === `1/${n}` || (a.portionLabel && a.portionLabel.startsWith('Part ')) || (!a.fraction && !a.portionSize);
    });

    if (isUniformSplit && n > 0) {
        const base = Math.floor(numSize / n);
        const rem = numSize % n;
        allocations.forEach((a, idx) => {
            a.portionSize = base + (idx < rem ? 1 : 0);
            if (!a.fraction) a.fraction = `1/${n}`;
            if (!a.portionLabel) a.portionLabel = `Part ${idx + 1}/${n}`;
        });
    } else {
        let runningAllocated = 0;
        allocations.forEach((a, idx) => {
            if (a.fraction === '1/2') {
                a.portionSize = Math.round(numSize * 0.5);
            } else if (a.fraction === '1/3') {
                a.portionSize = Math.round(numSize * (1 / 3));
            } else if (a.fraction === '1/4') {
                a.portionSize = Math.round(numSize * 0.25);
            } else if (a.fraction === '1/5') {
                a.portionSize = Math.round(numSize * 0.2);
            } else if (a.fraction === '1/7') {
                a.portionSize = Math.round(numSize * (1 / 7));
            } else if (a.fraction === '1/10') {
                a.portionSize = Math.round(numSize * 0.1);
            } else if (a.fraction === 'All') {
                const remaining = numSize - runningAllocated;
                a.portionSize = Math.max(0, remaining > 0 ? remaining : (runningAllocated === 0 ? numSize : 0));
            } else if (n === 1) {
                a.portionSize = numSize;
                a.fraction = 'All';
                a.portionLabel = 'Full Chapter';
            }
            if (a.portionSize) runningAllocated += parseInt(a.portionSize, 10) || 0;
        });
    }
};

window.handleMonthlyChapterSizeInputChange = function (inputEl) {
    if (!inputEl) return;
    const subject = inputEl.getAttribute('data-subject');
    const chapter = inputEl.getAttribute('data-chapter') || 'Whole Subject';
    const totalSize = inputEl.value ? parseInt(inputEl.value, 10) : null;
    const key = subject + '|||' + chapter;

    if (window.recalculateDailyAllocationsForChapter) {
        window.recalculateDailyAllocationsForChapter(subject, chapter, totalSize);
    }

    const card = document.querySelector(`.mt-daily-target-card[data-daily-target-key="${CSS.escape(key)}"]`);
    if (card && window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key]) {
        const sizeInputs = card.querySelectorAll('.mt-daily-size-input');
        const allocations = window.monthlyTargetDailyAllocations[key];
        allocations.forEach((alloc, idx) => {
            if (sizeInputs[idx]) {
                sizeInputs[idx].value = (alloc.portionSize !== null && alloc.portionSize !== undefined) ? alloc.portionSize : '';
            }
        });
        if (window.updateDailyAllocationBadgesInPlace) {
            window.updateDailyAllocationBadgesInPlace(subject, chapter);
        }
    } else {
        if (window.renderMonthlyTargetDailyAllocations) {
            window.renderMonthlyTargetDailyAllocations();
        }
    }

    if (window.updateMonthlyTargetPageSummary) {
        window.updateMonthlyTargetPageSummary();
    }
};

window.getAssignedWeekKeyForTarget = function (subject, chapter, track = null, program = null) {
    const trackSelector = track ? `[data-track="${CSS.escape(track)}"]` : '';
    const progSelector = program ? `[data-program="${CSS.escape(program)}"]` : '';
    if (chapter === 'Whole Subject') {
        const weekSelect = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(subject)}"]${trackSelector}${progSelector}`) ||
                           document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(subject)}"]`);
        return weekSelect ? weekSelect.value : '';
    } else {
        const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]${trackSelector}${progSelector}`) ||
                           document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
        return weekSelect ? weekSelect.value : '';
    }
};

window.renderMonthlyTargetDailyAllocations = function () {
    const container = document.getElementById('mt-daily-allocations-container');
    const countBadge = document.getElementById('mt-daily-allocation-count-badge');
    if (!container) return;

    const savedScrollTop = container.scrollTop;
    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();

    const checkedTargets = [];
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const track = ws.getAttribute('data-track');
        const prog = ws.getAttribute('data-program');
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({
            track: track,
            program: prog,
            subject: sub,
            chapter: 'Whole Subject',
            displayTitle: `ðŸ“š ${sub} (${prog || 'Whole Subject'})`,
            isSubjectTarget: true,
            totalSize: totalSize
        });
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const track = cb.getAttribute('data-track');
        const prog = cb.getAttribute('data-program');
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({
            track: track,
            program: prog,
            subject: sub,
            chapter: ch,
            displayTitle: `${ch}: ${sub}${prog ? ` (${prog})` : ''}`,
            isSubjectTarget: false,
            totalSize: totalSize
        });
    });

    if (checkedTargets.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-8 px-4 text-center text-slate-400 flex flex-col items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <div class="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 shadow-inner">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <span class="text-xs font-black text-slate-600 dark:text-slate-300">No Chapters Selected</span>
                <span class="text-[10px] text-slate-400 max-w-[280px]">Check chapters or whole subjects above to configure daily target dates and fractional allocations.</span>
            </div>
        `;
        if (countBadge) countBadge.textContent = "0 Scheduled";
        return;
    }

    let totalAllocationsCount = 0;
    const scheduledDaysSet = new Set();
    let html = '';

    checkedTargets.forEach((target) => {
        const key = target.subject + '|||' + target.chapter;
        const color = window.getSubjectColor ? window.getSubjectColor(target.subject) : '#6366f1';

        // Recalculate daily allocations if totalSize is present
        if (target.totalSize && target.totalSize > 0 && window.recalculateDailyAllocationsForChapter) {
            window.recalculateDailyAllocationsForChapter(target.subject, target.chapter, target.totalSize);
        }

        const allocations = window.monthlyTargetDailyAllocations[key] || [];

        // Check weeks spanned by this target's daily allocations
        const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(target.subject, target.chapter, target.track, target.program) : '';
        const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];

        let sumAllocated = 0;
        const weeksSpanned = new Set();
        allocations.forEach(a => {
            if (a.portionSize) sumAllocated += parseInt(a.portionSize, 10) || 0;
            if (a.dayKey) {
                scheduledDaysSet.add(a.dayKey);
                const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey, targetMonthDate) : '';
                if (wk) weeksSpanned.add(wk);
            }
            totalAllocationsCount++;
        });

        // Week badge: Multi-week or specific week
        let weekBadgeHtml = '';
        if (weeksSpanned.size > 1) {
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Spanning multiple weeks: ${Array.from(weeksSpanned).join(', ')}">ðŸ“… Multi-Week (${weeksSpanned.size}W)</span>`;
        } else if (weeksSpanned.size === 1) {
            const singleWk = Array.from(weeksSpanned)[0];
            const weekRangeDates = singleWk.split(' - ');
            const weekShort = weekRangeDates.length === 2 ? `${weekRangeDates[0]} - ${weekRangeDates[1]}` : singleWk;
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Bound to week ${singleWk}">ðŸ“… ${weekShort}</span>`;
        } else if (targetWeekKey) {
            const weekRangeDates = targetWeekKey.split(' - ');
            const weekShort = weekRangeDates.length === 2 ? `${weekRangeDates[0]} - ${weekRangeDates[1]}` : targetWeekKey;
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Bound to week ${targetWeekKey}">ðŸ“… ${weekShort}</span>`;
        } else {
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50 flex items-center gap-1" title="No week bound (Monthly only target)">ðŸ“… No Week (Month)</span>`;
        }

        // Allocation status badge
        let allocationBadgeHtml = '';
        if (target.totalSize) {
            if (allocations.length === 0) {
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">Size: ${target.totalSize}</span>`;
            } else if (sumAllocated === target.totalSize) {
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">âœ“ ${sumAllocated}/${target.totalSize} (100%)</span>`;
            } else if (sumAllocated < target.totalSize) {
                const left = target.totalSize - sumAllocated;
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">â³ ${sumAllocated}/${target.totalSize} (${left} left)</span>`;
            } else {
                const over = sumAllocated - target.totalSize;
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-0.5" title="100% completed + Extra/Repeat target">â­ ${sumAllocated}/${target.totalSize} (+${over} Extra)</span>`;
            }
        } else {
            allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">${allocations.length} Day(s)</span>`;
        }

        // Generate rows HTML using allDays of the month
        let rowsHtml = '';
        if (allocations.length === 0) {
            rowsHtml = `
                <div class="py-2.5 text-center text-[10px] text-slate-400 italic bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    No days assigned yet. Click "âš¡ Split" or "+ Add Day" below.
                </div>
            `;
        } else {
            let runningSum = 0;
            allocations.forEach((alloc, rowIdx) => {
                const prevSum = runningSum;
                const portionVal = parseInt(alloc.portionSize, 10) || 0;
                runningSum += portionVal;

                // Star condition: chapter has totalSize and previous allocations already reached/exceeded 100%
                const isStar = Boolean(target.totalSize && target.totalSize > 0 && prevSum >= target.totalSize);

                let dayOptions = '<option value="">-- Day --</option>';
                if (targetWeekKey) {
                    const weekDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate, targetWeekKey) : [];
                    const weekKeysSet = new Set(weekDays.map(d => d.key));
                    const otherDays = allDays.filter(d => !weekKeysSet.has(d.key));

                    const weekRangeDates = targetWeekKey.split(' - ');
                    const weekShort = weekRangeDates.length === 2 ? `${weekRangeDates[0]} - ${weekRangeDates[1]}` : targetWeekKey;

                    dayOptions += `<optgroup label="ðŸ“… Bound Week (${weekShort})">`;
                    weekDays.forEach(d => {
                        const isSel = alloc.dayKey === d.key;
                        dayOptions += `<option value="${d.key}" ${isSel ? 'selected' : ''}>${d.label}</option>`;
                    });
                    dayOptions += `</optgroup>`;

                    if (otherDays.length > 0) {
                        dayOptions += `<optgroup label="ðŸ“… Other Month Days (Multi-Week)">`;
                        otherDays.forEach(d => {
                            const isSel = alloc.dayKey === d.key;
                            dayOptions += `<option value="${d.key}" ${isSel ? 'selected' : ''}>${d.label}</option>`;
                        });
                        dayOptions += `</optgroup>`;
                    }
                } else {
                    allDays.forEach(d => {
                        const isSel = alloc.dayKey === d.key;
                        dayOptions += `<option value="${d.key}" ${isSel ? 'selected' : ''}>${d.label}</option>`;
                    });
                }

                const rowBgClass = isStar
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-600/60 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-700/60 shadow-xs';

                const dayBadge = isStar
                    ? `<span class="text-[9.5px] sm:text-[10px] font-black text-amber-500 shrink-0 w-6 sm:w-7 text-center" title="Extra/Repeat Target (Already done 100%)">â­D${rowIdx + 1}</span>`
                    : `<span class="text-[9.5px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 shrink-0 w-6 sm:w-7 text-center">D${rowIdx + 1}</span>`;

                rowsHtml += `
                    <div class="mt-daily-alloc-row flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl ${rowBgClass} border transition-all w-full min-w-0">
                        <!-- Day Badge -->
                        <div class="order-1 sm:order-1 shrink-0 flex items-center justify-center">
                            ${dayBadge}
                        </div>

                        <!-- Day Select Dropdown -->
                        <select onchange="window.updateDailyAllocationDay('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, this.value, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="mt-daily-day-select order-2 sm:order-2 flex-1 min-w-[85px] sm:min-w-[115px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs truncate cursor-pointer h-8"
                            title="Select Target Day">
                            ${dayOptions}
                        </select>

                        <!-- Portion/Page Size Input -->
                        <div class="relative w-14 sm:w-16 shrink-0 order-3 sm:order-4">
                            <input type="number" min="1" placeholder="Size" value="${(alloc.portionSize !== null && alloc.portionSize !== undefined) ? alloc.portionSize : ''}"
                                oninput="window.updateDailyAllocationSize('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, this.value, this)"
                                onchange="window.renderMonthlyTargetDailyAllocations()"
                                class="mt-daily-size-input w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-1 sm:px-1.5 py-1 text-xs sm:text-sm text-slate-900 dark:text-white font-black outline-none text-center shadow-xs focus:ring-2 focus:ring-emerald-500 h-8"
                                title="Daily Target Pages/Units" />
                        </div>

                        <!-- Remove button -->
                        <button type="button" onclick="window.removeDailyAllocationRow('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx})"
                            class="order-4 sm:order-5 w-7.5 h-7.5 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg sm:rounded-xl transition-all active:scale-90"
                            title="Remove day allocation">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <!-- Fraction Quick Pills: 1/2, 1/3, 1/4, 1/5, 1/10, All (Order 5 on mobile = Full width Line 2; Order 3 on desktop = inline) -->
                        <div class="mt-fraction-pills-group order-5 sm:order-3 w-full basis-full sm:basis-auto sm:w-auto flex items-center gap-0.5 shrink-0 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 mt-1 sm:mt-0">
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 0.5, '1/2')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === '1/2' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate 1/2 of chapter size">1/2</button>
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 0.33333, '1/3')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === '1/3' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate 1/3 of chapter size">1/3</button>
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 0.25, '1/4')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === '1/4' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate 1/4 of chapter size">1/4</button>
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 0.2, '1/5')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === '1/5' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate 1/5 of chapter size">1/5</button>
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 0.1, '1/10')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === '1/10' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate 1/10 of chapter size">1/10</button>
                            <button type="button" onclick="window.applyFractionToDailyAllocation('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', ${rowIdx}, 1.0, 'All')"
                                class="flex-1 sm:flex-none h-6.5 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-md ${alloc.fraction === 'All' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'} active:scale-95 transition-all" title="Allocate all remaining chapter size">All</button>
                        </div>
                    </div>
                `;
            });
        }

        html += `
            <div class="mt-daily-target-card p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-800 shadow-xs space-y-2 transition-all" data-daily-target-key="${CSS.escape(key)}">
                <!-- Header -->
                <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2 flex-wrap sm:flex-nowrap">
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                        <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style="background-color: ${color}"></span>
                        <h5 class="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">${target.displayTitle}</h5>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0 flex-wrap" data-alloc-badge-key="${CSS.escape(key)}">
                        ${weekBadgeHtml}
                        ${allocationBadgeHtml}
                    </div>
                </div>

                <!-- Action Bar & Split buttons -->
                <div class="flex items-center justify-between gap-1.5 flex-wrap">
                    <div class="grid grid-cols-5 sm:flex items-center gap-1 w-full sm:w-auto flex-1 sm:flex-none">
                        <button type="button" onclick="window.splitChapterAcrossDays('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', 2, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-[9px] font-black transition-all active:scale-95 min-h-[30px] flex items-center justify-center text-center">
                            âš¡ 2<span class="hidden sm:inline"> Days</span><span class="sm:hidden">D</span>
                        </button>
                        <button type="button" onclick="window.splitChapterAcrossDays('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', 3, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-[9px] font-black transition-all active:scale-95 min-h-[30px] flex items-center justify-center text-center">
                            âš¡ 3<span class="hidden sm:inline"> Days</span><span class="sm:hidden">D</span>
                        </button>
                        <button type="button" onclick="window.splitChapterAcrossDays('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', 4, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-[9px] font-black transition-all active:scale-95 min-h-[30px] flex items-center justify-center text-center">
                            âš¡ 4<span class="hidden sm:inline"> Days</span><span class="sm:hidden">D</span>
                        </button>
                        <button type="button" onclick="window.splitChapterAcrossDays('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', 5, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-[9px] font-black transition-all active:scale-95 min-h-[30px] flex items-center justify-center text-center">
                            âš¡ 5<span class="hidden sm:inline"> Days</span><span class="sm:hidden">D</span>
                        </button>
                        <button type="button" onclick="window.splitChapterAcrossDays('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', 7, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                            class="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-[9px] font-black transition-all active:scale-95 min-h-[30px] flex items-center justify-center text-center">
                            âš¡ 7<span class="hidden sm:inline"> Days</span><span class="sm:hidden">D</span>
                        </button>
                    </div>
                    <button type="button" onclick="window.addDailyAllocationRow('${CSS.escape(target.subject)}', '${CSS.escape(target.chapter)}', '', null, '${CSS.escape(target.track || '')}', '${CSS.escape(target.program || '')}')"
                        class="w-full sm:w-auto px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/50 text-[9.5px] font-black transition-all active:scale-95 flex items-center justify-center gap-1 min-h-[30px]">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                        <span>Add Day</span>
                    </button>
                </div>

                <!-- Daily Allocation Rows -->
                <div class="space-y-2">
                    ${rowsHtml}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    container.scrollTop = savedScrollTop;
    requestAnimationFrame(() => {
        if (container) container.scrollTop = savedScrollTop;
    });

    if (countBadge) {
        const dayCount = scheduledDaysSet.size;
        countBadge.textContent = totalAllocationsCount > 0
            ? `${totalAllocationsCount} Targets (${dayCount} Days)`
            : "0 Scheduled";
    }

    if (typeof window.updateChapterMultiWeekBadges === 'function') {
        window.updateChapterMultiWeekBadges();
    }
};

window.updateDailyAllocationBadgesInPlace = function (subject, chapter) {
    const key = subject + '|||' + chapter;
    const badgeContainer = document.querySelector(`[data-alloc-badge-key="${CSS.escape(key)}"]`);
    const countBadge = document.getElementById('mt-daily-allocation-count-badge');

    const allocations = (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key]) || [];
    let sumAllocated = 0;
    allocations.forEach(a => {
        if (a.portionSize) sumAllocated += parseInt(a.portionSize, 10) || 0;
    });

    let totalSize = null;
    if (chapter === 'Whole Subject') {
        const wholeSubSizeEl = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]`);
        totalSize = wholeSubSizeEl && wholeSubSizeEl.value ? parseInt(wholeSubSizeEl.value, 10) : null;
    } else {
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
        totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
    }

    if (badgeContainer) {
        const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
        const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(subject, chapter) : '';

        const weeksSpanned = new Set();
        allocations.forEach(a => {
            if (a.dayKey) {
                const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey, targetMonthDate) : '';
                if (wk) weeksSpanned.add(wk);
            }
        });

        let weekBadgeHtml = '';
        if (weeksSpanned.size > 1) {
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Spanning multiple weeks: ${Array.from(weeksSpanned).join(', ')}">ðŸ“… Multi-Week (${weeksSpanned.size}W)</span>`;
        } else if (weeksSpanned.size === 1) {
            const singleWk = Array.from(weeksSpanned)[0];
            const weekRangeDates = singleWk.split(' - ');
            const weekShort = weekRangeDates.length === 2 ? `${weekRangeDates[0]} - ${weekRangeDates[1]}` : singleWk;
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Bound to week ${singleWk}">ðŸ“… ${weekShort}</span>`;
        } else if (targetWeekKey) {
            const weekRangeDates = targetWeekKey.split(' - ');
            const weekShort = weekRangeDates.length === 2 ? `${weekRangeDates[0]} - ${weekRangeDates[1]}` : targetWeekKey;
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1" title="Bound to week ${targetWeekKey}">ðŸ“… ${weekShort}</span>`;
        } else {
            weekBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50 flex items-center gap-1" title="No week bound (Monthly only target)">ðŸ“… No Week (Month)</span>`;
        }

        let allocationBadgeHtml = '';
        if (totalSize) {
            if (allocations.length === 0) {
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">Size: ${totalSize}</span>`;
            } else if (sumAllocated === totalSize) {
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">âœ“ ${sumAllocated}/${totalSize} (100%)</span>`;
            } else if (sumAllocated < totalSize) {
                const left = totalSize - sumAllocated;
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">â³ ${sumAllocated}/${totalSize} (${left} left)</span>`;
            } else {
                const over = sumAllocated - totalSize;
                allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-0.5" title="100% completed + Extra/Repeat target">â­ ${sumAllocated}/${totalSize} (+${over} Extra)</span>`;
            }
        } else {
            allocationBadgeHtml = `<span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">${allocations.length} Day(s)</span>`;
        }

        badgeContainer.innerHTML = weekBadgeHtml + allocationBadgeHtml;
    }

    if (countBadge && window.monthlyTargetDailyAllocations) {
        let totalAllocationsCount = 0;
        const scheduledDaysSet = new Set();
        Object.values(window.monthlyTargetDailyAllocations).forEach(arr => {
            if (Array.isArray(arr)) {
                arr.forEach(a => {
                    if (a.dayKey) scheduledDaysSet.add(a.dayKey);
                    totalAllocationsCount++;
                });
            }
        });
        countBadge.textContent = totalAllocationsCount > 0
            ? `${totalAllocationsCount} Targets (${scheduledDaysSet.size} Days)`
            : "0 Scheduled";
    }

    if (typeof window.updateChapterMultiWeekBadges === 'function') {
        window.updateChapterMultiWeekBadges();
    }
};

window.addDailyAllocationRow = function (subject, chapter, defaultDay = '', defaultSize = null, track = null, program = null) {
    const key = subject + '|||' + chapter;
    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};
    if (!window.monthlyTargetDailyAllocations[key]) window.monthlyTargetDailyAllocations[key] = [];

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(subject, chapter, track, program) : '';
    const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];

    let dayKeyToUse = defaultDay;

    if (targetWeekKey) {
        const weekDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate, targetWeekKey) : [];
        if (weekDays.length > 0) {
            if (dayKeyToUse && weekDays.some(d => d.key === dayKeyToUse)) {
                // keep dayKeyToUse
            } else {
                const currentAllocs = window.monthlyTargetDailyAllocations[key];
                if (currentAllocs.length > 0) {
                    const lastAlloc = currentAllocs[currentAllocs.length - 1];
                    if (lastAlloc && lastAlloc.dayKey) {
                        const lastIdxInWeek = weekDays.findIndex(d => d.key === lastAlloc.dayKey);
                        if (lastIdxInWeek !== -1 && lastIdxInWeek + 1 < weekDays.length) {
                            dayKeyToUse = weekDays[lastIdxInWeek + 1].key;
                        } else {
                            dayKeyToUse = weekDays[0].key;
                        }
                    } else {
                        dayKeyToUse = weekDays[0].key;
                    }
                } else {
                    dayKeyToUse = weekDays[0].key;
                }
            }
        }
    }

    if (!dayKeyToUse && allDays.length > 0) {
        // 1. If this chapter already has allocated rows, pick the next day after the last allocated row
        const currentAllocs = window.monthlyTargetDailyAllocations[key];
        if (currentAllocs.length > 0) {
            const lastAlloc = currentAllocs[currentAllocs.length - 1];
            if (lastAlloc && lastAlloc.dayKey) {
                const lastIdx = allDays.findIndex(d => d.key === lastAlloc.dayKey);
                if (lastIdx !== -1 && lastIdx + 1 < allDays.length) {
                    dayKeyToUse = allDays[lastIdx + 1].key;
                }
            }
        }

        // 2. If this chapter has no rows yet, check the last allocated day of preceding chapters
        if (!dayKeyToUse) {
            const allCheckedKeys = [];
            document.querySelectorAll('.mt-ch-whole-subject:checked').forEach(ws => {
                allCheckedKeys.push(ws.getAttribute('data-subject') + '|||Whole Subject');
            });
            document.querySelectorAll('.mt-chapter-checkbox:checked').forEach(cb => {
                allCheckedKeys.push(cb.getAttribute('data-subject') + '|||' + cb.getAttribute('data-chapter'));
            });

            const currentKeyIdx = allCheckedKeys.indexOf(key);
            if (currentKeyIdx > 0) {
                for (let i = currentKeyIdx - 1; i >= 0; i--) {
                    const prevKey = allCheckedKeys[i];
                    const prevAllocs = window.monthlyTargetDailyAllocations[prevKey];
                    if (Array.isArray(prevAllocs) && prevAllocs.length > 0) {
                        const lastPrev = prevAllocs[prevAllocs.length - 1];
                        if (lastPrev && lastPrev.dayKey) {
                            const lastIdx = allDays.findIndex(d => d.key === lastPrev.dayKey);
                            if (lastIdx !== -1 && lastIdx + 1 < allDays.length) {
                                dayKeyToUse = allDays[lastIdx + 1].key;
                                break;
                            }
                        }
                    }
                }
            }
        }

        // 3. If still not determined, use bulk start date dropdown or first day
        if (!dayKeyToUse) {
            const bulkSelect = document.getElementById('mt-bulk-assign-day-select');
            dayKeyToUse = (bulkSelect && bulkSelect.value) ? bulkSelect.value : (allDays[0] ? allDays[0].key : '');
        }
    } else if (dayKeyToUse && allDays.length > 0 && !allDays.some(d => d.key === dayKeyToUse)) {
        dayKeyToUse = allDays[0].key;
    }

    if (dayKeyToUse && !targetWeekKey) {
        const matchingWeekKey = window.findWeekForDayInMonth(dayKeyToUse, targetMonthDate);
        if (matchingWeekKey) {
            window.bindTargetToWeek(subject, chapter, matchingWeekKey, track, program);
        }
    }

    let sizeToUse = defaultSize;
    if (sizeToUse === null) {
        let totalSize = null;
        if (chapter === 'Whole Subject') {
            const wholeSubSizeEl = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${program ? `[data-program="${CSS.escape(program)}"]` : ''}`) ||
                                   document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]`);
            totalSize = wholeSubSizeEl && wholeSubSizeEl.value ? parseInt(wholeSubSizeEl.value, 10) : null;
        } else {
            const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${program ? `[data-program="${CSS.escape(program)}"]` : ''}`) ||
                              document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
            totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        }
        if (totalSize) {
            const allocatedSum = window.monthlyTargetDailyAllocations[key].reduce((sum, a) => sum + (parseInt(a.portionSize, 10) || 0), 0);
            sizeToUse = Math.max(0, totalSize - allocatedSum) || totalSize;
        }
    }

    window.monthlyTargetDailyAllocations[key].push({
        dayKey: dayKeyToUse,
        portionSize: sizeToUse,
        fraction: '',
        portionLabel: ''
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
};

window.removeDailyAllocationRow = function (subject, chapter, rowIdx) {
    const key = subject + '|||' + chapter;
    if (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key]) {
        window.monthlyTargetDailyAllocations[key].splice(rowIdx, 1);
        window.renderMonthlyTargetDailyAllocations();
        window.updateMonthlyTargetPageSummary();
    }
};

window.splitChapterAcrossDays = function (subject, chapter, numDays, track = null, program = null) {
    const key = subject + '|||' + chapter;
    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};

    let totalSize = null;
    if (chapter === 'Whole Subject') {
        const wholeSubSizeEl = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${program ? `[data-program="${CSS.escape(program)}"]` : ''}`) ||
                               document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]`);
        totalSize = wholeSubSizeEl && wholeSubSizeEl.value ? parseInt(wholeSubSizeEl.value, 10) : null;
    } else {
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${program ? `[data-program="${CSS.escape(program)}"]` : ''}`) ||
                          document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
        totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
    }

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(subject, chapter, track, program) : '';

    if (targetWeekKey) {
        // Chapter is bound to a specific week - allocate strictly within week dates
        const weekDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate, targetWeekKey) : [];
        if (weekDays.length === 0) return;

        const effectiveDays = Math.max(1, Math.min(numDays, weekDays.length));

        // Find starting index within this week by checking preceding chapters in the same week
        let startIdx = 0;
        const allCheckedTargets = [];
        document.querySelectorAll('.mt-ch-whole-subject:checked').forEach(ws => {
            allCheckedTargets.push({
                key: ws.getAttribute('data-subject') + '|||Whole Subject',
                subject: ws.getAttribute('data-subject'),
                chapter: 'Whole Subject',
                track: ws.getAttribute('data-track'),
                program: ws.getAttribute('data-program')
            });
        });
        document.querySelectorAll('.mt-chapter-checkbox:checked').forEach(cb => {
            allCheckedTargets.push({
                key: cb.getAttribute('data-subject') + '|||' + cb.getAttribute('data-chapter'),
                subject: cb.getAttribute('data-subject'),
                chapter: cb.getAttribute('data-chapter'),
                track: cb.getAttribute('data-track'),
                program: cb.getAttribute('data-program')
            });
        });

        const currentIdxInChecked = allCheckedTargets.findIndex(t => t.key === key);
        if (currentIdxInChecked > 0) {
            for (let i = currentIdxInChecked - 1; i >= 0; i--) {
                const prevT = allCheckedTargets[i];
                const prevWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(prevT.subject, prevT.chapter, prevT.track, prevT.program) : '';
                if (prevWeekKey === targetWeekKey) {
                    const prevAllocs = window.monthlyTargetDailyAllocations[prevT.key];
                    if (Array.isArray(prevAllocs) && prevAllocs.length > 0) {
                        const lastPrevAlloc = prevAllocs[prevAllocs.length - 1];
                        if (lastPrevAlloc && lastPrevAlloc.dayKey) {
                            const lastDayIdxInWeek = weekDays.findIndex(d => d.key === lastPrevAlloc.dayKey);
                            if (lastDayIdxInWeek !== -1 && lastDayIdxInWeek + 1 < weekDays.length) {
                                startIdx = lastDayIdxInWeek + 1;
                                break;
                            }
                        }
                    }
                }
            }
        }

        const basePortion = totalSize ? Math.floor(totalSize / effectiveDays) : null;
        const remainder = totalSize ? (totalSize % effectiveDays) : 0;

        const newAllocations = [];
        for (let i = 0; i < effectiveDays; i++) {
            const dayObj = weekDays[Math.min(startIdx + i, weekDays.length - 1)];
            const daySize = basePortion !== null ? (basePortion + (i === 0 ? remainder : 0)) : null;
            newAllocations.push({
                dayKey: dayObj ? dayObj.key : '',
                portionSize: daySize,
                fraction: `1/${effectiveDays}`,
                portionLabel: `Part ${i + 1}/${effectiveDays}`
            });
        }

        window.monthlyTargetDailyAllocations[key] = newAllocations;
        window.renderMonthlyTargetDailyAllocations();
        window.updateMonthlyTargetPageSummary();
        showToast(`âš¡ Split across ${effectiveDays} days in bound week successfully!`, "success");
        return;
    }

    // No week bound assigned - divide across month days
    const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];
    if (allDays.length === 0) return;

    const effectiveDays = Math.max(1, Math.min(numDays, allDays.length));

    const bulkSelect = document.getElementById('mt-bulk-assign-day-select');
    const selectedDay = bulkSelect ? bulkSelect.value : '';

    let startIdx = -1;

    // Check if preceding chapters in the DOM list already have allocated days
    const allCheckedKeys = [];
    document.querySelectorAll('.mt-ch-whole-subject:checked').forEach(ws => {
        allCheckedKeys.push(ws.getAttribute('data-subject') + '|||Whole Subject');
    });
    document.querySelectorAll('.mt-chapter-checkbox:checked').forEach(cb => {
        allCheckedKeys.push(cb.getAttribute('data-subject') + '|||' + cb.getAttribute('data-chapter'));
    });

    const currentKeyIdx = allCheckedKeys.indexOf(key);
    if (currentKeyIdx > 0) {
        for (let i = currentKeyIdx - 1; i >= 0; i--) {
            const prevKey = allCheckedKeys[i];
            const prevAllocs = window.monthlyTargetDailyAllocations[prevKey];
            if (Array.isArray(prevAllocs) && prevAllocs.length > 0) {
                const lastAlloc = prevAllocs[prevAllocs.length - 1];
                if (lastAlloc && lastAlloc.dayKey) {
                    const lastDayIdx = allDays.findIndex(d => d.key === lastAlloc.dayKey);
                    if (lastDayIdx !== -1 && lastDayIdx + 1 < allDays.length) {
                        startIdx = lastDayIdx + 1;
                        break;
                    }
                }
            }
        }
    }

    if (startIdx === -1 && selectedDay) {
        startIdx = allDays.findIndex(d => d.key === selectedDay);
    }

    if (startIdx === -1) {
        const todayStr = (window.Utils && Utils.formatDate) ? Utils.formatDate(new Date()) : new Date().toISOString().split('T')[0];
        startIdx = allDays.findIndex(d => d.key === todayStr);
        if (startIdx === -1 || startIdx + effectiveDays > allDays.length) startIdx = 0;
    }

    const basePortion = totalSize ? Math.floor(totalSize / effectiveDays) : null;
    const remainder = totalSize ? (totalSize % effectiveDays) : 0;

    const newAllocations = [];
    for (let i = 0; i < effectiveDays; i++) {
        const dayObj = allDays[Math.min(startIdx + i, allDays.length - 1)];
        const daySize = basePortion !== null ? (basePortion + (i === 0 ? remainder : 0)) : null;
        newAllocations.push({
            dayKey: dayObj ? dayObj.key : '',
            portionSize: daySize,
            fraction: `1/${effectiveDays}`,
            portionLabel: `Part ${i + 1}/${effectiveDays}`
        });
    }

    window.monthlyTargetDailyAllocations[key] = newAllocations;
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    showToast(`âš¡ Split across ${effectiveDays} days successfully!`, "success");
};

window.splitAllChaptersAcrossDays = function (numDays) {
    const checkedTargets = [];
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const track = ws.getAttribute('data-track');
        const prog = ws.getAttribute('data-program');
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: 'Whole Subject', totalSize: totalSize });
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const track = cb.getAttribute('data-track');
        const prog = cb.getAttribute('data-program');
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: ch, totalSize: totalSize });
    });

    if (checkedTargets.length === 0) {
        return showToast("Please check at least one chapter or whole subject first.", "error");
    }

    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];
    if (allDays.length === 0) return showToast("No days available in the active month.", "error");

    const todayStr = (window.Utils && Utils.formatDate) ? Utils.formatDate(new Date()) : new Date().toISOString().split('T')[0];
    const bulkSelect = document.getElementById('mt-bulk-assign-day-select');
    const selectedDay = bulkSelect ? bulkSelect.value : '';

    let currentMonthDayIdx = selectedDay ? allDays.findIndex(d => d.key === selectedDay) : -1;
    if (currentMonthDayIdx === -1) {
        currentMonthDayIdx = allDays.findIndex(d => d.key === todayStr);
        if (currentMonthDayIdx === -1) currentMonthDayIdx = 0;
    }

    const weekCurrentIndices = {};
    let totalAllocationsCount = 0;

    checkedTargets.forEach(target => {
        const key = target.subject + '|||' + target.chapter;
        const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(target.subject, target.chapter, target.track, target.program) : '';

        if (targetWeekKey) {
            const weekDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate, targetWeekKey) : [];
            if (weekDays.length > 0) {
                const effectiveDays = Math.max(1, Math.min(numDays, weekDays.length));
                const totalSize = target.totalSize;
                const basePortion = totalSize ? Math.floor(totalSize / effectiveDays) : null;
                const remainder = totalSize ? (totalSize % effectiveDays) : 0;

                let startIdx = weekCurrentIndices[targetWeekKey] || 0;
                if (startIdx >= weekDays.length) startIdx = 0;

                const newAllocations = [];
                for (let i = 0; i < effectiveDays; i++) {
                    const dayObj = weekDays[Math.min(startIdx + i, weekDays.length - 1)];
                    const daySize = basePortion !== null ? (basePortion + (i === 0 ? remainder : 0)) : null;
                    newAllocations.push({
                        dayKey: dayObj ? dayObj.key : '',
                        portionSize: daySize,
                        fraction: `1/${effectiveDays}`,
                        portionLabel: `Part ${i + 1}/${effectiveDays}`
                    });
                    totalAllocationsCount++;
                }
                weekCurrentIndices[targetWeekKey] = (startIdx + effectiveDays) % weekDays.length;
                window.monthlyTargetDailyAllocations[key] = newAllocations;
                return;
            }
        }

        // Unassigned to week - divide across month
        const effectiveDays = Math.max(1, Math.min(numDays, allDays.length));
        const totalSize = target.totalSize;
        const basePortion = totalSize ? Math.floor(totalSize / effectiveDays) : null;
        const remainder = totalSize ? (totalSize % effectiveDays) : 0;

        const newAllocations = [];
        for (let i = 0; i < effectiveDays; i++) {
            const dayObj = allDays[Math.min(currentMonthDayIdx, allDays.length - 1)];
            const daySize = basePortion !== null ? (basePortion + (i === 0 ? remainder : 0)) : null;
            newAllocations.push({
                dayKey: dayObj ? dayObj.key : '',
                portionSize: daySize,
                fraction: `1/${effectiveDays}`,
                portionLabel: `Part ${i + 1}/${effectiveDays}`
            });
            currentMonthDayIdx++;
            totalAllocationsCount++;
        }

        window.monthlyTargetDailyAllocations[key] = newAllocations;
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    showToast(`âš¡ Distributed ${checkedTargets.length} target(s) across ${totalAllocationsCount} total days!`, "success");
};

window.updateDailyAllocationDay = function (subject, chapter, rowIdx, dayKey, track = null, program = null) {
    const key = subject + '|||' + chapter;
    if (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key] && window.monthlyTargetDailyAllocations[key][rowIdx]) {
        window.monthlyTargetDailyAllocations[key][rowIdx].dayKey = dayKey;

        if (dayKey && rowIdx === 0) {
            const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
            const matchingWeekKey = window.findWeekForDayInMonth(dayKey, targetMonthDate);
            if (matchingWeekKey) {
                window.bindTargetToWeek(subject, chapter, matchingWeekKey, track, program);
            }
        }

        window.renderMonthlyTargetDailyAllocations();
        window.updateMonthlyTargetPageSummary();
    }
};

window.updateDailyAllocationSize = function (subject, chapter, rowIdx, sizeVal, inputEl) {
    const key = subject + '|||' + chapter;
    if (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key] && window.monthlyTargetDailyAllocations[key][rowIdx]) {
        window.monthlyTargetDailyAllocations[key][rowIdx].portionSize = sizeVal ? parseInt(sizeVal, 10) : null;
        window.monthlyTargetDailyAllocations[key][rowIdx].fraction = '';
        window.monthlyTargetDailyAllocations[key][rowIdx].portionLabel = '';

        // Deselect fraction pills in this row without destroying DOM or losing focus
        if (inputEl) {
            const rowEl = inputEl.closest('.mt-daily-alloc-row');
            if (rowEl) {
                rowEl.querySelectorAll('button[onclick*="applyFractionToDailyAllocation"]').forEach(btn => {
                    btn.className = btn.className.replace(/bg-emerald-600\s+text-white\s+shadow-xs/g, 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400');
                });
            }
        }

        window.updateDailyAllocationBadgesInPlace(subject, chapter);
        window.updateMonthlyTargetPageSummary();
    }
};

window.applyFractionToDailyAllocation = function (subject, chapter, rowIdx, fractionVal, fractionLabel) {
    const key = subject + '|||' + chapter;
    if (window.monthlyTargetDailyAllocations && window.monthlyTargetDailyAllocations[key] && window.monthlyTargetDailyAllocations[key][rowIdx]) {
        let totalSize = null;
        if (chapter === 'Whole Subject') {
            const wholeSubSizeEl = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"]`);
            totalSize = wholeSubSizeEl && wholeSubSizeEl.value ? parseInt(wholeSubSizeEl.value, 10) : null;
        } else {
            const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(chapter)}"]`);
            totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        }

        let calculatedSize = null;
        if (fractionLabel === 'All') {
            if (totalSize !== null) {
                // Calculate remaining size: totalSize minus sum of other day rows
                const otherRowsSum = window.monthlyTargetDailyAllocations[key].reduce((sum, a, idx) => {
                    if (idx === rowIdx) return sum;
                    return sum + (parseInt(a.portionSize, 10) || 0);
                }, 0);
                const remaining = totalSize - otherRowsSum;
                calculatedSize = remaining > 0 ? remaining : (otherRowsSum === 0 ? totalSize : 0);
            }
        } else {
            calculatedSize = totalSize ? Math.round(totalSize * fractionVal) : null;
        }

        window.monthlyTargetDailyAllocations[key][rowIdx].portionSize = calculatedSize;
        window.monthlyTargetDailyAllocations[key][rowIdx].fraction = fractionLabel;
        window.monthlyTargetDailyAllocations[key][rowIdx].portionLabel = fractionLabel === 'All' ? 'All Remaining' : `Fraction ${fractionLabel}`;
        window.renderMonthlyTargetDailyAllocations();
        window.updateMonthlyTargetPageSummary();
    }
};

window.autoSpreadAllChaptersAcrossDays = function (mode = 'month') {
    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];
    if (allDays.length === 0) return showToast("No days available in the active month.", "error");

    const bulkSelect = document.getElementById('mt-bulk-assign-day-select');
    const selectedStartDay = bulkSelect ? bulkSelect.value : '';
    let startIdx = selectedStartDay ? allDays.findIndex(d => d.key === selectedStartDay) : 0;
    if (startIdx === -1) startIdx = 0;

    const checkedTargets = [];
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const track = ws.getAttribute('data-track');
        const prog = ws.getAttribute('data-program');
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: 'Whole Subject', totalSize: totalSize });
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const track = cb.getAttribute('data-track');
        const prog = cb.getAttribute('data-program');
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: ch, totalSize: totalSize });
    });

    if (checkedTargets.length === 0) {
        return showToast("Please check at least one chapter or whole subject first.", "error");
    }

    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};

    let currentDayIdx = startIdx;
    let totalAllocationsSpread = 0;

    checkedTargets.forEach(target => {
        const key = target.subject + '|||' + target.chapter;
        let existingAllocs = window.monthlyTargetDailyAllocations[key];

        if (!Array.isArray(existingAllocs) || existingAllocs.length === 0) {
            const assignedDay = allDays[Math.min(currentDayIdx, allDays.length - 1)];
            const assignedDayKey = assignedDay ? assignedDay.key : '';

            window.monthlyTargetDailyAllocations[key] = [{
                dayKey: assignedDayKey,
                portionSize: target.totalSize,
                fraction: 'All',
                portionLabel: 'Full Chapter'
            }];

            currentDayIdx++;
            totalAllocationsSpread++;
        } else {
            existingAllocs.forEach((row) => {
                const assignedDay = allDays[Math.min(currentDayIdx, allDays.length - 1)];
                const assignedDayKey = assignedDay ? assignedDay.key : '';

                row.dayKey = assignedDayKey;

                currentDayIdx++;
                totalAllocationsSpread++;
            });
        }
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    showToast(`âš¡ Auto-spread ${totalAllocationsSpread} allocation(s) across days!`, "success");
};

window.spreadAllChaptersFromStartDate = function () {
    const bulkSelect = document.getElementById('mt-bulk-assign-day-select');
    const selectedDay = bulkSelect ? bulkSelect.value : '';
    if (!selectedDay) {
        return showToast("Please select a start date from the dropdown first.", "error");
    }

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const allDays = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(targetMonthDate) : [];
    if (allDays.length === 0) {
        return showToast("No days available in the active month.", "error");
    }

    let startIdx = allDays.findIndex(d => d.key === selectedDay);
    if (startIdx === -1) startIdx = 0;

    const checkedTargets = [];
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const track = ws.getAttribute('data-track');
        const prog = ws.getAttribute('data-program');
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: 'Whole Subject', totalSize: totalSize });
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const track = cb.getAttribute('data-track');
        const prog = cb.getAttribute('data-program');
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]${track ? `[data-track="${CSS.escape(track)}"]` : ''}${prog ? `[data-program="${CSS.escape(prog)}"]` : ''}`) ||
                          document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
        checkedTargets.push({ track: track, program: prog, subject: sub, chapter: ch, totalSize: totalSize });
    });

    if (checkedTargets.length === 0) {
        return showToast("Please check at least one chapter or whole subject first.", "error");
    }

    if (!window.monthlyTargetDailyAllocations) window.monthlyTargetDailyAllocations = {};

    let currentDayIdx = startIdx;
    let totalAllocationsSpread = 0;

    checkedTargets.forEach(target => {
        const key = target.subject + '|||' + target.chapter;
        let existingAllocs = window.monthlyTargetDailyAllocations[key];

        if (!Array.isArray(existingAllocs) || existingAllocs.length === 0) {
            const assignedDay = allDays[Math.min(currentDayIdx, allDays.length - 1)];
            const assignedDayKey = assignedDay ? assignedDay.key : '';

            window.monthlyTargetDailyAllocations[key] = [{
                dayKey: assignedDayKey,
                portionSize: target.totalSize,
                fraction: 'All',
                portionLabel: 'Full Chapter'
            }];

            currentDayIdx++;
            totalAllocationsSpread++;
        } else {
            existingAllocs.forEach((row) => {
                const assignedDay = allDays[Math.min(currentDayIdx, allDays.length - 1)];
                const assignedDayKey = assignedDay ? assignedDay.key : '';

                row.dayKey = assignedDayKey;

                currentDayIdx++;
                totalAllocationsSpread++;
            });
        }
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();

    const startDayObj = allDays[startIdx];
    const startLabel = startDayObj ? startDayObj.label : selectedDay;
    showToast(`âš¡ Spread ${totalAllocationsSpread} allocation(s) across days starting from ${startLabel}!`, "success");
};

// Backward compatibility alias
window.applyBulkDayToAllChapters = function () {
    if (typeof window.spreadAllChaptersFromStartDate === 'function') {
        window.spreadAllChaptersFromStartDate();
    }
};

window.clearAllDailyAllocations = function () {
    window.monthlyTargetDailyAllocations = {};
    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    showToast("All daily target allocations cleared.", "success");
};

window.updateMonthlyTargetPageSummary = function () {
    const checkedSubjects = Array.from(document.querySelectorAll('.mt-subject-checkbox:checked')).map(cb => cb.getAttribute('data-subject'));
    const badgeCount = document.getElementById('mt-subjects-count-badge');
    if (badgeCount) {
        badgeCount.textContent = `${checkedSubjects.length} Selected`;
    }

    const dropdownLabel = document.getElementById('mt-subjects-dropdown-label');
    if (dropdownLabel) {
        if (checkedSubjects.length === 0) {
            dropdownLabel.textContent = 'Select Subjects...';
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 truncate block';
        } else if (checkedSubjects.length === 1) {
            dropdownLabel.textContent = `${checkedSubjects[0]}`;
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate block';
        } else {
            dropdownLabel.textContent = `${checkedSubjects.length} Selected: ${checkedSubjects.join(', ')}`;
            dropdownLabel.className = 'text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate block';
        }
    }

    const summarySubject = document.getElementById('mt-summary-subject-display');
    const summaryTargetCount = document.getElementById('mt-summary-target-count');
    const summaryTotalSize = document.getElementById('mt-summary-total-size');
    const bottomSummary = document.getElementById('mt-bottom-summary-text');

    if (summarySubject) {
        if (checkedSubjects.length === 0) {
            summarySubject.textContent = 'None Selected';
        } else if (checkedSubjects.length === 1) {
            summarySubject.textContent = `${checkedSubjects[0]}`;
        } else {
            summarySubject.textContent = `${checkedSubjects.length} Subjects (${checkedSubjects.join(', ')})`;
        }
    }

    let checkedCount = 0;
    let totalSizeSum = 0;
    const weekCountMap = {};

    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        checkedCount++;
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        const weekSelect = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(sub)}"]`);
        if (sizeInput && sizeInput.value) {
            totalSizeSum += parseInt(sizeInput.value, 10) || 0;
        }
        if (weekSelect && weekSelect.value) {
            weekCountMap[weekSelect.value] = (weekCountMap[weekSelect.value] || 0) + 1;
        }
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        checkedCount++;
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        if (sizeInput && sizeInput.value) {
            totalSizeSum += parseInt(sizeInput.value, 10) || 0;
        }
        if (weekSelect && weekSelect.value) {
            weekCountMap[weekSelect.value] = (weekCountMap[weekSelect.value] || 0) + 1;
        }
    });

    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];
    const weekBreakdown = [];
    weeks.forEach((w, idx) => {
        if (weekCountMap[w.key]) {
            weekBreakdown.push(`W${idx + 1}: ${weekCountMap[w.key]}`);
        }
    });

    // Daily breakdown count
    let scheduledDaysCount = 0;
    let scheduledTargetsCount = 0;
    const daysSet = new Set();
    if (window.monthlyTargetDailyAllocations) {
        Object.values(window.monthlyTargetDailyAllocations).forEach(arr => {
            if (Array.isArray(arr)) {
                arr.forEach(a => {
                    if (a.dayKey) {
                        daysSet.add(a.dayKey);
                        scheduledTargetsCount++;
                    }
                });
            }
        });
    }
    scheduledDaysCount = daysSet.size;

    if (summaryTargetCount) {
        const weekInfo = weekBreakdown.length > 0 ? ` (${weekBreakdown.join(', ')})` : '';
        const dayInfo = scheduledTargetsCount > 0 ? ` â€¢ ${scheduledTargetsCount} Day Target(s)` : '';
        summaryTargetCount.textContent = checkedCount === 1 ? `1 Target Selected${weekInfo}${dayInfo}` : `${checkedCount} Targets Selected${weekInfo}${dayInfo}`;
    }
    if (summaryTotalSize) {
        summaryTotalSize.textContent = totalSizeSum > 0 ? `${totalSizeSum} Pages / Units` : 'No Size Specified';
    }
    if (bottomSummary) {
        if (checkedCount === 0) {
            bottomSummary.textContent = 'Select at least 1 chapter or whole subject across your chosen subjects to create targets.';
        } else {
            const subLabel = checkedSubjects.length === 1 ? '1 subject' : `${checkedSubjects.length} subjects`;
            const weekStr = weekBreakdown.length > 0 ? ` â€¢ Weekly: ${weekBreakdown.join(', ')}` : '';
            const dayStr = scheduledDaysCount > 0 ? ` â€¢ ${scheduledTargetsCount} Daily Target(s) across ${scheduledDaysCount} day(s)` : '';
            bottomSummary.innerHTML = `<strong>${checkedCount} target(s) selected</strong> across ${subLabel} â€¢ ${totalSizeSum > 0 ? totalSizeSum + ' total pages/units' : 'Custom scope'}${weekStr}${dayStr}`;
        }
    }
};

window.applyBulkSizeToMonthlyChapters = function () {
    const bulkInput = document.getElementById('mt-bulk-size-input');
    const bulkVal = bulkInput && bulkInput.value ? bulkInput.value : '';
    if (!bulkVal) {
        return showToast("Please enter a bulk size number first.", "error");
    }

    let appliedCount = 0;
    const wholeSubs = document.querySelectorAll('.mt-ch-whole-subject:checked');
    wholeSubs.forEach(ws => {
        const sub = ws.getAttribute('data-subject');
        const sizeInput = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        if (sizeInput) {
            sizeInput.value = bulkVal;
            appliedCount++;
            if (window.recalculateDailyAllocationsForChapter) {
                window.recalculateDailyAllocationsForChapter(sub, 'Whole Subject', bulkVal);
            }
        }
    });

    const checkboxes = document.querySelectorAll('.mt-chapter-checkbox:checked');
    checkboxes.forEach(cb => {
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        if (sizeInput) {
            sizeInput.value = bulkVal;
            appliedCount++;
            if (window.recalculateDailyAllocationsForChapter) {
                window.recalculateDailyAllocationsForChapter(sub, ch, bulkVal);
            }
        }
    });

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();

    if (appliedCount === 0) {
        showToast("No chapters or whole subjects currently selected. Check the targets you want to apply size to.", "error");
    } else {
        showToast(`Bulk size (${bulkVal}) applied to ${appliedCount} selected target(s)!`, "success");
    }
};

window.getWeeksForMonth = function (date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let curDay = 1;

    while (curDay <= totalDays) {
        const start = new Date(year, month, curDay, 0, 1, 0, 0);
        let endDay = curDay;

        while (endDay < totalDays) {
            const checkDate = new Date(year, month, endDay);
            if (checkDate.getDay() === 5) { // Friday
                break;
            }
            endDay++;
        }

        const end = new Date(year, month, endDay, 23, 59, 59, 999);
        const weekKey = window.formatDateRangeKey(start, end);
        const opt = { day: '2-digit', month: 'short' };
        const label = `Week ${weeks.length + 1}: ${start.toLocaleDateString('en-GB', opt)} - ${end.toLocaleDateString('en-GB', opt)}`;

        weeks.push({
            key: weekKey,
            start: start,
            end: end,
            label: label
        });

        curDay = endDay + 1;
    }

    return weeks;
};

window.getDaysForMonthOrWeek = function (monthDate = new Date(), weekKey = null) {
    const days = [];
    if (weekKey && weekKey !== 'none' && weekKey !== '') {
        const dates = weekKey.split(' - ');
        if (dates.length === 2) {
            const start = Utils.parseDateSafe ? Utils.parseDateSafe(dates[0]) : new Date(dates[0]);
            const end = Utils.parseDateSafe ? Utils.parseDateSafe(dates[1]) : new Date(dates[1]);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const targetMonth = monthDate ? new Date(monthDate).getMonth() : start.getMonth();
                const targetYear = monthDate ? new Date(monthDate).getFullYear() : start.getFullYear();

                let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

                while (cur <= endDay) {
                    if (monthDate && (cur.getMonth() !== targetMonth || cur.getFullYear() !== targetYear)) {
                        cur.setDate(cur.getDate() + 1);
                        continue;
                    }
                    const dayDate = new Date(cur);
                    const dateKey = Utils.formatDate(dayDate);
                    const dayStr = dayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    const wkStr = dayDate.toLocaleDateString('en-GB', { weekday: 'short' });
                    const label = `${dayStr} (${wkStr})`;
                    days.push({ key: dateKey, rawDate: dayDate, label: label });

                    cur.setDate(cur.getDate() + 1);
                }
                return days;
            }
        }
    }

    const d = new Date(monthDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= totalDays; day++) {
        const dayDate = new Date(year, month, day);
        const dateKey = Utils.formatDate(dayDate);
        const dayStr = dayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const wkStr = dayDate.toLocaleDateString('en-GB', { weekday: 'short' });
        const label = `${dayStr} (${wkStr})`;
        days.push({ key: dateKey, rawDate: dayDate, label: label });
    }
    return days;
};

window.populateMonthlyTargetWeeksAndDays = function (monthDate = new Date(), selectedWeekKey = null, selectedDayKey = null) {
    const weekSelect = document.getElementById('mt-select-week-range');
    const daySelect = document.getElementById('mt-select-day');
    const bulkDaySelect = document.getElementById('mt-bulk-assign-day-select');

    const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(monthDate) : [];
    if (weekSelect) {
        weekSelect.innerHTML = '<option value="">-- None (Only Monthly Target) --</option>';
        weeks.forEach(w => {
            weekSelect.innerHTML += `<option value="${w.key}">${w.label}</option>`;
        });
        if (selectedWeekKey && weeks.some(w => w.key === selectedWeekKey)) {
            weekSelect.value = selectedWeekKey;
        } else {
            weekSelect.value = '';
        }
    }

    const days = window.getDaysForMonthOrWeek ? window.getDaysForMonthOrWeek(monthDate) : [];
    if (bulkDaySelect) {
        const prevBulkVal = bulkDaySelect.value;
        bulkDaySelect.innerHTML = '<option value="">-- Choose Start Date --</option>';
        days.forEach(d => {
            bulkDaySelect.innerHTML += `<option value="${d.key}">${d.label}</option>`;
        });
        if (prevBulkVal && days.some(d => d.key === prevBulkVal)) {
            bulkDaySelect.value = prevBulkVal;
        }
    }

    if (daySelect) {
        daySelect.innerHTML = '<option value="">-- None (Not Assigned to Day) --</option>';
        days.forEach(d => {
            daySelect.innerHTML += `<option value="${d.key}">${d.label}</option>`;
        });
        if (selectedDayKey && days.some(d => d.key === selectedDayKey)) {
            daySelect.value = selectedDayKey;
        } else {
            daySelect.value = '';
        }
    }

    window.renderMonthlyTargetDailyAllocations();
};

window.updateMonthlyTargetDaysDropdown = function (monthDate = new Date(), weekKey = null, selectedDayKey = null) {
    const daySelect = document.getElementById('mt-select-day');
    if (!daySelect) return;

    const days = window.getDaysForMonthOrWeek(monthDate, weekKey);
    daySelect.innerHTML = '<option value="">-- None (Not Assigned to Day) --</option>';
    days.forEach(d => {
        daySelect.innerHTML += `<option value="${d.key}">${d.label}</option>`;
    });

    if (selectedDayKey && days.some(d => d.key === selectedDayKey)) {
        daySelect.value = selectedDayKey;
    } else {
        daySelect.value = '';
    }
};

window.handleMonthlyTargetWeekChange = function () {
    const weekSelect = document.getElementById('mt-select-week-range');
    const targetMonthDate = window.currentMonthlyTargetsDate || new Date();
    const weekKey = weekSelect ? weekSelect.value : null;
    window.updateMonthlyTargetDaysDropdown(targetMonthDate, weekKey, null);
};

window.handleMonthlyTargetDayChange = function () {
    const daySelect = document.getElementById('mt-select-day');
    const weekSelect = document.getElementById('mt-select-week-range');
    if (!daySelect || !weekSelect) return;

    const dayKey = daySelect.value;
    if (dayKey && (!weekSelect.value || weekSelect.value === '')) {
        const d = window.parseDailyTargetDateKey ? window.parseDailyTargetDateKey(dayKey) : Utils.parseDateSafe(dayKey);
        if (d && !isNaN(d.getTime())) {
            const range = window.getWeeklyTargetRange(d);
            const weekKey = window.formatDateRangeKey(range.start, range.end);
            if (Array.from(weekSelect.options).some(o => o.value === weekKey)) {
                weekSelect.value = weekKey;
            }
        }
    }
};

window.addMonthlyTarget = function () {
    const range = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate || new Date());
    const targetMonthKey = window.formatMonthRangeKey(range.start, range.end);

    const checkedSubjectCbs = Array.from(document.querySelectorAll('.mt-subject-checkbox:checked'));
    if (checkedSubjectCbs.length === 0) {
        return showToast("Please select at least one program and subject on the left.", "error");
    }

    if (!window.monthlyTargetsDatabase) window.monthlyTargetsDatabase = {};
    if (!window.monthlyTargetsDatabase[targetMonthKey]) window.monthlyTargetsDatabase[targetMonthKey] = [];

    const weekSelectEl = document.getElementById('mt-select-week-range');
    const selectedWeekKey = weekSelectEl ? weekSelectEl.value : '';
    const daySelectEl = document.getElementById('mt-select-day');
    const selectedDayKey = daySelectEl ? daySelectEl.value : '';

    // Collect targets to add across all checked subjects
    const targetsToAdd = [];

    checkedSubjectCbs.forEach(subCb => {
        const trackId = subCb.getAttribute('data-track');
        const progName = subCb.getAttribute('data-program');
        const subject = subCb.getAttribute('data-subject');

        // 1. Whole Subject for this subject
        const wholeSubCheckbox = document.querySelector(`.mt-ch-whole-subject[data-subject="${CSS.escape(subject)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
        const wholeSubSizeEl = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(subject)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
        const wholeSubWeekEl = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(subject)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
        if (wholeSubCheckbox && wholeSubCheckbox.checked) {
            const totalSize = wholeSubSizeEl && wholeSubSizeEl.value ? parseInt(wholeSubSizeEl.value, 10) : null;
            const weekKey = (wholeSubWeekEl ? wholeSubWeekEl.value : selectedWeekKey) || null;
            targetsToAdd.push({
                track: trackId,
                program: progName,
                subject: subject,
                chapter: 'Whole Subject',
                targetType: 'subject',
                scope: 'Whole Subject',
                totalChapterSize: totalSize,
                targetWeek: weekKey
            });
        }

        // 2. Individual Chapters for this subject
        const checkedBoxes = document.querySelectorAll(`.mt-chapter-checkbox:checked[data-subject="${CSS.escape(subject)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
        checkedBoxes.forEach(cb => {
            const ch = cb.getAttribute('data-chapter');
            const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(ch)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
            const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(subject)}"][data-chapter="${CSS.escape(ch)}"][data-track="${CSS.escape(trackId)}"][data-program="${CSS.escape(progName)}"]`);
            const totalSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
            const weekKey = (weekSelect ? weekSelect.value : selectedWeekKey) || null;
            targetsToAdd.push({
                track: trackId,
                program: progName,
                subject: subject,
                chapter: ch,
                targetType: 'chapter',
                scope: 'Whole Chapter',
                totalChapterSize: totalSize,
                targetWeek: weekKey
            });
        });
    });

    if (targetsToAdd.length === 0) {
        return showToast("Please select at least one chapter or whole subject target (minimum 1 is required).", "error");
    }

    let addedCount = 0;
    let skippedDuplicateCount = 0;
    let connectedToWeek = false;
    let connectedToDay = false;
    const addedSubjectsSet = new Set();
    const connectedWeeksSet = new Set();
    const connectedDaysSet = new Set();
    let totalDailyAllocationsAdded = 0;

    targetsToAdd.forEach(item => {
        const trackId = item.track;
        const progName = item.program;
        const isSubjectTarget = item.targetType === 'subject';
        const subject = item.subject;
        const finalChapter = item.chapter;

        if (window.isSubjectPassed && window.isSubjectPassed(trackId, subject, progName)) {
            return;
        }

        if (!isSubjectTarget && window.isChapterSkipped && window.isChapterSkipped(trackId, subject, finalChapter)) {
            return;
        }

        // Duplicate check
        if (isSubjectTarget) {
            const exists = window.monthlyTargetsDatabase[targetMonthKey].some(t =>
                t.track === trackId && t.program === progName && t.subject === subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters')
            );
            if (exists) {
                skippedDuplicateCount++;
                return;
            }
        } else {
            const exists = window.monthlyTargetsDatabase[targetMonthKey].some(t =>
                t.track === trackId && t.program === progName && t.subject === subject && t.chapter === finalChapter && t.targetType !== 'subject'
            );
            if (exists) {
                skippedDuplicateCount++;
                return;
            }
        }

        // Baseline completion status
        let isCompletedBefore = false;
        let completedAtBefore = null;

        if (isSubjectTarget) {
            isCompletedBefore = window.isSubjectCompleted ? window.isSubjectCompleted(trackId, subject) : false;
            completedAtBefore = isCompletedBefore ? new Date().toISOString() : null;
        } else {
            const foundTask = window.findTaskChapter(trackId, subject, finalChapter);
            isCompletedBefore = foundTask ? (foundTask.subTask.completed || false) : false;
            completedAtBefore = foundTask ? (foundTask.subTask.completedAt || null) : null;
        }

        const mtId = item.id || `mt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        window.monthlyTargetsDatabase[targetMonthKey].push({
            id: mtId,
            track: trackId,
            program: progName,
            subject: subject,
            chapter: finalChapter,
            targetType: item.targetType,
            completed: isCompletedBefore,
            completedAt: completedAtBefore,
            scope: item.scope,
            totalChapterSize: item.totalChapterSize,
            targetWeek: item.targetWeek || null,
            updatedAt: Date.now()
        });
        addedCount++;
        addedSubjectsSet.add(subject);

        // Auto-connect to Weekly Targets (derived from daily allocations if present, otherwise item's selected targetWeek)
        const allocKey = subject + '|||' + finalChapter;
        const dailyAllocs = (window.monthlyTargetDailyAllocations && (window.monthlyTargetDailyAllocations[allocKey] || window.monthlyTargetDailyAllocations[subject + '|||' + finalChapter + '|||' + progName])) || [];

        const targetWeeksSet = new Set();
        if (dailyAllocs.length > 0) {
            dailyAllocs.forEach(a => {
                if (a.dayKey) {
                    const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey, range.start) : '';
                    if (wk) targetWeeksSet.add(wk);
                }
            });
        }
        if (targetWeeksSet.size === 0 && item.targetWeek) {
            targetWeeksSet.add(item.targetWeek);
        }

        const monthWeeksList = window.getWeeksForMonth ? window.getWeeksForMonth(range.start) : [];
        const spannedWeekNums = [];
        monthWeeksList.forEach((mw, idx) => {
            if (targetWeeksSet.has(mw.key)) {
                spannedWeekNums.push(`W${idx + 1}`);
            }
        });

        targetWeeksSet.forEach(targetWeekKey => {
            const canonicalWeekKey = window.getCanonicalWeeklyRangeKey ? (window.getCanonicalWeeklyRangeKey(targetWeekKey) || targetWeekKey) : targetWeekKey;
            if (!window.weeklyTargetsDatabase) window.weeklyTargetsDatabase = {};
            if (!window.weeklyTargetsDatabase[canonicalWeekKey]) window.weeklyTargetsDatabase[canonicalWeekKey] = [];

            const wtList = window.weeklyTargetsDatabase[canonicalWeekKey];
            const wtExists = isSubjectTarget
                ? wtList.some(t => t.track === trackId && t.program === progName && t.subject === subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters'))
                : wtList.some(t => t.track === trackId && t.program === progName && t.subject === subject && t.chapter === finalChapter && t.targetType !== 'subject');

            if (!wtExists) {
                wtList.push({
                    id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    monthlyTargetId: mtId,
                    source: 'monthly',
                    targetMonth: targetMonthKey,
                    track: trackId,
                    program: progName,
                    subject: subject,
                    chapter: finalChapter,
                    targetType: item.targetType,
                    completed: isCompletedBefore,
                    completedAt: completedAtBefore,
                    scope: item.scope,
                    totalChapterSize: item.totalChapterSize,
                    targetWeek: targetWeekKey,
                    dividedWeekKey: targetWeekKey,
                    spannedWeekNums: spannedWeekNums,
                    isMultiWeek: spannedWeekNums.length > 1,
                    updatedAt: Date.now()
                });
                connectedToWeek = true;
                connectedWeeksSet.add(canonicalWeekKey);
            }
        });

        if (dailyAllocs.length > 0) {
            let runningSum = 0;
            dailyAllocs.forEach(alloc => {
                if (alloc.dayKey) {
                    if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};
                    if (!window.dailyTargetsDatabase[alloc.dayKey]) window.dailyTargetsDatabase[alloc.dayKey] = [];

                    const prevSum = runningSum;
                    const portionSize = alloc.portionSize || item.totalChapterSize;
                    runningSum += (parseInt(portionSize, 10) || 0);

                    const isStar = Boolean(item.totalChapterSize && item.totalChapterSize > 0 && prevSum >= item.totalChapterSize);
                    const portionLabel = alloc.portionLabel || (isStar ? 'â­ Extra Setup' : (alloc.fraction ? `Fraction ${alloc.fraction}` : ''));

                    const dtList = window.dailyTargetsDatabase[alloc.dayKey];
                    const dtExists = isSubjectTarget
                        ? dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters') && (t.portionLabel === portionLabel || t.totalChapterSize === portionSize))
                        : dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === subject && t.chapter === finalChapter && t.targetType !== 'subject' && (t.portionLabel === portionLabel || t.totalChapterSize === portionSize));

                    if (!dtExists) {
                        dtList.push({
                            id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            monthlyTargetId: mtId,
                            source: 'monthly',
                            targetMonth: targetMonthKey,
                            track: trackId,
                            program: progName,
                            subject: subject,
                            chapter: finalChapter,
                            targetType: item.targetType,
                            completed: isCompletedBefore,
                            completedAt: completedAtBefore,
                            scope: item.scope,
                            totalChapterSize: portionSize,
                            portionSize: portionSize,
                            portionLabel: portionLabel,
                            fraction: alloc.fraction || '',
                            isStarTarget: isStar,
                            updatedAt: Date.now()
                        });
                        connectedToDay = true;
                        connectedDaysSet.add(alloc.dayKey);
                        totalDailyAllocationsAdded++;
                    }
                }
            });
        } else if (selectedDayKey) {
            // Fallback if single day selected
            if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};
            if (!window.dailyTargetsDatabase[selectedDayKey]) window.dailyTargetsDatabase[selectedDayKey] = [];

            const dtList = window.dailyTargetsDatabase[selectedDayKey];
            const dtExists = isSubjectTarget
                ? dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === subject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters'))
                : dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === subject && t.chapter === finalChapter && t.targetType !== 'subject');

            if (!dtExists) {
                dtList.push({
                    id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    monthlyTargetId: mtId,
                    source: 'monthly',
                    targetMonth: targetMonthKey,
                    track: trackId,
                    program: progName,
                    subject: subject,
                    chapter: finalChapter,
                    targetType: item.targetType,
                    completed: isCompletedBefore,
                    completedAt: completedAtBefore,
                    scope: item.scope,
                    totalChapterSize: item.totalChapterSize,
                    updatedAt: Date.now()
                });
                connectedToDay = true;
                connectedDaysSet.add(selectedDayKey);
                totalDailyAllocationsAdded++;
            }
        }
    });

    if (addedCount === 0) {
        if (skippedDuplicateCount > 0) {
            return showToast("Selected target(s) are already in your monthly targets list.", "error");
        }
        return showToast("No targets added.", "error");
    }

    window.markLocalMutation(`add_monthly_targets_${addedCount}`);

    // Update active month to the month where target was added
    window.currentMonthlyTargetsDate = range.start;
    const monthSelectEl = document.getElementById('mt-select-month');
    if (monthSelectEl) monthSelectEl.value = targetMonthKey;

    if (connectedToWeek) {
        if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets();
        if (typeof window.autoSyncWeeklyToDailyTargets === 'function') window.autoSyncWeeklyToDailyTargets();
    }
    if (connectedToDay) {
        if (typeof window.renderDailyTargets === 'function') window.renderDailyTargets();
    }

    FirebaseService.saveToCloud();
    renderUI();

    // Smoothly return to Daily Actions page and focus monthly targets section
    window.switchPage('daily-actions');
    setTimeout(() => {
        const targetSection = document.getElementById('monthly-targets-section');
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 80);

    const subCountStr = addedSubjectsSet.size > 1 ? ` across ${addedSubjectsSet.size} subjects` : '';
    let toastMsg = addedCount === 1 ? "1 Monthly target added!" : `${addedCount} Monthly targets added${subCountStr}!`;
    if (connectedToWeek && connectedToDay) {
        const weekCountLabel = connectedWeeksSet.size > 1 ? `${connectedWeeksSet.size} Weeks` : 'Weekly';
        const dayCountLabel = connectedDaysSet.size > 1 ? `${totalDailyAllocationsAdded} Daily targets across ${connectedDaysSet.size} days` : 'Daily target';
        toastMsg += ` (Connected to ${weekCountLabel} & ${dayCountLabel})`;
    } else if (connectedToWeek) {
        const weekCountLabel = connectedWeeksSet.size > 1 ? `${connectedWeeksSet.size} Weeks` : 'Weekly target';
        toastMsg += ` (Connected to ${weekCountLabel})`;
    } else if (connectedToDay) {
        const dayCountLabel = connectedDaysSet.size > 1 ? `${totalDailyAllocationsAdded} Daily targets across ${connectedDaysSet.size} days` : 'Daily target';
        toastMsg += ` (Connected to ${dayCountLabel})`;
    }
    showToast(toastMsg, "success");
};
window.openAddMonthlyTargetPage = function (targetDate = null) {
    window.editingMonthlyTargetIndex = null;
    window.editingMonthlyTargetMonthKey = null;

    if (targetDate) {
        if (typeof targetDate === 'string') {
            const parsed = (window.Utils && Utils.parseStart) ? Utils.parseStart(targetDate) : new Date(targetDate);
            if (parsed && !isNaN(parsed.getTime())) {
                window.currentMonthlyTargetsDate = parsed;
            }
        } else if (targetDate instanceof Date && !isNaN(targetDate.getTime())) {
            window.currentMonthlyTargetsDate = targetDate;
        }
    } else if (!window.currentMonthlyTargetsDate) {
        window.currentMonthlyTargetsDate = new Date();
    }

    const container = document.getElementById('page-monthly-target-setup');
    if (!container || container.classList.contains('hidden')) {
        if (typeof window.switchPage === 'function') {
            window.switchPage('monthly-target-setup');
        }
    }

    const pageTitle = document.getElementById('mt-page-title');
    if (pageTitle) pageTitle.textContent = "Monthly Target Setup";

    const pageSubtitle = document.getElementById('mt-page-subtitle');
    if (pageSubtitle) pageSubtitle.textContent = "Configure program, subject, chapter breakdown, sizes, and weekly/daily target synchronization";

    const modeBadge = document.getElementById('mt-page-mode-badge');
    if (modeBadge) modeBadge.textContent = "Target Setup";

    const btnBottom = document.getElementById('mt-btn-save-bottom');
    if (btnBottom) {
        btnBottom.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg><span>Add Target</span>`;
        btnBottom.setAttribute('onclick', 'window.addMonthlyTarget()');
    }

    const btnDeleteBottom = document.getElementById('mt-btn-delete-bottom');
    if (btnDeleteBottom) {
        btnDeleteBottom.classList.add('hidden');
    }

    const searchInput = document.getElementById('mt-chapter-search-input');
    if (searchInput) searchInput.value = '';

    const bulkSizeInput = document.getElementById('mt-bulk-size-input');
    if (bulkSizeInput) bulkSizeInput.value = '';

    const activeRange = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate || new Date());
    const activeMonthKey = window.formatMonthRangeKey(activeRange.start, activeRange.end);
    const monthName = activeRange.start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const monthBadge = document.getElementById('mt-page-month-badge');
    if (monthBadge) monthBadge.textContent = `${monthName}`;

    const summaryMonth = document.getElementById('mt-summary-month-display');
    if (summaryMonth) summaryMonth.textContent = `${monthName} (${activeMonthKey})`;

    const monthInput = document.getElementById('mt-setup-month-input');
    if (monthInput) {
        const y = activeRange.start.getFullYear();
        const m = String(activeRange.start.getMonth() + 1).padStart(2, '0');
        monthInput.value = `${y}-${m}`;
    }

    window.populateMonthlyProgramsList();
    if (typeof window.toggleMonthlyProgramsDropdown === 'function') window.toggleMonthlyProgramsDropdown(false);
    if (typeof window.toggleMonthlySubjectsDropdown === 'function') window.toggleMonthlySubjectsDropdown(false);

    window.monthlyTargetDailyAllocations = {};
    const activeMonthDate = window.currentMonthlyTargetsDate || new Date();
    window.populateMonthlyTargetWeeksAndDays(activeMonthDate);
    window.updateMonthlyTargetPageSummary();
    window.updateMonthlyTargetSetupNavButtons();
};

window.setMonthlyTargetSetupMonthDate = function (monthVal) {
    if (!monthVal) return;
    const parts = monthVal.split('-');
    if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        if (!isNaN(year) && !isNaN(month)) {
            window.currentMonthlyTargetsDate = new Date(year, month, 1);
            window.navigateMonthlyTargetSetupMonth(null);
        }
    }
};

window.updateMonthlyTargetSetupNavButtons = function () {
    const today = new Date();
    const activeDate = window.currentMonthlyTargetsDate || today;
    const isCurrent = Boolean(
        activeDate.getMonth() === today.getMonth() &&
        activeDate.getFullYear() === today.getFullYear()
    );

    const currentBtn = document.getElementById('mt-setup-btn-current');
    const prevBtn = document.getElementById('mt-setup-btn-prev');
    const nextBtn = document.getElementById('mt-setup-btn-next');

    const activeRange = window.getMonthlyTargetRange(activeDate);
    const currentRange = window.getMonthlyTargetRange(today);
    const startDiff = activeRange.start.getTime() - currentRange.start.getTime();

    const activeClass = "px-3 py-1.5 text-[10px] font-black rounded-xl transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95 flex items-center gap-1 min-h-[34px]";
    const inactiveClass = "px-2.5 py-1.5 text-[10px] font-black rounded-xl transition-all text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 flex items-center gap-1 min-h-[34px]";

    if (currentBtn) currentBtn.className = isCurrent ? activeClass : inactiveClass;
    if (prevBtn) prevBtn.className = startDiff < 0 ? activeClass : inactiveClass;
    if (nextBtn) nextBtn.className = startDiff > 0 ? activeClass : inactiveClass;

    const monthInput = document.getElementById('mt-setup-month-input');
    if (monthInput) {
        const y = activeDate.getFullYear();
        const m = String(activeDate.getMonth() + 1).padStart(2, '0');
        monthInput.value = `${y}-${m}`;
    }
};

window.navigateMonthlyTargetSetupMonth = function (mode) {
    if (!window.currentMonthlyTargetsDate) {
        window.currentMonthlyTargetsDate = new Date();
    }

    if (mode === 'past') {
        window.currentMonthlyTargetsDate = new Date(window.currentMonthlyTargetsDate.getFullYear(), window.currentMonthlyTargetsDate.getMonth() - 1, 1);
    } else if (mode === 'future') {
        window.currentMonthlyTargetsDate = new Date(window.currentMonthlyTargetsDate.getFullYear(), window.currentMonthlyTargetsDate.getMonth() + 1, 1);
    } else if (mode === 'present') {
        window.currentMonthlyTargetsDate = new Date();
    }

    const activeRange = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate);
    const activeMonthKey = window.formatMonthRangeKey(activeRange.start, activeRange.end);
    const monthName = activeRange.start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const monthBadge = document.getElementById('mt-page-month-badge');
    if (monthBadge) monthBadge.textContent = `${monthName}`;

    const summaryMonth = document.getElementById('mt-summary-month-display');
    if (summaryMonth) summaryMonth.textContent = `${monthName} (${activeMonthKey})`;

    // Preserve checked state and sizes
    const checkedChaptersMap = {};
    document.querySelectorAll('.mt-chapter-checkbox:checked').forEach(cb => {
        const sub = cb.getAttribute('data-subject');
        const ch = cb.getAttribute('data-chapter');
        checkedChaptersMap[sub + '|||' + ch] = true;
    });

    const checkedWholeSubsMap = {};
    document.querySelectorAll('.mt-ch-whole-subject:checked').forEach(ws => {
        const sub = ws.getAttribute('data-subject');
        checkedWholeSubsMap[sub] = true;
    });

    const sizesMap = {};
    document.querySelectorAll('.mt-chapter-size-input').forEach(inp => {
        if (inp.value) {
            const sub = inp.getAttribute('data-subject');
            const ch = inp.getAttribute('data-chapter');
            sizesMap[sub + '|||' + ch] = inp.value;
        }
    });
    document.querySelectorAll('.mt-size-whole-subject').forEach(inp => {
        if (inp.value) {
            const sub = inp.getAttribute('data-subject');
            sizesMap[sub + '|||Whole Subject'] = inp.value;
        }
    });

    // Populate weeks and days for this new month
    window.populateMonthlyTargetWeeksAndDays(window.currentMonthlyTargetsDate);

    // Refresh chapter list with new month's weeks
    window.updateMonthlyTargetSubjectDropdown();

    // Restore checked states & sizes
    Object.keys(checkedChaptersMap).forEach(key => {
        const [sub, ch] = key.split('|||');
        const cb = document.querySelector(`.mt-chapter-checkbox[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
        if (cb) cb.checked = true;
    });

    Object.keys(checkedWholeSubsMap).forEach(sub => {
        const ws = document.querySelector(`.mt-ch-whole-subject[data-subject="${CSS.escape(sub)}"]`);
        if (ws) ws.checked = true;
    });

    Object.keys(sizesMap).forEach(key => {
        const [sub, ch] = key.split('|||');
        if (ch === 'Whole Subject') {
            const inp = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(sub)}"]`);
            if (inp) inp.value = sizesMap[key];
        } else {
            const inp = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(sub)}"][data-chapter="${CSS.escape(ch)}"]`);
            if (inp) inp.value = sizesMap[key];
        }
    });

    // Adjust any daily allocation days to match the new month
    if (window.monthlyTargetDailyAllocations) {
        Object.keys(window.monthlyTargetDailyAllocations).forEach(key => {
            const [sub, ch] = key.split('|||');
            const targetWeekKey = window.getAssignedWeekKeyForTarget ? window.getAssignedWeekKeyForTarget(sub, ch) : '';
            window.adjustDailyAllocationsForTargetWeek(sub, ch, targetWeekKey);
        });
    }

    window.renderMonthlyTargetDailyAllocations();
    window.updateMonthlyTargetPageSummary();
    window.updateMonthlyTargetSetupNavButtons();
};

window.openAddMonthlyTargetModal = function (targetDate = null) {
    window.openAddMonthlyTargetPage(targetDate);
};

window.openEditMonthlyTargetPage = function (idx, monthKey = null) {
    if (!monthKey) {
        const range = window.getMonthlyTargetRange();
        monthKey = window.formatMonthRangeKey(range.start, range.end);
    }
    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[monthKey] || !window.monthlyTargetsDatabase[monthKey][idx]) return;

    const target = window.monthlyTargetsDatabase[monthKey][idx];
    window.editingMonthlyTargetIndex = idx;
    window.editingMonthlyTargetMonthKey = monthKey;

    const container = document.getElementById('page-monthly-target-setup');
    if (!container || container.classList.contains('hidden')) {
        if (typeof window.switchPage === 'function') {
            window.switchPage('monthly-target-setup');
        }
    }

    const pageTitle = document.getElementById('mt-page-title');
    if (pageTitle) pageTitle.textContent = "Edit Monthly Target";

    const pageSubtitle = document.getElementById('mt-page-subtitle');
    if (pageSubtitle) pageSubtitle.textContent = "Update target details, scope, chapter size, and weekly/daily connections";

    const modeBadge = document.getElementById('mt-page-mode-badge');
    if (modeBadge) modeBadge.textContent = "Edit Mode";

    const btnBottom = document.getElementById('mt-btn-save-bottom');
    if (btnBottom) {
        btnBottom.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg><span>Save Changes</span>`;
        btnBottom.setAttribute('onclick', `window.saveMonthlyTarget(${idx}, '${monthKey}')`);
    }

    const btnDeleteBottom = document.getElementById('mt-btn-delete-bottom');
    if (btnDeleteBottom) {
        btnDeleteBottom.classList.remove('hidden');
        btnDeleteBottom.setAttribute('onclick', `window.deleteMonthlyTargetFromEditPage(${idx}, '${monthKey}')`);
    }

    const searchInput = document.getElementById('mt-chapter-search-input');
    if (searchInput) searchInput.value = '';

    const bulkSizeInput = document.getElementById('mt-bulk-size-input');
    if (bulkSizeInput) bulkSizeInput.value = '';

    const targetMonthDate = (monthKey && Utils.parseStart && !isNaN(Utils.parseStart(monthKey).getTime()))
        ? Utils.parseStart(monthKey)
        : (window.currentMonthlyTargetsDate || new Date());

    window.currentMonthlyTargetsDate = targetMonthDate;

    const activeRange = window.getMonthlyTargetRange(targetMonthDate);
    const monthName = activeRange.start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const monthBadge = document.getElementById('mt-page-month-badge');
    if (monthBadge) monthBadge.textContent = `${monthName}`;

    const summaryMonth = document.getElementById('mt-summary-month-display');
    if (summaryMonth) summaryMonth.textContent = `${monthName} (${monthKey})`;

    const monthInput = document.getElementById('mt-setup-month-input');
    if (monthInput) {
        const y = activeRange.start.getFullYear();
        const m = String(activeRange.start.getMonth() + 1).padStart(2, '0');
        monthInput.value = `${y}-${m}`;
    }

    window.populateMonthlyProgramsList(target.program);
    if (typeof window.toggleMonthlyProgramsDropdown === 'function') window.toggleMonthlyProgramsDropdown(false);
    if (typeof window.toggleMonthlySubjectsDropdown === 'function') window.toggleMonthlySubjectsDropdown(false);

    // Find if this target is in any weekly target list of the target month
    let preselectedWeek = (target.targetWeek !== undefined) ? (target.targetWeek || null) : null;
    if (preselectedWeek === null && target.targetWeek === undefined && window.weeklyTargetsDatabase) {
        const weeks = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];
        for (const w of weeks) {
            const canonicalKey = window.getCanonicalWeeklyRangeKey ? window.getCanonicalWeeklyRangeKey(w.key) : w.key;
            const wtList = (window.weeklyTargetsDatabase[w.key] || []).concat(
                (canonicalKey && canonicalKey !== w.key && window.weeklyTargetsDatabase[canonicalKey]) ? window.weeklyTargetsDatabase[canonicalKey] : []
            );
            const match = wtList.some(t => window.isMatchMonthlyTargetWithChild(target, t));
            if (match) {
                preselectedWeek = w.key;
                break;
            }
        }
    }

    // Load existing daily targets for this chapter across the database into daily allocations
    window.monthlyTargetDailyAllocations = {};
    if (window.dailyTargetsDatabase) {
        const key = target.subject + '|||' + target.chapter;
        const existingAllocs = [];
        Object.keys(window.dailyTargetsDatabase).forEach(dateKey => {
            const list = window.dailyTargetsDatabase[dateKey] || [];
            list.forEach(dt => {
                if (dt.isDeleted) return;
                const match = window.isMatchMonthlyTargetWithChild(target, dt);
                if (match) {
                    existingAllocs.push({
                        dayKey: dateKey,
                        portionSize: dt.totalChapterSize || dt.portionSize || target.totalChapterSize,
                        fraction: dt.fraction || '',
                        portionLabel: dt.portionLabel || ''
                    });
                }
            });
        });
        if (existingAllocs.length > 0) {
            window.monthlyTargetDailyAllocations[key] = existingAllocs;
        }
    }

    window.updateMonthlyTargetSubjectDropdown(target.subject, target.chapter, target.totalChapterSize, preselectedWeek);
    window.populateMonthlyTargetWeeksAndDays(targetMonthDate, preselectedWeek);
    window.updateMonthlyTargetPageSummary();
    window.updateMonthlyTargetSetupNavButtons();
};

window.openEditMonthlyTargetModal = function (idx, monthKey = null) {
    window.openEditMonthlyTargetPage(idx, monthKey);
};

window.closeMonthlyTargetPage = function () {
    window.switchPage('daily-actions');
    setTimeout(() => {
        const targetSection = document.getElementById('monthly-targets-section');
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 80);
};

window.deleteMonthlyTargetFromEditPage = function (idx, monthKey = null) {
    if (!monthKey) {
        const range = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate || new Date());
        monthKey = window.formatMonthRangeKey(range.start, range.end);
    }
    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[monthKey] || !window.monthlyTargetsDatabase[monthKey][idx]) return;

    const target = window.monthlyTargetsDatabase[monthKey][idx];
    const mtId = target.id;
    const tid = mtId || window.generateItemId(target, `monthlyTargetsDatabase_${monthKey}`);
    if (tid) {
        window.recordItemDeletion(tid);
        if (target.id) window.recordItemDeletion(target.id);
    }
    window.markLocalMutation('delete_monthly_target_from_edit');

    // Cascade delete associated weekly and daily targets
    window.cascadeDeleteMonthlyTarget(target, monthKey, mtId);

    // Remove from monthlyTargetsDatabase
    window.monthlyTargetsDatabase[monthKey].splice(idx, 1);

    if (typeof window.recalculateTotals === 'function') window.recalculateTotals();
    renderUI();
    FirebaseService.saveToCloud(true);

    showToast("Monthly target and its weekly/daily schedules removed.", "success");
    window.closeMonthlyTargetPage();
};

window.saveMonthlyTarget = function (idx, originalMonthKey = null) {
    idx = (idx !== undefined && idx !== null) ? parseInt(idx, 10) : (window.editingMonthlyTargetIndex !== null ? parseInt(window.editingMonthlyTargetIndex, 10) : null);
    if (!originalMonthKey) {
        const range = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate || new Date());
        originalMonthKey = window.editingMonthlyTargetMonthKey || window.formatMonthRangeKey(range.start, range.end);
    }
    if (!window.monthlyTargetsDatabase || !window.monthlyTargetsDatabase[originalMonthKey] || !window.monthlyTargetsDatabase[originalMonthKey][idx]) return;

    const target = window.monthlyTargetsDatabase[originalMonthKey][idx];

    const activeRange = window.getMonthlyTargetRange(window.currentMonthlyTargetsDate || new Date());
    const targetMonthKey = window.formatMonthRangeKey(activeRange.start, activeRange.end);
    const targetMonthDate = (originalMonthKey && window.Utils && Utils.parseStart && !isNaN(Utils.parseStart(originalMonthKey).getTime()))
        ? Utils.parseStart(originalMonthKey)
        : (activeRange && activeRange.start ? activeRange.start : (window.currentMonthlyTargetsDate || new Date()));

    // Find the first checked target in the studio
    let selectedTrack = '';
    let selectedProg = '';
    let selectedSubject = '';
    let selectedChapter = '';
    let selectedType = 'chapter';
    let selectedSize = null;
    let selectedWeek = '';

    const wholeSub = document.querySelector('.mt-ch-whole-subject:checked');
    if (wholeSub) {
        selectedTrack = wholeSub.getAttribute('data-track');
        selectedProg = wholeSub.getAttribute('data-program');
        selectedSubject = wholeSub.getAttribute('data-subject');
        selectedChapter = 'Whole Subject';
        selectedType = 'subject';
        const wholeSubSize = document.querySelector(`.mt-size-whole-subject[data-subject="${CSS.escape(selectedSubject)}"]`);
        const wholeSubWeek = document.querySelector(`.mt-size-whole-subject-week[data-subject="${CSS.escape(selectedSubject)}"]`);
        selectedSize = wholeSubSize && wholeSubSize.value ? parseInt(wholeSubSize.value, 10) : null;
        selectedWeek = wholeSubWeek ? wholeSubWeek.value : '';
    } else {
        const firstChecked = document.querySelector('.mt-chapter-checkbox:checked');
        if (firstChecked) {
            selectedTrack = firstChecked.getAttribute('data-track');
            selectedProg = firstChecked.getAttribute('data-program');
            selectedSubject = firstChecked.getAttribute('data-subject');
            selectedChapter = firstChecked.getAttribute('data-chapter');
            selectedType = 'chapter';
            const sizeInput = document.querySelector(`.mt-chapter-size-input[data-subject="${CSS.escape(selectedSubject)}"][data-chapter="${CSS.escape(selectedChapter)}"]`);
            const weekSelect = document.querySelector(`.mt-chapter-week-select[data-subject="${CSS.escape(selectedSubject)}"][data-chapter="${CSS.escape(selectedChapter)}"]`);
            selectedSize = sizeInput && sizeInput.value ? parseInt(sizeInput.value, 10) : null;
            selectedWeek = weekSelect ? weekSelect.value : '';
        }
    }

    const progName = selectedProg || (document.getElementById('mt-select-prog') ? document.getElementById('mt-select-prog').value : '') || target.program;
    const trackId = selectedTrack || target.track || window.tracks.find(t => window.customPrograms[t.id] && window.customPrograms[t.id].some(p => (p.name || p) === progName))?.id;

    if (!selectedSubject || !selectedChapter) {
        return showToast("Please select at least one chapter or whole subject.", "error");
    }

    const isSubjectTarget = selectedType === 'subject';
    const finalChapter = selectedChapter;

    if (window.isSubjectPassed && window.isSubjectPassed(trackId, selectedSubject, progName)) {
        return showToast(`"${selectedSubject}" is marked as Passed and cannot be set as a monthly target.`, "error");
    }

    // Duplicate check in targetMonthKey
    if (!window.monthlyTargetsDatabase[targetMonthKey]) window.monthlyTargetsDatabase[targetMonthKey] = [];

    const isSameMonth = targetMonthKey === originalMonthKey;
    if (isSubjectTarget) {
        const exists = window.monthlyTargetsDatabase[targetMonthKey].some((t, i) =>
            (isSameMonth ? Number(i) !== Number(idx) : true) && t.track === trackId && t.subject === selectedSubject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters')
        );
        if (exists) {
            return showToast("This subject target already exists in the target month.", "error");
        }
    } else {
        const exists = window.monthlyTargetsDatabase[targetMonthKey].some((t, i) =>
            (isSameMonth ? Number(i) !== Number(idx) : true) && t.track === trackId && t.subject === selectedSubject && t.chapter === finalChapter && t.targetType !== 'subject'
        );
        if (exists) {
            return showToast("This chapter target already exists in the target month.", "error");
        }
        if (window.isChapterSkipped && window.isChapterSkipped(trackId, selectedSubject, finalChapter)) {
            return showToast(`"${finalChapter}" is skipped in ${selectedSubject} and cannot be set as a monthly target.`, "error");
        }
    }

    const mtId = target.id || `mt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    target.id = mtId;

    const oldTrack = target.track;
    const oldProg = target.program;
    const oldSubject = target.subject;
    const oldChapter = target.chapter;
    const oldIsSubject = target.targetType === 'subject' || oldChapter === 'Whole Subject';

    // Clean up previous Weekly & Daily Targets linked to this monthly target before applying changes
    window.cascadeDeleteMonthlyTarget({
        id: mtId,
        track: oldTrack,
        program: oldProg,
        subject: oldSubject,
        chapter: oldChapter,
        targetType: oldIsSubject ? 'subject' : 'chapter'
    }, originalMonthKey, mtId);

    const weekSelectEl = document.getElementById('mt-select-week-range');
    const targetWeekKey = (selectedWeek !== undefined && selectedWeek !== null) ? selectedWeek : (weekSelectEl ? weekSelectEl.value : '');
    const isNoWeek = !targetWeekKey || targetWeekKey === 'none';

    target.track = trackId;
    target.program = progName;
    target.subject = selectedSubject;
    target.chapter = finalChapter;
    target.targetType = selectedType;
    target.scope = isSubjectTarget ? 'Whole Subject' : (target.scope || 'Whole Chapter');
    target.totalChapterSize = selectedSize;
    target.targetWeek = isNoWeek ? null : (targetWeekKey || null);
    target.updatedAt = Date.now();

    // If month was changed during edit, move target to new month
    if (!isSameMonth) {
        window.monthlyTargetsDatabase[originalMonthKey].splice(idx, 1);
        window.monthlyTargetsDatabase[targetMonthKey].push(target);
    }

    let connectedToWeek = false;

    // Collect all unique weeks spanned by daily allocations (or fallback to targetWeekKey)
    const targetWeeksSet = new Set();
    const allocKey = selectedSubject + '|||' + finalChapter;
    if (isNoWeek && window.monthlyTargetDailyAllocations) {
        window.monthlyTargetDailyAllocations[allocKey] = [];
        if (progName) {
            window.monthlyTargetDailyAllocations[allocKey + '|||' + progName] = [];
        }
    }
    const dailyAllocs = isNoWeek ? [] : ((window.monthlyTargetDailyAllocations && (window.monthlyTargetDailyAllocations[allocKey] || (progName ? window.monthlyTargetDailyAllocations[allocKey + '|||' + progName] : null))) || []);

    if (dailyAllocs.length > 0) {
        dailyAllocs.forEach(a => {
            if (a.dayKey) {
                const wk = window.findWeekForDayInMonth ? window.findWeekForDayInMonth(a.dayKey, targetMonthDate) : '';
                if (wk) targetWeeksSet.add(wk);
            }
        });
    }
    if (targetWeeksSet.size === 0 && targetWeekKey && !isNoWeek) {
        targetWeeksSet.add(targetWeekKey);
    }

    const monthWeeksList = window.getWeeksForMonth ? window.getWeeksForMonth(targetMonthDate) : [];
    const spannedWeekNums = [];
    monthWeeksList.forEach((mw, idx) => {
        if (targetWeeksSet.has(mw.key)) {
            spannedWeekNums.push(`W${idx + 1}`);
        }
    });

    targetWeeksSet.forEach(tWeekKey => {
        const canonicalWeekKey = window.getCanonicalWeeklyRangeKey ? (window.getCanonicalWeeklyRangeKey(tWeekKey) || tWeekKey) : tWeekKey;
        if (!window.weeklyTargetsDatabase) window.weeklyTargetsDatabase = {};
        if (!window.weeklyTargetsDatabase[canonicalWeekKey]) window.weeklyTargetsDatabase[canonicalWeekKey] = [];

        window.weeklyTargetsDatabase[canonicalWeekKey].push({
            id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            monthlyTargetId: mtId,
            source: 'monthly',
            targetMonth: targetMonthKey,
            track: trackId,
            program: progName,
            subject: selectedSubject,
            chapter: finalChapter,
            targetType: selectedType,
            completed: target.completed,
            completedAt: target.completedAt,
            scope: target.scope,
            totalChapterSize: selectedSize,
            targetWeek: tWeekKey,
            dividedWeekKey: tWeekKey,
            spannedWeekNums: spannedWeekNums,
            isMultiWeek: spannedWeekNums.length > 1,
            updatedAt: Date.now()
        });
        connectedToWeek = true;
    });

    if (connectedToWeek) {
        if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets();
        if (typeof window.autoSyncWeeklyToDailyTargets === 'function') window.autoSyncWeeklyToDailyTargets();
    }

    const daySelectEl = document.getElementById('mt-select-day');
    const selectedDayKey = isNoWeek ? '' : (daySelectEl ? daySelectEl.value : '');
    let connectedToDay = false;
    let totalDailyAllocationsAdded = 0;
    const connectedDaysSet = new Set();

    // Auto-connect to Daily Targets from Daily Target Allocator Studio
    if (dailyAllocs.length > 0) {
        let runningSum = 0;
        dailyAllocs.forEach(alloc => {
            if (alloc.dayKey) {
                if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};
                if (!window.dailyTargetsDatabase[alloc.dayKey]) window.dailyTargetsDatabase[alloc.dayKey] = [];

                const prevSum = runningSum;
                const portionSize = alloc.portionSize || selectedSize;
                runningSum += (parseInt(portionSize, 10) || 0);

                const isStar = Boolean(selectedSize && selectedSize > 0 && prevSum >= selectedSize);
                const portionLabel = alloc.portionLabel || (isStar ? 'â­ Extra Setup' : (alloc.fraction ? `Fraction ${alloc.fraction}` : ''));

                const dtList = window.dailyTargetsDatabase[alloc.dayKey];
                const dtExists = isSubjectTarget
                    ? dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === selectedSubject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters') && (t.portionLabel === portionLabel || t.totalChapterSize === portionSize))
                    : dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === selectedSubject && t.chapter === finalChapter && t.targetType !== 'subject' && (t.portionLabel === portionLabel || t.totalChapterSize === portionSize));

                if (!dtExists) {
                    dtList.push({
                        id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        monthlyTargetId: mtId,
                        source: 'monthly',
                        targetMonth: targetMonthKey,
                        track: trackId,
                        program: progName,
                        subject: selectedSubject,
                        chapter: finalChapter,
                        targetType: selectedType,
                        completed: target.completed,
                        completedAt: target.completedAt,
                        scope: target.scope,
                        totalChapterSize: portionSize,
                        portionSize: portionSize,
                        portionLabel: portionLabel,
                        fraction: alloc.fraction || '',
                        isStarTarget: isStar,
                        updatedAt: Date.now()
                    });
                    connectedToDay = true;
                    connectedDaysSet.add(alloc.dayKey);
                    totalDailyAllocationsAdded++;
                }
            }
        });
    } else if (selectedDayKey) {
        if (!window.dailyTargetsDatabase) window.dailyTargetsDatabase = {};
        if (!window.dailyTargetsDatabase[selectedDayKey]) window.dailyTargetsDatabase[selectedDayKey] = [];

        const dtList = window.dailyTargetsDatabase[selectedDayKey];
        const dtExists = isSubjectTarget
            ? dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === selectedSubject && (t.targetType === 'subject' || t.chapter === 'Whole Subject' || t.chapter === 'All Chapters'))
            : dtList.some(t => !t.isDeleted && t.track === trackId && t.subject === selectedSubject && t.chapter === finalChapter && t.targetType !== 'subject');

        if (!dtExists) {
            dtList.push({
                id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                monthlyTargetId: mtId,
                source: 'monthly',
                targetMonth: targetMonthKey,
                track: trackId,
                program: progName,
                subject: selectedSubject,
                chapter: finalChapter,
                targetType: selectedType,
                completed: target.completed,
                completedAt: target.completedAt,
                scope: target.scope,
                totalChapterSize: selectedSize,
                updatedAt: Date.now()
            });
            connectedToDay = true;
            connectedDaysSet.add(selectedDayKey);
            totalDailyAllocationsAdded++;
        }
    }

    window.markLocalMutation('edit_monthly_target');

    // Update active month to the edited target's month
    window.currentMonthlyTargetsDate = activeRange.start;
    const monthSelectEl = document.getElementById('mt-select-month');
    if (monthSelectEl) monthSelectEl.value = targetMonthKey;

    if (typeof window.cleanOrphanedWeeklyAndDailyTargets === 'function') {
        window.cleanOrphanedWeeklyAndDailyTargets();
    }
    if (typeof window.renderWeeklyTargets === 'function') window.renderWeeklyTargets();
    if (typeof window.renderDailyTargets === 'function') window.renderDailyTargets();
    if (typeof window.renderMonthlyTargets === 'function') window.renderMonthlyTargets();
    if (typeof window.recalculateTotals === 'function') window.recalculateTotals();

    FirebaseService.saveToCloud(true);
    renderUI();

    // Smoothly return to Daily Actions page and focus monthly targets section
    window.switchPage('daily-actions');
    setTimeout(() => {
        const targetSection = document.getElementById('monthly-targets-section');
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 80);

    let toastMsg = isSubjectTarget ? "Monthly subject target updated!" : "Monthly chapter target updated!";
    if (connectedToWeek && connectedToDay) {
        const dayCountLabel = connectedDaysSet.size > 1 ? `${totalDailyAllocationsAdded} Daily targets across ${connectedDaysSet.size} days` : 'Daily target';
        toastMsg += ` (Connected to Weekly & ${dayCountLabel})`;
    } else if (connectedToWeek) {
        toastMsg += " (Connected to Weekly target)";
    } else if (connectedToDay) {
        const dayCountLabel = connectedDaysSet.size > 1 ? `${totalDailyAllocationsAdded} Daily targets across ${connectedDaysSet.size} days` : 'Daily target';
        toastMsg += ` (Connected to ${dayCountLabel})`;
    }
    showToast(toastMsg, "success");
};

    // Auto-init if container exists and is visible on initial load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-monthly-target-setup');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.MonthlyTargetPage.init();
        }
    }
})();
