/**
 * X-29 Module: features/exam/examRoutine.js
 * Exam Routine and Session Scheduler:
 * - Next Upcoming Exam Live Hero Countdown banner (with custom subject pinning)
 * - Session timeframe group management (CRUD, date bounds)
 * - Subject Exam scheduling (program-wise & custom non-program modes)
 * - Live timetable filtering (All, Upcoming, Completed), search, status toggles
 * - Multi-tier countdown calculation integration with cloud sync
 * - ExamRoutinePage lifecycle management
 */
(function (global) {
    'use strict';

    /**
     * Page Lifecycle & Manager
     */
    const ExamRoutinePage = {
        isMounted: false,
        timerInterval: null,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            // 1. Synchronize Filter Tab Buttons UI
            if (typeof window.setExamFilterUI === 'function') {
                window.setExamFilterUI(window.examCurrentFilter || 'upcoming');
            }

            // 2. Render Hero Live Countdown
            if (typeof window.updateExamHeroCountdown === 'function') {
                window.updateExamHeroCountdown();
            }

            // 3. Render Session Blocks and Exam Routine List
            if (typeof window.renderExamRoutine === 'function') {
                window.renderExamRoutine();
            }

            // 4. Start 1-second live ticking interval while Exam Routine is mounted
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            this.timerInterval = setInterval(() => {
                if (ExamRoutinePage.isMounted) {
                    if (typeof window.updateExamHeroCountdown === 'function') {
                        window.updateExamHeroCountdown();
                    }
                }
            }, 1000);
        },

        destroy: function () {
            this.isMounted = false;

            // Stop local page interval to preserve battery/CPU
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }

            // Safely close exam-related modals if open when navigating away
            if (typeof window.closeExamModal === 'function') {
                window.closeExamModal();
            }
            if (typeof window.closeSessionModal === 'function') {
                window.closeSessionModal();
            }
        },

        updateHeroCountdown: function () {
            if (typeof window.updateExamHeroCountdown === 'function') {
                window.updateExamHeroCountdown();
            }
        }
    };

    window.ExamRoutinePage = ExamRoutinePage;

    /* ==========================================================================
       Filter State & Tab Handling
       ========================================================================== */
    window.examCurrentFilter = window.examCurrentFilter || 'upcoming';

    window.setExamFilterUI = function (filter) {
        ['all', 'upcoming', 'completed'].forEach(f => {
            const btn = document.getElementById(`btn-exam-filter-${f}`);
            if (btn) {
                if (f === filter) {
                    btn.className = "justify-center py-2 px-2.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm transition-all min-h-[34px] flex items-center";
                } else {
                    btn.className = "justify-center py-2 px-2.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all min-h-[34px] flex items-center";
                }
            }
        });
    };

    window.setExamFilter = function (filter) {
        window.examCurrentFilter = filter;
        window.setExamFilterUI(filter);
        window.renderExamRoutine();
    };

    window.onSelectCountdownTarget = function (examId) {
        AppState.selectedCountdownExamId = examId || 'auto';
        if (typeof window.updateExamCountdown === 'function') {
            window.updateExamCountdown();
        } else {
            window.updateExamHeroCountdown();
        }
    };

    /* ==========================================================================
       Page Hero Live Countdown Updater
       ========================================================================== */
    window.updateExamHeroCountdown = function () {
        const heroTitle = document.getElementById('exam-hero-title');
        const heroSub = document.getElementById('exam-hero-subject-badge');
        const heroDetails = document.getElementById('exam-hero-details');
        const heroVenue = document.getElementById('exam-hero-venue');
        const heroDateTime = document.getElementById('exam-hero-datetime');
        const targetSelect = document.getElementById('exam-hero-select-target');

        const cdVal1 = document.getElementById('exam-cd-val-1') || document.getElementById('exam-cd-days');
        const cdVal2 = document.getElementById('exam-cd-val-2') || document.getElementById('exam-cd-hours');
        const cdVal3 = document.getElementById('exam-cd-val-3') || document.getElementById('exam-cd-mins');
        const cdVal4 = document.getElementById('exam-cd-val-4') || document.getElementById('exam-cd-secs');

        const cdLbl1 = document.getElementById('exam-cd-lbl-1');
        const cdLbl2 = document.getElementById('exam-cd-lbl-2');
        const cdLbl3 = document.getElementById('exam-cd-lbl-3');
        const cdLbl4 = document.getElementById('exam-cd-lbl-4');

        const setCountdownBoxes = (v1, l1, v2, l2, v3, l3, v4, l4) => {
            if (cdVal1) cdVal1.textContent = String(v1).padStart(2, '0');
            if (cdVal2) cdVal2.textContent = String(v2).padStart(2, '0');
            if (cdVal3) cdVal3.textContent = String(v3).padStart(2, '0');
            if (cdVal4) cdVal4.textContent = String(v4).padStart(2, '0');

            if (cdLbl1) cdLbl1.textContent = l1;
            if (cdLbl2) cdLbl2.textContent = l2;
            if (cdLbl3) cdLbl3.textContent = l3;
            if (cdLbl4) cdLbl4.textContent = l4;
        };

        const exams = AppState.examRoutine || [];
        const sessions = AppState.examSessions || [];
        const now = Date.now();

        const getExamTimestamp = (dateStr, timeStr) => {
            if (!dateStr) return NaN;
            const parts = dateStr.split('-');
            if (parts.length !== 3) return NaN;
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);

            let hours = 0, minutes = 0;
            if (timeStr) {
                const timeParts = timeStr.split(':');
                hours = parseInt(timeParts[0], 10) || 0;
                minutes = parseInt(timeParts[1], 10) || 0;
            }
            return new Date(year, month, day, hours, minutes, 0, 0).getTime();
        };

        const userExams = exams
            .filter(e => e && e.subject && e.date)
            .map(e => {
                const timeMs = getExamTimestamp(e.date, e.time);
                return { ...e, timeMs };
            })
            .filter(e => !isNaN(e.timeMs))
            .sort((a, b) => a.timeMs - b.timeMs);

        if (targetSelect) {
            let selectHtml = `<option value="auto" class="bg-slate-900 text-white" ${AppState.selectedCountdownExamId === 'auto' ? 'selected' : ''}>⚡ Auto (Nearest Subject Exam)</option>`;
            userExams.forEach(e => {
                const parent = sessions.find(s => s.id === e.sessionId);
                const tag = parent ? parent.program : (e.program || 'Custom');
                const statusTag = e.status === 'completed' ? ' [Completed]' : '';
                selectHtml += `<option value="${e.id}" class="bg-slate-900 text-white" ${AppState.selectedCountdownExamId === e.id ? 'selected' : ''}>📚 ${e.subject} (${e.date}) - ${tag}${statusTag}</option>`;
            });
            targetSelect.innerHTML = selectHtml;
        }

        const upcomingExams = userExams.filter(e => e.status !== 'completed' && e.timeMs > (now - 7200000));

        let nextExam = null;
        if (AppState.selectedCountdownExamId && AppState.selectedCountdownExamId !== 'auto') {
            nextExam = userExams.find(e => e.id === AppState.selectedCountdownExamId);
        }
        if (!nextExam) {
            nextExam = upcomingExams[0];
        }

        if (!nextExam) {
            if (heroTitle) heroTitle.textContent = "No Subject Exam Scheduled";
            if (heroSub) {
                heroSub.textContent = "N/A";
                heroSub.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }
            if (heroDetails) heroDetails.innerHTML = `<svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Add a subject exam inside a session block to activate the live countdown.</span>`;
            if (heroVenue) heroVenue.style.display = 'none';
            if (heroDateTime) heroDateTime.textContent = "Date: --";

            setCountdownBoxes('00', 'Days', '00', 'Hours', '00', 'Mins', '00', 'Secs');
        } else {
            const parentSession = sessions.find(s => s.id === nextExam.sessionId);
            const targetDate = new Date(nextExam.timeMs);
            const currentDate = new Date(now);
            const rem = typeof window.calculateExamTimeRemaining === 'function'
                ? window.calculateExamTimeRemaining(currentDate, targetDate)
                : { isPast: targetDate <= currentDate, years: 0, months: 0, days: 0, hours: 0, mins: 0, secs: 0, tier: 'days', totalMs: targetDate - currentDate, diffMs: targetDate - currentDate };

            const subjectDisplayName = nextExam.title && nextExam.title.toLowerCase() !== nextExam.subject.toLowerCase()
                ? `${nextExam.subject} — ${nextExam.title}`
                : nextExam.subject;

            if (heroTitle) heroTitle.textContent = subjectDisplayName;

            if (heroSub) {
                const sessionNameStr = parentSession
                    ? (parentSession.name ? `${parentSession.name} (${parentSession.program})` : `${parentSession.program} Session`)
                    : (nextExam.program || 'Session Exam');
                heroSub.textContent = sessionNameStr;
                const color = typeof getSubjectColor === 'function' ? getSubjectColor(nextExam.subject) : '#ef4444';
                heroSub.style.backgroundColor = typeof hexToRgba === 'function' ? hexToRgba(color, 0.3) : 'rgba(244, 63, 94, 0.3)';
            }

            if (heroVenue) heroVenue.style.display = 'none';

            const dateFormatted = targetDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (heroDateTime) heroDateTime.textContent = `Date: ${dateFormatted}`;

            if (rem.isPast) {
                if (heroDetails) heroDetails.innerHTML = `<span class="text-emerald-400 font-black flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>${nextExam.subject.toUpperCase()} EXAM IS IN PROGRESS NOW!</span>`;
                setCountdownBoxes('00', 'Days', '00', 'Hours', '00', 'Mins', '00', 'Secs');
            } else {
                if (heroDetails) {
                    heroDetails.innerHTML = `<svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Target Subject Exam: <strong class="text-white font-black">${nextExam.subject}</strong> (${dateFormatted})</span>`;
                }

                if (rem.tier === 'years') {
                    setCountdownBoxes(rem.years, 'Years', rem.months, 'Months', rem.days, 'Days', rem.hours, 'Hours');
                } else if (rem.tier === 'months') {
                    setCountdownBoxes(rem.months, 'Months', rem.days, 'Days', rem.hours, 'Hours', rem.mins, 'Mins');
                } else {
                    setCountdownBoxes(rem.days, 'Days', rem.hours, 'Hours', rem.mins, 'Mins', rem.secs, 'Secs');
                }
            }
        }

        // Live update subject exam countdown cards inside session blocks
        const cardCdElements = document.querySelectorAll('#exam-routine-container [data-exam-target-time]');
        if (cardCdElements.length > 0) {
            const nowDt = new Date(now);
            cardCdElements.forEach(el => {
                const timeMs = parseInt(el.getAttribute('data-exam-target-time'), 10);
                if (!isNaN(timeMs) && typeof window.calculateExamTimeRemaining === 'function') {
                    const cRem = window.calculateExamTimeRemaining(nowDt, new Date(timeMs));
                    if (!cRem.isPast) {
                        const cStr = typeof window.formatExamCountdownString === 'function' ? window.formatExamCountdownString(cRem) : `${cRem.days}d ${cRem.hours}h`;
                        if (el.textContent !== cStr) {
                            el.textContent = cStr;
                        }
                    } else if (cRem.diffMs > -7200000) {
                        const liveText = 'Live Exam Today';
                        if (el.textContent !== liveText) {
                            el.textContent = liveText;
                        }
                    } else {
                        if (el.textContent !== 'Ended') {
                            el.textContent = 'Ended';
                        }
                    }
                }
            });
        }
    };

    /* ==========================================================================
       Mode Switcher & Program Dropdown Helpers
       ========================================================================== */
    window.setExamMode = function (mode) {
        const modeInput = document.getElementById('exam-mode');
        if (modeInput) modeInput.value = mode;

        const btnProgram = document.getElementById('btn-exam-mode-program');
        const btnNonProgram = document.getElementById('btn-exam-mode-non-program');
        const programContainer = document.getElementById('exam-program-wise-fields');
        const nonProgramContainer = document.getElementById('exam-non-program-fields');

        const progSelect = document.getElementById('exam-program-select');
        const subjSelect = document.getElementById('exam-subject-select');
        const customSettingInput = document.getElementById('exam-custom-setting');

        if (mode === 'program') {
            if (btnProgram) {
                btnProgram.className = "py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-rose-600 text-white shadow-sm min-h-[38px]";
            }
            if (btnNonProgram) {
                btnNonProgram.className = "py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 min-h-[38px]";
            }
            if (programContainer) programContainer.classList.remove('hidden');
            if (nonProgramContainer) nonProgramContainer.classList.add('hidden');

            if (progSelect) progSelect.setAttribute('required', 'required');
            if (subjSelect) subjSelect.setAttribute('required', 'required');
            if (customSettingInput) customSettingInput.removeAttribute('required');
        } else {
            if (btnNonProgram) {
                btnNonProgram.className = "py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-rose-600 text-white shadow-sm min-h-[38px]";
            }
            if (btnProgram) {
                btnProgram.className = "py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 min-h-[38px]";
            }
            if (nonProgramContainer) nonProgramContainer.classList.remove('hidden');
            if (programContainer) programContainer.classList.add('hidden');

            if (customSettingInput) customSettingInput.setAttribute('required', 'required');
            if (progSelect) progSelect.removeAttribute('required');
            if (subjSelect) subjSelect.removeAttribute('required');
        }
    };

    window.onExamProgramChange = function (selectedSubjToPreserve = null) {
        const progSelect = document.getElementById('exam-program-select');
        const subjSelect = document.getElementById('exam-subject-select');
        if (!progSelect || !subjSelect) return;

        const progName = progSelect.value;
        if (!progName) {
            subjSelect.innerHTML = `<option value="">-- Select Program First --</option>`;
            return;
        }

        const allSubs = typeof window.getAllSubjects === 'function' ? window.getAllSubjects() : [];
        const filteredSubs = allSubs.filter(s => s && s.program === progName);

        let html = `<option value="">-- Select Subject --</option>`;
        if (filteredSubs.length > 0) {
            const uniqueSubNames = Array.from(new Set(filteredSubs.map(s => s.subject))).sort();
            uniqueSubNames.forEach(sub => {
                html += `<option value="${sub}">${sub}</option>`;
            });
        } else {
            html += `<option value="" disabled>No subjects found under this program</option>`;
        }
        subjSelect.innerHTML = html;

        if (selectedSubjToPreserve) {
            subjSelect.value = selectedSubjToPreserve;
        }
    };

    function formatSessionDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [yr, mo, dy] = parts.map(Number);
        if (isNaN(yr) || isNaN(mo) || isNaN(dy)) return dateStr;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = months[mo - 1] || '';
        const dayStr = String(dy).padStart(2, '0');
        return `${dayStr} ${monthName} ${yr}`;
    }

    /* ==========================================================================
       Session Modal & Session CRUD
       ========================================================================== */
    window.openSessionModal = function (sessionId = null) {
        const modal = document.getElementById('session-modal');
        if (!modal) return;

        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        const modalTitle = document.getElementById('session-modal-title');
        const idInput = document.getElementById('session-id');
        const progSelect = document.getElementById('session-program');
        const nameInput = document.getElementById('session-name');
        const startInput = document.getElementById('session-start-date');
        const endInput = document.getElementById('session-end-date');

        if (progSelect) {
            const programs = typeof window.getAllPrograms === 'function' ? window.getAllPrograms() : [];
            const progNames = Array.from(new Set(programs.map(p => p.name || p))).sort();
            let progHtml = `<option value="">-- Select Program --</option>`;
            progHtml += `<option value="Non-Program">⚙️ Non-Program Wise (Custom)</option>`;
            progNames.forEach(pName => {
                progHtml += `<option value="${pName}">🎓 ${pName}</option>`;
            });
            progSelect.innerHTML = progHtml;
        }

        if (sessionId) {
            const session = (AppState.examSessions || []).find(s => s.id === sessionId);
            if (session) {
                if (modalTitle) modalTitle.textContent = "Edit Session";
                if (idInput) idInput.value = session.id || '';
                if (progSelect) progSelect.value = session.program || 'Non-Program';
                if (nameInput) nameInput.value = session.name || '';
                if (startInput) startInput.value = session.startDate || '';
                if (endInput) endInput.value = session.endDate || '';
            }
        } else {
            if (modalTitle) modalTitle.textContent = "Add Session";
            if (idInput) idInput.value = '';
            if (progSelect) progSelect.value = '';
            if (nameInput) nameInput.value = '';
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.zIndex = '999999';
    };

    window.closeSessionModal = function () {
        const modal = document.getElementById('session-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    };

    window.saveSessionForm = function (event) {
        event.preventDefault();
        const id = document.getElementById('session-id')?.value;
        const program = document.getElementById('session-program')?.value || 'Non-Program';
        const name = document.getElementById('session-name')?.value.trim() || '';
        const startDate = document.getElementById('session-start-date')?.value || '';
        const endDate = document.getElementById('session-end-date')?.value || '';

        if (startDate && endDate && startDate > endDate) {
            if (typeof showToast === 'function') {
                showToast("Start date cannot be after end date.", "warning");
            }
            return;
        }

        if (!Array.isArray(AppState.examSessions)) {
            AppState.examSessions = [];
        }

        if (id) {
            const idx = AppState.examSessions.findIndex(s => s.id === id);
            if (idx !== -1) {
                AppState.examSessions[idx] = {
                    ...AppState.examSessions[idx],
                    program, name, startDate, endDate,
                    updatedAt: Date.now()
                };
            }
        } else {
            const newSession = {
                id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                program, name, startDate, endDate,
                createdAt: Date.now()
            };
            AppState.examSessions.push(newSession);
        }

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud(true);
        }

        window.closeSessionModal();
        window.renderExamPage();
        if (typeof showToast === 'function') showToast("Exam session saved successfully!", "success");
    };

    window.deleteSession = function (sessionId) {
        const session = (AppState.examSessions || []).find(s => s.id === sessionId);
        const sessionName = session ? (session.name ? `${session.program} - ${session.name}` : session.program) : 'this session';

        window.openConfirmModal(
            "Delete Exam Session",
            `Are you sure you want to delete "${sessionName}"? All associated subject exams will also be deleted.`,
            () => {
                if (typeof window.recordItemDeletion === 'function') {
                    window.recordItemDeletion(sessionId);
                    (AppState.examRoutine || []).filter(e => e.sessionId === sessionId).forEach(e => window.recordItemDeletion(e.id));
                }
                AppState.examSessions = (AppState.examSessions || []).filter(s => s.id !== sessionId);
                AppState.examRoutine = (AppState.examRoutine || []).filter(e => e.sessionId !== sessionId);

                if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
                    window.FirebaseService.saveToCloud(true);
                }

                window.renderExamPage();
                if (typeof showToast === 'function') showToast("Session and associated exams deleted.", "info");
            }
        );
    };

    window.deleteExamSession = window.deleteSession;

    /* ==========================================================================
       Routine Session Blocks & Exam List Renderer
       ========================================================================== */
    window.renderExamRoutine = function () {
        const container = document.getElementById('exam-routine-container');
        if (!container) return;

        const query = (document.getElementById('exam-search-input')?.value || '').toLowerCase().trim();
        const sessions = (AppState.examSessions || []).slice();
        let exams = (AppState.examRoutine || []).slice();
        const now = Date.now();

        const parseExamTime = (dStr, tStr) => {
            if (!dStr) return NaN;
            const parts = dStr.split('-');
            if (parts.length !== 3) return NaN;
            const [yr, mo, dy] = parts.map(Number);
            const [hr, mn] = (tStr || '00:00').split(':').map(Number);
            return new Date(yr, mo - 1, dy, hr || 0, mn || 0).getTime();
        };

        const isExamDoneOrOver = (ex) => {
            if (!ex) return true;
            if (ex.status === 'completed') return true;
            const exTimeMs = parseExamTime(ex.date, ex.time);
            if (isNaN(exTimeMs)) return false;
            return exTimeMs <= (now - 7200000);
        };

        sessions.sort((a, b) => {
            if (!a.startDate && !b.startDate) return (b.createdAt || 0) - (a.createdAt || 0);
            if (!a.startDate) return 1;
            if (!b.startDate) return -1;
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });

        exams.sort((a, b) => {
            const ta = parseExamTime(a.date, a.time) || 0;
            const tb = parseExamTime(b.date, b.time) || 0;
            return ta - tb;
        });

        let renderedBlocksCount = 0;
        let blocksHtml = '';

        sessions.forEach(session => {
            let sessionExams = exams.filter(e => e.sessionId === session.id);
            if (sessionExams.length === 0 && session.program !== 'Non-Program') {
                sessionExams = exams.filter(e => !e.sessionId && e.program === session.program);
                sessionExams.forEach(e => { e.sessionId = session.id; });
            }

            const totalCount = sessionExams.length;
            const completedCount = sessionExams.filter(isExamDoneOrOver).length;
            const upcomingCount = totalCount - completedCount;

            const isFullSessionCompleted = (function () {
                if (totalCount > 0) {
                    return sessionExams.every(isExamDoneOrOver);
                } else if (session.endDate) {
                    const endMs = new Date(session.endDate + 'T23:59:59').getTime();
                    return !isNaN(endMs) && endMs < now;
                }
                return false;
            })();

            // Filter which exams are displayed based on active filter tab
            let filteredSessionExams = sessionExams;
            if (window.examCurrentFilter === 'upcoming') {
                if (totalCount > 0 && upcomingCount === 0) {
                    return; // Entire session completed, omit from upcoming view
                }
                if (totalCount === 0 && isFullSessionCompleted) {
                    return;
                }
                // In upcoming filter, show ONLY upcoming subjects (not done and date not over)
                filteredSessionExams = sessionExams.filter(e => !isExamDoneOrOver(e));
            } else if (window.examCurrentFilter === 'completed') {
                if (completedCount === 0 && !isFullSessionCompleted) {
                    return; // No completed subjects in this session, omit from completed view
                }
                // In completed filter, show ONLY completed/date-over subjects
                filteredSessionExams = sessionExams.filter(e => isExamDoneOrOver(e));
            }

            // Search query filter
            let displayExams = filteredSessionExams;
            if (query) {
                const matchesSessionName = (session.name || '').toLowerCase().includes(query) || (session.program || '').toLowerCase().includes(query);
                const matchingExams = filteredSessionExams.filter(e =>
                    (e.title || '').toLowerCase().includes(query) ||
                    (e.subject || '').toLowerCase().includes(query) ||
                    (e.program || '').toLowerCase().includes(query)
                );
                if (!matchesSessionName && matchingExams.length === 0) {
                    return;
                }
                if (!matchesSessionName) {
                    displayExams = matchingExams;
                }
            }

            renderedBlocksCount++;

            const isNonProgramSession = session.program === 'Non-Program';
            const sessionDisplayName = session.name ? `${session.program} - ${session.name}` : session.program;
            const sessionIcon = isNonProgramSession ? '⚙️' : '🎓';

            let dateRangeBadge = '';
            if (session.startDate && session.endDate) {
                dateRangeBadge = `<span class="text-[11px] sm:text-xs font-mono text-slate-400 font-bold break-all">(${formatSessionDate(session.startDate)} - ${formatSessionDate(session.endDate)})</span>`;
            } else if (session.startDate) {
                dateRangeBadge = `<span class="text-[11px] sm:text-xs font-mono text-slate-400 font-bold break-all">(${formatSessionDate(session.startDate)})</span>`;
            } else if (session.endDate) {
                dateRangeBadge = `<span class="text-[11px] sm:text-xs font-mono text-slate-400 font-bold break-all">(Until ${formatSessionDate(session.endDate)})</span>`;
            }

            let examsGridHtml = '';

            if (displayExams.length === 0) {
                examsGridHtml = `
                    <div class="col-span-full py-8 text-center bg-white/40 dark:bg-slate-800/10 border border-dashed border-slate-200/50 dark:border-slate-700/50 rounded-2xl">
                        <p class="text-xs text-slate-400 font-medium">No exams scheduled in this session yet.</p>
                    </div>
                `;
            } else {
                displayExams.forEach(ex => {
                    const isCompleted = ex.status === 'completed';
                    const exTimeMs = parseExamTime(ex.date, ex.time);
                    const targetExamDt = !isNaN(exTimeMs) ? new Date(exTimeMs) : null;
                    const rem = targetExamDt && typeof window.calculateExamTimeRemaining === 'function' ? window.calculateExamTimeRemaining(new Date(now), targetExamDt) : null;

                    let countdownBadge = '';
                    if (isCompleted) {
                        countdownBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">✓ Completed</span>`;
                    } else if (!rem || isNaN(exTimeMs)) {
                        countdownBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700/60 text-slate-500 shrink-0">No Date</span>`;
                    } else if (rem.isPast && rem.diffMs > -7200000) {
                        countdownBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse shrink-0">● Live Exam Today</span>`;
                    } else if (!rem.isPast) {
                        const countdownStr = typeof window.formatExamCountdownString === 'function' ? window.formatExamCountdownString(rem) : `${rem.days}d ${rem.hours}h`;
                        countdownBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5 min-w-0 max-w-[85%] truncate"><svg class="w-3 h-3 text-rose-500 animate-spin shrink-0" style="animation-duration: 4s;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span id="exam-card-cd-${ex.id}" data-exam-target-time="${exTimeMs}" class="truncate">${countdownStr}</span></span>`;
                    } else {
                        countdownBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700/60 text-slate-500 shrink-0">Ended</span>`;
                    }

                    const subjColor = typeof getSubjectColor === 'function' ? getSubjectColor(ex.subject || 'General') : '#ef4444';
                    const dtObj = !isNaN(exTimeMs) ? new Date(exTimeMs) : new Date();
                    const dtFormatted = dtObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

                    examsGridHtml += `
                        <div class="exam-item-row bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group ${isCompleted ? 'opacity-70' : ''}">
                            <div>
                                <div class="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
                                    ${countdownBadge}
                                    <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style="background-color: ${subjColor}" title="Subject Accent"></span>
                                </div>

                                <h4 class="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors break-words">
                                    ${ex.subject || 'General Subject'}
                                </h4>

                                <div class="mt-2.5 sm:mt-3 space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    <div class="flex items-center gap-2">
                                        <svg class="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <span>${dtFormatted} at ${ex.time || '00:00'}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-3.5 sm:mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                                <button onclick="window.toggleExamStatus('${ex.id}')" class="flex-1 sm:flex-initial text-xs font-bold px-3 py-2 sm:py-1.5 rounded-xl transition-all min-h-[36px] flex items-center justify-center ${isCompleted ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300' : 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'}">
                                    ${isCompleted ? 'Mark Pending' : '✓ Mark Complete'}
                                </button>
                                <div class="flex items-center gap-1 shrink-0">
                                    <button onclick="window.openExamModal('${ex.id}', '${session.id}')" class="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all" title="Edit Subject">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    </button>
                                    <button onclick="window.deleteExam('${ex.id}')" class="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all" title="Delete Subject">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            const sessionStatusBadge = isFullSessionCompleted
                ? `<span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">✓ Session Completed</span>`
                : '';

            blocksHtml += `
                <div class="exam-session-card bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm space-y-3.5 sm:space-y-4 w-full">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/60 dark:border-slate-700/60">
                        <div class="flex items-center space-x-3 min-w-0">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-lg border border-rose-500/20 shadow-sm shrink-0">
                                ${sessionIcon}
                            </div>
                            <div class="min-w-0">
                                <h4 class="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight flex flex-wrap items-center gap-1.5 sm:gap-2 break-words">
                                    <span>${sessionDisplayName}</span>
                                    ${dateRangeBadge}
                                    ${sessionStatusBadge}
                                </h4>
                                <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                                    <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 shrink-0">
                                        ${upcomingCount} Upcoming
                                    </span>
                                    <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                                        ${completedCount} Completed
                                    </span>
                                    <span class="text-[10px] font-bold text-slate-400 shrink-0">
                                        (${totalCount} Total Exam${totalCount === 1 ? '' : 's'})
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end sm:justify-start pt-2 sm:pt-0 border-t border-slate-200/40 dark:border-slate-700/40 sm:border-t-0">
                            <button onclick="window.openSessionModal('${session.id}')" class="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl bg-white/60 dark:bg-slate-800/60 sm:bg-transparent border border-slate-200/40 dark:border-slate-700/40 sm:border-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all" title="Edit Session">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onclick="window.deleteSession('${session.id}')" class="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl bg-white/60 dark:bg-slate-800/60 sm:bg-transparent border border-slate-200/40 dark:border-slate-700/40 sm:border-0 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all" title="Delete Session">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                            <button onclick="window.openExamModal(null, '${session.id}')" class="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 min-h-[36px]">
                                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                                <span>Add Subject</span>
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full">
                        ${examsGridHtml}
                    </div>
                </div>
            `;
        });

        if (renderedBlocksCount === 0) {
            if (query) {
                container.innerHTML = `
                    <div class="py-10 sm:py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 w-full col-span-full">
                        <div class="w-12 h-12 mx-auto mb-3 text-slate-400 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <h4 class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">No Results Found</h4>
                        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No sessions or exams match "${query}".</p>
                    </div>
                `;
            } else if (window.examCurrentFilter === 'upcoming') {
                container.innerHTML = `
                    <div class="py-10 sm:py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 w-full col-span-full">
                        <div class="w-12 h-12 mx-auto mb-3 text-slate-400 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <h4 class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">No Upcoming Exam Sessions</h4>
                        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">All scheduled exam sessions are completed, or click "Add Session" to schedule a new one.</p>
                    </div>
                `;
            } else if (window.examCurrentFilter === 'completed') {
                container.innerHTML = `
                    <div class="py-10 sm:py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 w-full col-span-full">
                        <div class="w-12 h-12 mx-auto mb-3 text-emerald-500 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h4 class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">No Completed Sessions</h4>
                        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Completed subjects and sessions will automatically appear here once their exam is over or marked complete.</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="py-10 sm:py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 w-full col-span-full">
                        <div class="w-12 h-12 mx-auto mb-3 text-slate-400 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <h4 class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">No Sessions Found</h4>
                        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No sessions have been created yet. Click "Add Session" to create your first session block.</p>
                    </div>
                `;
            }
            return;
        }

        container.innerHTML = blocksHtml;
    };

    /* ==========================================================================
       Exam Modal & Exam CRUD
       ========================================================================== */
    window.openExamModal = function (examId = null, sessionId = null) {
        const modal = document.getElementById('exam-modal');
        if (!modal) return;

        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        const modalTitle = document.getElementById('exam-modal-title');
        const idInput = document.getElementById('exam-id');
        const sessIdInput = document.getElementById('exam-session-id');
        const infoDisplay = document.getElementById('exam-session-info-display');
        const progSelect = document.getElementById('exam-program-select');
        const subjSelect = document.getElementById('exam-subject-select');
        const customSettingInput = document.getElementById('exam-custom-setting');
        const dateInput = document.getElementById('exam-date');
        const timeInput = document.getElementById('exam-time');

        if (progSelect) {
            const programs = typeof window.getAllPrograms === 'function' ? window.getAllPrograms() : [];
            const progNames = Array.from(new Set(programs.map(p => p.name || p))).sort();
            let progHtml = `<option value="">-- Select Program --</option>`;
            progHtml += `<option value="Non-Program">⚙️ Non-Program Wise (Custom)</option>`;
            progNames.forEach(pName => {
                progHtml += `<option value="${pName}">${pName}</option>`;
            });
            progSelect.innerHTML = progHtml;
        }

        let activeSessionId = sessionId;
        if (examId) {
            const exam = (AppState.examRoutine || []).find(e => e.id === examId);
            if (exam) {
                activeSessionId = exam.sessionId || activeSessionId;
            }
        }

        const session = (AppState.examSessions || []).find(s => s.id === activeSessionId);
        if (!session) {
            if (typeof showToast === 'function') showToast("Please select a session first to add an exam.", "warning");
            return;
        }

        if (sessIdInput) sessIdInput.value = session.id;
        if (infoDisplay) {
            const displayName = session.name ? `${session.program} - ${session.name}` : session.program;
            let dateRangeText = '';
            if (session.startDate && session.endDate) {
                dateRangeText = ` (${formatSessionDate(session.startDate)} - ${formatSessionDate(session.endDate)})`;
            } else if (session.startDate) {
                dateRangeText = ` (${formatSessionDate(session.startDate)})`;
            } else if (session.endDate) {
                dateRangeText = ` (Until ${formatSessionDate(session.endDate)})`;
            }
            infoDisplay.innerHTML = `<span class="text-rose-500 font-black">Active Session:</span> ${displayName}${dateRangeText}`;
            infoDisplay.classList.remove('hidden');
        }

        const isProgramWise = session.program !== 'Non-Program';
        window.setExamMode(isProgramWise ? 'program' : 'non-program');

        const switcherEl = document.getElementById('btn-exam-mode-program')?.parentElement;
        if (switcherEl) switcherEl.parentElement.classList.add('hidden');

        if (isProgramWise) {
            if (progSelect) {
                progSelect.value = session.program;
                progSelect.disabled = true;
            }
            window.onExamProgramChange();
        } else {
            if (customSettingInput) {
                customSettingInput.placeholder = "e.g. Custom Midterm Subject";
            }
        }

        if (examId) {
            const exam = (AppState.examRoutine || []).find(e => e.id === examId);
            if (exam) {
                if (modalTitle) modalTitle.textContent = "Edit Subject Exam";
                if (idInput) idInput.value = exam.id || '';
                if (dateInput) dateInput.value = exam.date || '';
                if (timeInput) timeInput.value = exam.time || '';

                if (isProgramWise) {
                    if (subjSelect) subjSelect.value = exam.subject || '';
                } else {
                    if (customSettingInput) customSettingInput.value = exam.subject || '';
                }
            }
        } else {
            if (modalTitle) modalTitle.textContent = "Add Subject Exam";
            if (idInput) idInput.value = '';
            if (dateInput) dateInput.value = session.startDate || new Date().toISOString().split('T')[0];
            if (timeInput) timeInput.value = '10:00';
            if (isProgramWise) {
                if (subjSelect) subjSelect.value = '';
            } else {
                if (customSettingInput) customSettingInput.value = '';
            }
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.zIndex = '999999';
    };

    window.closeExamModal = function () {
        const modal = document.getElementById('exam-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        const switcherEl = document.getElementById('btn-exam-mode-program')?.parentElement;
        if (switcherEl) switcherEl.parentElement.classList.remove('hidden');
        const progSelect = document.getElementById('exam-program-select');
        if (progSelect) progSelect.disabled = false;
    };

    window.saveExamForm = function (event) {
        event.preventDefault();
        const id = document.getElementById('exam-id')?.value;
        const sessionId = document.getElementById('exam-session-id')?.value;
        const mode = document.getElementById('exam-mode')?.value || 'program';
        const date = document.getElementById('exam-date')?.value || new Date().toISOString().split('T')[0];
        const time = document.getElementById('exam-time')?.value || '10:00';

        if (!sessionId) {
            if (typeof showToast === 'function') showToast("Parent session ID is missing.", "error");
            return;
        }

        const session = (AppState.examSessions || []).find(s => s.id === sessionId);
        if (!session) {
            if (typeof showToast === 'function') showToast("Parent session not found.", "error");
            return;
        }

        if (session.startDate && date < session.startDate) {
            if (typeof showToast === 'function') {
                showToast(`Exam date cannot be earlier than session start date (${session.startDate})`, "warning");
            }
            return;
        }
        if (session.endDate && date > session.endDate) {
            if (typeof showToast === 'function') {
                showToast(`Exam date cannot be later than session end date (${session.endDate})`, "warning");
            }
            return;
        }

        let program = '';
        let subject = '';

        if (mode === 'program') {
            program = session.program;
            subject = document.getElementById('exam-subject-select')?.value || '';
            if (!program || !subject) {
                if (typeof showToast === 'function') showToast("Please select a Subject.", "warning");
                return;
            }
        } else {
            const customSetting = document.getElementById('exam-custom-setting')?.value.trim();
            if (!customSetting) {
                if (typeof showToast === 'function') showToast("Please enter a Custom Setting Name.", "warning");
                return;
            }
            program = 'Non-Program';
            subject = customSetting;
        }

        const title = subject;

        if (!Array.isArray(AppState.examRoutine)) {
            AppState.examRoutine = [];
        }

        if (id) {
            const idx = AppState.examRoutine.findIndex(e => e.id === id);
            if (idx !== -1) {
                AppState.examRoutine[idx] = {
                    ...AppState.examRoutine[idx],
                    sessionId, mode, program, subject, title, date, time,
                    updatedAt: Date.now()
                };
            }
        } else {
            const newExam = {
                id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                sessionId, mode, program, subject, title, date, time,
                status: 'upcoming',
                createdAt: Date.now()
            };
            AppState.examRoutine.push(newExam);
        }

        if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
            window.FirebaseService.saveToCloud(true);
        }

        window.closeExamModal();
        window.renderExamPage();
        if (typeof showToast === 'function') showToast("Exam routine saved successfully!", "success");
    };

    window.toggleExamStatus = function (examId) {
        const exam = (AppState.examRoutine || []).find(e => e.id === examId);
        if (exam) {
            exam.status = exam.status === 'completed' ? 'upcoming' : 'completed';
            if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
                window.FirebaseService.saveToCloud(true);
            }
            window.renderExamPage();
            if (typeof showToast === 'function') {
                showToast(exam.status === 'completed' ? "Exam marked as completed!" : "Exam status reset to upcoming.", "info");
            }
        }
    };

    window.deleteExam = function (examId) {
        const exam = (AppState.examRoutine || []).find(e => e.id === examId);
        const examName = exam ? (exam.subject || exam.title || 'this subject exam') : 'this subject exam';

        window.openConfirmModal(
            "Delete Subject Exam",
            `Are you sure you want to delete "${examName}"? This action cannot be undone.`,
            () => {
                if (typeof window.recordItemDeletion === 'function') {
                    window.recordItemDeletion(examId);
                }
                AppState.examRoutine = (AppState.examRoutine || []).filter(e => e.id !== examId);
                if (window.FirebaseService && typeof window.FirebaseService.saveToCloud === 'function') {
                    window.FirebaseService.saveToCloud(true);
                }
                window.renderExamPage();
                if (typeof showToast === 'function') showToast("Exam deleted.", "info");
            }
        );
    };

    /* ==========================================================================
       Global Exam Page Coordinator
       ========================================================================== */
    window.renderExamPage = function () {
        if (typeof window.updateExamCountdown === 'function') {
            window.updateExamCountdown();
        } else if (typeof window.updateExamHeroCountdown === 'function') {
            window.updateExamHeroCountdown();
        }
        if (typeof window.renderExamRoutine === 'function') {
            window.renderExamRoutine();
        }
        if (typeof window.renderDashboardUpcomingExamCard === 'function') {
            window.renderDashboardUpcomingExamCard();
        }
    };

    // Attach to global window
    global.ExamRoutinePage = typeof ExamRoutinePage !== 'undefined' ? ExamRoutinePage : window.ExamRoutinePage;
    global.examCurrentFilter = window.examCurrentFilter || 'upcoming';
    global.setExamFilterUI = window.setExamFilterUI;
    global.setExamFilter = window.setExamFilter;
    global.onSelectCountdownTarget = window.onSelectCountdownTarget;
    global.updateExamHeroCountdown = window.updateExamHeroCountdown;
    global.setExamMode = window.setExamMode;
    global.onExamProgramChange = window.onExamProgramChange;
    global.openSessionModal = window.openSessionModal;
    global.closeSessionModal = window.closeSessionModal;
    global.saveSessionForm = window.saveSessionForm;
    global.deleteSession = window.deleteSession;
    global.deleteExamSession = window.deleteExamSession || window.deleteSession;
    global.renderExamRoutine = window.renderExamRoutine;
    global.openExamModal = window.openExamModal;
    global.closeExamModal = window.closeExamModal;
    global.saveExamForm = window.saveExamForm;
    global.toggleExamStatus = window.toggleExamStatus;
    global.deleteExam = window.deleteExam;
    global.renderExamPage = window.renderExamPage;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            ExamRoutinePage: global.ExamRoutinePage,
            renderExamRoutine: global.renderExamRoutine,
            renderExamPage: global.renderExamPage,
            setExamFilter: global.setExamFilter,
            setExamFilterUI: global.setExamFilterUI,
            onSelectCountdownTarget: global.onSelectCountdownTarget,
            updateExamHeroCountdown: global.updateExamHeroCountdown,
            setExamMode: global.setExamMode,
            onExamProgramChange: global.onExamProgramChange,
            openSessionModal: global.openSessionModal,
            closeSessionModal: global.closeSessionModal,
            saveSessionForm: global.saveSessionForm,
            deleteSession: global.deleteSession,
            deleteExamSession: global.deleteExamSession,
            openExamModal: global.openExamModal,
            closeExamModal: global.closeExamModal,
            saveExamForm: global.saveExamForm,
            toggleExamStatus: global.toggleExamStatus,
            deleteExam: global.deleteExam
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);
