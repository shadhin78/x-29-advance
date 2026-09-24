'use client';

/**
 * X-29 Exam Hero Countdown Component (features/exam/components/ExamHeroCountdown.tsx)
 * 
 * Pixel-perfect parity with legacy #exam-countdown-hero:
 * - Rose/Slate glowing gradient with atmospheric blurs
 * - Live pulsating ping badge
 * - Custom Pin target selector dropdown
 * - Live digital countdown timer with tabular numerals and calendar-accurate tiering
 */

import React, { useMemo } from 'react';
import type { ExamRoutineItem, ExamSession } from '@/types/exam';
import { useExamCountdown } from '@/features/exam/hooks/useExamCountdown';
import { getSubjectColor } from '@/features/taxonomy/services/taxonomyService';
import { hexToRgba, parseExamDateTime } from '@/features/exam/services/examService';

interface ExamHeroCountdownProps {
  exams: ExamRoutineItem[];
  sessions: ExamSession[];
  selectedExamId: string;
  onSelectExamId: (id: string) => void;
}

export const ExamHeroCountdown: React.FC<ExamHeroCountdownProps> = React.memo(
  function ExamHeroCountdown({
    exams,
    sessions,
    selectedExamId,
    onSelectExamId,
  }) {
    const countdown = useExamCountdown(exams, sessions, selectedExamId);
    const target = countdown.targetExam;
    const session = countdown.targetSession;

    // Build the list of selectable exams for the Pin dropdown
    const selectableExams = useMemo(() => {
      return exams
        .filter((e) => e && e.subject && e.date)
        .map((e) => ({ ...e, timeMs: parseExamDateTime(e) }))
        .filter((e) => !isNaN(e.timeMs))
        .sort((a, b) => a.timeMs - b.timeMs);
    }, [exams]);

    // Format target date
    const formattedDate = useMemo(() => {
      if (!target) return '--';
      const timeMs = parseExamDateTime(target);
      if (isNaN(timeMs)) return target.date;
      const d = new Date(timeMs);
      return (
        d.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
        ' at ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }, [target]);

    // Determine badge and accent colors
    const subjectColor = target ? getSubjectColor(target.subject) : '#ef4444';
    const badgeBg = hexToRgba(subjectColor, 0.3);

    // Subject/Session display name in badge
    const sessionOrSubjectName = useMemo(() => {
      if (!target) return '--';
      if (session) {
        return session.name
          ? `${session.name} (${session.program})`
          : `${session.program} Session`;
      }
      return target.program || 'Session Exam';
    }, [target, session]);

    // Determine 4 countdown digit boxes based on tier
    const boxes = useMemo(() => {
      if (!target || countdown.isPast && !countdown.isLiveToday) {
        return [
          { val: '00', lbl: 'Days', isSec: false },
          { val: '00', lbl: 'Hours', isSec: false },
          { val: '00', lbl: 'Mins', isSec: false },
          { val: '00', lbl: 'Secs', isSec: true },
        ];
      }

      if (countdown.tier === 'years') {
        return [
          { val: String(countdown.years).padStart(2, '0'), lbl: 'Years', isSec: false },
          { val: String(countdown.months).padStart(2, '0'), lbl: 'Months', isSec: false },
          { val: String(countdown.days).padStart(2, '0'), lbl: 'Days', isSec: false },
          { val: String(countdown.hours).padStart(2, '0'), lbl: 'Hours', isSec: true },
        ];
      } else if (countdown.tier === 'months') {
        return [
          { val: String(countdown.months).padStart(2, '0'), lbl: 'Months', isSec: false },
          { val: String(countdown.days).padStart(2, '0'), lbl: 'Days', isSec: false },
          { val: String(countdown.hours).padStart(2, '0'), lbl: 'Hours', isSec: false },
          { val: String(countdown.minutes).padStart(2, '0'), lbl: 'Mins', isSec: true },
        ];
      } else {
        return [
          { val: String(countdown.days).padStart(2, '0'), lbl: 'Days', isSec: false },
          { val: String(countdown.hours).padStart(2, '0'), lbl: 'Hours', isSec: false },
          { val: String(countdown.minutes).padStart(2, '0'), lbl: 'Mins', isSec: false },
          { val: String(countdown.seconds).padStart(2, '0'), lbl: 'Secs', isSec: true },
        ];
      }
    }, [target, countdown]);

    return (
      <div
        id="exam-countdown-hero"
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 shadow-2xl border border-rose-500/20 mb-6 md:mb-10"
      >
        {/* Background Decorative Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 md:gap-8">
          {/* Left Info Block */}
          <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Live Countdown
              </span>

              <span
                id="exam-hero-subject-badge"
                style={{ backgroundColor: badgeBg }}
                className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-200 border border-white/10 truncate max-w-[140px] sm:max-w-[180px] lg:max-w-xs shrink-0"
              >
                {sessionOrSubjectName}
              </span>

              {/* Pin Target Selector */}
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold text-slate-200 max-w-full min-w-0">
                <label
                  htmlFor="exam-hero-select-target"
                  className="text-[10px] font-black uppercase text-rose-300 tracking-wider shrink-0"
                >
                  Pin:
                </label>
                <select
                  id="exam-hero-select-target"
                  data-exam-countdown-target
                  value={selectedExamId}
                  onChange={(e) => onSelectExamId(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer truncate min-w-0 max-w-[170px] sm:max-w-[220px] lg:max-w-sm"
                >
                  <option value="auto" className="bg-slate-900 text-white">
                    ⚡ Auto (Nearest Upcoming Subject Exam)
                  </option>
                  {selectableExams.map((e) => {
                    const parent = sessions.find((s) => s.id === e.sessionId);
                    const tag = parent ? parent.program : e.program || 'Custom';
                    const statusTag = e.status === 'completed' || e.completed ? ' [Completed]' : '';
                    return (
                      <option key={e.id} value={e.id} className="bg-slate-900 text-white">
                        📚 {e.subject} ({e.date}) - {tag}
                        {statusTag}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <h2
                id="exam-hero-title"
                className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight leading-tight text-white break-words"
              >
                {target ? target.subject : 'No Subject Exam Scheduled'}
              </h2>

              <div
                id="exam-hero-details"
                className="text-xs sm:text-sm text-rose-200/80 font-medium mt-1 flex items-center gap-2 flex-wrap sm:flex-nowrap"
              >
                {!target ? (
                  <>
                    <svg
                      className="w-4 h-4 text-rose-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Add a subject exam inside a session block to activate the live countdown.</span>
                  </>
                ) : countdown.isPast ? (
                  <span className="text-emerald-400 font-black flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {target.subject.toUpperCase()} EXAM IS IN PROGRESS NOW!
                  </span>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 text-rose-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Target Subject Exam:{' '}
                      <strong className="text-white font-black">{target.subject}</strong> ({formattedDate})
                    </span>
                  </>
                )}
              </div>
            </div>

            <div
              id="exam-hero-meta"
              className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-bold text-slate-300 pt-1"
            >
              {(target?.room || target?.venue) && (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-xl">
                  <svg
                    className="w-4 h-4 text-amber-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span id="exam-hero-venue">Venue: {target.room || target.venue}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-xl">
                <svg
                  className="w-4 h-4 text-rose-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span id="exam-hero-datetime">Date: {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Right Live Digital Countdown Timer */}
          <div className="w-full lg:w-auto shrink-0 bg-black/40 backdrop-blur-xl border border-white/15 p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-300/80 mb-2 sm:mb-3">
              Time Remaining
            </span>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 md:gap-3 text-center w-full sm:w-auto">
              {boxes.map((b, idx) => (
                <div
                  key={b.lbl}
                  className="bg-white/10 border border-white/15 p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl min-w-0 lg:min-w-[65px] xl:min-w-[75px] flex-1 flex flex-col justify-center items-center"
                >
                  <div
                    id={`exam-cd-val-${idx + 1}`}
                    className={`text-xl sm:text-2xl md:text-3xl font-black ${
                      b.isSec ? 'text-rose-400' : 'text-white'
                    } tracking-wider tabular-nums leading-none sm:leading-tight`}
                  >
                    {b.val}
                  </div>
                  <div
                    id={`exam-cd-lbl-${idx + 1}`}
                    className="text-[8px] sm:text-[9px] font-black uppercase text-rose-300 mt-1 truncate"
                  >
                    {b.lbl}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
