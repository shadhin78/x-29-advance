'use client';

/**
 * X-29 Action Analytics Modal (features/daily-actions/components/modals/ActionAnalyticsModal.tsx)
 * 
 * 100% Visual & Behavioral Parity with legacy #analytics-modal & dailyTracker.js:
 * - 3 Stat boxes: Total Hits, Current Streak, Consistency (%) with action color theme
 * - GitHub-style 7-day row Activity Heatmap Trend Grid (90D, 180D, 365D selectable range) with month labels & direct toggle
 * - Recent Check-ins (Direct Toggle) grid (#am-grid) with glowing YES/NO gradient buttons
 * - Zero Lucide icon imports: 100% raw SVG icons and native emojis matching legacy
 */

import React, { useState, useMemo } from 'react';
import { useDailyActionStore } from '@/stores/useDailyActionStore';

interface ActionAnalyticsModalProps {
  isOpen: boolean;
  actionId: string | null;
  onClose: () => void;
}

const COLOR_MAP: Record<
  string,
  {
    border: string;
    iconBg: string;
    text: string;
    borderLt: string;
    iconColor: string;
    hex: string;
    bgLt: string;
    btn: string;
  }
> = {
  blue: {
    border: 'border-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-500',
    borderLt: 'border-blue-200 dark:border-blue-800/50',
    iconColor: 'text-blue-500',
    hex: '#3b82f6',
    bgLt: 'bg-blue-50 dark:bg-blue-900/30',
    btn: 'bg-blue-500',
  },
  indigo: {
    border: 'border-indigo-500',
    iconBg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-500',
    borderLt: 'border-indigo-200 dark:border-indigo-800/50',
    iconColor: 'text-indigo-500',
    hex: '#6366f1',
    bgLt: 'bg-indigo-50 dark:bg-indigo-900/30',
    btn: 'bg-indigo-500',
  },
  emerald: {
    border: 'border-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-500',
    borderLt: 'border-emerald-200 dark:border-emerald-800/50',
    iconColor: 'text-emerald-500',
    hex: '#10b981',
    bgLt: 'bg-emerald-50 dark:bg-emerald-900/30',
    btn: 'bg-emerald-500',
  },
  orange: {
    border: 'border-orange-500',
    iconBg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-500',
    borderLt: 'border-orange-200 dark:border-orange-800/50',
    iconColor: 'text-orange-500',
    hex: '#f97316',
    bgLt: 'bg-orange-50 dark:bg-orange-900/30',
    btn: 'bg-orange-500',
  },
  purple: {
    border: 'border-purple-500',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-500',
    borderLt: 'border-purple-200 dark:border-purple-800/50',
    iconColor: 'text-purple-500',
    hex: '#8b5cf6',
    bgLt: 'bg-purple-50 dark:bg-purple-900/30',
    btn: 'bg-purple-500',
  },
  rose: {
    border: 'border-rose-500',
    iconBg: 'bg-rose-50 dark:bg-rose-900/30',
    text: 'text-rose-500',
    borderLt: 'border-rose-200 dark:border-rose-800/50',
    iconColor: 'text-rose-500',
    hex: '#f43f5e',
    bgLt: 'bg-rose-50 dark:bg-rose-900/30',
    btn: 'bg-rose-500',
  },
  cyan: {
    border: 'border-cyan-500',
    iconBg: 'bg-cyan-50 dark:bg-cyan-900/30',
    text: 'text-cyan-500',
    borderLt: 'border-cyan-200 dark:border-cyan-800/50',
    iconColor: 'text-cyan-500',
    hex: '#06b6d4',
    bgLt: 'bg-cyan-50 dark:bg-cyan-900/30',
    btn: 'bg-cyan-500',
  },
};

