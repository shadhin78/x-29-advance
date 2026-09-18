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
  dailyFocusHoursTarget: number;
  onSetDailyTarget: (hours: number) => void;
}

export const FocusStats: React.FC<FocusStatsProps> = React.memo(function FocusStats({
  timerLogs,
  activeRunningElapsedSec,
  dailyFocusHoursTarget,
  onSetDailyTarget,
}) {
  const [editingTarget, setEditingTarget] = useState<boolean>(false);
  const [targetInput, setTargetInput] = useState<string>(String(dailyFocusHoursTarget || 4));

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

  // Daily target progress
  const targetSecs = dailyFocusHoursTarget * 3600;
  const targetProgressPercent = targetSecs > 0 ? Math.min(100, Math.round((stats.todaySecs / targetSecs) * 100)) : 0;

  const handleSaveTarget = () => {
    const num = parseFloat(targetInput);
    if (!isNaN(num) && num >= 0) {
      onSetDailyTarget(num);
      setEditingTarget(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 gap-3">
        {/* Today's Focus */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Today's Focus
            </span>
            <h2
              id="timer-stat-today"
              className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white font-mono"
            >
              {formatSecondsToClock(stats.todaySecs)}
            </h2>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/40 shadow-inner">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Weekly Focus */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Weekly Focus
            </span>
            <h2
              id="timer-stat-week"
              className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white font-mono"
            >
              {formatSecondsToClock(stats.weekSecs)}
            </h2>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-inner">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        {/* Monthly Focus */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Monthly Focus
            </span>
            <h2
              id="timer-stat-month"
              className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white font-mono"
            >
              {formatSecondsToClock(stats.monthSecs)}
            </h2>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-inner">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Daily Target Progress Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
              Daily Target Goal
            </h4>
          </div>
          {editingTarget ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-16 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center text-white outline-none"
              />
              <span className="text-[10px] text-slate-400 font-bold">hrs</span>
              <button
                type="button"
                onClick={handleSaveTarget}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTargetInput(String(dailyFocusHoursTarget || 4));
                setEditingTarget(true);
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
            >
              <span>{dailyFocusHoursTarget > 0 ? `${dailyFocusHoursTarget}h Target` : 'Set Goal'}</span>
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-emerald-500"
            style={{ width: `${targetProgressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
          <span>{targetProgressPercent}% Completed</span>
          <span>Target: {dailyFocusHoursTarget} hrs</span>
        </div>
      </div>

      {/* Subject Time Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm space-y-3">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
            Subject Time Breakdown
          </h4>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Focus allocation by topic
          </p>
        </div>

        {stats.breakdown.length === 0 ? (
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center py-4">
            No study sessions recorded yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {stats.breakdown.map((item) => (
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
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
