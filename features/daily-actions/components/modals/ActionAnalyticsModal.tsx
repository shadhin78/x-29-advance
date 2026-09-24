'use client';

/**
 * X-29 Action Analytics & Habit Radar Modal (features/daily-actions/components/modals/ActionAnalyticsModal.tsx)
 * 
 * 100% Parity with legacy #analytics-modal:
 * - Stat boxes: Total Hits, Current Streak, Consistency (%)
 * - Heatmap Trend Grid (90D, 180D, 365D selectable range) with clickable toggle check-ins
 * - Habit Radar Chart (Polar SVG comparison across all active habits)
 */

import React, { useState, useMemo } from 'react';
import { useDailyActionStore } from '@/stores/useDailyActionStore';
import { calculateHabitRadar } from '@/features/analytics/services/analyticsService';
import { BarChart2, X, Flame, CheckCircle, Percent, Compass } from 'lucide-react';

interface ActionAnalyticsModalProps {
  isOpen: boolean;
  actionId: string | null;
  onClose: () => void;
}

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

  // Compute stats: total hits, current streak, consistency %
  const stats = useMemo(() => {
    if (!targetAction) return { totalHits: 0, streak: 0, consistency: 0, daysCount: 180 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let total = 0;
    let currentStreak = 0;
    let streakBroken = false;

    for (let i = 0; i < heatmapRange; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isDone = !!targetAction.history[iso];

      if (isDone) {
        total++;
        if (!streakBroken) currentStreak++;
      } else {
        if (i > 0) streakBroken = true;
      }
    }

    const consistency = Math.round((total / heatmapRange) * 100);

    return {
      totalHits: total,
      streak: currentStreak,
      consistency,
      daysCount: heatmapRange,
    };
  }, [targetAction, heatmapRange]);

  // Days list for heatmap grid
  const daysGrid = useMemo(() => {
    if (!targetAction) return [];
    const list: { iso: string; dayNum: string; dayName: string; isDone: boolean }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = heatmapRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      list.push({
        iso,
        dayNum: String(d.getDate()),
        dayName: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        isDone: !!targetAction.history[iso],
      });
    }

    return list;
  }, [targetAction, heatmapRange]);

  // Habit Radar Polar Calculation for active month
  const radarData = useMemo(() => {
    return calculateHabitRadar(habits, new Date());
  }, [habits]);

  if (!isOpen || !targetAction) return null;

  return (
    <div
      id="analytics-modal"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
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
        className="relative bg-white dark:bg-slate-800 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-4xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[92vh] z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-slate-100 dark:border-slate-700 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div
              id="am-icon-box"
              className="p-2.5 sm:p-3.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl sm:rounded-2xl"
            >
              <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 id="am-title" className="text-base sm:text-xl md:text-2xl font-black leading-tight text-slate-800 dark:text-slate-100">
                {targetAction.title || targetAction.name} Analytics
              </h2>
              <p className="text-[9px] sm:text-xs text-slate-500 font-bold mt-0.5 tracking-wide">
                Historical performance record and habit radar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl hover:rotate-90 transition-transform active:scale-95 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 text-center shrink-0">
          <div
            id="am-stat-box-1"
            className="p-3 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex flex-col justify-center"
          >
            <span
              id="am-stat-label-1"
              className="block text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1"
            >
              Total Hits
            </span>
            <div id="am-total" className="text-xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {stats.totalHits}
            </div>
          </div>

          <div
            id="am-stat-box-2"
            className="p-3 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 flex flex-col justify-center"
          >
            <span
              id="am-stat-label-2"
              className="block text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1"
            >
              Streak
            </span>
            <div id="am-streak" className="text-xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {stats.streak} Days
            </div>
          </div>

          <div
            id="am-stat-box-3"
            className="p-3 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-center"
          >
            <span
              id="am-stat-label-3"
              className="block text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1"
            >
              Consistency
            </span>
            <div id="am-percent" className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.consistency}%
            </div>
          </div>
        </div>

        {/* Scrollable Container with Heatmap & Habit Radar */}
        <div className="overflow-y-auto flex-1 flex flex-col gap-4 sm:gap-6 custom-scrollbar pr-1">
          {/* Heatmap Trend Chart */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-inner flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div id="am-heatmap-pulse-dot" className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                  Activity Heatmap Trend
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700 shadow-sm text-[9px] font-black">
                <button
                  type="button"
                  onClick={() => setHeatmapRange(90)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    heatmapRange === 90 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  90D
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapRange(180)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    heatmapRange === 180 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  180D
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapRange(365)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    heatmapRange === 365 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  1 Year
                </button>
              </div>
            </div>

            {/* Squares Grid */}
            <div className="overflow-x-auto custom-scrollbar pb-2 pt-1">
              <div
                id="am-heatmap-grid"
                className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-max p-1"
              >
                {daysGrid.map((day) => (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => toggleHabit(targetAction.id, day.iso)}
                    title={`${day.iso} (${day.dayName}): ${day.isDone ? 'DONE' : 'MISSED'} - Click to toggle`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] border transition-all active:scale-90 hover:scale-110 cursor-pointer ${
                      day.isDone
                        ? 'bg-emerald-500 border-emerald-400 shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Heatmap Footer Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500">
              <div id="am-heatmap-summary">
                <span>Tip: Click any square to toggle check-in</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <span>Less</span>
                <div className="w-3 h-3 rounded-[3px] bg-slate-200 dark:bg-slate-800 border border-slate-300/50 dark:border-slate-700/50" />
                <div id="am-legend-active" className="w-3 h-3 rounded-[3px] bg-emerald-500 shadow-sm" />
                <span>Done</span>
              </div>
            </div>
          </div>

          {/* Habit Radar Section */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-inner space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                  Monthly Habit Radar ({radarData.monthName} {radarData.year})
                </h3>
              </div>
              <span className="text-[10px] font-black font-mono text-purple-400">
                {radarData.pct}% Adherence
              </span>
            </div>

            {/* Habit Comparison Radar Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {habits.map((h) => {
                let fulfilled = 0;
                for (let d = 1; d <= radarData.daysInMonth; d++) {
                  const mStr = String(radarData.year) + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
                  if (h.history[mStr]) fulfilled++;
                }
                const habitPct = Math.round((fulfilled / radarData.daysInMonth) * 100);

                return (
                  <div
                    key={h.id}
                    className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="truncate">{h.title || h.name}</span>
                      <span className="font-mono text-indigo-500 shrink-0">{habitPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${habitPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold block">
                      {fulfilled} of {radarData.daysInMonth} Days Active
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
