'use client';

/**
 * X-29 Mobile Header Bar (components/shell/MobileHeader.tsx)
 * 
 * Exact 100% parity with legacy index.html mobile header:
 * - Left: 3-dot menu toggle button (#mobile-sidebar-toggle)
 * - Center: Compact Exam Countdown Pill (#header-exam-countdown-compact-mobile)
 * - Right: Blue Live Clock Pill (#mobile-header-clock)
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useExamStore } from '@/stores/useExamStore';

interface MobileHeaderProps {
  onToggleMenu: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onToggleMenu }) => {
  const [timeString, setTimeString] = useState('');
  const [now, setNow] = useState<Date | null>(null);

  const { examRoutine, selectedCountdownExamId } = useExamStore();

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

  const examData = useMemo(() => {
    if (!now) return { subject: 'Exam', timerStr: '00d 00h' };

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
      return { subject: 'No Exam', timerStr: '--' };
    }

    const diffMs = nextExam.timeMs - now.getTime();
    if (diffMs <= 0) {
      return { subject: nextExam.subject, timerStr: 'Live Now' };
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const msPerHour = 1000 * 60 * 60;
    const days = Math.floor(diffMs / msPerDay);
    const hours = Math.floor((diffMs % msPerDay) / msPerHour);

    return {
      subject: nextExam.subject,
      timerStr: `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h`,
    };
  }, [now, examRoutine, selectedCountdownExamId]);

  return (
    <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0 select-none">
      {/* Left Side: Toggle button and Title/Subtitle */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Three Dot Menu Button on the Left */}
        <button
          id="mobile-sidebar-toggle"
          onClick={onToggleMenu}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all active:scale-90 shadow-sm shrink-0 cursor-pointer"
          aria-label="Toggle navigation drawer"
        >
          <svg
            className="w-5 h-5 text-slate-600 dark:text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="6" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </button>

        <div className="flex flex-col min-w-0">
          <Link
            href="/exam"
            id="header-exam-countdown-compact-mobile"
            className="flex items-center min-h-[44px] cursor-pointer active:scale-95 transition-all"
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/20 dark:border-rose-500/30 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span
                id="hdr-exam-cd-subject-mobile"
                className="text-rose-600 dark:text-rose-400 font-extrabold truncate max-w-[100px]"
              >
                {examData.subject}
              </span>
              <span className="text-slate-300 dark:text-slate-600 font-black">•</span>
              <span
                id="hdr-exam-cd-timer-mobile"
                className="font-countdown font-bold text-slate-800 dark:text-slate-100 tracking-tight tabular-nums"
              >
                {examData.timerStr}
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Right Side: Clock */}
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <div id="mobile-header-clock">
          <div className="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 shadow-sm text-blue-600 dark:text-blue-450">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-black text-[11px] tracking-tight font-mono">
              {timeString || '--:--:--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
