/**
 * X-29 Module: features/exam/countdown.js
 * Exam countdown ticker and header widget.
 */
(function (global) {
    'use strict';

/**
 * X-29 Module: features/exam/countdown.js
 * Exam countdown calculations, string formatting & live header/dashboard timer updates.
 *
 * Extracted from monolithic js/script.js (Lines 20326-20589)
 */

let _countdownIntervalId = null;

/**
 * Calculates calendar-accurate remaining time between two dates.
 * Breaks down duration into years, months, days, hours, minutes, seconds, and visual tier.
 *
 * @param {Date} fromDate - Starting date (usually current time)
 * @param {Date} toDate - Target exam date
 * @returns {Object} Countdown breakdown and status
 */
function calculateExamTimeRemaining(fromDate, toDate) {
    if (!fromDate || !toDate) {
        return {
            isPast: true,
            years: 0,
            months: 0,
            days: 0,
            hours: 0,
            mins: 0,
            secs: 0,
            tier: 'days',
            totalMs: 0,
            diffMs: 0
        };
    }

    const diffMs = toDate.getTime() - fromDate.getTime();
    if (diffMs <= 0) {
        return {
            isPast: true,
            years: 0,
            months: 0,
            days: 0,
            hours: 0,
            mins: 0,
            secs: 0,
            tier: 'days',
            totalMs: 0,
            diffMs: diffMs
        };
    }

    let y1 = fromDate.getFullYear(), m1 = fromDate.getMonth(), d1 = fromDate.getDate();
    let h1 = fromDate.getHours(), min1 = fromDate.getMinutes(), s1 = fromDate.getSeconds();

    let y2 = toDate.getFullYear(), m2 = toDate.getMonth(), d2 = toDate.getDate();
    let h2 = toDate.getHours(), min2 = toDate.getMinutes(), s2 = toDate.getSeconds();

    let years = y2 - y1;
    let months = m2 - m1;
    let days = d2 - d1;
    let hours = h2 - h1;
    let mins = min2 - min1;
    let secs = s2 - s1;

    if (secs < 0) {
        secs += 60;
        mins -= 1;
    }
    if (mins < 0) {
        mins += 60;
        hours -= 1;
    }
    if (hours < 0) {
        hours += 24;
        days -= 1;
    }
    if (days < 0) {
        // Borrow days from previous month relative to target month (m2 in year y2)
        const daysInPrevMonth = new Date(y2, m2, 0).getDate();
        days += daysInPrevMonth;
        months -= 1;
    }
    if (months < 0) {
        months += 12;
        years -= 1;
    }

    // Determine tier based on remaining time:
    // 1) >= 1 Year -> tier 'years' -> [ Year Year Month Month Day Day Hr Hr ]
    // 2) >= 1 Month and < 1 Year -> tier 'months' -> [ Month Month Day Day Hr Hr Min Min ]
    // 3) < 1 Month -> tier 'days' -> [ DD Hr Hr Min Min Sec Sec ]
    let tier = 'days';
    if (years >= 1) {
        tier = 'years';
    } else if (months >= 1) {
        tier = 'months';
    } else {
        tier = 'days';
    }

    return {
        isPast: false,
        years,
        months,
        days,
        hours,
        mins,
        secs,
        tier,
        totalMs: diffMs,
        diffMs: diffMs
    };
}

/**
 * Formats countdown breakdown object into a compact string.
 *
 * @param {Object} rem - Output from calculateExamTimeRemaining
 * @returns {string} Formatted countdown string
 */
function formatExamCountdownString(rem) {
    if (!rem || rem.isPast) return 'Ended';
    if (rem.tier === 'years') {
        // More than 1 year: Year Year Month Month Day day Hr hr
        return `${String(rem.years).padStart(2, '0')}y ${String(rem.months).padStart(2, '0')}mo ${String(rem.days).padStart(2, '0')}d ${String(rem.hours).padStart(2, '0')}h`;
    } else if (rem.tier === 'months') {
        // 1 month to 1 year: month month day day Hr Hr Min min
        return `${String(rem.months).padStart(2, '0')}mo ${String(rem.days).padStart(2, '0')}d ${String(rem.hours).padStart(2, '0')}h ${String(rem.mins).padStart(2, '0')}m`;
    } else {
        // Below 1 month: DD Hr Hr Min Min sec sec
        return `${String(rem.days).padStart(2, '0')}d ${String(rem.hours).padStart(2, '0')}h ${String(rem.mins).padStart(2, '0')}m ${String(rem.secs).padStart(2, '0')}s`;
    }
}

/**
 * Parses YYYY-MM-DD date and optional HH:MM time into epoch milliseconds.
 *
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {number} Epoch timestamp in milliseconds, or NaN
 */
function getExamTimestamp(dateStr, timeStr) {
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
}

/**
 * Updates desktop and mobile header live exam countdown components
 * and any upcoming exam target badges across dashboard cards.
 */
function updateHeaderExamCountdown() {
    const hdrSubject = document.getElementById('hdr-exam-cd-subject');
    const hdrTimer = document.getElementById('hdr-exam-cd-timer');
    const hdrSubjectMobile = document.getElementById('hdr-exam-cd-subject-mobile');
    const hdrTimerMobile = document.getElementById('hdr-exam-cd-timer-mobile');

    if (!hdrSubject && !hdrTimer && !hdrSubjectMobile && !hdrTimerMobile) return;

    const state = (typeof window !== 'undefined' && window.AppState) ? window.AppState : {};
    const exams = state.examRoutine || [];
    const now = Date.now();

    const userExams = exams
        .filter(e => e && e.subject && e.date)
        .map(e => {
            const timeMs = getExamTimestamp(e.date, e.time);
            return { ...e, timeMs };
        })
        .filter(e => !isNaN(e.timeMs))
        .sort((a, b) => a.timeMs - b.timeMs);

    const upcomingExams = userExams.filter(e => e.status !== 'completed' && e.timeMs > (now - 7200000));

    let nextExam = null;
    if (state.selectedCountdownExamId && state.selectedCountdownExamId !== 'auto') {
        nextExam = userExams.find(e => e.id === state.selectedCountdownExamId);
    }
    if (!nextExam) {
        nextExam = upcomingExams[0];
    }

    if (!nextExam) {
        if (hdrSubject) hdrSubject.textContent = "No Exam Scheduled";
        if (hdrTimer) hdrTimer.innerHTML = `<span class="font-countdown text-slate-400 dark:text-slate-500 font-bold text-sm md:text-base">--</span>`;
        if (hdrSubjectMobile) hdrSubjectMobile.textContent = "No Exam";
        if (hdrTimerMobile) hdrTimerMobile.textContent = "--";
    } else {
        const targetDate = new Date(nextExam.timeMs);
        const currentDate = new Date(now);
        const rem = calculateExamTimeRemaining(currentDate, targetDate);

        if (rem.isPast) {
            if (hdrSubject) hdrSubject.textContent = nextExam.subject;
            if (hdrTimer) hdrTimer.innerHTML = `<span class="font-countdown text-emerald-500 dark:text-emerald-400 font-black text-sm md:text-base flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>Live Now!</span>`;
            if (hdrSubjectMobile) hdrSubjectMobile.textContent = nextExam.subject;
            if (hdrTimerMobile) hdrTimerMobile.textContent = "Live Now";
        } else {
            const formatHdrCountdownHtml = (segments) => {
                return segments.map((seg, idx) => `
                    <span class="inline-flex items-baseline font-countdown ${idx > 0 ? 'ml-1 sm:ml-1.5 md:ml-2' : ''}">
                        <span class="hdr-countdown-num font-black text-xl sm:text-2xl md:text-[27px] lg:text-[29px] leading-none tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">${seg.val}</span>
                        <span class="hdr-countdown-unit text-[11px] md:text-[13px] font-extrabold text-white dark:text-white ml-0.5 leading-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">${seg.lbl}</span>
                    </span>
                `).join('').trim();
            };

            let compactTimerStrMobile = '';

            if (rem.tier === 'years') {
                if (hdrTimer) {
                    hdrTimer.innerHTML = formatHdrCountdownHtml([
                        { val: String(rem.years).padStart(2, '0'), lbl: 'y' },
                        { val: String(rem.months).padStart(2, '0'), lbl: 'mo' },
                        { val: String(rem.days).padStart(2, '0'), lbl: 'd' },
                        { val: String(rem.hours).padStart(2, '0'), lbl: 'h' }
                    ]);
                }
                compactTimerStrMobile = `${String(rem.years).padStart(2, '0')}y ${String(rem.months).padStart(2, '0')}mo ${String(rem.days).padStart(2, '0')}d`;
            } else if (rem.tier === 'months') {
                if (hdrTimer) {
                    hdrTimer.innerHTML = formatHdrCountdownHtml([
                        { val: String(rem.months).padStart(2, '0'), lbl: 'mo' },
                        { val: String(rem.days).padStart(2, '0'), lbl: 'd' },
                        { val: String(rem.hours).padStart(2, '0'), lbl: 'h' },
                        { val: String(rem.mins).padStart(2, '0'), lbl: 'm' }
                    ]);
                }
                compactTimerStrMobile = `${String(rem.months).padStart(2, '0')}mo ${String(rem.days).padStart(2, '0')}d ${String(rem.hours).padStart(2, '0')}h`;
            } else {
                if (hdrTimer) {
                    hdrTimer.innerHTML = formatHdrCountdownHtml([
                        { val: String(rem.days).padStart(2, '0'), lbl: 'd' },
                        { val: String(rem.hours).padStart(2, '0'), lbl: 'h' },
                        { val: String(rem.mins).padStart(2, '0'), lbl: 'm' },
                        { val: String(rem.secs).padStart(2, '0'), lbl: 's' }
                    ]);
                }
                compactTimerStrMobile = `${String(rem.days).padStart(2, '0')}d ${String(rem.hours).padStart(2, '0')}h ${String(rem.mins).padStart(2, '0')}m`;
            }

            if (hdrSubject) hdrSubject.textContent = nextExam.subject;
            if (hdrSubjectMobile) hdrSubjectMobile.textContent = nextExam.subject;
            if (hdrTimerMobile) hdrTimerMobile.textContent = compactTimerStrMobile;
        }
    }

    // Live update any dashboard exam target badge
    const dbExamBadges = document.querySelectorAll('[data-db-exam-target-time]');
    if (dbExamBadges.length > 0) {
        const nowDt = new Date(now);
        dbExamBadges.forEach(el => {
            const timeMs = parseInt(el.getAttribute('data-db-exam-target-time'), 10);
            if (!isNaN(timeMs)) {
                const cRem = calculateExamTimeRemaining(nowDt, new Date(timeMs));
                if (!cRem.isPast) {
                    const cStr = formatExamCountdownString(cRem);
                    if (el.textContent !== cStr) {
                        el.textContent = cStr;
                    }
                } else if (cRem.diffMs > -7200000) {
                    if (el.textContent !== '● Live Today') {
                        el.textContent = '● Live Today';
                    }
                } else {
                    if (el.textContent !== 'Ended') {
                        el.textContent = 'Ended';
                    }
                }
            }
        });
    }
}

/**
 * Global heartbeat: updates header countdown and ExamRoutinePage hero if mounted.
 */
function updateExamCountdown() {
    updateHeaderExamCountdown();
    if (typeof window !== 'undefined' && window.ExamRoutinePage && window.ExamRoutinePage.isMounted && typeof window.ExamRoutinePage.updateHeroCountdown === 'function') {
        window.ExamRoutinePage.updateHeroCountdown();
    }
}

/**
 * Starts the live 1-second countdown ticker.
 *
 * @param {number} [intervalMs=1000]
 */
function startExamCountdownInterval(intervalMs = 1000) {
    if (_countdownIntervalId) clearInterval(_countdownIntervalId);
    _countdownIntervalId = setInterval(() => {
        updateExamCountdown();
    }, intervalMs);
    // Execute once immediately
    updateExamCountdown();
}

/**
 * Stops the live countdown ticker.
 */
function stopExamCountdownInterval() {
    if (_countdownIntervalId) {
        clearInterval(_countdownIntervalId);
        _countdownIntervalId = null;
    }
}

// Window attachments for backward compatibility with classic scripts and HTML handlers

    // Global attachments
    global.startExamCountdownInterval = startExamCountdownInterval;
    global.stopExamCountdownInterval = stopExamCountdownInterval;
    global.updateExamCountdown = updateExamCountdown;
    global.updateHeaderExamCountdown = updateHeaderExamCountdown;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { startExamCountdownInterval, stopExamCountdownInterval, updateExamCountdown, updateHeaderExamCountdown };
    }

    startExamCountdownInterval(1000);
})(typeof window !== 'undefined' ? window : globalThis);
