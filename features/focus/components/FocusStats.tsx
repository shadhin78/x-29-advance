'use client';

/**
 * X-29 Focus Stats Component (features/focus/components/FocusStats.tsx)
 * 
 * Aggregates Today, Weekly, and Monthly study duration from timer logs,
 * tracks Daily Focus Target progress, and shows Subject Time Breakdown bars.
 */

import React, { useMemo, useState } from 'react';
import type { TimerLogSession } from '@/types/timer';
import { formatSecondsToClock } from '@/features/focus/services/timerEngine';
import { getSubjectColor } from '@/features/focus/services/focusSubjectAdapter';
import { Clock, Calendar, BarChart3, Target, Edit2, Check } from 'lucide-react';

interface FocusStatsProps {
  timerLogs: TimerLogSession[];
  activeRunningElapsedSec: number;
}

export const FocusStats: React.FC<FocusStatsProps> = React.memo(function FocusStats({
  timerLogs,
  activeRunningElapsedSec,
}) {
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Start of current week (Monday)
    const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    const weekStart = monday.getTime();

    // Start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todaySecs = activeRunningElapsedSec;
    let weekSecs = activeRunningElapsedSec;
    let monthSecs = activeRunningElapsedSec;

    const subjectMap: Record<string, number> = {};

    timerLogs.forEach((log) => {
      const logTime = new Date(log.date).getTime();
      const dur = Number(log.duration || 0);

      if (logTime >= todayStart) {
        todaySecs += dur;
      }
      if (logTime >= weekStart) {
        weekSecs += dur;
      }
      if (logTime >= monthStart) {
        monthSecs += dur;
      }

      const sub = log.subject || 'General Study';
      subjectMap[sub] = (subjectMap[sub] || 0) + dur;
    });

    // Subject breakdown
    const totalSubjectSecs = Object.values(subjectMap).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(subjectMap)
      .map(([subject, totalSeconds]) => {
        const percentage = totalSubjectSecs > 0 ? Math.round((totalSeconds / totalSubjectSecs) * 100) : 0;
        return {
          subject,
          totalSeconds,
          percentage,
          color: getSubjectColor(subject),
        };
      })
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 6);

    return {
      todaySecs,
      weekSecs,
      monthSecs,
      breakdown,
    };
  }, [timerLogs, activeRunningElapsedSec]);

  return (
    <div className="space-y-6">
      {/* Stat Summary Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Today's Focus */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Today's Focus
            </span>
            <h2
              id="timer-stat-today"
              className="text-3xl font-black text-slate-800 dark:text-white"
            >
              {formatSecondsToClock(stats.todaySecs)}
            </h2>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Weekly Focus */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Weekly Focus
            </span>
            <h2
              id="timer-stat-week"
              className="text-3xl font-black text-slate-800 dark:text-white"
            >
              {formatSecondsToClock(stats.weekSecs)}
            </h2>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        {/* Monthly Focus */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Monthly Focus
            </span>
            <h2
              id="timer-stat-month"
              className="text-3xl font-black text-slate-800 dark:text-white"
            >
              {formatSecondsToClock(stats.monthSecs)}
            </h2>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Time Allocation per Subject */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-3xl shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
            Subject Time Breakdown
          </h4>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Focus time allocation by topic
          </p>
        </div>

        <div id="timer-subject-breakdown-container" className="space-y-3">
          {stats.breakdown.length === 0 ? (
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center py-4">
              No study sessions recorded yet.
            </p>
          ) : (
            stats.breakdown.map((item) => (
              <div key={item.subject} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.subject}</span>
                  </span>
                  <span className="text-slate-400 font-mono shrink-0">
                    {formatSecondsToClock(item.totalSeconds)} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
