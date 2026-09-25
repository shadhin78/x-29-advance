'use client';

/**
 * X-29 Top Stats & Exam Countdown Header (components/shell/TopStatsBar.tsx)
 * 
 * Exact 100% parity with legacy index.html header:
 * - Left: #header-exam-countdown-compact (Rose badge, active pulse, exam subject, countdown)
 * - Right: Stats Widgets (Current Time, Success Score, Time Elapsed, Final Deadline)
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useExamStore } from '@/stores/useExamStore';
import { usePaceStore } from '@/stores/usePaceStore';
import { useTaxonomyStore } from '@/stores/useTaxonomyStore';

export const TopStatsBar: React.FC = () => {
  const [timeString, setTimeString] = useState('');
  const [now, setNow] = useState<Date | null>(null);

  const { examRoutine, selectedCountdownExamId } = useExamStore();
  const { paceGoals } = usePaceStore();
  const { getNormalizedSubjects, passedItems } = useTaxonomyStore();
  const subjects = getNormalizedSubjects();

  // 1-second live ticker for clock and countdowns
  useEffect(() => {
    const tick = () => {
      const current = new Date();
      setNow(current);
      let hrs = current.getHours();
      const mins = current.getMinutes().toString().padStart(2, '0');
      const secs = current.getSeconds().toString().padStart(2, '0');
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12;
      if (hrs === 0) hrs = 12;
      setTimeString(`${hrs}:${mins}:${secs} ${ampm}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Exam Countdown calculation matching features/exam/countdown.js
  const examCountdownData = useMemo(() => {
    if (!now) return { subject: 'Exam', isPast: false, segments: [{ val: '00', lbl: 'd' }, { val: '00', lbl: 'h' }, { val: '00', lbl: 'm' }, { val: '00', lbl: 's' }] };

    const validExams = (examRoutine || [])
      .filter((e) => e && e.subject && e.date)
      .map((e) => {
        const parts = e.date.split('-');
        if (parts.length !== 3) return { ...e, timeMs: NaN };
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        let hours = 0;
        let minutes = 0;
        if (e.time) {
          const tParts = e.time.split(':');
          hours = parseInt(tParts[0], 10) || 0;
          minutes = parseInt(tParts[1], 10) || 0;
        }
        const timeMs = new Date(year, month, day, hours, minutes, 0, 0).getTime();
        return { ...e, timeMs };
      })
      .filter((e) => !isNaN(e.timeMs))
      .sort((a, b) => a.timeMs - b.timeMs);

    let nextExam = null;
    if (selectedCountdownExamId && selectedCountdownExamId !== 'auto') {
      nextExam = validExams.find((e) => e.id === selectedCountdownExamId);
    }
    if (!nextExam) {
      const nowMs = now.getTime();
      nextExam = validExams.find((e) => !e.completed && e.timeMs > (nowMs - 7200000));
    }

    if (!nextExam) {
      return {
        subject: 'No Exam Scheduled',
        isPast: false,
        segments: [{ val: '00', lbl: 'd' }, { val: '00', lbl: 'h' }, { val: '00', lbl: 'm' }, { val: '00', lbl: 's' }],
      };
    }

    const diffMs = nextExam.timeMs - now.getTime();
    if (diffMs <= 0) {
      return {
        subject: nextExam.subject,
        isPast: true,
        segments: [],
      };
    }

    let y1 = now.getFullYear(), m1 = now.getMonth(), d1 = now.getDate();
    let h1 = now.getHours(), min1 = now.getMinutes(), s1 = now.getSeconds();

    const toDate = new Date(nextExam.timeMs);
    let y2 = toDate.getFullYear(), m2 = toDate.getMonth(), d2 = toDate.getDate();
    let h2 = toDate.getHours(), min2 = toDate.getMinutes(), s2 = toDate.getSeconds();

    let years = y2 - y1;
    let months = m2 - m1;
    let days = d2 - d1;
    let hours = h2 - h1;
    let mins = min2 - min1;
    let secs = s2 - s1;

    if (secs < 0) { secs += 60; mins -= 1; }
    if (mins < 0) { mins += 60; hours -= 1; }
    if (hours < 0) { hours += 24; days -= 1; }
    if (days < 0) {
      const daysInPrevMonth = new Date(y2, m2, 0).getDate();
      days += daysInPrevMonth;
      months -= 1;
    }
    if (months < 0) { months += 12; years -= 1; }

    if (years >= 1) {
      return {
        subject: nextExam.subject,
        isPast: false,
        segments: [
          { val: String(years).padStart(2, '0'), lbl: 'y' },
          { val: String(months).padStart(2, '0'), lbl: 'mo' },
          { val: String(days).padStart(2, '0'), lbl: 'd' },
          { val: String(hours).padStart(2, '0'), lbl: 'h' },
        ],
      };
    } else if (months >= 1) {
      return {
        subject: nextExam.subject,
        isPast: false,
        segments: [
          { val: String(months).padStart(2, '0'), lbl: 'mo' },
          { val: String(days).padStart(2, '0'), lbl: 'd' },
          { val: String(hours).padStart(2, '0'), lbl: 'h' },
          { val: String(mins).padStart(2, '0'), lbl: 'm' },
        ],
      };
    } else {
      return {
        subject: nextExam.subject,
        isPast: false,
        segments: [
          { val: String(days).padStart(2, '0'), lbl: 'd' },
          { val: String(hours).padStart(2, '0'), lbl: 'h' },
          { val: String(mins).padStart(2, '0'), lbl: 'm' },
          { val: String(secs).padStart(2, '0'), lbl: 's' },
        ],
      };
    }
  }, [now, examRoutine, selectedCountdownExamId]);

  // Success Score calculation matching js/core/metrics.js
  const successScorePct = useMemo(() => {
    const total = subjects.length;
    if (total === 0) return 0;
    const passedCount = subjects.filter(
      (s) =>
        s.isPassed ||
        passedItems.subjects.includes(s.name) ||
        (s.program && passedItems.programs.includes(s.program))
    ).length;
    return Math.round((passedCount / total) * 100);
  }, [subjects, passedItems]);

  // Time Elapsed & Final Deadline matching js/core/metrics.js
  const { daysGone, daysLeft, hasDeadline } = useMemo(() => {
    const primary = paceGoals[0];
    if (!primary || !primary.startDate || !primary.deadline || !now) {
      return { daysGone: 0, daysLeft: 0, hasDeadline: false };
    }
    const start = new Date(primary.startDate);
    const target = new Date(primary.deadline);
    const msPerDay = 1000 * 60 * 60 * 24;

    const diffGone = now.getTime() - start.getTime();
    const gone = Math.max(0, Math.floor(diffGone / msPerDay));

    const diffLeft = target.getTime() - now.getTime();
    const left = Math.ceil(diffLeft / msPerDay);

    return { daysGone: gone, daysLeft: Math.max(0, left), hasDeadline: true };
  }, [paceGoals, now]);

  return (
    <header
      id="top-stats-bar"
      aria-label="Executive Statistics and Exam Countdown"
      className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3.5 md:gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 md:pb-6 shrink-0 select-none"
    >
      {/* Exam Countdown Widget Container (Matching Stats Widget Size & Card Styling) */}
      <Link
        href="/exam"
        id="header-exam-countdown-compact"
        aria-label={`Upcoming exam countdown for ${examCountdownData.subject}`}
        className="hidden lg:flex items-center bg-white dark:bg-slate-800/80 px-3.5 py-2.5 md:px-4 md:py-3 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 h-[64px] min-h-[64px] shrink-0 justify-center md:justify-start hover:border-rose-300 dark:hover:border-rose-800/60 transition-all duration-300 group cursor-pointer max-w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-rose-500"
        title="View Exam Routine"
      >
        <div className="flex items-center space-x-2.5 md:space-x-3">
          <div className="p-2 md:p-2.5 bg-gradient-to-br from-rose-50 to-rose-100/60 dark:from-rose-950/50 dark:to-rose-900/30 rounded-xl md:rounded-2xl border border-rose-200/70 dark:border-rose-800/50 shadow-[0_0_15px_rgba(244,63,94,0.15)] text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2 md:gap-2.5 leading-none">
            <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
            </span>
            <span
              id="hdr-exam-cd-subject"
              className="font-outfit font-black text-base sm:text-lg md:text-xl xl:text-2xl text-slate-800 dark:text-slate-100 tracking-tight truncate max-w-[100px] sm:max-w-[130px] xl:max-w-[180px] leading-none"
            >
              {examCountdownData.subject}
            </span>
            <span className="text-slate-300 dark:text-slate-600 font-black text-base md:text-xl select-none px-0.5 leading-none">
              -
            </span>
            <div id="hdr-exam-cd-timer" className="font-countdown flex items-baseline leading-none">
              {examCountdownData.isPast ? (
                <span className="font-countdown text-emerald-500 dark:text-emerald-400 font-black text-xs md:text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>Live Now!
                </span>
              ) : examCountdownData.segments.length > 0 ? (
                examCountdownData.segments.map((seg, idx) => (
                  <span
                    key={seg.lbl}
                    className={`inline-flex items-baseline font-countdown ${idx > 0 ? 'ml-0.5 sm:ml-1 md:ml-1.5' : ''}`}
                  >
                    <span className="hdr-countdown-num font-black text-base sm:text-lg md:text-xl xl:text-[24px] leading-none tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
                      {seg.val}
                    </span>
                    <span className="hdr-countdown-unit text-[9px] md:text-[11px] font-extrabold text-white dark:text-white ml-0.5 leading-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {seg.lbl}
                    </span>
                  </span>
                ))
              ) : (
                <span className="font-countdown text-slate-400 dark:text-slate-500 font-bold text-sm md:text-base">
                  --
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Stats Widgets */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 md:flex md:flex-row md:items-center md:divide-x-0 bg-white dark:bg-slate-800/80 p-3 md:p-3.5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 w-full xl:w-auto justify-center min-h-[64px] max-w-full overflow-x-auto custom-scrollbar">
        {/* Current Time */}
        <div id="header-clock-stats" className="hidden md:block pr-2.5 sm:pr-3.5">
          <div className="flex items-center space-x-2 md:space-x-2.5">
            <div className="p-2 md:p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg md:rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm text-blue-600 dark:text-blue-450 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-left">
              <span className="block text-[9px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">
                Current Time
              </span>
              <span className="text-blue-600 dark:text-blue-450 font-black text-sm md:text-base tracking-tight font-mono">
                {timeString || '--:--:--'}
              </span>
            </div>
          </div>
        </div>

        {/* Success Score */}
        <div
          id="success-score-stats"
          className="border-l-0 md:border-l border-slate-200 dark:border-slate-700 pl-2 sm:pl-2.5 md:pl-3.5 xl:pl-4 pr-2 sm:pr-2.5 md:pr-3.5 xl:pr-4"
        >
          <div className="flex items-center space-x-2 md:space-x-3 justify-center md:justify-start">
            <div className="hidden md:flex p-2 md:p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg md:rounded-xl border border-emerald-200 dark:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">
                Success Score
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-base md:text-2xl drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]">
                {successScorePct}%
              </span>
            </div>
          </div>
        </div>

        {/* Time Elapsed */}
        <div
          id="time-gone-stats"
          className="border-l-0 md:border-l border-slate-200 dark:border-slate-700 pl-2 sm:pl-2.5 md:pl-3.5 xl:pl-4 pr-2 sm:pr-2.5 md:pr-3.5 xl:pr-4"
        >
          <div className="flex items-center space-x-2 md:space-x-3 justify-center md:justify-start">
            <div className="hidden md:flex p-2 md:p-2 bg-red-100 dark:bg-red-500/20 rounded-lg md:rounded-xl border border-red-200 dark:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <svg className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">
                Time Elapsed
              </span>
              <span className="text-red-600 dark:text-red-400 font-black text-sm sm:text-base md:text-2xl drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)]">
                {hasDeadline ? `${daysGone} Days` : 'Not Set'}
              </span>
            </div>
          </div>
        </div>

        {/* Final Deadline */}
        <div
          id="countdown-timer"
          className="border-l-0 md:border-l border-slate-200 dark:border-slate-700 pl-2 sm:pl-2.5 md:pl-3.5 xl:pl-4 text-center md:text-right"
        >
          <div className="text-center md:text-right">
            <span className="block text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-wider">
              Final Deadline
            </span>
            {hasDeadline ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 font-black text-sm sm:text-base md:text-2xl drop-shadow-sm">
                {daysLeft} Days
              </span>
            ) : (
              <span className="text-slate-400 font-black text-sm sm:text-base md:text-base drop-shadow-sm">
                Not Set
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopStatsBar;