export const ActionAnalyticsModal: React.FC<ActionAnalyticsModalProps> = ({
  isOpen,
  actionId,
  onClose,
}) => {
  const { habits, toggleHabit } = useDailyActionStore();

  const [heatmapRange, setHeatmapRange] = useState<90 | 180 | 365>(180);

  const targetAction = useMemo(() => {
    if (!actionId) return habits[0] || null;
    return habits.find((h) => h.id === actionId) || habits[0] || null;
  }, [actionId, habits]);

  const cMap = useMemo(() => {
    const col = targetAction?.color || 'blue';
    return COLOR_MAP[col] || COLOR_MAP.blue;
  }, [targetAction]);

  // Compute stats: total hits, current streak, consistency %, longest streak
  const stats = useMemo(() => {
    if (!targetAction) return { totalHits: 0, streak: 0, consistency: 0, longestStreak: 0, possibleDays: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let total = 0;
    let streak = 0;
    let streakActive = true;
    let longestStreak = 0;
    let tempStreak = 0;

    let possibleDays = 0;
    const checkDate = new Date(today);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - (heatmapRange - 1));

    while (checkDate >= minDate) {
      possibleDays++;
      const iso = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      const isDone = !!targetAction.history[iso];

      if (isDone) {
        total++;
        if (streakActive) streak++;
      } else {
        streakActive = false;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Longest streak calculation
    const streakIter = new Date(minDate);
    while (streakIter <= today) {
      const iso = `${streakIter.getFullYear()}-${String(streakIter.getMonth() + 1).padStart(2, '0')}-${String(streakIter.getDate()).padStart(2, '0')}`;
      const isDone = !!targetAction.history[iso];
      if (isDone) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
      streakIter.setDate(streakIter.getDate() + 1);
    }

    const consistency = possibleDays > 0 ? Math.round((total / possibleDays) * 100) : 0;

    return {
      totalHits: total,
      streak,
      consistency,
      longestStreak,
      possibleDays,
    };
  }, [targetAction, heatmapRange]);

  // GitHub-style 7-day row heatmap data structure aligned with Sunday
  const heatmapData = useMemo(() => {
    if (!targetAction) return { weeks: [], monthLabels: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (heatmapRange - 1));
    startDate.setHours(0, 0, 0, 0);

    // Align to Sunday
    const startDayOfWeek = startDate.getDay();
    if (startDayOfWeek !== 0) {
      startDate.setDate(startDate.getDate() - startDayOfWeek);
    }

    interface DayCell {
      date: Date;
      iso: string;
      dStr: string;
      done: boolean;
      isFuture: boolean;
      isToday: boolean;
    }

    const weeks: DayCell[][] = [];
    let currentWeek: DayCell[] = [];
    const curr = new Date(startDate);

    while (curr <= today || currentWeek.length > 0) {
      const iso = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
      const isFuture = curr > today;
      const isToday = curr.getTime() === today.getTime();
      const done = !isFuture && !!targetAction.history[iso];
      const dStr = curr.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

      currentWeek.push({
        date: new Date(curr),
        iso,
        dStr,
        done,
        isFuture,
        isToday,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      curr.setDate(curr.getDate() + 1);
      if (isFuture && currentWeek.length === 0) break;
    }

    // Month headers
    let prevMonth = -1;
    const monthLabels: { text: string; weekIdx: number }[] = [];
    weeks.forEach((wk, wIdx) => {
      const m = wk[0].date.getMonth();
      if (m !== prevMonth) {
        monthLabels.push({
          text: wk[0].date.toLocaleDateString(undefined, { month: 'short' }),
          weekIdx: wIdx,
        });
        prevMonth = m;
      }
    });

    return { weeks, monthLabels };
  }, [targetAction, heatmapRange]);

  // Quick check-ins direct toggle list (past 60-180 days)
  const quickCheckins = useMemo(() => {
    if (!targetAction) return [];
    const list: { iso: string; monthStr: string; dayNum: string; done: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const monthStr = d.toLocaleDateString(undefined, { month: 'short' });
      const dayNum = String(d.getDate());
      list.push({
        iso,
        monthStr,
        dayNum,
        done: !!targetAction.history[iso],
      });
    }

    return list;
  }, [targetAction]);

  if (!isOpen || !targetAction) return null;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div
      id="analytics-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
    >
      {/* Backdrop */}
      <div
        id="am-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/85 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Modal Container */}
      <div
        id="am-content"
        className="relative bg-white dark:bg-slate-800 p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-4xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[95vh] mx-3 sm:mx-4 z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8 border-b border-slate-100 dark:border-slate-700 pb-3 sm:pb-4 md:pb-6 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-5">
            <div
              id="am-icon-box"
              className={`p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl shadow-inner shrink-0 text-sm sm:text-base md:text-xl ${cMap.bgLt} ${cMap.text}`}
            >
              📊
            </div>
            <div>
              <h2
                id="am-title"
                className="text-base sm:text-xl md:text-3xl font-black leading-tight text-slate-800 dark:text-slate-100"
              >
                {targetAction.title || targetAction.name} Analytics
              </h2>
              <p className="text-[9px] sm:text-[10px] md:text-sm text-slate-500 font-bold mt-0.5 tracking-wide">
                Historical performance record.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 md:p-3 bg-slate-100 dark:bg-slate-700 rounded-lg sm:rounded-xl md:rounded-2xl hover:rotate-90 transition-transform active:scale-95 shrink-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 3 Metric Stat Boxes */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 md:gap-6 mb-4 sm:mb-6 md:mb-8 text-center shrink-0">
          <div
            id="am-stat-box-1"
            className={`p-2.5 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-3xl border shadow-sm flex flex-col justify-center ${cMap.bgLt} ${cMap.borderLt}`}
          >
            <span
              id="am-stat-label-1"
              className={`block text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 sm:mb-1 md:mb-1.5 leading-tight ${cMap.text}`}
            >
              Total Hits
            </span>
            <div
              id="am-total"
              className={`text-base sm:text-2xl md:text-5xl font-black drop-shadow-sm mt-0.5 sm:mt-1 ${cMap.text}`}
            >
              {stats.totalHits}
            </div>
          </div>

          <div
            id="am-stat-box-2"
            className={`p-2.5 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-3xl border shadow-sm flex flex-col justify-center ${cMap.bgLt} ${cMap.borderLt}`}
          >
            <span
              id="am-stat-label-2"
              className={`block text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 sm:mb-1 md:mb-1.5 leading-tight ${cMap.text}`}
            >
              Streak
            </span>
            <div
              id="am-streak"
              className={`text-base sm:text-2xl md:text-5xl font-black drop-shadow-sm mt-0.5 sm:mt-1 ${cMap.text}`}
            >
              {stats.streak} Days
            </div>
          </div>

          <div
            id="am-stat-box-3"
            className={`p-2.5 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-3xl border shadow-sm flex flex-col justify-center ${cMap.bgLt} ${cMap.borderLt}`}
          >
            <span
              id="am-stat-label-3"
              className={`block text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 sm:mb-1 md:mb-1.5 leading-tight ${cMap.text}`}
            >
              Consistency
            </span>
            <div
              id="am-percent"
              className={`text-base sm:text-2xl md:text-5xl font-black drop-shadow-sm mt-0.5 sm:mt-1 ${cMap.text}`}
            >
              {stats.consistency}%
            </div>
          </div>
        </div>

        {/* Scrollable Container with Heatmap Trend and Quick Check-ins Grid */}
        <div className="overflow-y-auto flex-1 flex flex-col gap-4 sm:gap-6 md:gap-8 custom-scrollbar pr-1 md:pr-2">
          {/* Heatmap Trend Chart (GitHub Style) */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-5 md:p-6 shadow-inner shrink-0 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div
                  id="am-heatmap-pulse-dot"
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: cMap.hex }}
                />
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                  Activity Heatmap Trend
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700 shadow-sm text-[9px] font-black">
                <button
                  type="button"
                  id="am-range-90"
                  onClick={() => setHeatmapRange(90)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all ${
                    heatmapRange === 90
                      ? `text-white shadow-sm font-black ${cMap.btn}`
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  90D
                </button>
                <button
                  type="button"
                  id="am-range-180"
                  onClick={() => setHeatmapRange(180)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all ${
                    heatmapRange === 180
                      ? `text-white shadow-sm font-black ${cMap.btn}`
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  180D
                </button>
                <button
                  type="button"
                  id="am-range-365"
                  onClick={() => setHeatmapRange(365)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all ${
                    heatmapRange === 365
                      ? `text-white shadow-sm font-black ${cMap.btn}`
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  1 Year
                </button>
              </div>
            </div>

            {/* Heatmap Scroll Container */}
            <div className="overflow-x-auto custom-scrollbar pb-2 pt-1">
              <div id="am-heatmap-grid" className="inline-flex flex-col min-w-max">
                {/* Month Labels Row */}
                <div className="flex items-center text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-1 pl-7 gap-1">
                  {heatmapData.weeks.map((_, wIdx) => {
                    const match = heatmapData.monthLabels.find((m) => m.weekIdx === wIdx);
                    return match ? (
                      <span
                        key={wIdx}
                        className="shrink-0 text-left text-[9px] font-black uppercase tracking-wider overflow-visible select-none"
                        style={{ width: '15px' }}
                      >
                        {match.text}
                      </span>
                    ) : (
                      <span key={wIdx} className="shrink-0" style={{ width: '15px' }} />
                    );
                  })}
                </div>

                {/* 7 Day Rows (Sun to Sat) */}
                {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                  const dayLabel = dayIdx === 1 || dayIdx === 3 || dayIdx === 5 ? dayNames[dayIdx] : '';
                  return (
                    <div key={dayIdx} className="flex items-center gap-1 my-[1.5px]">
                      <span className="w-6 text-[9px] font-bold text-slate-400 dark:text-slate-500 shrink-0 text-right pr-1 select-none leading-none">
                        {dayLabel}
                      </span>
                      <div className="flex items-center gap-1">
                        {heatmapData.weeks.map((week, wIdx) => {
                          const cell = week[dayIdx];
                          if (!cell) {
                            return (
                              <div
                                key={wIdx}
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-[15px] md:h-[15px] rounded-[3px] opacity-0 pointer-events-none shrink-0"
                              />
                            );
                          }
                          if (cell.isFuture) {
                            return (
                              <div
                                key={wIdx}
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-[15px] md:h-[15px] rounded-[3px] bg-slate-100/30 dark:bg-slate-800/20 border border-slate-200/20 dark:border-slate-800/20 opacity-25 shrink-0 pointer-events-none"
                              />
                            );
                          }

                          return (
                            <button
                              key={wIdx}
                              type="button"
                              onClick={() => toggleHabit(targetAction.id, cell.iso)}
                              title={`${cell.dStr}: ${cell.done ? 'Completed (YES)' : 'Missed (NO)'} - Click to toggle`}
                              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-[15px] md:h-[15px] cursor-pointer transition-all duration-150 hover:scale-125 hover:z-20 shrink-0 rounded-[3px] flex items-center justify-center ${
                                cell.isToday ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900' : ''
                              } ${
                                cell.done
                                  ? 'shadow-sm'
                                  : 'bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/50 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500'
                              }`}
                              style={
                                cell.done
                                  ? {
                                      backgroundColor: cMap.hex,
                                      border: `1px solid ${cMap.hex}`,
                                      boxShadow: `0 0 6px ${cMap.hex}55`,
                                    }
                                  : undefined
                              }
                            >
                              {cell.done ? (
                                <svg
                                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white pointer-events-none drop-shadow-sm"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600/70 pointer-events-none" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heatmap Footer Legend & Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500">
              <div id="am-heatmap-summary" className="flex items-center gap-2 flex-wrap">
                <span>
                  <strong className={cMap.text}>{stats.totalHits}</strong> / {stats.possibleDays} days completed ({stats.consistency}%)
                </span>
                <span className="opacity-40">•</span>
                <span>
                  Best Streak: <strong className={cMap.text}>{stats.longestStreak}d 🔥</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <span>Less</span>
                <div className="w-3 h-3 rounded-[3px] bg-slate-200 dark:bg-slate-800 border border-slate-300/50 dark:border-slate-700/50" />
                <div
                  id="am-legend-active"
                  className="w-3 h-3 rounded-[3px] shadow-sm"
                  style={{ backgroundColor: cMap.hex, boxShadow: `0 0 6px ${cMap.hex}66` }}
                />
                <span>More (Done)</span>
              </div>
            </div>
          </div>

          {/* Quick Check-ins Direct Toggle Grid */}
          <div className="shrink-0">
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase mb-2 sm:mb-3 md:mb-4 tracking-widest text-slate-400">
              Recent Check-ins (Direct Toggle)
            </h3>
            <div
              id="am-grid"
              className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-1.5 sm:gap-2 md:gap-3"
            >
              {quickCheckins.map((entry) => (
                <button
                  key={entry.iso}
                  type="button"
                  onClick={() => toggleHabit(targetAction.id, entry.iso)}
                  title={`${entry.iso}: ${entry.done ? 'YES' : 'NO'} - Click to toggle`}
                  className={`flex flex-col items-center justify-center p-1 sm:p-1.5 md:p-2 rounded-lg sm:rounded-xl transition-all duration-300 w-full aspect-square shrink-0 hover:scale-105 active:scale-90 focus:outline-none snap-start ${
                    entry.done
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[0_2px_8px_rgba(34,197,94,0.4)] border-transparent'
                      : 'bg-gradient-to-br from-red-400 to-red-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.4)] border-transparent'
                  }`}
                >
                  <span className="text-[6px] sm:text-[7px] md:text-[9px] uppercase font-black opacity-90 mb-0.5">
                    {entry.monthStr}
                  </span>
                  <span className="text-[9px] sm:text-[11px] md:text-sm font-black leading-none">
                    {entry.dayNum}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
